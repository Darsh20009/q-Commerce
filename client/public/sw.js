const CACHE_NAME = 'qirox-studio-v4';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE).catch(() => {}))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((cacheNames) =>
        Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_NAME) return caches.delete(name);
          })
        )
      ),
    ])
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) return;
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});

// ─── Web Push ─────────────────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;
  let data = {};
  try { data = event.data.json(); } catch { data = { title: 'Qirox Studio', body: event.data.text() }; }

  const title = data.title || 'Qirox Studio';
  const options = {
    body: data.body || '',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    tag: data.tag || 'qirox-notif',
    renotify: true,
    data: data.data || {},
    vibrate: [200, 100, 200],
    actions: [
      { action: 'open', title: 'فتح' },
      { action: 'close', title: 'إغلاق' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'close') return;

  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.postMessage({ type: 'navigate', url });
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
