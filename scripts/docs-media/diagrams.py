"""Generate the three system diagrams as SVG (Thai labels)."""
import sys
from pathlib import Path
from xml.sax.saxutils import escape

OUT = Path(sys.argv[1] if len(sys.argv) > 1 else "docs/diagrams")
OUT.mkdir(parents=True, exist_ok=True)

STYLES = {
    #        stroke     fill       title
    "app":   ("#1f9e86", "#eef8f5", "#12463c"),
    "key":   ("#d6921f", "#fff4dc", "#6b4506"),
    "plan":  ("#8a9a94", "#f6f7f6", "#4a5a54"),
    "net":   ("#3b6fb6", "#eef3fb", "#1d3a66"),
    "priv":  ("#7a5bb5", "#f4f0fb", "#3e2a66"),
    "guard": ("#c0504d", "#fdf0ef", "#6e1e1c"),
}
TEXT = "#16302a"
MUTED = "#5b6f68"
FONT = "Sarabun, 'Noto Sans Thai', 'Leelawadee UI', Tahoma, sans-serif"


class Svg:
    def __init__(self, w, h, title):
        self.w, self.h = w, h
        self.parts = [
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" '
            f'font-family="{FONT}" role="img" aria-label="{escape(title)}">',
            "<defs>"
            + "".join(
                f'<marker id="ah-{k}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">'
                f'<path d="M0,0 L10,5 L0,10 z" fill="{c}"/></marker>'
                for k, c in {"d": "#50635c", "plan": "#8a9a94", "net": "#3b6fb6", "priv": "#7a5bb5"}.items()
            )
            + "</defs>",
            f'<rect width="{w}" height="{h}" fill="#ffffff"/>',
            f'<text x="40" y="44" font-size="26" font-weight="700" fill="{TEXT}">{escape(title)}</text>',
        ]

    def zone(self, x, y, w, h, label, style):
        s, f, t = STYLES[style]
        self.parts.append(
            f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="18" fill="{f}" fill-opacity="0.45" '
            f'stroke="{s}" stroke-width="2"/>'
            f'<text x="{x + 18}" y="{y + 30}" font-size="17" font-weight="700" fill="{t}">{escape(label)}</text>'
        )

    def box(self, x, y, w, h, title, lines=(), style="app", badge=None):
        s, f, t = STYLES[style]
        dash = ' stroke-dasharray="7 5"' if style == "plan" else ""
        self.parts.append(
            f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="12" fill="{f}" stroke="{s}" stroke-width="2"{dash}/>'
        )
        ty = y + 30
        self.parts.append(f'<text x="{x + 16}" y="{ty}" font-size="17" font-weight="700" fill="{t}">{escape(title)}</text>')
        for i, line in enumerate(lines):
            self.parts.append(
                f'<text x="{x + 16}" y="{ty + 24 + i * 21}" font-size="14" fill="{MUTED}">{escape(line)}</text>'
            )
        if badge:
            bw = 14 + len(badge) * 8.2
            self.parts.append(
                f'<rect x="{x + w - bw - 10}" y="{y - 12}" width="{bw}" height="24" rx="12" fill="{s}"/>'
                f'<text x="{x + w - bw / 2 - 10}" y="{y + 5}" font-size="13" font-weight="700" fill="#fff" text-anchor="middle">{escape(badge)}</text>'
            )

    def arrow(self, pts, label=None, style="d", label_at=None, dashed=False, rotate=0):
        color = {"d": "#50635c", "plan": "#8a9a94", "net": "#3b6fb6", "priv": "#7a5bb5"}[style]
        d = "M" + " L".join(f"{x},{y}" for x, y in pts)
        dash = ' stroke-dasharray="7 5"' if dashed or style == "plan" else ""
        self.parts.append(
            f'<path d="{d}" fill="none" stroke="{color}" stroke-width="2.2"{dash} marker-end="url(#ah-{style})"/>'
        )
        if label:
            lx, ly = label_at or ((pts[0][0] + pts[-1][0]) / 2, (pts[0][1] + pts[-1][1]) / 2 - 8)
            rot = f' transform="rotate({rotate} {lx} {ly})"' if rotate else ""
            self.parts.append(
                f'<text x="{lx}" y="{ly}" font-size="13" fill="{color}" text-anchor="middle" '
                f'paint-order="stroke" stroke="#fff" stroke-width="5"{rot}>{escape(label)}</text>'
            )

    def text(self, x, y, s, size=14, color=MUTED, weight="400", anchor="start"):
        self.parts.append(
            f'<text x="{x}" y="{y}" font-size="{size}" font-weight="{weight}" fill="{color}" text-anchor="{anchor}">{escape(s)}</text>'
        )

    def legend(self, x, y, items):
        for i, (style, label) in enumerate(items):
            s, f, _ = STYLES[style]
            dash = ' stroke-dasharray="5 4"' if style == "plan" else ""
            yy = y + i * 26
            self.parts.append(
                f'<rect x="{x}" y="{yy}" width="26" height="16" rx="4" fill="{f}" stroke="{s}" stroke-width="2"{dash}/>'
            )
            self.text(x + 36, yy + 13, label, 14, TEXT)

    def save(self, name):
        self.parts.append("</svg>")
        (OUT / name).write_text("\n".join(self.parts), encoding="utf-8")


# ---------------------------------------------------------------- 1. Data flow
d = Svg(1400, 790, "Data Flow — จากการชี้ร่างกาย สู่ข้อมูลที่เกี่ยวข้อง")
for x, lab in [(40, "INPUT · ผู้ใช้ป้อน"), (420, "PROCESS · ระบบประมวลผล"), (815, "KEY"), (1080, "OUTPUT · สิ่งที่แสดง")]:
    d.text(x, 92, lab, 15, "#1f9e86", "700")
ins = [
    (130, "① คลิกบนร่าง 2D", ["ด้านหน้า / ด้านหลัง", "37 บริเวณ แยกซ้าย–ขวา"]),
    (300, "② คลิกกล้ามเนื้อบนโมเดล 3D", ["โมเดล Z-Anatomy", "820 ส่วน หมุน/ซูมได้"]),
    (470, "③ พิมพ์อาการเป็นภาษาไทย", ["เช่น “ปวดบ่าขวาเมื่อย”", "หรือ “เอวซ้าย”"]),
]
procs = [
    (130, "จุดคลิกผูกกับรหัสบริเวณ", ["แต่ละจุดบน SVG มี data-region", "จับคู่ตรง 1 ต่อ 1"]),
    (300, "Raycast → ชื่อกล้ามเนื้อ → บริเวณ", ["หาชิ้นที่ถูกคลิก แล้วแปลงชื่อเป็นบริเวณ", "ซ้าย/ขวา จากชื่อหรือพิกัด 3 มิติ"]),
    (470, "จับคู่คำค้น 230 คำ", ["เลือกคำที่ยาวที่สุดที่ตรงกับข้อความ", "ไม่ระบุข้าง → ระบบถามกลับ"]),
]
for y, t, l in ins:
    d.box(40, y, 300, 110, t, l)
for y, t, l in procs:
    d.box(420, y, 330, 110, t, l)
    d.arrow([(340, y + 55), (420, y + 55)])
    d.arrow([(750, y + 55), (790, y + 55), (790, 355), (812, 355)])
d.box(815, 290, 190, 130, "region_id", ["เช่น scapula_left", "กุญแจกลางของ", "ทุกช่องทาง"], "key")
outs = [
    (110, "คำอธิบายสำหรับผู้รับบริการ", ["body-pain-map.json"], "app", None),
    (215, "คำถามซักอาการ", ["+ คำเตือนสัญญาณอันตราย"], "app", None),
    (320, "ชั้นโครงสร้าง + เส้นประธาน", ["โหมดผู้เรียน"], "app", None),
    (425, "ความรู้จากคลัง + แหล่งอ้างอิง", ["knowledge.json · ค้นในเครื่อง"], "app", None),
    (530, "บันทึกในเครื่อง → ส่งออก .md", ["localStorage · ไม่ส่งขึ้นเซิร์ฟเวอร์"], "app", None),
]
for y, t, l, st, b in outs:
    d.box(1080, y, 290, 85, t, l, st, b)
    d.arrow([(1005, 355), (1040, 355), (1040, y + 42), (1078, y + 42)], style="plan" if st == "plan" else "d")
d.box(40, 650, 1330, 90, "ทั้งหมดทำงานในเบราว์เซอร์ของผู้ใช้",
      ["ไม่ต้องมีบัญชี · ไม่ส่งข้อมูลอาการขึ้นเซิร์ฟเวอร์ · ใช้ออฟไลน์ได้หลังเปิดครั้งแรก (PWA)"], "net")
d.save("01-data-flow.svg")

# ------------------------------------------------------------- 2. Architecture
a = Svg(1400, 960, "System Architecture — Local-first")
a.zone(30, 70, 880, 610, "เครื่องผู้ใช้ (มือถือ / แท็บเล็ต / คอมพิวเตอร์) — เบราว์เซอร์", "app")
a.box(60, 120, 260, 95, "หน้าจอ 2D", ["SVG · ด้านหน้า/ด้านหลัง"])
a.box(340, 120, 260, 95, "โมเดล 3D", ["Three.js + Draco (self-host)"])
a.box(620, 120, 260, 95, "ช่องพิมพ์ภาษาไทย", ["หาบริเวณ / ถามคลังความรู้"])
a.box(60, 255, 540, 95, "แปลงเป็น region_id", ["resolve.js · muscleRegion.js (กฎที่อธิบายได้ ตรวจด้วย CI)"], "key")
for x in (190, 470):
    a.arrow([(x, 215), (x, 253)])
a.arrow([(750, 215), (750, 235), (560, 235), (560, 253)])
a.box(620, 255, 260, 95, "แผงผลลัพธ์", ["คำอธิบาย · คำถามซักอาการ", "เส้นประธาน · คำเตือน"])
a.arrow([(600, 302), (618, 302)])
a.box(60, 390, 400, 95, "ค้นคลังความรู้ในเครื่อง", ["ตัดคำไทย (Intl.Segmenter) + BM25", "กรองตามบริเวณ · แสดงแหล่งอ้างอิง"], "app", "ทำงานแล้ว")
a.box(480, 390, 400, 95, "บันทึกในเครื่อง", ["localStorage → ส่งออกไฟล์ .md", "ไม่มีบัญชี ไม่ส่งข้อมูลออก"])
a.arrow([(750, 350), (750, 388)])
a.box(60, 525, 820, 125, "Service Worker (ออฟไลน์)",
      ["cache แอป: 33 ไฟล์ + ข้อมูล JSON (บังคับด้วย CSP: โหลดจากโดเมนตัวเองเท่านั้น)",
       "cache โมเดล 3D: 23 MB — เก็บเมื่อผู้ใช้กด “ดาวน์โหลดโมเดล 3D”",
       "ตรวจความครบถ้วนด้วย scripts/check-offline.py ทุก PR"])
a.zone(950, 70, 420, 610, "อินเทอร์เน็ต (สาธารณะ)", "net")
a.box(975, 125, 370, 110, "GitHub Pages", ["ไฟล์แอป + ข้อมูล JSON", "HTTPS · ไม่มีเซิร์ฟเวอร์ประมวลผล"], "net")
a.box(975, 290, 370, 110, "GitHub Release", ["ไฟล์โมเดล 3D (CC BY-SA 4.0)", "ตรวจ SHA-256 ก่อน deploy"], "net")
a.arrow([(1160, 290), (1160, 237)], "deploy", "net", (1205, 268))
a.box(975, 470, 370, 150, "AI Proxy + LLM", ["API key อยู่ฝั่งเซิร์ฟเวอร์เท่านั้น", "rate limit + เพดานค่าใช้จ่าย",
                                          "รับเฉพาะคำถาม + ข้อความที่ค้นได้", "(ไม่มีข้อมูลส่วนตัว)"], "plan", "Hackathon")
a.arrow([(975, 180), (930, 180), (930, 587), (882, 587)], "โหลดครั้งแรก / อัปเดต (HTTPS)", "net", (925, 390), rotate=-90)
a.arrow([(460, 437), (470, 437), (470, 505), (960, 505), (960, 545), (973, 545)], "คำถาม + บริบท", "plan", (715, 498))
a.zone(30, 710, 1340, 220, "เครื่องผู้พัฒนา (ส่วนตัว — ไม่เผยแพร่)", "priv")
a.box(60, 765, 330, 130, "ThaiMed Brain (Obsidian)", ["คลังความรู้ Markdown 57 โน้ต", "มีแหล่งที่มา + สถานะตรวจทาน", "บางแหล่งเป็นสไลด์อาจารย์"], "priv")
a.box(440, 765, 430, 130, "Private RAG Chat (ใช้งานได้แล้ว)", ["Gemini embedding → hybrid score", "cosine 75% + keyword 25% → top chunks",
                                                              "Gemini ตอบ + อ้างอิงโน้ตต้นทาง"], "priv")
a.box(920, 765, 420, 130, "คัดเนื้อหาที่เผยแพร่ได้", ["ทีมเขียนสรุปด้วยคำของตัวเอง + อ้างอิง", "build-knowledge.py → knowledge.json",
                                                     "เข้า repo ผ่าน PR + CI"], "priv")
a.arrow([(390, 830), (438, 830)], style="priv")
a.arrow([(1130, 765), (1130, 695), (1387, 695), (1387, 200), (1347, 200)], "PR + CI", "priv", (1390, 450), rotate=-90)
a.save("02-architecture.svg")

# ------------------------------------------------------------ 3. AI pipeline
p = Svg(1400, 625, "AI Knowledge Retrieval — ค้นก่อน แล้วค่อยเรียบเรียง (RAG)")
steps = [
    ("1. คำถามผู้ใช้", ["ข้อความภาษาไทย", "+ บริเวณที่เลือกไว้ (ถ้ามี)"], "app", None),
    ("2. หาบริเวณในคำถาม", ["คำค้น 230 คำ → region_id", "ใช้กรองผลค้น"], "key", None),
    ("3. ค้นคลังความรู้", ["ตัดคำไทย + BM25", "เพิ่มน้ำหนักเมื่อตรงบริเวณ"], "app", "ทำงานแล้ว"),
    ("4. เลือกหลักฐาน", ["top-3 ที่มีแหล่งอ้างอิง", "+ สถานะตรวจทาน"], "app", "ทำงานแล้ว"),
    ("5. AI เรียบเรียง", ["LLM ตอบจากหลักฐาน", "ที่ให้เท่านั้น"], "plan", "Hackathon"),
    ("6. คำตอบ", ["พร้อมแหล่งอ้างอิงทุกข้อ", "+ disclaimer"], "app", None),
]
x = 40
for i, (t, l, st, b) in enumerate(steps):
    p.box(x, 120, 200, 125, t, l, st, b)
    if i < len(steps) - 1:
        p.arrow([(x + 200, 182), (x + 222, 182)])
    x += 222
p.arrow([(840, 245), (840, 300), (1260, 300), (1260, 247)], "ตอนนี้: แสดงหลักฐานที่ค้นได้ให้ผู้ใช้อ่านเองโดยตรง (ยังไม่ใช้ LLM)", "d", (1050, 325))
p.box(40, 380, 640, 205, "Guardrails — กติกาความปลอดภัย",
      ["• ไม่พบแหล่งอ้างอิง → ตอบว่า “ไม่พบในคลัง” ไม่แต่งคำตอบเอง",
       "• ไม่วินิจฉัยโรค ไม่แนะนำยา",
       "• พบคำสัญญาณอันตราย (แน่นหน้าอก หายใจลำบาก ฯลฯ) → แนะนำพบแพทย์ทันที",
       "• ส่งให้ AI เฉพาะคำถาม + ข้อความที่ค้นได้ ไม่ส่งข้อมูลส่วนตัว",
       "• แสดงสถานะ “ร่าง / ตรวจแล้ว” ของแต่ละแหล่ง",
       "• ผู้เชี่ยวชาญในทีมตรวจเนื้อหาก่อนเผยแพร่เป็น Verified"], "guard")
p.box(720, 380, 640, 205, "มีต้นแบบยืนยันความเป็นไปได้แล้ว",
      ["Private RAG Chat ในคลังส่วนตัวของทีมทำงานได้จริง:",
       "• แบ่งโน้ตเป็น chunk ตามหัวข้อ (≤1,800 ตัวอักษร)",
       "• Gemini embedding + keyword → hybrid score (75/25)",
       "• Gemini ตอบจาก chunk และคืนลิงก์โน้ตต้นทาง",
       "ช่วง Hackathon: ย้ายแนวทางนี้มาใช้กับคลังสาธารณะ",
       "ผ่าน AI Proxy ที่คุมค่าใช้จ่ายและไม่เก็บข้อมูลผู้ใช้"], "priv")
p.save("03-ai-pipeline.svg")
print("ok")
