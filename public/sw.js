// Kill-switch service worker.
// Unregisters itself and reloads all open windows so clients pick up
// the latest JS bundles without a manual refresh.
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.registration.unregister())
      .then(() =>
        self.clients.matchAll({ type: "window" }).then((clients) => {
          clients.forEach((c) => c.navigate(c.url));
        })
      )
  );
});
