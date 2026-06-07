/* BBI Africa PWA — service worker
   Cache-first for the app shell, network-first for everything else. */
const CACHE = 'bbi-africa-v2';
const SHELL = [
  './',
  './index.html',
  './dashboard.html',
  './directory.html',
  './framework.html',
  './training.html',
  './resources.html',
  './news.html',
  './about.html',
  './css/styles.css',
  './js/app.js',
  './js/data.js',
  './js/dashboard.js',
  './js/directory.js',
  './manifest.webmanifest',
  './assets/icons/icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Navigation & same-origin: cache-first, fall back to network, then offline shell.
  if (request.mode === 'navigate' || url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((resp) => {
            const copy = resp.clone();
            caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
            return resp;
          })
          .catch(() => cached || caches.match('./index.html'));
        return cached || network;
      })
    );
  }
});
