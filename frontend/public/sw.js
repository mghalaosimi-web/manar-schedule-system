const CACHE_NAME = 'manar-cache-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.json'
];

// Install Event - cache core static shells
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate Event - clean old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - network first for API, cache first for static assets
self.addEventListener('fetch', (e) => {
  // 1. Bypass Service Worker for non-GET requests (POST register/login, etc.)
  if (e.request.method !== 'GET') {
    return;
  }

  const url = new URL(e.request.url);

  // 2. Bypass Service Worker for ALL API requests to prevent network/CORS/state issues
  if (url.pathname.includes('/api/')) {
    return;
  }

  // 3. Otherwise, use cache first, then network fallback for assets
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(e.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, responseToCache);
        });
        return networkResponse;
      });
    })
  );
});
