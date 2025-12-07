let CACHE_VERSION = 254;
const CACHE_NAME = `infinite-puzzles-v${CACHE_VERSION}`;

/*
 * TODO:
 *
 * Add keyboard support for the Slider Path Puzzle with arrow keys, at least?
 * Tetromino Grid Puzzle and Color Pieces Puzzle would need a way to tab through each piece,
 * showing keyboard focus, move it with arrow keys, snapping to the grid, and rotating it with space?
 * Maybe use number keys for the Light Switches Puzzle?
 * Arithmetic Grid Puzzle could number the tiles 1-9, showing the labels only while :focus-visible is true?
 * Circuit Grid Puzzle could be similar, with left/right arrow keys for rotation
 * Shifting Grid Puzzle could select a tile just for keyboard controls using same coordinate system,
 * then shift tiles with arrow keys (but too many tiles at largest difficulty unless I use rapid succession...)
 * For the Tangled Graph Puzzle, could select a node with number keys
 * (rapid succession for two-digit numbers) and then move with arrow keys?
 * Marked Loop puzzle would need a cursor moved with arrow keys that marked/erased while holding down space?
 * Can make activation of the canvas while it has focus invoke the start button?
 *
 * Present keyboard controls somewhere.
 * Make keyboard controls mappable?
 *
 * Improve color-blindness accessibility.
 *
 * Reduce audio file size and improve quality by converting to ogg "with vorbis or opus codecs"?
 * Keep the mp3 as a fallback?  Can convert with Audacity.
 *
 *
 * Ideas:
 *
 * Make logic grid puzzle clearer regarding rows needing to match symbol sets.
 * Show a message like "Numbers go in this row, etc." for the first tutorial?
 *
 * Might be nice to store each puzzle move, so that it could be
 * played back to you or even shared (as a gif?)
 */

// List of files to cache for offline use
const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/styles.css',
  '/manifest.json',
  // JavaScript files
  '/js/config.js',
  '/js/utils.js',
  '/js/router.js',
  '/js/audio-manager.js',
  // Puzzle pages
  '/puzzles/CircuitGridPuzzle.js',
  '/puzzles/ArithmeticGridPuzzle.js',
  '/puzzles/TangledGraphPuzzle.js',
  '/puzzles/LightSwitchesPuzzle.js',
  '/puzzles/SliderPathPuzzle.js',
  '/puzzles/ColorPiecesGridPuzzle.js',
  '/puzzles/TetrominoGridPuzzle.js',
  '/puzzles/LogicGridPuzzle.js',
  '/puzzles/GridMirrorPuzzle.js',
  '/puzzles/ShiftingGridPuzzle.js',
  '/puzzles/MarkedLoopPuzzle.js',
  '/puzzles/EmittersGridPuzzle.js',
  // Sound files
  '/sounds/AnvilImpact.mp3',
  '/sounds/BoingSound.mp3',
  '/sounds/Chime_musical_BLASTWAVEFX_16367.mp3',
  '/sounds/Click.mp3',
  '/sounds/Rollover_electronic_warp_BLASTWAVEFX_06209.mp3',
  '/sounds/space_beep_3.mp3',
  '/sounds/Graduation.mp3',
  '/sounds/game-start-6104.mp3',
  // Image files
  '/images/PXL_Avatar_1B.jpg',
];

// Install event - cache all static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching for new service worker install:', CACHE_NAME);
        return cache.addAll(FILES_TO_CACHE);
      })
      .then(() => {
        // Force new service worker to become active immediately
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(keyList.map(key => {
        if (key !== CACHE_NAME) {
          console.log('Removing old cache:', key);
          return caches.delete(key);
        }
      }));
    })
    .then(() => {
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  // Only handle HTTP/HTTPS requests
  if (!event.request.url.startsWith('http')) {
    return;
  }

  // Handle requests with range headers (like audio files in Safari)
  if (event.request.headers.has('range')) {
    event.respondWith(handleRangeRequest(event.request));
    return;
  }

  // Regular asset handling
  event.respondWith(
    caches.match(event.request, {ignoreSearch: true})
      .then(response => {
        // Cache hit - return the cached version
        if (response) {
          return response;
        }

        // Not in cache - get from network
        return fetch(event.request)
          .then(response => {
            // Don't cache non-successful responses or non-GET requests
            if (!response.ok || event.request.method !== 'GET') {
              return response;
            }

            // Clone the response to cache and return original to browser
            const responseToCache = response.clone();
            void caches.open(CACHE_NAME)
              .then(cache => {
                void cache.put(event.request.url.split('?')[0], responseToCache);
              });

            return response;
          })
          .catch(error => {
            console.log('Fetch failed:', error);
            // For HTML files, return fallback offline page
            if (event.request.destination === 'document') {
              return caches.match('/index.html');
            }

            return new Response('Network error occurred', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// Handle range requests properly (needed for audio in Safari)
async function handleRangeRequest(request) {
  const url = request.url.split('?')[0];
  const rangeHeader = request.headers.get('range');
  const rangeMatch = /bytes=(\d+)-(\d+)?/.exec(rangeHeader);

  if (!rangeMatch) {
    return fetch(request);
  }

  const start = parseInt(rangeMatch[1], 10);
  const end = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : undefined;

  try {
    // Try to get the resource from cache first
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(url);

    if (cachedResponse) {
      // If we have a cached response, handle the range request
      const cachedBuffer = await cachedResponse.arrayBuffer();
      const endPos = end || cachedBuffer.byteLength - 1;

      return new Response(cachedBuffer.slice(start, endPos + 1), {
        status: 206,
        statusText: 'Partial Content',
        headers: {
          'Content-Type': cachedResponse.headers.get('Content-Type'),
          'Content-Range': `bytes ${start}-${endPos}/${cachedBuffer.byteLength}`,
          'Content-Length': endPos - start + 1
        }
      });
    }

    // If not in cache, forward the range request to the network
    return fetch(request);
  } catch (error) {
    console.error('Range request handling error:', error);
    return fetch(request);
  }
}
