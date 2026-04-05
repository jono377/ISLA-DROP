import { useState, useRef, useEffect } from 'react'
import { useAuthStore } from '../../lib/store'

async function askSupportAI(messages, user, profile) {
  const customerInfo = user
    ? 'Name: ' + (profile?.full_name || 'Customer') + ', Email: ' + user.email
    : 'Guest (not logged in)'

  const system = 'You are the Isla Drop customer support AI — warm, proactive and solutions-focused for a premium 24/7 delivery service in Ibiza.\n\nCustomer: ' + customerInfo + '\n\nRESOLUTION PLAYBOOK:\n\nREFUNDS & MISSING ITEMS:\n- Always offer TWO choices: (1) Isla Drop credit instantly, or (2) bank refund in 3-5 business days\n- Lead with credit as the faster option\n\nCANCELLATIONS:\n- Within 2 minutes: full refund\n- Driver not assigned: try cancel, offer credit if done\n- Driver collected: cannot cancel, offer 10% goodwill credit\n\nLATE DELIVERIES:\n- Only 30+ minutes PAST estimated time: 10% credit\n- If order arrives even late: no refund, only the 10% credit if threshold met\n- Never arrived: full refund\n\nTONE:\n- Warm, human, never robotic\n- Use customer name if known\n- Acknowledge frustration before solutions\n- Always state what happens next with a timeframe\n- Max 120 words per response\n- Use line breaks for options\n\nContact: support@isladrop.net'

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
      max_tokens: 400,
      system,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    }),
  })

  if (!resp.ok) throw new Error('API error: ' + resp.status)
  const data = await resp.json()
  return data.content?.[0]?.text ?? 'I am here to help — please try again.'
}

function localSupport(input) {
  const q = input.toLowerCase()
  if (q.includes('cancel')) return "Let me help right away.\n\nCancellations are free within 2 minutes of placing your order. If your driver has not yet been assigned, email support@isladrop.net with your order number.\n\nIf a driver is already on the way, we can offer 10% credit as a goodwill gesture."
  if (q.includes('refund')) return "Of course — here are your options:\n\n💳 Instant credit added to your account right now\n🏦 Bank refund in 3-5 business days\n\nEmail support@isladrop.net with your order number and we will sort it within the hour."
  if (q.includes('missing') || q.includes('wrong')) return "I am really sorry about that.\n\n💳 Instant credit for the missing items\n🏦 Bank refund in 3-5 business days\n\nEmail support@isladrop.net with your order number and we will resolve this immediately."
  if (q.includes('late') || q.includes('where')) return "If your order arrives more than 30 minutes past the estimated time:\n💳 10% credit added automatically\n\nEmail support@isladrop.net with your order number and we will check immediately."
  if (q.includes('track') || q.includes('status')) return "Once your driver collects your order you will see live tracking in the app.\n\nEmail support@isladrop.net with your order number if something does not look right — we respond within 15 minutes."
  if (q.includes('password') || q.includes('login')) return "Tap 'Forgot password?' on the sign-in screen and we will email a reset link.\n\nFor anything else email support@isladrop.net and we will sort it within the hour."
  return "Our support team is here 24/7.\n\nEmail support@isladrop.net with your order number and a brief description — we aim to reply within 15 minutes.\n\nWhat can I help you with right now?"
}

const CHAT_STORAGE_KEY = 'isla_support_chat'
const QUICK_TOPICS = ['Cancel my order', 'Request a refund', 'Missing item', 'Order is late', 'Track my order', 'Account help']

// ── Chat Log View ─────────────────────────────────────────────
function ChatLog({ onBack, onNewChat }) {
  const { user, profile } = useAuthStore()
  const [messages, setMessages] = useState([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [useApi, setUseApi]     = useState(true)
  const [resolved, setResolved] = useState(false)
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  // Load persisted chat on mount
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(CHAT_STORAGE_KEY) || 'null')
      if (saved && saved.messages?.length > 0) {
        setMessages(saved.messages)
        setResolved(saved.resolved || false)
        return
      }
    } catch {}
    // New chat — show greeting
    const firstName = profile?.full_name?.split(' ')[0]
    const greeting = user && firstName
      ? 'Hi ' + firstName + '! I am your Isla Drop support assistant. I can help with cancellations, refunds, missing items, tracking and anything else. What do you need help with?'
      : 'Hi! I am your Isla Drop support assistant. I can help with cancellations, refunds, missing items, tracking and more. What do you need help with?'
    setMessages([{ role:'assistant', content: greeting, ts: Date.now() }])
  }, [])

  // Persist chat whenever messages change
  useEffect(() => {
    if (messages.length === 0) return
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify({ messages, resolved, ts: Date.now() }))
    } catch {}
    bottomRef.current?.scrollIntoView({ behavior:'smooth' })
  }, [messages, resolved])

  const send = async (text) => {
    const trimmed = (text || input).trim()
    if (!trimmed || loading || resolved) return
    const userMsg = { role:'user', content: trimmed, ts: Date.now() }
    const history = [...messages, userMsg]
    setMessages(history)
    setInput('')
    setLoading(true)
    try {
      let reply
      if (useApi) {
        try {
          reply = await askSupportAI(history.map(m => ({ role: m.role, content: m.content })), user, profile)
        } catch {
          setUseApi(false)
          reply = localSupport(trimmed)
        }
      } else {
        reply = localSupport(trimmed)
      }
      setMessages(prev => [...prev, { role:'assistant', content: reply, ts: Date.now() }])
    } catch {
      setMessages(prev => [...prev, { role:'assistant', content:'Something went wrong. Please email support@isladrop.net directly and we will respond within 30 minutes.', ts: Date.now() }])
    }
    setLoading(false)
  }

  const exitChat = () => {
    // Clear chat log and go back to support home
    try { localStorage.removeItem(CHAT_STORAGE_KEY) } catch {}
    setResolved(true)
    setMessages(prev => [...prev, {
      role:'assistant',
      content:'Thank you for contacting Isla Drop support. This chat has been marked as resolved. If you need help again, start a new chat anytime. Enjoy Ibiza! 🌴',
      ts: Date.now(),
    }])
    setTimeout(() => onNewChat(), 2000)
  }

  const formatTime = (ts) => {
    if (!ts) return ''
    return new Date(ts).toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' })
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12, flexShrink:0 }}>
        <button onClick={onBack} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.6)', cursor:'pointer', fontSize:20, padding:0, lineHeight:1 }}>←</button>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:'DM Serif Display,serif', fontSize:17, color:'white', lineHeight:1 }}>Support Chat</div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginTop:2 }}>
            {resolved ? '✓ Resolved' : '● Live · AI-powered 24/7'}
          </div>
        </div>
        {!resolved && messages.length > 2 && (
          <button onClick={exitChat}
            style={{ padding:'6px 12px', background:'rgba(90,107,58,0.2)', border:'0.5px solid rgba(90,107,58,0.4)', borderRadius:20, fontSize:11, color:'#7EE8A2', cursor:'pointer', fontFamily:'DM Sans,sans-serif', whiteSpace:'nowrap' }}>
            All resolved ✓
          </button>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex:1, overflowY:'auto', background:'rgba(255,255,255,0.04)', borderRadius:12, padding:'10px 12px', marginBottom:10, display:'flex', flexDirection:'column', gap:8 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display:'flex', flexDirection:'column', alignItems: m.role==='user'?'flex-end':'flex-start' }}>
            <div style={{ background: m.role==='user'?'#C4683A':'rgba(255,255,255,0.1)', borderRadius: m.role==='user'?'14px 14px 4px 14px':'14px 14px 14px 4px', padding:'9px 13px', maxWidth:'85%', fontSize:13, color:'white', lineHeight:1.55, fontFamily:'DM Sans,sans-serif', whiteSpace:'pre-line' }}>
              {m.content}
            </div>
            {m.ts && <div style={{ fontSize:10, color:'rgba(255,255,255,0.25)', marginTop:3, fontFamily:'DM Sans,sans-serif' }}>{formatTime(m.ts)}</div>}
          </div>
        ))}
        {loading && (
          <div style={{ display:'flex', gap:5, padding:'8px 12px', background:'rgba(255,255,255,0.08)', borderRadius:12, width:'fit-content' }}>
            {[0,1,2].map(d => <div key={d} style={{ width:6, height:6, borderRadius:'50%', background:'rgba(255,255,255,0.4)', animation:'bounce 1.2s ' + (d*0.2) + 's infinite ease-in-out' }} />)}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick topics — only on first message */}
      {messages.length <= 1 && !resolved && (
        <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:10, flexShrink:0 }}>
          {QUICK_TOPICS.map(t => (
            <button key={t} onClick={() => send(t)}
              style={{ padding:'6px 11px', background:'rgba(255,255,255,0.08)', border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:20, fontSize:11, color:'rgba(255,255,255,0.8)', cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
              {t}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      {!resolved && (
        <div style={{ display:'flex', gap:8, flexShrink:0 }}>
          <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key==='Enter' && send()}
            placeholder="Describe your issue..."
            style={{ flex:1, padding:'11px 14px', background:'rgba(255,255,255,0.08)', border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:24, fontFamily:'DM Sans,sans-serif', fontSize:13, color:'white', outline:'none' }} />
          <button onClick={() => send()} disabled={!input.trim() || loading}
            style={{ width:42, height:42, background: input.trim()&&!loading?'#2B7A8B':'rgba(255,255,255,0.08)', border:'none', borderRadius:'50%', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M22 2L11 13"/><path d="M22 2L15 22l-4-9-9-4 20-7z"/></svg>
          </button>
        </div>
      )}

      <div style={{ fontSize:10, color:'rgba(255,255,255,0.2)', textAlign:'center', marginTop:8, fontFamily:'DM Sans,sans-serif', flexShrink:0 }}>
        support@isladrop.net · Powered by Claude AI
      </div>
      <style>{'@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}'}</style>
    </div>
  )
}

// ── Support Home ──────────────────────────────────────────────
function SupportHome({ onStartChat, onBack }) {
  const hasHistory = (() => {
    try { const s = JSON.parse(localStorage.getItem(CHAT_STORAGE_KEY) || 'null'); return s?.messages?.length > 1 } catch { return false }
  })()

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
        <button onClick={onBack} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.6)', cursor:'pointer', fontSize:20, padding:0 }}>←</button>
        <div style={{ fontFamily:'DM Serif Display,serif', fontSize:22, color:'white' }}>Customer Support</div>
      </div>

      <div style={{ background:'rgba(43,122,139,0.15)', border:'0.5px solid rgba(43,122,139,0.3)', borderRadius:14, padding:16, marginBottom:16, display:'flex', gap:12, alignItems:'center' }}>
        <div style={{ width:40, height:40, borderRadius:'50%', background:'linear-gradient(135deg,#2B7A8B,#1A5060)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>💬</div>
        <div>
          <div style={{ fontSize:14, fontWeight:500, color:'white', fontFamily:'DM Sans,sans-serif' }}>AI Support — available 24/7</div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', marginTop:2 }}>Instant help with orders, refunds and more</div>
        </div>
      </div>

      {hasHistory && (
        <button onClick={() => onStartChat(false)}
          style={{ width:'100%', padding:'14px', background:'rgba(255,255,255,0.07)', border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:12, fontFamily:'DM Sans,sans-serif', fontSize:14, color:'white', cursor:'pointer', marginBottom:10, textAlign:'left', display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:18 }}>💬</span>
          <div>
            <div>Continue previous chat</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginTop:1 }}>Pick up where you left off</div>
          </div>
          <svg style={{ marginLeft:'auto' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      )}

      <button onClick={() => onStartChat(true)}
        style={{ width:'100%', padding:'14px', background:'#2B7A8B', border:'none', borderRadius:12, fontFamily:'DM Sans,sans-serif', fontSize:14, color:'white', cursor:'pointer', marginBottom:16, display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ fontSize:18 }}>✏️</span>
        <span>{hasHistory ? 'Start new chat' : 'Start chat with support'}</span>
        <svg style={{ marginLeft:'auto' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
      </button>

      <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', textAlign:'center', fontFamily:'DM Sans,sans-serif', lineHeight:1.6 }}>
        Prefer email? support@isladrop.net
      </div>
    </div>
  )
}

// ── Main SupportChat ──────────────────────────────────────────
export default function SupportChat({ onBack }) {
  const [screen, setScreen] = useState('home') // home | chat

  const handleStartChat = (newChat) => {
    if (newChat) {
      try { localStorage.removeItem(CHAT_STORAGE_KEY) } catch {}
    }
    setScreen('chat')
  }

  const handleChatBack = () => setScreen('home')
  const handleNewChat = () => {
    try { localStorage.removeItem(CHAT_STORAGE_KEY) } catch {}
    setScreen('home')
  }

  if (screen === 'chat') return (
    <div style={{ padding:'0 0 8px', display:'flex', flexDirection:'column', height:'100%' }}>
      <ChatLog onBack={handleChatBack} onNewChat={handleNewChat} />
    </div>
  )

  return (
    <div style={{ padding:'0 0 8px' }}>
      <SupportHome onStartChat={handleStartChat} onBack={onBack} />
    </div>
  )
}
