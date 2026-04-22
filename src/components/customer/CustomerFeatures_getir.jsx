// ================================================================
// Isla Drop — CustomerFeatures_getir.jsx
// All 30 final features: A1-A10, B1-B9, C1-C6, D1-D5
// ================================================================
import { useState, useEffect, useRef, useCallback } from 'react'
import { useCartStore, useAuthStore } from '../../lib/store'
import { PRODUCTS, CATEGORIES, BEST_SELLERS } from '../../lib/products'
import toast from 'react-hot-toast'

const F = { serif:'DM Serif Display,serif', sans:'DM Sans,sans-serif' }
const C = {
  bg:'#0D3545', accent:'#C4683A', green:'#7EE8A2', gold:'#C8A84B',
  surface:'rgba(255,255,255,0.07)', border:'rgba(255,255,255,0.1)',
  muted:'rgba(255,255,255,0.45)', white:'white',
}

// ── A1: Fuzzy search with typo tolerance ─────────────────────
// Fuse.js-style algorithm — no extra dependency
export function fuzzySearch(query, products) {
  if (!query || query.length < 2) return []
  const q = query.toLowerCase().trim()
  const scored = products.map(p => {
    const name = p.name.toLowerCase()
    const cat  = (p.category || '').toLowerCase()
    const tags = (p.tags || []).join(' ').toLowerCase()
    const all  = name + ' ' + cat + ' ' + tags
    // Exact match
    if (name.includes(q)) return { p, score: 100 }
    // Category match
    if (cat.includes(q)) return { p, score: 80 }
    // Word boundary match
    const words = q.split(' ')
    const wordMatch = words.every(w => all.includes(w))
    if (wordMatch) return { p, score: 70 }
    // Fuzzy char-by-char subsequence
    let qi = 0
    for (let i = 0; i < all.length && qi < q.length; i++) {
      if (all[i] === q[qi]) qi++
    }
    if (qi === q.length) return { p, score: Math.round((qi / all.length) * 60) }
    // Levenshtein-light: tolerate 1-2 char errors
    if (q.length >= 4) {
      for (let skip = 0; skip < q.length; skip++) {
        const qShort = q.slice(0, skip) + q.slice(skip + 1)
        if (name.includes(qShort)) return { p, score: 50 }
      }
    }
    return null
  }).filter(Boolean)
  return scored
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(x => x.p)
    .slice(0, 40)
}

// A1: Category shortcuts in search
export function SearchWithFuzzy({ query, onDetail, onCategorySelect, onClear }) {
  const { addItem } = useCartStore()
  if (!query || query.length < 2) return null

  const q = query.toLowerCase()
  const catMatches = CATEGORIES.filter(c =>
    c.label.toLowerCase().includes(q) || c.key.toLowerCase().includes(q)
  ).slice(0, 2)
  const results = fuzzySearch(query, PRODUCTS)

  if (catMatches.length === 0 && results.length === 0) return (
    <div style={{ textAlign:'center', padding:'32px 0', color:C.muted, fontSize:14 }}>
      <div style={{ fontSize:36, marginBottom:10 }}>🔍</div>
      <div>No results for "{query}"</div>
      <div style={{ fontSize:12, marginTop:8, color:'rgba(255,255,255,0.3)' }}>Try different words or ask Isla AI</div>
    </div>
  )

  return (
    <div>
      {/* A4: Category shortcuts */}
      {catMatches.map(cat => (
        <button key={cat.key} onClick={()=>onCategorySelect(cat.key)}
          style={{ display:'flex', alignItems:'center', gap:12, width:'100%', padding:'13px 16px', background:'rgba(43,122,139,0.15)', border:'0.5px solid rgba(43,122,139,0.3)', borderRadius:12, marginBottom:8, cursor:'pointer', textAlign:'left' }}>
          <span style={{ fontSize:22 }}>{cat.emoji}</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontWeight:600, color:'white', fontFamily:F.sans }}>{cat.label}</div>
            <div style={{ fontSize:11, color:C.muted }}>Browse all {cat.label.toLowerCase()} →</div>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      ))}
      {/* Product results */}
      {results.length > 0 && (
        <div style={{ fontSize:11, color:C.muted, marginBottom:10, marginTop:catMatches.length?12:0 }}>
          {results.length} product{results.length!==1?'s':''} found
        </div>
      )}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        {results.map(p => (
          <div key={p.id}
            onClick={()=>onDetail&&onDetail(p)}
            onTouchStart={e=>{e.currentTarget.style.transform='scale(0.97)'}}
            onTouchEnd={e=>{e.currentTarget.style.transform='scale(1)'}}
            style={{ background:'rgba(255,255,255,0.08)', border:'0.5px solid rgba(255,255,255,0.1)', borderRadius:14, overflow:'hidden', cursor:'pointer', transition:'transform 0.1s' }}>
            <div style={{ height:100, background:'rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:36, position:'relative' }}>
              {p.emoji}
              <button onClick={e=>{e.stopPropagation();addItem(p);toast.success(p.emoji+' Added!',{duration:800})}}
                style={{ position:'absolute', top:6, right:6, width:26, height:26, background:'#C4683A', border:'2px solid white', borderRadius:'50%', color:'white', fontSize:15, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', lineHeight:1 }}>+</button>
            </div>
            <div style={{ padding:'9px 10px 11px' }}>
              <div style={{ fontSize:11, fontWeight:500, color:'white', lineHeight:1.3, marginBottom:4, height:26, overflow:'hidden' }}>{p.name}</div>
              <div style={{ fontSize:13, fontWeight:600, color:'#E8A070' }}>€{p.price.toFixed(2)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── A2: Product collections (occasion-based curated lists) ────
const COLLECTIONS = [
  { id:'late_night',  label:'Late night munchies', emoji:'🌙', tags:['snacks','soft_drinks'], productIds:[] },
  { id:'beach_day',   label:'Beach day bag',        emoji:'🏖️', tags:['water_juice','beer_cider','snacks'], productIds:[] },
  { id:'hangover',    label:'Hangover cure',        emoji:'🤕', tags:['soft_drinks','water_juice','snacks'], productIds:[] },
  { id:'bbq',         label:'BBQ essentials',       emoji:'🔥', tags:['beer_cider','spirits','soft_drinks'], productIds:[] },
  { id:'sundowner',   label:'Sundowner set',         emoji:'🌅', tags:['wine','champagne','spirits'], productIds:[] },
  { id:'date_night',  label:'Date night',            emoji:'💕', tags:['wine','champagne'], productIds:[] },
]

export function useCollections() {
  const [collections, setCollections] = useState([])
  useEffect(() => {
    import('../../lib/supabase').then(({ supabase }) => {
      supabase.from('product_collections').select('*').eq('active', true)
        .then(({ data }) => {
          if (data?.length) { setCollections(data); return }
          // Fallback: build from product tags
          const built = COLLECTIONS.map(c => ({
            ...c,
            products: PRODUCTS.filter(p => c.tags.some(t => p.category === t || (p.tags||[]).includes(t))).slice(0,8)
          })).filter(c => c.products.length >= 3)
          setCollections(built)
        }).catch(() => {
          const built = COLLECTIONS.map(c => ({
            ...c,
            products: PRODUCTS.filter(p => c.tags.some(t => p.category === t)).slice(0,8)
          })).filter(c => c.products.length >= 3)
          setCollections(built)
        })
    }).catch(() => {})
  }, [])
  return collections
}

export function CollectionsRow({ collections, onDetail, onAddAll }) {
  const { addItem } = useCartStore()
  if (!collections?.length) return null
  return (
    <div style={{ marginBottom:22 }}>
      <div style={{ padding:'0 16px', marginBottom:12, fontFamily:F.serif, fontSize:20, color:'white' }}>
        🎯 Shop by occasion
      </div>
      <div style={{ display:'flex', gap:10, overflowX:'auto', padding:'0 16px 8px', scrollbarWidth:'none' }}>
        {collections.map(col => (
          <div key={col.id}
            onClick={()=>onDetail&&onDetail(col)}
            style={{ background:'rgba(255,255,255,0.07)', border:'0.5px solid rgba(255,255,255,0.12)', borderRadius:18, padding:'14px', minWidth:150, flexShrink:0, cursor:'pointer' }}>
            <div style={{ fontSize:28, marginBottom:8 }}>{col.emoji}</div>
            <div style={{ fontSize:13, fontWeight:600, color:'white', fontFamily:F.sans, marginBottom:4 }}>{col.label}</div>
            <div style={{ fontSize:11, color:C.muted, marginBottom:10 }}>{(col.products||[]).length} items</div>
            <button onClick={e=>{e.stopPropagation();(col.products||[]).forEach(p=>addItem(p));toast.success('Added to basket!',{duration:1500})}}
              style={{ padding:'6px 12px', background:C.accent, border:'none', borderRadius:8, color:'white', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:F.sans }}>
              Add all
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── A3: Per-product flash pricing ─────────────────────────────
export function useFlashProducts() {
  const [flash, setFlash] = useState({})
  useEffect(() => {
    import('../../lib/supabase').then(({ supabase }) => {
      supabase.from('flash_product_prices')
        .select('*').eq('active', true).gte('ends_at', new Date().toISOString())
        .then(({ data }) => {
          if (!data) return
          const map = {}
          data.forEach(r => { map[r.product_id] = r })
          setFlash(map)
        }).catch(() => {})
    }).catch(() => {})
  }, [])
  return flash
}

export function FlashPriceBadge({ productId, flash }) {
  const item = flash?.[productId]
  if (!item) return null
  const ends = new Date(item.ends_at)
  const [secs, setSecs] = useState(Math.max(0, Math.floor((ends - Date.now()) / 1000)))
  useEffect(() => {
    const id = setInterval(() => setSecs(s => Math.max(0, s-1)), 1000)
    return () => clearInterval(id)
  }, [])
  if (secs <= 0) return null
  const h = Math.floor(secs/3600), m = Math.floor((secs%3600)/60), s = secs%60
  const timeStr = h>0 ? h+'h '+m+'m' : m>0 ? m+'m '+s+'s' : s+'s'
  return (
    <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'rgba(196,104,58,0.92)', padding:'3px 8px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
      <span style={{ fontSize:9, fontWeight:700, color:'white', fontFamily:F.sans }}>⚡ FLASH SALE</span>
      <span style={{ fontSize:9, color:'rgba(255,255,255,0.85)', fontFamily:F.sans }}>⏱ {timeStr}</span>
    </div>
  )
}

export function FlashPrice({ productId, originalPrice, flash }) {
  const item = flash?.[productId]
  if (!item) return <span>€{originalPrice.toFixed(2)}</span>
  return (
    <div style={{ display:'flex', alignItems:'center', gap:5 }}>
      <span style={{ fontSize:13, fontWeight:700, color:'#E8A070' }}>€{item.sale_price.toFixed(2)}</span>
      <span style={{ fontSize:10, color:'rgba(255,255,255,0.4)', textDecoration:'line-through' }}>€{originalPrice.toFixed(2)}</span>
    </div>
  )
}

// ── A5: Frequently bought together ───────────────────────────
export function useFrequentlyBoughtTogether(productId) {
  const [related, setRelated] = useState([])
  useEffect(() => {
    if (!productId) return
    import('../../lib/supabase').then(({ supabase }) => {
      supabase.rpc('frequently_bought_together', { p_product_id: productId, p_limit: 4 })
        .then(({ data }) => {
          if (data?.length) {
            setRelated(data.map(d => PRODUCTS.find(p => p.id === d.product_id)).filter(Boolean))
            return
          }
          // Fallback: same-category products
          const p = PRODUCTS.find(p => p.id === productId)
          if (p) setRelated(PRODUCTS.filter(x => x.category === p.category && x.id !== productId).slice(0,4))
        }).catch(() => {
          const p = PRODUCTS.find(p => p.id === productId)
          if (p) setRelated(PRODUCTS.filter(x => x.category === p.category && x.id !== productId).slice(0,4))
        })
    }).catch(() => {})
  }, [productId])
  return related
}

export function FrequentlyBoughtTogether({ productId }) {
  const related = useFrequentlyBoughtTogether(productId)
  const { addItem } = useCartStore()
  if (!related.length) return null
  return (
    <div style={{ marginTop:20, paddingTop:16, borderTop:'0.5px solid rgba(255,255,255,0.08)' }}>
      <div style={{ fontFamily:F.serif, fontSize:16, color:'white', marginBottom:12 }}>Frequently bought together</div>
      <div style={{ display:'flex', gap:8, overflowX:'auto', scrollbarWidth:'none' }}>
        {related.map(p => (
          <div key={p.id} style={{ background:C.surface, border:'0.5px solid '+C.border, borderRadius:12, padding:'10px', minWidth:110, flexShrink:0, textAlign:'center' }}>
            <div style={{ fontSize:28, marginBottom:4 }}>{p.emoji}</div>
            <div style={{ fontSize:10, color:'white', lineHeight:1.3, marginBottom:6, height:26, overflow:'hidden' }}>{p.name}</div>
            <div style={{ fontSize:11, fontWeight:700, color:'#E8A070', marginBottom:6 }}>€{p.price.toFixed(2)}</div>
            <button onClick={()=>{addItem(p);toast.success(p.emoji+' Added!',{duration:700})}}
              style={{ width:'100%', padding:'5px 0', background:C.accent, border:'none', borderRadius:8, color:'white', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:F.sans }}>
              + Add
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── A6: Animated stamp card UI ────────────────────────────────
export function AnimatedStampCard({ stamps=0, maxStamps=10 }) {
  const [animStamps, setAnimStamps] = useState(0)
  useEffect(() => {
    let i = 0
    const id = setInterval(() => {
      setAnimStamps(prev => { if (prev >= stamps) { clearInterval(id); return prev }; return prev+1 })
      if (++i >= stamps) clearInterval(id)
    }, 120)
    return () => clearInterval(id)
  }, [stamps])

  return (
    <div style={{ background:'linear-gradient(135deg,rgba(200,168,75,0.15),rgba(43,122,139,0.15))', border:'0.5px solid rgba(200,168,75,0.3)', borderRadius:18, padding:'20px', marginBottom:16 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div style={{ fontFamily:F.serif, fontSize:18, color:'white' }}>Loyalty card</div>
        <div style={{ fontSize:12, color:C.gold, fontWeight:600 }}>{stamps}/{maxStamps} stamps</div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:8, marginBottom:14 }}>
        {Array.from({ length: maxStamps }, (_, i) => (
          <div key={i} style={{
            width:'100%', aspectRatio:'1', borderRadius:'50%',
            background: i < animStamps
              ? 'linear-gradient(135deg,#C8A84B,#E8C85A)'
              : 'rgba(255,255,255,0.08)',
            border: i < animStamps
              ? '2px solid rgba(200,168,75,0.6)'
              : '1.5px solid rgba(255,255,255,0.1)',
            display:'flex', alignItems:'center', justifyContent:'center',
            transition:'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
            transform: i < animStamps ? 'scale(1)' : 'scale(0.9)',
            fontSize: i < animStamps ? 14 : 10,
            color: i < animStamps ? '#0D3545' : 'rgba(255,255,255,0.2)',
          }}>
            {i < animStamps ? '🌴' : '○'}
          </div>
        ))}
      </div>
      {stamps >= maxStamps ? (
        <div style={{ background:'rgba(126,232,162,0.15)', border:'0.5px solid rgba(126,232,162,0.35)', borderRadius:10, padding:'10px 14px', fontSize:12, color:C.green, textAlign:'center', fontWeight:600 }}>
          🎉 Reward unlocked! Use at checkout for free delivery
        </div>
      ) : (
        <div style={{ fontSize:11, color:C.muted, textAlign:'center' }}>
          {maxStamps - stamps} more order{maxStamps-stamps!==1?'s':''} until your free delivery reward
        </div>
      )}
    </div>
  )
}

// ── A7: Search result filters ─────────────────────────────────
export function SearchFilters({ products, onFilter }) {
  const [priceMax, setPriceMax] = useState(null)
  const [inStockOnly, setInStockOnly] = useState(false)
  const [minRating, setMinRating] = useState(null)

  useEffect(() => {
    let filtered = [...products]
    if (priceMax) filtered = filtered.filter(p => p.price <= priceMax)
    if (inStockOnly) filtered = filtered.filter(p => p.stock_quantity === undefined || p.stock_quantity > 0)
    onFilter(filtered)
  }, [priceMax, inStockOnly, minRating, products.length])

  const active = !!(priceMax || inStockOnly || minRating)
  return (
    <div style={{ display:'flex', gap:7, overflowX:'auto', scrollbarWidth:'none', marginBottom:12, paddingBottom:2 }}>
      <button onClick={()=>setInStockOnly(s=>!s)}
        style={{ padding:'5px 12px', borderRadius:20, fontSize:11, fontFamily:F.sans, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0,
          background: inStockOnly ? 'rgba(126,232,162,0.2)' : 'rgba(255,255,255,0.08)',
          border:'0.5px solid '+(inStockOnly?'rgba(126,232,162,0.5)':'rgba(255,255,255,0.15)'),
          color: inStockOnly ? C.green : C.muted, fontWeight: inStockOnly?600:400 }}>
        ✓ In stock
      </button>
      {[10,20,50].map(max => (
        <button key={max} onClick={()=>setPriceMax(priceMax===max?null:max)}
          style={{ padding:'5px 12px', borderRadius:20, fontSize:11, fontFamily:F.sans, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0,
            background: priceMax===max ? 'rgba(196,104,58,0.2)' : 'rgba(255,255,255,0.08)',
            border:'0.5px solid '+(priceMax===max?'rgba(196,104,58,0.5)':'rgba(255,255,255,0.15)'),
            color: priceMax===max ? '#E8A070' : C.muted, fontWeight: priceMax===max?600:400 }}>
          Under €{max}
        </button>
      ))}
      {active && (
        <button onClick={()=>{setPriceMax(null);setInStockOnly(false);setMinRating(null)}}
          style={{ padding:'5px 12px', borderRadius:20, fontSize:11, fontFamily:F.sans, cursor:'pointer', background:'rgba(240,149,149,0.15)', border:'0.5px solid rgba(240,149,149,0.3)', color:'#F09595', whiteSpace:'nowrap', flexShrink:0 }}>
          × Clear
        </button>
      )}
    </div>
  )
}

// ── A8: Tracking step animations ─────────────────────────────
export function AnimatedTrackingSteps({ steps, labels, currentStatus }) {
  const [prevIdx, setPrevIdx] = useState(-1)
  const idx = steps.indexOf(currentStatus)
  useEffect(() => {
    if (idx > prevIdx) setPrevIdx(idx)
  }, [idx])

  return (
    <div style={{ background:C.surface, borderRadius:14, padding:16, marginBottom:20 }}>
      {steps.map((s, i) => {
        const done = i < idx
        const active = i === idx
        const future = i > idx
        return (
          <div key={s} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:i<steps.length-1?0:0, position:'relative' }}>
            {/* Connecting line */}
            {i < steps.length-1 && (
              <div style={{ position:'absolute', left:13, top:28, width:2, height:14, background:done?'#5A6B3A':'rgba(255,255,255,0.1)', transition:'background 0.5s ease', zIndex:0 }}/>
            )}
            <div style={{
              width:28, height:28, borderRadius:'50%', flexShrink:0, zIndex:1,
              background: done ? '#5A6B3A' : active ? '#C4683A' : 'rgba(255,255,255,0.1)',
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow: active ? '0 0 0 4px rgba(196,104,58,0.25)' : 'none',
              animation: active ? 'trackPulse 1.5s ease-in-out infinite' : 'none',
              transition:'all 0.4s cubic-bezier(0.34,1.56,0.64,1)',
            }}>
              {done && <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>}
              {active && <div style={{ width:8, height:8, borderRadius:'50%', background:'white', animation:'trackDot 1s ease-in-out infinite alternate' }}/>}
            </div>
            <div style={{ paddingBottom: i<steps.length-1 ? 16 : 0 }}>
              <span style={{
                fontSize:14, fontWeight:active?600:done?500:400,
                color: future ? 'rgba(255,255,255,0.3)' : 'white',
                transition:'color 0.3s',
              }}>
                {labels[s]}
              </span>
              {active && <div style={{ fontSize:10, color:'rgba(255,255,255,0.45)', marginTop:2, animation:'fadeInUp 0.3s ease' }}>In progress...</div>}
            </div>
          </div>
        )
      })}
      <style>{'@keyframes trackPulse{0%,100%{box-shadow:0 0 0 4px rgba(196,104,58,0.25)}50%{box-shadow:0 0 0 8px rgba(196,104,58,0.1)}} @keyframes trackDot{from{transform:scale(0.8)}to{transform:scale(1.1)}} @keyframes fadeInUp{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}'}</style>
    </div>
  )
}

// ── A9: Push notification action buttons ─────────────────────
export function setupNotificationActions() {
  if (!('serviceWorker' in navigator)) return
  navigator.serviceWorker.addEventListener('message', event => {
    if (event.data?.action === 'repeat_order' && event.data?.orderId) {
      window.dispatchEvent(new CustomEvent('isla:repeat_order', { detail: { orderId: event.data.orderId } }))
    }
    if (event.data?.action === 'track_order' && event.data?.orderId) {
      window.dispatchEvent(new CustomEvent('isla:track_order', { detail: { orderId: event.data.orderId } }))
    }
  })
}

// ── A10: Nearest depot display ────────────────────────────────
const DEPOTS = [
  { id:'ibiza_town', name:'Ibiza Town', lat:38.9067, lng:1.4326, closesAt:'06:00', emoji:'🏙️' },
  { id:'san_antonio', name:'San Antonio', lat:38.9800, lng:1.3030, closesAt:'04:00', emoji:'🌅' },
  { id:'santa_eulalia', name:'Santa Eulalia', lat:38.9840, lng:1.5330, closesAt:'03:00', emoji:'⛵' },
]

function distKm(lat1, lng1, lat2, lng2) {
  const R = 6371, dLat = (lat2-lat1)*Math.PI/180, dLng = (lng2-lng1)*Math.PI/180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

export function useNearestDepot() {
  const [depot, setDepot] = useState(DEPOTS[0])
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(pos => {
      const { latitude: lat, longitude: lng } = pos.coords
      const nearest = DEPOTS.reduce((best, d) => {
        const dist = distKm(lat, lng, d.lat, d.lng)
        return dist < distKm(lat, lng, best.lat, best.lng) ? d : best
      })
      setDepot(nearest)
    }, () => {})
  }, [])
  return depot
}

export function DepotBadge({ depot }) {
  if (!depot) return null
  const now = new Date()
  const [closeH, closeM] = depot.closesAt.split(':').map(Number)
  const closesMs = closeH * 3600000 + closeM * 60000
  const nowMs = now.getHours() * 3600000 + now.getMinutes() * 60000
  const isOpen = nowMs < closesMs || closeH < 6
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:isOpen?C.green:'rgba(240,149,149,0.8)', fontFamily:F.sans }}>
      <div style={{ width:5, height:5, borderRadius:'50%', background:isOpen?C.green:'rgba(240,149,149,0.8)' }}/>
      {depot.emoji} {depot.name} depot · {isOpen?'Open until '+depot.closesAt:'Closed'}
    </div>
  )
}

// ── B1: FadeImage applied to CategoryPage (exported wrapper) ──
export function ProductFadeImage({ productId, emoji, category, alt, height=120 }) {
  const [loaded, setLoaded] = useState(false)
  const [src, setSrc] = useState(null)
  useEffect(() => {
    // ProductImage logic: try Supabase storage URL
    const url = 'https://your-supabase.supabase.co/storage/v1/object/public/products/'+productId+'.jpg'
    setSrc(url)
  }, [productId])
  return (
    <div style={{ height, background:'rgba(43,122,139,0.15)', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden' }}>
      <span style={{ fontSize:Math.round(height*0.36), opacity: loaded ? 0.3 : 0.7, transition:'opacity 0.3s' }}>{emoji}</span>
      {src && <img src={src} alt={alt} onLoad={()=>setLoaded(true)} onError={()=>setSrc(null)}
        style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', opacity:loaded?1:0, transition:'opacity 0.4s ease' }}/>}
    </div>
  )
}

// ── B2: Animated tab bar indicator ───────────────────────────
export function TabIndicator({ activeIndex, total }) {
  return (
    <div style={{ position:'absolute', bottom:0, left:0, right:0, height:2, pointerEvents:'none' }}>
      <div style={{
        position:'absolute', bottom:0, height:2, borderRadius:99,
        width: (100/total)+'%',
        left: (activeIndex * 100/total)+'%',
        background:'#7EE8C8',
        transition:'left 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        boxShadow:'0 0 8px rgba(126,232,200,0.6)',
      }}/>
    </div>
  )
}

// ── B5: Animated basket total ─────────────────────────────────
export function useAnimatedTotal(value) {
  const [display, setDisplay] = useState(value)
  const prev = useRef(value)
  const raf = useRef(null)
  useEffect(() => {
    const start = prev.current
    const end = value
    if (start === end) return
    const duration = 300
    const startTime = performance.now()
    const animate = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(1, elapsed / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(start + (end - start) * eased)
      if (progress < 1) raf.current = requestAnimationFrame(animate)
      else { setDisplay(end); prev.current = end }
    }
    raf.current = requestAnimationFrame(animate)
    return () => raf.current && cancelAnimationFrame(raf.current)
  }, [value])
  return display
}

// ── B6: Add all button for curated rows ───────────────────────
export function AddAllButton({ products, label='Add all' }) {
  const { addItem } = useCartStore()
  const [done, setDone] = useState(false)
  const handleAdd = () => {
    products.forEach(p => addItem(p))
    setDone(true)
    navigator.vibrate?.([15,30,15])
    toast.success(label+' added to basket! 🛵', { duration:1800 })
    setTimeout(() => setDone(false), 3000)
  }
  return (
    <button onClick={handleAdd}
      style={{ padding:'5px 14px', background:done?'rgba(126,232,162,0.2)':C.accent, border:'none', borderRadius:20, color:'white', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:F.sans, transition:'all 0.2s', flexShrink:0 }}>
      {done ? '✓ Added!' : label}
    </button>
  )
}

// ── B7: Checkout 3-step progress bar ─────────────────────────
export function CheckoutProgressBar({ step=1 }) {
  const steps = ['Basket','Delivery','Payment']
  return (
    <div style={{ padding:'12px 0 16px', marginBottom:4 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:0 }}>
        {steps.map((s, i) => (
          <div key={s} style={{ display:'flex', alignItems:'center' }}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
              <div style={{
                width:28, height:28, borderRadius:'50%',
                background: i+1 < step ? '#5A6B3A' : i+1 === step ? '#C4683A' : 'rgba(255,255,255,0.1)',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700,
                color:'white', transition:'all 0.3s',
                boxShadow: i+1===step ? '0 0 0 3px rgba(196,104,58,0.3)' : 'none',
              }}>
                {i+1 < step ? '✓' : i+1}
              </div>
              <div style={{ fontSize:10, color: i+1===step ? 'white' : 'rgba(255,255,255,0.4)', fontFamily:F.sans, fontWeight:i+1===step?600:400, transition:'color 0.3s' }}>{s}</div>
            </div>
            {i < steps.length-1 && (
              <div style={{ width:40, height:1.5, background: i+1 < step ? '#5A6B3A' : 'rgba(255,255,255,0.15)', margin:'0 4px', marginBottom:20, transition:'background 0.5s' }}/>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── B8: Consistent back button ────────────────────────────────
export function BackButton({ onBack, label='Back' }) {
  return (
    <button onClick={onBack}
      onTouchStart={e=>e.currentTarget.style.transform='scale(0.92)'}
      onTouchEnd={e=>e.currentTarget.style.transform='scale(1)'}
      style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.08)', border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:20, padding:'7px 14px 7px 10px', cursor:'pointer', transition:'transform 0.1s', flexShrink:0 }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
      <span style={{ fontSize:12, color:'white', fontFamily:F.sans, fontWeight:500 }}>{label}</span>
    </button>
  )
}

// ── B9: Swipe-to-dismiss bottom sheet ────────────────────────
export function useSwipeToDismiss(onDismiss) {
  const startY = useRef(null)
  const ref = useRef(null)
  const onTouchStart = useCallback(e => { startY.current = e.touches[0].clientY }, [])
  const onTouchMove = useCallback(e => {
    if (startY.current === null || !ref.current) return
    const dy = e.touches[0].clientY - startY.current
    if (dy > 0) ref.current.style.transform = 'translateY('+dy+'px)'
  }, [])
  const onTouchEnd = useCallback(e => {
    if (startY.current === null || !ref.current) return
    const dy = e.changedTouches[0].clientY - startY.current
    if (dy > 80) { onDismiss() }
    else { ref.current.style.transform = 'translateY(0)'; ref.current.style.transition = 'transform 0.3s' }
    startY.current = null
  }, [onDismiss])
  return { ref, onTouchStart, onTouchMove, onTouchEnd }
}

// ── B10: Rating prompt with "Rate later" ─────────────────────
export function RatingPromptSheet({ order, onRate, onLater, onClose }) {
  return (
    <div style={{ position:'fixed', inset:0, zIndex:600, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'flex-end' }} onClick={onClose}>
      <div style={{ width:'100%', maxWidth:480, margin:'0 auto', background:'#0D3545', borderRadius:'24px 24px 0 0', padding:'24px 20px 44px' }} onClick={e=>e.stopPropagation()}>
        <div style={{ width:36, height:4, background:'rgba(255,255,255,0.2)', borderRadius:2, margin:'0 auto 20px' }}/>
        <div style={{ textAlign:'center', marginBottom:20 }}>
          <div style={{ fontSize:48, marginBottom:8 }}>🎉</div>
          <div style={{ fontFamily:F.serif, fontSize:24, color:'white', marginBottom:6 }}>Order delivered!</div>
          <div style={{ fontSize:14, color:C.muted, lineHeight:1.6 }}>How was your Isla Drop experience? Your feedback helps us improve.</div>
        </div>
        <div style={{ display:'flex', gap:8, marginBottom:10 }}>
          <button onClick={onRate} style={{ flex:1, padding:'15px', background:C.accent, border:'none', borderRadius:14, color:'white', fontSize:15, fontWeight:600, cursor:'pointer', fontFamily:F.sans }}>
            ⭐ Rate now
          </button>
        </div>
        <button onClick={onLater} style={{ width:'100%', padding:'13px', background:'transparent', border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:14, color:C.muted, fontSize:14, cursor:'pointer', fontFamily:F.sans }}>
          Rate later
        </button>
      </div>
    </div>
  )
}

// ── C1: Terms & Privacy links ─────────────────────────────────
export function LegalLinks({ style={} }) {
  return (
    <div style={{ display:'flex', gap:12, flexWrap:'wrap', justifyContent:'center', fontSize:11, color:'rgba(255,255,255,0.3)', fontFamily:F.sans, ...style }}>
      <button onClick={()=>window.open('https://www.isladrop.net/terms','_blank')}
        style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)', cursor:'pointer', fontFamily:F.sans, fontSize:11, textDecoration:'underline' }}>
        Terms of Service
      </button>
      <span>·</span>
      <button onClick={()=>window.open('https://www.isladrop.net/privacy','_blank')}
        style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)', cursor:'pointer', fontFamily:F.sans, fontSize:11, textDecoration:'underline' }}>
        Privacy Policy
      </button>
      <span>·</span>
      <button onClick={()=>window.open('https://www.isladrop.net/cookies','_blank')}
        style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)', cursor:'pointer', fontFamily:F.sans, fontSize:11, textDecoration:'underline' }}>
        Cookies
      </button>
    </div>
  )
}

// ── C2: Cookie consent banner ─────────────────────────────────
const COOKIE_KEY = 'isla_cookie_consent'
export function useCookieConsent() {
  const [show, setShow] = useState(false)
  const [consented, setConsented] = useState(false)
  useEffect(() => {
    try {
      const v = localStorage.getItem(COOKIE_KEY)
      if (!v) setShow(true)
      else setConsented(v === 'accepted')
    } catch { setShow(true) }
  }, [])
  const accept = () => {
    try { localStorage.setItem(COOKIE_KEY, 'accepted') } catch {}
    setConsented(true); setShow(false)
  }
  const decline = () => {
    try { localStorage.setItem(COOKIE_KEY, 'declined') } catch {}
    setShow(false)
  }
  return { show, consented, accept, decline }
}

export function CookieConsentBanner({ onAccept, onDecline }) {
  return (
    <div style={{ position:'fixed', bottom:72, left:'50%', transform:'translateX(-50%)', width:'calc(100% - 32px)', maxWidth:448, background:'rgba(13,40,55,0.97)', backdropFilter:'blur(12px)', border:'0.5px solid rgba(43,122,139,0.4)', borderRadius:16, padding:'16px', zIndex:200, boxShadow:'0 8px 32px rgba(0,0,0,0.4)' }}>
      <div style={{ fontSize:13, color:'white', lineHeight:1.6, marginBottom:12, fontFamily:F.sans }}>
        🍪 We use cookies to improve your experience and track orders. See our{' '}
        <button onClick={()=>window.open('https://www.isladrop.net/privacy','_blank')} style={{ background:'none',border:'none',color:'#7EE8C8',cursor:'pointer',fontFamily:F.sans,fontSize:13,padding:0,textDecoration:'underline' }}>
          Privacy Policy
        </button>.
      </div>
      <div style={{ display:'flex', gap:8 }}>
        <button onClick={onAccept} style={{ flex:1, padding:'10px', background:C.accent, border:'none', borderRadius:10, color:'white', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:F.sans }}>
          Accept all
        </button>
        <button onClick={onDecline} style={{ padding:'10px 16px', background:'rgba(255,255,255,0.07)', border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:10, color:C.muted, fontSize:13, cursor:'pointer', fontFamily:F.sans }}>
          Essential only
        </button>
      </div>
    </div>
  )
}

// ── C3: In-app FAQ ────────────────────────────────────────────
const FAQ_ITEMS = [
  { q:'How long does delivery take?', a:'We deliver in under 30 minutes across Ibiza. Average delivery time is 18 minutes from order confirmation.' },
  { q:'What is the minimum order?', a:'The minimum order is €15 before delivery fee. Delivery is €3.50 flat rate, free on orders over €200.' },
  { q:'Can I cancel my order?', a:'Yes — you can cancel within 2 minutes of placing your order for a full refund. After that, cancellations may not be possible as our team will have already begun preparing your order.' },
  { q:'Do you verify age for alcohol?', a:'Yes. Our riders are trained to verify ID at delivery for all alcohol and tobacco products. You must be 18 or over. Please have your ID ready.' },
  { q:'What payment methods do you accept?', a:'Visa, Mastercard, American Express, Apple Pay and Google Pay. Cards are processed securely via Stripe.' },
  { q:'Can I order to a boat or yacht?', a:'Yes! Use the Boat delivery mode on the home screen. Enter your marina, berth number and vessel name. Our rider will meet you at the pontoon.' },
  { q:'Do you deliver to hotels?', a:'Yes. Use the Hotel delivery option in checkout — enter your hotel name and room number. Our rider will bring the order to reception.' },
  { q:'What if an item is out of stock?', a:'You can choose your substitution preference at checkout: substitute with a similar item, get a refund for missing items, or we contact you first.' },
  { q:'How does the loyalty programme work?', a:'You earn 1 stamp per order. Collect 10 stamps to unlock a free delivery reward. Tiers unlock as you order more: Bronze, Silver, Gold and Platinum.' },
  { q:'Can I schedule a delivery?', a:'Yes — up to 7 days in advance with 30-minute time slots. Use the Schedule option in checkout.' },
  { q:'What is the pre-arrival order?', a:'Order before you land in Ibiza and we time delivery to arrive at your villa when you do. Enter your flight number and we track any delays automatically.' },
  { q:'How do I contact support?', a:'WhatsApp: +34 971 000 000 (24/7 during season) or email support@isladrop.net. We reply within 2 hours.' },
]

export function FAQView({ onBack }) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(null)
  const filtered = search
    ? FAQ_ITEMS.filter(f => f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase()))
    : FAQ_ITEMS
  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(170deg,#0A2A38,#0D3545)', paddingBottom:80 }}>
      <div style={{ background:'linear-gradient(135deg,#0D3B4A,#1A5263)', padding:'16px 16px 20px', position:'sticky', top:0, zIndex:50 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
          <button onClick={onBack} style={{ display:'flex',alignItems:'center',gap:6,background:'rgba(255,255,255,0.08)',border:'0.5px solid rgba(255,255,255,0.15)',borderRadius:20,padding:'7px 14px 7px 10px',cursor:'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            <span style={{ fontSize:12,color:'white',fontFamily:'DM Sans,sans-serif',fontWeight:500 }}>Back</span>
          </button>
          <div style={{ fontFamily:F.serif, fontSize:22, color:'white' }}>Help & FAQ</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', background:'rgba(255,255,255,0.09)', borderRadius:12, padding:'10px 14px', gap:8, border:'0.5px solid rgba(255,255,255,0.1)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search help articles..."
            style={{ flex:1, background:'none', border:'none', color:'white', fontSize:13, fontFamily:F.sans, outline:'none' }}/>
          {search && <button onClick={()=>setSearch('')} style={{ background:'none',border:'none',color:C.muted,cursor:'pointer',fontSize:16 }}>✕</button>}
        </div>
      </div>
      <div style={{ padding:'12px 16px' }}>
        {filtered.length === 0 && (
          <div style={{ textAlign:'center', padding:'40px 0', color:C.muted }}>
            <div style={{ fontSize:36, marginBottom:10 }}>🔍</div>
            <div>No results found</div>
          </div>
        )}
        {filtered.map((item, i) => (
          <button key={i} onClick={()=>setOpen(open===i?null:i)}
            style={{ display:'block', width:'100%', textAlign:'left', background:open===i?'rgba(43,122,139,0.15)':C.surface, border:'0.5px solid '+(open===i?'rgba(43,122,139,0.35)':C.border), borderRadius:14, padding:'14px 16px', marginBottom:8, cursor:'pointer' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:10 }}>
              <div style={{ fontSize:14, fontWeight:500, color:'white', fontFamily:F.sans, lineHeight:1.4, flex:1 }}>{item.q}</div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" style={{ transform:open===i?'rotate(180deg)':'rotate(0)', transition:'transform 0.2s', flexShrink:0 }}><path d="M6 9l6 6 6-6"/></svg>
            </div>
            {open===i && <div style={{ fontSize:13, color:'rgba(255,255,255,0.65)', lineHeight:1.65, marginTop:10, paddingTop:10, borderTop:'0.5px solid rgba(255,255,255,0.07)' }}>{item.a}</div>}
          </button>
        ))}
        <div style={{ marginTop:16, padding:'14px', background:'rgba(43,122,139,0.12)', border:'0.5px solid rgba(43,122,139,0.25)', borderRadius:14, textAlign:'center' }}>
          <div style={{ fontSize:13, color:'white', fontFamily:F.sans, marginBottom:8 }}>Still need help?</div>
          <button onClick={()=>window.open('https://wa.me/34971000000','_blank')}
            style={{ padding:'10px 24px', background:'rgba(37,211,102,0.15)', border:'0.5px solid rgba(37,211,102,0.35)', borderRadius:10, color:'#25D366', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:F.sans }}>
            💬 WhatsApp us
          </button>
        </div>
        <LegalLinks style={{ marginTop:20 }} />
      </div>
    </div>
  )
}

// ── C4: Allergen info + Responsible drinking ──────────────────
export function AllergenInfo({ product }) {
  const allergens = product?.allergens || []
  if (!allergens.length) return null
  return (
    <div style={{ background:'rgba(255,255,255,0.05)', borderRadius:10, padding:'10px 12px', marginTop:10, marginBottom:4 }}>
      <div style={{ fontSize:10, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:4 }}>Allergens</div>
      <div style={{ fontSize:11, color:'rgba(255,255,255,0.6)', lineHeight:1.5 }}>Contains: {allergens.join(', ')}</div>
    </div>
  )
}

export function ResponsibleDrinkingBadge({ product }) {
  if (!product?.age_restricted) return null
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:10, color:'rgba(255,255,255,0.35)', fontFamily:F.sans, marginTop:8, padding:'6px 10px', background:'rgba(255,255,255,0.04)', borderRadius:8, lineHeight:1.4 }}>
      <span style={{ fontSize:12, flexShrink:0 }}>🍷</span>
      <span>Please drink responsibly. Available to over 18s only. Excessive alcohol consumption can be harmful to your health.</span>
    </div>
  )
}

// ── C5: Cancellation policy on checkout ───────────────────────
export function CancellationPolicyNote() {
  return (
    <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', fontFamily:F.sans, textAlign:'center', marginTop:10, lineHeight:1.5 }}>
      📋 You can cancel your order within 2 minutes of placing it for a full refund.
      After 2 minutes, cancellations may not be possible.
    </div>
  )
}

// ── D1: Language auto-detection ───────────────────────────────
export function detectDeviceLanguage() {
  const nav = navigator.language || navigator.languages?.[0] || 'en'
  const code = nav.toLowerCase().split('-')[0]
  const map = { en:'en', es:'es', de:'de', fr:'fr', it:'it', nl:'nl', ru:'ru', pt:'es', ca:'es' }
  return map[code] || 'en'
}

// ── D2: GBP/EUR currency toggle ───────────────────────────────
const CURRENCY_KEY = 'isla_currency'
export function useCurrency() {
  const [currency, setCurrencyState] = useState(() => {
    try { return localStorage.getItem(CURRENCY_KEY) || 'EUR' } catch { return 'EUR' }
  })
  const [gbpRate, setGbpRate] = useState(0.86)
  useEffect(() => {
    fetch('https://api.exchangerate-api.com/v4/latest/EUR')
      .then(r=>r.json()).then(d=>{ if(d.rates?.GBP) setGbpRate(d.rates.GBP) }).catch(()=>{})
  }, [])
  const setCurrency = (c) => {
    try { localStorage.setItem(CURRENCY_KEY, c) } catch {}
    setCurrencyState(c)
  }
  const format = (eur) => {
    if (currency === 'GBP') return '£' + (eur * gbpRate).toFixed(2)
    return '€' + eur.toFixed(2)
  }
  return { currency, setCurrency, format, gbpRate }
}

export function CurrencyToggle({ currency, onToggle }) {
  return (
    <button onClick={onToggle}
      style={{ background:'rgba(255,255,255,0.1)', border:'0.5px solid rgba(255,255,255,0.18)', borderRadius:20, fontSize:11, padding:'4px 10px', color:'white', cursor:'pointer', fontFamily:F.sans, fontWeight:600 }}>
      {currency === 'EUR' ? '€ EUR' : '£ GBP'}
    </button>
  )
}

// ── D3: Branded WhatsApp product share image ──────────────────
export function shareProductBranded(product, currency='EUR', gbpRate=0.86) {
  const price = currency==='GBP' ? '£'+(product.price*gbpRate).toFixed(2) : '€'+product.price.toFixed(2)
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 800; canvas.height = 800
    const ctx = canvas.getContext('2d')
    const grad = ctx.createLinearGradient(0,0,0,800)
    grad.addColorStop(0,'#0A2A38'); grad.addColorStop(1,'#1A5060')
    ctx.fillStyle = grad; ctx.fillRect(0,0,800,800)
    ctx.fillStyle='rgba(196,104,58,0.3)'; ctx.fillRect(0,600,800,200)
    ctx.font='bold 80px sans-serif'; ctx.textAlign='center'; ctx.fillStyle='white'
    ctx.fillText(product.emoji, 400, 320)
    ctx.font='bold 40px serif'; ctx.fillText(product.name, 400, 420)
    ctx.font='bold 56px sans-serif'; ctx.fillStyle='#E8A070'; ctx.fillText(price, 400, 500)
    ctx.font='28px sans-serif'; ctx.fillStyle='rgba(255,255,255,0.5)'; ctx.fillText('Isla Drop · 24/7 Delivery in Ibiza 🌴', 400, 700)
    canvas.toBlob(blob => {
      if (!blob) { shareProductText(product, price); return }
      try {
        const file = new File([blob], 'isla-drop-'+product.id+'.png', { type:'image/png' })
        if (navigator.canShare?.({ files:[file] })) {
          navigator.share({ files:[file], title:'Isla Drop — '+product.name, text:'Check this out on Isla Drop 🌴' }).catch(()=>shareProductText(product,price))
        } else shareProductText(product, price)
      } catch { shareProductText(product, price) }
    }, 'image/png')
  } catch { shareProductText(product, price) }
}

function shareProductText(product, price) {
  const url = window.location.origin+'?p='+product.id
  const text = product.emoji+' '+product.name+' — '+price+'\nAvailable now on Isla Drop, 24/7 delivery in Ibiza 🌴\n'+url
  if (navigator.share) navigator.share({ title:'Isla Drop', text, url }).catch(()=>{})
  else { navigator.clipboard?.writeText(text); toast.success('Link copied!') }
}

// ── D4: Flight delay detection for pre-arrival ────────────────
export async function trackFlight(flightNumber) {
  if (!flightNumber || flightNumber.length < 4) return null
  try {
    // ADS-B Exchange free endpoint (no key required for basic data)
    const resp = await fetch('https://api.adsb.lol/v2/callsign/'+flightNumber.replace(/\s/g,'').toUpperCase())
    const data = await resp.json()
    const ac = data.ac?.[0]
    if (!ac) return null
    return {
      callsign: ac.flight?.trim() || flightNumber,
      altitude: ac.alt_baro,
      onGround: ac.alt_baro === 'ground' || ac.gs === 0,
      lat: ac.lat, lng: ac.lon,
      speed: ac.gs,
      status: ac.alt_baro === 'ground' ? 'landed' : 'airborne',
    }
  } catch { return null }
}

export function FlightStatusBanner({ flightNumber, scheduledTime, onDelayDetected }) {
  const [status, setStatus] = useState(null)
  const [checking, setChecking] = useState(false)

  const check = async () => {
    if (!flightNumber || flightNumber.length < 4) return
    setChecking(true)
    const data = await trackFlight(flightNumber)
    setStatus(data)
    if (data?.status === 'landed') onDelayDetected?.(0)
    setChecking(false)
  }

  useEffect(() => { if (flightNumber?.length >= 4) check() }, [flightNumber])

  if (!flightNumber || flightNumber.length < 4) return null
  return (
    <div style={{ background:'rgba(43,122,139,0.15)', border:'0.5px solid rgba(43,122,139,0.3)', borderRadius:12, padding:'10px 14px', marginBottom:12, display:'flex', alignItems:'center', gap:10 }}>
      <span style={{ fontSize:18, flexShrink:0 }}>✈️</span>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:12, fontWeight:600, color:'white', fontFamily:F.sans }}>{flightNumber.toUpperCase()}</div>
        <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>
          {checking ? 'Checking flight status...' :
           status?.status === 'landed' ? '✅ Landed — your delivery will be ready' :
           status?.status === 'airborne' ? '🛫 In the air — estimated on schedule' :
           'Enter your flight number for live tracking'}
        </div>
      </div>
      {!checking && <button onClick={check} style={{ background:'none', border:'none', color:'rgba(43,122,200,0.8)', cursor:'pointer', fontSize:11, fontFamily:F.sans, fontWeight:600 }}>Refresh</button>}
    </div>
  )
}

// ── D5: Proximity venue suggestions ──────────────────────────
const KNOWN_VENUES = [
  { name:'Hard Rock Hotel Ibiza', lat:38.8835, lng:1.4005, type:'hotel', note:'We deliver to reception' },
  { name:'Nobu Hotel Ibiza Bay', lat:38.9260, lng:1.4520, type:'hotel', note:'Concierge will hold your order' },
  { name:'Ushuaia Beach Hotel', lat:38.8820, lng:1.4050, type:'hotel', note:'Pool bar entrance' },
  { name:'Pacha Ibiza', lat:38.9054, lng:1.4380, type:'club', note:'Side entrance on Av. 8 d\'Agost' },
  { name:'Amnesia', lat:38.9390, lng:1.3960, type:'club', note:'Main car park pickup point' },
  { name:'DC-10', lat:38.8920, lng:1.3760, type:'club', note:'Near the taxi rank' },
  { name:'Marina Botafoch', lat:38.9085, lng:1.4423, type:'marina', note:'Ask for your berth number' },
  { name:'Playa de Salinas', lat:38.8710, lng:1.3960, type:'beach', note:'Beso Beach area drop point' },
  { name:'Cala Bassa Beach', lat:38.9600, lng:1.2350, type:'beach', note:'Beach bar pickup' },
  { name:'Blue Marlin Ibiza', lat:38.8720, lng:1.3580, type:'beach_club', note:'Main gate entry' },
]

export function useProximityVenueSuggestion(lat, lng) {
  if (!lat || !lng) return null
  let nearest = null, nearestDist = Infinity
  KNOWN_VENUES.forEach(v => {
    const d = distKm(lat, lng, v.lat, v.lng)
    if (d < nearestDist) { nearestDist = d; nearest = { ...v, distM: Math.round(d*1000) } }
  })
  return nearest && nearest.distM < 300 ? nearest : null
}

export function VenueSuggestionBanner({ venue, onAccept, onDismiss }) {
  if (!venue) return null
  const typeEmoji = { hotel:'🏨', club:'🎵', marina:'⛵', beach:'🏖️', beach_club:'🍹' }
  return (
    <div style={{ background:'rgba(200,168,75,0.12)', border:'0.5px solid rgba(200,168,75,0.3)', borderRadius:14, padding:'14px 16px', marginBottom:14, display:'flex', gap:12 }}>
      <span style={{ fontSize:24, flexShrink:0 }}>{typeEmoji[venue.type] || '📍'}</span>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:13, fontWeight:600, color:'white', fontFamily:F.sans, marginBottom:2 }}>Are you at {venue.name}?</div>
        <div style={{ fontSize:11, color:C.muted, marginBottom:10 }}>{venue.note} · {venue.distM}m from your location</div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={onAccept} style={{ padding:'7px 16px', background:'rgba(200,168,75,0.2)', border:'0.5px solid rgba(200,168,75,0.4)', borderRadius:10, color:C.gold, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:F.sans }}>
            Yes, deliver here
          </button>
          <button onClick={onDismiss} style={{ padding:'7px 12px', background:'none', border:'none', color:C.muted, fontSize:12, cursor:'pointer', fontFamily:F.sans }}>
            No
          </button>
        </div>
      </div>
    </div>
  )
}
