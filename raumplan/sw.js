// Offline-Cache für die Raumplan-App (App-Hülle, cache-first; neue Version bei Änderung von VERSION)
const VERSION = 'raumplan-v2', FILES = ['./', './index.html', './style.css', './app.js', './ausgleich.js', './ba.js', './marker.js', './pg.js', './guide.js', './manifest.json', './icon.svg'];
self.addEventListener('install', e => e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(k => Promise.all(k.filter(n => n !== VERSION).map(n => caches.delete(n)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(VERSION).then(ca => ca.put(e.request, c)); return r; }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});
