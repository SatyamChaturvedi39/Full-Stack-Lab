const CACHE_NAME = 'digvijay-cache-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/data.json',
  '/sw.js'
];

// install: cache app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// activate: cleanup old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => k !== CACHE_NAME ? caches.delete(k) : null)))
  );
  self.clients.claim();
});

// fetch: network-first for data.json; fallback to cache if offline.
// For other assets, try cache first then network.
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // handle data.json specially (network-first)
  if (url.pathname.endsWith('/data.json') || url.pathname.endsWith('data.json')) {
    event.respondWith(
      fetch(event.request).then(resp => {
        // put a clone in cache
        const copy = resp.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return resp;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  // for index.html and sw.js and others, prefer cache, fall back to network
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).catch(() => {
      // final fallback: if request is navigation, show cached index.html
      if (event.request.mode === 'navigate') return caches.match('/index.html');
    }))
  );
});
