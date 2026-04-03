import { useState, useRef, useEffect } from 'react'
import { PRODUCTS } from '../../lib/products'
import { useCartStore } from '../../lib/store'
import toast from 'react-hot-toast'

async function askClaude(messages, products) {
  const catalogue = products.slice(0, 100).map(p =>
    `${p.id}|${p.name}|€${p.price.toFixed(2)}|${p.category}|${p.sub}`
  ).join('\n')

  const system = `You are Isla, the friendly AI drinks advisor for Isla Drop — a 24/7 delivery service in Ibiza, Spain delivering drinks, snacks and tobacco.

Help customers find the perfect products. Be warm, fun and keep the Ibiza vibes.

PRODUCT CATALOGUE (id|name|price|category|sub):
${catalogue}

RULES:
- Short punchy replies, under 80 words. Use emojis freely.
- ALWAYS recommend 2-4 specific products from the catalogue above.
- After your message, output this on its own line with NO other text around it:
SUGGESTIONS:{"ids":["id1","id2","id3"]}
- Use the actual product IDs from the catalogue (e.g. ch-001, sp-035, br-001).
- Never make up product IDs. Only use IDs from the catalogue.
- If asked something unrelated to drinks/food/tobacco, politely redirect.`

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
      system,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    }),
  })

  if (!resp.ok) {
    const err = await resp.text()
    console.error('Anthropic API error:', resp.status, err)
    throw new Error(`API error ${resp.status}`)
  }

  const data = await resp.json()
  const raw = data.content?.[0]?.text ?? ''

  let suggestedIds = []
  const match = raw.match(/SUGGESTIONS:\s*\{"ids":\s*\[([^\]]*)\]\}/)
  if (match) {
    suggestedIds = match[1].replace(/"/g, '').split(',').map(s => s.trim()).filter(Boolean)
  }

  const cleanText = raw.replace(/SUGGESTIONS:\s*\{.*?\}/, '').trim()
  return { text: cleanText, suggestedIds }
}

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
      suggestedIds:[],
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
    const userMsg = { role:'user', content:trimmed, suggestedIds:[] }
    const history = [...messages, userMsg]
    setMessages(history)
    setInput('')
    setLoading(true)
    try {
      const { text: reply, suggestedIds } = await askClaude(history, PRODUCTS)
      setMessages(prev => [...prev, { role:'assistant', content:reply, suggestedIds }])
    } catch (err) {
      console.error('Isla error:', err)
      setMessages(prev => [...prev, {
        role:'assistant',
        content:"Oops, hit a blip there 🌊 Try again — I'm ready to help you pick the perfect drinks!",
        suggestedIds:[],
      }])
    }
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
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', marginTop:2 }}>Your Ibiza drinks advisor · powered by AI</div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex:1, overflowY:'auto', padding:'16px 16px 8px', display:'flex', flexDirection:'column', gap:12 }}>
        {messages.map((msg, i) => {
          const isBot = msg.role==='assistant'
          const suggested = (msg.suggestedIds||[]).map(id=>PRODUCTS.find(p=>p.id===id)).filter(Boolean)
          return (
            <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:isBot?'flex-start':'flex-end', gap:6 }}>
              {isBot && (
                <div style={{ display:'flex', alignItems:'flex-end', gap:8 }}>
                  <div style={{ width:28,height:28,borderRadius:'50%',background:'linear-gradient(135deg,#C4683A,#E8854A)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginBottom:2 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="white"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
                  </div>
                  <div style={{ background:'rgba(255,255,255,0.09)',border:'0.5px solid rgba(255,255,255,0.12)',borderRadius:'16px 16px 16px 4px',padding:'10px 14px',maxWidth:'80%' }}>
                    <div style={{ fontSize:14,color:'white',lineHeight:1.55,fontFamily:'DM Sans,sans-serif',whiteSpace:'pre-wrap' }}>{msg.content}</div>
                  </div>
                </div>
              )}
              {!isBot && (
                <div style={{ background:'#C4683A',borderRadius:'16px 16px 4px 16px',padding:'10px 14px',maxWidth:'80%' }}>
                  <div style={{ fontSize:14,color:'white',lineHeight:1.55,fontFamily:'DM Sans,sans-serif' }}>{msg.content}</div>
                </div>
              )}
              {isBot && suggested.length>0 && (
                <div style={{ marginLeft:36,display:'flex',gap:8,overflowX:'auto',paddingBottom:4,scrollbarWidth:'none',width:'100%' }}>
                  {suggested.map(p=><BotProductCard key={p.id} product={p}/>)}
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
              placeholder="Describe your vibe… sunset cocktails, VIP night…"
              style={{ flex:1,border:'none',background:'none',fontFamily:'DM Sans,sans-serif',fontSize:14,color:'white',outline:'none' }}
            />
          </div>
          <button onClick={()=>send()} disabled={!input.trim()||loading}
            style={{ width:44,height:44,background:input.trim()&&!loading?'#C4683A':'rgba(255,255,255,0.08)',border:'none',borderRadius:'50%',cursor:input.trim()&&!loading?'pointer':'default',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'background 0.15s' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M22 2L11 13"/><path d="M22 2L15 22l-4-9-9-4 20-7z"/></svg>
          </button>
        </div>
        <div style={{ fontSize:10,color:'rgba(255,255,255,0.22)',textAlign:'center',marginTop:8,fontFamily:'DM Sans,sans-serif' }}>
          Powered by Claude AI · Isla Drop 24/7
        </div>
      </div>

      <style>{`@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}`}</style>
    </div>
  )
}
