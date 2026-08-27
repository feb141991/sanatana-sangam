// Shoonaya — Service Worker (offline caching)
//
// ⚠️  DO NOT REGISTER THIS FILE directly via navigator.serviceWorker.register('/sw.js').
//
// OneSignal v16 registers its own service worker (OneSignalSDKWorker.js) at scope '/'
// to handle web push. Only one service worker can own a given scope — registering
// this file at scope '/' would silently override OneSignal's worker and break push
// notifications on all browsers.
//
// To enable offline caching alongside OneSignal push, you need to use OneSignal's
// "custom worker + importScripts" pattern:
//   1. Create public/OneSignalSDKWorker.js that calls importScripts() on both:
//        importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');
//   2. Add your caching logic below the importScripts call.
//   3. Set `serviceWorkerPath: '/OneSignalSDKWorker.js'` in OneSignal.init().
// Docs: https://documentation.onesignal.com/docs/web-push-service-worker-faq
//
// This retired worker intentionally has no fetch handler. If an older landing
// page registered it, activation clears its caches and releases all requests
// back to the browser/network until OneSignal installs its canonical worker.
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
