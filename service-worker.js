// =============================================================================
// PhonkCharts — service-worker.js
// Strategy:
//   - App shell (HTML/CSS/JS/icons): cache-first, falling back to network,
//     so the installed app opens instantly and works offline.
//   - data/songs.json: stale-while-revalidate — serve the cached chart
//     instantly, then refresh it in the background for next time.
//   - Everything else (fonts, cover images from picsum, previews): network
//     first with a runtime cache fallback so offline browsing degrades
//     gracefully instead of breaking.
// =============================================================================

const VERSION = 'v1.0.0';
const SHELL_CACHE = `phonkcharts-shell-${VERSION}`;
const DATA_CACHE = `phonkcharts-data-${VERSION}`;
const RUNTIME_CACHE = `phonkcharts-runtime-${VERSION}`;

const SHELL_ASSETS = [
  './',
  './index.html',
  './search.html',
  './categories.html',
  './favorites.html',
  './song.html',
  './manifest.json',
  './style.css',
  './shared.js',
  './cards.js',
  './app.js',
  './search.js',
  './categories.js',
  './favorites.js',
  './song.js',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png',
];

const DATA_URL_PATTERN = /\/songs\.json$/;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => ![SHELL_CACHE, DATA_CACHE, RUNTIME_CACHE].includes(key))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // songs.json — stale-while-revalidate
  if (DATA_URL_PATTERN.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request, DATA_CACHE));
    return;
  }

  // Same-origin app shell — cache-first
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request, SHELL_CACHE));
    return;
  }

  // Cross-origin (fonts, cover art, audio previews) — network-first with
  // runtime cache fallback for offline resilience.
  event.respondWith(networkFirst(request, RUNTIME_CACHE));
});

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    return cached || Response.error();
  }
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return Response.error();
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const networkFetch = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  return cached || (await networkFetch) || Response.error();
}
