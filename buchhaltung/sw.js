// Minimaler Service Worker: nötig, damit die App am Handy installiert werden
// kann und im "Teilen"-Menü erscheint. Es wird nichts zwischengespeichert.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
