/**
 * Map Z-Anatomy / Latin muscle names (+ hit position) → region_id
 */

/** @type {{ re: RegExp, region: string | ((side: string) => string) }[]} */
const NAME_RULES = [
  { re: /occipito|epicrani|scalp|galea/i, region: "head_cranial" },
  { re: /orbicularis oculi|nasalis|zygomatic|masseter|temporalis|buccinator|mentalis|depressor|levator labii|risorius|frontalis|procerus|corrugator/i, region: "face" },
  { re: /sternocleidomastoid|platysma|longus colli|longus capitis|scalene|splenius|semispinalis capitis|cervicis/i, region: (s) => (s === "mid" ? "cervical_posterior" : s === "L" ? "cervical_posterior" : "cervical_posterior") },
  { re: /deltoid|supraspinatus|infraspinatus|teres (major|minor)|subscapularis/i, region: (s) => (s === "L" ? "shoulder_left" : "shoulder_right") },
  { re: /trapezius|levator scapulae|rhomboid|serratus anterior/i, region: (s) => (s === "L" ? "scapula_left" : s === "R" ? "scapula_right" : "upper_back") },
  { re: /pectoralis|intercostal|diaphragm|serratus posterior/i, region: "chest_anterior" },
  { re: /rectus abdominis|pyramidalis/i, region: "abdomen_umbilical" },
  { re: /obliqu|transversus abdominis|quadratus lumborum|linea alba/i, region: (s) => (s === "L" ? "flank_left" : s === "R" ? "flank_right" : "abdomen_umbilical") },
  { re: /erector spinae|multifidus|iliocostalis|longissimus|spinalis|latissimus/i, region: (s) => (s === "L" ? "lumbar_left" : s === "R" ? "lumbar_right" : "lumbar_mid") },
  { re: /biceps brachii|brachialis|coracobrachialis|triceps|anconeus/i, region: (s) => (s === "L" ? "upper_arm_left" : "upper_arm_right") },
  { re: /brachioradialis|flexor|extensor|pronator|supinator|palmaris/i, region: (s) => (s === "L" ? "elbow_forearm_left" : "elbow_forearm_right") },
  { re: /thenar|hypothenar|interosseous|lumbrical|opponens|abductor pollicis|adductor pollicis|palmar|dorsal interosse/i, region: (s) => (s === "L" ? "wrist_hand_left" : "wrist_hand_right") },
  { re: /gluteus|tensor fascia|piriformis|obturator|gemellus|quadratus femoris/i, region: (s) => (s === "L" ? "buttock_left" : "buttock_right") },
  { re: /iliacus|psoas|iliopsoas/i, region: (s) => (s === "L" ? "hip_left" : "hip_right") },
  { re: /quadriceps|vastus|rectus femoris|sartorius|adductor|gracilis|pectineus|hamstring|biceps femoris|semitendinosus|semimembranosus/i, region: (s) => (s === "L" ? "thigh_left" : "thigh_right") },
  { re: /gastrocnemius|soleus|tibialis|peroneus|fibularis|flexor digitorum longus|flexor hallucis|extensor digitorum longus|extensor hallucis|popliteus|plantaris/i, region: (s) => (s === "L" ? "calf_left" : "calf_right") },
  { re: /abductor hallucis|flexor digitorum brevis|quadratus plantae|interosseous pedis|extensor digitorum brevis|abductor digiti minimi|plantar/i, region: (s) => (s === "L" ? "ankle_foot_left" : "ankle_foot_right") },
  { re: /patella|knee|articularis genus/i, region: (s) => (s === "L" ? "knee_left" : "knee_right") },
];

function detectSide(name) {
  const n = String(name || "");
  // After cleanMuscleLabel: "... muscle (L)"
  if (/\(\s*L\s*\)\s*$/i.test(n) || /\sL\s*$/i.test(n)) return "L";
  if (/\(\s*R\s*\)\s*$/i.test(n) || /\sR\s*$/i.test(n)) return "R";
  // Raw sanitized glTF: "...musclel" / "...muscler"
  if (/(?:muscle|ligament|tendon)l$/i.test(n) || /(?:^|[_\s.])l$/i.test(n)) return "L";
  if (/(?:muscle|ligament|tendon)r$/i.test(n) || /(?:^|[_\s.])r$/i.test(n)) return "R";
  if (/\b(left|sinister|\.l\b|_l\b)\b/i.test(n)) return "L";
  if (/\b(right|dexter|\.r\b|_r\b)\b/i.test(n)) return "R";
  return "mid";
}

/** Side label in Thai for UI */
export function sideLabelTh(side) {
  if (side === "L") return "ซ้าย";
  if (side === "R") return "ขวา";
  return "";
}

/**
 * @param {string} meshName
 * @param {{ x: number, y: number, z: number } | null} [hitPoint] local/world-ish coords after normalize
 */
export function resolveRegionFromMuscle(meshName, hitPoint = null) {
  const side = detectSide(meshName);
  for (const rule of NAME_RULES) {
    if (rule.re.test(meshName)) {
      const region = typeof rule.region === "function" ? rule.region(side) : rule.region;
      return { regionId: region, side, matchedBy: "name" };
    }
  }
  if (hitPoint) {
    return { regionId: regionFromPosition(hitPoint), side, matchedBy: "position" };
  }
  return { regionId: side === "L" ? "shoulder_left" : side === "R" ? "shoulder_right" : "chest_anterior", side, matchedBy: "fallback" };
}

/** Rough body map assuming model centered, Y up, roughly unit-scaled to ~1.7 height */
export function regionFromPosition(p) {
  const { x, y, z } = p;
  const left = x < -0.05;
  const right = x > 0.05;

  if (y > 0.88) return z > 0.02 ? "face" : "head_cranial";
  if (y > 0.78) return z >= 0 ? "cervical_anterior" : "cervical_posterior";

  if (y > 0.55 && y <= 0.78) {
    if (Math.abs(x) > 0.22) return left ? "shoulder_left" : "shoulder_right";
    if (z < -0.04) {
      if (left) return "scapula_left";
      if (right) return "scapula_right";
      return "upper_back";
    }
    return "chest_anterior";
  }

  if (y > 0.38 && y <= 0.55) {
    if (Math.abs(x) > 0.2) return left ? "flank_left" : "flank_right";
    if (z < -0.03) {
      if (left) return "lumbar_left";
      if (right) return "lumbar_right";
      return "lumbar_mid";
    }
    if (y > 0.48) return "epigastric";
    if (y > 0.42) return "abdomen_umbilical";
    return "abdomen_lower";
  }

  if (y > 0.28 && y <= 0.38) {
    if (z < -0.02) return left ? "buttock_left" : right ? "buttock_right" : "sacrum_coccyx";
    return left ? "hip_left" : right ? "hip_right" : "sacrum_coccyx";
  }

  // Arms (lateral)
  if (Math.abs(x) > 0.28) {
    if (y > 0.45) return left ? "upper_arm_left" : "upper_arm_right";
    if (y > 0.28) return left ? "elbow_forearm_left" : "elbow_forearm_right";
    return left ? "wrist_hand_left" : "wrist_hand_right";
  }

  if (y > 0.12) return left ? "thigh_left" : right ? "thigh_right" : "thigh_left";
  if (y > 0.05) return left ? "knee_left" : right ? "knee_right" : "knee_left";
  if (y > -0.05) return left ? "calf_left" : right ? "calf_right" : "calf_left";
  return left ? "ankle_foot_left" : right ? "ankle_foot_right" : "ankle_foot_left";
}

export function cleanMuscleLabel(name) {
  return String(name || "")
    .replace(/^Object_?/i, "")
    .replace(/_/g, " ")
    // "oblique musclel" → "oblique muscle (L)" after underscore expand
    .replace(/\b(muscle|ligament|tendon)l\b/gi, "$1 (L)")
    .replace(/\b(muscle|ligament|tendon)r\b/gi, "$1 (R)")
    .replace(/\s+/g, " ")
    .trim();
}
