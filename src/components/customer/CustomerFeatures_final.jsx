// ================================================================
// Isla Drop — CustomerFeatures_final.jsx
// 25 final features completing world-class parity with Getir
// ================================================================
import { useState, useEffect, useRef, useCallback } from 'react'
import { useCartStore, useAuthStore } from '../../lib/store'
import { PRODUCTS, BEST_SELLERS } from '../../lib/products'
import toast from 'react-hot-toast'

const F = { serif:'DM Serif Display,serif', sans:'DM Sans,sans-serif' }
const C = {
  bg:'#0D3545', accent:'#C4683A', green:'#7EE8A2', gold:'#C8A84B',
  surface:'rgba(255,255,255,0.07)', border:'rgba(255,255,255,0.1)',
  muted:'rgba(255,255,255,0.45)',
}

// ── FEATURE 3: Basket item slide-out animation hook ───────────
export function useSlideOut() {
  const [removing, setRemoving] = useState({})
  const animateRemove = useCallback((id, callback) => {
    setRemoving(r => ({ ...r, [id]: true }))
    setTimeout(() => {
      callback()
      setRemoving(r => { const n={...r}; delete n[id]; return n })
    }, 220)
  }, [])
  return { removing, animateRemove }
}

// ── FEATURE 4: Live checkout total (reads live cart) ──────────
export function LiveCheckoutTotal({ tipAmount }) {
  const cart = useCartStore()
  const sub = cart.getSubtotal()
  const delivery = cart.deliveryAddress ? 3.50 : 3.50
  const tip = Number(tipAmount) || 0
  const total = sub + delivery + tip
  return (
    <div style={{ borderTop:'0.5px solid rgba(255,255,255,0.1)', paddingTop:10, marginTop:6 }}>
      {cart.items.map(({product,quantity}) => (
        <div key={product.id} style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:8, color:'rgba(255,255,255,0.82)' }}>
          <span>{product.emoji} {product.name} × {quantity}</span>
          <span style={{ fontWeight:500 }}>€{(product.price*quantity).toFixed(2)}</span>
        </div>
      ))}
      <div style={{ borderTop:'0.5px solid rgba(255,255,255,0.08)', paddingTop:8, marginTop:4 }}>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'rgba(255,255,255,0.45)', marginBottom:4 }}>
          <span>Subtotal</span><span>€{sub.toFixed(2)}</span>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'rgba(255,255,255,0.45)', marginBottom:4 }}>
          <span>Delivery</span><span>€{delivery.toFixed(2)}</span>
        </div>
        {tip > 0 && (
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'rgba(255,255,255,0.45)', marginBottom:4 }}>
            <span>Driver tip</span><span>€{tip.toFixed(2)}</span>
          </div>
        )}
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:15, fontWeight:600, color:'white', marginTop:6 }}>
          <span>Total</span><span style={{ color:'#E8A070' }}>€{total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}

// ── FEATURE 5: Pay button with loading state ──────────────────
export function PayButton({ onPay, total, loading }) {
  return (
    <button onClick={onPay} disabled={loading}
      style={{ width:'100%', padding:'16px', background:loading?'rgba(196,104,58,0.6)':'#C4683A', border:'none', borderRadius:14, color:'white', fontSize:15, fontWeight:600, cursor:loading?'default':'pointer', fontFamily:F.sans, marginBottom:10, display:'flex', alignItems:'center', justifyContent:'center', gap:10, boxShadow:loading?'none':'0 4px 20px rgba(196,104,58,0.4)', transition:'all 0.2s' }}>
      {loading ? (
        <>
          <div style={{ width:18, height:18, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'white', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>
          Processing...
        </>
      ) : (
        <>Pay €{total.toFixed(2)} →</>
      )}
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
    </button>
  )
}

// ── FEATURE 6: Confirmed address card ─────────────────────────
export function ConfirmedAddressCard({ address, onClear }) {
  if (!address) return null
  return (
    <div style={{ background:'rgba(126,232,162,0.08)', border:'0.5px solid rgba(126,232,162,0.3)', borderRadius:12, padding:'12px 14px', marginBottom:14, display:'flex', alignItems:'flex-start', gap:10 }}>
      <span style={{ fontSize:18, flexShrink:0 }}>📍</span>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:11, fontWeight:700, color:C.green, letterSpacing:'0.5px', marginBottom:3 }}>DELIVERY ADDRESS SET</div>
        <div style={{ fontSize:13, color:'white', lineHeight:1.5, fontFamily:F.sans }}>{address}</div>
      </div>
      <button onClick={onClear} style={{ background:'none', border:'none', color:C.muted, cursor:'pointer', fontSize:16, flexShrink:0, padding:0 }}>✕</button>
    </div>
  )
}

// ── FEATURE 7: Floating basket bar with press state ───────────
export function FloatingBasketBar({ itemCount, subtotal, onTap, t }) {
  const ref = useRef(null)
  const press = () => ref.current && (ref.current.style.transform='scale(0.98)')
  const release = () => ref.current && (ref.current.style.transform='scale(1)')
  if (!itemCount) return null
  return (
    <div ref={ref} onClick={onTap}
      onTouchStart={press} onTouchEnd={release} onMouseDown={press} onMouseUp={release} onMouseLeave={release}
      style={{ position:'sticky', bottom:68, margin:'0 16px', background:'#C4683A', borderRadius:14, padding:'13px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', boxShadow:'0 4px 24px rgba(196,104,58,0.5)', transition:'transform 0.1s cubic-bezier(0.34,1.56,0.64,1)' }}>
      <div style={{ color:'white' }}>
        <div style={{ fontSize:11, opacity:0.8 }}>{itemCount} {itemCount===1?(t?.item||'item'):(t?.items||'items')}</div>
        <div style={{ fontSize:15, fontWeight:500 }}>€{subtotal.toFixed(2)} + €3.50 delivery</div>
      </div>
      <div style={{ color:'white', fontSize:13, fontWeight:500 }}>{t?.viewCart||'View basket'} →</div>
    </div>
  )
}

// ── FEATURE 9: Push notification infrastructure ───────────────
const PUSH_KEY = 'isla_push_sub'
export async function requestPushPermission(userId) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null
  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return null
    const reg = await navigator.serviceWorker.ready
    const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
    if (!vapidKey) return null
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: vapidKey
    })
    const subJson = JSON.stringify(sub)
    sessionStorage.setItem(PUSH_KEY, subJson)
    // Store subscription in Supabase
    const { supabase } = await import('../../lib/supabase')
    await supabase.from('push_subscriptions').upsert({
      user_id: userId, subscription: subJson,
      updated_at: new Date().toISOString()
    }, { onConflict:'user_id' })
    return sub
  } catch { return null }
}

export function usePushNotifications() {
  const { user } = useAuthStore()
  const [enabled, setEnabled] = useState(false)
  useEffect(() => {
    if (!user || !('Notification' in window)) return
    setEnabled(Notification.permission === 'granted')
  }, [user])
  const enable = async () => {
    const sub = await requestPushPermission(user?.id)
    if (sub) { setEnabled(true); toast.success('Push notifications enabled 🔔') }
    else toast.error('Could not enable notifications — check browser settings')
  }
  return { enabled, enable }
}

export function PushNotificationToggle() {
  const { enabled, enable } = usePushNotifications()
  if (!('PushManager' in window)) return null
  if (enabled) return (
    <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', background:'rgba(126,232,162,0.08)', border:'0.5px solid rgba(126,232,162,0.2)', borderRadius:10, marginBottom:10, fontSize:12, color:C.green, fontFamily:F.sans }}>
      <span>🔔</span> Push notifications enabled
    </div>
  )
  return (
    <button onClick={enable}
      style={{ width:'100%', padding:'12px 14px', background:'rgba(255,255,255,0.07)', border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:10, color:'rgba(255,255,255,0.7)', fontSize:13, cursor:'pointer', fontFamily:F.sans, display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
      <span>🔔</span>
      <div style={{ textAlign:'left' }}>
        <div style={{ fontWeight:600 }}>Enable push notifications</div>
        <div style={{ fontSize:11, color:C.muted }}>Get order updates even when the app is closed</div>
      </div>
    </button>
  )
}

// ── FEATURE 11: Referral code auto-apply from URL ─────────────
export function useReferralFromURL() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const ref = params.get('ref')
      if (ref) {
        sessionStorage.setItem('isla_ref_code', ref.toUpperCase())
        toast.success('Referral code ' + ref.toUpperCase() + ' applied! 🌴', { duration:4000 })
        // Clean URL without reload
        const url = new URL(window.location.href)
        url.searchParams.delete('ref')
        window.history.replaceState({}, '', url.toString())
      }
    } catch {}
  }, [])
}

export function getStoredReferralCode() {
  try { return sessionStorage.getItem('isla_ref_code') } catch { return null }
}

// ── FEATURE 12: Quantity limit enforcement in cart ────────────
export function useQuantityGuard() {
  const addItemSafe = useCallback((product, addItem, updateQuantity, currentQty) => {
    const max = product.max_per_order
    if (max && currentQty >= max) {
      toast.error('Maximum ' + max + ' per order for ' + product.name, { icon:'⚠️' })
      return false
    }
    addItem(product)
    return true
  }, [])
  return { addItemSafe }
}

export function QuantityLimitBadge({ product, qty }) {
  const max = product?.max_per_order
  if (!max || !qty) return null
  const pct = qty / max
  if (pct < 0.5) return null
  return (
    <div style={{ fontSize:9, color:pct >= 1 ? '#F09595' : '#E8A070', fontWeight:700, fontFamily:F.sans, marginTop:2 }}>
      {pct >= 1 ? 'MAX' : qty + '/' + max + ' max'}
    </div>
  )
}

// ── FEATURE 13: Order history pagination ──────────────────────
export function usePaginatedOrders(pageSize=10) {
  const { user } = useAuthStore()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(0)
  const [error, setError] = useState(null)

  const load = useCallback(async (p=0) => {
    if (!user) { setLoading(false); return }
    setLoading(true); setError(null)
    try {
      const { supabase } = await import('../../lib/supabase')
      const from = p * pageSize, to = from + pageSize - 1
      const { data, error: err } = await supabase
        .from('orders').select('*, order_items(*, products(*))')
        .eq('customer_id', user.id)
        .order('created_at', { ascending:false })
        .range(from, to)
      if (err) throw err
      setOrders(prev => p === 0 ? (data||[]) : [...prev, ...(data||[])])
      setHasMore((data||[]).length === pageSize)
    } catch(e) { setError(e.message) }
    setLoading(false)
  }, [user, pageSize])

  useEffect(() => { load(0) }, [load])

  const loadMore = () => { const next = page + 1; setPage(next); load(next) }
  const refresh = () => { setPage(0); load(0) }

  return { orders, loading, hasMore, loadMore, refresh, error }
}

// ── FEATURE 14: Product variant selector ─────────────────────
export function VariantSelector({ product, selectedVariant, onSelect }) {
  const variants = product?.variants
  if (!variants?.length) return null
  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ fontSize:12, color:C.muted, marginBottom:8, textTransform:'uppercase', letterSpacing:'0.5px', fontFamily:F.sans }}>Size / Format</div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
        {variants.map(v => (
          <button key={v.id} onClick={()=>onSelect(v)}
            style={{ padding:'8px 16px', borderRadius:10, fontSize:13, fontFamily:F.sans, cursor:'pointer', transition:'all 0.15s',
              background: selectedVariant?.id===v.id ? 'rgba(196,104,58,0.25)' : 'rgba(255,255,255,0.07)',
              border: '0.5px solid ' + (selectedVariant?.id===v.id ? '#C4683A' : 'rgba(255,255,255,0.15)'),
              color: selectedVariant?.id===v.id ? '#E8A070' : 'white',
              fontWeight: selectedVariant?.id===v.id ? 600 : 400 }}>
            {v.label}
            {v.price_delta && v.price_delta !== 0 && (
              <span style={{ fontSize:10, opacity:0.7, marginLeft:4 }}>
                {v.price_delta > 0 ? '+' : ''}€{v.price_delta.toFixed(2)}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── FEATURE 15: Corporate / VAT invoice billing ───────────────
export function CorporateBillingToggle({ enabled, onToggle, details, onDetailsChange }) {
  return (
    <div style={{ marginBottom:14 }}>
      <button onClick={onToggle}
        style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%', padding:'12px 14px', background:enabled?'rgba(43,122,139,0.12)':'rgba(255,255,255,0.06)', border:'0.5px solid '+(enabled?'rgba(43,122,139,0.4)':'rgba(255,255,255,0.12)'), borderRadius:12, cursor:'pointer', textAlign:'left' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:20 }}>🏢</span>
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:'white', fontFamily:F.sans }}>Business order</div>
            <div style={{ fontSize:11, color:C.muted }}>Add company details for VAT invoice</div>
          </div>
        </div>
        <div style={{ width:44, height:24, borderRadius:99, background:enabled?C.accent:'rgba(255,255,255,0.15)', position:'relative', flexShrink:0, transition:'background 0.2s' }}>
          <div style={{ position:'absolute', top:3, left:enabled?22:3, width:18, height:18, borderRadius:'50%', background:'white', transition:'left 0.2s' }}/>
        </div>
      </button>
      {enabled && (
        <div style={{ marginTop:8, padding:'14px', background:'rgba(43,122,139,0.08)', border:'0.5px solid rgba(43,122,139,0.2)', borderRadius:12 }}>
          {[
            ['Company name','e.g. Ibiza Villas SL','company_name','text'],
            ['CIF / VAT number','e.g. B12345678','vat_number','text'],
            ['Billing email','invoices@company.com','billing_email','email'],
          ].map(([label,ph,key,type])=>(
            <div key={key} style={{ marginBottom:10 }}>
              <div style={{ fontSize:11, color:C.muted, marginBottom:5 }}>{label}</div>
              <input type={type} value={details?.[key]||''} onChange={e=>onDetailsChange({...details,[key]:e.target.value})}
                placeholder={ph}
                style={{ width:'100%', padding:'10px 12px', background:'rgba(255,255,255,0.08)', border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:10, color:'white', fontSize:13, fontFamily:F.sans, outline:'none', boxSizing:'border-box' }}/>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── FEATURE 16: Service worker cache registration ─────────────
export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(reg => {
      console.log('[SW] Registered:', reg.scope)
    }).catch(() => {})
  })
}

// Offline banner
export function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])
  return online
}

export function OfflineBanner() {
  const online = useOnlineStatus()
  if (online) return null
  return (
    <div style={{ position:'fixed', top:0, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:480, zIndex:999, background:'rgba(240,149,149,0.95)', backdropFilter:'blur(8px)', padding:'10px 16px', display:'flex', alignItems:'center', gap:10 }}>
      <span style={{ fontSize:16 }}>📡</span>
      <span style={{ fontSize:13, fontWeight:600, color:'white', fontFamily:F.sans }}>No connection — showing cached content</span>
    </div>
  )
}

// ── FEATURE 17: Delivery zone coordinate validation ───────────
// Ibiza bounding box — rough polygon check
const IBIZA_BOUNDS = { minLat:38.82, maxLat:39.13, minLng:1.18, maxLng:1.62 }
export function isInIbizaZone(lat, lng) {
  if (!lat || !lng) return true // no coords = don't block
  return lat >= IBIZA_BOUNDS.minLat && lat <= IBIZA_BOUNDS.maxLat
      && lng >= IBIZA_BOUNDS.minLng && lng <= IBIZA_BOUNDS.maxLng
}

export function DeliveryZoneWarning({ lat, lng }) {
  if (isInIbizaZone(lat, lng)) return null
  return (
    <div style={{ background:'rgba(240,149,149,0.12)', border:'0.5px solid rgba(240,149,149,0.35)', borderRadius:12, padding:'12px 14px', marginBottom:14, display:'flex', gap:10, alignItems:'flex-start' }}>
      <span style={{ fontSize:18, flexShrink:0 }}>⚠️</span>
      <div>
        <div style={{ fontSize:13, fontWeight:600, color:'#F09595', fontFamily:F.sans, marginBottom:3 }}>Outside delivery zone</div>
        <div style={{ fontSize:12, color:C.muted, lineHeight:1.5 }}>
          This location appears to be outside Ibiza. Please check your address or contact us on WhatsApp for special deliveries.
        </div>
      </div>
    </div>
  )
}

// ── FEATURE 19: Analytics event tracking ─────────────────────
const ANALYTICS_BATCH = []
let flushTimer = null

export async function trackEvent(name, props={}) {
  try {
    const event = {
      name,
      props: { ...props, ts: Date.now(), url: window.location.pathname },
    }
    ANALYTICS_BATCH.push(event)
    if (flushTimer) clearTimeout(flushTimer)
    flushTimer = setTimeout(async () => {
      if (!ANALYTICS_BATCH.length) return
      const batch = ANALYTICS_BATCH.splice(0)
      try {
        const { supabase } = await import('../../lib/supabase')
        await supabase.from('analytics_events').insert(
          batch.map(e => ({ event_name: e.name, properties: e.props, created_at: new Date().toISOString() }))
        )
      } catch {}
    }, 2000)
  } catch {}
}

// Convenience wrappers for the 5 key events
export const Analytics = {
  productView:      (p)  => trackEvent('product_view',      { product_id:p.id, name:p.name, price:p.price, category:p.category }),
  addToCart:        (p)  => trackEvent('add_to_cart',       { product_id:p.id, name:p.name, price:p.price }),
  checkoutStart:    (v)  => trackEvent('checkout_start',    { cart_value:v }),
  checkoutComplete: (v)  => trackEvent('checkout_complete', { order_value:v }),
  search:           (q,r)=> trackEvent('search',            { query:q, results:r }),
}

// ── FEATURE 20: AI proxy via Supabase Edge Function ───────────
export async function callAIProxy(prompt, systemPrompt, maxTokens=1000) {
  // Try Edge Function first (secure, rate-limited)
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseKey) throw new Error('no_url')
    const resp = await fetch(supabaseUrl + '/functions/v1/ai-proxy', {
      method:'POST',
      headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer '+supabaseKey },
      body: JSON.stringify({ prompt, system: systemPrompt, max_tokens: maxTokens })
    })
    if (resp.ok) {
      const data = await resp.json()
      if (data?.text) return data.text
    }
  } catch {}
  // Fallback: direct client call (key exposed — only for dev)
  const key = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!key) throw new Error('No AI key configured')
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method:'POST',
    headers:{ 'Content-Type':'application/json', 'anthropic-version':'2023-06-01', 'anthropic-dangerous-direct-browser-access':'true', 'x-api-key':key },
    body: JSON.stringify({ model:'claude-haiku-4-5-20251001', max_tokens:maxTokens, system:systemPrompt, messages:[{role:'user',content:prompt}] })
  })
  if (!resp.ok) throw new Error('AI API ' + resp.status)
  const data = await resp.json()
  return data.content?.[0]?.text || ''
}

// ── FEATURE 21: Beach GPS delivery ───────────────────────────
const IBIZA_BEACHES = [
  { name:'Playa de Salinas', lat:38.8720, lng:1.4050 },
  { name:'Playa den Bossa', lat:38.8820, lng:1.4120 },
  { name:'Cala Bassa', lat:38.9600, lng:1.2350 },
  { name:'Cala Comte', lat:38.9520, lng:1.2150 },
  { name:'Cala Tarida', lat:38.9350, lng:1.2200 },
  { name:'Es Canar Beach', lat:39.0080, lng:1.5530 },
  { name:'Cala Llonga', lat:38.9530, lng:1.5500 },
  { name:'Aguas Blancas', lat:39.0880, lng:1.4950 },
  { name:'Las Dalias Beach', lat:39.0200, lng:1.5400 },
  { name:'Cala Jondal', lat:38.8700, lng:1.3700 },
  { name:'S\'Estanyol Beach', lat:38.9850, lng:1.2650 },
  { name:'Cala Nova', lat:39.0170, lng:1.5570 },
]

function nearestBeach(lat, lng) {
  let best = null, bestDist = Infinity
  IBIZA_BEACHES.forEach(b => {
    const d = Math.hypot(b.lat - lat, b.lng - lng)
    if (d < bestDist) { bestDist = d; best = b }
  })
  return bestDist < 0.05 ? best : null // ~5km radius
}

export function BeachGPSButton({ onSet }) {
  const [loading, setLoading] = useState(false)
  const locate = () => {
    if (!navigator.geolocation) { toast.error('GPS not available on this device'); return }
    setLoading(true)
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude:lat, longitude:lng } = pos.coords
      const beach = nearestBeach(lat, lng)
      const label = beach ? beach.name + ' ☀️' : 'My current location 📍'
      onSet({ lat, lng, address: label })
      toast.success('Delivering to: ' + label)
      setLoading(false)
    }, () => {
      toast.error('Could not get your location — check GPS permissions')
      setLoading(false)
    }, { timeout:8000, maximumAge:30000 })
  }
  return (
    <button onClick={locate} disabled={loading}
      style={{ width:'100%', marginBottom:10, padding:'12px 14px', background:'rgba(200,168,75,0.12)', border:'0.5px solid rgba(200,168,75,0.35)', borderRadius:12, color:'#C8A84B', fontSize:13, fontWeight:600, cursor:loading?'default':'pointer', fontFamily:F.sans, display:'flex', alignItems:'center', gap:10, transition:'all 0.2s' }}>
      {loading ? (
        <><div style={{ width:16,height:16,border:'2px solid rgba(200,168,75,0.3)',borderTopColor:'#C8A84B',borderRadius:'50%',animation:'spin 0.7s linear infinite' }}/> Locating...</>
      ) : (
        <><span style={{ fontSize:18 }}>☀️</span> I'm at the beach — deliver here</>
      )}
    </button>
  )
}

// ── FEATURE 22: Villa manager saved order presets ─────────────
// ── VILLA PRESETS — complete rebuild ─────────────────────────
const VILLA_PRESETS_KEY = 'isla_villa_presets'

// Curated starter packs for common villa scenarios
const STARTER_PRESETS = [
  {
    id:'starter_changeover', name:'Changeover essentials', emoji:'🏡', colour:'rgba(43,122,139,0.2)', border:'rgba(43,122,139,0.35)',
    description:'Ice, water, beer and wine for arriving guests',
    tags:['ice','water_juice','beer_cider','wine'],
  },
  {
    id:'starter_pool_party', name:'Pool party pack', emoji:'🏊', colour:'rgba(196,104,58,0.15)', border:'rgba(196,104,58,0.3)',
    description:'Spirits, mixers, cold beers and ice for 10+',
    tags:['spirits','soft_drinks','beer_cider','ice'],
  },
  {
    id:'starter_sundowner', name:'Sundowner set', emoji:'🌅', colour:'rgba(200,168,75,0.12)', border:'rgba(200,168,75,0.28)',
    description:'Champagne, wine and nibbles for the terrace',
    tags:['champagne','wine','snacks'],
  },
  {
    id:'starter_morning', name:'Morning after', emoji:'🤕', colour:'rgba(90,107,58,0.15)', border:'rgba(90,107,58,0.3)',
    description:'Soft drinks, water and recovery essentials',
    tags:['soft_drinks','water_juice','snacks'],
  },
]

export function useVillaPresets() {
  const [presets, setPresets] = useState(() => {
    try { return JSON.parse(localStorage.getItem(VILLA_PRESETS_KEY) || '[]') } catch { return [] }
  })
  const save = useCallback((name, emoji, items) => {
    const preset = { id: Date.now(), name, emoji: emoji||'🏡', items, created_at: new Date().toISOString() }
    setPresets(prev => {
      const next = [...prev.filter(p=>p.name!==name), preset]
      try { localStorage.setItem(VILLA_PRESETS_KEY, JSON.stringify(next)) } catch {}
      return next
    })
    toast.success('Saved as "' + name + '" 🏡')
  }, [])
  const remove = useCallback((id) => {
    setPresets(prev => {
      const next = prev.filter(p=>p.id!==id)
      try { localStorage.setItem(VILLA_PRESETS_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])
  return { presets, save, remove }
}

// AI villa order builder
async function buildVillaOrder(prompt) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('No API key — add VITE_ANTHROPIC_API_KEY to Vercel')
  const productList = PRODUCTS.slice(0,60).map(p=>p.id+'|'+p.name+'|€'+p.price+'|cat:'+p.category).join('
')
  const system = 'You are Isla, an expert Ibiza villa concierge. Build a perfect drinks and supplies order for villa guests. Respond ONLY with valid JSON: {"title":"string","summary":"string","items":[{"product_id":"string","quantity":number,"reason":"string"}],"total_estimate":"string"}'
  const message = 'Build an Ibiza villa order for: '+prompt+'

Available products (id|name|price|category):
'+productList+'

Pick 6-12 items with realistic quantities. Only use product IDs from the list above.'
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method:'POST',
    headers:{ 'Content-Type':'application/json', 'anthropic-version':'2023-06-01', 'anthropic-dangerous-direct-browser-access':'true', 'x-api-key':apiKey },
    body: JSON.stringify({ model:'claude-haiku-4-5-20251001', max_tokens:800, system, messages:[{role:'user',content:message}] })
  })
  if (!resp.ok) { const e=await resp.text(); throw new Error('API '+resp.status+': '+e.slice(0,100)) }
  const data = await resp.json()
  const raw = data.content?.[0]?.text || ''
  return JSON.parse(raw.replace(/```json|```/g,'').trim())
}

export function VillaPresetsPanel({ onAddAll }) {
  const { presets, save, remove } = useVillaPresets()
  const { addItem } = useCartStore()
  const cart = useCartStore()
  const [tab, setTab] = useState('presets') // presets | starter | ai | build
  const [showSave, setShowSave] = useState(false)
  const [presetName, setPresetName] = useState('')
  const [presetEmoji, setPresetEmoji] = useState('🏡')
  // AI tab state
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState(null)
  const [aiError, setAiError] = useState('')
  // Build tab state
  const [buildItems, setBuildItems] = useState({})
  const [buildName, setBuildName] = useState('')

  const QUICK_PROMPTS = [
    '8 guests arriving Friday for a long weekend',
    '12 people, pool party Saturday afternoon',
    'Romantic couple stay, 3 nights',
    'Hen party group of 10, big night out',
    'Family with kids, 5 days',
    'Villa changeover, restock the basics',
  ]

  const EMOJIS = ['🏡','🌴','🏊','🌅','🎉','🥂','🍺','🎵','👑','🛥️']

  const addPreset = (preset, showToast=true) => {
    let count = 0
    preset.items.forEach(({ product, quantity }) => {
      const p = PRODUCTS.find(p=>p.id===product.id) || product
      if (p) for (let i=0;i<quantity;i++) { addItem(p); count++ }
    })
    if (showToast) toast.success(count+' items added 🛵', {duration:1800})
    onAddAll?.()
  }

  const addStarterPack = (pack) => {
    const items = PRODUCTS.filter(p => pack.tags.some(t => p.category===t)).slice(0,8)
    if (!items.length) { toast.error('No matching products'); return }
    items.forEach(p => addItem(p))
    toast.success(pack.name+' added to basket! 🌴', {duration:1800})
    onAddAll?.()
  }

  const saveCurrentCart = () => {
    if (!presetName.trim()) { toast.error('Enter a preset name'); return }
    if (!cart.items.length) { toast.error('Add items to basket first'); return }
    save(presetName.trim(), presetEmoji, cart.items.map(({product,quantity})=>({
      product:{id:product.id,name:product.name,emoji:product.emoji,price:product.price}, quantity
    })))
    setShowSave(false); setPresetName(''); setPresetEmoji('🏡')
  }

  const runAI = async (prompt) => {
    const p = prompt || aiPrompt
    if (!p.trim()) return
    setAiLoading(true); setAiResult(null); setAiError('')
    try {
      const result = await buildVillaOrder(p)
      setAiResult(result)
    } catch(err) {
      setAiError(err.message.includes('No API key') ? 'AI requires VITE_ANTHROPIC_API_KEY in Vercel settings.' : 'Could not generate right now. Try again.')
    }
    setAiLoading(false)
  }

  const addAiResult = () => {
    if (!aiResult?.items) return
    let count = 0
    aiResult.items.forEach(item => {
      const p = PRODUCTS.find(p=>p.id===item.product_id)
      if (p) for (let i=0;i<(item.quantity||1);i++) { addItem(p); count++ }
    })
    toast.success(count+' items added to basket 🛵', {duration:2000})
    onAddAll?.()
  }

  const saveAiResult = () => {
    if (!aiResult?.items) return
    const items = aiResult.items.map(item => {
      const p = PRODUCTS.find(p=>p.id===item.product_id)
      return p ? { product:{id:p.id,name:p.name,emoji:p.emoji,price:p.price}, quantity:item.quantity||1 } : null
    }).filter(Boolean)
    save(aiResult.title || 'AI preset', '🤖', items)
    toast.success('Saved as a preset!')
  }

  const getBuildTotal = () => Object.entries(buildItems).reduce((sum,[id,qty])=>{
    const p = PRODUCTS.find(p=>p.id===id); return sum+(p?p.price*qty:0)
  }, 0)

  const addBuildToBasket = () => {
    let count = 0
    Object.entries(buildItems).forEach(([id,qty])=>{
      const p = PRODUCTS.find(p=>p.id===id)
      if (p&&qty>0) for(let i=0;i<qty;i++){addItem(p);count++}
    })
    if (!count) { toast.error('Add some items first'); return }
    toast.success(count+' items added to basket! 🛵', {duration:2000})
    onAddAll?.()
  }

  const saveBuildPreset = () => {
    if (!buildName.trim()) { toast.error('Enter a preset name'); return }
    const items = Object.entries(buildItems).map(([id,qty])=>{
      const p = PRODUCTS.find(p=>p.id===id)
      return p && qty>0 ? { product:{id:p.id,name:p.name,emoji:p.emoji,price:p.price}, quantity:qty } : null
    }).filter(Boolean)
    if (!items.length) { toast.error('Add some items first'); return }
    save(buildName.trim(), '🏗️', items)
    setBuildItems({}); setBuildName('')
  }

  const TABS = [
    { id:'presets', label:'My presets', emoji:'📋' },
    { id:'starter', label:'Starter packs', emoji:'⭐' },
    { id:'ai',      label:'AI builder', emoji:'✨' },
    { id:'build',   label:'Build your own', emoji:'🏗️' },
  ]

  return (
    <div style={{ margin:'0 0 20px' }}>
      {/* Header */}
      <div style={{ padding:'18px 16px 14px', background:'linear-gradient(135deg,rgba(13,59,74,0.9),rgba(26,80,99,0.8))', borderBottom:'0.5px solid rgba(255,255,255,0.07)' }}>
        <div style={{ fontFamily:F.serif, fontSize:20, color:'white', marginBottom:2 }}>🏡 Villa presets</div>
        <div style={{ fontSize:12, color:C.muted }}>AI-powered orders, starter packs and saved favourites</div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', overflowX:'auto', scrollbarWidth:'none', padding:'0 16px', gap:6, background:'rgba(13,53,69,0.6)', borderBottom:'0.5px solid rgba(255,255,255,0.07)' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{ padding:'10px 14px', borderRadius:0, border:'none', borderBottom: tab===t.id?'2px solid #C4683A':'2px solid transparent', background:'none', cursor:'pointer', fontSize:12, fontFamily:F.sans, color:tab===t.id?'white':C.muted, fontWeight:tab===t.id?600:400, whiteSpace:'nowrap', flexShrink:0, transition:'all 0.15s' }}>
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding:'16px' }}>

        {/* ── MY PRESETS TAB ─────────────────────────────── */}
        {tab==='presets' && (
          <>
            <button onClick={()=>setShowSave(s=>!s)}
              style={{ width:'100%', padding:'11px', background:'rgba(196,104,58,0.12)', border:'0.5px solid rgba(196,104,58,0.3)', borderRadius:12, color:'#E8A070', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:F.sans, marginBottom:12, display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
              + Save current basket as preset
            </button>
            {showSave && (
              <div style={{ background:'rgba(255,255,255,0.05)', borderRadius:12, padding:'14px', marginBottom:14 }}>
                <div style={{ fontSize:12, color:C.muted, marginBottom:8 }}>Preset name</div>
                <input value={presetName} onChange={e=>setPresetName(e.target.value)}
                  placeholder='e.g. Casa Alba changeover'
                  onKeyDown={e=>e.key==='Enter'&&saveCurrentCart()}
                  style={{ width:'100%', padding:'10px 12px', background:'rgba(255,255,255,0.08)', border:'0.5px solid rgba(255,255,255,0.2)', borderRadius:10, color:'white', fontSize:13, fontFamily:F.sans, outline:'none', boxSizing:'border-box', marginBottom:10 }}/>
                <div style={{ fontSize:12, color:C.muted, marginBottom:8 }}>Choose an emoji</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:12 }}>
                  {EMOJIS.map(e=>(
                    <button key={e} onClick={()=>setPresetEmoji(e)}
                      style={{ width:36, height:36, borderRadius:8, border:'1.5px solid '+(presetEmoji===e?'#C4683A':'rgba(255,255,255,0.1)'), background:presetEmoji===e?'rgba(196,104,58,0.2)':'transparent', fontSize:18, cursor:'pointer' }}>
                      {e}
                    </button>
                  ))}
                </div>
                <button onClick={saveCurrentCart}
                  style={{ width:'100%', padding:'11px', background:'#C4683A', border:'none', borderRadius:10, color:'white', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:F.sans }}>
                  Save preset
                </button>
              </div>
            )}
            {presets.length === 0 ? (
              <div style={{ textAlign:'center', padding:'28px 0' }}>
                <div style={{ fontSize:40, marginBottom:12 }}>📋</div>
                <div style={{ fontFamily:F.serif, fontSize:18, color:'white', marginBottom:6 }}>No presets yet</div>
                <div style={{ fontSize:12, color:C.muted, lineHeight:1.6 }}>Build a basket, then save it here for one-tap reordering — perfect for repeat villa changeovers.</div>
              </div>
            ) : presets.map(preset => (
              <div key={preset.id} style={{ background:'rgba(255,255,255,0.06)', border:'0.5px solid rgba(255,255,255,0.1)', borderRadius:14, padding:'14px', marginBottom:10 }}>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
                  <div style={{ fontSize:28, flexShrink:0 }}>{preset.emoji||'🏡'}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:14, fontWeight:600, color:'white', fontFamily:F.sans }}>{preset.name}</div>
                    <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>
                      {preset.items.map(i=>i.product.emoji).join(' ')} · {preset.items.reduce((s,i)=>s+i.quantity,0)} items · €{preset.items.reduce((s,i)=>s+(i.product.price||0)*i.quantity,0).toFixed(2)}
                    </div>
                  </div>
                  <button onClick={()=>remove(preset.id)}
                    style={{ background:'none', border:'none', color:'rgba(255,255,255,0.3)', cursor:'pointer', fontSize:16, padding:0, flexShrink:0 }}>🗑</button>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={()=>addPreset(preset)}
                    style={{ flex:1, padding:'10px', background:'#C4683A', border:'none', borderRadius:10, color:'white', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:F.sans }}>
                    Add all to basket
                  </button>
                  <button onClick={()=>{
                    const total = preset.items.reduce((s,i)=>s+(i.product.price||0)*i.quantity,0)
                    const text = preset.emoji+' '+preset.name+' via Isla Drop 🌴 ('+preset.items.reduce((s,i)=>s+i.quantity,0)+' items, €'+total.toFixed(2)+')'
                    navigator.share ? navigator.share({title:'Villa order',text}) : (navigator.clipboard?.writeText(text),toast.success('Copied!'))
                  }}
                    style={{ padding:'10px 14px', background:'rgba(255,255,255,0.07)', border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:10, color:C.muted, fontSize:12, cursor:'pointer', fontFamily:F.sans }}>
                    Share
                  </button>
                </div>
              </div>
            ))}
          </>
        )}

        {/* ── STARTER PACKS TAB ──────────────────────────── */}
        {tab==='starter' && (
          <>
            <div style={{ fontSize:12, color:C.muted, marginBottom:14, lineHeight:1.6 }}>
              Ready-made packages curated for common Ibiza villa occasions. Tap any pack to add everything to your basket instantly.
            </div>
            {STARTER_PRESETS.map(pack => (
              <div key={pack.id} style={{ background:pack.colour, border:'0.5px solid '+pack.border, borderRadius:16, padding:'16px', marginBottom:12 }}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:12 }}>
                  <div style={{ fontSize:32, flexShrink:0 }}>{pack.emoji}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:F.serif, fontSize:17, color:'white', marginBottom:3 }}>{pack.name}</div>
                    <div style={{ fontSize:12, color:C.muted, lineHeight:1.5 }}>{pack.description}</div>
                  </div>
                </div>
                <div style={{ display:'flex', gap:7, flexWrap:'wrap', marginBottom:12 }}>
                  {PRODUCTS.filter(p=>pack.tags.some(t=>p.category===t)).slice(0,6).map(p=>(
                    <div key={p.id} style={{ background:'rgba(255,255,255,0.08)', borderRadius:20, padding:'3px 10px', fontSize:11, color:'rgba(255,255,255,0.7)', fontFamily:F.sans }}>
                      {p.emoji} {p.name.split(' ').slice(0,2).join(' ')}
                    </div>
                  ))}
                </div>
                <button onClick={()=>addStarterPack(pack)}
                  style={{ width:'100%', padding:'11px', background:'#C4683A', border:'none', borderRadius:12, color:'white', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:F.sans }}>
                  Add {pack.name} to basket →
                </button>
              </div>
            ))}
          </>
        )}

        {/* ── AI BUILDER TAB ─────────────────────────────── */}
        {tab==='ai' && (
          <>
            {!aiResult && !aiLoading && (
              <>
                <div style={{ background:'linear-gradient(135deg,rgba(196,104,58,0.12),rgba(43,122,139,0.12))', border:'0.5px solid rgba(196,104,58,0.25)', borderRadius:14, padding:'14px 16px', marginBottom:16 }}>
                  <div style={{ fontFamily:F.serif, fontSize:17, color:'white', marginBottom:4 }}>✨ AI Villa Order Builder</div>
                  <div style={{ fontSize:12, color:C.muted, lineHeight:1.6 }}>Tell Isla about your guests and occasion. She will build the perfect Ibiza villa order — right quantities, right products, no guessing.</div>
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:7, marginBottom:14 }}>
                  {QUICK_PROMPTS.map(p=>(
                    <button key={p} onClick={()=>runAI(p)}
                      style={{ padding:'7px 13px', background:'rgba(255,255,255,0.07)', border:'0.5px solid rgba(255,255,255,0.14)', borderRadius:20, fontSize:11, color:'rgba(255,255,255,0.75)', cursor:'pointer', fontFamily:F.sans, textAlign:'left' }}>
                      {p}
                    </button>
                  ))}
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <input value={aiPrompt} onChange={e=>setAiPrompt(e.target.value)}
                    onKeyDown={e=>e.key==='Enter'&&runAI()}
                    placeholder='Describe your guests and occasion...'
                    style={{ flex:1, padding:'12px 14px', background:'rgba(255,255,255,0.08)', border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:24, color:'white', fontSize:13, fontFamily:F.sans, outline:'none' }}/>
                  <button onClick={()=>runAI()} disabled={!aiPrompt.trim()}
                    style={{ width:44, height:44, background:aiPrompt.trim()?'#C4683A':'rgba(255,255,255,0.08)', border:'none', borderRadius:'50%', cursor:aiPrompt.trim()?'pointer':'default', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M22 2L11 13"/><path d="M22 2L15 22l-4-9-9-4 20-7z"/></svg>
                  </button>
                </div>
                {aiError && <div style={{ marginTop:12, fontSize:12, color:'rgba(240,149,149,0.8)', padding:'10px 12px', background:'rgba(240,149,149,0.08)', borderRadius:10 }}>{aiError}</div>}
              </>
            )}
            {aiLoading && (
              <div style={{ textAlign:'center', padding:'40px 0' }}>
                <div style={{ width:44, height:44, border:'3px solid rgba(255,255,255,0.12)', borderTopColor:'#C4683A', borderRadius:'50%', animation:'villaSpinAI 0.8s linear infinite', margin:'0 auto 16px' }}/>
                <div style={{ fontFamily:F.serif, fontSize:18, color:'white', marginBottom:6 }}>Isla is building your order...</div>
                <div style={{ fontSize:12, color:C.muted }}>Selecting the right products and quantities for your group</div>
                <style>{'@keyframes villaSpinAI{to{transform:rotate(360deg)}}'}</style>
              </div>
            )}
            {aiResult && !aiLoading && (
              <>
                <div style={{ background:'rgba(255,255,255,0.04)', borderRadius:14, padding:'14px', marginBottom:14 }}>
                  <div style={{ fontFamily:F.serif, fontSize:18, color:'white', marginBottom:4 }}>{aiResult.title}</div>
                  {aiResult.summary && <div style={{ fontSize:12, color:C.muted, lineHeight:1.6, marginBottom:12 }}>{aiResult.summary}</div>}
                  {(aiResult.items||[]).map((item,i)=>{
                    const p = PRODUCTS.find(p=>p.id===item.product_id)
                    if (!p) return null
                    return (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'0.5px solid rgba(255,255,255,0.06)' }}>
                        <span style={{ fontSize:20, flexShrink:0 }}>{p.emoji}</span>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:13, color:'white', fontFamily:F.sans }}>{p.name}</div>
                          {item.reason && <div style={{ fontSize:10, color:C.muted, marginTop:1 }}>{item.reason}</div>}
                        </div>
                        <div style={{ fontSize:11, color:C.muted, flexShrink:0 }}>×{item.quantity||1}</div>
                        <div style={{ fontSize:12, fontWeight:600, color:'#E8A070', flexShrink:0 }}>€{((p.price||0)*(item.quantity||1)).toFixed(2)}</div>
                      </div>
                    )
                  })}
                  {aiResult.total_estimate && (
                    <div style={{ display:'flex', justifyContent:'space-between', paddingTop:10, marginTop:4 }}>
                      <span style={{ fontSize:13, fontWeight:600, color:'white', fontFamily:F.sans }}>Estimated total</span>
                      <span style={{ fontSize:14, fontWeight:700, color:'#E8A070' }}>{aiResult.total_estimate}</span>
                    </div>
                  )}
                </div>
                <div style={{ display:'flex', gap:8, marginBottom:10 }}>
                  <button onClick={addAiResult}
                    style={{ flex:1, padding:'12px', background:'#C4683A', border:'none', borderRadius:12, color:'white', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:F.sans }}>
                    Add all to basket →
                  </button>
                  <button onClick={saveAiResult}
                    style={{ padding:'12px 14px', background:'rgba(200,168,75,0.15)', border:'0.5px solid rgba(200,168,75,0.3)', borderRadius:12, color:'#C8A84B', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:F.sans }}>
                    Save preset
                  </button>
                </div>
                <button onClick={()=>{setAiResult(null);setAiPrompt('')}}
                  style={{ width:'100%', padding:'10px', background:'transparent', border:'0.5px solid rgba(255,255,255,0.12)', borderRadius:10, color:C.muted, fontSize:12, cursor:'pointer', fontFamily:F.sans }}>
                  Build a different order
                </button>
              </>
            )}
          </>
        )}

        {/* ── BUILD YOUR OWN TAB ────────────────────────── */}
        {tab==='build' && (
          <>
            <div style={{ fontSize:12, color:C.muted, marginBottom:14, lineHeight:1.6 }}>
              Hand-pick products and quantities to build a custom preset. Great for regular villa managers who know exactly what they need.
            </div>
            {['beer_cider','wine','champagne','spirits','soft_drinks','water_juice','snacks','ice'].filter(cat=>{
              return PRODUCTS.some(p=>p.category===cat)
            }).map(cat=>{
              const catProducts = PRODUCTS.filter(p=>p.category===cat).slice(0,6)
              const catLabel = cat.replace(/_/g,' ').replace(/\w/g,l=>l.toUpperCase())
              return (
                <div key={cat} style={{ marginBottom:18 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.6)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:8, fontFamily:F.sans }}>
                    {catLabel}
                  </div>
                  {catProducts.map(p=>{
                    const qty = buildItems[p.id] || 0
                    return (
                      <div key={p.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'8px 0', borderBottom:'0.5px solid rgba(255,255,255,0.05)' }}>
                        <span style={{ fontSize:20, flexShrink:0 }}>{p.emoji}</span>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:12, color:'white', fontFamily:F.sans, lineHeight:1.3 }}>{p.name}</div>
                          <div style={{ fontSize:11, fontWeight:600, color:'#E8A070' }}>€{p.price.toFixed(2)}</div>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                          <button onClick={()=>setBuildItems(prev=>({...prev,[p.id]:Math.max(0,(prev[p.id]||0)-1)}))}
                            style={{ width:26,height:26,background:'rgba(255,255,255,0.1)',border:'none',borderRadius:'50%',color:'white',fontSize:14,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>−</button>
                          <span style={{ fontSize:13,fontWeight:600,color:'white',minWidth:20,textAlign:'center' }}>{qty}</span>
                          <button onClick={()=>setBuildItems(prev=>({...prev,[p.id]:(prev[p.id]||0)+1}))}
                            style={{ width:26,height:26,background:'#C4683A',border:'none',borderRadius:'50%',color:'white',fontSize:14,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>+</button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
            {/* Sticky footer */}
            <div style={{ position:'sticky', bottom:0, background:'rgba(13,53,69,0.97)', backdropFilter:'blur(10px)', borderTop:'0.5px solid rgba(255,255,255,0.1)', padding:'14px 0 0' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                <span style={{ fontSize:12, color:C.muted }}>
                  {Object.values(buildItems).reduce((s,q)=>s+q,0)} items selected
                </span>
                <span style={{ fontSize:14, fontWeight:700, color:'#E8A070' }}>€{getBuildTotal().toFixed(2)}</span>
              </div>
              <div style={{ display:'flex', gap:8, marginBottom:4 }}>
                <input value={buildName} onChange={e=>setBuildName(e.target.value)}
                  placeholder='Preset name (optional)'
                  style={{ flex:1, padding:'9px 12px', background:'rgba(255,255,255,0.08)', border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:10, color:'white', fontSize:12, fontFamily:F.sans, outline:'none' }}/>
                <button onClick={saveBuildPreset}
                  style={{ padding:'9px 14px', background:'rgba(200,168,75,0.2)', border:'0.5px solid rgba(200,168,75,0.3)', borderRadius:10, color:'#C8A84B', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:F.sans, whiteSpace:'nowrap' }}>
                  Save preset
                </button>
              </div>
              <button onClick={addBuildToBasket}
                style={{ width:'100%', padding:'13px', background:Object.values(buildItems).some(q=>q>0)?'#C4683A':'rgba(255,255,255,0.08)', border:'none', borderRadius:12, color:'white', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:F.sans }}>
                {Object.values(buildItems).some(q=>q>0) ? 'Add '+Object.values(buildItems).reduce((s,q)=>s+q,0)+' items to basket →' : 'Select items above'}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  )
}

// ── FEATURE 23: Multi-language receipt ───────────────────────
const RECEIPT_I18N = {
  en: { title:'Receipt', order:'Order', date:'Date', items:'Items', subtotal:'Subtotal', delivery:'Delivery', tip:'Driver tip', total:'Total', thanks:'Thank you for your order!' },
  es: { title:'Recibo', order:'Pedido', date:'Fecha', items:'Artículos', subtotal:'Subtotal', delivery:'Entrega', tip:'Propina', total:'Total', thanks:'¡Gracias por su pedido!' },
  de: { title:'Quittung', order:'Bestellung', date:'Datum', items:'Artikel', subtotal:'Zwischensumme', delivery:'Lieferung', tip:'Trinkgeld', total:'Gesamt', thanks:'Vielen Dank für Ihre Bestellung!' },
  fr: { title:'Reçu', order:'Commande', date:'Date', items:'Articles', subtotal:'Sous-total', delivery:'Livraison', tip:'Pourboire', total:'Total', thanks:'Merci pour votre commande!' },
  it: { title:'Ricevuta', order:'Ordine', date:'Data', items:'Articoli', subtotal:'Subtotale', delivery:'Consegna', tip:'Mancia', total:'Totale', thanks:'Grazie per il tuo ordine!' },
  nl: { title:'Bon', order:'Bestelling', date:'Datum', items:'Artikelen', subtotal:'Subtotaal', delivery:'Bezorging', tip:'Fooi', total:'Totaal', thanks:'Bedankt voor uw bestelling!' },
  sv: { title:'Kvitto', order:'Order', date:'Datum', items:'Artiklar', subtotal:'Delsumma', delivery:'Leverans', tip:'Dricks', total:'Totalt', thanks:'Tack för din beställning!' },
}

export function generateLocalizedReceipt(order, lang='en') {
  const i18n = RECEIPT_I18N[lang] || RECEIPT_I18N.en
  const lines = [
    '=== ISLA DROP — ' + i18n.title.toUpperCase() + ' ===',
    i18n.order + ': #' + order.order_number,
    i18n.date + ': ' + new Date(order.created_at).toLocaleDateString(lang+'-'+lang.toUpperCase(), { day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' }),
    '',
    i18n.items + ':',
    ...(order.order_items||[]).map(i => '  ' + (i.products?.emoji||'📦') + ' ' + (i.products?.name||'Item') + ' × ' + i.quantity + '  €' + (i.price*i.quantity).toFixed(2)),
    '',
    i18n.subtotal + ': €' + (order.subtotal||0).toFixed(2),
    i18n.delivery + ': €3.50',
    order.tip_amount ? i18n.tip + ': €' + Number(order.tip_amount).toFixed(2) : null,
    '─────────────────────',
    i18n.total + ': €' + (order.total||0).toFixed(2),
    '',
    i18n.thanks,
    'www.isladrop.net · Ibiza 🌴',
  ].filter(Boolean).join('\n')
  return lines
}

// ── FEATURE 24: Realtime driver location via Supabase ─────────
export function useRealtimeDriverLocation(driverId, enabled=true) {
  const [location, setLocation] = useState(null)
  useEffect(() => {
    if (!driverId || !enabled) return
    let channel
    import('../../lib/supabase').then(({ supabase }) => {
      // Subscribe to realtime changes on driver_locations table
      channel = supabase.channel('driver-location-' + driverId)
        .on('postgres_changes', {
          event:'*', schema:'public', table:'driver_locations',
          filter:'driver_id=eq.' + driverId
        }, payload => {
          const row = payload.new
          if (row?.lat && row?.lng) setLocation({ lat: row.lat, lng: row.lng, updated_at: row.updated_at })
        })
        .subscribe()
      // Also do an initial fetch
      supabase.from('driver_locations').select('lat,lng,updated_at').eq('driver_id', driverId).single()
        .then(({ data }) => { if (data) setLocation(data) }).catch(()=>{})
    }).catch(()=>{})
    return () => { if (channel) channel.unsubscribe() }
  }, [driverId, enabled])
  return location
}

// ── FEATURE 25: DOB age gate ──────────────────────────────────
export function DOBAgeGate({ onVerified, onClose }) {
  const [dob, setDob] = useState('')
  const [error, setError] = useState('')

  const verify = () => {
    if (!dob) { setError('Please enter your date of birth'); return }
    const age = (Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000)
    if (age < 18) {
      setError('You must be 18 or over to purchase age-restricted items')
      return
    }
    // Store for session
    try { sessionStorage.setItem('isla_age_verified', '1'); sessionStorage.setItem('isla_dob', dob) } catch {}
    onVerified()
  }

  const maxDate = new Date()
  maxDate.setFullYear(maxDate.getFullYear() - 18)

  return (
    <div style={{ padding:'8px 0 16px' }}>
      <div style={{ fontSize:40, textAlign:'center', marginBottom:12 }}>🆔</div>
      <div style={{ fontFamily:F.serif, fontSize:22, color:'#2A2318', textAlign:'center', marginBottom:6 }}>Age verification</div>
      <div style={{ fontSize:13, color:'#7A6E60', textAlign:'center', lineHeight:1.6, marginBottom:20 }}>
        Your basket contains age-restricted items. Please confirm your date of birth. Our rider will also verify ID at the door.
      </div>
      <div style={{ fontSize:12, color:'#7A6E60', marginBottom:8 }}>Date of birth</div>
      <input type="date" value={dob} onChange={e=>{setDob(e.target.value);setError('')}}
        max={maxDate.toISOString().split('T')[0]}
        style={{ width:'100%', padding:'14px 16px', border:'1px solid rgba(42,35,24,0.2)', borderRadius:12, fontSize:15, fontFamily:F.sans, outline:'none', boxSizing:'border-box', marginBottom:error?8:16, colorScheme:'light' }}/>
      {error && <div style={{ fontSize:12, color:'#C43A3A', marginBottom:12, padding:'8px 12px', background:'rgba(196,58,58,0.08)', borderRadius:8 }}>{error}</div>}
      <div style={{ fontSize:11, color:'#7A6E60', marginBottom:16, lineHeight:1.5 }}>
        🔒 Your date of birth is used only for age verification and is not stored against your account.
      </div>
      <button onClick={verify}
        style={{ width:'100%', padding:'15px', background:'#0D3B4A', color:'white', border:'none', borderRadius:14, fontFamily:F.sans, fontSize:15, fontWeight:600, cursor:'pointer', marginBottom:10 }}>
        Confirm &amp; continue
      </button>
      <button onClick={onClose}
        style={{ width:'100%', padding:'13px', background:'transparent', border:'1px solid rgba(42,35,24,0.15)', borderRadius:12, fontFamily:F.sans, fontSize:14, color:'#7A6E60', cursor:'pointer' }}>
        Cancel
      </button>
    </div>
  )
}
