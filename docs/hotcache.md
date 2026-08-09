# Hotcache — Body Pain 3D

อัปเดต: 2026-08-09

## สถานะปัจจุบัน

- **Branch:** `feat/zanatomy-glb` (ห้ามทำงานบน main)
- **Phase:** Z-Anatomy GLB ในโหมด 3D
- **โมเดล local:** `web/models/zanatomy-muscles-web.glb` (~23 MB, Draco) — ไม่ commit
- **รัน:** `python scripts/serve-web.py` → http://127.0.0.1:8787/web/ → กด **3D**

## Last — Z-Anatomy integration

- โหลด GLB + DRACOLoader
- คลิกกล้ามเนื้อ → map ไป `region_id` (ชื่อ Latin + ตำแหน่ง)
- แสดงชื่อกล้ามเนื้อ · เครดิต CC BY-SA
- fallback กล่องถ้าโหลดโมเดลไม่ได้

## ต้องทำต่อ

1. ทดลองคลิกหลายโซน ปรับ heuristic ใน `muscleRegion.js` ถ้า map เพี้ยน
2. Merge เมื่อผู้ใช้สั่ง
3. (ทางเลือก) ตาราง map ชื่อมัดละเอียดขึ้น
