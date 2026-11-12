/* Relevé DEA 93 — service worker.
   Réseau d'abord : en ligne, la dernière version déposée sur le site est toujours servie.
   Hors ligne (ou réseau trop lent), la copie en cache prend le relais. */
const CACHE = 'dea93-v20';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.all(FILES.map(f => c.add(new Request(f, { cache: 'reload' })).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  /* ne supprime que les anciens caches de cette application (le domaine peut en héberger d'autres) */
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k.startsWith('dea93-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const rq = e.request;
  if (rq.method !== 'GET' || new URL(rq.url).origin !== self.location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const net = await Promise.race([
        fetch(rq),
        new Promise((_, rej) => setTimeout(() => rej(new Error('délai')), 3500))
      ]);
      if (net && net.ok) cache.put(rq, net.clone());
      return net;
    } catch (err) {
      const hit = (await cache.match(rq, { ignoreSearch: true })) || (rq.mode === 'navigate' ? await cache.match('index.html') : null);
      if (hit) return hit;
      throw err;
    }
  })());
});
