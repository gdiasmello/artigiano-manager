const CACHE_NAME = 'artigiano-v1.5';
const ASSETS = [
  './',
  'index.html',
  'style.css',
  'main.js',
  'manifest.json'
];

// Instala e faz o cache dos arquivos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// Responde com o cache quando estiver offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
