#!/usr/bin/env python3
"""Build data/knowledge.json from knowledge/*.md (the public knowledge base).

Each file: a small frontmatter block + sections split by "## ".
Each section becomes one searchable chunk carrying the file's source.

  python scripts/build-knowledge.py          # write data/knowledge.json
  python scripts/build-knowledge.py --check  # fail if it is out of date (CI)
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "knowledge"
OUT = ROOT / "data" / "knowledge.json"
MAP_PATH = ROOT / "data" / "body-pain-map.json"

REQUIRED = ("title", "regions", "source", "author", "review_status")
STATUSES = ("draft", "reviewed", "verified")
MAX_CHARS = 1200


def parse_frontmatter(text: str) -> tuple[dict, str]:
    m = re.match(r"^---\n(.*?)\n---\n", text, re.DOTALL)
    if not m:
        raise ValueError("missing frontmatter")
    meta: dict = {}
    for line in m.group(1).splitlines():
        if not line.strip():
            continue
        key, sep, value = line.partition(":")
        if not sep:
            raise ValueError(f"bad frontmatter line: {line!r}")
        value = value.strip()
        if value.startswith("[") and value.endswith("]"):
            meta[key.strip()] = [v.strip() for v in value[1:-1].split(",") if v.strip()]
        else:
            meta[key.strip()] = value
    return meta, text[m.end():]


def sections(body: str) -> list[tuple[str, str]]:
    out = []
    for part in re.split(r"^## ", body, flags=re.MULTILINE)[1:]:
        heading, _, rest = part.partition("\n")
        text = re.sub(r"\s+", " ", rest).strip()
        if text:
            out.append((heading.strip(), text))
    return out


def build() -> tuple[dict, list[str]]:
    errors: list[str] = []
    region_ids = {r["id"] for r in json.loads(MAP_PATH.read_text(encoding="utf-8"))["regions"]}
    chunks = []
    for path in sorted(SRC.glob("*.md")):
        if path.name.startswith("_") or path.name.lower() == "readme.md":
            continue
        rel = path.relative_to(ROOT).as_posix()
        try:
            meta, body = parse_frontmatter(path.read_text(encoding="utf-8"))
        except ValueError as exc:
            errors.append(f"{rel}: {exc}")
            continue
        for key in REQUIRED:
            if not meta.get(key):
                errors.append(f"{rel}: missing '{key}'")
        if meta.get("review_status") not in STATUSES:
            errors.append(f"{rel}: review_status must be one of {STATUSES}")
        regions = meta.get("regions") or []
        if not isinstance(regions, list):
            errors.append(f"{rel}: regions must be a [list]")
            regions = []
        for rid in regions:
            if rid not in region_ids:
                errors.append(f"{rel}: unknown region '{rid}'")
        secs = sections(body)
        if not secs:
            errors.append(f"{rel}: no '## ' sections")
        for i, (heading, text) in enumerate(secs, 1):
            if len(text) > MAX_CHARS:
                errors.append(f"{rel}: section '{heading}' is {len(text)} chars (max {MAX_CHARS})")
            chunks.append({
                "id": f"{path.stem}#{i}",
                "doc": path.stem,
                "title": meta.get("title", ""),
                "section": heading,
                "regions": regions,
                "text": text,
                "source": meta.get("source", ""),
                "source_url": meta.get("source_url", ""),
                "author": meta.get("author", ""),
                "review_status": meta.get("review_status", ""),
            })
    return {"version": 1, "license": "CC BY-SA 4.0", "chunks": chunks}, errors


def main() -> int:
    data, errors = build()
    for e in errors:
        print("ERROR:", e)
    if errors:
        return 1
    text = json.dumps(data, ensure_ascii=False, indent=1) + "\n"
    docs = len({c["doc"] for c in data["chunks"]})
    if "--check" in sys.argv:
        if not OUT.is_file() or OUT.read_text(encoding="utf-8") != text:
            print("ERROR: data/knowledge.json is out of date — run python scripts/build-knowledge.py")
            return 1
        print(f"knowledge: {docs} docs, {len(data['chunks'])} chunks — up to date")
        return 0
    OUT.write_text(text, encoding="utf-8", newline="\n")
    print(f"wrote {OUT.relative_to(ROOT)}: {docs} docs, {len(data['chunks'])} chunks")
    return 0


if __name__ == "__main__":
    sys.exit(main())
