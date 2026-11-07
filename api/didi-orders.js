import { rtdb, getAuthenticatedUser, checkRateLimit } from './_security.js';

const VALID_STATUSES = new Set(['pending', 'en_route', 'reached', 'cooking', 'preparing', 'ready', 'completed']);
const SAFE_ID_RE = /^DIDI_[0-9]+_[A-Z0-9]{2,12}$/;

function isDidiPartnerRequest(req) {
  return req.headers?.['x-zapfit-client'] === 'didi-partner';
}

export default async function handler(req, res) {
  // Rate limit order operations (60 req/min per IP)
  const rl = checkRateLimit(req, 'didi-orders', 60, 60_000);
  if (!rl.allowed) {
    res.setHeader('Retry-After', String(rl.retryAfterSec));
    return res.status(429).json({ error: 'Too many requests. Please slow down.' });
  }

  const sessionUser = getAuthenticatedUser(req);
  const isDidiClient = isDidiPartnerRequest(req);

  // Require either a valid athlete session or the Chef Didi partner app context
  if (!sessionUser && !isDidiClient) {
    return res.status(401).json({ error: 'Unauthorized: Please sign in to manage orders.' });
  }

  try {
    if (req.method === 'GET') {
      const allOrders = (await rtdb('chef_didi_orders', 'GET')) || {};
      // If called by the Chef Didi partner console (/didi), return active orders for fulfillment
      if (isDidiClient) {
        return res.status(200).json({ orders: allOrders });
      }
      // If called by a signed-in athlete on the main dashboard, filter to only their own orders
      const filtered = {};
      for (const [id, ord] of Object.entries(allOrders)) {
        if (ord && (!ord.athlete?.uid || ord.athlete.uid === sessionUser.uid)) {
          filtered[id] = ord;
        }
      }
      return res.status(200).json({ orders: filtered });
    }

    if (req.method === 'POST') {
      if (!sessionUser) {
        return res.status(401).json({ error: 'Please sign in to book Chef Didi.' });
      }
      const rawOrder = req.body?.order ? req.body.order : req.body;
      const orderId = String(rawOrder?.id || '').trim();
      if (!rawOrder || !SAFE_ID_RE.test(orderId) || !rawOrder.mealName) {
        return res.status(400).json({ error: 'Invalid order payload' });
      }

      // Bind the order strictly to the authenticated athlete's uid
      const safeOrder = {
        ...rawOrder,
        id: orderId,
        status: VALID_STATUSES.has(rawOrder.status) ? rawOrder.status : 'pending',
        athlete: {
          ...(rawOrder.athlete || {}),
          uid: sessionUser.uid,
        },
      };

      await rtdb(`chef_didi_orders/${orderId}`, 'PUT', safeOrder);
      return res.status(200).json({ ok: true, order: safeOrder });
    }

    if (req.method === 'PATCH') {
      const orderId = String(req.body?.id || '').trim();
      if (!SAFE_ID_RE.test(orderId)) {
        return res.status(400).json({ error: 'Invalid order id' });
      }

      const existing = await rtdb(`chef_didi_orders/${orderId}`, 'GET');
      if (!existing) {
        return res.status(404).json({ error: 'Order not found' });
      }

      // Verify ownership unless updated from the Chef Didi kitchen interface
      if (!isDidiClient && existing.athlete?.uid && existing.athlete.uid !== sessionUser?.uid) {
        return res.status(403).json({ error: 'Forbidden: Cannot modify another athlete’s order.' });
      }

      const rawUpdates = req.body?.updates && typeof req.body.updates === 'object'
        ? req.body.updates
        : req.body || {};

      // Whitelist only safe mutable status/step fields
      const allowedUpdates = {};
      if (rawUpdates.status && VALID_STATUSES.has(rawUpdates.status)) {
        // Server-side guard: cannot mark 'completed' unless all recipe steps are checked
        if (rawUpdates.status === 'completed') {
          const steps = Array.isArray(existing.steps) && existing.steps.length ? existing.steps : [1, 2, 3];
          const stepsMap = rawUpdates.completedSteps || existing.completedSteps || {};
          const allDone = steps.every((_, idx) => Boolean(stepsMap[idx]));
          if (!allDone) {
            return res.status(400).json({ error: 'All cooking steps must be completed by Chef Didi before approval.' });
          }
        }
        allowedUpdates.status = rawUpdates.status;
      }
      if (rawUpdates.completedSteps && typeof rawUpdates.completedSteps === 'object') {
        allowedUpdates.completedSteps = rawUpdates.completedSteps;
      }
      allowedUpdates.updatedAt = Date.now();
      allowedUpdates.updatedAtISO = new Date().toISOString();

      await rtdb(`chef_didi_orders/${orderId}`, 'PATCH', allowedUpdates);
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'DELETE') {
      const clearAll = req.query?.all === '1' || req.query?.clear === 'all';
      if (clearAll) {
        if (!isDidiClient) {
          return res.status(403).json({ error: 'Forbidden: Bulk clear is restricted to the Chef Didi partner console.' });
        }
        await rtdb('chef_didi_orders', 'DELETE');
        return res.status(200).json({ ok: true, clearedAll: true });
      }

      const orderId = String(req.query?.id || '').trim();
      if (!SAFE_ID_RE.test(orderId)) {
        return res.status(400).json({ error: 'Invalid order id' });
      }

      const existing = await rtdb(`chef_didi_orders/${orderId}`, 'GET');
      if (existing && !isDidiClient && existing.athlete?.uid && existing.athlete.uid !== sessionUser?.uid) {
        return res.status(403).json({ error: 'Forbidden: Cannot delete another athlete’s order.' });
      }

      await rtdb(`chef_didi_orders/${orderId}`, 'DELETE');
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: 'Order service error.' });
  }
}
