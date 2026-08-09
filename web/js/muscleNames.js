/**
 * Bilingual muscle names (Thai ↔ English/Latin)
 *
 * Convention (Thai medical anatomy education):
 * - English / Latin follow Terminologia Anatomica (TA) via Z-Anatomy / BodyParts3D
 * - Thai: "กล้ามเนื้อ…" + established Thai medical form (transliteration and/or descriptive)
 * - Side (L/R) is handled separately in muscleRegion.js
 *
 * Sources: Terminologia Anatomica; Thai Wikipedia anatomy articles;
 * common Thai PT/TTM textbook usage (descriptive gloss in th_alt when helpful).
 */

/**
 * @typedef {{ en: string, la?: string, th: string, th_alt?: string }} MuscleNameEntry
 */

/** @type {Record<string, MuscleNameEntry>} keys = lowercase match tokens (longest wins) */
const MUSCLE_DICT = {
  // —— Head / face ——
  frontalis: { en: "Frontalis", la: "M. frontalis", th: "กล้ามเนื้อฟรอนทาลิส", th_alt: "กล้ามเนื้อหน้าผาก" },
  occipitalis: { en: "Occipitalis", la: "M. occipitalis", th: "กล้ามเนื้ออ็อกซิพิตาลิส", th_alt: "กล้ามเนื้อท้ายทอย" },
  "orbicularis oculi": { en: "Orbicularis oculi", la: "M. orbicularis oculi", th: "กล้ามเนื้อออร์บิคิวลาริส ออคิวไล", th_alt: "กล้ามเนื้อรอบตา" },
  "orbicularis oris": { en: "Orbicularis oris", la: "M. orbicularis oris", th: "กล้ามเนื้อออร์บิคิวลาริส โอริส", th_alt: "กล้ามเนื้อรอบปาก" },
  masseter: { en: "Masseter", la: "M. masseter", th: "กล้ามเนื้อแมสซีเตอร์", th_alt: "กล้ามเนื้อเคี้ยว" },
  temporalis: { en: "Temporalis", la: "M. temporalis", th: "กล้ามเนื้อเทมโพราลิส", th_alt: "กล้ามเนื้อขมับ" },
  buccinator: { en: "Buccinator", la: "M. buccinator", th: "กล้ามเนื้อบัคซิเนเตอร์", th_alt: "กล้ามเนื้อแก้ม" },
  bucinator: { en: "Buccinator", la: "M. buccinator", th: "กล้ามเนื้อบัคซิเนเตอร์", th_alt: "กล้ามเนื้อแก้ม" },
  "zygomaticus major": { en: "Zygomaticus major", la: "M. zygomaticus major", th: "กล้ามเนื้อไซโกแมติคัส เมเจอร์" },
  "zygomaticus minor": { en: "Zygomaticus minor", la: "M. zygomaticus minor", th: "กล้ามเนื้อไซโกแมติคัส ไมเนอร์" },
  risorius: { en: "Risorius", la: "M. risorius", th: "กล้ามเนื้อริโซเรียส" },
  mentalis: { en: "Mentalis", la: "M. mentalis", th: "กล้ามเนื้อเมนทาลิส", th_alt: "กล้ามเนื้อคาง" },
  nasalis: { en: "Nasalis", la: "M. nasalis", th: "กล้ามเนื้อนาซาลิส", th_alt: "กล้ามเนื้อจมูก" },
  procerus: { en: "Procerus", la: "M. procerus", th: "กล้ามเนื้อโปรเซรัส" },
  "corrugator supercilii": { en: "Corrugator supercilii", la: "M. corrugator supercilii", th: "กล้ามเนื้อคอร์รูเกเตอร์ ซูเปอร์ซิลิไอ" },
  "medial pterygoid": { en: "Medial pterygoid", la: "M. pterygoideus medialis", th: "กล้ามเนื้อเทอริกอยด์ด้านใน" },
  "lateral pterygoid": { en: "Lateral pterygoid", la: "M. pterygoideus lateralis", th: "กล้ามเนื้อเทอริกอยด์ด้านนอก" },

  // —— Neck ——
  sternocleidomastoid: {
    en: "Sternocleidomastoid",
    la: "M. sternocleidomastoideus",
    th: "กล้ามเนื้อสเตอร์โนไคลโดมาสตอยด์",
    th_alt: "กล้ามเนื้อคอเอียง (SCM)",
  },
  platysma: { en: "Platysma", la: "M. platysma", th: "กล้ามเนื้อแพลทิสมา", th_alt: "กล้ามเนื้อแผ่นคอด้านหน้า" },
  "scalenus anterior": { en: "Scalenus anterior", la: "M. scalenus anterior", th: "กล้ามเนื้อสคาลีนัส แอนทีเรียร์" },
  "scalenus medius": { en: "Scalenus medius", la: "M. scalenus medius", th: "กล้ามเนื้อสคาลีนัส มีเดียส" },
  "scalenus posterior": { en: "Scalenus posterior", la: "M. scalenus posterior", th: "กล้ามเนื้อสคาลีนัส โพสทีเรียร์" },
  "levator scapulae": { en: "Levator scapulae", la: "M. levator scapulae", th: "กล้ามเนื้อลีเวเตอร์ สแคพูลี", th_alt: "กล้ามเนื้อยกสะบัก" },
  "splenius capitis": { en: "Splenius capitis", la: "M. splenius capitis", th: "กล้ามเนื้อสพลีเนียส แคพิติส" },
  "splenius colli": { en: "Splenius colli", la: "M. splenius cervicis", th: "กล้ามเนื้อสพลีเนียส เซอร์วิซิส" },
  "longus colli": { en: "Longus colli", la: "M. longus colli", th: "กล้ามเนื้อลองกัส คอลลิ" },
  "longus capitis": { en: "Longus capitis", la: "M. longus capitis", th: "กล้ามเนื้อลองกัส แคพิติส" },
  digastric: { en: "Digastric", la: "M. digastricus", th: "กล้ามเนื้อไดแกสทริก", th_alt: "กล้ามเนื้อสองท้อง" },
  mylohyoid: { en: "Mylohyoid", la: "M. mylohyoideus", th: "กล้ามเนื้อไมโลไฮออยด์" },
  geniohyoid: { en: "Geniohyoid", la: "M. geniohyoideus", th: "กล้ามเนื้อจีนิโอไฮออยด์" },
  stylohyoid: { en: "Stylohyoid", la: "M. stylohyoideus", th: "กล้ามเนื้อสไตโลไฮออยด์" },
  sternohyoid: { en: "Sternohyoid", la: "M. sternohyoideus", th: "กล้ามเนื้อสเตอร์โนไฮออยด์" },
  sternothyroid: { en: "Sternothyroid", la: "M. sternothyroideus", th: "กล้ามเนื้อสเตอร์โนไทรอยด์" },
  thyrohyoid: { en: "Thyrohyoid", la: "M. thyrohyoideus", th: "กล้ามเนื้อไทรโรไฮออยด์" },
  omohyoid: { en: "Omohyoid", la: "M. omohyoideus", th: "กล้ามเนื้อโอโมไฮออยด์" },

  // —— Trunk / back ——
  trapezius: { en: "Trapezius", la: "M. trapezius", th: "กล้ามเนื้อทราพีเซียส", th_alt: "กล้ามเนื้อสี่เหลี่ยมคางหมู" },
  "latissimus dorsi": { en: "Latissimus dorsi", la: "M. latissimus dorsi", th: "กล้ามเนื้อแลททิสซิมัส ดอร์ไซ", th_alt: "กล้ามเนื้อแผ่นหลังกว้าง" },
  "rhomboid major": { en: "Rhomboid major", la: "M. rhomboideus major", th: "กล้ามเนื้อรอมบอยด์ เมเจอร์" },
  "rhomboid minor": { en: "Rhomboid minor", la: "M. rhomboideus minor", th: "กล้ามเนื้อรอมบอยด์ ไมเนอร์" },
  "erector spinae": { en: "Erector spinae", la: "Mm. erectores spinae", th: "กล้ามเนื้ออีเร็กเตอร์ สไปนี", th_alt: "กล้ามเนื้อเหยียดสันหลัง" },
  iliocostalis: { en: "Iliocostalis", la: "M. iliocostalis", th: "กล้ามเนื้ออิลิโอคอสทาลิส" },
  longissimus: { en: "Longissimus", la: "M. longissimus", th: "กล้ามเนื้อลองกิสซิมัส" },
  spinalis: { en: "Spinalis", la: "M. spinalis", th: "กล้ามเนื้อสไปนาลิส" },
  multifidus: { en: "Multifidus", la: "M. multifidus", th: "กล้ามเนื้อมัลทิฟิดัส" },
  "serratus posterior superior": { en: "Serratus posterior superior", la: "M. serratus posterior superior", th: "กล้ามเนื้อเซอร์ราตัส โพสทีเรียร์ ซูพีเรียร์" },
  "serratus posterior inferior": { en: "Serratus posterior inferior", la: "M. serratus posterior inferior", th: "กล้ามเนื้อเซอร์ราตัส โพสทีเรียร์ อินฟีเรียร์" },
  "quadratus lumborum": { en: "Quadratus lumborum", la: "M. quadratus lumborum", th: "กล้ามเนื้อควอดราตัส ลัมโบรัม", th_alt: "กล้ามเนื้อสี่เหลี่ยมเอว" },

  // —— Chest / abdomen ——
  "pectoralis major": { en: "Pectoralis major", la: "M. pectoralis major", th: "กล้ามเนื้อเพกทอราลิส เมเจอร์", th_alt: "กล้ามเนื้ออกใหญ่" },
  "pectoralis minor": { en: "Pectoralis minor", la: "M. pectoralis minor", th: "กล้ามเนื้อเพกทอราลิส ไมเนอร์", th_alt: "กล้ามเนื้ออกเล็ก" },
  "serratus anterior": { en: "Serratus anterior", la: "M. serratus anterior", th: "กล้ามเนื้อเซอร์ราตัส แอนทีเรียร์", th_alt: "กล้ามเนื้อฟันเลื่อยหน้า" },
  subclavius: { en: "Subclavius", la: "M. subclavius", th: "กล้ามเนื้อซับคลาเวียส" },
  "external intercostal": { en: "External intercostal", la: "Mm. intercostales externi", th: "กล้ามเนื้อระหว่างซี่โครงชั้นนอก" },
  "internal intercostal": { en: "Internal intercostal", la: "Mm. intercostales interni", th: "กล้ามเนื้อระหว่างซี่โครงชั้นใน" },
  diaphragm: { en: "Diaphragm", la: "Diaphragma", th: "กระบังลม", th_alt: "กล้ามเนื้อกระบังลม" },
  "rectus abdominis": { en: "Rectus abdominis", la: "M. rectus abdominis", th: "กล้ามเนื้อเรกตัส แอบโดมินิส", th_alt: "กล้ามเนื้อท้องตรง" },
  "external abdominal oblique": { en: "External oblique (abdomen)", la: "M. obliquus externus abdominis", th: "กล้ามเนื้ออบลิกภายนอกของท้อง" },
  "internal abdominal oblique": { en: "Internal oblique (abdomen)", la: "M. obliquus internus abdominis", th: "กล้ามเนื้ออบลิกภายในของท้อง" },
  "transversus abdominis": { en: "Transversus abdominis", la: "M. transversus abdominis", th: "กล้ามเนื้อทรานส์เวอร์ซัส แอบโดมินิส", th_alt: "กล้ามเนื้อท้องตามขวาง" },
  pyramidalis: { en: "Pyramidalis", la: "M. pyramidalis", th: "กล้ามเนื้อพิรามิดาลิส" },
  "linea alba": { en: "Linea alba", la: "Linea alba", th: "เส้นขาวกลางท้อง", th_alt: "ไลเนีย อัลบา" },
  "transversus thoracis": { en: "Transversus thoracis", la: "M. transversus thoracis", th: "กล้ามเนื้อทรานส์เวอร์ซัส ทอราซิส" },

  // —— Shoulder / arm ——
  deltoid: { en: "Deltoid", la: "M. deltoideus", th: "กล้ามเนื้อเดลทอยด์", th_alt: "กล้ามเนื้อสามเหลี่ยมไหล่" },
  supraspinatus: { en: "Supraspinatus", la: "M. supraspinatus", th: "กล้ามเนื้อซูปราสไปนาตัส" },
  infraspinatus: { en: "Infraspinatus", la: "M. infraspinatus", th: "กล้ามเนื้ออินฟราสไปนาตัส" },
  "teres minor": { en: "Teres minor", la: "M. teres minor", th: "กล้ามเนื้อเทเรส ไมเนอร์" },
  "teres major": { en: "Teres major", la: "M. teres major", th: "กล้ามเนื้อเทเรส เมเจอร์" },
  subscapularis: { en: "Subscapularis", la: "M. subscapularis", th: "กล้ามเนื้อซับสแคพูลาริส" },
  "biceps brachii": { en: "Biceps brachii", la: "M. biceps brachii", th: "กล้ามเนื้อไบเซปส์ แบรคิไอ", th_alt: "กล้ามเนื้อสองหัวของแขน" },
  brachialis: { en: "Brachialis", la: "M. brachialis", th: "กล้ามเนื้อแบรคิอาลิส" },
  coracobrachialis: { en: "Coracobrachialis", la: "M. coracobrachialis", th: "กล้ามเนื้อคอราโคแบรคิอาลิส" },
  "triceps brachii": { en: "Triceps brachii", la: "M. triceps brachii", th: "กล้ามเนื้อไทรเซปส์ แบรคิไอ", th_alt: "กล้ามเนื้อสามหัวของแขน" },
  anconeus: { en: "Anconeus", la: "M. anconeus", th: "กล้ามเนื้อแองโคเนียส" },

  // —— Forearm / hand ——
  brachioradialis: { en: "Brachioradialis", la: "M. brachioradialis", th: "กล้ามเนื้อแบรคิโอเรเดียลิส" },
  "pronator teres": { en: "Pronator teres", la: "M. pronator teres", th: "กล้ามเนื้อโปรเนเตอร์ เทเรส" },
  "pronator quadratus": { en: "Pronator quadratus", la: "M. pronator quadratus", th: "กล้ามเนื้อโปรเนเตอร์ ควอดราตัส" },
  supinator: { en: "Supinator", la: "M. supinator", th: "กล้ามเนื้อซูพิเนเตอร์" },
  "flexor carpi radialis": { en: "Flexor carpi radialis", la: "M. flexor carpi radialis", th: "กล้ามเนื้อเฟลกเซอร์ คาร์ไพ เรเดียลิส" },
  "flexor carpi ulnaris": { en: "Flexor carpi ulnaris", la: "M. flexor carpi ulnaris", th: "กล้ามเนื้อเฟลกเซอร์ คาร์ไพ อัลนาริส" },
  "palmaris longus": { en: "Palmaris longus", la: "M. palmaris longus", th: "กล้ามเนื้อพัลมาริส ลองกัส" },
  "flexor digitorum superficialis": { en: "Flexor digitorum superficialis", la: "M. flexor digitorum superficialis", th: "กล้ามเนื้อเฟลกเซอร์ ดิจิทอรัม ซูเปอร์ฟิซิอาลิส" },
  "flexor digitorum profundus": { en: "Flexor digitorum profundus", la: "M. flexor digitorum profundus", th: "กล้ามเนื้อเฟลกเซอร์ ดิจิทอรัม โพรฟันดัส" },
  "flexor pollicis longus": { en: "Flexor pollicis longus", la: "M. flexor pollicis longus", th: "กล้ามเนื้อเฟลกเซอร์ พอลลิซิส ลองกัส" },
  "extensor carpi radialis longus": { en: "Extensor carpi radialis longus", la: "M. extensor carpi radialis longus", th: "กล้ามเนื้อเอกซ์เทนเซอร์ คาร์ไพ เรเดียลิส ลองกัส" },
  "extensor carpi radialis brevis": { en: "Extensor carpi radialis brevis", la: "M. extensor carpi radialis brevis", th: "กล้ามเนื้อเอกซ์เทนเซอร์ คาร์ไพ เรเดียลิส เบรวิส" },
  "extensor carpi ulnaris": { en: "Extensor carpi ulnaris", la: "M. extensor carpi ulnaris", th: "กล้ามเนื้อเอกซ์เทนเซอร์ คาร์ไพ อัลนาริส" },
  "extensor digitorum": { en: "Extensor digitorum", la: "M. extensor digitorum", th: "กล้ามเนื้อเอกซ์เทนเซอร์ ดิจิทอรัม" },
  "extensor digiti minimi": { en: "Extensor digiti minimi", la: "M. extensor digiti minimi", th: "กล้ามเนื้อเอกซ์เทนเซอร์ ดิจิติ มินิไม" },
  "extensor indicis": { en: "Extensor indicis", la: "M. extensor indicis", th: "กล้ามเนื้อเอกซ์เทนเซอร์ อินดิซิส" },
  "extensor pollicis longus": { en: "Extensor pollicis longus", la: "M. extensor pollicis longus", th: "กล้ามเนื้อเอกซ์เทนเซอร์ พอลลิซิส ลองกัส" },
  "extensor pollicis brevis": { en: "Extensor pollicis brevis", la: "M. extensor pollicis brevis", th: "กล้ามเนื้อเอกซ์เทนเซอร์ พอลลิซิส เบรวิส" },
  "abductor pollicis longus": { en: "Abductor pollicis longus", la: "M. abductor pollicis longus", th: "กล้ามเนื้อแอบดักเตอร์ พอลลิซิส ลองกัส" },
  "abductor pollicis brevis": { en: "Abductor pollicis brevis", la: "M. abductor pollicis brevis", th: "กล้ามเนื้อแอบดักเตอร์ พอลลิซิส เบรวิส" },
  "adductor pollicis": { en: "Adductor pollicis", la: "M. adductor pollicis", th: "กล้ามเนื้อแอดดักเตอร์ พอลลิซิส" },
  "opponens pollicis": { en: "Opponens pollicis", la: "M. opponens pollicis", th: "กล้ามเนื้อออปโพเนนส์ พอลลิซิส" },
  "abductor digiti minimi of hand": { en: "Abductor digiti minimi (hand)", la: "M. abductor digiti minimi manus", th: "กล้ามเนื้อแอบดักเตอร์ ดิจิติ มินิไม (มือ)" },
  "opponens digiti minimi muscle of hand": { en: "Opponens digiti minimi (hand)", la: "M. opponens digiti minimi", th: "กล้ามเนื้อออปโพเนนส์ ดิจิติ มินิไม (มือ)" },
  "palmar interossei": { en: "Palmar interossei", la: "Mm. interossei palmares", th: "กล้ามเนื้ออินเทอร์ออสเซียสฝ่ามือ" },
  "dorsal interossei muscles of hand": { en: "Dorsal interossei (hand)", la: "Mm. interossei dorsales manus", th: "กล้ามเนื้ออินเทอร์ออสเซียสหลังมือ" },
  "lumbrical muscles of hand": { en: "Lumbricals (hand)", la: "Mm. lumbricales manus", th: "กล้ามเนื้อลัมบริคอลของมือ" },
  "common flexor tendon sheath": {
    en: "Common flexor tendon sheath",
    la: "Vagina communis tendinum musculorum flexorum",
    th: "ปลอกเอ็นเฟลกเซอร์ร่วม",
    th_alt: "ปลอกเอ็นงอนิ้วร่วม (ฝ่ามือ/ข้อมือ)",
  },
  "synovial sheaths of digits of hand": {
    en: "Synovial sheaths of digits of hand",
    la: "Vaginae synoviales digitorum manus",
    th: "ปลอกไขข้อนิ้วมือ",
  },
  "cruciform part of fibrous sheath of digit of hand": {
    en: "Cruciform part of fibrous sheath of digit (hand)",
    th: "ปลอกเส้นใยนิ้วมือส่วนไขว้",
  },

  // —— Hip / thigh ——
  "gluteus maximus": { en: "Gluteus maximus", la: "M. gluteus maximus", th: "กล้ามเนื้อกลูเทียส แมกซิมัส", th_alt: "กล้ามเนื้อก้นใหญ่" },
  "gluteus medius": { en: "Gluteus medius", la: "M. gluteus medius", th: "กล้ามเนื้อกลูเทียส มีเดียส", th_alt: "กล้ามเนื้อก้นกลาง" },
  "gluteus minimus": { en: "Gluteus minimus", la: "M. gluteus minimus", th: "กล้ามเนื้อกลูเทียส มินิมัส", th_alt: "กล้ามเนื้อก้นเล็ก" },
  "tensor fasciae latae": { en: "Tensor fasciae latae", la: "M. tensor fasciae latae", th: "กล้ามเนื้อเทนเซอร์ แฟสซีเอ ลาเท", th_alt: "กล้ามเนื้อดึงพังผืดต้นขาด้านข้าง" },
  piriformis: { en: "Piriformis", la: "M. piriformis", th: "กล้ามเนื้อพิริฟอร์มิส" },
  "obturator internus": { en: "Obturator internus", la: "M. obturatorius internus", th: "กล้ามเนื้อออบทูเรเตอร์ อินเทอร์นัส" },
  "obturator externus": { en: "Obturator externus", la: "M. obturatorius externus", th: "กล้ามเนื้อออบทูเรเตอร์ เอ็กซ์เทอร์นัส" },
  "superior gemellus": { en: "Superior gemellus", la: "M. gemellus superior", th: "กล้ามเนื้อเจเมลลัส ซูพีเรียร์" },
  "inferior gemellus": { en: "Inferior gemellus", la: "M. gemellus inferior", th: "กล้ามเนื้อเจเมลลัส อินฟีเรียร์" },
  "quadratus femoris": { en: "Quadratus femoris", la: "M. quadratus femoris", th: "กล้ามเนื้อควอดราตัส ฟีมอริส" },
  "iliacus": { en: "Iliacus", la: "M. iliacus", th: "กล้ามเนื้ออิลิแอคัส" },
  "psoas major": { en: "Psoas major", la: "M. psoas major", th: "กล้ามเนื้อโซแอส เมเจอร์" },
  iliopsoas: { en: "Iliopsoas", la: "M. iliopsoas", th: "กล้ามเนื้ออิลิโอโซแอส" },
  "rectus femoris": { en: "Rectus femoris", la: "M. rectus femoris", th: "กล้ามเนื้อเรกตัส ฟีมอริส", th_alt: "กล้ามเนื้อต้นขาตรง (ส่วนควอดไรเซปส์)" },
  "vastus lateralis": { en: "Vastus lateralis", la: "M. vastus lateralis", th: "กล้ามเนื้อวาสตัส ลาเทราลิส", th_alt: "กล้ามเนื้อต้นขาด้านนอก" },
  "vastus medialis": { en: "Vastus medialis", la: "M. vastus medialis", th: "กล้ามเนื้อวาสตัส มีเดียลิส", th_alt: "กล้ามเนื้อต้นขาด้านใน" },
  "vastus intermedius": { en: "Vastus intermedius", la: "M. vastus intermedius", th: "กล้ามเนื้อวาสตัส อินเทอร์มีเดียส" },
  sartorius: { en: "Sartorius", la: "M. sartorius", th: "กล้ามเนื้อซาร์โทเรียส", th_alt: "กล้ามเนื้อตัดเสื้อ" },
  "adductor longus": { en: "Adductor longus", la: "M. adductor longus", th: "กล้ามเนื้อแอดดักเตอร์ ลองกัส" },
  "adductor brevis": { en: "Adductor brevis", la: "M. adductor brevis", th: "กล้ามเนื้อแอดดักเตอร์ เบรวิส" },
  "adductor magnus": { en: "Adductor magnus", la: "M. adductor magnus", th: "กล้ามเนื้อแอดดักเตอร์ แมกนัส" },
  "adductor minimus": { en: "Adductor minimus", la: "M. adductor minimus", th: "กล้ามเนื้อแอดดักเตอร์ มินิมัส" },
  gracilis: { en: "Gracilis", la: "M. gracilis", th: "กล้ามเนื้อกราซิลิส" },
  pectineus: { en: "Pectineus", la: "M. pectineus", th: "กล้ามเนื้อเพกทิเนียส" },
  "biceps femoris": { en: "Biceps femoris", la: "M. biceps femoris", th: "กล้ามเนื้อไบเซปส์ ฟีมอริส", th_alt: "กล้ามเนื้อสองหัวของต้นขา" },
  semitendinosus: { en: "Semitendinosus", la: "M. semitendinosus", th: "กล้ามเนื้อเซมิเทนดิโนซัส" },
  semimembranosus: { en: "Semimembranosus", la: "M. semimembranosus", th: "กล้ามเนื้อเซมิเมมเบรโนซัส" },
  "iliotibial tract": { en: "Iliotibial tract", la: "Tractus iliotibialis", th: "แถบอิลิโอทิเบียล", th_alt: "IT band" },

  // —— Leg / foot ——
  gastrocnemius: { en: "Gastrocnemius", la: "M. gastrocnemius", th: "กล้ามเนื้อแกสทรอกนีเมียส", th_alt: "กล้ามเนื้อน่องสองหัว" },
  soleus: { en: "Soleus", la: "M. soleus", th: "กล้ามเนื้อโซเลียส", th_alt: "กล้ามเนื้อน่องชั้นลึก" },
  plantaris: { en: "Plantaris", la: "M. plantaris", th: "กล้ามเนื้อแพลนทาริส" },
  "tibialis anterior": { en: "Tibialis anterior", la: "M. tibialis anterior", th: "กล้ามเนื้อทิเบียลิส แอนทีเรียร์" },
  "tibialis posterior": { en: "Tibialis posterior", la: "M. tibialis posterior", th: "กล้ามเนื้อทิเบียลิส โพสทีเรียร์" },
  "fibularis longus": { en: "Fibularis (peroneus) longus", la: "M. fibularis longus", th: "กล้ามเนื้อฟิบูลาริส ลองกัส" },
  "fibularis brevis": { en: "Fibularis (peroneus) brevis", la: "M. fibularis brevis", th: "กล้ามเนื้อฟิบูลาริส เบรวิส" },
  "fibularis tertius": { en: "Fibularis tertius", la: "M. fibularis tertius", th: "กล้ามเนื้อฟิบูลาริส เทอร์เทียส" },
  "flexor digitorum longus": { en: "Flexor digitorum longus", la: "M. flexor digitorum longus", th: "กล้ามเนื้อเฟลกเซอร์ ดิจิทอรัม ลองกัส" },
  "flexor hallucis longus": { en: "Flexor hallucis longus", la: "M. flexor hallucis longus", th: "กล้ามเนื้อเฟลกเซอร์ ฮัลลูซิส ลองกัส" },
  "extensor digitorum longus": { en: "Extensor digitorum longus", la: "M. extensor digitorum longus", th: "กล้ามเนื้อเอกซ์เทนเซอร์ ดิจิทอรัม ลองกัส" },
  "extensor hallucis longus": { en: "Extensor hallucis longus", la: "M. extensor hallucis longus", th: "กล้ามเนื้อเอกซ์เทนเซอร์ ฮัลลูซิส ลองกัส" },
  "extensor digitorum brevis": { en: "Extensor digitorum brevis", la: "M. extensor digitorum brevis", th: "กล้ามเนื้อเอกซ์เทนเซอร์ ดิจิทอรัม เบรวิส" },
  "extensor hallucis brevis": { en: "Extensor hallucis brevis", la: "M. extensor hallucis brevis", th: "กล้ามเนื้อเอกซ์เทนเซอร์ ฮัลลูซิส เบรวิส" },
  popliteus: { en: "Popliteus", la: "M. popliteus", th: "กล้ามเนื้อปอพลีเทียส", th_alt: "กล้ามเนื้อหลังเข่า" },
  "abductor hallucis": { en: "Abductor hallucis", la: "M. abductor hallucis", th: "กล้ามเนื้อแอบดักเตอร์ ฮัลลูซิส" },
  "flexor digitorum brevis": { en: "Flexor digitorum brevis", la: "M. flexor digitorum brevis", th: "กล้ามเนื้อเฟลกเซอร์ ดิจิทอรัม เบรวิส" },
  "quadratus plantae": { en: "Quadratus plantae", la: "M. quadratus plantae", th: "กล้ามเนื้อควอดราตัส แพลนที" },
  "abductor digiti minimi of foot": { en: "Abductor digiti minimi (foot)", la: "M. abductor digiti minimi pedis", th: "กล้ามเนื้อแอบดักเตอร์ ดิจิติ มินิไม (เท้า)" },
  "calcaneal tendon": { en: "Calcaneal (Achilles) tendon", la: "Tendo calcaneus", th: "เอ็นร้อยหวาย", th_alt: "เอ็นแคลคาเนียล / Achilles" },
};

// Fix duplicate key - I accidentally listed deltoid twice. The Record will just keep one.
// Remove the duplicate at the end by not having it - I'll clean in the write.

const KEYS_BY_LENGTH = Object.keys(MUSCLE_DICT).sort((a, b) => b.length - a.length);

/**
 * Normalize Z-Anatomy / display name for dictionary lookup.
 * @param {string} name
 */
export function normalizeMuscleKey(name) {
  let s = String(name || "")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\(\s*[lr]\s*\)/gi, " ")
    .replace(/\b(left|right|sinister|dexter)\b/gi, " ")
    .replace(/\s+[lr]\b/gi, " ");
  s = s.replace(/(muscle|ligament|tendon)s?[lr]\b/gi, "$1");
  s = s.replace(/\b(muscles?|bursae?|tendon sheaths?|sheaths?)\b/gi, " ");
  return s.replace(/\s+/g, " ").trim();
}

/**
 * @param {string} meshName raw or cleaned
 * @returns {{ en: string, la: string, th: string, th_alt: string, matchedKey: string | null, displayTh: string, displayEn: string }}
 */
export function lookupMuscleName(meshName) {
  const norm = normalizeMuscleKey(meshName);
  let matchedKey = null;
  /** @type {MuscleNameEntry | null} */
  let entry = null;

  for (const key of KEYS_BY_LENGTH) {
    if (norm === key || norm.includes(key)) {
      matchedKey = key;
      entry = MUSCLE_DICT[key];
      break;
    }
  }

  if (!entry) {
    // Title-case leftover English as fallback
    const en = String(meshName || "")
      .replace(/_/g, " ")
      .replace(/\s+/g, " ")
      .replace(/(muscle|ligament|tendon)s?[lr]$/i, "$1")
      .replace(/\s+[lr]$/i, "")
      .trim();
    return {
      en,
      la: "",
      th: en ? `กล้ามเนื้อ (${en})` : "กล้ามเนื้อ",
      th_alt: "",
      matchedKey: null,
      displayTh: en ? `กล้ามเนื้อ (${en})` : "กล้ามเนื้อ",
      displayEn: en,
    };
  }

  const displayTh = entry.th_alt ? `${entry.th} · ${entry.th_alt}` : entry.th;
  const displayEn = entry.la ? `${entry.en} (${entry.la})` : entry.en;
  return {
    en: entry.en,
    la: entry.la || "",
    th: entry.th,
    th_alt: entry.th_alt || "",
    matchedKey,
    displayTh,
    displayEn,
  };
}

export function formatMuscleLabelThEn(meshName, side = "mid") {
  const info = lookupMuscleName(meshName);
  const sideTh = side === "L" ? "ซ้าย" : side === "R" ? "ขวา" : "";
  const sideEn = side === "L" ? "left" : side === "R" ? "right" : "";
  const thMain = info.th;
  return {
    ...info,
    side,
    lineTh: sideTh ? `${thMain} (${sideTh})` : thMain,
    lineEn: sideEn ? `${info.en} (${sideEn})` : info.en,
    lineFull: sideTh
      ? `${thMain} (${sideTh}) — ${info.en}`
      : `${thMain} — ${info.en}`,
  };
}

export { MUSCLE_DICT };
