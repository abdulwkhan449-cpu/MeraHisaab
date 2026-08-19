const CACHE_NAME = 'merahisaab-v2';
const urlsToCache = [
  'index.html',
  'index.css',
  'index.js',
  'report.html',
  'reports.css',
  'reports.js',
  'budget.html',
  'budgets.css',
  'budgets.js',
  'setting.html',
  'settings.css',
  'settings.js',
  'image.png',
  'manifest.json'
];

// Install – cache all files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache opened');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch – serve from cache first, then network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request).catch(() => {
          return caches.match('index.html');
        });
      })
  );
});

// Activate – delete old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
