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

1. **MVP** — แผนที่ 2D หน้า/หลัง + hotspot + `region_id`
2. **ข้อความ** — พิมพ์อาการไทย → resolve เป็น `region_id`
3. **อธิบาย** — ดึงจาก mapping + (ทางเลือก) RAG จาก vault ท้องถิ่น
4. **3D** — Three.js / โมเดล low-poly ใช้ `region_id` ชุดเดิม

## โครงสร้าง

```
data/body-pain-map.schema.json  — schema ของแผนที่โซน
data/body-pain-map.example.json — ตัวอย่าง region + aliases
docs/architecture.md            — สถาปัตยกรรม
web/                            — UI (จะเติมภายหลัง)
```

## สถานะ

Scaffold เริ่มต้น — ยังไม่มี UI / API รันได้
