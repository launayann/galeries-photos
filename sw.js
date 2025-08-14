const CACHE_NAME = 'galerie-photos-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/gallery.js',
  '/photos.json'
];

// Installation du Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache ouvert');
        return cache.addAll(urlsToCache);
      })
  );
});

// Interception des requêtes
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Retourner la version en cache si disponible
        if (response) {
          return response;
        }
        
        // Sinon, récupérer depuis le réseau
        return fetch(event.request).then(response => {
          // Vérifier si la réponse est valide
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Cloner la réponse pour la mettre en cache
          const responseToCache = response.clone();
          
          // Mettre en cache les images et autres ressources
          if (event.request.url.includes('optimized/') || 
              event.request.url.includes('.jpg') || 
              event.request.url.includes('.jpeg') || 
              event.request.url.includes('.png')) {
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
          }
          
          return response;
        });
      })
  );
});

// Mise à jour du cache
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Suppression du cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});