const C='fotomerker-v2', F=['./','index.html','app.js','manifest.json','icon.svg'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(F)));self.skipWaiting();});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C&&x!=='fm-share').map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method==='POST'&&u.pathname.endsWith('/share')){e.respondWith((async()=>{
    const fd=await e.request.formData(),c=await caches.open('fm-share');let i=0;
    for(const f of fd.getAll('files'))if(f&&f.size)await c.put(new Request('share-file-'+(i++)),new Response(f,{headers:{'content-type':f.type||'image/jpeg','x-name':encodeURIComponent(f.name||'geteilt.jpg')}}));
    return Response.redirect(new URL('./?share='+i,self.registration.scope).href,303);})());return;}
  if(e.request.method!=='GET')return;
  const put=res=>{if(res.ok){const cl=res.clone();caches.open(C).then(c=>c.put(e.request,cl));}return res;};
  if(u.origin===location.origin) e.respondWith(fetch(e.request).then(put).catch(()=>caches.match(e.request)));
  else if(/jsdelivr|tessdata|unpkg/.test(u.hostname)) e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(put)));
});
