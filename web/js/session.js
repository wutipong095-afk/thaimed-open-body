const STORAGE_KEY = "body-pain-session-v1";
const MAX_ITEMS = 30;

/**
 * @typedef {{ id: string, name_th: string, at: string }} SessionItem
 */

/** @returns {{ role: string, items: SessionItem[] }} */
export function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { role: "patient", items: [] };
    const data = JSON.parse(raw);
    return {
      role: data.role === "learner" ? "learner" : "patient",
      items: Array.isArray(data.items) ? data.items.slice(0, MAX_ITEMS) : [],
    };
  } catch {
    return { role: "patient", items: [] };
  }
}

/** @param {{ role: string, items: SessionItem[] }} session */
export function saveSession(session) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      role: session.role,
      items: session.items.slice(0, MAX_ITEMS),
    })
  );
}

/**
 * @param {SessionItem[]} items
 * @param {SessionItem} item
 */
export function pushSessionItem(items, item) {
  const next = [item, ...items.filter((x) => x.id !== item.id)];
  return next.slice(0, MAX_ITEMS);
}

/** @param {SessionItem[]} items */
export function sessionToNote(items) {
  const lines = [
    "# บันทึกตำแหน่งอาการ (ท้องถิ่น)",
    "",
    "> เพื่อการสื่อสารเท่านั้น — ไม่ใช่การวินิจฉัย",
    "",
    `วันที่ส่งออก: ${new Date().toLocaleString("th-TH")}`,
    "",
  ];
  if (!items.length) {
    lines.push("(ยังไม่มีรายการในเซสชันนี้)");
  } else {
    items.forEach((it, i) => {
      lines.push(`${i + 1}. ${it.name_th} (\`${it.id}\`) — ${it.at}`);
    });
  }
  lines.push("");
  return lines.join("\n");
}
