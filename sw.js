
const CACHE_NAME = 'gemini-image-editor-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/index.tsx',
  '/App.tsx',
  '/components/Header.tsx',
  '/components/ImageEditor.tsx',
  '/components/icons/DownloadIcon.tsx',
  '/components/icons/SparklesIcon.tsx',
  '/components/icons/SpinnerIcon.tsx',
  '/components/icons/UploadIcon.tsx',
  '/services/geminiService.ts'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        // Use addAll with a catch block to handle potential individual asset failures
        return cache.addAll(urlsToCache).catch(error => {
          console.error('Failed to cache one or more resources:', error);
        });
      })
  );
});

self.addEventListener('fetch', (event) => {
  // We only want to cache GET requests.
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // If we have a cached response, return it.
        if (response) {
          return response;
        }

        // Otherwise, fetch from the network.
        return fetch(event.request).then((networkResponse) => {
          // We don't cache responses from the Gemini API or other external resources.
          // This logic can be expanded to be more specific if needed.
          return networkResponse;
        });
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
