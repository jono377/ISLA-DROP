import { useState, useRef, useEffect } from 'react'
import { PRODUCTS } from '../../lib/products'
import { useCartStore } from '../../lib/store'
import toast from 'react-hot-toast'

// ── Local smart matching — no API key needed ──────────────────
// This runs entirely in the browser with zero API calls.
// Isla uses keyword matching + a curated vibe map to suggest products.

const VIBE_MAP = {
  // Occasions
  'party':           ['ch-001','ch-010','ch-011','br-001','br-004','ic-002','sn-029','es-004','es-005'],
  'planning a party':['ch-001','ch-010','br-002','ic-002','sn-033','es-003','es-004','es-005','es-008'],
  'celebrate':       ['ch-001','ch-002','ch-008','ch-011','wn-021','sn-041','sn-037'],
  'birthday':        ['ch-001','ch-002','sn-041','sn-037','sn-038','es-005'],
  'wedding':         ['ch-002','ch-001','wn-021','wn-015','sp-035','es-005'],
  'anniversary':     ['ch-002','wn-001','wn-003','sp-027','sn-041'],
  // Vibes
  'sundowner':       ['wn-021','wn-020','ch-007','sp-012','sd-028','ic-001'],
  'sunset':          ['wn-021','wn-015','ch-007','sp-012','sd-028'],
  'romantic':        ['wn-003','ch-002','sp-027','sn-041','wn-021'],
  'girls night':     ['ch-010','wn-021','sp-035','sd-019','sn-037'],
  'boys night':      ['br-001','br-004','sp-001','sp-022','sn-026','sn-024'],
  'date night':      ['ch-007','wn-003','wn-021','sp-013','sn-033','sn-041'],
  'ibiza':           ['wn-021','ch-010','sp-012','br-001','ic-002','sd-028'],
  'ibiza night':     ['ch-010','sp-035','sp-012','wn-021','ic-002'],
  'classic ibiza':   ['wn-021','sp-012','ch-010','br-001','ic-002'],
  'vip':             ['ch-002','sp-001','sp-027','sp-015','sp-037'],
  'vip night':       ['ch-002','sp-001','sp-015','sp-027','wn-001'],
  'pool party':      ['br-001','br-004','ic-002','wt-002','sd-021','sn-029','bh-013'],
  // Drinks
  'cocktail':        ['sp-033','sp-035','sp-012','sp-013','sd-025','sd-028'],
  'cocktails':       ['sp-035','sp-033','sp-012','sp-013','sd-025','sd-028'],
  'champagne':       ['ch-001','ch-002','ch-008','ch-010','ch-011'],
  'prosecco':        ['ch-007','ch-008'],
  'wine':            ['wn-003','wn-004','wn-021','wn-010','wn-022'],
  'rosé':            ['wn-021','wn-020','wn-015','wn-022'],
  'rose':            ['wn-021','wn-020','wn-015','wn-018'],
  'red wine':        ['wn-001','wn-002','wn-003','wn-004','wn-005'],
  'white wine':      ['wn-010','wn-011','wn-012','wn-013'],
  'beer':            ['br-001','br-004','br-007','br-011','br-013'],
  'craft beer':      ['br-007','br-008','br-009','br-010','br-011'],
  'cider':           ['br-013','br-014'],
  'tequila':         ['sp-001','sp-002','sp-007','sp-011','sp-010'],
  'gin':             ['sp-012','sp-013','sp-014'],
  'vodka':           ['sp-035','sp-033','sp-039','sp-037','sp-036'],
  'rum':             ['sp-022','sp-024','sp-025','sp-026'],
  'cognac':          ['sp-027','sp-028','sp-029','sp-031'],
  'whiskey':         ['sp-015','sp-016','sp-017','sp-018','sp-019','sp-021'],
  'whisky':          ['sp-015','sp-016','sp-017','sp-019','sp-021'],
  'spirits':         ['sp-035','sp-012','sp-022','sp-033','sp-028'],
  'premium spirits': ['sp-015','sp-017','sp-021','sp-001','sp-027'],
  // Non-alcoholic
  'non-alcoholic':   ['sd-021','sd-022','wt-002','wt-001','wt-003','sd-019'],
  'soft drinks':     ['sd-001','sd-015','sd-021','sd-019','sd-028'],
  'energy':          ['sd-021','sd-022','sd-023'],
  'mixer':           ['sd-025','sd-028','sd-024','sd-026','sd-029'],
  'water':           ['wt-001','wt-002','wt-003'],
  // Food / Snacks
  'snack':           ['sn-027','sn-026','sn-033','sn-030','sn-024'],
  'snacks':          ['sn-027','sn-026','sn-033','sn-030','sn-024'],
  'crisps':          ['sn-027','sn-020','sn-028','sn-025','sn-046'],
  'sweet':           ['sn-037','sn-038','sn-041','sn-040','sn-054'],
  'chocolate':       ['sn-040','sn-041','sn-042','sn-043','sn-045'],
  'spanish':         ['sn-026','sn-033','sn-034','sn-035','sn-054'],
  // Settings
  'beach':           ['bh-001','bh-003','bh-005','bh-006','bh-009','bh-011','ic-002','wt-002'],
  'beach day':       ['bh-003','bh-009','bh-015','ic-002','wt-002','sd-021','sn-029'],
  'pool':            ['bh-013','bh-003','ic-002','wt-002','sd-021','sn-049'],
  'boat':            ['wn-021','sp-012','ic-002','wt-002','sn-027','bh-015'],
  'villa':           ['ch-010','wn-021','sp-012','ic-002','sn-033','es-008'],
  // Tobacco
  'smoke':           ['tb-001','tb-003','tb-011','tb-015'],
  'smokers':         ['tb-001','tb-003','tb-006','tb-011','tb-015'],
  'cigar':           ['tb-048','tb-050','tb-053','tb-019','tb-020'],
  'premium cigar':   ['tb-048','tb-051','tb-055','tb-049','tb-053'],
  'vape':            ['tb-028','tb-029','tb-031','tb-035'],
  // Essentials
  'party supplies':  ['es-003','es-004','es-005','es-006','es-007','es-008'],
  'essentials':      ['es-011','es-013','es-015','es-016','es-012'],
  'sunscreen':       ['es-013','es-014','wl-022','wl-023'],
  // Health
  'hangover':        ['wl-013','wl-014','wl-012','wl-011','wt-002','wl-020'],
  'headache':        ['wl-011','wl-012','wl-014','wt-002'],
  'health':          ['wl-010','wl-013','wl-014','wl-015','wl-020'],
  'recovery':        ['wl-013','wl-014','wl-020','wl-015','wt-002'],
  // Ice
  'ice':             ['ic-001','ic-002','ic-003'],
}

const RESPONSES = {
  'party':           "Let's get this party STARTED! 🎉 Here's your ultimate party pack — champagne, cold beers, ice and cups to keep the night going.",
  'planning a party':"Party mode activated! 🥂 Stock up on bubbles, beers and grab the party essentials — plates, cups and ice.",
  'celebrate':       "Congratulations! 🍾 Nothing says celebration like great champagne. Here are my top picks for your special moment.",
  'birthday':        "Happy Birthday! 🎂 Let's make it a night to remember — champagne, chocolates and something special.",
  'wedding':         "Congratulations! 💍 For a wedding we're thinking the finest champagne and elegant wines.",
  'anniversary':     "How romantic! 🌹 A special bottle of wine or champagne and something indulgent — perfect.",
  'sundowner':       "Golden hour calls for something special 🌅 A chilled rosé or G&T with Fever-Tree — pure Ibiza magic.",
  'sunset':          "The perfect sunset moment 🌅 Pale rosé, crisp gin & tonic — I envy you right now.",
  'romantic':        "Ooh la la! 💕 A beautiful bottle of wine, some chocolates and champagne — set the scene perfectly.",
  'girls night':     "Girls night OUT! 💅 Champagne, rosé, good cocktail spirits and sweet treats — you're sorted.",
  'boys night':      "Lads on tour! 🍺 Cold beers, tequila shots, strong spirits and plenty of snacks — let's go.",
  'date night':      "First date energy! 😍 A bottle of good wine or prosecco, something to nibble and a great atmosphere.",
  'ibiza':           "Classic Ibiza! 🌴 Rosé, gin, cold beers and ice — the holy trinity of the island.",
  'ibiza night':     "Ibiza nights are different here 🌙 Champagne to start, spirits to keep going, ice to keep it cold.",
  'classic ibiza':   "The classic setup 🌴 Whispering Angel rosé, Hendricks gin, cold beers and plenty of ice.",
  'vip':             "Going VIP tonight? 🌟 Only the finest — Armand de Brignac, aged tequila or XO cognac.",
  'vip night':       "VIP treatment 👑 Think Ace of Spades, Don Julio 1942 or Johnnie Walker Blue Label.",
  'pool party':      "Pool party perfection! 💦 Cold beers, ice, sparkling water, snacks and a lilo to float on.",
  'cocktail':        "Cocktail hour! 🍹 Premium spirits plus Fever-Tree mixers — here's what I'd grab.",
  'cocktails':       "Let's mix things up! 🍸 Quality vodka or gin, mixers, ice — you're the bartender tonight.",
  'champagne':       "Ooh bubbles! 🥂 From Moët to Armand de Brignac — here are the best we carry.",
  'prosecco':        "Prosecco time! 🍾 Light, fresh and very Ibiza — here's what we have.",
  'wine':            "Great choice! 🍷 We carry some excellent bottles — here are my recommendations.",
  'rosé':            "Rosé all day! 🌹 Ibiza basically runs on Whispering Angel — and we have the best.",
  'rose':            "The Ibiza staple! 🌹 A chilled rosé on the terrace is perfection.",
  'red wine':        "A proper red! 🍷 From Rioja to premium Bordeaux — here's our selection.",
  'white wine':      "Crisp and refreshing! 🥂 Perfect with the Ibiza heat — here's what we have.",
  'beer':            "Cold beers incoming! 🍺 Nothing beats an ice cold beer in the Ibiza sunshine.",
  'craft beer':      "Good taste in beer! 🍺 Our craft selection from local Spanish and European breweries.",
  'tequila':         "Tequila time! 🌵 From smooth blanco to aged añejo — here are the best we stock.",
  'gin':             "Gin o'clock! 🌿 Perfect for G&Ts in the heat. Here are our finest gins.",
  'vodka':           "Clean and smooth 🍸 Perfect for cocktails or straight. Here are our top vodkas.",
  'rum':             "Rum vibes! 🍹 From white to dark and aged — here's our rum selection.",
  'cognac':          "Sophisticated choice 🥃 A fine cognac for a special moment. Here are our best.",
  'whiskey':         "A whisky lover! 🥃 From Macallan to Yamazaki — here are the finest we stock.",
  'whisky':          "Excellent taste 🥃 Japanese single malts, aged Scotch — here's what we recommend.",
  'spirits':         "Getting the spirits in 🥃 These are the most popular bottles we deliver.",
  'premium spirits': "Going premium tonight! ✨ The finest bottles in our collection — nothing but the best.",
  'non-alcoholic':   "Great choice! 🫧 Plenty of amazing options — energy drinks, sparkling water and premium sodas.",
  'soft drinks':     "Soft drinks sorted! 🥤 Here are the most popular options we deliver.",
  'energy':          "Energy boost incoming! ⚡ Best energy drinks to keep the night going.",
  'mixer':           "Mixers are KEY! 💧 Fever-Tree and Schweppes are the way to go.",
  'water':           "Stay hydrated! 💧 Premium waters — essential in the Ibiza heat.",
  'snack':           "Getting peckish! 🍿 Here are the best snacks to go with your drinks.",
  'snacks':          "Snack attack! 🍿 Here's what people love to munch on in Ibiza.",
  'crisps':          "Crisp lovers! 🥔 From Spanish classics to the fancy Torres truffle ones.",
  'sweet':           "Sweet tooth! 🍫 Chocolates, gummies and Spanish treats coming up.",
  'chocolate':       "Chocolate lover! 🍫 From Toblerone to Ferrero Rocher — indulge.",
  'spanish':         "Going local! 🇪🇸 Spanish delicacies — ibérico ham, manchego, olives and turron.",
  'beach':           "Beach ready! ☀️ Towels, swimwear, sunscreen and drinks to keep you hydrated.",
  'beach day':       "Perfect beach day! 🏖️ Quick-dry towel, waterproof phone case, cold drinks and snacks.",
  'pool':            "Pool vibes! 💦 A lilo, towel, cold drinks and snacks — everything for a perfect pool day.",
  'boat':            "Boat party! ⛵ Rosé, gin, water, snacks and a waterproof phone case — ahoy!",
  'villa':           "Villa party! 🏡 Stock the terrace — champagne, rosé, ice, olives and a corkscrew.",
  'smoke':           "Smoking essentials! 🚬 Most popular cigarettes and tobacco we deliver.",
  'smokers':         "Smoker's full pack! 🚬 Cigarettes, rolling tobacco, pouches and a lighter.",
  'cigar':           "Cigar aficionado! 🚬 From Montecristo to Cohiba — here are our finest.",
  'premium cigar':   "The finest cigars! 🚬 Cohiba Behike, Arturo Fuente — reserved for special occasions.",
  'vape':            "Vape essentials! 💨 Most popular disposable vapes — high puff count options.",
  'party supplies':  "Party supplies! 🎉 Cups, flutes, plates, straws and a corkscrew — you're set.",
  'essentials':      "Beach/party essentials! 🧴 Sunscreen, wet wipes, insect repellent and a lighter.",
  'sunscreen':       "Sun protection! ☀️ Essential in Ibiza — SPF50, after sun and lip balm.",
  'hangover':        "Rough morning? 😅 Alka-Seltzer, rehydration sachets, paracetamol and coconut water — the dream team.",
  'headache':        "Head pounding? 🤕 Ibuprofen, paracetamol and lots of water — you'll be fine!",
  'health':          "Health essentials! 💊 From vitamins to rehydration — we've got you covered.",
  'recovery':        "Recovery mode! 💪 Rehydration sachets, Berocca, coconut water and milk thistle for the liver.",
  'ice':             "Ice is essential in Ibiza! 🧊 Don't underestimate how fast it melts here.",
  'default':         "Great taste! 🌴 Here are some of our most popular products in Ibiza right now.",
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
