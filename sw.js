const CACHE_NAME = 'ce-portal-v2';
const urlsToCache = [
  'index.html',
  'blog.html',
  'portal.html',
  'manifest.json',
  'icon-192.png',
  'icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Network-first for everything so live data (scores, posts, attendance) always stays fresh.
  // Falls back to cache only if the network is unavailable (offline).
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
