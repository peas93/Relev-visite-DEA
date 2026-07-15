/* Service worker — Relevé Égout DEA 93
   Stratégie : cache-first (l'app doit fonctionner 100% hors connexion).
   Pour déployer une mise à jour de l'app, incrémenter VERSION. */
const VERSION = 'dea93-v18';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(VERSION).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(hit =>
      hit ||
      fetch(e.request).then(resp => {
        // Met en cache toute ressource de même origine récupérée avec succès
        if (resp.ok && new URL(e.request.url).origin === location.origin) {
          const copy = resp.clone();
          caches.open(VERSION).then(c => c.put(e.request, copy));
        }
        return resp;
      }).catch(() =>
        // Hors ligne et pas en cache : renvoyer la page principale
        caches.match('./index.html')
      )
    )
  );
});
