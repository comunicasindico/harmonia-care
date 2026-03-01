const CACHE_NAME = "harmonia-cache-v4";

/* ==============================
   INSTALAÇÃO
============================== */
self.addEventListener("install", event => {
  self.skipWaiting();
});

/* ==============================
   ATIVAÇÃO
============================== */
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

/* ==============================
   FETCH
   NÃO CACHEAR HTML
============================== */
self.addEventListener("fetch", event => {

  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => response)
      .catch(() => caches.match(event.request))
  );
});

