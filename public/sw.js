const CACHE = "pomo-v1";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(clients.claim()));

// Cache the app shell on first load
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  // Network-first for API and auth routes
  const url = new URL(e.request.url);
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/sign-in")) return;
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
