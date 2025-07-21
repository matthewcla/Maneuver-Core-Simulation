
// Update CACHE_VERSION on each release to force old caches to clear
const CACHE_VERSION = 'v2';
const CACHE_NAME = `maneuver-cache-${CACHE_VERSION}`;
const ASSETS = [
  '/',
  'index.html',
  'manifest.webmanifest',
  'js/main.js?v=1.0',
  'js/radar-engine.js?v=1.0',
  'js/object-pool.js?v=1.0',
  'js/cpa-worker.js?v=1.0',
  'css/global.css?v=1.0',
  'css/beta.css?v=1.0',
  'offline.html',
  'favicons.svg'
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
  event.respondWith(
    caches.match(event.request).then(resp => resp || fetch(event.request))
  );
});
