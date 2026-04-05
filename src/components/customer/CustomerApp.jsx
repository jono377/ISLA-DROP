import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { useCartStore, useAuthStore } from '../../lib/store'
import { PRODUCTS, CATEGORIES, BEST_SELLERS, NEW_IN } from '../../lib/products'
import { calculateETA, shouldShowDriverOnMap, formatETA, isLate } from '../../lib/eta'
import { LANGUAGES, useT } from '../../i18n/translations'
import AgeVerification from './AgeVerification'
import StripeCheckout from './StripeCheckout'
import DeliveryMap from './DeliveryMap'
import OrderTrackingMap from './OrderTrackingMap'
import AddressBar from './AddressBar'
import AssistBot from './AssistBot'
import CategoryPage, { AllProductsPage } from './CategoryPage'
import ProductImage from '../shared/ProductImage'
import AccountView from './AccountView'
import Concierge from './Concierge'
import PartyBuilder from './PartyBuilder'
// supabase imported dynamically inside functions to prevent blank screen

const VIEWS = { SPLASH:'splash', HOME:'home', CATEGORY:'category', SEARCH:'search', BASKET:'basket', ACCOUNT:'account', ASSIST:'assist', BEST:'best', NEWIN:'newin', CONCIERGE:'concierge', PARTY:'party', AGE_VERIFY:'age_verify', CHECKOUT:'checkout', TRACKING:'tracking' }

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
    { id:VIEWS.HOME,     label:'Home',       path:'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
    { id:VIEWS.CATEGORY, label:'Categories', path:'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z' },
    { id:VIEWS.BASKET,   label:'Basket',     path:'M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z', badge:cartCount },
    { id:VIEWS.SEARCH,   label:'Search',     search:true },
    { id:VIEWS.CONCIERGE,label:'Concierge',  star:true },
    { id:VIEWS.ACCOUNT,  label:'Account',    path:'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z' },
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
                {t.search ? <><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></> : t.star ? <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill="currentColor" stroke="none"/> : <path d={t.path}/>}
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
function MiniCard({ product, t }) {
  const qty = useCartStore(s=>s.items.find(i=>i.product.id===product.id)?.quantity??0)
  const { addItem, updateQuantity } = useCartStore()
  return (
    <div style={{ background:C.card, border:'0.5px solid ' + C.cardBorder, borderRadius:14, overflow:'hidden', minWidth:134, maxWidth:134, flexShrink:0, position:'relative' }}>
      <div style={{ position:'relative' }}>
        <ProductImage productId={product.id} emoji={product.emoji} category={product.category} alt={product.name} size="mini" style={{ height:100 }} />
        {qty===0
          ? <button onClick={()=>{addItem(product);toast.success(product.emoji+' Added!',{duration:900})}} style={{ position:'absolute',top:7,right:7,width:28,height:28,background:'#C4683A',border:'2px solid white',borderRadius:'50%',color:'white',fontSize:18,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',boxShadow:'0 2px 8px rgba(0,0,0,0.18)',lineHeight:1 }}>+</button>
          : <div style={{ position:'absolute',top:6,right:6,display:'flex',alignItems:'center',gap:3,background:'rgba(255,255,255,0.96)',borderRadius:20,padding:'2px 7px',boxShadow:'0 1px 5px rgba(0,0,0,0.12)' }}>
              <button onClick={()=>updateQuantity(product.id,qty-1)} style={{ width:18,height:18,background:'#E8E0D0',border:'none',borderRadius:'50%',cursor:'pointer',fontSize:12,display:'flex',alignItems:'center',justifyContent:'center',color:'#2A2318' }}>−</button>
              <span style={{ fontSize:11,fontWeight:500,minWidth:12,textAlign:'center',color:'#2A2318' }}>{qty}</span>
              <button onClick={()=>updateQuantity(product.id,qty+1)} style={{ width:18,height:18,background:'#C4683A',border:'none',borderRadius:'50%',cursor:'pointer',fontSize:12,color:'white',display:'flex',alignItems:'center',justifyContent:'center' }}>+</button>
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

// ── AI Checkout Suggestions ───────────────────────────────────
function CheckoutSuggestions({ cartItems }) {
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const { addItem } = useCartStore()
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current || cartItems.length === 0) return
    ran.current = true
    const getSuggestions = async () => {
      setLoading(true)
      try {
        const cartSummary = cartItems.map(i => i.product.name + ' x' + i.quantity).join(', ')
        const catalogue = PRODUCTS.map(p => p.id + '|' + p.name + '|€' + p.price.toFixed(2)).join('\n')
        const resp = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
            'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY || '',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 200,
            messages: [{
              role: 'user',
              content: 'Customer has in basket: ' + cartSummary + '\n\nSuggest 3 products they forgot that perfectly complement this order. Think: if they have gin suggest tonic and lemon, if they have champagne suggest ice, if they have spirits suggest mixers and cups, if they have beer suggest snacks.\n\nPRODUCTS:\n' + catalogue + '\n\nReturn ONLY JSON array of 3 product IDs: ["id1","id2","id3"]'
            }]
          })
        })
        if (!resp.ok) return
        const data = await resp.json()
        const raw = data.content?.[0]?.text || '[]'
        const ids = JSON.parse(raw.replace(/```json|```/g, '').trim())
        const found = ids.map(id => PRODUCTS.find(p => p.id === id)).filter(Boolean).slice(0, 3)
        setSuggestions(found)
      } catch {}
      setLoading(false)
    }
    getSuggestions()
  }, [])

  if (!loading && suggestions.length === 0) return null

  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', fontFamily:'DM Sans,sans-serif', marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
        <span>✨</span> Isla suggests you might need
      </div>
      {loading ? (
        <div style={{ fontSize:12, color:'rgba(255,255,255,0.3)', fontFamily:'DM Sans,sans-serif' }}>Finding the perfect additions...</div>
      ) : (
        <div style={{ display:'flex', gap:8, overflowX:'auto', scrollbarWidth:'none' }}>
          {suggestions.map(p => (
            <div key={p.id} style={{ flexShrink:0, background:'rgba(255,255,255,0.07)', border:'0.5px solid rgba(196,104,58,0.3)', borderRadius:12, padding:'10px 12px', minWidth:120, maxWidth:140 }}>
              <div style={{ fontSize:24, marginBottom:4 }}>{p.emoji}</div>
              <div style={{ fontSize:12, color:'white', fontFamily:'DM Sans,sans-serif', marginBottom:6, lineHeight:1.3 }}>{p.name}</div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:12, color:'#E8A070' }}>€{p.price.toFixed(2)}</span>
                <button onClick={() => { addItem(p); toast.success(p.emoji + ' Added!', { duration:900 }) }}
                  style={{ padding:'4px 8px', background:'#C4683A', border:'none', borderRadius:6, fontSize:11, color:'white', cursor:'pointer' }}>Add</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function BasketView({ t, onCheckout }) {
  const cart = useCartStore()
  const { updateQuantity } = useCartStore()
  if (cart.getItemCount()===0) return (
    <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:40,minHeight:'60vh' }}>
      <div style={{ fontSize:52,marginBottom:14 }}>🛒</div>
      <div style={{ fontFamily:'DM Serif Display,serif',fontSize:22,color:'rgba(255,255,255,0.85)',marginBottom:6 }}>Your basket is empty</div>
      <div style={{ fontSize:14,color:'rgba(255,255,255,0.45)' }}>Add something delicious</div>
    </div>
  )
  return (
    <div style={{ padding:'16px 16px 20px' }}>
      <div style={{ fontFamily:'DM Serif Display,serif',fontSize:26,color:'white',marginBottom:16 }}>{t.viewCart}</div>
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
      <div style={{ marginTop:16,padding:'14px 0',borderTop:'0.5px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display:'flex',justifyContent:'space-between',fontSize:13,color:'rgba(255,255,255,0.5)',marginBottom:5 }}><span>Subtotal</span><span>€{cart.getSubtotal().toFixed(2)}</span></div>
        <div style={{ display:'flex',justifyContent:'space-between',fontSize:13,color:'rgba(255,255,255,0.5)',marginBottom:10 }}><span>{t.delivery}</span><span>€3.50</span></div>
        <div style={{ display:'flex',justifyContent:'space-between',fontSize:16,fontWeight:500,color:'white' }}><span>{t.total}</span><span style={{ color:'#E8A070' }}>€{cart.getTotal().toFixed(2)}</span></div>
      </div>
      {cart.getHasAgeRestricted() && (
        <div style={{ background:'rgba(196,104,58,0.18)',border:'0.5px solid rgba(196,104,58,0.35)',borderRadius:10,padding:'9px 12px',display:'flex',gap:8,fontSize:11,color:'#E8C090',marginBottom:12 }}>
          <span>🆔</span><span>ID required at delivery for age-restricted items</span>
        </div>
      )}
      <CheckoutSuggestions cartItems={cart.items} />
      <button onClick={onCheckout} style={{ width:'100%',padding:'16px',background:'#C4683A',color:'white',border:'none',borderRadius:14,fontFamily:'DM Sans,sans-serif',fontSize:15,fontWeight:500,cursor:'pointer',boxShadow:'0 4px 20px rgba(196,104,58,0.4)' }}>
        {t.checkout} →
      </button>
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

// ── Search view ───────────────────────────────────────────────
function SearchView({ t }) {
  const [query, setQuery]           = useState('')
  const [aiResults, setAiResults]   = useState(null)
  const [aiLoading, setAiLoading]   = useState(false)
  const [aiUsed, setAiUsed]         = useState(false)
  const { addItem }                 = useCartStore()
  const debounceRef                 = useRef(null)

  // Standard text search
  const textResults = query.length > 1
    ? PRODUCTS.filter(p => p.name.toLowerCase().includes(query.toLowerCase())).slice(0, 30)
    : []

  // AI search for natural language queries
  const runAiSearch = async (q) => {
    if (!q || q.length < 4) return
    setAiLoading(true)
    try {
      const catalogue = PRODUCTS.map(p => p.id + '|' + p.name + '|' + p.category + '|€' + p.price.toFixed(2)).join('\n')
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
          'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY || '',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 300,
          messages: [{
            role: 'user',
            content: 'Customer searched: ' + q + '. Find up to 12 relevant products from this catalogue. Pool party: floats and drinks. Hangover: remedies. Cocktail: spirits mixers citrus. Gentleman: premium spirits cigars. Birthday: champagne sparklers. CATALOGUE:\n' + catalogue + '\nReturn ONLY JSON array: ["id1","id2"] No other text.'
          }]
        })
      })
      if (!resp.ok) throw new Error('API error')
      const data = await resp.json()
      const raw = data.content?.[0]?.text || '[]'
      const ids = JSON.parse(raw.replace(/\`\`\`json|\`\`\`/g, '').trim())
      const found = ids.map(id => PRODUCTS.find(p => p.id === id)).filter(Boolean)
      if (found.length > 0) { setAiResults(found); setAiUsed(true) }
    } catch { /* fall through to text results */ }
    setAiLoading(false)
  }

  const handleChange = (val) => {
    setQuery(val)
    setAiResults(null)
    setAiUsed(false)
    clearTimeout(debounceRef.current)
    if (val.length >= 3) {
      debounceRef.current = setTimeout(() => runAiSearch(val), 700)
    }
  }

  const displayResults = aiResults || textResults
  const hasResults = displayResults.length > 0

  const SUGGESTIONS = [
    { label:"🎩 Gentleman's Evening", q:'premium spirits cigars whisky cognac gentleman luxury evening' },
    { label:'💦 Pool party',           q:'pool party floats inflatables cold drinks ice' },
    { label:'🌅 Sundowner drinks',     q:'sundowner sunset rosé wine Aperol spritz' },
    { label:'💊 Hangover cure',        q:'hangover recovery morning after Dioralyte paracetamol coconut water' },
    { label:'🎂 Birthday party',       q:'birthday party champagne sparklers balloons celebration' },
    { label:'🏖️ Beach day',            q:'beach day water sunscreen snacks essentials' },
    { label:'🌙 Club night pre-drinks',q:'pre drinks spirits mixers shots night out' },
    { label:'🎉 House party',          q:'house party drinks snacks ice cups party supplies' },
    { label:'🥂 Special occasion',     q:'special occasion Moet Veuve Clicquot luxury champagne' },
    { label:'🥃 Cocktail night',       q:'cocktail spirits gin vodka rum mixers lemon lime ice' },
    { label:'💅 Girls night',          q:'girls night prosecco champagne rosé snacks' },
    { label:'🍕 Snacks & nibbles',     q:'snacks antipasto crisps hummus cheese board nibbles' },
  ]

  return (
    <div style={{ padding:'16px 16px 24px' }}>
      <div style={{ fontFamily:'DM Serif Display,serif', fontSize:22, color:'white', marginBottom:14 }}>Search</div>

      {/* Search input */}
      <div style={{ display:'flex', alignItems:'center', background:'rgba(255,255,255,0.09)', border:'0.5px solid rgba(255,255,255,0.14)', borderRadius:12, padding:'11px 14px', gap:8, marginBottom:16 }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input
          autoFocus
          value={query}
          onChange={e => handleChange(e.target.value)}
          placeholder="Search products or describe what you need..."
          style={{ flex:1, border:'none', background:'none', fontFamily:'DM Sans,sans-serif', fontSize:14, color:'white', outline:'none' }}
        />
        {aiLoading && <div style={{ width:14, height:14, border:'2px solid rgba(255,255,255,0.2)', borderTopColor:'#C4683A', borderRadius:'50%', animation:'spin 0.8s linear infinite', flexShrink:0 }} />}
        {query && !aiLoading && <button onClick={() => { setQuery(''); setAiResults(null); setAiUsed(false) }} style={{ border:'none', background:'none', cursor:'pointer', color:'rgba(255,255,255,0.4)', fontSize:16, padding:0, flexShrink:0 }}>✕</button>}
      </div>

      {/* AI badge */}
      {aiUsed && hasResults && (
        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:10 }}>
          <div style={{ background:'rgba(196,104,58,0.2)', border:'0.5px solid rgba(196,104,58,0.35)', borderRadius:20, padding:'4px 10px', fontSize:11, color:'#E8A070', fontFamily:'DM Sans,sans-serif' }}>
            ✨ AI search — {displayResults.length} results
          </div>
        </div>
      )}

      {/* Suggestions — shown when no query */}
      {!query && (
        <>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginBottom:10, fontFamily:'DM Sans,sans-serif', textTransform:'uppercase', letterSpacing:'0.5px' }}>Try asking Isla</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:20 }}>
            {SUGGESTIONS.map(s => (
              <button key={s.q} onClick={() => handleChange(s.q)}
                style={{ padding:'8px 14px', background:'rgba(255,255,255,0.07)', border:'0.5px solid rgba(255,255,255,0.12)', borderRadius:20, fontSize:13, color:'rgba(255,255,255,0.8)', cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
                {s.label}
              </button>
            ))}
          </div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginBottom:10, fontFamily:'DM Sans,sans-serif', textTransform:'uppercase', letterSpacing:'0.5px' }}>Popular right now</div>
          <div style={{ display:'flex', gap:10, overflowX:'auto', scrollbarWidth:'none' }}>
            {PRODUCTS.filter(p=>p.popular).sort(()=>Math.random()-0.5).slice(0,8).map(p => <MiniCard key={p.id} product={p} t={t}/>)}
          </div>
        </>
      )}

      {/* Results */}
      {query && !hasResults && !aiLoading && (
        <div style={{ textAlign:'center', padding:'40px 0', color:'rgba(255,255,255,0.4)' }}>
          <div style={{ fontSize:32, marginBottom:10 }}>🔍</div>
          <div style={{ fontSize:14, fontFamily:'DM Sans,sans-serif' }}>No results for "{query}"</div>
          <div style={{ fontSize:12, marginTop:4 }}>Try describing what you need differently</div>
        </div>
      )}

      {hasResults && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10 }}>
          {displayResults.map(p => (
            <div key={p.id} style={{ background:'rgba(255,255,255,0.06)', border:'0.5px solid rgba(255,255,255,0.1)', borderRadius:14, overflow:'hidden' }}>
              <div style={{ height:80, background:'linear-gradient(135deg,#0D3B4A,#1A5263)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:32 }}>{p.emoji}</div>
              <div style={{ padding:'10px 12px' }}>
                <div style={{ fontSize:12, fontWeight:500, color:'white', fontFamily:'DM Sans,sans-serif', marginBottom:4, lineHeight:1.3 }}>{p.name}</div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:13, fontWeight:500, color:'#E8A070' }}>€{p.price.toFixed(2)}</span>
                  <button onClick={() => { addItem(p); toast.success(p.emoji + ' Added!', { duration:900 }) }}
                    style={{ padding:'5px 10px', background:'#C4683A', border:'none', borderRadius:8, fontSize:11, color:'white', cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
                    Add
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  )
}


function HomeView({ t, lang, setLang, onCategorySelect, estimatedMins, onAssist, onBest, onNewIn, onParty }) {
  const [searchQuery, setSearchQuery] = useState('')
  const cart = useCartStore()
  const { addItem } = useCartStore()
  const prevItems = cart.previousItems || []
  const searchResults = searchQuery.length>1 ? PRODUCTS.filter(p=>p.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0,30) : []

  return (
    <div>
      {/* Header */}
      <div style={{ background:C.header }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'16px 16px 0' }}>
          <div>
            <div style={{ fontFamily:'DM Serif Display,serif',fontSize:28,color:'white',letterSpacing:'-0.5px',lineHeight:1 }}>Isla Drop</div>
            <div style={{ fontSize:10,color:'rgba(255,255,255,0.45)',marginTop:3,letterSpacing:'1.5px',textTransform:'uppercase' }}>{t.tagline}</div>
          </div>
          <div style={{ display:'flex',gap:7,alignItems:'center' }}>
            <div style={{ background:'rgba(255,255,255,0.12)',border:'0.5px solid rgba(255,255,255,0.18)',borderRadius:20,fontSize:11,padding:'4px 10px',display:'flex',alignItems:'center',gap:5,color:'white' }}>
              <span style={{ width:5,height:5,borderRadius:'50%',background:'#7EE8A2',display:'inline-block',animation:'pulse 1.5s infinite' }}/>Open 24/7
            </div>
            <LanguagePicker lang={lang} setLang={setLang} />
          </div>
        </div>
        <AddressBar estimatedMins={estimatedMins} />
      </div>

      {/* Search + AssistBot — sticky */}
      <div style={{ padding:'10px 16px',background:'rgba(13,59,74,0.98)',position:'sticky',top:0,zIndex:50,borderBottom:'0.5px solid rgba(43,122,139,0.25)',backdropFilter:'blur(10px)' }}>
        <div style={{ display:'flex',gap:8 }}>
          <div style={{ flex:1,display:'flex',alignItems:'center',background:'rgba(255,255,255,0.09)',borderRadius:12,padding:'10px 14px',gap:8,border:'0.5px solid rgba(255,255,255,0.1)' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder={t.searchPlaceholder} style={{ flex:1,border:'none',background:'none',fontFamily:'DM Sans,sans-serif',fontSize:14,color:'white',outline:'none' }}/>
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

      {/* Search results */}
      {searchQuery.length>1 && (
        <div style={{ padding:'12px 16px' }}>
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
          {prevItems.length>0 && (
            <div style={{ paddingTop:20,marginBottom:22 }}>
              <div style={{ fontFamily:'DM Serif Display,serif',fontSize:20,padding:'0 16px',marginBottom:12,color:'white' }}>🔄 {t.orderAgain}</div>
              <div style={{ display:'flex',gap:10,overflowX:'auto',padding:'0 16px 4px',scrollbarWidth:'none' }}>{prevItems.slice(0,8).map(p=><MiniCard key={p.id} product={p} t={t}/>)}</div>
            </div>
          )}
          <div style={{ paddingTop:prevItems.length?0:20,marginBottom:22 }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0 16px',marginBottom:12 }}>
              <button onClick={onBest} style={{ fontFamily:'DM Serif Display,serif',fontSize:20,color:'white',background:'none',border:'none',cursor:'pointer',padding:0,display:'flex',alignItems:'center',gap:6 }}>🔥 {t.bestSellers}</button>
              <button onClick={onBest} style={{ fontSize:11,color:'rgba(255,255,255,0.5)',background:'none',border:'none',cursor:'pointer',fontFamily:'DM Sans,sans-serif' }}>See all →</button>
            </div>
            <div style={{ display:'flex',gap:10,overflowX:'auto',padding:'0 16px 4px',scrollbarWidth:'none' }}>{BEST_SELLERS.map(p=><MiniCard key={p.id} product={p} t={t}/>)}</div>
          </div>
          <div style={{ marginBottom:22 }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0 16px',marginBottom:12 }}>
              <button onClick={onNewIn} style={{ fontFamily:'DM Serif Display,serif',fontSize:20,color:'white',background:'none',border:'none',cursor:'pointer',padding:0,display:'flex',alignItems:'center',gap:6 }}>✨ {t.newIn}</button>
              <button onClick={onNewIn} style={{ fontSize:11,color:'rgba(255,255,255,0.5)',background:'none',border:'none',cursor:'pointer',fontFamily:'DM Sans,sans-serif' }}>See all →</button>
            </div>
            <div style={{ display:'flex',gap:10,overflowX:'auto',padding:'0 16px 4px',scrollbarWidth:'none' }}>{NEW_IN.slice(0,10).map(p=><MiniCard key={p.id} product={p} t={t}/>)}</div>
          </div>

          {/* Recommendations — AI picks */}
          <div style={{ marginBottom:24 }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0 16px',marginBottom:12 }}>
              <div style={{ fontFamily:'DM Serif Display,serif',fontSize:20,color:'white' }}>🌟 Recommended</div>
            </div>
            <div style={{ display:'flex',gap:10,overflowX:'auto',padding:'0 16px 4px',scrollbarWidth:'none' }}>
              {PRODUCTS.filter(p=>p.popular).sort(()=>Math.random()-0.5).slice(0,10).map(p=><MiniCard key={p.id} product={p} t={t}/>)}
            </div>
          </div>

          {/* Order Again — only shown when user has previous orders */}
          {prevItems.length > 0 && (
            <div style={{ marginBottom:24 }}>
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0 16px',marginBottom:12 }}>
                <div style={{ fontFamily:'DM Serif Display,serif',fontSize:20,color:'white' }}>🔄 Order Again</div>
              </div>
              <div style={{ display:'flex',gap:10,overflowX:'auto',padding:'0 16px 4px',scrollbarWidth:'none' }}>
                {prevItems.slice(0,8).map((product,i)=><MiniCard key={product.id+i} product={product} t={t}/>)}
              </div>
            </div>
          )}

          {/* Concierge Highlights carousel */}
          <div style={{ marginBottom:24 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0 16px', marginBottom:12 }}>
              <div style={{ fontFamily:'DM Serif Display,serif', fontSize:20, color:'white' }}>✨ Ibiza Experiences</div>
              <button onClick={()=>navigate(VIEWS.CONCIERGE)} style={{ fontSize:11, color:'rgba(255,255,255,0.5)', background:'none', border:'none', cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>See all →</button>
            </div>
            <div style={{ display:'flex', gap:10, overflowX:'auto', padding:'0 16px 4px', scrollbarWidth:'none' }}>
              {[
                { emoji:'⛵', title:'RIB Speedboat', sub:'Half day from €605', id:'concierge', color:'linear-gradient(135deg,#0D3B4A,#2B7A8B)' },
                { emoji:'🍒', title:'Pacha Ibiza', sub:'Entry from €110pp', id:'concierge', color:'linear-gradient(135deg,#3D1A3A,#8B2070)' },
                { emoji:'⭐', title:'La Gaia Restaurant', sub:'Michelin star from €220', id:'concierge', color:'linear-gradient(135deg,#3A2A0A,#8B6020)' },
                { emoji:'🏖️', title:'Blue Marlin VIP', sub:'Daybed from €440', id:'concierge', color:'linear-gradient(135deg,#0A2A3A,#1A6080)' },
                { emoji:'☀️', title:'Ushuaia Day Club', sub:'Entry from €143pp', id:'concierge', color:'linear-gradient(135deg,#2A1A0A,#8B4A20)' },
                { emoji:'🏡', title:'Luxury Finca', sub:'4-bed from €1,210/night', id:'concierge', color:'linear-gradient(135deg,#1A2A0A,#4A6B20)' },
                { emoji:'🧘', title:'Sunrise Yoga', sub:'Ses Salines from €88', id:'concierge', color:'linear-gradient(135deg,#0A1A2A,#20408B)' },
                { emoji:'🚁', title:'Helicopter Tour', sub:'Island panorama €770', id:'concierge', color:'linear-gradient(135deg,#2A0A1A,#8B2040)' },
                { emoji:'🌙', title:'Amante Dinner', sub:'Clifftop from €95pp', id:'concierge', color:'linear-gradient(135deg,#1A0A2A,#502080)' },
                { emoji:'🏍️', title:'Quad Bike Adventure', sub:'3hr tour from €132', id:'concierge', color:'linear-gradient(135deg,#2A1A0A,#6B4020)' },
              ].map((item, i) => (
                <div key={i} onClick={()=>navigate(VIEWS.CONCIERGE)}
                  style={{ flexShrink:0, width:140, background:item.color, borderRadius:14, padding:'14px 12px', cursor:'pointer', border:'0.5px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ fontSize:28, marginBottom:8 }}>{item.emoji}</div>
                  <div style={{ fontSize:13, fontWeight:500, color:'white', marginBottom:3, lineHeight:1.2 }}>{item.title}</div>
                  <div style={{ fontSize:10, color:'rgba(255,255,255,0.55)' }}>{item.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Design Your Experience cards */}
          <div style={{ padding:'0 16px', marginBottom:20 }}>
            <div style={{ fontFamily:'DM Serif Display,serif', fontSize:20, color:'white', marginBottom:12 }}>Design Your Experience</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div onClick={()=>onParty('design_night')}
                style={{ background:'linear-gradient(135deg,rgba(90,30,120,0.7),rgba(30,60,120,0.7))', border:'0.5px solid rgba(255,255,255,0.12)', borderRadius:16, padding:'18px 14px', cursor:'pointer' }}>
                <div style={{ fontSize:36, marginBottom:8 }}>🌙</div>
                <div style={{ fontFamily:'DM Serif Display,serif', fontSize:17, color:'white', marginBottom:4 }}>Design Your Night</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', lineHeight:1.4 }}>Club nights, villa parties, pre-drinks & more</div>
              </div>
              <div onClick={()=>onParty('design_day')}
                style={{ background:'linear-gradient(135deg,rgba(196,104,58,0.6),rgba(200,140,30,0.5))', border:'0.5px solid rgba(255,255,255,0.12)', borderRadius:16, padding:'18px 14px', cursor:'pointer' }}>
                <div style={{ fontSize:36, marginBottom:8 }}>☀️</div>
                <div style={{ fontFamily:'DM Serif Display,serif', fontSize:17, color:'white', marginBottom:4 }}>Design Your Day</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', lineHeight:1.4 }}>Pool parties, beach days, boat trips & more</div>
              </div>
            </div>
          </div>

          {/* One horizontal scroll row per category */}
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
                  {catProducts.map(p=><MiniCard key={p.id} product={p} t={t}/>)}
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
  const [viewHistory, setViewHistory] = useState([])
  const [lang, setLang]               = useState('en')
  const [categoryKey, setCategoryKey] = useState(null)
  const [prevCategoryKey, setPrevCategoryKey] = useState(null)
  const [locationSet, setLocationSet] = useState(false)
  const [activeOrder, setActiveOrder] = useState(null)
  const [partyType, setPartyType]       = useState(null)
  const { user } = useAuthStore()
  const cart = useCartStore()
  const t    = useT(lang)
  const estimatedMins = cart.deliveryAddress ? 18 : null

  const navigate = (newView, opts = {}) => {
    // Track history for back navigation
    setViewHistory(prev => [...prev.slice(-9), { view, categoryKey }])
    if (newView !== VIEWS.CATEGORY) setCategoryKey(null)
    setView(newView)
  }

  const goBack = () => {
    const prev = viewHistory[viewHistory.length - 1]
    if (!prev) { setView(VIEWS.HOME); setCategoryKey(null); return }
    setViewHistory(h => h.slice(0, -1))
    setCategoryKey(prev.categoryKey || null)
    setView(prev.view)
  }

  const goToCategory = (key) => {
    setViewHistory(prev => [...prev.slice(-9), { view, categoryKey }])
    setCategoryKey(key)
    setView(VIEWS.CATEGORY)
  }

  const handleTabChange = (v) => {
    setViewHistory([]) // Tab changes reset history
    if (v !== VIEWS.CATEGORY) setCategoryKey(null)
    setView(v)
  }

  const handleCheckoutStart = () => {
    if (!user) { toast('Sign in to checkout',{icon:'👤'}); return }
    if (cart.getHasAgeRestricted()) { setView(VIEWS.AGE_VERIFY); return }
    setView(VIEWS.CHECKOUT)
  }

  const handlePaymentSuccess = async (paymentIntentId) => {
    try {
      const { createOrder, subscribeToOrder: subToOrder } = await import('../../lib/supabase')
      const order = await createOrder({
        customerId:user.id, items:cart.items.map(i=>({productId:i.product.id,quantity:i.quantity,price:i.product.price})),
        deliveryLat:cart.deliveryLat, deliveryLng:cart.deliveryLng, deliveryAddress:cart.deliveryAddress,
        deliveryNotes:cart.deliveryNotes, what3words:cart.what3words, subtotal:cart.getSubtotal(), total:cart.getTotal(), paymentIntentId,
      })
      cart.clearCart(); setActiveOrder(order); setView(VIEWS.TRACKING)
      const sub = subToOrder(order.id, u=>{ setActiveOrder(u); if(u.status==='delivered'){toast.success('🎉 Delivered!');sub.unsubscribe()} })
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
          <div style={{ borderRadius:14,overflow:'hidden',marginBottom:20 }}>
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
          <div style={{ fontFamily:'DM Serif Display,serif',fontSize:16,color:'white',marginBottom:16 }}>Payment</div>
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
        {/* Delivery PIN — shown prominently when driver is en route */}
        {activeOrder.delivery_pin && activeOrder.status !== 'delivered' && (
          <div style={{ background:'linear-gradient(135deg,rgba(196,104,58,0.25),rgba(196,104,58,0.1))', border:'1.5px solid rgba(196,104,58,0.5)', borderRadius:14, padding:'16px', marginBottom:16, textAlign:'center' }}>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.55)', marginBottom:6, textTransform:'uppercase', letterSpacing:'1px' }}>Your Delivery Code</div>
            <div style={{ fontFamily:'DM Serif Display,serif', fontSize:42, color:'white', letterSpacing:8, fontWeight:400 }}>{activeOrder.delivery_pin}</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginTop:6 }}>Give this code to your driver to confirm delivery</div>
          </div>
        )}
        {/* Late order warning — 10% credit if 30+ mins past ETA */}
        {activeOrder.original_eta && activeOrder.status !== 'delivered' && (() => {
          const originalEta = new Date(activeOrder.original_eta)
          const minsLate = (Date.now() - originalEta) / 60000
          if (minsLate > 30) return (
            <div style={{ background:'rgba(245,201,122,0.15)', border:'0.5px solid rgba(245,201,122,0.35)', borderRadius:12, padding:'12px 14px', marginBottom:12, display:'flex', gap:10, alignItems:'flex-start' }}>
              <span style={{ fontSize:16 }}>⏱️</span>
              <div style={{ fontSize:12, color:'#F5C97A', fontFamily:'DM Sans,sans-serif', lineHeight:1.5 }}>
                Your order is running a little late. If it arrives more than 30 minutes past the estimated time, 10% credit will be added to your account automatically.
              </div>
            </div>
          )
          return null
        })()}
        {activeOrder.status!=='delivered'&&activeOrder.status!=='pending'&&(()=>{
          const driverLat = activeOrder.driver_lat
          const driverLng = activeOrder.driver_lng
          const eta = calculateETA({
            driverLat, driverLng,
            orderStatus: activeOrder.status,
            deliveryLat: activeOrder.delivery_lat,
            deliveryLng: activeOrder.delivery_lng,
          })
          if (!eta) return null
          return (
            <div style={{ background:'rgba(43,122,139,0.2)',border:'0.5px solid rgba(43,122,139,0.35)',borderRadius:14,padding:'14px 16px',marginBottom:16,display:'flex',alignItems:'center',gap:12 }}>
              <span style={{ fontSize:28 }}>{eta.phase==='collecting'?'📦':'🛵'}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12,color:'rgba(255,255,255,0.45)' }}>
                  {eta.phase==='collecting' ? 'Collecting your order' : eta.phase==='arriving' ? 'Almost there' : 'Estimated arrival'}
                </div>
                <div style={{ fontSize:24,fontWeight:500,color:'white' }}>{eta.label}</div>
                <div style={{ fontSize:11,color:'rgba(255,255,255,0.4)',marginTop:2 }}>
                  {eta.detail} · ETA {formatETA(eta.eta)}
                </div>
              </div>
            </div>
          )
        })()}
        {/* Live tracking map — only shown after pickup and outside warehouse radius */}
        {activeOrder.driver_id && shouldShowDriverOnMap(activeOrder.status, activeOrder.driver_lat, activeOrder.driver_lng) ? (
          <div style={{ marginBottom:16 }}>
            <div style={{ fontFamily:'DM Serif Display,serif',fontSize:16,color:'white',marginBottom:10 }}>Live tracking</div>
            <OrderTrackingMap order={activeOrder} driverId={activeOrder.driver_id} />
          </div>
        ) : activeOrder.driver_id && activeOrder.status === 'assigned' ? (
          <div style={{ background:'rgba(255,255,255,0.05)',borderRadius:12,padding:'14px 16px',marginBottom:16,display:'flex',alignItems:'center',gap:10 }}>
            <span style={{ fontSize:20 }}>📦</span>
            <div style={{ fontSize:13,color:'rgba(255,255,255,0.55)',fontFamily:'DM Sans,sans-serif' }}>
              Live map will appear once your driver has collected your order
            </div>
          </div>
        ) : null}
        <button onClick={()=>setView(VIEWS.HOME)} style={{ width:'100%',padding:15,background:'#C4683A',color:'white',border:'none',borderRadius:12,fontFamily:'DM Sans,sans-serif',fontSize:15,cursor:'pointer' }}>Place another order</button>
      </div>
    )
  }

  // ── MAIN SHELL — tab bar lives here only ──────────────────
  return (
    <div style={{ background:C.bg, minHeight:'100vh', paddingBottom:68 }}>

      {view===VIEWS.CATEGORY && categoryKey && (
        <CategoryPage categoryKey={categoryKey} onBack={goBack} />
      )}
      {view===VIEWS.CATEGORY && !categoryKey && <CategoriesView onSelect={goToCategory} />}
      {view===VIEWS.HOME     && <HomeView t={t} lang={lang} setLang={setLang} onCategorySelect={goToCategory} estimatedMins={estimatedMins} onAssist={()=>navigate(VIEWS.ASSIST)} onBest={()=>navigate(VIEWS.BEST)} onNewIn={()=>navigate(VIEWS.NEWIN)} onParty={(type)=>{ setPartyType(type); navigate(VIEWS.PARTY) }} />}
      {view===VIEWS.SEARCH   && <SearchView t={t} />}
      {view===VIEWS.BASKET   && <BasketView t={t} onCheckout={handleCheckoutStart} />}
      {view===VIEWS.ACCOUNT  && <AccountView t={t} />}
      {view===VIEWS.CONCIERGE && <Concierge onBack={()=>setView(VIEWS.HOME)} />}
      {view===VIEWS.PARTY     && <PartyBuilder initialType={partyType} onBack={goBack} />}
      {view===VIEWS.ASSIST   && <AssistBot onClose={goBack} />}
      {view===VIEWS.BEST     && <AllProductsPage title={'🔥 Best Sellers'} products={BEST_SELLERS} onBack={goBack} />}
      {view===VIEWS.NEWIN   && <AllProductsPage title={'✨ New In'} products={NEW_IN} onBack={goBack} />}

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

      <style>{'@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}'}</style>
    </div>
  )
}
