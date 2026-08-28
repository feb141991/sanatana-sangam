// Shoonaya — Service Worker (offline caching)
//
// ⚠️  DO NOT REGISTER THIS FILE directly via navigator.serviceWorker.register('/sw.js').
//
// OneSignal (the former PWA browser push channel, including its own
// OneSignalSDKWorker.js at scope '/') was removed 2026-08-28 -- the team is
// focusing on native and retiring the PWA. This worker is left retired
// rather than reintroducing offline caching, since the PWA is winding down
// anyway.
//
// This retired worker intentionally has no fetch handler. If an older
// landing page registered it, activation clears its caches and releases all
// requests back to the browser/network.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('shoonaya-') || key.startsWith('sangam-'))
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});
