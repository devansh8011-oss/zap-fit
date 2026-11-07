import crypto from 'node:crypto';
import {
  rtdb,
  createSessionToken,
  setSessionCookie,
  clearSessionCookie,
  getAuthenticatedUser,
  checkRateLimit,
} from './_security.js';

const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY || '';

function emailToKey(email) {
  return crypto.createHash('sha256').update(email.trim().toLowerCase()).digest('hex').slice(0, 28);
}

function hashPassword(password, salt) {
  const s = salt || crypto.randomBytes(16).toString('hex');
  const dk = crypto.pbkdf2Sync(password, s, 120000, 32, 'sha256').toString('hex');
  return { salt: s, hash: dk };
}

function verifyPasswordHash(password, salt, storedHash) {
  const { hash } = hashPassword(password, salt);
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(String(storedHash || ''), 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export default async function handler(req, res) {
  // GET /api/auth -> Verify active session
  if (req.method === 'GET') {
    const user = getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });
    return res.status(200).json({ user });
  }

  // DELETE /api/auth -> Sign out and clear session cookie
  if (req.method === 'DELETE') {
    clearSessionCookie(res);
    return res.status(200).json({ ok: true });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limit auth attempts (max 15 attempts per minute per IP)
  const rl = checkRateLimit(req, 'auth', 15, 60_000);
  if (!rl.allowed) {
    res.setHeader('Retry-After', String(rl.retryAfterSec));
    return res.status(429).json({ error: 'Too many sign-in attempts. Please wait a minute and try again.' });
  }

  const { mode = 'signin', email: rawEmail = '', password = '', idToken = '' } = req.body || {};

  if (mode === 'signout') {
    clearSessionCookie(res);
    return res.status(200).json({ ok: true });
  }

  // Google OAuth ID Token verification on server
  if (mode === 'google') {
    if (!idToken || typeof idToken !== 'string') {
      return res.status(400).json({ error: 'Missing Google ID token.' });
    }
    if (!FIREBASE_API_KEY) {
      return res.status(500).json({ error: 'Firebase Auth is not configured on the server.' });
    }
    try {
      const fbRes = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(FIREBASE_API_KEY)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        }
      );
      const fbData = await fbRes.json();
      const account = fbData?.users?.[0];
      if (!fbRes.ok || !account || !account.localId) {
        return res.status(401).json({ error: 'Invalid or expired Google sign-in token.' });
      }
      const userObj = {
        uid: account.localId,
        name: account.displayName || (account.email ? account.email.split('@')[0] : 'Athlete'),
        email: account.email || '',
        photo: account.photoUrl || '',
      };
      const sessionToken = createSessionToken(userObj);
      setSessionCookie(res, sessionToken);
      return res.status(200).json({ user: userObj, sessionToken });
    } catch (e) {
      return res.status(500).json({ error: 'Failed to verify Google sign-in token.' });
    }
  }

  // Email / Password Authentication
  const email = String(rawEmail).trim().toLowerCase();
  if (!email || !email.includes('@') || email.length > 120) {
    return res.status(400).json({ error: 'That email address doesn’t look right.' });
  }
  if (String(password).length < 6 || String(password).length > 128) {
    return res.status(400).json({ error: 'Use at least 6 characters for your password.' });
  }

  if (FIREBASE_API_KEY) {
    const endpoint = mode === 'signup' ? 'signUp' : 'signInWithPassword';
    try {
      const fbRes = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:${endpoint}?key=${encodeURIComponent(FIREBASE_API_KEY)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, returnSecureToken: true }),
        }
      );
      const fbData = await fbRes.json();
      if (fbRes.ok && fbData.localId) {
        const userObj = {
          uid: fbData.localId,
          name: fbData.displayName || email.split('@')[0],
          email,
        };
        const sessionToken = createSessionToken(userObj);
        setSessionCookie(res, sessionToken);
        return res.status(200).json({ user: userObj, sessionToken });
      }
      const msg = fbData?.error?.message || '';
      if (msg === 'EMAIL_EXISTS') {
        return res.status(400).json({ error: 'An account already exists with this email. Switch to “Sign in”.' });
      }
    } catch {}
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
        uid,
        email,
        name,
        salt,
        passwordHash: hash,
        hashAlgorithm: 'PBKDF2-HMAC-SHA256-120k',
      });
      const userObj = { uid, name, email };
      const sessionToken = createSessionToken(userObj);
      setSessionCookie(res, sessionToken);
      return res.status(200).json({ user: userObj, sessionToken });
    } else {
      if (!existing || !existing.passwordHash) {
        return res.status(400).json({ error: 'Invalid email or password. Or switch to “Create account”.' });
      }
      if (!verifyPasswordHash(password, existing.salt, existing.passwordHash)) {
        return res.status(400).json({ error: 'Incorrect password.' });
      }
      const userObj = {
        uid: existing.uid || ('usr_' + ekey.slice(0, 20)),
        name: existing.name || email.split('@')[0],
        email,
      };
      const sessionToken = createSessionToken(userObj);
      setSessionCookie(res, sessionToken);
      return res.status(200).json({ user: userObj, sessionToken });
    }
  } catch (e) {
    return res.status(500).json({ error: 'Authentication service unavailable.' });
  }
}
