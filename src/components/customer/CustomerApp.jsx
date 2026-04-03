import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { useCartStore, useAuthStore } from '../../lib/store'
import { PRODUCTS, CATEGORIES, BEST_SELLERS, NEW_IN } from '../../lib/products'
import { LANGUAGES, useT } from '../../i18n/translations'
import AgeVerification from './AgeVerification'
import StripeCheckout from './StripeCheckout'
import DeliveryMap from './DeliveryMap'
import AddressBar from './AddressBar'
import AssistBot from './AssistBot'
import CategoryPage from './CategoryPage'
import ProductImage from '../shared/ProductImage'
import { createOrder, subscribeToOrder } from '../../lib/supabase'

const VIEWS = { SPLASH:'splash', HOME:'home', CATEGORY:'category', SEARCH:'search', BASKET:'basket', ACCOUNT:'account', AGE_VERIFY:'age_verify', CHECKOUT:'checkout', TRACKING:'tracking' }

// ── Colours ───────────────────────────────────────────────────
const DAY = {
  // Warm Ibiza daytime: sandy amber sky → terracotta horizon
  bg:       'linear-gradient(170deg,#F5C97A 0%,#E8A855 25%,#D4784A 55%,#B85535 80%,#8B3520 100%)',
  header:   'linear-gradient(135deg,#C4683A 0%,#A0451F 100%)',
  card:     'rgba(255,255,255,0.82)',
  cardBorder:'rgba(255,255,255,0.6)',
  text:     '#2A1208',
  textMuted:'rgba(42,18,8,0.55)',
  tabBg:    'rgba(42,18,8,0.92)',
  accent:   '#C4683A',
  accentLight:'#F0DDD3',
}

// ── Fullscreen Splash (NO tab bar) ────────────────────────────
function SplashScreen({ onEnter }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { setTimeout(() => setVisible(true), 80) }, [])
  return (
    <div style={{ position:'fixed', inset:0, overflow:'hidden' }}>
      {/* Brand image full bleed */}
      <img src="/splash.png" alt="Isla Drop" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', objectPosition:'center top' }} />
      {/* Warm daytime gradient overlay — brighter than before */}
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom,rgba(245,180,80,0.12) 0%,rgba(210,110,50,0.08) 35%,rgba(140,50,20,0.55) 68%,rgba(80,20,5,0.88) 100%)' }} />

      {/* No tab bar here — content sits at bottom */}
      <div style={{
        position:'absolute', bottom:0, left:0, right:0, padding:'0 28px 64px',
        opacity:visible?1:0, transform:visible?'translateY(0)':'translateY(22px)',
        transition:'all 0.9s cubic-bezier(0.34,1.1,0.64,1)',
      }}>
        <div style={{ fontFamily:'DM Serif Display,serif', fontSize:58, color:'white', lineHeight:1, letterSpacing:'-1.5px', marginBottom:6, textShadow:'0 3px 20px rgba(0,0,0,0.35)' }}>
          Isla Drop
        </div>
        <div style={{ fontSize:12, color:'rgba(255,255,255,0.72)', letterSpacing:'3.5px', textTransform:'uppercase', marginBottom:5 }}>
          24/7 Delivery · Ibiza
        </div>
        <div style={{ fontSize:14, color:'rgba(255,255,255,0.5)', marginBottom:40 }}>
          Drinks · Snacks · Tobacco
        </div>
        <button
          onClick={onEnter}
          style={{ width:'100%', padding:'18px', background:'#C4683A', color:'white', border:'none', borderRadius:16, fontFamily:'DM Sans,sans-serif', fontSize:17, fontWeight:500, cursor:'pointer', letterSpacing:'0.2px', boxShadow:'0 8px 32px rgba(196,104,58,0.6)', marginBottom:14 }}
          onMouseDown={e=>e.currentTarget.style.transform='scale(0.98)'}
          onMouseUp={e=>e.currentTarget.style.transform='scale(1)'}
        >
          Order Now
        </button>
        <div style={{ textAlign:'center', fontSize:12, color:'rgba(255,255,255,0.32)' }}>
          Anytime. Anywhere. Ibiza.
        </div>
      </div>
    </div>
  )
}

// ── Language Picker ───────────────────────────────────────────
function LanguagePicker({ lang, setLang }) {
  const [open, setOpen] = useState(false)
  const current = LANGUAGES.find(l=>l.code===lang)||LANGUAGES[0]
  return (
    <div style={{ position:'relative' }}>
      <button onClick={()=>setOpen(o=>!o)} style={{ background:'rgba(255,255,255,0.18)', border:'0.5px solid rgba(255,255,255,0.3)', borderRadius:20, padding:'5px 11px', color:'white', fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', gap:5, fontFamily:'DM Sans,sans-serif' }}>
        <span style={{ fontSize:14 }}>{current.flag}</span>{current.code.toUpperCase()}
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

// ── Mini product card ─────────────────────────────────────────
function MiniCard({ product, t }) {
  const qty = useCartStore(s=>s.items.find(i=>i.product.id===product.id)?.quantity??0)
  const { addItem, updateQuantity } = useCartStore()
  return (
    <div style={{ background:DAY.card, border:`0.5px solid ${DAY.cardBorder}`, borderRadius:14, overflow:'hidden', minWidth:134, maxWidth:134, flexShrink:0, position:'relative', boxShadow:'0 2px 12px rgba(42,18,8,0.08)' }}>
      <div style={{ position:'relative' }}>
        <ProductImage productId={product.id} emoji={product.emoji} category={product.category} alt={product.name} size="mini" style={{ height:100 }} />
        {qty===0
          ? <button onClick={()=>{addItem(product);toast.success(product.emoji+' Added!',{duration:900})}} style={{ position:'absolute',top:7,right:7,width:28,height:28,background:'#C4683A',border:'2px solid white',borderRadius:'50%',color:'white',fontSize:18,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',boxShadow:'0 2px 8px rgba(0,0,0,0.2)',lineHeight:1,fontWeight:400 }}>+</button>
          : <div style={{ position:'absolute',top:6,right:6,display:'flex',alignItems:'center',gap:3,background:'rgba(255,255,255,0.96)',borderRadius:20,padding:'2px 7px',boxShadow:'0 1px 6px rgba(0,0,0,0.14)' }}>
              <button onClick={()=>updateQuantity(product.id,qty-1)} style={{ width:18,height:18,background:'#E8D8C8',border:'none',borderRadius:'50%',cursor:'pointer',fontSize:12,display:'flex',alignItems:'center',justifyContent:'center',color:DAY.text }}>−</button>
              <span style={{ fontSize:11,fontWeight:500,minWidth:12,textAlign:'center',color:DAY.text }}>{qty}</span>
              <button onClick={()=>updateQuantity(product.id,qty+1)} style={{ width:18,height:18,background:'#C4683A',border:'none',borderRadius:'50%',cursor:'pointer',fontSize:12,color:'white',display:'flex',alignItems:'center',justifyContent:'center' }}>+</button>
            </div>
        }
      </div>
      <div style={{ padding:'8px 10px 10px' }}>
        <div style={{ fontSize:11, fontWeight:500, color:DAY.text, lineHeight:1.3, height:28, overflow:'hidden', marginBottom:3 }}>{product.name}</div>
        <div style={{ fontSize:13, fontWeight:500, color:'#C4683A' }}>€{product.price.toFixed(2)}</div>
      </div>
    </div>
  )
}

// ── Tab Bar (only shown inside the app) ──────────────────────
function TabBar({ view, setView, cartCount }) {
  const tabs = [
    { id:VIEWS.HOME,     label:'Home',       d:'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', isPath:true },
    { id:VIEWS.CATEGORY, label:'Categories', d:'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z', isPath:true },
    { id:VIEWS.BASKET,   label:'Basket',     d:'M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z', isPath:true, badge:cartCount },
    { id:VIEWS.SEARCH,   label:'Search',     isSearch:true },
    { id:VIEWS.ACCOUNT,  label:'Account',    d:'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z', isPath:true },
  ]
  return (
    <div style={{ position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:480, display:'flex', background:DAY.tabBg, backdropFilter:'blur(14px)', borderTop:'0.5px solid rgba(255,210,150,0.1)', zIndex:100, paddingBottom:'env(safe-area-inset-bottom,0px)' }}>
      {tabs.map(tab=>{
        const active = view===tab.id
        return (
          <button key={tab.id} onClick={()=>setView(tab.id)}
            style={{ flex:1, padding:'11px 4px 9px', border:'none', background:'none', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:3, fontFamily:'DM Sans,sans-serif', fontSize:10, color:active?'#F5C97A':'rgba(255,220,160,0.4)', fontWeight:active?500:400, position:'relative', transition:'color 0.15s' }}>
            <div style={{ position:'relative' }}>
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active?2:1.7}>
                {tab.isSearch
                  ? <><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></>
                  : <path d={tab.d}/>
                }
              </svg>
              {tab.badge>0 && <span style={{ position:'absolute',top:-5,right:-7,background:'#C4683A',color:'white',borderRadius:'50%',width:16,height:16,fontSize:9,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:600,border:'1.5px solid rgba(42,18,8,0.9)' }}>{tab.badge>9?'9+':tab.badge}</span>}
            </div>
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

// ── Basket View ───────────────────────────────────────────────
function BasketView({ t, onCheckout }) {
  const cart = useCartStore()
  const { updateQuantity } = useCartStore()
  if (cart.itemCount===0) return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:40, minHeight:'60vh' }}>
      <div style={{ fontSize:52, marginBottom:14 }}>🛒</div>
      <div style={{ fontFamily:'DM Serif Display,serif', fontSize:22, color:DAY.text, marginBottom:6 }}>Your basket is empty</div>
      <div style={{ fontSize:14, color:DAY.textMuted }}>Add something delicious</div>
    </div>
  )
  return (
    <div style={{ padding:'16px 16px 20px' }}>
      <div style={{ fontFamily:'DM Serif Display,serif', fontSize:26, color:DAY.text, marginBottom:16 }}>{t.viewCart}</div>
      {cart.items.map(({product,quantity})=>(
        <div key={product.id} style={{ display:'flex', gap:12, alignItems:'center', padding:'12px 0', borderBottom:`0.5px solid rgba(42,18,8,0.08)` }}>
          <div style={{ width:52,height:52,borderRadius:10,overflow:'hidden',flexShrink:0 }}>
            <ProductImage productId={product.id} emoji={product.emoji} category={product.category} alt={product.name} size="list" style={{ height:52,width:52 }} />
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:13,fontWeight:500,color:DAY.text,lineHeight:1.3,marginBottom:3 }}>{product.name}</div>
            <div style={{ fontSize:13,color:'#C4683A',fontWeight:500 }}>€{(product.price*quantity).toFixed(2)}</div>
          </div>
          <div style={{ display:'flex',alignItems:'center',gap:8 }}>
            <button onClick={()=>updateQuantity(product.id,quantity-1)} style={{ width:26,height:26,background:'rgba(42,18,8,0.08)',border:'none',borderRadius:'50%',cursor:'pointer',fontSize:14,color:DAY.text,display:'flex',alignItems:'center',justifyContent:'center' }}>−</button>
            <span style={{ fontSize:13,fontWeight:500,color:DAY.text,minWidth:16,textAlign:'center' }}>{quantity}</span>
            <button onClick={()=>updateQuantity(product.id,quantity+1)} style={{ width:26,height:26,background:'rgba(42,18,8,0.08)',border:'none',borderRadius:'50%',cursor:'pointer',fontSize:14,color:DAY.text,display:'flex',alignItems:'center',justifyContent:'center' }}>+</button>
          </div>
        </div>
      ))}
      <div style={{ marginTop:16,padding:'14px 0',borderTop:`0.5px solid rgba(42,18,8,0.1)` }}>
        <div style={{ display:'flex',justifyContent:'space-between',fontSize:13,color:DAY.textMuted,marginBottom:5 }}><span>Subtotal</span><span>€{cart.subtotal.toFixed(2)}</span></div>
        <div style={{ display:'flex',justifyContent:'space-between',fontSize:13,color:DAY.textMuted,marginBottom:10 }}><span>{t.delivery}</span><span>€3.50</span></div>
        <div style={{ display:'flex',justifyContent:'space-between',fontSize:16,fontWeight:500,color:DAY.text,marginBottom:4 }}><span>{t.total}</span><span style={{ color:'#C4683A' }}>€{cart.total.toFixed(2)}</span></div>
      </div>
      {cart.hasAgeRestrictedItems && (
        <div style={{ background:'#F0DDD3',border:'0.5px solid #C4683A',borderRadius:10,padding:'9px 12px',display:'flex',gap:8,fontSize:11,color:'#8B4220',marginBottom:12 }}>
          <span>🆔</span><span>ID required at delivery for age-restricted items</span>
        </div>
      )}
      <button onClick={onCheckout} style={{ width:'100%',padding:'16px',background:'#C4683A',color:'white',border:'none',borderRadius:14,fontFamily:'DM Sans,sans-serif',fontSize:15,fontWeight:500,cursor:'pointer',boxShadow:'0 4px 20px rgba(196,104,58,0.4)' }}>
        {t.checkout} →
      </button>
    </div>
  )
}

// ── Account View ──────────────────────────────────────────────
function AccountView({ t }) {
  const { user, profile, clear } = useAuthStore()
  return (
    <div style={{ padding:'20px 16px' }}>
      <div style={{ fontFamily:'DM Serif Display,serif', fontSize:26, color:DAY.text, marginBottom:20 }}>Account</div>
      {user ? (
        <>
          <div style={{ background:'rgba(255,255,255,0.7)',borderRadius:14,padding:16,marginBottom:12 }}>
            <div style={{ width:52,height:52,borderRadius:'50%',background:'linear-gradient(135deg,#C4683A,#E8854A)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,marginBottom:10 }}>
              {(profile?.full_name||'U').charAt(0).toUpperCase()}
            </div>
            <div style={{ fontSize:16,fontWeight:500,color:DAY.text }}>{profile?.full_name||'Guest'}</div>
            <div style={{ fontSize:13,color:DAY.textMuted,marginTop:2 }}>{user.email}</div>
          </div>
          {[['📦','Order history'],['📍','Saved addresses'],['🔔','Notifications'],['🌍','Language & region'],['❓','Help & support']].map(([icon,label])=>(
            <div key={label} style={{ display:'flex',alignItems:'center',gap:12,padding:'14px 16px',background:'rgba(255,255,255,0.55)',borderRadius:12,marginBottom:8,cursor:'pointer' }}>
              <span style={{ fontSize:18 }}>{icon}</span>
              <span style={{ fontSize:14,color:DAY.text,fontFamily:'DM Sans,sans-serif' }}>{label}</span>
              <svg style={{ marginLeft:'auto' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={DAY.textMuted} strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
            </div>
          ))}
          <button onClick={()=>{ import('../../lib/supabase').then(m=>m.supabase.auth.signOut()); clear() }} style={{ width:'100%',marginTop:16,padding:'13px',background:'rgba(196,104,58,0.12)',border:'0.5px solid rgba(196,104,58,0.3)',borderRadius:12,fontFamily:'DM Sans,sans-serif',fontSize:14,color:'#C4683A',cursor:'pointer' }}>Sign out</button>
        </>
      ) : (
        <div style={{ textAlign:'center',padding:'40px 0' }}>
          <div style={{ fontSize:48,marginBottom:14 }}>👤</div>
          <div style={{ fontFamily:'DM Serif Display,serif',fontSize:22,color:DAY.text,marginBottom:8 }}>Sign in to your account</div>
          <div style={{ fontSize:14,color:DAY.textMuted,marginBottom:24 }}>Track orders, save addresses, and more</div>
          <button onClick={()=>toast('Use the sign in option above')} style={{ padding:'13px 32px',background:'#C4683A',color:'white',border:'none',borderRadius:12,fontFamily:'DM Sans,sans-serif',fontSize:14,cursor:'pointer' }}>Sign in</button>
        </div>
      )}
    </div>
  )
}

// ── Categories grid view ──────────────────────────────────────
function CategoriesView({ onSelect }) {
  return (
    <div style={{ padding:'16px 16px 0' }}>
      <div style={{ fontFamily:'DM Serif Display,serif', fontSize:26, color:DAY.text, marginBottom:16 }}>Categories</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        {CATEGORIES.map(cat=>(
          <button key={cat.key} onClick={()=>onSelect(cat.key)}
            style={{ background:'rgba(255,255,255,0.65)', border:`0.5px solid ${DAY.cardBorder}`, borderRadius:14, padding:'18px 14px', cursor:'pointer', display:'flex', alignItems:'center', gap:10, textAlign:'left', boxShadow:'0 2px 10px rgba(42,18,8,0.06)' }}>
            <span style={{ fontSize:26 }}>{cat.emoji}</span>
            <span style={{ fontFamily:'DM Sans,sans-serif', fontSize:14, fontWeight:500, color:DAY.text }}>{cat.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Search View ───────────────────────────────────────────────
function SearchView({ t }) {
  const [query, setQuery] = useState('')
  const { addItem } = useCartStore()
  const results = query.length>1 ? PRODUCTS.filter(p=>p.name.toLowerCase().includes(query.toLowerCase())).slice(0,40) : []
  return (
    <div style={{ padding:'16px 16px 0' }}>
      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        <div style={{ flex:1, display:'flex', alignItems:'center', background:'rgba(255,255,255,0.7)', borderRadius:12, padding:'10px 14px', gap:8, border:`0.5px solid rgba(42,18,8,0.1)` }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={DAY.textMuted} strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder={t.searchPlaceholder} style={{ flex:1,border:'none',background:'none',fontFamily:'DM Sans,sans-serif',fontSize:14,color:DAY.text,outline:'none' }}/>
          {query&&<button onClick={()=>setQuery('')} style={{ border:'none',background:'none',cursor:'pointer',color:DAY.textMuted,fontSize:15,padding:0 }}>✕</button>}
        </div>
        <AssistBot onDark={false} />
      </div>
      {query.length>1 && (
        <>
          <div style={{ fontSize:13,color:DAY.textMuted,marginBottom:12 }}>{results.length} results for "{query}"</div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
            {results.map(p=>(
              <div key={p.id} style={{ background:DAY.card,border:`0.5px solid ${DAY.cardBorder}`,borderRadius:14,overflow:'hidden',position:'relative',boxShadow:'0 2px 10px rgba(42,18,8,0.07)' }}>
                <div style={{ position:'relative' }}>
                  <ProductImage productId={p.id} emoji={p.emoji} category={p.category} alt={p.name} size="card" style={{ height:110 }} />
                  <button onClick={()=>{addItem(p);toast.success(p.emoji+' Added!',{duration:900})}} style={{ position:'absolute',top:7,right:7,width:28,height:28,background:'#C4683A',border:'2px solid white',borderRadius:'50%',color:'white',fontSize:17,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',lineHeight:1 }}>+</button>
                </div>
                <div style={{ padding:'9px 10px 11px' }}>
                  <div style={{ fontSize:11,fontWeight:500,color:DAY.text,lineHeight:1.3,marginBottom:4 }}>{p.name}</div>
                  <div style={{ fontSize:13,fontWeight:500,color:'#C4683A' }}>€{p.price.toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      {query.length===0 && (
        <div style={{ textAlign:'center',padding:'40px 0',color:DAY.textMuted,fontSize:14 }}>
          <div style={{ fontSize:36,marginBottom:10 }}>🔍</div>
          Search 150+ products
        </div>
      )}
    </div>
  )
}

// ── Home View ─────────────────────────────────────────────────
function HomeView({ t, lang, setLang, onCategorySelect, estimatedMins }) {
  const [searchQuery, setSearchQuery] = useState('')
  const cart = useCartStore()
  const prevItems = cart.previousItems || []
  const { addItem } = useCartStore()

  const searchResults = searchQuery.length>1 ? PRODUCTS.filter(p=>p.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0,30) : []

  return (
    <div>
      {/* Header */}
      <div style={{ background:DAY.header }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 16px 0' }}>
          <div>
            <div style={{ fontFamily:'DM Serif Display,serif', fontSize:28, color:'white', letterSpacing:'-0.5px', lineHeight:1 }}>Isla Drop</div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.55)', marginTop:3, letterSpacing:'1.5px', textTransform:'uppercase' }}>{t.tagline}</div>
          </div>
          <div style={{ display:'flex', gap:7, alignItems:'center' }}>
            <div style={{ background:'rgba(255,255,255,0.14)', border:'0.5px solid rgba(255,255,255,0.22)', borderRadius:20, fontSize:11, padding:'4px 10px', display:'flex', alignItems:'center', gap:5, color:'white' }}>
              <span style={{ width:5,height:5,borderRadius:'50%',background:'#7EE8A2',display:'inline-block',animation:'pulse 1.5s infinite' }}/>Open 24/7
            </div>
            <LanguagePicker lang={lang} setLang={setLang} />
          </div>
        </div>
        {/* Address + ETA */}
        <AddressBar estimatedMins={estimatedMins} />
      </div>

      {/* Search + AssistBot row */}
      <div style={{ padding:'12px 16px', background:'rgba(255,240,210,0.5)', borderBottom:`0.5px solid rgba(196,104,58,0.12)`, position:'sticky', top:0, zIndex:50, backdropFilter:'blur(8px)' }}>
        <div style={{ display:'flex', gap:8 }}>
          <div style={{ flex:1, display:'flex', alignItems:'center', background:'rgba(255,255,255,0.82)', borderRadius:12, padding:'10px 14px', gap:8, border:`0.5px solid rgba(196,104,58,0.2)`, boxShadow:'0 1px 6px rgba(196,104,58,0.08)' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={DAY.textMuted} strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input
              value={searchQuery}
              onChange={e=>setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              style={{ flex:1, border:'none', background:'none', fontFamily:'DM Sans,sans-serif', fontSize:14, color:DAY.text, outline:'none' }}
            />
            {searchQuery && <button onClick={()=>setSearchQuery('')} style={{ border:'none',background:'none',cursor:'pointer',color:DAY.textMuted,fontSize:15,padding:0 }}>✕</button>}
          </div>
          {/* AssistBot star button */}
          <AssistBot onDark={false} />
        </div>
      </div>

      {/* Search results overlay */}
      {searchQuery.length>1 && (
        <div style={{ padding:'14px 16px', background:'rgba(255,240,210,0.6)' }}>
          <div style={{ fontSize:13,color:DAY.textMuted,marginBottom:12 }}>{searchResults.length} results for "{searchQuery}"</div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
            {searchResults.map(p=>(
              <div key={p.id} style={{ background:DAY.card,border:`0.5px solid ${DAY.cardBorder}`,borderRadius:14,overflow:'hidden',position:'relative',boxShadow:'0 2px 10px rgba(42,18,8,0.07)' }}>
                <div style={{ position:'relative' }}>
                  <ProductImage productId={p.id} emoji={p.emoji} category={p.category} alt={p.name} size="card" style={{ height:110 }} />
                  <button onClick={()=>{addItem(p);toast.success(p.emoji+' Added!',{duration:900})}} style={{ position:'absolute',top:7,right:7,width:28,height:28,background:'#C4683A',border:'2px solid white',borderRadius:'50%',color:'white',fontSize:17,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',lineHeight:1 }}>+</button>
                </div>
                <div style={{ padding:'9px 10px 11px' }}>
                  <div style={{ fontSize:11,fontWeight:500,color:DAY.text,lineHeight:1.3,marginBottom:4 }}>{p.name}</div>
                  <div style={{ fontSize:13,fontWeight:500,color:'#C4683A' }}>€{p.price.toFixed(2)}</div>
                </div>
              </div>
            ))}
            {searchResults.length===0 && <div style={{ gridColumn:'span 2',textAlign:'center',padding:'20px',color:DAY.textMuted,fontSize:14 }}>No results — try a different term</div>}
          </div>
        </div>
      )}

      {/* Main content — sandy warm sections */}
      {!searchQuery && (
        <div style={{ background:'linear-gradient(180deg,rgba(255,235,190,0.6) 0%,rgba(245,215,160,0.5) 100%)', paddingBottom:20 }}>

          {/* Order again */}
          {prevItems.length>0 && (
            <div style={{ paddingTop:20, marginBottom:22 }}>
              <div style={{ fontFamily:'DM Serif Display,serif', fontSize:20, padding:'0 16px', marginBottom:12, color:DAY.text }}>🔄 {t.orderAgain}</div>
              <div style={{ display:'flex',gap:10,overflowX:'auto',padding:'0 16px 4px',scrollbarWidth:'none' }}>
                {prevItems.slice(0,8).map(p=><MiniCard key={p.id} product={p} t={t}/>)}
              </div>
            </div>
          )}

          {/* Best sellers */}
          <div style={{ paddingTop:prevItems.length?0:20, marginBottom:22 }}>
            <div style={{ fontFamily:'DM Serif Display,serif', fontSize:20, padding:'0 16px', marginBottom:12, color:DAY.text }}>🔥 {t.bestSellers}</div>
            <div style={{ display:'flex',gap:10,overflowX:'auto',padding:'0 16px 4px',scrollbarWidth:'none' }}>
              {BEST_SELLERS.map(p=><MiniCard key={p.id} product={p} t={t}/>)}
            </div>
          </div>

          {/* New in */}
          <div style={{ marginBottom:22 }}>
            <div style={{ fontFamily:'DM Serif Display,serif', fontSize:20, padding:'0 16px', marginBottom:12, color:DAY.text }}>✨ {t.newIn}</div>
            <div style={{ display:'flex',gap:10,overflowX:'auto',padding:'0 16px 4px',scrollbarWidth:'none' }}>
              {NEW_IN.slice(0,10).map(p=><MiniCard key={p.id} product={p} t={t}/>)}
            </div>
          </div>

          {/* Category quick links */}
          <div style={{ padding:'0 16px' }}>
            <div style={{ fontFamily:'DM Serif Display,serif', fontSize:20, color:DAY.text, marginBottom:12 }}>Browse categories</div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {CATEGORIES.map(cat=>(
                <button key={cat.key} onClick={()=>onCategorySelect(cat.key)}
                  style={{ display:'flex',alignItems:'center',gap:6,padding:'9px 14px',background:'rgba(255,255,255,0.65)',border:`0.5px solid rgba(196,104,58,0.2)`,borderRadius:20,cursor:'pointer',fontFamily:'DM Sans,sans-serif',fontSize:12,color:DAY.text,whiteSpace:'nowrap',boxShadow:'0 1px 5px rgba(42,18,8,0.06)' }}>
                  <span style={{ fontSize:16 }}>{cat.emoji}</span>{cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Root App ──────────────────────────────────────────────────
export default function CustomerApp() {
  const [view, setView]               = useState(VIEWS.SPLASH)
  const [lang, setLang]               = useState('en')
  const [categoryKey, setCategoryKey] = useState(null)
  const [locationSet, setLocationSet] = useState(false)
  const [activeOrder, setActiveOrder] = useState(null)
  const { user } = useAuthStore()
  const cart = useCartStore()
  const t    = useT(lang)

  const estimatedMins = cart.deliveryAddress ? 18 : null

  const goToCategory = (key) => { setCategoryKey(key); setView(VIEWS.CATEGORY) }

  const handleTabChange = (v) => {
    if (v !== VIEWS.CATEGORY) setCategoryKey(null)
    setView(v)
  }

  const handleCheckoutStart = () => {
    if (!user) { toast('Sign in to checkout',{icon:'👤'}); return }
    if (cart.hasAgeRestrictedItems) { setView(VIEWS.AGE_VERIFY); return }
    setView(VIEWS.CHECKOUT)
  }

  const handlePaymentSuccess = async (paymentIntentId) => {
    try {
      const order = await createOrder({
        customerId:user.id, items:cart.items.map(i=>({productId:i.product.id,quantity:i.quantity,price:i.product.price})),
        deliveryLat:cart.deliveryLat, deliveryLng:cart.deliveryLng, deliveryAddress:cart.deliveryAddress,
        deliveryNotes:cart.deliveryNotes, what3words:cart.what3words, subtotal:cart.subtotal, total:cart.total, paymentIntentId,
      })
      cart.clearCart(); setActiveOrder(order); setView(VIEWS.TRACKING)
      const sub = subscribeToOrder(order.id, u=>{ setActiveOrder(u); if(u.status==='delivered'){toast.success('🎉 Delivered!');sub.unsubscribe()} })
    } catch(err){ toast.error('Order failed: '+err.message) }
  }

  // ── Splash — NO tab bar ───────────────────────────────────
  if (view===VIEWS.SPLASH) return <SplashScreen onEnter={()=>setView(VIEWS.HOME)} />

  // ── Age verify modal ──────────────────────────────────────
  if (view===VIEWS.AGE_VERIFY) return (
    <div style={{ position:'fixed',inset:0,background:'rgba(42,18,8,0.65)',zIndex:200,display:'flex',alignItems:'flex-end',justifyContent:'center' }} onClick={()=>setView(VIEWS.BASKET)}>
      <div style={{ background:'#FEFCF9',borderRadius:'24px 24px 0 0',padding:'28px 24px 40px',width:'100%',maxWidth:480 }} onClick={e=>e.stopPropagation()}>
        <div style={{ width:36,height:4,background:'rgba(42,35,24,0.15)',borderRadius:2,margin:'0 auto 20px' }}/>
        <AgeVerification onVerified={()=>setView(VIEWS.CHECKOUT)} onClose={()=>setView(VIEWS.BASKET)} />
      </div>
    </div>
  )

  // ── Checkout ──────────────────────────────────────────────
  if (view===VIEWS.CHECKOUT) return (
    <div style={{ background:DAY.bg, minHeight:'100vh', paddingBottom:80 }}>
      <div style={{ padding:'16px 16px 20px' }}>
        <button onClick={()=>setView(VIEWS.BASKET)} style={{ background:'none',border:'none',color:DAY.textMuted,fontSize:14,cursor:'pointer',fontFamily:'DM Sans,sans-serif',marginBottom:12 }}>← Back to basket</button>
        <div style={{ fontFamily:'DM Serif Display,serif',fontSize:26,color:DAY.text,marginBottom:20 }}>{t.checkout}</div>
        <div style={{ fontFamily:'DM Serif Display,serif',fontSize:16,color:DAY.text,marginBottom:12 }}>Delivery location</div>
        <div style={{ borderRadius:14,overflow:'hidden',marginBottom:20,boxShadow:'0 2px 12px rgba(42,18,8,0.1)' }}>
          <DeliveryMap onLocationSet={()=>setLocationSet(true)} />
        </div>
        <div style={{ fontFamily:'DM Serif Display,serif',fontSize:16,color:DAY.text,marginBottom:12 }}>Order summary</div>
        <div style={{ background:'rgba(255,255,255,0.7)',borderRadius:14,padding:16,marginBottom:20 }}>
          {cart.items.map(({product,quantity})=>(
            <div key={product.id} style={{ display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:8,color:DAY.text }}>
              <span>{product.emoji} {product.name} × {quantity}</span>
              <span style={{ fontWeight:500 }}>€{(product.price*quantity).toFixed(2)}</span>
            </div>
          ))}
          <div style={{ borderTop:`0.5px solid rgba(42,18,8,0.1)`,paddingTop:10,marginTop:6 }}>
            <div style={{ display:'flex',justifyContent:'space-between',fontSize:13,color:DAY.textMuted,marginBottom:5 }}><span>Subtotal</span><span>€{cart.subtotal.toFixed(2)}</span></div>
            <div style={{ display:'flex',justifyContent:'space-between',fontSize:13,color:DAY.textMuted,marginBottom:10 }}><span>{t.delivery}</span><span>€3.50</span></div>
            <div style={{ display:'flex',justifyContent:'space-between',fontSize:15,fontWeight:500,color:DAY.text }}><span>{t.total}</span><span style={{ color:'#C4683A' }}>€{cart.total.toFixed(2)}</span></div>
          </div>
          {cart.hasAgeRestrictedItems && (
            <div style={{ marginTop:10,padding:'8px 12px',background:'#F0DDD3',borderRadius:8,fontSize:11,color:'#8B4220',display:'flex',gap:6 }}>
              <span>🆔</span><span>ID required at delivery for age-restricted items</span>
            </div>
          )}
        </div>
        <div style={{ fontFamily:'DM Serif Display,serif',fontSize:16,color:DAY.text,marginBottom:16 }}>Payment</div>
        <StripeCheckout onSuccess={handlePaymentSuccess} onCancel={()=>setView(VIEWS.BASKET)} />
      </div>
      <TabBar view={view} setView={handleTabChange} cartCount={cart.itemCount} />
    </div>
  )

  // ── Tracking ──────────────────────────────────────────────
  if (view===VIEWS.TRACKING && activeOrder) {
    const STEPS=['confirmed','preparing','assigned','picked_up','en_route','delivered']
    const LABELS={confirmed:'Confirmed',preparing:'Preparing',assigned:'Driver assigned',picked_up:'Picked up',en_route:'On the way',delivered:'Delivered!'}
    const idx=STEPS.indexOf(activeOrder.status)
    return (
      <div style={{ background:DAY.bg, minHeight:'100vh', padding:'24px 16px 100px' }}>
        <div style={{ fontFamily:'DM Serif Display,serif',fontSize:26,color:DAY.text,marginBottom:4 }}>{activeOrder.status==='delivered'?'Delivered! 🎉':'On its way 🛵'}</div>
        <div style={{ fontSize:13,color:DAY.textMuted,marginBottom:20 }}>#{activeOrder.order_number}</div>
        <div style={{ background:'rgba(255,255,255,0.7)',borderRadius:14,padding:16,marginBottom:20 }}>
          {STEPS.map((s,i)=>(
            <div key={s} style={{ display:'flex',alignItems:'center',gap:12,marginBottom:i<STEPS.length-1?14:0 }}>
              <div style={{ width:28,height:28,borderRadius:'50%',flexShrink:0,background:i<=idx?(i===idx?'#C4683A':'#5A6B3A'):'rgba(42,18,8,0.1)',display:'flex',alignItems:'center',justifyContent:'center' }}>
                {i<idx&&<svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>}
                {i===idx&&<div style={{ width:8,height:8,borderRadius:'50%',background:'white' }}/>}
              </div>
              <span style={{ fontSize:14,fontWeight:i===idx?500:400,color:i>idx?DAY.textMuted:DAY.text }}>{LABELS[s]}</span>
            </div>
          ))}
        </div>
        {activeOrder.estimated_minutes&&activeOrder.status!=='delivered'&&(
          <div style={{ background:'rgba(255,255,255,0.7)',borderRadius:14,padding:'14px 16px',marginBottom:20,display:'flex',alignItems:'center',gap:12 }}>
            <span style={{ fontSize:28 }}>🛵</span>
            <div><div style={{ fontSize:12,color:DAY.textMuted }}>Estimated arrival</div><div style={{ fontSize:22,fontWeight:500,color:DAY.text }}>{activeOrder.estimated_minutes} min</div></div>
          </div>
        )}
        <button onClick={()=>setView(VIEWS.HOME)} style={{ width:'100%',padding:15,background:'#C4683A',color:'white',border:'none',borderRadius:12,fontFamily:'DM Sans,sans-serif',fontSize:15,cursor:'pointer' }}>Place another order</button>
      <TabBar view={view} setView={handleTabChange} cartCount={cart.itemCount} />
    </div>
  )
  }

  // ── Main tabbed shell ─────────────────────────────────────
  return (
    <div style={{ background:DAY.bg, minHeight:'100vh', paddingBottom:68 }}>

      {/* Category page (full screen) */}
      {view===VIEWS.CATEGORY && categoryKey && (
        <CategoryPage categoryKey={categoryKey} onBack={()=>{ setCategoryKey(null); setView(VIEWS.HOME) }} />
      )}
      {view===VIEWS.CATEGORY && !categoryKey && <CategoriesView onSelect={goToCategory} />}

      {view===VIEWS.HOME && <HomeView t={t} lang={lang} setLang={setLang} onCategorySelect={goToCategory} estimatedMins={estimatedMins} />}
      {view===VIEWS.SEARCH && <SearchView t={t} />}
      {view===VIEWS.BASKET && <BasketView t={t} onCheckout={handleCheckoutStart} />}
      {view===VIEWS.ACCOUNT && <AccountView t={t} />}

      {/* Floating cart bar on home */}
      {view===VIEWS.HOME && cart.itemCount>0 && (
        <div onClick={()=>setView(VIEWS.BASKET)}
          style={{ position:'sticky',bottom:68,margin:'0 16px',background:'#C4683A',borderRadius:14,padding:'13px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer',boxShadow:'0 4px 24px rgba(196,104,58,0.5)' }}>
          <div style={{ color:'white' }}>
            <div style={{ fontSize:11,opacity:0.8 }}>{cart.itemCount} {cart.itemCount===1?t.item:t.items}</div>
            <div style={{ fontSize:15,fontWeight:500 }}>€{cart.subtotal.toFixed(2)} + €3.50 delivery</div>
          </div>
          <div style={{ color:'white',fontSize:13,fontWeight:500 }}>{t.viewCart} →</div>
        </div>
      )}

      {/* Tab bar — shown everywhere EXCEPT splash */}
      <TabBar view={view} setView={handleTabChange} cartCount={cart.itemCount} />

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  )
}
