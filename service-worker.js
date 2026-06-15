/* BBI Africa PWA — service worker
   Cache-first for the app shell, network-first for everything else. */
const CACHE = 'bbi-africa-v31';
const SHELL = [
  './',
  './index.html',
  './dashboard.html',
  './directory.html',
  './profile.html',
  './event.html',
  './framework.html',
  './training.html',
  './mentorship.html',
  './events.html',
  './resources.html',
  './news.html',
  './about.html',
  './get-involved.html',
  './program.html',
  './ecc.html',
  './apply.html',
  './login.html',
  './account.html',
  './admin.html',
  './css/styles.css',
  './js/app.js',
  './js/data.js',
  './js/dashboard.js',
  './js/directory.js',
  './js/map.js',
  './js/admin-shared.js',
  './js/categories.js',
  './js/dir.js',
  './js/cms.js',
  './js/i18n.js',
  './js/offerings.js',
  './js/assistant.js',
  './lang/en.js',
  './lang/fr.js',
  './lang/ar.js',
  './lang/pt.js',
  './lang/es.js',
  './lang/sw.js',
  './assets/img/africa-hero.svg',
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
  // Same-origin: NETWORK-FIRST so the latest code/HTML always loads when
  // online; fall back to cache (then the offline shell) only when offline.
  if (request.mode === 'navigate' || url.origin === self.location.origin) {
    event.respondWith(
      fetch(request)
        .then((resp) => {
          const copy = resp.clone();
          caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
          return resp;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('./index.html')))
    );
  }
});
