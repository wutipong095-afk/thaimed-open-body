# Vendor (self-hosted)

ไลบรารีภายนอกเก็บไว้ในเว็บเอง — ไม่โหลดจาก CDN
เพื่อให้ใช้ออฟไลน์ได้ และไม่เสี่ยงถ้า CDN ถูกเจาะ (supply chain)

| โฟลเดอร์ | ที่มา | เวอร์ชัน | License |
|---|---|---|---|
| `three/build/` | npm `three` (`build/three.module.js`, `three.core.js`) | 0.172.0 | MIT (`three/LICENSE`) |
| `three/addons/` | npm `three` `examples/jsm/` — เฉพาะ GLTFLoader, DRACOLoader, OrbitControls, BufferGeometryUtils | 0.172.0 | MIT |
| `draco/` | npm `three` `examples/jsm/libs/draco/gltf/` (Google Draco decoder) | มากับ three 0.172.0 | Apache-2.0 |
| `fonts/` | npm `@fontsource/sarabun`, `@fontsource/manrope` — เฉพาะ subset thai/latin และน้ำหนักที่ใช้ | 5.3.0 | SIL OFL 1.1 (`fonts/LICENSE-*.txt`) |

## อัปเดต three.js

1. `npm pack three@<version>` แล้วแตกไฟล์
2. คัดลอกไฟล์ชุดเดิมทับ (ตามตารางข้างบน)
3. ถ้า addon ใหม่ import ไฟล์อื่น ให้คัดลอกตามมาด้วย
4. เปลี่ยนชื่อ `CACHE` ใน `web/sw.js` เพื่อให้เครื่องผู้ใช้โหลดชุดใหม่
