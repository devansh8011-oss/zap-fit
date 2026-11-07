import { rtdb, getAuthenticatedUser, checkRateLimit } from './_security.js';

export default async function handler(req, res) {
  // 1. Verify authenticated session (never trust raw client-supplied uid alone)
  const sessionUser = getAuthenticatedUser(req);
  if (!sessionUser || !sessionUser.uid) {
    return res.status(401).json({ error: 'Unauthorized: Valid session required.' });
  }

  // Rate limit per IP (60 requests/min)
  const rl = checkRateLimit(req, `athlete:${sessionUser.uid}`, 60, 60_000);
  if (!rl.allowed) {
    res.setHeader('Retry-After', String(rl.retryAfterSec));
    return res.status(429).json({ error: 'Rate limit exceeded. Please slow down.' });
  }

  // Enforce strict ownership: the caller can ONLY read/write their own authenticated UID
  const authUid = sessionUser.uid;

  try {
    if (req.method === 'GET') {
      const requestedUid = String(req.query?.uid || authUid).trim();
      if (requestedUid !== authUid) {
        return res.status(403).json({ error: 'Forbidden: Cannot access another athlete’s data.' });
      }
      const data = await rtdb(`athletes/${authUid}`, 'GET');
      return res.status(200).json({ data });
    }

    if (req.method === 'PUT') {
      const { uid: bodyUid, payload, history } = req.body || {};
      if (!payload || typeof payload !== 'object') {
        return res.status(400).json({ error: 'Invalid athlete payload' });
      }
      if (bodyUid && String(bodyUid).trim() !== authUid) {
        return res.status(403).json({ error: 'Forbidden: Cannot overwrite another athlete’s data.' });
      }

      // Sanitize and enforce uid inside stored payload
      const safePayload = {
        ...payload,
        uid: authUid,
        meals: Array.isArray(payload.meals) ? payload.meals.slice(0, 500) : [],
        workouts: Array.isArray(payload.workouts) ? payload.workouts.slice(0, 500) : [],
        didiOrders: Array.isArray(payload.didiOrders) ? payload.didiOrders.slice(0, 200) : [],
        updatedAt: Date.now(),
        updatedAtISO: new Date().toISOString(),
      };

      await rtdb(`athletes/${authUid}`, 'PUT', safePayload);
      if (history && typeof history === 'object') {
        await rtdb(`user_history/${authUid}`, 'PUT', history);
      }
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to sync athlete profile.' });
  }
}
