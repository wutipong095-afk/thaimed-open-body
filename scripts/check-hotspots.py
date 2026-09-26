#!/usr/bin/env python3
"""Check 2D SVG hotspots in web/index.html against data/body-pain-map.json.

- every data-region exists in the map
- every map region is clickable in at least one view
- region-followups.json only references known regions
- left/right hotspots sit on the correct side of the figure:
  anterior (patient faces viewer) → patient's right is on the viewer's LEFT
  posterior (viewer behind patient) → patient's right is on the viewer's RIGHT
"""

from __future__ import annotations

import json
import sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML_PATH = ROOT / "web" / "index.html"
MAP_PATH = ROOT / "data" / "body-pain-map.json"
FOLLOWUPS_PATH = ROOT / "data" / "region-followups.json"

VIEWS = ("view-anterior", "view-posterior")


class HotspotParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.view: str | None = None
        self.hotspots: dict[str, list[tuple[str, float]]] = {v: [] for v in VIEWS}
        self.view_center: dict[str, float] = {}

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        a = dict(attrs)
        if tag == "svg" and a.get("id") in VIEWS:
            self.view = a["id"]
            _, _, w, _ = (float(n) for n in (a.get("viewbox") or "0 0 0 0").split())
            self.view_center[self.view] = w / 2
            return
        region = a.get("data-region")
        if self.view and region:
            if tag == "ellipse":
                cx = float(a["cx"])
            else:
                cx = float(a["x"]) + float(a["width"]) / 2
            self.hotspots[self.view].append((region, cx))

    def handle_endtag(self, tag: str) -> None:
        if tag == "svg":
            self.view = None


def main() -> int:
    regions = json.loads(MAP_PATH.read_text(encoding="utf-8"))["regions"]
    sides = {r["id"]: r["side"] for r in regions}
    followups = json.loads(FOLLOWUPS_PATH.read_text(encoding="utf-8"))

    parser = HotspotParser()
    parser.feed(HTML_PATH.read_text(encoding="utf-8"))

    errors: list[str] = []
    seen: set[str] = set()
    for view in VIEWS:
        spots = parser.hotspots[view]
        if not spots:
            errors.append(f"{view}: no hotspots found")
            continue
        center = parser.view_center[view]
        for region, cx in spots:
            seen.add(region)
            side = sides.get(region)
            if side is None:
                errors.append(f"{view}: unknown region {region}")
                continue
            if side not in ("left", "right"):
                continue
            on_viewer_right = cx > center
            # anterior mirrors the patient; posterior does not
            patient_right = on_viewer_right if view == "view-posterior" else not on_viewer_right
            if (side == "right") != patient_right:
                where = "viewer's right" if on_viewer_right else "viewer's left"
                errors.append(f"{view}: {region} is on the {where} (cx={cx:g})")

    for rid in sides:
        if rid not in seen:
            errors.append(f"region {rid} has no hotspot in any 2D view")

    for rid in followups.get("by_id", {}):
        if rid not in sides:
            errors.append(f"region-followups.json: unknown region {rid}")

    counts = ", ".join(f"{v}: {len(parser.hotspots[v])}" for v in VIEWS)
    print(f"hotspots — {counts}")
    if errors:
        for e in errors:
            print(f"ERROR: {e}")
        return 1
    print("OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
