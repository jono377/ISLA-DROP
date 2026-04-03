import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { useCartStore, useAuthStore } from '../../lib/store'
import { PRODUCTS, CATEGORIES, BEST_SELLERS, NEW_IN } from '../../lib/products'
import { LANGUAGES, useT } from '../../i18n/translations'
import DeliveryMap from './DeliveryMap'
import AgeVerification from './AgeVerification'
import StripeCheckout from './StripeCheckout'
import ProductImage from '../shared/ProductImage'
import { createOrder, subscribeToOrder } from '../../lib/supabase'

const SCREENS = { SPLASH: 'splash', SHOP: 'shop', AGE_VERIFY: 'age_verify', CHECKOUT: 'checkout', TRACKING: 'tracking' }

// ── Full-screen Splash ────────────────────────────────────────
function SplashScreen({ onEnter }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { setTimeout(() => setVisible(true), 80) }, [])

  return (
    <div style={{ position:'fixed', inset:0, overflow:'hidden' }}>
      {/* Full-bleed brand image */}
      <img
        src="/splash.png"
        alt="Isla Drop"
        style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', objectPosition:'center' }}
      />
      {/* Dark gradient overlay so text is readable */}
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.7) 75%, rgba(0,0,0,0.88) 100%)' }} />

      {/* Content on top of image */}
      <div style={{
        position:'absolute', bottom:0, left:0, right:0,
        padding:'0 28px 56px',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.9s cubic-bezier(0.34,1.1,0.64,1)',
      }}>
        <div style={{ fontFamily:'DM Serif Display,serif', fontSize:56, color:'white', lineHeight:1, letterSpacing:'-1.5px', marginBottom:6, textShadow:'0 2px 24px rgba(0,0,0,0.4)' }}>
          Isla Drop
        </div>
        <div style={{ fontSize:13, color:'rgba(255,255,255,0.75)', letterSpacing:'3px', textTransform:'uppercase', marginBottom:6 }}>
          24/7 Delivery · Ibiza
        </div>
        <div style={{ fontSize:13, color:'rgba(255,255,255,0.55)', marginBottom:36 }}>
          Drinks · Snacks · Tobacco
        </div>

        <button
          onClick={onEnter}
          style={{ width:'100%', padding:'18px', background:'#C4683A', color:'white', border:'none', borderRadius:16, fontFamily:'DM Sans,sans-serif', fontSize:17, fontWeight:500, cursor:'pointer', letterSpacing:'0.3px', boxShadow:'0 8px 32px rgba(196,104,58,0.55)', marginBottom:14 }}
        >
          Order Now
        </button>
        <div style={{ textAlign:'center', fontSize:12, color:'rgba(255,255,255,0.4)' }}>
          Anytime. Anywhere. Ibiza.
        </div>
      </div>
    </div>
  )
}

// ── Language Picker ───────────────────────────────────────────
function LanguagePicker({ lang, setLang }) {
  const [open, setOpen] = useState(false)
  const current = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0]
  return (
    <div style={{ position:'relative' }}>
      <button onClick={() => setOpen(o=>!o)} style={{ background:'rgba(255,255,255,0.15)', border:'0.5px solid rgba(255,255,255,0.25)', borderRadius:20, padding:'5px 10px', color:'white', fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', gap:5, fontFamily:'DM Sans,sans-serif' }}>
        <span style={{ fontSize:14 }}>{current.flag}</span>{current.code.toUpperCase()}
      </button>
      {open && (
        <div style={{ position:'absolute', top:34, right:0, background:'white', borderRadius:12, boxShadow:'0 8px 24px rgba(0,0,0,0.15)', overflow:'hidden', zIndex:300, minWidth:140 }}>
          {LANGUAGES.map(l => (
            <button key={l.code} onClick={() => { setLang(l.code); setOpen(false) }} style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'10px 14px', border:'none', background:l.code===lang?'#F5F0E8':'white', cursor:'pointer', fontFamily:'DM Sans,sans-serif', fontSize:13, color:'#2A2318' }}>
              <span style={{ fontSize:16 }}>{l.flag}</span>{l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Mini card (horizontal scroll) ────────────────────────────
function MiniCard({ product, t }) {
  const qty = useCartStore(s => s.items.find(i=>i.product.id===product.id)?.quantity ?? 0)
  const { addItem, updateQuantity } = useCartStore()
  return (
    <div style={{ background:'white', border:'0.5px solid rgba(42,35,24,0.1)', borderRadius:14, padding:'10px 10px 12px', minWidth:136, maxWidth:136, flexShrink:0 }}>
      <ProductImage productId={product.id} emoji={product.emoji} category={product.category} alt={product.name} size="mini" style={{ height:96, marginBottom:8 }} />
      <div style={{ fontSize:12, fontWeight:500, color:'#2A2318', lineHeight:1.3, height:30, overflow:'hidden', marginBottom:6 }}>{product.name}</div>
      <div style={{ fontSize:13, fontWeight:500, marginBottom:8 }}>€{product.price.toFixed(2)}</div>
      {qty > 0 ? (
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <button onClick={()=>updateQuantity(product.id,qty-1)} style={qtyBtn('#E8E0D0','#2A2318')}>−</button>
          <span style={{ fontSize:12,fontWeight:500,minWidth:16,textAlign:'center' }}>{qty}</span>
          <button onClick={()=>updateQuantity(product.id,qty+1)} style={qtyBtn('#2B7A8B','white')}>+</button>
        </div>
      ) : (
        <button onClick={()=>{ addItem(product); toast.success(product.emoji+' Added!',{duration:900}) }} style={{ width:'100%', padding:'7px 0', background:'#2B7A8B', color:'white', border:'none', borderRadius:8, fontFamily:'DM Sans,sans-serif', fontSize:12, fontWeight:500, cursor:'pointer' }}>{t.addToCart}</button>
      )}
    </div>
  )
}

// ── Grid card ─────────────────────────────────────────────────
function ProductCard({ product, t }) {
  const qty = useCartStore(s => s.items.find(i=>i.product.id===product.id)?.quantity ?? 0)
  const { addItem, updateQuantity } = useCartStore()
  return (
    <div style={{ background:'white', border:'0.5px solid rgba(42,35,24,0.1)', borderRadius:14, padding:'12px 12px 14px' }}>
      <ProductImage productId={product.id} emoji={product.emoji} category={product.category} alt={product.name} size="card" style={{ height:110, marginBottom:10 }} />
      <div style={{ fontSize:12, fontWeight:500, color:'#2A2318', lineHeight:1.3, marginBottom:8, minHeight:32 }}>{product.name}</div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ fontSize:14, fontWeight:500 }}>€{product.price.toFixed(2)}</span>
        {qty > 0 ? (
          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
            <button onClick={()=>updateQuantity(product.id,qty-1)} style={qtyBtn('#E8E0D0','#2A2318')}>−</button>
            <span style={{ fontSize:12,fontWeight:500,minWidth:14,textAlign:'center' }}>{qty}</span>
            <button onClick={()=>updateQuantity(product.id,qty+1)} style={qtyBtn('#2B7A8B','white')}>+</button>
          </div>
        ) : (
          <button onClick={()=>{ addItem(product); toast.success(product.emoji+' Added!',{duration:900}) }} style={{ width:28,height:28,background:'#2B7A8B',border:'none',borderRadius:'50%',color:'white',fontSize:18,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer' }}>+</button>
        )}
      </div>
    </div>
  )
}

const qtyBtn = (bg, color) => ({ width:24, height:24, background:bg, border:'none', borderRadius:'50%', cursor:'pointer', fontSize:13, color, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:500 })

function HScroll({ children }) {
  return <div style={{ display:'flex', gap:10, overflowX:'auto', padding:'0 16px 4px', scrollbarWidth:'none' }}>{children}</div>
}

// ── Main App ──────────────────────────────────────────────────
export default function CustomerApp() {
  const [screen, setScreen]               = useState(SCREENS.SPLASH)
  const [lang, setLang]                   = useState('en')
  const [query, setQuery]                 = useState('')
  const [activeCategory, setActiveCategory] = useState(null)
  const [activeSub, setActiveSub]         = useState(null)
  const [activeOrder, setActiveOrder]     = useState(null)
  const [locationSet, setLocationSet]     = useState(false)
  const { user } = useAuthStore()
  const cart = useCartStore()
  const t = useT(lang)

  const searchResults   = query.length > 1 ? PRODUCTS.filter(p=>p.name.toLowerCase().includes(query.toLowerCase())).slice(0,30) : []
  const displayedProducts = activeCategory ? PRODUCTS.filter(p=>p.category===activeCategory&&(!activeSub||p.sub===activeSub)) : []
  const currentCat      = CATEGORIES.find(c=>c.key===activeCategory)

  const handleCheckoutClick = () => {
    if (!user)          { toast('Sign in to checkout', {icon:'👤'}); return }
    if (!locationSet)   { toast.error('Please set your delivery location first'); return }
    if (cart.hasAgeRestrictedItems) { setScreen(SCREENS.AGE_VERIFY); return }
    setScreen(SCREENS.CHECKOUT)
  }

  const handlePaymentSuccess = async (paymentIntentId) => {
    try {
      const order = await createOrder({
        customerId: user.id,
        items: cart.items.map(i=>({ productId:i.product.id, quantity:i.quantity, price:i.product.price })),
        deliveryLat: cart.deliveryLat, deliveryLng: cart.deliveryLng,
        deliveryAddress: cart.deliveryAddress, deliveryNotes: cart.deliveryNotes,
        what3words: cart.what3words, subtotal: cart.subtotal,
        total: cart.total, paymentIntentId,
      })
      cart.clearCart()
      setActiveOrder(order)
      setScreen(SCREENS.TRACKING)
      const sub = subscribeToOrder(order.id, u => {
        setActiveOrder(u)
        if (u.status==='delivered') { toast.success('🎉 Delivered!'); sub.unsubscribe() }
      })
    } catch(err) { toast.error('Order failed: '+err.message) }
  }

  // ── Splash ────────────────────────────────────────────────
  if (screen===SCREENS.SPLASH) return <SplashScreen onEnter={()=>setScreen(SCREENS.SHOP)} />

  // ── Age Verify modal ──────────────────────────────────────
  if (screen===SCREENS.AGE_VERIFY) return (
    <div style={{ position:'fixed',inset:0,background:'rgba(30,20,10,0.55)',zIndex:200,display:'flex',alignItems:'flex-end',justifyContent:'center' }} onClick={()=>setScreen(SCREENS.SHOP)}>
      <div style={{ background:'#FEFCF9',borderRadius:'24px 24px 0 0',padding:'28px 24px 36px',width:'100%',maxWidth:480 }} onClick={e=>e.stopPropagation()}>
        <div style={{ width:36,height:4,background:'rgba(42,35,24,0.15)',borderRadius:2,margin:'0 auto 20px' }}/>
        <AgeVerification onVerified={()=>setScreen(SCREENS.CHECKOUT)} onClose={()=>setScreen(SCREENS.SHOP)} />
      </div>
    </div>
  )

  // ── Checkout ──────────────────────────────────────────────
  if (screen===SCREENS.CHECKOUT) return (
    <div style={{ background:'#FEFCF9', minHeight:'100vh', paddingBottom:60 }}>
      <div style={{ background:'linear-gradient(135deg,#0D3B4A,#1A5263)', padding:'16px 16px 20px' }}>
        <button onClick={()=>setScreen(SCREENS.SHOP)} style={{ background:'none',border:'none',color:'rgba(255,255,255,0.7)',fontSize:14,cursor:'pointer',fontFamily:'DM Sans,sans-serif',marginBottom:12 }}>← {t.continueShopping}</button>
        <div style={{ fontFamily:'DM Serif Display,serif',fontSize:26,color:'white' }}>{t.checkout}</div>
      </div>

      <div style={{ padding:'20px 16px' }}>
        {/* Delivery location — map only appears here */}
        <div style={{ fontFamily:'DM Serif Display,serif',fontSize:18,marginBottom:12 }}>Delivery location</div>
        <div style={{ borderRadius:14,overflow:'hidden',marginBottom:20,border:'0.5px solid rgba(42,35,24,0.12)' }}>
          <DeliveryMap onLocationSet={()=>setLocationSet(true)} />
        </div>

        {/* Order summary */}
        <div style={{ fontFamily:'DM Serif Display,serif',fontSize:18,marginBottom:12 }}>Order summary</div>
        <div style={{ background:'#F5F0E8',borderRadius:14,padding:16,marginBottom:20 }}>
          {cart.items.map(({product,quantity})=>(
            <div key={product.id} style={{ display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:8,alignItems:'center',gap:8 }}>
              <span style={{ display:'flex',alignItems:'center',gap:6 }}>
                <span style={{ fontSize:16 }}>{product.emoji}</span>
                <span style={{ flex:1 }}>{product.name} × {quantity}</span>
              </span>
              <span style={{ fontWeight:500,flexShrink:0 }}>€{(product.price*quantity).toFixed(2)}</span>
            </div>
          ))}
          <div style={{ borderTop:'0.5px solid rgba(42,35,24,0.15)',paddingTop:10,marginTop:6 }}>
            <div style={{ display:'flex',justifyContent:'space-between',fontSize:13,color:'#7A6E60',marginBottom:5 }}><span>Subtotal</span><span>€{cart.subtotal.toFixed(2)}</span></div>
            <div style={{ display:'flex',justifyContent:'space-between',fontSize:13,color:'#7A6E60',marginBottom:10 }}><span>{t.delivery}</span><span>€3.50</span></div>
            <div style={{ display:'flex',justifyContent:'space-between',fontSize:16,fontWeight:500 }}><span>{t.total}</span><span style={{ color:'#C4683A' }}>€{cart.total.toFixed(2)}</span></div>
          </div>
        </div>

        <div style={{ fontFamily:'DM Serif Display,serif',fontSize:18,marginBottom:16 }}>Payment</div>
        <StripeCheckout onSuccess={handlePaymentSuccess} onCancel={()=>setScreen(SCREENS.SHOP)} />
      </div>
    </div>
  )

  // ── Order Tracking ────────────────────────────────────────
  if (screen===SCREENS.TRACKING && activeOrder) {
    const STEPS  = ['confirmed','preparing','assigned','picked_up','en_route','delivered']
    const LABELS = { confirmed:'Confirmed', preparing:'Preparing', assigned:'Driver assigned', picked_up:'Picked up', en_route:'On the way', delivered:'Delivered!' }
    const idx    = STEPS.indexOf(activeOrder.status)
    return (
      <div style={{ padding:'20px 16px 100px',background:'#FEFCF9',minHeight:'100vh' }}>
        <div style={{ fontFamily:'DM Serif Display,serif',fontSize:26,marginBottom:4 }}>{activeOrder.status==='delivered'?'Delivered! 🎉':'On its way 🛵'}</div>
        <div style={{ fontSize:13,color:'#7A6E60',marginBottom:20 }}>#{activeOrder.order_number}</div>
        <div style={{ background:'#F5F0E8',borderRadius:14,padding:16,marginBottom:20 }}>
          {STEPS.map((s,i)=>(
            <div key={s} style={{ display:'flex',alignItems:'center',gap:12,marginBottom:i<STEPS.length-1?12:0 }}>
              <div style={{ width:28,height:28,borderRadius:'50%',flexShrink:0,background:i<=idx?(i===idx?'#C4683A':'#5A6B3A'):'rgba(42,35,24,0.1)',display:'flex',alignItems:'center',justifyContent:'center' }}>
                {i<idx&&<svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>}
                {i===idx&&<div style={{ width:8,height:8,borderRadius:'50%',background:'white' }}/>}
              </div>
              <span style={{ fontSize:14,fontWeight:i===idx?500:400,color:i>idx?'#7A6E60':'#2A2318' }}>{LABELS[s]}</span>
            </div>
          ))}
        </div>
        {activeOrder.estimated_minutes && activeOrder.status!=='delivered' && (
          <div style={{ background:'#D4EEF2',borderRadius:14,padding:'14px 16px',marginBottom:20,display:'flex',alignItems:'center',gap:12 }}>
            <span style={{ fontSize:28 }}>🛵</span>
            <div>
              <div style={{ fontSize:12,color:'#1A5263' }}>Estimated arrival</div>
              <div style={{ fontSize:22,fontWeight:500,color:'#0C4450' }}>{activeOrder.estimated_minutes} min</div>
            </div>
          </div>
        )}
        <button onClick={()=>setScreen(SCREENS.SHOP)} style={{ width:'100%',padding:15,background:'#2B7A8B',color:'white',border:'none',borderRadius:12,fontFamily:'DM Sans,sans-serif',fontSize:15,cursor:'pointer' }}>Place another order</button>
      </div>
    )
  }

  // ── Main Shop ─────────────────────────────────────────────
  return (
    <div style={{ background:'#F5F0E8', minHeight:'100vh', paddingBottom:80 }}>

      {/* Header — no map here */}
      <div style={{ background:'linear-gradient(135deg,#0D3B4A 0%,#1A5263 100%)', padding:'16px 16px 18px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontFamily:'DM Serif Display,serif', fontSize:28, color:'white', letterSpacing:'-0.5px', lineHeight:1 }}>Isla Drop</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', marginTop:3, letterSpacing:'1.5px', textTransform:'uppercase' }}>{t.tagline}</div>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <div style={{ background:'rgba(255,255,255,0.12)', border:'0.5px solid rgba(255,255,255,0.2)', borderRadius:20, fontSize:11, padding:'4px 10px', display:'flex', alignItems:'center', gap:5, color:'white' }}>
              <span style={{ width:6,height:6,borderRadius:'50%',background:'#7EE8A2',display:'inline-block',animation:'pulse 1.5s infinite' }}/>Open 24/7
            </div>
            <LanguagePicker lang={lang} setLang={setLang} />
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div style={{ padding:'10px 16px', background:'white', position:'sticky', top:0, zIndex:50, borderBottom:'0.5px solid rgba(42,35,24,0.08)' }}>
        <div style={{ display:'flex', alignItems:'center', background:'#F5F0E8', borderRadius:12, padding:'10px 14px', gap:8 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7A6E60" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input value={query} onChange={e=>setQuery(e.target.value)} placeholder={t.searchPlaceholder} style={{ flex:1, border:'none', background:'none', fontFamily:'DM Sans,sans-serif', fontSize:14, color:'#2A2318', outline:'none' }}/>
          {query && <button onClick={()=>setQuery('')} style={{ border:'none',background:'none',cursor:'pointer',color:'#7A6E60',fontSize:16,padding:0 }}>✕</button>}
        </div>
      </div>

      {/* Age banner */}
      <div style={{ margin:'12px 16px 0', background:'#F0DDD3', border:'0.5px solid #C4683A', borderRadius:10, padding:'9px 12px', display:'flex', gap:8, fontSize:11, color:'#8B4220' }}>
        <span>🆔</span><span>{t.ageWarning}</span>
      </div>

      {/* Search results */}
      {query.length > 1 && (
        <div style={{ padding:'16px 16px 0' }}>
          <div style={{ fontFamily:'DM Serif Display,serif', fontSize:18, marginBottom:12 }}>
            {searchResults.length > 0 ? `${t.searchResults} "${query}"` : `${t.noResults} "${query}"`}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {searchResults.map(p=><ProductCard key={p.id} product={p} t={t}/>)}
          </div>
        </div>
      )}

      {/* Home sections — hidden during search */}
      {!query && (
        <>
          {/* Best Sellers */}
          <div style={{ paddingTop:20, marginBottom:20 }}>
            <div style={{ fontFamily:'DM Serif Display,serif', fontSize:20, padding:'0 16px', marginBottom:12 }}>🔥 {t.bestSellers}</div>
            <HScroll>{BEST_SELLERS.map(p=><MiniCard key={p.id} product={p} t={t}/>)}</HScroll>
          </div>

          {/* New In */}
          <div style={{ marginBottom:20 }}>
            <div style={{ fontFamily:'DM Serif Display,serif', fontSize:20, padding:'0 16px', marginBottom:12 }}>✨ {t.newIn}</div>
            <HScroll>{NEW_IN.slice(0,10).map(p=><MiniCard key={p.id} product={p} t={t}/>)}</HScroll>
          </div>

          {/* Category grid */}
          <div style={{ padding:'0 16px', marginBottom:14 }}>
            <div style={{ fontFamily:'DM Serif Display,serif', fontSize:20, marginBottom:12 }}>{t.categories}</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {CATEGORIES.map(cat => (
                <button key={cat.key}
                  onClick={()=>{ setActiveCategory(cat.key===activeCategory?null:cat.key); setActiveSub(null) }}
                  style={{ background:activeCategory===cat.key?'#1A5263':'white', color:activeCategory===cat.key?'white':'#2A2318', border:`0.5px solid ${activeCategory===cat.key?'#1A5263':'rgba(42,35,24,0.12)'}`, borderRadius:12, padding:'14px 12px', fontFamily:'DM Sans,sans-serif', fontSize:13, fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:20 }}>{cat.emoji}</span>{cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sub-category chips */}
          {activeCategory && currentCat && (
            <div style={{ padding:'0 16px', marginBottom:12 }}>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                <button onClick={()=>setActiveSub(null)} style={subChip(!activeSub)}>All</button>
                {currentCat.subs.map(s=>(
                  <button key={s.key} onClick={()=>setActiveSub(s.key===activeSub?null:s.key)} style={subChip(activeSub===s.key)}>{s.label}</button>
                ))}
              </div>
            </div>
          )}

          {/* Product grid */}
          {activeCategory && displayedProducts.length > 0 && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, padding:'0 16px' }}>
              {displayedProducts.map(p=><ProductCard key={p.id} product={p} t={t}/>)}
            </div>
          )}
          {activeCategory && displayedProducts.length === 0 && (
            <div style={{ textAlign:'center', padding:'40px 20px', color:'#7A6E60', fontSize:14 }}>No products in this selection.</div>
          )}
        </>
      )}

      {/* Cart bar */}
      {cart.itemCount > 0 && (
        <div onClick={handleCheckoutClick} style={{ position:'sticky', bottom:68, margin:'16px 16px 0', background:'#C4683A', borderRadius:14, padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', boxShadow:'0 4px 20px rgba(196,104,58,0.45)' }}>
          <div style={{ color:'white' }}>
            <div style={{ fontSize:11, opacity:0.8 }}>{cart.itemCount} {cart.itemCount===1?t.item:t.items}</div>
            <div style={{ fontSize:16, fontWeight:500 }}>€{cart.subtotal.toFixed(2)} + €3.50 delivery</div>
          </div>
          <div style={{ color:'white', fontSize:13, fontWeight:500 }}>
            {user ? `${t.checkout} →` : t.signInToCheckout}
          </div>
        </div>
      )}

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  )
}

const subChip = active => ({ padding:'6px 14px', borderRadius:20, fontSize:12, fontWeight:active?500:400, background:active?'#C4683A':'#F5F0E8', color:active?'white':'#7A6E60', border:'none', cursor:'pointer', fontFamily:'DM Sans,sans-serif' })
