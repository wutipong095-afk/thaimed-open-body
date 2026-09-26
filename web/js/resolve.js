/** Longest-alias substring match → region id */

export function buildAliasIndex(regions) {
  const index = [];
  for (const r of regions) {
    for (const alias of r.aliases || []) {
      const a = String(alias).trim();
      if (a) index.push({ alias: a, aliasLower: a.toLowerCase(), id: r.id });
    }
  }
  return index;
}

export function resolveRegionId(text, aliasIndex) {
  const t = String(text || "").trim().toLowerCase();
  if (!t) return null;
  let bestId = null;
  let bestLen = -1;
  for (const item of aliasIndex) {
    if (t.includes(item.aliasLower) && item.aliasLower.length > bestLen) {
      bestId = item.id;
      bestLen = item.aliasLower.length;
    }
  }
  return bestId;
}

/** If phrase has side words conflicting with region side, flag for clarify */
export function needsSideClarify(text, region) {
  if (!region || !region.side || region.side === "midline" || region.side === "bilateral" || region.side === "na") {
    return false;
  }
  const t = String(text || "").toLowerCase();
  const hasLeft = /ซ้าย|left/.test(t);
  const hasRight = /ขวา|right/.test(t);
  if (hasLeft && hasRight) return true;
  if (!hasLeft && !hasRight) return true;
  if (hasLeft && region.side !== "left") return true;
  if (hasRight && region.side !== "right") return true;
  return false;
}
