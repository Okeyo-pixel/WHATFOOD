const CACHE_VERSION = 'letmecook-kenya-v6';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const PRECACHE_URLS = [
  '/',
  '/manifest.webmanifest',
  '/pwa-icon/192',
  '/pwa-icon/512',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== RUNTIME_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname === '/sw.js') return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          const copy = networkResponse.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          return networkResponse;
        })
        .catch(async () => {
          const cachedPage = await caches.match(request);
          return cachedPage || caches.match('/');
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }
        const copy = networkResponse.clone();
        const targetCache = url.pathname.startsWith('/_next/static/')
          ? STATIC_CACHE
          : RUNTIME_CACHE;
        caches.open(targetCache).then((cache) => cache.put(request, copy));
        return networkResponse;
      });
    })
  );
});