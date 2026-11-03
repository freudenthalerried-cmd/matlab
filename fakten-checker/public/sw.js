// Offline-Hülle: Seite und Skripte zwischenspeichern, Prüfungen gehen immer ans Netz
const CACHE = "fc-v1";
const SHELL = ["./", "index.html", "engine.js", "vendor/anthropic.js", "manifest.webmanifest", "icon-192.png", "icon.svg"];
self.addEventListener("install", e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener("activate", e => e.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())
));
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin || url.pathname.includes("/api/")) return;
  // Netz zuerst, damit Updates sofort ankommen; ohne Netz die gespeicherte Version
  e.respondWith(fetch(e.request).then(r => {
    const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r;
  }).catch(() => caches.match(e.request)));
});
