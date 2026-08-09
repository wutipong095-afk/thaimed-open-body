# Body Pain 3D

เครื่องมือสื่อสารกับผู้ป่วยผ่านแผนที่ร่างกาย (2D → 3D)  
เลือกบริเวณเจ็บปวดด้วยการคลิก หรือพิมพ์อาการเป็นภาษาไทย แล้วได้คำอธิบายโครงสร้าง + มุมมองแพทย์แผนไทย

> **เพื่อการศึกษาและการสื่อสารเท่านั้น — ไม่ใช่การวินิจฉัยหรือคำปรึกษาทางการแพทย์**

## เปิดใช้ (MVP 2D)

```powershell
cd D:\obsidian\body-pain-3d
python scripts/serve-web.py
```

เปิดเบราว์เซอร์ที่ http://127.0.0.1:8787/web/  
(ต้องเสิร์ฟผ่าน HTTP — เปิดไฟล์ตรง ๆ จะโหลด `body-pain-map.json` ไม่ได้)

## ความสัมพันธ์กับคลังความรู้

ความรู้ anatomy / TTM อยู่ใน vault ท้องถิ่น **body-xambrain** (ไม่ push ขึ้น GitHub)  
repo นี้เก็บแอป + schema แผนที่บริเวณเจ็บ

| แหล่ง | บทบาท |
|--------|--------|
| `body-xambrain` (local) | concept nodes, RAG embeddings, ข้อสอบ |
| `body-pain-3d` (repo นี้) | UI คลิก/พิมพ์ · region map |

## แผนพัฒนา

ดู [docs/roadmap.md](docs/roadmap.md) · สถานะ [docs/hotcache.md](docs/hotcache.md)

| Phase | สรุป | สถานะ |
|-------|------|--------|
| 0 Scaffold | repo + schema | ✅ |
| 1 Region Map | 37 โซน + aliases | ✅ |
| 2 MVP 2D | คลิกหน้า/หลัง | ✅ |
| 3 Text | พิมพ์อาการ → region | ✅ พื้นฐาน |
| 4 Knowledge | เชื่อม vault / RAG | ถัดไป |
| 5 3D | Three.js + mesh ตาม id | รอ |
| 6 Polish | mobile / UX | รอ |

## โครงสร้าง

```
data/body-pain-map.json   — แผนที่โซนหลัก
web/                      — UI 2D (HTML/CSS/JS + SVG)
scripts/serve-web.py      — เปิดเซิร์ฟเวอร์ท้องถิ่น :8787
scripts/validate-map.py   — ตรวจ map
docs/                     — roadmap · hotcache · architecture
```

## ตรวจ map

```powershell
python scripts/validate-map.py
```
