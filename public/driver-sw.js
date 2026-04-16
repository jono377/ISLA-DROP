// Isla Drop Driver — Service Worker
// Handles push notifications and offline caching

const CACHE = 'isla-driver-v5'
const OFFLINE_URLS = ['/', '/driver']

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(OFFLINE_URLS)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  )
})

self.addEventListener('message', e => {
  if (e.data?.type === 'NEW_ORDER') {
    self.registration.showNotification('New delivery! 🛵', {
      body: 'Order #' + e.data.orderNumber + ' · €' + e.data.fee + ' · ' + (e.data.address || 'Tap to view'),
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      vibrate: [200, 100, 200, 100, 200],
      requireInteraction: true,
      actions: [
        { action: 'accept', title: '✓ Accept' },
        { action: 'view',   title: 'View details' }
      ],
      data: { url: '/', orderId: e.data.orderId }
    })
  }
})

self.addEventListener('notificationclick', e => {
  e.notification.close()
  e.waitUntil(
    clients.matchAll({ type:'window' }).then(cls => {
      const win = cls.find(c => c.url === '/')
      if (win) return win.focus()
      return clients.openWindow('/')
    })
  )
})
