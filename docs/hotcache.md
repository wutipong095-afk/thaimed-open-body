# Hotcache — Body Pain 3D

อัปเดต: 2026-08-09

## สถานะปัจจุบัน

- **Phase:** 2 MVP 2D ✅ (+ Phase 3 text พื้นฐาน) → ถัดไป Phase 4 หรือ polish UI
- **Repo:** https://github.com/wutipong095-afk/body-pain-3d (private)
- **Local path:** `D:\obsidian\body-pain-3d`
- **รัน UI:** `python scripts/serve-web.py` → http://127.0.0.1:8787/web/
- **Map:** 37 โซน · validate 22/22 OK

## Last checkpoint (2026-08-09) — Phase 2/3

- `web/index.html` + CSS + SVG hotspot หน้า/หลัง
- แผงอธิบายจาก `body-pain-map.json` + disclaimer
- ช่องพิมพ์ + `web/js/resolve.js` (longest alias)
- `scripts/serve-web.py` เสิร์ฟจาก root ของ repo

## Prev — Phase 1

- region map 37 โซน + `scripts/validate-map.py`

## สิ่งที่ทำแล้ว

1. ~~GitHub repo private~~ ✅
2. ~~Schema + example regions~~ ✅
3. ~~Architecture + roadmap~~ ✅
4. ~~Region map 37 โซน + validator~~ ✅
5. ~~MVP 2D UI + text resolve พื้นฐาน~~ ✅

## ต้องทำต่อ

1. Knowledge bridge (Phase 4) — optional RAG จาก vault
2. ปรับรูป SVG / ภาพร่างกายให้อ่านง่ายขึ้น
3. Phase 5 — 3D

## Open questions

- โมเดล 3D จะหาจากไหน (license + แยก mesh)?
- Phase 4 จะเรียก chat_server ของ vault หรืออ่าน markdown ตรง?
