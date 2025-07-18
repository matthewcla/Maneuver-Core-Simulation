const CACHE_NAME = 'maneuver-shell-v1';
const OFFLINE_URL = '/offline.html';
const PRECACHE_RESOURCES = [
  '/',
  '/index.html',
  '/main.js',
  '/styles.css',
  '/icon-192.png',
  '/icon-512.png',
  '/js/arena.js',
  '/css/global.css',
  '/css/beta.css',
  OFFLINE_URL
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_RESOURCES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).catch(() => caches.match(OFFLINE_URL));
    })
  );
});
