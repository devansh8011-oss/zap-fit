const GROQ_API_KEY = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY || '';
const GROQ_MODEL = process.env.VITE_GROQ_MODEL || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!GROQ_API_KEY) return res.status(500).json({ error: 'AI key not configured on server' });
  const { messages = [], max_tokens = 500 } = req.body || {};
  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({ model: GROQ_MODEL, messages, temperature: 0.3, max_tokens }),
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data?.error?.message || 'AI HTTP error' });
    const text = data?.choices?.[0]?.message?.content || '';
    return res.status(200).json({ text });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
