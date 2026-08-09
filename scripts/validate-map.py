#!/usr/bin/env python3
"""Validate data/body-pain-map.json: schema fields, unique ids/aliases, sample phrases."""

from __future__ import annotations

import json
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MAP_PATH = ROOT / "data" / "body-pain-map.json"

ID_RE = re.compile(r"^[a-z0-9_]+$")
SIDES = {"left", "right", "midline", "bilateral", "na"}
SURFACES = {"anterior", "posterior", "lateral", "any"}

# Phrases that should resolve uniquely via longest alias / contains match
SAMPLE_PHRASES = [
    ("ปวดบ่าขวาเมื่อย", "shoulder_right"),
    ("เอวด้านซ้าย", "lumbar_left"),
    ("ต้นคอ", "cervical_posterior"),
    ("สะบักขวา", "scapula_right"),
    ("ลิ้นปี่", "epigastric"),
    ("รอบสะดือ", "abdomen_umbilical"),
    ("ท้องน้อย", "abdomen_lower"),
    ("สีข้างขวา", "flank_right"),
    ("เข่าซ้าย", "knee_left"),
    ("น่องขวา", "calf_right"),
    ("ข้อเท้าซ้าย", "ankle_foot_left"),
    ("ก้นกบ", "sacrum_coccyx"),
    ("หน้าอก", "chest_anterior"),
    ("สะโพกขวา", "hip_right"),
    ("มือซ้ายชา", "wrist_hand_left"),
    ("หลังส่วนบน", "upper_back"),
    ("ข้อศอกขวา", "elbow_forearm_right"),
    ("ต้นขาซ้าย", "thigh_left"),
    ("ก้นซ้าย", "buttock_left"),
    ("ปวดหัว", "head_cranial"),
    ("ไหล่ซ้าย", "shoulder_left"),
    ("เอวขวา", "lumbar_right"),
]


def resolve(text: str, alias_index: list[tuple[str, str]]) -> str | None:
    """Pick region whose alias is contained in text; longest alias wins."""
    t = text.strip().lower()
    best_id = None
    best_len = -1
    for alias, rid in alias_index:
        a = alias.lower()
        if a in t and len(a) > best_len:
            best_id = rid
            best_len = len(a)
    return best_id


def main() -> int:
    data = json.loads(MAP_PATH.read_text(encoding="utf-8"))
    errors: list[str] = []

    if "version" not in data:
        errors.append("missing version")
    if not data.get("disclaimer_th"):
        errors.append("missing disclaimer_th")
    regions = data.get("regions")
    if not isinstance(regions, list) or not regions:
        errors.append("regions must be a non-empty list")
        print_report(errors, 0, 0)
        return 1

    ids = [r.get("id") for r in regions]
    id_counts = Counter(ids)
    for rid, n in id_counts.items():
        if n > 1:
            errors.append(f"duplicate id: {rid}")

    alias_owner: dict[str, str] = {}
    alias_index: list[tuple[str, str]] = []

    for r in regions:
        rid = r.get("id", "")
        if not isinstance(rid, str) or not ID_RE.match(rid):
            errors.append(f"invalid id: {rid!r}")
        for field in ("name_th", "aliases", "patient_blurb_th"):
            if field not in r or r[field] in (None, "", []):
                errors.append(f"{rid}: missing {field}")
        side = r.get("side")
        if side not in SIDES:
            errors.append(f"{rid}: invalid side {side!r}")
        surface = r.get("surface")
        if surface not in SURFACES:
            errors.append(f"{rid}: invalid surface {surface!r}")
        aliases = r.get("aliases") or []
        if not isinstance(aliases, list):
            errors.append(f"{rid}: aliases must be list")
            continue
        for alias in aliases:
            if not isinstance(alias, str) or not alias.strip():
                errors.append(f"{rid}: empty alias")
                continue
            key = alias.strip().lower()
            if key in alias_owner and alias_owner[key] != rid:
                errors.append(
                    f"duplicate alias {alias!r}: {alias_owner[key]} vs {rid}"
                )
            else:
                alias_owner[key] = rid
            alias_index.append((alias.strip(), rid))

    # Prefer longer aliases first is handled in resolve by length compare
    sample_ok = 0
    for phrase, expected in SAMPLE_PHRASES:
        got = resolve(phrase, alias_index)
        if got != expected:
            errors.append(f"sample {phrase!r} → {got!r}, expected {expected!r}")
        else:
            sample_ok += 1

    print_report(errors, len(regions), sample_ok)
    return 1 if errors else 0


def print_report(errors: list[str], n_regions: int, sample_ok: int) -> None:
    print(f"map: {MAP_PATH}")
    print(f"regions: {n_regions}")
    print(f"sample phrases ok: {sample_ok}/{len(SAMPLE_PHRASES)}")
    if errors:
        print(f"ERRORS ({len(errors)}):")
        for e in errors:
            print(f"  - {e}")
    else:
        print("OK")


if __name__ == "__main__":
    sys.exit(main())
