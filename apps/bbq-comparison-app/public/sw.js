// Service Worker — BBQ Showroom App
// Strategy:
//   - App shell (HTML, JS, CSS): cache-first, update in background
//   - Product data (JSON): network-first, cache fallback
//   - Images/assets: stale-while-revalidate
//
// This makes idle-reset reloads nearly instant since the app shell
// is served from cache rather than the network.

const CACHE_VERSION = "bbq-showroom-v2";
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const DATA_CACHE = `${CACHE_VERSION}-data`;
const ASSET_CACHE = `${CACHE_VERSION}-assets`;

// App shell files to pre-cache on install
const SHELL_FILES = ["/", "/index.html"];

// ─── Install ──────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_FILES))
      .then(() => self.skipWaiting())
  );
});

// ─── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("bbq-showroom-") && !key.startsWith(CACHE_VERSION))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ─── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin requests we don't want to cache
  if (request.method !== "GET") return;

  // Navigation requests (HTML) → cache-first, background revalidate
  if (request.mode === "navigate") {
    event.respondWith(
      caches.match("/index.html", { cacheName: SHELL_CACHE }).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(SHELL_CACHE).then((c) => c.put("/index.html", clone));
            }
            return response;
          })
      )
    );
    return;
  }

  // Same-origin JS/CSS/fonts (app bundle) → cache-first, background revalidate
  if (url.origin === self.location.origin && /\.(js|css|woff2?|ttf)(\?|$)/.test(url.pathname)) {
    event.respondWith(
      caches.match(request, { cacheName: SHELL_CACHE }).then((cached) => {
        const fetchAndCache = fetch(request).then((response) => {
          if (response.ok) {
            caches.open(SHELL_CACHE).then((c) => c.put(request, response.clone()));
          }
          return response;
        });
        return cached || fetchAndCache;
      })
    );
    return;
  }

  // Product data JSON files → network-first, cache fallback
  if (/\.json(\?|$)/.test(url.pathname)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            caches.open(DATA_CACHE).then((c) => c.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => caches.match(request, { cacheName: DATA_CACHE }))
    );
    return;
  }

  // Images and video assets → stale-while-revalidate
  if (/\.(png|jpe?g|webp|avif|svg|gif|mp4|webm)(\?|$)/.test(url.pathname)) {
    event.respondWith(
      caches.match(request, { cacheName: ASSET_CACHE }).then((cached) => {
        const fetchAndCache = fetch(request).then((response) => {
          if (response.ok) {
            caches.open(ASSET_CACHE).then((c) => c.put(request, response.clone()));
          }
          return response;
        });
        return cached || fetchAndCache;
      })
    );
    return;
  }
});
