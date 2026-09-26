// Grove's service worker: shows push notifications while Grove is closed, and opens the right page when
// one is tapped. It caches nothing — the app always loads fresh from the server.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

// The server only pushes when Grove isn't open anywhere, so every push is shown.
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : '' };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'Grove', {
      body: data.body || '',
      icon: '/icon-192.png',
      tag: data.tag, // one per chat: a newer message replaces the older notification
      renotify: !!data.tag, // …but still buzzes
      data: { url: data.url || '/chats' },
    }),
  );
});

// Tapped: reuse an open Grove window (the app navigates itself — no reload), or open one.
self.groveOpen = async (path) => {
  const url = new URL(path || '/chats', self.location.origin);
  if (url.origin !== self.location.origin) return; // only ever our own pages
  const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  const win = windows.find((w) => new URL(w.url).origin === self.location.origin);
  if (win) {
    await win.focus().catch(() => {}); // only allowed right after a tap — still navigate if it's refused
    win.postMessage({ type: 'grove:navigate', url: url.pathname + url.search + url.hash });
  } else {
    await self.clients.openWindow(url.href);
  }
};
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(self.groveOpen(event.notification.data && event.notification.data.url));
});

// The browser replaced this device's push address: sign the new one up (the session cookie comes along).
self.addEventListener('pushsubscriptionchange', (event) => {
  const key = event.oldSubscription && event.oldSubscription.options.applicationServerKey;
  if (!key) return;
  event.waitUntil(
    self.registration.pushManager
      .subscribe({ userVisibleOnly: true, applicationServerKey: key })
      .then((sub) => fetch('/api/push/subscriptions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sub.toJSON()) })),
  );
});
