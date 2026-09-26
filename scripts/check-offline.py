#!/usr/bin/env python3
"""Check that the web app is self-contained and fully cached for offline use.

- web/index.html and web/js/*.js load nothing from other origins (no CDN)
- every file in sw.js ASSETS exists, and every app file under web/ is listed
- the CSP meta tag's sha256 matches the inline importmap
- MODEL_CACHE is the same in sw.js and js/offline.js
"""

from __future__ import annotations

import base64
import hashlib
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WEB = ROOT / "web"
HTML_PATH = WEB / "index.html"
SW_PATH = WEB / "sw.js"
OFFLINE_JS_PATH = WEB / "js" / "offline.js"

# Files under web/ that must be precached (the GLB is cached on demand instead).
CACHED_GLOBS = ["css/*.css", "js/*.js", "vendor/**/*.js", "vendor/**/*.wasm", "vendor/**/*.css", "vendor/**/*.woff2", "icons/*"]
EXTERNAL_RE = re.compile(r"""(?:src|href)\s*=\s*["'](https?:)?//|["']https?://[^"']+\.(?:js|mjs|css|wasm|woff2?)["']""")


def fail(errors: list[str], msg: str) -> None:
    errors.append(msg)


def main() -> int:
    errors: list[str] = []
    html = HTML_PATH.read_text(encoding="utf-8")

    # 1. No external scripts/styles/fonts (plain <a href> links to other sites are fine).
    head = html.split("</head>", 1)[0]
    if EXTERNAL_RE.search(head):
        fail(errors, "index.html <head> loads a resource from another origin")
    for js in sorted((WEB / "js").glob("*.js")):
        for n, line in enumerate(js.read_text(encoding="utf-8").splitlines(), 1):
            if re.search(r"""["']https?://""", line):
                fail(errors, f"{js.relative_to(ROOT)}:{n} references an external URL")

    # 2. sw.js ASSETS <-> files on disk.
    sw = SW_PATH.read_text(encoding="utf-8")
    block = re.search(r"const ASSETS = \[(.*?)\];", sw, re.DOTALL)
    if not block:
        fail(errors, "sw.js: ASSETS array not found")
        assets: set[str] = set()
    else:
        assets = set(re.findall(r'"([^"]+)"', block.group(1)))
    for a in sorted(assets):
        if a == "./":
            continue
        if not (WEB / a).resolve().is_file():
            fail(errors, f"sw.js lists missing file: {a}")
    for pattern in CACHED_GLOBS:
        for f in sorted(WEB.glob(pattern)):
            rel = "./" + f.relative_to(WEB).as_posix()
            if rel not in assets:
                fail(errors, f"not precached in sw.js ASSETS: {rel}")

    # 3. CSP hash of the inline importmap.
    im = re.search(r'<script type="importmap">(.*?)</script>', html, re.DOTALL)
    csp = re.search(r'<meta http-equiv="Content-Security-Policy" content="([^"]+)"', html)
    if not csp:
        fail(errors, "index.html: Content-Security-Policy meta tag missing")
    elif im:
        digest = base64.b64encode(hashlib.sha256(im.group(1).encode("utf-8")).digest()).decode()
        if f"'sha256-{digest}'" not in csp.group(1):
            fail(errors, f"CSP hash does not match importmap — expected 'sha256-{digest}'")

    # 4. MODEL_CACHE must match: offline.js writes the model, sw.js reads it.
    cache_re = re.compile(r'const MODEL_CACHE = "([^"]+)"')
    sw_cache = cache_re.search(sw)
    page_cache = cache_re.search(OFFLINE_JS_PATH.read_text(encoding="utf-8"))
    if not sw_cache or not page_cache:
        fail(errors, "MODEL_CACHE not found in sw.js or js/offline.js")
    elif sw_cache.group(1) != page_cache.group(1):
        fail(
            errors,
            f"MODEL_CACHE differs: sw.js {sw_cache.group(1)!r} vs js/offline.js {page_cache.group(1)!r}",
        )

    print(f"precached assets: {len(assets)}")
    if errors:
        for e in errors:
            print("ERROR:", e)
        return 1
    print("OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
