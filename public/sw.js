const CACHE_VERSION = 'whatfood-wangige-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const PRECACHE_URLS = [
  '/',
  '/manifest.webmanifest',
  '/pwa-icon/192',
  '/pwa-icon/512',
];

// 1. Install: Pre-cache the core app shell and PWA icons
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// 2. Activate: Purge outdated cache versions and take immediate control
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

// 3. Fetch: Network-first for page navigations, Cache-first for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only intercept same-origin GET requests
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never cache the service worker script itself
  if (url.pathname === '/sw.js') return;

  // HTML Navigation requests -> Network-First with cached '/' fallback
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

  // Static JS/CSS chunks (/_next/static/), fonts, and PWA icons -> Cache-First
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

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