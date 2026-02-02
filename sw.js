var CACHE_NAME = 'artigiano-v60.6';
var urlsToCache = ['/', '/index.html', '/styles.css', '/script.js'];

self.addEventListener('install', function(event) {
  event.waitUntil(caches.open(CACHE_NAME).then(function(cache) { return cache.addAll(urlsToCache); }));
});

self.addEventListener('fetch', function(event) {
  event.respondWith(caches.match(event.request).then(function(response) { return response || fetch(event.request); }));
});