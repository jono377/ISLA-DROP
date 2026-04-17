// ================================================================
// Isla Drop — Monitoring & Error Tracking
// Point 26: Sentry error monitoring
// Point 27: Web Vitals + performance monitoring
// Place this file at: src/lib/monitoring.js
// ================================================================

// ── 26. Sentry Error Monitoring ───────────────────────────────
// Install: npm install @sentry/react
// Then: import './lib/monitoring' at the TOP of src/main.jsx

let Sentry = null

export async function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  if (!dsn) {
    console.info('[Monitoring] Sentry DSN not configured — set VITE_SENTRY_DSN in .env')
    return
  }

  try {
    const SentryModule = await import('@sentry/react')
    Sentry = SentryModule

    SentryModule.init({
      dsn,
      environment: import.meta.env.MODE || 'development',
      release: 'isla-drop@' + (import.meta.env.VITE_APP_VERSION || '1.0.0'),

      // Capture 100% of errors, 10% of performance traces in production
      tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
      replaysSessionSampleRate: 0.05,
      replaysOnErrorSampleRate: 1.0,

      integrations: [
        SentryModule.browserTracingIntegration(),
        SentryModule.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],

      // Filter out known noise
      ignoreErrors: [
        'ResizeObserver loop limit exceeded',
        'Non-Error promise rejection captured',
        'Network request failed',
        'Failed to fetch',
        'Load failed',
      ],

      beforeSend(event, hint) {
        // Strip personal data before sending
        if (event.request?.cookies) delete event.request.cookies
        if (event.user?.email) event.user.email = '[filtered]'
        if (event.user?.ip_address) event.user.ip_address = '[filtered]'
        return event
      },
    })

    console.info('[Monitoring] Sentry initialised')
  } catch (e) {
    console.warn('[Monitoring] Sentry failed to load:', e.message)
  }
}

export function captureError(error, context = {}) {
  if (Sentry) {
    Sentry.captureException(error, { extra: context })
  } else {
    console.error('[Error]', error, context)
  }
}

export function setUser(user) {
  if (Sentry && user) {
    Sentry.setUser({ id: user.id, role: user.role })
  }
}

export function clearUser() {
  if (Sentry) Sentry.setUser(null)
}

// ── 27. Web Vitals Performance Monitoring ─────────────────────
// Tracks: LCP, FID, CLS, FCP, TTFB
// Reports to: console + Supabase analytics_events table

const PERF_THRESHOLD = {
  LCP: 2500,   // Good: < 2.5s
  FID: 100,    // Good: < 100ms
  CLS: 0.1,    // Good: < 0.1
  FCP: 1800,   // Good: < 1.8s
  TTFB: 800,   // Good: < 800ms
}

function rateMetric(name, value) {
  const threshold = PERF_THRESHOLD[name]
  if (!threshold) return 'unknown'
  return value <= threshold ? 'good' : value <= threshold * 2 ? 'needs-improvement' : 'poor'
}

async function reportMetric(metric) {
  const rating = rateMetric(metric.name, metric.value)
  const emoji = rating === 'good' ? '✅' : rating === 'needs-improvement' ? '⚠️' : '🔴'

  console.info('[Perf]', emoji, metric.name, Math.round(metric.value) + 'ms', '('+rating+')')

  // Send to Sentry as measurement
  if (Sentry) {
    Sentry.addBreadcrumb({
      category: 'web-vital',
      message: metric.name + ': ' + Math.round(metric.value),
      level: rating === 'poor' ? 'warning' : 'info',
    })
  }

  // Log to Supabase for ops dashboard visibility
  try {
    const { supabase } = await import('./supabase')
    await supabase.from('analytics_events').insert({
      event: 'web_vital',
      metadata: {
        name: metric.name,
        value: Math.round(metric.value),
        rating,
        url: window.location.pathname,
        userAgent: navigator.userAgent.slice(0, 100),
      }
    })
  } catch {
    // Silent fail — analytics are non-critical
  }
}

export async function initWebVitals() {
  try {
    const { onLCP, onFID, onCLS, onFCP, onTTFB } = await import('web-vitals')
    onLCP(reportMetric)
    onFID(reportMetric)
    onCLS(reportMetric)
    onFCP(reportMetric)
    onTTFB(reportMetric)
    console.info('[Monitoring] Web Vitals tracking active')
  } catch {
    // web-vitals not installed — install with: npm install web-vitals
    console.info('[Monitoring] Install web-vitals: npm install web-vitals')
  }
}

// ── 30. Rate Limiting (client-side guard) ─────────────────────
// Server-side rate limiting should be in Supabase Edge Functions
// This provides a client-side fallback to prevent accidental spam

const orderAttempts = []
const MAX_ORDERS_PER_MINUTE = 3

export function checkOrderRateLimit() {
  const now = Date.now()
  const oneMinuteAgo = now - 60000

  // Remove attempts older than 1 minute
  const recent = orderAttempts.filter(t => t > oneMinuteAgo)
  orderAttempts.length = 0
  orderAttempts.push(...recent)

  if (orderAttempts.length >= MAX_ORDERS_PER_MINUTE) {
    const wait = Math.ceil((orderAttempts[0] + 60000 - now) / 1000)
    return { allowed: false, message: 'Too many orders. Please wait ' + wait + ' seconds.' }
  }

  orderAttempts.push(now)
  return { allowed: true }
}

// ── 28. Lazy Image Loading Utility ───────────────────────────
// Usage: <img ref={lazyRef} data-src="..." src="/placeholder.svg" />

export function useLazyImage() {
  const observer = typeof IntersectionObserver !== 'undefined'
    ? new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target
            const src = img.getAttribute('data-src')
            if (src) {
              img.src = src
              img.removeAttribute('data-src')
              img.classList.add('loaded')
              observer.unobserve(img)
            }
          }
        })
      }, { rootMargin: '100px' })
    : null

  return (el) => {
    if (el && observer) {
      if (el.getAttribute('data-src')) observer.observe(el)
    }
  }
}

// ── Image CDN URL builder ──────────────────────────────────────
// Transforms Supabase Storage URLs to use WebP + size optimisation
// Works with Supabase Image Transformation (Pro plan) or Cloudflare Images

export function cdnImage(url, { width = 400, quality = 80, format = 'webp' } = {}) {
  if (!url) return ''

  // Supabase Image Transformation (requires Pro plan)
  if (url.includes('supabase.co/storage')) {
    const base = url.split('?')[0]
    return base + '?width=' + width + '&quality=' + quality + '&format=' + format
  }

  // Cloudflare Images
  if (url.includes('imagedelivery.net')) {
    return url + '/w=' + width + ',q=' + quality + ',f=' + format
  }

  // Return original if no CDN configured
  return url
}

// ── Performance mark helpers ───────────────────────────────────
export const perf = {
  mark: (name) => { try { performance.mark('isla-' + name) } catch {} },
  measure: (name, start, end) => {
    try {
      const duration = performance.measure('isla-' + name, 'isla-' + start, 'isla-' + end)
      console.info('[Perf measure]', name + ':', Math.round(duration.duration) + 'ms')
    } catch {}
  }
}
