# Body Pain 3D

เครื่องมือสื่อสารกับผู้ป่วยผ่านแผนที่ร่างกาย (2D → 3D)  
เลือกบริเวณเจ็บปวดด้วยการคลิก หรือพิมพ์อาการเป็นภาษาไทย แล้วได้คำอธิบายโครงสร้าง + มุมมองแพทย์แผนไทย

> **เพื่อการศึกษาและการสื่อสารเท่านั้น — ไม่ใช่การวินิจฉัยหรือคำปรึกษาทางการแพทย์**

## ความสัมพันธ์กับคลังความรู้

ความรู้ anatomy / TTM อยู่ใน vault ท้องถิ่น **body-xambrain** (ไม่ push ขึ้น GitHub — ขนาดใหญ่ ~PDF/รูปหลาย GB)  
repo นี้เก็บเฉพาะแอป + schema แผนที่บริเวณเจ็บ

| แหล่ง | บทบาท |
|--------|--------|
| `body-xambrain` (local) | concept nodes, RAG embeddings, ข้อสอบ |
| `body-pain-3d` (repo นี้) | UI คลิก/พิมพ์ · region map · API ชั้นสื่อสาร |

## แผนพัฒนา

ดูรายละเอียดและเกณฑ์ผ่านใน [docs/roadmap.md](docs/roadmap.md)  
สถานะ session ล่าสุด: [docs/hotcache.md](docs/hotcache.md)

| Phase | สรุป | สถานะ |
|-------|------|--------|
| 0 Scaffold | repo + schema | ✅ |
| 1 Region Map | ~30 โซน + aliases | ถัดไป |
| 2 MVP 2D | คลิกหน้า/หลัง | รอ |
| 3 Text | พิมพ์อาการ → region | รอ |
| 4 Knowledge | เชื่อม vault / RAG | รอ |
| 5 3D | Three.js + mesh ตาม id | รอ |
| 6 Polish | mobile / UX | รอ |

## โครงสร้าง

```
data/body-pain-map.schema.json  — schema ของแผนที่โซน
data/body-pain-map.example.json — ตัวอย่าง region + aliases
docs/roadmap.md                 — โรดแมปเต็ม
docs/hotcache.md                — สถานะ + checkpoint
docs/architecture.md            — สถาปัตยกรรม
web/                            — UI (จะเติมภายหลัง)
```

## สถานะ

Phase 0 เสร็จ — ยังไม่มี UI / API รันได้ · งานถัดไป = ขยาย region map