// Nancy Drew Collection service worker (offline app shell)
const CACHE='nd-1.2-5d67157a';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./icon-maskable-512.png','./apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()))});
const COVER_CACHE='nd-covers-v1'; // kept across app versions: stock covers you've viewed stay available offline
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE&&k!==COVER_CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method==='GET'&&u.hostname==='covers.openlibrary.org'){
    e.respondWith(caches.open(COVER_CACHE).then(c=>c.match(e.request.url).then(hit=>hit||fetch(e.request.url,{mode:'cors',credentials:'omit'}).then(r=>{if(r.ok)c.put(e.request.url,r.clone()).catch(()=>{});return r}).catch(()=>fetch(e.request)))));return}
  if(e.request.method!=='GET'||u.origin!==location.origin)return;
  // network-first for the page (so updates arrive), cache fallback offline; cache-first for static assets
  if(e.request.mode==='navigate'){e.respondWith(fetch(e.request).then(r=>{const cp=r.clone();caches.open(CACHE).then(c=>c.put('./index.html',cp));return r}).catch(()=>caches.match('./index.html')));return}
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
});
