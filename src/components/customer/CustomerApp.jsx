import { useState, useEffect, useCallback, useRef } from 'react'
import toast from 'react-hot-toast'
import { useCartStore, useAuthStore } from '../../lib/store'
import { PRODUCTS, CATEGORIES, BEST_SELLERS, NEW_IN } from '../../lib/products'
import { LANGUAGES } from '../../i18n/translations'
import { useLang, useAppT } from '../../i18n/LangContext'
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
  ChangeCredentialsSheet, HotelDeliverySheet, shareProduct, BeachDeliverySheet,
  CarDeliverySheet,
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
import {
  haptic, PressableButton, AnimatedBadge, ErrorState, EmptyState,
  FadeImage, useScrollMemory, TrustBadges, BackInStockButton,
  useLiveOrderCount, LiveOrderCountBadge, usePeopleViewing, PeopleViewingBadge,
  getLoyaltyTier, LoyaltyTierCard, useOrderStreak, StreakBadge,
  DeliveryZoneInfo, TrackingShareButton, WeatherProductRow,
  useIbizaEvents, EventCalendarBanner, InstagramStoryShare,
  SplitBillButton, TaxiUpsellCard, NetworkErrorBanner,
} from './CustomerFeatures_polish'
import {
  useSlideOut, LiveCheckoutTotal, PayButton, ConfirmedAddressCard,
  FloatingBasketBar, PushNotificationToggle, useReferralFromURL,
  useQuantityGuard, QuantityLimitBadge, usePaginatedOrders,
  VariantSelector, CorporateBillingToggle, OfflineBanner,
  isInIbizaZone, DeliveryZoneWarning, Analytics,
  BeachGPSButton, VillaPresetsPanel, useRealtimeDriverLocation,
  DOBAgeGate, useOnlineStatus, usePushNotifications,
  registerServiceWorker, callAIProxy, generateLocalizedReceipt,
} from './CustomerFeatures_final'
import {
  fuzzySearch, SearchWithFuzzy, useCollections, CollectionsRow,
  useFlashProducts, FlashPriceBadge, FlashPrice,
  FrequentlyBoughtTogether, AnimatedStampCard, SearchFilters,
  AnimatedTrackingSteps, setupNotificationActions, useNearestDepot, DepotBadge,
  TabIndicator, useAnimatedTotal, AddAllButton, CheckoutProgressBar, BackButton,
  useSwipeToDismiss, RatingPromptSheet, LegalLinks, useCookieConsent, CookieConsentBanner,
  FAQView, AllergenInfo, ResponsibleDrinkingBadge, CancellationPolicyNote,
  useCurrency, CurrencyToggle, shareProductBranded,
  FlightStatusBanner, useProximityVenueSuggestion, VenueSuggestionBanner,
} from './CustomerFeatures_getir'
import {
  useNotificationReorder, SupportChatWidget, ImageSearchButton,
  OrderIssueSheet, useSurgePricing, SurgePricingBanner,
  RecurringOrderSetup, OccasionCollections, DeliveryQRCode,
  DriverRatingSheet, ChallengesBadgesView, shareReferralLink,
  ReferralDeepLinkHandler, useAbandonedBasketTracker,
  useFirstOrderDiscount, FirstOrderDiscountBanner,
  FreeSampleOffer, useBirthdayReward, BirthdayRewardBanner,
} from './CustomerFeatures_world2'
import {
  useFlyToCart, ConfettiCelebration, EmptyBasketState,
  EmptySearchState, FirstVisitOnboarding, useWhatsNew, WhatsNewModal,
  useOutOfStockCheck, useDeliveryZone, DeliveryZoneBadge,
  PhotoIDVerification, LiveOrderHomeCard,
  ZoneMinimumBanner, usePrefetch, ShareBasketButton,
  BarcodeScanner, oneTabReorder, CharityDonationToggle,
  CarbonOffsetToggle, TipSplitInfo, getOptimisedImageUrl,
} from './CustomerFeatures_polish2'
import {
  useExpressCheckout, ExpressCheckoutBar, ExpressCheckoutSheet,
  useSearchFilters, SearchFilterBar, SearchFilterPanel,
  useWinBackDetection, WinBackBanner, useDebounce,
} from './CustomerFeatures_perf'
import OccasionPage from './OccasionPage'
import PackagePage, { PACKAGES } from './PackagePage'
import IslaPlayer from './IslaPlayer'
import {
  HomeSkeletonLoader, usePersonalisedCategories, VoiceSearchButton,
  useProductImages, ImageGallery, BecauseYouBoughtRow, useLoyaltyDelivery,
  getOrderNumberFromURL, processReferral, PushNotificationPrompt,
  useSwipeBack, fireOrderConfirmedHaptic, DEFAULT_WEATHER_TAGS, WeatherBadge,
  IBIZA_2025_EVENTS, seedIbizaEvents, PreArrivalFlightStatus,
  formatCurrency, useFormatPrice, useAfterDarkMode, AfterDarkBanner,
  getAfterDarkProducts,
} from './CustomerFeatures_launch'
import {
  DidYouMean, useItemNotes, ItemNoteButton, useRealtimeStock,
  SmartReorderButton, useSaveForLater, SaveForLaterList,
  ProductCompareSheet, CaloriesBadge, useSearchFocus,
  showToast, useAddedFlash, AddedFlashOverlay, useLongPress, QuickAddSheet,
  useInfiniteScroll, CategoryHeroImage,
  PostDeliveryTipSheet, useGroupOrder, GroupOrderBanner,
  RecurringOrderSheet, CreditTrackerView, AppErrorBoundary, LazyImg,
  SeasonCountdownBanner, WeatherRelevanceBadge, IbizaTimeNote,
  ConfirmationMapImage, ReferralAtCheckout,
} from './CustomerFeatures_v2'
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

const VIEWS = { SPLASH:'splash', HOME:'home', CATEGORY:'category', SEARCH:'search', BASKET:'basket', ACCOUNT:'account', ASSIST:'assist', BEST:'best', NEWIN:'newin', AGE_VERIFY:'age_verify', CHECKOUT:'checkout', TRACKING:'tracking', PARTY_NIGHT:'party_night', PARTY_DAY:'party_day', ARRIVAL:'arrival', ORDER_HISTORY:'order_history', SAVED_ADDRESSES:'saved_addresses', EDIT_PROFILE:'edit_profile', WISHLIST:'wishlist', LOYALTY:'loyalty', REFERRAL:'referral', NOTIFICATIONS:'notifications', CONFIRMATION:'confirmation', CONCIERGE:'concierge', ONBOARDING:'onboarding', NOTIFICATIONS_CENTRE:'notif_centre', FAQ:'faq', CREDITS:'credits', VILLA_PRESETS:'villa_presets', OCCASION:'occasion', PACKAGE:'package' }

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
    <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, overflow:'hidden', zIndex:9999 }}>
      {/* Background image — always full screen */}
      <img src="/splash.jpg" alt="Isla Drop" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', objectPosition:'center top' }} />
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom,rgba(0,0,0,0.05) 0%,rgba(0,0,0,0.05) 40%,rgba(0,0,0,0.6) 68%,rgba(0,0,0,0.88) 100%)' }} />
      {/* Content column — viewport-centred using left:50% + marginLeft trick */}
      <div style={{
        position:'absolute', bottom:0,
        left:'50%',
        width:'100%', maxWidth:480,
        padding:'0 28px 64px',
        opacity:vis?1:0,
        transform: vis ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(20px)',
        transition:'opacity 0.9s cubic-bezier(0.34,1.1,0.64,1), transform 0.9s cubic-bezier(0.34,1.1,0.64,1)',
      }}>
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
function LangInline() {
  const { lang, setLang } = useLang()
  const [open, setOpen] = useState(false)
  const cur = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0]
  return (
    <span style={{ position:'relative' }}>
      <span
        onClick={() => setOpen(o => !o)}
        style={{ background:'rgba(255,255,255,0.14)', border:'0.5px solid rgba(255,255,255,0.22)', borderRadius:20, padding:'4px 9px', color:'white', fontSize:12, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:4, fontFamily:'DM Sans,sans-serif' }}>
        {cur.flag} {cur.code.toUpperCase()}
      </span>
      {open && (
        <span style={{ position:'absolute', top:30, right:0, background:'#0D3545', border:'0.5px solid rgba(255,255,255,0.2)', borderRadius:12, overflow:'hidden', display:'block', minWidth:160, boxShadow:'0 8px 24px rgba(0,0,0,0.5)', zIndex:9999 }}>
          {LANGUAGES.map(l => (
            <span key={l.code}
              onClick={(e) => { e.stopPropagation(); setLang(l.code); setOpen(false) }}
              style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', cursor:'pointer', background: l.code === lang ? 'rgba(196,104,58,0.2)' : 'transparent', borderBottom:'0.5px solid rgba(255,255,255,0.07)', fontFamily:'DM Sans,sans-serif', fontSize:13, color:'white' }}>
              <span style={{ fontSize:18 }}>{l.flag}</span>
              <span style={{ flex:1 }}>{l.label}</span>
              {l.code === lang && <span style={{ color:'#C4683A' }}>✓</span>}
            </span>
          ))}
        </span>
      )}
    </span>
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
    <div className="isla-tab-bar" style={{ position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:480, display:'flex', background:C.tabBg, backdropFilter:'blur(14px)', borderTop:'0.5px solid rgba(43,122,139,0.2)', zIndex:100, paddingBottom:'env(safe-area-inset-bottom,0px)' }}>
      {tabs.map(t => {
        const on = view === t.id
        return (
          <button key={t.id} onClick={()=>setView(t.id)}
            onTouchStart={()=>haptic('light')}
            style={{ flex:1, padding:'11px 4px 9px', border:'none', background:'none', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:3, fontFamily:'DM Sans,sans-serif', fontSize:10, color:on?'#7EE8C8':'rgba(150,220,200,0.35)', fontWeight:on?500:400, position:'relative', transition:'color 0.15s' }}>
            <div style={{ position:'relative' }}>
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={on?2:1.7}>
                {t.search ? <><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></> : t.concierge ? <><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></> : <path d={t.path}/>}
              </svg>
              {t.badge>0 && <AnimatedBadge count={t.badge} />}
            </div>
            {t.label}
          </button>
        )
      })}
    </div>
  )
}

// ── Mini product card ─────────────────────────────────────────
function MiniCard({ product, t, onDetail, weather }) {
  const qty = useCartStore(s=>s.items.find(i=>i.product.id===product.id)?.quantity??0)
  const { addItem, updateQuantity } = useCartStore()
  const handleAdd = (e) => {
    e.stopPropagation()
    addItem(product)
    haptic('medium')
    Analytics.addToCart(product)
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
        <OutOfStockOverlay productId={product.id} />
        <StockBadge productId={product.id} style={{ position:'absolute',top:6,left:6 }} />
        <WeatherBadge product={product} weather={weather} />
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
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ fontSize:13, fontWeight:500, color:'#C4683A' }}>€{product.price.toFixed(2)}</div>
          <ProductRatingBadge productId={product.id} />
        </div>
      </div>
    </div>
  )
}

// ── Basket ────────────────────────────────────────────────────
const PROMO_CODES = {
  'WELCOME20': { pct:20, label:'20% off — welcome gift!' },
  'ISLAND10':  { pct:10, label:'10% off your order' },
  'IBIZA15':   { pct:15, label:'15% off — Ibiza special' },
  'ISLADROP':  { pct:10, label:'10% off — welcome to Isla Drop!' },
  'SUMMER25':  { pct:25, label:'25% summer special' },
  'VIP30':     { pct:30, label:'30% VIP discount' },
}

function PromoCodeEntry({ onApply }) {
  const [code, setCode] = useState('')
  const [applied, setApplied] = useState(false)
  const [discount, setDiscount] = useState(null)
  const apply = () => {
    if (!code.trim()) return
    const promo = PROMO_CODES[code.trim().toUpperCase()]
    if (!promo) { toast.error('Invalid promo code — try WELCOME20'); return }
    setDiscount(promo); setApplied(true); onApply && onApply(promo)
    toast.success('🎉 ' + promo.label)
    toast.success('Promo code applied!')
    onApply(code)
  }
  if (applied) return (
    <div style={{ display:'flex',alignItems:'center',gap:8,padding:'10px 14px',background:'rgba(29,158,117,0.15)',border:'0.5px solid rgba(29,158,117,0.3)',borderRadius:10,marginBottom:10 }}>
      <span style={{ fontSize:16 }}>✅</span>
      <span style={{ fontSize:13,color:'#7EE8A2',flex:1 }}>{discount ? discount.label : 'Promo code '+code+' applied'}</span>
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

function BasketView({ t, onCheckout, onBack, driverTipAmount, loyaltyRedeemed, setLoyaltyRedeemed, itemNotes, setItemNote, groupToken, createGroupOrder, savedLater, removeFromSaved, firstOrderDiscount, scheduledTime, onRequestSchedule, onClearSchedule }) {
  const [promoDiscount, setPromoDiscount] = useState(null)
  const cart = useCartStore()
  const { updateQuantity, addItem } = useCartStore()
  const { removing, animateRemove } = useSlideOut()
  const [notes, setNotes] = useState(cart.deliveryNotes||'')
  const MIN = 15
  const sub = cart.getSubtotal()
  const belowMin = sub < MIN
  const progress = Math.min(100,(sub/MIN)*100)
  const saveNotes = val => { setNotes(val); if(cart.setDeliveryNotes) cart.setDeliveryNotes(val) }
  if (cart.getItemCount()===0) return (
    <div style={{ padding:24 }}>
      <EmptyBasketState onShop={onBack} />
      <button onClick={onBack}
        style={{ display:'flex',alignItems:'center',gap:6,background:'rgba(255,255,255,0.08)',border:'0.5px solid rgba(255,255,255,0.15)',borderRadius:20,padding:'6px 14px 6px 10px',cursor:'pointer',marginBottom:16 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        <span style={{ fontSize:12,color:'white',fontFamily:'DM Sans,sans-serif',fontWeight:500 }}>Back</span>
      </button>
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
        <div style={{ display:'flex',alignItems:'center',gap:10 }}>
          <button onClick={onBack}
            style={{ display:'flex',alignItems:'center',gap:6,background:'rgba(255,255,255,0.08)',border:'0.5px solid rgba(255,255,255,0.15)',borderRadius:20,padding:'6px 14px 6px 10px',cursor:'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            <span style={{ fontSize:12,color:'white',fontFamily:'DM Sans,sans-serif',fontWeight:500 }}>Back</span>
          </button>
          <div style={{ fontFamily:'DM Serif Display,serif',fontSize:26,color:'white' }}>{t.viewCart}</div>
        </div>
        <div style={{ fontSize:12,color:'rgba(255,255,255,0.45)',background:'rgba(255,255,255,0.08)',padding:'4px 10px',borderRadius:20 }}>{cart.getItemCount()} item{cart.getItemCount()!==1?'s':''}</div>
      </div>
      {cart.items.map(({product,quantity})=>(
        <div key={product.id}
          style={{ display:'flex',gap:12,alignItems:'center',padding:'12px 0',borderBottom:'0.5px solid rgba(255,255,255,0.08)',
            transition:'opacity 0.22s ease, transform 0.22s ease',
            opacity: removing[product.id] ? 0 : 1,
            transform: removing[product.id] ? 'translateX(-24px)' : 'translateX(0)' }}>
          <div style={{ width:52,height:52,borderRadius:10,overflow:'hidden',flexShrink:0 }}>
            <ProductImage productId={product.id} emoji={product.emoji} category={product.category} alt={product.name} size="list" style={{ height:52,width:52 }} />
          </div>
          <div style={{ flex:1,minWidth:0 }}>
            <div style={{ fontSize:13,fontWeight:500,color:'white',lineHeight:1.3,marginBottom:3 }}>{product.name}</div>
            <div style={{ fontSize:13,color:'#E8A070',fontWeight:500 }}>€{(product.price*quantity).toFixed(2)}</div>
            <ItemNoteButton productId={product.id} notes={itemNotes} onSetNote={setItemNote} />
          </div>
          <div style={{ display:'flex',alignItems:'center',gap:8 }}>
            <button onClick={()=>{ if(quantity<=1) animateRemove(product.id,()=>updateQuantity(product.id,0)); else updateQuantity(product.id,quantity-1) }} style={{ width:26,height:26,background:'rgba(255,255,255,0.1)',border:'none',borderRadius:'50%',cursor:'pointer',fontSize:14,color:'white',display:'flex',alignItems:'center',justifyContent:'center' }}>−</button>
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
        <div style={{ display:'flex',justifyContent:'space-between',fontSize:16,fontWeight:500,color:'white' }}><span>{t.total}</span><span style={{ color:'#E8A070' }}>€{((cart.getTotal()*(promoDiscount?1-promoDiscount.pct/100:1))+(driverTipAmount||0)).toFixed(2)}</span></div>
      </div>
      {cart.getHasAgeRestricted() && (
        <div style={{ background:'rgba(196,104,58,0.18)',border:'0.5px solid rgba(196,104,58,0.35)',borderRadius:10,padding:'9px 12px',display:'flex',gap:8,fontSize:11,color:'#E8C090',marginBottom:12 }}>
          <span>🆔</span><span>ID required at delivery for age-restricted items</span>
        </div>
      )}
      {/* Feature 6: Upsell suggestions */}
      <BasketUpsell cartItems={cart.items} />
      <FrequentlyBoughtTogether cartItems={cart.items} />
      {/* Feature 7: Loyalty redemption */}
      <LoyaltyRedemptionRow redeemed={loyaltyRedeemed} onRedeem={()=>setLoyaltyRedeemed(true)} onRemove={()=>setLoyaltyRedeemed(false)} />
      <PromoCodeEntry onApply={p=>setPromoDiscount(p)} />
      {/* Feature 7: Show warning if no address set */}
      {!cart.deliveryAddress && <NoAddressWarning onSetAddress={()=>toast('Set your address in checkout',{icon:'📍'})} />}
      <GroupOrderBanner groupToken={groupToken} onStart={()=>createGroupOrder()} />
      <SaveForLaterList saved={savedLater} onMoveToBasket={()=>{}} onRemove={removeFromSaved} />
      <ZoneMinimumBanner lat={cart.deliveryLat} lng={cart.deliveryLng} subtotal={cart.getSubtotal()} />
      <FirstOrderDiscountBanner discount={firstOrderDiscount} onApply={()=>toast.success('€10 discount applied! 🎁')} />
      <FreeSampleOffer subtotal={cart.getSubtotal()} onAddSample={p=>{ cart.addItem(p) }} />
      {cart.getItemCount() >= 25 && (
        <div style={{ background:'rgba(200,168,75,0.12)',border:'0.5px solid rgba(200,168,75,0.3)',borderRadius:12,padding:'10px 14px',marginBottom:12,display:'flex',gap:10,alignItems:'flex-start' }}>
          <span style={{ fontSize:16,flexShrink:0 }}>⏱️</span>
          <div style={{ fontSize:12,color:'rgba(255,255,255,0.75)',fontFamily:'DM Sans,sans-serif',lineHeight:1.5 }}>
            <strong style={{ color:'#C8A84B' }}>Large order ({cart.getItemCount()} items)</strong> — our warehouse team will need extra preparation time for this order. Please allow an additional 15–25 minutes on top of the standard delivery time. We will keep you updated.
          </div>
        </div>
      )}
      {!scheduledTime ? (
        <button onClick={onRequestSchedule}
          style={{ width:'100%',marginBottom:10,padding:'11px 14px',background:'rgba(43,122,139,0.1)',border:'0.5px solid rgba(43,122,139,0.3)',borderRadius:12,color:'rgba(126,232,200,0.8)',fontSize:13,cursor:'pointer',fontFamily:'DM Sans,sans-serif',textAlign:'left',display:'flex',alignItems:'center',gap:8 }}>
          <span>📅</span>
          <div><div style={{fontWeight:600,fontSize:13}}>Schedule for later</div><div style={{fontSize:11,opacity:0.6,marginTop:1}}>Any slot, today or up to 2 weeks ahead</div></div>
        </button>
      ) : (
        <div style={{ marginBottom:10,padding:'10px 14px',background:'rgba(43,122,139,0.15)',border:'0.5px solid rgba(43,122,139,0.4)',borderRadius:12,display:'flex',justifyContent:'space-between',alignItems:'center' }}>
          <div style={{fontSize:12,color:'#7EE8C8',display:'flex',alignItems:'center',gap:6}}>📅 <span>{scheduledTime}</span></div>
          <button onClick={onClearSchedule} style={{background:'none',border:'none',color:'rgba(255,255,255,0.4)',cursor:'pointer',fontSize:16}}>×</button>
        </div>
      )}
      <button onClick={onCheckout} disabled={belowMin}
        style={{ width:'100%',padding:'16px',background:belowMin?'rgba(255,255,255,0.1)':'#C4683A',color:belowMin?'rgba(255,255,255,0.3)':'white',border:'none',borderRadius:14,fontFamily:'DM Sans,sans-serif',fontSize:15,fontWeight:500,cursor:belowMin?'not-allowed':'pointer',boxShadow:belowMin?'none':'0 4px 20px rgba(196,104,58,0.4)',marginBottom:10 }}>
        {belowMin?'Add €'+(MIN-sub).toFixed(2)+' more to checkout →':(t.checkout||'Order now')+' →'}
      </button>
      <ShareBasketButton />
      <button onClick={()=>setShowRecurringSetup(true)}
        style={{ width:'100%',padding:'11px',background:'rgba(43,122,139,0.12)',border:'0.5px solid rgba(43,122,139,0.25)',borderRadius:12,fontFamily:'DM Sans,sans-serif',fontSize:12,color:'rgba(126,232,200,0.8)',cursor:'pointer',marginBottom:8,display:'flex',alignItems:'center',justifyContent:'center',gap:6 }}>
        🔄 Set up recurring order
      </button>
      <button onClick={()=>{ if(window.confirm('Clear your basket?')) cart.clearCart() }}
        style={{ width:'100%',padding:'12px',background:'transparent',border:'0.5px solid rgba(255,255,255,0.15)',borderRadius:12,fontFamily:'DM Sans,sans-serif',fontSize:13,color:'rgba(255,255,255,0.4)',cursor:'pointer' }}>
        🗑 Clear basket
      </button>
    </div>
  )
}

// ── Account ───────────────────────────────────────────────────
function AccountView({ t, onShowHistory, onShowAddresses, onShowEditProfile, onShowLoyalty, onShowReferral, onShowWishlist, onShowNotifications, dark, onToggleDark, onDeleteAccount, onChangeEmail, onChangePassword, onShowFAQ, onShowCredits, onShowChallenges, onShowSupport }) {
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
            { icon:'📲', label:'Enable push alerts',  sub:'Get order updates when app is closed', action:()=>toast('Enable in Notifications settings') },
            { icon:'💬', label:'WhatsApp support', sub:'+34 971 000 000', action:()=>window.open('https://wa.me/34971000000','_blank') },
            { icon:'🌍', label:'Language',         sub:'Change display language',        action:()=>toast('Use the flag in the top-right of the home screen') },
            { icon:'❓', label:'Help & FAQ',       sub:'Delivery, payments and more',   action:onShowFAQ },
            { icon:'💬', label:'Support chat',      sub:'Chat with us about your order',   action:onShowSupport },
            { icon:'🏆', label:'Challenges & Badges',sub:'Earn rewards for every order',   action:onShowChallenges },
            { icon:'💳', label:'Credits & refunds', sub:'View your account credits',        action:onShowCredits },
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
          <LegalLinks style={{ marginTop:16, marginBottom:8 }} />
          <button onClick={()=>{ supabase.auth.signOut(); clear(); clearCart&&clearCart() }}
            style={{ width:'100%',marginTop:8,padding:'13px',background:'rgba(196,104,58,0.12)',border:'0.5px solid rgba(196,104,58,0.3)',borderRadius:12,fontFamily:'DM Sans,sans-serif',fontSize:14,color:'#E8A070',cursor:'pointer' }}>
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
function SearchView({ t, onAssist, onCategorySelect, onDetail, onShowBarcode }) {
  const [query, setQuery] = useState('')
  const [historyVer, setHistoryVer] = useState(0)
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const { addItem } = useCartStore()
  const { prefs: dietPrefs, toggle: toggleDiet } = useDietaryPrefs()
  const searchFilters = useSearchFilters()

  // Debounce query for performance — only search after 180ms idle
  const debouncedQuery = useDebounce(query, 180)

  // Fuzzy + partial match on debounced query
  const rawResults = debouncedQuery.length>1 ? fuzzySearch(debouncedQuery, PRODUCTS) : []
  // Apply filters + sort
  const filteredResults = searchFilters.applyFilters(rawResults)
  const searchInputRef = useSearchFocus(true)

  const isAI = query.length>2 && looksLikeAIQuery(query)

  const handleIsla = () => {
    onAssist(query)
  }

  return (
    <div style={{ padding:'16px 16px 0' }}>
      <div style={{ display:'flex',gap:8,marginBottom:14 }}>
        <div style={{ flex:1,display:'flex',alignItems:'center',background:'rgba(255,255,255,0.1)',borderRadius:12,padding:'10px 14px',gap:8,border:'0.5px solid rgba(255,255,255,0.1)' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input ref={searchInputRef} value={query} onChange={e=>setQuery(e.target.value)}
            onKeyDown={e=>{ if(e.key==='Enter'&&isAI) handleIsla() }}
            placeholder="Search products or ask Isla anything..." style={{ flex:1,border:'none',background:'none',fontFamily:'DM Sans,sans-serif',fontSize:14,color:'white',outline:'none' }}/>
          {query&&<button onClick={()=>setQuery('')} style={{ border:'none',background:'none',cursor:'pointer',color:'rgba(255,255,255,0.4)',fontSize:15,padding:0 }}>✕</button>}
        </div>
        <VoiceSearchButton onResult={q=>setQuery(q)} />
        <ImageSearchButton onResult={p=>{ onDetail&&onDetail(p) }} />
        <button onClick={()=>onShowBarcode&&onShowBarcode()}
          style={{ width:36,height:36,background:'rgba(255,255,255,0.09)',border:'0.5px solid rgba(255,255,255,0.14)',borderRadius:10,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2"><path d="M3 9V5a2 2 0 0 1 2-2h4M3 15v4a2 2 0 0 0 2 2h4M21 9V5a2 2 0 0 0-2-2h-4M21 15v4a2 2 0 0 1-2 2h-4M7 12h10"/></svg>
        </button>
      </div>

      {/* Search filters + sort */}
      <SearchFilterBar filters={searchFilters} onShowPanel={()=>setShowFilterPanel(true)} />
      {/* Feature 8: Dietary filter bar */}
      <div style={{ padding:'0 0 4px' }}>
        <DietaryFilterBar prefs={dietPrefs} onToggle={toggleDiet} />
      </div>
      {/* Filter panel */}
      {showFilterPanel && <SearchFilterPanel filters={searchFilters} onClose={()=>setShowFilterPanel(false)} />}
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
      {debouncedQuery.length>1 && filteredResults.length>0 && (
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
          {filteredResults.map(p=>(
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

    </div>
  )
}

// ── Home view ─────────────────────────────────────────────────
// ── Curated Packs ─────────────────────────────────────────────
const GIRLS_PACK_IDS = ['boat_day_girls','girls_night','pool_slay','girly_day']
const BOYS_PACK_IDS  = ['lads_holiday','gentleman','boat_day_boys','villa_party']

function CuratedPackSection({ title, packIds, onOpenPackage }) {
  const packs = packIds.map(id => PACKAGES.find(p => p.id === id)).filter(Boolean)
  return (
    <div style={{ marginBottom:24 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0 16px', marginBottom:12 }}>
        <div style={{ fontFamily:'DM Serif Display,serif', fontSize:20, color:'white' }}>{title}</div>
        <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', fontFamily:'DM Sans,sans-serif' }}>curated drops</div>
      </div>
      <div style={{ display:'flex', gap:10, overflowX:'auto', padding:'0 16px 4px', scrollbarWidth:'none' }}>
        {packs.map(pack => {
          const preview = pack.preset.slice(0,4).map(id => PRODUCTS.find(p => p.id === id)).filter(Boolean)
          return (
            <div key={pack.id} onClick={() => onOpenPackage(pack.id)}
              style={{ flexShrink:0, width:155, background:'rgba(255,255,255,0.06)', border:'0.5px solid rgba(255,255,255,0.1)', borderRadius:16, overflow:'hidden', cursor:'pointer' }}>
              <div style={{ background:pack.colour, padding:'16px 14px 12px' }}>
                <div style={{ fontSize:28, marginBottom:6 }}>{pack.emoji}</div>
                <div style={{ fontFamily:'DM Serif Display,serif', fontSize:15, color:'white' }}>{pack.label}</div>
              </div>
              <div style={{ padding:'10px 14px 14px' }}>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', fontFamily:'DM Sans,sans-serif', lineHeight:1.4, marginBottom:10 }}>{pack.desc.split(' ').slice(0,8).join(' ')}...</div>
                <div style={{ display:'flex', gap:3, marginBottom:12 }}>
                  {preview.map(p => <span key={p.id} style={{ fontSize:16 }}>{p.emoji}</span>)}
                </div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', fontFamily:'DM Sans,sans-serif' }}>Customise + AI</div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function HomeView({ t, lang, setLang, onCategorySelect, estimatedMins, onAssist, onBest, onNewIn, onPartyNight, onPartyDay, onArrival, onDetail, onReorder, onShowClub, onShowBoat, onShowPreArrival, onShowPoolParty, showMorningKit, dismissMorningKit, loyaltyStamps, unread, onShowNotifs, liveOrderCount, events, weather, onShowDeliveryZone, collections, depot, flash, currency, onToggleCurrency, onShowVillaPresets, homeLoaded, setHomeLoaded, formatPrice, isAfterDark, afterDarkProducts, onShowBeachDelivery, onShowCarDelivery, onShowOccasion, onOpenPackage }) {
  const [searchQuery, setSearchQuery] = useState('')
  const cart = useCartStore()
  const { addItem } = useCartStore()
  const prevItems = cart.previousItems || []
  const orderedCategories = usePersonalisedCategories(prevItems)
  useEffect(()=>{ const t=setTimeout(()=>setHomeLoaded(true),400); return ()=>clearTimeout(t) },[])
  const flashSale = useFlashSale()
  const { pulling, refreshing, onTouchStart, onTouchMove, onTouchEnd } = usePullToRefresh(async () => {
    await new Promise(r => setTimeout(r, 800))
  })
  const countdown = useCountdown(flashSale?.ends_at)
  const { greeting, vibe } = useTimeGreeting()
  const searchResults = searchQuery.length>1 ? PRODUCTS.filter(p=>p.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0,30) : []
  useEffect(()=>{ if(searchQuery.length>2) Analytics.search(searchQuery, searchResults.length) },[searchQuery])

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
            {liveOrderCount > 0 && <LiveOrderCountBadge count={liveOrderCount} />}
            <NotificationBell unread={unread} onClick={()=>setShowNotifCentre(true)} />
            <CurrencyToggle currency={currency} onToggle={onToggleCurrency} />
            <button onClick={onShowDeliveryZone} style={{ background:'rgba(255,255,255,0.12)',border:'0.5px solid rgba(255,255,255,0.18)',borderRadius:20,fontSize:11,padding:'4px 10px',display:'flex',alignItems:'center',gap:5,color:'white',cursor:'pointer' }}>
              <span style={{ width:5,height:5,borderRadius:'50%',background:'#7EE8A2',display:'inline-block',animation:'pulse 1.5s infinite' }}/>Open 24/7
            </button>
            <LangInline />
          </div>
        </div>
        <AddressBar estimatedMins={estimatedMins} />
        {/* Feature 12: Time greeting */}
        <TimeGreetingBanner greeting={greeting} vibe={vibe} />
        {depot && <div style={{ padding:'3px 16px 6px' }}><DepotBadge depot={depot} /></div>}
        <SeasonCountdownBanner />
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
              <div key={p.id}
                onTouchStart={e=>{haptic('light');e.currentTarget.style.transform='scale(0.97)'}}
                onTouchEnd={e=>{e.currentTarget.style.transform='scale(1)'}}
                style={{ background:'rgba(255,255,255,0.07)',border:'0.5px solid rgba(255,255,255,0.1)',borderRadius:14,overflow:'hidden',position:'relative',transition:'transform 0.1s cubic-bezier(0.34,1.56,0.64,1)' }}>
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
      {!searchQuery && !homeLoaded && <HomeSkeletonLoader />}
      {!searchQuery && homeLoaded && (
        <div style={{ paddingBottom:20, paddingTop:4 }}>
          {/* T4-20: After dark mode */}
          <AfterDarkBanner />
          {isAfterDark && afterDarkProducts && (
            <div style={{ marginBottom:22 }}>
              <div style={{ fontFamily:'DM Serif Display,serif', fontSize:20, padding:'0 16px', marginBottom:12, color:'white' }}>🌙 Tonight's picks</div>
              <div style={{ display:'flex', gap:10, overflowX:'auto', padding:'0 16px 4px', scrollbarWidth:'none' }}>
                {afterDarkProducts.map(p=><MiniCard key={p.id} product={p} t={t} onDetail={onDetail} weather={weather}/>)}
              </div>
            </div>
          )}
          {/* Feature 5: Last order shortcut */}
          {prevItems.length > 0 && <LastOrderShortcut onReorder={onReorder} />}
          {prevItems.length > 0 && <SmartReorderButton onReorder={onReorder} />}

          {/* Feature 13: Morning after kit */}
          {showMorningKit && <MorningAfterKitBanner onAddKit={()=>{}} onDismiss={dismissMorningKit} />}
          {/* Feature 9: Your usual order */}
          {prevItems.length > 0 && <YourUsualCard productIds={[]} onAddAll={()=>setView(VIEWS.BASKET)} />}
          {/* POINT 7: Recently viewed */}
          <RecentlyViewedRow onDetail={p=>{trackView(p);setSelectedProduct&&setSelectedProduct(p)}} />
          {/* T2-6: Because you bought X */}
          {prevItems.length > 0 && <BecauseYouBoughtRow previousItems={prevItems} onDetail={p=>{trackView(p);onDetail&&onDetail(p)}} />}

          {prevItems.length>0 && (
            <div style={{ paddingTop:20,marginBottom:22 }}>
              <div style={{ fontFamily:'DM Serif Display,serif',fontSize:20,padding:'0 16px',marginBottom:12,color:'white' }}>🔄 {t.orderAgain}</div>
              <div style={{ display:'flex',gap:10,overflowX:'auto',padding:'0 16px 4px',scrollbarWidth:'none' }}>{prevItems.slice(0,8).map(p=><MiniCard key={p.id} product={p} t={t} onDetail={onDetail} weather={weather}/>)}</div>
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

          {/* Feature 17: Event calendar */}
          <EventCalendarBanner events={events} onDetail={p=>{trackView(p);setSelectedProduct&&setSelectedProduct(p)}} />
          {/* Feature 16: Weather-based product row */}
          <WeatherProductRow weather={weather} onDetail={p=>{trackView(p);setSelectedProduct&&setSelectedProduct(p)}} />
          {/* Occasion collections */}
          <OccasionCollections onSelect={onShowOccasion} />
          <div style={{ paddingTop:prevItems.length?0:20,marginBottom:22 }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0 16px',marginBottom:12 }}>
              <button onClick={onBest} style={{ fontFamily:'DM Serif Display,serif',fontSize:20,color:'white',background:'none',border:'none',cursor:'pointer',padding:0,display:'flex',alignItems:'center',gap:6 }}>🔥 {t.bestSellers}</button>
              <button onClick={onBest} style={{ fontSize:11,color:'rgba(255,255,255,0.5)',background:'none',border:'none',cursor:'pointer',fontFamily:'DM Sans,sans-serif' }}>See all →</button>
            </div>
            <div style={{ display:'flex',gap:10,overflowX:'auto',padding:'0 16px 4px',scrollbarWidth:'none' }}>{BEST_SELLERS.map(p=><MiniCard key={p.id} product={p} t={t} onDetail={onDetail} weather={weather}/>)}</div>
          </div>
          <div style={{ marginBottom:22 }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0 16px',marginBottom:12 }}>
              <button onClick={onNewIn} style={{ fontFamily:'DM Serif Display,serif',fontSize:20,color:'white',background:'none',border:'none',cursor:'pointer',padding:0,display:'flex',alignItems:'center',gap:6 }}>✨ {t.newIn}</button>
              <button onClick={onNewIn} style={{ fontSize:11,color:'rgba(255,255,255,0.5)',background:'none',border:'none',cursor:'pointer',fontFamily:'DM Sans,sans-serif' }}>See all →</button>
            </div>
            <div style={{ display:'flex',gap:10,overflowX:'auto',padding:'0 16px 4px',scrollbarWidth:'none' }}>{NEW_IN.slice(0,10).map(p=><MiniCard key={p.id} product={p} t={t} onDetail={onDetail} weather={weather}/>)}</div>
          </div>
          {/* Feature 11: Staff picks */}
          <StaffPicksRow onDetail={onDetail} />

          {/* ── Bundle deals ─────────────────────── */}
          <div style={{ margin:'0 16px 22px' }}>
            <div style={{ fontFamily:'DM Serif Display,serif',fontSize:20,color:'white',marginBottom:12 }}>{t.bundleDeals||'Bundle deals'}</div>
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

          {/* ── Just Landed in Ibiza ────────────────────────────── */}
          <div style={{ margin:'0 16px 22px',background:'linear-gradient(135deg,rgba(200,168,75,0.15),rgba(196,104,58,0.1))',border:'0.5px solid rgba(200,168,75,0.3)',borderRadius:16,padding:'18px 16px',cursor:'pointer' }}
            onClick={onArrival}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start' }}>
              <div>
                <div style={{ fontSize:22,marginBottom:6 }}>✈️</div>
                <div style={{ fontFamily:'DM Serif Display,serif',fontSize:18,color:'white',marginBottom:4 }}>{t.justLanded||'Just landed in Ibiza?'}</div>
                <div style={{ fontSize:12,color:'rgba(255,255,255,0.55)',lineHeight:1.5,maxWidth:220 }}>Get everything you need delivered in under 30 minutes — drinks, food, sun cream, the works.</div>
              </div>
              <div style={{ fontSize:11,color:'#C8A84B',fontWeight:600,whiteSpace:'nowrap',marginLeft:12,marginTop:4 }}>See packages →</div>
            </div>
          </div>


          {/* ── For the Girls ── */}
          <CuratedPackSection title="💕 For the Girls" packIds={GIRLS_PACK_IDS} onOpenPackage={onOpenPackage} />

          {/* ── For the Boys ── */}
          <CuratedPackSection title="🍻 For the Boys" packIds={BOYS_PACK_IDS} onOpenPackage={onOpenPackage} />

          {/* ── Design Your Experience ─────────────────────── */}
          <div style={{ margin:'4px 16px 22px' }}>
            <div style={{ fontFamily:'DM Serif Display,serif',fontSize:20,color:'white',marginBottom:12 }}>🎯 Design Your Experience</div>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
              <button onClick={onPartyNight}
                style={{ background:'linear-gradient(135deg,rgba(196,104,58,0.35),rgba(139,60,20,0.5))',border:'0.5px solid rgba(196,104,58,0.4)',borderRadius:16,padding:'18px 14px',cursor:'pointer',textAlign:'left' }}>
                <div style={{ fontSize:28,marginBottom:8 }}>🌙</div>
                <div style={{ fontFamily:'DM Serif Display,serif',fontSize:16,color:'white',marginBottom:4 }}>{t.designNight||'Design My Night'}</div>
                <div style={{ fontSize:11,color:'rgba(255,255,255,0.55)',lineHeight:1.4 }}>Club nights, villa parties, pre-drinks</div>
                <div style={{ marginTop:10,fontSize:11,color:'#E8A070',fontWeight:600 }}>AI-powered →</div>
              </button>
              <button onClick={onPartyDay}
                style={{ background:'linear-gradient(135deg,rgba(43,122,139,0.4),rgba(20,80,100,0.5))',border:'0.5px solid rgba(43,122,139,0.4)',borderRadius:16,padding:'18px 14px',cursor:'pointer',textAlign:'left' }}>
                <div style={{ fontSize:28,marginBottom:8 }}>☀️</div>
                <div style={{ fontFamily:'DM Serif Display,serif',fontSize:16,color:'white',marginBottom:4 }}>{t.designDay||'Design My Day'}</div>
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
              <div style={{ fontFamily:'DM Serif Display,serif', fontSize:14, color:'white', marginBottom:2 }}>{t.clubDelivery||'Club delivery'}</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.5)' }}>Pacha, Ushuaia, DC-10, Hi Ibiza, Unvrs, Eden, Amnesia, Playa Soleil...</div>
            </button>
            <button onClick={onShowBoat}
              style={{ padding:'14px', background:'linear-gradient(135deg,rgba(20,80,140,0.5),rgba(10,50,100,0.5))', border:'0.5px solid rgba(43,122,200,0.4)', borderRadius:14, cursor:'pointer', textAlign:'left' }}>
              <div style={{ fontSize:22, marginBottom:4 }}>⛵</div>
              <div style={{ fontFamily:'DM Serif Display,serif', fontSize:14, color:'white', marginBottom:2 }}>{t.boatDelivery||'Boat delivery'}</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.5)' }}>Marina, berth, superyacht</div>
            </button>
            <button onClick={onShowPreArrival}
              style={{ padding:'14px', background:'linear-gradient(135deg,rgba(200,168,75,0.25),rgba(196,104,58,0.2))', border:'0.5px solid rgba(200,168,75,0.35)', borderRadius:14, cursor:'pointer', textAlign:'left' }}>
              <div style={{ fontSize:22, marginBottom:4 }}>✈️</div>
              <div style={{ fontFamily:'DM Serif Display,serif', fontSize:14, color:'white', marginBottom:2 }}>{t.preArrival||'Pre-arrival'}</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.5)' }}>Order before you land</div>
            </button>
            <button onClick={onShowPoolParty}
              style={{ padding:'14px', background:'linear-gradient(135deg,rgba(43,122,139,0.4),rgba(20,80,100,0.5))', border:'0.5px solid rgba(43,122,139,0.4)', borderRadius:14, cursor:'pointer', textAlign:'left' }}>
              <div style={{ fontSize:22, marginBottom:4 }}>🏊</div>
              <div style={{ fontFamily:'DM Serif Display,serif', fontSize:14, color:'white', marginBottom:2 }}>{t.poolPartyMode||'Pool party mode'}</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.5)' }}>Bulk ordering for groups</div>
            </button>
            <button onClick={onShowBeachDelivery}
              style={{ padding:'14px', background:'linear-gradient(135deg,rgba(196,104,58,0.3),rgba(139,60,20,0.4))', border:'0.5px solid rgba(196,104,58,0.35)', borderRadius:14, cursor:'pointer', textAlign:'left' }}>
              <div style={{ fontSize:22, marginBottom:4 }}>🏖️</div>
              <div style={{ fontFamily:'DM Serif Display,serif', fontSize:14, color:'white', marginBottom:2 }}>{t.beachDelivery||'Beach delivery'}</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.5)' }}>Salinas, Bossa, Cala...</div>
            </button>
            <button onClick={onShowCarDelivery}
              style={{ padding:'14px', background:'linear-gradient(135deg,rgba(43,122,139,0.3),rgba(13,70,90,0.4))', border:'0.5px solid rgba(43,122,139,0.35)', borderRadius:14, cursor:'pointer', textAlign:'left' }}>
              <div style={{ fontSize:22, marginBottom:4 }}>🚗</div>
              <div style={{ fontFamily:'DM Serif Display,serif', fontSize:14, color:'white', marginBottom:2 }}>{t.carDelivery||'Car delivery'}</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.5)' }}>Order to your parked car</div>
            </button>
          </div>

          {/* ── Villa presets — placed here, well below sticky nav ── */}
          <div style={{ margin:'0 16px 16px' }}>
            <button onClick={onShowVillaPresets}
              style={{ width:'100%', background:'linear-gradient(135deg,rgba(43,122,139,0.18),rgba(13,53,69,0.25))', border:'0.5px solid rgba(43,122,139,0.3)', borderRadius:16, padding:'16px', cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ fontSize:34, flexShrink:0 }}>🏡</div>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:'DM Serif Display,serif', fontSize:17, color:'white', marginBottom:3 }}>Villa presets</div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', lineHeight:1.5 }}>AI-powered orders, starter packs and saved presets for villa changeovers</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>

          {/* ── One horizontal scroll row per category ─────────── */}
          {orderedCategories.map(cat => {
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
                  {catProducts.map(p=><MiniCard key={p.id} product={p} t={t} onDetail={onDetail} weather={weather}/>)}
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
function CustomerAppInner() {
  const [view, setView]               = useState(VIEWS.SPLASH)
  const [assistQuery, setAssistQuery] = useState('')
  // Lang comes from LangContext — single source of truth
  // LangContext handles detection, localStorage, and Claude translation
  const { lang, setLang, t: tCtx, translating: isTranslating } = useLang()
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
  const { show: showAppRatingPrompt, dismiss: dismissRatingPrompt } = useAppRatingPrompt()
  const [showRatingPrompt, setShowRatingPrompt] = useState(false)
  const [homeLoaded, setHomeLoaded] = useState(false)
  const { onTouchStart: swipeBackStart, onTouchEnd: swipeBackEnd } = useSwipeBack(()=>setView(VIEWS.ACCOUNT))
  const homeScrollRef    = useRef(0)
  const accountScrollRef = useRef(0)
  // Save scroll position when leaving home, restore when returning
  const goBack = (dest) => {
    const saved = dest === VIEWS.HOME ? homeScrollRef.current : accountScrollRef.current
    setView(dest)
    requestAnimationFrame(()=>{ requestAnimationFrame(()=>{ window.scrollTo({top:saved,behavior:'instant'}) }) })
  }
  const realtimeDriverLoc = useRealtimeDriverLocation(activeOrder?.driver_id, !!(activeOrder?.driver_id))
  const [showPushPrompt, setShowPushPrompt] = useState(false)
  const [showSupportChat, setShowSupportChat] = useState(false)
  const [showOrderIssue, setShowOrderIssue] = useState(false)
  const [showDriverRating, setShowDriverRating] = useState(false)
  const [showChallenges, setShowChallenges] = useState(false)
  const [showRecurringSetup, setShowRecurringSetup] = useState(false)
  const surge = useSurgePricing()
  const [showConfetti, setShowConfetti] = useState(false)
  const [showOnboardingFull, setShowOnboardingFull] = useState(false)
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)
  const [occasionId, setOccasionId] = useState(null)
  const [packageId,  setPackageId]  = useState(null)
  const [showExpressSheet, setShowExpressSheet] = useState(false)
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const { eligible: expressEligible, expressData } = useExpressCheckout()
  const [charityEnabled, setCharityEnabled] = useState(false)
  const [carbonEnabled, setCarbonEnabled] = useState(false)
  const { show: showWhatsNew, dismiss: dismissWhatsNew } = useWhatsNew()
  const { fly: flyToCart, Particles: CartParticles } = useFlyToCart()
  const checkOutOfStock = useOutOfStockCheck()
  const birthdayReward = useBirthdayReward()
  const firstOrderDiscount = useFirstOrderDiscount()
  const formatPrice = useFormatPrice()
  const isAfterDark = useAfterDarkMode()
  const afterDarkProducts = getAfterDarkProducts()
  const { show: showOnboarding, finish: finishOnboarding } = useOnboarding()
  const { show: showCookieBanner, accept: acceptCookies, decline: declineCookies } = useCookieConsent()
  const { currency, setCurrency, format: formatCurrencyDisplay } = useCurrency()
  const collections = useCollections()
  const flash = useFlashProducts()
  const depot = useNearestDepot()
  const { notes: itemNotes, setNote: setItemNote, clearNotes: clearItemNotes } = useItemNotes()
  const { saved: savedLater, save: saveForLater, remove: removeFromSaved } = useSaveForLater()
  const { flashing, flash: flashCard } = useAddedFlash()
  const stockMap = useRealtimeStock()
  const { groupToken, create: createGroupOrder } = useGroupOrder()
  const [quickAddProduct, setQuickAddProduct] = useState(null)
  const [compareProducts, setCompareProducts] = useState([])
  const [showPostDeliveryTip, setShowPostDeliveryTip] = useState(false)
  const [showRecurring, setShowRecurring] = useState(false)
  const [showGroupOrder, setShowGroupOrder] = useState(false)
  const [ratingOrder, setRatingOrder] = useState(null)
  const [payLoading, setPayLoading] = useState(false)
  const [corporateBilling, setCorporateBilling] = useState(false)
  const [corporateDetails, setCorporateDetails] = useState({})
  useReferralFromURL()
  useNotificationReorder()
  useAbandonedBasketTracker()
  useWinBackDetection()
  const { tip: driverTipAmount, setTip: setDriverTipAmount } = useCartTip()
  const [showGuestCheckout, setShowGuestCheckout] = useState(false)
  const [guestUser, setGuestUser] = useState(null)
  const [showDeleteAccount, setShowDeleteAccount] = useState(false)
  const [showChangeEmail, setShowChangeEmail] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [showHotelDelivery, setShowHotelDelivery] = useState(false)
  const { user } = useAuthStore()
  useEffect(()=>{
    if(user?.id){const stored=sessionStorage.getItem('isla_referral_code');if(stored)processReferral(user.id)}
  },[user?.id])
  const savedCard = useSavedCard()
  const { notifs, unread, add: addNotif, markRead, markAllRead, clear: clearNotifs } = useNotifications()
  const [showNotifCentre, setShowNotifCentre] = useState(false)
  const [showPreArrival, setShowPreArrival] = useState(false)
  const [showPoolParty, setShowPoolParty] = useState(false)
  const [showBeachDelivery, setShowBeachDelivery] = useState(false)
  const [showCarDelivery, setShowCarDelivery] = useState(false)
  const [giftEnabled, setGiftEnabled] = useState(false)
  const [giftMessage, setGiftMessage] = useState('')
  const [substitution, setSubstitution] = useState('substitute')
  const [loyaltyRedeemed, setLoyaltyRedeemed] = useState(false)
  const loyaltyStamps = useLoyaltyStamps()
  const liveOrderCount = useLiveOrderCount()
  const { events, refresh: refreshEvents } = useIbizaEvents()
  const { checkStreak } = useOrderStreak()
  const { supported: pushSupported, subscribe: subscribePush } = usePushNotifications()
  // Detect returning from Stripe 3DS redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const piId    = params.get('payment_intent')
    const piStatus = params.get('redirect_status')
    if (piId && piStatus === 'succeeded') {
      // Clean URL without reloading
      window.history.replaceState({}, '', window.location.pathname)
      // Restore cart if stored before redirect
      try {
        const saved = localStorage.getItem('isla_pending_order')
        if (saved) {
          const pending = JSON.parse(saved)
          localStorage.removeItem('isla_pending_order')
          // Complete the order
          handlePaymentSuccess(piId)
          return
        }
      } catch {}
      handlePaymentSuccess(piId)
    } else if (piId && piStatus === 'failed') {
      window.history.replaceState({}, '', window.location.pathname)
      toast.error('Payment failed — please try again')
      setView(VIEWS.CHECKOUT)
    }
  }, [])

  useEffect(() => {
    if (typeof registerServiceWorker === 'function') registerServiceWorker()
    setupNotificationActions()
    window.addEventListener('isla:repeat_order', e => {
      if (e.detail?.orderId) toast('Repeat order — add to basket from order history',{icon:'🛵'})
    })
    window.addEventListener('isla:track_order', e => {
      if (activeOrder) setView(VIEWS.TRACKING)
    })
  }, [])
  const [showDeliveryZone, setShowDeliveryZone] = useState(false)
  const [hasError, setHasError] = useState(false)
  const { show: showMorningKit, dismiss: dismissMorningKit } = useMorningAfterKit()
  const { prefs: dietaryPrefs, toggle: toggleDietary } = useDietaryPrefs()
  const [showDietaryFilter, setShowDietaryFilter] = useState(false)
  const cart = useCartStore()
  usePrefetch(view, cart)
  const proximitySuggestion = useProximityVenueSuggestion(cart.deliveryLat, cart.deliveryLng)
  // t comes from LangContext — Claude translates all strings when language changes
  const t = tCtx
  const estimatedMins = cart.deliveryAddress ? 18 : null

  const goToCategory = (key) => { homeScrollRef.current=window.scrollY; setCategoryKey(key); setView(VIEWS.CATEGORY) }

  const handleTabChange = (v) => {
    if (v !== VIEWS.CATEGORY) setCategoryKey(null)
    if (v !== VIEWS.HOME) homeScrollRef.current = window.scrollY
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
    if(activeOrder?.status==='delivered'&&!showRating&&!ratingOrder){
      setTimeout(()=>{ setRatingOrder(activeOrder); setShowRatingPrompt(true) }, 5000)
    }
  },[activeOrder?.status])

  const handleCheckoutStart = async () => {
    Analytics.checkoutStart(cart.getSubtotal())
    await checkOutOfStock()
    if (cart.getItemCount() === 0) return
    if (!user && !guestUser) { setShowGuestCheckout(true); return }
    if (cart.getSubtotal() < 30) { toast.error('Minimum order is €30 — add €'+(30-cart.getSubtotal()).toFixed(2)+' more',{icon:'🛒',duration:3000}); return }
    if (!hasValidAddress(cart)) { toast.error('Please set a delivery address first',{icon:'📍'}); return }
    if (cart.getHasAgeRestricted()) { setView(VIEWS.AGE_VERIFY); return }
    setView(VIEWS.CHECKOUT)
  }

  const handlePaymentSuccess = async (paymentIntentId) => {
    setPayLoading(true)
    try {
      const subToOrder = subscribeToOrder
      const deliveryFee = loyaltyRedeemed ? 0 : 3.50
      const orderTotal = cart.getTotal() - (loyaltyRedeemed ? 3.50 : 0) + (driverTipAmount||0)
      const order = await createOrder({
        customerId:user.id, items:cart.items.map(i=>({productId:i.product.id,quantity:i.quantity,price:i.product.price})),
        deliveryLat:cart.deliveryLat, deliveryLng:cart.deliveryLng, deliveryAddress:cart.deliveryAddress,
        deliveryNotes:cart.deliveryNotes, what3words:cart.what3words, subtotal:cart.getSubtotal(),
        total:orderTotal, paymentIntentId, loyalty_applied:loyaltyRedeemed, delivery_fee:deliveryFee,
      })
      cart.clearCart(); setActiveOrder(order); setView(VIEWS.CONFIRMATION); fireOrderConfirmedHaptic(); setShowConfetti(true); setTimeout(()=>setShowConfetti(false),3500)
      Analytics.checkoutComplete(order.total||cart.getTotal())
      addNotif({ type:'order', title:'Order confirmed! 🛵', body:'Order #'+order.order_number+' is being prepared. Estimated arrival: '+(order.estimated_minutes||18)+' min.' })
      const sub = subToOrder(order.id, u=>{ setActiveOrder(u); if(u.status==='delivered'){toast.success('🎉 Delivered!');addNotif({type:'order',title:'Delivered! 🎉',body:'Your order #'+u.order_number+' has been delivered.'});setTimeout(()=>setShowPostDeliveryTip(true),8000);setTimeout(()=>setShowDriverRating(true),12000);sub.unsubscribe()} })
      if (user?.id) checkStreak(user.id)
      // Show push prompt after order 3+
      try {
        const orderCount = parseInt(localStorage.getItem('isla_order_count')||'0') + 1
        localStorage.setItem('isla_order_count', String(orderCount))
        if (orderCount === 3 && !localStorage.getItem('isla_push_prompted')) {
          setTimeout(()=>setShowPushPrompt(true), 3000)
        }
      } catch {}
      // Feature 4: WhatsApp confirmation
      if (user?.phone) sendWhatsAppConfirmation({ phone:user.phone, orderNumber:order.order_number, items:cart.items, total:order.total?.toFixed(2), etaMins:18 })
    } catch(err){ toast.error('Order failed: '+err.message) }
    setPayLoading(false)
  }

  // ── SPLASH — absolutely no tab bar ───────────────────────
  if (view===VIEWS.SPLASH) {
    return <SplashScreen onEnter={()=>setView(VIEWS.HOME)} />
  }
  if (showOnboarding) {
    return <FirstVisitOnboarding onDone={finishOnboarding} />
  }

  // ── AGE VERIFY ────────────────────────────────────────────
  if (view===VIEWS.AGE_VERIFY) {
    return (
      <div style={{ position:'fixed',inset:0,background:'rgba(10,25,35,0.75)',zIndex:200,display:'flex',alignItems:'flex-end',justifyContent:'center' }} onClick={()=>setView(VIEWS.BASKET)}>
        <div style={{ background:'#FEFCF9',borderRadius:'24px 24px 0 0',padding:'28px 24px 40px',width:'100%',maxWidth:480 }} onClick={e=>e.stopPropagation()}>
          <div style={{ width:36,height:4,background:'rgba(42,35,24,0.15)',borderRadius:2,margin:'0 auto 20px' }}/>
          <DOBAgeGate onVerified={()=>setView(VIEWS.CHECKOUT)} onClose={()=>setView(VIEWS.BASKET)} />
        </div>
      </div>
    )
  }

  // ── CHECKOUT ──────────────────────────────────────────────
  if (view===VIEWS.CHECKOUT) {
    return (
      <div style={{ background:C.bg, minHeight:'100vh', paddingBottom:60, maxWidth:480, margin:'0 auto', boxShadow:'0 0 60px rgba(0,0,0,0.5)' }}>
        <div style={{ padding:'16px 16px 20px' }}>
          <CheckoutProgressBar step={2} />
          <SurgePricingBanner surge={surge} />
          <button onClick={()=>setView(VIEWS.BASKET)}
  style={{ display:'flex',alignItems:'center',gap:6,background:'rgba(255,255,255,0.08)',border:'0.5px solid rgba(255,255,255,0.15)',borderRadius:20,padding:'7px 14px 7px 10px',cursor:'pointer',marginBottom:16 }}>
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
  <span style={{ fontSize:12,color:'white',fontFamily:'DM Sans,sans-serif',fontWeight:500 }}>Back</span>
</button>
          <div style={{ fontFamily:'DM Serif Display,serif',fontSize:26,color:'white',marginBottom:20 }}>{t.checkout}</div>
          <div style={{ fontFamily:'DM Serif Display,serif',fontSize:16,color:'white',marginBottom:12 }}>Delivery location</div>
          {/* Feature 6: Confirmed address display */}
          {cart.deliveryAddress && <ConfirmedAddressCard address={cart.deliveryAddress} onClear={()=>cart.setDeliveryLocation(0,0,null,null)} />}
          {/* Feature 2: Address autocomplete */}
          <AddressAutocomplete placeholder="Search villa, hotel, beach or club..." onSelect={loc=>{ cart.setDeliveryLocation(loc.lat,loc.lng,loc.address,null); toast.success('📍 '+loc.address.slice(0,30)+'...') }} />
          {/* Feature 21: Beach GPS */}
          <BeachGPSButton onSet={loc=>{ cart.setDeliveryLocation(loc.lat,loc.lng,loc.address,null) }} />
          {/* D5: Proximity venue suggestion */}
          {proximitySuggestion && <VenueSuggestionBanner venue={proximitySuggestion} onAccept={()=>{cart.setDeliveryLocation(proximitySuggestion.lat,proximitySuggestion.lng,proximitySuggestion.name+', Ibiza',null);toast.success('Delivery to '+proximitySuggestion.name+' set!')}} onDismiss={()=>{}} />}
          {/* Feature 17: Zone validation */}
          <DeliveryZoneWarning lat={cart.deliveryLat} lng={cart.deliveryLng} />
          <DeliveryZoneBadge lat={cart.deliveryLat} lng={cart.deliveryLng} />
          <div style={{ borderRadius:14,overflow:'hidden',marginBottom:14 }}>
            <DeliveryMap onLocationSet={()=>setLocationSet(true)} />
          </div>
          <div style={{ fontFamily:'DM Serif Display,serif',fontSize:16,color:'white',marginBottom:12 }}>Order summary</div>
          <div style={{ background:'rgba(255,255,255,0.07)',borderRadius:14,padding:16,marginBottom:20 }}>
            {/* Feature 4: Live checkout total — reads from live cart */}
            <LiveCheckoutTotal tipAmount={driverTipAmount} loyaltyRedeemed={loyaltyRedeemed} />
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
          <IbizaTimeNote />

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

          {/* Feature 15: Corporate billing */}
          <CorporateBillingToggle enabled={corporateBilling} onToggle={()=>setCorporateBilling(b=>!b)} details={corporateDetails} onDetailsChange={setCorporateDetails} />
          <div style={{ fontFamily:'DM Serif Display,serif',fontSize:16,color:'white',marginBottom:16 }}>Payment</div>
          {/* Feature 5: Pay button with loading state */}
          <PayButton total={cart.getTotal()+(driverTipAmount||0)} loading={payLoading} onPay={()=>handlePaymentSuccess('manual')} />
          {/* Feature 10: Apple/Google Pay */}
          <NativePayButton total={cart.getTotal()} onSuccess={handlePaymentSuccess} />
          <StripeCheckout
            onSuccess={handlePaymentSuccess}
            onCancel={()=>setView(VIEWS.BASKET)}
            onBeforeRedirect={()=>{
              // Save order context before 3DS redirect takes user away
              try {
                localStorage.setItem('isla_pending_order', JSON.stringify({
                  customerId: user?.id,
                  address: cart.deliveryAddress,
                  total: cart.getTotal(),
                  ts: Date.now()
                }))
              } catch {}
            }}
          />
          {/* Feature 8: Trust badges */}
          <CharityDonationToggle enabled={charityEnabled} onToggle={()=>setCharityEnabled(e=>!e)} />
          <CarbonOffsetToggle enabled={carbonEnabled} onToggle={()=>setCarbonEnabled(e=>!e)} />
          <TrustBadges />
          {/* C5: Cancellation policy */}
          <CancellationPolicyNote />
          {/* C1: Legal links */}
          <LegalLinks style={{ marginTop:12 }} />
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
      <div style={{ background:C.bg, minHeight:'100vh', padding:'24px 16px 100px', maxWidth:480, margin:'0 auto', boxShadow:'0 0 60px rgba(0,0,0,0.5)' }}>
        <div style={{ fontFamily:'DM Serif Display,serif',fontSize:26,color:'white',marginBottom:4 }}>{activeOrder.status==='delivered'?'Delivered! 🎉':'On its way 🛵'}</div>
        <div style={{ fontSize:13,color:'rgba(255,255,255,0.4)',marginBottom:20 }}>#{activeOrder.order_number}</div>
        <AnimatedTrackingSteps steps={STEPS} labels={LABELS} currentStatus={activeOrder.status} />
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
        {/* Feature 15: Share tracking */}
        <TrackingShareButton order={activeOrder} />
        {/* Feature 19: Split the bill (after delivery) */}
        {activeOrder.status==='delivered' && <SplitBillButton order={activeOrder} />}
        {/* Feature 18: Instagram story (after delivery) */}
        {activeOrder.status==='delivered' && <InstagramStoryShare order={activeOrder} />}
        <DeliveryQRCode order={activeOrder} />
        <button onClick={()=>setView(VIEWS.HOME)} style={{ width:'100%',padding:15,background:'#C4683A',color:'white',border:'none',borderRadius:12,fontFamily:'DM Sans,sans-serif',fontSize:15,cursor:'pointer',marginTop:8 }}>Place another order</button>
      </div>
    )
  }

  // ── FULL-SCREEN VIEWS (no tab bar) ──────────────────────────
  if (view===VIEWS.OCCASION && occasionId) return <OccasionPage occasionId={occasionId} onBack={()=>{ setOccasionId(null); goBack(VIEWS.HOME) }} />
  if (view===VIEWS.PACKAGE && packageId) return <PackagePage packageId={packageId} onBack={()=>{ setPackageId(null); goBack(VIEWS.HOME) }} />
  if (view===VIEWS.FAQ)             return <div onTouchStart={swipeBackStart} onTouchEnd={swipeBackEnd} style={{minHeight:'100vh'}}><FAQView onBack={()=>goBack(VIEWS.ACCOUNT)} /></div>
  if (view===VIEWS.VILLA_PRESETS)   return (
    <div style={{ background:'linear-gradient(170deg,#0A2A38,#0D3545)', minHeight:'100vh', paddingBottom:80, overflowY:'auto', maxWidth:480, margin:'0 auto', boxShadow:'0 0 60px rgba(0,0,0,0.5)' }}>
      <div style={{ background:'linear-gradient(135deg,#0D3B4A,#1A5263)', padding:'16px', position:'sticky', top:0, zIndex:50, display:'flex', alignItems:'center', gap:12 }}>
        <button onClick={()=>goBack(VIEWS.HOME)} style={{ display:'flex',alignItems:'center',gap:6,background:'rgba(255,255,255,0.08)',border:'0.5px solid rgba(255,255,255,0.15)',borderRadius:20,padding:'7px 14px 7px 10px',cursor:'pointer' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          <span style={{ fontSize:12,color:'white',fontFamily:'DM Sans,sans-serif',fontWeight:500 }}>Back</span>
        </button>
      </div>
      <VillaPresetsPanel onAddAll={()=>setView(VIEWS.BASKET)} />
    </div>
  )
  if (view===VIEWS.CREDITS)         return <CreditTrackerView onBack={()=>goBack(VIEWS.ACCOUNT)} />
  if (view===VIEWS.ORDER_HISTORY)   return <div onTouchStart={swipeBackStart} onTouchEnd={swipeBackEnd} style={{minHeight:'100vh'}}><OrderHistoryView onBack={()=>goBack(VIEWS.ACCOUNT)} onShowReceipt={o=>setShowReceipt(o)} /></div>
  if (view===VIEWS.SAVED_ADDRESSES) return <SavedAddressesView onBack={()=>goBack(VIEWS.ACCOUNT)} />
  if (view===VIEWS.EDIT_PROFILE)    return <EditProfileView    onBack={()=>goBack(VIEWS.ACCOUNT)} />
  if (view===VIEWS.WISHLIST)        return <WishlistView onBack={()=>goBack(VIEWS.ACCOUNT)} onDetail={p=>{trackView(p);setSelectedProduct(p);setView(VIEWS.HOME)}} />
  if (view===VIEWS.LOYALTY)         return <div onTouchStart={swipeBackStart} onTouchEnd={swipeBackEnd} style={{minHeight:'100vh'}}><LoyaltyCard onBack={()=>goBack(VIEWS.ACCOUNT)} /></div>
  if (view===VIEWS.REFERRAL)        return <ReferralView onBack={()=>goBack(VIEWS.ACCOUNT)} />
  if (view===VIEWS.NOTIFICATIONS)   return <NotificationPrefsView onBack={()=>goBack(VIEWS.ACCOUNT)} />

  // ── MAIN SHELL — tab bar lives here only ──────────────────
  return (
    <div style={{ background:C.bg, minHeight:'100vh' }}>
      {/* Desktop: full-width background with centred 480px column */}

      <div className="isla-shell" style={{ background:C.bg, minHeight:'100vh', paddingBottom:68 }}>

      {view===VIEWS.CATEGORY && categoryKey && (
        <CategoryPage categoryKey={categoryKey} onBack={()=>{ setCategoryKey(null); goBack(VIEWS.HOME) }} onDetail={p=>{trackView(p);Analytics.productView(p);setSelectedProduct(p)}} />
      )}
      {view===VIEWS.CATEGORY && !categoryKey && <CategoriesView onSelect={goToCategory} />}
      {view===VIEWS.HOME && <BirthdayRewardBanner active={birthdayReward} />}
      {view===VIEWS.HOME && activeOrder && activeOrder.status !== 'delivered' && (
        <LiveOrderHomeCard order={activeOrder} etaMins={etaMins} onTrack={()=>setView(VIEWS.TRACKING)} />
      )}
      {view===VIEWS.HOME     && <HomeView t={t} lang={lang} setLang={setLang} onCategorySelect={goToCategory} estimatedMins={estimatedMins} onAssist={(q)=>{ setAssistQuery(q||''); setView(VIEWS.ASSIST) }} onBest={()=>{ homeScrollRef.current=window.scrollY; setView(VIEWS.BEST) }} onNewIn={()=>{ homeScrollRef.current=window.scrollY; setView(VIEWS.NEWIN) }} onPartyNight={()=>{ homeScrollRef.current=window.scrollY; setView(VIEWS.PARTY_NIGHT) }} onPartyDay={()=>{ homeScrollRef.current=window.scrollY; setView(VIEWS.PARTY_DAY) }} onArrival={()=>{ homeScrollRef.current=window.scrollY; setView(VIEWS.ARRIVAL) }} onDetail={p=>{trackView(p);Analytics.productView(p);setSelectedProduct(p)}} onReorder={()=>setView(VIEWS.BASKET)} onShowClub={()=>{ homeScrollRef.current=window.scrollY; setShowClubPresets(true) }} onShowBoat={()=>{ homeScrollRef.current=window.scrollY; setShowBoatMode(true) }} onShowPreArrival={()=>{ homeScrollRef.current=window.scrollY; setShowPreArrival(true) }} onShowPoolParty={()=>{ homeScrollRef.current=window.scrollY; setShowPoolParty(true) }} showMorningKit={showMorningKit} dismissMorningKit={dismissMorningKit} loyaltyStamps={loyaltyStamps} unread={unread} onShowNotifs={()=>setShowNotifCentre(true)} liveOrderCount={liveOrderCount} events={events} weather={weather} onShowDeliveryZone={()=>setShowDeliveryZone(true)} collections={collections} depot={depot} flash={flash} currency={currency} onToggleCurrency={()=>setCurrency(currency==='EUR'?'GBP':'EUR')} onShowVillaPresets={()=>{ homeScrollRef.current=window.scrollY; setView(VIEWS.VILLA_PRESETS); window.scrollTo({top:0,behavior:'instant'}) }} onShowBeachDelivery={()=>{ homeScrollRef.current=window.scrollY; setShowBeachDelivery(true) }} onShowCarDelivery={()=>{ homeScrollRef.current=window.scrollY; setShowCarDelivery(true) }} onShowOccasion={(id)=>{ homeScrollRef.current=window.scrollY; setOccasionId(id); setView(VIEWS.OCCASION) }} onOpenPackage={(id)=>{ homeScrollRef.current=window.scrollY; setPackageId(id); setView(VIEWS.PACKAGE) }} homeLoaded={homeLoaded} setHomeLoaded={setHomeLoaded} formatPrice={formatPrice} isAfterDark={isAfterDark} afterDarkProducts={afterDarkProducts} />}
      {view===VIEWS.SEARCH   && <SearchView t={t} onAssist={(q)=>{ setAssistQuery(q); setView(VIEWS.ASSIST) }} onCategorySelect={goToCategory} onDetail={p=>{trackView(p);Analytics.productView(p);setSelectedProduct(p)}} onShowBarcode={()=>setShowBarcodeScanner(true)} />}
      {view===VIEWS.BASKET && (
        <ExpressCheckoutBar
          onExpress={()=>setShowExpressSheet(true)}
          onNormal={handleCheckoutStart}
        />
      )}
      {view===VIEWS.BASKET   && <BasketView t={t} onCheckout={handleCheckoutStart} onBack={()=>goBack(VIEWS.HOME)} scheduledTime={scheduledDelivery?.label} onRequestSchedule={()=>setShowSchedule(true)} onClearSchedule={()=>setScheduledDelivery(null)} driverTipAmount={driverTipAmount} loyaltyRedeemed={loyaltyRedeemed} setLoyaltyRedeemed={setLoyaltyRedeemed} itemNotes={itemNotes} setItemNote={setItemNote} groupToken={groupToken} createGroupOrder={createGroupOrder} savedLater={savedLater} removeFromSaved={removeFromSaved} firstOrderDiscount={firstOrderDiscount} />}
      {view===VIEWS.ACCOUNT  && <FadeIn><AccountView t={t} onShowHistory={()=>{ accountScrollRef.current=window.scrollY; setView(VIEWS.ORDER_HISTORY) }} onShowAddresses={()=>{ accountScrollRef.current=window.scrollY; setView(VIEWS.SAVED_ADDRESSES) }} onShowEditProfile={()=>{ accountScrollRef.current=window.scrollY; setView(VIEWS.EDIT_PROFILE) }} onShowLoyalty={()=>{ accountScrollRef.current=window.scrollY; setView(VIEWS.LOYALTY) }} onShowReferral={()=>{ accountScrollRef.current=window.scrollY; setView(VIEWS.REFERRAL) }} onShowWishlist={()=>{ accountScrollRef.current=window.scrollY; setView(VIEWS.WISHLIST) }} onShowNotifications={()=>{ accountScrollRef.current=window.scrollY; setView(VIEWS.NOTIFICATIONS) }} dark={dark} onToggleDark={toggleDark} onDeleteAccount={()=>setShowDeleteAccount(true)} onShowChallenges={()=>setShowChallenges(true)} onShowSupport={()=>setShowSupportChat(true)} onChangeEmail={()=>setShowChangeEmail(true)} onChangePassword={()=>setShowChangePassword(true)} onShowFAQ={()=>{ accountScrollRef.current=window.scrollY; setView(VIEWS.FAQ) }} onShowCredits={()=>{ accountScrollRef.current=window.scrollY; setView(VIEWS.CREDITS) }} /></FadeIn>}
      {view===VIEWS.ASSIST   && <AssistBot initialQuery={assistQuery} onClose={()=>{ setAssistQuery(''); goBack(VIEWS.HOME) }} />}
      {view===VIEWS.CONCIERGE && <Concierge onBack={()=>goBack(VIEWS.HOME)} />}
      {view===VIEWS.PARTY_NIGHT && <PartyBuilder initialType="design_night" onBack={()=>goBack(VIEWS.HOME)} />}
      {view===VIEWS.PARTY_DAY   && <PartyBuilder initialType="design_day"   onBack={()=>goBack(VIEWS.HOME)} />}
      {view===VIEWS.ARRIVAL     && <ArrivalPackage onBack={()=>goBack(VIEWS.HOME)} />}
      {view===VIEWS.BEST     && <AllProductsPage title={'🔥 Best Sellers'} products={BEST_SELLERS} onBack={()=>goBack(VIEWS.HOME)} onDetail={p=>{trackView(p);Analytics.productView(p);setSelectedProduct(p)}} />}
      {view===VIEWS.NEWIN   && <AllProductsPage title={'✨ New In'} products={NEW_IN} onBack={()=>goBack(VIEWS.HOME)} onDetail={p=>{trackView(p);Analytics.productView(p);setSelectedProduct(p)}} />}

      {/* Floating cart bar on home only — Feature 7: press state */}
      {view===VIEWS.HOME && <FloatingBasketBar itemCount={cart.getItemCount()} subtotal={cart.getSubtotal()} onTap={()=>{haptic('medium');setView(VIEWS.BASKET)}} t={t} />}

      {/* Ambient music player — shows above tab bar when music enabled in ops */}
      {view !== VIEWS.SPLASH && view !== VIEWS.CHECKOUT && view !== VIEWS.TRACKING && view !== VIEWS.CONFIRMATION && <IslaPlayer />}

      {/* Tab bar — ONLY in the main shell, never on splash/checkout/tracking */}
      <TabBar view={view} setView={handleTabChange} cartCount={cart.getItemCount()} />

      {/* NEW: Scheduled delivery */}
      {showSchedule && <ScheduledDeliverySheet onClose={()=>setShowSchedule(false)} onSchedule={s=>setScheduledDelivery(s)} />}
      {/* NEW: W3W */}
      {showW3W && <W3WPicker onClose={()=>setShowW3W(false)} onSelect={r=>{ cart.setDeliveryLocation(r.lat,r.lng,'///'+r.words,'///'+r.words); toast.success('///'+r.words+' set!') }} />}
      {/* NEW: Driver chat */}
      {showDriverChat && activeOrder && <DriverChat order={activeOrder} onClose={()=>setShowDriverChat(false)} />}
      {/* NEW: Order receipt */}
      {showReceipt && <OrderReceiptSheet order={showReceipt} lang={lang} onClose={()=>setShowReceipt(null)} />}
      {/* POINT 1: Product detail sheet */}
      {selectedProduct && <ProductDetailSheet product={selectedProduct} onClose={()=>setSelectedProduct(null)} />}
      {/* POINT 5: Rating sheet */}
      {showRating && <RatingSheet order={showRating} onClose={()=>setShowRating(null)} />}
      {/* POINT 6: Report issue */}
      {showIssue && <ReportIssueSheet order={showIssue} onClose={()=>setShowIssue(null)} />}
      {/* POINT 15: PWA install */}
      <PWAInstallPrompt />
      {showCarDelivery && <CarDeliverySheet onClose={()=>setShowCarDelivery(false)} onSet={loc=>{ cart.setDeliveryLocation(loc.lat,loc.lng,loc.address,null); setShowCarDelivery(false); toast.success('🚗 Delivering to your car!') }} />}
      {showBeachDelivery && <BeachDeliverySheet onClose={()=>setShowBeachDelivery(false)} onSet={loc=>{ cart.setDeliveryLocation(loc.lat,loc.lng,loc.address,null); setShowBeachDelivery(false); toast.success('📍 '+loc.address) }} />}
      {/* Post-delivery tip */}
      {showPostDeliveryTip && activeOrder && <PostDeliveryTipSheet order={activeOrder} driverName={null} onClose={()=>setShowPostDeliveryTip(false)} />}
      {/* Quick-add sheet */}
      {quickAddProduct && <QuickAddSheet product={quickAddProduct} onClose={()=>setQuickAddProduct(null)} />}
      {/* Product comparison */}
      {compareProducts.length>=2 && <ProductCompareSheet products={compareProducts} onClose={()=>setCompareProducts([])} />}
      {/* Recurring order */}
      {showRecurring && <RecurringOrderSheet cart={cart} onClose={()=>setShowRecurring(false)} onSchedule={()=>{}} />}
      {/* C2: Cookie consent */}
      <ReferralDeepLinkHandler />
      <ConfettiCelebration active={showConfetti} />
      <CartParticles />
      {showCookieBanner && <CookieConsentBanner onAccept={acceptCookies} onDecline={declineCookies} />}
      {/* T2-10: Push notification prompt */}
      {showWhatsNew && <WhatsNewModal onClose={dismissWhatsNew} />}
      {showPushPrompt && <PushNotificationPrompt
        onAccept={()=>{
          try{localStorage.setItem('isla_push_prompted','1')}catch{}
          setShowPushPrompt(false)
          if(typeof requestPushPermission==='function') requestPushPermission()
          toast.success('Notifications enabled! 🔔')
        }}
        onDismiss={()=>{ try{localStorage.setItem('isla_push_prompted','1')}catch{}; setShowPushPrompt(false) }}
      />}
      {/* B10: Rating prompt with Rate later */}
      {showRatingPrompt && ratingOrder && <RatingPromptSheet order={ratingOrder} onRate={()=>{ setShowRatingPrompt(false); setShowRating(ratingOrder) }} onLater={()=>setShowRatingPrompt(false)} onClose={()=>setShowRatingPrompt(false)} />}
      {/* Feature 16: Offline banner */}
      <OfflineBanner />
      <NetworkErrorBanner />
      {/* Feature 14: Delivery zone */}
      {showDeliveryZone && <DeliveryZoneInfo onClose={()=>setShowDeliveryZone(false)} />}
      {/* Feature 3: Notification centre */}
      {showNotifCentre && <NotificationCentre notifs={notifs} onMarkRead={markRead} onMarkAll={markAllRead} onClear={clearNotifs} onClose={()=>setShowNotifCentre(false)} />}
      {/* Push notification opt-in prompt (shown once) */}
      {/* Feature 14: Pre-arrival order */}
      {showPreArrival && <PreArrivalSheet onClose={()=>setShowPreArrival(false)} onSchedule={s=>{ cart.setDeliveryNotes&&cart.setDeliveryNotes('PRE-ARRIVAL: '+s.villa+' at '+s.arrivalTime+' on '+s.arrivalDate+(s.flightNum?' flight '+s.flightNum:'')); toast.success('Pre-arrival order scheduled!') }} />}
      {/* Feature 15: Pool party mode */}
      {showPoolParty && <PoolPartyMode onClose={()=>setShowPoolParty(false)} onAddAll={()=>setView(VIEWS.BASKET)} />}
      {showBarcodeScanner && <BarcodeScanner onResult={p=>{ useCartStore.getState().addItem(p); toast.success(p.emoji+' Added via barcode!',{duration:1500}); setShowBarcodeScanner(false) }} onClose={()=>setShowBarcodeScanner(false)} />}
      {showExpressSheet && expressData && (
        <ExpressCheckoutSheet
          expressData={expressData}
          total={cart.getTotal()+(driverTipAmount||0)}
          onConfirm={async()=>{ setShowExpressSheet(false); await handlePaymentSuccess('express') }}
          onClose={()=>setShowExpressSheet(false)}
        />
      )}
      {showSupportChat && <SupportChatWidget activeOrder={activeOrder} onClose={()=>setShowSupportChat(false)} />}
      {showOrderIssue && activeOrder && <OrderIssueSheet order={activeOrder} onClose={()=>setShowOrderIssue(false)} />}
      {showDriverRating && activeOrder?.driver_id && <DriverRatingSheet order={activeOrder} onClose={()=>setShowDriverRating(false)} />}
      {showChallenges && <ChallengesBadgesView onClose={()=>setShowChallenges(false)} />}
      {showRecurringSetup && <RecurringOrderSetup cart={cart} onClose={()=>setShowRecurringSetup(false)} onSchedule={()=>{}} />}
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
      {showAppRatingPrompt && <AppRatingPrompt onDismiss={dismissRatingPrompt} />}
      {/* Feature 15: Club presets */}
      {showClubPresets && <ClubPresetsSheet onClose={()=>setShowClubPresets(false)} onSelect={club=>{ if(cart.setDeliveryLocation) cart.setDeliveryLocation(club.lat,club.lng,club.name+', Ibiza',null); toast.success(club.name+' set as delivery location!') }} />}
      {/* Feature 16: Boat delivery */}
      {showBoatMode && <BoatDeliverySheet onClose={()=>setShowBoatMode(false)} onConfirm={details=>{ if(cart.setDeliveryNotes) cart.setDeliveryNotes(details.notes) }} />}

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}} @keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}} @keyframes shimmer{0%,100%{opacity:1}50%{opacity:0.55}} @keyframes spin{to{transform:rotate(360deg)}} @keyframes gentleFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}} @keyframes badgeBounce{0%{transform:scale(1)}40%{transform:scale(1.5)}70%{transform:scale(0.9)}100%{transform:scale(1)}}`}</style>
      </div>
    </div>
  )
}

export default function CustomerApp() {
  return (
    <AppErrorBoundary>
      <style>{`
        body { margin:0; background: linear-gradient(135deg,#061820 0%,#0A2A38 50%,#0D3545 100%) !important; }
        @media(min-width:520px) {
          body { min-height:100vh; }
          #root { display:flex; justify-content:center; min-height:100vh; background: linear-gradient(135deg,#061820 0%,#0A2A38 50%,#0D3545 100%); }
          .isla-shell { max-width:480px; width:100%; position:relative; box-shadow:0 0 80px rgba(0,0,0,0.6); }
        }
      `}</style>
      <CustomerAppInner />
    </AppErrorBoundary>
  )
}
