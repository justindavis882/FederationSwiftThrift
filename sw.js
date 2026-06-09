const CACHE_NAME = 'fed-engine-v1.2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/00-Main/home.html',   // Updated path
  '/00-Main/D99.html',    // Updated path
  '/style.css',
  '/script.js',
  '/auth.js',
  '/logo.png'
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