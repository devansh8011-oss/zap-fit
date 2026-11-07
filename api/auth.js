import crypto from 'node:crypto';

const FIREBASE_API_KEY = process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || '';
const FIREBASE_DB_URL = (process.env.VITE_FIREBASE_DATABASE_URL || process.env.FIREBASE_DATABASE_URL || '').replace(/\/+$/, '');

function emailToKey(email) {
  return crypto.createHash('sha256').update(email.trim().toLowerCase()).digest('hex').slice(0, 28);
}

function hashPassword(password, salt) {
  const s = salt || crypto.randomBytes(16).toString('hex');
  const dk = crypto.pbkdf2Sync(password, s, 120000, 32, 'sha256').toString('hex');
  return { salt: s, hash: dk };
}

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
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { mode = 'signin', email: rawEmail = '', password = '' } = req.body || {};
  const email = String(rawEmail).trim().toLowerCase();
  if (!email || !email.includes('@')) return res.status(400).json({ error: 'That email address doesn’t look right.' });
  if (String(password).length < 6) return res.status(400).json({ error: 'Use at least 6 characters for your password.' });

  if (FIREBASE_API_KEY) {
    const endpoint = mode === 'signup' ? 'signUp' : 'signInWithPassword';
    try {
      const fbRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:${endpoint}?key=${FIREBASE_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      });
      const fbData = await fbRes.json();
      if (fbRes.ok && fbData.localId) {
        return res.status(200).json({
          user: { uid: fbData.localId, name: fbData.displayName || email.split('@')[0], email },
        });
      }
      const msg = fbData?.error?.message || '';
      if (msg === 'EMAIL_EXISTS') {
        return res.status(400).json({ error: 'An account already exists with this email. Switch to “Sign in”.' });
      }
    } catch (e) {}
  }

  try {
    const ekey = emailToKey(email);
    const existing = await rtdb(`auth_accounts/${ekey}`, 'GET');
    if (mode === 'signup') {
      if (existing && existing.passwordHash) {
        return res.status(400).json({ error: 'An account already exists with this email. Switch to “Sign in”.' });
      }
      const { salt, hash } = hashPassword(password);
      const uid = 'usr_' + ekey.slice(0, 20);
      const name = email.split('@')[0];
      await rtdb(`auth_accounts/${ekey}`, 'PUT', {
        uid, email, name, salt, passwordHash: hash, hashAlgorithm: 'PBKDF2-HMAC-SHA256-120k',
      });
      return res.status(200).json({ user: { uid, name, email } });
    } else {
      if (!existing || !existing.passwordHash) {
        return res.status(400).json({ error: 'Invalid email or password. Or switch to “Create account”.' });
      }
      const { hash } = hashPassword(password, existing.salt);
      if (hash !== existing.passwordHash) {
        return res.status(400).json({ error: 'Incorrect password.' });
      }
      return res.status(200).json({
        user: { uid: existing.uid || ('usr_' + ekey.slice(0, 20)), name: existing.name || email.split('@')[0], email },
      });
    }
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
