// ================================================================
// Isla Drop — CustomerFeatures_16.jsx
// Features 1-16: Confirmation, CategoryNav, Badges, SearchHistory,
//   LastOrder, Upsell, AddressValidation, ClockETA, EmailConfirm,
//   ApplePay/GooglePay, StaffPicks, TimeGreeting, AppRating,
//   SeasonalBanner, ClubPresets, BoatMode
// ================================================================
import { useState, useEffect, useRef, useCallback } from 'react'
import { useCartStore, useAuthStore } from '../../lib/store'
import { supabase } from '../../lib/supabase'
import { PRODUCTS, CATEGORIES, BEST_SELLERS } from '../../lib/products'
import toast from 'react-hot-toast'

const F = { serif:'DM Serif Display,serif', sans:'DM Sans,sans-serif' }
const C = {
  bg:'#0D3545', accent:'#C4683A', green:'#7EE8A2', gold:'#C8A84B',
  surface:'rgba(255,255,255,0.07)', border:'rgba(255,255,255,0.1)',
  muted:'rgba(255,255,255,0.45)', white:'white',
}

// ── FEATURE 1: Order Confirmation Celebration ─────────────────
export function OrderConfirmationScreen({ order, onDone }) {
  const [visible, setVisible] = useState(false)
  const [confetti, setConfetti] = useState([])

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    const items = Array.from({ length: 28 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.8,
      dur: 1.5 + Math.random() * 1.5,
      color: ['#C4683A','#C8A84B','#7EE8A2','#E8A070','#7EE8C8','white'][Math.floor(Math.random()*6)],
      size: 6 + Math.random() * 8,
      shape: Math.random() > 0.5 ? 'circle' : 'rect',
    }))
    setConfetti(items)
  }, [])

  // Clock arrival time
  const now = new Date()
  now.setMinutes(now.getMinutes() + (order?.estimated_minutes || 18))
  const arrivalTime = now.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' })

  return (
    <div style={{ position:'fixed', inset:0, zIndex:700, background:'linear-gradient(170deg,#0A2A38,#0D3545)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
      {/* Confetti */}
      <style>{`
        @keyframes fall { 0%{transform:translateY(-20px) rotate(0deg);opacity:1} 100%{transform:translateY(110vh) rotate(720deg);opacity:0} }
      `}</style>
      {confetti.map(c => (
        <div key={c.id} style={{
          position:'absolute', top:'-10px', left:c.x+'%',
          width:c.size, height:c.size,
          borderRadius:c.shape==='circle'?'50%':'2px',
          background:c.color,
          animation:'fall '+c.dur+'s '+c.delay+'s ease-in forwards',
          pointerEvents:'none',
        }}/>
      ))}

      <div style={{ textAlign:'center', padding:'0 32px', opacity:visible?1:0, transform:visible?'scale(1)':'scale(0.8)', transition:'all 0.5s cubic-bezier(0.34,1.56,0.64,1)', zIndex:1 }}>
        <div style={{ fontSize:72, marginBottom:16 }}>🎉</div>
        <div style={{ fontFamily:F.serif, fontSize:32, color:'white', marginBottom:8, lineHeight:1.2 }}>Order placed!</div>
        <div style={{ fontSize:16, color:'rgba(255,255,255,0.6)', marginBottom:32 }}>
          Order #{order?.order_number || '---'}
        </div>

        {/* ETA clock card */}
        <div style={{ background:'rgba(255,255,255,0.1)', border:'0.5px solid rgba(255,255,255,0.2)', borderRadius:20, padding:'20px 28px', marginBottom:28, display:'inline-block' }}>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', marginBottom:6, textTransform:'uppercase', letterSpacing:'1px' }}>Estimated arrival</div>
          <div style={{ fontFamily:'monospace', fontSize:40, fontWeight:700, color:'white', letterSpacing:2 }}>{arrivalTime}</div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginTop:4 }}>in about {order?.estimated_minutes || 18} minutes</div>
        </div>

        <div style={{ fontSize:13, color:'rgba(255,255,255,0.5)', marginBottom:32 }}>
          {order?.delivery_address || 'Your delivery is on its way 🛵'}
        </div>

        <button onClick={onDone}
          style={{ padding:'16px 48px', background:'#C4683A', border:'none', borderRadius:16, color:'white', fontSize:16, fontWeight:600, cursor:'pointer', fontFamily:F.sans, boxShadow:'0 8px 32px rgba(196,104,58,0.5)', display:'block', width:'100%', maxWidth:320, margin:'0 auto' }}>
          Track my order →
        </button>
      </div>
    </div>
  )
}

// ── FEATURE 2: Category Quick-Scroll Nav Bar ──────────────────
export function CategoryNavBar({ onCategorySelect }) {
  const scrollRef = useRef(null)
  const NAV = CATEGORIES.slice(0, 12).map(c => ({ key: c.key, emoji: c.emoji, label: c.label }))

  return (
    <div style={{ background:'rgba(13,59,74,0.98)', borderBottom:'0.5px solid rgba(43,122,139,0.2)', paddingBottom:2 }}>
      <div ref={scrollRef} style={{ display:'flex', gap:6, overflowX:'auto', scrollbarWidth:'none', padding:'8px 16px 6px' }}>
        {NAV.map(cat => (
          <button key={cat.key} onClick={() => onCategorySelect(cat.key)}
            style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:'6px 10px', background:'rgba(255,255,255,0.07)', border:'0.5px solid rgba(255,255,255,0.1)', borderRadius:12, cursor:'pointer', flexShrink:0, minWidth:52, transition:'all 0.15s' }}
            onTouchStart={e=>e.currentTarget.style.background='rgba(196,104,58,0.2)'}
            onTouchEnd={e=>e.currentTarget.style.background='rgba(255,255,255,0.07)'}>
            <span style={{ fontSize:18 }}>{cat.emoji}</span>
            <span style={{ fontSize:9, color:'rgba(255,255,255,0.6)', fontFamily:F.sans, whiteSpace:'nowrap', maxWidth:52, overflow:'hidden', textOverflow:'ellipsis' }}>{cat.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── FEATURE 3: Product badges helper ─────────────────────────
// Call getProductBadge(product) to get a badge config or null
export function getProductBadge(product) {
  if (!product) return null
  if (product.is_new) return { text:'NEW', bg:'rgba(43,122,139,0.9)', color:'white' }
  if (product.sale_price && product.sale_price < product.price) {
    const pct = Math.round((1 - product.sale_price/product.price)*100)
    return { text:'-'+pct+'%', bg:'rgba(196,104,58,0.9)', color:'white' }
  }
  if (product.stock_quantity != null && product.stock_quantity <= 5 && product.stock_quantity > 0) {
    return { text:'Only '+product.stock_quantity+' left', bg:'rgba(240,100,100,0.85)', color:'white' }
  }
  if (product.stock_quantity === 0) return { text:'Sold out', bg:'rgba(80,80,80,0.9)', color:'white' }
  if (product.popular) return { text:'Bestseller', bg:'rgba(200,168,75,0.85)', color:'white' }
  return null
}

export function ProductBadge({ product, style={} }) {
  const badge = getProductBadge(product)
  if (!badge) return null
  return (
    <div style={{ position:'absolute', bottom:6, left:6, background:badge.bg, color:badge.color, fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:6, fontFamily:F.sans, letterSpacing:'0.3px', ...style }}>
      {badge.text}
    </div>
  )
}

// ── FEATURE 4: Search history + suggestions ──────────────────
const SH_KEY = 'isla_search_history'
export function getSearchHistory() {
  try { return JSON.parse(localStorage.getItem(SH_KEY) || '[]') } catch { return [] }
}
export function addSearchHistory(q) {
  if (!q || q.length < 2) return
  try {
    const prev = getSearchHistory()
    const next = [q, ...prev.filter(s => s !== q)].slice(0, 8)
    localStorage.setItem(SH_KEY, JSON.stringify(next))
  } catch {}
}
export function clearSearchHistory() {
  try { localStorage.removeItem(SH_KEY) } catch {}
}

export function SearchHistoryPanel({ onSelect, onClear }) {
  const history = getSearchHistory()
  if (history.length === 0) return null
  return (
    <div style={{ padding:'0 16px 8px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
        <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.5px', fontFamily:F.sans }}>Recent searches</div>
        <button onClick={onClear} style={{ fontSize:11, color:'rgba(255,255,255,0.4)', background:'none', border:'none', cursor:'pointer', fontFamily:F.sans }}>Clear all</button>
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
        {history.map(s => (
          <button key={s} onClick={() => onSelect(s)}
            style={{ padding:'6px 14px', background:'rgba(255,255,255,0.08)', border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:20, color:'rgba(255,255,255,0.7)', fontSize:12, cursor:'pointer', fontFamily:F.sans, display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ opacity:0.5 }}>🕐</span> {s}
          </button>
        ))}
      </div>
    </div>
  )
}

export function SearchSuggestions({ query }) {
  if (!query || query.length < 2) return null
  const suggestions = PRODUCTS
    .filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 5)
    .map(p => ({ type:'product', text:p.name, emoji:p.emoji, price:p.price, product:p }))
  const catSuggestions = CATEGORIES
    .filter(c => c.label.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 2)
    .map(c => ({ type:'category', text:c.label, emoji:c.emoji, key:c.key }))

  const all = [...catSuggestions, ...suggestions].slice(0, 6)
  if (all.length === 0) return null
  const { addItem } = useCartStore()

  return (
    <div style={{ background:'rgba(13,59,74,0.99)', borderBottom:'0.5px solid rgba(43,122,139,0.2)' }}>
      {all.map((s, i) => (
        <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 16px', borderBottom:'0.5px solid rgba(255,255,255,0.05)', cursor:'pointer' }}
          onClick={() => { if (s.type === 'product') { addItem(s.product); toast.success(s.emoji+' Added!', {duration:800}) } }}>
          <span style={{ fontSize:18, flexShrink:0 }}>{s.emoji}</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, color:'white', fontFamily:F.sans }}>{s.text}</div>
            <div style={{ fontSize:10, color:C.muted }}>{s.type === 'category' ? 'Category' : '€'+s.price?.toFixed(2)}</div>
          </div>
          {s.type === 'product' && (
            <button onClick={e=>{e.stopPropagation();addItem(s.product);toast.success(s.emoji+' Added!',{duration:800})}}
              style={{ width:26,height:26,background:'#C4683A',border:'none',borderRadius:'50%',color:'white',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0 }}>+</button>
          )}
          {s.type === 'category' && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
          )}
        </div>
      ))}
    </div>
  )
}

// ── FEATURE 5: Last order shortcut ───────────────────────────
export function LastOrderShortcut({ onReorder }) {
  const { user } = useAuthStore()
  const { addItem } = useCartStore()
  const [lastOrder, setLastOrder] = useState(null)

  useEffect(() => {
    if (!user) return
    supabase.from('orders').select('*,order_items(*)')
      .eq('customer_id', user.id).eq('status', 'delivered')
      .order('created_at', { ascending: false }).limit(1).single()
      .then(({ data }) => { if (data) setLastOrder(data) }).catch(() => {})
  }, [user])

  if (!lastOrder) return null

  const items = lastOrder.order_items || []
  const preview = items.slice(0, 3)

  const reorder = () => {
    items.forEach(item => {
      const p = PRODUCTS.find(p => p.id === item.product_id)
      if (p) { for (let i = 0; i < item.quantity; i++) addItem(p) }
    })
    navigator.vibrate && navigator.vibrate([20, 50, 20])
    toast.success('Items added to basket!', { duration: 2000 })
    onReorder?.()
  }

  return (
    <div style={{ margin:'0 16px 20px', background:'linear-gradient(135deg,rgba(43,122,139,0.2),rgba(13,53,69,0.3))', border:'0.5px solid rgba(43,122,139,0.35)', borderRadius:16, padding:'14px 16px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
        <div>
          <div style={{ fontSize:12, color:C.muted, marginBottom:3 }}>Last order · {new Date(lastOrder.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</div>
          <div style={{ display:'flex', gap:6 }}>
            {preview.map((item, i) => (
              <div key={i} style={{ fontSize:11, color:'rgba(255,255,255,0.7)', background:'rgba(255,255,255,0.08)', padding:'3px 9px', borderRadius:99 }}>
                {item.product_name || 'Item'} ×{item.quantity}
              </div>
            ))}
            {items.length > 3 && <div style={{ fontSize:11, color:C.muted, padding:'3px 6px' }}>+{items.length-3} more</div>}
          </div>
        </div>
        <button onClick={reorder}
          style={{ padding:'9px 16px', background:'#C4683A', border:'none', borderRadius:10, color:'white', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:F.sans, flexShrink:0, marginLeft:12 }}>
          🔄 Re-order
        </button>
      </div>
      <div style={{ fontSize:11, color:C.muted }}>€{lastOrder.total?.toFixed(2) || '0.00'} total</div>
    </div>
  )
}

// ── FEATURE 6: Upsell suggestions in basket ──────────────────
export function BasketUpsell({ cartItems }) {
  const { addItem } = useCartStore()

  // Smart upsell logic: spirits → suggest mixers + ice; champagne → suggest ice + garnish
  const suggestions = (() => {
    const cats = cartItems.map(i => i.product?.category || '')
    const ids = cartItems.map(i => i.product?.id || '')
    let suggest = []

    if (cats.includes('spirits') || cats.includes('beer_cider')) {
      suggest = PRODUCTS.filter(p =>
        (p.category === 'soft_drinks' || p.category === 'ice') &&
        !ids.includes(p.id) && p.popular
      ).slice(0, 3)
    } else if (cats.includes('champagne') || cats.includes('wine')) {
      suggest = PRODUCTS.filter(p =>
        (p.category === 'ice' || p.category === 'fresh') &&
        !ids.includes(p.id)
      ).slice(0, 3)
    } else if (cats.includes('snacks')) {
      suggest = PRODUCTS.filter(p =>
        p.category === 'soft_drinks' && !ids.includes(p.id)
      ).slice(0, 2)
    }

    if (suggest.length === 0) {
      suggest = BEST_SELLERS.filter(p => !ids.includes(p.id)).slice(0, 3)
    }
    return suggest
  })()

  if (suggestions.length === 0) return null

  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ fontSize:12, color:C.muted, marginBottom:10, fontFamily:F.sans }}>
        🎯 Complete your order
      </div>
      <div style={{ display:'flex', gap:8, overflowX:'auto', scrollbarWidth:'none', paddingBottom:2 }}>
        {suggestions.map(p => (
          <div key={p.id} style={{ background:C.surface, border:'0.5px solid '+C.border, borderRadius:12, padding:'10px', minWidth:110, flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
            <div style={{ fontSize:28 }}>{p.emoji}</div>
            <div style={{ fontSize:10, color:'white', textAlign:'center', lineHeight:1.3, fontFamily:F.sans }}>{p.name}</div>
            <div style={{ fontSize:12, fontWeight:700, color:'#E8A070' }}>€{p.price.toFixed(2)}</div>
            <button onClick={()=>{ addItem(p); navigator.vibrate&&navigator.vibrate(25); toast.success(p.emoji+' Added!',{duration:800}) }}
              style={{ width:'100%', padding:'6px 0', background:'#C4683A', border:'none', borderRadius:8, color:'white', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:F.sans }}>
              Add
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── FEATURE 7: Address validation helper ─────────────────────
// Used in handleCheckoutStart — exported as a util function
export function hasValidAddress(cart) {
  const addr = cart.deliveryAddress || ''
  return addr.trim().length > 3
}

export function NoAddressWarning({ onSetAddress }) {
  return (
    <div style={{ background:'rgba(240,149,149,0.12)', border:'0.5px solid rgba(240,149,149,0.35)', borderRadius:12, padding:'14px 16px', marginBottom:14, display:'flex', alignItems:'center', gap:12 }}>
      <span style={{ fontSize:24, flexShrink:0 }}>📍</span>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:13, fontWeight:600, color:'#F09595', marginBottom:2 }}>No delivery address set</div>
        <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)' }}>Set your location before checkout</div>
      </div>
      <button onClick={onSetAddress}
        style={{ padding:'8px 14px', background:'rgba(240,149,149,0.2)', border:'0.5px solid rgba(240,149,149,0.4)', borderRadius:10, color:'#F09595', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:F.sans, flexShrink:0 }}>
        Set
      </button>
    </div>
  )
}

// ── FEATURE 8: Arrival as clock time ─────────────────────────
export function useArrivalTime(estimatedMins) {
  const [clockTime, setClockTime] = useState('')
  useEffect(() => {
    if (!estimatedMins) return
    const updateTime = () => {
      const t = new Date()
      t.setMinutes(t.getMinutes() + estimatedMins)
      setClockTime(t.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' }))
    }
    updateTime()
    const id = setInterval(updateTime, 30000)
    return () => clearInterval(id)
  }, [estimatedMins])
  return clockTime
}

// ── FEATURE 10: Apple Pay / Google Pay button ─────────────────
// Stripe handles this automatically via PaymentRequestButton
// This component wraps Stripe's payment request API
export function NativePayButton({ total, onSuccess }) {
  const [paymentRequest, setPaymentRequest] = useState(null)
  const [canPay, setCanPay] = useState(false)

  useEffect(() => {
    // Only attempt if Stripe is loaded
    if (typeof window === 'undefined' || !window.Stripe) return
    try {
      const stripe = window.Stripe(import.meta.env?.VITE_STRIPE_PK || '')
      const pr = stripe.paymentRequest({
        country: 'ES', currency: 'eur',
        total: { label: 'Isla Drop order', amount: Math.round(total * 100) },
        requestPayerName: true, requestPayerEmail: true,
      })
      pr.canMakePayment().then(result => {
        if (result) { setPaymentRequest(pr); setCanPay(true) }
      })
      pr.on('paymentmethod', async (ev) => {
        ev.complete('success')
        onSuccess && onSuccess(ev.paymentMethod.id)
      })
    } catch {}
  }, [total])

  if (!canPay) return null

  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
        <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.1)' }}/>
        <span style={{ fontSize:11, color:C.muted, fontFamily:F.sans }}>or pay instantly</span>
        <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.1)' }}/>
      </div>
      <button onClick={() => paymentRequest?.show()}
        style={{ width:'100%', padding:'16px', background:'black', border:'none', borderRadius:14, color:'white', fontSize:15, fontWeight:600, cursor:'pointer', fontFamily:F.sans, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
        <span style={{ fontSize:20 }}>🍎</span> Apple Pay / <span style={{ fontSize:18 }}>G</span> Google Pay
      </button>
    </div>
  )
}

// ── FEATURE 11: Staff picks row ───────────────────────────────
export function StaffPicksRow({ onDetail }) {
  const [picks, setPicks] = useState([])
  const { addItem } = useCartStore()

  useEffect(() => {
    supabase.from('staff_picks').select('product_id,note').eq('active', true).order('sort_order')
      .then(({ data }) => {
        if (!data || data.length === 0) {
          // Fallback: use curated popular products
          setPicks(BEST_SELLERS.slice(0,6).map(p=>({...p,note:'Isla team pick'})))
          return
        }
        const products = data.map(d => {
          const p = PRODUCTS.find(p => p.id === d.product_id)
          return p ? { ...p, note: d.note } : null
        }).filter(Boolean)
        setPicks(products.length > 0 ? products : BEST_SELLERS.slice(0,6).map(p=>({...p,note:'Isla team pick'})))
      }).catch(() => {
        setPicks(BEST_SELLERS.slice(0,6).map(p=>({...p,note:'Isla team pick'})))
      })
  }, [])

  if (picks.length === 0) return null

  return (
    <div style={{ marginBottom:22 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0 16px', marginBottom:12 }}>
        <div style={{ fontFamily:F.serif, fontSize:20, color:'white', display:'flex', alignItems:'center', gap:8 }}>
          <span>🌴</span> Isla recommends
        </div>
      </div>
      <div style={{ display:'flex', gap:10, overflowX:'auto', padding:'0 16px 4px', scrollbarWidth:'none' }}>
        {picks.map(p => (
          <div key={p.id} onClick={() => onDetail && onDetail(p)}
            style={{ background:'rgba(255,255,255,0.92)', borderRadius:14, overflow:'hidden', minWidth:130, maxWidth:130, flexShrink:0, cursor:'pointer', position:'relative' }}>
            <div style={{ position:'relative' }}>
              <div style={{ height:100, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(255,255,255,0.5)', fontSize:36 }}>{p.emoji}</div>
              <div style={{ position:'absolute', top:5, left:5, background:C.accent, color:'white', fontSize:8, fontWeight:700, padding:'2px 6px', borderRadius:6 }}>PICK</div>
            </div>
            <div style={{ padding:'8px 10px 10px' }}>
              <div style={{ fontSize:10, color:'#2A2318', lineHeight:1.3, marginBottom:3 }}>{p.name}</div>
              {p.note && <div style={{ fontSize:9, color:'#7A6E60', marginBottom:4, fontStyle:'italic' }}>{p.note}</div>}
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

// ── FEATURE 12: Time-aware greeting ──────────────────────────
export function useTimeGreeting() {
  const hour = new Date().getHours()
  // Early morning / sunrise
  if (hour >= 5 && hour < 8)  return { greeting:'Early riser 🌅', vibe:'Good morning, Ibiza', emoji:'🌅', categories:['water_juice','soft_drinks','snacks'] }
  if (hour >= 8 && hour < 11) return { greeting:'Good morning ☀️', vibe:'Start the day right', emoji:'☀️', categories:['water_juice','soft_drinks','snacks'] }
  if (hour >= 11 && hour < 15) return { greeting:'Afternoon plans? 🌴', vibe:'Pool and beach vibes', emoji:'🏖️', categories:['beer_cider','soft_drinks','snacks'] }
  if (hour >= 15 && hour < 19) return { greeting:'Sundowner time 🌅', vibe:'Golden hour calls for rosé', emoji:'🥂', categories:['wine','champagne','beer_cider'] }
  if (hour >= 19 && hour < 22) return { greeting:'Evening is yours 🌙', vibe:'Pre-drinks sorted in 18 min', emoji:'🍹', categories:['spirits','champagne','soft_drinks'] }
  if (hour >= 22 || hour < 1)  return { greeting:'Night is young 🎉', vibe:'Keep the energy going', emoji:'✨', categories:['spirits','beer_cider','soft_drinks'] }
  if (hour >= 1 && hour < 3)   return { greeting:'Still going? 🎵', vibe:'Club hours — we never sleep', emoji:'🎵', categories:['spirits','soft_drinks','water_juice'] }
  // 3am-5am — late night/early morning recovery
  return { greeting:'Almost sunrise 🌙', vibe:'Late night essentials', emoji:'🌙', categories:['water_juice','snacks','soft_drinks'] }
}

export function TimeGreetingBanner({ greeting, vibe }) {
  const h = new Date().getHours()
  // Dynamic hero info based on time of day
  const hero = h >= 6 && h < 11  ? { emoji:'☀️', mood:'Good morning, Ibiza', sub:'Fresh start — grab your morning essentials' }
             : h >= 11 && h < 16 ? { emoji:'🌊', mood:'Afternoon on the island', sub:'Beach, pool, boat — we deliver everywhere' }
             : h >= 16 && h < 20 ? { emoji:'🌅', mood:'Golden hour in Ibiza', sub:'Sundowner time — rosé, ice, snacks sorted' }
             : h >= 20 && h < 23 ? { emoji:'🌙', mood:'Night just getting started', sub:'Pre-drinks, spirits, champagne — delivered now' }
             : { emoji:'⭐', mood:'Ibiza never sleeps', sub:'Late night delivery — still open' }
  return (
    <div style={{ padding:'4px 16px 12px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:2 }}>
        <span style={{ fontSize:20 }}>{hero.emoji}</span>
        <div style={{ fontFamily:F.serif, fontSize:21, color:'white', lineHeight:1.2 }}>{greeting || hero.mood}</div>
      </div>
      <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', marginLeft:28 }}>{vibe || hero.sub}</div>
    </div>
  )
}

// ── FEATURE 13: App rating prompt ────────────────────────────
const RATING_KEY = 'isla_rating_shown'
export function useAppRatingPrompt() {
  const { user } = useAuthStore()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!user || localStorage.getItem(RATING_KEY)) return
    supabase.from('orders').select('id', { count:'exact', head:true })
      .eq('customer_id', user.id).eq('status', 'delivered')
      .then(({ count }) => {
        if (count && count >= 3) setShow(true)
      }).catch(() => {})
  }, [user])

  const dismiss = () => {
    localStorage.setItem(RATING_KEY, 'true')
    setShow(false)
  }

  return { show, dismiss }
}

export function AppRatingPrompt({ onDismiss }) {
  return (
    <div style={{ position:'fixed', bottom:84, left:16, right:16, maxWidth:448, margin:'0 auto', background:'linear-gradient(135deg,#0D3B4A,#1A5263)', border:'0.5px solid rgba(200,168,75,0.4)', borderRadius:18, padding:'18px 20px', zIndex:250, boxShadow:'0 8px 40px rgba(0,0,0,0.4)', display:'flex', gap:14, alignItems:'flex-start' }}>
      <div style={{ fontSize:36, flexShrink:0 }}>⭐</div>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:15, fontWeight:700, color:'white', fontFamily:F.sans, marginBottom:4 }}>Enjoying Isla Drop?</div>
        <div style={{ fontSize:12, color:C.muted, marginBottom:12 }}>Leave us a review — it really helps!</div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={()=>{ window.open('https://apps.apple.com', '_blank'); onDismiss() }}
            style={{ flex:1, padding:'9px', background:'#C4683A', border:'none', borderRadius:10, color:'white', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:F.sans }}>
            Rate us ⭐
          </button>
          <button onClick={onDismiss}
            style={{ padding:'9px 14px', background:'rgba(255,255,255,0.08)', border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:10, color:C.muted, fontSize:12, cursor:'pointer', fontFamily:F.sans }}>
            Not now
          </button>
        </div>
      </div>
    </div>
  )
}

// ── FEATURE 14: Seasonal homepage banner ──────────────────────
export function SeasonalBanner() {
  const [banner, setBanner] = useState(null)

  useEffect(() => {
    supabase.from('seasonal_banners').select('*').eq('active', true)
      .gte('ends_at', new Date().toISOString()).order('created_at', {ascending:false}).limit(1).single()
      .then(({ data }) => { if (data) setBanner(data) })
      .catch(() => {})
  }, [])

  if (!banner) return null

  return (
    <div style={{ margin:'0 16px 16px', borderRadius:16, overflow:'hidden', position:'relative', minHeight:80 }}>
      {banner.image_url ? (
        <img src={banner.image_url} alt={banner.title} style={{ width:'100%', height:100, objectFit:'cover', display:'block' }} />
      ) : (
        <div style={{ height:90, background:banner.gradient || 'linear-gradient(135deg,rgba(196,104,58,0.4),rgba(200,168,75,0.3))', display:'flex', alignItems:'center', padding:'0 20px', gap:14 }}>
          <span style={{ fontSize:36 }}>{banner.emoji || '🌴'}</span>
          <div>
            <div style={{ fontFamily:F.serif, fontSize:18, color:'white', lineHeight:1.2 }}>{banner.title}</div>
            {banner.subtitle && <div style={{ fontSize:12, color:'rgba(255,255,255,0.6)', marginTop:3 }}>{banner.subtitle}</div>}
          </div>
        </div>
      )}
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(to right, rgba(0,0,0,0.3) 0%, transparent 60%)', borderRadius:16 }}/>
    </div>
  )
}

// ── FEATURE 15: Club delivery presets ─────────────────────────
export function ClubPresetsSheet({ onClose, onSelect }) {
  const CLUBS = [
    { name:'Pacha', emoji:'🍒', address:'Avinguda 8 d\'Agost, Ibiza Town', lat:38.9090, lng:1.4349, note:'Use VIP entrance on the right side' },
    { name:'Ushuaia', emoji:'🏨', address:'Platja d\'en Bossa, Sant Josep', lat:38.8793, lng:1.4045, note:'Main entrance, show your wristband' },
    { name:'Hi Ibiza', emoji:'⚡', address:'Platja d\'en Bossa, Sant Josep', lat:38.8771, lng:1.4038, note:'Side entrance near the terrace bar' },
    { name:'DC-10', emoji:'✈️', address:'Carretera Ibiza Aeropuerto, Sant Josep', lat:38.8920, lng:1.3760, note:'Near the runway — classic DC-10 entrance' },
    { name:'Amnesia', emoji:'🌀', address:'Carretera Ibiza-Sant Antoni, Sant Rafael', lat:38.9614, lng:1.3899, note:'Main entrance on the main road' },
    { name:'Eden', emoji:'🌿', address:'Carrer de Salvador Espriu, Sant Antoni', lat:38.9784, lng:1.3021, note:'Opposite the West End' },
    { name:'UNVRS', emoji:'🌌', address:'Carretera Ibiza-Sant Antoni, Sant Rafael', lat:38.9620, lng:1.3905, note:'The immersive experience club — arrive before midnight for best entry' },
  ]

  return (
    <div style={{ position:'fixed', inset:0, zIndex:600, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'flex-end' }} onClick={onClose}>
      <div style={{ width:'100%', maxWidth:480, margin:'0 auto', background:'#0D3545', borderRadius:'24px 24px 0 0', maxHeight:'75vh', overflowY:'auto' }} onClick={e=>e.stopPropagation()}>
        <div style={{ width:36, height:4, background:'rgba(255,255,255,0.2)', borderRadius:2, margin:'14px auto 0' }}/>
        <div style={{ padding:'16px 20px 8px' }}>
        <button onClick={onClose}
          style={{ display:'flex',alignItems:'center',gap:6,background:'rgba(255,255,255,0.08)',border:'0.5px solid rgba(255,255,255,0.15)',borderRadius:20,padding:'6px 14px 6px 10px',cursor:'pointer',marginBottom:14,width:'fit-content' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          <span style={{ fontSize:12,color:'white',fontFamily:'DM Sans,sans-serif',fontWeight:500 }}>Back</span>
        </button>
          <div style={{ fontFamily:F.serif, fontSize:22, color:'white', marginBottom:4 }}>Club delivery</div>
          <div style={{ fontSize:13, color:C.muted, marginBottom:16 }}>Select your club — we know exactly where to deliver</div>
        </div>
        <div style={{ padding:'0 16px 40px' }}>
          {CLUBS.map(club => (
            <button key={club.name} onClick={() => { onSelect(club); onClose() }}
              style={{ display:'flex', alignItems:'center', gap:14, width:'100%', padding:'14px 16px', background:C.surface, border:'0.5px solid '+C.border, borderRadius:14, cursor:'pointer', marginBottom:8, textAlign:'left' }}>
              <span style={{ fontSize:28, flexShrink:0 }}>{club.emoji}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:15, fontWeight:600, color:'white', fontFamily:F.sans }}>{club.name}</div>
                <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{club.note}</div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── FEATURE 16: Boat delivery mode ───────────────────────────
export function BoatDeliverySheet({ onClose, onConfirm }) {
  const [marina, setMarina] = useState('')
  const [berth, setBerth] = useState('')
  const [boatName, setBoatName] = useState('')
  const [extraNotes, setExtraNotes] = useState('')

  const MARINAS = [
    'Marina Ibiza (old town)', 'Marina Botafoch', 'Club Náutico Ibiza',
    'Puerto Deportivo San Antonio', 'Cala Vedella anchorage',
    'Cala Conta anchorage', 'Es Canar marina', 'Santa Eulalia marina',
  ]

  const confirm = () => {
    if (!marina) { toast.error('Please select a marina'); return }
    const details = {
      marina, berth, boatName,
      notes: 'BOAT DELIVERY — Marina: '+marina+(berth?' Berth: '+berth:'')+(boatName?' Boat: '+boatName:'')+(extraNotes?' '+extraNotes:''),
      isBoat: true,
    }
    onConfirm(details)
    toast.success('Boat delivery mode set! Our driver will come to the dock 🚤')
    onClose()
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:600, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'flex-end' }} onClick={onClose}>
      <div style={{ width:'100%', maxWidth:480, margin:'0 auto', background:'#0D3545', borderRadius:'24px 24px 0 0', maxHeight:'80vh', overflowY:'auto' }} onClick={e=>e.stopPropagation()}>
        <div style={{ width:36, height:4, background:'rgba(255,255,255,0.2)', borderRadius:2, margin:'14px auto 0' }}/>
        <div style={{ padding:'16px 20px 40px' }}>
        <button onClick={onClose}
          style={{ display:'flex',alignItems:'center',gap:6,background:'rgba(255,255,255,0.08)',border:'0.5px solid rgba(255,255,255,0.15)',borderRadius:20,padding:'6px 14px 6px 10px',cursor:'pointer',marginBottom:14,width:'fit-content' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          <span style={{ fontSize:12,color:'white',fontFamily:'DM Sans,sans-serif',fontWeight:500 }}>Back</span>
        </button>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:6 }}>
            <span style={{ fontSize:32 }}>⛵</span>
            <div>
              <div style={{ fontFamily:F.serif, fontSize:22, color:'white' }}>Boat delivery</div>
              <div style={{ fontSize:12, color:C.muted }}>We deliver to your boat anywhere in Ibiza</div>
            </div>
          </div>
          <div style={{ background:'rgba(43,122,139,0.15)', border:'0.5px solid rgba(43,122,139,0.3)', borderRadius:12, padding:'12px', marginBottom:20, fontSize:12, color:'rgba(255,255,255,0.65)', lineHeight:1.6 }}>
            🚤 Our driver will come to the dock with your order. Please be on deck or send someone to collect. Add 5-10 minutes for marina access.
          </div>

          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:12, color:C.muted, marginBottom:8, textTransform:'uppercase', letterSpacing:'0.5px' }}>Marina / anchorage</div>
            <select value={marina} onChange={e=>setMarina(e.target.value)}
              style={{ width:'100%', padding:'13px 14px', background:'rgba(255,255,255,0.08)', border:'0.5px solid rgba(255,255,255,0.2)', borderRadius:12, color:'white', fontSize:14, fontFamily:F.sans, outline:'none' }}>
              <option value="">Select marina...</option>
              {MARINAS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {[['Berth number','e.g. B-24',berth,setBerth],['Boat name','e.g. MV Libertad',boatName,setBoatName],['Additional notes','Any access info, call ahead etc.',extraNotes,setExtraNotes]].map(([label,ph,val,setter])=>(
            <div key={label} style={{ marginBottom:14 }}>
              <div style={{ fontSize:12, color:C.muted, marginBottom:8, textTransform:'uppercase', letterSpacing:'0.5px' }}>{label}</div>
              <input value={val} onChange={e=>setter(e.target.value)} placeholder={ph}
                style={{ width:'100%', padding:'13px 14px', background:'rgba(255,255,255,0.08)', border:'0.5px solid rgba(255,255,255,0.2)', borderRadius:12, color:'white', fontSize:14, fontFamily:F.sans, outline:'none', boxSizing:'border-box' }}/>
            </div>
          ))}

          <button onClick={confirm}
            style={{ width:'100%', padding:'16px', background:'#C4683A', border:'none', borderRadius:14, color:'white', fontSize:15, fontWeight:600, cursor:'pointer', fontFamily:F.sans, boxShadow:'0 4px 20px rgba(196,104,58,0.4)' }}>
            Confirm boat delivery ⛵
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Weather hook — always shows Ibiza weather ────────────────
// Falls back to Ibiza Town coordinates if user denies location
const IBIZA_LAT = 38.9067
const IBIZA_LNG = 1.4326

function fetchWeather(lat, lng, setWeather) {
  fetch(
    'https://api.open-meteo.com/v1/forecast?latitude='+lat+'&longitude='+lng+
    '&current=temperature_2m,weathercode,windspeed_10m,precipitation&timezone=Europe/Madrid'
  )
    .then(r => r.json())
    .then(data => {
      const temp = data.current?.temperature_2m
      const code = data.current?.weathercode
      const wind = data.current?.windspeed_10m
      const rain = data.current?.precipitation
      if (temp == null) return
      const sunny   = code <= 2
      const cloudy  = code >= 3 && code <= 48
      const rainy   = code >= 51 && code <= 77
      const stormy  = code >= 80
      const hot     = temp >= 28
      const warm    = temp >= 22
      const cool    = temp < 20
      // Weather icon
      const icon = stormy ? '⛈' : rainy ? '🌧' : cloudy ? '⛅' : hot ? '☀️' : sunny ? '🌤' : '🌡'
      // Descriptive text
      const text = stormy  ? 'Storm warning ⛈ '+Math.round(temp)+'°C'
                 : rainy   ? 'Rainy in Ibiza 🌧 '+Math.round(temp)+'°C'
                 : hot && sunny ? 'Perfect '+Math.round(temp)+'°C ☀️'
                 : warm && sunny ? 'Beautiful '+Math.round(temp)+'°C 🌤'
                 : cool    ? 'Cool evening 🌡 '+Math.round(temp)+'°C'
                 : 'Ibiza '+icon+' '+Math.round(temp)+'°C'
      setWeather({ temp, code, wind, rain, sunny, hot, warm, cool, rainy, stormy, icon, text })
    })
    .catch(() => {
      // Silent fail — weather is non-critical
    })
}

export function useWeatherSuggestion() {
  const [weather, setWeather] = useState(null)
  useEffect(() => {
    // Try user's actual location first
    if (navigator?.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => fetchWeather(pos.coords.latitude, pos.coords.longitude, setWeather),
        // If denied or unavailable — use Ibiza Town as fallback
        () => fetchWeather(IBIZA_LAT, IBIZA_LNG, setWeather),
        { timeout: 5000, maximumAge: 300000 } // 5s timeout, cache 5 mins
      )
    } else {
      // No geolocation support — use Ibiza Town
      fetchWeather(IBIZA_LAT, IBIZA_LNG, setWeather)
    }
    // Refresh every 30 minutes
    const interval = setInterval(() => {
      fetchWeather(IBIZA_LAT, IBIZA_LNG, setWeather)
    }, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])
  return weather
}
