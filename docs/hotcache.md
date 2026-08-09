# Hotcache — Body Pain 3D

อัปเดต: 2026-08-09

## สถานะปัจจุบัน

- **Branch:** `feat/phase4-knowledge-bridge`
- **Phase:** 4 Knowledge bridge ✅ → ถัดไป Phase 5 หรือ merge เข้า main
- **Repo:** https://github.com/wutipong095-afk/body-pain-3d (private)
- **รัน UI:** `python scripts/serve-web.py` → http://127.0.0.1:8787/web/
- **Vault path:** `BODY_XAMBRAIN_VAULT` หรือค่าเริ่มต้น `D:\obsidian\body-xambrain`

## Last checkpoint (2026-08-09) — Phase 4

- กิ่งใหม่ `feat/phase4-knowledge-bridge`
- `GET /api/knowledge?region_id=` ดึง blurb + followups + wiki excerpt
- `data/region-followups.json` คำถามซักต่อทุกโซน
- UI แยกป้าย: จากแผนที่ / คำถามซักต่อ / จากคลัง
- ไม่มีคลัง → map-only ยังใช้ได้

## Prev — Phase 2/3 + fix ด้านหลัง

- MVP 2D · text resolve · แก้ SVG `hidden` → class `is-visible`

## ต้องทำต่อ

1. Review/merge กิ่ง Phase 4
2. (ทางเลือก) ต่อ RAG chat_server
3. Phase 5 — 3D

## Open questions

- โมเดล 3D จะหาจากไหน (license + แยก mesh)?
