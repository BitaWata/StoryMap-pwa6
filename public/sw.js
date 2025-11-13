const isLocalhost = self.location.hostname === 'localhost';
const BASE = isLocalhost ? '/' : '/storymap-rani/'; // ganti sesuai path deploy

const STATIC_CACHE = "storyapp-static-v3";
const DYNAMIC_CACHE = "storyapp-dynamic-v1";

const STATIC_ASSETS = [
  BASE,
  BASE + "index.html",
  BASE + "manifest.json",
  BASE + "styles/styles.css",
  BASE + "scripts/index.js",
  BASE + "images/favicon.png",
  BASE + "images/icons/icon-96x96.png",
  BASE + "images/icons/icon-192x192.png",
  BASE + "images/icons/logo72.png",
  BASE + "images/icons/logo192.png",
  BASE + "images/icons/logo.png",
];

self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installing…");
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log("[Service Worker] Precaching App Shell…");
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activated");
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map((key) => {
            console.log("[Service Worker] Deleting old cache:", key);
            return caches.delete(key);
          })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);

  if (requestUrl.origin.includes("story-api.dicoding.dev")) {
    event.respondWith(
      caches.open(DYNAMIC_CACHE).then(async (cache) => {
        try {
          const networkResponse = await fetch(event.request);

          if (event.request.method === "GET") {
            cache.put(event.request, networkResponse.clone());
            console.log(`[Service Worker] ✅ Cached (GET): ${event.request.url}`);
          }

          return networkResponse;
        } catch (error) {
          const cachedResponse = await cache.match(event.request);
          if (cachedResponse) {
            console.log("[Service Worker] ⚠️ Offline, serving cached data:", event.request.url);
            return cachedResponse;
          }

          return new Response(
            JSON.stringify({
              error: true,
              message: "Offline - data tidak tersedia.",
              listStory: [],
            }),
            { headers: { "Content-Type": "application/json" } }
          );
        }
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        console.log("[SW] Mengambil dari cache:", event.request.url);
        return cachedResponse;
      }

      return fetch(event.request).catch(() => {
        if (event.request.mode === "navigate") {
          console.log("[SW] Offline fallback ke index.html");
          return caches.match(BASE + "index.html");
        }
      });
    })
  );
});

self.addEventListener("push", (event) => {
  console.log("[Service Worker] Push diterima:", event);

  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: event.data.text() };
    }
  }

  const title = data.title || "Story Baru dari Story App!";
  const options = {
    body: data.body || data.title || "Ada cerita baru yang menunggumu!",
    icon: BASE + "images/icons/icon-192x192.png",
    badge: BASE + "images/icons/icon-96x96.png",
    data: { url: BASE },
    actions: [
      { action: "open", title: "Lihat Story" },
      { action: "dismiss", title: "Tutup" },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "open") {
    event.waitUntil(clients.openWindow(event.notification.data?.url || "/"));
  }
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "NEW_DATA") {
    const { title, body } = event.data;

    self.registration.showNotification(title || "Notifikasi Baru", {
      body: body || "Ada data baru ditambahkan.",
      icon: BASE + "images/icons/icon-192x192.png",
      badge: BASE + "images/icons/icon-96x96.png",
      data: { url: BASE },
    });
  }
});