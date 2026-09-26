/**
 * Realistic audit: every muscular mesh name in the GLB → region_id
 * Flags cross-limb mistakes (hand→calf, foot→arm, etc.)
 *
 * Usage: node scripts/audit-region-map.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { resolveRegionFromMuscle, regionFromPosition } from "../web/js/muscleRegion.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const glbPath = join(root, "web/models/zanatomy-muscles-web.glb");

function loadGlbJson(path) {
  const buf = readFileSync(path);
  const chunkLen = buf.readUInt32LE(12);
  return JSON.parse(buf.subarray(20, 20 + chunkLen).toString("utf8"));
}

function muscularMeshNames(js) {
  const nodes = js.nodes;
  const muscularIdx = nodes.findIndex((n) =>
    /^muscular[_ ]?system/i.test(String(n.name || "").replace(/\./g, ""))
  );
  // Prefer exact: Muscular system.g → after sanitize still in JSON as "Muscular system.g"
  let start = nodes.findIndex((n) => n.name === "Muscular system.g");
  if (start < 0) start = muscularIdx;
  if (start < 0) throw new Error("Muscular system.g not found");

  const names = [];
  const stack = [start];
  const seen = new Set();
  while (stack.length) {
    const i = stack.pop();
    if (seen.has(i)) continue;
    seen.add(i);
    const n = nodes[i];
    if (n.mesh != null && n.name && !/\.g$/i.test(n.name)) {
      names.push(n.name);
    }
    for (const c of n.children || []) stack.push(c);
  }
  return names;
}

/** Expected body family from anatomy keywords (independent of app rules). */
function expectedFamily(name) {
  const n = String(name).toLowerCase().replace(/_/g, " ");

  if (/\bof foot\b|hallucis|plantae|pedis|plantar interosse|fibularis|peroneus|tibialis|gastrocnemius|soleus|plantaris|popliteus|calcaneal|triceps surae|flexor digitorum longus|extensor digitorum longus|flexor digitorum brevis|extensor digitorum brevis|abductor digiti minimi of foot|opponens digiti minimi muscle of foot|lumbrical muscles of foot|interossei muscles of foot|dorsal interossei muscles of foot/i.test(n)) {
    return "lower_leg_foot";
  }
  if (/gluteus|piriformis|obturator|gemellus|quadratus femoris|iliacus|psoas|iliopsoas|vastus|rectus femoris|sartorius|biceps femoris|semitendinosus|semimembranosus|gracilis|pectineus|adductor (longus|brevis|magnus|minimus)|iliotibial|tensor fascia/i.test(n)) {
    return "hip_thigh";
  }
  if (
    /\bof hand\b|pollicis|thenar|hypothenar|palmar interosse|dorsal interossei muscles of hand|lumbrical muscles of hand|common flexor tendon sheath|synovial sheaths of digits of hand|cruciform part of fibrous sheath of digit of hand|tendon sheath of extensors carpi|tendon sheath of extensor digitorum and extensor indicis|tendon sheath - abd/i.test(
      n
    )
  ) {
    return "hand_wrist";
  }
  if (/flexor carpi|extensor carpi|brachioradialis|pronator|supinator|palmaris longus|flexor digitorum superficialis|flexor digitorum profundus|extensor digitorum(?!\s+longus|\s+brevis)|extensor indicis|anconeus/i.test(n)) {
    return "forearm";
  }
  if (/biceps brachii|brachialis|coracobrachialis|triceps brachii|deltoid|supraspinatus|infraspinatus|teres (major|minor)|subscapularis/i.test(n)) {
    return "arm_shoulder";
  }
  if (/pectoralis|intercostal|diaphragm|serratus|rectus abdominis|oblique|transversus abdominis|pyramidalis|linea alba|quadratus lumborum/i.test(n)) {
    return "trunk";
  }
  if (/trapezius|latissimus|rhomboid|erector|iliocostalis|longissimus|spinalis|multifidus|splenius|levator scapulae|sternocleidomastoid|scalenus|platysma/i.test(n)) {
    return "neck_back";
  }
  if (/masseter|temporalis|buccinator|orbicularis|zygomatic|frontalis|occipital|mentalis|risorius|nasalis|pterygoid|corrugator|procerus/i.test(n)) {
    return "head_face";
  }
  if (/bursa|tendon sheath|sheath|retinaculum|ligament|aponeurosis|tendon of /i.test(n)) {
    return "soft_misc";
  }
  return "unknown";
}

function regionFamily(regionId) {
  const id = String(regionId || "");
  if (/wrist_hand/.test(id)) return "hand_wrist";
  if (/elbow_forearm/.test(id)) return "forearm";
  if (/upper_arm|shoulder/.test(id)) return "arm_shoulder";
  if (/ankle_foot|calf|knee/.test(id)) return "lower_leg_foot";
  if (/thigh|hip|buttock/.test(id)) return "hip_thigh";
  if (/chest|abdomen|epigastric|flank|lumbar|sacrum|scapula|upper_back/.test(id)) return "trunk";
  if (/cervical|head|face/.test(id)) return "neck_back_or_head";
  return "other";
}

/** Cross-limb conflicts we care about clinically */
function isConflict(expected, gotFamily, regionId) {
  if (expected === "unknown" || expected === "soft_misc") return null;
  if (expected === "hand_wrist" && /calf|thigh|knee|hip|ankle_foot|buttock/.test(regionId)) {
    return "HAND→LEG";
  }
  if (expected === "forearm" && /calf|thigh|knee|hip|ankle_foot|buttock/.test(regionId)) {
    return "FOREARM→LEG";
  }
  if (expected === "arm_shoulder" && /calf|thigh|knee|ankle_foot/.test(regionId)) {
    return "ARM→LEG";
  }
  if (expected === "lower_leg_foot" && /wrist_hand|elbow_forearm|upper_arm|shoulder/.test(regionId)) {
    return "LEG→ARM";
  }
  if (expected === "hip_thigh" && /wrist_hand|elbow_forearm|upper_arm/.test(regionId)) {
    return "THIGH→ARM";
  }
  if (expected === "hand_wrist" && gotFamily === "forearm") return null; // acceptable neighbor
  if (expected === "forearm" && gotFamily === "hand_wrist") return null;
  return null;
}

/** Simulate hanging-limb XYZ (anatomical pose traps) */
const TRAP_POSITIONS = {
  hand_hang_L: { x: 0.42, y: 0.08, z: 0.06 },
  hand_hang_R: { x: -0.42, y: 0.08, z: 0.06 },
  calf_L: { x: 0.12, y: -0.05, z: -0.02 },
  thigh_L: { x: 0.14, y: 0.2, z: 0 },
};

function main() {
  if (!existsSync(glbPath)) {
    console.error("GLB missing:", glbPath);
    process.exit(2);
  }
  const js = loadGlbJson(glbPath);
  const names = muscularMeshNames(js);
  const unique = [...new Set(names)];

  const conflicts = [];
  const byMatch = { name: 0, position: 0, fallback: 0 };
  const familyCounts = {};

  for (const name of unique) {
    const exp = expectedFamily(name);
    // Name-first resolve (no position) — then with trap positions for hand-like names
    const r0 = resolveRegionFromMuscle(name, null);
    byMatch[r0.matchedBy] = (byMatch[r0.matchedBy] || 0) + 1;

    let worst = null;
    const trials = [{ label: "name-only", r: r0 }];

    if (exp === "hand_wrist" || /\bhand\b|pollicis|flexor tendon sheath|palmar/i.test(name)) {
      trials.push({
        label: "hang-L",
        r: resolveRegionFromMuscle(name, TRAP_POSITIONS.hand_hang_L),
      });
      trials.push({
        label: "hang-R",
        r: resolveRegionFromMuscle(name, TRAP_POSITIONS.hand_hang_R),
      });
    }
    if (exp === "lower_leg_foot") {
      trials.push({
        label: "calf-pos",
        r: resolveRegionFromMuscle(name, TRAP_POSITIONS.calf_L),
      });
    }

    for (const t of trials) {
      const fam = regionFamily(t.r.regionId);
      const kind = isConflict(exp, fam, t.r.regionId);
      if (kind) {
        worst = { kind, trial: t.label, regionId: t.r.regionId, matchedBy: t.r.matchedBy };
        break;
      }
    }

    familyCounts[exp] = (familyCounts[exp] || 0) + 1;
    if (worst) {
      conflicts.push({ name, expected: exp, ...worst });
    }
  }

  // Position-only traps (no trustworthy name)
  const posTraps = [
    {
      label: "anon @ hand hang L",
      p: TRAP_POSITIONS.hand_hang_L,
      want: /wrist_hand|elbow_forearm/,
    },
    {
      label: "anon @ calf L",
      p: TRAP_POSITIONS.calf_L,
      want: /calf|ankle/,
    },
    {
      label: "anon @ thigh L",
      p: TRAP_POSITIONS.thigh_L,
      want: /thigh/,
    },
  ];
  const posFails = [];
  for (const t of posTraps) {
    const id = regionFromPosition(t.p);
    if (!t.want.test(id)) posFails.push({ ...t, got: id });
  }

  console.log("=== Region map audit (Z-Anatomy muscular meshes) ===");
  console.log("GLB:", glbPath);
  console.log("Mesh nodes:", names.length, "| unique names:", unique.length);
  console.log("Match source:", byMatch);
  console.log("Expected-family counts:", familyCounts);
  console.log("");
  console.log("Cross-limb conflicts:", conflicts.length);
  if (conflicts.length) {
    const shown = conflicts.slice(0, 80);
    for (const c of shown) {
      console.log(
        `  [${c.kind}] ${c.name}\n    expected=${c.expected} got=${c.regionId} via=${c.matchedBy} (${c.trial})`
      );
    }
    if (conflicts.length > shown.length) {
      console.log(`  … +${conflicts.length - shown.length} more`);
    }
  } else {
    console.log("  (none)");
  }
  console.log("");
  console.log("Position-only traps:", posFails.length ? posFails : "ok");

  // Soft_misc that fall to leg via position hang — informational
  const softHang = [];
  for (const name of unique) {
    if (expectedFamily(name) !== "soft_misc") continue;
    if (/\bof foot\b|hallucis|calcaneal|fibular|malleolus|patellar|trochanter|glute|ischial|anserine|poplite/i.test(name)) {
      continue; // leg/hip soft tissue OK
    }
    if (/\bof hand\b|pollicis|carpi|digit of hand|palmar|acromial|subdeltoid|bicipitoradial|olecranon/i.test(name)) {
      const r = resolveRegionFromMuscle(name, TRAP_POSITIONS.hand_hang_L);
      if (/calf|thigh|knee|hip|buttock|ankle/.test(r.regionId)) {
        softHang.push({ name, regionId: r.regionId, matchedBy: r.matchedBy });
      }
    }
  }
  console.log("");
  console.log(
    "Soft tissue (hand-ish) still → leg under hang pose:",
    softHang.length
  );
  for (const s of softHang.slice(0, 40)) {
    console.log(`  ${s.name} → ${s.regionId} (${s.matchedBy})`);
  }
  if (softHang.length > 40) console.log(`  … +${softHang.length - 40} more`);

  const fail = conflicts.length + posFails.length;
  console.log("");
  console.log(fail ? `RESULT: FAIL (${fail} hard issues)` : "RESULT: PASS (no hard cross-limb conflicts)");
  process.exit(fail ? 1 : 0);
}

main();
