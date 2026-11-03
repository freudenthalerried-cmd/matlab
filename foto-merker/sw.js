const C='fotomerker-v1', F=['./','index.html','app.js','manifest.json','icon.svg'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(F)));self.skipWaiting();});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const u=new URL(e.request.url), put=res=>{if(res.ok){const cl=res.clone();caches.open(C).then(c=>c.put(e.request,cl));}return res;};
  if(u.origin===location.origin) e.respondWith(fetch(e.request).then(put).catch(()=>caches.match(e.request)));
  else if(/jsdelivr|tessdata|unpkg/.test(u.hostname)) e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(put)));
});
