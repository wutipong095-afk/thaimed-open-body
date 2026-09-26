# docs-media — สร้างแผนภาพและภาพหน้าจอใหม่

ใช้เมื่อแอปหรือสถาปัตยกรรมเปลี่ยน แล้วต้องการอัปเดตภาพใน `docs/diagrams/` และ `docs/screenshots/`
รันจาก root ของ repo

| สคริปต์ | ทำอะไร | ต้องมี |
|---|---|---|
| `diagrams.py` | สร้างแผนภาพ 3 ภาพเป็น SVG (ต้นฉบับ แก้ข้อความ/สถานะที่นี่) → `docs/diagrams/*.svg` | Python (stdlib) |
| `render-diagrams.mjs` | แปลง SVG → PNG ด้วยฟอนต์ Sarabun ของแอป | Node + Chrome + `puppeteer-core` |
| `screenshots.mjs` | ถ่ายภาพหน้าจอ 4 ภาพจากเว็บจริง → `docs/screenshots/` | Node + Chrome + `puppeteer-core` |

```bash
python scripts/docs-media/diagrams.py
```

```bash
npm install --no-save puppeteer-core@23
```

```bash
node scripts/docs-media/render-diagrams.mjs
```

```bash
node scripts/docs-media/screenshots.mjs
```

- ตั้ง `CHROME_PATH` ถ้า Chrome ไม่ได้อยู่ที่ตำแหน่งเริ่มต้นของ Windows
- ตั้ง `APP_URL` เพื่อถ่ายจากเครื่องตัวเอง เช่น `http://127.0.0.1:8787/web/` (ค่าเริ่มต้นคือเว็บจริงบน GitHub Pages)
- สคริปต์ใช้ browser profile ชั่วคราวทุกครั้ง ภาพจึงไม่ติด cache เวอร์ชันเก่า
