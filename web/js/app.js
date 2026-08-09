import { buildAliasIndex, resolveRegionId, needsSideClarify } from "./resolve.js";

const MAP_URL = new URL("../../data/body-pain-map.json", import.meta.url);
const KNOWLEDGE_URL = "/api/knowledge";

const els = {
  detail: document.getElementById("detail"),
  placeholder: document.querySelector(".detail-placeholder"),
  detailBody: document.querySelector(".detail-body"),
  title: document.getElementById("detail-title"),
  en: document.getElementById("detail-en"),
  blurb: document.getElementById("detail-blurb"),
  followups: document.getElementById("detail-followups"),
  vaultStatus: document.getElementById("vault-status"),
  vault: document.getElementById("detail-vault"),
  wiki: document.getElementById("detail-wiki"),
  sen: document.getElementById("detail-sen"),
  id: document.getElementById("detail-id"),
  disclaimer: document.getElementById("disclaimer"),
  form: document.getElementById("search-form"),
  input: document.getElementById("pain-input"),
  feedback: document.getElementById("search-feedback"),
  viewAnterior: document.getElementById("view-anterior"),
  viewPosterior: document.getElementById("view-posterior"),
};

let regionsById = new Map();
let aliasIndex = [];
let activeId = null;
let knowledgeSeq = 0;

function fillList(ul, items, emptyLabel) {
  ul.innerHTML = "";
  const list = items && items.length ? items : [emptyLabel];
  for (const item of list) {
    const li = document.createElement("li");
    li.textContent = item;
    ul.appendChild(li);
  }
}

function setActiveHotspots(regionId) {
  document.querySelectorAll(".hotspot").forEach((el) => {
    el.classList.toggle("is-active", el.dataset.region === regionId);
  });
}

function renderVault(fromVault) {
  els.vault.innerHTML = "";
  if (!fromVault || !fromVault.available) {
    els.vaultStatus.textContent =
      "ยังไม่เชื่อมคลังท้องถิ่น — ใช้คำอธิบายจากแผนที่ได้ตามปกติ";
    return;
  }

  const items = fromVault.items || [];
  const okItems = items.filter((i) => i.ok);
  els.vaultStatus.textContent = okItems.length
    ? `ดึงจาก vault ได้ ${okItems.length} โน้ต`
    : "พบโฟลเดอร์คลัง แต่ยังอ่านโน้ตที่ลิงก์ไม่ได้";

  for (const item of items) {
    const card = document.createElement("div");
    card.className = "vault-card" + (item.ok ? "" : " is-missing");
    const h = document.createElement("h4");
    h.textContent = item.ref;
    const p = document.createElement("p");
    p.textContent = item.ok ? item.excerpt : `ไม่พบไฟล์ (${item.error || "missing"})`;
    card.append(h, p);
    els.vault.appendChild(card);
  }
}

async function loadKnowledge(regionId) {
  const seq = ++knowledgeSeq;
  els.vaultStatus.textContent = "กำลังโหลดจากคลัง…";
  els.vault.innerHTML = "";
  try {
    const res = await fetch(`${KNOWLEDGE_URL}?region_id=${encodeURIComponent(regionId)}`);
    const data = await res.json();
    if (seq !== knowledgeSeq || activeId !== regionId) return;
    if (!data.ok) {
      els.vaultStatus.textContent = "โหลดความรู้เสริมไม่ได้ — ใช้แผนที่อย่างเดียว";
      fillList(els.followups, [], "—");
      return;
    }
    if (data.from_map?.blurb_th) {
      els.blurb.textContent = data.from_map.blurb_th;
    }
    fillList(els.followups, data.followups?.questions || [], "—");
    fillList(els.wiki, data.from_map?.wiki_refs || [], "—");
    fillList(els.sen, data.from_map?.sen_refs || [], "—");
    renderVault(data.from_vault);
  } catch {
    if (seq !== knowledgeSeq || activeId !== regionId) return;
    els.vaultStatus.textContent =
      "เซิร์ฟเวอร์ความรู้ไม่พร้อม — ใช้คำอธิบายจากแผนที่ (รีสตาร์ท serve-web.py ถ้าต้องการคลัง)";
    fillList(els.followups, [], "—");
  }
}

function showRegion(regionId, options = {}) {
  const region = regionsById.get(regionId);
  if (!region) {
    showFeedback(`ไม่พบโซน ${regionId}`);
    return;
  }

  activeId = regionId;
  setActiveHotspots(regionId);

  els.detail.classList.remove("is-empty");
  els.placeholder.hidden = true;
  els.detailBody.hidden = false;
  els.title.textContent = region.name_th;
  els.en.textContent = region.name_en || "";
  els.blurb.textContent = region.patient_blurb_th || "";
  els.id.textContent = region.id;
  fillList(els.wiki, region.wiki_refs, "—");
  fillList(els.sen, region.sen_refs, "—");
  fillList(els.followups, ["กำลังโหลด…"], "—");
  els.vault.innerHTML = "";

  if (options.clarify) {
    showFeedback("ระบุซ้ายหรือขวาให้ชัดเจนได้อีกครั้ง ถ้าตำแหน่งยังไม่ตรง");
  } else {
    hideFeedback();
  }

  maybeSwitchViewForRegion(regionId);
  loadKnowledge(regionId);
}

function maybeSwitchViewForRegion(regionId) {
  const onAnterior = els.viewAnterior.querySelector(`[data-region="${regionId}"]`);
  const onPosterior = els.viewPosterior.querySelector(`[data-region="${regionId}"]`);
  const view = currentView();
  if (view === "anterior" && !onAnterior && onPosterior) {
    setView("posterior");
  } else if (view === "posterior" && !onPosterior && onAnterior) {
    setView("anterior");
  }
}

function showFeedback(msg) {
  els.feedback.hidden = false;
  els.feedback.textContent = msg;
}

function hideFeedback() {
  els.feedback.hidden = true;
  els.feedback.textContent = "";
}

function setView(view) {
  const anterior = view === "anterior";
  els.viewAnterior.classList.toggle("is-visible", anterior);
  els.viewPosterior.classList.toggle("is-visible", !anterior);
  els.viewAnterior.setAttribute("aria-hidden", anterior ? "false" : "true");
  els.viewPosterior.setAttribute("aria-hidden", anterior ? "true" : "false");
  document.querySelectorAll(".view-btn").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.view === view);
  });
  if (activeId) setActiveHotspots(activeId);
}

function currentView() {
  return els.viewPosterior.classList.contains("is-visible") ? "posterior" : "anterior";
}

function bindHotspots() {
  document.querySelectorAll(".hotspot").forEach((el) => {
    el.setAttribute("tabindex", "0");
    el.setAttribute("role", "button");
    const activate = () => showRegion(el.dataset.region);
    el.addEventListener("click", activate);
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        activate();
      }
    });
  });
}

function bindViewToggle() {
  document.querySelectorAll(".view-btn").forEach((btn) => {
    btn.addEventListener("click", () => setView(btn.dataset.view));
  });
}

function bindSearch() {
  els.form.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = els.input.value;
    const id = resolveRegionId(q, aliasIndex);
    if (!id) {
      showFeedback("หาตำแหน่งไม่เจอ — ลองคำอย่าง บ่าขวา, เอวซ้าย, ต้นคอ, สะบัก");
      return;
    }
    const region = regionsById.get(id);
    const clarify = needsSideClarify(q, region);
    showRegion(id, { clarify });
  });
}

async function loadMap() {
  const res = await fetch(MAP_URL);
  if (!res.ok) {
    throw new Error(`โหลดแผนที่ไม่ได้ (${res.status}) — เปิดผ่าน scripts/serve-web.py`);
  }
  const data = await res.json();
  regionsById = new Map((data.regions || []).map((r) => [r.id, r]));
  aliasIndex = buildAliasIndex(data.regions || []);
  els.disclaimer.textContent = data.disclaimer_th || "";
}

async function main() {
  bindHotspots();
  bindViewToggle();
  bindSearch();
  setView("anterior");
  try {
    await loadMap();
  } catch (err) {
    els.disclaimer.textContent = String(err.message || err);
    showFeedback(String(err.message || err));
  }
}

main();
