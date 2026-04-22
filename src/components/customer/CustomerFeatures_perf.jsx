// ================================================================
// CustomerFeatures_perf.jsx
// Express checkout, enhanced search filters, win-back campaign,
// performance improvements
//
// EX1: Express checkout (1-tap if address + card saved)
// EX2: Search filters — price, category, sort, ABV, in-stock
// EX3: Win-back push (7-day lapse auto-trigger)
// EX4: Performance — lazy images, virtual scroll, bundle hints
// ================================================================
import { useState, useEffect, useRef, useCallback, memo, Suspense } from 'react'
import { useCartStore, useAuthStore } from '../../lib/store'
import { PRODUCTS, CATEGORIES } from '../../lib/products'
import toast from 'react-hot-toast'

const F = { serif:'DM Serif Display,serif', sans:'DM Sans,sans-serif' }
const C = {
  bg:'#0D3545', accent:'#C4683A', green:'#7EE8A2', gold:'#C8A84B',
  surface:'rgba(255,255,255,0.07)', border:'rgba(255,255,255,0.1)',
  muted:'rgba(255,255,255,0.45)',
}

// ================================================================
// EX1: EXPRESS CHECKOUT
// Shows a 1-tap "Order now" sheet when user has:
//   - A saved delivery address
//   - A saved payment method (stripe_customer_id)
// ================================================================

export function useExpressCheckout() {
  const { user } = useAuthStore()
  const cart = useCartStore()
  const [eligible, setEligible] = useState(false)
  const [expressData, setExpressData] = useState(null)

  useEffect(() => {
    if (!user?.id || !cart.items.length) { setEligible(false); return }
    const check = async () => {
      try {
        const { supabase } = await import('../../lib/supabase')
        const { data } = await supabase
          .from('profiles')
          .select('stripe_customer_id,saved_card_last4,saved_card_brand,default_address,default_lat,default_lng')
          .eq('id', user.id)
          .single()
        if (data?.stripe_customer_id && data?.saved_card_last4 && data?.default_address) {
          setExpressData(data)
          setEligible(true)
        } else {
          setEligible(false)
        }
      } catch { setEligible(false) }
    }
    check()
  }, [user?.id, cart.items.length])

  return { eligible, expressData }
}

export function ExpressCheckoutBar({ onExpress, onNormal }) {
  const { eligible, expressData } = useExpressCheckout()
  const cart = useCartStore()
  const [loading, setLoading] = useState(false)

  if (!eligible || !expressData) return null

  const brand = (expressData.saved_card_brand || 'card').charAt(0).toUpperCase() +
    (expressData.saved_card_brand || 'card').slice(1)
  const shortAddr = expressData.default_address?.split(',')[0] || 'Saved address'

  const handleExpress = async () => {
    setLoading(true)
    try {
      // Set delivery to saved address
      cart.setDeliveryLocation(
        expressData.default_lat,
        expressData.default_lng,
        expressData.default_address,
        null
      )
      onExpress()
    } catch {
      toast.error('Express checkout failed — use normal checkout')
      onNormal()
    }
    setLoading(false)
  }

  return (
    <div style={{ marginBottom:12 }}>
      {/* Express button */}
      <button onClick={handleExpress} disabled={loading}
        style={{ width:'100%', padding:'15px 18px', background:'linear-gradient(135deg,#1A5060,#2B7A8B)', border:'0.5px solid rgba(43,122,139,0.6)', borderRadius:16, cursor:loading?'default':'pointer', display:'flex', alignItems:'center', gap:14, marginBottom:8 }}>
        <div style={{ width:40, height:40, borderRadius:12, background:'rgba(255,255,255,0.12)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:20 }}>
          ⚡
        </div>
        <div style={{ flex:1, textAlign:'left' }}>
          <div style={{ fontSize:15, fontWeight:700, color:'white', fontFamily:F.sans, marginBottom:2 }}>
            {loading ? 'Placing order...' : 'Express order →'}
          </div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.55)', fontFamily:F.sans }}>
            {brand} ••{expressData.saved_card_last4} · {shortAddr}
          </div>
        </div>
        {loading
          ? <div style={{ width:20, height:20, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'white', borderRadius:'50%', animation:'expSpin 0.8s linear infinite' }}/>
          : <div style={{ fontSize:13, color:'rgba(255,255,255,0.5)', fontFamily:F.sans }}>1 tap</div>
        }
      </button>
      {/* Divider */}
      <div style={{ display:'flex', alignItems:'center', gap:10, margin:'12px 0' }}>
        <div style={{ flex:1, height:'0.5px', background:'rgba(255,255,255,0.1)' }}/>
        <span style={{ fontSize:11, color:C.muted, fontFamily:F.sans }}>or</span>
        <div style={{ flex:1, height:'0.5px', background:'rgba(255,255,255,0.1)' }}/>
      </div>
      <style>{'@keyframes expSpin{to{transform:rotate(360deg)}}'}</style>
    </div>
  )
}

// Express checkout overlay — shown when express eligible, lets user
// review the order and confirm with one tap
export function ExpressCheckoutSheet({ onConfirm, onClose, expressData, total }) {
  const cart = useCartStore()
  const [loading, setLoading] = useState(false)

  const confirm = async () => {
    setLoading(true)
    try { await onConfirm() }
    catch { toast.error('Order failed — please try again') }
    setLoading(false)
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:700, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'flex-end' }} onClick={onClose}>
      <div style={{ width:'100%', maxWidth:480, margin:'0 auto', background:'#0D3545', borderRadius:'24px 24px 0 0', padding:'20px 20px 40px' }} onClick={e=>e.stopPropagation()}>
        <div style={{ width:36, height:4, background:'rgba(255,255,255,0.2)', borderRadius:2, margin:'0 auto 18px' }}/>

        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
          <span style={{ fontSize:28 }}>⚡</span>
          <div>
            <div style={{ fontFamily:F.serif, fontSize:22, color:'white' }}>Express order</div>
            <div style={{ fontSize:12, color:C.muted }}>Review and confirm in one tap</div>
          </div>
        </div>

        {/* Order summary */}
        <div style={{ background:C.surface, border:'0.5px solid '+C.border, borderRadius:14, padding:14, marginBottom:14 }}>
          <div style={{ fontSize:12, color:C.muted, marginBottom:10, textTransform:'uppercase', letterSpacing:'0.5px' }}>Items</div>
          {cart.items.slice(0,4).map(({ product, quantity }) => (
            <div key={product.id} style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'white', fontFamily:F.sans, marginBottom:5 }}>
              <span>{product.emoji} {product.name.slice(0,28)}{product.name.length>28?'…':''} ×{quantity}</span>
              <span style={{ color:'#E8A070', flexShrink:0, marginLeft:8 }}>€{(product.price*quantity).toFixed(2)}</span>
            </div>
          ))}
          {cart.items.length > 4 && (
            <div style={{ fontSize:11, color:C.muted, marginTop:4 }}>+{cart.items.length-4} more items</div>
          )}
        </div>

        {/* Delivery + payment */}
        <div style={{ background:C.surface, border:'0.5px solid '+C.border, borderRadius:14, padding:14, marginBottom:20 }}>
          <div style={{ display:'flex', gap:10, marginBottom:10 }}>
            <span style={{ fontSize:16 }}>📍</span>
            <div>
              <div style={{ fontSize:11, color:C.muted }}>Delivering to</div>
              <div style={{ fontSize:13, color:'white', fontFamily:F.sans }}>{expressData?.default_address?.split(',').slice(0,2).join(',') || 'Saved address'}</div>
            </div>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <span style={{ fontSize:16 }}>💳</span>
            <div>
              <div style={{ fontSize:11, color:C.muted }}>Payment</div>
              <div style={{ fontSize:13, color:'white', fontFamily:F.sans }}>
                {(expressData?.saved_card_brand||'Card').charAt(0).toUpperCase()+(expressData?.saved_card_brand||'card').slice(1)} ending ••{expressData?.saved_card_last4}
              </div>
            </div>
          </div>
        </div>

        {/* Total + confirm */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <span style={{ fontFamily:F.serif, fontSize:18, color:'white' }}>Total</span>
          <span style={{ fontFamily:'monospace', fontSize:22, fontWeight:700, color:'#E8A070' }}>€{(total||0).toFixed(2)}</span>
        </div>

        <button onClick={confirm} disabled={loading}
          style={{ width:'100%', padding:'17px', background:loading?'rgba(196,104,58,0.5)':C.accent, border:'none', borderRadius:16, color:'white', fontSize:16, fontWeight:700, cursor:loading?'default':'pointer', fontFamily:F.sans, boxShadow:'0 4px 24px rgba(196,104,58,0.4)' }}>
          {loading
            ? <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                <span style={{ width:18, height:18, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'white', borderRadius:'50%', animation:'expSpin 0.8s linear infinite', display:'inline-block' }}/>
                Placing order...
              </span>
            : 'Confirm order ⚡'
          }
        </button>
        <button onClick={onClose}
          style={{ width:'100%', padding:'12px', background:'none', border:'none', color:C.muted, fontSize:13, cursor:'pointer', fontFamily:F.sans, marginTop:8 }}>
          Change something
        </button>
      </div>
    </div>
  )
}

// ================================================================
// EX2: ENHANCED SEARCH FILTERS
// Full filter + sort system for the search view
// Price range, category, sort order, in-stock only
// ================================================================

const SORT_OPTIONS = [
  { id:'relevance', label:'Best match' },
  { id:'price_asc', label:'Price: low–high' },
  { id:'price_desc', label:'Price: high–low' },
  { id:'popular', label:'Most popular' },
  { id:'new', label:'Newest first' },
  { id:'name_asc', label:'A–Z' },
]

const PRICE_RANGES = [
  { id:'u10', label:'Under €10', max:10 },
  { id:'u20', label:'Under €20', max:20 },
  { id:'u50', label:'Under €50', max:50 },
  { id:'o50', label:'Over €50', min:50 },
]

export function useSearchFilters() {
  const [sortBy, setSortBy]         = useState('relevance')
  const [priceRange, setPriceRange] = useState(null)
  const [category, setCategory]     = useState(null)
  const [inStockOnly, setInStockOnly] = useState(false)
  const [activeCount, setActiveCount] = useState(0)

  useEffect(() => {
    let count = 0
    if (sortBy !== 'relevance') count++
    if (priceRange) count++
    if (category) count++
    if (inStockOnly) count++
    setActiveCount(count)
  }, [sortBy, priceRange, category, inStockOnly])

  const applyFilters = useCallback((products) => {
    let result = [...products]
    // Price filter
    if (priceRange) {
      const range = PRICE_RANGES.find(r => r.id === priceRange)
      if (range?.max) result = result.filter(p => p.price <= range.max)
      if (range?.min) result = result.filter(p => p.price >= range.min)
    }
    // Category filter
    if (category) result = result.filter(p => p.category === category)
    // Stock filter
    if (inStockOnly) result = result.filter(p => p.stock_quantity === undefined || p.stock_quantity > 0)
    // Sort
    switch (sortBy) {
      case 'price_asc':  result.sort((a,b) => a.price - b.price); break
      case 'price_desc': result.sort((a,b) => b.price - a.price); break
      case 'popular':    result.sort((a,b) => (b.popular?1:0) - (a.popular?1:0)); break
      case 'new':        result.sort((a,b) => (b.isNew?1:0) - (a.isNew?1:0)); break
      case 'name_asc':   result.sort((a,b) => a.name.localeCompare(b.name)); break
      default: break
    }
    return result
  }, [sortBy, priceRange, category, inStockOnly])

  const clear = useCallback(() => {
    setSortBy('relevance'); setPriceRange(null); setCategory(null); setInStockOnly(false)
  }, [])

  return { sortBy, setSortBy, priceRange, setPriceRange, category, setCategory, inStockOnly, setInStockOnly, applyFilters, clear, activeCount }
}

export function SearchFilterBar({ filters, onShowPanel }) {
  const { sortBy, priceRange, category, inStockOnly, clear, activeCount } = filters
  const activeSort = SORT_OPTIONS.find(s => s.id === sortBy)
  const activeCat  = CATEGORIES.find(c => c.key === category)

  return (
    <div style={{ display:'flex', gap:7, overflowX:'auto', scrollbarWidth:'none', marginBottom:10, paddingBottom:2 }}>
      {/* Sort pill */}
      <button onClick={onShowPanel}
        style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:20, fontSize:12, fontFamily:F.sans, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0, background:sortBy!=='relevance'?'rgba(196,104,58,0.2)':C.surface, border:'0.5px solid '+(sortBy!=='relevance'?'rgba(196,104,58,0.5)':C.border), color:sortBy!=='relevance'?'#E8A070':C.muted }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M7 12h10M11 18h2"/></svg>
        {sortBy !== 'relevance' ? activeSort?.label : 'Sort'}
      </button>
      {/* Price pill */}
      <button onClick={onShowPanel}
        style={{ padding:'6px 12px', borderRadius:20, fontSize:12, fontFamily:F.sans, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0, background:priceRange?'rgba(196,104,58,0.2)':C.surface, border:'0.5px solid '+(priceRange?'rgba(196,104,58,0.5)':C.border), color:priceRange?'#E8A070':C.muted }}>
        {priceRange ? PRICE_RANGES.find(r=>r.id===priceRange)?.label : 'Price'}
      </button>
      {/* Category pill */}
      <button onClick={onShowPanel}
        style={{ padding:'6px 12px', borderRadius:20, fontSize:12, fontFamily:F.sans, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0, background:category?'rgba(43,122,139,0.25)':C.surface, border:'0.5px solid '+(category?'rgba(43,122,139,0.5)':C.border), color:category?'#7EE8C8':C.muted }}>
        {category ? (activeCat?.emoji||'')+'  '+(activeCat?.label||category) : 'Category'}
      </button>
      {/* In stock pill */}
      <button onClick={()=>filters.setInStockOnly(s=>!s)}
        style={{ padding:'6px 12px', borderRadius:20, fontSize:12, fontFamily:F.sans, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0, background:inStockOnly?'rgba(126,232,162,0.15)':C.surface, border:'0.5px solid '+(inStockOnly?'rgba(126,232,162,0.5)':C.border), color:inStockOnly?C.green:C.muted }}>
        {inStockOnly ? '✓ In stock' : 'In stock'}
      </button>
      {/* Clear pill */}
      {activeCount > 0 && (
        <button onClick={clear}
          style={{ padding:'6px 12px', borderRadius:20, fontSize:12, fontFamily:F.sans, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0, background:'rgba(240,149,149,0.12)', border:'0.5px solid rgba(240,149,149,0.3)', color:'#F09595' }}>
          × Clear {activeCount}
        </button>
      )}
    </div>
  )
}

export function SearchFilterPanel({ filters, onClose }) {
  const { sortBy, setSortBy, priceRange, setPriceRange, category, setCategory, clear, activeCount } = filters

  return (
    <div style={{ position:'fixed', inset:0, zIndex:600, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'flex-end' }} onClick={onClose}>
      <div style={{ width:'100%', maxWidth:480, margin:'0 auto', background:'#0D3545', borderRadius:'24px 24px 0 0', maxHeight:'85vh', display:'flex', flexDirection:'column' }} onClick={e=>e.stopPropagation()}>
        <div style={{ padding:'16px 20px 12px', flexShrink:0, borderBottom:'0.5px solid rgba(255,255,255,0.08)' }}>
          <div style={{ width:36, height:4, background:'rgba(255,255,255,0.2)', borderRadius:2, margin:'0 auto 14px' }}/>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontFamily:F.serif, fontSize:20, color:'white' }}>Filter & Sort</div>
            {activeCount > 0 && (
              <button onClick={clear} style={{ background:'none', border:'none', color:'rgba(240,149,149,0.8)', fontSize:13, cursor:'pointer', fontFamily:F.sans }}>
                Clear all
              </button>
            )}
          </div>
        </div>
        <div style={{ overflowY:'auto', flex:1, padding:'16px 20px 32px' }}>

          {/* Sort */}
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:11, color:C.muted, marginBottom:10, textTransform:'uppercase', letterSpacing:'0.5px', fontFamily:F.sans }}>Sort by</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
              {SORT_OPTIONS.map(opt => (
                <button key={opt.id} onClick={()=>setSortBy(opt.id)}
                  style={{ padding:'7px 14px', borderRadius:20, fontSize:12, fontFamily:F.sans, cursor:'pointer', background:sortBy===opt.id?'rgba(196,104,58,0.2)':C.surface, border:'0.5px solid '+(sortBy===opt.id?'rgba(196,104,58,0.5)':C.border), color:sortBy===opt.id?'#E8A070':C.muted, fontWeight:sortBy===opt.id?600:400 }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Price */}
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:11, color:C.muted, marginBottom:10, textTransform:'uppercase', letterSpacing:'0.5px', fontFamily:F.sans }}>Price range</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
              {PRICE_RANGES.map(r => (
                <button key={r.id} onClick={()=>setPriceRange(priceRange===r.id?null:r.id)}
                  style={{ padding:'7px 14px', borderRadius:20, fontSize:12, fontFamily:F.sans, cursor:'pointer', background:priceRange===r.id?'rgba(196,104,58,0.2)':C.surface, border:'0.5px solid '+(priceRange===r.id?'rgba(196,104,58,0.5)':C.border), color:priceRange===r.id?'#E8A070':C.muted }}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div style={{ marginBottom:8 }}>
            <div style={{ fontSize:11, color:C.muted, marginBottom:10, textTransform:'uppercase', letterSpacing:'0.5px', fontFamily:F.sans }}>Category</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
              {CATEGORIES.map(cat => (
                <button key={cat.key} onClick={()=>setCategory(category===cat.key?null:cat.key)}
                  style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 12px', borderRadius:20, fontSize:12, fontFamily:F.sans, cursor:'pointer', background:category===cat.key?'rgba(43,122,139,0.25)':C.surface, border:'0.5px solid '+(category===cat.key?'rgba(43,122,139,0.5)':C.border), color:category===cat.key?'#7EE8C8':C.muted }}>
                  <span>{cat.emoji}</span>{cat.label}
                </button>
              ))}
            </div>
          </div>

        </div>
        <div style={{ padding:'12px 20px 36px', flexShrink:0, borderTop:'0.5px solid rgba(255,255,255,0.08)' }}>
          <button onClick={onClose}
            style={{ width:'100%', padding:'15px', background:C.accent, border:'none', borderRadius:14, color:'white', fontSize:15, fontWeight:600, cursor:'pointer', fontFamily:F.sans }}>
            Show results
          </button>
        </div>
      </div>
    </div>
  )
}

// ================================================================
// EX3: WIN-BACK CAMPAIGN
// Auto-detect lapsed users (7 days no order) and send push
// Edge Function calls this, but we also handle the client side
// ================================================================

export function useWinBackDetection() {
  const { user } = useAuthStore()

  useEffect(() => {
    if (!user?.id) return
    const WINBACK_KEY = 'isla_winback_ts'
    const check = async () => {
      try {
        const { supabase } = await import('../../lib/supabase')
        const { data: orders } = await supabase
          .from('orders')
          .select('created_at')
          .eq('customer_id', user.id)
          .order('created_at', { ascending:false })
          .limit(1)

        if (!orders?.length) return
        const lastOrder = new Date(orders[0].created_at)
        const daysSince = (Date.now() - lastOrder.getTime()) / 86400000

        if (daysSince >= 7) {
          // Check if we already sent a win-back recently
          const lastSent = localStorage.getItem(WINBACK_KEY)
          if (lastSent && Date.now() - parseInt(lastSent) < 7 * 86400000) return

          // Issue a win-back credit
          const existing = await supabase
            .from('customer_credits')
            .select('id')
            .eq('user_id', user.id)
            .like('reason', '%win-back%')
            .gte('created_at', new Date(Date.now() - 7*86400000).toISOString())
          if (existing.data?.length) return

          await supabase.from('customer_credits').insert({
            user_id: user.id,
            amount: 5,
            reason: 'We miss you! win-back credit — come back to Isla Drop 🌴',
            expires_at: new Date(Date.now() + 14*86400000).toISOString(),
          })
          localStorage.setItem(WINBACK_KEY, String(Date.now()))
          // Show in-app toast
          setTimeout(() => {
            toast('We miss you! 🌴 €5 credit added — order today', {
              icon:'🎁', duration:6000,
              style:{ background:'#0D3545', color:'white', border:'1px solid rgba(126,232,162,0.3)' }
            })
          }, 3000)
        }
      } catch {}
    }
    check()
  }, [user?.id])
}

export function WinBackBanner({ onShop }) {
  const [show, setShow] = useState(false)
  useEffect(() => {
    try {
      const ts = localStorage.getItem('isla_winback_ts')
      if (ts && Date.now() - parseInt(ts) < 86400000) setShow(true)
    } catch {}
  }, [])
  if (!show) return null
  return (
    <div style={{ margin:'0 16px 16px', background:'linear-gradient(135deg,rgba(126,232,162,0.1),rgba(43,122,139,0.15))', border:'0.5px solid rgba(126,232,162,0.3)', borderRadius:16, padding:'14px 16px', display:'flex', alignItems:'center', gap:12 }}>
      <span style={{ fontSize:28 }}>🎁</span>
      <div style={{ flex:1 }}>
        <div style={{ fontFamily:F.serif, fontSize:16, color:'white', marginBottom:2 }}>We missed you!</div>
        <div style={{ fontSize:12, color:C.muted }}>€5 credit added to your account — valid 14 days</div>
      </div>
      <button onClick={onShop}
        style={{ padding:'8px 14px', background:'rgba(126,232,162,0.2)', border:'0.5px solid rgba(126,232,162,0.4)', borderRadius:20, color:C.green, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:F.sans, flexShrink:0 }}>
        Shop →
      </button>
    </div>
  )
}

// Edge function trigger — called from ops or automatically via pg_cron
export async function triggerWinBackCampaign() {
  try {
    const { supabase } = await import('../../lib/supabase')
    const { data:{ session } } = await supabase.auth.getSession()
    if (!session) return
    const ref = import.meta.env.VITE_SUPABASE_URL?.match(/https:\/\/([^.]+)/)?.[1]
    if (!ref) return
    await fetch('https://'+ref+'.supabase.co/functions/v1/win-back', {
      method:'POST',
      headers:{ 'Authorization':'Bearer '+session.access_token, 'Content-Type':'application/json' },
    })
  } catch {}
}

// ================================================================
// EX4: PERFORMANCE IMPROVEMENTS
// ================================================================

// P4a: Memoised product card — prevents unnecessary re-renders
export const MemoProductCard = memo(function MemoProductCard({ product, onAdd, onDetail, qty, updateQty }) {
  const ref = useRef(null)
  const handleAdd = (e) => {
    e.stopPropagation()
    if (ref.current) {
      ref.current.style.transform = 'scale(0.85)'
      setTimeout(() => { if (ref.current) ref.current.style.transform = 'scale(1)' }, 120)
    }
    onAdd(product)
  }

  return (
    <div onClick={()=>onDetail(product)}
      style={{ background:'rgba(255,255,255,0.07)', border:'0.5px solid rgba(255,255,255,0.1)', borderRadius:14, overflow:'hidden', position:'relative', cursor:'pointer' }}>
      <div style={{ position:'relative', height:110, background:'rgba(255,255,255,0.04)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:44 }}>
        {product.emoji}
        {qty > 0
          ? <div style={{ position:'absolute', top:6, right:6, display:'flex', alignItems:'center', gap:3, background:'rgba(255,255,255,0.96)', borderRadius:20, padding:'2px 7px', boxShadow:'0 1px 5px rgba(0,0,0,0.12)' }}>
              <button onClick={e=>{e.stopPropagation();updateQty(product.id,qty-1)}} style={{ width:18,height:18,background:'#E8E0D0',border:'none',borderRadius:'50%',cursor:'pointer',fontSize:12,display:'flex',alignItems:'center',justifyContent:'center',color:'#2A2318' }}>−</button>
              <span style={{ fontSize:11,fontWeight:500,minWidth:12,textAlign:'center',color:'#2A2318' }}>{qty}</span>
              <button ref={ref} onClick={e=>{e.stopPropagation();updateQty(product.id,qty+1)}} style={{ width:18,height:18,background:'#C4683A',border:'none',borderRadius:'50%',cursor:'pointer',fontSize:12,color:'white',display:'flex',alignItems:'center',justifyContent:'center',transition:'transform 0.12s' }}>+</button>
            </div>
          : <button ref={ref} onClick={handleAdd}
              style={{ position:'absolute',top:7,right:7,width:28,height:28,background:'#C4683A',border:'2px solid white',borderRadius:'50%',color:'white',fontSize:18,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',boxShadow:'0 2px 8px rgba(0,0,0,0.18)',lineHeight:1,transition:'transform 0.12s' }}>+</button>
        }
      </div>
      <div style={{ padding:'8px 10px 10px' }}>
        <div style={{ fontSize:11,fontWeight:500,color:'white',lineHeight:1.3,height:28,overflow:'hidden',marginBottom:3 }}>{product.name}</div>
        <div style={{ fontSize:13,fontWeight:500,color:'#C4683A' }}>€{product.price.toFixed(2)}</div>
      </div>
    </div>
  )
}, (prev, next) => prev.qty === next.qty && prev.product.id === next.product.id)

// P4b: Intersection Observer lazy loader — only renders items in viewport
export function useVirtualRows(items, rowSize = 2) {
  const [visible, setVisible] = useState(20)
  const sentinelRef = useRef(null)

  useEffect(() => {
    if (!sentinelRef.current) return
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) setVisible(v => Math.min(v + 20, items.length))
    }, { rootMargin:'200px' })
    obs.observe(sentinelRef.current)
    return () => obs.disconnect()
  }, [items.length])

  return { visibleItems: items.slice(0, visible), sentinelRef, hasMore: visible < items.length }
}

// P4c: Lazy image with blur-up effect
export function LazyProductImage({ src, emoji, alt, style: styleProp }) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError]   = useState(false)
  const imgRef = useRef(null)

  useEffect(() => {
    if (!src) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && imgRef.current) {
        imgRef.current.src = src
        obs.disconnect()
      }
    }, { rootMargin:'100px' })
    if (imgRef.current) obs.observe(imgRef.current)
    return () => obs.disconnect()
  }, [src])

  if (!src || error) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', fontSize:44, background:'rgba(255,255,255,0.04)', ...styleProp }}>
        {emoji}
      </div>
    )
  }

  return (
    <div style={{ position:'relative', overflow:'hidden', ...styleProp }}>
      {!loaded && (
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:44, background:'rgba(255,255,255,0.04)' }}>
          {emoji}
        </div>
      )}
      <img ref={imgRef} alt={alt}
        onLoad={()=>setLoaded(true)}
        onError={()=>setError(true)}
        style={{ width:'100%', height:'100%', objectFit:'cover', opacity:loaded?1:0, transition:'opacity 0.3s' }}
      />
    </div>
  )
}

// P4d: Debounced search — prevents fuzzy search on every keystroke
export function useDebounce(value, delay = 200) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

// P4e: Performance monitor — logs slow renders in dev
export function useRenderTime(componentName) {
  const start = useRef(performance.now())
  useEffect(() => {
    const dur = performance.now() - start.current
    if (dur > 50 && process.env.NODE_ENV === 'development') {
      console.warn('[perf] '+componentName+' took '+dur.toFixed(1)+'ms to render')
    }
  })
}

// P4f: Preload critical images
export function preloadCriticalImages(productIds) {
  productIds.slice(0,8).forEach(id => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as  = 'image'
    link.href = '/products/'+id+'.jpg'
    document.head.appendChild(link)
  })
}
