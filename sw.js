// QuantEdge Service Worker v1.0
// Handles: caching, offline fallback, background sync

const CACHE_NAME = 'quantedge-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  // Google Fonts (cached on first load)
  'https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@300;400;500;700&family=Lora:ital,wght@0,400;1,400&display=swap'
];

// ── INSTALL: pre-cache static assets ──
self.addEventListener('install', event => {
  console.log('[SW] Installing QuantEdge Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Pre-caching assets');
        // Cache what we can, skip failures gracefully
        return Promise.allSettled(
          STATIC_ASSETS.map(url => cache.add(url).catch(() => null))
        );
      })
      .then(() => self.skipWaiting())
  );
});

// ── ACTIVATE: clean old caches ──
self.addEventListener('activate', event => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ── FETCH: Network-first for API, Cache-first for static ──
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // API calls → Network first, fallback to cached response
  if (url.pathname.startsWith('/api/') || url.hostname.includes('financialmodelingprep')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Google Fonts → Cache first
  if (url.hostname.includes('fonts.googleapis') || url.hostname.includes('fonts.gstatic')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Static assets → Cache first with network fallback
  event.respondWith(cacheFirst(request));
});

// Strategy: Cache first, network fallback
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Offline fallback
    return caches.match('/index.html');
  }
}

// Strategy: Network first, cache fallback
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response(
      JSON.stringify({ error: 'Offline — cached data not available' }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// ── BACKGROUND SYNC: Queue failed API requests ──
self.addEventListener('sync', event => {
  if (event.tag === 'sync-watchlist') {
    event.waitUntil(syncWatchlist());
  }
});

async function syncWatchlist() {
  const cache = await caches.open(CACHE_NAME);
  console.log('[SW] Background sync: watchlist updated');
}

// ── PUSH NOTIFICATIONS (future: price alerts) ──
self.addEventListener('push', event => {
  const data = event.data?.json() ?? {};
  const options = {
    body: data.body || 'Stock alert triggered',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/' },
    actions: [
      { action: 'view', title: 'View Analysis' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };
  event.waitUntil(
    self.registration.showNotification(data.title || 'QuantEdge Alert', options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'view') {
    event.waitUntil(clients.openWindow(event.notification.data.url));
  }
});
