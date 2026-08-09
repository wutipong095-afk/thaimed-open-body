# Hotcache — Body Pain 3D

อัปเดต: 2026-08-09

## สถานะปัจจุบัน

- **Phase:** 1 Region Map ✅ → ถัดไป Phase 2 MVP 2D
- **Repo:** https://github.com/wutipong095-afk/body-pain-3d (private)
- **Local path:** `D:\obsidian\body-pain-3d`
- **คลังความรู้:** `D:\obsidian\body-xambrain` (local only, ไม่ push)
- **Map:** `data/body-pain-map.json` — 37 โซน · validate 22/22 OK

## Last checkpoint (2026-08-09) — Phase 1

- สร้าง region map เต็ม: ศีรษะ/คอ · อก/ท้อง · หลัง · แขน · ขา
- aliases ไทย + อังกฤษ · wiki_refs · sen_refs · patient_blurb
- `disclaimer_th` ใน root ของ map + อัปเดต schema
- `scripts/validate-map.py` — ตรวจ id/alias ซ้ำ + sample phrases

## Prev checkpoint (2026-08-09) — Phase 0

- สร้าง repo + scaffold + roadmap

## สิ่งที่ทำแล้ว

1. ~~GitHub repo private~~ ✅
2. ~~Schema + example regions~~ ✅
3. ~~Architecture + roadmap~~ ✅
4. ~~Region map 37 โซน + validator~~ ✅

## ต้องทำต่อ

1. MVP UI 2D คลิกได้ (static HTML ใน `web/`)
2. Text resolver ใน UI
3. (หลังนั้น) bridge ไป RAG vault / 3D

## Open questions

- สแต็ก UI: static HTML หรือ Vite? → เอียงไป static ตาม roadmap
- โมเดล 3D จะหาจากไหน (license + แยก mesh)?
