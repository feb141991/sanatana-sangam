// OneSignal owns the root service-worker scope. Do not cache Next.js responses
// here: authenticated HTML/RSC and deployment chunks must stay version-aligned.
importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');

// Remove caches created by the retired Shoonaya workers. This runs when browsers
// update to this worker, including clients that still hold an old app shell.
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
