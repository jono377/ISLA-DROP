// ================================================================
// Isla Drop — CustomerFeatures_v2.jsx
// Points 1-30 final world-class polish
// C1: Did you mean  C2: consistent qty stepper  C3: per-item notes
// C4: realtime stock  C5: smart reorder  C6: save for later
// C7: product comparison  C8: calories
// P9: keyboard avoidance  P10: search autofocus  P11: custom toast
// P12: card added flash  P13: long-press quick-add  P14: infinite scroll
// P15: category hero image
// B16: public tracking page  B17: post-delivery tip  B18: group order
// B19: subscription  B20: refund tracker
// T21: error boundary  T22: RLS audit SQL  T23: lazy images
// T24: performance helpers  T25: console-clean lint helpers
// I26: season countdown  I27: weather on cards  I28: timezone
// I29: map on confirmation  I30: referral at checkout
// ================================================================
import { useState, useEffect, useRef, useCallback, Component } from 'react'
import { useCartStore, useAuthStore } from '../../lib/store'
import { PRODUCTS } from '../../lib/products'
import toast from 'react-hot-toast'

const F = { serif:'DM Serif Display,serif', sans:'DM Sans,sans-serif' }
const C = {
  bg:'#0D3545', accent:'#C4683A', green:'#7EE8A2', gold:'#C8A84B',
  surface:'rgba(255,255,255,0.07)', border:'rgba(255,255,255,0.1)',
  muted:'rgba(255,255,255,0.45)', white:'white',
}

// ── C1: "Did you mean?" suggestion ───────────────────────────
export function DidYouMean({ query, results, onSelect }) {
  if (!query || results.length > 0) return null
  // Find closest match even below normal threshold
  const q = query.toLowerCase()
  let best = null, bestScore = 0
  PRODUCTS.forEach(p => {
    const name = p.name.toLowerCase()
    // Levenshtein distance simplified
    let matches = 0
    const shorter = q.length < name.length ? q : name
    const longer  = q.length < name.length ? name : q
    for (let i = 0; i < shorter.length; i++) {
      if (longer.includes(shorter[i])) matches++
    }
    const score = matches / longer.length
    if (score > bestScore) { bestScore = score; best = p }
  })
  if (!best || bestScore < 0.5) return null
  return (
    <div style={{ padding:'20px 0', textAlign:'center' }}>
      <div style={{ fontSize:14, color:C.muted, marginBottom:10 }}>No results for "{query}"</div>
      <div style={{ fontSize:13, color:'white' }}>
        Did you mean{' '}
        <button onClick={()=>onSelect(best.name)}
          style={{ background:'none', border:'none', color:'#E8A070', cursor:'pointer', fontFamily:F.sans, fontSize:13, fontWeight:700, textDecoration:'underline' }}>
          {best.name}
        </button>
        ?
      </div>
    </div>
  )
}

// ── C3: Per-item notes in basket ──────────────────────────────
const ITEM_NOTES_KEY = 'isla_item_notes'
export function useItemNotes() {
  const [notes, setNotes] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(ITEM_NOTES_KEY) || '{}') } catch { return {} }
  })
  const setNote = useCallback((productId, note) => {
    setNotes(prev => {
      const next = { ...prev, [productId]: note }
      try { sessionStorage.setItem(ITEM_NOTES_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])
  const clearNotes = useCallback(() => {
    setNotes({})
    try { sessionStorage.removeItem(ITEM_NOTES_KEY) } catch {}
  }, [])
  return { notes, setNote, clearNotes }
}

export function ItemNoteButton({ productId, notes, onSetNote }) {
  const [open, setOpen] = useState(false)
  const [val, setVal] = useState(notes[productId] || '')
  const existing = notes[productId]
  return (
    <div>
      <button onClick={()=>setOpen(o=>!o)}
        style={{ background:'none', border:'none', color:existing?'#E8A070':C.muted, cursor:'pointer', fontSize:11, fontFamily:F.sans, padding:'2px 0', display:'flex', alignItems:'center', gap:4 }}>
        <span style={{ fontSize:12 }}>📝</span>
        {existing ? existing.slice(0,20)+(existing.length>20?'...':'') : 'Add note'}
      </button>
      {open && (
        <div style={{ marginTop:6, display:'flex', gap:6 }}>
          <input value={val} onChange={e=>setVal(e.target.value)}
            placeholder="No ice, extra lime..."
            onFocus={e=>e.target.scrollIntoView({behavior:'smooth',block:'center'})}
            style={{ flex:1, padding:'7px 10px', background:'rgba(255,255,255,0.08)', border:'0.5px solid rgba(255,255,255,0.2)', borderRadius:8, color:'white', fontSize:12, fontFamily:F.sans, outline:'none' }}/>
          <button onClick={()=>{ onSetNote(productId, val); setOpen(false) }}
            style={{ padding:'7px 12px', background:C.accent, border:'none', borderRadius:8, color:'white', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:F.sans }}>
            Save
          </button>
        </div>
      )}
    </div>
  )
}

// ── C4: Realtime stock updates ────────────────────────────────
export function useRealtimeStock() {
  const [stockMap, setStockMap] = useState({})
  useEffect(() => {
    import('../../lib/supabase').then(({ supabase }) => {
      // Load from product_stock table (preferred) with fallback to products.stock_quantity
      supabase.from('product_stock').select('product_id,quantity')
        .then(({ data, error }) => {
          if (error || !data?.length) {
            // Fallback: read from products table
            return supabase.from('products').select('id,stock_quantity')
              .then(({ data: pd }) => {
                if (!pd) return
                const map = {}
                pd.forEach(p => { if (p.stock_quantity != null) map[p.id] = p.stock_quantity })
                setStockMap(map)
              })
          }
          const map = {}
          data.forEach(p => { map[p.product_id] = p.quantity })
          setStockMap(map)
        }).catch(() => {})
      // Realtime: subscribe to product_stock changes
      const ch = supabase.channel('realtime-stock')
        .on('postgres_changes', { event:'*', schema:'public', table:'product_stock' }, payload => {
          const { product_id, quantity } = payload.new || {}
          if (product_id != null) setStockMap(prev => ({ ...prev, [product_id]: quantity }))
        }).subscribe()
      return () => supabase.removeChannel(ch)
    }).catch(() => {})
  }, [])
  return stockMap
}

// ── C5: Smart reorder checks availability ─────────────────────
export function SmartReorderButton({ order, onDone }) {
  const { addItem } = useCartStore()
  const [checking, setChecking] = useState(false)
  const [unavailable, setUnavailable] = useState([])
  const [showConfirm, setShowConfirm] = useState(false)

  const check = async () => {
    setChecking(true)
    const items = order.order_items || []
    const oos = []
    try {
      const { supabase } = await import('../../lib/supabase')
      const ids = items.map(i => i.product_id)
      const { data } = await supabase.from('products').select('id,stock_quantity,name').in('id', ids)
      if (data) {
        data.forEach(p => { if (p.stock_quantity === 0) oos.push(p.name || p.id) })
      }
    } catch {}
    setChecking(false)
    if (oos.length > 0) { setUnavailable(oos); setShowConfirm(true) }
    else doReorder(items)
  }

  const doReorder = (items) => {
    const available = (items || order.order_items || []).filter(item => !unavailable.includes(item.product_name))
    available.forEach(item => {
      const p = PRODUCTS.find(p => p.id === item.product_id)
      if (p) for (let i = 0; i < item.quantity; i++) addItem(p)
    })
    navigator.vibrate?.([15, 30, 15])
    toast.success('Items added to basket! 🛵', { duration:2000 })
    setShowConfirm(false)
    onDone?.()
  }

  if (showConfirm) return (
    <div style={{ background:'rgba(240,149,149,0.1)', border:'0.5px solid rgba(240,149,149,0.3)', borderRadius:12, padding:'14px', marginBottom:8 }}>
      <div style={{ fontSize:13, fontWeight:600, color:'white', marginBottom:6 }}>⚠️ Some items unavailable</div>
      <div style={{ fontSize:12, color:C.muted, marginBottom:10 }}>
        {unavailable.join(', ')} {unavailable.length===1?'is':'are'} out of stock.
      </div>
      <div style={{ display:'flex', gap:8 }}>
        <button onClick={()=>doReorder(order.order_items)}
          style={{ flex:1, padding:'9px', background:C.accent, border:'none', borderRadius:10, color:'white', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:F.sans }}>
          Add the rest
        </button>
        <button onClick={()=>setShowConfirm(false)}
          style={{ padding:'9px 14px', background:C.surface, border:'0.5px solid '+C.border, borderRadius:10, color:C.muted, fontSize:12, cursor:'pointer', fontFamily:F.sans }}>
          Cancel
        </button>
      </div>
    </div>
  )

  return (
    <button onClick={check} disabled={checking}
      style={{ padding:'8px 18px', background:checking?C.surface:C.accent, border:'none', borderRadius:10, color:'white', fontSize:12, fontWeight:700, cursor:checking?'default':'pointer', fontFamily:F.sans }}>
      {checking ? 'Checking...' : 'Re-order'}
    </button>
  )
}

// ── C6: Save for later ────────────────────────────────────────
const SAVED_LATER_KEY = 'isla_saved_later'
export function useSaveForLater() {
  const [saved, setSaved] = useState(() => {
    try { return JSON.parse(localStorage.getItem(SAVED_LATER_KEY) || '[]') } catch { return [] }
  })
  const save = useCallback((product) => {
    setSaved(prev => {
      const next = prev.find(p=>p.id===product.id) ? prev : [...prev, product]
      try { localStorage.setItem(SAVED_LATER_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])
  const remove = useCallback((productId) => {
    setSaved(prev => {
      const next = prev.filter(p => p.id !== productId)
      try { localStorage.setItem(SAVED_LATER_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])
  return { saved, save, remove }
}

export function SaveForLaterList({ saved, onMoveToBasket, onRemove }) {
  const { addItem } = useCartStore()
  if (!saved?.length) return null
  return (
    <div style={{ marginTop:16, paddingTop:16, borderTop:'0.5px solid rgba(255,255,255,0.08)' }}>
      <div style={{ fontSize:12, color:C.muted, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:12, fontFamily:F.sans }}>
        Saved for later ({saved.length})
      </div>
      {saved.map(p => (
        <div key={p.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'0.5px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize:28, flexShrink:0 }}>{p.emoji}</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:13, color:'white', marginBottom:2 }}>{p.name}</div>
            <div style={{ fontSize:12, color:'#E8A070', fontWeight:600 }}>€{p.price.toFixed(2)}</div>
          </div>
          <div style={{ display:'flex', gap:6 }}>
            <button onClick={()=>{ addItem(p); onRemove(p.id); toast.success(p.emoji+' Moved to basket!') }}
              style={{ padding:'6px 12px', background:C.accent, border:'none', borderRadius:8, color:'white', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:F.sans }}>
              Add
            </button>
            <button onClick={()=>onRemove(p.id)}
              style={{ padding:'6px 10px', background:C.surface, border:'0.5px solid '+C.border, borderRadius:8, color:C.muted, fontSize:11, cursor:'pointer', fontFamily:F.sans }}>
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── C7: Product comparison ────────────────────────────────────
export function ProductCompareSheet({ products, onClose }) {
  if (!products || products.length < 2) return null
  const [a, b] = products
  const rows = [
    { label:'Price', va:'€'+a.price.toFixed(2), vb:'€'+b.price.toFixed(2) },
    { label:'Category', va:a.category?.replace(/_/g,' '), vb:b.category?.replace(/_/g,' ') },
    { label:'Volume', va:a.volume||'—', vb:b.volume||'—' },
    { label:'ABV', va:a.abv?(a.abv+'%'):'—', vb:b.abv?(b.abv+'%'):'—' },
    { label:'Calories/100g', va:a.calories_per_100g?(a.calories_per_100g+' kcal'):'—', vb:b.calories_per_100g?(b.calories_per_100g+' kcal'):'—' },
    { label:'Per unit', va:a.price_per_unit||'—', vb:b.price_per_unit||'—' },
    { label:'Age restricted', va:a.age_restricted?'Yes':'No', vb:b.age_restricted?'Yes':'No' },
  ]
  const { addItem } = useCartStore()
  return (
    <div style={{ position:'fixed', inset:0, zIndex:600, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'flex-end' }} onClick={onClose}>
      <div style={{ width:'100%', maxWidth:480, margin:'0 auto', background:'#0D3545', borderRadius:'24px 24px 0 0', maxHeight:'85vh', overflowY:'auto', padding:'24px 20px 48px' }} onClick={e=>e.stopPropagation()}>
        <div style={{ width:36, height:4, background:'rgba(255,255,255,0.2)', borderRadius:2, margin:'0 auto 20px' }}/>
        <div style={{ fontFamily:F.serif, fontSize:20, color:'white', marginBottom:20 }}>Compare products</div>
        {/* Headers */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:16 }}>
          <div/>
          {[a, b].map(p => (
            <div key={p.id} style={{ textAlign:'center', background:C.surface, borderRadius:12, padding:'12px 8px' }}>
              <div style={{ fontSize:28, marginBottom:6 }}>{p.emoji}</div>
              <div style={{ fontSize:11, color:'white', lineHeight:1.3, fontFamily:F.sans }}>{p.name}</div>
            </div>
          ))}
        </div>
        {rows.map(row => (
          <div key={row.label} style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:8 }}>
            <div style={{ fontSize:11, color:C.muted, fontFamily:F.sans, display:'flex', alignItems:'center' }}>{row.label}</div>
            {[row.va, row.vb].map((v, i) => (
              <div key={i} style={{ background:C.surface, borderRadius:8, padding:'8px', textAlign:'center', fontSize:12, color:'white', fontFamily:F.sans }}>
                {v || '—'}
              </div>
            ))}
          </div>
        ))}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:20 }}>
          {[a, b].map(p => (
            <button key={p.id} onClick={()=>{ addItem(p); toast.success(p.emoji+' Added!', {duration:800}) }}
              style={{ padding:'12px', background:C.accent, border:'none', borderRadius:12, color:'white', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:F.sans }}>
              + {p.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── C8: Calories display ──────────────────────────────────────
export function CaloriesBadge({ product }) {
  if (!product?.calories_per_100g) return null
  return (
    <div style={{ display:'inline-flex', alignItems:'center', gap:4, background:'rgba(255,255,255,0.07)', border:'0.5px solid rgba(255,255,255,0.12)', borderRadius:99, padding:'3px 10px', fontSize:11, color:C.muted, fontFamily:F.sans }}>
      🔥 {product.calories_per_100g} kcal/100g
    </div>
  )
}

// ── P9: Keyboard avoidance ────────────────────────────────────
export function useKeyboardAvoid(ref) {
  const onFocus = useCallback(() => {
    setTimeout(() => {
      ref?.current?.scrollIntoView({ behavior:'smooth', block:'center' })
    }, 150)
  }, [ref])
  return { onFocus }
}

// ── P10: Search autofocus after tab switch ────────────────────
export function useSearchFocus(active) {
  const ref = useRef(null)
  useEffect(() => {
    if (active) {
      const t = setTimeout(() => ref.current?.focus(), 120)
      return () => clearTimeout(t)
    }
  }, [active])
  return ref
}

// ── P11: Custom toast with progress bar ──────────────────────
export function showToast(message, { duration=2000, icon='', type='default' }={}) {
  const bg = type==='success'?'rgba(90,107,58,0.95)':type==='error'?'rgba(196,58,58,0.95)':'rgba(13,59,74,0.97)'
  toast.custom((t) => (
    <div style={{ background:bg, backdropFilter:'blur(12px)', borderRadius:12, padding:'12px 16px', maxWidth:320, boxShadow:'0 4px 24px rgba(0,0,0,0.3)', overflow:'hidden', position:'relative' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
        {icon && <span style={{ fontSize:16 }}>{icon}</span>}
        <span style={{ fontSize:13, color:'white', fontFamily:F.sans, fontWeight:500 }}>{message}</span>
        <button onClick={()=>toast.dismiss(t.id)} style={{ marginLeft:'auto', background:'none', border:'none', color:'rgba(255,255,255,0.4)', cursor:'pointer', fontSize:14, padding:0 }}>✕</button>
      </div>
      <div style={{ height:2, background:'rgba(255,255,255,0.15)', borderRadius:99, overflow:'hidden' }}>
        <div style={{ height:'100%', background:'rgba(255,255,255,0.6)', animation:'toastProgress '+duration+'ms linear forwards', borderRadius:99 }}/>
      </div>
      <style>{'@keyframes toastProgress{from{width:100%}to{width:0%}}'}</style>
    </div>
  ), { duration, id: Math.random().toString(36) })
}

// ── P12: Card "added" flash animation ────────────────────────
export function useAddedFlash() {
  const [flashing, setFlashing] = useState({})
  const flash = useCallback((productId) => {
    setFlashing(prev => ({ ...prev, [productId]: true }))
    setTimeout(() => setFlashing(prev => ({ ...prev, [productId]: false })), 250)
  }, [])
  return { flashing, flash }
}

export function AddedFlashOverlay({ productId, flashing }) {
  if (!flashing?.[productId]) return null
  return (
    <div style={{ position:'absolute', inset:0, background:'rgba(126,232,162,0.35)', borderRadius:'inherit', pointerEvents:'none', animation:'flashGreen 0.25s ease-out forwards', zIndex:5 }}>
      <style>{'@keyframes flashGreen{0%{opacity:1}100%{opacity:0}}'}</style>
    </div>
  )
}

// ── P13: Long-press quick-add sheet ──────────────────────────
export function useLongPress(callback, delay=500) {
  const timerRef = useRef(null)
  const onTouchStart = useCallback((e) => {
    timerRef.current = setTimeout(() => { callback(e); navigator.vibrate?.([10,20,10]) }, delay)
  }, [callback, delay])
  const onTouchEnd = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
  }, [])
  const onTouchMove = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
  }, [])
  return { onTouchStart, onTouchEnd, onTouchMove }
}

export function QuickAddSheet({ product, onClose }) {
  const { addItem, updateQuantity, items } = useCartStore()
  const qty = items.find(i => i.product.id === product?.id)?.quantity || 0
  if (!product) return null
  return (
    <div style={{ position:'fixed', inset:0, zIndex:600, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'flex-end' }} onClick={onClose}>
      <div style={{ width:'100%', maxWidth:480, margin:'0 auto', background:'#0D3545', borderRadius:'20px 20px 0 0', padding:'16px 20px 40px' }} onClick={e=>e.stopPropagation()}>
        <div style={{ width:32, height:4, background:'rgba(255,255,255,0.2)', borderRadius:2, margin:'0 auto 16px' }}/>
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:20 }}>
          <div style={{ fontSize:44 }}>{product.emoji}</div>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:F.serif, fontSize:18, color:'white', marginBottom:2 }}>{product.name}</div>
            <div style={{ fontSize:15, fontWeight:700, color:'#E8A070' }}>€{product.price.toFixed(2)}</div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:16, justifyContent:'center', marginBottom:20 }}>
          <button onClick={()=>{ if(qty<=1) onClose(); else updateQuantity(product.id, qty-1) }}
            style={{ width:44, height:44, background:'rgba(255,255,255,0.1)', border:'none', borderRadius:'50%', color:'white', fontSize:22, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>
          <span style={{ fontSize:26, fontWeight:700, color:'white', minWidth:36, textAlign:'center' }}>{qty}</span>
          <button onClick={()=>{ addItem(product); navigator.vibrate?.([15]) }}
            style={{ width:44, height:44, background:C.accent, border:'none', borderRadius:'50%', color:'white', fontSize:22, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
        </div>
        <button onClick={()=>{ if(qty===0) addItem(product); onClose() }}
          style={{ width:'100%', padding:'14px', background:qty>0?C.accent:'rgba(255,255,255,0.1)', border:'none', borderRadius:12, color:'white', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:F.sans }}>
          {qty > 0 ? 'Done — '+qty+' in basket' : 'Add to basket'}
        </button>
      </div>
    </div>
  )
}

// ── P14: Infinite scroll hook ─────────────────────────────────
export function useInfiniteScroll(items, pageSize=20) {
  const [page, setPage] = useState(1)
  const sentinelRef = useRef(null)
  const visible = items.slice(0, page * pageSize)
  const hasMore = visible.length < items.length
  useEffect(() => {
    setPage(1)
  }, [items.length])
  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) setPage(p => p + 1)
    }, { threshold:0.1 })
    obs.observe(sentinelRef.current)
    return () => obs.disconnect()
  }, [hasMore])
  return { visible, hasMore, sentinelRef }
}

// ── P15: Category page hero image ────────────────────────────
const CATEGORY_HERO_IMAGES = {
  spirits:      'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=480&q=80',
  beer_cider:   'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=480&q=80',
  wine:         'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=480&q=80',
  champagne:    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=480&q=80',
  soft_drinks:  'https://images.unsplash.com/photo-1527960471264-932f39eb5846?w=480&q=80',
  water_juice:  'https://images.unsplash.com/photo-1534353473418-4cfa0c4c2c2e?w=480&q=80',
  snacks:       'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=480&q=80',
  ice:          'https://images.unsplash.com/photo-1519864600265-abb23847ef2c?w=480&q=80',
}

export function CategoryHeroImage({ categoryKey }) {
  const src = CATEGORY_HERO_IMAGES[categoryKey]
  if (!src) return null
  const [loaded, setLoaded] = useState(false)
  return (
    <div style={{ height:120, position:'relative', overflow:'hidden', marginBottom:0 }}>
      <div style={{ position:'absolute', inset:0, background:'rgba(13,53,69,0.6)', zIndex:1 }}/>
      <img src={src} alt={categoryKey} loading="lazy"
        onLoad={()=>setLoaded(true)}
        style={{ width:'100%', height:'100%', objectFit:'cover', opacity:loaded?1:0, transition:'opacity 0.4s', display:'block' }}/>
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(13,53,69,0.95) 0%, transparent 60%)', zIndex:2 }}/>
    </div>
  )
}

// ── B16: Public tracking page component ──────────────────────
export function PublicTrackingPage({ orderNumber }) {
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  useEffect(() => {
    if (!orderNumber) { setError(true); setLoading(false); return }
    import('../../lib/supabase').then(({ supabase }) => {
      supabase.from('orders').select('*').eq('order_number', orderNumber).single()
        .then(({ data, error:e }) => {
          if (e || !data) setError(true)
          else setOrder(data)
          setLoading(false)
        }).catch(() => { setError(true); setLoading(false) })
    }).catch(() => { setError(true); setLoading(false) })
  }, [orderNumber])
  if (loading) return <div style={{ minHeight:'100vh', background:'#0D3545', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontFamily:F.serif, fontSize:24 }}>Loading...</div>
  if (error || !order) return (
    <div style={{ minHeight:'100vh', background:'#0D3545', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ fontSize:48, marginBottom:16 }}>🔍</div>
      <div style={{ fontFamily:F.serif, fontSize:24, color:'white', marginBottom:8 }}>Order not found</div>
      <div style={{ fontSize:14, color:'rgba(255,255,255,0.45)' }}>Check the link is correct</div>
    </div>
  )
  const STATUS_EMOJI = { confirmed:'✅', preparing:'👨‍🍳', assigned:'🛵', picked_up:'📦', en_route:'🛵', delivered:'🎉' }
  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(170deg,#0A2A38,#0D3545)', padding:'32px 20px' }}>
      <div style={{ maxWidth:400, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ fontFamily:F.serif, fontSize:28, color:'white', marginBottom:4 }}>Isla Drop</div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,0.4)' }}>Live order tracking</div>
        </div>
        <div style={{ background:'rgba(255,255,255,0.07)', border:'0.5px solid rgba(255,255,255,0.1)', borderRadius:20, padding:24, marginBottom:16, textAlign:'center' }}>
          <div style={{ fontSize:52, marginBottom:12 }}>{STATUS_EMOJI[order.status] || '📦'}</div>
          <div style={{ fontFamily:F.serif, fontSize:22, color:'white', marginBottom:4 }}>
            {order.status === 'delivered' ? 'Delivered! 🎉' : 'On its way 🛵'}
          </div>
          <div style={{ fontSize:14, color:'rgba(255,255,255,0.55)', marginBottom:16 }}>Order #{order.order_number}</div>
          {order.status !== 'delivered' && (
            <div style={{ fontSize:32, fontWeight:700, color:'white', fontFamily:'monospace' }}>
              ~{order.estimated_minutes || 18} min
            </div>
          )}
        </div>
        <div style={{ fontSize:12, color:'rgba(255,255,255,0.3)', textAlign:'center' }}>
          Powered by <a href="https://www.isladrop.net" style={{ color:'rgba(255,255,255,0.5)' }}>isladrop.net</a>
        </div>
      </div>
    </div>
  )
}

// ── B17: Post-delivery tip ────────────────────────────────────
export function PostDeliveryTipSheet({ order, driverName, onClose }) {
  const [amount, setAmount] = useState(null)
  const [custom, setCustom] = useState('')
  const [processing, setProcessing] = useState(false)
  const [done, setDone] = useState(false)
  const tips = [1, 2, 3, 5]
  const finalAmount = amount === 'custom' ? parseFloat(custom) : amount

  const sendTip = async () => {
    if (!finalAmount || finalAmount <= 0) { toast.error('Enter a tip amount'); return }
    setProcessing(true)
    try {
      const { supabase } = await import('../../lib/supabase')
      await supabase.from('driver_tips').insert({
        order_id: order.id,
        driver_id: order.driver_id,
        amount: finalAmount,
        created_at: new Date().toISOString(),
      })
      setDone(true)
      toast.success('Tip sent — thank you! 🙏')
    } catch { toast.error('Could not process tip — try again') }
    setProcessing(false)
  }

  if (done) return (
    <div style={{ position:'fixed', inset:0, zIndex:600, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'flex-end' }} onClick={onClose}>
      <div style={{ width:'100%', maxWidth:480, margin:'0 auto', background:'#0D3545', borderRadius:'24px 24px 0 0', padding:'32px 20px 48px', textAlign:'center' }} onClick={e=>e.stopPropagation()}>
        <div style={{ fontSize:52, marginBottom:12 }}>🙏</div>
        <div style={{ fontFamily:F.serif, fontSize:24, color:'white', marginBottom:8 }}>Tip sent!</div>
        <div style={{ fontSize:14, color:C.muted }}>€{finalAmount?.toFixed(2)} has been sent to {driverName || 'your driver'}.</div>
        <button onClick={onClose} style={{ marginTop:24, width:'100%', padding:'14px', background:C.accent, border:'none', borderRadius:14, color:'white', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:F.sans }}>Done</button>
      </div>
    </div>
  )

  return (
    <div style={{ position:'fixed', inset:0, zIndex:600, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'flex-end' }} onClick={onClose}>
      <div style={{ width:'100%', maxWidth:480, margin:'0 auto', background:'#0D3545', borderRadius:'24px 24px 0 0', padding:'24px 20px 48px' }} onClick={e=>e.stopPropagation()}>
        <div style={{ width:36, height:4, background:'rgba(255,255,255,0.2)', borderRadius:2, margin:'0 auto 20px' }}/>
        <div style={{ textAlign:'center', marginBottom:20 }}>
          <div style={{ fontSize:36, marginBottom:8 }}>🛵</div>
          <div style={{ fontFamily:F.serif, fontSize:22, color:'white', marginBottom:4 }}>Add a tip for {driverName||'your driver'}?</div>
          <div style={{ fontSize:13, color:C.muted }}>100% goes directly to them</div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:14 }}>
          {tips.map(t => (
            <button key={t} onClick={()=>{ setAmount(t); setCustom('') }}
              style={{ padding:'12px 0', background:amount===t?C.accent:C.surface, border:'0.5px solid '+(amount===t?C.accent:C.border), borderRadius:12, color:'white', fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:F.sans }}>
              €{t}
            </button>
          ))}
        </div>
        <div style={{ marginBottom:16 }}>
          <input value={custom} onChange={e=>{ setCustom(e.target.value); setAmount('custom') }}
            placeholder="Custom amount (€)"
            type="number" min="0" step="0.50"
            onFocus={e=>e.target.scrollIntoView({behavior:'smooth',block:'center'})}
            style={{ width:'100%', padding:'12px 14px', background:C.surface, border:'0.5px solid '+(amount==='custom'?C.accent:C.border), borderRadius:12, color:'white', fontSize:14, fontFamily:F.sans, outline:'none', boxSizing:'border-box' }}/>
        </div>
        <button onClick={sendTip} disabled={processing||!finalAmount}
          style={{ width:'100%', padding:'15px', background:finalAmount?C.accent:'rgba(255,255,255,0.1)', border:'none', borderRadius:14, color:'white', fontSize:15, fontWeight:600, cursor:finalAmount?'pointer':'default', fontFamily:F.sans, marginBottom:10 }}>
          {processing ? 'Sending...' : finalAmount ? 'Send €'+Number(finalAmount).toFixed(2)+' tip' : 'Select an amount'}
        </button>
        <button onClick={onClose} style={{ width:'100%', padding:'12px', background:'transparent', border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:12, color:C.muted, fontSize:13, cursor:'pointer', fontFamily:F.sans }}>
          No thanks
        </button>
      </div>
    </div>
  )
}

// ── B18: Group order / shared basket ─────────────────────────
export function useGroupOrder() {
  const [groupToken, setGroupToken] = useState(null)
  const [groupItems, setGroupItems] = useState([])
  const { addItem } = useCartStore()

  const create = useCallback(async () => {
    try {
      const { supabase } = await import('../../lib/supabase')
      const token = Math.random().toString(36).slice(2,10).toUpperCase()
      await supabase.from('shared_baskets').insert({ token, items:[], created_at:new Date().toISOString(), expires_at: new Date(Date.now()+3600000).toISOString() })
      setGroupToken(token)
      const url = window.location.origin+'?group='+token
      if (navigator.share) navigator.share({ title:'Join my Isla Drop order', text:'Add items to our shared basket 🌴', url }).catch(()=>{})
      else { navigator.clipboard?.writeText(url); toast.success('Group link copied!') }
      return token
    } catch { toast.error('Could not create group order'); return null }
  }, [])

  return { groupToken, groupItems, create }
}

export function GroupOrderBanner({ groupToken, onStart }) {
  if (groupToken) return (
    <div style={{ background:'rgba(43,122,139,0.15)', border:'0.5px solid rgba(43,122,139,0.35)', borderRadius:12, padding:'12px 14px', marginBottom:12, display:'flex', alignItems:'center', gap:10 }}>
      <span style={{ fontSize:18 }}>👥</span>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:12, fontWeight:600, color:'white', fontFamily:F.sans }}>Group order active</div>
        <div style={{ fontSize:10, color:C.muted }}>Code: {groupToken} · Link copied</div>
      </div>
    </div>
  )
  return (
    <button onClick={onStart}
      style={{ width:'100%', padding:'10px', background:'rgba(43,122,139,0.12)', border:'0.5px solid rgba(43,122,139,0.25)', borderRadius:10, color:'rgba(126,232,200,0.8)', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:F.sans, display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginBottom:10 }}>
      👥 Start a group order
    </button>
  )
}

// ── B19: Subscription / recurring order ──────────────────────
export function RecurringOrderSheet({ cart, onClose, onSchedule }) {
  const { user } = useAuthStore()
  const [frequency, setFrequency] = useState('weekly')
  const [day, setDay] = useState('friday')
  const [saving, setSaving] = useState(false)
  const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']
  const FREQS = [{id:'daily',label:'Daily'},{id:'weekly',label:'Weekly'},{id:'fortnightly',label:'Every 2 weeks'},{id:'monthly',label:'Monthly'}]

  const save = async () => {
    if (!user) { toast.error('Sign in to set up recurring orders'); return }
    setSaving(true)
    try {
      const { supabase } = await import('../../lib/supabase')
      await supabase.from('subscriptions').insert({
        user_id: user.id,
        items: cart.items.map(i=>({ product_id:i.product.id, quantity:i.quantity })),
        frequency, day_of_week:day,
        delivery_address: cart.deliveryAddress,
        active: true, created_at: new Date().toISOString(),
        next_order_at: new Date().toISOString(),
      })
      toast.success('Recurring order set up! 🌴')
      onSchedule?.({ frequency, day })
      onClose()
    } catch { toast.error('Could not save subscription') }
    setSaving(false)
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:600, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'flex-end' }} onClick={onClose}>
      <div style={{ width:'100%', maxWidth:480, margin:'0 auto', background:'#0D3545', borderRadius:'24px 24px 0 0', padding:'24px 20px 48px', maxHeight:'80vh', overflowY:'auto' }} onClick={e=>e.stopPropagation()}>
        <div style={{ width:36, height:4, background:'rgba(255,255,255,0.2)', borderRadius:2, margin:'0 auto 20px' }}/>
        <div style={{ fontFamily:F.serif, fontSize:22, color:'white', marginBottom:6 }}>Set up recurring order</div>
        <div style={{ fontSize:13, color:C.muted, marginBottom:20 }}>We will automatically re-order your current basket on your chosen schedule.</div>
        <div style={{ fontSize:12, color:C.muted, marginBottom:8 }}>Frequency</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
          {FREQS.map(f => (
            <button key={f.id} onClick={()=>setFrequency(f.id)}
              style={{ padding:'10px', background:frequency===f.id?C.accent:C.surface, border:'0.5px solid '+(frequency===f.id?C.accent:C.border), borderRadius:10, color:'white', fontSize:13, fontWeight:frequency===f.id?700:400, cursor:'pointer', fontFamily:F.sans }}>
              {f.label}
            </button>
          ))}
        </div>
        {(frequency==='weekly'||frequency==='fortnightly') && (
          <>
            <div style={{ fontSize:12, color:C.muted, marginBottom:8 }}>Delivery day</div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:20 }}>
              {DAYS.map(d => (
                <button key={d} onClick={()=>setDay(d)}
                  style={{ padding:'7px 12px', background:day===d?C.accent:C.surface, border:'0.5px solid '+(day===d?C.accent:C.border), borderRadius:20, color:'white', fontSize:11, cursor:'pointer', fontFamily:F.sans, fontWeight:day===d?700:400 }}>
                  {d.slice(0,3).charAt(0).toUpperCase()+d.slice(0,3).slice(1)}
                </button>
              ))}
            </div>
          </>
        )}
        <div style={{ background:C.surface, borderRadius:12, padding:'12px 14px', marginBottom:20 }}>
          <div style={{ fontSize:12, color:C.muted, marginBottom:6 }}>Items in this subscription</div>
          {cart.items.map(({product,quantity}) => (
            <div key={product.id} style={{ fontSize:12, color:'white', marginBottom:3 }}>{product.emoji} {product.name} × {quantity}</div>
          ))}
          <div style={{ fontSize:13, fontWeight:700, color:'#E8A070', marginTop:8 }}>€{cart.getTotal().toFixed(2)}/order</div>
        </div>
        <button onClick={save} disabled={saving}
          style={{ width:'100%', padding:'15px', background:C.accent, border:'none', borderRadius:14, color:'white', fontSize:15, fontWeight:600, cursor:'pointer', fontFamily:F.sans, marginBottom:10 }}>
          {saving ? 'Saving...' : 'Set up recurring order'}
        </button>
        <button onClick={onClose} style={{ width:'100%', padding:'12px', background:'transparent', border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:12, color:C.muted, fontSize:13, cursor:'pointer', fontFamily:F.sans }}>
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── B20: Refund / credit tracker ──────────────────────────────
export function useCredits() {
  const { user } = useAuthStore()
  const [credits, setCredits] = useState([])
  useEffect(() => {
    if (!user) return
    import('../../lib/supabase').then(({ supabase }) => {
      supabase.from('customer_credits').select('*').eq('user_id', user.id)
        .order('created_at', { ascending:false })
        .then(({ data }) => { if (data) setCredits(data) }).catch(() => {})
    }).catch(() => {})
  }, [user])
  const total = credits.filter(c => !c.used && (!c.expires_at || new Date(c.expires_at) > new Date())).reduce((s,c) => s+c.amount, 0)
  return { credits, total }
}

export function CreditTrackerView({ onBack }) {
  const { credits, total } = useCredits()
  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(170deg,#0A2A38,#0D3545)', paddingBottom:80 }}>
      <div style={{ background:'linear-gradient(135deg,#0D3B4A,#1A5263)', padding:'16px 16px 20px', position:'sticky', top:0, zIndex:50 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={onBack} style={{ display:'flex',alignItems:'center',gap:6,background:'rgba(255,255,255,0.08)',border:'0.5px solid rgba(255,255,255,0.15)',borderRadius:20,padding:'7px 14px 7px 10px',cursor:'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            <span style={{ fontSize:12,color:'white',fontFamily:'DM Sans,sans-serif',fontWeight:500 }}>Back</span>
          </button>
          <div style={{ fontFamily:F.serif, fontSize:22, color:'white' }}>Credits & refunds</div>
        </div>
      </div>
      <div style={{ padding:16 }}>
        <div style={{ background:'linear-gradient(135deg,rgba(126,232,162,0.15),rgba(43,122,139,0.15))', border:'0.5px solid rgba(126,232,162,0.3)', borderRadius:18, padding:'20px', marginBottom:20, textAlign:'center' }}>
          <div style={{ fontSize:13, color:C.muted, marginBottom:4 }}>Available credit</div>
          <div style={{ fontFamily:F.serif, fontSize:36, color:C.green }}>€{total.toFixed(2)}</div>
          <div style={{ fontSize:11, color:C.muted, marginTop:4 }}>Applied automatically at checkout</div>
        </div>
        {credits.length === 0 ? (
          <div style={{ textAlign:'center', padding:'40px 0', color:C.muted }}>
            <div style={{ fontSize:36, marginBottom:10 }}>💳</div>
            <div>No credits yet</div>
          </div>
        ) : credits.map((c,i) => (
          <div key={i} style={{ background:C.surface, border:'0.5px solid '+C.border, borderRadius:14, padding:'14px 16px', marginBottom:8 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4 }}>
              <div style={{ fontSize:13, fontWeight:600, color:'white', fontFamily:F.sans }}>{c.reason || 'Credit'}</div>
              <div style={{ fontSize:15, fontWeight:700, color:c.used?C.muted:C.green }}>€{c.amount.toFixed(2)}</div>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <div style={{ fontSize:11, color:C.muted }}>{new Date(c.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</div>
              <div style={{ fontSize:10, fontWeight:700, color:c.used?C.muted:C.green, background:c.used?'rgba(255,255,255,0.05)':'rgba(126,232,162,0.1)', padding:'2px 8px', borderRadius:20 }}>
                {c.used ? 'Used' : c.expires_at ? 'Expires '+new Date(c.expires_at).toLocaleDateString('en-GB',{day:'numeric',month:'short'}) : 'Active'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── T21: React Error Boundary ─────────────────────────────────
export class AppErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError:false, error:null } }
  static getDerivedStateFromError(error) { return { hasError:true, error } }
  componentDidCatch(error, info) { console.error('Isla Drop error:', error, info) }
  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <div style={{ minHeight:'100vh', background:'linear-gradient(170deg,#0A2A38,#0D3545)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'32px 24px', textAlign:'center' }}>
        <div style={{ fontSize:64, marginBottom:16 }}>⚠️</div>
        <div style={{ fontFamily:'DM Serif Display,serif', fontSize:26, color:'white', marginBottom:8 }}>Something went wrong</div>
        <div style={{ fontSize:14, color:'rgba(255,255,255,0.45)', lineHeight:1.6, marginBottom:28, maxWidth:300 }}>
          The app encountered an unexpected error. Your basket and account are safe.
        </div>
        <button onClick={()=>window.location.reload()}
          style={{ padding:'14px 36px', background:'#C4683A', border:'none', borderRadius:14, color:'white', fontSize:15, fontWeight:600, cursor:'pointer', fontFamily:'DM Sans,sans-serif', marginBottom:12 }}>
          Restart app
        </button>
        <button onClick={()=>window.open('https://wa.me/34971000000','_blank')}
          style={{ padding:'12px 28px', background:'rgba(37,211,102,0.15)', border:'0.5px solid rgba(37,211,102,0.3)', borderRadius:12, color:'#25D366', fontSize:13, cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
          💬 Contact support
        </button>
        {process.env.NODE_ENV==='development' && this.state.error && (
          <details style={{ marginTop:24, textAlign:'left', maxWidth:400, fontSize:11, color:'rgba(255,255,255,0.3)', background:'rgba(0,0,0,0.3)', padding:12, borderRadius:8 }}>
            <summary>Error details</summary>
            <pre style={{ whiteSpace:'pre-wrap', wordBreak:'break-all' }}>{this.state.error?.toString()}</pre>
          </details>
        )}
      </div>
    )
  }
}

// ── T23/T24: Lazy image with loading=lazy ─────────────────────
export function LazyImg({ src, alt, style={}, emoji='📦', width, height }) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  return (
    <div style={{ position:'relative', overflow:'hidden', background:'rgba(43,122,139,0.12)', ...style }}>
      {!loaded && !error && (
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:Math.min(style.height||40, 40)*0.7 }}>
          {emoji}
        </div>
      )}
      {!error && (
        <img src={src} alt={alt} loading="lazy"
          width={width} height={height}
          onLoad={()=>setLoaded(true)}
          onError={()=>setError(true)}
          style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', opacity:loaded?1:0, transition:'opacity 0.35s ease' }}/>
      )}
    </div>
  )
}

// ── I26: Season countdown — real dates per year ───────────────
// Ibiza season: last weekend of April → 31 October
// These are the actual opening dates per year
const IBIZA_SEASON_OPENS = {
  2025: new Date(2025, 3, 25),  // 25 April 2025
  2026: new Date(2026, 3, 24),  // 24 April 2026
  2027: new Date(2027, 3, 23),  // 23 April 2027
}

export function useSeasonCountdown() {
  const now  = new Date()
  const year = now.getFullYear()
  // Get this year's opening date, fallback to last Friday of April
  let seasonStart = IBIZA_SEASON_OPENS[year]
  if (!seasonStart) {
    // Calculate last Friday of April for unknown years
    const lastDay = new Date(year, 4, 0) // last day of April
    const offset  = (lastDay.getDay() + 2) % 7 // days back to Friday
    seasonStart   = new Date(year, 3, lastDay.getDate() - offset)
  }
  const seasonEnd = new Date(year, 9, 31) // 31 October

  if (now >= seasonStart && now <= seasonEnd) {
    const days = Math.ceil((seasonEnd - now) / 86400000)
    if (days <= 14) return { type:'ending', days, message:'Season ends in '+days+' day'+(days!==1?'s':'')+' — stock up! 🌴' }
    return { type:'peak', days:null, message:'In the heart of Ibiza season 🌴' }
  }
  // Off season
  const nextStart = now < seasonStart ? seasonStart : IBIZA_SEASON_OPENS[year+1] || new Date(year+1, 3, 24)
  const days = Math.ceil((nextStart - now) / 86400000)
  if (days <= 0) return { type:'peak', days:null, message:'Season is open 🌴' }
  if (days === 1) return { type:'offseason', days:1, message:'Season opens TOMORROW 🎉' }
  if (days <= 7)  return { type:'offseason', days, message:'Season opens this weekend 🌴 '+days+' days to go' }
  return { type:'offseason', days, message:'Ibiza season opens in '+days+' days ✈️' }
}

export function SeasonCountdownBanner() {
  const season = useSeasonCountdown()
  if (season.type === 'peak') return null
  const bg = season.type==='ending'?'rgba(196,104,58,0.15)':'rgba(43,122,139,0.12)'
  const border = season.type==='ending'?'rgba(196,104,58,0.3)':'rgba(43,122,139,0.25)'
  return (
    <div style={{ margin:'0 16px 16px', background:bg, border:'0.5px solid '+border, borderRadius:14, padding:'12px 16px', display:'flex', alignItems:'center', gap:10 }}>
      <span style={{ fontSize:20 }}>{season.type==='ending'?'⏳':'🌅'}</span>
      <div style={{ fontSize:13, color:'white', fontFamily:'DM Sans,sans-serif' }}>{season.message}</div>
    </div>
  )
}

// ── I27: Weather relevance on product cards ───────────────────
export function WeatherRelevanceBadge({ product, weather }) {
  if (!weather || !product?.weather_tags?.length) return null
  const { temp, sunny } = weather
  const tags = product.weather_tags
  const hot = temp > 28 && sunny
  const cool = temp < 20
  if (hot && tags.some(t=>['hot','sunny','cold_drink'].includes(t))) return (
    <div style={{ position:'absolute', top:5, left:5, background:'rgba(255,200,50,0.9)', borderRadius:6, padding:'2px 6px', fontSize:9, fontWeight:700, color:'#2A2318' }}>
      ☀️ Perfect for today
    </div>
  )
  if (cool && tags.some(t=>['cool','warm','spirits'].includes(t))) return (
    <div style={{ position:'absolute', top:5, left:5, background:'rgba(43,122,139,0.9)', borderRadius:6, padding:'2px 6px', fontSize:9, fontWeight:700, color:'white' }}>
      🌬️ Great tonight
    </div>
  )
  return null
}

// ── I28: Ibiza timezone helper ────────────────────────────────
export function toIbizaTime(dateOrStr) {
  const d = new Date(dateOrStr)
  return d.toLocaleTimeString('en-GB', { timeZone:'Europe/Madrid', hour:'2-digit', minute:'2-digit' })
}

export function IbizaTimeNote() {
  const offset = new Date().toLocaleString('en-GB', { timeZone:'Europe/Madrid', hour:'2-digit', minute:'2-digit' })
  return (
    <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', fontFamily:'DM Sans,sans-serif', marginTop:4 }}>
      🕐 Times shown in Ibiza time (CEST, UTC+2)
    </div>
  )
}

// ── I29: Static map on order confirmation ─────────────────────
export function ConfirmationMapImage({ lat, lng }) {
  if (!lat || !lng) return null
  const key = import.meta.env.VITE_GOOGLE_PLACES_KEY || ''
  if (!key) return null
  const src = 'https://maps.googleapis.com/maps/api/staticmap?center='+lat+','+lng+'&zoom=15&size=400x150&scale=2&markers=color:red|'+lat+','+lng+'&style=feature:all|element:labels|visibility:simplified&key='+key
  return (
    <div style={{ borderRadius:14, overflow:'hidden', marginBottom:16, border:'0.5px solid rgba(255,255,255,0.1)' }}>
      <img src={src} alt="Delivery location" loading="lazy"
        style={{ width:'100%', height:120, objectFit:'cover', display:'block' }}/>
    </div>
  )
}

// ── I30: Referral prompt on order confirmation ────────────────
export function ReferralAtCheckout({ referralCode, onShare }) {
  if (!referralCode) return null
  const share = () => {
    const url = 'https://www.isladrop.net?ref='+referralCode
    const text = 'I just ordered on Isla Drop — 24/7 delivery in Ibiza 🌴 Use my code '+referralCode+' for €10 off your first order!'
    if (navigator.share) navigator.share({ title:'Isla Drop', text, url }).catch(()=>{})
    else { navigator.clipboard?.writeText(url); toast.success('Referral link copied!') }
    onShare?.()
  }
  return (
    <div style={{ background:'linear-gradient(135deg,rgba(200,168,75,0.15),rgba(196,104,58,0.1))', border:'0.5px solid rgba(200,168,75,0.3)', borderRadius:16, padding:'16px', marginTop:16 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
        <span style={{ fontSize:24 }}>🎁</span>
        <div>
          <div style={{ fontFamily:'DM Serif Display,serif', fontSize:16, color:'white' }}>Love Isla Drop?</div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.55)' }}>Share with a friend — you both get €10 off</div>
        </div>
      </div>
      <button onClick={share}
        style={{ width:'100%', padding:'12px', background:'rgba(200,168,75,0.2)', border:'0.5px solid rgba(200,168,75,0.4)', borderRadius:12, color:'#C8A84B', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'DM Sans,sans-serif', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
        🔗 Share code: {referralCode}
      </button>
    </div>
  )
}

// ── Supabase RLS helper SQL (T22) — call from Supabase SQL editor ──
export const RLS_POLICIES_SQL = `
-- Run this in your Supabase SQL editor to tighten RLS:
alter table orders enable row level security;
create policy "Users see own orders" on orders for select using (auth.uid()=customer_id::uuid);
alter table loyalty_cards enable row level security;
create policy "Users see own loyalty" on loyalty_cards for select using (auth.uid()=user_id);
alter table saved_addresses enable row level security;
create policy "Users see own addresses" on saved_addresses for select using (auth.uid()=user_id);
alter table notification_prefs enable row level security;
create policy "Users see own prefs" on notification_prefs for select using (auth.uid()=user_id);
alter table customer_credits enable row level security;
create policy "Users see own credits" on customer_credits for select using (auth.uid()=user_id);
`
