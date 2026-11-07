import hashlib
import hmac
import http.server
import json
import os
import secrets
import socketserver
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
GROQ_API_KEY = os.environ.get('GROQ_API_KEY') or os.environ.get('VITE_GROQ_API_KEY', '')
GROQ_MODEL = os.environ.get('GROQ_MODEL') or os.environ.get('VITE_GROQ_MODEL', 'llama-3.3-70b-versatile')


def rtdb_request(path, method='GET', data=None):
    if not FIREBASE_DB_URL:
        raise RuntimeError('FIREBASE_DATABASE_URL is not configured in .env')
    clean_path = str(path or '').strip('/')
    url = f'{FIREBASE_DB_URL}/{clean_path}.json'
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
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def send_json(self, status, payload):
        body = json.dumps(payload).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def read_json_body(self):
        length = int(self.headers.get('Content-Length', 0))
        if length <= 0:
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

        if path == '/api/athlete':
            uid = (qs.get('uid') or [''])[0].strip()
            if not uid:
                self.send_json(400, {'error': 'Missing uid'})
                return
            try:
                data = rtdb_request(f'athletes/{uid}', 'GET')
                self.send_json(200, {'data': data})
            except Exception as e:
                self.send_json(500, {'error': str(e)})
            return

        if path == '/api/didi-orders':
            try:
                data = rtdb_request('chef_didi_orders', 'GET')
                self.send_json(200, {'orders': data or {}})
            except Exception as e:
                self.send_json(500, {'error': str(e)})
            return

        if path == '/api/database':
            try:
                data = rtdb_request('database', 'GET')
                self.send_json(200, {'database': data or {}})
            except Exception as e:
                self.send_json(500, {'error': str(e)})
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
            order = body.get('order') if (isinstance(body, dict) and 'order' in body) else body
            if not order or not isinstance(order, dict) or not order.get('id'):
                self.send_json(400, {'error': 'Invalid order payload'})
                return
            try:
                rtdb_request(f"chef_didi_orders/{order['id']}", 'PUT', order)
                self.send_json(200, {'ok': True, 'order': order})
            except Exception as e:
                self.send_json(500, {'error': str(e)})
            return

        self.send_json(404, {'error': 'Not found'})

    def do_PUT(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        body = self.read_json_body()

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

        if path == '/api/athlete':
            uid = str(body.get('uid') or '').strip()
            payload = body.get('payload')
            history = body.get('history')
            if not uid or not isinstance(payload, dict):
                self.send_json(400, {'error': 'Invalid athlete payload'})
                return
            try:
                rtdb_request(f'athletes/{uid}', 'PUT', payload)
                if history:
                    rtdb_request(f'user_history/{uid}', 'PUT', history)
                self.send_json(200, {'ok': True})
            except Exception as e:
                self.send_json(500, {'error': str(e)})
            return

        self.send_json(404, {'error': 'Not found'})

    def do_PATCH(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        body = self.read_json_body()

        if path == '/api/didi-orders':
            order_id = str(body.get('id') or '').strip()
            updates = body.get('updates')
            if not isinstance(updates, dict):
                updates = {k: v for k, v in body.items() if k not in ('id',)}
            if not order_id:
                self.send_json(400, {'error': 'Missing order id'})
                return
            try:
                rtdb_request(f'chef_didi_orders/{order_id}', 'PATCH', updates)
                self.send_json(200, {'ok': True})
            except Exception as e:
                self.send_json(500, {'error': str(e)})
            return

        self.send_json(404, {'error': 'Not found'})

    def do_DELETE(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        qs = urllib.parse.parse_qs(parsed.query)

        if path == '/api/didi-orders':
            clear_all = (qs.get('all') or [''])[0].strip() == '1' or (qs.get('clear') or [''])[0].strip() == 'all'
            if clear_all:
                try:
                    rtdb_request('chef_didi_orders', 'DELETE')
                    self.send_json(200, {'ok': True, 'clearedAll': True})
                except Exception as e:
                    self.send_json(500, {'error': str(e)})
                return

            order_id = (qs.get('id') or [''])[0].strip()
            if not order_id:
                self.send_json(400, {'error': 'Missing order id'})
                return
            try:
                rtdb_request(f'chef_didi_orders/{order_id}', 'DELETE')
                self.send_json(200, {'ok': True, 'deletedId': order_id})
            except Exception as e:
                self.send_json(500, {'error': str(e)})
            return

        self.send_json(404, {'error': 'Not found'})

    def handle_auth(self, body):
        mode = body.get('mode', 'signin')
        email = str(body.get('email') or '').strip().lower()
        password = str(body.get('password') or '')
        if not email or '@' not in email:
            self.send_json(400, {'error': 'That email address doesn’t look right.'})
            return
        if len(password) < 6:
            self.send_json(400, {'error': 'Use at least 6 characters for your password.'})
            return

        # 1. Try Firebase Identity Toolkit REST API on the backend first
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
                    uid = fb_data.get('localId') or ('usr_' + email_to_key(email))
                    name = fb_data.get('displayName') or email.split('@')[0]
                    self.send_json(200, {'user': {'uid': uid, 'name': name, 'email': email}})
                    return
            except urllib.error.HTTPError as e:
                err_Payload = {}
                try:
                    err_Payload = json.loads(e.read().decode('utf-8'))
                except Exception:
                    pass
                fb_msg = (err_Payload.get('error') or {}).get('message', '')
                # If Firebase Auth specifically rejects credentials, return friendly message unless it's CONFIGURATION_NOT_FOUND
                if fb_msg in ('EMAIL_EXISTS',):
                    self.send_json(400, {'error': 'An account already exists with this email. Switch to “Sign in”.'})
                    return
                if fb_msg in ('INVALID_PASSWORD', 'INVALID_LOGIN_CREDENTIALS', 'EMAIL_NOT_FOUND'):
                    # Fall through to check RTDB hashed accounts in case account was created via RTDB
                    pass

        # 2. Server-side PBKDF2-HMAC-SHA256 salted password verification in Firebase RTDB
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
                self.send_json(200, {'user': {'uid': uid, 'name': name, 'email': email}})
                return
            else:
                if not existing or not existing.get('passwordHash'):
                    self.send_json(400, {'error': 'Invalid email or password. Or switch to “Create account”.'})
                    return
                if not verify_password(password, existing.get('salt', ''), existing.get('passwordHash', '')):
                    self.send_json(400, {'error': 'Incorrect password.'})
                    return
                self.send_json(
                    200,
                    {
                        'user': {
                            'uid': existing.get('uid') or ('usr_' + ekey[:20]),
                            'name': existing.get('name') or email.split('@')[0],
                            'email': email,
                        }
                    },
                )
        except Exception as e:
            self.send_json(500, {'error': 'Authentication service error: ' + str(e)})

    def handle_ai(self, body):
        if not GROQ_API_KEY:
            self.send_json(500, {'error': 'AI key not configured on server'})
            return
        messages = body.get('messages') or []
        max_tokens = int(body.get('max_tokens') or 500)
        payload = {
            'model': GROQ_MODEL,
            'messages': messages,
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
            err_txt = e.read().decode('utf-8', errors='ignore')
            self.send_json(e.code, {'error': err_txt})
        except Exception as e:
            self.send_json(500, {'error': str(e)})


class ThreadedHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True


if __name__ == '__main__':
    sync_catalog_if_needed()
    with ThreadedHTTPServer(('0.0.0.0', PORT), ZapFitHandler) as httpd:
        print(f'ZAP FIT Secure Backend Server running at http://localhost:{PORT}')
        httpd.serve_forever()
