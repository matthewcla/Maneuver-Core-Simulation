
// Update CACHE_VERSION on each release to force old caches to clear
const CACHE_VERSION = 'v1';
const CACHE_NAME = `maneuver-cache-${CACHE_VERSION}`;
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/js/main.js',
  '/js/radar-engine.js',
  '/js/object-pool.js',
  '/js/cpa-worker.js',
  '/css/global.css',
  '/css/beta.css',
  '/offline.html',
  '/favicons.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = request.url;

  if (request.method === 'GET' && (url.endsWith('.css') || url.endsWith('.js'))) {
    event.respondWith(
      fetch(request)
        .then(networkResponse => {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => caches.match(request))
    );
  } else {
    event.respondWith(
      caches.match(request).then(resp => resp || fetch(request))
    );
  }
});
