// ================================================================
// Isla Drop — CustomerFeatures_world.jsx
// 15 world-class features: saved cards, address autocomplete,
// notification centre, WhatsApp confirm, product reviews,
// trending row, loyalty redemption, dietary filters,
// "your usual" detection, gift message, substitution pref,
// loyalty points on home, morning after kit, pre-arrival order,
// pool party mode, live event calendar, group order, send a gift
// ================================================================
import { useState, useEffect, useRef, useCallback } from 'react'
import { useCartStore, useAuthStore } from '../../lib/store'
import { PRODUCTS, BEST_SELLERS, CATEGORIES } from '../../lib/products'
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

// ── FEATURE 1: Saved payment card via Stripe ──────────────────
// Stripe Customer ID persisted per user in profiles table
// On checkout — if savedCard exists, show 1-tap pay option
export function useSavedCard() {
  const { user } = useAuthStore()
  const [savedCard, setSavedCard] = useState(null)
  useEffect(() => {
    if (!user) return
    import('../../lib/supabase').then(({ supabase }) => {
      supabase.from('profiles').select('stripe_customer_id,saved_card_last4,saved_card_brand')
        .eq('id', user.id).single()
        .then(({ data }) => {
          if (data?.stripe_customer_id && data?.saved_card_last4) setSavedCard(data)
        }).catch(() => {})
    }).catch(() => {})
  }, [user])
  return savedCard
}

export function SavedCardRow({ savedCard, onUse, onRemove }) {
  if (!savedCard) return null
  const brand = (savedCard.saved_card_brand || 'Card').charAt(0).toUpperCase() + (savedCard.saved_card_brand || 'Card').slice(1)
  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ fontSize:13, color:C.muted, marginBottom:10, textTransform:'uppercase', letterSpacing:'0.5px', fontFamily:F.sans }}>Saved card</div>
      <div style={{ background:'rgba(255,255,255,0.07)', border:'0.5px solid rgba(43,122,139,0.4)', borderRadius:14, padding:'14px 16px', display:'flex', alignItems:'center', gap:12 }}>
        <div style={{ width:40, height:28, background:'rgba(255,255,255,0.1)', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
          {savedCard.saved_card_brand === 'visa' ? '💳' : savedCard.saved_card_brand === 'amex' ? '💳' : '💳'}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, fontWeight:600, color:'white', fontFamily:F.sans }}>{brand} ending {savedCard.saved_card_last4}</div>
          <div style={{ fontSize:11, color:C.muted }}>Tap to pay instantly</div>
        </div>
        <button onClick={onUse}
          style={{ padding:'9px 18px', background:'#C4683A', border:'none', borderRadius:10, color:'white', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:F.sans }}>
          Use
        </button>
      </div>
      <button onClick={onRemove} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.3)', cursor:'pointer', fontSize:11, fontFamily:F.sans, marginTop:6, padding:'0 4px' }}>
        Remove saved card
      </button>
    </div>
  )
}

// ── FEATURE 2: Address autocomplete (Google Places) ───────────
export function AddressAutocomplete({ onSelect, placeholder='Search your address...' }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef(null)

  const search = useCallback((q) => {
    if (q.length < 3) { setResults([]); return }
    setLoading(true)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const key = import.meta.env.VITE_GOOGLE_PLACES_KEY || ''
        if (!key) {
          // Fallback: Ibiza common locations
          const IBIZA = [
            { place_id:'ibiza-1', description:'Pacha Ibiza, Passeig Joan Carles I, Ibiza Town', lat:38.9054, lng:1.4380 },
            { place_id:'ibiza-2', description:'Ushuaia Beach Hotel, Playa den Bossa', lat:38.8820, lng:1.4050 },
            { place_id:'ibiza-3', description:'Marina Botafoch, Ibiza Town', lat:38.9085, lng:1.4423 },
            { place_id:'ibiza-4', description:'Playa den Bossa Beach, Sant Josep', lat:38.8830, lng:1.4100 },
            { place_id:'ibiza-5', description:'San Antonio Town Centre, Ibiza', lat:38.9800, lng:1.3030 },
            { place_id:'ibiza-6', description:'Amnesia Club, San Rafael, Ibiza', lat:38.9390, lng:1.3960 },
            { place_id:'ibiza-7', description:'Santa Eulalia Town Centre, Ibiza', lat:38.9840, lng:1.5330 },
            { place_id:'ibiza-8', description:'Cala Bassa Beach, West Ibiza', lat:38.9600, lng:1.2350 },
            { place_id:'ibiza-9', description:'Es Canar Beach, Ibiza', lat:39.0080, lng:1.5530 },
            { place_id:'ibiza-10', description:'Ibiza Airport (IBZ), Ibiza', lat:38.8730, lng:1.3730 },
          ].filter(r => r.description.toLowerCase().includes(q.toLowerCase()))
          setResults(IBIZA)
          setLoading(false)
          return
        }
        const resp = await fetch(
          'https://maps.googleapis.com/maps/api/place/autocomplete/json?input=' +
          encodeURIComponent(q) + '&components=country:es&location=38.9067,1.4326&radius=30000&key=' + key
        )
        const data = await resp.json()
        setResults((data.predictions || []).map(p => ({
          place_id: p.place_id,
          description: p.description,
        })))
      } catch { setResults([]) }
      setLoading(false)
    }, 350)
  }, [])

  const selectPlace = async (place) => {
    setQuery(place.description)
    setResults([])
    if (place.lat) { onSelect({ address: place.description, lat: place.lat, lng: place.lng }); return }
    try {
      const key = import.meta.env.VITE_GOOGLE_PLACES_KEY || ''
      const resp = await fetch('https://maps.googleapis.com/maps/api/place/details/json?place_id=' + place.place_id + '&fields=geometry&key=' + key)
      const data = await resp.json()
      const loc = data.result?.geometry?.location
      onSelect({ address: place.description, lat: loc?.lat || 38.9067, lng: loc?.lng || 1.4326 })
    } catch { onSelect({ address: place.description, lat: 38.9067, lng: 1.4326 }) }
  }

  return (
    <div style={{ marginBottom:14, position:'relative' }}>
      <div style={{ display:'flex', alignItems:'center', background:'rgba(255,255,255,0.09)', border:'0.5px solid rgba(255,255,255,0.2)', borderRadius:12, padding:'12px 14px', gap:8 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        <input value={query} onChange={e=>{ setQuery(e.target.value); search(e.target.value) }}
          placeholder={placeholder}
          style={{ flex:1, background:'none', border:'none', color:'white', fontSize:14, fontFamily:F.sans, outline:'none' }}/>
        {loading && <div style={{ width:14,height:14,border:'2px solid rgba(255,255,255,0.2)',borderTopColor:C.accent,borderRadius:'50%',animation:'spin 0.7s linear infinite',flexShrink:0 }}/>}
        {query && !loading && <button onClick={()=>{setQuery('');setResults([])}} style={{ background:'none',border:'none',color:C.muted,cursor:'pointer',fontSize:16,padding:0 }}>✕</button>}
      </div>
      {results.length > 0 && (
        <div style={{ position:'absolute', top:'100%', left:0, right:0, background:'#0D3B4A', border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:12, overflow:'hidden', zIndex:100, marginTop:4, boxShadow:'0 8px 32px rgba(0,0,0,0.4)' }}>
          {results.map((r,i) => (
            <button key={r.place_id+i} onClick={()=>selectPlace(r)}
              style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'12px 14px', background:'none', border:'none', borderBottom:'0.5px solid rgba(255,255,255,0.06)', cursor:'pointer', textAlign:'left' }}>
              <span style={{ fontSize:16, flexShrink:0 }}>📍</span>
              <span style={{ fontSize:13, color:'white', fontFamily:F.sans, lineHeight:1.4 }}>{r.description}</span>
            </button>
          ))}
        </div>
      )}
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  )
}

// ── FEATURE 3: In-app notification centre ─────────────────────
const NOTIF_KEY = 'isla_notifs'
export function useNotifications() {
  const [notifs, setNotifs] = useState(() => {
    try { return JSON.parse(localStorage.getItem(NOTIF_KEY) || '[]') } catch { return [] }
  })
  const unread = notifs.filter(n => !n.read).length
  const add = useCallback((notif) => {
    const n = { id: Date.now(), read:false, ts: new Date().toISOString(), ...notif }
    setNotifs(prev => {
      const next = [n, ...prev].slice(0, 50)
      try { localStorage.setItem(NOTIF_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])
  const markRead = useCallback((id) => {
    setNotifs(prev => {
      const next = prev.map(n => n.id===id ? {...n,read:true} : n)
      try { localStorage.setItem(NOTIF_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])
  const markAllRead = useCallback(() => {
    setNotifs(prev => {
      const next = prev.map(n => ({...n,read:true}))
      try { localStorage.setItem(NOTIF_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])
  const clear = useCallback(() => {
    setNotifs([])
    try { localStorage.removeItem(NOTIF_KEY) } catch {}
  }, [])
  return { notifs, unread, add, markRead, markAllRead, clear }
}

export function NotificationBell({ unread, onClick }) {
  return (
    <button onClick={onClick} style={{ position:'relative', width:36, height:36, background:'rgba(255,255,255,0.1)', border:'0.5px solid rgba(255,255,255,0.18)', borderRadius:'50%', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
      {unread > 0 && (
        <div style={{ position:'absolute', top:-3, right:-3, width:16, height:16, background:'#C4683A', borderRadius:'50%', fontSize:9, fontWeight:700, color:'white', display:'flex', alignItems:'center', justifyContent:'center', border:'1.5px solid rgba(13,53,69,1)' }}>
          {unread > 9 ? '9+' : unread}
        </div>
      )}
    </button>
  )
}

export function NotificationCentre({ notifs, onMarkRead, onMarkAll, onClear, onClose }) {
  const ICONS = { order:'🛵', promo:'⚡', loyalty:'🌴', concierge:'✨', system:'📢' }
  return (
    <Sheet onClose={onClose} maxH="90vh">
      <div style={{ padding:'16px 20px 8px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ fontFamily:F.serif, fontSize:22, color:'white' }}>Notifications</div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={onMarkAll} style={{ fontSize:11, color:C.muted, background:'none', border:'none', cursor:'pointer', fontFamily:F.sans }}>Mark all read</button>
          <button onClick={onClear} style={{ fontSize:11, color:'rgba(196,104,58,0.7)', background:'none', border:'none', cursor:'pointer', fontFamily:F.sans }}>Clear</button>
        </div>
      </div>
      <div style={{ padding:'0 0 40px' }}>
        {notifs.length === 0 && (
          <div style={{ textAlign:'center', padding:'48px 20px' }}>
            <div style={{ fontSize:40, marginBottom:12 }}>🔔</div>
            <div style={{ fontFamily:F.serif, fontSize:20, color:'white', marginBottom:6 }}>All caught up</div>
            <div style={{ fontSize:13, color:C.muted }}>Order updates, promos and Isla news will appear here</div>
          </div>
        )}
        {notifs.map(n => (
          <button key={n.id} onClick={()=>onMarkRead(n.id)}
            style={{ display:'flex', gap:14, width:'100%', padding:'14px 20px', background:n.read?'transparent':'rgba(196,104,58,0.06)', border:'none', borderBottom:'0.5px solid rgba(255,255,255,0.05)', cursor:'pointer', textAlign:'left' }}>
            <div style={{ width:40, height:40, borderRadius:'50%', background:n.read?'rgba(255,255,255,0.08)':'rgba(196,104,58,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
              {ICONS[n.type] || '📢'}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:n.read?400:600, color:'white', fontFamily:F.sans, marginBottom:3, lineHeight:1.4 }}>{n.title}</div>
              <div style={{ fontSize:12, color:C.muted, lineHeight:1.4 }}>{n.body}</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', marginTop:4 }}>
                {new Date(n.ts).toLocaleDateString('en-GB',{hour:'2-digit',minute:'2-digit',day:'numeric',month:'short'})}
              </div>
            </div>
            {!n.read && <div style={{ width:8, height:8, borderRadius:'50%', background:'#C4683A', flexShrink:0, marginTop:4 }}/>}
          </button>
        ))}
      </div>
    </Sheet>
  )
}

// ── FEATURE 4: WhatsApp order confirmation ────────────────────
export async function sendWhatsAppConfirmation({ phone, orderNumber, items, total, etaMins }) {
  if (!phone) return
  const itemList = (items || []).slice(0,3).map(i => i.product?.emoji + ' ' + i.product?.name + ' x' + i.quantity).join(', ')
  const more = items?.length > 3 ? ' +' + (items.length-3) + ' more' : ''
  const msg = 'Hi! Your Isla Drop order #' + orderNumber + ' is confirmed! ' +
    itemList + more + '. Total: €' + total + '. ' +
    'Estimated delivery: ' + (etaMins||18) + ' min. ' +
    'Track live: https://www.isladrop.net/track/' + orderNumber +
    ' Questions? Reply to this message. 🌴'
  const url = 'https://wa.me/' + phone.replace(/\D/g,'') + '?text=' + encodeURIComponent(msg)
  try { window.open(url, '_blank') } catch {}
}

// ── FEATURE 5: Product reviews in detail sheet ────────────────
export function useProductReviews(productId) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!productId) { setLoading(false); return }
    import('../../lib/supabase').then(({ supabase }) => {
      supabase.from('product_reviews').select('*').eq('product_id', productId)
        .eq('approved', true).order('created_at', { ascending:false }).limit(10)
        .then(({ data }) => { setReviews(data || []); setLoading(false) })
        .catch(() => setLoading(false))
    }).catch(() => setLoading(false))
  }, [productId])
  const avg = reviews.length ? (reviews.reduce((s,r)=>s+r.rating,0)/reviews.length).toFixed(1) : null
  return { reviews, loading, avg, count: reviews.length }
}

export function ProductReviews({ productId }) {
  const { reviews, loading, avg, count } = useProductReviews(productId)
  if (loading) return null
  if (count === 0) return (
    <div style={{ padding:'12px 0', fontSize:12, color:C.muted, fontFamily:F.sans }}>No reviews yet — be the first after your order!</div>
  )
  return (
    <div style={{ marginTop:16 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
        <div style={{ fontFamily:F.serif, fontSize:18, color:'white' }}>Reviews</div>
        <div style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(200,168,75,0.15)', border:'0.5px solid rgba(200,168,75,0.3)', borderRadius:20, padding:'3px 12px' }}>
          <span style={{ color:C.gold, fontSize:14 }}>★</span>
          <span style={{ fontSize:13, fontWeight:700, color:'white' }}>{avg}</span>
          <span style={{ fontSize:11, color:C.muted }}>({count})</span>
        </div>
      </div>
      {reviews.slice(0,3).map((r,i) => (
        <div key={i} style={{ borderBottom:'0.5px solid rgba(255,255,255,0.07)', paddingBottom:12, marginBottom:12 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
            <div style={{ fontSize:12, fontWeight:600, color:'white', fontFamily:F.sans }}>{r.reviewer_name || 'Verified buyer'}</div>
            <div style={{ display:'flex', gap:2 }}>
              {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize:11, opacity:s<=r.rating?1:0.25 }}>★</span>)}
            </div>
          </div>
          {r.comment && <div style={{ fontSize:12, color:'rgba(255,255,255,0.65)', lineHeight:1.55 }}>{r.comment}</div>}
          <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', marginTop:4 }}>
            {new Date(r.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}
          </div>
        </div>
      ))}
    </div>
  )
}

// Avg rating badge for product cards
export function ProductRatingBadge({ productId, avgRating, reviewCount }) {
  if (!avgRating || avgRating === '0.0') return null
  return (
    <div style={{ display:'inline-flex', alignItems:'center', gap:3, background:'rgba(200,168,75,0.15)', borderRadius:99, padding:'2px 8px' }}>
      <span style={{ color:C.gold, fontSize:11 }}>★</span>
      <span style={{ fontSize:11, fontWeight:600, color:'white' }}>{avgRating}</span>
      {reviewCount && <span style={{ fontSize:10, color:C.muted }}>({reviewCount})</span>}
    </div>
  )
}

// ── FEATURE 6: Trending now row ───────────────────────────────
export function useTrending() {
  const [trending, setTrending] = useState([])
  useEffect(() => {
    import('../../lib/supabase').then(({ supabase }) => {
      const oneHourAgo = new Date(Date.now() - 3600000).toISOString()
      supabase.from('order_items').select('product_id, count:product_id.count()')
        .gte('created_at', oneHourAgo).order('count', { ascending:false }).limit(8)
        .then(({ data }) => {
          if (!data?.length) { setTrending(BEST_SELLERS.slice(0,8)); return }
          const ps = data.map(d => PRODUCTS.find(p => p.id === d.product_id)).filter(Boolean)
          setTrending(ps.length >= 3 ? ps : BEST_SELLERS.slice(0,8))
        }).catch(() => setTrending(BEST_SELLERS.slice(0,8)))
    }).catch(() => setTrending(BEST_SELLERS.slice(0,8)))
  }, [])
  return trending
}

export function TrendingRow({ onDetail }) {
  const trending = useTrending()
  const { addItem } = useCartStore()
  if (!trending.length) return null
  return (
    <div style={{ marginBottom:22 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0 16px', marginBottom:12 }}>
        <div style={{ fontFamily:F.serif, fontSize:20, color:'white', display:'flex', alignItems:'center', gap:6 }}>
          📈 Trending now
        </div>
        <div style={{ fontSize:11, color:C.muted, fontFamily:F.sans }}>last hour</div>
      </div>
      <div style={{ display:'flex', gap:10, overflowX:'auto', padding:'0 16px 4px', scrollbarWidth:'none' }}>
        {trending.map((p,i) => (
          <div key={p.id} onClick={()=>onDetail&&onDetail(p)}
            style={{ background:'rgba(255,255,255,0.92)', borderRadius:14, overflow:'hidden', minWidth:120, maxWidth:120, flexShrink:0, cursor:'pointer', position:'relative' }}>
            <div style={{ position:'absolute', top:5, left:5, background:C.accent, color:'white', fontSize:8, fontWeight:700, padding:'2px 6px', borderRadius:99, zIndex:1 }}>#{i+1}</div>
            <div style={{ height:88, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(255,255,255,0.5)', fontSize:32 }}>{p.emoji}</div>
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

// ── FEATURE 7: Loyalty redemption at checkout ─────────────────
export function LoyaltyRedemptionRow({ onRedeem, redeemed, onRemove }) {
  const { user } = useAuthStore()
  const [stamps, setStamps] = useState(0)
  useEffect(() => {
    if (!user) return
    import('../../lib/supabase').then(({ supabase }) => {
      supabase.from('loyalty_cards').select('stamps').eq('user_id', user.id).single()
        .then(({ data }) => { if (data) setStamps(data.stamps || 0) }).catch(() => {})
    }).catch(() => {})
  }, [user])

  if (!user || stamps < 10) return null
  if (redeemed) return (
    <div style={{ background:'rgba(126,232,162,0.1)', border:'0.5px solid rgba(126,232,162,0.3)', borderRadius:12, padding:'12px 14px', marginBottom:12, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
        <span style={{ fontSize:16 }}>🌴</span>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:C.green, fontFamily:F.sans }}>Free delivery applied!</div>
          <div style={{ fontSize:11, color:C.muted }}>1 loyalty stamp redeemed</div>
        </div>
      </div>
      <button onClick={onRemove} style={{ background:'none', border:'none', color:C.muted, cursor:'pointer', fontSize:18 }}>×</button>
    </div>
  )
  return (
    <div style={{ background:'rgba(200,168,75,0.1)', border:'0.5px solid rgba(200,168,75,0.3)', borderRadius:12, padding:'12px 14px', marginBottom:12, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
        <span style={{ fontSize:16 }}>🌴</span>
        <div>
          <div style={{ fontSize:13, fontWeight:600, color:C.gold, fontFamily:F.sans }}>You have {stamps} stamps!</div>
          <div style={{ fontSize:11, color:C.muted }}>Redeem for free delivery on this order</div>
        </div>
      </div>
      <button onClick={onRedeem}
        style={{ padding:'8px 14px', background:'rgba(200,168,75,0.25)', border:'0.5px solid rgba(200,168,75,0.5)', borderRadius:10, color:C.gold, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:F.sans }}>
        Redeem
      </button>
    </div>
  )
}

// ── FEATURE 8: Dietary preference filters ─────────────────────
const DIET_KEY = 'isla_dietary'
export function useDietaryPrefs() {
  const [prefs, setPrefs] = useState(() => {
    try { return JSON.parse(localStorage.getItem(DIET_KEY) || '[]') } catch { return [] }
  })
  const toggle = (tag) => {
    setPrefs(prev => {
      const next = prev.includes(tag) ? prev.filter(t=>t!==tag) : [...prev, tag]
      try { localStorage.setItem(DIET_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }
  return { prefs, toggle }
}

export const DIETARY_TAGS = [
  { id:'vegan', label:'Vegan', emoji:'🌱' },
  { id:'vegetarian', label:'Vegetarian', emoji:'🥦' },
  { id:'gluten_free', label:'Gluten-free', emoji:'🌾' },
  { id:'halal', label:'Halal', emoji:'☪️' },
  { id:'alcohol_free', label:'Alcohol-free', emoji:'🚫🍺' },
  { id:'low_cal', label:'Low-calorie', emoji:'⚖️' },
]

export function DietaryFilterBar({ prefs, onToggle }) {
  return (
    <div style={{ display:'flex', gap:7, overflowX:'auto', scrollbarWidth:'none', padding:'0 0 4px' }}>
      {DIETARY_TAGS.map(tag => (
        <button key={tag.id} onClick={()=>onToggle(tag.id)}
          style={{ padding:'6px 12px', borderRadius:20, fontSize:11, fontFamily:F.sans, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0, transition:'all 0.15s',
            background:prefs.includes(tag.id)?'rgba(126,232,162,0.2)':'rgba(255,255,255,0.08)',
            border:'0.5px solid '+(prefs.includes(tag.id)?'rgba(126,232,162,0.5)':'rgba(255,255,255,0.15)'),
            color:prefs.includes(tag.id)?C.green:'rgba(255,255,255,0.7)',
            fontWeight:prefs.includes(tag.id)?600:400 }}>
          {tag.emoji} {tag.label}
        </button>
      ))}
    </div>
  )
}

// ── FEATURE 9: "Your usual order" smart detection ─────────────
const USUAL_KEY = 'isla_usual'
export function detectUsualOrder(orderHistory) {
  if (!orderHistory || orderHistory.length < 2) return null
  try {
    const allItems = orderHistory.flatMap(o => (o.order_items||[]).map(i=>i.product_id)).filter(Boolean)
    const freq = allItems.reduce((acc,id)=>{ acc[id]=(acc[id]||0)+1; return acc }, {})
    const repeated = Object.entries(freq).filter(([,c])=>c>=2).map(([id])=>id)
    if (repeated.length >= 2) {
      localStorage.setItem(USUAL_KEY, JSON.stringify(repeated))
      return repeated
    }
  } catch {}
  return null
}

export function YourUsualCard({ productIds, onAddAll }) {
  const { addItem } = useCartStore()
  const products = (productIds||[]).map(id=>PRODUCTS.find(p=>p.id===id)).filter(Boolean).slice(0,4)
  if (products.length < 2) return null
  const handleAdd = () => {
    products.forEach(p=>addItem(p))
    toast.success('Your usual added to basket! 🛵', { duration:2000 })
    onAddAll?.()
  }
  return (
    <div style={{ margin:'0 16px 18px', background:'linear-gradient(135deg,rgba(43,122,139,0.2),rgba(13,53,69,0.3))', border:'0.5px solid rgba(43,122,139,0.4)', borderRadius:16, padding:'14px 16px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
        <div>
          <div style={{ fontSize:14, fontWeight:600, color:'white', fontFamily:F.sans }}>Your usual order 🔄</div>
          <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>Based on what you order most</div>
        </div>
        <button onClick={handleAdd}
          style={{ padding:'8px 16px', background:'#C4683A', border:'none', borderRadius:10, color:'white', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:F.sans }}>
          Add all
        </button>
      </div>
      <div style={{ display:'flex', gap:8 }}>
        {products.map(p=>(
          <div key={p.id} style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(255,255,255,0.08)', borderRadius:20, padding:'4px 10px' }}>
            <span style={{ fontSize:14 }}>{p.emoji}</span>
            <span style={{ fontSize:11, color:'white', fontFamily:F.sans }}>{p.name.split(' ')[0]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── FEATURE 10: Gift message at checkout ──────────────────────
export function GiftMessageToggle({ enabled, message, onToggle, onMessageChange }) {
  return (
    <div style={{ marginBottom:14 }}>
      <button onClick={onToggle}
        style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%', padding:'12px 14px', background:enabled?'rgba(200,168,75,0.1)':'rgba(255,255,255,0.06)', border:'0.5px solid '+(enabled?'rgba(200,168,75,0.35)':'rgba(255,255,255,0.12)'), borderRadius:12, cursor:'pointer', textAlign:'left' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:20 }}>🎁</span>
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:'white', fontFamily:F.sans }}>Is this a gift?</div>
            <div style={{ fontSize:11, color:C.muted }}>Add a message for the recipient</div>
          </div>
        </div>
        <div style={{ width:44, height:24, borderRadius:99, background:enabled?C.accent:'rgba(255,255,255,0.15)', position:'relative', flexShrink:0, transition:'background 0.2s' }}>
          <div style={{ position:'absolute', top:3, left:enabled?22:3, width:18, height:18, borderRadius:'50%', background:'white', transition:'left 0.2s' }}/>
        </div>
      </button>
      {enabled && (
        <div style={{ marginTop:8 }}>
          <textarea value={message} onChange={e=>onMessageChange(e.target.value)}
            placeholder="Happy birthday! Enjoy the drinks 🥂"
            rows={2} maxLength={200}
            style={{ width:'100%', padding:'11px 14px', background:'rgba(200,168,75,0.08)', border:'0.5px solid rgba(200,168,75,0.3)', borderRadius:10, color:'white', fontSize:13, fontFamily:F.sans, resize:'none', outline:'none', boxSizing:'border-box', lineHeight:1.5 }}/>
          <div style={{ fontSize:10, color:C.muted, textAlign:'right', marginTop:3 }}>{message.length}/200</div>
        </div>
      )}
    </div>
  )
}

// ── FEATURE 11: Substitution preference ──────────────────────
export function SubstitutionPreference({ value, onChange }) {
  const OPTIONS = [
    { id:'substitute', label:'Substitute if possible', sub:'Similar product of same value', emoji:'🔄' },
    { id:'refund',     label:'Refund out-of-stock items', sub:'Credit returned automatically', emoji:'💳' },
    { id:'contact',    label:'Contact me first', sub:'We will WhatsApp before changing', emoji:'💬' },
  ]
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ fontSize:12, color:C.muted, marginBottom:10, textTransform:'uppercase', letterSpacing:'0.5px', fontFamily:F.sans }}>If an item is out of stock</div>
      {OPTIONS.map(opt => (
        <button key={opt.id} onClick={()=>onChange(opt.id)}
          style={{ display:'flex', alignItems:'center', gap:12, width:'100%', padding:'11px 14px', background:value===opt.id?'rgba(196,104,58,0.15)':'rgba(255,255,255,0.06)', border:'0.5px solid '+(value===opt.id?'rgba(196,104,58,0.45)':'rgba(255,255,255,0.1)'), borderRadius:11, cursor:'pointer', marginBottom:6, textAlign:'left' }}>
          <span style={{ fontSize:18, flexShrink:0 }}>{opt.emoji}</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:value===opt.id?600:400, color:'white', fontFamily:F.sans }}>{opt.label}</div>
            <div style={{ fontSize:11, color:C.muted }}>{opt.sub}</div>
          </div>
          <div style={{ width:18, height:18, borderRadius:'50%', border:'2px solid '+(value===opt.id?C.accent:'rgba(255,255,255,0.3)'), background:value===opt.id?C.accent:'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            {value===opt.id && <div style={{ width:8, height:8, borderRadius:'50%', background:'white' }}/>}
          </div>
        </button>
      ))}
    </div>
  )
}

// ── FEATURE 12: Loyalty points on home header ─────────────────
export function LoyaltyHeaderBadge({ stamps, onClick }) {
  if (!stamps) return null
  return (
    <button onClick={onClick}
      style={{ background:'rgba(200,168,75,0.15)', border:'0.5px solid rgba(200,168,75,0.3)', borderRadius:20, fontSize:11, padding:'4px 10px', display:'flex', alignItems:'center', gap:5, color:C.gold, cursor:'pointer', fontFamily:F.sans, fontWeight:600 }}>
      🌴 {stamps} {stamps===1?'stamp':'stamps'}
    </button>
  )
}

export function useLoyaltyStamps() {
  const { user } = useAuthStore()
  const [stamps, setStamps] = useState(null)
  useEffect(() => {
    if (!user) return
    import('../../lib/supabase').then(({ supabase }) => {
      supabase.from('loyalty_cards').select('stamps').eq('user_id', user.id).single()
        .then(({ data }) => { if (data) setStamps(data.stamps || 0) }).catch(() => {})
    }).catch(() => {})
  }, [user])
  return stamps
}

// ── FEATURE 13: Morning after kit ────────────────────────────
const MA_KEY = 'isla_morning_after'
export function useMorningAfterKit() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 8 || hour > 14) return
    try {
      const lastNightOrder = localStorage.getItem(MA_KEY)
      if (!lastNightOrder) return
      const { ts } = JSON.parse(lastNightOrder)
      const lastNight = new Date(ts)
      const now = new Date()
      const hoursAgo = (now - lastNight) / 3600000
      if (hoursAgo >= 6 && hoursAgo <= 18) setShow(true)
    } catch {}
  }, [])
  const recordSpiritsOrder = () => {
    try { localStorage.setItem(MA_KEY, JSON.stringify({ ts: new Date().toISOString() })) } catch {}
  }
  const dismiss = () => setShow(false)
  return { show, dismiss, recordSpiritsOrder }
}

export function MorningAfterKitBanner({ onAddKit, onDismiss }) {
  const KIT = PRODUCTS.filter(p =>
    ['water','wellness','juice','painkillers','snacks'].some(tag => p.tags?.includes(tag)) ||
    ['soft_drinks','water_juice','snacks'].includes(p.category)
  ).slice(0,4)
  const fallbackProducts = BEST_SELLERS.filter(p => !p.age_restricted).slice(0,4)
  const products = KIT.length >= 2 ? KIT : fallbackProducts
  const { addItem } = useCartStore()

  return (
    <div style={{ margin:'0 16px 18px', background:'linear-gradient(135deg,rgba(196,104,58,0.15),rgba(80,40,10,0.2))', border:'0.5px solid rgba(196,104,58,0.35)', borderRadius:16, padding:'16px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
        <div>
          <div style={{ fontSize:20, marginBottom:4 }}>🤕</div>
          <div style={{ fontFamily:F.serif, fontSize:16, color:'white', marginBottom:3 }}>Feeling rough this morning?</div>
          <div style={{ fontSize:12, color:C.muted }}>Recovery essentials delivered in under 30 min</div>
        </div>
        <button onClick={onDismiss} style={{ background:'none', border:'none', color:C.muted, cursor:'pointer', fontSize:18, padding:0, flexShrink:0 }}>×</button>
      </div>
      <div style={{ display:'flex', gap:8, marginBottom:12 }}>
        {products.map(p=>(
          <div key={p.id} style={{ display:'flex', alignItems:'center', gap:4, background:'rgba(255,255,255,0.08)', borderRadius:20, padding:'4px 10px' }}>
            <span>{p.emoji}</span>
            <span style={{ fontSize:10, color:'white', fontFamily:F.sans }}>{p.name.split(' ').slice(0,2).join(' ')}</span>
          </div>
        ))}
      </div>
      <button onClick={()=>{ products.forEach(p=>addItem(p)); onDismiss(); toast.success('Recovery kit added! 🤕→😊', {duration:2000}) }}
        style={{ width:'100%', padding:'11px', background:'#C4683A', border:'none', borderRadius:12, color:'white', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:F.sans }}>
        Add recovery kit to basket →
      </button>
    </div>
  )
}

// ── FEATURE 14: Pre-arrival order ────────────────────────────
export function PreArrivalSheet({ onClose, onSchedule }) {
  const [arrivalDate, setArrivalDate] = useState('')
  const [arrivalTime, setArrivalTime] = useState('')
  const [villa, setVilla] = useState('')
  const [flightNum, setFlightNum] = useState('')

  const today = new Date()
  const dates = Array.from({length:30},(_,i)=>{
    const d = new Date(today); d.setDate(today.getDate()+i)
    return { value:d.toISOString().split('T')[0], label:d.toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'}) }
  })

  const confirm = () => {
    if (!arrivalDate||!arrivalTime||!villa.trim()) { toast.error('Please fill in all required fields'); return }
    onSchedule({ type:'pre_arrival', arrivalDate, arrivalTime, villa, flightNum, label:'Pre-arrival '+dates.find(d=>d.value===arrivalDate)?.label+' '+arrivalTime })
    toast.success('Pre-arrival order set! Your order will be ready when you arrive 🌴')
    onClose()
  }

  return (
    <Sheet onClose={onClose}>
      <div style={{ padding:'16px 20px 44px' }}>
        <button onClick={onClose}
          style={{ display:'flex',alignItems:'center',gap:6,background:'rgba(255,255,255,0.08)',border:'0.5px solid rgba(255,255,255,0.15)',borderRadius:20,padding:'6px 14px 6px 10px',cursor:'pointer',marginBottom:14,width:'fit-content' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          <span style={{ fontSize:12,color:'white',fontFamily:'DM Sans,sans-serif',fontWeight:500 }}>Back</span>
        </button>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:18 }}>
          <span style={{ fontSize:32 }}>✈️</span>
          <div>
            <div style={{ fontFamily:F.serif, fontSize:22, color:'white' }}>Pre-arrival order</div>
            <div style={{ fontSize:12, color:C.muted }}>Order now, delivered when you land</div>
          </div>
        </div>
        <div style={{ background:'rgba(43,122,139,0.15)', border:'0.5px solid rgba(43,122,139,0.3)', borderRadius:12, padding:'12px 14px', marginBottom:18, fontSize:12, color:'rgba(255,255,255,0.7)', lineHeight:1.6 }}>
          🌴 Order from home before you fly. We schedule delivery to arrive at your villa at the same time you do — drinks in the fridge, ice ready, everything waiting.
        </div>
        <div style={{ fontSize:12, color:C.muted, marginBottom:8 }}>Arrival date *</div>
        <div style={{ display:'flex', gap:7, overflowX:'auto', scrollbarWidth:'none', marginBottom:14, paddingBottom:2 }}>
          {dates.slice(0,14).map(d=>(
            <button key={d.value} onClick={()=>setArrivalDate(d.value)}
              style={{ padding:'9px 14px', borderRadius:12, fontSize:12, fontFamily:F.sans, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0, transition:'all 0.15s',
                background:arrivalDate===d.value?C.accent:'rgba(255,255,255,0.08)',
                border:'0.5px solid '+(arrivalDate===d.value?C.accent:'rgba(255,255,255,0.15)'),
                color:'white', fontWeight:arrivalDate===d.value?600:400 }}>
              {d.label}
            </button>
          ))}
        </div>
        <div style={{ fontSize:12, color:C.muted, marginBottom:8 }}>Estimated arrival time *</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6, marginBottom:14 }}>
          {['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00','23:00'].map(t=>(
            <button key={t} onClick={()=>setArrivalTime(t)}
              style={{ padding:'9px 0', borderRadius:10, fontSize:11, fontFamily:F.sans, cursor:'pointer',
                background:arrivalTime===t?C.accent:'rgba(255,255,255,0.07)',
                border:'0.5px solid '+(arrivalTime===t?C.accent:'rgba(255,255,255,0.1)'),
                color:'white', fontWeight:arrivalTime===t?600:400 }}>
              {t}
            </button>
          ))}
        </div>
        <div style={{ fontSize:12, color:C.muted, marginBottom:8 }}>Villa / delivery address *</div>
        <input value={villa} onChange={e=>setVilla(e.target.value)} placeholder="Villa name or full address"
          style={{ width:'100%', padding:'13px 16px', background:'rgba(255,255,255,0.08)', border:'0.5px solid rgba(255,255,255,0.2)', borderRadius:12, color:'white', fontSize:14, fontFamily:F.sans, outline:'none', boxSizing:'border-box', marginBottom:12 }}/>
        <div style={{ fontSize:12, color:C.muted, marginBottom:8 }}>Flight number (optional)</div>
        <input value={flightNum} onChange={e=>setFlightNum(e.target.value.toUpperCase())} placeholder="e.g. VY1234"
          style={{ width:'100%', padding:'13px 16px', background:'rgba(255,255,255,0.08)', border:'0.5px solid rgba(255,255,255,0.2)', borderRadius:12, color:'white', fontSize:14, fontFamily:F.sans, outline:'none', boxSizing:'border-box', marginBottom:20 }}/>
        <button onClick={confirm}
          style={{ width:'100%', padding:'16px', background:arrivalDate&&arrivalTime&&villa?C.accent:'rgba(255,255,255,0.1)', border:'none', borderRadius:14, color:'white', fontSize:15, fontWeight:600, cursor:arrivalDate&&arrivalTime&&villa?'pointer':'default', fontFamily:F.sans }}>
          Schedule pre-arrival delivery ✈️
        </button>
      </div>
    </Sheet>
  )
}

// ── FEATURE 15: Pool party mode ───────────────────────────────
export function PoolPartyMode({ onClose, onAddAll }) {
  const { addItem } = useCartStore()
  const [quantities, setQuantities] = useState({})
  const [guests, setGuests] = useState(10)
  const [tab, setTab] = useState('build') // build | ai
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState(null)
  const [aiError, setAiError] = useState('')

  const PARTY_PRODUCTS = [
    { category:'Spirits & Cocktails', emoji:'🍸', items: PRODUCTS.filter(p=>p.category==='spirits') },
    { category:'Beer & Cider', emoji:'🍺', items: PRODUCTS.filter(p=>p.category==='beer_cider') },
    { category:'Champagne & Wine', emoji:'🥂', items: PRODUCTS.filter(p=>['champagne','wine'].includes(p.category)) },
    { category:'Soft Drinks & Mixers', emoji:'🥤', items: PRODUCTS.filter(p=>p.category==='soft_drinks') },
    { category:'Water & Juice', emoji:'💧', items: PRODUCTS.filter(p=>p.category==='water_juice') },
    { category:'Ice & Essentials', emoji:'🧊', items: PRODUCTS.filter(p=>['ice','essentials'].includes(p.category)) },
    { category:'Snacks', emoji:'🍿', items: PRODUCTS.filter(p=>p.category==='snacks') },
  ].filter(c=>c.items.length>0)

  const runAI = async () => {
    const p = aiPrompt || guests+' guests, pool party'
    setAiLoading(true); setAiResult(null); setAiError('')
    try {
      const productList = PRODUCTS.slice(0,60).map(p=>p.id+'|'+p.name+'|EUR'+p.price+'|'+p.category).join(', ')
      const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
      if (!apiKey) throw new Error('No API key — add VITE_ANTHROPIC_API_KEY to Vercel')
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'anthropic-version':'2023-06-01', 'anthropic-dangerous-direct-browser-access':'true', 'x-api-key':apiKey },
        body: JSON.stringify({
          model:'claude-haiku-4-5-20251001', max_tokens:600,
          system:'You are an Ibiza pool party planner. Build the perfect drinks order. Respond ONLY with valid JSON: {"summary":"string","items":[{"product_id":"string","quantity":1}]}',
          messages:[{role:'user',content:'Pool party for '+p+'. Products: '+productList+'. Pick 8-15 items. Only use product IDs from the list.'}]
        })
      })
      if (!resp.ok) { const e=await resp.json().catch(()=>({})); throw new Error('API '+resp.status+': '+(e?.error?.message||resp.statusText)) }
      const data = await resp.json()
      const raw = data.content?.[0]?.text || ''
      const result = JSON.parse(raw.replace(/```json|```/g,'').trim())
      setAiResult(result)
      // Auto-populate quantities
      const newQtys = {}
      result.items?.forEach(item => { newQtys[item.product_id] = item.quantity||1 })
      setQuantities(prev=>({...prev,...newQtys}))
      setTab('build')
      toast.success('AI order built! Review and adjust below 🎉')
    } catch(err) { setAiError('Could not generate — '+(err.message||'try again')) }
    setAiLoading(false)
  }

  const setQty = (id, qty) => setQuantities(prev=>({...prev,[id]:Math.max(0,qty)}))
  const getQty = (id) => quantities[id] ?? 0
  const total = Object.entries(quantities).reduce((sum,[id,qty])=>{
    const p = PRODUCTS.find(p=>p.id===id)
    return sum + (p?.price||0)*qty
  }, 0)
  const itemCount = Object.values(quantities).reduce((s,q)=>s+q,0)

  const addAll = () => {
    let added = 0
    Object.entries(quantities).forEach(([id,qty])=>{
      const p = PRODUCTS.find(p=>p.id===id)
      if (p && qty>0) { for(let i=0;i<qty;i++) addItem(p); added+=qty }
    })
    if (added === 0) { toast.error('Set quantities first'); return }
    toast.success(added+' items added to basket! 🎉', { duration:2000 })
    onAddAll?.()
    onClose()
  }

  return (
    <Sheet onClose={onClose} maxH="92vh">
      <div style={{ padding:'16px 20px 100px' }}>
        {/* Back button */}
        <button onClick={onClose}
          style={{ display:'flex',alignItems:'center',gap:6,background:'rgba(255,255,255,0.08)',border:'0.5px solid rgba(255,255,255,0.15)',borderRadius:20,padding:'6px 12px 6px 8px',cursor:'pointer',marginBottom:14 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          <span style={{ fontSize:12,color:'white',fontFamily:F.sans }}>Back</span>
        </button>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
          <span style={{ fontSize:32 }}>🏊</span>
          <div>
            <div style={{ fontFamily:F.serif, fontSize:22, color:'white' }}>Pool party mode</div>
            <div style={{ fontSize:12, color:C.muted }}>Bulk ordering for your group</div>
          </div>
        </div>
        {/* Tabs */}
        <div style={{ display:'flex', gap:0, marginBottom:16, background:'rgba(255,255,255,0.05)', borderRadius:12, padding:3 }}>
          {[{id:'build',label:'🏗️ Build your order'},{id:'ai',label:'✨ AI builder'}].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{ flex:1,padding:'9px',border:'none',borderRadius:10,cursor:'pointer',fontSize:12,fontFamily:F.sans,fontWeight:tab===t.id?600:400,background:tab===t.id?C.accent:'transparent',color:'white',transition:'all 0.15s' }}>
              {t.label}
            </button>
          ))}
        </div>
        {/* AI Tab */}
        {tab==='ai' && (
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:12,color:C.muted,marginBottom:12,lineHeight:1.6 }}>Tell Isla about your party and she will build the perfect order automatically.</div>
            <div style={{ display:'flex',gap:8,marginBottom:10 }}>
              <input value={aiPrompt} onChange={e=>setAiPrompt(e.target.value)}
                placeholder={'Describe your party (default: '+guests+' guests)'}
                style={{ flex:1,padding:'11px 14px',background:'rgba(255,255,255,0.08)',border:'0.5px solid rgba(255,255,255,0.15)',borderRadius:24,color:'white',fontSize:13,fontFamily:F.sans,outline:'none' }}/>
              <button onClick={runAI} disabled={aiLoading}
                style={{ width:44,height:44,background:C.accent,border:'none',borderRadius:'50%',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                {aiLoading ? <div style={{ width:16,height:16,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'white',borderRadius:'50%',animation:'poolSpin 0.8s linear infinite' }}/> :
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M22 2L11 13"/><path d="M22 2L15 22l-4-9-9-4 20-7z"/></svg>}
              </button>
            </div>
            {aiError && <div style={{ fontSize:12,color:'rgba(240,149,149,0.8)',marginTop:8 }}>{aiError}</div>}
            {['12 guests, pool party afternoon','20 people, big night out','Boat trip for 8','Birthday party, 15 guests'].map(s=>(
              <button key={s} onClick={()=>runAI()} style={{ padding:'6px 12px',background:'rgba(255,255,255,0.07)',border:'0.5px solid rgba(255,255,255,0.12)',borderRadius:20,fontSize:11,color:C.muted,cursor:'pointer',fontFamily:F.sans,marginRight:6,marginBottom:6 }}>{s}</button>
            ))}
            <style>{'@keyframes poolSpin{to{transform:rotate(360deg)}}'}</style>
          </div>
        )}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20, background:C.surface, borderRadius:12, padding:'12px 14px' }}>
          <span style={{ fontSize:14, color:C.muted, fontFamily:F.sans }}>Guests:</span>
          <button onClick={()=>setGuests(g=>Math.max(2,g-2))} style={{ width:28,height:28,background:'rgba(255,255,255,0.1)',border:'none',borderRadius:'50%',color:'white',fontSize:16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>-</button>
          <span style={{ fontSize:18, fontWeight:700, color:'white', minWidth:32, textAlign:'center' }}>{guests}</span>
          <button onClick={()=>setGuests(g=>g+2)} style={{ width:28,height:28,background:C.accent,border:'none',borderRadius:'50%',color:'white',fontSize:16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>+</button>
          <span style={{ fontSize:11, color:C.muted, fontFamily:F.sans }}>Quantities default to serve {guests}</span>
        </div>

        {tab==='build' && PARTY_PRODUCTS.map(cat=>(
          <div key={cat.category} style={{ marginBottom:18 }}>
            <div style={{ fontSize:13, fontWeight:600, color:'white', marginBottom:10, fontFamily:F.sans }}>{cat.emoji} {cat.category}</div>
            {cat.items.map(p=>(
              <div key={p.id} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8, padding:'10px 0', borderBottom:'0.5px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize:22, flexShrink:0 }}>{p.emoji}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, color:'white', fontFamily:F.sans, lineHeight:1.3 }}>{p.name}</div>
                  <div style={{ fontSize:12, fontWeight:600, color:'#E8A070' }}>€{p.price.toFixed(2)}</div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                  <button onClick={()=>setQty(p.id,getQty(p.id)-1)} style={{ width:28,height:28,background:'rgba(255,255,255,0.1)',border:'none',borderRadius:'50%',color:'white',fontSize:16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>-</button>
                  <span style={{ fontSize:15, fontWeight:700, color:'white', minWidth:24, textAlign:'center' }}>{getQty(p.id)}</span>
                  <button onClick={()=>setQty(p.id,getQty(p.id)+1)} style={{ width:28,height:28,background:C.accent,border:'none',borderRadius:'50%',color:'white',fontSize:16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>+</button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Sticky footer */}
      <div style={{ position:'sticky', bottom:0, background:'rgba(13,53,69,0.98)', backdropFilter:'blur(10px)', borderTop:'0.5px solid rgba(255,255,255,0.1)', padding:'14px 20px 28px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
          <span style={{ fontSize:13, color:C.muted, fontFamily:F.sans }}>{itemCount} items selected</span>
          <span style={{ fontSize:15, fontWeight:700, color:'#E8A070' }}>€{total.toFixed(2)}</span>
        </div>
        <button onClick={addAll} disabled={itemCount===0}
          style={{ width:'100%', padding:'15px', background:itemCount>0?C.accent:'rgba(255,255,255,0.1)', border:'none', borderRadius:14, color:'white', fontSize:15, fontWeight:600, cursor:itemCount>0?'pointer':'default', fontFamily:F.sans }}>
          {itemCount>0?'Add '+itemCount+' items to basket 🎉':'Select items above'}
        </button>
      </div>
    </Sheet>
  )
}
