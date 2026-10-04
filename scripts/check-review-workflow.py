import importlib.util
import json
import os
from pathlib import Path
import tempfile
import threading
import unittest
import urllib.request
import urllib.error
from http.server import ThreadingHTTPServer
import review_store as store

spec = importlib.util.spec_from_file_location('serve_web', Path(__file__).with_name('serve-web.py'))
server_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(server_module)

class WorkflowTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.previous = store.DB
        store.DB = Path(self.temp.name) / 'reviews.sqlite3'
        self.snapshot = '{"text":"original"}'
        with store.connect() as db:
            for username, role in [('expert', 'expert'), ('other', 'expert'), ('developer', 'developer')]:
                salt = 'ab' * 16
                db.execute('INSERT INTO users(username,name,role,salt,password) VALUES (?,?,?,?,?)', (username, username, role, salt, store.password_hash('test-password-long', salt)))
        self.tokens = {name: self.call('POST', 'login', {'username': name, 'password': 'test-password-long'})[1] for name in ('expert', 'other', 'developer')}

    def tearDown(self):
        store.DB = self.previous
        self.temp.cleanup()

    def call(self, method, path, data=None, actor=None):
        return store.dispatch(method, '/api/reviews/' + path, data or {}, self.tokens[actor] if actor else '', lambda target: self.snapshot if target == 'knowledge:test' else None)

    def create(self):
        return self.call('POST', 'tickets', {'target': 'knowledge:test', 'title': 'Test', 'snapshot': self.snapshot, 'comment': 'Please correct this'}, 'expert')[0]['id']

    def update(self, tid, action, actor, version, snapshot=None):
        return self.call('POST', f'tickets/{tid}', {'action': action, 'comment': 'Explanation', 'version': version, 'snapshot': snapshot or self.snapshot}, actor)

    def test_complete_workflow_and_permissions(self):
        tid = self.create()
        self.assertEqual(self.call('GET', 'tickets', actor='other')[0]['tickets'], [])
        with self.assertRaises(store.APIError): self.update(tid, 'comment', 'other', 1)
        with self.assertRaises(store.APIError): self.update(tid, 'start', 'expert', 1)
        self.update(tid, 'start', 'developer', 1)
        with self.assertRaises(store.APIError): self.update(tid, 'resubmit', 'developer', 1)
        self.snapshot = '{"text":"corrected"}'
        self.update(tid, 'resubmit', 'developer', 2)
        self.update(tid, 'request_changes', 'expert', 3)
        self.update(tid, 'resubmit', 'developer', 4)
        with self.assertRaises(store.APIError): self.update(tid, 'approve', 'developer', 5)
        self.update(tid, 'approve', 'expert', 5)
        ticket = self.call('GET', 'tickets', actor='developer')[0]['tickets'][0]
        self.assertEqual(ticket['status'], 'closed')
        self.assertEqual(len(ticket['events']), 6)
        self.assertEqual(ticket['events'][0]['snapshot'], '{"text":"original"}')
        with self.assertRaises(store.APIError): self.update(tid, 'start', 'developer', 6)

    def test_revision_and_auth(self):
        with self.assertRaises(store.APIError): self.call('GET', 'tickets')
        tid = self.create()
        self.update(tid, 'start', 'developer', 1)
        self.update(tid, 'resubmit', 'developer', 2)
        old = self.snapshot
        self.snapshot = '{"text":"changed again"}'
        with self.assertRaises(store.APIError): self.update(tid, 'approve', 'expert', 3, old)
        with self.assertRaises(store.APIError): self.update(tid, 'approve', 'expert', 3)
        self.update(tid, 'resubmit', 'developer', 3)
        self.update(tid, 'approve', 'expert', 4)
        self.call('POST', 'logout', actor='expert')
        with self.assertRaises(store.APIError): self.call('GET', 'me', actor='expert')

    def test_http_cookie_origin_and_private_files(self):
        server = ThreadingHTTPServer(('127.0.0.1', 0), server_module.Handler)
        origin = f'http://127.0.0.1:{server.server_port}'
        previous = os.environ.get('BODY_PAIN_PUBLIC_ORIGIN')
        os.environ['BODY_PAIN_PUBLIC_ORIGIN'] = origin
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            data = json.dumps({'username': 'expert', 'password': 'test-password-long'}).encode()
            request = urllib.request.Request(origin + '/api/reviews/login', data=data, headers={'Content-Type': 'application/json', 'Origin': 'https://other.example', 'X-Review-Request': '1'})
            with self.assertRaises(urllib.error.HTTPError) as exc: urllib.request.urlopen(request)
            self.assertEqual(exc.exception.code, 403)
            request.headers['Origin'] = origin
            response = urllib.request.urlopen(request)
            cookie = response.headers['Set-Cookie']
            self.assertIn('HttpOnly', cookie)
            self.assertIn('SameSite=Strict', cookie)
            me = urllib.request.Request(origin + '/api/reviews/me', headers={'Cookie': cookie.split(';')[0]})
            self.assertEqual(json.load(urllib.request.urlopen(me))['user']['role'], 'expert')
            target = 'region:shoulder_right'
            source = server_module.review_snapshot(target)
            payload = json.dumps({'target': target, 'title': 'ทดสอบการส่งผ่าน HTTP', 'snapshot': source, 'comment': 'ข้อเสนอสำหรับการทดสอบเท่านั้น'}).encode()
            submit = urllib.request.Request(origin + '/api/reviews/tickets', data=payload, headers={'Content-Type': 'application/json', 'Origin': origin, 'X-Review-Request': '1', 'Cookie': cookie.split(';')[0]})
            self.assertTrue(json.load(urllib.request.urlopen(submit))['id'])
            queue = urllib.request.Request(origin + '/api/reviews/tickets', headers={'Cookie': cookie.split(';')[0]})
            result = json.load(urllib.request.urlopen(queue))['tickets'][0]
            self.assertEqual(result['current_snapshot'], source)
            self.assertEqual(result['status'], 'submitted')
            for path in ['/.git/config', '/scripts/review_store.py', '/data/', '/web/../scripts/review_store.py']:
                with self.assertRaises(urllib.error.HTTPError) as exc: urllib.request.urlopen(origin + path)
                self.assertEqual(exc.exception.code, 404)
            self.assertEqual(urllib.request.urlopen(origin + '/web/reviews.html').status, 200)
        finally:
            server.shutdown(); server.server_close(); thread.join()
            if previous is None: os.environ.pop('BODY_PAIN_PUBLIC_ORIGIN', None)
            else: os.environ['BODY_PAIN_PUBLIC_ORIGIN'] = previous

if __name__ == '__main__':
    unittest.main()
