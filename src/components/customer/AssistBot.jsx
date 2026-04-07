import { useT_ctx } from '../../i18n/TranslationContext'
import { useState, useRef, useEffect } from 'react'
import { PRODUCTS, CATEGORIES } from '../../lib/products'
import { useCartStore } from '../../lib/store'
import toast from 'react-hot-toast'

// ── Claude API ────────────────────────────────────────────────
async function askIsla(messages, cartItems = []) {
  const catalogue = PRODUCTS.map(p =>
    `${p.id}|${p.name}|${p.category}|${p.sub || ''}|${p.emoji}|€${p.price.toFixed(2)}`
  ).join('\n')

  const cartSummary = cartItems.length > 0
    ? `Current basket: ${cartItems.map(i => `${i.product.name} x${i.quantity}`).join(', ')}`
    : 'Basket is empty'

  const system = `You are Isla — the sophisticated AI concierge for Isla Drop, a premium 24/7 delivery service in Ibiza, Spain. You deliver drinks, food, tobacco, beach gear and essentials to villas, hotels, beaches and clubs across the island.

Your personality: warm, knowledgeable, genuinely helpful, with a touch of Ibiza glamour. You know the island well. You think creatively about what people actually need for their occasion — not just the obvious choices.

PRODUCT CATALOGUE (id|name|category|subcategory|emoji|price):
${catalogue}

${cartSummary}

YOUR CAPABILITIES:
- Suggest products tailored to the customer's specific occasion, mood, group size, budget and preferences
- Think beyond the obvious: if someone says "beach day" suggest towels, sunscreen AND drinks AND snacks
- Consider the time of day, season, group type (families, couples, party groups, solo travellers)
- Upsell thoughtfully: if someone wants champagne, mention ice to keep it cold
- Know Ibiza: Sunset Strip sundowners, DC-10 afterparties, Ushuaia pool parties, boat trips, villa gatherings
- Be creative with cocktail suggestions, pairing food with drinks, beach essentials bundles
- You can chat naturally — answer questions about Ibiza, make recommendations, be a friend

PRODUCT SUGGESTION FORMAT:
When recommending products, end your message with exactly this (no markdown, raw JSON):
PRODUCTS:["id1","id2","id3","id4"]

Include 2-5 product IDs maximum. Only use IDs from the catalogue above.
If the conversation is casual/informational with no product fit, omit the PRODUCTS line entirely.

RULES:
- Keep replies conversational and under 120 words
- Use emojis naturally, not excessively  
- Never say you cannot help — always find a way to assist
- If asked about something outside delivery, be helpful but gently redirect to what you can deliver`

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
      system,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    }),
  })

  if (!resp.ok) throw new Error(`API ${resp.status}`)
  const data = await resp.json()
  const raw = data.content?.[0]?.text ?? ''

  const match = raw.match(/PRODUCTS:\[([^\]]*)\]/)
  const ids = match
    ? match[1].replace(/"/g, '').split(',').map(s => s.trim()).filter(Boolean)
    : []

  const showConcierge = raw.includes('CONCIERGE:true')
  const text = raw.replace(/PRODUCTS:\[.*?\]/, '').replace('CONCIERGE:true', '').trim()
  const products = ids.map(id => PRODUCTS.find(p => p.id === id)).filter(Boolean)

  return { text, products, showConcierge }
}

// ── Fallback local responses (when no API) ────────────────────
function localResponse(input) {
  const q = input.toLowerCase()
  const keywordMap = [
    { keys: ['beach', 'pool', 'swim'],     ids: ['bh-003','bh-009','ic-002','wt-002','sn-029','es-013'], text: "Beach day sorted! 🏖️ Grab a towel, flip flops, ice cold water and sunscreen — you are set." },
    { keys: ['party', 'celebrate', 'birthday'], ids: ['ch-001','ch-010','br-001','ic-002','sn-041','es-005'], text: "Party time! 🎉 Champagne, cold beers, ice and party cups — the essentials for a great night." },
    { keys: ['sundowner', 'sunset'],        ids: ['wn-021','sp-012','sd-028','ic-001'], text: "Golden hour vibes 🌅 Whispering Angel rosé or a G&T with Fever-Tree — pure Ibiza perfection." },
    { keys: ['hangover', 'rough', 'morning'], ids: ['wl-013','wl-014','wl-012','wl-020','wt-002'], text: "Recovery mode activated 💊 Alka-Seltzer, Dioralyte, paracetamol and coconut water — the dream team." },
    { keys: ['vip', 'premium', 'luxury'],   ids: ['ch-002','sp-001','sp-027','tb-048'], text: "Only the finest tonight 👑 Armand de Brignac, aged tequila and a premium cigar — VIP sorted." },
    { keys: ['cigar', 'smoke'],             ids: ['tb-048','tb-050','tb-053','tb-019'], text: "Cigar aficionado! 🚬 From Cohiba Behike to Montecristo — here are our finest." },
    { keys: ['cocktail', 'mix'],            ids: ['sp-012','sp-035','sd-028','sd-025','ic-002'], text: "Cocktail hour! 🍸 Good gin or vodka, Fever-Tree mixers and plenty of ice — you are the bartender tonight." },
  ]
  for (const { keys, ids, text } of keywordMap) {
    if (keys.some(k => q.includes(k))) {
      return { text, products: ids.map(id => PRODUCTS.find(p => p.id === id)).filter(Boolean) }
    }
  }
  const popular = PRODUCTS.filter(p => p.popular).slice(0, 4)
  return { text: "Great choice! 🌴 Here are some of our most popular products in Ibiza right now.", products: popular }
}

// ── Product card ──────────────────────────────────────────────
function BotProductCard({ product }) {
  const qty = useCartStore(s => s.items.find(i => i.product.id === product.id)?.quantity ?? 0)
  const { addItem, updateQuantity } = useCartStore()
  return (
    <div style={{ background: 'rgba(255,255,255,0.08)', border: '0.5px solid rgba(255,255,255,0.13)', borderRadius: 12, overflow: 'hidden', width: 130, flexShrink: 0 }}>
      <div style={{ height: 80, background: 'linear-gradient(135deg,#0D3B4A,#1A5263)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, position: 'relative' }}>
        {product.emoji}
        {qty === 0
          ? <button onClick={() => { addItem(product); toast.success(product.emoji + ' Added!', { duration: 900 }) }}
              style={{ position: 'absolute', top: 5, right: 5, width: 24, height: 24, background: '#C4683A', border: '2px solid rgba(255,255,255,0.6)', borderRadius: '50%', color: 'white', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', lineHeight: 1 }}>+</button>
          : <div style={{ position: 'absolute', top: 5, right: 5, display: 'flex', alignItems: 'center', gap: 3, background: 'rgba(0,0,0,0.6)', borderRadius: 20, padding: '2px 6px' }}>
              <button onClick={() => updateQuantity(product.id, qty - 1)} style={{ width: 16, height: 16, background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: 11, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
              <span style={{ fontSize: 10, fontWeight: 500, color: 'white', minWidth: 10, textAlign: 'center' }}>{qty}</span>
              <button onClick={() => updateQuantity(product.id, qty + 1)} style={{ width: 16, height: 16, background: '#C4683A', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: 11, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
            </div>
        }
      </div>
      <div style={{ padding: '7px 8px 9px' }}>
        <div style={{ fontSize: 10, fontWeight: 500, color: 'white', lineHeight: 1.3, marginBottom: 2, height: 26, overflow: 'hidden' }}>{product.name}</div>
        <div style={{ fontSize: 12, fontWeight: 500, color: '#E8A070' }}>€{product.price.toFixed(2)}</div>
      </div>
    </div>
  )
}

// ── Main Isla AI ──────────────────────────────────────────────
export default function AssistBot({ onClose }) {
  const t = useT_ctx()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [useApi, setUseApi] = useState(true)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const cart = useCartStore()

  const QUICK_PROMPTS = [
    'Plan my beach day',
    'VIP night out',
    'Sundowner drinks',
    'Pool party essentials',
    'Hangover cure',
    'Romantic evening',
    'Boat trip supplies',
    'Girls night in',
  ]

  useEffect(() => {
    setMessages([{
      role: 'assistant',
      content: "Hey! I'm Isla 🌴 Your personal Ibiza concierge. Tell me what you're planning and I'll curate the perfect selection for you — drinks, snacks, beach gear, whatever you need. What's the occasion?",
      products: [],
    }])
    setTimeout(() => inputRef.current?.focus(), 400)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async (text) => {
    const trimmed = (text || input).trim()
    if (!trimmed || loading) return

    const userMsg = { role: 'user', content: trimmed, products: [] }
    const history = [...messages, userMsg]
    setMessages(history)
    setInput('')
    setLoading(true)

    try {
      let reply, products, msgShowConcierge = false
      if (useApi) {
        try {
          const result = await askIsla(
            history.map(m => ({ role: m.role, content: m.content })),
            cart.items
          )
          reply = result.text
          products = result.products
          msgShowConcierge = result.showConcierge || false
        } catch (apiErr) {
          console.warn('API unavailable, using local:', apiErr)
          setUseApi(false)
          const local = localResponse(trimmed)
          reply = local.text
          products = local.products
        }
      } else {
        const local = localResponse(trimmed)
        reply = local.text
        products = local.products
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: reply,
        products: products || [],
        showConcierge: msgShowConcierge,
      }])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Hit a little wave there! 🌊 Try asking me again — I'm here to help.",
        products: [],
      }])
    }
    setLoading(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', flexDirection: 'column', background: 'linear-gradient(170deg,#0A2A38 0%,#0D3545 35%,#1A5060 70%,#2B7A8B 100%)', maxWidth: 480, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#0D3B4A,#1A5263)', padding: '16px 16px 14px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onClose} style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.1)', border: '0.5px solid rgba(255,255,255,0.18)', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#C4683A,#E8854A)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
            </div>
            <div>
              <div style={{ fontFamily: 'DM Serif Display,serif', fontSize: 18, color: 'white', lineHeight: 1 }}>Isla</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                Your Ibiza concierge {useApi ? '· AI powered' : '· Smart assistant'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map((msg, i) => {
          const isBot = msg.role === 'assistant'
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isBot ? 'flex-start' : 'flex-end', gap: 6 }}>
              {isBot && (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#C4683A,#E8854A)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginBottom: 2 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="white"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.09)', border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: '16px 16px 16px 4px', padding: '10px 14px', maxWidth: '80%' }}>
                    <div style={{ fontSize: 14, color: 'white', lineHeight: 1.55, fontFamily: 'DM Sans,sans-serif' }}>{msg.content}</div>
                  </div>
                </div>
              )}
              {!isBot && (
                <div style={{ background: '#C4683A', borderRadius: '16px 16px 4px 16px', padding: '10px 14px', maxWidth: '80%' }}>
                  <div style={{ fontSize: 14, color: 'white', lineHeight: 1.55, fontFamily: 'DM Sans,sans-serif' }}>{msg.content}</div>
                </div>
              )}
              {isBot && msg.products && msg.products.length > 0 && (
                <div style={{ marginLeft: 36, display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none', width: '100%' }}>
                  {msg.products.map(p => <BotProductCard key={p.id} product={p} />)}
                </div>
              )}
              {isBot && msg.showConcierge && (
                <div style={{ marginLeft: 36 }}>
                  <button onClick={onClose} style={{ padding: '8px 14px', background: 'linear-gradient(135deg,rgba(196,104,58,0.3),rgba(43,122,139,0.3))', border: '0.5px solid rgba(196,104,58,0.4)', borderRadius: 20, fontSize: 12, color: 'white', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>★</span> View Concierge Services
                  </button>
                </div>
              )}
            </div>
          )
        })}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#C4683A,#E8854A)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="white"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.09)', border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: '16px 16px 16px 4px', padding: '12px 16px', display: 'flex', gap: 5, alignItems: 'center' }}>
              {[0, 1, 2].map(d => (
                <div key={d} style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgba(255,255,255,0.45)', animation: `bounce 1.2s ${d * 0.2}s infinite ease-in-out` }} />
              ))}
            </div>
          </div>
        )}

        {messages.length === 1 && !loading && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 4 }}>
            {QUICK_PROMPTS.map(p => (
              <button key={p} onClick={() => send(p)}
                style={{ padding: '8px 13px', background: 'rgba(255,255,255,0.07)', border: '0.5px solid rgba(255,255,255,0.14)', borderRadius: 20, fontFamily: 'DM Sans,sans-serif', fontSize: 12, cursor: 'pointer', color: 'rgba(255,255,255,0.8)' }}>
                {p}
              </button>
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '10px 16px 24px', flexShrink: 0, background: 'rgba(10,30,40,0.7)', backdropFilter: 'blur(12px)', borderTop: '0.5px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.09)', border: '0.5px solid rgba(255,255,255,0.14)', borderRadius: 24, padding: '11px 16px', display: 'flex', alignItems: 'center' }}>
            <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder="Tell Isla what you need..."
              style={{ flex: 1, border: 'none', background: 'none', fontFamily: 'DM Sans,sans-serif', fontSize: 14, color: 'white', outline: 'none' }} />
          </div>
          <button onClick={() => send()} disabled={!input.trim() || loading}
            style={{ width: 44, height: 44, background: input.trim() && !loading ? '#C4683A' : 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%', cursor: input.trim() && !loading ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.15s' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M22 2L11 13"/><path d="M22 2L15 22l-4-9-9-4 20-7z"/></svg>
          </button>
        </div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)', textAlign: 'center', marginTop: 8, fontFamily: 'DM Sans,sans-serif' }}>
          Powered by Claude AI
        </div>
      </div>

      <style>{`@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}`}</style>
    </div>
  )
}
