#!/usr/bin/env python3
"""Serve UI + Phase 4 knowledge bridge (optional local vault wiki)."""

from __future__ import annotations

import json
import os
import re
import urllib.parse
import webbrowser
from http.cookies import SimpleCookie
import review_store
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PORT = int(os.environ.get("BODY_PAIN_PORT", "8787"))
DEFAULT_VAULT = Path(os.environ.get("BODY_XAMBRAIN_VAULT", r"D:\obsidian\body-xambrain"))

MAP_PATH = ROOT / "data" / "body-pain-map.json"
FOLLOWUPS_PATH = ROOT / "data" / "region-followups.json"

_FRONTMATTER_RE = re.compile(r"^---\r?\n.*?\r?\n---\r?\n", re.DOTALL)
_H2_RE = re.compile(r"^##\s+(.+)$", re.MULTILINE)


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def strip_frontmatter(text: str) -> str:
    return _FRONTMATTER_RE.sub("", text, count=1).lstrip()


def excerpt_markdown(text: str, limit: int = 480) -> str:
    body = strip_frontmatter(text)
    # Prefer สาระสำคัญ section when present
    preferred = None
    for match in _H2_RE.finditer(body):
        title = match.group(1).strip()
        start = match.end()
        nxt = _H2_RE.search(body, start)
        chunk = body[start : nxt.start() if nxt else len(body)].strip()
        if "สาระสำคัญ" in title or preferred is None:
            preferred = chunk
            if "สาระสำคัญ" in title:
                break
    raw = preferred or body
    raw = re.sub(r"\[\[([^\]|]+)(?:\|[^\]]+)?\]\]", r"\1", raw)
    raw = re.sub(r"[#>*_`]", "", raw)
    raw = re.sub(r"\n{2,}", "\n", raw).strip()
    if len(raw) <= limit:
        return raw
    return raw[: limit - 1].rstrip() + "…"


def wiki_excerpt(vault: Path, ref: str) -> dict | None:
    name = ref.strip().replace("\\", "/").removesuffix(".md")
    if not name or ".." in name or name.startswith("/"):
        return None
    path = vault / "wiki" / f"{name}.md"
    if not path.is_file():
        return {"ref": name, "ok": False, "error": "not_found"}
    try:
        text = path.read_text(encoding="utf-8")
    except OSError as exc:
        return {"ref": name, "ok": False, "error": str(exc)}
    return {
        "ref": name,
        "ok": True,
        "path": str(path),
        "excerpt": excerpt_markdown(text),
        "source_label": "จากคลัง",
    }


def build_knowledge(region_id: str) -> dict:
    pain_map = load_json(MAP_PATH)
    followups_doc = load_json(FOLLOWUPS_PATH)
    regions = {r["id"]: r for r in pain_map.get("regions", [])}
    region = regions.get(region_id)
    if not region:
        return {"ok": False, "error": f"unknown region: {region_id}"}

    by_id = followups_doc.get("by_id") or {}
    questions = list(by_id.get(region_id) or followups_doc.get("default") or [])

    vault = DEFAULT_VAULT
    vault_ok = vault.is_dir() and (vault / "wiki").is_dir()
    wiki_items = []
    if vault_ok:
        for ref in region.get("wiki_refs") or []:
            item = wiki_excerpt(vault, ref)
            if item:
                wiki_items.append(item)

    return {
        "ok": True,
        "region_id": region_id,
        "disclaimer_th": pain_map.get("disclaimer_th", ""),
        "from_map": {
            "source_label": "จากแผนที่",
            "name_th": region.get("name_th"),
            "name_en": region.get("name_en"),
            "blurb_th": region.get("patient_blurb_th"),
            "sen_refs": region.get("sen_refs") or [],
            "wiki_refs": region.get("wiki_refs") or [],
        },
        "followups": {
            "source_label": "คำถามซักต่อ",
            "questions": questions,
        },
        "from_vault": {
            "source_label": "จากคลัง",
            "available": vault_ok,
            "vault": str(vault) if vault_ok else None,
            "items": wiki_items,
        },
    }


def review_snapshot(target):
    kind, _, key = target.partition(':')
    if kind == 'knowledge':
        source = next((c for c in load_json(ROOT / 'data/knowledge.json')['chunks'] if c['id'] == key), None)
    elif kind == 'region':
        region = next((r for r in load_json(MAP_PATH)['regions'] if r['id'] == key), None)
        followups = load_json(FOLLOWUPS_PATH)
        source = {'region': region, 'followups': followups.get('by_id', {}).get(key, followups.get('default', []))} if region else None
    else:
        source = None
    return json.dumps(source, ensure_ascii=False, separators=(',', ':')) if source is not None else None


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, format: str, *args) -> None:
        print("[%s] %s" % (self.log_date_time_string(), format % args))

    def _send_json(self, payload: dict, status: int = 200) -> None:
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self) -> None:  # noqa: N802
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path.startswith('/api/reviews/'):
            self._reviews('GET', path)
            return

        if path == "/api/health":
            vault = DEFAULT_VAULT
            self._send_json(
                {
                    "ok": True,
                    "port": PORT,
                    "vault": str(vault),
                    "vault_ok": vault.is_dir() and (vault / "wiki").is_dir(),
                    "map": MAP_PATH.is_file(),
                    "followups": FOLLOWUPS_PATH.is_file(),
                }
            )
            return

        if path == "/api/knowledge":
            qs = urllib.parse.parse_qs(parsed.query)
            region_id = (qs.get("region_id") or [""])[0].strip()
            if not region_id:
                self._send_json({"ok": False, "error": "region_id required"}, 400)
                return
            try:
                payload = build_knowledge(region_id)
            except Exception as exc:  # noqa: BLE001
                self._send_json({"ok": False, "error": str(exc)}, 500)
                return
            status = 200 if payload.get("ok") else 404
            self._send_json(payload, status)
            return

        # Serve only public application assets; never expose accounts or source files.
        decoded = urllib.parse.unquote(path)
        resolved = Path(self.translate_path(path)).resolve()
        allowed = any(resolved.is_relative_to(ROOT / folder) for folder in ('web', 'data'))
        if not allowed or any(part.startswith('.') for part in Path(decoded).parts) or resolved.is_dir() and not (resolved / 'index.html').is_file():
            self.send_error(404)
            return
        super().do_GET()

    def do_HEAD(self):
        self.send_error(405)

    def do_POST(self):
        path = urllib.parse.urlparse(self.path).path
        if not path.startswith('/api/reviews/'):
            self._send_json({'ok': False, 'error': 'Not found'}, 404)
            return
        self._reviews('POST', path)

    def _reviews(self, method, path):
        try:
            data = {}
            if method == 'POST':
                expected = os.environ.get('BODY_PAIN_PUBLIC_ORIGIN', f'http://127.0.0.1:{PORT}')
                origin = self.headers.get('Origin')
                if origin != expected or self.headers.get('X-Review-Request') != '1':
                    raise review_store.APIError('Origin rejected', 403)
                if self.headers.get('Content-Type', '').split(';')[0] != 'application/json':
                    raise review_store.APIError('JSON required', 415)
                length = int(self.headers.get('Content-Length', '0'))
                if length <= 0 or length > 100000:
                    raise review_store.APIError('Request too large or empty', 413)
                data = json.loads(self.rfile.read(length))
                if not isinstance(data, dict):
                    raise review_store.APIError('JSON object required')
            cookie = SimpleCookie(self.headers.get('Cookie', ''))
            token = cookie['review_session'].value if 'review_session' in cookie else ''
            payload, new_token = review_store.dispatch(method, path, data, token, review_snapshot)
            if new_token is not None:
                body = json.dumps(payload).encode()
                self.send_response(200)
                secure = '; Secure' if os.environ.get('BODY_PAIN_PUBLIC_ORIGIN', '').startswith('https://') else ''
                self.send_header('Set-Cookie', f'review_session={new_token}; HttpOnly; SameSite=Strict; Path=/api/reviews; Max-Age={28800 if new_token else 0}{secure}')
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(body)))
                self.send_header('Cache-Control', 'no-store')
                self.end_headers()
                self.wfile.write(body)
            else:
                self._send_json(payload)
        except review_store.APIError as exc:
            self._send_json({'ok': False, 'error': str(exc)}, exc.status)
        except (ValueError, TypeError):
            self._send_json({'ok': False, 'error': 'Invalid request'}, 400)
        except Exception:
            self._send_json({'ok': False, 'error': 'ไม่สามารถเข้าถึงระบบตรวจเนื้อหา กรุณาลองอีกครั้ง'}, 500)


def main() -> None:
    server = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    url = f"http://127.0.0.1:{PORT}/web/"
    print(f"Serving {ROOT}")
    print(f"Vault bridge: {DEFAULT_VAULT}")
    print(f"Open {url}")
    print("API: /api/health  /api/knowledge?region_id=shoulder_right")
    try:
        webbrowser.open(url)
    except Exception:
        pass
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")


if __name__ == "__main__":
    main()
