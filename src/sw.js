// sw.js - Service worker ecrit a la main (le ngsw aurait precache les videos).
//
// Strategie :
//   - Navigations : reseau d'abord, repli sur index.html en cache. L'app
//     s'ouvre donc hors ligne a la salle, et une nouvelle version deployee
//     est servie des que le reseau repond.
//   - Fichiers statiques du meme domaine (bundles hashes, CSS, icones,
//     polices) : cache d'abord. Les noms Angular sont hashes, une entree en
//     cache ne peut donc pas etre perimee.
//   - Tout le reste (API Render, videos Cloudinary, autres domaines,
//     requetes non GET, requetes Range) n'est jamais intercepte : l'app gere
//     elle-meme l'absence de reseau, et les videos ne doivent pas remplir le
//     stockage.
//
// Incrementer VERSION vide les caches des clients a la prochaine activation.

const VERSION = 'v1';
const SHELL_CACHE = `fitnesspro-shell-${VERSION}`;
const STATIC_CACHE = `fitnesspro-static-${VERSION}`;
const STATIC_MAX_ENTRIES = 120;

const SHELL_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

const STATIC_EXT = /\.(?:js|css|woff2?|ttf|png|jpe?g|svg|webp|gif|ico|webmanifest)$/i;

self.addEventListener('install', (event) => {
  // Pas de skipWaiting ici : PwaService propose la mise a jour a l'utilisateur
  // et envoie SKIP_WAITING quand il accepte.
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_URLS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([SHELL_CACHE, STATIC_CACHE]);
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith('fitnesspro-') && !keep.has(key))
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || request.headers.has('range')) return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstShell(request));
    return;
  }

  if (STATIC_EXT.test(url.pathname)) {
    event.respondWith(cacheFirst(request));
  }
});

async function networkFirstShell(request) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const response = await fetch(request);
    // Toutes les routes renvoient index.html (rewrite Vercel) : une seule
    // entree suffit pour rouvrir n'importe quelle page hors ligne.
    if (response.ok) cache.put('/index.html', response.clone());
    return response;
  } catch {
    const cached = await cache.match('/index.html');
    return cached || Response.error();
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  // Ne jamais mettre en cache une page HTML servie a la place d'un fichier
  // absent (rewrite SPA) : elle serait resservie comme script ensuite.
  const type = response.headers.get('content-type') || '';
  if (response.ok && !type.includes('text/html')) {
    await cache.put(request, response.clone());
    trim(cache);
  }
  return response;
}

async function trim(cache) {
  const keys = await cache.keys();
  const excess = keys.length - STATIC_MAX_ENTRIES;
  for (let i = 0; i < excess; i++) await cache.delete(keys[i]);
}

// Rappels de seance (ReminderService) : ouvre ou reprend l'onglet de l'app.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || '/dashboard';

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of windows) {
        if (new URL(client.url).origin === self.location.origin) {
          await client.focus();
          if ('navigate' in client) await client.navigate(target);
          return;
        }
      }
      await self.clients.openWindow(target);
    })()
  );
});
