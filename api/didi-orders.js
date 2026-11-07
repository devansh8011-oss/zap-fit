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
      const orders = await rtdb('chef_didi_orders', 'GET');
      return res.status(200).json({ orders: orders || {} });
    }
    if (req.method === 'POST') {
      const order = (req.body && req.body.order) ? req.body.order : req.body;
      if (!order || !order.id) return res.status(400).json({ error: 'Invalid order payload' });
      await rtdb(`chef_didi_orders/${order.id}`, 'PUT', order);
      return res.status(200).json({ ok: true, order });
    }
    if (req.method === 'PATCH') {
      const id = req.body?.id;
      let updates = req.body?.updates;
      if (!updates || typeof updates !== 'object') {
        const { id: _, ...rest } = req.body || {};
        updates = rest;
      }
      if (!id) return res.status(400).json({ error: 'Missing order id' });
      await rtdb(`chef_didi_orders/${id}`, 'PATCH', updates || {});
      return res.status(200).json({ ok: true });
    }
    if (req.method === 'DELETE') {
      const clearAll = req.query?.all === '1' || req.query?.clear === 'all';
      if (clearAll) {
        await rtdb('chef_didi_orders', 'DELETE');
        return res.status(200).json({ ok: true, clearedAll: true });
      }
      const id = String(req.query?.id || '').trim();
      if (!id) return res.status(400).json({ error: 'Missing order id' });
      await rtdb(`chef_didi_orders/${id}`, 'DELETE');
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
