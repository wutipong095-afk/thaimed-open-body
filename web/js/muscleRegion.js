/**
 * Map Z-Anatomy / Latin muscle names (+ hit position) → region_id
 *
 * Coordinates (after centering): Y up, model faces camera.
 * Anatomical left = +X (Z-Anatomy / BodyParts3D), right = −X.
 */

/** @param {"L"|"R"|"mid"} side @param {string} leftId @param {string} rightId @param {string} [midId] */
function sided(side, leftId, rightId, midId) {
  if (side === "L") return leftId;
  if (side === "R") return rightId;
  return midId ?? rightId;
}

/**
 * Lower-limb and specific rules MUST come before bare flexor/extensor arm rules,
 * or leg flexors (e.g. flexor digitorum longus) map to forearm.
 * @type {{ re: RegExp, region: string | ((side: string) => string) }[]}
 */
const NAME_RULES = [
  { re: /occipito|epicrani|scalp|galea/i, region: "head_cranial" },
  {
    re: /orbicularis oculi|nasalis|zygomatic|masseter|temporalis|buccinator|mentalis|depressor|levator labii|risorius|frontalis|procerus|corrugator/i,
    region: "face",
  },
  {
    re: /sternocleidomastoid|platysma|longus colli|longus capitis|scalene|splenius|semispinalis capitis|cervicis/i,
    region: "cervical_posterior",
  },
  {
    re: /deltoid|supraspinatus|infraspinatus|teres (major|minor)|subscapularis/i,
    region: (s) => sided(s, "shoulder_left", "shoulder_right", "shoulder_right"),
  },
  {
    re: /trapezius|levator scapulae|rhomboid|serratus anterior/i,
    region: (s) => sided(s, "scapula_left", "scapula_right", "upper_back"),
  },
  { re: /pectoralis|intercostal|diaphragm|serratus posterior/i, region: "chest_anterior" },
  { re: /rectus abdominis|pyramidalis/i, region: "abdomen_umbilical" },
  {
    re: /obliqu|transversus abdominis|quadratus lumborum|linea alba/i,
    region: (s) => sided(s, "flank_left", "flank_right", "abdomen_umbilical"),
  },
  {
    re: /erector spinae|multifidus|iliocostalis|longissimus|spinalis|latissimus/i,
    region: (s) => sided(s, "lumbar_left", "lumbar_right", "lumbar_mid"),
  },

  // —— Lower limb first (before arm flexor/extensor) ——
  {
    re: /gluteus|tensor fascia|piriformis|obturator|gemellus|quadratus femoris/i,
    region: (s) => sided(s, "buttock_left", "buttock_right"),
  },
  {
    re: /iliacus|psoas|iliopsoas/i,
    region: (s) => sided(s, "hip_left", "hip_right"),
  },
  {
    re: /quadriceps|vastus|rectus femoris|sartorius|adductor(?!\s*pollicis)|gracilis|pectineus|hamstring|biceps femoris|semitendinosus|semimembranosus|iliotibial/i,
    region: (s) => sided(s, "thigh_left", "thigh_right"),
  },
  {
    re: /patella|knee|articularis genus|popliteus/i,
    region: (s) => sided(s, "knee_left", "knee_right"),
  },
  {
    re: /gastrocnemius|soleus|tibialis|peroneus|fibularis|plantaris|flexor digitorum longus|flexor hallucis|extensor digitorum longus|extensor hallucis|triceps surae/i,
    region: (s) => sided(s, "calf_left", "calf_right"),
  },
  {
    re: /abductor hallucis|flexor digitorum brevis|quadratus plantae|interosseous pedis|extensor digitorum brevis|abductor digiti minimi|plantar|dorsal interosseous.*foot|foot/i,
    region: (s) => sided(s, "ankle_foot_left", "ankle_foot_right"),
  },

  // —— Upper limb ——
  {
    re: /biceps brachii|brachialis|coracobrachialis|triceps brachii|triceps(?!\s*surae)|anconeus/i,
    region: (s) => sided(s, "upper_arm_left", "upper_arm_right"),
  },
  {
    // Avoid bare flexor|extensor — those match leg muscles too
    re: /brachioradialis|pronator|supinator|palmaris|flexor carpi|extensor carpi|flexor digitorum superficialis|flexor digitorum profundus|flexor pollicis longus|extensor digitorum(?!\s+longus|\s+brevis)|extensor pollicis|extensor indicis|abductor pollicis longus|flexor digiti minimi brevis of hand/i,
    region: (s) => sided(s, "elbow_forearm_left", "elbow_forearm_right"),
  },
  {
    re: /thenar|hypothenar|opponens|abductor pollicis(?!\s*longus)|adductor pollicis|palmaris brevis|lumbrical(?!.*foot)|palmar interosse|dorsal interosseous.*hand|interosseous.*hand/i,
    region: (s) => sided(s, "wrist_hand_left", "wrist_hand_right"),
  },
];

/**
 * Side from name. Handles raw glTF names and cleaned labels.
 * @param {string} name
 * @returns {"L"|"R"|"mid"}
 */
export function detectSide(name) {
  const raw = String(name || "").trim();
  if (!raw) return "mid";

  const spaced = raw.replace(/_/g, " ");
  const compact = raw.replace(/[\s_]+/g, "");

  for (const n of [raw, spaced, compact]) {
    if (/\(\s*L\s*\)/i.test(n) || /\bleft\b/i.test(n) || /\bsinister\b/i.test(n)) return "L";
    if (/\(\s*R\s*\)/i.test(n) || /\bright\b/i.test(n) || /\bdexter\b/i.test(n)) return "R";
    if (/(?:^|[\s._])l$/i.test(n) || /\.l$/i.test(n) || /_l$/i.test(n)) return "L";
    if (/(?:^|[\s._])r$/i.test(n) || /\.r$/i.test(n) || /_r$/i.test(n)) return "R";
    if (/(?:muscle|ligament|tendon)s?l$/i.test(n)) return "L";
    if (/(?:muscle|ligament|tendon)s?r$/i.test(n)) return "R";
  }

  if (/(?:al|il|ol|ul|el)$/i.test(compact)) return "mid";

  const glued = compact.match(/^(.*[a-z0-9])([lr])$/i);
  if (glued && glued[1].length >= 4) {
    const base = glued[1];
    if (/(?:ar|er|or|ur|um|us|is|es|ae|ii|ing|tion)$/i.test(base)) return "mid";
    return glued[2].toLowerCase() === "l" ? "L" : "R";
  }

  return "mid";
}

/** Anatomical left = +X (model facing camera). */
export function sideFromPosition(p) {
  if (!p || typeof p.x !== "number" || Number.isNaN(p.x)) return "mid";
  if (p.x > 0.03) return "L";
  if (p.x < -0.03) return "R";
  return "mid";
}

/** Side label in Thai for UI */
export function sideLabelTh(side) {
  if (side === "L") return "ซ้าย";
  if (side === "R") return "ขวา";
  return "";
}

/**
 * @param {string} regionId
 * @param {"L"|"R"|"mid"} side
 */
export function alignRegionSide(regionId, side) {
  if (!regionId || side === "mid") return regionId;
  if (side === "L") {
    return regionId.replace(/_right$/, "_left").replace(/_mid$/, "_left");
  }
  return regionId.replace(/_left$/, "_right").replace(/_mid$/, "_right");
}

/**
 * @param {string} meshName
 * @param {{ x: number, y: number, z: number } | null} [hitPoint]
 */
export function resolveRegionFromMuscle(meshName, hitPoint = null) {
  const spaced = String(meshName || "").replace(/_/g, " ");
  let side = detectSide(meshName);
  let sideSource = side === "mid" ? "none" : "name";
  if (side === "mid" && hitPoint) {
    side = sideFromPosition(hitPoint);
    if (side !== "mid") sideSource = "position";
  }

  for (const rule of NAME_RULES) {
    if (rule.re.test(spaced) || rule.re.test(meshName)) {
      let region =
        typeof rule.region === "function" ? rule.region(side) : rule.region;
      region = alignRegionSide(region, side);
      return { regionId: region, side, matchedBy: "name", sideSource };
    }
  }
  if (hitPoint) {
    let regionId = regionFromPosition(hitPoint);
    regionId = alignRegionSide(regionId, side);
    if (side === "mid") side = sideFromPosition(hitPoint);
    return {
      regionId,
      side,
      matchedBy: "position",
      sideSource: sideSource === "none" ? "position" : sideSource,
    };
  }
  return {
    regionId:
      side === "L" ? "shoulder_left" : side === "R" ? "shoulder_right" : "chest_anterior",
    side,
    matchedBy: "fallback",
    sideSource,
  };
}

/**
 * Position map: anatomical left = +X.
 * Check lower limb by Y before lateral “arm” band so legs are not labeled as arms.
 */
export function regionFromPosition(p) {
  const { x, y, z } = p;
  const left = x > 0.05;
  const right = x < -0.05;

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
    // Raised arms only — not hips/thighs
    if (Math.abs(x) > 0.32 && y > 0.48) {
      return left ? "elbow_forearm_left" : "elbow_forearm_right";
    }
    if (Math.abs(x) > 0.2 && Math.abs(x) < 0.32) {
      return left ? "flank_left" : "flank_right";
    }
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

  // Lower limb (before arms): feet → calf → knee → thigh
  if (y <= 0.28) {
    if (y > 0.12) return left ? "thigh_left" : right ? "thigh_right" : "thigh_left";
    if (y > 0.05) return left ? "knee_left" : right ? "knee_right" : "knee_left";
    if (y > -0.05) return left ? "calf_left" : right ? "calf_right" : "calf_left";
    return left ? "ankle_foot_left" : right ? "ankle_foot_right" : "ankle_foot_left";
  }

  // Arms: high and lateral only
  if (Math.abs(x) > 0.28 && y > 0.38) {
    if (y > 0.55) return left ? "upper_arm_left" : "upper_arm_right";
    if (y > 0.42) return left ? "elbow_forearm_left" : "elbow_forearm_right";
    return left ? "wrist_hand_left" : "wrist_hand_right";
  }

  if (y > 0.12) return left ? "thigh_left" : right ? "thigh_right" : "thigh_left";
  return left ? "hip_left" : right ? "hip_right" : "sacrum_coccyx";
}

export function cleanMuscleLabel(name) {
  const raw = String(name || "");
  const side = detectSide(raw);
  let n = raw
    .replace(/^Object_?/i, "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  n = n.replace(/(muscle|ligament|tendon)s?l$/gi, "$1");
  n = n.replace(/(muscle|ligament|tendon)s?r$/gi, "$1");
  n = n.replace(/\s+[lr]$/i, "");

  if (side === "L" || side === "R") {
    const compact = n.replace(/\s+/g, "");
    const gluedTail =
      (side === "L" && /l$/i.test(compact)) || (side === "R" && /r$/i.test(compact));
    if (gluedTail) n = n.replace(/[lr]$/i, "").trim();
    if (!/\(\s*[LR]\s*\)\s*$/.test(n)) n = `${n} (${side})`;
  }

  return n.replace(/\s+/g, " ").trim();
}
