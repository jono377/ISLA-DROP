import { useState, useRef, useEffect, useCallback } from 'react'
import { PRODUCTS } from '../../lib/products'
import { useCartStore, useAuthStore } from '../../lib/store'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

// ── Time-aware quick prompts ──────────────────────────────────
function getSmartPrompts() {
  const h = new Date().getHours()
  if (h >= 6 && h < 11)  return ['Breakfast supplies','Morning energy drinks','Hangover cure 🤕','Beach day essentials']
  if (h >= 11 && h < 16) return ['Lunch drinks','Pool party drinks','Beach day','Afternoon rosé 🌹']
  if (h >= 16 && h < 20) return ['Sundowner drinks 🌅','Pre-dinner cocktails','Boat trip supplies','VIP premium spirits']
  if (h >= 20 && h < 23) return ['Party tonight 🎉','Club night supplies','Dinner drinks','Late night snacks']
  return ['Late night drinks 🌙','After party','VIP night out','Midnight snacks']
}

// ── Order history context ────────────────────────────────────
async function getUserOrderContext(userId) {
  if (!userId) return ''
  const { data } = await supabase.from('orders')
    .select('order_items(products(name,emoji,category))')
    .eq('customer_id', userId).eq('status','delivered')
    .order('created_at',{ascending:false}).limit(5)
  if (!data?.length) return ''
  const names = []
  data.forEach(o => (o.order_items||[]).forEach(i => { if(i.products?.name) names.push(i.products.emoji+' '+i.products.name) }))
  const unique = [...new Set(names)].slice(0,8)
  return unique.length ? 'Customer has previously ordered: '+unique.join(', ') : ''
}

// ── In-stock product filter ──────────────────────────────────
async function getAvailableProducts() {
  const { data } = await supabase.from('products').select('id').eq('is_active',true).gt('stock_quantity',0)
  if (!data) return null
  return new Set(data.map(p=>p.id))
}

// ── Claude API call ──────────────────────────────────────────
async function askIsla(messages, cartItems=[], userId=null) {
  const [inStockIds, orderContext] = await Promise.all([
    getAvailableProducts(),
    getUserOrderContext(userId)
  ])

  const catalogue = PRODUCTS
    .filter(p => !inStockIds || inStockIds.has(p.id))
    .map(p => p.id+'|'+p.name+'|'+p.category+'|'+(p.sub||'')+'|'+p.emoji+'|€'+p.price.toFixed(2))
    .join('\n')

  const cartSummary = cartItems.length > 0
    ? 'Current basket: '+cartItems.map(i=>i.product.name+' x'+i.quantity).join(', ')
    : 'Basket is empty'

  const timeCtx = (()=>{
    const h = new Date().getHours()
    if (h < 11) return 'It is morning in Ibiza.'
    if (h < 16) return 'It is afternoon in Ibiza.'
    if (h < 20) return 'It is early evening in Ibiza — golden hour.'
    if (h < 23) return 'It is evening in Ibiza — peak party time.'
    return 'It is late night in Ibiza — clubs are open.'
  })()

  const system = 'You are Isla, the personal AI concierge for Isla Drop — a premium 24/7 delivery service in Ibiza. You deliver drinks, food, tobacco and essentials to villas, hotels, beaches and clubs.\n\n'
    + 'PERSONALITY: Warm, knowledgeable, genuinely helpful with Ibiza glamour. Friendly but never sycophantic. Creative — think beyond the obvious.\n\n'
    + 'CONTEXT: ' + timeCtx + '\n'
    + (orderContext ? orderContext + '\n\n' : '')
    + cartSummary + '\n\n'
    + 'AVAILABLE IN-STOCK PRODUCTS (id|name|category|sub|emoji|price):\n' + catalogue + '\n\n'
    + 'IBIZA KNOWLEDGE: Sunset Strip sundowners, DC-10 afterparties, Ushuaia pool parties, Pacha, boat trips to Formentera, villa gatherings, beach clubs (Nikki Beach, Blue Marlin, Experimental Beach). '
    + 'Know what each venue/occasion needs. If someone mentions a specific club or venue, suggest appropriate drinks.\n\n'
    + 'YOUR CAPABILITIES:\n'
    + '- Suggest products tailored to occasion, mood, group size, budget\n'
    + '- Upsell naturally: champagne → ice, spirits → mixers\n'
    + '- Reference previous orders: "You ordered Hendricks last time — want to restock?"\n'
    + '- Build complete party/event packages\n'
    + '- Answer questions about Ibiza, give local tips\n'
    + '- Suggest concierge services (boats, tables, villas) when relevant\n\n'
    + 'PRODUCT SUGGESTION FORMAT — end message with PRODUCTS:["id1","id2",...] (2-5 IDs max, only from the list above)\n'
    + 'ADD-ALL FORMAT — if suggesting 3+ products as a set, add ADDALL:true after PRODUCTS line\n'
    + 'CONCIERGE FORMAT — if concierge services would help, add CONCIERGE:true\n'
    + 'If no product fit, omit PRODUCTS entirely.\n\n'
    + 'RULES: Under 130 words. Natural emoji use. Never say cannot help. Never repeat greetings. '
    + 'Be specific with product names. Vary your recommendations based on conversation history.'

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method:'POST',
    headers:{
      'Content-Type':'application/json',
      'anthropic-version':'2023-06-01',
      'anthropic-dangerous-direct-browser-access':'true',
      'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY || '',
    },
    body: JSON.stringify({
      model:'claude-sonnet-4-20250514', max_tokens:350, system,
      messages: messages.map(m=>({ role:m.role, content:m.content }))
    })
  })

  if (!resp.ok) throw new Error('API ' + resp.status)
  const data = await resp.json()
  const raw = data.content?.[0]?.text ?? ''

  const prodMatch = raw.match(/PRODUCTS:\[([^\]]*)\]/)
  const ids = prodMatch ? prodMatch[1].replace(/"/g,'').split(',').map(s=>s.trim()).filter(Boolean) : []
  const showConcierge = raw.includes('CONCIERGE:true')
  const addAll = raw.includes('ADDALL:true')
  const text = raw.replace(/PRODUCTS:\[.*?\]/,'').replace('ADDALL:true','').replace('CONCIERGE:true','').trim()
  const products = ids.map(id=>PRODUCTS.find(p=>p.id===id)).filter(Boolean)

  return { text, products, showConcierge, addAll }
}

// ── Smart local fallback ──────────────────────────────────────
function localResponse(input) {
  const q = input.toLowerCase()
  const h = new Date().getHours()
  const keywordMap = [
    { keys:['beach','pool','swim'],     ids:['bh-003','bh-009','ic-002','wt-002','sn-029','es-013'], text:"Beach day sorted! 🏖️ Towel, flip flops, ice cold water and sunscreen — you're set." },
    { keys:['party','celebrate','birthday'], ids:['ch-001','ch-010','br-001','ic-002','sn-041','es-005'], text:"Party time! 🎉 Champagne, cold beers, ice and cups — essentials covered." },
    { keys:['sundowner','sunset'],      ids:['wn-021','sp-012','sd-028','ic-001'], text:"Golden hour vibes 🌅 Whispering Angel rosé or a G&T — pure Ibiza." },
    { keys:['hangover','rough','morning'], ids:['wl-013','wl-014','wl-012','wl-020','wt-002'], text:"Recovery mode! 💊 Alka-Seltzer, Dioralyte, paracetamol and coconut water." },
    { keys:['vip','premium','luxury'],  ids:['ch-002','sp-001','sp-027','tb-048'], text:"Only the finest tonight 👑 Armand de Brignac, aged tequila and a premium cigar." },
    { keys:['cocktail','mix'],          ids:['sp-012','sp-035','sd-028','sd-025','ic-002'], text:"Cocktail hour! 🍸 Good gin or vodka, Fever-Tree mixers and plenty of ice." },
    { keys:['boat','yacht','sea'],      ids:['wt-002','br-001','sd-021','sn-004','ic-002'], text:"Boat life! ⛵ Water, cold beers, ice and snacks — perfect for a day at sea." },
    { keys:['wine','rosé'],             ids:['wn-021','wn-001','wn-015','ic-001'], text:"Wine time 🍷 Our rosé and white wine selection is perfect for Ibiza evenings." },
    { keys:['night','club','dc10','dc-10','ushuaia','pacha'], ids:['sp-035','sp-012','br-001','sd-001','ic-002'], text:"Club night! 🎵 Pre-drinks essentials — spirits, mixers, beers and ice." },
  ]
  const timeDefault = h < 11
    ? { ids:['wt-002','sd-001','wl-013','sn-004'], text:"Good morning! ☀️ Hydration and energy for the day ahead." }
    : h < 20
      ? { ids:['br-001','sd-021','sn-009','ic-001'], text:"Great choice! 🌴 Some of our most popular picks right now." }
      : { ids:['ch-001','sp-033','br-001','ic-002'], text:"Night is young! 🌙 Here's what's popular for tonight." }

  for (const { keys, ids, text } of keywordMap) {
    if (keys.some(k=>q.includes(k))) {
      return { text, products:ids.map(id=>PRODUCTS.find(p=>p.id===id)).filter(Boolean), addAll:ids.length>=3 }
    }
  }
  return { text:timeDefault.text, products:timeDefault.ids.map(id=>PRODUCTS.find(p=>p.id===id)).filter(Boolean) }
}

// ── Product card for bot ──────────────────────────────────────
function BotProductCard({ product }) {
  const qty = useCartStore(s=>s.items.find(i=>i.product.id===product.id)?.quantity??0)
  const { addItem, updateQuantity } = useCartStore()
  return (
    <div style={{ background:'rgba(255,255,255,0.1)', border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:12, overflow:'hidden', minWidth:110, maxWidth:110, flexShrink:0 }}>
      <div style={{ height:80, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(255,255,255,0.07)', fontSize:36 }}>
        {product.emoji}
      </div>
      <div style={{ padding:'8px 10px 10px' }}>
        <div style={{ fontSize:10, color:'rgba(255,255,255,0.8)', lineHeight:1.3, marginBottom:4, height:24, overflow:'hidden' }}>{product.name}</div>
        <div style={{ fontSize:12, fontWeight:700, color:'#E8A070', marginBottom:6 }}>€{product.price.toFixed(2)}</div>
        {qty===0 ? (
          <button onClick={()=>{addItem(product);navigator.vibrate?.(25);toast.success(product.emoji+' Added!',{duration:800})}}
            style={{ width:'100%', padding:'5px 0', background:'#C4683A', border:'none', borderRadius:8, color:'white', fontSize:11, fontWeight:700, cursor:'pointer' }}>
            Add
          </button>
        ) : (
          <div style={{ display:'flex', alignItems:'center', gap:4, justifyContent:'center' }}>
            <button onClick={()=>updateQuantity(product.id,qty-1)} style={{ width:20,height:20,background:'rgba(255,255,255,0.15)',border:'none',borderRadius:'50%',color:'white',fontSize:11,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>−</button>
            <span style={{ fontSize:12,color:'white',minWidth:12,textAlign:'center' }}>{qty}</span>
            <button onClick={()=>updateQuantity(product.id,qty+1)} style={{ width:20,height:20,background:'#C4683A',border:'none',borderRadius:'50%',color:'white',fontSize:11,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>+</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Voice input hook ─────────────────────────────────────────
function useVoiceInput(onResult) {
  const [listening, setListening] = useState(false)
  const recRef = useRef(null)

  const toggle = useCallback(() => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRec) { toast('Voice not supported in this browser'); return }
    if (listening) { recRef.current?.stop(); setListening(false); return }
    const rec = new SpeechRec()
    rec.lang = 'en-GB'; rec.interimResults = false; rec.maxAlternatives = 1
    rec.onresult = (e) => { onResult(e.results[0][0].transcript); setListening(false) }
    rec.onerror = () => setListening(false)
    rec.onend = () => setListening(false)
    recRef.current = rec
    rec.start()
    setListening(true)
  }, [listening, onResult])

  return { listening, toggle }
}

// ── Fuzzy match ──────────────────────────────────────────────
function fuzzyMatch(str, query) {
  if (!query) return false
  const s = str.toLowerCase(); const q = query.toLowerCase()
  if (s.includes(q)) return true
  let qi = 0
  for (let i = 0; i < s.length && qi < q.length; i++) { if (s[i] === q[qi]) qi++ }
  return qi === q.length
}

// ═══════════════════════════════════════════════════════════════
// MAIN ASSISTBOT
// ═══════════════════════════════════════════════════════════════
export default function AssistBot({ onClose, onConcierge, initialQuery }) {
  const { user } = useAuthStore()
  const cart = useCartStore()
  const { addItem } = useCartStore()
  const [messages, setMessages] = useState(() => {
    // If launched from search with a query, start fresh for that query
    if (initialQuery) return [{
      role:'assistant',
      content: "Hey! I'm Isla 🌴 I can see you're thinking about \"" + initialQuery + "\" — let me build the perfect selection for you!",
      products:[]
    }]
    try {
      const saved = sessionStorage.getItem('isla_chat')
      if (saved) return JSON.parse(saved)
    } catch {}
    return [{
      role:'assistant',
      content: "Hey! I'm Isla 🌴 Your personal Ibiza concierge. Tell me what you're planning and I'll curate the perfect selection — drinks, snacks, beach gear, whatever you need. What's the occasion?",
      products:[]
    }]
  })
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [useApi, setUseApi] = useState(true)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const quickPrompts = getSmartPrompts()

  // Persist conversation for 24 hours
  useEffect(() => {
    try { sessionStorage.setItem('isla_chat', JSON.stringify(messages.slice(-20))) } catch {}
  }, [messages])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }) }, [messages, loading])
  useEffect(() => {
    setTimeout(()=>inputRef.current?.focus(), 400)
    // Auto-send the search query that launched Isla
    if (initialQuery && initialQuery.trim()) {
      setTimeout(()=>send(initialQuery.trim()), 600)
    }
  }, [])

  const { listening, toggle: toggleVoice } = useVoiceInput((text) => {
    setInput(text)
    setTimeout(() => send(text), 100)
  })

  const addAllToBasket = (products) => {
    products.forEach(p => addItem(p))
    navigator.vibrate?.([20, 50, 20])
    toast.success(products.length + ' items added to basket! 🛒', { duration:1800 })
  }

  const send = useCallback(async (text) => {
    const trimmed = (text||input).trim()
    if (!trimmed || loading) return
    const userMsg = { role:'user', content:trimmed, products:[] }
    const history = [...messages, userMsg]
    setMessages(history)
    setInput('')
    setLoading(true)

    try {
      let reply, products=[], showConcierge=false, addAll=false
      if (useApi) {
        try {
          const result = await askIsla(
            history.map(m=>({ role:m.role, content:m.content })),
            cart.items, user?.id
          )
          reply = result.text; products = result.products; showConcierge = result.showConcierge; addAll = result.addAll
        } catch(apiErr) {
          console.warn('API fallback:', apiErr)
          setUseApi(false)
          const local = localResponse(trimmed)
          reply = local.text; products = local.products; addAll = local.addAll||false
        }
      } else {
        const local = localResponse(trimmed)
        reply = local.text; products = local.products; addAll = local.addAll||false
      }

      setMessages(prev=>[...prev, { role:'assistant', content:reply, products:products||[], showConcierge, addAll }])
    } catch {
      setMessages(prev=>[...prev, { role:'assistant', content:"Hit a little wave there! 🌊 Try asking me again.", products:[] }])
    }
    setLoading(false)
  }, [input, messages, loading, useApi, cart.items, user?.id])

  const clearChat = () => {
    sessionStorage.removeItem('isla_chat')
    setMessages([{ role:'assistant', content:"Fresh start! 🌴 What can I help you with?", products:[] }])
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:300, display:'flex', flexDirection:'column', background:'linear-gradient(170deg,#0A2A38 0%,#0D3545 35%,#1A5060 70%,#2B7A8B 100%)', maxWidth:480, margin:'0 auto' }}>

      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,#0D3B4A,#1A5263)', padding:'16px 16px 14px', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={onClose} style={{ width:36, height:36, background:'rgba(255,255,255,0.1)', border:'0.5px solid rgba(255,255,255,0.18)', borderRadius:'50%', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          </button>
          <div style={{ display:'flex', alignItems:'center', gap:10, flex:1 }}>
            <div style={{ width:38, height:38, borderRadius:'50%', background:'linear-gradient(135deg,#C4683A,#E8854A)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, position:'relative' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
              <div style={{ position:'absolute', bottom:0, right:0, width:10, height:10, borderRadius:'50%', background:'#7EE8A2', border:'1.5px solid #0D3545' }}/>
            </div>
            <div>
              <div style={{ fontFamily:'DM Serif Display,serif', fontSize:18, color:'white', lineHeight:1 }}>Isla</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.5)', marginTop:2 }}>
                {useApi ? '✨ AI-powered · knows your order history' : '🌴 Smart assistant'}
              </div>
            </div>
          </div>
          <button onClick={clearChat} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.35)', fontSize:10, cursor:'pointer', padding:'4px 8px' }}>Clear</button>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex:1, overflowY:'auto', padding:'16px 16px 8px', display:'flex', flexDirection:'column', gap:12 }}>
        {messages.map((msg,i) => {
          const isBot = msg.role === 'assistant'
          return (
            <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:isBot?'flex-start':'flex-end', gap:6 }}>
              {isBot && (
                <div style={{ display:'flex', alignItems:'flex-end', gap:8 }}>
                  <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,#C4683A,#E8854A)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginBottom:2 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="white"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
                  </div>
                  <div style={{ background:'rgba(255,255,255,0.09)', border:'0.5px solid rgba(255,255,255,0.12)', borderRadius:'16px 16px 16px 4px', padding:'10px 14px', maxWidth:'80%' }}>
                    <div style={{ fontSize:14, color:'white', lineHeight:1.55, fontFamily:'DM Sans,sans-serif', whiteSpace:'pre-wrap' }}>{msg.content}</div>
                  </div>
                </div>
              )}
              {!isBot && (
                <div style={{ background:'#C4683A', borderRadius:'16px 16px 4px 16px', padding:'10px 14px', maxWidth:'80%' }}>
                  <div style={{ fontSize:14, color:'white', lineHeight:1.55, fontFamily:'DM Sans,sans-serif' }}>{msg.content}</div>
                </div>
              )}
              {isBot && msg.products?.length > 0 && (
                <div style={{ marginLeft:36, width:'calc(100% - 36px)' }}>
                  <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:4, scrollbarWidth:'none' }}>
                    {msg.products.map(p=><BotProductCard key={p.id} product={p}/>)}
                  </div>
                  {msg.addAll && msg.products.length >= 3 && (
                    <button onClick={()=>addAllToBasket(msg.products)}
                      style={{ marginTop:8, width:'100%', padding:'9px', background:'rgba(196,104,58,0.2)', border:'0.5px solid rgba(196,104,58,0.4)', borderRadius:10, color:'#E8A070', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
                      🛒 Add all {msg.products.length} items to basket
                    </button>
                  )}
                </div>
              )}
              {isBot && msg.showConcierge && (
                <div style={{ marginLeft:36 }}>
                  <button onClick={()=>{ onConcierge?.(); onClose() }}
                    style={{ padding:'8px 14px', background:'linear-gradient(135deg,rgba(196,104,58,0.3),rgba(43,122,139,0.3))', border:'0.5px solid rgba(196,104,58,0.4)', borderRadius:20, fontSize:12, color:'white', cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
                    ★ View Concierge Services →
                  </button>
                </div>
              )}
            </div>
          )
        })}

        {loading && (
          <div style={{ display:'flex', alignItems:'flex-end', gap:8 }}>
            <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,#C4683A,#E8854A)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="white"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
            </div>
            <div style={{ background:'rgba(255,255,255,0.09)', border:'0.5px solid rgba(255,255,255,0.12)', borderRadius:'16px 16px 16px 4px', padding:'12px 16px', display:'flex', gap:5, alignItems:'center' }}>
              {[0,1,2].map(d=><div key={d} style={{ width:7, height:7, borderRadius:'50%', background:'rgba(255,255,255,0.45)', animation:'bounce 1.2s '+(d*0.2)+'s infinite ease-in-out' }}/>)}
            </div>
          </div>
        )}

        {messages.length === 1 && !loading && (
          <div style={{ display:'flex', flexWrap:'wrap', gap:7, marginTop:4 }}>
            {quickPrompts.map(p=>(
              <button key={p} onClick={()=>send(p)}
                style={{ padding:'8px 13px', background:'rgba(255,255,255,0.07)', border:'0.5px solid rgba(255,255,255,0.14)', borderRadius:20, fontFamily:'DM Sans,sans-serif', fontSize:12, cursor:'pointer', color:'rgba(255,255,255,0.8)', transition:'all 0.15s' }}>
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
          {/* Voice button */}
          <button onClick={toggleVoice}
            style={{ width:44, height:44, background:listening?'rgba(196,104,58,0.3)':'rgba(255,255,255,0.08)', border:'0.5px solid '+(listening?'rgba(196,104,58,0.5)':'rgba(255,255,255,0.14)'), borderRadius:'50%', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={listening?'#E8A070':'rgba(255,255,255,0.5)'} strokeWidth="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/>
            </svg>
          </button>
          <div style={{ flex:1, background:'rgba(255,255,255,0.09)', border:'0.5px solid rgba(255,255,255,0.14)', borderRadius:24, padding:'11px 16px', display:'flex', alignItems:'center' }}>
            <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()} }}
              placeholder={listening ? '🎤 Listening...' : 'Tell Isla what you need...'}
              style={{ flex:1, border:'none', background:'none', fontFamily:'DM Sans,sans-serif', fontSize:14, color:'white', outline:'none' }} />
          </div>
          <button onClick={()=>send()} disabled={!input.trim()||loading}
            style={{ width:44, height:44, background:input.trim()&&!loading?'#C4683A':'rgba(255,255,255,0.08)', border:'none', borderRadius:'50%', cursor:input.trim()&&!loading?'pointer':'default', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'background 0.15s' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M22 2L11 13"/><path d="M22 2L15 22l-4-9-9-4 20-7z"/></svg>
          </button>
        </div>
        <div style={{ fontSize:10, color:'rgba(255,255,255,0.22)', textAlign:'center', marginTop:8 }}>
          Powered by Claude AI · {useApi ? 'Personalised to you' : 'Smart offline mode'}
        </div>
      </div>

      <style>{`@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}`}</style>
    </div>
  )
}
