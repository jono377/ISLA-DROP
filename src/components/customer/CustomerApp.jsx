import { useState, useEffect, useCallback, useRef } from 'react'
import toast from 'react-hot-toast'
import { useCartStore, useAuthStore } from '../../lib/store'
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
import { supabase, createOrder, subscribeToOrder } from '../../lib/supabase'
import PartyBuilder from './PartyBuilder'
import ArrivalPackage from './ArrivalPackage'
import {
  ProductDetailSheet, RatingSheet, ReportIssueSheet,
  OrderHistoryView, SavedAddressesView, EditProfileView,
  PWAInstallPrompt
} from './CustomerFeatures_20'
import {
  FadeIn, SHIMMER_STYLE, useWishlist, WishlistView, WishlistButton,
  LoyaltyCard, TipSelector, trackView, RecentlyViewedRow,
  OrderReceiptSheet, CancelOrderButton, DriverChat, W3WPicker,
  useDarkMode, DarkModeToggle, ReferralView, NotificationPrefsView,
  ScheduledDeliverySheet
} from './CustomerFeatures_15'
import {
  OrderConfirmationScreen, CategoryNavBar, ProductBadge,
  addSearchHistory, clearSearchHistory, SearchHistoryPanel, SearchSuggestions,
  LastOrderShortcut, BasketUpsell, hasValidAddress, NoAddressWarning,
  useArrivalTime, NativePayButton, StaffPicksRow,
  useTimeGreeting, TimeGreetingBanner, useAppRatingPrompt, AppRatingPrompt,
  SeasonalBanner, ClubPresetsSheet, BoatDeliverySheet, useWeatherSuggestion,
} from './CustomerFeatures_16'
import Concierge from './Concierge_final'
import {
  usePullToRefresh, PullToRefreshIndicator, DriverInfoCard,
  useCartTip, BasketTipLine, GuestCheckoutModal, StockBadge, OutOfStockOverlay,
  useOnboarding, OnboardingCarousel, ScrollToTop,
  FreeDeliveryBar, EarnStampsLine, DeleteAccountSheet,
  ChangeCredentialsSheet, HotelDeliverySheet, shareProduct,
} from './CustomerFeatures_extra'
import {
  useSavedCard, SavedCardRow, AddressAutocomplete,
  useNotifications, NotificationBell, NotificationCentre,
  sendWhatsAppConfirmation, ProductReviews, ProductRatingBadge,
  useTrending, TrendingRow, LoyaltyRedemptionRow,
  useDietaryPrefs, DietaryFilterBar, DIETARY_TAGS,
  detectUsualOrder, YourUsualCard, GiftMessageToggle, SubstitutionPreference,
  LoyaltyHeaderBadge, useLoyaltyStamps, useMorningAfterKit, MorningAfterKitBanner,
  PreArrivalSheet, PoolPartyMode,
} from './CustomerFeatures_world'
// supabase imported dynamically inside functions to prevent blank screen

// ── Flash sale hook ──────────────────────────────────────────
function useFlashSale() {
  const [sale, setSale] = useState(null)
  useEffect(()=>{
    supabase.from('flash_sales').select('*')
      .eq('active',true).gte('ends_at',new Date().toISOString()).limit(1).single()
      .then(({data})=>{ if(data) setSale(data) }).catch(()=>{})
  },[])
  return sale
}

function useCountdown(endsAt) {
  const [secs, setSecs] = useState(0)
  useEffect(()=>{
    if(!endsAt) return
    const tick=()=>setSecs(Math.max(0,Math.floor((new Date(endsAt)-Date.now())/1000)))
    tick(); const id=setInterval(tick,1000); return ()=>clearInterval(id)
  },[endsAt])
  const h=Math.floor(secs/3600),m=Math.floor((secs%3600)/60),s=secs%60
  return secs>0?(h>0?h+'h ':'')+m+'m '+s+'s':null
}

const VIEWS = { SPLASH:'splash', HOME:'home', CATEGORY:'category', SEARCH:'search', BASKET:'basket', ACCOUNT:'account', ASSIST:'assist', BEST:'best', NEWIN:'newin', AGE_VERIFY:'age_verify', CHECKOUT:'checkout', TRACKING:'tracking', PARTY_NIGHT:'party_night', PARTY_DAY:'party_day', ARRIVAL:'arrival', ORDER_HISTORY:'order_history', SAVED_ADDRESSES:'saved_addresses', EDIT_PROFILE:'edit_profile', WISHLIST:'wishlist', LOYALTY:'loyalty', REFERRAL:'referral', NOTIFICATIONS:'notifications', CONFIRMATION:'confirmation', CONCIERGE:'concierge', ONBOARDING:'onboarding', NOTIFICATIONS_CENTRE:'notif_centre' }

// ── Ocean / Ibiza colour scheme (from earlier builds) ─────────
const C = {
  bg:        'linear-gradient(170deg,#0A2A38 0%,#0D3545 35%,#1A5060 70%,#2B7A8B 100%)',
  header:    'linear-gradient(135deg,#0D3B4A 0%,#1A5263 100%)',
  card:      'rgba(255,255,255,0.92)',
  cardBorder:'rgba(255,255,255,0.5)',
  text:      '#2A2318',
  textMuted: 'rgba(42,35,24,0.55)',
  tabBg:     'rgba(10,30,40,0.97)',
  accent:    '#C4683A',
  section:   'rgba(255,255,255,0.04)',
}

// ── Fullscreen Splash — NO tab bar whatsoever ─────────────────
function SplashScreen({ onEnter }) {
  const [vis, setVis] = useState(false)
  useEffect(() => { setTimeout(() => setVis(true), 80) }, [])
  return (
    <div style={{ position:'fixed', inset:0, overflow:'hidden' }}>
      <img src="/splash.jpg" alt="Isla Drop" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', objectPosition:'center top' }} />
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom,rgba(0,0,0,0.05) 0%,rgba(0,0,0,0.05) 40%,rgba(0,0,0,0.6) 68%,rgba(0,0,0,0.88) 100%)' }} />
      <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'0 28px 64px', opacity:vis?1:0, transform:vis?'translateY(0)':'translateY(20px)', transition:'all 0.9s cubic-bezier(0.34,1.1,0.64,1)' }}>
        <div style={{ fontFamily:'DM Serif Display,serif', fontSize:58, color:'white', lineHeight:1, letterSpacing:'-1.5px', marginBottom:6, textShadow:'0 3px 20px rgba(0,0,0,0.4)' }}>Isla Drop</div>
        <div style={{ fontSize:12, color:'rgba(255,255,255,0.68)', letterSpacing:'3.5px', textTransform:'uppercase', marginBottom:5 }}>24/7 Delivery · Ibiza</div>
        <div style={{ fontSize:14, color:'rgba(255,255,255,0.45)', marginBottom:40 }}>Drinks · Snacks · Tobacco</div>
        <button onClick={onEnter} style={{ width:'100%', padding:'18px', background:'#C4683A', color:'white', border:'none', borderRadius:16, fontFamily:'DM Sans,sans-serif', fontSize:17, fontWeight:500, cursor:'pointer', boxShadow:'0 8px 32px rgba(196,104,58,0.55)', marginBottom:14 }}>Order Now</button>
        <div style={{ textAlign:'center', fontSize:12, color:'rgba(255,255,255,0.3)' }}>Anytime. Anywhere. Ibiza.</div>
      </div>
    </div>
  )
}

// ── Language Picker ───────────────────────────────────────────
function LanguagePicker({ lang, setLang }) {
  const [open, setOpen] = useState(false)
  const cur = LANGUAGES.find(l=>l.code===lang)||LANGUAGES[0]
  return (
    <div style={{ position:'relative' }}>
      <button onClick={()=>setOpen(o=>!o)} style={{ background:'rgba(255,255,255,0.14)', border:'0.5px solid rgba(255,255,255,0.22)', borderRadius:20, padding:'5px 11px', color:'white', fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', gap:5, fontFamily:'DM Sans,sans-serif' }}>
        <span style={{ fontSize:14 }}>{cur.flag}</span>{cur.code.toUpperCase()}
      </button>
      {open && (
        <div style={{ position:'absolute', top:34, right:0, background:'white', borderRadius:12, boxShadow:'0 8px 32px rgba(0,0,0,0.18)', overflow:'hidden', zIndex:400, minWidth:148 }}>
          {LANGUAGES.map(l=>(
            <button key={l.code} onClick={()=>{setLang(l.code);setOpen(false)}} style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'10px 14px', border:'none', background:l.code===lang?'#F5F0E8':'white', cursor:'pointer', fontFamily:'DM Sans,sans-serif', fontSize:13, color:'#2A2318' }}>
              <span style={{ fontSize:16 }}>{l.flag}</span>{l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Tab Bar — rendered ONLY on the home screen ────────────────
function TabBar({ view, setView, cartCount }) {
  const tabs = [
    { id:VIEWS.HOME,      label:'Home',       path:'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
    { id:VIEWS.CATEGORY,  label:'Categories', path:'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z' },
    { id:VIEWS.SEARCH,    label:'Search',     search:true },
    { id:VIEWS.BASKET,    label:'Basket',     path:'M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z', badge:cartCount },
    { id:VIEWS.CONCIERGE, label:'Concierge',  concierge:true },
    { id:VIEWS.ACCOUNT,   label:'Account',    path:'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z' },
  ]
  return (
    <div style={{ position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:480, display:'flex', background:C.tabBg, backdropFilter:'blur(14px)', borderTop:'0.5px solid rgba(43,122,139,0.2)', zIndex:100, paddingBottom:'env(safe-area-inset-bottom,0px)' }}>
      {tabs.map(t => {
        const on = view === t.id
        return (
          <button key={t.id} onClick={()=>setView(t.id)}
            style={{ flex:1, padding:'11px 4px 9px', border:'none', background:'none', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:3, fontFamily:'DM Sans,sans-serif', fontSize:10, color:on?'#7EE8C8':'rgba(150,220,200,0.35)', fontWeight:on?500:400, position:'relative', transition:'color 0.15s' }}>
            <div style={{ position:'relative' }}>
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={on?2:1.7}>
                {t.search ? <><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></> : t.concierge ? <><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></> : <path d={t.path}/>}
              </svg>
              {t.badge>0 && <span style={{ position:'absolute',top:-5,right:-7,background:'#C4683A',color:'white',borderRadius:'50%',width:16,height:16,fontSize:9,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:600,border:'1.5px solid rgba(10,30,40,0.97)' }}>{t.badge>9?'9+':t.badge}</span>}
            </div>
            {t.label}
          </button>
        )
      })}
    </div>
  )
}

// ── Mini product card ─────────────────────────────────────────
function MiniCard({ product, t, onDetail }) {
  const qty = useCartStore(s=>s.items.find(i=>i.product.id===product.id)?.quantity??0)
  const { addItem, updateQuantity } = useCartStore()
  const handleAdd = (e) => {
    e.stopPropagation()
    addItem(product)
    navigator.vibrate && navigator.vibrate(25)
    toast.success(product.emoji+' Added!',{duration:800})
  }
  return (
    <div
      onClick={()=>onDetail&&onDetail(product)}
      onTouchStart={e=>{e.currentTarget.style.transform='scale(0.96)'}}
      onTouchEnd={e=>{e.currentTarget.style.transform='scale(1)'}}
      style={{ background:C.card, border:'0.5px solid '+C.cardBorder, borderRadius:14, overflow:'hidden', minWidth:134, maxWidth:134, flexShrink:0, position:'relative', cursor:'pointer', transition:'transform 0.1s' }}>
      <div style={{ position:'relative' }}>
        <ProductImage productId={product.id} emoji={product.emoji} category={product.category} alt={product.name} size="mini" style={{ height:100 }} />
        {product.popular && qty===0 && <div style={{ position:'absolute',top:5,left:5,background:'rgba(0,0,0,0.55)',borderRadius:8,padding:'2px 6px',fontSize:9,color:'rgba(255,255,255,0.9)',fontWeight:600 }}>🔥</div>}
        {qty===0
          ? <button onClick={handleAdd} style={{ position:'absolute',top:7,right:7,width:28,height:28,background:'#C4683A',border:'2px solid white',borderRadius:'50%',color:'white',fontSize:18,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',boxShadow:'0 2px 8px rgba(0,0,0,0.18)',lineHeight:1 }}>+</button>
          : <div style={{ position:'absolute',top:6,right:6,display:'flex',alignItems:'center',gap:3,background:'rgba(255,255,255,0.96)',borderRadius:20,padding:'2px 7px',boxShadow:'0 1px 5px rgba(0,0,0,0.12)' }}>
              <button onClick={e=>{e.stopPropagation();updateQuantity(product.id,qty-1)}} style={{ width:18,height:18,background:'#E8E0D0',border:'none',borderRadius:'50%',cursor:'pointer',fontSize:12,display:'flex',alignItems:'center',justifyContent:'center',color:'#2A2318' }}>−</button>
              <span style={{ fontSize:11,fontWeight:500,minWidth:12,textAlign:'center',color:'#2A2318' }}>{qty}</span>
              <button onClick={e=>{e.stopPropagation();updateQuantity(product.id,qty+1);navigator.vibrate&&navigator.vibrate(15)}} style={{ width:18,height:18,background:'#C4683A',border:'none',borderRadius:'50%',cursor:'pointer',fontSize:12,color:'white',display:'flex',alignItems:'center',justifyContent:'center' }}>+</button>
            </div>
        }
      </div>
      <div style={{ padding:'8px 10px 10px' }}>
        <div style={{ fontSize:11, fontWeight:500, color:C.text, lineHeight:1.3, height:28, overflow:'hidden', marginBottom:3 }}>{product.name}</div>
        <div style={{ fontSize:13, fontWeight:500, color:'#C4683A' }}>€{product.price.toFixed(2)}</div>
      </div>
    </div>
  )
}

// ── Basket ────────────────────────────────────────────────────
function PromoCodeEntry({ onApply }) {
  const [code, setCode] = useState('')
  const [applied, setApplied] = useState(false)
  const apply = () => {
    if (!code.trim()) return
    setApplied(true)
    toast.success('Promo code applied!')
    onApply(code)
  }
  if (applied) return (
    <div style={{ display:'flex',alignItems:'center',gap:8,padding:'10px 14px',background:'rgba(29,158,117,0.15)',border:'0.5px solid rgba(29,158,117,0.3)',borderRadius:10,marginBottom:10 }}>
      <span style={{ fontSize:16 }}>✅</span>
      <span style={{ fontSize:13,color:'#7EE8A2',flex:1 }}>Promo code <strong>{code}</strong> applied</span>
      <button onClick={()=>{setApplied(false);setCode('')}} style={{ background:'none',border:'none',color:'rgba(255,255,255,0.4)',cursor:'pointer',fontSize:13 }}>✕</button>
    </div>
  )
  return (
    <div style={{ display:'flex',gap:8,marginBottom:10 }}>
      <input value={code} onChange={e=>setCode(e.target.value.toUpperCase())} placeholder="Promo code"
        style={{ flex:1,padding:'11px 14px',background:'rgba(255,255,255,0.08)',border:'0.5px solid rgba(255,255,255,0.15)',borderRadius:10,color:'white',fontSize:13,fontFamily:'DM Sans,sans-serif',outline:'none',letterSpacing:1 }} />
      <button onClick={apply} disabled={!code.trim()}
        style={{ padding:'11px 16px',background:code.trim()?'rgba(196,104,58,0.3)':'rgba(255,255,255,0.06)',border:'0.5px solid rgba(196,104,58,0.3)',borderRadius:10,color:code.trim()?'#E8A070':'rgba(255,255,255,0.3)',fontSize:13,cursor:code.trim()?'pointer':'default',fontFamily:'DM Sans,sans-serif',fontWeight:600 }}>
        Apply
      </button>
    </div>
  )
}

function BasketView({ t, onCheckout }) {
  const cart = useCartStore()
  const { updateQuantity, addItem } = useCartStore()
  const [notes, setNotes] = useState(cart.deliveryNotes||'')
  const MIN = 15
  const sub = cart.getSubtotal()
  const belowMin = sub < MIN
  const progress = Math.min(100,(sub/MIN)*100)
  const saveNotes = val => { setNotes(val); if(cart.setDeliveryNotes) cart.setDeliveryNotes(val) }
  if (cart.getItemCount()===0) return (
    <div style={{ padding:24 }}>
      <div style={{ textAlign:'center',padding:'32px 0 24px' }}>
        <div style={{ fontSize:52,marginBottom:14 }}>🛒</div>
        <div style={{ fontFamily:'DM Serif Display,serif',fontSize:22,color:'rgba(255,255,255,0.85)',marginBottom:6 }}>Your basket is empty</div>
        <div style={{ fontSize:14,color:'rgba(255,255,255,0.45)',marginBottom:24 }}>Add something to get started</div>
      </div>
      <div style={{ fontSize:13,fontWeight:600,color:'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:12 }}>Popular right now</div>
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
        {BEST_SELLERS.slice(0,4).map(p=>(
          <div key={p.id} style={{ background:'rgba(255,255,255,0.07)',border:'0.5px solid rgba(255,255,255,0.1)',borderRadius:14,overflow:'hidden' }}>
            <div style={{ position:'relative' }}>
              <ProductImage productId={p.id} emoji={p.emoji} category={p.category} alt={p.name} size="card" style={{ height:90 }} />
              <button onClick={()=>{cart.addItem(p);toast.success(p.emoji+' Added!',{duration:800})}}
                style={{ position:'absolute',top:7,right:7,width:28,height:28,background:'#C4683A',border:'2px solid white',borderRadius:'50%',color:'white',fontSize:17,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer' }}>+</button>
            </div>
            <div style={{ padding:'8px 10px' }}>
              <div style={{ fontSize:11,color:'white',marginBottom:3 }}>{p.name}</div>
              <div style={{ fontSize:12,fontWeight:600,color:'#E8A070' }}>€{p.price.toFixed(2)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
  return (
    <div style={{ padding:'16px 16px 20px' }}>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16 }}>
        <div style={{ fontFamily:'DM Serif Display,serif',fontSize:26,color:'white' }}>{t.viewCart}</div>
        <div style={{ fontSize:12,color:'rgba(255,255,255,0.45)',background:'rgba(255,255,255,0.08)',padding:'4px 10px',borderRadius:20 }}>{cart.getItemCount()} item{cart.getItemCount()!==1?'s':''}</div>
      </div>
      {cart.items.map(({product,quantity})=>(
        <div key={product.id} style={{ display:'flex',gap:12,alignItems:'center',padding:'12px 0',borderBottom:'0.5px solid rgba(255,255,255,0.08)' }}>
          <div style={{ width:52,height:52,borderRadius:10,overflow:'hidden',flexShrink:0 }}>
            <ProductImage productId={product.id} emoji={product.emoji} category={product.category} alt={product.name} size="list" style={{ height:52,width:52 }} />
          </div>
          <div style={{ flex:1,minWidth:0 }}>
            <div style={{ fontSize:13,fontWeight:500,color:'white',lineHeight:1.3,marginBottom:3 }}>{product.name}</div>
            <div style={{ fontSize:13,color:'#E8A070',fontWeight:500 }}>€{(product.price*quantity).toFixed(2)}</div>
          </div>
          <div style={{ display:'flex',alignItems:'center',gap:8 }}>
            <button onClick={()=>updateQuantity(product.id,quantity-1)} style={{ width:26,height:26,background:'rgba(255,255,255,0.1)',border:'none',borderRadius:'50%',cursor:'pointer',fontSize:14,color:'white',display:'flex',alignItems:'center',justifyContent:'center' }}>−</button>
            <span style={{ fontSize:13,fontWeight:500,color:'white',minWidth:16,textAlign:'center' }}>{quantity}</span>
            <button onClick={()=>updateQuantity(product.id,quantity+1)} style={{ width:26,height:26,background:'rgba(255,255,255,0.12)',border:'none',borderRadius:'50%',cursor:'pointer',fontSize:14,color:'white',display:'flex',alignItems:'center',justifyContent:'center' }}>+</button>
          </div>
        </div>
      ))}
      <div style={{ marginTop:16,marginBottom:12 }}>
        <div style={{ fontSize:11,color:'rgba(255,255,255,0.5)',marginBottom:8,textTransform:'uppercase',letterSpacing:'0.5px',fontFamily:'DM Sans,sans-serif' }}>Delivery instructions</div>
        <textarea value={notes} onChange={e=>saveNotes(e.target.value)} rows={2}
          placeholder="Gate code, leave at door, ring bell twice..."
          style={{ width:'100%',padding:'11px 14px',background:'rgba(255,255,255,0.07)',border:'0.5px solid rgba(255,255,255,0.15)',borderRadius:10,color:'white',fontSize:13,fontFamily:'DM Sans,sans-serif',resize:'none',outline:'none',boxSizing:'border-box',lineHeight:1.5 }}/>
      </div>
      {/* Feature 10: Free delivery threshold */}
      <FreeDeliveryBar subtotal={cart.getSubtotal()} />
      {/* Feature 11: Earn stamps line */}
      <EarnStampsLine />
      <div style={{ marginTop:4,padding:'14px 0',borderTop:'0.5px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display:'flex',justifyContent:'space-between',fontSize:13,color:'rgba(255,255,255,0.5)',marginBottom:5 }}><span>Subtotal</span><span>€{cart.getSubtotal().toFixed(2)}</span></div>
        <div style={{ display:'flex',justifyContent:'space-between',fontSize:13,color:'rgba(255,255,255,0.5)',marginBottom:5 }}><span>{t.delivery}</span><span>€3.50</span></div>
        {/* Feature 4: Tip in total */}
        <BasketTipLine tip={driverTipAmount||0} />
        <div style={{ display:'flex',justifyContent:'space-between',fontSize:16,fontWeight:500,color:'white' }}><span>{t.total}</span><span style={{ color:'#E8A070' }}>€{(cart.getTotal()+(driverTipAmount||0)).toFixed(2)}</span></div>
      </div>
      {cart.getHasAgeRestricted() && (
        <div style={{ background:'rgba(196,104,58,0.18)',border:'0.5px solid rgba(196,104,58,0.35)',borderRadius:10,padding:'9px 12px',display:'flex',gap:8,fontSize:11,color:'#E8C090',marginBottom:12 }}>
          <span>🆔</span><span>ID required at delivery for age-restricted items</span>
        </div>
      )}
      {/* Feature 6: Upsell suggestions */}
      <BasketUpsell cartItems={cart.items} />
      {/* Feature 7: Loyalty redemption */}
      <LoyaltyRedemptionRow redeemed={loyaltyRedeemed} onRedeem={()=>setLoyaltyRedeemed(true)} onRemove={()=>setLoyaltyRedeemed(false)} />
      <PromoCodeEntry onApply={()=>{}} />
      {/* Feature 7: Show warning if no address set */}
      {!cart.deliveryAddress && <NoAddressWarning onSetAddress={()=>toast('Set your address in checkout',{icon:'📍'})} />}
      <button onClick={onCheckout} disabled={belowMin}
        style={{ width:'100%',padding:'16px',background:belowMin?'rgba(255,255,255,0.1)':'#C4683A',color:belowMin?'rgba(255,255,255,0.3)':'white',border:'none',borderRadius:14,fontFamily:'DM Sans,sans-serif',fontSize:15,fontWeight:500,cursor:belowMin?'not-allowed':'pointer',boxShadow:belowMin?'none':'0 4px 20px rgba(196,104,58,0.4)',marginBottom:10 }}>
        {belowMin?'Add €'+(MIN-sub).toFixed(2)+' to unlock checkout':(t.checkout||'Order now')+' →'}
      </button>
      <button onClick={()=>{ if(window.confirm('Clear your basket?')) cart.clearCart() }}
        style={{ width:'100%',padding:'12px',background:'transparent',border:'0.5px solid rgba(255,255,255,0.15)',borderRadius:12,fontFamily:'DM Sans,sans-serif',fontSize:13,color:'rgba(255,255,255,0.4)',cursor:'pointer' }}>
        🗑 Clear basket
      </button>
    </div>
  )
}

// ── Account ───────────────────────────────────────────────────
function AccountView({ t, onShowHistory, onShowAddresses, onShowEditProfile, onShowLoyalty, onShowReferral, onShowWishlist, onShowNotifications, dark, onToggleDark, onDeleteAccount, onChangeEmail, onChangePassword }) {
  const { user, profile, clear } = useAuthStore()
  const { clearCart } = useCartStore()
  return (
    <div style={{ padding:'20px 16px' }}>
      <div style={{ fontFamily:'DM Serif Display,serif',fontSize:26,color:'white',marginBottom:20 }}>Account</div>
      {user ? (
        <>
          <div style={{ background:'rgba(255,255,255,0.07)',borderRadius:14,padding:16,marginBottom:12 }}>
            <div style={{ width:52,height:52,borderRadius:'50%',background:'linear-gradient(135deg,#C4683A,#E8854A)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,marginBottom:10 }}>
              {(profile?.full_name||'U').charAt(0).toUpperCase()}
            </div>
            <div style={{ fontSize:16,fontWeight:500,color:'white' }}>{profile?.full_name||'Guest'}</div>
            <div style={{ fontSize:13,color:'rgba(255,255,255,0.45)',marginTop:2 }}>{user.email}</div>
          </div>
          {[
            { icon:'📦', label:'Order history',    sub:'View and re-order past orders', action:onShowHistory },
            { icon:'📍', label:'Saved addresses',  sub:'Manage your delivery spots',    action:onShowAddresses },
            { icon:'✏️', label:'Edit profile',     sub:'Name and phone number',         action:onShowEditProfile },
            { icon:'🌴', label:'Loyalty rewards',  sub:'Stamps, points and perks',      action:onShowLoyalty },
            { icon:'🔗', label:'Refer a friend',   sub:'Share code, earn €10',          action:onShowReferral },
            { icon:'❤️', label:'Favourites',       sub:'Your saved products',            action:onShowWishlist },
            { icon:'🔔', label:'Notifications',    sub:'Push, email and SMS settings',  action:onShowNotifications },
            { icon:'💬', label:'WhatsApp support', sub:'+34 971 000 000', action:()=>window.open('https://wa.me/34971000000','_blank') },
            { icon:'🌍', label:'Language',         sub:'Change display language',        action:()=>toast('Use the flag in the top-right of the home screen') },
            { icon:'❓', label:'Help & FAQ',       sub:'Delivery, payments and more',   action:()=>toast('Support: support@isladrop.net') },
            { icon:'🔑', label:'Change email',     sub:'Update your email address',      action:onChangeEmail },
            { icon:'🔒', label:'Change password',  sub:'Update your password',           action:onChangePassword },
            { icon:'🗑️', label:'Delete account',  sub:'Permanently remove your data',   action:onDeleteAccount },
          ].map(item=>(
            <button key={item.label} onClick={item.action}
              style={{ display:'flex',alignItems:'center',gap:12,width:'100%',padding:'14px 16px',background:'rgba(255,255,255,0.06)',border:'none',borderRadius:12,marginBottom:8,cursor:'pointer',textAlign:'left' }}>
              <span style={{ fontSize:18 }}>{item.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14,color:'rgba(255,255,255,0.82)',fontFamily:'DM Sans,sans-serif',fontWeight:500 }}>{item.label}</div>
                {item.sub && <div style={{ fontSize:11,color:'rgba(255,255,255,0.4)',marginTop:2 }}>{item.sub}</div>}
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          ))}
          {/* Sign out inside account settings */}
          <DarkModeToggle dark={dark} onToggle={onToggleDark} />
          <button onClick={()=>{ supabase.auth.signOut(); clear(); clearCart&&clearCart() }}
            style={{ width:'100%',marginTop:16,padding:'13px',background:'rgba(196,104,58,0.12)',border:'0.5px solid rgba(196,104,58,0.3)',borderRadius:12,fontFamily:'DM Sans,sans-serif',fontSize:14,color:'#E8A070',cursor:'pointer' }}>
            Sign out
          </button>
        </>
      ) : (
        <div style={{ textAlign:'center',padding:'40px 0' }}>
          <div style={{ fontSize:48,marginBottom:14 }}>👤</div>
          <div style={{ fontFamily:'DM Serif Display,serif',fontSize:22,color:'white',marginBottom:8 }}>Sign in to your account</div>
          <div style={{ fontSize:14,color:'rgba(255,255,255,0.45)',marginBottom:24 }}>Track orders, save addresses, and more</div>
          <button onClick={()=>toast('Use the sign in option')} style={{ padding:'13px 32px',background:'#C4683A',color:'white',border:'none',borderRadius:12,fontFamily:'DM Sans,sans-serif',fontSize:14,cursor:'pointer' }}>Sign in</button>
        </div>
      )}
    </div>
  )
}

// ── Categories grid ───────────────────────────────────────────
function CategoriesView({ onSelect }) {
  return (
    <div style={{ padding:'16px 16px 0' }}>
      <div style={{ fontFamily:'DM Serif Display,serif',fontSize:26,color:'white',marginBottom:16 }}>Categories</div>
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
        {CATEGORIES.map(cat=>(
          <button key={cat.key} onClick={()=>onSelect(cat.key)}
            style={{ background:'rgba(255,255,255,0.08)',border:'0.5px solid rgba(255,255,255,0.12)',borderRadius:14,padding:'18px 14px',cursor:'pointer',display:'flex',alignItems:'center',gap:10,textAlign:'left' }}>
            <span style={{ fontSize:26 }}>{cat.emoji}</span>
            <span style={{ fontFamily:'DM Sans,sans-serif',fontSize:14,fontWeight:500,color:'white' }}>{cat.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── AI intent detector — is this a product search or a vibe request? ──
const AI_TRIGGERS = [
  'beach','pool','party','night','day','boat','villa','club','date','birthday',
  'hangover','cocktail','sundowner','romantic','celebrate','vip','premium',
  'lady','ladies','boys','gentleman','arrivals','arrival','landed','landing',
  'gift','surprise','snack board','charcuterie','picnic','brunch','breakfast',
  'wellness','recovery','morning','afternoon','evening','sunset','sunrise',
  '4th','friends','family','wedding','anniversary','engagement','hen','stag',
  'plan','help','suggest','recommend','what','need','should','give me','build',
]
function looksLikeAIQuery(q) {
  const lower = q.toLowerCase().trim()
  if (lower.length < 3) return false
  // If it matches a product name closely, treat as product search
  const productHit = PRODUCTS.some(p => p.name.toLowerCase().includes(lower) && lower.length > 3)
  if (productHit) return false
  return AI_TRIGGERS.some(kw => lower.includes(kw))
}

// ── Search view ───────────────────────────────────────────────
function SearchView({ t, onAssist }) {
  const [query, setQuery] = useState('')
  const [historyVer, setHistoryVer] = useState(0)
  const { addItem } = useCartStore()
  const { prefs: dietPrefs, toggle: toggleDiet } = useDietaryPrefs()

  // Fuzzy + partial match
  const results = query.length>1 ? PRODUCTS.filter(p=>{
    const n=p.name.toLowerCase(); const q=query.toLowerCase()
    if(n.includes(q)) return true
    let qi=0; for(let i=0;i<n.length&&qi<q.length;i++){if(n[i]===q[qi])qi++}
    return qi===q.length
  }).slice(0,40) : []

  const isAI = query.length>2 && looksLikeAIQuery(query)

  const handleIsla = () => {
    onAssist(query)
  }

  return (
    <div style={{ padding:'16px 16px 0' }}>
      <div style={{ display:'flex',gap:8,marginBottom:14 }}>
        <div style={{ flex:1,display:'flex',alignItems:'center',background:'rgba(255,255,255,0.1)',borderRadius:12,padding:'10px 14px',gap:8,border:'0.5px solid rgba(255,255,255,0.1)' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input autoFocus value={query} onChange={e=>setQuery(e.target.value)}
            onKeyDown={e=>{ if(e.key==='Enter'&&isAI) handleIsla() }}
            placeholder="Search products or ask Isla anything..." style={{ flex:1,border:'none',background:'none',fontFamily:'DM Sans,sans-serif',fontSize:14,color:'white',outline:'none' }}/>
          {query&&<button onClick={()=>setQuery('')} style={{ border:'none',background:'none',cursor:'pointer',color:'rgba(255,255,255,0.4)',fontSize:15,padding:0 }}>✕</button>}
        </div>
      </div>

      {/* Isla AI prompt — shown when query looks like a vibe not a product */}
      {/* Feature 8: Dietary filter bar */}
      <div style={{ padding:'8px 16px 0' }}>
        <DietaryFilterBar prefs={dietPrefs} onToggle={toggleDiet} />
      </div>
      {/* Feature 4: Search history when empty */}
      {!query && <SearchHistoryPanel onSelect={q=>{setQuery(q)}} onClear={()=>setHistoryVer(v=>v+1)} />}
      {/* Feature 4: Live suggestions as you type */}
      {query.length>=2 && !isAI && <SearchSuggestions query={query} />}

      {isAI && (
        <button onClick={handleIsla}
          style={{ width:'100%',marginBottom:14,padding:'14px 16px',background:'linear-gradient(135deg,rgba(196,104,58,0.25),rgba(43,122,139,0.25))',border:'0.5px solid rgba(196,104,58,0.4)',borderRadius:14,cursor:'pointer',display:'flex',alignItems:'center',gap:12,textAlign:'left' }}>
          <div style={{ width:36,height:36,borderRadius:'50%',background:'linear-gradient(135deg,#C4683A,#E8854A)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13,fontWeight:600,color:'white',marginBottom:2 }}>Ask Isla AI about "{query}"</div>
            <div style={{ fontSize:11,color:'rgba(255,255,255,0.5)' }}>Isla will curate the perfect selection for you →</div>
          </div>
        </button>
      )}

      {/* Product results */}
      {query.length>1 && results.length>0 && (
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
          {results.map(p=>(
            <div key={p.id} style={{ background:'rgba(255,255,255,0.08)',border:'0.5px solid rgba(255,255,255,0.1)',borderRadius:14,overflow:'hidden',position:'relative' }}>
              <div style={{ position:'relative' }}>
                <ProductImage productId={p.id} emoji={p.emoji} category={p.category} alt={p.name} size="card" style={{ height:110 }} />
                <button onClick={()=>{addItem(p);navigator.vibrate&&navigator.vibrate(25);toast.success(p.emoji+' Added!',{duration:900})}} style={{ position:'absolute',top:7,right:7,width:28,height:28,background:'#C4683A',border:'2px solid white',borderRadius:'50%',color:'white',fontSize:17,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',lineHeight:1 }}>+</button>
              </div>
              <div style={{ padding:'9px 10px 11px' }}>
                <div style={{ fontSize:11,fontWeight:500,color:'white',lineHeight:1.3,marginBottom:4 }}>{p.name}</div>
                <div style={{ fontSize:13,fontWeight:500,color:'#E8A070' }}>€{p.price.toFixed(2)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      {query.length===0 && (
        <div style={{ textAlign:'center',padding:'32px 0 20px',color:'rgba(255,255,255,0.35)',fontSize:14 }}>
          <div style={{ fontSize:36,marginBottom:10 }}>🔍</div>
          <div style={{ marginBottom:20 }}>Search 150+ products or ask Isla anything</div>
          <div style={{ display:'flex',flexWrap:'wrap',gap:8,justifyContent:'center' }}>
            {['Beach day','Hangover cure','Date night','Sundowner','Boat trip','Birthday'].map(s=>(
              <button key={s} onClick={()=>setQuery(s)}
                style={{ padding:'7px 14px',background:'rgba(255,255,255,0.07)',border:'0.5px solid rgba(255,255,255,0.15)',borderRadius:20,color:'rgba(255,255,255,0.7)',fontSize:12,cursor:'pointer',fontFamily:'DM Sans,sans-serif' }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
      {query.length>1&&results.length===0&&!isAI&&<div style={{ textAlign:'center',padding:'30px',color:'rgba(255,255,255,0.4)',fontSize:14 }}>No results for "{query}"</div>}
    </div>
  )
}

// ── Home view ─────────────────────────────────────────────────
function HomeView({ t, lang, setLang, onCategorySelect, estimatedMins, onAssist, onBest, onNewIn, onPartyNight, onPartyDay, onArrival, onDetail, onReorder, onShowClub, onShowBoat, onShowPreArrival, onShowPoolParty, showMorningKit, dismissMorningKit, loyaltyStamps, unread, onShowNotifs }) {
  const [searchQuery, setSearchQuery] = useState('')
  const cart = useCartStore()
  const { addItem } = useCartStore()
  const prevItems = cart.previousItems || []
  const flashSale = useFlashSale()
  const { pulling, refreshing, onTouchStart, onTouchMove, onTouchEnd } = usePullToRefresh(async () => {
    await new Promise(r => setTimeout(r, 800))
  })
  const countdown = useCountdown(flashSale?.ends_at)
  const { greeting, vibe } = useTimeGreeting()
  const weather = useWeatherSuggestion()
  const searchResults = searchQuery.length>1 ? PRODUCTS.filter(p=>p.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0,30) : []

  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <PullToRefreshIndicator pulling={pulling} refreshing={refreshing} />
      <ScrollToTop />
      {/* Header */}
      <div style={{ background:C.header }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'16px 16px 0' }}>
          <div>
            <div style={{ fontFamily:'DM Serif Display,serif',fontSize:28,color:'white',letterSpacing:'-0.5px',lineHeight:1 }}>Isla Drop</div>
            <div style={{ fontSize:10,color:'rgba(255,255,255,0.45)',marginTop:3,letterSpacing:'1.5px',textTransform:'uppercase' }}>{t.tagline}</div>
          </div>
          <div style={{ display:'flex',gap:7,alignItems:'center' }}>
            {loyaltyStamps > 0 && <LoyaltyHeaderBadge stamps={loyaltyStamps} onClick={()=>setView(VIEWS.LOYALTY)} />}
            <NotificationBell unread={unread} onClick={()=>setShowNotifCentre(true)} />
            <div style={{ background:'rgba(255,255,255,0.12)',border:'0.5px solid rgba(255,255,255,0.18)',borderRadius:20,fontSize:11,padding:'4px 10px',display:'flex',alignItems:'center',gap:5,color:'white' }}>
              <span style={{ width:5,height:5,borderRadius:'50%',background:'#7EE8A2',display:'inline-block',animation:'pulse 1.5s infinite' }}/>Open 24/7
            </div>
            <LanguagePicker lang={lang} setLang={setLang} />
          </div>
        </div>
        <AddressBar estimatedMins={estimatedMins} />
        {/* Feature 12: Time greeting */}
        <TimeGreetingBanner greeting={greeting} vibe={vibe} />
        {weather && <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', padding:'2px 16px 8px' }}>{weather.text}</div>}
      </div>

      {/* Search + AssistBot — sticky */}
      <div style={{ padding:'10px 16px',background:'rgba(13,59,74,0.98)',position:'sticky',top:0,zIndex:50,borderBottom:'0.5px solid rgba(43,122,139,0.25)',backdropFilter:'blur(10px)' }}>
        <div style={{ display:'flex',gap:8 }}>
          <div style={{ flex:1,display:'flex',alignItems:'center',background:'rgba(255,255,255,0.09)',borderRadius:12,padding:'10px 14px',gap:8,border:'0.5px solid rgba(255,255,255,0.1)' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}
              onKeyDown={e=>{ if(e.key==='Enter'&&looksLikeAIQuery(searchQuery)) onAssist() }}
              placeholder={t.searchPlaceholder} style={{ flex:1,border:'none',background:'none',fontFamily:'DM Sans,sans-serif',fontSize:14,color:'white',outline:'none' }}/>
            {searchQuery&&<button onClick={()=>setSearchQuery('')} style={{ border:'none',background:'none',cursor:'pointer',color:'rgba(255,255,255,0.4)',fontSize:15,padding:0 }}>✕</button>}
          </div>
          <button
            onClick={() => onAssist()}
            title="Ask Isla AI"
            style={{ width:44, height:44, background:'rgba(255,255,255,0.09)', border:'0.5px solid rgba(255,255,255,0.14)', borderRadius:12, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#E8A070" stroke="#E8A070" strokeWidth="1">
              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
            </svg>
          </button>
        </div>
      </div>
      {/* Feature 2: Category quick-scroll nav */}
      <CategoryNavBar onCategorySelect={onCategorySelect} />

      {/* Search results */}
      {searchQuery.length>1 && (
        <div style={{ padding:'12px 16px' }}>
          {looksLikeAIQuery(searchQuery) && (
            <button onClick={()=>onAssist()}
              style={{ width:'100%',marginBottom:12,padding:'12px 14px',background:'linear-gradient(135deg,rgba(196,104,58,0.2),rgba(43,122,139,0.2))',border:'0.5px solid rgba(196,104,58,0.35)',borderRadius:12,cursor:'pointer',display:'flex',alignItems:'center',gap:10,textAlign:'left' }}>
              <div style={{ width:30,height:30,borderRadius:'50%',background:'linear-gradient(135deg,#C4683A,#E8854A)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="white"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
              </div>
              <div>
                <div style={{ fontSize:12,fontWeight:600,color:'white' }}>Ask Isla about "{searchQuery}"</div>
                <div style={{ fontSize:10,color:'rgba(255,255,255,0.45)' }}>Get a curated selection →</div>
              </div>
            </button>
          )}
          <div style={{ fontSize:12,color:'rgba(255,255,255,0.45)',marginBottom:10 }}>{searchResults.length} results for "{searchQuery}"</div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
            {searchResults.map(p=>(
              <div key={p.id} style={{ background:'rgba(255,255,255,0.07)',border:'0.5px solid rgba(255,255,255,0.1)',borderRadius:14,overflow:'hidden',position:'relative' }}>
                <div style={{ position:'relative' }}>
                  <ProductImage productId={p.id} emoji={p.emoji} category={p.category} alt={p.name} size="card" style={{ height:110 }} />
                  <button onClick={()=>{addItem(p);toast.success(p.emoji+' Added!',{duration:900})}} style={{ position:'absolute',top:7,right:7,width:28,height:28,background:'#C4683A',border:'2px solid white',borderRadius:'50%',color:'white',fontSize:17,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',lineHeight:1 }}>+</button>
                </div>
                <div style={{ padding:'9px 10px 11px' }}>
                  <div style={{ fontSize:11,fontWeight:500,color:'white',lineHeight:1.3,marginBottom:4 }}>{p.name}</div>
                  <div style={{ fontSize:13,fontWeight:500,color:'#E8A070' }}>€{p.price.toFixed(2)}</div>
                </div>
              </div>
            ))}
            {searchResults.length===0&&<div style={{ gridColumn:'span 2',textAlign:'center',padding:'20px',color:'rgba(255,255,255,0.35)',fontSize:13 }}>No results — try different words</div>}
          </div>
        </div>
      )}

      {/* Scrolling content */}
      {!searchQuery && (
        <div style={{ paddingBottom:20 }}>
          {/* Feature 5: Last order shortcut */}
          <LastOrderShortcut onReorder={onReorder} />

          {/* Feature 13: Morning after kit */}
          {showMorningKit && <MorningAfterKitBanner onAddKit={()=>{}} onDismiss={dismissMorningKit} />}
          {/* Feature 9: Your usual order */}
          <YourUsualCard productIds={[]} onAddAll={()=>setView(VIEWS.BASKET)} />
          {/* POINT 7: Recently viewed */}
          <RecentlyViewedRow onDetail={p=>{trackView(p);setSelectedProduct&&setSelectedProduct(p)}} />

          {prevItems.length>0 && (
            <div style={{ paddingTop:20,marginBottom:22 }}>
              <div style={{ fontFamily:'DM Serif Display,serif',fontSize:20,padding:'0 16px',marginBottom:12,color:'white' }}>🔄 {t.orderAgain}</div>
              <div style={{ display:'flex',gap:10,overflowX:'auto',padding:'0 16px 4px',scrollbarWidth:'none' }}>{prevItems.slice(0,8).map(p=><MiniCard key={p.id} product={p} t={t} onDetail={onDetail}/>)}</div>
            </div>
          )}
          {/* Feature 14: Seasonal banner */}
          <SeasonalBanner />

          {flashSale && countdown && (
            <div style={{ margin:'16px 16px 4px',background:'linear-gradient(135deg,rgba(196,104,58,0.3),rgba(184,134,11,0.25))',border:'0.5px solid rgba(196,104,58,0.4)',borderRadius:16,padding:'14px 16px',display:'flex',alignItems:'center',gap:12 }}>
              <span style={{ fontSize:26,flexShrink:0 }}>⚡</span>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:'DM Serif Display,serif',fontSize:15,color:'white',marginBottom:2 }}>{flashSale.title||'Flash sale'}</div>
                <div style={{ fontSize:11,color:'rgba(255,255,255,0.6)' }}>{flashSale.description||'Limited time offer'}</div>
              </div>
              <div style={{ textAlign:'right',flexShrink:0 }}>
                <div style={{ fontSize:10,color:'rgba(255,255,255,0.5)',marginBottom:2 }}>Ends in</div>
                <div style={{ fontSize:14,fontWeight:700,color:'#C8A84B',fontFamily:'monospace' }}>{countdown}</div>
              </div>
            </div>
          )}

          <div style={{ paddingTop:prevItems.length?0:20,marginBottom:22 }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0 16px',marginBottom:12 }}>
              <button onClick={onBest} style={{ fontFamily:'DM Serif Display,serif',fontSize:20,color:'white',background:'none',border:'none',cursor:'pointer',padding:0,display:'flex',alignItems:'center',gap:6 }}>🔥 {t.bestSellers}</button>
              <button onClick={onBest} style={{ fontSize:11,color:'rgba(255,255,255,0.5)',background:'none',border:'none',cursor:'pointer',fontFamily:'DM Sans,sans-serif' }}>See all →</button>
            </div>
            <div style={{ display:'flex',gap:10,overflowX:'auto',padding:'0 16px 4px',scrollbarWidth:'none' }}>{BEST_SELLERS.map(p=><MiniCard key={p.id} product={p} t={t} onDetail={onDetail}/>)}</div>
          </div>
          <div style={{ marginBottom:22 }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0 16px',marginBottom:12 }}>
              <button onClick={onNewIn} style={{ fontFamily:'DM Serif Display,serif',fontSize:20,color:'white',background:'none',border:'none',cursor:'pointer',padding:0,display:'flex',alignItems:'center',gap:6 }}>✨ {t.newIn}</button>
              <button onClick={onNewIn} style={{ fontSize:11,color:'rgba(255,255,255,0.5)',background:'none',border:'none',cursor:'pointer',fontFamily:'DM Sans,sans-serif' }}>See all →</button>
            </div>
            <div style={{ display:'flex',gap:10,overflowX:'auto',padding:'0 16px 4px',scrollbarWidth:'none' }}>{NEW_IN.slice(0,10).map(p=><MiniCard key={p.id} product={p} t={t} onDetail={onDetail}/>)}</div>
          </div>
          {/* Feature 11: Staff picks */}
          <StaffPicksRow onDetail={onDetail} />

          {/* ── Bundle deals ─────────────────────── */}
          <div style={{ margin:'0 16px 22px' }}>
            <div style={{ fontFamily:'DM Serif Display,serif',fontSize:20,color:'white',marginBottom:12 }}>Bundle deals</div>
            <div style={{ display:'flex',gap:10,overflowX:'auto',scrollbarWidth:'none',paddingBottom:4 }}>
              {[
                { emoji:'🍸', name:'Cocktail Night',  desc:'Gin + Tonic + Ice + Lemon',  ids:['sp-012','sd-028','ic-002','fr-001'], save:'€4.50' },
                { emoji:'🥂', name:'Sundowner Set',   desc:'Rose + Champagne + Ice',      ids:['wn-021','ch-001','ic-001'],          save:'€5' },
                { emoji:'🍺', name:'Party Pack',      desc:'Beers + Spirits + Ice',       ids:['br-001','sp-004','ic-002'],          save:'€8' },
                { emoji:'🏖', name:'Beach Day',       desc:'Water + Snacks + Essentials', ids:['wt-001','sn-001','es-013'],          save:'€3' },
              ].map(bundle=>{
                const prods = bundle.ids.map(id=>PRODUCTS.find(p=>p.id===id)).filter(Boolean)
                const total = prods.reduce((s,p)=>s+(p.price||0),0)
                return (
                  <div key={bundle.name} style={{ background:'rgba(255,255,255,0.07)',border:'0.5px solid rgba(200,168,75,0.3)',borderRadius:16,padding:'14px 16px',minWidth:178,maxWidth:178,flexShrink:0 }}>
                    <div style={{ fontSize:28,marginBottom:6 }}>{bundle.emoji}</div>
                    <div style={{ fontSize:14,fontWeight:600,color:'white',marginBottom:2,fontFamily:'DM Sans,sans-serif' }}>{bundle.name}</div>
                    <div style={{ fontSize:11,color:'rgba(255,255,255,0.5)',marginBottom:8 }}>{bundle.desc}</div>
                    <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10 }}>
                      <span style={{ fontSize:16,fontWeight:700,color:'#E8A070' }}>€{total.toFixed(2)}</span>
                      <span style={{ fontSize:10,color:'#7EE8A2',background:'rgba(126,232,162,0.1)',border:'0.5px solid rgba(126,232,162,0.25)',borderRadius:99,padding:'2px 8px',fontWeight:600 }}>Save {bundle.save}</span>
                    </div>
                    <button onClick={()=>{ prods.forEach(p=>addItem(p)); navigator.vibrate&&navigator.vibrate([20,50,20]); toast.success(bundle.name+' added!',{duration:1500}) }}
                      style={{ width:'100%',padding:'8px',background:'#C4683A',border:'none',borderRadius:10,color:'white',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'DM Sans,sans-serif' }}>
                      Add bundle
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Design Your Experience ─────────────────────── */}
          <div style={{ margin:'4px 16px 22px' }}>
            <div style={{ fontFamily:'DM Serif Display,serif',fontSize:20,color:'white',marginBottom:12 }}>🎯 Design Your Experience</div>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
              <button onClick={onPartyNight}
                style={{ background:'linear-gradient(135deg,rgba(196,104,58,0.35),rgba(139,60,20,0.5))',border:'0.5px solid rgba(196,104,58,0.4)',borderRadius:16,padding:'18px 14px',cursor:'pointer',textAlign:'left' }}>
                <div style={{ fontSize:28,marginBottom:8 }}>🌙</div>
                <div style={{ fontFamily:'DM Serif Display,serif',fontSize:16,color:'white',marginBottom:4 }}>Design My Night</div>
                <div style={{ fontSize:11,color:'rgba(255,255,255,0.55)',lineHeight:1.4 }}>Club nights, villa parties, pre-drinks</div>
                <div style={{ marginTop:10,fontSize:11,color:'#E8A070',fontWeight:600 }}>AI-powered →</div>
              </button>
              <button onClick={onPartyDay}
                style={{ background:'linear-gradient(135deg,rgba(43,122,139,0.4),rgba(20,80,100,0.5))',border:'0.5px solid rgba(43,122,139,0.4)',borderRadius:16,padding:'18px 14px',cursor:'pointer',textAlign:'left' }}>
                <div style={{ fontSize:28,marginBottom:8 }}>☀️</div>
                <div style={{ fontFamily:'DM Serif Display,serif',fontSize:16,color:'white',marginBottom:4 }}>Design My Day</div>
                <div style={{ fontSize:11,color:'rgba(255,255,255,0.55)',lineHeight:1.4 }}>Pool parties, beach days, boat trips</div>
                <div style={{ marginTop:10,fontSize:11,color:'#7EE8C8',fontWeight:600 }}>AI-powered →</div>
              </button>
            </div>
          </div>

          {/* Features 15+16: Club + Boat delivery shortcuts */}
          <div style={{ margin:'0 16px 14px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <button onClick={onShowClub}
              style={{ padding:'14px', background:'linear-gradient(135deg,rgba(90,30,120,0.4),rgba(30,60,120,0.4))', border:'0.5px solid rgba(150,80,200,0.4)', borderRadius:14, cursor:'pointer', textAlign:'left' }}>
              <div style={{ fontSize:22, marginBottom:4 }}>🍒</div>
              <div style={{ fontFamily:'DM Serif Display,serif', fontSize:14, color:'white', marginBottom:2 }}>Club delivery</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.5)' }}>Pacha, Ushuaia, DC-10...</div>
            </button>
            <button onClick={onShowBoat}
              style={{ padding:'14px', background:'linear-gradient(135deg,rgba(20,80,140,0.5),rgba(10,50,100,0.5))', border:'0.5px solid rgba(43,122,200,0.4)', borderRadius:14, cursor:'pointer', textAlign:'left' }}>
              <div style={{ fontSize:22, marginBottom:4 }}>⛵</div>
              <div style={{ fontFamily:'DM Serif Display,serif', fontSize:14, color:'white', marginBottom:2 }}>Boat delivery</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.5)' }}>Marina, berth, superyacht</div>
            </button>
            <button onClick={onShowPreArrival}
              style={{ padding:'14px', background:'linear-gradient(135deg,rgba(200,168,75,0.25),rgba(196,104,58,0.2))', border:'0.5px solid rgba(200,168,75,0.35)', borderRadius:14, cursor:'pointer', textAlign:'left' }}>
              <div style={{ fontSize:22, marginBottom:4 }}>✈️</div>
              <div style={{ fontFamily:'DM Serif Display,serif', fontSize:14, color:'white', marginBottom:2 }}>Pre-arrival</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.5)' }}>Order before you land</div>
            </button>
            <button onClick={onShowPoolParty}
              style={{ padding:'14px', background:'linear-gradient(135deg,rgba(43,122,139,0.4),rgba(20,80,100,0.5))', border:'0.5px solid rgba(43,122,139,0.4)', borderRadius:14, cursor:'pointer', textAlign:'left' }}>
              <div style={{ fontSize:22, marginBottom:4 }}>🏊</div>
              <div style={{ fontFamily:'DM Serif Display,serif', fontSize:14, color:'white', marginBottom:2 }}>Pool party mode</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.5)' }}>Bulk ordering for groups</div>
            </button>
          </div>

          {/* ── Just Landed in Ibiza ────────────────────────────── */}
          <div style={{ margin:'0 16px 22px',background:'linear-gradient(135deg,rgba(200,168,75,0.15),rgba(196,104,58,0.1))',border:'0.5px solid rgba(200,168,75,0.3)',borderRadius:16,padding:'18px 16px',cursor:'pointer' }}
            onClick={onArrival}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start' }}>
              <div>
                <div style={{ fontSize:22,marginBottom:6 }}>✈️</div>
                <div style={{ fontFamily:'DM Serif Display,serif',fontSize:18,color:'white',marginBottom:4 }}>Just landed in Ibiza?</div>
                <div style={{ fontSize:12,color:'rgba(255,255,255,0.55)',lineHeight:1.5,maxWidth:220 }}>Get everything you need delivered in under 30 minutes — drinks, food, sun cream, the works.</div>
              </div>
              <div style={{ fontSize:11,color:'#C8A84B',fontWeight:600,whiteSpace:'nowrap',marginLeft:12,marginTop:4 }}>See packages →</div>
            </div>
          </div>

          {/* ── One horizontal scroll row per category ─────────── */}
          {CATEGORIES.map(cat => {
            const catProducts = PRODUCTS.filter(p => p.category === cat.key).slice(0, 10)
            if (catProducts.length === 0) return null
            return (
              <div key={cat.key} style={{ marginBottom:24 }}>
                <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0 16px',marginBottom:12 }}>
                  <button onClick={()=>onCategorySelect(cat.key)} style={{ fontFamily:'DM Serif Display,serif',fontSize:20,color:'white',background:'none',border:'none',cursor:'pointer',padding:0,display:'flex',alignItems:'center',gap:6 }}>
                    {cat.emoji} {cat.label}
                  </button>
                  <button onClick={()=>onCategorySelect(cat.key)} style={{ fontSize:11,color:'rgba(255,255,255,0.5)',background:'none',border:'none',cursor:'pointer',fontFamily:'DM Sans,sans-serif' }}>See all →</button>
                </div>
                <div style={{ display:'flex',gap:10,overflowX:'auto',padding:'0 16px 4px',scrollbarWidth:'none' }}>
                  {catProducts.map(p=><MiniCard key={p.id} product={p} t={t} onDetail={onDetail}/>)}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Root App ──────────────────────────────────────────────────
export default function CustomerApp() {
  const [view, setView]               = useState(VIEWS.SPLASH)
  const [assistQuery, setAssistQuery] = useState('')
  const [lang, setLang]               = useState('en')
  const [categoryKey, setCategoryKey] = useState(null)
  const [locationSet, setLocationSet] = useState(false)
  const [activeOrder, setActiveOrder] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showRating, setShowRating] = useState(null)
  const [showIssue, setShowIssue] = useState(null)
  const [showReceipt, setShowReceipt] = useState(null)
  const [showDriverChat, setShowDriverChat] = useState(false)
  const [showW3W, setShowW3W] = useState(false)
  const [showSchedule, setShowSchedule] = useState(false)
  const [scheduledDelivery, setScheduledDelivery] = useState(null)
  const [driverTip, setDriverTip] = useState(0)
  const [etaMins, setEtaMins] = useState(null)
  const { dark, toggle: toggleDark } = useDarkMode()
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [showClubPresets, setShowClubPresets] = useState(false)
  const [showBoatMode, setShowBoatMode] = useState(false)
  const { greeting, vibe } = useTimeGreeting()
  const weather = useWeatherSuggestion()
  const { show: showRatingPrompt, dismiss: dismissRatingPrompt } = useAppRatingPrompt()
  const { show: showOnboarding, finish: finishOnboarding } = useOnboarding()
  const { tip: driverTipAmount, setTip: setDriverTipAmount } = useCartTip()
  const [showGuestCheckout, setShowGuestCheckout] = useState(false)
  const [guestUser, setGuestUser] = useState(null)
  const [showDeleteAccount, setShowDeleteAccount] = useState(false)
  const [showChangeEmail, setShowChangeEmail] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [showHotelDelivery, setShowHotelDelivery] = useState(false)
  const { user } = useAuthStore()
  const savedCard = useSavedCard()
  const { notifs, unread, add: addNotif, markRead, markAllRead, clear: clearNotifs } = useNotifications()
  const [showNotifCentre, setShowNotifCentre] = useState(false)
  const [showPreArrival, setShowPreArrival] = useState(false)
  const [showPoolParty, setShowPoolParty] = useState(false)
  const [giftEnabled, setGiftEnabled] = useState(false)
  const [giftMessage, setGiftMessage] = useState('')
  const [substitution, setSubstitution] = useState('substitute')
  const [loyaltyRedeemed, setLoyaltyRedeemed] = useState(false)
  const loyaltyStamps = useLoyaltyStamps()
  const { show: showMorningKit, dismiss: dismissMorningKit } = useMorningAfterKit()
  const { prefs: dietaryPrefs, toggle: toggleDietary } = useDietaryPrefs()
  const [showDietaryFilter, setShowDietaryFilter] = useState(false)
  const cart = useCartStore()
  const t    = useT(lang)
  const estimatedMins = cart.deliveryAddress ? 18 : null

  const goToCategory = (key) => { setCategoryKey(key); setView(VIEWS.CATEGORY) }

  const handleTabChange = (v) => {
    if (v !== VIEWS.CATEGORY) setCategoryKey(null)
    setView(v)
  }

  // POINT 8: Live ETA countdown
  useEffect(()=>{
    if(!activeOrder?.estimated_minutes||activeOrder.status==='delivered') return
    const target = Date.now() + activeOrder.estimated_minutes*60000
    const tick = ()=>setEtaMins(Math.max(0,Math.round((target-Date.now())/60000)))
    tick(); const id=setInterval(tick,30000); return ()=>clearInterval(id)
  },[activeOrder?.estimated_minutes, activeOrder?.status])

  // Trigger rating after delivery
  useEffect(()=>{
    if(activeOrder?.status==='delivered'&&!showRating){
      setTimeout(()=>setShowRating(activeOrder),2500)
    }
  },[activeOrder?.status])

  const handleCheckoutStart = () => {
    if (!user && !guestUser) { setShowGuestCheckout(true); return }
    if (cart.getSubtotal() < 15) { toast.error('Minimum order is €15'); return }
    if (!hasValidAddress(cart)) { toast.error('Please set a delivery address first',{icon:'📍'}); return }
    if (cart.getHasAgeRestricted()) { setView(VIEWS.AGE_VERIFY); return }
    setView(VIEWS.CHECKOUT)
  }

  const handlePaymentSuccess = async (paymentIntentId) => {
    try {
      const subToOrder = subscribeToOrder
      const order = await createOrder({
        customerId:user.id, items:cart.items.map(i=>({productId:i.product.id,quantity:i.quantity,price:i.product.price})),
        deliveryLat:cart.deliveryLat, deliveryLng:cart.deliveryLng, deliveryAddress:cart.deliveryAddress,
        deliveryNotes:cart.deliveryNotes, what3words:cart.what3words, subtotal:cart.getSubtotal(), total:cart.getTotal(), paymentIntentId,
      })
      cart.clearCart(); setActiveOrder(order); setView(VIEWS.CONFIRMATION)
      addNotif({ type:'order', title:'Order confirmed! 🛵', body:'Order #'+order.order_number+' is being prepared. Estimated arrival: '+(order.estimated_minutes||18)+' min.' })
      const sub = subToOrder(order.id, u=>{ setActiveOrder(u); if(u.status==='delivered'){toast.success('🎉 Delivered!');addNotif({type:'order',title:'Delivered! 🎉',body:'Your order #'+u.order_number+' has been delivered.'});sub.unsubscribe()} })
      // Feature 4: WhatsApp confirmation
      if (user?.phone) sendWhatsAppConfirmation({ phone:user.phone, orderNumber:order.order_number, items:cart.items, total:order.total?.toFixed(2), etaMins:18 })
    } catch(err){ toast.error('Order failed: '+err.message) }
  }

  // ── SPLASH — absolutely no tab bar ───────────────────────
  if (view===VIEWS.SPLASH) {
    return <SplashScreen onEnter={()=>setView(VIEWS.HOME)} />
  }

  // ── AGE VERIFY ────────────────────────────────────────────
  if (view===VIEWS.AGE_VERIFY) {
    return (
      <div style={{ position:'fixed',inset:0,background:'rgba(10,25,35,0.75)',zIndex:200,display:'flex',alignItems:'flex-end',justifyContent:'center' }} onClick={()=>setView(VIEWS.BASKET)}>
        <div style={{ background:'#FEFCF9',borderRadius:'24px 24px 0 0',padding:'28px 24px 40px',width:'100%',maxWidth:480 }} onClick={e=>e.stopPropagation()}>
          <div style={{ width:36,height:4,background:'rgba(42,35,24,0.15)',borderRadius:2,margin:'0 auto 20px' }}/>
          <AgeVerification onVerified={()=>setView(VIEWS.CHECKOUT)} onClose={()=>setView(VIEWS.BASKET)} />
        </div>
      </div>
    )
  }

  // ── CHECKOUT ──────────────────────────────────────────────
  if (view===VIEWS.CHECKOUT) {
    return (
      <div style={{ background:C.bg, minHeight:'100vh', paddingBottom:60 }}>
        <div style={{ padding:'16px 16px 20px' }}>
          <button onClick={()=>setView(VIEWS.BASKET)} style={{ background:'none',border:'none',color:'rgba(255,255,255,0.55)',fontSize:14,cursor:'pointer',fontFamily:'DM Sans,sans-serif',marginBottom:12 }}>← Back to basket</button>
          <div style={{ fontFamily:'DM Serif Display,serif',fontSize:26,color:'white',marginBottom:20 }}>{t.checkout}</div>
          <div style={{ fontFamily:'DM Serif Display,serif',fontSize:16,color:'white',marginBottom:12 }}>Delivery location</div>
          {/* Feature 2: Address autocomplete */}
          <AddressAutocomplete placeholder="Search villa, hotel, beach or club..." onSelect={loc=>{ cart.setDeliveryLocation(loc.lat,loc.lng,loc.address,null); toast.success('📍 '+loc.address.slice(0,30)+'...') }} />
          <div style={{ borderRadius:14,overflow:'hidden',marginBottom:14 }}>
            <DeliveryMap onLocationSet={()=>setLocationSet(true)} />
          </div>
          <div style={{ fontFamily:'DM Serif Display,serif',fontSize:16,color:'white',marginBottom:12 }}>Order summary</div>
          <div style={{ background:'rgba(255,255,255,0.07)',borderRadius:14,padding:16,marginBottom:20 }}>
            {cart.items.map(({product,quantity})=>(
              <div key={product.id} style={{ display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:8,color:'rgba(255,255,255,0.82)' }}>
                <span>{product.emoji} {product.name} × {quantity}</span>
                <span style={{ fontWeight:500 }}>€{(product.price*quantity).toFixed(2)}</span>
              </div>
            ))}
            <div style={{ borderTop:'0.5px solid rgba(255,255,255,0.1)',paddingTop:10,marginTop:6 }}>
              <div style={{ display:'flex',justifyContent:'space-between',fontSize:13,color:'rgba(255,255,255,0.45)',marginBottom:5 }}><span>Subtotal</span><span>€{cart.getSubtotal().toFixed(2)}</span></div>
              <div style={{ display:'flex',justifyContent:'space-between',fontSize:13,color:'rgba(255,255,255,0.45)',marginBottom:10 }}><span>{t.delivery}</span><span>€3.50</span></div>
              <div style={{ display:'flex',justifyContent:'space-between',fontSize:15,fontWeight:500,color:'white' }}><span>{t.total}</span><span style={{ color:'#E8A070' }}>€{cart.getTotal().toFixed(2)}</span></div>
            </div>
            {cart.getHasAgeRestricted() && (
              <div style={{ marginTop:10,padding:'8px 12px',background:'rgba(196,104,58,0.18)',borderRadius:8,fontSize:11,color:'#E8C090',display:'flex',gap:6 }}>
                <span>🆔</span><span>ID required at delivery for age-restricted items</span>
              </div>
            )}
          </div>
          {/* POINT 15: Scheduled delivery */}
          {scheduledDelivery ? (
            <div style={{ marginBottom:16,padding:'12px 14px',background:'rgba(43,122,139,0.15)',border:'0.5px solid rgba(43,122,139,0.35)',borderRadius:12,display:'flex',justifyContent:'space-between',alignItems:'center' }}>
              <div>
                <div style={{ fontSize:12,fontWeight:600,color:'#7EE8C8' }}>Scheduled delivery</div>
                <div style={{ fontSize:13,color:'white',marginTop:2 }}>{scheduledDelivery.label}</div>
              </div>
              <button onClick={()=>setScheduledDelivery(null)} style={{ background:'none',border:'none',color:'rgba(255,255,255,0.4)',cursor:'pointer',fontSize:18 }}>×</button>
            </div>
          ) : (
            <button onClick={()=>setShowSchedule(true)} style={{ width:'100%',marginBottom:16,padding:'12px',background:'rgba(255,255,255,0.06)',border:'0.5px solid rgba(255,255,255,0.15)',borderRadius:12,color:'rgba(255,255,255,0.6)',fontSize:13,cursor:'pointer',fontFamily:'DM Sans,sans-serif',textAlign:'left',display:'flex',alignItems:'center',gap:8 }}>
              <span>📅</span> Schedule for later (optional)
            </button>
          )}

          {/* Feature 15: Hotel delivery */}
          <button onClick={()=>setShowHotelDelivery(true)} style={{ width:'100%',marginBottom:10,padding:'11px',background:'rgba(43,122,139,0.08)',border:'0.5px solid rgba(43,122,139,0.25)',borderRadius:10,color:'rgba(43,170,180,0.8)',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'DM Sans,sans-serif',display:'flex',alignItems:'center',gap:8 }}>
            <span>🏨</span> Delivering to a hotel? Enter room number
          </button>

          {/* POINT 11: W3W */}
          <button onClick={()=>setShowW3W(true)} style={{ width:'100%',marginBottom:16,padding:'11px',background:'rgba(229,0,26,0.08)',border:'0.5px solid rgba(229,0,26,0.25)',borderRadius:10,color:'rgba(229,0,26,0.8)',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'DM Sans,sans-serif',display:'flex',alignItems:'center',gap:8 }}>
            <span style={{ fontWeight:800 }}>///</span> Use what3words for precise location
          </button>

          {/* Feature 10: Gift message */}
          <GiftMessageToggle enabled={giftEnabled} message={giftMessage} onToggle={()=>setGiftEnabled(e=>!e)} onMessageChange={setGiftMessage} />
          {/* Feature 11: Substitution preference */}
          <SubstitutionPreference value={substitution} onChange={setSubstitution} />
          {/* POINT 4: Driver tip */}
          <TipSelector onTipChange={setDriverTipAmount} />

          <div style={{ fontFamily:'DM Serif Display,serif',fontSize:16,color:'white',marginBottom:16 }}>Payment</div>
          {/* Feature 10: Apple/Google Pay */}
          <NativePayButton total={cart.getTotal()} onSuccess={handlePaymentSuccess} />
          <StripeCheckout onSuccess={handlePaymentSuccess} onCancel={()=>setView(VIEWS.BASKET)} />
        </div>
      </div>
    )
  }

  // ── TRACKING ──────────────────────────────────────────────
  if (view===VIEWS.TRACKING && activeOrder) {
    const STEPS=['confirmed','preparing','assigned','picked_up','en_route','delivered']
    const LABELS={confirmed:'Confirmed',preparing:'Preparing',assigned:'Driver assigned',picked_up:'Picked up',en_route:'On the way',delivered:'Delivered!'}
    const idx=STEPS.indexOf(activeOrder.status)
    return (
      <div style={{ background:C.bg, minHeight:'100vh', padding:'24px 16px 100px' }}>
        <div style={{ fontFamily:'DM Serif Display,serif',fontSize:26,color:'white',marginBottom:4 }}>{activeOrder.status==='delivered'?'Delivered! 🎉':'On its way 🛵'}</div>
        <div style={{ fontSize:13,color:'rgba(255,255,255,0.4)',marginBottom:20 }}>#{activeOrder.order_number}</div>
        <div style={{ background:'rgba(255,255,255,0.07)',borderRadius:14,padding:16,marginBottom:20 }}>
          {STEPS.map((s,i)=>(
            <div key={s} style={{ display:'flex',alignItems:'center',gap:12,marginBottom:i<STEPS.length-1?14:0 }}>
              <div style={{ width:28,height:28,borderRadius:'50%',flexShrink:0,background:i<=idx?(i===idx?'#C4683A':'#5A6B3A'):'rgba(255,255,255,0.1)',display:'flex',alignItems:'center',justifyContent:'center' }}>
                {i<idx&&<svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>}
                {i===idx&&<div style={{ width:8,height:8,borderRadius:'50%',background:'white' }}/>}
              </div>
              <span style={{ fontSize:14,fontWeight:i===idx?500:400,color:i>idx?'rgba(255,255,255,0.35)':'white' }}>{LABELS[s]}</span>
            </div>
          ))}
        </div>
        {activeOrder.status!=='delivered' && (
          <div style={{ background:'rgba(43,122,139,0.2)',border:'0.5px solid rgba(43,122,139,0.35)',borderRadius:14,padding:'16px',marginBottom:16,display:'flex',alignItems:'center',gap:16 }}>
            <span style={{ fontSize:36 }}>🛵</span>
            <div>
              <div style={{ fontSize:12,color:'rgba(255,255,255,0.45)' }}>Estimated arrival</div>
              <div style={{ fontSize:32,fontWeight:700,color:'white',fontFamily:'monospace' }}>
                {etaMins!==null?etaMins+' min':(activeOrder.estimated_minutes||18)+' min'}
              </div>
              <div style={{ fontSize:12,color:'rgba(255,255,255,0.4)',marginTop:4 }}>Arrives around {(()=>{const t=new Date();t.setMinutes(t.getMinutes()+(etaMins||activeOrder.estimated_minutes||18));return t.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})})()}</div>
            </div>
          </div>
        )}
        {activeOrder.driver_id && activeOrder.status!=='delivered' && (
          <DriverInfoCard driverId={activeOrder.driver_id} />
        )}
        {/* Live tracking map */}
        {activeOrder.driver_id && (
          <div style={{ marginBottom:16 }}>
            <div style={{ fontFamily:'DM Serif Display,serif',fontSize:16,color:'white',marginBottom:10 }}>Live tracking</div>
            <OrderTrackingMap order={activeOrder} driverId={activeOrder.driver_id} />
          </div>
        )}
        {/* POINT 9: Cancel order window */}
        {['confirmed','preparing'].includes(activeOrder.status) && (
          <CancelOrderButton order={activeOrder} onCancelled={()=>{ setActiveOrder(null); setView(VIEWS.HOME) }} />
        )}

        {/* POINT 10: Driver chat button */}
        {activeOrder.driver_id && activeOrder.status!=='delivered' && (
          <button onClick={()=>setShowDriverChat(true)}
            style={{ width:'100%',marginBottom:14,padding:'13px',background:'rgba(43,122,139,0.2)',border:'0.5px solid rgba(43,122,139,0.4)',borderRadius:12,color:'#7EE8C8',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'DM Sans,sans-serif',display:'flex',alignItems:'center',justifyContent:'center',gap:8 }}>
            💬 Chat with driver
          </button>
        )}

        {activeOrder.status==='delivered' && (
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12 }}>
            <button onClick={()=>setShowRating(activeOrder)}
              style={{ padding:'14px',background:'rgba(200,168,75,0.2)',border:'0.5px solid rgba(200,168,75,0.4)',borderRadius:14,color:'#C8A84B',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'DM Sans,sans-serif' }}>
              Rate order
            </button>
            <button onClick={()=>setShowIssue(activeOrder)}
              style={{ padding:'14px',background:'rgba(255,255,255,0.06)',border:'0.5px solid rgba(255,255,255,0.15)',borderRadius:14,color:'rgba(255,255,255,0.6)',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'DM Sans,sans-serif' }}>
              Report issue
            </button>
          </div>
        )}
        <button onClick={()=>setView(VIEWS.HOME)} style={{ width:'100%',padding:15,background:'#C4683A',color:'white',border:'none',borderRadius:12,fontFamily:'DM Sans,sans-serif',fontSize:15,cursor:'pointer' }}>Place another order</button>
      </div>
    )
  }

  // ── FULL-SCREEN VIEWS (no tab bar) ──────────────────────────
  if (view===VIEWS.ORDER_HISTORY)   return <OrderHistoryView   onBack={()=>setView(VIEWS.ACCOUNT)} onShowReceipt={o=>setShowReceipt(o)} />
  if (view===VIEWS.SAVED_ADDRESSES) return <SavedAddressesView onBack={()=>setView(VIEWS.ACCOUNT)} />
  if (view===VIEWS.EDIT_PROFILE)    return <EditProfileView    onBack={()=>setView(VIEWS.ACCOUNT)} />
  if (view===VIEWS.WISHLIST)        return <WishlistView onBack={()=>setView(VIEWS.ACCOUNT)} onDetail={p=>{trackView(p);setSelectedProduct(p);setView(VIEWS.HOME)}} />
  if (view===VIEWS.LOYALTY)         return <LoyaltyCard  onBack={()=>setView(VIEWS.ACCOUNT)} />
  if (view===VIEWS.REFERRAL)        return <ReferralView onBack={()=>setView(VIEWS.ACCOUNT)} />
  if (view===VIEWS.NOTIFICATIONS)   return <NotificationPrefsView onBack={()=>setView(VIEWS.ACCOUNT)} />

  // ── MAIN SHELL — tab bar lives here only ──────────────────
  return (
    <div style={{ background:C.bg, minHeight:'100vh', paddingBottom:68 }}>

      {view===VIEWS.CATEGORY && categoryKey && (
        <CategoryPage categoryKey={categoryKey} onBack={()=>{ setCategoryKey(null); setView(VIEWS.HOME) }} onDetail={p=>{trackView(p);setSelectedProduct(p)}} />
      )}
      {view===VIEWS.CATEGORY && !categoryKey && <CategoriesView onSelect={goToCategory} />}
      {view===VIEWS.HOME     && <FadeIn><HomeView t={t} lang={lang} setLang={setLang} onCategorySelect={goToCategory} estimatedMins={estimatedMins} onAssist={(q)=>{ setAssistQuery(q||''); setView(VIEWS.ASSIST) }} onBest={()=>setView(VIEWS.BEST)} onNewIn={()=>setView(VIEWS.NEWIN)} onPartyNight={()=>setView(VIEWS.PARTY_NIGHT)} onPartyDay={()=>setView(VIEWS.PARTY_DAY)} onArrival={()=>setView(VIEWS.ARRIVAL)} onDetail={p=>{trackView(p);setSelectedProduct(p)}} onReorder={()=>setView(VIEWS.BASKET)} onShowClub={()=>setShowClubPresets(true)} onShowBoat={()=>setShowBoatMode(true)} onShowPreArrival={()=>setShowPreArrival(true)} onShowPoolParty={()=>setShowPoolParty(true)} showMorningKit={showMorningKit} dismissMorningKit={dismissMorningKit} loyaltyStamps={loyaltyStamps} unread={unread} onShowNotifs={()=>setShowNotifCentre(true)} /></FadeIn>}
      {view===VIEWS.SEARCH   && <SearchView t={t} onAssist={(q)=>{ setAssistQuery(q); setView(VIEWS.ASSIST) }} />}
      {view===VIEWS.BASKET   && <BasketView t={t} onCheckout={handleCheckoutStart} />}
      {view===VIEWS.ACCOUNT  && <FadeIn><AccountView t={t} onShowHistory={()=>setView(VIEWS.ORDER_HISTORY)} onShowAddresses={()=>setView(VIEWS.SAVED_ADDRESSES)} onShowEditProfile={()=>setView(VIEWS.EDIT_PROFILE)} onShowLoyalty={()=>setView(VIEWS.LOYALTY)} onShowReferral={()=>setView(VIEWS.REFERRAL)} onShowWishlist={()=>setView(VIEWS.WISHLIST)} onShowNotifications={()=>setView(VIEWS.NOTIFICATIONS)} dark={dark} onToggleDark={toggleDark} onDeleteAccount={()=>setShowDeleteAccount(true)} onChangeEmail={()=>setShowChangeEmail(true)} onChangePassword={()=>setShowChangePassword(true)} /></FadeIn>}
      {view===VIEWS.ASSIST   && <AssistBot initialQuery={assistQuery} onClose={()=>{ setAssistQuery(''); setView(VIEWS.HOME) }} />}
      {view===VIEWS.CONCIERGE && <Concierge onBack={()=>setView(VIEWS.HOME)} />}
      {view===VIEWS.PARTY_NIGHT && <PartyBuilder initialType="design_night" onBack={()=>setView(VIEWS.HOME)} />}
      {view===VIEWS.PARTY_DAY   && <PartyBuilder initialType="design_day"   onBack={()=>setView(VIEWS.HOME)} />}
      {view===VIEWS.ARRIVAL     && <ArrivalPackage onBack={()=>setView(VIEWS.HOME)} />}
      {view===VIEWS.BEST     && <AllProductsPage title={'🔥 Best Sellers'} products={BEST_SELLERS} onBack={()=>setView(VIEWS.HOME)} onDetail={p=>{trackView(p);setSelectedProduct(p)}} />}
      {view===VIEWS.NEWIN   && <AllProductsPage title={'✨ New In'} products={NEW_IN} onBack={()=>setView(VIEWS.HOME)} onDetail={p=>{trackView(p);setSelectedProduct(p)}} />}

      {/* Floating cart bar on home only */}
      {view===VIEWS.HOME && cart.getItemCount()>0 && (
        <div onClick={()=>setView(VIEWS.BASKET)}
          style={{ position:'sticky',bottom:68,margin:'0 16px',background:'#C4683A',borderRadius:14,padding:'13px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer',boxShadow:'0 4px 24px rgba(196,104,58,0.5)' }}>
          <div style={{ color:'white' }}>
            <div style={{ fontSize:11,opacity:0.8 }}>{cart.getItemCount()} {cart.getItemCount()===1?t.item:t.items}</div>
            <div style={{ fontSize:15,fontWeight:500 }}>€{cart.getSubtotal().toFixed(2)} + €3.50 delivery</div>
          </div>
          <div style={{ color:'white',fontSize:13,fontWeight:500 }}>{t.viewCart} →</div>
        </div>
      )}

      {/* Tab bar — ONLY in the main shell, never on splash/checkout/tracking */}
      <TabBar view={view} setView={handleTabChange} cartCount={cart.getItemCount()} />

      {/* NEW: Scheduled delivery */}
      {showSchedule && <ScheduledDeliverySheet onClose={()=>setShowSchedule(false)} onSchedule={s=>setScheduledDelivery(s)} />}
      {/* NEW: W3W */}
      {showW3W && <W3WPicker onClose={()=>setShowW3W(false)} onSelect={r=>{ cart.setDeliveryLocation(r.lat,r.lng,'///'+r.words,'///'+r.words); toast.success('///'+r.words+' set!') }} />}
      {/* NEW: Driver chat */}
      {showDriverChat && activeOrder && <DriverChat order={activeOrder} onClose={()=>setShowDriverChat(false)} />}
      {/* NEW: Order receipt */}
      {showReceipt && <OrderReceiptSheet order={showReceipt} onClose={()=>setShowReceipt(null)} />}
      {/* POINT 1: Product detail sheet */}
      {selectedProduct && <ProductDetailSheet product={selectedProduct} onClose={()=>setSelectedProduct(null)} />}
      {/* POINT 5: Rating sheet */}
      {showRating && <RatingSheet order={showRating} onClose={()=>setShowRating(null)} />}
      {/* POINT 6: Report issue */}
      {showIssue && <ReportIssueSheet order={showIssue} onClose={()=>setShowIssue(null)} />}
      {/* POINT 15: PWA install */}
      <PWAInstallPrompt />
      {/* Feature 3: Notification centre */}
      {showNotifCentre && <NotificationCentre notifs={notifs} onMarkRead={markRead} onMarkAll={markAllRead} onClear={clearNotifs} onClose={()=>setShowNotifCentre(false)} />}
      {/* Feature 14: Pre-arrival order */}
      {showPreArrival && <PreArrivalSheet onClose={()=>setShowPreArrival(false)} onSchedule={s=>{ cart.setDeliveryNotes&&cart.setDeliveryNotes('PRE-ARRIVAL: '+s.villa+' at '+s.arrivalTime+' on '+s.arrivalDate+(s.flightNum?' flight '+s.flightNum:'')); toast.success('Pre-arrival order scheduled!') }} />}
      {/* Feature 15: Pool party mode */}
      {showPoolParty && <PoolPartyMode onClose={()=>setShowPoolParty(false)} onAddAll={()=>setView(VIEWS.BASKET)} />}
      {/* Feature 5: Guest checkout */}
      {showGuestCheckout && <GuestCheckoutModal onClose={()=>setShowGuestCheckout(false)} onContinue={g=>{ setGuestUser(g); setShowGuestCheckout(false); setView(VIEWS.CHECKOUT) }} />}
      {/* Feature 12: Delete account */}
      {showDeleteAccount && <DeleteAccountSheet onClose={()=>setShowDeleteAccount(false)} />}
      {/* Feature 13: Change email */}
      {showChangeEmail && <ChangeCredentialsSheet mode="email" onClose={()=>setShowChangeEmail(false)} />}
      {/* Feature 13: Change password */}
      {showChangePassword && <ChangeCredentialsSheet mode="password" onClose={()=>setShowChangePassword(false)} />}
      {/* Feature 15: Hotel delivery */}
      {showHotelDelivery && <HotelDeliverySheet onClose={()=>setShowHotelDelivery(false)} onConfirm={d=>{ cart.setDeliveryLocation(0,0,d.address,null); cart.setDeliveryNotes(d.notes); toast.success('Hotel delivery set') }} />}
      {/* Feature 13: App rating prompt */}
      {showRatingPrompt && <AppRatingPrompt onDismiss={dismissRatingPrompt} />}
      {/* Feature 15: Club presets */}
      {showClubPresets && <ClubPresetsSheet onClose={()=>setShowClubPresets(false)} onSelect={club=>{ if(cart.setDeliveryLocation) cart.setDeliveryLocation(club.lat,club.lng,club.name+', Ibiza',null); toast.success(club.name+' set as delivery location!') }} />}
      {/* Feature 16: Boat delivery */}
      {showBoatMode && <BoatDeliverySheet onClose={()=>setShowBoatMode(false)} onConfirm={details=>{ if(cart.setDeliveryNotes) cart.setDeliveryNotes(details.notes) }} />}

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}} @keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}} @keyframes shimmer{0%,100%{opacity:1}50%{opacity:0.55}}`}</style>
    </div>
  )
}
