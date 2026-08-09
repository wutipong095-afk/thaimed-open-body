# Roadmap — Body Pain 3D

อัปเดตล่าสุด: 2026-08-09  
สถานะปัจจุบัน: **Phase 6 — Polish** (บนกิ่ง `feat/phase6-polish`)

> เพื่อการศึกษาและการสื่อสารเท่านั้น — ไม่ใช่การวินิจฉัยทางการแพทย์

---

## ภาพรวมเฟส

| Phase | ชื่อ | เป้าหมาย | สถานะ |
|-------|------|----------|--------|
| 0 | Scaffold | repo + schema + สถาปัตยกรรม | ✅ เสร็จ |
| 1 | Region Map | ~30 โซน + aliases ไทยครบ | ✅ เสร็จ (37 โซน) |
| 2 | MVP 2D | คลิกหน้า/หลัง + แผงอธิบาย | ✅ เสร็จ |
| 3 | Text input | พิมพ์อาการ → `region_id` | ✅ พื้นฐานใน UI |
| 4 | Knowledge bridge | เชื่อมคลัง body-xambrain (local) | ✅ เสร็จ (อ่าน wiki local) |
| 5 | 3D | Three.js procedural + region_id | ✅ MVP (ยังไม่มี GLB) |
| 6 | Polish | ผู้ป่วย/ผู้เรียน · PWA · session | ✅ บนกิ่ง feat/phase6-polish |

---

## Phase 0 — Scaffold ✅

- [x] สร้าง GitHub repo (private): `body-pain-3d`
- [x] แยกจาก vault `body-xambrain` (ไม่ push PDF/รูป)
- [x] schema + ตัวอย่าง `body-pain-map`
- [x] `docs/architecture.md`
- [x] roadmap + hotcache

**Checkpoint:** 2026-08-09 — initial scaffold + roadmap

---

## Phase 1 — Region Map ✅

**ผลลัพธ์:** `data/body-pain-map.json` — **37 โซน**

- [x] กำหนด taxonomy: ศีรษะ/คอ · ลำตัวหน้า · ลำตัวหลัง · แขน · ขา
- [x] ใส่ `side` + `surface` ให้ครบ
- [x] aliases ภาษาผู้ป่วย (บ่า, สะบัก, เอว, สะโพก, น่อง…)
- [x] ลิงก์ `wiki_refs` / `sen_refs` ไป concept ใน vault
- [x] `patient_blurb_th` สั้น ๆ ทุกโซน + `disclaimer_th` คงที่
- [x] สคริปต์ตรวจ: `python scripts/validate-map.py` (22/22 sample phrases)

**เกณฑ์ผ่าน:** พิมพ์คำทั่วไปอย่างน้อย 20 คำ map ถูกโซน — ✅  
**Checkpoint:** 2026-08-09 — Phase 1 map + validator

---

## Phase 2 — MVP 2D UI ✅

**ผลลัพธ์:** `web/` + `python scripts/serve-web.py` → http://127.0.0.1:8787/web/

- [x] SVG ร่างกายด้านหน้า + ด้านหลัง
- [x] hotspot ผูก `region_id`
- [x] คลิกแล้วไฮไลต์โซน
- [x] แผงขวา: ชื่อโซน · blurb · Layer S/T ย่อ · disclaimer
- [x] สลับมุมมอง หน้า ↔ หลัง
- [x] แตะบนมือถือได้ (touch-action + layout เดียวคอลัมน์)

**เกณฑ์ผ่าน:** คลิกโซนแล้วได้คำอธิบายจาก map — ✅  
**Checkpoint:** 2026-08-09 — static HTML MVP

---

## Phase 3 — Text → Region ✅ (พื้นฐาน)

**ผลลัพธ์:** ช่องพิมพ์ในแผงขวา

- [x] resolver: longest alias contains-match (`web/js/resolve.js`)
- [x] ถ้าคลุมเครือเรื่องซ้าย/ขวา → ข้อความถามกลับ
- [x] ไฮไลต์โซนเดียวกับเส้นทางคลิก + สลับมุมมองอัตโนมัติถ้าจำเป็น
- [ ] ประวัติคำค้นสั้น ๆ ใน session (ยังไม่ทำ)

**เกณฑ์ผ่าน:** “ปวดบ่าขวาเมื่อย” / “เอวด้านซ้าย” — ใช้ logic เดียวกับ validate-map

---

## Phase 4 — Knowledge bridge ✅

**ผลลัพธ์:** `/api/knowledge` + แผงแยกแหล่ง · บนกิ่ง `feat/phase4-knowledge-bridge`

- [x] อ่าน `wiki_refs` จาก vault local (`BODY_XAMBRAIN_VAULT`, ค่าเริ่มต้น sibling path)
- [ ] เรียก RAG `localhost:8765` (ยังไม่ทำ — อ่าน markdown ตรงก่อน)
- [x] แยกป้าย: จากแผนที่ / คำถามซักต่อ / จากคลัง
- [x] คำถามซักต่อตามโซนใน `data/region-followups.json`
- [x] ไม่มีคลัง → ยังใช้ blurb จาก map ได้

**เกณฑ์ผ่าน:** โหมด map-only ยังใช้ได้ — ✅  
**API:** `GET /api/health` · `GET /api/knowledge?region_id=…`

---

## Phase 5 — 3D ✅ (MVP procedural)

**ผลลัพธ์:** โหมด 3D ใน UI · บนกิ่ง `feat/phase5-prep`

- [x] ใช้กล่อง low-poly สร้างเอง (ยังไม่โหลด GLB — ไม่ติด license)
- [x] hit mesh ตาม `region_id` ชุดเดียวกับแผนที่
- [x] Three.js + OrbitControls (`web/js/body3d.js`, CDN importmap)
- [x] sync ไฮไลต์กับแผงอธิบาย + text resolver
- [x] fallback / สลับกลับ 2D · ถ้า WebGL ไม่ได้จะบังคับ 2D

**เกณฑ์ผ่าน:** คลิกใน 3D เปิดแผงเดียวกับ 2D — ✅  
**ถัดไป (optional):** เปลี่ยนเป็นโมเดล anatomy ที่มีใบอนุญาตชัด

---

## Phase 6 — Polish (หลังมี 3D ใช้ได้)

- [ ] โหมด “สำหรับผู้ป่วย” vs “สำหรับผู้เรียน”
- [ ] ภาษา UI ไทยเป็นหลัก
- [ ] PWA / เปิดบนแท็บเล็ตในคลินิกฝึก
- [ ] บันทึก session เป็นโน้ตท้องถิ่น (ไม่ขึ้นคลาวด์) — ทางเลือก
- [ ] เอกสารผู้ใช้สั้น ๆ ใน `docs/user-guide.md`

---

## นอกขอบเขต (จนกว่าจะตัดสินใจใหม่)

- วินิจฉัยโรค / แนะนำยาอัตโนมัติ
- เก็บ PHI / เชื่อม EMR
- push vault `body-xambrain` ทั้งก้อนขึ้น GitHub
- anatomy 3D ระดับตำราแพทย์ (กล้ามเนื้อทุกมัด)

---

## จุดตัดสินใจที่เปิดอยู่

| หัวข้อ | ตัวเลือก | โน้ต |
|--------|----------|------|
| สแต็ก UI Phase 2 | static HTML vs Vite | เริ่ม static ได้เร็วกว่า |
| แหล่งความรู้ Phase 4 | map อย่างเดียว vs เรียก RAG | RAG = optional |
| โมเดล 3D | หา CC/ฟรี vs สร้างเอง | ต้องแยก mesh ตามโซนได้ |
| Deploy | localhost only vs GitHub Pages | Pages ได้ถ้าไม่มี secret |

---

## ลำดับงานถัดไปทันที

1. Review/merge กิ่ง `feat/phase5-prep` เข้า main เมื่อพร้อม
2. (ทางเลือก) โมเดล GLB แทนกล่อง · หรือต่อ RAG
3. Phase 6 — Polish
