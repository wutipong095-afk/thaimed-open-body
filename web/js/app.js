import { buildAliasIndex, resolveRegionId, needsSideClarify } from "./resolve.js";

const MAP_URL = new URL("../../data/body-pain-map.json", import.meta.url);

const els = {
  detail: document.getElementById("detail"),
  placeholder: document.querySelector(".detail-placeholder"),
  detailBody: document.querySelector(".detail-body"),
  title: document.getElementById("detail-title"),
  en: document.getElementById("detail-en"),
  blurb: document.getElementById("detail-blurb"),
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

  if (options.clarify) {
    showFeedback("ระบุซ้ายหรือขวาให้ชัดเจนได้อีกครั้ง ถ้าตำแหน่งยังไม่ตรง");
  } else {
    hideFeedback();
  }

  // Auto-switch view if region only exists on one silhouette
  maybeSwitchViewForRegion(regionId);
}

function maybeSwitchViewForRegion(regionId) {
  const onAnterior = els.viewAnterior.querySelector(`[data-region="${regionId}"]`);
  const onPosterior = els.viewPosterior.querySelector(`[data-region="${regionId}"]`);
  const anteriorVisible = !els.viewAnterior.hidden;
  if (anteriorVisible && !onAnterior && onPosterior) {
    setView("posterior");
  } else if (!anteriorVisible && !onPosterior && onAnterior) {
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
  els.viewAnterior.hidden = !anterior;
  els.viewPosterior.hidden = anterior;
  els.viewAnterior.classList.toggle("is-visible", anterior);
  els.viewPosterior.classList.toggle("is-visible", !anterior);
  document.querySelectorAll(".view-btn").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.view === view);
  });
  if (activeId) setActiveHotspots(activeId);
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
  try {
    await loadMap();
  } catch (err) {
    els.disclaimer.textContent = String(err.message || err);
    showFeedback(String(err.message || err));
  }
}

main();
