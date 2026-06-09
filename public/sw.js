/* Mosaic service worker — minimal, safe for a server-centric app.
 * Navigations are network-first with an offline fallback (never serving stale
 * authenticated HTML); hashed static assets and brand/images are cache-first
 * with a background refresh. Non-GET (server actions), API and auth requests
 * are left untouched. */

const VERSION = "v1";
const CACHE = `mosaic-${VERSION}`;
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll([OFFLINE_URL]))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

const STATIC_RE = /^\/(?:_next\/static|brand|images|fonts)\//;
const ASSET_RE = /\.(?:js|css|woff2?|png|jpe?g|svg|gif|webp|avif|ico)$/;

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") {
    return;
  }
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }
  if (url.pathname.startsWith("/api") || url.pathname.startsWith("/auth")) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL).then((cached) => cached ?? Response.error())),
    );
    return;
  }

  if (STATIC_RE.test(url.pathname) || ASSET_RE.test(url.pathname)) {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const refresh = fetch(request)
          .then(async (response) => {
            if (response.ok) {
              await cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => cached);
        if (cached) {
          event.waitUntil(refresh);
          return cached;
        }
        return refresh;
      }),
    );
  }
});
