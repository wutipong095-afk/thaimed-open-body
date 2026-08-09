# Roadmap — Body Pain 3D

อัปเดตล่าสุด: 2026-08-09  
สถานะปัจจุบัน: **Phase 0 — Scaffold** ✅

> เพื่อการศึกษาและการสื่อสารเท่านั้น — ไม่ใช่การวินิจฉัยทางการแพทย์

---

## ภาพรวมเฟส

| Phase | ชื่อ | เป้าหมาย | สถานะ |
|-------|------|----------|--------|
| 0 | Scaffold | repo + schema + สถาปัตยกรรม | ✅ เสร็จ |
| 1 | Region Map | ~30 โซน + aliases ไทยครบ | 🔲 ถัดไป |
| 2 | MVP 2D | คลิกหน้า/หลัง + แผงอธิบาย | 🔲 |
| 3 | Text input | พิมพ์อาการ → `region_id` | 🔲 |
| 4 | Knowledge bridge | เชื่อมคลัง body-xambrain (local) | 🔲 |
| 5 | 3D | โมเดล low-poly ใช้ id เดิม | 🔲 |
| 6 | Polish | UX ผู้ป่วย + mobile + deploy ทดลอง | 🔲 |

---

## Phase 0 — Scaffold ✅

- [x] สร้าง GitHub repo (private): `body-pain-3d`
- [x] แยกจาก vault `body-xambrain` (ไม่ push PDF/รูป)
- [x] schema + ตัวอย่าง `body-pain-map`
- [x] `docs/architecture.md`
- [x] roadmap + hotcache

**Checkpoint:** 2026-08-09 — initial scaffold + roadmap

---

## Phase 1 — Region Map (สัปดาห์ 1)

**ผลลัพธ์:** `data/body-pain-map.json` ใช้งานจริง (~25–40 โซน)

- [ ] กำหนด taxonomy: ศีรษะ/คอ · ลำตัวหน้า · ลำตัวหลัง · แขน · ขา
- [ ] ใส่ `side` + `surface` ให้ครบ
- [ ] aliases ภาษาผู้ป่วย (บ่า, สะบัก, เอว, สะโพก, น่อง…)
- [ ] ลิงก์ `wiki_refs` / `sen_refs` ไป concept ใน vault
- [ ] `patient_blurb_th` สั้น ๆ ทุกโซน + disclaimer คงที่
- [ ] สคริปต์ตรวจ: id ซ้ำ · alias ซ้ำ · schema validate

**เกณฑ์ผ่าน:** พิมพ์คำทั่วไปอย่างน้อย 20 คำ map ถูกโซนโดยไม่ต้องเดา

---

## Phase 2 — MVP 2D UI (สัปดาห์ 1–2)

**ผลลัพธ์:** เปิดเบราว์เซอร์แล้วคลิกโซนได้

- [ ] รูป/SVG ร่างกายด้านหน้า + ด้านหลัง
- [ ] hotspot ผูก `region_id`
- [ ] คลิกแล้วไฮไลต์โซน
- [ ] แผงขวา: ชื่อโซน · blurb · Layer S/T ย่อ · disclaimer
- [ ] สลับมุมมอง หน้า ↔ หลัง
- [ ] ทำงานบนมือถือ (แตะโซนได้)

**เกณฑ์ผ่าน:** คลิก 5 โซนหลักแล้วได้คำอธิบายถูกต้องจาก map

**แนะนำสแต็ก:** HTML/CSS/JS ธรรมดาใน `web/` หรือ Vite เบา ๆ — ยังไม่ต้อง React

---

## Phase 3 — Text → Region (สัปดาห์ 2)

**ผลลัพธ์:** ช่องพิมพ์ “เจ็บตรงไหน”

- [ ] resolver: exact / contains match จาก aliases
- [ ] ถ้าคลุมเครือ → ถามกลับ (ซ้าย/ขวา, หน้า/หลัง)
- [ ] ไฮไลต์โซนเดียวกับเส้นทางคลิก
- [ ] ประวัติคำค้นสั้น ๆ ใน session (ไม่เก็บเซิร์ฟเวอร์)

**เกณฑ์ผ่าน:** ประโยคอย่าง “ปวดบ่าขวาเมื่อย” และ “เอวด้านซ้าย” resolve ถูก

---

## Phase 4 — Knowledge bridge (สัปดาห์ 2–3)

**ผลลัพธ์:** คำอธิบายลึกขึ้นจากคลังท้องถิ่น (optional)

- [ ] อ่าน `wiki_refs` → ดึงข้อความจาก vault path ที่ config ได้
- [ ] หรือเรียก RAG ของ `body-xambrain` (`localhost:8765`) แบบ optional
- [ ] แยกป้าย: จากแผนที่ / จากคลัง / จากโมเดล
- [ ] คำถามซักต่อตามโซน (ไม่ใช่ชื่อโรค)
- [ ] ไม่มี API key → ยังใช้ blurb จาก map ได้

**เกณฑ์ผ่าน:** โหมด offline (map อย่างเดียว) ยังใช้ได้

---

## Phase 5 — 3D (สัปดาห์ 3–5)

**ผลลัพธ์:** หมุนดูร่างกาย คลิก mesh ตาม `region_id` เดิม

- [ ] เลือกโมเดล low-poly + ใบอนุญาตชัด
- [ ] แบ่ง hit mesh / invisible colliders ตาม region map
- [ ] Three.js (หรือ R3F) ใน `web/`
- [ ] sync ไฮไลต์กับแผงอธิบาย + text resolver
- [ ] fallback กลับ 2D ถ้าเครื่องช้า

**เกณฑ์ผ่าน:** คลิกใน 3D ได้ผลเหมือน 2D สำหรับโซนชุดเดียวกัน

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

1. ขยาย `body-pain-map.example.json` → `body-pain-map.json` (~30 โซน)
2. วาง SVG/ภาพ 2D + hotspot ใน `web/`
3. ต่อช่องพิมพ์ + resolver
