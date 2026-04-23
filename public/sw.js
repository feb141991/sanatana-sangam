// Sanatana Sangam — Service Worker (offline caching)
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
// Until that merge is done, this file is intentionally left unregistered.
// Next.js static asset caching and browser defaults provide basic offline resilience.

const CACHE_NAME = 'sangam-v2';
const OFFLINE_URL = '/offline';

const PRECACHE_ASSETS = [
  '/',
  '/home',
  '/vichaar-sabha',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Network first, fall back to cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
