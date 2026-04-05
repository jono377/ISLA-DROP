import { useState, useRef, useEffect } from 'react'
import { useAuthStore, useCartStore } from '../../lib/store'

async function askSupportAI(messages, user, profile) {
  const system = `You are the Isla Drop customer support AI — a warm, proactive and solutions-focused support agent for a premium 24/7 delivery service in Ibiza, Spain. You are empowered to resolve issues on the spot.

Customer: ${user ? `${profile?.full_name || 'Customer'} (${user.email})` : 'Guest'}

RESOLUTION PLAYBOOK — always offer clear options:

REFUNDS & MISSING ITEMS:
- Always offer TWO choices: (1) Isla Drop credit added instantly to their account, or (2) bank refund in 3-5 business days
- Credit is the faster option and you should mention it first — "I can add €X credit to your account right now, or process a bank refund which takes 3-5 business days. Which would you prefer?"
- For missing items: full refund or credit for the missing item value
- For wrong items: full refund or replacement on next order + credit for the inconvenience
- For quality issues: partial or full refund depending on severity

CANCELLATIONS:
- Within 2 minutes of ordering: full refund, no questions asked
- Driver not yet assigned: try to cancel, offer credit if successful
- Driver already collected: cannot cancel, but offer goodwill credit of 10% of order value for the inconvenience

LATE DELIVERIES:
- Our guarantee: if the order arrives more than 30 minutes PAST the estimated arrival time shown in the app, the customer receives 10% credit automatically
- If the order arrives (even late), there is no refund — only the 10% credit if over 30 mins past ETA
- If the order never arrived: full refund
- Always acknowledge the frustration, check if the order has actually arrived yet before offering anything
- Do not offer credit proactively unless the 30-min-past-ETA threshold is confirmed

ACCOUNT ISSUES:
- Password: direct them to the Forgot Password link in the sign-in screen
- Payment issues: ask them to check their card details in their banking app first

TONE RULES:
- Be warm and human, never robotic or scripted
- Use the customer name if you know it
- Acknowledge frustration genuinely before jumping to solutions
- Always end with what will happen next and a timeframe
- Keep responses under 120 words but make them count
- Use line breaks to make options easy to read
- If you cannot resolve something: "I am flagging this for our team — you will hear from us at ${user?.email || 'your email'} within 30 minutes"

Contact: support@isladrop.net | concierge@isladrop.net``

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

// Fallback local support responses
function localSupport(input) {
  const q = input.toLowerCase()
  if (q.includes('cancel')) return "Let me help with that right away.\n\nCancellations are free within 2 minutes of placing your order. If your driver has not yet been assigned, email support@isladrop.net with your order number and we will do our best to cancel it.\n\nIf a driver is already on the way, we cannot cancel — but I can offer you 10% credit as a goodwill gesture. Just let us know!"
  if (q.includes('refund')) return "Of course — here are your options:\n\n💳 Instant credit added to your account right now\n🏦 Bank refund in 3-5 business days\n\nMost customers prefer the instant credit! Which would you like? Please email support@isladrop.net with your order number and we will sort it within the hour."
  if (q.includes('missing') || q.includes('wrong item')) return "I am really sorry about that — that is not the standard we hold ourselves to.\n\nI can arrange either:\n💳 Instant credit to your account for the missing items\n🏦 A refund to your bank in 3-5 business days\n\nPlease email support@isladrop.net with your order number and a photo if possible. We will resolve this immediately."
  if (q.includes('late') || q.includes('where is')) return "I understand — let me explain how our delivery guarantee works.\n\nAs long as your order arrives we do not charge any extra, but if it arrives more than 30 minutes past the estimated time shown in the app:\n💳 10% credit added to your account\n\nThis is applied automatically once confirmed. Email support@isladrop.net with your order number if you believe this applies and we will check immediately."
  if (q.includes('track') || q.includes('status')) return "Once a driver accepts your order you will see live tracking right in the app on your order status screen.\n\nIf something does not look right, email support@isladrop.net with your order number and we will check the status immediately — we aim to respond within 15 minutes."
  if (q.includes('account') || q.includes('password') || q.includes('login')) return "For a forgotten password, tap 'Forgot password?' on the sign-in screen and we will email you a reset link straight away.\n\nFor anything else account-related, email support@isladrop.net and we will sort it within the hour."
  return "Thank you for getting in touch — our support team is here 24/7.\n\nFor the fastest response, email support@isladrop.net with your order number and a brief description. We aim to reply within 15 minutes during peak hours.\n\nIs there anything specific I can help you with right now?"
}

export default function SupportChat({ onBack }) {
  const { user, profile } = useAuthStore()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [useApi, setUseApi] = useState(true)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  const greeting = user && profile?.full_name
    ? `Hi ${profile.full_name.split(' ')[0]}! 👋 I'm your Isla Drop support assistant. I can help with cancellations, refunds, missing items, tracking and anything else. What do you need help with?`
    : "Hi! 👋 I'm your Isla Drop support assistant. I can help with cancellations, refunds, missing items, tracking and more. What do you need help with?"

  useEffect(() => {
    setMessages([{ role: 'assistant', content: greeting }])
    setTimeout(() => inputRef.current?.focus(), 300)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const QUICK_TOPICS = ['Cancel my order','Request a refund','Item missing','Order is late','Track my order','App not working']

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
          reply = await askSupportAI(
            history.map(m => ({ role: m.role, content: m.content })),
            user, profile
          )
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
      {/* Header */}
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

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 12, marginBottom: 12, minHeight: 250, maxHeight: 380, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{ background: m.role === 'user' ? '#C4683A' : 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '9px 13px', maxWidth: '85%', fontSize: 13, color: 'white', lineHeight: 1.55, fontFamily: 'DM Sans,sans-serif' }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: 5, padding: '8px 12px', background: 'rgba(255,255,255,0.08)', borderRadius: 12, alignItems: 'center', width: 'fit-content' }}>
            {[0, 1, 2].map(d => <div key={d} style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.4)', animation: `bounce 1.2s ${d * 0.2}s infinite ease-in-out` }} />)}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick topics */}
      {messages.length <= 1 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 12 }}>
          {QUICK_TOPICS.map(t => (
            <button key={t} onClick={() => send(t)}
              style={{ padding: '7px 12px', background: 'rgba(255,255,255,0.08)', border: '0.5px solid rgba(255,255,255,0.15)', borderRadius: 20, fontSize: 11, color: 'rgba(255,255,255,0.8)', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>{t}</button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ display: 'flex', gap: 8 }}>
        <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
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

      <style>{`@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}`}</style>
    </div>
  )
}
