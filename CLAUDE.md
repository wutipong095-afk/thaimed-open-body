# CLAUDE.md — Body Pain 3D

ไฟล์นี้คือกติกากลางสำหรับ Claude ทุกที่ที่ทำงานกับ repo นี้ ทั้งเครื่อง local (Windows) และ Claude Code บนคลาวด์ (Linux)
memory ของ Claude บนเครื่อง local ไม่ตามไปคลาวด์ — กติกาที่ต้องใช้ร่วมกันต้องอยู่ในไฟล์นี้

> เพื่อการศึกษาและการสื่อสารเท่านั้น — ไม่ใช่การวินิจฉัยทางการแพทย์ (ข้อความ UI ต้องคง disclaimer นี้)

## ภาษา

- ตอบผู้ใช้เป็นภาษาไทย
- UI, เอกสารใน `docs/` และ README เป็นภาษาไทย · ชื่อตัวแปร/ฟังก์ชัน และ commit message เป็นภาษาอังกฤษ

## Git workflow

- **ห้ามทำงานหรือ commit บน `main`** — สร้างกิ่งก่อนเสมอ (`feat/…`, `fix/…`, `docs/…`, `chore/…`; งานจากคลาวด์ใช้ `claude/…` ได้)
- เข้า `main` ผ่าน PR เท่านั้น และ merge เมื่อ CI ผ่านและผู้ใช้สั่งเท่านั้น
- หนึ่งกิ่ง = ผู้ทำคนเดียว: อย่าให้ local กับคลาวด์แก้กิ่งเดียวกันพร้อมกัน
- เริ่มงานให้ `git pull` · ก่อนส่งต่ออีกฝั่งให้ `git push`
- กิ่งที่อยู่นาน ให้ merge `origin/main` เข้าบ่อย ๆ — `web/index.html` เป็นไฟล์ที่ชนบ่อย
- Line endings เป็น LF ทั้งหมด (บังคับด้วย `.gitattributes`) อย่า commit CRLF

## รันและตรวจ

```bash
python scripts/serve-web.py          # http://127.0.0.1:8787/web/  (ต้องเสิร์ฟผ่าน HTTP)
python scripts/validate-map.py       # ตรวจ data/body-pain-map.json
python scripts/check-hotspots.py     # ตรวจจุดคลิก 2D ใน web/index.html
python scripts/check-offline.py      # ไม่มี CDN · sw.js cache ครบ · CSP hash ตรง importmap
for f in web/js/*.js web/sw.js; do node --check "$f"; done
```

- สคริปต์ Python ใช้ stdlib ล้วน ไม่ต้อง pip install · Node ใช้แค่ `node --check` และ audit
- CI (`.github/workflows/ci.yml`) รันชุดข้างบนทุก PR — รันเองให้ผ่านก่อน push
- `node scripts/audit-region-map.mjs` ต้องใช้ไฟล์ GLB → รันได้เฉพาะเครื่อง local

## สิ่งที่ไม่มีใน repo (คลาวด์จะไม่เห็น)

| สิ่งที่ขาด | ผลกระทบ |
|---|---|
| โมเดล 3D `web/models/*.glb` (~23 MB, gitignored) | หน้า 3D และ audit ใช้ไม่ได้บนคลาวด์ — งานที่ต้องดู/มาร์กบนโมเดลให้ทำที่ local |
| คลังความรู้ `body-xambrain` (vault local, env `BODY_XAMBRAIN_VAULT`) | `/api/knowledge` ไม่มีข้อมูล — อย่าแก้โค้ดให้พังเมื่อไม่มี vault |
| `.env` / secrets | ห้าม commit · บนคลาวด์ตั้งเป็น environment variables |
| `data/embeddings.json` | สร้างจาก vault ที่ local เท่านั้น |

ห้าม commit ไฟล์จาก `body-xambrain` (PDF/รูป/ข้อสอบ) ขึ้น repo นี้

## โครงสร้างและข้อควรรู้

- `data/body-pain-map.json` — โซนหลัก (`region_id` + aliases ไทย) ต้องตรง schema `data/body-pain-map.schema.json`
- `data/region-followups.json` — คำถามซักต่อ อ้างได้เฉพาะ `region_id` ที่มีจริง
- `web/index.html` — SVG 2D hotspots (`data-region`)
- `web/js/muscleRegion.js` — map ชื่อกล้ามเนื้อใน GLB → `region_id`; ระวังการ map ข้ามแขน/ขา (เช่น มือ→น่อง, เท้า→แขน)
- `web/sen/` + `web/js/sen*.js` — หน้าสอนเส้นประธาน 10 (มาร์กเส้นทาง 3D ด้วยมือ เก็บใน localStorage)
- **Offline-first / Local-first:** แอปต้องทำงานบนเครื่องผู้ใช้ได้โดยไม่ต้องมีเซิร์ฟเวอร์
  - ห้ามโหลดสคริปต์/ฟอนต์/ไฟล์จาก CDN — ไลบรารีภายนอกอยู่ใน `web/vendor/` (ดู README ในนั้น)
  - เพิ่มหรือเปลี่ยนไฟล์ใน `web/` → อัปเดต `ASSETS` และเปลี่ยนชื่อ `SHELL_CACHE` ใน `web/sw.js`
  - แก้ `<script type="importmap">` → อัปเดต sha256 ใน CSP (`check-offline.py` บอกค่าที่ถูก)
  - ห้ามเก็บข้อมูลผู้ใช้บนเซิร์ฟเวอร์ ห้ามเพิ่มระบบจ่ายเงิน/ล็อกอิน · ห้ามใส่ API key ในหน้าเว็บ
- ซ้าย/ขวา = ของผู้ป่วยเสมอ: มุมมองหน้า (anterior) ขวาของผู้ป่วยอยู่ทางซ้ายของจอ · มุมมองหลัง (posterior) ขวาของผู้ป่วยอยู่ทางขวาของจอ
- สถานะงานล่าสุด: `docs/hotcache.md` · แผน: `docs/roadmap.md` — อัปเดต hotcache เมื่อจบงานสำคัญ
