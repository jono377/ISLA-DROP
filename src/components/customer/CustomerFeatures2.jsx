import { useState, useEffect, useCallback, useRef } from 'react'
import { useCartStore, useAuthStore, useWishlistStore } from '../../lib/store'
import { supabase } from '../../lib/supabase'
import { PRODUCTS } from '../../lib/products'
import toast from 'react-hot-toast'
import ProductImage from '../shared/ProductImage'

const C = {
  bg:'#0D3545', accent:'#C4683A', accentDim:'rgba(196,104,58,0.18)',
  green:'#7EE8A2', greenDim:'rgba(126,232,162,0.12)',
  surface:'rgba(255,255,255,0.07)', surfaceB:'rgba(255,255,255,0.12)',
  border:'rgba(255,255,255,0.1)', muted:'rgba(255,255,255,0.45)',
  white:'white', text:'#2A2318', teal:'#2B7A8B',
}
const F = { serif:'DM Serif Display,serif', sans:'DM Sans,sans-serif' }

function Sheet({ onClose, children, maxH='88vh' }) {
  return (
    <div style={{ position:'fixed', inset:0, zIndex:500, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'flex-end' }} onClick={onClose}>
      <div style={{ width:'100%', maxWidth:480, margin:'0 auto', background:C.bg, borderRadius:'24px 24px 0 0', maxHeight:maxH, overflowY:'auto' }} onClick={e=>e.stopPropagation()}>
        <div style={{ width:36, height:4, background:'rgba(255,255,255,0.2)', borderRadius:2, margin:'20px auto 0' }} />
        {children}
      </div>
    </div>
  )
}

function SheetHeader({ title, onClose, sub }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 20px 16px' }}>
      <div>
        <div style={{ fontFamily:F.serif, fontSize:24, color:C.white }}>{title}</div>
        {sub && <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>{sub}</div>}
      </div>
      <button onClick={onClose} style={{ background:'none', border:'none', color:C.muted, fontSize:24, cursor:'pointer', lineHeight:1 }}>×</button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// WISHLIST
// ═══════════════════════════════════════════════════════════════
export function WishlistView({ onClose, onDetail }) {
  const { items } = useWishlistStore()
  const { addItem, items: cartItems, updateQuantity } = useCartStore()

  const addAll = () => {
    items.forEach(p => addItem(p))
    toast.success('All favourites added to basket! 🛒')
    onClose()
  }

  return (
    <Sheet onClose={onClose}>
      <SheetHeader title="❤️ Favourites" onClose={onClose} sub={items.length ? items.length + ' saved items' : 'Nothing saved yet'} />
      <div style={{ padding:'0 20px 48px' }}>
        {items.length === 0 ? (
          <div style={{ textAlign:'center', padding:'48px 0' }}>
            <div style={{ fontSize:52, marginBottom:14 }}>🤍</div>
            <div style={{ fontFamily:F.serif, fontSize:22, color:C.white, marginBottom:8 }}>No favourites yet</div>
            <div style={{ fontSize:13, color:C.muted }}>Tap the heart on any product to save it here</div>
          </div>
        ) : (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
              {items.map(product => (
                  <div key={product.id} style={{ background:C.surface, borderRadius:14, overflow:'hidden', border:'0.5px solid '+C.border, cursor:'pointer' }} onClick={()=>onDetail(product)}>
                    <div style={{ position:'relative', height:110 }}>
                      <ProductImage productId={product.id} emoji={product.emoji} category={product.category} alt={product.name} size="card" style={{ height:110, width:'100%' }} />
                      <WishlistHeart product={product} style={{ position:'absolute', top:8, right:8 }} />
                    </div>
                    <div style={{ padding:'10px 12px 12px' }}>
                      <div style={{ fontSize:12, color:C.white, lineHeight:1.3, marginBottom:6, height:30, overflow:'hidden' }}>{product.name}</div>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <span style={{ fontSize:14, fontWeight:700, color:C.accent }}>€{product.price.toFixed(2)}</span>
                        {(cartItems.find(i=>i.product.id===product.id)?.quantity||0) === 0 ? (
                          <button onClick={e=>{e.stopPropagation();addItem(product);toast.success(product.emoji+' Added!',{duration:800})}}
                            style={{ width:26, height:26, background:C.accent, border:'none', borderRadius:'50%', color:'white', fontSize:16, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
                        ) : (
                          <div style={{ display:'flex', alignItems:'center', gap:6 }} onClick={e=>e.stopPropagation()}>
                            <button onClick={()=>updateQuantity(product.id,(cartItems.find(i=>i.product.id===product.id)?.quantity||0)-1)} style={{ width:22, height:22, background:'rgba(255,255,255,0.15)', border:'none', borderRadius:'50%', color:'white', fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>
                            <span style={{ fontSize:12, color:C.white, minWidth:12, textAlign:'center' }}>{cartItems.find(i=>i.product.id===product.id)?.quantity||0}</span>
                            <button onClick={()=>updateQuantity(product.id,(cartItems.find(i=>i.product.id===product.id)?.quantity||0)+1)} style={{ width:22, height:22, background:C.accent, border:'none', borderRadius:'50%', color:'white', fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
              ))}
            </div>
            <button onClick={addAll} style={{ width:'100%', padding:'15px', background:C.accent, border:'none', borderRadius:14, color:'white', fontSize:15, fontWeight:600, cursor:'pointer', fontFamily:F.sans }}>
              Add all to basket · €{items.reduce((s,p)=>s+p.price,0).toFixed(2)}
            </button>
          </>
        )}
      </div>
    </Sheet>
  )
}

// Heart button — used everywhere
export function WishlistHeart({ product, style={} }) {
  const { toggle, has } = useWishlistStore()
  const liked = has(product.id)
  return (
    <button onClick={e=>{
        e.stopPropagation()
        const added = toggle(product)
        toast(added ? '❤️ Added to favourites' : '🤍 Removed from favourites', { duration:1200 })
      }}
      style={{ width:30, height:30, borderRadius:'50%', background:'rgba(0,0,0,0.45)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, lineHeight:1, backdropFilter:'blur(4px)', ...style }}>
      {liked ? '❤️' : '🤍'}
    </button>
  )
}

// ═══════════════════════════════════════════════════════════════
// UPSELL SUGGESTIONS — shown just before payment
// ═══════════════════════════════════════════════════════════════
export function UpsellSuggestions({ cartItems, onClose, onAddAll }) {
  const { addItem, items } = useCartStore()
  const [added, setAdded] = useState([])

  const cartCategories = [...new Set(cartItems.map(i=>i.product.category))]
  const cartIds = new Set(cartItems.map(i=>i.product.id))

  // Smart suggestions based on what's in cart
  const PAIRINGS = {
    spirits: ['ice','soft_drinks','snacks'],
    beer: ['snacks','ice'],
    wine: ['snacks'],
    champagne: ['ice','snacks'],
    soft_drinks: ['snacks'],
    snacks: ['soft_drinks'],
  }

  const suggestCategories = cartCategories.flatMap(c => PAIRINGS[c]||[])
  const suggestions = PRODUCTS
    .filter(p => suggestCategories.includes(p.category) && !cartIds.has(p.id) && p.popular)
    .slice(0,6)

  const addSuggestion = (product) => {
    addItem(product)
    setAdded(prev => [...prev, product.id])
    toast.success(product.emoji + ' Added!', { duration:800 })
  }

  if (suggestions.length === 0) { onClose(); return null }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:510, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'flex-end' }} onClick={onClose}>
      <div style={{ width:'100%', maxWidth:480, margin:'0 auto', background:C.bg, borderRadius:'24px 24px 0 0' }} onClick={e=>e.stopPropagation()}>
        <div style={{ padding:'20px 20px 40px' }}>
          <div style={{ width:36, height:4, background:'rgba(255,255,255,0.2)', borderRadius:2, margin:'0 auto 20px' }} />
          <div style={{ fontFamily:F.serif, fontSize:22, color:C.white, marginBottom:4 }}>Complete your order</div>
          <div style={{ fontSize:13, color:C.muted, marginBottom:20 }}>Customers also added these 👇</div>
          <div style={{ display:'flex', gap:10, overflowX:'auto', scrollbarWidth:'none', paddingBottom:4, marginBottom:20 }}>
            {suggestions.map(p => (
                <div key={p.id} style={{ flexShrink:0, width:120, background:C.surface, borderRadius:14, overflow:'hidden', border:'0.5px solid '+(added.includes(p.id)?C.accent:C.border) }}>
                  <div style={{ height:90, position:'relative' }}>
                    <ProductImage productId={p.id} emoji={p.emoji} category={p.category} alt={p.name} size="mini" style={{ height:90, width:'100%' }} />
                  </div>
                  <div style={{ padding:'8px 10px 10px' }}>
                    <div style={{ fontSize:10, color:C.white, lineHeight:1.3, marginBottom:6, height:26, overflow:'hidden' }}>{p.name}</div>
                    <div style={{ fontSize:12, fontWeight:700, color:C.accent, marginBottom:6 }}>€{p.price.toFixed(2)}</div>
                    <button onClick={()=>addSuggestion(p)} disabled={added.includes(p.id)}
                      style={{ width:'100%', padding:'5px 0', background:added.includes(p.id)?C.greenDim:C.accent, border:added.includes(p.id)?'0.5px solid '+C.green:'none', borderRadius:8, color:added.includes(p.id)?C.green:'white', fontSize:11, fontWeight:600, cursor:added.includes(p.id)?'default':'pointer', fontFamily:F.sans }}>
                      {added.includes(p.id) ? '✓ Added' : '+ Add'}
                    </button>
                  </div>
                </div>
            ))}
          </div>
          <button onClick={onClose} style={{ width:'100%', padding:'14px', background:C.accent, border:'none', borderRadius:14, color:'white', fontSize:15, fontWeight:600, cursor:'pointer', fontFamily:F.sans }}>
            Continue to payment →
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// FLASH SALE BANNER — countdown timer on home screen
// ═══════════════════════════════════════════════════════════════
export function FlashSaleBanner({ onShop }) {
  const [sale, setSale] = useState(null)
  const [timeLeft, setTimeLeft] = useState(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Check for active flash sale
    supabase.from('flash_sales')
      .select('*').eq('active', true)
      .gt('ends_at', new Date().toISOString())
      .order('created_at', { ascending:false }).limit(1)
      .then(({ data }) => { if (data?.[0]) setSale(data[0]) })
      .catch(() => {
        // Demo sale if no table yet
        const ends = new Date(Date.now() + 23 * 60 * 60000 + 47 * 60000)
        setSale({ title:'⚡ Flash sale', description:'20% off all beer & cider', ends_at:ends.toISOString(), discount_pct:20, category:'beer', color:'#1A4A1A' })
      })
  }, [])

  useEffect(() => {
    if (!sale) return
    const tick = () => {
      const diff = new Date(sale.ends_at) - new Date()
      if (diff <= 0) { setSale(null); return }
      const h = Math.floor(diff/3600000)
      const m = Math.floor((diff%3600000)/60000)
      const s = Math.floor((diff%60000)/1000)
      setTimeLeft(h.toString().padStart(2,'0')+':'+m.toString().padStart(2,'0')+':'+s.toString().padStart(2,'0'))
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [sale])

  if (!sale || dismissed) return null

  return (
    <div style={{ margin:'12px 16px 4px', background:'linear-gradient(135deg,#C4683A,#E8854A)', borderRadius:16, padding:'14px 16px', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:-20, right:-20, width:100, height:100, borderRadius:'50%', background:'rgba(255,255,255,0.1)' }} />
      <button onClick={()=>setDismissed(true)} style={{ position:'absolute', top:8, right:10, background:'none', border:'none', color:'rgba(255,255,255,0.6)', fontSize:18, cursor:'pointer' }}>×</button>
      <div style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.8)', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:2 }}>⚡ Flash sale</div>
      <div style={{ fontFamily:F.serif, fontSize:20, color:'white', marginBottom:6 }}>{sale.description}</div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        {timeLeft && (
          <div style={{ background:'rgba(0,0,0,0.25)', borderRadius:8, padding:'4px 10px', fontFamily:'monospace', fontSize:16, fontWeight:700, color:'white' }}>
            {timeLeft}
          </div>
        )}
        <button onClick={onShop} style={{ padding:'7px 16px', background:'white', border:'none', borderRadius:10, color:C.accent, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:F.sans }}>
          Shop now →
        </button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// FIRST ORDER WELCOME DISCOUNT — auto-detected
// ═══════════════════════════════════════════════════════════════
export function FirstOrderBanner({ onApply }) {
  const { user } = useAuthStore()
  const [show, setShow] = useState(false)
  const [applied, setApplied] = useState(false)

  useEffect(() => {
    if (!user) return
    const key = 'first_order_used_' + user.id
    if (localStorage.getItem(key)) return
    // Check if this user has any previous orders
    supabase.from('orders').select('id', { count:'exact', head:true }).eq('customer_id', user.id)
      .then(({ count }) => { if ((count||0) === 0) setShow(true) })
      .catch(() => {})
  }, [user])

  const apply = () => {
    const code = { code:'WELCOME5', reward_eur:5, description:'Welcome discount' }
    onApply(code)
    localStorage.setItem('first_order_used_' + user?.id, '1')
    setApplied(true)
    setTimeout(() => setShow(false), 2000)
    toast.success('🎉 €5 welcome discount applied!')
  }

  if (!show) return null

  return (
    <div style={{ margin:'12px 16px 4px', background:'linear-gradient(135deg,rgba(43,122,139,0.3),rgba(26,80,99,0.4))', border:'0.5px solid rgba(43,122,139,0.4)', borderRadius:16, padding:'14px 16px', display:'flex', alignItems:'center', gap:14 }}>
      <div style={{ fontSize:36 }}>🎁</div>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:14, fontWeight:700, color:C.white }}>Welcome to Isla Drop!</div>
        <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>Get €5 off your first order</div>
      </div>
      {applied ? (
        <div style={{ fontSize:12, color:C.green, fontWeight:700 }}>✓ Applied!</div>
      ) : (
        <button onClick={apply} style={{ padding:'8px 14px', background:C.accent, border:'none', borderRadius:10, color:'white', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:F.sans, flexShrink:0 }}>
          Claim €5
        </button>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// PWA INSTALL PROMPT — timed, branded
// ═══════════════════════════════════════════════════════════════
export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('pwa_dismissed') === '1')

  useEffect(() => {
    if (dismissed) return
    const handler = (e) => { e.preventDefault(); setDeferredPrompt(e) }
    window.addEventListener('beforeinstallprompt', handler)
    // Show after 30 seconds of browsing
    const t = setTimeout(() => {
      if (!window.matchMedia('(display-mode: standalone)').matches) setShow(true)
    }, 30000)
    return () => { window.removeEventListener('beforeinstallprompt', handler); clearTimeout(t) }
  }, [dismissed])

  const install = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') toast.success('Isla Drop added to your home screen! 🌴')
    }
    setShow(false)
  }

  const dismiss = () => {
    localStorage.setItem('pwa_dismissed', '1')
    setDismissed(true); setShow(false)
  }

  if (!show || dismissed) return null

  return (
    <div style={{ position:'fixed', bottom:80, left:16, right:16, maxWidth:448, margin:'0 auto', background:'#0D3545', borderRadius:20, padding:'20px', boxShadow:'0 8px 40px rgba(0,0,0,0.5)', zIndex:300, border:'0.5px solid rgba(43,122,139,0.4)' }}>
      <div style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
        <div style={{ width:52, height:52, borderRadius:14, background:C.accent, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, flexShrink:0 }}>🌴</div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:15, fontWeight:700, color:C.white, marginBottom:4 }}>Add to home screen</div>
          <div style={{ fontSize:12, color:C.muted, lineHeight:1.5 }}>Install Isla Drop for faster ordering and notifications</div>
          <div style={{ display:'flex', gap:8, marginTop:12 }}>
            <button onClick={install} style={{ flex:1, padding:'9px', background:C.accent, border:'none', borderRadius:10, color:'white', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:F.sans }}>
              Install
            </button>
            <button onClick={dismiss} style={{ padding:'9px 14px', background:'rgba(255,255,255,0.08)', border:'none', borderRadius:10, color:C.muted, fontSize:13, cursor:'pointer' }}>
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// DRIVER CONTACT — pre-set messages when order en route
// ═══════════════════════════════════════════════════════════════
export function DriverContact({ order, onClose }) {
  const [sent, setSent] = useState(null)
  const [custom, setCustom] = useState('')

  const MESSAGES = [
    { emoji:'🚪', text:"I'm at the main entrance" },
    { emoji:'🔔', text:'Please ring the doorbell' },
    { emoji:'📞', text:'Please call on arrival' },
    { emoji:'🏡', text:'Leave with reception' },
    { emoji:'⏳', text:"I'll be down in 2 minutes" },
    { emoji:'🚢', text:"I'm on the boat, dock 3" },
    { emoji:'🏖️', text:"I'm at the beach, use the side gate" },
    { emoji:'🤫', text:'Please be quiet, baby sleeping' },
  ]

  const sendMessage = async (text) => {
    setSent(text)
    await supabase.from('driver_messages').insert({
      order_id: order.id, from_customer: true, message: text
    }).catch(()=>{})
    toast.success('Message sent to driver 🛵')
    setTimeout(onClose, 1500)
  }

  return (
    <Sheet onClose={onClose}>
      <SheetHeader title="🛵 Contact driver" onClose={onClose} sub={sent ? 'Message sent!' : 'Send a quick message'} />
      <div style={{ padding:'0 20px 48px' }}>
        {sent ? (
          <div style={{ textAlign:'center', padding:'32px 0' }}>
            <div style={{ fontSize:52, marginBottom:12 }}>✅</div>
            <div style={{ fontFamily:F.serif, fontSize:20, color:C.white }}>{sent}</div>
            <div style={{ fontSize:13, color:C.muted, marginTop:8 }}>Your driver has been notified</div>
          </div>
        ) : (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
              {MESSAGES.map(m => (
                <button key={m.text} onClick={()=>sendMessage(m.text)}
                  style={{ padding:'12px 10px', background:C.surface, border:'0.5px solid '+C.border, borderRadius:12, cursor:'pointer', textAlign:'left', fontFamily:F.sans }}>
                  <div style={{ fontSize:20, marginBottom:4 }}>{m.emoji}</div>
                  <div style={{ fontSize:12, color:C.white, lineHeight:1.4 }}>{m.text}</div>
                </button>
              ))}
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <input value={custom} onChange={e=>setCustom(e.target.value)} placeholder="Custom message..."
                style={{ flex:1, padding:'11px 14px', background:C.surface, border:'0.5px solid rgba(255,255,255,0.2)', borderRadius:10, color:C.white, fontSize:13, fontFamily:F.sans, outline:'none' }} />
              <button onClick={()=>custom.trim()&&sendMessage(custom.trim())} disabled={!custom.trim()}
                style={{ padding:'11px 16px', background:custom.trim()?C.accent:'rgba(255,255,255,0.1)', border:'none', borderRadius:10, color:'white', fontSize:13, fontWeight:600, cursor:custom.trim()?'pointer':'default', fontFamily:F.sans }}>
                Send
              </button>
            </div>
          </>
        )}
      </div>
    </Sheet>
  )
}

// ═══════════════════════════════════════════════════════════════
// REFERRAL SHARE — from account tab
// ═══════════════════════════════════════════════════════════════
export function ReferralShare({ onClose }) {
  const { user, profile } = useAuthStore()
  const [code, setCode] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    // Get or create personal referral code
    supabase.from('referral_codes').select('*').eq('created_by', user.id).single()
      .then(({ data }) => {
        if (data) { setCode(data); setLoading(false) }
        else {
          const name = (profile?.full_name||user.email||'friend').split(' ')[0].toUpperCase().replace(/[^A-Z]/g,'').slice(0,6)
          const suffix = Math.random().toString(36).slice(2,5).toUpperCase()
          const code = name + suffix
          supabase.from('referral_codes').insert({ code, created_by:user.id, reward_eur:10, min_order:20, max_uses:100, status:'active' }).select().single()
            .then(({ data:nd }) => { setCode(nd||{code}); setLoading(false) })
        }
      })
      .catch(() => setLoading(false))
  }, [user])

  const shareText = '🌴 Order drinks delivered in Ibiza with Isla Drop! Use my code ' + (code?.code||'') + ' for €10 off your first order. Order now: https://www.isladrop.net'

  const copy = () => {
    navigator.clipboard.writeText(code?.code||'').then(() => { setCopied(true); setTimeout(()=>setCopied(false),2000) })
  }

  const share = () => {
    if (navigator.share) {
      navigator.share({ title:'Isla Drop — Ibiza Delivery', text:shareText, url:'https://www.isladrop.net' })
    } else {
      navigator.clipboard.writeText(shareText)
      toast.success('Link copied to clipboard!')
    }
  }

  return (
    <Sheet onClose={onClose}>
      <SheetHeader title="🔗 Refer a friend" onClose={onClose} sub="Give €10, get €10" />
      <div style={{ padding:'0 20px 48px' }}>
        {!user ? (
          <div style={{ textAlign:'center', padding:'32px 0', color:C.muted }}>Sign in to get your referral code</div>
        ) : loading ? (
          <div style={{ textAlign:'center', padding:'32px 0', color:C.muted }}>Loading your code...</div>
        ) : (
          <>
            <div style={{ background:'linear-gradient(135deg,#C4683A,#E8854A)', borderRadius:20, padding:'24px 20px', marginBottom:20, textAlign:'center', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', top:-30, right:-30, width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,0.1)' }} />
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.8)', marginBottom:8 }}>Your personal referral code</div>
              <div style={{ fontFamily:'monospace', fontSize:36, fontWeight:900, color:'white', letterSpacing:4, marginBottom:8 }}>{code?.code}</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.7)' }}>Share this code with friends in Ibiza</div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:20 }}>
              {[['🎁','You receive','€10 credit'],['🌴','Friend receives','€10 off first order']].map(([icon,label,val]) => (
                <div key={label} style={{ background:C.surface, borderRadius:12, padding:'14px', textAlign:'center', border:'0.5px solid '+C.border }}>
                  <div style={{ fontSize:24, marginBottom:4 }}>{icon}</div>
                  <div style={{ fontSize:11, color:C.muted }}>{label}</div>
                  <div style={{ fontSize:18, fontWeight:700, color:C.accent, marginTop:4 }}>{val}</div>
                </div>
              ))}
            </div>

            <div style={{ display:'flex', gap:10, marginBottom:16 }}>
              <button onClick={copy} style={{ flex:1, padding:'13px', background:copied?C.greenDim:C.surface, border:'0.5px solid '+(copied?C.green:C.border), borderRadius:12, color:copied?C.green:C.white, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:F.sans }}>
                {copied ? '✓ Copied!' : '📋 Copy code'}
              </button>
              <button onClick={share} style={{ flex:1, padding:'13px', background:C.accent, border:'none', borderRadius:12, color:'white', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:F.sans }}>
                📤 Share
              </button>
            </div>

            <div style={{ background:C.surface, borderRadius:12, padding:'14px 16px', border:'0.5px solid '+C.border }}>
              <div style={{ fontSize:13, fontWeight:600, color:C.white, marginBottom:10 }}>How it works</div>
              {[['1','Share your code with a friend'],['2','They place their first order on Isla Drop'],['3','You both get €10 credit 🎉']].map(([n,text]) => (
                <div key={n} style={{ display:'flex', gap:10, alignItems:'center', marginBottom:8 }}>
                  <div style={{ width:22, height:22, borderRadius:'50%', background:C.accent, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'white', flexShrink:0 }}>{n}</div>
                  <div style={{ fontSize:13, color:C.muted }}>{text}</div>
                </div>
              ))}
            </div>

            {code?.uses > 0 && (
              <div style={{ marginTop:14, padding:'10px 16px', background:C.greenDim, borderRadius:10, border:'0.5px solid rgba(126,232,162,0.2)', fontSize:13, color:C.green }}>
                🎉 {code.uses} friends have used your code!
              </div>
            )}
          </>
        )}
      </div>
    </Sheet>
  )
}

// ═══════════════════════════════════════════════════════════════
// SORT & FILTER — for category pages
// ═══════════════════════════════════════════════════════════════
export function SortFilterSheet({ onClose, onApply, currentSort, currentFilters }) {
  const [sort, setSort] = useState(currentSort || 'default')
  const [maxPrice, setMaxPrice] = useState(currentFilters?.maxPrice || 100)
  const [flags, setFlags] = useState(currentFilters?.flags || [])

  const SORTS = [
    { id:'default', label:'Default' },
    { id:'price_asc', label:'Price: Low to high' },
    { id:'price_desc', label:'Price: High to low' },
    { id:'popular', label:'Most popular' },
    { id:'name', label:'Name A–Z' },
  ]

  const FLAGS = [
    { id:'popular', label:'⭐ Popular', key:'popular' },
    { id:'age_ok', label:'🧃 No ID required', key:'not_age_restricted' },
    { id:'age_restricted', label:'🍷 18+ only', key:'age_restricted' },
  ]

  const toggleFlag = (id) => setFlags(f => f.includes(id) ? f.filter(x=>x!==id) : [...f,id])

  const apply = () => {
    onApply({ sort, maxPrice, flags })
    onClose()
  }

  const reset = () => { setSort('default'); setMaxPrice(100); setFlags([]); onApply({ sort:'default', maxPrice:100, flags:[] }); onClose() }

  return (
    <Sheet onClose={onClose} maxH="70vh">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 20px 4px' }}>
        <div style={{ fontFamily:F.serif, fontSize:22, color:C.white }}>Sort & filter</div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={reset} style={{ background:'none', border:'none', color:C.muted, fontSize:13, cursor:'pointer', fontFamily:F.sans }}>Reset</button>
          <button onClick={onClose} style={{ background:'none', border:'none', color:C.muted, fontSize:24, cursor:'pointer' }}>×</button>
        </div>
      </div>
      <div style={{ padding:'16px 20px 48px' }}>
        <div style={{ fontSize:12, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:10 }}>Sort by</div>
        <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:20 }}>
          {SORTS.map(s => (
            <button key={s.id} onClick={()=>setSort(s.id)}
              style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 14px', background:sort===s.id?C.accentDim:C.surface, border:'0.5px solid '+(sort===s.id?C.accent:C.border), borderRadius:10, cursor:'pointer', fontFamily:F.sans }}>
              <span style={{ fontSize:14, color:sort===s.id?C.accent:C.white }}>{s.label}</span>
              {sort===s.id && <span style={{ color:C.accent, fontSize:16 }}>✓</span>}
            </button>
          ))}
        </div>

        <div style={{ fontSize:12, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:10 }}>Max price: €{maxPrice}</div>
        <input type="range" min={5} max={200} value={maxPrice} onChange={e=>setMaxPrice(Number(e.target.value))}
          style={{ width:'100%', marginBottom:6, accentColor:C.accent }} />
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:C.muted, marginBottom:20 }}>
          <span>€5</span><span>€200</span>
        </div>

        <div style={{ fontSize:12, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:10 }}>Filter</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:24 }}>
          {FLAGS.map(f => (
            <button key={f.id} onClick={()=>toggleFlag(f.id)}
              style={{ padding:'8px 14px', borderRadius:20, border:'0.5px solid '+(flags.includes(f.id)?C.accent:C.border), background:flags.includes(f.id)?C.accentDim:'transparent', color:flags.includes(f.id)?C.accent:C.muted, fontSize:13, cursor:'pointer', fontFamily:F.sans }}>
              {f.label}
            </button>
          ))}
        </div>

        <button onClick={apply} style={{ width:'100%', padding:'14px', background:C.accent, border:'none', borderRadius:14, color:'white', fontSize:15, fontWeight:600, cursor:'pointer', fontFamily:F.sans }}>
          Apply filters
        </button>
      </div>
    </Sheet>
  )
}

// ═══════════════════════════════════════════════════════════════
// WHATSAPP SUPPORT BUTTON
// ═══════════════════════════════════════════════════════════════
export function WhatsAppButton({ style={} }) {
  const phone = '34971000000' // +34 971 000 000
  const msg = encodeURIComponent('Hi Isla Drop! I need help with my order.')
  const url = 'https://wa.me/' + phone + '?text=' + msg
  return (
    <a href={url} target="_blank" rel="noreferrer"
      style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', background:'rgba(37,211,102,0.15)', border:'0.5px solid rgba(37,211,102,0.3)', borderRadius:12, textDecoration:'none', ...style }}>
      <div style={{ width:32, height:32, borderRadius:'50%', background:'#25D366', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>💬</div>
      <div>
        <div style={{ fontSize:13, fontWeight:700, color:C.white }}>WhatsApp support</div>
        <div style={{ fontSize:11, color:C.muted }}>Typically replies in minutes</div>
      </div>
      <span style={{ marginLeft:'auto', color:C.muted }}>›</span>
    </a>
  )
}

// ═══════════════════════════════════════════════════════════════
// ERROR BOUNDARY WRAPPER — per-overlay safety net
// ═══════════════════════════════════════════════════════════════
import { Component } from 'react'
export class OverlayErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error:null } }
  static getDerivedStateFromError(error) { return { error } }
  render() {
    if (this.state.error) return (
      <div style={{ position:'fixed', inset:0, zIndex:500, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'flex-end' }}>
        <div style={{ width:'100%', maxWidth:480, margin:'0 auto', background:'#0D3545', borderRadius:'24px 24px 0 0', padding:'40px 24px 60px', textAlign:'center' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>⚠️</div>
          <div style={{ fontFamily:F.serif, fontSize:20, color:C.white, marginBottom:8 }}>Something went wrong</div>
          <div style={{ fontSize:13, color:C.muted, marginBottom:24 }}>{this.state.error?.message}</div>
          <button onClick={this.props.onClose} style={{ padding:'12px 32px', background:C.accent, border:'none', borderRadius:12, color:'white', fontSize:14, cursor:'pointer', fontFamily:F.sans }}>Close</button>
        </div>
      </div>
    )
    return this.props.children
  }
}
