/* Hafeez Communication service worker.
 * Deliberately conservative: navigations are network-FIRST (so admin data is
 * never served stale), falling back to a cached offline page only when the
 * network is unavailable. Static assets (icons, hashed _next build files) are
 * cache-first. Never touches non-GET requests. */
const CACHE = "hc-cache-v1";
const PRECACHE = ["/offline", "/icons/icon-192.png", "/icons/icon-512.png", "/HC-Logo.jpeg"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).catch(() => {}),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // App-shell navigations: network-first, offline fallback.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() =>
        caches.match("/offline").then((r) => r || caches.match("/HC-Logo.jpeg")),
      ),
    );
    return;
  }

  // Immutable static assets: cache-first.
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/HC-Logo.jpeg"
  ) {
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
            return res;
          }),
      ),
    );
  }
});
