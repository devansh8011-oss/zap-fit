const FIREBASE_DB_URL = (process.env.VITE_FIREBASE_DATABASE_URL || process.env.FIREBASE_DATABASE_URL || '').replace(/\/+$/, '');

async function rtdb(path, method = 'GET', body = undefined) {
  if (!FIREBASE_DB_URL) throw new Error('FIREBASE_DATABASE_URL not configured');
  const res = await fetch(`${FIREBASE_DB_URL}/${path.replace(/^\/+|\/+$/g, '')}.json`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const uid = String(req.query?.uid || '').trim();
      if (!uid) return res.status(400).json({ error: 'Missing uid' });
      const data = await rtdb(`athletes/${uid}`, 'GET');
      return res.status(200).json({ data });
    }
    if (req.method === 'PUT') {
      const { uid, payload, history } = req.body || {};
      if (!uid || !payload) return res.status(400).json({ error: 'Invalid athlete payload' });
      await rtdb(`athletes/${uid}`, 'PUT', payload);
      if (history) await rtdb(`user_history/${uid}`, 'PUT', history);
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
