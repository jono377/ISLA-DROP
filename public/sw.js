// Isla Drop Service Worker
// Place this file in /public/sw.js

const CACHE_NAME = 'isla-drop-v2'
const STATIC_ASSETS = ['/', '/index.html', '/icon-192.png']

// ── Install ───────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

// ── Activate ──────────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// ── Fetch — cache-first for images, network-first for API ────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)
  if (event.request.method !== 'GET') return
  if (url.pathname.match(/\.(png|jpg|jpeg|webp|svg|ico)$/)) {
    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request).then(resp => {
        const clone = resp.clone()
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
        return resp
      }))
    )
    return
  }
  // Network first for everything else
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  )
})

// ── Push notification received ────────────────────────────────
self.addEventListener('push', event => {
  if (!event.data) return
  let data
  try { data = event.data.json() } catch { data = { title: 'Isla Drop', body: event.data.text() } }
  event.waitUntil(
    self.registration.showNotification(data.title || 'Isla Drop', {
      body:    data.body,
      icon:    data.icon    || '/icon-192.png',
      badge:   data.badge   || '/badge-96.png',
      data:    data.data    || {},
      actions: data.actions || [],
      vibrate: [100, 50, 100],
      tag:     data.data?.orderId || 'isla-order',
      renotify: true,
    })
  )
})

// ── Notification click ────────────────────────────────────────
self.addEventListener('notificationclick', event => {
  event.notification.close()
  const { orderId, orderNumber, status } = event.notification.data || {}
  const action = event.action

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      const appClient = clients.find(c => c.url.includes('isladrop.net'))
      if (appClient) {
        // Send message to app
        appClient.postMessage({ action: action || 'track_order', orderId, orderNumber })
        return appClient.focus()
      }
      // Open app if not open
      const url = action === 'repeat_order'
        ? 'https://www.isladrop.net/?repeat=' + (orderNumber || '')
        : 'https://www.isladrop.net/?track=' + (orderNumber || '')
      return self.clients.openWindow(url)
    })
  )
})
