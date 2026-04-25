// ================================================================
// Isla Drop — CustomerFeatures_15.jsx
// Points 1-15: Sort/Filter, Wishlist, Loyalty, Tip, Transitions,
//   Skeletons, Recently Viewed, Order Receipt, Cancel Order,
//   Driver Chat, W3W, Dark Mode, Referral, Notifications, Scheduled
// ================================================================
import { useState, useEffect, useRef, useCallback } from 'react'
import { LoyaltyTierCard, StreakBadge } from './CustomerFeatures_polish'
import { AnimatedStampCard } from './CustomerFeatures_getir'
import { useCartStore, useAuthStore } from '../../lib/store'
import { supabase } from '../../lib/supabase'
import { PRODUCTS } from '../../lib/products'
import toast from 'react-hot-toast'

const F = { serif:'DM Serif Display,serif', sans:'DM Sans,sans-serif' }
const C = {
  bg:'#0D3545', accent:'#C4683A', green:'#7EE8A2', gold:'#C8A84B',
  surface:'rgba(255,255,255,0.07)', border:'rgba(255,255,255,0.1)',
  muted:'rgba(255,255,255,0.45)', white:'white',
}

function Sheet({ onClose, children, maxH='85vh' }) {
  return (
    <div style={{ position:'fixed',inset:0,zIndex:600,background:'rgba(0,0,0,0.75)',display:'flex',alignItems:'flex-end' }} onClick={onClose}>
      <div style={{ width:'100%',maxWidth:480,margin:'0 auto',background:'#0D3545',borderRadius:'24px 24px 0 0',maxHeight:maxH,overflowY:'auto' }} onClick={e=>e.stopPropagation()}>
        <div style={{ width:36,height:4,background:'rgba(255,255,255,0.2)',borderRadius:2,margin:'14px auto 0' }}/>
        {children}
      </div>
    </div>
  )
}

function Btn({ onClick, children, style={}, disabled=false }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ border:'none',cursor:disabled?'default':'pointer',fontFamily:F.sans,...style }}>
      {children}
    </button>
  )
}

// ── POINT 5: Global transition wrapper ───────────────────────
// Usage: wrap view content — fades in on mount
export function FadeIn({ children, key: k }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { const id = requestAnimationFrame(() => setVisible(true)); return () => cancelAnimationFrame(id) }, [])
  return (
    <div style={{ opacity: visible?1:0, transform: visible?'translateY(0)':'translateY(8px)', transition:'opacity 0.2s ease, transform 0.2s ease' }}>
      {children}
    </div>
  )
}

// ── POINT 6: Skeleton loader components ──────────────────────
export function SkeletonCard({ height=120 }) {
  return (
    <div style={{ background:'rgba(255,255,255,0.07)',borderRadius:14,overflow:'hidden',animation:'shimmer 1.5s infinite' }}>
      <div style={{ height,background:'rgba(255,255,255,0.06)' }}/>
      <div style={{ padding:'10px 12px 14px' }}>
        <div style={{ height:10,background:'rgba(255,255,255,0.08)',borderRadius:6,marginBottom:8,width:'80%' }}/>
        <div style={{ height:8,background:'rgba(255,255,255,0.06)',borderRadius:6,width:'40%' }}/>
      </div>
    </div>
  )
}

export function SkeletonRow() {
  return (
    <div style={{ display:'flex',gap:12,alignItems:'center',padding:'12px 0',borderBottom:'0.5px solid rgba(255,255,255,0.06)' }}>
      <div style={{ width:52,height:52,borderRadius:10,background:'rgba(255,255,255,0.08)',flexShrink:0,animation:'shimmer 1.5s infinite' }}/>
      <div style={{ flex:1 }}>
        <div style={{ height:11,background:'rgba(255,255,255,0.08)',borderRadius:6,marginBottom:8,width:'70%',animation:'shimmer 1.5s infinite' }}/>
        <div style={{ height:9,background:'rgba(255,255,255,0.06)',borderRadius:6,width:'30%',animation:'shimmer 1.5s infinite' }}/>
      </div>
    </div>
  )
}

export function SkeletonText({ width='60%', height=10 }) {
  return <div style={{ height,background:'rgba(255,255,255,0.08)',borderRadius:6,width,marginBottom:8,animation:'shimmer 1.5s infinite' }}/>
}

export const SHIMMER_STYLE = `
@keyframes shimmer {
  0%   { opacity: 1 }
  50%  { opacity: 0.55 }
  100% { opacity: 1 }
}
`

// ── POINT 1: Sort + Filter for CategoryPage ──────────────────
export function SortFilterBar({ sort, setSort, maxPrice, setMaxPrice, allPrices }) {
  const [showFilter, setShowFilter] = useState(false)
  const SORTS = [
    { id:'popular', label:'Popular' },
    { id:'price_asc', label:'Price ↑' },
    { id:'price_desc', label:'Price ↓' },
    { id:'az', label:'A–Z' },
  ]
  const priceMax = allPrices.length ? Math.ceil(Math.max(...allPrices) / 5) * 5 : 100

  return (
    <div style={{ display:'flex', gap:8, alignItems:'center', overflowX:'auto', scrollbarWidth:'none', paddingBottom:2 }}>
      {SORTS.map(s => (
        <button key={s.id} onClick={()=>setSort(s.id)}
          style={{ padding:'7px 14px', borderRadius:20, fontSize:12, fontWeight:sort===s.id?600:400, background:sort===s.id?'rgba(255,255,255,0.9)':'rgba(255,255,255,0.1)', color:sort===s.id?'#0D3B4A':'white', border:sort===s.id?'none':'0.5px solid rgba(255,255,255,0.18)', cursor:'pointer', whiteSpace:'nowrap', fontFamily:F.sans, flexShrink:0, transition:'all 0.15s' }}>
          {s.label}
        </button>
      ))}
      <button onClick={()=>setShowFilter(f=>!f)}
        style={{ padding:'7px 14px', borderRadius:20, fontSize:12, background:maxPrice<priceMax?'rgba(196,104,58,0.35)':'rgba(255,255,255,0.1)', color:'white', border:'0.5px solid rgba(255,255,255,0.18)', cursor:'pointer', whiteSpace:'nowrap', fontFamily:F.sans, flexShrink:0, display:'flex', alignItems:'center', gap:5 }}>
        🎚 {maxPrice<priceMax?'€'+maxPrice:'Filter'}
      </button>
      {showFilter && (
        <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', background:'#0D3B4A', border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:18, padding:'24px', zIndex:300, minWidth:280, boxShadow:'0 20px 60px rgba(0,0,0,0.5)' }}
          onClick={e=>e.stopPropagation()}>
          <div style={{ fontFamily:F.serif, fontSize:18, color:'white', marginBottom:16 }}>Filter by price</div>
          <div style={{ fontSize:13, color:C.muted, marginBottom:12 }}>Max price: <strong style={{ color:'#E8A070' }}>€{maxPrice}</strong></div>
          <input type="range" min={10} max={priceMax} step={5} value={maxPrice} onChange={e=>setMaxPrice(Number(e.target.value))}
            style={{ width:'100%', marginBottom:20, accentColor:'#C4683A' }} />
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={()=>setMaxPrice(priceMax)} style={{ flex:1, padding:'10px', background:'rgba(255,255,255,0.08)', border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:10, color:C.muted, fontSize:13, cursor:'pointer', fontFamily:F.sans }}>Reset</button>
            <button onClick={()=>setShowFilter(false)} style={{ flex:1, padding:'10px', background:'#C4683A', border:'none', borderRadius:10, color:'white', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:F.sans }}>Apply</button>
          </div>
        </div>
      )}
    </div>
  )
}

export function sortProducts(products, sort) {
  const ps = [...products]
  if (sort==='price_asc') return ps.sort((a,b)=>a.price-b.price)
  if (sort==='price_desc') return ps.sort((a,b)=>b.price-a.price)
  if (sort==='az') return ps.sort((a,b)=>a.name.localeCompare(b.name))
  return ps.sort((a,b)=>(b.popular?1:0)-(a.popular?1:0)) // popular first
}

// ── POINT 2: Wishlist / Favourites ───────────────────────────
const WL_KEY = 'isla_wishlist'
function getWL() { try { return JSON.parse(localStorage.getItem(WL_KEY)||'[]') } catch { return [] } }
function setWL(ids) { try { localStorage.setItem(WL_KEY, JSON.stringify(ids)) } catch {} }

export function useWishlist() {
  const [ids, setIds] = useState(() => getWL())
  const toggle = useCallback((id) => {
    setIds(prev => {
      const next = prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id]
      setWL(next)
      return next
    })
  }, [])
  const has = useCallback((id) => ids.includes(id), [ids])
  return { ids, toggle, has }
}

export function WishlistButton({ productId, style={} }) {
  const { has, toggle } = useWishlist()
  const liked = has(productId)
  const handleClick = (e) => {
    e.stopPropagation()
    toggle(productId)
    navigator.vibrate && navigator.vibrate(liked ? 10 : [15, 10, 15])
    if (!liked) toast.success('❤️ Added to favourites', { duration: 1200 })
  }
  return (
    <button onClick={handleClick}
      style={{ width:30, height:30, borderRadius:'50%', background:liked?'rgba(255,80,80,0.25)':'rgba(0,0,0,0.4)', border:liked?'1px solid rgba(255,80,80,0.5)':'1px solid rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:14, transition:'all 0.15s', ...style }}>
      {liked ? '❤️' : '🤍'}
    </button>
  )
}

export function WishlistView({ onBack, onDetail }) {
  const { ids } = useWishlist()
  const { addItem } = useCartStore()
  const products = PRODUCTS.filter(p => ids.includes(p.id))

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(170deg,#0A2A38 0%,#0D3545 100%)', paddingBottom:100 }}>
      <div style={{ background:'linear-gradient(135deg,#0D3B4A,#1A5263)', padding:'16px 16px 20px', position:'sticky', top:0, zIndex:50 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={onBack} style={{ display:'flex',alignItems:'center',gap:6,background:'rgba(255,255,255,0.08)',border:'0.5px solid rgba(255,255,255,0.15)',borderRadius:20,padding:'7px 14px 7px 10px',cursor:'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            <span style={{ fontSize:12,color:'white',fontFamily:'DM Sans,sans-serif',fontWeight:500 }}>Back</span>
          </button>
          <div>
            <div style={{ fontFamily:F.serif, fontSize:24, color:'white', lineHeight:1 }}>Favourites</div>
            <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>{products.length} saved items</div>
          </div>
        </div>
      </div>
      <div style={{ padding:'16px' }}>
        {products.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 0' }}>
            <div style={{ fontSize:52, marginBottom:14 }}>❤️</div>
            <div style={{ fontFamily:F.serif, fontSize:22, color:'white', marginBottom:8 }}>No favourites yet</div>
            <div style={{ fontSize:14, color:C.muted }}>Tap the heart on any product to save it</div>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {products.map(p => (
              <div key={p.id} onClick={()=>onDetail&&onDetail(p)} style={{ background:C.surface, border:'0.5px solid '+C.border, borderRadius:14, overflow:'hidden', cursor:'pointer', position:'relative' }}>
                <div style={{ position:'relative', height:120, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(255,255,255,0.04)', fontSize:42 }}>
                  {p.emoji}
                  <WishlistButton productId={p.id} style={{ position:'absolute', top:8, right:8 }} />
                </div>
                <div style={{ padding:'10px 12px 12px' }}>
                  <div style={{ fontSize:12, color:'white', lineHeight:1.3, marginBottom:6 }}>{p.name}</div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:14, fontWeight:600, color:'#E8A070' }}>€{p.price.toFixed(2)}</span>
                    <button onClick={e=>{e.stopPropagation();addItem(p);navigator.vibrate&&navigator.vibrate(25);toast.success(p.emoji+' Added!',{duration:800})}}
                      style={{ width:28,height:28,background:'#C4683A',border:'none',borderRadius:'50%',color:'white',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer' }}>+</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── POINT 3: Loyalty stamp card ───────────────────────────────
export function LoyaltyCard({ onBack }) {
  const { user } = useAuthStore()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    supabase.from('loyalty_cards').select('*').eq('user_id', user.id).single()
      .then(({ data }) => {
        setData(data || { stamps: 0, total_orders: 0, lifetime_points: 0 })
        setLoading(false)
      }).catch(() => {
        setData({ stamps: 0, total_orders: 0, lifetime_points: 0 })
        setLoading(false)
      })
  }, [user])

  const stamps = data?.stamps || 0
  const TOTAL = 10

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(170deg,#0A2A38 0%,#0D3545 100%)', paddingBottom:100 }}>
      <div style={{ background:'linear-gradient(135deg,#0D3B4A,#1A5263)', padding:'16px 16px 20px', position:'sticky', top:0, zIndex:50 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={onBack} style={{ display:'flex',alignItems:'center',gap:6,background:'rgba(255,255,255,0.08)',border:'0.5px solid rgba(255,255,255,0.15)',borderRadius:20,padding:'7px 14px 7px 10px',cursor:'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            <span style={{ fontSize:12,color:'white',fontFamily:'DM Sans,sans-serif',fontWeight:500 }}>Back</span>
          </button>
          <div style={{ fontFamily:F.serif, fontSize:24, color:'white' }}>Isla Rewards</div>
        </div>
      </div>
      <div style={{ padding:'20px 16px' }}>
        {loading ? (
          <div style={{ textAlign:'center', padding:40, color:C.muted }}>Loading...</div>
        ) : !user ? (
          <div style={{ textAlign:'center', padding:40 }}>
            <div style={{ fontSize:48, marginBottom:16 }}>🌴</div>
            <div style={{ fontFamily:F.serif, fontSize:22, color:'white', marginBottom:8 }}>Sign in to earn rewards</div>
            <div style={{ fontSize:14, color:C.muted }}>Every order earns a stamp. 10 stamps = free delivery for a month!</div>
          </div>
        ) : (
          <>
            {/* Stamp card */}
            <div style={{ background:'linear-gradient(135deg,rgba(200,168,75,0.2),rgba(196,104,58,0.15))', border:'0.5px solid rgba(200,168,75,0.4)', borderRadius:20, padding:'20px', marginBottom:20 }}>
              <div style={{ fontFamily:F.serif, fontSize:20, color:'white', marginBottom:4 }}>Isla Stamp Card</div>
              <div style={{ fontSize:13, color:C.muted, marginBottom:18 }}>Collect 10 stamps, unlock a reward</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:8, marginBottom:16 }}>
                {Array.from({ length: TOTAL }).map((_, i) => (
                  <div key={i} style={{ aspectRatio:'1', borderRadius:12, background:i<stamps?'linear-gradient(135deg,#C8A84B,#E8C860)':'rgba(255,255,255,0.08)', border:'1px solid '+(i<stamps?'rgba(200,168,75,0.6)':'rgba(255,255,255,0.1)'), display:'flex', alignItems:'center', justifyContent:'center', fontSize:i<stamps?18:14, color:i<stamps?'white':'rgba(255,255,255,0.2)', transition:'all 0.3s', transform:i<stamps?'scale(1.05)':'scale(1)' }}>
                    {i < stamps ? '🌴' : '○'}
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:13, color:C.muted }}>{stamps}/{TOTAL} stamps collected</span>
                {stamps >= TOTAL && <span style={{ fontSize:12, fontWeight:700, color:C.green, background:'rgba(126,232,162,0.15)', padding:'4px 12px', borderRadius:99 }}>🎉 Reward ready!</span>}
              </div>
            </div>

            {/* A6: Animated visual stamp card */}
            <AnimatedStampCard stamps={stamps} maxStamps={10} />
            {/* Feature 12: VIP tier card */}
            <LoyaltyTierCard totalOrders={data?.total_orders||0} stamps={stamps} />
            {/* Stats */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:20 }}>
              {[
                { label:'Total orders', value: data?.total_orders || 0 },
                { label:'Stamps earned', value: stamps },
                { label:'Rewards used', value: data?.rewards_used || 0 },
              ].map(({ label, value }) => (
                <div key={label} style={{ background:C.surface, border:'0.5px solid '+C.border, borderRadius:14, padding:'14px 12px', textAlign:'center' }}>
                  <div style={{ fontSize:22, fontWeight:700, color:'white', fontFamily:F.serif }}>{value}</div>
                  <div style={{ fontSize:10, color:C.muted, marginTop:4 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* How it works */}
            <div style={{ background:C.surface, border:'0.5px solid '+C.border, borderRadius:16, padding:'16px' }}>
              <div style={{ fontFamily:F.serif, fontSize:18, color:'white', marginBottom:12 }}>How it works</div>
              {[
                ['🛵', 'Place any order over €15', 'Earn 1 stamp per order'],
                ['🌴', 'Collect 10 stamps', 'Get a free delivery month'],
                ['⭐', 'Rate your orders', 'Bonus stamp for 5-star reviews'],
              ].map(([emoji, title, sub]) => (
                <div key={title} style={{ display:'flex', gap:12, alignItems:'flex-start', marginBottom:14 }}>
                  <span style={{ fontSize:24, flexShrink:0 }}>{emoji}</span>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:'white', fontFamily:F.sans }}>{title}</div>
                    <div style={{ fontSize:11, color:C.muted }}>{sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── POINT 4: Driver tip selector ─────────────────────────────
export function TipSelector({ onTipChange }) {
  const [tip, setTip] = useState(0)
  const [custom, setCustom] = useState('')
  const [showCustom, setShowCustom] = useState(false)

  const select = (amount) => {
    const val = Number(amount)
    setTip(val)
    setShowCustom(false)
    setCustom('')
    onTipChange(val)
  }

  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', marginBottom:10, textTransform:'uppercase', letterSpacing:'0.5px', fontFamily:F.sans }}>Tip your driver 🛵</div>
      <div style={{ display:'flex', gap:8 }}>
        {[0, 1, 2, 3].map(amount => (
          <button key={amount} onClick={()=>select(amount)}
            style={{ flex:1, padding:'10px 0', borderRadius:10, background:tip===amount&&!showCustom?'rgba(196,104,58,0.35)':'rgba(255,255,255,0.07)', border:'0.5px solid '+(tip===amount&&!showCustom?'rgba(196,104,58,0.6)':'rgba(255,255,255,0.12)'), color:'white', fontSize:13, fontWeight:tip===amount&&!showCustom?600:400, cursor:'pointer', fontFamily:F.sans, transition:'all 0.15s' }}>
            {amount===0?'No tip':'€'+amount}
          </button>
        ))}
        <button onClick={()=>setShowCustom(s=>!s)}
          style={{ flex:1, padding:'10px 0', borderRadius:10, background:showCustom?'rgba(196,104,58,0.35)':'rgba(255,255,255,0.07)', border:'0.5px solid '+(showCustom?'rgba(196,104,58,0.6)':'rgba(255,255,255,0.12)'), color:'white', fontSize:12, cursor:'pointer', fontFamily:F.sans }}>
          Other
        </button>
      </div>
      {showCustom && (
        <div style={{ display:'flex', gap:8, marginTop:8 }}>
          <div style={{ flex:1, display:'flex', alignItems:'center', background:'rgba(255,255,255,0.08)', border:'0.5px solid rgba(255,255,255,0.2)', borderRadius:10, padding:'0 12px' }}>
            <span style={{ color:C.muted, marginRight:4 }}>€</span>
            <input type="number" min="0" max="50" step="0.50" value={custom} onChange={e=>setCustom(e.target.value)}
              placeholder="0.00" style={{ flex:1, background:'none', border:'none', color:'white', fontSize:14, fontFamily:F.sans, outline:'none', padding:'11px 0' }} />
          </div>
          <button onClick={()=>select(custom||0)} style={{ padding:'11px 18px', background:'#C4683A', border:'none', borderRadius:10, color:'white', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:F.sans }}>Set</button>
        </div>
      )}
      {tip > 0 && <div style={{ fontSize:11, color:C.green, marginTop:6, textAlign:'center' }}>❤️ Your driver will love you for this</div>}
    </div>
  )
}

// ── POINT 7: Recently viewed store + component ────────────────
const RV_KEY = 'isla_recent'
export function trackView(product) {
  try {
    const prev = JSON.parse(localStorage.getItem(RV_KEY) || '[]')
    const next = [product.id, ...prev.filter(id => id !== product.id)].slice(0, 12)
    localStorage.setItem(RV_KEY, JSON.stringify(next))
  } catch {}
}

export function RecentlyViewedRow({ onDetail, title='👁 Recently viewed' }) {
  const [ids, setIds] = useState([])
  useEffect(() => {
    try { setIds(JSON.parse(localStorage.getItem(RV_KEY) || '[]')) } catch {}
  }, [])
  const products = ids.map(id => PRODUCTS.find(p => p.id === id)).filter(Boolean)
  if (products.length < 2) return null
  const { addItem } = useCartStore()

  return (
    <div style={{ marginBottom:22 }}>
      <div style={{ fontFamily:F.serif, fontSize:20, color:'white', padding:'0 16px', marginBottom:12 }}>{title}</div>
      <div style={{ display:'flex', gap:10, overflowX:'auto', padding:'0 16px 4px', scrollbarWidth:'none' }}>
        {products.map(p => (
          <div key={p.id} onClick={()=>onDetail&&onDetail(p)}
            style={{ background:'rgba(255,255,255,0.92)', borderRadius:14, overflow:'hidden', minWidth:120, maxWidth:120, flexShrink:0, cursor:'pointer' }}>
            <div style={{ height:80, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(255,255,255,0.5)', fontSize:30 }}>{p.emoji}</div>
            <div style={{ padding:'7px 9px 9px' }}>
              <div style={{ fontSize:10, color:'#2A2318', lineHeight:1.3, marginBottom:3, height:24, overflow:'hidden' }}>{p.name}</div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:12, fontWeight:600, color:'#C4683A' }}>€{p.price.toFixed(2)}</span>
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

// ── POINT 8: Order receipt ────────────────────────────────────
export function OrderReceiptSheet({ order, onClose }) {
  const items = order?.order_items || []
  const subtotal = items.reduce((s,i) => s + (i.unit_price||i.product_price||0)*i.quantity, 0)
  const delivery = 3.50
  const total = order?.total || (subtotal + delivery)

  const download = () => {
    const html = '<html><body style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:20px">' +
      '<h2 style="color:#C4683A">Isla Drop Receipt</h2>' +
      '<p><strong>Order:</strong> #' + (order.order_number || order.id?.slice(0,8)) + '</p>' +
      '<p><strong>Date:</strong> ' + new Date(order.created_at).toLocaleDateString('en-GB') + '</p>' +
      '<hr/>' + items.map(i => '<p>' + (i.product_name||'Item') + ' x' + i.quantity + ' — €' + ((i.unit_price||0)*i.quantity).toFixed(2) + '</p>').join('') +
      '<hr/><p>Delivery: €' + delivery.toFixed(2) + '</p><p><strong>Total: €' + total.toFixed(2) + '</strong></p>' +
      '<p style="color:#888;font-size:11px">Isla Drop · isladrop.net · Ibiza</p></body></html>'
    const blob = new Blob([html], { type: 'text/html' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'IslaDropReceipt-' + (order.order_number || order.id?.slice(0,8)) + '.html'
    a.click()
  }

  return (
    <Sheet onClose={onClose}>
      <div style={{ padding:'16px 20px 40px' }}>
        <div style={{ fontFamily:F.serif, fontSize:22, color:'white', marginBottom:4 }}>Receipt</div>
        <div style={{ fontSize:13, color:C.muted, marginBottom:20 }}>
          Order #{order.order_number || order.id?.slice(0,8)} · {new Date(order.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}
        </div>
        {items.length === 0 && <div style={{ fontSize:13,color:C.muted,marginBottom:16 }}>No item details available for this order</div>}
        {items.map((item, i) => (
          <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'rgba(255,255,255,0.8)', padding:'8px 0', borderBottom:'0.5px solid rgba(255,255,255,0.07)' }}>
            <span>{item.product_name || item.products?.name || 'Item'} × {item.quantity}</span>
            <span style={{ fontWeight:500 }}>€{((item.unit_price||item.product_price||0)*item.quantity).toFixed(2)}</span>
          </div>
        ))}
        <div style={{ paddingTop:12, marginTop:4 }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:C.muted, marginBottom:5 }}><span>Subtotal</span><span>€{subtotal.toFixed(2)}</span></div>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:C.muted, marginBottom:10 }}><span>Delivery</span><span>€{delivery.toFixed(2)}</span></div>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:16, fontWeight:700, color:'white', paddingTop:8, borderTop:'0.5px solid rgba(255,255,255,0.1)' }}><span>Total</span><span style={{ color:'#E8A070' }}>€{total.toFixed(2)}</span></div>
        </div>
        <div style={{ display:'flex', gap:10, marginTop:20 }}>
          <button onClick={download}
            style={{ flex:1, padding:'13px', background:'rgba(196,104,58,0.2)', border:'0.5px solid rgba(196,104,58,0.4)', borderRadius:12, color:'#E8A070', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:F.sans }}>
            📥 Download
          </button>
          <button onClick={()=>{ const t='Isla Drop Order #'+(order.order_number||'')+'%0ATotal: €'+total.toFixed(2); window.open('https://wa.me/?text='+t) }}
            style={{ flex:1, padding:'13px', background:'rgba(37,211,102,0.15)', border:'0.5px solid rgba(37,211,102,0.3)', borderRadius:12, color:'#25D366', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:F.sans }}>
            📲 WhatsApp
          </button>
        </div>
      </div>
    </Sheet>
  )
}

// ── POINT 9: Cancel order ─────────────────────────────────────
export function CancelOrderButton({ order, onCancelled }) {
  const [secs, setSecs] = useState(null)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    if (!order?.created_at) return
    const placed = new Date(order.created_at).getTime()
    const WINDOW = 120000 // 2 minutes
    const tick = () => {
      const rem = Math.max(0, Math.floor((placed + WINDOW - Date.now()) / 1000))
      setSecs(rem)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [order?.created_at])

  if (!secs) return null

  const cancel = async () => {
    if (!window.confirm('Cancel this order?')) return
    setCancelling(true)
    const { error } = await supabase.from('orders').update({ status: 'cancelled' }).eq('id', order.id)
    if (error) { toast.error('Could not cancel — please call us'); setCancelling(false); return }
    toast.success('Order cancelled')
    onCancelled?.()
  }

  const m = Math.floor(secs / 60), s = secs % 60
  const pct = (secs / 120) * 100

  return (
    <div style={{ background:'rgba(255,255,255,0.06)', border:'0.5px solid rgba(255,255,255,0.12)', borderRadius:14, padding:'14px 16px', marginBottom:14 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
        <div>
          <div style={{ fontSize:13, fontWeight:600, color:'white', fontFamily:F.sans }}>Cancel window open</div>
          <div style={{ fontSize:11, color:C.muted }}>You can cancel within 2 minutes of ordering</div>
        </div>
        <div style={{ fontFamily:'monospace', fontSize:20, fontWeight:700, color: secs<30?'#F09595':'#C8A84B' }}>
          {m}:{s.toString().padStart(2,'0')}
        </div>
      </div>
      <div style={{ height:4, background:'rgba(255,255,255,0.1)', borderRadius:99, marginBottom:12, overflow:'hidden' }}>
        <div style={{ height:'100%', width:pct+'%', background:secs<30?'#F09595':'#C8A84B', borderRadius:99, transition:'width 1s linear' }}/>
      </div>
      <button onClick={cancel} disabled={cancelling}
        style={{ width:'100%', padding:'11px', background:'rgba(240,149,149,0.15)', border:'0.5px solid rgba(240,149,149,0.35)', borderRadius:10, color:'#F09595', fontSize:13, fontWeight:600, cursor:cancelling?'default':'pointer', fontFamily:F.sans }}>
        {cancelling ? 'Cancelling...' : 'Cancel order'}
      </button>
    </div>
  )
}

// ── POINT 10: In-app driver chat ──────────────────────────────
export function DriverChat({ order, onClose }) {
  const { user } = useAuthStore()
  const [messages, setMessages] = useState([
    { role:'driver', text:'Hi! I have your order and am on my way 🛵', ts: Date.now() - 60000 },
  ])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  const QUICK = ['I am outside ☑️', 'Use the intercom 🔔', 'Leave at the door 🚪', 'I will be there in 5 min ⏱']

  const send = async (text) => {
    if (!text.trim() || sending) return
    setSending(true)
    const msg = { role:'customer', text: text.trim(), ts: Date.now() }
    setMessages(p => [...p, msg])
    setInput('')
    await supabase.from('order_messages').insert({ order_id: order?.id, sender_id: user?.id, role:'customer', text: text.trim() }).catch(() => {})
    setSending(false)
    // Auto-read new messages
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior:'smooth' }), 100)
  }

  return (
    <Sheet onClose={onClose} maxH="75vh">
      <div style={{ padding:'16px 20px 0' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <div>
            <div style={{ fontFamily:F.serif, fontSize:20, color:'white' }}>Chat with driver</div>
            <div style={{ fontSize:11, color:C.green, marginTop:2 }}>● Online</div>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.1)', border:'none', borderRadius:'50%', width:32, height:32, color:'white', cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
        </div>
      </div>
      <div style={{ padding:'0 16px', maxHeight:260, overflowY:'auto', marginBottom:12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display:'flex', justifyContent: m.role==='customer'?'flex-end':'flex-start', marginBottom:10 }}>
            <div style={{ background: m.role==='customer'?'#C4683A':'rgba(255,255,255,0.12)', borderRadius:14, padding:'10px 14px', maxWidth:'78%', fontSize:13, color:'white', fontFamily:F.sans, lineHeight:1.5 }}>
              {m.text}
            </div>
          </div>
        ))}
        <div ref={bottomRef}/>
      </div>
      <div style={{ padding:'0 16px', display:'flex', gap:6, overflowX:'auto', scrollbarWidth:'none', marginBottom:12 }}>
        {QUICK.map(q => (
          <button key={q} onClick={()=>send(q)} style={{ padding:'7px 12px', background:'rgba(255,255,255,0.08)', border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:20, color:'white', fontSize:11, whiteSpace:'nowrap', cursor:'pointer', fontFamily:F.sans, flexShrink:0 }}>{q}</button>
        ))}
      </div>
      <div style={{ padding:'0 16px 28px', display:'flex', gap:8 }}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send(input)}
          placeholder="Type a message..."
          style={{ flex:1, padding:'11px 16px', background:'rgba(255,255,255,0.1)', border:'0.5px solid rgba(255,255,255,0.2)', borderRadius:24, color:'white', fontSize:13, fontFamily:F.sans, outline:'none' }} />
        <button onClick={()=>send(input)} disabled={!input.trim()||sending}
          style={{ width:44, height:44, background:input.trim()?'#C4683A':'rgba(255,255,255,0.1)', border:'none', borderRadius:'50%', cursor:input.trim()?'pointer':'default', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M22 2L11 13"/><path d="M22 2L15 22l-4-9-9-4 20-7z"/></svg>
        </button>
      </div>
    </Sheet>
  )
}

// ── POINT 11: What3Words picker ───────────────────────────────
export function W3WPicker({ onClose, onSelect }) {
  const [words, setWords] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const lookup = async () => {
    const w = words.trim().replace(/^\/\/\//, '')
    if (w.split('.').length !== 3) { setError('Enter 3 words separated by dots (e.g. filled.count.soap)'); return }
    setLoading(true); setError('')
    try {
      const key = (typeof window !== 'undefined' && window.VITE_W3W_API_KEY) || import.meta.env?.VITE_W3W_API_KEY || ''
      const resp = await fetch('https://api.what3words.com/v3/convert-to-coordinates?words=' + encodeURIComponent(w) + '&key=' + key)
      const data = await resp.json()
      if (data.error) { setError('Address not found. Check the 3 words and try again.'); setLoading(false); return }
      setResult({ words: w, lat: data.coordinates.lat, lng: data.coordinates.lng, nearestPlace: data.nearestPlace })
    } catch { setError('Could not look up address. Please check your internet.') }
    setLoading(false)
  }

  return (
    <Sheet onClose={onClose}>
      <div style={{ padding:'16px 20px 40px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'rgba(229,0,26,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>///</div>
          <div>
            <div style={{ fontFamily:F.serif, fontSize:20, color:'white' }}>what3words</div>
            <div style={{ fontSize:11, color:C.muted }}>Precise delivery to any villa, beach or boat</div>
          </div>
        </div>
        <div style={{ fontSize:12, color:C.muted, marginBottom:14, padding:'10px', background:'rgba(229,0,26,0.08)', borderRadius:10, border:'0.5px solid rgba(229,0,26,0.2)' }}>
          Every 3m² of Ibiza has a unique 3-word address. Find yours at what3words.com
        </div>
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:12, color:C.muted, marginBottom:8 }}>Enter your 3-word address</div>
          <div style={{ display:'flex', gap:8 }}>
            <div style={{ flex:1, display:'flex', alignItems:'center', background:'rgba(255,255,255,0.08)', border:'0.5px solid rgba(229,0,26,0.3)', borderRadius:12, padding:'0 14px' }}>
              <span style={{ color:'rgba(229,0,26,0.8)', fontWeight:700, marginRight:6 }}>///</span>
              <input value={words} onChange={e=>setWords(e.target.value)} onKeyDown={e=>e.key==='Enter'&&lookup()}
                placeholder="filled.count.soap"
                style={{ flex:1, background:'none', border:'none', color:'white', fontSize:14, fontFamily:F.sans, outline:'none', padding:'13px 0' }} />
            </div>
          </div>
          {error && <div style={{ fontSize:12, color:'#F09595', marginTop:6 }}>{error}</div>}
        </div>
        <button onClick={lookup} disabled={loading || !words.trim()}
          style={{ width:'100%', padding:'14px', background:words.trim()?'rgba(229,0,26,0.8)':'rgba(255,255,255,0.1)', border:'none', borderRadius:12, color:'white', fontSize:14, fontWeight:600, cursor:words.trim()?'pointer':'default', fontFamily:F.sans, marginBottom:12 }}>
          {loading ? 'Looking up...' : 'Find this address'}
        </button>
        {result && (
          <div style={{ background:'rgba(126,232,162,0.1)', border:'0.5px solid rgba(126,232,162,0.3)', borderRadius:14, padding:'16px', marginBottom:12 }}>
            <div style={{ fontSize:15, fontWeight:700, color:C.green, marginBottom:4 }}>///{ result.words}</div>
            {result.nearestPlace && <div style={{ fontSize:12, color:C.muted, marginBottom:12 }}>Near {result.nearestPlace}</div>}
            <button onClick={()=>{ onSelect(result); onClose() }}
              style={{ width:'100%', padding:'12px', background:'#1D9E75', border:'none', borderRadius:10, color:'white', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:F.sans }}>
              Use this address ✓
            </button>
          </div>
        )}
        <div style={{ textAlign:'center' }}>
          <a href="https://what3words.com" target="_blank" rel="noopener noreferrer" style={{ fontSize:11, color:C.muted, textDecoration:'none' }}>
            Open what3words app to find your location →
          </a>
        </div>
      </div>
    </Sheet>
  )
}

// ── POINT 12: Dark mode ───────────────────────────────────────
const DM_KEY = 'isla_dark'
export function useDarkMode() {
  const [dark, setDark] = useState(() => { try { return localStorage.getItem(DM_KEY) === 'true' } catch { return false } })
  const toggle = () => {
    setDark(d => {
      const next = !d
      try { localStorage.setItem(DM_KEY, String(next)) } catch {}
      if (next) document.documentElement.style.setProperty('--isla-bg','#050E14')
      else document.documentElement.style.removeProperty('--isla-bg')
      return next
    })
  }
  return { dark, toggle }
}

export function DarkModeToggle({ dark, onToggle }) {
  return (
    <button onClick={onToggle}
      style={{ display:'flex', alignItems:'center', gap:12, width:'100%', padding:'14px 16px', background:'rgba(255,255,255,0.06)', border:'none', borderRadius:12, marginBottom:8, cursor:'pointer', textAlign:'left' }}>
      <span style={{ fontSize:20 }}>{dark ? '☀️' : '🌙'}</span>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:14, color:'rgba(255,255,255,0.82)', fontFamily:F.sans, fontWeight:500 }}>{dark ? 'Light mode' : 'Dark mode'}</div>
        <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', marginTop:2 }}>{dark ? 'Switch to light' : 'Easier on the eyes at night'}</div>
      </div>
      <div style={{ width:44, height:24, borderRadius:99, background:dark?'#C4683A':'rgba(255,255,255,0.15)', position:'relative', transition:'background 0.2s' }}>
        <div style={{ position:'absolute', top:3, left:dark?22:3, width:18, height:18, borderRadius:'50%', background:'white', transition:'left 0.2s', boxShadow:'0 1px 4px rgba(0,0,0,0.3)' }}/>
      </div>
    </button>
  )
}

// ── POINT 13: Referral with tracking ─────────────────────────
export function ReferralView({ onBack }) {
  const { user } = useAuthStore()
  const [stats, setStats] = useState({ referrals: 0, pending: 0, earned: 0 })
  const code = user ? 'ISLA' + (user.id || '').slice(0,4).toUpperCase() : 'ISLADROP'
  const link = 'https://www.isladrop.net?ref=' + code

  useEffect(() => {
    if (!user) return
    supabase.from('referrals').select('*', { count:'exact' }).eq('referrer_id', user.id)
      .then(({ data, count }) => {
        const used = (data||[]).filter(r => r.status==='used').length
        setStats({ referrals: count||0, pending: (count||0)-used, earned: used * 10 })
      }).catch(() => {})
  }, [user])

  const share = () => {
    const text = 'Get €10 off your first Isla Drop order — 24/7 delivery in Ibiza! Use code ' + code + ' or click: ' + link
    if (navigator.share) navigator.share({ title:'Isla Drop', text, url: link }).catch(() => {})
    else { navigator.clipboard.writeText(text); toast.success('Referral link copied!') }
  }

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(170deg,#0A2A38 0%,#0D3545 100%)', paddingBottom:100 }}>
      <div style={{ background:'linear-gradient(135deg,#0D3B4A,#1A5263)', padding:'16px 16px 20px', position:'sticky', top:0, zIndex:50 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={onBack} style={{ display:'flex',alignItems:'center',gap:6,background:'rgba(255,255,255,0.08)',border:'0.5px solid rgba(255,255,255,0.15)',borderRadius:20,padding:'7px 14px 7px 10px',cursor:'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            <span style={{ fontSize:12,color:'white',fontFamily:'DM Sans,sans-serif',fontWeight:500 }}>Back</span>
          </button>
          <div style={{ fontFamily:F.serif, fontSize:24, color:'white' }}>Refer a friend</div>
        </div>
      </div>
      <div style={{ padding:'20px 16px' }}>
        {/* Hero */}
        <div style={{ background:'linear-gradient(135deg,rgba(196,104,58,0.25),rgba(200,168,75,0.15))', border:'0.5px solid rgba(196,104,58,0.4)', borderRadius:20, padding:'24px 20px', textAlign:'center', marginBottom:20 }}>
          <div style={{ fontSize:48, marginBottom:12 }}>🔗</div>
          <div style={{ fontFamily:F.serif, fontSize:22, color:'white', marginBottom:6 }}>Give €10, Get €10</div>
          <div style={{ fontSize:13, color:C.muted, lineHeight:1.6 }}>Share your code with friends. They get €10 off their first order. You get €10 credit when they complete it.</div>
        </div>

        {/* Code */}
        <div style={{ background:C.surface, border:'0.5px solid '+C.border, borderRadius:14, padding:'16px', marginBottom:16 }}>
          <div style={{ fontSize:12, color:C.muted, marginBottom:8 }}>Your referral code</div>
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            <div style={{ flex:1, padding:'14px 18px', background:'rgba(255,255,255,0.04)', borderRadius:10, fontFamily:'monospace', fontSize:22, fontWeight:700, color:'white', letterSpacing:3 }}>{code}</div>
            <button onClick={()=>{ navigator.clipboard.writeText(code); toast.success('Code copied!') }}
              style={{ padding:'14px 16px', background:'rgba(196,104,58,0.25)', border:'0.5px solid rgba(196,104,58,0.5)', borderRadius:10, color:'#E8A070', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:F.sans }}>Copy</button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:16 }}>
          {[['Referrals',stats.referrals],['Pending',stats.pending],['Earned','€'+stats.earned]].map(([label,val])=>(
            <div key={label} style={{ background:C.surface, border:'0.5px solid '+C.border, borderRadius:14, padding:'14px 10px', textAlign:'center' }}>
              <div style={{ fontSize:22, fontWeight:700, color:label==='Earned'?'#E8A070':'white', fontFamily:F.serif }}>{val}</div>
              <div style={{ fontSize:10, color:C.muted, marginTop:4 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Share button */}
        <button onClick={share}
          style={{ width:'100%', padding:'16px', background:'#C4683A', border:'none', borderRadius:14, color:'white', fontSize:15, fontWeight:600, cursor:'pointer', fontFamily:F.sans, boxShadow:'0 4px 20px rgba(196,104,58,0.4)' }}>
          📤 Share your code
        </button>
      </div>
    </div>
  )
}

// ── POINT 14: Notification preferences ───────────────────────
export function NotificationPrefsView({ onBack }) {
  const { user } = useAuthStore()
  const [prefs, setPrefs] = useState({ push_orders:true, push_promos:false, email_orders:true, email_promos:false, sms_orders:false })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    supabase.from('notification_prefs').select('*').eq('user_id', user.id).single()
      .then(({ data }) => { if (data) setPrefs(p => ({ ...p, ...data })) }).catch(() => {})
  }, [user])

  const save = async () => {
    setSaving(true)
    await supabase.from('notification_prefs').upsert({ user_id: user?.id, ...prefs }, { onConflict:'user_id' }).catch(() => {})
    toast.success('Preferences saved')
    setSaving(false)
  }

  const Toggle = ({ label, sub, field }) => (
    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 0', borderBottom:'0.5px solid rgba(255,255,255,0.07)' }}>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:14, color:'white', fontFamily:F.sans, fontWeight:500 }}>{label}</div>
        <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{sub}</div>
      </div>
      <button onClick={()=>setPrefs(p=>({...p,[field]:!p[field]}))}
        style={{ width:44, height:24, borderRadius:99, background:prefs[field]?'#C4683A':'rgba(255,255,255,0.15)', position:'relative', border:'none', cursor:'pointer', flexShrink:0, transition:'background 0.2s' }}>
        <div style={{ position:'absolute', top:3, left:prefs[field]?22:3, width:18, height:18, borderRadius:'50%', background:'white', transition:'left 0.2s' }}/>
      </button>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(170deg,#0A2A38 0%,#0D3545 100%)', paddingBottom:100 }}>
      <div style={{ background:'linear-gradient(135deg,#0D3B4A,#1A5263)', padding:'16px 16px 20px', position:'sticky', top:0, zIndex:50 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={onBack} style={{ display:'flex',alignItems:'center',gap:6,background:'rgba(255,255,255,0.08)',border:'0.5px solid rgba(255,255,255,0.15)',borderRadius:20,padding:'7px 14px 7px 10px',cursor:'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            <span style={{ fontSize:12,color:'white',fontFamily:'DM Sans,sans-serif',fontWeight:500 }}>Back</span>
          </button>
          <div style={{ fontFamily:F.serif, fontSize:24, color:'white' }}>Notifications</div>
        </div>
      </div>
      <div style={{ padding:'20px 16px' }}>
        <div style={{ fontSize:13, color:C.muted, marginBottom:20 }}>Choose which notifications you would like to receive</div>
        <div style={{ background:C.surface, border:'0.5px solid '+C.border, borderRadius:16, padding:'0 16px', marginBottom:16 }}>
          <div style={{ fontSize:11, color:C.muted, textTransform:'uppercase', letterSpacing:'0.5px', padding:'14px 0 8px' }}>Push notifications</div>
          <Toggle label="Order updates" sub="Confirmed, driver assigned, delivered" field="push_orders" />
          <Toggle label="Promotions" sub="Flash sales and offers" field="push_promos" />
        </div>
        <div style={{ background:C.surface, border:'0.5px solid '+C.border, borderRadius:16, padding:'0 16px', marginBottom:16 }}>
          <div style={{ fontSize:11, color:C.muted, textTransform:'uppercase', letterSpacing:'0.5px', padding:'14px 0 8px' }}>Email</div>
          <Toggle label="Order confirmation" sub="Receipt after every order" field="email_orders" />
          <Toggle label="Promotions" sub="Weekly deals and new products" field="email_promos" />
        </div>
        <div style={{ background:C.surface, border:'0.5px solid '+C.border, borderRadius:16, padding:'0 16px', marginBottom:20 }}>
          <div style={{ fontSize:11, color:C.muted, textTransform:'uppercase', letterSpacing:'0.5px', padding:'14px 0 8px' }}>SMS</div>
          <Toggle label="Order updates" sub="Text when driver is assigned" field="sms_orders" />
        </div>
        <button onClick={save} disabled={saving}
          style={{ width:'100%', padding:'16px', background:'#C4683A', border:'none', borderRadius:14, color:'white', fontSize:15, fontWeight:600, cursor:'pointer', fontFamily:F.sans }}>
          {saving ? 'Saving...' : 'Save preferences'}
        </button>
      </div>
    </div>
  )
}

// ── POINT 15: Scheduled delivery slot picker ─────────────────
export function ScheduledDeliverySheet({ onClose, onSchedule }) {
  const [date, setDate] = useState('')
  const [slot, setSlot] = useState('')

  const today = new Date()
  const dates = Array.from({ length:14 }, (_,i) => {
    const d = new Date(today); d.setDate(today.getDate()+i)
    return { value: d.toISOString().split('T')[0], label: i===0?'Today':i===1?'Tomorrow':d.toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'}) }
  })

  // 24/7 delivery — all hourly slots across the day and night
  const now   = new Date()
  const isToday = date === dates[0].value
  const allSlots = [
    '00:00–01:00','01:00–02:00','02:00–03:00','03:00–04:00',
    '08:00–09:00','09:00–10:00','10:00–11:00','11:00–12:00',
    '12:00–13:00','13:00–14:00','14:00–15:00','15:00–16:00',
    '16:00–17:00','17:00–18:00','18:00–19:00','19:00–20:00',
    '20:00–21:00','21:00–22:00','22:00–23:00','23:00–00:00',
  ]
  // For today filter out slots that have already passed (need 1hr lead time)
  const SLOTS = isToday
    ? allSlots.filter(s => {
        const h = parseInt(s.split(':')[0])
        return h > now.getHours() + 1 || h < 5 // late night slots always available
      })
    : allSlots

  const confirm = () => {
    if (!date || !slot) { toast.error('Please choose a date and time'); return }
    onSchedule({ date, slot, label: dates.find(d=>d.value===date)?.label + ' · ' + slot })
    onClose()
    toast.success('Delivery scheduled for ' + dates.find(d=>d.value===date)?.label + ' ' + slot)
  }

  return (
    <Sheet onClose={onClose}>
      <div style={{ padding:'16px 20px 40px' }}>
        <div style={{ fontFamily:F.serif, fontSize:22, color:'white', marginBottom:4 }}>Schedule delivery</div>
        <div style={{ fontSize:13, color:C.muted, marginBottom:20 }}>Choose a date and 1-hour delivery window</div>

        <div style={{ marginBottom:18 }}>
          <div style={{ fontSize:12, color:C.muted, marginBottom:10, textTransform:'uppercase', letterSpacing:'0.5px' }}>Date</div>
          <div style={{ display:'flex', gap:8, overflowX:'auto', scrollbarWidth:'none', paddingBottom:4 }}>
            {dates.map(d => (
              <button key={d.value} onClick={()=>setDate(d.value)}
                style={{ padding:'10px 16px', borderRadius:12, background:date===d.value?'#C4683A':'rgba(255,255,255,0.08)', border:'0.5px solid '+(date===d.value?'#C4683A':'rgba(255,255,255,0.15)'), color:'white', fontSize:13, cursor:'pointer', whiteSpace:'nowrap', fontFamily:F.sans, fontWeight:date===d.value?600:400, flexShrink:0, transition:'all 0.15s' }}>
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:12, color:C.muted, marginBottom:10, textTransform:'uppercase', letterSpacing:'0.5px' }}>Time slot</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {SLOTS.map(s => (
              <button key={s} onClick={()=>setSlot(s)}
                style={{ padding:'11px 0', borderRadius:12, background:slot===s?'#C4683A':'rgba(255,255,255,0.07)', border:'0.5px solid '+(slot===s?'#C4683A':'rgba(255,255,255,0.12)'), color:'white', fontSize:12, cursor:'pointer', fontFamily:F.sans, fontWeight:slot===s?600:400, transition:'all 0.15s' }}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <button onClick={confirm}
          style={{ width:'100%', padding:'16px', background:date&&slot?'#C4683A':'rgba(255,255,255,0.1)', border:'none', borderRadius:14, color:date&&slot?'white':'rgba(255,255,255,0.3)', fontSize:15, fontWeight:600, cursor:date&&slot?'pointer':'default', fontFamily:F.sans, transition:'all 0.2s' }}>
          Confirm delivery slot
        </button>
      </div>
    </Sheet>
  )
}
