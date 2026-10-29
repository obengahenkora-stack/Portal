const CACHE_NAME = 'ce-portal-v15';
const urlsToCache = [
  'index.html',
  'theme.css',
  'theme.js',
  'quotes.js',
  'motion.js',
  'services-motion.js',
  'pw-tools.js',
  'db-sync.js',
  'blog.html','services.html',
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
  const req = event.request;
  if(req.method !== 'GET'){ return; }
  const url = req.url;
  // Live data (database and storage) is never cached, so it always stays fresh.
  if(url.indexOf('supabase.co') >= 0 || url.indexOf('jsonbin.io') >= 0){ return; }
  // Network-first. Every successful page/script is remembered so the portal can open offline later.
  event.respondWith(
    fetch(req).then((res) => {
      if(res && (res.ok || res.type === 'opaque')){
        const copy = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => {});
      }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }))
  );
});
