self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('is2-store').then((cache) => cache.addAll([
      '/',
      '/index.html',
      '/style.css',
      '/script.js',
      '/icon.png'
    ]))
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request))
  );
});
