// ================================================================
// Isla Drop Service Worker — Offline support + caching
// Points 29: Offline mode / service worker
// Place this file at: public/service-worker.js
// ================================================================

const CACHE_VERSION = 'isla-drop-v2'
const STATIC_CACHE = CACHE_VERSION + '-static'
const PRODUCT_CACHE = CACHE_VERSION + '-products'
const IMAGE_CACHE = CACHE_VERSION + '-images'

// Static assets to pre-cache at install
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/splash.jpg',
  '/manifest.json',
]

// ── Install: pre-cache static assets ──────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  )
})

// ── Activate: clean up old caches ─────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => !k.startsWith(CACHE_VERSION)).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

// ── Fetch: tiered cache strategy ──────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET, chrome-extension, and Supabase auth/realtime
  if (request.method !== 'GET') return
  if (url.protocol === 'chrome-extension:') return
  if (url.hostname.includes('supabase.co') && (url.pathname.includes('/auth/') || url.pathname.includes('/realtime/'))) return

  // Stripe — always network first, no cache
  if (url.hostname.includes('stripe.com') || url.hostname.includes('js.stripe.com')) {
    event.respondWith(fetch(request).catch(() => new Response('', { status: 503 })))
    return
  }

  // Images — cache first, network fallback, serve stale on offline
  if (request.destination === 'image' || url.pathname.match(/\.(jpg|jpeg|png|webp|svg|ico)$/)) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(cache =>
        cache.match(request).then(cached => {
          const networkFetch = fetch(request).then(response => {
            if (response.ok) cache.put(request, response.clone())
            return response
          }).catch(() => cached || new Response('', { status: 503 }))
          return cached || networkFetch
        })
      )
    )
    return
  }

  // Supabase product queries — cache for 5 minutes
  if (url.hostname.includes('supabase.co') && url.pathname.includes('/products')) {
    event.respondWith(
      caches.open(PRODUCT_CACHE).then(async cache => {
        const cached = await cache.match(request)
        if (cached) {
          const age = Date.now() - new Date(cached.headers.get('sw-cached-at') || 0).getTime()
          if (age < 300000) return cached // 5 min cache
        }
        try {
          const response = await fetch(request)
          if (response.ok) {
            const headers = new Headers(response.headers)
            headers.set('sw-cached-at', new Date().toISOString())
            const body = await response.arrayBuffer()
            const cachedResponse = new Response(body, { status:response.status, headers })
            cache.put(request, cachedResponse.clone())
            return cachedResponse
          }
          return cached || response
        } catch {
          return cached || new Response(JSON.stringify({ error:'offline' }), {
            status: 503, headers: { 'Content-Type':'application/json' }
          })
        }
      })
    )
    return
  }

  // App shell — network first, cached fallback for offline
  if (url.hostname === self.location.hostname) {
    event.respondWith(
      fetch(request).catch(async () => {
        const cached = await caches.match(request)
        if (cached) return cached
        // Serve index.html for all navigation (SPA fallback)
        if (request.mode === 'navigate') return caches.match('/index.html')
        return new Response('', { status: 503 })
      })
    )
    return
  }

  // Everything else — network only
  event.respondWith(fetch(request).catch(() => new Response('', { status: 503 })))
})

// ── Push notifications ─────────────────────────────────────────
self.addEventListener('push', event => {
  if (!event.data) return
  let data
  try { data = event.data.json() } catch { data = { title:'Isla Drop', body:event.data.text() } }

  const { title='Isla Drop 🌴', body='', icon='/splash.png', badge='/splash.png', data:extraData={} } = data

  event.waitUntil(
    self.registration.showNotification(title, {
      body, icon, badge,
      tag: extraData.order_id || 'isla-drop',
      renotify: true,
      vibrate: [200, 100, 200],
      data: extraData,
      actions: [
        { action:'view', title:'Track order' },
        { action:'dismiss', title:'Dismiss' },
      ]
    })
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  if (event.action === 'dismiss') return
  const url = event.notification.data?.order_id
    ? '/?tracking=' + event.notification.data.order_id
    : '/'
  event.waitUntil(
    clients.matchAll({ type:'window' }).then(wins => {
      for (const win of wins) {
        if (win.url.includes(self.location.origin) && 'focus' in win) {
          win.postMessage({ type:'NOTIFICATION_CLICK', url })
          return win.focus()
        }
      }
      return clients.openWindow(url)
    })
  )
})
