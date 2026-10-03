const KEY = "body-pain-reviews-v1";
const LABELS = { reviewed: "ตรวจแล้ว", changes: "ต้องแก้ไข", approved: "รับรองเนื้อหาฉบับนี้" };

export function readReviews(storage = localStorage) {
  const rows = JSON.parse(storage.getItem(KEY) || "[]");
  if (!Array.isArray(rows) || rows.some((r) => !r || typeof r.target !== "string" ||
      typeof r.snapshot !== "string" || !Object.hasOwn(LABELS, r.status) ||
      typeof r.reviewer !== "string" || typeof r.at !== "string")) {
    throw new Error("Invalid review data");
  }
  return rows;
}

export function currentReview(rows, target, snapshot) {
  const latest = rows.filter((r) => r.target === target).at(-1);
  return latest?.snapshot === snapshot ? latest : null;
}

function el(tag, text, className) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
}

/** A review is tied to the exact displayed source, never to a mutable title alone. */
export function reviewPanel(target, title, source) {
  const snapshot = JSON.stringify(source);
  const panel = el("section", "", "review-panel");
  const summary = el("p", "", "review-summary");
  summary.setAttribute("aria-live", "polite");
  const history = el("details");
  history.append(el("summary", "ประวัติการตรวจในเครื่อง"));
  const list = el("ul");
  history.append(list);
  const refresh = () => {
    try {
      const rows = readReviews();
      const relevant = rows.filter((r) => r.target === target);
      const current = currentReview(rows, target, snapshot);
      summary.textContent = current
        ? `${LABELS[current.status]} · ${current.reviewer} · บันทึกในเครื่อง (ยังไม่ยืนยันตัวตน)`
        : relevant.length ? "เนื้อหาเปลี่ยนแล้ว · รอตรวจฉบับปัจจุบัน" : "ยังไม่มีผลตรวจในเครื่อง";
      list.replaceChildren(...relevant.slice().reverse().map((r) => el("li",
        `${LABELS[r.status]} · ${r.reviewer} (${r.credentials || "ไม่ระบุสาขา"}) · ${new Date(r.at).toLocaleString("th-TH")}\nจุดที่ตรวจ: ${r.quote || "ทั้งเนื้อหา"}\nความเห็น: ${r.comment || "—"}\nข้อเสนอ/อ้างอิง: ${r.correction || "—"}${r.snapshot !== snapshot ? "\n[เนื้อหาคนละฉบับ]" : ""}`)));
      history.hidden = !relevant.length;
    } catch {
      summary.textContent = "อ่านบันทึกการตรวจไม่ได้ · ไม่สามารถยืนยันสถานะได้";
    }
  };
  const form = el("form", "", "expert-only review-form");
  form.append(el("h4", "ตรวจเนื้อหานี้"));
  form.append(el("p", "บันทึกเฉพาะเบราว์เซอร์นี้ · ชื่อและคุณวุฒิเป็นข้อมูลที่ผู้ตรวจระบุเอง · ไม่ใช่การรับรองจากหน่วยงาน"));
  const fields = {};
  for (const [key, label, multiline, required] of [
    ["reviewer", "ชื่อผู้ตรวจ", false, true],
    ["credentials", "สาขา / คุณวุฒิ / หน่วยงาน", false, true],
    ["quote", "ข้อความหรือจุดที่ไม่ถูกต้อง", true, false],
    ["comment", "ความเห็น / เหตุผลประกอบผลตรวจ", true, true],
    ["correction", "ข้อเสนอแก้ไข / แหล่งอ้างอิง", true, false],
  ]) {
    const wrapper = el("label", label);
    const input = el(multiline ? "textarea" : "input");
    input.required = required;
    input.maxLength = multiline ? 3000 : 200;
    wrapper.append(input);
    form.append(wrapper);
    fields[key] = input;
  }
  const statusLabel = el("label", "ผลการตรวจ");
  const select = el("select");
  for (const [value, label] of Object.entries(LABELS)) {
    const option = el("option", label);
    option.value = value;
    select.append(option);
  }
  statusLabel.append(select);
  const button = el("button", "บันทึกผลตรวจ");
  button.type = "submit";
  const feedback = el("p");
  feedback.setAttribute("role", "status");
  form.append(statusLabel, button, feedback);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!document.body.classList.contains("role-expert")) return;
    const values = Object.fromEntries(Object.entries(fields).map(([key, input]) => [key, input.value.trim()]));
    if (!values.reviewer || !values.credentials || !values.comment ||
        (select.value === "changes" && (!values.quote || !values.correction))) {
      feedback.textContent = "กรอกชื่อ คุณวุฒิ และเหตุผล หากต้องแก้ไขให้ระบุจุดที่ผิดและข้อเสนอด้วย";
      return;
    }
    try {
      const rows = readReviews();
      rows.push({ target, title, snapshot, ...values, status: select.value, at: new Date().toISOString() });
      localStorage.setItem(KEY, JSON.stringify(rows));
      feedback.textContent = "บันทึกแล้ว · ส่งออกผลตรวจเพื่อส่งต่อให้ผู้ดูแลเนื้อหาได้";
      document.querySelectorAll(".review-panel").forEach((node) => node.dispatchEvent(new Event("review-refresh")));
    } catch {
      feedback.textContent = "บันทึกไม่สำเร็จ พื้นที่เต็มหรือเข้าถึงข้อมูลไม่ได้ · ข้อความในฟอร์มยังอยู่";
    }
  });
  panel.addEventListener("review-refresh", refresh);
  panel.append(summary, history, form);
  refresh();
  return panel;
}

export function exportReviews() {
  const rows = readReviews();
  if (!rows.length) return false;
  const url = URL.createObjectURL(new Blob([JSON.stringify({ version: 1, identity_verified: false, reviews: rows }, null, 2)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `expert-reviews-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}
