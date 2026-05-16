const CACHE = 'dinopop-v1';
const STATIC = [
  '/',
  '/index.html',
  '/manifest.json',
  '/styles.css',
  '/api.js',
  '/icons.jsx',
  '/ui.jsx',
  '/tweaks-panel.jsx',
  '/modals.jsx',
  '/pages.jsx',
  '/app.jsx',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(STATIC)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // API calls → network only (ไม่ cache)
  if (e.request.url.includes('/api/')) {
    e.respondWith(fetch(e.request));
    return;
  }
  // Static assets → cache first, fallback network
  e.respondWith(
    caches.match(e.request).then(
      (cached) => cached || fetch(e.request).then((res) => {
        const clone = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, clone));
        return res;
      })
    )
  );
});
