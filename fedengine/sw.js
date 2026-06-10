const CACHE_NAME = 'fedengine-cache-v8';

const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './auth.js',
    './manifest.json',
    './logo.png',
    './00-Main/home.html',
    './00-Main/home.js',
    './00-Main/D99.html',
    './03-Dono/index.html',
    './03-Dono/dono.css',
    './03-Dono/dono.js',
    './04-BagTag/index.html',
    './04-BagTag/bagtag.css',
    './04-BagTag/bagtag.js',
    './07-eCom/index.html',
    './07-eCom/ecom.css',
    './07-eCom/ecom.js',
    './09-Comms/index.html',
    './09-Comms/comms.css',
    './09-Comms/comms.js'
];

// Install Event: Cache Core Terminal Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Flush Outdated Terminal Caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Interception Strategy
self.addEventListener('fetch', (event) => {
  // Skip cross-origin and Firestore live synchronization requests
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});