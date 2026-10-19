import json, hashlib, pathlib
root = pathlib.Path('/workspace/nancydrew')
data = json.loads((root/'tools/data.json').read_text())
src = (root/'tools/index.src.html').read_text()
djs = json.dumps(data, ensure_ascii=False, separators=(',',':')).replace('</', '<\\/')
covers = json.loads((root/'tools/covers.json').read_text()) if (root/'tools/covers.json').exists() else {}
ver = '1.6-' + hashlib.sha1((src+djs+json.dumps(covers)).encode()).hexdigest()[:8]
html = src.replace('/*COVERS*/', json.dumps(covers, separators=(',',':'))).replace('/*DATA*/', djs).replace('/*VERSION*/', ver)
(root/'index.html').write_text(html)
(root/'manifest.webmanifest').write_text(json.dumps({
 "name":"Nancy Drew Collection","short_name":"Drew Shelf","description":"Catalog your Nancy Drew book collection: originals, revised texts, digests, Files and more.",
 "start_url":"./","scope":"./","display":"standalone","orientation":"portrait","background_color":"#f7f1e1","theme_color":"#eee056",
 "icons":[{"src":"icon-192.png","sizes":"192x192","type":"image/png"},{"src":"icon-512.png","sizes":"512x512","type":"image/png"},{"src":"icon-maskable-512.png","sizes":"512x512","type":"image/png","purpose":"maskable"}]}, indent=1))
(root/'sw.js').write_text(f"""// Nancy Drew Collection service worker (offline app shell)
const CACHE='nd-{ver}';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./icon-maskable-512.png','./apple-touch-icon.png'];
self.addEventListener('install',e=>{{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()))}});
const COVER_CACHE='nd-covers-v1'; // kept across app versions: stock covers you've viewed stay available offline
self.addEventListener('activate',e=>{{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE&&k!==COVER_CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))}});
self.addEventListener('fetch',e=>{{
  const u=new URL(e.request.url);
  if(e.request.method==='GET'&&u.hostname==='covers.openlibrary.org'){{
    e.respondWith(caches.open(COVER_CACHE).then(c=>c.match(e.request.url).then(hit=>hit||fetch(e.request.url,{{mode:'cors',credentials:'omit'}}).then(r=>{{if(r.ok)c.put(e.request.url,r.clone()).catch(()=>{{}});return r}}).catch(()=>fetch(e.request)))));return}}
  if(e.request.method!=='GET'||u.origin!==location.origin)return;
  // network-first for the page (so updates arrive), cache fallback offline; cache-first for static assets
  if(e.request.mode==='navigate'){{e.respondWith(fetch(e.request).then(r=>{{const cp=r.clone();caches.open(CACHE).then(c=>c.put('./index.html',cp));return r}}).catch(()=>caches.match('./index.html')));return}}
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
}});
""")
print('built', ver, len(html))
