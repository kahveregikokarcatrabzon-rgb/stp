const CACHE_NAME = 'stp-cache-v13.0';

// Önbelleğe alınacak statik dosyalar (Çevrimdışı çalışabilmesi için)
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/Turf.js/6.5.0/turf.min.js',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
];

// 1. Kurulum (Install) Aşaması: Dosyaları önbelleğe al
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Yeni versiyonu beklemeden hemen kur
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Statik dosyalar önbelleğe alınıyor...');
        return Promise.allSettled(urlsToCache.map(url => cache.add(url).catch(e => console.warn("Önbellek atlandı:", url))));
      })
  );
});

// 2. Aktivasyon (Activate) Aşaması: Eski önbellekleri temizle (Güncelleme Motorunu Tetikler)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName.startsWith('stp-cache-')) {
            console.log('[Service Worker] Eski önbellek silindi:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. İstek Yakalama (Fetch) Aşaması: Arazide internet yoksa önbellekten (Cache) sun
self.addEventListener('fetch', (event) => {
  // Google Script (Veritabanı) isteklerini ASLA önbelleğe alma!
  if (event.request.url.includes('script.google.com') || event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Önbellekte varsa onu ver, yoksa internetten (Ağdan) çekmeye çalış
        return response || fetch(event.request).then(fetchRes => {
          // İnternetten çekilen yeni dış harita (GIST) vb. dosyaları da hafızaya al
          return caches.open(CACHE_NAME).then(cache => {
            if (event.request.url.startsWith('http')) {
               cache.put(event.request, fetchRes.clone());
            }
            return fetchRes;
          });
        });
      }).catch(() => {
        console.log('[Service Worker] İnternet yok, çevrimdışı işlem yapılıyor.');
      })
  );
});
