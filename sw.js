const CACHE_NAME="harmonia-cache-v2";
const urlsToCache=["./","./index.html"];

self.addEventListener("install",event=>{
event.waitUntil(
caches.open(CACHE_NAME).then(cache=>{
return cache.addAll(urlsToCache);
})
);
});

self.addEventListener("activate",event=>{
event.waitUntil(
caches.keys().then(cacheNames=>{
return Promise.all(
cacheNames.map(cache=>{
if(cache!==CACHE_NAME){
return caches.delete(cache);
}
})
);
})
);
});

self.addEventListener("fetch",event=>{
event.respondWith(
fetch(event.request).catch(()=>{
return caches.match(event.request);
})
);
});
