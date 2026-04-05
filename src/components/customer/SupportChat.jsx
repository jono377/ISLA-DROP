import { useState, useRef, useEffect } from 'react'
import { useAuthStore } from '../../lib/store'

async function askSupportAI(messages, user, profile) {
  const customerInfo = user
    ? 'Name: ' + (profile?.full_name || 'Customer') + ', Email: ' + user.email
    : 'Guest (not logged in)'

  const system = 'You are the Isla Drop customer support AI — a warm, proactive and solutions-focused support agent for a premium 24/7 delivery service in Ibiza, Spain. You are empowered to resolve issues on the spot.\n\nCustomer: ' + customerInfo + '\n\nRESOLUTION PLAYBOOK — always offer clear options:\n\nREFUNDS & MISSING ITEMS:\n- Always offer TWO choices: (1) Isla Drop credit added instantly, or (2) bank refund in 3-5 business days\n- Credit is faster — mention it first\n- For missing items: full refund or credit for missing item value\n- For wrong items: full refund or replacement + credit for inconvenience\n\nCANCELLATIONS:\n- Within 2 minutes: full refund, no questions\n- Driver not yet assigned: try to cancel, offer credit if successful\n- Driver already collected: cannot cancel, offer 10% goodwill credit\n\nLATE DELIVERIES:\n- Only if order arrives 30+ minutes PAST the estimated time: 10% credit\n- If it arrives on time or slightly late: no credit — just acknowledge\n- If order never arrived: full refund\n\nACCOUNT ISSUES:\n- Password: direct to Forgot Password on sign-in screen\n- Payment: ask them to check card in banking app first\n\nTONE:\n- Warm and human, never robotic\n- Use customer name if known\n- Acknowledge frustration before jumping to solutions\n- Always end with what happens next and a timeframe\n- Keep under 120 words but make them count\n- Use line breaks for options\n- If unresolvable: flag for team, response within 30 minutes\n\nContact: support@isladrop.net'

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
  if (q.includes('cancel')) return "Let me help with that right away.\n\nCancellations are free within 2 minutes of placing your order. If your driver has not yet been assigned, email support@isladrop.net with your order number.\n\nIf a driver is already on the way, I can offer 10% credit as a goodwill gesture. Just let us know!"
  if (q.includes('refund')) return "Of course — here are your options:\n\n💳 Instant credit added to your account right now\n🏦 Bank refund in 3-5 business days\n\nMost customers prefer the instant credit! Email support@isladrop.net with your order number and we will sort it within the hour."
  if (q.includes('missing') || q.includes('wrong item')) return "I am really sorry about that.\n\nI can arrange either:\n💳 Instant credit for the missing items\n🏦 A refund to your bank in 3-5 business days\n\nPlease email support@isladrop.net with your order number. We will resolve this immediately."
  if (q.includes('late') || q.includes('where is')) return "I understand — let me explain our delivery guarantee.\n\nIf your order arrives more than 30 minutes past the estimated time shown in the app:\n💳 10% credit added to your account automatically\n\nEmail support@isladrop.net with your order number and we will check immediately."
  if (q.includes('track') || q.includes('status')) return "Once a driver collects your order you will see live tracking in the app.\n\nIf something does not look right, email support@isladrop.net with your order number — we aim to respond within 15 minutes."
  if (q.includes('account') || q.includes('password') || q.includes('login')) return "For a forgotten password, tap 'Forgot password?' on the sign-in screen and we will email a reset link.\n\nFor anything else, email support@isladrop.net and we will sort it within the hour."
  return "Thank you for getting in touch — our support team is here 24/7.\n\nEmail support@isladrop.net with your order number and a brief description. We aim to reply within 15 minutes.\n\nIs there anything specific I can help you with right now?"
}

export default function SupportChat({ onBack }) {
  const { user, profile } = useAuthStore()
  const [messages, setMessages] = useState([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [useApi, setUseApi]     = useState(true)
  const bottomRef               = useRef(null)
  const inputRef                = useRef(null)

  const firstName = profile?.full_name?.split(' ')[0]
  const greeting = user && firstName
    ? "Hi " + firstName + "! 👋 I'm your Isla Drop support assistant. I can help with cancellations, refunds, missing items, tracking and anything else. What do you need help with?"
    : "Hi! 👋 I'm your Isla Drop support assistant. I can help with cancellations, refunds, missing items, tracking and more. What do you need help with?"

  useEffect(() => {
    setMessages([{ role: 'assistant', content: greeting }])
    setTimeout(() => inputRef.current?.focus(), 300)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const QUICK_TOPICS = ['Cancel my order', 'Request a refund', 'Item missing', 'Order is late', 'Track my order', 'App not working']

  const send = async (text) => {
    const trimmed = (text || input).trim()
    if (!trimmed || loading) return
    const userMsg = { role: 'user', content: trimmed }
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
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Please email support@isladrop.net directly and we will respond within 30 minutes.' }])
    }
    setLoading(false)
  }

  return (
    <div style={{ padding: '0 0 8px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 20, padding: 0 }}>←</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#2B7A8B,#1A5060)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>💬</div>
          <div>
            <div style={{ fontFamily: 'DM Serif Display,serif', fontSize: 18, color: 'white', lineHeight: 1 }}>Customer Support</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>AI-powered · 24/7</div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 12, marginBottom: 12, minHeight: 250, maxHeight: 380, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{ background: m.role === 'user' ? '#C4683A' : 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '9px 13px', maxWidth: '85%', fontSize: 13, color: 'white', lineHeight: 1.55, fontFamily: 'DM Sans,sans-serif', whiteSpace: 'pre-line' }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: 5, padding: '8px 12px', background: 'rgba(255,255,255,0.08)', borderRadius: 12, alignItems: 'center', width: 'fit-content' }}>
            {[0, 1, 2].map(d => <div key={d} style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.4)', animation: 'bounce 1.2s ' + (d * 0.2) + 's infinite ease-in-out' }} />)}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {messages.length <= 1 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 12 }}>
          {QUICK_TOPICS.map(t => (
            <button key={t} onClick={() => send(t)} style={{ padding: '7px 12px', background: 'rgba(255,255,255,0.08)', border: '0.5px solid rgba(255,255,255,0.15)', borderRadius: 20, fontSize: 11, color: 'rgba(255,255,255,0.8)', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>{t}</button>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Describe your issue..."
          style={{ flex: 1, padding: '11px 14px', background: 'rgba(255,255,255,0.08)', border: '0.5px solid rgba(255,255,255,0.15)', borderRadius: 24, fontFamily: 'DM Sans,sans-serif', fontSize: 13, color: 'white', outline: 'none' }} />
        <button onClick={() => send()} disabled={!input.trim() || loading}
          style={{ width: 42, height: 42, background: input.trim() && !loading ? '#2B7A8B' : 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M22 2L11 13"/><path d="M22 2L15 22l-4-9-9-4 20-7z"/></svg>
        </button>
      </div>

      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', textAlign: 'center', marginTop: 8, fontFamily: 'DM Sans,sans-serif' }}>
        Urgent? Email support@isladrop.net · Powered by Claude AI
      </div>

      <style>{'@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}'}</style>
    </div>
  )
}
