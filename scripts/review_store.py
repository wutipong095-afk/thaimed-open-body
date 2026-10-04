"""Authenticated shared review workflow. Stdlib only; provision accounts via CLI."""
import argparse
import hashlib
import hmac
import json
import os
from pathlib import Path
import secrets
import sqlite3
import time
from contextlib import contextmanager

DB = Path(os.environ.get('BODY_PAIN_REVIEW_DB', Path(__file__).resolve().parents[1] / '.review-data' / 'reviews.sqlite3'))

class APIError(Exception):
    def __init__(self, message, status=400):
        self.status = status
        super().__init__(message)

@contextmanager
def connect():
    DB.parent.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(DB)
    db.row_factory = sqlite3.Row
    db.executescript('''
    CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT UNIQUE, name TEXT, role TEXT, salt TEXT, password TEXT);
    CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id INTEGER, expires REAL);
    CREATE TABLE IF NOT EXISTS tickets (id INTEGER PRIMARY KEY, author INTEGER, target TEXT, title TEXT, snapshot TEXT, status TEXT, version INTEGER DEFAULT 1, created REAL);
    CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY, ticket INTEGER, actor INTEGER, action TEXT, comment TEXT, snapshot TEXT, created REAL);
    ''')
    try:
        with db:
            yield db
    finally:
        db.close()

def password_hash(password, salt):
    return hashlib.pbkdf2_hmac('sha256', password.encode(), bytes.fromhex(salt), 600000).hex()

def field(data, key, limit=3000):
    value = data.get(key)
    if not isinstance(value, str) or not value.strip() or len(value) > limit:
        raise APIError('กรอกข้อมูลให้ครบและไม่เกินความยาวที่กำหนด: ' + key)
    return value.strip()

def account(db, token):
    row = db.execute('SELECT u.id,u.username,u.name,u.role FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=? AND s.expires>?', (hashlib.sha256(token.encode()).hexdigest(), time.time())).fetchone()
    if not row:
        raise APIError('กรุณาเข้าสู่ระบบ', 401)
    return dict(row)

def dispatch(method, path, data, token, snapshot_for):
    with connect() as db:
        if path == '/api/reviews/login' and method == 'POST':
            username = field(data, 'username', 100)
            password = field(data, 'password', 200)
            row = db.execute('SELECT * FROM users WHERE username=?', (username,)).fetchone()
            # Perform the same expensive hash for unknown accounts.
            calculated = password_hash(password, row['salt'] if row else '00' * 16)
            if not row or not hmac.compare_digest(calculated, row['password']):
                raise APIError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง', 401)
            raw = secrets.token_urlsafe(32)
            db.execute('DELETE FROM sessions WHERE expires<=?', (time.time(),))
            db.execute('INSERT INTO sessions VALUES (?,?,?)', (hashlib.sha256(raw.encode()).hexdigest(), row['id'], time.time() + 28800))
            return {'ok': True}, raw
        user = account(db, token)
        if path == '/api/reviews/me' and method == 'GET':
            return {'ok': True, 'user': user}, None
        if path == '/api/reviews/logout' and method == 'POST':
            db.execute('DELETE FROM sessions WHERE token=?', (hashlib.sha256(token.encode()).hexdigest(),))
            return {'ok': True}, ''
        if path == '/api/reviews/tickets' and method == 'GET':
            tickets = []
            for row in db.execute('SELECT * FROM tickets WHERE author=? OR ?=\'developer\' ORDER BY id DESC', (user['id'], user['role'])):
                ticket = dict(row)
                ticket['events'] = [dict(e) for e in db.execute('SELECT e.*,u.name,u.role FROM events e JOIN users u ON u.id=e.actor WHERE ticket=? ORDER BY e.id', (row['id'],))]
                ticket['current_snapshot'] = snapshot_for(row['target'])
                tickets.append(ticket)
            return {'ok': True, 'tickets': tickets}, None
        if path == '/api/reviews/tickets' and method == 'POST':
            if user['role'] != 'expert':
                raise APIError('เฉพาะผู้เชี่ยวชาญสามารถส่งข้อเสนอ', 403)
            target = field(data, 'target', 200)
            current = snapshot_for(target)
            if current is None:
                raise APIError('ไม่พบเนื้อหา', 404)
            if data.get('snapshot') != current:
                raise APIError('เนื้อหาเปลี่ยนแล้ว กรุณาโหลดหน้าใหม่ก่อนส่ง', 409)
            title = field(data, 'title', 500)
            comment = field(data, 'comment', 10000)
            cursor = db.execute('INSERT INTO tickets(author,target,title,snapshot,status,created) VALUES (?,?,?,?,?,?)', (user['id'], target, title, current, 'submitted', time.time()))
            tid = cursor.lastrowid
            db.execute('INSERT INTO events(ticket,actor,action,comment,snapshot,created) VALUES (?,?,?,?,?,?)', (tid, user['id'], 'submitted', comment, current, time.time()))
            return {'ok': True, 'id': tid}, None
        if path.startswith('/api/reviews/tickets/') and method == 'POST':
            try:
                tid = int(path.rsplit('/', 1)[1])
            except ValueError:
                raise APIError('ไม่พบรายการ', 404)
            db.execute('BEGIN IMMEDIATE')
            ticket = db.execute('SELECT * FROM tickets WHERE id=?', (tid,)).fetchone()
            if not ticket or (user['role'] != 'developer' and ticket['author'] != user['id']):
                raise APIError('ไม่พบรายการ', 404)
            if data.get('version') != ticket['version']:
                raise APIError('รายการมีการเปลี่ยนแปลง กรุณารีเฟรชคิว', 409)
            action = field(data, 'action', 30)
            comment = field(data, 'comment', 10000)
            transitions = {'start': ('developer', ['submitted'], 'in_progress'), 'resubmit': ('developer', ['in_progress', 'recheck'], 'recheck'), 'approve': ('expert', ['recheck'], 'closed'), 'request_changes': ('expert', ['recheck'], 'in_progress')}
            status, snapshot = ticket['status'], ticket['snapshot']
            if action != 'comment':
                if action not in transitions:
                    raise APIError('คำสั่งไม่ถูกต้อง')
                role, allowed, status = transitions[action]
                if user['role'] != role or ticket['status'] not in allowed:
                    raise APIError('ไม่มีสิทธิ์เปลี่ยนสถานะนี้', 403)
                if action in ('resubmit', 'approve'):
                    current = snapshot_for(ticket['target'])
                    if current is None or data.get('snapshot') != current:
                        raise APIError('เนื้อหาเปลี่ยนแล้ว กรุณารีเฟรชและตรวจอีกครั้ง', 409)
                    if action == 'approve' and current != ticket['snapshot']:
                        raise APIError('ฉบับที่ส่งตรวจเปลี่ยนแล้ว ให้ผู้พัฒนาส่งตรวจใหม่', 409)
                    snapshot = current
            db.execute('UPDATE tickets SET status=?,snapshot=?,version=version+1 WHERE id=?', (status, snapshot, tid))
            db.execute('INSERT INTO events(ticket,actor,action,comment,snapshot,created) VALUES (?,?,?,?,?,?)', (tid, user['id'], action, comment, snapshot, time.time()))
            return {'ok': True}, None
        raise APIError('ไม่พบ API', 404)

def main():
    import getpass
    parser = argparse.ArgumentParser(description='Create or reset an approved reviewer/developer account')
    parser.add_argument('username')
    parser.add_argument('--name', required=True)
    parser.add_argument('--role', required=True, choices=['expert', 'developer'])
    args = parser.parse_args()
    password = getpass.getpass('Password (at least 12 characters): ')
    if len(password) < 12 or password != getpass.getpass('Confirm password: '):
        parser.error('Passwords must match and be at least 12 characters')
    salt = secrets.token_hex(16)
    with connect() as db:
        db.execute('INSERT INTO users(username,name,role,salt,password) VALUES (?,?,?,?,?) ON CONFLICT(username) DO UPDATE SET name=excluded.name,role=excluded.role,salt=excluded.salt,password=excluded.password', (args.username, args.name, args.role, salt, password_hash(password, salt)))
        db.execute('DELETE FROM sessions WHERE user_id=(SELECT id FROM users WHERE username=?)', (args.username,))
    print('Account saved:', args.username, args.role)

if __name__ == '__main__':
    main()
