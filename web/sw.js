/* Offline-first shell: the whole app runs from this device after the first visit.
 * The 3D model (~23 MB) is cached separately, only when the user asks for it
 * (see js/offline.js). Bump SHELL_CACHE whenever any file in ASSETS changes. */
const SHELL_CACHE = "body-pain-shell-v2";
const MODEL_CACHE = "body-pain-model-v1";
const KEEP = [SHELL_CACHE, MODEL_CACHE];

// Keep in sync with the files under web/ — scripts/check-offline.py verifies it.
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon.svg",
  "./css/styles.css",
  "./js/app.js",
  "./js/body3d.js",
  "./js/muscleNames.js",
  "./js/muscleRegion.js",
  "./js/offline.js",
  "./js/resolve.js",
  "./js/session.js",
  "./vendor/three/build/three.module.js",
  "./vendor/three/build/three.core.js",
  "./vendor/three/addons/controls/OrbitControls.js",
  "./vendor/three/addons/loaders/DRACOLoader.js",
  "./vendor/three/addons/loaders/GLTFLoader.js",
  "./vendor/three/addons/utils/BufferGeometryUtils.js",
  "./vendor/draco/draco_decoder.js",
  "./vendor/draco/draco_decoder.wasm",
  "./vendor/draco/draco_wasm_wrapper.js",
  "./vendor/fonts/fonts.css",
  "./vendor/fonts/manrope-latin-500-normal.woff2",
  "./vendor/fonts/manrope-latin-700-normal.woff2",
  "./vendor/fonts/manrope-latin-800-normal.woff2",
  "./vendor/fonts/sarabun-latin-400-normal.woff2",
  "./vendor/fonts/sarabun-latin-600-normal.woff2",
  "./vendor/fonts/sarabun-latin-700-normal.woff2",
  "./vendor/fonts/sarabun-thai-400-normal.woff2",
  "./vendor/fonts/sarabun-thai-600-normal.woff2",
  "./vendor/fonts/sarabun-thai-700-normal.woff2",
  "../data/body-pain-map.json",
  "../data/region-followups.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => !KEEP.includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // Never serve or store anything from other origins.
  if (url.origin !== self.location.origin) return;

  // Local knowledge API (serve-web.py only): always network.
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request).catch(() => new Response(JSON.stringify({ ok: false, offline: true }), {
        headers: { "Content-Type": "application/json" },
      }))
    );
    return;
  }

  // 3D model: from the model cache if the user downloaded it, otherwise network (not stored).
  if (url.pathname.endsWith(".glb") || url.pathname.endsWith(".gltf")) {
    event.respondWith(
      caches.open(MODEL_CACHE).then((cache) =>
        cache.match(request).then((hit) => hit || fetch(request))
      )
    );
    return;
  }

  // App files: cache first, refresh in the background.
  event.respondWith(
    caches.open(SHELL_CACHE).then((cache) =>
      cache.match(request, { ignoreSearch: true }).then((cached) => {
        const network = fetch(request)
          .then((res) => {
            if (res && res.ok) cache.put(request, res.clone());
            return res;
          })
          .catch(() => cached);
        return cached || network;
      })
    )
  );
});
