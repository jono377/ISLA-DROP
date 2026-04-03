import { useState, useRef, useEffect } from 'react'
import { PRODUCTS } from '../../lib/products'
import { useCartStore } from '../../lib/store'
import toast from 'react-hot-toast'

// ── Local smart matching — no API key needed ──────────────────
// This runs entirely in the browser with zero API calls.
// Isla uses keyword matching + a curated vibe map to suggest products.

const VIBE_MAP = {
  'party':        ['ch-001','ch-010','ch-011','ch-008','br-001','ic-002'],
  'planning a party': ['ch-001','ch-010','ch-008','br-002','ic-002','sn-004'],
  'celebrate':    ['ch-001','ch-002','ch-008','ch-011','wn-021'],
  'champagne':    ['ch-001','ch-002','ch-008','ch-010','ch-011','wn-021'],
  'sundowner':    ['wn-021','wn-020','ch-007','sp-012','sd-028','ic-001'],
  'sunset':       ['wn-021','wn-015','ch-007','sp-012','sd-028'],
  'beach':        ['br-001','br-004','br-007','ic-002','sd-015','wt-002'],
  'beach day':    ['br-001','br-004','ic-002','sd-021','wt-002','sn-009'],
  'pool':         ['br-001','br-004','ic-002','wt-002','sd-021','sn-004'],
  'cocktail':     ['sp-033','sp-035','sp-012','sp-013','sd-025','sd-028'],
  'cocktails':    ['sp-035','sp-033','sp-012','sp-013','sd-025','sd-028'],
  'vip':          ['ch-002','sp-001','sp-027','sp-015','sp-037'],
  'vip night':    ['ch-002','sp-001','sp-015','sp-027','wn-001'],
  'whiskey':      ['sp-015','sp-016','sp-017','sp-018','sp-019','sp-021'],
  'whisky':       ['sp-015','sp-016','sp-017','sp-019','sp-021'],
  'spirits':      ['sp-035','sp-012','sp-022','sp-033','sp-028'],
  'premium spirits': ['sp-015','sp-017','sp-021','sp-001','sp-027'],
  'tequila':      ['sp-001','sp-002','sp-007','sp-011','sp-010'],
  'gin':          ['sp-012','sp-013','sp-014'],
  'vodka':        ['sp-035','sp-033','sp-039','sp-037','sp-036'],
  'rum':          ['sp-022','sp-024','sp-025','sp-026'],
  'cognac':       ['sp-027','sp-028','sp-029','sp-031'],
  'wine':         ['wn-003','wn-004','wn-021','wn-010','wn-021'],
  'rosé':         ['wn-021','wn-020','wn-015','wn-022'],
  'rose':         ['wn-021','wn-020','wn-015','wn-018'],
  'beer':         ['br-001','br-004','br-007','br-011','br-013'],
  'lager':        ['br-001','br-004','br-007','br-011','br-012'],
  'cider':        ['br-013','br-014'],
  'non-alcoholic':['sd-021','sd-022','wt-002','wt-001','wt-003','sd-019'],
  'no alcohol':   ['sd-021','wt-002','wt-001','sd-028','sd-019'],
  'soft drinks':  ['sd-001','sd-015','sd-021','sd-019','sd-028'],
  'energy':       ['sd-021','sd-022','sd-023'],
  'mixer':        ['sd-025','sd-028','sd-024','sd-026','sd-029'],
  'mixers':       ['sd-025','sd-028','sd-024','sd-026'],
  'snack':        ['sn-009','sn-004','sn-001','sn-006','sn-008'],
  'snacks':       ['sn-009','sn-004','sn-006','sn-008','sn-007'],
  'smoke':        ['tb-001','tb-003','tb-011','tb-015'],
  'smokers':      ['tb-001','tb-003','tb-006','tb-011','tb-015'],
  'smokers pack': ['tb-001','tb-003','tb-006','tb-011','tb-015','tb-028'],
  'cigar':        ['tb-018','tb-019','tb-020','tb-023','tb-024'],
  'vape':         ['tb-028','tb-029','tb-031','tb-035'],
  'ibiza':        ['wn-021','ch-010','sp-012','br-001','ic-002','sd-028'],
  'ibiza night':  ['ch-010','sp-035','sp-012','wn-021','ic-002'],
  'classic ibiza':['wn-021','sp-012','ch-010','br-001','ic-002'],
  'ice':          ['ic-001','ic-002','ic-003'],
  'water':        ['wt-001','wt-002','wt-003'],
}

const RESPONSES = {
  'party':        "Let's get this party started! 🎉 For a proper Ibiza bash you'll want cold champagne, beers on ice and plenty of ice to keep everything chilled.",
  'planning a party': "Party mode activated! 🥂 Here's what you need for an epic night — grab some bubbly, stock up on beers and make sure the ice bucket is ready.",
  'celebrate':    "Congratulations! 🍾 Nothing says celebration like a great bottle of champagne. Here are my top picks for your special moment.",
  'sundowner':    "Golden hour calls for something special 🌅 A chilled rosé or a G&T with fever-tree is the ultimate Ibiza sundowner combo.",
  'sunset':       "The perfect sunset moment 🌅 Go for a pale rosé or a crisp gin & tonic — pure Ibiza magic.",
  'beach':        "Beach day sorted! ☀️ Cold beers, iced water and something to snack on — that's all you need.",
  'beach day':    "Beach day perfection ☀️ Ice cold beers, sparkling water and energy drinks to keep you going all day.",
  'pool':         "Pool party vibes! 💦 Keep it refreshing — cold beers, sparkling water and ice are the essentials.",
  'cocktail':     "Cocktail hour! 🍹 Get the good spirits in — quality vodka or gin, mixers and you're sorted.",
  'cocktails':    "Cocktail night! 🍸 Premium spirits + Fever-Tree mixers = perfection. Here's what I'd grab.",
  'vip':          "VIP all the way 🌟 Only the finest — Ace of Spades, aged tequila or XO cognac for a truly elite night.",
  'vip night':    "Now we're talking VIP 👑 Think Armand de Brignac, Don Julio 1942 or Johnnie Walker Blue. The best of the best.",
  'whiskey':      "A whisky lover! 🥃 Ibiza has great taste — here are the finest bottles we carry.",
  'whisky':       "Excellent choice 🥃 From Japanese single malts to aged Scotch — here's what we recommend.",
  'spirits':      "Let's get the spirits in 🥃 Here are some of the most popular bottles we deliver.",
  'premium spirits': "Going premium tonight! ✨ These are the finest bottles in our collection.",
  'tequila':      "Tequila time! 🌵 From smooth blanco to aged añejo — here are the best we stock.",
  'gin':          "Gin o'clock! 🌿 Perfect for G&Ts in the Ibiza heat. Here are our finest gins.",
  'vodka':        "Great choice 🍸 Clean, smooth and perfect for cocktails. Here are our top vodkas.",
  'rum':          "Rum vibes! 🍹 From white to dark and spiced — here's our rum selection.",
  'cognac':       "Sophisticated choice 🥃 A fine cognac for a special occasion. Here are our top picks.",
  'wine':         "Wine time! 🍷 We carry some excellent bottles — here are my recommendations.",
  'rosé':         "Rosé all day! 🌹 Ibiza runs on rosé and we have the best — starting with Whispering Angel.",
  'rose':         "Rosé all day! 🌹 The classic Ibiza choice — here are our finest rosé bottles.",
  'beer':         "Cold beers coming up! 🍺 Nothing beats an ice cold beer in the Ibiza heat.",
  'non-alcoholic':"Great choice 🫧 Plenty of amazing non-alcoholic options — energy drinks, sparkling water and premium soft drinks.",
  'no alcohol':   "No problem! 🌊 We have loads of great soft drinks and waters — here are my picks.",
  'soft drinks':  "Soft drinks sorted! 🥤 Here are the most popular options we deliver.",
  'energy':       "Energy boost incoming! ⚡ Here are the best energy drinks we carry.",
  'mixer':        "Mixers are essential! 💧 Fever-Tree and Schweppes are the go-to — here's what we stock.",
  'snack':        "Getting the munchies in! 🍿 Here are the best snacks to go with your drinks.",
  'snacks':       "Snack attack! 🍿 Here's what people love with their drinks in Ibiza.",
  'smoke':        "We've got you covered 🚬 Here are the most popular tobacco products we deliver.",
  'smokers':      "Smoker's essentials! 🚬 Most popular cigarettes, rolling tobacco and nicotine pouches.",
  'smokers pack': "Full smoker's pack incoming 🚬 Cigarettes, rolling tobacco and nicotine pouches — all delivered to your door.",
  'cigar':        "Cigar time 🚬 For a proper occasion, light up one of these fine cigars.",
  'vape':         "Vape essentials! 💨 Here are the most popular disposable vapes we stock.",
  'ibiza':        "Classic Ibiza night! 🌴 Here's the ultimate combo for a proper Ibiza experience.",
  'ibiza night':  "Ibiza night sorted! 🌙 Champagne, spirits and ice — the holy trinity.",
  'classic ibiza':"The classic Ibiza setup 🌴 Rosé, gin and something to keep it all cold.",
  'ice':          "Ice is essential in Ibiza! 🧊 Here are the bag sizes we carry.",
  'water':        "Staying hydrated! 💧 Premium waters delivered cold to your door.",
  'default':      "Great taste! 🌴 Here are some of our most popular products in Ibiza right now.",
}

function getResponse(input) {
  const lower = input.toLowerCase().trim()
  // Try exact match first
  for (const key of Object.keys(VIBE_MAP)) {
    if (lower === key || lower.includes(key)) {
      const ids = VIBE_MAP[key].slice(0, 4)
      const products = ids.map(id => PRODUCTS.find(p => p.id === id)).filter(Boolean)
      return {
        text: RESPONSES[key] || RESPONSES['default'],
        products,
      }
    }
  }
  // Fuzzy word match fallback
  const words = lower.split(/\s+/)
  for (const word of words) {
    for (const key of Object.keys(VIBE_MAP)) {
      if (key.includes(word) || word.includes(key)) {
        const ids = VIBE_MAP[key].slice(0, 4)
        const products = ids.map(id => PRODUCTS.find(p => p.id === id)).filter(Boolean)
        return {
          text: RESPONSES[key] || RESPONSES['default'],
          products,
        }
      }
    }
  }
  // General product name search
  const nameMatches = PRODUCTS.filter(p => p.name.toLowerCase().includes(lower)).slice(0, 4)
  if (nameMatches.length > 0) {
    return {
      text: `Here's what we have matching "${input}" 🍾`,
      products: nameMatches,
    }
  }
  return {
    text: "I love the enthusiasm! 🌴 Let me suggest some Ibiza favourites for you.",
    products: PRODUCTS.filter(p => p.popular).slice(0, 4),
  }
}

// ── Product card inside the bot ───────────────────────────────
function BotProductCard({ product }) {
  const qty = useCartStore(s => s.items.find(i => i.product.id === product.id)?.quantity ?? 0)
  const { addItem, updateQuantity } = useCartStore()
  return (
    <div style={{ background:'rgba(255,255,255,0.07)', border:'0.5px solid rgba(255,255,255,0.13)', borderRadius:12, overflow:'hidden', width:130, flexShrink:0 }}>
      <div style={{ height:80, background:'linear-gradient(135deg,#0D3B4A,#1A5263)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:30, position:'relative' }}>
        {product.emoji}
        {qty===0
          ? <button onClick={()=>{ addItem(product); toast.success(product.emoji+' Added!',{duration:900}) }} style={{ position:'absolute',top:5,right:5,width:24,height:24,background:'#C4683A',border:'2px solid rgba(255,255,255,0.6)',borderRadius:'50%',color:'white',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',lineHeight:1 }}>+</button>
          : <div style={{ position:'absolute',top:5,right:5,display:'flex',alignItems:'center',gap:3,background:'rgba(0,0,0,0.6)',borderRadius:20,padding:'2px 6px' }}>
              <button onClick={()=>updateQuantity(product.id,qty-1)} style={{ width:16,height:16,background:'rgba(255,255,255,0.2)',border:'none',borderRadius:'50%',cursor:'pointer',fontSize:11,color:'white',display:'flex',alignItems:'center',justifyContent:'center' }}>−</button>
              <span style={{ fontSize:10,fontWeight:500,color:'white',minWidth:10,textAlign:'center' }}>{qty}</span>
              <button onClick={()=>updateQuantity(product.id,qty+1)} style={{ width:16,height:16,background:'#C4683A',border:'none',borderRadius:'50%',cursor:'pointer',fontSize:11,color:'white',display:'flex',alignItems:'center',justifyContent:'center' }}>+</button>
            </div>
        }
      </div>
      <div style={{ padding:'7px 8px 9px' }}>
        <div style={{ fontSize:10,fontWeight:500,color:'white',lineHeight:1.3,marginBottom:2,height:26,overflow:'hidden' }}>{product.name}</div>
        <div style={{ fontSize:12,fontWeight:500,color:'#E8A070' }}>€{product.price.toFixed(2)}</div>
      </div>
    </div>
  )
}

export default function AssistBot({ onClose }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    setMessages([{
      role:'assistant',
      content:"Hey! I'm Isla 🌴 Your Ibiza drinks advisor. Tell me what you're planning and I'll find the perfect picks. What's the vibe tonight?",
      products:[],
    }])
    setTimeout(() => inputRef.current?.focus(), 300)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' })
  }, [messages, loading])

  const QUICK_PROMPTS = [
    '🎉 Planning a party',
    '🌅 Sundowner drinks',
    '🏖 Beach day essentials',
    '🥃 Premium spirits night',
    '🍾 Champagne celebration',
    '🌴 Classic Ibiza night out',
    '🍹 Cocktail making',
    '🤿 Non-alcoholic options',
  ]

  const send = async (text) => {
    const trimmed = (text || input).trim()
    if (!trimmed || loading) return
    const userMsg = { role:'user', content:trimmed, products:[] }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    // Small delay to feel natural
    await new Promise(r => setTimeout(r, 600))
    const { text: reply, products } = getResponse(trimmed)
    setMessages(prev => [...prev, { role:'assistant', content:reply, products }])
    setLoading(false)
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:300, display:'flex', flexDirection:'column', background:'linear-gradient(170deg,#0A2A38 0%,#0D3545 35%,#1A5060 70%,#2B7A8B 100%)', maxWidth:480, margin:'0 auto' }}>
      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,#0D3B4A,#1A5263)', padding:'16px 16px 14px', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={onClose} style={{ width:36,height:36,background:'rgba(255,255,255,0.1)',border:'0.5px solid rgba(255,255,255,0.18)',borderRadius:'50%',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          </button>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:38,height:38,borderRadius:'50%',background:'linear-gradient(135deg,#C4683A,#E8854A)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
            </div>
            <div>
              <div style={{ fontFamily:'DM Serif Display,serif', fontSize:18, color:'white', lineHeight:1 }}>Isla</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', marginTop:2 }}>Your Ibiza drinks advisor</div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex:1, overflowY:'auto', padding:'16px 16px 8px', display:'flex', flexDirection:'column', gap:12 }}>
        {messages.map((msg, i) => {
          const isBot = msg.role==='assistant'
          return (
            <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:isBot?'flex-start':'flex-end', gap:6 }}>
              {isBot && (
                <div style={{ display:'flex', alignItems:'flex-end', gap:8 }}>
                  <div style={{ width:28,height:28,borderRadius:'50%',background:'linear-gradient(135deg,#C4683A,#E8854A)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginBottom:2 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="white"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
                  </div>
                  <div style={{ background:'rgba(255,255,255,0.09)',border:'0.5px solid rgba(255,255,255,0.12)',borderRadius:'16px 16px 16px 4px',padding:'10px 14px',maxWidth:'80%' }}>
                    <div style={{ fontSize:14,color:'white',lineHeight:1.55,fontFamily:'DM Sans,sans-serif' }}>{msg.content}</div>
                  </div>
                </div>
              )}
              {!isBot && (
                <div style={{ background:'#C4683A',borderRadius:'16px 16px 4px 16px',padding:'10px 14px',maxWidth:'80%' }}>
                  <div style={{ fontSize:14,color:'white',lineHeight:1.55,fontFamily:'DM Sans,sans-serif' }}>{msg.content}</div>
                </div>
              )}
              {isBot && msg.products && msg.products.length>0 && (
                <div style={{ marginLeft:36,display:'flex',gap:8,overflowX:'auto',paddingBottom:4,scrollbarWidth:'none',width:'100%' }}>
                  {msg.products.map(p=><BotProductCard key={p.id} product={p}/>)}
                </div>
              )}
            </div>
          )
        })}

        {loading && (
          <div style={{ display:'flex', alignItems:'flex-end', gap:8 }}>
            <div style={{ width:28,height:28,borderRadius:'50%',background:'linear-gradient(135deg,#C4683A,#E8854A)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="white"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
            </div>
            <div style={{ background:'rgba(255,255,255,0.09)',border:'0.5px solid rgba(255,255,255,0.12)',borderRadius:'16px 16px 16px 4px',padding:'12px 16px',display:'flex',gap:5,alignItems:'center' }}>
              {[0,1,2].map(d=>(
                <div key={d} style={{ width:7,height:7,borderRadius:'50%',background:'rgba(255,255,255,0.45)',animation:`bounce 1.2s ${d*0.2}s infinite ease-in-out`}}/>
              ))}
            </div>
          </div>
        )}

        {messages.length===1 && !loading && (
          <div style={{ display:'flex', flexWrap:'wrap', gap:7, marginTop:4 }}>
            {QUICK_PROMPTS.map(p=>(
              <button key={p} onClick={()=>send(p)}
                style={{ padding:'8px 13px',background:'rgba(255,255,255,0.07)',border:'0.5px solid rgba(255,255,255,0.14)',borderRadius:20,fontFamily:'DM Sans,sans-serif',fontSize:12,cursor:'pointer',color:'rgba(255,255,255,0.8)' }}>
                {p}
              </button>
            ))}
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Input */}
      <div style={{ padding:'10px 16px 24px', flexShrink:0, background:'rgba(10,30,40,0.7)', backdropFilter:'blur(12px)', borderTop:'0.5px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <div style={{ flex:1,background:'rgba(255,255,255,0.09)',border:'0.5px solid rgba(255,255,255,0.14)',borderRadius:24,padding:'11px 16px',display:'flex',alignItems:'center' }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); send() } }}
              placeholder="Describe your vibe… beach day, VIP night…"
              style={{ flex:1,border:'none',background:'none',fontFamily:'DM Sans,sans-serif',fontSize:14,color:'white',outline:'none' }}
            />
          </div>
          <button onClick={()=>send()} disabled={!input.trim()||loading}
            style={{ width:44,height:44,background:input.trim()&&!loading?'#C4683A':'rgba(255,255,255,0.08)',border:'none',borderRadius:'50%',cursor:input.trim()&&!loading?'pointer':'default',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'background 0.15s' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M22 2L11 13"/><path d="M22 2L15 22l-4-9-9-4 20-7z"/></svg>
          </button>
        </div>
        <div style={{ fontSize:10,color:'rgba(255,255,255,0.22)',textAlign:'center',marginTop:8,fontFamily:'DM Sans,sans-serif' }}>
          Isla Drop AI · 24/7 Ibiza
        </div>
      </div>

      <style>{`@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}`}</style>
    </div>
  )
}
