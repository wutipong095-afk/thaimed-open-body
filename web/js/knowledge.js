/**
 * Local knowledge search: Thai word segmentation + BM25, boosted by body region.
 * Runs entirely in the browser over data/knowledge.json (built from knowledge/*.md).
 */

const K1 = 1.2;
const B = 0.75;
/** Added to the score when a chunk is tagged with the region in context */
const REGION_BOOST = 1.5;

/** Phrases that must send the user to a professional, whatever the search finds */
const RED_FLAGS = [
  "แน่นหน้าอก", "เจ็บหน้าอก", "หายใจลำบาก", "หายใจไม่ออก", "หน้ามืด", "หมดสติ",
  "อ่อนแรงครึ่งซีก", "แขนขาอ่อนแรง", "ปากเบี้ยว", "พูดไม่ชัด", "ชาครึ่งซีก",
  "ไข้สูง", "คอแข็ง", "อุบัติเหตุ", "ถูกกระแทก", "กลั้นปัสสาวะไม่ได้",
];

/** Thai function words that carry no meaning for search */
const STOPWORDS = new Set([
  "ได้", "ไม่", "และ", "หรือ", "ที่", "ของ", "ใน", "เป็น", "แล้ว", "จะ", "มี", "ให้", "กับ",
  "การ", "ความ", "ก็", "ว่า", "ไป", "มา", "ตอน", "เมื่อ", "ซึ่ง", "นี้", "นั้น", "จาก", "ถึง",
  "อยู่", "ด้วย", "โดย", "แต่", "ยัง", "อะไร", "ไหม", "มั้ย", "บ้าง", "ครับ", "ค่ะ", "คะ", "นะ",
  "ทำ", "ทำไม", "อย่างไร", "ยังไง", "เวลา", "ๆ",
]);

const segmenter =
  typeof Intl !== "undefined" && "Segmenter" in Intl
    ? new Intl.Segmenter("th", { granularity: "word" })
    : null;

/** Split Thai/English text into lowercase word tokens. */
export function tokenize(text) {
  const t = String(text || "").toLowerCase();
  if (segmenter) {
    const out = [];
    for (const s of segmenter.segment(t)) {
      const w = s.segment.trim();
      if (s.isWordLike && w && !STOPWORDS.has(w)) out.push(w);
    }
    return out;
  }
  // Fallback without Intl.Segmenter: character bigrams of each run of letters.
  const out = [];
  for (const run of t.match(/[\p{L}\p{M}\p{N}]+/gu) || []) {
    if (run.length < 2) out.push(run);
    for (let i = 0; i + 1 < run.length; i++) out.push(run.slice(i, i + 2));
  }
  return out;
}

/** Red-flag phrases found in the question (checked before any search). */
export function findRedFlags(text) {
  const t = String(text || "");
  return RED_FLAGS.filter((p) => t.includes(p));
}

export class KnowledgeIndex {
  /** @param {{ chunks: Array<{id:string,title:string,section:string,regions:string[],text:string}> }} data */
  constructor(data) {
    this.chunks = data.chunks || [];
    this.docs = this.chunks.map((c) => {
      const tokens = tokenize(`${c.section} ${c.section} ${c.text}`);
      const tf = new Map();
      for (const tok of tokens) tf.set(tok, (tf.get(tok) || 0) + 1);
      return { tf, len: tokens.length };
    });
    this.avgLen = this.docs.reduce((s, d) => s + d.len, 0) / Math.max(1, this.docs.length);
    this.df = new Map();
    for (const d of this.docs) for (const tok of d.tf.keys()) this.df.set(tok, (this.df.get(tok) || 0) + 1);
  }

  idf(tok) {
    const n = this.docs.length;
    const df = this.df.get(tok) || 0;
    return Math.log(1 + (n - df + 0.5) / (df + 0.5));
  }

  /**
   * @param {string} query
   * @param {{ regionId?: string|null, limit?: number }} [opts]
   * @returns {Array<{chunk: object, score: number}>}
   */
  search(query, { regionId = null, limit = 3 } = {}) {
    const terms = [...new Set(tokenize(query))];
    const results = [];
    this.docs.forEach((d, i) => {
      let score = 0;
      for (const tok of terms) {
        const f = d.tf.get(tok);
        if (!f) continue;
        score += (this.idf(tok) * f * (K1 + 1)) / (f + K1 * (1 - B + (B * d.len) / this.avgLen));
      }
      if (score > 0 && regionId && this.chunks[i].regions.includes(regionId)) score += REGION_BOOST;
      if (score > 0) results.push({ chunk: this.chunks[i], score });
    });
    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  /**
   * Chunks tagged with a region, most relevant to the region's name first.
   * @param {string} regionId
   * @param {string} [regionName] e.g. "ไหล่ขวา / บ่าขวา"
   */
  forRegion(regionId, regionName = "", limit = 3) {
    const tagged = this.chunks.filter((c) => c.regions.includes(regionId));
    const ranked = this.search(regionName, { regionId, limit: tagged.length })
      .map((r) => r.chunk)
      .filter((c) => c.regions.includes(regionId));
    const rest = tagged.filter((c) => !ranked.includes(c));
    return [...ranked, ...rest].slice(0, limit);
  }
}
