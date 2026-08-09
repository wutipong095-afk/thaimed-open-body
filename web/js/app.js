import { buildAliasIndex, resolveRegionId, needsSideClarify } from "./resolve.js";
import { Body3D, canUseWebGL } from "./body3d.js";
import { formatMuscleLabelThEn } from "./muscleNames.js";
import {
  loadSession,
  saveSession,
  pushSessionItem,
  sessionToNote,
} from "./session.js";

const MAP_URL = new URL("../../data/body-pain-map.json", import.meta.url);
const KNOWLEDGE_URL = "/api/knowledge";

const els = {
  detail: document.getElementById("detail"),
  placeholder: document.querySelector(".detail-placeholder"),
  detailBody: document.querySelector(".detail-body"),
  title: document.getElementById("detail-title"),
  en: document.getElementById("detail-en"),
  muscle: document.getElementById("detail-muscle"),
  muscleEn: document.getElementById("detail-muscle-en"),
  blurb: document.getElementById("detail-blurb"),
  modelCredit: document.getElementById("model-credit"),
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
  figure2d: document.getElementById("figure-2d"),
  figure3d: document.getElementById("figure-3d"),
  view2dToggle: document.getElementById("view-2d-toggle"),
  stageHint: document.getElementById("stage-hint"),
  sessionList: document.getElementById("session-list"),
  btnExport: document.getElementById("btn-export-session"),
  btnClear: document.getElementById("btn-clear-session"),
};

let regionsById = new Map();
let aliasIndex = [];
let activeId = null;
let knowledgeSeq = 0;
let mode = "2d";
/** @type {Body3D | null} */
let body3d = null;
let session = loadSession();

function fillList(ul, items, emptyLabel) {
  ul.innerHTML = "";
  const list = items && items.length ? items : [emptyLabel];
  for (const item of list) {
    const li = document.createElement("li");
    li.textContent = item;
    ul.appendChild(li);
  }
}

function setActiveHotspots(regionId, options = {}) {
  document.querySelectorAll(".hotspot").forEach((el) => {
    el.classList.toggle("is-active", el.dataset.region === regionId);
  });
  // Avoid wiping the clicked GLB mesh highlight when syncing from 3D.
  if (options.from3d && options.mesh) {
    body3d?.setActive(regionId, options.mesh);
  } else if (!options.from3d) {
    body3d?.setActive(regionId);
  }
}

function persistSession() {
  saveSession(session);
  renderSessionList();
}

function renderSessionList() {
  els.sessionList.innerHTML = "";
  for (const item of session.items) {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = item.name_th;
    btn.addEventListener("click", () => showRegion(item.id, { skipSession: true }));
    li.appendChild(btn);
    els.sessionList.appendChild(li);
  }
}

function setRole(role) {
  session.role = role === "learner" ? "learner" : "patient";
  document.body.classList.toggle("role-patient", session.role === "patient");
  document.body.classList.toggle("role-learner", session.role === "learner");
  document.querySelectorAll(".role-btn").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.role === session.role);
  });
  persistSession();
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
  setActiveHotspots(regionId, options);

  els.detail.classList.remove("is-empty");
  els.placeholder.hidden = true;
  els.detailBody.hidden = false;
  els.title.textContent = region.name_th;
  els.en.textContent = session.role === "learner" ? region.name_en || "" : "";
  let muscleLabel = null;
  if (options.muscleName) {
    muscleLabel = formatMuscleLabelThEn(options.muscleName, options.side || "mid");
    els.muscle.hidden = false;
    els.muscle.textContent = `กล้ามเนื้อที่แตะ: ${muscleLabel.lineTh}`;
    if (els.muscleEn) {
      els.muscleEn.hidden = false;
      els.muscleEn.textContent = muscleLabel.la
        ? `${muscleLabel.en} · ${muscleLabel.la}`
        : muscleLabel.en;
    }
  } else {
    els.muscle.hidden = true;
    els.muscle.textContent = "";
    if (els.muscleEn) {
      els.muscleEn.hidden = true;
      els.muscleEn.textContent = "";
    }
  }
  const blurb = region.patient_blurb_th || "";
  els.blurb.textContent = muscleLabel
    ? `${blurb}\n\n(จากกล้ามเนื้อ: ${muscleLabel.lineFull})`
    : blurb;
  els.id.textContent = region.id;
  fillList(els.wiki, region.wiki_refs, "—");
  fillList(els.sen, region.sen_refs, "—");
  fillList(els.followups, ["กำลังโหลด…"], "—");
  els.vault.innerHTML = "";

  if (!options.skipSession) {
    const label = muscleLabel
      ? `${region.name_th} · ${muscleLabel.lineTh}`
      : region.name_th;
    session.items = pushSessionItem(session.items, {
      id: region.id,
      name_th: label,
      at: new Date().toLocaleString("th-TH"),
    });
    persistSession();
  }

  if (options.clarify) {
    showFeedback("ระบุซ้ายหรือขวาให้ชัดเจนได้อีกครั้ง ถ้าตำแหน่งยังไม่ตรง");
  } else {
    hideFeedback();
  }

  if (mode === "2d") maybeSwitchViewForRegion(regionId);
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

function ensure3d() {
  if (body3d) return true;
  if (!canUseWebGL()) {
    showFeedback("เครื่องนี้ไม่รองรับ WebGL — ใช้โหมด 2D แทน");
    return false;
  }
  try {
    body3d = new Body3D(els.figure3d, {
      onSelect: (regionId, meta = {}) => {
        showRegion(regionId, {
          muscleName: meta.muscleName,
          side: meta.side,
          mesh: meta.mesh,
          from3d: true,
        });
      },
      onStatus: (msg) => {
        els.stageHint.textContent = msg;
      },
    });
    if (activeId) body3d.setActive(activeId);
    return true;
  } catch (err) {
    console.error(err);
    showFeedback("เปิด 3D ไม่ได้ — กลับไปโหมด 2D");
    return false;
  }
}

function setMode(next) {
  if (next === "3d") {
    if (!ensure3d()) {
      next = "2d";
    }
  }

  mode = next;
  const is3d = mode === "3d";
  els.figure2d.hidden = is3d;
  els.figure3d.hidden = !is3d;
  els.view2dToggle.hidden = is3d;
  els.stageHint.textContent = is3d
    ? "ลากเพื่อหมุน · คลิกกล้ามเนื้อ · สลับกลับ 2D ได้ด้านบน"
    : "แตะหรือคลิกบริเวณที่เจ็บ · สลับด้านหน้า/ด้านหลังด้านบน";
  if (els.modelCredit) els.modelCredit.hidden = !is3d;

  document.querySelectorAll(".mode-btn").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.mode === mode);
  });

  if (is3d) {
    body3d?.resize();
    if (activeId) body3d?.setActive(activeId);
  }
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

function bindModeToggle() {
  document.querySelectorAll(".mode-btn").forEach((btn) => {
    btn.addEventListener("click", () => setMode(btn.dataset.mode));
  });
}

function bindRoleToggle() {
  document.querySelectorAll(".role-btn").forEach((btn) => {
    btn.addEventListener("click", () => setRole(btn.dataset.role));
  });
}

function bindSessionActions() {
  els.btnClear.addEventListener("click", () => {
    session.items = [];
    persistSession();
    body3d?.clearSelectionColors?.();
  });
  els.btnExport.addEventListener("click", () => {
    const text = sessionToNote(session.items);
    const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `pain-session-${stamp}.md`;
    a.click();
    URL.revokeObjectURL(url);
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

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      /* offline shell optional */
    });
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
  bindModeToggle();
  bindRoleToggle();
  bindSessionActions();
  bindSearch();
  registerServiceWorker();
  setRole(session.role);
  renderSessionList();
  setView("anterior");
  setMode("2d");
  try {
    await loadMap();
  } catch (err) {
    els.disclaimer.textContent = String(err.message || err);
    showFeedback(String(err.message || err));
  }
}

main();
