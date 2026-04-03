import { useState, useEffect, useRef } from 'react'
import { getProductImageUrl } from '../../lib/images'

// ── Shimmer skeleton while loading ───────────────────────────
function Shimmer({ style }) {
  return (
    <div style={{
      background: 'linear-gradient(90deg, #F0EBE0 25%, #E8E0D0 50%, #F0EBE0 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.4s infinite',
      borderRadius: 10,
      ...style,
    }}>
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
    </div>
  )
}

// ── Emoji fallback card ───────────────────────────────────────
function EmojiFallback({ emoji, size = 40, category }) {
  const bgMap = {
    spirits:     'linear-gradient(135deg,#2A1F0E 0%,#5A3A1A 100%)',
    champagne:   'linear-gradient(135deg,#1A3A2A 0%,#2B7A5B 100%)',
    wine:        'linear-gradient(135deg,#3A0F1A 0%,#8B2A45 100%)',
    beer:        'linear-gradient(135deg,#3A2A0A 0%,#B8860B 100%)',
    soft_drinks: 'linear-gradient(135deg,#0A2A3A 0%,#1A5A8B 100%)',
    water:       'linear-gradient(135deg,#0A2A3A 0%,#1A7A9B 100%)',
    ice:         'linear-gradient(135deg,#1A2A3A 0%,#2A5A8B 100%)',
    snacks:      'linear-gradient(135deg,#3A2A0A 0%,#8B5A1A 100%)',
    tobacco:     'linear-gradient(135deg,#1A1A1A 0%,#4A3A2A 100%)',
    wellness:    'linear-gradient(135deg,#3A0A2A 0%,#8B2A6B 100%)',
  }
  return (
    <div style={{
      width: '100%', height: '100%',
      background: bgMap[category] || 'linear-gradient(135deg,#1A2A3A 0%,#2B5263 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      borderRadius: 10,
    }}>
      <span style={{ fontSize: size }}>{emoji}</span>
    </div>
  )
}

// ── Main ProductImage component ───────────────────────────────
export default function ProductImage({ productId, emoji, category, alt, style = {}, size = 'card' }) {
  const [status, setStatus] = useState('loading') // loading | loaded | error
  const imgRef = useRef(null)
  const observerRef = useRef(null)
  const [shouldLoad, setShouldLoad] = useState(false)

  const imageUrl = getProductImageUrl(productId)

  const heights = { card: 110, mini: 80, full: 200, list: 56 }
  const emojSizes = { card: 38, mini: 28, full: 56, list: 24 }
  const height = heights[size] || 110
  const emojiSize = emojSizes[size] || 38

  // Intersection Observer for lazy loading
  useEffect(() => {
    const el = imgRef.current
    if (!el) return

    observerRef.current = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setShouldLoad(true) },
      { threshold: 0.1, rootMargin: '100px' }
    )
    observerRef.current.observe(el)

    return () => observerRef.current?.disconnect()
  }, [])

  const containerStyle = {
    width: '100%',
    height,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    flexShrink: 0,
    ...style,
  }

  return (
    <div ref={imgRef} style={containerStyle}>
      {/* Shimmer while loading */}
      {status === 'loading' && <Shimmer style={{ position: 'absolute', inset: 0 }} />}

      {/* Actual image — only load when in viewport */}
      {shouldLoad && status !== 'error' && (
        <img
          src={imageUrl}
          alt={alt || productId}
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
          style={{
            width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center',
            borderRadius: 10,
            opacity: status === 'loaded' ? 1 : 0,
            transition: 'opacity 0.3s ease',
            position: 'absolute', inset: 0,
          }}
        />
      )}

      {/* Emoji fallback — shows if image errors or not yet uploaded */}
      {(status === 'error' || !shouldLoad) && (
        <EmojiFallback emoji={emoji} size={emojiSize} category={category} />
      )}
    </div>
  )
}
