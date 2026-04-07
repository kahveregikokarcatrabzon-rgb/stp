self.addEventListener('install', (e) => {
  console.log('[Service Worker] Uygulama Motoru Kuruldu');
});

self.addEventListener('fetch', (e) => {
  e.respondWith(fetch(e.request).catch(() => console.log('İnternet yok, çevrimdışı mod çalışıyor...')));
});
