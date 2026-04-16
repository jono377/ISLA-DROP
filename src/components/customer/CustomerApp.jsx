import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { useCartStore, useAuthStore } from '../../lib/store'
import { supabase } from '../../lib/supabase'
import { PRODUCTS, CATEGORIES, BEST_SELLERS, NEW_IN } from '../../lib/products'
import { LANGUAGES, useT } from '../../i18n/translations'
import AgeVerification from './AgeVerification'
import StripeCheckout from './StripeCheckout'
import DeliveryMap from './DeliveryMap'
import OrderTrackingMap from './OrderTrackingMap'
import AddressBar from './AddressBar'
import AssistBot from './AssistBot'
import CategoryPage, { AllProductsPage } from './CategoryPage'
import ProductImage from '../shared/ProductImage'
import {
  OrderHistory, SavedAddresses, HelpSupport, LoyaltyCard,
  ProductDetail, RatingPrompt, CocktailBuilder, BundleDeals,
  ScheduleDelivery, PromoCodeEntry, NotificationSettings,
  ProductCardSkeleton, OrderCardSkeleton
} from './CustomerFeatures'
import {
  WishlistView, WishlistHeart, UpsellSuggestions, FlashSaleBanner,
  FirstOrderBanner, PWAInstallPrompt, DriverContact, ReferralShare,
  SortFilterSheet, WhatsAppButton, OverlayErrorBoundary
} from './CustomerFeatures2'
import { useWishlistStore } from '../../lib/store'

const VIEWS = {
  SPLASH:'splash', HOME:'home', CATEGORY:'category', SEARCH:'search',
  BASKET:'basket', ACCOUNT:'account', ASSIST:'assist', BEST:'best',
  NEWIN:'newin', AGE_VERIFY:'age_verify', CHECKOUT:'checkout', TRACKING:'tracking'
}

const C = {
  bg:'linear-gradient(170deg,#0A2A38 0%,#0D3545 35%,#1A5060 70%,#2B7A8B 100%)',
  header:'linear-gradient(135deg,#0D3B4A 0%,#1A5263 100%)',
  card:'rgba(255,255,255,0.92)', cardBorder:'rgba(255,255,255,0.5)',
  text:'#2A2318', textMuted:'rgba(42,35,24,0.55)',
  tabBg:'rgba(10,30,40,0.97)', accent:'#C4683A',
  surface:'rgba(255,255,255,0.07)', surfaceB:'rgba(255,255,255,0.12)',
  muted:'rgba(255,255,255,0.45)', border:'rgba(255,255,255,0.1)',
  green:'#7EE8A2', greenDim:'rgba(126,232,162,0.12)',
}
const F = { serif:'DM Serif Display,serif', sans:'DM Sans,sans-serif' }

// ─── Skeleton row ─────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div style={{ display:'flex', gap:10, padding:'0 16px 4px', overflowX:'auto', scrollbarWidth:'none' }}>
      {[1,2,3,4].map(i => <ProductCardSkeleton key={i} />)}
    </div>
  )
}

// ─── Splash ───────────────────────────────────────────────────
function SplashScreen({ onEnter }) {
  const [vis, setVis] = useState(false)
  useEffect(() => { setTimeout(() => setVis(true), 80) }, [])
  return (
    <div style={{ position:'fixed', inset:0, overflow:'hidden' }}>
      <img src="/splash.jpg" alt="Isla Drop" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', objectPosition:'center top' }} />
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom,rgba(0,0,0,0.05) 0%,rgba(0,0,0,0.05) 40%,rgba(0,0,0,0.6) 68%,rgba(0,0,0,0.88) 100%)' }} />
      <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'0 28px 64px', opacity:vis?1:0, transform:vis?'translateY(0)':'translateY(20px)', transition:'all 0.9s cubic-bezier(0.34,1.1,0.64,1)' }}>
        <div style={{ fontFamily:F.serif, fontSize:58, color:'white', lineHeight:1, letterSpacing:'-1.5px', marginBottom:6, textShadow:'0 3px 20px rgba(0,0,0,0.4)' }}>Isla Drop</div>
        <div style={{ fontSize:12, color:'rgba(255,255,255,0.68)', letterSpacing:'3.5px', textTransform:'uppercase', marginBottom:5 }}>24/7 Delivery · Ibiza</div>
        <div style={{ fontSize:14, color:'rgba(255,255,255,0.45)', marginBottom:40 }}>Drinks · Snacks · Tobacco</div>
        <button onClick={onEnter} style={{ width:'100%', padding:'18px', background:'#C4683A', color:'white', border:'none', borderRadius:16, fontFamily:F.sans, fontSize:17, fontWeight:500, cursor:'pointer', boxShadow:'0 8px 32px rgba(196,104,58,0.55)', marginBottom:14 }}>Order Now</button>
        <div style={{ textAlign:'center', fontSize:12, color:'rgba(255,255,255,0.3)' }}>Anytime. Anywhere. Ibiza.</div>
      </div>
    </div>
  )
}

// ─── Language picker ──────────────────────────────────────────
function LanguagePicker({ lang, setLang }) {
  const [open, setOpen] = useState(false)
  const cur = LANGUAGES.find(l=>l.code===lang)||LANGUAGES[0]
  return (
    <div style={{ position:'relative' }}>
      <button onClick={()=>setOpen(o=>!o)} style={{ background:'rgba(255,255,255,0.14)', border:'0.5px solid rgba(255,255,255,0.22)', borderRadius:20, padding:'5px 11px', color:'white', fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', gap:5, fontFamily:F.sans }}>
        <span style={{ fontSize:14 }}>{cur.flag}</span>{cur.code.toUpperCase()}
      </button>
      {open && (
        <div style={{ position:'absolute', top:34, right:0, background:'white', borderRadius:12, boxShadow:'0 8px 32px rgba(0,0,0,0.18)', overflow:'hidden', zIndex:400, minWidth:148 }}>
          {LANGUAGES.map(l => (
            <button key={l.code} onClick={()=>{setLang(l.code);setOpen(false)}} style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'10px 14px', border:'none', background:l.code===lang?'#F5F0E8':'white', cursor:'pointer', fontFamily:F.sans, fontSize:13, color:'#2A2318' }}>
              <span style={{ fontSize:16 }}>{l.flag}</span>{l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Tab bar ──────────────────────────────────────────────────
function TabBar({ view, setView, cartCount }) {
  const tabs = [
    { id:VIEWS.HOME, label:'Home', path:'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
    { id:VIEWS.CATEGORY, label:'Shop', path:'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z' },
    { id:VIEWS.BASKET, label:'Basket', path:'M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z', badge:cartCount },
    { id:VIEWS.SEARCH, label:'Search', search:true },
    { id:VIEWS.ACCOUNT, label:'Account', path:'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z' },
  ]
  return (
    <div style={{ position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:480, display:'flex', background:C.tabBg, backdropFilter:'blur(14px)', borderTop:'0.5px solid rgba(43,122,139,0.2)', zIndex:100, paddingBottom:'env(safe-area-inset-bottom,0px)' }}>
      {tabs.map(t => (
          <button key={t.id} onClick={()=>setView(t.id)}
            style={{ flex:1, padding:'11px 4px 9px', border:'none', background:'none', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:3, fontFamily:F.sans, fontSize:10, color:view===t.id?'#7EE8C8':'rgba(150,220,200,0.35)', fontWeight:view===t.id?500:400, position:'relative', transition:'color 0.15s' }}>
            <div style={{ position:'relative' }}>
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={view===t.id?2:1.7}>
                {t.search ? <><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></> : <path d={t.path}/>}
              </svg>
              {t.badge>0 && <span style={{ position:'absolute', top:-5, right:-7, background:'#C4683A', color:'white', borderRadius:'50%', width:16, height:16, fontSize:9, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:600, border:'1.5px solid rgba(10,30,40,0.97)' }}>{t.badge>9?'9+':t.badge}</span>}
            </div>
            {t.label}
          </button>
        ))}
    </div>
  )
}

// ─── Mini card ────────────────────────────────────────────────
function MiniCard({ product, t, onDetail }) {
  const qty = useCartStore(s=>s.items.find(i=>i.product.id===product.id)?.quantity??0)
  const { addItem, updateQuantity } = useCartStore()
  const outOfStock = product.stock_quantity === 0
  return (
    <div style={{ background:C.card, border:'0.5px solid '+C.cardBorder, borderRadius:14, overflow:'hidden', minWidth:134, maxWidth:134, flexShrink:0, position:'relative', opacity:outOfStock?0.5:1 }}
      onClick={() => !outOfStock && onDetail?.(product)}>
      <div style={{ position:'relative' }}>
        <ProductImage productId={product.id} emoji={product.emoji} category={product.category} alt={product.name} size="mini" style={{ height:100 }} />
        {outOfStock ? (
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ background:'rgba(0,0,0,0.7)', borderRadius:8, padding:'4px 8px', fontSize:10, color:'white', fontWeight:700 }}>Out of stock</div>
          </div>
        ) : product.low_stock && product.stock_quantity <= 5 ? (
          <div style={{ position:'absolute', top:4, left:4, background:'#C4683A', borderRadius:8, padding:'2px 7px', fontSize:9, color:'white', fontWeight:700 }}>Only {product.stock_quantity} left!</div>
        ) : null}
        {!outOfStock && (
          qty===0 ?
            <button onClick={e=>{e.stopPropagation();addItem(product);toast.success(product.emoji+' Added!',{duration:900})}}
              style={{ position:'absolute', top:7, right:7, width:28, height:28, background:'#C4683A', border:'2px solid white', borderRadius:'50%', color:'white', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', boxShadow:'0 2px 8px rgba(0,0,0,0.18)', lineHeight:1 }}>+</button>
            : <div onClick={e=>e.stopPropagation()} style={{ position:'absolute', top:6, right:6, display:'flex', alignItems:'center', gap:3, background:'rgba(255,255,255,0.96)', borderRadius:20, padding:'2px 7px', boxShadow:'0 1px 5px rgba(0,0,0,0.12)' }}>
                <button onClick={()=>updateQuantity(product.id,qty-1)} style={{ width:18, height:18, background:'#E8E0D0', border:'none', borderRadius:'50%', cursor:'pointer', fontSize:12, display:'flex', alignItems:'center', justifyContent:'center', color:'#2A2318' }}>−</button>
                <span style={{ fontSize:11, fontWeight:500, minWidth:12, textAlign:'center', color:'#2A2318' }}>{qty}</span>
                <button onClick={()=>updateQuantity(product.id,qty+1)} style={{ width:18, height:18, background:'#C4683A', border:'none', borderRadius:'50%', cursor:'pointer', fontSize:12, color:'white', display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
              </div>
        )}
      </div>
      <div style={{ padding:'8px 10px 10px' }}>
        <div style={{ fontSize:11, fontWeight:500, color:C.text, lineHeight:1.3, height:28, overflow:'hidden', marginBottom:3 }}>{product.name}</div>
        <div style={{ fontSize:13, fontWeight:500, color:'#C4683A' }}>€{product.price.toFixed(2)}</div>
      </div>
    </div>
  )
}

// ─── Basket ───────────────────────────────────────────────────
function BasketView({ t, onCheckout, promoCode, setPromoCode }) {
  const cart = useCartStore()
  const { updateQuantity } = useCartStore()
  const discount = promoCode?.reward_eur || 0
  const MIN_ORDER = 15

  if (cart.getItemCount()===0) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:40, minHeight:'60vh' }}>
      <div style={{ fontSize:52, marginBottom:14 }}>🛒</div>
      <div style={{ fontFamily:F.serif, fontSize:22, color:'rgba(255,255,255,0.85)', marginBottom:6 }}>Your basket is empty</div>
      <div style={{ fontSize:14, color:C.muted }}>Add something delicious</div>
    </div>
  )

  const subtotal = cart.getSubtotal()
  const belowMin = subtotal < MIN_ORDER
  const total = Math.max(0, subtotal + 3.5 - discount)

  return (
    <div style={{ padding:'16px 16px 20px' }}>
      <div style={{ fontFamily:F.serif, fontSize:26, color:'white', marginBottom:16 }}>{t.viewCart}</div>

      {belowMin && (
        <div style={{ background:'rgba(196,104,58,0.15)', border:'0.5px solid rgba(196,104,58,0.3)', borderRadius:10, padding:'10px 14px', marginBottom:14, fontSize:13, color:'#E8C090' }}>
          ⚠️ Minimum order is €{MIN_ORDER}. Add €{(MIN_ORDER-subtotal).toFixed(2)} more to checkout.
        </div>
      )}

      {cart.items.map(({product,quantity}) => (
        <div key={product.id} style={{ display:'flex', gap:12, alignItems:'center', padding:'12px 0', borderBottom:'0.5px solid rgba(255,255,255,0.08)' }}>
          <div style={{ width:52, height:52, borderRadius:10, overflow:'hidden', flexShrink:0 }}>
            <ProductImage productId={product.id} emoji={product.emoji} category={product.category} alt={product.name} size="list" style={{ height:52, width:52 }} />
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:13, fontWeight:500, color:'white', lineHeight:1.3, marginBottom:3 }}>{product.name}</div>
            <div style={{ fontSize:13, color:'#E8A070', fontWeight:500 }}>€{(product.price*quantity).toFixed(2)}</div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <button onClick={()=>updateQuantity(product.id,quantity-1)} style={{ width:26, height:26, background:'rgba(255,255,255,0.1)', border:'none', borderRadius:'50%', cursor:'pointer', fontSize:14, color:'white', display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>
            <span style={{ fontSize:13, fontWeight:500, color:'white', minWidth:16, textAlign:'center' }}>{quantity}</span>
            <button onClick={()=>updateQuantity(product.id,quantity+1)} style={{ width:26, height:26, background:'rgba(255,255,255,0.12)', border:'none', borderRadius:'50%', cursor:'pointer', fontSize:14, color:'white', display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
          </div>
        </div>
      ))}

      {/* Delivery notes */}
      <div style={{ marginTop:14 }}>
        <div style={{ fontSize:12, color:C.muted, marginBottom:6 }}>Delivery notes (optional)</div>
        <input value={cart.deliveryNotes||''} onChange={e=>cart.setDeliveryNotes(e.target.value)}
          placeholder="Gate code, floor, leave at door..."
          style={{ width:'100%', padding:'10px 14px', background:'rgba(255,255,255,0.08)', border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:10, color:'white', fontSize:13, fontFamily:F.sans, outline:'none', boxSizing:'border-box' }} />
      </div>

      {/* Contactless option */}
      <button onClick={()=>cart.setDeliveryNotes((cart.deliveryNotes?cart.deliveryNotes+' · ':'')+'Please leave at door')}
        style={{ width:'100%', marginTop:8, padding:'9px', background:'rgba(255,255,255,0.06)', border:'0.5px solid rgba(255,255,255,0.12)', borderRadius:10, color:C.muted, fontSize:12, cursor:'pointer', fontFamily:F.sans }}>
        📦 Leave at door (contactless)
      </button>

      {/* Promo code */}
      <div style={{ marginTop:14 }}>
        <div style={{ fontSize:12, color:C.muted, marginBottom:6 }}>Promo / referral code</div>
        <PromoCodeEntry onApply={setPromoCode} />
      </div>

      <div style={{ marginTop:16, padding:'14px 0', borderTop:'0.5px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'rgba(255,255,255,0.5)', marginBottom:5 }}><span>Subtotal</span><span>€{subtotal.toFixed(2)}</span></div>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'rgba(255,255,255,0.5)', marginBottom:5 }}><span>{t.delivery}</span><span>€3.50</span></div>
        {discount > 0 && <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'#7EE8A2', marginBottom:5 }}><span>Promo discount</span><span>−€{discount.toFixed(2)}</span></div>}
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:16, fontWeight:500, color:'white', marginBottom:10 }}><span>{t.total}</span><span style={{ color:'#E8A070' }}>€{total.toFixed(2)}</span></div>
      </div>

      {cart.getHasAgeRestricted() && (
        <div style={{ background:'rgba(196,104,58,0.18)', border:'0.5px solid rgba(196,104,58,0.35)', borderRadius:10, padding:'9px 12px', display:'flex', gap:8, fontSize:11, color:'#E8C090', marginBottom:12 }}>
          <span>🆔</span><span>ID required at delivery for age-restricted items</span>
        </div>
      )}

      <button onClick={onCheckout} disabled={belowMin}
        style={{ width:'100%', padding:'16px', background:belowMin?'rgba(196,104,58,0.3)':'#C4683A', color:'white', border:'none', borderRadius:14, fontFamily:F.sans, fontSize:15, fontWeight:500, cursor:belowMin?'default':'pointer', boxShadow:belowMin?'none':'0 4px 20px rgba(196,104,58,0.4)' }}>
        {belowMin ? 'Add more items to checkout' : t.checkout+' →'}
      </button>
    </div>
  )
}

// ─── Account ──────────────────────────────────────────────────
function AccountView({ t, onShowHistory, onShowAddresses, onShowHelp, onShowLoyalty, onShowNotifications, onShowWishlist, onShowReferral, onSignIn }) {
  const { user, profile, clear } = useAuthStore()

  const menuItems = user ? [
    { icon:'📦', label:'Order history', action:onShowHistory },
    { icon:'❤️', label:'Favourites', action:onShowWishlist },
    { icon:'📍', label:'Saved addresses', action:onShowAddresses },
    { icon:'🌴', label:'Loyalty rewards', action:onShowLoyalty },
    { icon:'🔗', label:'Refer a friend · Earn €10', action:onShowReferral },
    { icon:'🔔', label:'Notifications', action:onShowNotifications },
    { icon:'❓', label:'Help & support', action:onShowHelp },
    { icon:'💬', label:'WhatsApp support', action:()=>window.open('https://wa.me/34971000000','_blank') },
  ] : []

  return (
    <div style={{ padding:'20px 16px' }}>
      <div style={{ fontFamily:F.serif, fontSize:26, color:'white', marginBottom:20 }}>Account</div>
      {user ? (
        <>
          <div style={{ background:'rgba(255,255,255,0.07)', borderRadius:14, padding:16, marginBottom:16 }}>
            <div style={{ width:56, height:56, borderRadius:'50%', background:'linear-gradient(135deg,#C4683A,#E8854A)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, marginBottom:12 }}>
              {(profile?.full_name||'U').charAt(0).toUpperCase()}
            </div>
            <div style={{ fontSize:17, fontWeight:600, color:'white' }}>{profile?.full_name||'Guest'}</div>
            <div style={{ fontSize:13, color:C.muted, marginTop:2 }}>{user.email}</div>
          </div>

          {menuItems.map(item => (
            <button key={item.label} onClick={item.action}
              style={{ display:'flex', alignItems:'center', gap:12, width:'100%', padding:'14px 16px', background:'rgba(255,255,255,0.06)', border:'none', borderRadius:12, marginBottom:8, cursor:'pointer', textAlign:'left', fontFamily:F.sans }}>
              <span style={{ fontSize:18 }}>{item.icon}</span>
              <span style={{ fontSize:14, color:'rgba(255,255,255,0.82)', flex:1 }}>{item.label}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          ))}

          <button onClick={()=>{ supabase.auth.signOut(); clear() }}
            style={{ width:'100%', marginTop:16, padding:'13px', background:'rgba(196,104,58,0.12)', border:'0.5px solid rgba(196,104,58,0.3)', borderRadius:12, fontFamily:F.sans, fontSize:14, color:'#E8A070', cursor:'pointer' }}>
            Sign out
          </button>
        </>
      ) : (
        <div style={{ textAlign:'center', padding:'40px 0' }}>
          <div style={{ fontSize:48, marginBottom:14 }}>👤</div>
          <div style={{ fontFamily:F.serif, fontSize:22, color:'white', marginBottom:8 }}>Sign in to your account</div>
          <div style={{ fontSize:14, color:C.muted, marginBottom:24 }}>Track orders, save addresses, earn rewards and more</div>
          <button onClick={onSignIn} style={{ width:'100%', padding:'14px', background:'#C4683A', color:'white', border:'none', borderRadius:12, fontFamily:F.sans, fontSize:15, fontWeight:600, cursor:'pointer', marginBottom:10 }}>
            Sign in
          </button>
          <button onClick={onSignIn} style={{ width:'100%', padding:'14px', background:'rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.7)', border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:12, fontFamily:F.sans, fontSize:14, cursor:'pointer' }}>
            Create account
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Categories ───────────────────────────────────────────────
function CategoriesView({ onSelect }) {
  return (
    <div style={{ padding:'16px 16px 0' }}>
      <div style={{ fontFamily:F.serif, fontSize:26, color:'white', marginBottom:16 }}>Categories</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        {CATEGORIES.map(cat => (
          <button key={cat.key} onClick={()=>onSelect(cat.key)}
            style={{ background:'rgba(255,255,255,0.08)', border:'0.5px solid rgba(255,255,255,0.12)', borderRadius:14, padding:'18px 14px', cursor:'pointer', display:'flex', alignItems:'center', gap:10, textAlign:'left' }}>
            <span style={{ fontSize:26 }}>{cat.emoji}</span>
            <span style={{ fontFamily:F.sans, fontSize:14, fontWeight:500, color:'white' }}>{cat.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Search ───────────────────────────────────────────────────
function SearchView({ t, onDetail }) {
  const [query, setQuery] = useState('')
  const { addItem } = useCartStore()
  const results = query.length>1 ? PRODUCTS.filter(p=>p.name.toLowerCase().includes(query.toLowerCase())).slice(0,40) : []
  return (
    <div style={{ padding:'16px 16px 0' }}>
      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        <div style={{ flex:1, display:'flex', alignItems:'center', background:'rgba(255,255,255,0.1)', borderRadius:12, padding:'10px 14px', gap:8, border:'0.5px solid rgba(255,255,255,0.1)' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder={t.searchPlaceholder} style={{ flex:1, border:'none', background:'none', fontFamily:F.sans, fontSize:14, color:'white', outline:'none' }}/>
          {query && <button onClick={()=>setQuery('')} style={{ border:'none', background:'none', cursor:'pointer', color:'rgba(255,255,255,0.4)', fontSize:15, padding:0 }}>✕</button>}
        </div>
      </div>
      {query.length>1 && results.length>0 && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          {results.map(p => (
            <div key={p.id} style={{ background:'rgba(255,255,255,0.08)', border:'0.5px solid rgba(255,255,255,0.1)', borderRadius:14, overflow:'hidden', position:'relative', cursor:'pointer' }} onClick={()=>onDetail(p)}>
              <ProductImage productId={p.id} emoji={p.emoji} category={p.category} alt={p.name} size="card" style={{ height:110 }} />
              <div style={{ padding:'9px 10px 11px' }}>
                <div style={{ fontSize:11, fontWeight:500, color:'white', lineHeight:1.3, marginBottom:4 }}>{p.name}</div>
                <div style={{ fontSize:13, fontWeight:500, color:'#E8A070' }}>€{p.price.toFixed(2)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      {query.length===0 && <div style={{ textAlign:'center', padding:'40px 0', color:'rgba(255,255,255,0.35)', fontSize:14 }}><div style={{ fontSize:36, marginBottom:10 }}>🔍</div>Search 150+ products</div>}
      {query.length>1 && results.length===0 && <div style={{ textAlign:'center', padding:'30px', color:'rgba(255,255,255,0.4)', fontSize:14 }}>No results for "{query}"</div>}
    </div>
  )
}

// ─── Home ─────────────────────────────────────────────────────
function HomeView({ t, lang, setLang, onCategorySelect, estimatedMins, onAssist, onBest, onNewIn, onBundles, onCocktails, onDetail, onPromoApply }) {
  const [searchQuery, setSearchQuery] = useState('')
  const cart = useCartStore()
  const { addItem } = useCartStore()
  const prevItems = cart.previousItems || []
  const [liveProducts, setLiveProducts] = useState(null)
  const [loadingProducts, setLoadingProducts] = useState(true)

  useEffect(() => {
    supabase.from('products').select('*').eq('is_active', true).order('category')
      .then(({ data }) => {
        if (data && data.length > 0) setLiveProducts(data)
        setLoadingProducts(false)
      })
      .catch(() => setLoadingProducts(false))
  }, [])

  const displayProducts = liveProducts || PRODUCTS
  const searchResults = searchQuery.length>1 ? displayProducts.filter(p=>p.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0,30) : []

  return (
    <div>
      <div style={{ background:C.header }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 16px 0' }}>
          <div>
            <div style={{ fontFamily:F.serif, fontSize:28, color:'white', letterSpacing:'-0.5px', lineHeight:1 }}>Isla Drop</div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.45)', marginTop:3, letterSpacing:'1.5px', textTransform:'uppercase' }}>{t.tagline}</div>
          </div>
          <div style={{ display:'flex', gap:7, alignItems:'center' }}>
            <div style={{ background:'rgba(255,255,255,0.12)', border:'0.5px solid rgba(255,255,255,0.18)', borderRadius:20, fontSize:11, padding:'4px 10px', display:'flex', alignItems:'center', gap:5, color:'white' }}>
              <span style={{ width:5, height:5, borderRadius:'50%', background:'#7EE8A2', display:'inline-block', animation:'pulse 1.5s infinite' }}/>Open 24/7
            </div>
            <LanguagePicker lang={lang} setLang={setLang} />
          </div>
        </div>
        <AddressBar estimatedMins={estimatedMins} />
      </div>

      <div style={{ padding:'10px 16px', background:'rgba(13,59,74,0.98)', position:'sticky', top:0, zIndex:50, borderBottom:'0.5px solid rgba(43,122,139,0.25)', backdropFilter:'blur(10px)' }}>
        <div style={{ display:'flex', gap:8 }}>
          <div style={{ flex:1, display:'flex', alignItems:'center', background:'rgba(255,255,255,0.09)', borderRadius:12, padding:'10px 14px', gap:8, border:'0.5px solid rgba(255,255,255,0.1)' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder={t.searchPlaceholder} style={{ flex:1, border:'none', background:'none', fontFamily:F.sans, fontSize:14, color:'white', outline:'none' }}/>
            {searchQuery && <button onClick={()=>setSearchQuery('')} style={{ border:'none', background:'none', cursor:'pointer', color:'rgba(255,255,255,0.4)', fontSize:15, padding:0 }}>✕</button>}
          </div>
          <button onClick={()=>onAssist()} style={{ width:44, height:44, background:'rgba(255,255,255,0.09)', border:'0.5px solid rgba(255,255,255,0.14)', borderRadius:12, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#E8A070" stroke="#E8A070" strokeWidth="1"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
          </button>
        </div>
      </div>

      {searchQuery.length>1 && (
        <div style={{ padding:'12px 16px' }}>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', marginBottom:10 }}>{searchResults.length} results for "{searchQuery}"</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {searchResults.map(p => (
              <div key={p.id} style={{ background:'rgba(255,255,255,0.07)', border:'0.5px solid rgba(255,255,255,0.1)', borderRadius:14, overflow:'hidden', cursor:'pointer' }} onClick={()=>onDetail(p)}>
                <ProductImage productId={p.id} emoji={p.emoji} category={p.category} alt={p.name} size="card" style={{ height:110 }} />
                <div style={{ padding:'9px 10px 11px' }}>
                  <div style={{ fontSize:11, fontWeight:500, color:'white', lineHeight:1.3, marginBottom:4 }}>{p.name}</div>
                  <div style={{ fontSize:13, fontWeight:500, color:'#E8A070' }}>€{p.price.toFixed(2)}</div>
                </div>
              </div>
            ))}
            {searchResults.length===0 && <div style={{ gridColumn:'span 2', textAlign:'center', padding:'20px', color:'rgba(255,255,255,0.35)', fontSize:13 }}>No results — try different words</div>}
          </div>
        </div>
      )}

      {!searchQuery && (
        <div style={{ paddingBottom:20 }}>
          {/* Flash sale + first order banners */}
          <FlashSaleBanner onShop={()=>onCategorySelect('beer')} />
          <FirstOrderBanner onApply={onPromoApply} />

          {/* Quick actions */}
          <div style={{ display:'flex', gap:8, padding:'12px 16px 8px', overflowX:'auto', scrollbarWidth:'none' }}>
            {[
              { emoji:'🍹', label:'Cocktail builder', action:onCocktails },
              { emoji:'🎁', label:'Bundle deals', action:onBundles },
              { emoji:'🔥', label:'Best sellers', action:onBest },
              { emoji:'✨', label:'New in', action:onNewIn },
            ].map(q => (
              <button key={q.label} onClick={q.action}
                style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', background:'rgba(255,255,255,0.08)', border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:20, cursor:'pointer', whiteSpace:'nowrap', fontFamily:F.sans, fontSize:12, color:'rgba(255,255,255,0.85)', flexShrink:0 }}>
                <span>{q.emoji}</span>{q.label}
              </button>
            ))}
          </div>

          {/* Reorder */}
          {prevItems.length>0 && (
            <div style={{ paddingTop:16, marginBottom:22 }}>
              <div style={{ fontFamily:F.serif, fontSize:20, padding:'0 16px', marginBottom:12, color:'white' }}>🔄 {t.orderAgain}</div>
              <div style={{ display:'flex', gap:10, overflowX:'auto', padding:'0 16px 4px', scrollbarWidth:'none' }}>
                {prevItems.slice(0,8).map(p => <MiniCard key={p.id} product={p} t={t} onDetail={onDetail} />)}
              </div>
            </div>
          )}

          {/* Best sellers */}
          <div style={{ paddingTop:prevItems.length?0:16, marginBottom:22 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0 16px', marginBottom:12 }}>
              <button onClick={onBest} style={{ fontFamily:F.serif, fontSize:20, color:'white', background:'none', border:'none', cursor:'pointer', padding:0 }}>🔥 {t.bestSellers}</button>
              <button onClick={onBest} style={{ fontSize:11, color:'rgba(255,255,255,0.5)', background:'none', border:'none', cursor:'pointer', fontFamily:F.sans }}>See all →</button>
            </div>
            {loadingProducts ? <SkeletonRow /> : (
              <div style={{ display:'flex', gap:10, overflowX:'auto', padding:'0 16px 4px', scrollbarWidth:'none' }}>
                {BEST_SELLERS.map(p => <MiniCard key={p.id} product={p} t={t} onDetail={onDetail} />)}
              </div>
            )}
          </div>

          {/* New in */}
          <div style={{ marginBottom:22 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0 16px', marginBottom:12 }}>
              <button onClick={onNewIn} style={{ fontFamily:F.serif, fontSize:20, color:'white', background:'none', border:'none', cursor:'pointer', padding:0 }}>✨ {t.newIn}</button>
              <button onClick={onNewIn} style={{ fontSize:11, color:'rgba(255,255,255,0.5)', background:'none', border:'none', cursor:'pointer', fontFamily:F.sans }}>See all →</button>
            </div>
            {loadingProducts ? <SkeletonRow /> : (
              <div style={{ display:'flex', gap:10, overflowX:'auto', padding:'0 16px 4px', scrollbarWidth:'none' }}>
                {NEW_IN.slice(0,10).map(p => <MiniCard key={p.id} product={p} t={t} onDetail={onDetail} />)}
              </div>
            )}
          </div>

          {/* Category rows */}
          {CATEGORIES.map(cat => {
            const catProducts = displayProducts.filter(p => p.category === cat.key).slice(0,10)
            if (catProducts.length === 0) return null
            return (
              <div key={cat.key} style={{ marginBottom:24 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0 16px', marginBottom:12 }}>
                  <button onClick={()=>onCategorySelect(cat.key)} style={{ fontFamily:F.serif, fontSize:20, color:'white', background:'none', border:'none', cursor:'pointer', padding:0 }}>
                    {cat.emoji} {cat.label}
                  </button>
                  <button onClick={()=>onCategorySelect(cat.key)} style={{ fontSize:11, color:'rgba(255,255,255,0.5)', background:'none', border:'none', cursor:'pointer', fontFamily:F.sans }}>See all →</button>
                </div>
                {loadingProducts ? <SkeletonRow /> : (
                  <div style={{ display:'flex', gap:10, overflowX:'auto', padding:'0 16px 4px', scrollbarWidth:'none' }}>
                    {catProducts.map(p => <MiniCard key={p.id} product={p} t={t} onDetail={onDetail} />)}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  )
}

// ─── Root ──────────────────────────────────────────────────────
export default function CustomerApp() {
  const [view, setView] = useState(VIEWS.SPLASH)
  const [lang, setLang] = useState('en')
  const [categoryKey, setCategoryKey] = useState(null)
  const [activeOrder, setActiveOrder] = useState(null)
  const [promoCode, setPromoCode] = useState(null)
  const [scheduledDelivery, setScheduledDelivery] = useState(null)

  // Overlay states
  const wishlist = useWishlistStore()
  const [showHistory, setShowHistory] = useState(false)
  const [showAddresses, setShowAddresses] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [showLoyalty, setShowLoyalty] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showDetail, setShowDetail] = useState(null)
  const [showRating, setShowRating] = useState(null)
  const [showCocktails, setShowCocktails] = useState(false)
  const [showBundles, setShowBundles] = useState(false)
  const [showSchedule, setShowSchedule] = useState(false)
  const [showSignIn, setShowSignIn] = useState(false)
  const [showWishlist, setShowWishlist] = useState(false)
  const [showUpsell, setShowUpsell] = useState(false)
  const [showDriverContact, setShowDriverContact] = useState(false)
  const [showReferral, setShowReferral] = useState(false)

  const { user } = useAuthStore()
  const cart = useCartStore()
  const t = useT(lang)
  const estimatedMins = cart.deliveryAddress ? 18 : null

  // Handle browser back button
  useEffect(() => {
    const handler = (e) => {
      if (view !== VIEWS.HOME && view !== VIEWS.SPLASH) {
        e.preventDefault()
        setView(VIEWS.HOME)
      }
    }
    window.addEventListener('popstate', handler)
    return () => window.removeEventListener('popstate', handler)
  }, [view])

  // Push state on view change for back button
  useEffect(() => {
    if (view !== VIEWS.SPLASH) window.history.pushState({ view }, '', window.location.pathname)
  }, [view])

  const goToCategory = (key) => { setCategoryKey(key); setView(VIEWS.CATEGORY) }

  const handleTabChange = (v) => {
    if (v !== VIEWS.CATEGORY) setCategoryKey(null)
    setView(v)
  }

  const handleCheckoutStart = () => {
    if (!user) { setShowSignIn(true); return }
    if (cart.getHasAgeRestricted()) { setView(VIEWS.AGE_VERIFY); return }
    // Show upsell suggestions before payment
    setShowUpsell(true)
  }

  const proceedToCheckout = () => {
    setShowUpsell(false)
    setView(VIEWS.CHECKOUT)
  }

  const handlePaymentSuccess = async (paymentIntentId) => {
    try {
      const { createOrder, subscribeToOrder: subToOrder } = await import('../../lib/supabase')
      const order = await createOrder({
        customerId: user.id, items: cart.items.map(i=>({productId:i.product.id,quantity:i.quantity,price:i.product.price})),
        deliveryLat: cart.deliveryLat, deliveryLng: cart.deliveryLng,
        deliveryAddress: cart.deliveryAddress, deliveryNotes: cart.deliveryNotes,
        what3words: cart.what3words, subtotal: cart.getSubtotal(),
        total: Math.max(0, cart.getTotal() - (promoCode?.reward_eur||0)),
        paymentIntentId, scheduled_at: scheduledDelivery ? new Date(scheduledDelivery.date+'T'+scheduledDelivery.time).toISOString() : null,
      })
      cart.clearCart(); setPromoCode(null); setActiveOrder(order); setView(VIEWS.TRACKING)
      const sub = subToOrder(order.id, u => {
        setActiveOrder(u)
        if (u.status === 'delivered') {
          toast.success('🎉 Delivered!')
          setTimeout(() => setShowRating(u), 2000)
          sub.unsubscribe()
        }
        if (['confirmed','assigned','en_route'].includes(u.status)) {
          const msgs = { confirmed:'✅ Order confirmed!', assigned:'🛵 Driver on the way!', en_route:'🚀 Almost there!' }
          toast(msgs[u.status] || '', { duration:3000 })
        }
      })
    } catch(err) { toast.error('Order failed: '+err.message) }
  }

  // SPLASH
  if (view === VIEWS.SPLASH) return <SplashScreen onEnter={()=>setView(VIEWS.HOME)} />

  // AGE VERIFY
  if (view === VIEWS.AGE_VERIFY) return (
    <div style={{ position:'fixed', inset:0, background:'rgba(10,25,35,0.75)', zIndex:200, display:'flex', alignItems:'flex-end', justifyContent:'center' }} onClick={()=>setView(VIEWS.BASKET)}>
      <div style={{ background:'#FEFCF9', borderRadius:'24px 24px 0 0', padding:'28px 24px 40px', width:'100%', maxWidth:480 }} onClick={e=>e.stopPropagation()}>
        <div style={{ width:36, height:4, background:'rgba(42,35,24,0.15)', borderRadius:2, margin:'0 auto 20px' }}/>
        <AgeVerification onVerified={()=>setView(VIEWS.CHECKOUT)} onClose={()=>setView(VIEWS.BASKET)} />
      </div>
    </div>
  )

  // CHECKOUT
  if (view === VIEWS.CHECKOUT) return (
    <div style={{ background:C.bg, minHeight:'100vh', paddingBottom:60 }}>
      <div style={{ padding:'16px 16px 20px' }}>
        <button onClick={()=>setView(VIEWS.BASKET)} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.55)', fontSize:14, cursor:'pointer', fontFamily:F.sans, marginBottom:12 }}>← Back to basket</button>
        <div style={{ fontFamily:F.serif, fontSize:26, color:'white', marginBottom:20 }}>{t.checkout}</div>

        {/* Schedule delivery */}
        <div style={{ marginBottom:16 }}>
          <div style={{ fontFamily:F.serif, fontSize:16, color:'white', marginBottom:10 }}>Delivery time</div>
          <button onClick={()=>setShowSchedule(true)}
            style={{ width:'100%', padding:'12px 16px', background:C.surface, border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:12, color:'white', fontSize:13, textAlign:'left', cursor:'pointer', fontFamily:F.sans, display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:18 }}>{scheduledDelivery?'🕐':'🚀'}</span>
            <span>{scheduledDelivery ? 'Scheduled: '+scheduledDelivery.time+' on '+scheduledDelivery.date : 'Deliver now (15–30 min)'}</span>
            <span style={{ marginLeft:'auto', color:C.muted }}>›</span>
          </button>
        </div>

        <div style={{ fontFamily:F.serif, fontSize:16, color:'white', marginBottom:12 }}>Delivery location</div>
        <div style={{ borderRadius:14, overflow:'hidden', marginBottom:20 }}>
          <DeliveryMap onLocationSet={()=>{}} />
        </div>

        <div style={{ fontFamily:F.serif, fontSize:16, color:'white', marginBottom:12 }}>Order summary</div>
        <div style={{ background:'rgba(255,255,255,0.07)', borderRadius:14, padding:16, marginBottom:20 }}>
          {cart.items.map(({product,quantity}) => (
            <div key={product.id} style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:8, color:'rgba(255,255,255,0.82)' }}>
              <span>{product.emoji} {product.name} × {quantity}</span>
              <span style={{ fontWeight:500 }}>€{(product.price*quantity).toFixed(2)}</span>
            </div>
          ))}
          <div style={{ borderTop:'0.5px solid rgba(255,255,255,0.1)', paddingTop:10, marginTop:6 }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'rgba(255,255,255,0.45)', marginBottom:5 }}><span>Subtotal</span><span>€{cart.getSubtotal().toFixed(2)}</span></div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'rgba(255,255,255,0.45)', marginBottom:5 }}><span>{t.delivery}</span><span>€3.50</span></div>
            {promoCode && <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'#7EE8A2', marginBottom:5 }}><span>Promo</span><span>−€{promoCode.reward_eur.toFixed(2)}</span></div>}
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:15, fontWeight:500, color:'white' }}>
              <span>{t.total}</span>
              <span style={{ color:'#E8A070' }}>€{Math.max(0, cart.getTotal()-(promoCode?.reward_eur||0)).toFixed(2)}</span>
            </div>
          </div>
          {cart.deliveryNotes && <div style={{ marginTop:10, fontSize:12, color:'rgba(255,255,255,0.5)' }}>📝 {cart.deliveryNotes}</div>}
        </div>

        <div style={{ fontFamily:F.serif, fontSize:16, color:'white', marginBottom:16 }}>Payment</div>
        <StripeCheckout onSuccess={handlePaymentSuccess} onCancel={()=>setView(VIEWS.BASKET)} />
      </div>
    </div>
  )

  // TRACKING
  if (view === VIEWS.TRACKING && activeOrder) {
    const STEPS = ['confirmed','preparing','assigned','picked_up','en_route','delivered']
    const LABELS = { confirmed:'Confirmed', preparing:'Preparing', assigned:'Driver assigned', picked_up:'Picked up', en_route:'On the way', delivered:'Delivered!' }
    const idx = STEPS.indexOf(activeOrder.status)
    return (
      <div style={{ background:C.bg, minHeight:'100vh', padding:'24px 16px 100px' }}>
        <div style={{ fontFamily:F.serif, fontSize:26, color:'white', marginBottom:4 }}>{activeOrder.status==='delivered'?'Delivered! 🎉':'On its way 🛵'}</div>
        <div style={{ fontSize:13, color:'rgba(255,255,255,0.4)', marginBottom:20 }}>#{activeOrder.order_number}</div>
        <div style={{ background:'rgba(255,255,255,0.07)', borderRadius:14, padding:16, marginBottom:20 }}>
          {STEPS.map((s,i) => (
            <div key={s} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:i<STEPS.length-1?14:0 }}>
              <div style={{ width:28, height:28, borderRadius:'50%', flexShrink:0, background:i<=idx?(i===idx?'#C4683A':'#5A6B3A'):'rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                {i<idx && <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>}
                {i===idx && <div style={{ width:8, height:8, borderRadius:'50%', background:'white' }}/>}
              </div>
              <span style={{ fontSize:14, fontWeight:i===idx?500:400, color:i>idx?'rgba(255,255,255,0.35)':'white' }}>{LABELS[s]}</span>
            </div>
          ))}
        </div>
        {activeOrder.estimated_minutes && activeOrder.status !== 'delivered' && (
          <div style={{ background:'rgba(43,122,139,0.2)', border:'0.5px solid rgba(43,122,139,0.35)', borderRadius:14, padding:'14px 16px', marginBottom:20, display:'flex', alignItems:'center', gap:12 }}>
            <span style={{ fontSize:28 }}>🛵</span>
            <div><div style={{ fontSize:12, color:'rgba(255,255,255,0.45)' }}>Estimated arrival</div><div style={{ fontSize:22, fontWeight:500, color:'white' }}>{activeOrder.estimated_minutes} min</div></div>
          </div>
        )}
        {activeOrder.driver_id && (
          <div style={{ marginBottom:16 }}>
            <div style={{ fontFamily:F.serif, fontSize:16, color:'white', marginBottom:10 }}>Live tracking</div>
            <OrderTrackingMap order={activeOrder} driverId={activeOrder.driver_id} />
          </div>
        )}
        {activeOrder.status === 'en_route' && (
          <button onClick={()=>setShowDriverContact(true)}
            style={{ width:'100%', padding:13, marginBottom:10, background:'rgba(255,255,255,0.08)', border:'0.5px solid rgba(255,255,255,0.2)', borderRadius:12, color:'white', fontFamily:F.sans, fontSize:14, cursor:'pointer' }}>
            💬 Contact driver
          </button>
        )}
        <button onClick={()=>setView(VIEWS.HOME)} style={{ width:'100%', padding:15, background:'#C4683A', color:'white', border:'none', borderRadius:12, fontFamily:F.sans, fontSize:15, cursor:'pointer' }}>Place another order</button>
      </div>
    )
  }

  // MAIN SHELL
  return (
    <div style={{ background:C.bg, minHeight:'100vh', paddingBottom:68 }}>

      {view===VIEWS.CATEGORY && categoryKey && <CategoryPage categoryKey={categoryKey} onBack={()=>{ setCategoryKey(null); setView(VIEWS.HOME) }} />}
      {view===VIEWS.CATEGORY && !categoryKey && <CategoriesView onSelect={goToCategory} />}
      {view===VIEWS.HOME && (
        <HomeView t={t} lang={lang} setLang={setLang} onCategorySelect={goToCategory}
          estimatedMins={estimatedMins} onAssist={()=>setView(VIEWS.ASSIST)}
          onBest={()=>setView(VIEWS.BEST)} onNewIn={()=>setView(VIEWS.NEWIN)}
          onBundles={()=>setShowBundles(true)} onCocktails={()=>setShowCocktails(true)}
          onDetail={p=>setShowDetail(p)} onPromoApply={p=>setPromoCode(p)} />
      )}
      {view===VIEWS.SEARCH && <SearchView t={t} onDetail={p=>setShowDetail(p)} />}
      {view===VIEWS.BASKET && <BasketView t={t} onCheckout={handleCheckoutStart} promoCode={promoCode} setPromoCode={setPromoCode} />}
      {view===VIEWS.ACCOUNT && (
        <AccountView t={t}
          onShowHistory={()=>setShowHistory(true)}
          onShowAddresses={()=>setShowAddresses(true)}
          onShowHelp={()=>setShowHelp(true)}
          onShowLoyalty={()=>setShowLoyalty(true)}
          onShowNotifications={()=>setShowNotifications(true)}
          onShowWishlist={()=>setShowWishlist(true)}
          onShowReferral={()=>setShowReferral(true)}
          onSignIn={()=>setShowSignIn(true)} />
      )}
      {view===VIEWS.ASSIST && <AssistBot onClose={()=>setView(VIEWS.HOME)} />}
      {view===VIEWS.BEST && <AllProductsPage title="🔥 Best Sellers" products={BEST_SELLERS} onBack={()=>setView(VIEWS.HOME)} />}
      {view===VIEWS.NEWIN && <AllProductsPage title="✨ New In" products={NEW_IN} onBack={()=>setView(VIEWS.HOME)} />}

      {/* Floating cart */}
      {view===VIEWS.HOME && cart.getItemCount()>0 && (
        <div onClick={()=>setView(VIEWS.BASKET)}
          style={{ position:'sticky', bottom:68, margin:'0 16px', background:'#C4683A', borderRadius:14, padding:'13px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', boxShadow:'0 4px 24px rgba(196,104,58,0.5)' }}>
          <div style={{ color:'white' }}>
            <div style={{ fontSize:11, opacity:0.8 }}>{cart.getItemCount()} {cart.getItemCount()===1?t.item:t.items}</div>
            <div style={{ fontSize:15, fontWeight:500 }}>€{cart.getSubtotal().toFixed(2)} + €3.50 delivery</div>
          </div>
          <div style={{ color:'white', fontSize:13, fontWeight:500 }}>{t.viewCart} →</div>
        </div>
      )}

      <TabBar view={view} setView={handleTabChange} cartCount={cart.getItemCount()} />

      {/* Overlays */}
      {showWishlist && <OverlayErrorBoundary onClose={()=>setShowWishlist(false)}><WishlistView onClose={()=>setShowWishlist(false)} onDetail={p=>setShowDetail(p)} /></OverlayErrorBoundary>}
      {showUpsell && <OverlayErrorBoundary onClose={()=>setShowUpsell(false)}><UpsellSuggestions cartItems={cart.items} onClose={proceedToCheckout} /></OverlayErrorBoundary>}
      {showReferral && <OverlayErrorBoundary onClose={()=>setShowReferral(false)}><ReferralShare onClose={()=>setShowReferral(false)} /></OverlayErrorBoundary>}
      {showDriverContact && activeOrder && <OverlayErrorBoundary onClose={()=>setShowDriverContact(false)}><DriverContact order={activeOrder} onClose={()=>setShowDriverContact(false)} /></OverlayErrorBoundary>}
      {showHistory && <OverlayErrorBoundary onClose={()=>setShowHistory(false)}><OrderHistory onClose={()=>setShowHistory(false)} /></OverlayErrorBoundary>}
      {showAddresses && <OverlayErrorBoundary onClose={()=>setAddresses(false)}><SavedAddresses onClose={()=>setShowAddresses(false)} onSelect={addr=>{ cart.setDeliveryLocation(null,null,addr); setShowAddresses(false) }} />}
      {showHelp && <OverlayErrorBoundary onClose={()=>setHelp(false)}><HelpSupport onClose={()=>setShowHelp(false)} />}
      {showLoyalty && <OverlayErrorBoundary onClose={()=>setLoyalty(false)}><LoyaltyCard onClose={()=>setShowLoyalty(false)} />}
      {showNotifications && <OverlayErrorBoundary onClose={()=>setNotifications(false)}><NotificationSettings onClose={()=>setShowNotifications(false)} />}
      {showDetail && <ProductDetail product={showDetail} onClose={()=>setShowDetail(null)} />}
      {showRating && <RatingPrompt order={showRating} onClose={()=>setShowRating(null)} />}
      {showCocktails && <CocktailBuilder products={PRODUCTS} onClose={()=>setShowCocktails(false)} />}
      {showBundles && <BundleDeals products={PRODUCTS} onClose={()=>setShowBundles(false)} />}
      {showSchedule && <ScheduleDelivery onClose={()=>setShowSchedule(false)} onSchedule={s=>{ setScheduledDelivery(s); setShowSchedule(false) }} />}

      <PWAInstallPrompt />
      {/* Sign in overlay */}
      {showSignIn && (
        <div style={{ position:'fixed', inset:0, zIndex:500, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'flex-end' }} onClick={()=>setShowSignIn(false)}>
          <div style={{ width:'100%', maxWidth:480, margin:'0 auto', background:'#FEFCF9', borderRadius:'24px 24px 0 0', padding:'28px 24px 48px' }} onClick={e=>e.stopPropagation()}>
            <div style={{ width:36, height:4, background:'rgba(42,35,24,0.15)', borderRadius:2, margin:'0 auto 24px' }}/>
            <div style={{ fontFamily:F.serif, fontSize:24, color:C.text, marginBottom:8 }}>Sign in to Isla Drop</div>
            <div style={{ fontSize:13, color:C.textMuted, marginBottom:24 }}>Sign in to track orders, save addresses and earn rewards</div>
            <button onClick={()=>{ setShowSignIn(false); setView(VIEWS.ACCOUNT) }}
              style={{ width:'100%', padding:'15px', background:'#C4683A', color:'white', border:'none', borderRadius:14, fontFamily:F.sans, fontSize:15, fontWeight:600, cursor:'pointer', marginBottom:10 }}>
              Continue to sign in →
            </button>
            <button onClick={()=>setShowSignIn(false)} style={{ width:'100%', padding:'13px', background:'transparent', border:'0.5px solid rgba(42,35,24,0.15)', borderRadius:12, fontFamily:F.sans, fontSize:14, cursor:'pointer', color:C.textMuted }}>
              Continue as guest
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
