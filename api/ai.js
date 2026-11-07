import { getAuthenticatedUser, checkRateLimit } from './_security.js';

const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY || '';
const GROQ_MODEL = process.env.GROQ_MODEL || process.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile';

const MAX_ALLOWED_TOKENS = 600;
const MAX_MESSAGES_COUNT = 10;
const MAX_MESSAGE_CHARS = 12_000;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1. Require an authenticated ZAP FIT session so unauthenticated bots cannot abuse Groq quota
  const sessionUser = getAuthenticatedUser(req);
  if (!sessionUser || !sessionUser.uid) {
    return res.status(401).json({ error: 'Unauthorized: Please sign in to use ZAP FIT AI.' });
  }

  // 2. Enforce strict rate limiting (max 12 AI calls per minute per user/IP)
  const rl = checkRateLimit(req, `ai:${sessionUser.uid}`, 12, 60_000);
  if (!rl.allowed) {
    res.setHeader('Retry-After', String(rl.retryAfterSec));
    return res.status(429).json({ error: 'AI rate limit reached. Please wait a moment before asking again.' });
  }

  if (!GROQ_API_KEY) {
    return res.status(500).json({ error: 'AI key not configured on server' });
  }

  // 3. Validate and clamp messages & max_tokens
  const rawMessages = Array.isArray(req.body?.messages) ? req.body.messages : [];
  if (!rawMessages.length || rawMessages.length > MAX_MESSAGES_COUNT) {
    return res.status(400).json({ error: 'Invalid messages payload' });
  }

  const sanitizedMessages = [];
  for (const m of rawMessages) {
    const role = ['system', 'user', 'assistant'].includes(m?.role) ? m.role : 'user';
    const content = String(m?.content || '').trim();
    if (!content) continue;
    if (content.length > MAX_MESSAGE_CHARS) {
      return res.status(400).json({ error: 'Message content exceeds maximum allowed length' });
    }
    sanitizedMessages.push({ role, content });
  }

  // Ensure the request is scoped to ZAP FIT nutrition/recovery context
  const systemMsg = sanitizedMessages.find((m) => m.role === 'system');
  if (!systemMsg || !systemMsg.content.includes('ZAP FIT AI')) {
    sanitizedMessages.unshift({
      role: 'system',
      content: 'You are ZAP FIT AI, a sports nutrition and post-workout recovery coach. Only answer questions related to athlete nutrition, recovery, workouts, and meals.',
    });
  }

  const requestedTokens = Number(req.body?.max_tokens) || 450;
  const maxTokens = Math.min(Math.max(50, Math.round(requestedTokens)), MAX_ALLOWED_TOKENS);

  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: sanitizedMessages,
        temperature: 0.3,
        max_tokens: maxTokens,
      }),
    });
    const data = await r.json();
    if (!r.ok) {
      return res.status(r.status).json({ error: data?.error?.message || 'AI service error' });
    }
    const text = data?.choices?.[0]?.message?.content || '';
    return res.status(200).json({ text });
  } catch (e) {
    return res.status(500).json({ error: 'AI service temporarily unavailable.' });
  }
}
