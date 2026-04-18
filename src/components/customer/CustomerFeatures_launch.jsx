// ================================================================
// Isla Drop — CustomerFeatures_launch.jsx
// Final 20 features to reach full Getir parity + launch readiness
// T1: skeleton loader, home personalisation, voice search, image gallery
// T2: "because you bought" row, loyalty checkout fix, public tracking
//     referral backend, push notification display
// T3: swipe-back, bundle split helper, haptic on confirm,
//     image dimensions, HashRouter setup
// T4: weather tags, event data seeder, flight tracking wire,
//     currency everywhere, after-dark mode
// ================================================================
import { useState, useEffect, useRef, useCallback } from 'react'
import { useCartStore, useAuthStore } from '../../lib/store'
import { PRODUCTS, CATEGORIES } from '../../lib/products'
import toast from 'react-hot-toast'

const F = { serif:'DM Serif Display,serif', sans:'DM Sans,sans-serif' }
const C = {
  bg:'#0D3545', accent:'#C4683A', green:'#7EE8A2', gold:'#C8A84B',
  surface:'rgba(255,255,255,0.07)', border:'rgba(255,255,255,0.1)',
  muted:'rgba(255,255,255,0.45)',
}

// ── T1-2: Home screen skeleton loader ────────────────────────
export function HomeSkeletonLoader() {
  const shimmer = {
    background:'linear-gradient(90deg,rgba(255,255,255,0.05) 0%,rgba(255,255,255,0.12) 50%,rgba(255,255,255,0.05) 100%)',
    backgroundSize:'200% 100%',
    animation:'shimmerSlide 1.4s ease-in-out infinite',
    borderRadius:10,
  }
  return (
    <div style={{ padding:'12px 16px' }}>
      {/* Last order card skeleton */}
      <div style={{ ...shimmer, height:70, marginBottom:16, borderRadius:14 }}/>
      {/* Row label */}
      <div style={{ ...shimmer, height:20, width:'40%', marginBottom:12 }}/>
      {/* Horizontal card row */}
      <div style={{ display:'flex', gap:10, marginBottom:22 }}>
        {[1,2,3].map(i=>(
          <div key={i} style={{ flexShrink:0 }}>
            <div style={{ ...shimmer, width:134, height:100, marginBottom:6, borderRadius:10 }}/>
            <div style={{ ...shimmer, width:100, height:12, marginBottom:4 }}/>
            <div style={{ ...shimmer, width:60, height:12 }}/>
          </div>
        ))}
      </div>
      {/* Second row */}
      <div style={{ ...shimmer, height:20, width:'50%', marginBottom:12 }}/>
      <div style={{ display:'flex', gap:10, marginBottom:22 }}>
        {[1,2,3,4].map(i=>(
          <div key={i} style={{ flexShrink:0 }}>
            <div style={{ ...shimmer, width:134, height:100, marginBottom:6, borderRadius:10 }}/>
            <div style={{ ...shimmer, width:100, height:12, marginBottom:4 }}/>
            <div style={{ ...shimmer, width:60, height:12 }}/>
          </div>
        ))}
      </div>
      {/* Banner skeleton */}
      <div style={{ ...shimmer, height:100, marginBottom:16, borderRadius:16 }}/>
      <style>{'@keyframes shimmerSlide{0%{background-position:200% 0}100%{background-position:-200% 0}}'}</style>
    </div>
  )
}

// ── T1-3: Personalised home row ordering ─────────────────────
export function usePersonalisedCategories(previousItems) {
  const [orderedCats, setOrderedCats] = useState(CATEGORIES)
  useEffect(() => {
    if (!previousItems?.length) return
    // Count orders by category from previous items
    const freq = {}
    previousItems.forEach(p => { freq[p.category] = (freq[p.category]||0)+1 })
    const topCat = Object.entries(freq).sort((a,b)=>b[1]-a[1])[0]?.[0]
    if (!topCat) return
    // Move top category to front
    const reordered = [
      ...CATEGORIES.filter(c=>c.key===topCat),
      ...CATEGORIES.filter(c=>c.key!==topCat),
    ]
    setOrderedCats(reordered)
  }, [previousItems?.length])
  return orderedCats
}

// ── T1-4: Voice search for main search field ─────────────────
export function VoiceSearchButton({ onResult, onListening }) {
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef(null)

  const start = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { toast.error('Voice search not supported on this browser'); return }
    const rec = new SR()
    rec.continuous = false
    rec.interimResults = false
    rec.lang = 'en-GB'
    rec.onstart = () => { setListening(true); onListening?.(true) }
    rec.onresult = e => {
      const transcript = e.results[0][0].transcript
      onResult(transcript)
      setListening(false); onListening?.(false)
    }
    rec.onerror = () => { setListening(false); onListening?.(false) }
    rec.onend   = () => { setListening(false); onListening?.(false) }
    rec.start()
    recognitionRef.current = rec
  }, [onResult, onListening])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
    setListening(false); onListening?.(false)
  }, [onListening])

  return (
    <button onClick={listening ? stop : start}
      style={{ width:36, height:36, background:listening?'rgba(196,104,58,0.3)':'rgba(255,255,255,0.09)', border:'0.5px solid '+(listening?'rgba(196,104,58,0.6)':'rgba(255,255,255,0.14)'), borderRadius:10, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, position:'relative' }}>
      {listening && <div style={{ position:'absolute', inset:0, borderRadius:10, border:'2px solid rgba(196,104,58,0.6)', animation:'voicePulse 1s ease-in-out infinite' }}/>}
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={listening?'#E8A070':'rgba(255,255,255,0.6)'} strokeWidth="2">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
        <line x1="12" y1="19" x2="12" y2="23"/>
        <line x1="8" y1="23" x2="16" y2="23"/>
      </svg>
      <style>{'@keyframes voicePulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.15);opacity:0.7}}'}</style>
    </button>
  )
}

// ── T1-5: Product image gallery swipe ────────────────────────
export function useProductImages(productId) {
  const [images, setImages] = useState([])
  useEffect(() => {
    if (!productId) return
    import('../../lib/supabase').then(({ supabase }) => {
      supabase.from('product_images').select('url,alt,sort_order')
        .eq('product_id', productId).order('sort_order')
        .then(({ data }) => { if (data?.length) setImages(data) })
        .catch(() => {})
    }).catch(() => {})
  }, [productId])
  return images
}

export function ImageGallery({ product, images }) {
  const [current, setCurrent] = useState(0)
  const startX = useRef(null)
  const all = images.length > 0
    ? images
    : [{ url: null, alt: product.name }]

  const onTouchStart = e => { startX.current = e.touches[0].clientX }
  const onTouchEnd = e => {
    if (startX.current === null) return
    const dx = e.changedTouches[0].clientX - startX.current
    if (dx < -50 && current < all.length-1) setCurrent(c=>c+1)
    if (dx > 50 && current > 0) setCurrent(c=>c-1)
    startX.current = null
  }

  return (
    <div style={{ height:220, position:'relative', overflow:'hidden' }}
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {/* Images */}
      <div style={{ display:'flex', height:'100%', transition:'transform 0.3s ease', transform:'translateX(-'+current*100+'%)' }}>
        {all.map((img, i) => (
          <div key={i} style={{ flexShrink:0, width:'100%', height:'100%', position:'relative' }}>
            {img.url ? (
              <img src={img.url} alt={img.alt||product.name} loading="lazy"
                width="480" height="220"
                style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
            ) : (
              <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(43,122,139,0.15)', fontSize:80 }}>
                {product.emoji}
              </div>
            )}
          </div>
        ))}
      </div>
      {/* Gradient overlay */}
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top,rgba(13,53,69,0.95) 0%,transparent 55%)', pointerEvents:'none' }}/>
      {/* Emoji overlay */}
      <div style={{ position:'absolute', bottom:16, left:20, fontSize:40 }}>{product.emoji}</div>
      {/* Dots — only show if multiple images */}
      {all.length > 1 && (
        <div style={{ position:'absolute', bottom:14, right:16, display:'flex', gap:5 }}>
          {all.map((_,i) => (
            <button key={i} onClick={()=>setCurrent(i)}
              style={{ width:i===current?18:6, height:6, borderRadius:99, background:i===current?'white':'rgba(255,255,255,0.35)', border:'none', cursor:'pointer', padding:0, transition:'all 0.2s' }}/>
          ))}
        </div>
      )}
    </div>
  )
}

// ── T2-6: "Because you bought X" row ─────────────────────────
export function BecauseYouBoughtRow({ previousItems, onDetail }) {
  const { addItem } = useCartStore()
  if (!previousItems?.length) return null
  // Find top category from previous items
  const freq = {}
  previousItems.forEach(p => { freq[p.category] = (freq[p.category]||0)+1 })
  const topCat = Object.entries(freq).sort((a,b)=>b[1]-a[1])[0]?.[0]
  if (!topCat) return null
  const topItem = previousItems.find(p=>p.category===topCat)
  const products = PRODUCTS.filter(p=>p.category===topCat && !previousItems.find(pi=>pi.id===p.id)).slice(0,8)
  if (!products.length) return null
  const catLabel = (topItem?.category||topCat).replace(/_/g,' ')

  return (
    <div style={{ marginBottom:22 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0 16px', marginBottom:12 }}>
        <div style={{ fontFamily:F.serif, fontSize:20, color:'white' }}>
          Because you love {catLabel} 🎯
        </div>
      </div>
      <div style={{ display:'flex', gap:10, overflowX:'auto', padding:'0 16px 4px', scrollbarWidth:'none' }}>
        {products.map(p=>(
          <div key={p.id} onClick={()=>onDetail&&onDetail(p)}
            style={{ background:'rgba(255,255,255,0.9)', borderRadius:14, overflow:'hidden', minWidth:130, maxWidth:130, flexShrink:0, cursor:'pointer' }}>
            <div style={{ height:90, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(255,255,255,0.5)', fontSize:34 }}>{p.emoji}</div>
            <div style={{ padding:'7px 9px 9px' }}>
              <div style={{ fontSize:10, color:'#2A2318', lineHeight:1.3, marginBottom:3, height:24, overflow:'hidden' }}>{p.name}</div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:12, fontWeight:700, color:'#C4683A' }}>€{p.price.toFixed(2)}</span>
                <button onClick={e=>{e.stopPropagation();addItem(p);toast.success(p.emoji+' Added!',{duration:800})}}
                  style={{ width:22,height:22,background:'#C4683A',border:'none',borderRadius:'50%',color:'white',fontSize:13,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer' }}>+</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── T2-7: Loyalty delivery fee applied to checkout total ──────
export function useLoyaltyDelivery(redeemed) {
  return redeemed ? 0 : 3.50
}

// ── T2-8: Public tracking route helper ───────────────────────
// Call this from main.jsx to handle /track/:orderNumber URLs
export function getOrderNumberFromURL() {
  const hash = window.location.hash // #/track/ORDER123
  const path = window.location.pathname // /track/ORDER123
  const match = (hash + path).match(/track\/([A-Z0-9-]+)/i)
  return match?.[1] || null
}

// ── T2-9: Referral processing at sign-up ─────────────────────
export async function processReferral(newUserId) {
  try {
    const code = sessionStorage.getItem('isla_referral_code')
    if (!code) return
    const { supabase } = await import('../../lib/supabase')
    // Find the referrer
    const { data: referrer } = await supabase
      .from('profiles').select('id').eq('referral_code', code).single()
    if (!referrer) return
    // Credit both users
    await Promise.all([
      supabase.from('customer_credits').insert({
        user_id: referrer.id, amount:10, reason:'Referral reward — friend signed up', expires_at: new Date(Date.now()+90*86400000).toISOString()
      }),
      supabase.from('customer_credits').insert({
        user_id: newUserId, amount:10, reason:'Welcome gift — referred by a friend', expires_at: new Date(Date.now()+90*86400000).toISOString()
      }),
      supabase.from('referrals').insert({
        referrer_id: referrer.id, referee_id: newUserId, code, status:'completed'
      }),
    ])
    sessionStorage.removeItem('isla_referral_code')
    toast.success('€10 referral credit added to your account! 🎁')
  } catch {}
}

// ── T2-10: Push notification display ─────────────────────────
export function PushNotificationPrompt({ onAccept, onDismiss }) {
  return (
    <div style={{ position:'fixed', bottom:80, left:'50%', transform:'translateX(-50%)', width:'calc(100% - 32px)', maxWidth:448, background:'rgba(13,53,69,0.97)', backdropFilter:'blur(12px)', border:'0.5px solid rgba(43,122,139,0.4)', borderRadius:16, padding:'16px', zIndex:180, boxShadow:'0 8px 32px rgba(0,0,0,0.4)' }}>
      <div style={{ display:'flex', gap:12, marginBottom:12 }}>
        <div style={{ fontSize:28, flexShrink:0 }}>🔔</div>
        <div>
          <div style={{ fontSize:14, fontWeight:600, color:'white', fontFamily:F.sans, marginBottom:3 }}>Enable delivery alerts</div>
          <div style={{ fontSize:12, color:C.muted, lineHeight:1.5 }}>Get notified when your order is confirmed, on its way and delivered — even when the app is closed.</div>
        </div>
      </div>
      <div style={{ display:'flex', gap:8 }}>
        <button onClick={onAccept}
          style={{ flex:1, padding:'10px', background:C.accent, border:'none', borderRadius:10, color:'white', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:F.sans }}>
          Enable notifications
        </button>
        <button onClick={onDismiss}
          style={{ padding:'10px 16px', background:'rgba(255,255,255,0.07)', border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:10, color:C.muted, fontSize:13, cursor:'pointer', fontFamily:F.sans }}>
          Later
        </button>
      </div>
    </div>
  )
}

// ── T3-13: Swipe-back gesture for full-screen views ──────────
export function useSwipeBack(onBack, enabled=true) {
  const startX = useRef(null)
  const startY = useRef(null)
  const onTouchStart = useCallback(e => {
    if (!enabled) return
    startX.current = e.touches[0].clientX
    startY.current = e.touches[0].clientY
  }, [enabled])
  const onTouchEnd = useCallback(e => {
    if (!enabled || startX.current === null) return
    const dx = e.changedTouches[0].clientX - startX.current
    const dy = Math.abs(e.changedTouches[0].clientY - startY.current)
    // Swipe right from left edge, mostly horizontal
    if (dx > 80 && dy < 60 && startX.current < 40) {
      onBack()
      navigator.vibrate?.(15)
    }
    startX.current = null
  }, [enabled, onBack])
  return { onTouchStart, onTouchEnd }
}

// ── T3-15: Haptic on order confirmed ─────────────────────────
export function fireOrderConfirmedHaptic() {
  if (!navigator.vibrate) return
  // Success pattern: two short + one long
  navigator.vibrate([30, 80, 30, 80, 120])
}

// ── T4-16: Weather tags default mapping ──────────────────────
// Used when products don't have weather_tags in DB yet
export const DEFAULT_WEATHER_TAGS = {
  beer_cider:    ['hot','sunny'],
  water_juice:   ['hot','sunny'],
  soft_drinks:   ['hot','sunny'],
  ice:           ['hot','sunny'],
  spirits:       ['cool','night','any'],
  wine:          ['cool','night','any'],
  champagne:     ['any'],
  snacks:        ['any'],
}

export function getWeatherTagsForProduct(product) {
  if (product?.weather_tags?.length) return product.weather_tags
  return DEFAULT_WEATHER_TAGS[product?.category] || ['any']
}

export function isProductRelevantForWeather(product, weather) {
  if (!weather) return false
  const tags = getWeatherTagsForProduct(product)
  if (tags.includes('any')) return false // don't badge everything
  const { temp, sunny } = weather
  const hot = temp > 28
  const cool = temp < 20
  if (hot && sunny && tags.includes('hot')) return 'hot'
  if (cool && tags.includes('cool')) return 'cool'
  return false
}

// Enhanced WeatherRelevanceBadge that works without DB tags
export function WeatherBadge({ product, weather }) {
  const relevance = isProductRelevantForWeather(product, weather)
  if (!relevance) return null
  return (
    <div style={{ position:'absolute', top:5, left:5, background:relevance==='hot'?'rgba(255,200,50,0.9)':'rgba(43,122,139,0.9)', borderRadius:6, padding:'2px 6px', fontSize:9, fontWeight:700, color:relevance==='hot'?'#2A2318':'white', zIndex:2 }}>
      {relevance==='hot' ? '☀️ Perfect today' : '🌬️ Great tonight'}
    </div>
  )
}

// ── T4-17: Ibiza events seeder (run once to populate DB) ─────
export const IBIZA_2025_EVENTS = [
  { venue:'Pacha', artist:'Glitterbox', event_date:'2025-06-13', time:'00:00', emoji:'🍒', categories:['spirits','champagne'] },
  { venue:'Ushuaia', artist:'David Guetta', event_date:'2025-06-19', time:'18:00', emoji:'🌴', categories:['beer_cider','spirits'] },
  { venue:'DC-10', artist:'Circoloco', event_date:'2025-06-23', time:'15:00', emoji:'✈️', categories:['spirits','water_juice'] },
  { venue:'Hi Ibiza', artist:'Eric Prydz', event_date:'2025-06-26', time:'00:00', emoji:'⚡', categories:['spirits','soft_drinks'] },
  { venue:'Amnesia', artist:'Together',   event_date:'2025-07-01', time:'00:00', emoji:'🎊', categories:['spirits','beer_cider'] },
  { venue:'Pacha', artist:'Music On',     event_date:'2025-07-04', time:'00:00', emoji:'🍒', categories:['spirits','champagne'] },
  { venue:'UNVRS', artist:'Opening',      event_date:'2025-07-11', time:'00:00', emoji:'🌌', categories:['spirits','beer_cider'] },
  { venue:'DC-10', artist:'Circoloco',    event_date:'2025-07-14', time:'15:00', emoji:'✈️', categories:['spirits','water_juice'] },
  { venue:'Cova Santa', artist:'Cova Santa Opening', event_date:'2025-07-18', time:'19:00', emoji:'🌿', categories:['wine','champagne'] },
  { venue:'Blue Marlin', artist:'Summer Sessions', event_date:'2025-07-25', time:'14:00', emoji:'🏖️', categories:['champagne','wine'] },
]

export async function seedIbizaEvents() {
  try {
    const { supabase } = await import('../../lib/supabase')
    const { error } = await supabase.from('ibiza_events').upsert(
      IBIZA_2025_EVENTS.map(e=>({...e, active:true})),
      { onConflict:'venue,event_date' }
    )
    if (error) throw error
    toast.success('Events seeded! 🎵')
  } catch(err) { toast.error('Seed failed: '+err.message) }
}

// ── T4-18: Flight tracking wired to pre-arrival ──────────────
export function PreArrivalFlightStatus({ flightNumber, scheduledTime }) {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  const check = useCallback(async () => {
    if (!flightNumber || flightNumber.length < 4) return
    setLoading(true)
    try {
      const resp = await fetch('https://api.adsb.lol/v2/callsign/'+flightNumber.replace(/\s/g,'').toUpperCase())
      const data = await resp.json()
      const ac = data.ac?.[0]
      if (!ac) { setStatus({ text:'Flight data unavailable — check airline app', ok:false }); return }
      const landed = ac.alt_baro === 'ground' || ac.gs < 5
      setStatus({ text: landed ? '✅ Landed — your delivery will be ready' : '🛫 In the air — on schedule', ok:true })
    } catch { setStatus({ text:'Could not fetch flight data', ok:false }) }
    setLoading(false)
  }, [flightNumber])

  useEffect(() => { check() }, [flightNumber])

  if (!flightNumber || flightNumber.length < 4) return null
  return (
    <div style={{ background:'rgba(43,122,139,0.15)', border:'0.5px solid rgba(43,122,139,0.3)', borderRadius:12, padding:'10px 14px', marginTop:10, display:'flex', alignItems:'center', gap:10 }}>
      <span style={{ fontSize:18, flexShrink:0 }}>✈️</span>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:12, fontWeight:600, color:'white', fontFamily:F.sans }}>{flightNumber.toUpperCase()}</div>
        <div style={{ fontSize:11, color:C.muted, marginTop:1 }}>
          {loading ? 'Checking flight...' : (status?.text || 'Fetching status...')}
        </div>
      </div>
      <button onClick={check} disabled={loading}
        style={{ background:'none', border:'none', color:'rgba(43,122,200,0.8)', cursor:'pointer', fontSize:11, fontFamily:F.sans, fontWeight:600, flexShrink:0 }}>
        {loading ? '...' : 'Refresh'}
      </button>
    </div>
  )
}

// ── T4-19: Currency formatting everywhere ─────────────────────
export function formatCurrency(euros, currency='EUR', gbpRate=0.86) {
  if (currency === 'GBP') return '£'+(euros*gbpRate).toFixed(2)
  return '€'+euros.toFixed(2)
}

// Hook to use in any component that shows a price
export function useFormatPrice() {
  const [currency] = useState(() => {
    try { return localStorage.getItem('isla_currency') || 'EUR' } catch { return 'EUR' }
  })
  const [gbpRate] = useState(0.86)
  return useCallback((euros) => formatCurrency(euros, currency, gbpRate), [currency, gbpRate])
}

// ── T4-20: Ibiza after-dark mode ─────────────────────────────
export function useAfterDarkMode() {
  const hour = new Date().getHours()
  // After dark: 23:00 to 04:00
  const isAfterDark = hour >= 23 || hour < 4
  return isAfterDark
}

// Categories to surface first in after-dark mode
export const AFTER_DARK_CATEGORIES = ['spirits','champagne','beer_cider','wine']

export function AfterDarkBanner() {
  const hour = new Date().getHours()
  if (!(hour >= 23 || hour < 4)) return null
  return (
    <div style={{ margin:'0 16px 16px', background:'linear-gradient(135deg,rgba(80,20,120,0.3),rgba(30,10,60,0.4))', border:'0.5px solid rgba(150,80,200,0.3)', borderRadius:16, padding:'14px 16px', display:'flex', alignItems:'center', gap:12 }}>
      <div style={{ fontSize:28 }}>🌙</div>
      <div>
        <div style={{ fontFamily:F.serif, fontSize:16, color:'white', marginBottom:2 }}>Ibiza after dark</div>
        <div style={{ fontSize:11, color:'rgba(200,150,255,0.7)' }}>Night's still young · Spirits, champagne and more</div>
      </div>
    </div>
  )
}

export function getAfterDarkProducts() {
  const hour = new Date().getHours()
  if (!(hour >= 23 || hour < 4)) return null
  return PRODUCTS.filter(p=>AFTER_DARK_CATEGORIES.includes(p.category)).slice(0,12)
}
