import { useState, useRef, useEffect } from 'react'
import { useAuthStore, useCartStore } from '../../lib/store'

async function askSupportAI(messages, user, profile) {
  const system = `You are the Isla Drop customer support AI — a highly capable, empathetic support agent for a premium 24/7 delivery service in Ibiza, Spain.

Customer info: ${user ? `Name: ${profile?.full_name || 'Customer'}, Email: ${user.email}` : 'Guest (not logged in)'}

YOUR CAPABILITIES — you can handle ALL of these autonomously:
- Order tracking and status updates
- Cancellations (within policy: 2 minutes of placing, or if driver not yet assigned)
- Refund requests (process for: wrong items, quality issues, late delivery over 45 mins, damaged goods)
- Missing items from orders
- Delivery address problems
- Payment disputes
- Product complaints
- Account issues (password reset, profile updates)
- App technical problems

POLICIES:
- Cancellation: Free within 2 minutes OR if driver not yet assigned. After pickup, cannot cancel.
- Refunds: Issued within 3-5 business days. Full refund for wrong/missing items, quality issues.
- Late delivery: Over 45 minutes qualifies for 20% discount on next order.
- Delivery fee (3.50 euros) is non-refundable unless order was our error.
- Age-restricted items require ID at delivery — no refund if customer cannot provide ID.

RESOLUTION APPROACH:
1. Acknowledge the issue with genuine empathy
2. Ask for order number if relevant (format: ISD-XXXXX)
3. Provide a clear, immediate resolution or next steps
4. Offer compensation proactively when appropriate (discount codes, refunds)
5. Always end with confirmation of what will happen next

IMPORTANT:
- Be genuinely helpful, not robotic
- Use the customer name if you know it
- Keep responses concise but complete (under 150 words)
- Never say "I cannot" — always find a solution or escalate path
- If a real human agent is needed: "I am escalating this to our team — you will hear back within 30 minutes via email."
- Email for urgent issues: support@isladrop.net | Phone: +34 XXX XXX XXX`

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

  if (!resp.ok) throw new Error(`API ${resp.status}`)
  const data = await resp.json()
  return data.content?.[0]?.text ?? 'I am here to help — please try again.'
}

// Fallback local support responses
function localSupport(input) {
  const q = input.toLowerCase()
  if (q.includes('cancel')) return "To cancel your order, please act quickly — cancellations are accepted within 2 minutes of placing, or before a driver is assigned. Email support@isladrop.net immediately with your order number and we will do our best to help."
  if (q.includes('refund')) return "We are sorry to hear that! Refunds are processed within 3-5 business days. For wrong items, missing items or quality issues we offer a full refund. Please email support@isladrop.net with your order number and a photo if applicable."
  if (q.includes('missing') || q.includes('wrong item')) return "We sincerely apologise for this! Please email support@isladrop.net with your order number and which items were missing or incorrect — we will arrange a refund or replacement immediately."
  if (q.includes('late') || q.includes('where is')) return "We are sorry for the delay! If your order is over 45 minutes late, you qualify for a 20% discount on your next order. Please email support@isladrop.net with your order number."
  if (q.includes('track') || q.includes('status')) return "Once a driver is assigned to your order, you will see live tracking on your order status screen. If you placed an order and are not seeing updates, email support@isladrop.net with your order number."
  if (q.includes('account') || q.includes('password') || q.includes('login')) return "For account issues, use the Forgot Password link on the sign in screen. If you are still having trouble, email support@isladrop.net and we will sort it within the hour."
  return "Thank you for reaching out! Our support team is available 24/7. For the fastest response please email support@isladrop.net with your order number and details of the issue — we aim to respond within 30 minutes."
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
