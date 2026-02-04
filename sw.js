const CACHE_NAME = 'artigiano-v0.0.02'; // Nova versão para forçar atualização
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './main.js',
  './manifest.json',
  './modules/auth.js',
  './modules/dashboard.js'
];

// Instalação: Garante que o novo cache seja criado imediatamente
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Criando cache v0.0.02');
      return cache.addAll(ASSETS);
    })
  );
});

// Ativação: O passo mais importante - apaga TODA a cache antiga
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('Removendo cache antiga:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim()) // Força o app a usar o novo SW na hora
  );
});

// Estratégia: Tenta buscar na rede primeiro para garantir que você veja as mudanças
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
