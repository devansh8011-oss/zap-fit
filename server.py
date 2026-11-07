import base64
import hashlib
import hmac
import http.server
import json
import os
import re
import secrets
import socketserver
import time
import urllib.error
import urllib.parse
import urllib.request

PORT = int(os.environ.get('PORT', 8000))
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))


def load_dotenv(filepath):
    if not os.path.exists(filepath):
        return
    with open(filepath, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            k, v = line.split('=', 1)
            k = k.strip()
            v = v.strip().strip('"').strip("'")
            if k and k not in os.environ:
                os.environ[k] = v


load_dotenv(os.path.join(ROOT_DIR, '.env'))

FIREBASE_API_KEY = os.environ.get('FIREBASE_API_KEY') or os.environ.get('VITE_FIREBASE_API_KEY', '')
FIREBASE_AUTH_DOMAIN = os.environ.get('FIREBASE_AUTH_DOMAIN') or os.environ.get('VITE_FIREBASE_AUTH_DOMAIN', '')
FIREBASE_PROJECT_ID = os.environ.get('FIREBASE_PROJECT_ID') or os.environ.get('VITE_FIREBASE_PROJECT_ID', '')
FIREBASE_APP_ID = os.environ.get('FIREBASE_APP_ID') or os.environ.get('VITE_FIREBASE_APP_ID', '')
FIREBASE_DB_URL = (os.environ.get('FIREBASE_DATABASE_URL') or os.environ.get('VITE_FIREBASE_DATABASE_URL', '')).rstrip('/')
FIREBASE_DB_SECRET = os.environ.get('FIREBASE_DATABASE_SECRET', '')
GROQ_API_KEY = os.environ.get('GROQ_API_KEY') or os.environ.get('VITE_GROQ_API_KEY', '')
GROQ_MODEL = os.environ.get('GROQ_MODEL') or os.environ.get('VITE_GROQ_MODEL', 'llama-3.3-70b-versatile')
SESSION_SECRET = (
    os.environ.get('SESSION_SECRET')
    or GROQ_API_KEY
    or FIREBASE_API_KEY
    or 'zapfit-fallback-dev-secret-change-in-prod'
)

SESSION_COOKIE_NAME = 'zapfit_session'
SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000
VALID_STATUSES = {'pending', 'en_route', 'reached', 'cooking', 'preparing', 'ready', 'completed'}
SAFE_ID_RE = re.compile(r'^DIDI_[0-9]+_[A-Z0-9]{2,12}$')

# Sliding window rate limiter
RATE_BUCKETS = {}


def check_rate_limit(ip, bucket, max_req=20, window_sec=60):
    now = time.time()
    key = f'{bucket}:{ip}'
    entry = RATE_BUCKETS.get(key)
    if not entry or now > entry['reset']:
        entry = {'count': 0, 'reset': now + window_sec}
        RATE_BUCKETS[key] = entry
    entry['count'] += 1
    return entry['count'] <= max_req, max(1, int(entry['reset'] - now))


def b64url_encode(b):
    return base64.urlsafe_b64encode(b).decode('utf-8').rstrip('=')


def b64url_decode(s):
    pad = '=' * ((4 - len(s) % 4) % 4)
    return base64.urlsafe_b64decode((s + pad).encode('utf-8'))


def create_session_token(user):
    now_ms = int(time.time() * 1000)
    payload = {
        'uid': str(user.get('uid') or ''),
        'name': str(user.get('name') or 'Athlete')[:80],
        'email': str(user.get('email') or '')[:120],
        'iat': now_ms,
        'exp': now_ms + SESSION_TTL_MS,
    }
    data = b64url_encode(json.dumps(payload).encode('utf-8'))
    sig = b64url_encode(hmac.new(SESSION_SECRET.encode('utf-8'), data.encode('utf-8'), hashlib.sha256).digest())
    return f'{data}.{sig}'


def verify_session_token(token):
    if not token or not isinstance(token, str) or '.' not in token:
        return None
    parts = token.split('.', 1)
    if len(parts) != 2:
        return None
    data, sig = parts
    expected = b64url_encode(hmac.new(SESSION_SECRET.encode('utf-8'), data.encode('utf-8'), hashlib.sha256).digest())
    if not hmac.compare_digest(sig, expected):
        return None
    try:
        payload = json.loads(b64url_decode(data).decode('utf-8'))
        if not payload or not payload.get('uid'):
            return None
        if payload.get('exp') and int(time.time() * 1000) > int(payload['exp']):
            return None
        return payload
    except Exception:
        return None


def rtdb_request(path, method='GET', data=None):
    if not FIREBASE_DB_URL:
        raise RuntimeError('FIREBASE_DATABASE_URL is not configured in .env')
    clean_path = str(path or '').strip('/')
    if not clean_path or '..' in clean_path:
        raise RuntimeError('Invalid database path')
    url = f'{FIREBASE_DB_URL}/{clean_path}.json'
    if FIREBASE_DB_SECRET:
        url += f'?auth={urllib.parse.quote(FIREBASE_DB_SECRET)}'
    body = None if data is None else json.dumps(data).encode('utf-8')
    req = urllib.request.Request(
        url,
        data=body,
        headers={'Content-Type': 'application/json'},
        method=method,
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        raw = resp.read().decode('utf-8')
        return json.loads(raw) if raw else None


def email_to_key(email):
    return hashlib.sha256(email.strip().lower().encode('utf-8')).hexdigest()[:28]


def hash_password(password, salt=None):
    if not salt:
        salt = secrets.token_hex(16)
    dk = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        120_000,
    )
    return salt, dk.hex()


def verify_password(password, salt, stored_hash):
    _, computed = hash_password(password, salt)
    return hmac.compare_digest(computed, stored_hash)


def sync_catalog_if_needed():
    try:
        meta = rtdb_request('database/metadata', 'GET')
        if meta and meta.get('totalMeals'):
            return
        with open(os.path.join(ROOT_DIR, 'data', 'meals.json'), 'r', encoding='utf-8') as f:
            meals = json.load(f)
        with open(os.path.join(ROOT_DIR, 'data', 'strategies.json'), 'r', encoding='utf-8') as f:
            strategies = json.load(f)
        with open(os.path.join(ROOT_DIR, 'data', 'supplements.json'), 'r', encoding='utf-8') as f:
            supplements = json.load(f)
        payload = {
            'meals': {m['id']: m for m in meals},
            'meals_list': meals,
            'strategies': strategies,
            'supplements': supplements,
            'metadata': {
                'totalMeals': len(meals),
                'totalStrategies': len(strategies),
                'totalSupplements': len(supplements),
            },
        }
        rtdb_request('database', 'PUT', payload)
    except Exception as e:
        print('[ZAP FIT Server] Catalog check skipped:', e)


class ZapFitHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT_DIR, **kwargs)

    def log_message(self, fmt, *args):
        pass

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-ZapFit-Client')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def get_client_ip(self):
        xff = self.headers.get('X-Forwarded-For')
        if xff:
            return xff.split(',')[0].strip()
        return self.client_address[0] if self.client_address else '127.0.0.1'

    def get_authenticated_user(self):
        auth_header = self.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token = auth_header[7:].strip()
            user = verify_session_token(token)
            if user:
                return user
        cookie_header = self.headers.get('Cookie', '')
        for part in cookie_header.split(';'):
            if '=' in part:
                k, v = part.split('=', 1)
                if k.strip() == SESSION_COOKIE_NAME:
                    user = verify_session_token(urllib.parse.unquote(v.strip()))
                    if user:
                        return user
        return None

    def is_didi_partner_request(self):
        return self.headers.get('X-ZapFit-Client') == 'didi-partner'

    def send_json(self, status, payload, extra_headers=None):
        body = json.dumps(payload).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Length', str(len(body)))
        if extra_headers:
            for hk, hv in extra_headers.items():
                self.send_header(hk, hv)
        self.end_headers()
        self.wfile.write(body)

    def read_json_body(self):
        length = int(self.headers.get('Content-Length', 0))
        if length <= 0 or length > 2_000_000:
            return {}
        raw = self.rfile.read(length).decode('utf-8')
        return json.loads(raw) if raw else {}

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        qs = urllib.parse.parse_qs(parsed.query)

        # Block sensitive server files from ever being served statically
        lower_path = path.lower()
        if (
            lower_path.startswith('/.env')
            or lower_path.startswith('/.git')
            or lower_path.startswith('/api/')
            and lower_path.endswith('.js')
            or lower_path.endswith('.py')
            or lower_path.endswith('.xlsx')
        ):
            self.send_json(403, {'error': 'Forbidden'})
            return

        if path == '/api/config':
            self.send_json(200, {
                'firebase': {
                    'apiKey': FIREBASE_API_KEY,
                    'authDomain': FIREBASE_AUTH_DOMAIN,
                    'projectId': FIREBASE_PROJECT_ID,
                    'appId': FIREBASE_APP_ID,
                }
            })
            return

        if path == '/api/auth':
            user = self.get_authenticated_user()
            if not user:
                self.send_json(401, {'error': 'Not authenticated'})
                return
            self.send_json(200, {'user': user})
            return

        if path == '/api/athlete':
            session_user = self.get_authenticated_user()
            if not session_user:
                self.send_json(401, {'error': 'Unauthorized: Valid session required.'})
                return
            uid = (qs.get('uid') or [session_user['uid']])[0].strip()
            if uid != session_user['uid']:
                self.send_json(403, {'error': 'Forbidden: Cannot access another athlete’s data.'})
                return
            try:
                data = rtdb_request(f'athletes/{uid}', 'GET')
                self.send_json(200, {'data': data})
            except Exception:
                self.send_json(500, {'error': 'Failed to read athlete profile.'})
            return

        if path == '/api/didi-orders':
            session_user = self.get_authenticated_user()
            is_didi = self.is_didi_partner_request()
            if not session_user and not is_didi:
                self.send_json(401, {'error': 'Unauthorized'})
                return
            try:
                all_orders = rtdb_request('chef_didi_orders', 'GET') or {}
                if is_didi:
                    self.send_json(200, {'orders': all_orders})
                    return
                filtered = {
                    oid: ord_obj
                    for oid, ord_obj in all_orders.items()
                    if isinstance(ord_obj, dict)
                    and (not ord_obj.get('athlete', {}).get('uid') or ord_obj.get('athlete', {}).get('uid') == session_user['uid'])
                }
                self.send_json(200, {'orders': filtered})
            except Exception:
                self.send_json(500, {'error': 'Order service error'})
            return

        # Clean route support for /didi and /deede
        if path.rstrip('/') in ('/didi', '/deede', '/deedee', '/chef-didi', '/chefdidi'):
            self.path = '/index.html'

        return super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        body = self.read_json_body()

        if path == '/api/auth':
            self.handle_auth(body)
            return

        if path == '/api/ai':
            self.handle_ai(body)
            return

        if path == '/api/didi-orders':
            session_user = self.get_authenticated_user()
            if not session_user:
                self.send_json(401, {'error': 'Please sign in to book Chef Didi.'})
                return
            order = body.get('order') if (isinstance(body, dict) and 'order' in body) else body
            order_id = str(order.get('id') or '').strip() if isinstance(order, dict) else ''
            if not order or not SAFE_ID_RE.match(order_id) or not order.get('mealName'):
                self.send_json(400, {'error': 'Invalid order payload'})
                return
            if not isinstance(order.get('athlete'), dict):
                order['athlete'] = {}
            order['athlete']['uid'] = session_user['uid']
            try:
                rtdb_request(f'chef_didi_orders/{order_id}', 'PUT', order)
                self.send_json(200, {'ok': True, 'order': order})
            except Exception:
                self.send_json(500, {'error': 'Failed to save order'})
            return

        self.send_json(404, {'error': 'Not found'})

    def do_PUT(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        body = self.read_json_body()

        if path == '/api/athlete':
            session_user = self.get_authenticated_user()
            if not session_user:
                self.send_json(401, {'error': 'Unauthorized: Valid session required.'})
                return
            auth_uid = session_user['uid']
            body_uid = str(body.get('uid') or auth_uid).strip()
            if body_uid != auth_uid:
                self.send_json(403, {'error': 'Forbidden: Cannot overwrite another athlete’s data.'})
                return
            payload = body.get('payload')
            history = body.get('history')
            if not isinstance(payload, dict):
                self.send_json(400, {'error': 'Invalid athlete payload'})
                return
            payload['uid'] = auth_uid
            try:
                rtdb_request(f'athletes/{auth_uid}', 'PUT', payload)
                if isinstance(history, dict):
                    rtdb_request(f'user_history/{auth_uid}', 'PUT', history)
                self.send_json(200, {'ok': True})
            except Exception:
                self.send_json(500, {'error': 'Failed to save athlete profile'})
            return

        self.send_json(404, {'error': 'Not found'})

    def do_PATCH(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        body = self.read_json_body()

        if path == '/api/didi-orders':
            session_user = self.get_authenticated_user()
            is_didi = self.is_didi_partner_request()
            if not session_user and not is_didi:
                self.send_json(401, {'error': 'Unauthorized'})
                return
            order_id = str(body.get('id') or '').strip()
            if not SAFE_ID_RE.match(order_id):
                self.send_json(400, {'error': 'Invalid order id'})
                return
            try:
                existing = rtdb_request(f'chef_didi_orders/{order_id}', 'GET')
                if not existing:
                    self.send_json(404, {'error': 'Order not found'})
                    return
                if not is_didi and existing.get('athlete', {}).get('uid') and existing['athlete']['uid'] != (session_user or {}).get('uid'):
                    self.send_json(403, {'error': 'Forbidden'})
                    return
                raw_updates = body.get('updates') if isinstance(body.get('updates'), dict) else body
                allowed = {}
                if raw_updates.get('status') in VALID_STATUSES:
                    if raw_updates['status'] == 'completed':
                        steps = existing.get('steps') or [1, 2, 3]
                        steps_map = raw_updates.get('completedSteps') or existing.get('completedSteps') or {}
                        if not all(bool(steps_map.get(str(i)) or steps_map.get(i)) for i in range(len(steps))):
                            self.send_json(400, {'error': 'All cooking steps must be completed before approval.'})
                            return
                    allowed['status'] = raw_updates['status']
                if isinstance(raw_updates.get('completedSteps'), dict):
                    allowed['completedSteps'] = raw_updates['completedSteps']
                allowed['updatedAt'] = int(time.time() * 1000)
                rtdb_request(f'chef_didi_orders/{order_id}', 'PATCH', allowed)
                self.send_json(200, {'ok': True})
            except Exception:
                self.send_json(500, {'error': 'Failed to update order'})
            return

        self.send_json(404, {'error': 'Not found'})

    def do_DELETE(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        qs = urllib.parse.parse_qs(parsed.query)

        if path == '/api/auth':
            cookie = f'{SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'
            self.send_json(200, {'ok': True}, {'Set-Cookie': cookie})
            return

        if path == '/api/didi-orders':
            session_user = self.get_authenticated_user()
            is_didi = self.is_didi_partner_request()
            if not session_user and not is_didi:
                self.send_json(401, {'error': 'Unauthorized'})
                return
            clear_all = (qs.get('all') or [''])[0].strip() == '1' or (qs.get('clear') or [''])[0].strip() == 'all'
            if clear_all:
                if not is_didi:
                    self.send_json(403, {'error': 'Forbidden: Bulk clear restricted to Chef Didi console'})
                    return
                try:
                    rtdb_request('chef_didi_orders', 'DELETE')
                    self.send_json(200, {'ok': True, 'clearedAll': True})
                except Exception:
                    self.send_json(500, {'error': 'Failed to clear orders'})
                return

            order_id = (qs.get('id') or [''])[0].strip()
            if not SAFE_ID_RE.match(order_id):
                self.send_json(400, {'error': 'Invalid order id'})
                return
            try:
                existing = rtdb_request(f'chef_didi_orders/{order_id}', 'GET')
                if existing and not is_didi and existing.get('athlete', {}).get('uid') and existing['athlete']['uid'] != (session_user or {}).get('uid'):
                    self.send_json(403, {'error': 'Forbidden'})
                    return
                rtdb_request(f'chef_didi_orders/{order_id}', 'DELETE')
                self.send_json(200, {'ok': True, 'deletedId': order_id})
            except Exception:
                self.send_json(500, {'error': 'Failed to delete order'})
            return

        self.send_json(404, {'error': 'Not found'})

    def _issue_session_response(self, user_obj):
        token = create_session_token(user_obj)
        max_age = int(SESSION_TTL_MS // 1000)
        cookie = f'{SESSION_COOKIE_NAME}={urllib.parse.quote(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age={max_age}'
        self.send_json(200, {'user': user_obj, 'sessionToken': token}, {'Set-Cookie': cookie})

    def handle_auth(self, body):
        allowed, retry_sec = check_rate_limit(self.get_client_ip(), 'auth', 15, 60)
        if not allowed:
            self.send_json(429, {'error': 'Too many attempts. Please wait a minute.'}, {'Retry-After': str(retry_sec)})
            return

        mode = body.get('mode', 'signin')
        if mode == 'signout':
            cookie = f'{SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'
            self.send_json(200, {'ok': True}, {'Set-Cookie': cookie})
            return

        if mode == 'google':
            id_token = str(body.get('idToken') or '').strip()
            if not id_token or not FIREBASE_API_KEY:
                self.send_json(400, {'error': 'Invalid Google sign-in token.'})
                return
            fb_url = f'https://identitytoolkit.googleapis.com/v1/accounts:lookup?key={FIREBASE_API_KEY}'
            fb_req = urllib.request.Request(
                fb_url,
                data=json.dumps({'idToken': id_token}).encode('utf-8'),
                headers={'Content-Type': 'application/json'},
                method='POST',
            )
            try:
                with urllib.request.urlopen(fb_req, timeout=8) as resp:
                    fb_data = json.loads(resp.read().decode('utf-8'))
                    acct = (fb_data.get('users') or [{}])[0]
                    if not acct.get('localId'):
                        self.send_json(401, {'error': 'Google verification failed.'})
                        return
                    user_obj = {
                        'uid': acct['localId'],
                        'name': acct.get('displayName') or (acct.get('email', '').split('@')[0] or 'Athlete'),
                        'email': acct.get('email', ''),
                        'photo': acct.get('photoUrl', ''),
                    }
                    self._issue_session_response(user_obj)
                    return
            except Exception:
                self.send_json(401, {'error': 'Invalid Google sign-in token.'})
                return

        email = str(body.get('email') or '').strip().lower()
        password = str(body.get('password') or '')
        if not email or '@' not in email or len(email) > 120:
            self.send_json(400, {'error': 'That email address doesn’t look right.'})
            return
        if len(password) < 6 or len(password) > 128:
            self.send_json(400, {'error': 'Use at least 6 characters for your password.'})
            return

        if FIREBASE_API_KEY:
            endpoint = 'signUp' if mode == 'signup' else 'signInWithPassword'
            fb_url = f'https://identitytoolkit.googleapis.com/v1/accounts:{endpoint}?key={FIREBASE_API_KEY}'
            fb_req = urllib.request.Request(
                fb_url,
                data=json.dumps({'email': email, 'password': password, 'returnSecureToken': True}).encode('utf-8'),
                headers={'Content-Type': 'application/json'},
                method='POST',
            )
            try:
                with urllib.request.urlopen(fb_req, timeout=8) as resp:
                    fb_data = json.loads(resp.read().decode('utf-8'))
                    uid = fb_data.get('localId') or ('usr_' + email_to_key(email)[:20])
                    name = fb_data.get('displayName') or email.split('@')[0]
                    self._issue_session_response({'uid': uid, 'name': name, 'email': email})
                    return
            except urllib.error.HTTPError as e:
                err_payload = {}
                try:
                    err_payload = json.loads(e.read().decode('utf-8'))
                except Exception:
                    pass
                fb_msg = (err_payload.get('error') or {}).get('message', '')
                if fb_msg in ('EMAIL_EXISTS',):
                    self.send_json(400, {'error': 'An account already exists with this email. Switch to “Sign in”.'})
                    return

        ekey = email_to_key(email)
        try:
            existing = rtdb_request(f'auth_accounts/{ekey}', 'GET')
            if mode == 'signup':
                if existing and existing.get('passwordHash'):
                    self.send_json(400, {'error': 'An account already exists with this email. Switch to “Sign in”.'})
                    return
                salt, pwd_hash = hash_password(password)
                uid = 'usr_' + ekey[:20]
                name = email.split('@')[0]
                acct = {
                    'uid': uid,
                    'email': email,
                    'name': name,
                    'salt': salt,
                    'passwordHash': pwd_hash,
                    'hashAlgorithm': 'PBKDF2-HMAC-SHA256-120k',
                }
                rtdb_request(f'auth_accounts/{ekey}', 'PUT', acct)
                self._issue_session_response({'uid': uid, 'name': name, 'email': email})
                return
            else:
                if not existing or not existing.get('passwordHash'):
                    self.send_json(400, {'error': 'Invalid email or password. Or switch to “Create account”.'})
                    return
                if not verify_password(password, existing.get('salt', ''), existing.get('passwordHash', '')):
                    self.send_json(400, {'error': 'Incorrect password.'})
                    return
                user_obj = {
                    'uid': existing.get('uid') or ('usr_' + ekey[:20]),
                    'name': existing.get('name') or email.split('@')[0],
                    'email': email,
                }
                self._issue_session_response(user_obj)
        except Exception:
            self.send_json(500, {'error': 'Authentication service unavailable.'})

    def handle_ai(self, body):
        session_user = self.get_authenticated_user()
        if not session_user:
            self.send_json(401, {'error': 'Unauthorized: Please sign in to use ZAP FIT AI.'})
            return

        allowed, retry_sec = check_rate_limit(session_user['uid'], 'ai', 12, 60)
        if not allowed:
            self.send_json(429, {'error': 'AI rate limit reached. Please wait a moment.'}, {'Retry-After': str(retry_sec)})
            return

        if not GROQ_API_KEY:
            self.send_json(500, {'error': 'AI key not configured on server'})
            return

        raw_messages = body.get('messages')
        if not isinstance(raw_messages, list) or not (1 <= len(raw_messages) <= 10):
            self.send_json(400, {'error': 'Invalid messages payload'})
            return

        sanitized = []
        for m in raw_messages:
            if not isinstance(m, dict):
                continue
            role = m.get('role') if m.get('role') in ('system', 'user', 'assistant') else 'user'
            content = str(m.get('content') or '').strip()
            if not content:
                continue
            if len(content) > 12_000:
                self.send_json(400, {'error': 'Message exceeds maximum length'})
                return
            sanitized.append({'role': role, 'content': content})

        has_zap_system = any(m['role'] == 'system' and 'ZAP FIT AI' in m['content'] for m in sanitized)
        if not has_zap_system:
            sanitized.insert(0, {
                'role': 'system',
                'content': 'You are ZAP FIT AI, a sports nutrition and post-workout recovery coach. Only answer questions related to athlete nutrition, recovery, workouts, and meals.',
            })

        req_tokens = int(body.get('max_tokens') or 450)
        max_tokens = min(max(50, req_tokens), 600)

        payload = {
            'model': GROQ_MODEL,
            'messages': sanitized,
            'temperature': 0.3,
            'max_tokens': max_tokens,
        }
        req = urllib.request.Request(
            'https://api.groq.com/openai/v1/chat/completions',
            data=json.dumps(payload).encode('utf-8'),
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {GROQ_API_KEY}',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ZapFitServer/1.0',
            },
            method='POST',
        )
        try:
            with urllib.request.urlopen(req, timeout=25) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                txt = (((data.get('choices') or [{}])[0]).get('message') or {}).get('content', '')
                self.send_json(200, {'text': txt})
        except urllib.error.HTTPError as e:
            self.send_json(e.code, {'error': 'AI service error'})
        except Exception:
            self.send_json(500, {'error': 'AI service temporarily unavailable'})


class ThreadedHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True


if __name__ == '__main__':
    sync_catalog_if_needed()
    with ThreadedHTTPServer(('0.0.0.0', PORT), ZapFitHandler) as httpd:
        print(f'ZAP FIT Secure Backend Server running at http://localhost:{PORT}')
        httpd.serve_forever()
