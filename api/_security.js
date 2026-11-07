import crypto from 'node:crypto';

const FIREBASE_DB_URL = (process.env.FIREBASE_DATABASE_URL || process.env.VITE_FIREBASE_DATABASE_URL || '').replace(/\/+$/, '');
const FIREBASE_DB_SECRET = process.env.FIREBASE_DATABASE_SECRET || '';
const FIREBASE_SERVICE_ACCOUNT = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '';
const SESSION_SECRET = process.env.SESSION_SECRET || process.env.GROQ_API_KEY || process.env.FIREBASE_API_KEY || 'zapfit-fallback-dev-secret-change-in-prod';

const SESSION_COOKIE_NAME = 'zapfit_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ------------------------------------------------------------------
// 1. Cryptographic Session Tokens & HttpOnly Cookies (HMAC-SHA256)
// ------------------------------------------------------------------
export function createSessionToken(user) {
  const payload = {
    uid: String(user.uid || ''),
    name: String(user.name || 'Athlete').slice(0, 80),
    email: String(user.email || '').slice(0, 120),
    iat: Date.now(),
    exp: Date.now() + SESSION_TTL_MS,
  };
  const data = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

export function verifySessionToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [data, sig] = token.split('.', 2);
  if (!data || !sig) return null;
  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (!payload || !payload.uid || (payload.exp && Date.now() > payload.exp)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function parseCookies(cookieHeader) {
  const out = {};
  if (!cookieHeader) return out;
  String(cookieHeader).split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx > 0) {
      const k = pair.slice(0, idx).trim();
      const v = pair.slice(idx + 1).trim();
      out[k] = decodeURIComponent(v);
    }
  });
  return out;
}

export function getAuthenticatedUser(req) {
  // Check Authorization: Bearer <token> header first
  const authHeader = req.headers?.authorization || req.headers?.Authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    const verified = verifySessionToken(token);
    if (verified) return verified;
  }
  // Check HttpOnly session cookie
  const cookies = parseCookies(req.headers?.cookie);
  if (cookies[SESSION_COOKIE_NAME]) {
    const verified = verifySessionToken(cookies[SESSION_COOKIE_NAME]);
    if (verified) return verified;
  }
  return null;
}

export function setSessionCookie(res, token) {
  const isProd = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
  const maxAge = Math.floor(SESSION_TTL_MS / 1000);
  const cookieParts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
  ];
  if (isProd) cookieParts.push('Secure');
  res.setHeader('Set-Cookie', cookieParts.join('; '));
}

export function clearSessionCookie(res) {
  const isProd = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
  const cookieParts = [
    `${SESSION_COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
  ];
  if (isProd) cookieParts.push('Secure');
  res.setHeader('Set-Cookie', cookieParts.join('; '));
}

// ------------------------------------------------------------------
// 2. Per-IP / Per-User Sliding Window Rate Limiter
// ------------------------------------------------------------------
const rateBuckets = new Map();

export function getClientIp(req) {
  const xff = req.headers?.['x-forwarded-for'];
  if (xff) return String(xff).split(',')[0].trim();
  return req.headers?.['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
}

export function checkRateLimit(req, bucketName, maxRequests = 20, windowMs = 60_000) {
  const now = Date.now();
  const key = `${bucketName}:${getClientIp(req)}`;
  let entry = rateBuckets.get(key);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs };
    rateBuckets.set(key, entry);
  }
  entry.count += 1;

  // Periodic cleanup to avoid unbounded map growth
  if (rateBuckets.size > 2000) {
    for (const [k, v] of rateBuckets.entries()) {
      if (now > v.resetAt) rateBuckets.delete(k);
    }
  }

  return {
    allowed: entry.count <= maxRequests,
    remaining: Math.max(0, maxRequests - entry.count),
    retryAfterSec: Math.ceil((entry.resetAt - now) / 1000),
  };
}

// ------------------------------------------------------------------
// 3. Authenticated Firebase RTDB Client (Service Account OAuth2 / Secret)
// ------------------------------------------------------------------
let cachedAdminToken = null;
let cachedAdminTokenExp = 0;

async function getServiceAccountAccessToken() {
  if (!FIREBASE_SERVICE_ACCOUNT) return null;
  if (cachedAdminToken && Date.now() < cachedAdminTokenExp - 60_000) {
    return cachedAdminToken;
  }
  try {
    const sa = typeof FIREBASE_SERVICE_ACCOUNT === 'string'
      ? JSON.parse(FIREBASE_SERVICE_ACCOUNT)
      : FIREBASE_SERVICE_ACCOUNT;
    if (!sa.client_email || !sa.private_key) return null;

    const nowSec = Math.floor(Date.now() / 1000);
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    const claim = Buffer.from(JSON.stringify({
      iss: sa.client_email,
      sub: sa.client_email,
      aud: 'https://oauth2.googleapis.com/token',
      iat: nowSec,
      exp: nowSec + 3600,
      scope: 'https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email',
    })).toString('base64url');

    const signInput = `${header}.${claim}`;
    const signer = crypto.createSign('RSA-SHA256');
    signer.update(signInput);
    const signature = signer.sign(sa.private_key, 'base64url');
    const assertion = `${signInput}.${signature}`;

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion,
      }).toString(),
    });
    if (!tokenRes.ok) return null;
    const tokenData = await tokenRes.json();
    if (tokenData.access_token) {
      cachedAdminToken = tokenData.access_token;
      cachedAdminTokenExp = Date.now() + (Number(tokenData.expires_in || 3600) * 1000);
      return cachedAdminToken;
    }
  } catch (e) {
    console.warn('[RTDB Auth] Service account token exchange error:', e.message);
  }
  return null;
}

export async function rtdb(path, method = 'GET', body = undefined) {
  if (!FIREBASE_DB_URL) throw new Error('FIREBASE_DATABASE_URL not configured');
  const cleanPath = String(path || '').replace(/^\/+|\/+$/g, '');
  if (!cleanPath || cleanPath.includes('..')) throw new Error('Invalid database path');

  let url = `${FIREBASE_DB_URL}/${cleanPath}.json`;
  const headers = { 'Content-Type': 'application/json' };

  const accessToken = await getServiceAccountAccessToken();
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  } else if (FIREBASE_DB_SECRET) {
    url += `?auth=${encodeURIComponent(FIREBASE_DB_SECRET)}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`RTDB ${method} failed (${res.status}): ${errText.slice(0, 120)}`);
  }
  return res.json();
}
