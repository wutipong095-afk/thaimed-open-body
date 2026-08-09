# Hotcache — Body Pain 3D

อัปเดต: 2026-08-09

## สถานะปัจจุบัน

- **Branch:** `feat/phase5-prep` (ห้ามทำงานบน main)
- **Phase:** 5 3D MVP ✅ → review/merge แล้วค่อย Phase 6
- **รัน UI:** `python scripts/serve-web.py` → http://127.0.0.1:8787/web/
- **3D:** ปุ่มโหมด **3D** · ลากหมุน · คลิกกล่องโซน · sync กับแผงเดิม

## Last checkpoint — Phase 5 MVP

- `web/js/body3d.js` — Three.js procedural boxes + OrbitControls
- สลับโหมด 2D / 3D · fallback ถ้าไม่มี WebGL
- ใช้ `region_id` ชุดเดียวกับ map + knowledge bridge

## Prev — Phase 4

- `/api/knowledge` · followups · vault excerpts (merged เข้า main แล้ว)

## ต้องทำต่อ

1. Merge `feat/phase5-prep` เมื่อผู้ใช้สั่ง
2. (ทางเลือก) โมเดล GLB แทนกล่อง
3. Phase 6 polish
