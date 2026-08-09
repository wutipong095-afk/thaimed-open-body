# Architecture

## Flow

```
คลิกโซน / พิมพ์อาการ
        ↓
Region Resolver  →  region_id
        ↓
Knowledge lookup → body-pain-map + (optional) local RAG
        ↓
คำอธิบายภาษาผู้ป่วย + ไฮไลต์บนร่างกาย + disclaimer
```

## Inputs

1. **คลิก** — mesh / hotspot ส่ง `region_id` โดยตรง
2. **พิมพ์** — aliases ไทย → `region_id` (ถ้าคลุมเครือ → ถามซ้าย/ขวา หน้า/หลัง)

## Outputs (MVP)

- ไฮไลต์โซนบนแผนที่
- ข้อความสั้น: โครงสร้างใกล้เคียง (Layer S) + เส้น/มุมมองแผนไทย (Layer T)
- คำถามซักต่อ (ไม่ใช่การวินิจฉัยโรค)
- disclaimer ทุกหน้าจอ

## Non-goals (ระยะแรก)

- วินิจฉัยโรคอัตโนมัติ
- เก็บประวัติผู้ป่วยจริง / EMR
- push คลัง PDF/รูปจาก body-xambrain ขึ้น GitHub
