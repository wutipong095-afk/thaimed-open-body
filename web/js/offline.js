/**
 * "Use offline" controls: download the 3D model into the device cache on request.
 * The app shell itself is cached automatically by sw.js.
 */

import { MODEL_URL } from "./body3d.js";

/** Must match MODEL_CACHE in sw.js */
const MODEL_CACHE = "body-pain-model-v1";

/**
 * @param {{ status: HTMLElement, download: HTMLButtonElement, remove: HTMLButtonElement }} els
 */
export function bindOfflineControls(els) {
  if (!("caches" in window) || !("serviceWorker" in navigator)) {
    els.status.textContent = "เบราว์เซอร์นี้ไม่รองรับการใช้ออฟไลน์";
    els.download.hidden = true;
    els.remove.hidden = true;
    return;
  }

  const render = async () => {
    const hasModel = await isModelCached();
    els.status.textContent = hasModel
      ? "พร้อมใช้ออฟไลน์ทั้งแอป รวมโมเดล 3D"
      : "โหมด 2D ใช้ออฟไลน์ได้แล้ว · โมเดล 3D ยังต้องใช้อินเทอร์เน็ต";
    els.download.hidden = hasModel;
    els.remove.hidden = !hasModel;
  };

  els.download.addEventListener("click", async () => {
    els.download.disabled = true;
    els.status.textContent = "กำลังดาวน์โหลดโมเดล 3D (~23 MB)…";
    try {
      await navigator.storage?.persist?.();
      const res = await fetch(MODEL_URL, { cache: "reload" });
      if (!res.ok) throw new Error(String(res.status));
      const cache = await caches.open(MODEL_CACHE);
      await cache.put(MODEL_URL, res);
      await render();
    } catch {
      els.status.textContent = "ดาวน์โหลดโมเดลไม่สำเร็จ — ลองใหม่เมื่อต่ออินเทอร์เน็ต";
    } finally {
      els.download.disabled = false;
    }
  });

  els.remove.addEventListener("click", async () => {
    await caches.delete(MODEL_CACHE);
    await render();
  });

  render();
}

async function isModelCached() {
  try {
    const cache = await caches.open(MODEL_CACHE);
    return Boolean(await cache.match(MODEL_URL));
  } catch {
    return false;
  }
}
