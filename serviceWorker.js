const CACHE_VERSION = 134;

// Names of the two caches used in this version of the service worker.
// Change to v2, etc. when you update any of the local resources, which will
// in turn trigger the install event again.
const PRECACHE = 'precache-v' + CACHE_VERSION;
const RUNTIME = 'runtime-v' + CACHE_VERSION;
const CURRENT_CACHES = [PRECACHE, RUNTIME];

const PRECACHE_URLS = [
  './', // Alias for index.html
  'index.html',
  'home.html',
  'circuitGridPuzzle.html',
  'tangledGraphPuzzle.html',
  'arithmeticGridPuzzle.html',
  'lightSwitchesPuzzle.html',
  'sliderPathPuzzle.html',
  'colorPiecesGridPuzzle.html',
  'tetrominoGridPuzzle.html',
  'logicGridPuzzle.html',
  'gridMirrorPuzzle.html',
  'shiftingGridPuzzle.html',
  'markedLoopPuzzle.html',
  'emittersGridPuzzle.html',
  'styles.css',
  'common.js',
  'manifest.json',
  'sounds/AnvilImpact.mp3',
  'sounds/BoingSound.mp3',
  'sounds/Chime_musical_BLASTWAVEFX_16367.mp3',
  'sounds/Click.mp3',
  'sounds/Rollover_electronic_warp_BLASTWAVEFX_06209.mp3',
  'sounds/space_beep_3.mp3'
];

// The install handler takes care of precaching the resources we always need.
self.addEventListener('install', event => {
  event.waitUntil(
  caches.open(PRECACHE)
    .then(cache => cache.addAll(PRECACHE_URLS))
    .then(self.skipWaiting())
  );
});

// The activate handler takes care of cleaning up old caches.
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return cacheNames.filter(cacheName => !CURRENT_CACHES.includes(cacheName));
    }).then(cachesToDelete => {
      return Promise.all(cachesToDelete.map(cacheToDelete => {
        return caches.delete(cacheToDelete);
      }));
    }).then(() => self.clients.claim())
  );
});

// The fetch handler serves responses for resources from a cache.
// If no response is found, it populates the runtime cache with the response
// from the network before returning it to the page.
self.addEventListener('fetch', event => {
  if (event.request.url.indexOf('http') === 0) {
    if (event.request.headers.get('range')) {
      event.respondWith(caches.match(event.request.url)
        .then(function(res) {
          if (!res) {
            return fetch(event.request)
            /*.then(res => {
            const clonedRes = res.clone();
            return caches
              .open(CURRENT_CACHES.prefetch)
              .then(cache => cache.put(event.request, clonedRes)).catch(err => {
                console.error(err);
              }).then(() => res);
            })*/
            .then(res => {
              return res.arrayBuffer();
            });
          }

          return res.arrayBuffer();
        }).then(function(arrayBuffer) {
          const bytes = /^bytes\=(\d+)\-(\d+)?$/g.exec(
            event.request.headers.get('range')
          );

          if (bytes) {
            const start = Number(bytes[1]);
            const end = Number(bytes[2]) || arrayBuffer.byteLength - 1;
            return new Response(arrayBuffer.slice(start, end + 1), {
              status: 206,
              statusText: 'Partial Content',
              headers: [
                ['Content-Range', `bytes ${start}-${end}/${arrayBuffer.byteLength}`]
              ]
            });
          } else {
            return new Response(null, {
              status: 416,
              statusText: 'Range Not Satisfiable',
              headers: [['Content-Range', `*/${arrayBuffer.byteLength}`]]
            });
          }
        }));
      } else {
        let url = event.request.url.split('?')[0];

        event.respondWith(
          caches.match(url).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }

          return caches.open(RUNTIME).then(cache => {
            return fetch(event.request).then(response => {
              // Put a copy of the response in the runtime cache.
              return cache.put(url, response.clone()).catch(err => {
                console.error(err);
              }).then(() => {
                return response;
              });
            });
          });
        })
      );
    }
  }
});
