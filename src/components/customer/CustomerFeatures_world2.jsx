// ================================================================
// CustomerFeatures_world2.jsx
// 20 missing features for world-class Isla Drop
// F1:  Social login (Google / Apple)
// F2:  Phone OTP login
// F3:  One-tap reorder from notification
// F4:  In-app live support chat
// F5:  Image search (camera → product)
// F6:  Smart quantity defaults
// F7:  Order issue / missing item flow
// F8:  Real-time stock sync
// F9:  Dynamic / surge pricing display
// F10: Subscription / recurring orders UI
// F11: Product collections by occasion
// F12: Size / price comparison
// F13: QR code delivery confirmation
// F14: Driver rating system
// F15: Gamification — streaks + challenge badges
// F16: Refer-a-friend deep link
// F17: Abandoned basket push
// F18: First-order discount auto-apply
// F19: Free sample with order
// F20: Birthday reward automation
// ================================================================
import { useState, useEffect, useRef, useCallback } from 'react'
import { useCartStore, useAuthStore } from '../../lib/store'
import { PRODUCTS } from '../../lib/products'
import toast from 'react-hot-toast'

const F = { serif:'DM Serif Display,serif', sans:'DM Sans,sans-serif' }
const C = {
  bg:'#0D3545', accent:'#C4683A', green:'#7EE8A2', gold:'#C8A84B',
  surface:'rgba(255,255,255,0.07)', border:'rgba(255,255,255,0.1)',
  muted:'rgba(255,255,255,0.45)',
}

// ── F1: Social login buttons ──────────────────────────────────
export function SocialLoginButtons({ onSuccess }) {
  const [loading, setLoading] = useState(null)

  const signInWith = async (provider) => {
    setLoading(provider)
    try {
      const { supabase } = await import('../../lib/supabase')
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin + '/?auth=complete',
          scopes: provider === 'google' ? 'email profile' : undefined,
        }
      })
      if (error) throw error
    } catch (err) {
      toast.error('Sign in failed: ' + err.message)
      setLoading(null)
    }
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:16 }}>
      <button onClick={()=>signInWith('google')} disabled={loading==='google'}
        style={{ width:'100%', padding:'12px', background:'white', border:'1px solid #E8E0D0', borderRadius:12, fontFamily:F.sans, fontSize:14, fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10, color:'#2A2318' }}>
        {loading==='google'
          ? <div style={{ width:16,height:16,border:'2px solid #E8E0D0',borderTopColor:'#C4683A',borderRadius:'50%',animation:'socialSpin 0.8s linear infinite' }}/>
          : <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
        }
        Continue with Google
      </button>
      <button onClick={()=>signInWith('apple')} disabled={loading==='apple'}
        style={{ width:'100%', padding:'12px', background:'#2A2318', border:'none', borderRadius:12, fontFamily:F.sans, fontSize:14, fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10, color:'white' }}>
        {loading==='apple'
          ? <div style={{ width:16,height:16,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'white',borderRadius:'50%',animation:'socialSpin 0.8s linear infinite' }}/>
          : <svg width="16" height="18" viewBox="0 0 814 1000" fill="white"><path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-38.8-155.5-127.4C46 790.7 0 663 0 541.8c0-207.5 135.4-317.3 269-317.3 70.1 0 128.4 46.4 172.5 46.4 42.8 0 109.2-49 188.5-49C765.1 222 788.1 340.9 788.1 340.9zm-234.5-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"/></svg>
        }
        Continue with Apple
      </button>
      <div style={{ display:'flex', alignItems:'center', gap:10, margin:'4px 0' }}>
        <div style={{ flex:1, height:'0.5px', background:'rgba(42,35,24,0.15)' }}/>
        <span style={{ fontSize:12, color:'#7A6E60', fontFamily:F.sans }}>or</span>
        <div style={{ flex:1, height:'0.5px', background:'rgba(42,35,24,0.15)' }}/>
      </div>
      <style>{'@keyframes socialSpin{to{transform:rotate(360deg)}}'}</style>
    </div>
  )
}

// ── F2: Phone OTP login ───────────────────────────────────────
export function PhoneOTPLogin({ onSuccess, onBack }) {
  const [step, setStep] = useState('phone') // phone | otp
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const { setUser } = useAuthStore()

  const sendOTP = async () => {
    const cleaned = phone.replace(/\s/g,'')
    if (cleaned.length < 8) { toast.error('Enter a valid phone number'); return }
    setLoading(true)
    try {
      const { supabase } = await import('../../lib/supabase')
      const { error } = await supabase.auth.signInWithOtp({
        phone: cleaned.startsWith('+') ? cleaned : '+' + cleaned,
      })
      if (error) throw error
      setStep('otp')
      toast.success('Code sent to ' + cleaned)
    } catch (err) { toast.error(err.message) }
    setLoading(false)
  }

  const verifyOTP = async () => {
    if (otp.length < 4) { toast.error('Enter the full code'); return }
    setLoading(true)
    try {
      const { supabase } = await import('../../lib/supabase')
      const cleaned = phone.replace(/\s/g,'')
      const { data, error } = await supabase.auth.verifyOtp({
        phone: cleaned.startsWith('+') ? cleaned : '+' + cleaned,
        token: otp, type: 'sms',
      })
      if (error) throw error
      setUser(data.user)
      onSuccess?.()
      toast.success('Welcome to Isla Drop! 🌴')
    } catch (err) { toast.error('Invalid code — try again') }
    setLoading(false)
  }

  return (
    <div>
      {step === 'phone' ? (
        <>
          <div style={{ fontSize:13, color:'#7A6E60', marginBottom:12, fontFamily:F.sans }}>Enter your mobile number</div>
          <div style={{ display:'flex', gap:8, marginBottom:14 }}>
            <select style={{ padding:'12px 10px', borderRadius:10, border:'0.5px solid rgba(42,35,24,0.18)', background:'#F5F0E8', fontFamily:F.sans, fontSize:14, color:'#2A2318', outline:'none' }}>
              {['+34','+44','+49','+33','+39','+31','+1','+7'].map(c=><option key={c}>{c}</option>)}
            </select>
            <input value={phone} onChange={e=>setPhone(e.target.value)}
              placeholder="612 345 678" type="tel"
              style={{ flex:1, padding:'12px 14px', border:'0.5px solid rgba(42,35,24,0.18)', borderRadius:10, fontFamily:F.sans, fontSize:14, background:'#F5F0E8', color:'#2A2318', outline:'none' }}/>
          </div>
          <button onClick={sendOTP} disabled={loading}
            style={{ width:'100%', padding:'14px', background:'#C4683A', border:'none', borderRadius:12, color:'white', fontSize:14, fontWeight:500, cursor:'pointer', fontFamily:F.sans }}>
            {loading ? 'Sending...' : 'Send code →'}
          </button>
        </>
      ) : (
        <>
          <div style={{ fontSize:13, color:'#7A6E60', marginBottom:4, fontFamily:F.sans }}>Enter the 6-digit code sent to</div>
          <div style={{ fontSize:14, fontWeight:600, color:'#2A2318', marginBottom:14, fontFamily:F.sans }}>{phone}</div>
          <input value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,'').slice(0,6))}
            placeholder="000000" type="tel" maxLength={6}
            style={{ width:'100%', padding:'16px', border:'0.5px solid rgba(42,35,24,0.18)', borderRadius:12, fontFamily:'monospace', fontSize:28, letterSpacing:8, textAlign:'center', background:'#F5F0E8', color:'#2A2318', outline:'none', boxSizing:'border-box', marginBottom:12 }}/>
          <button onClick={verifyOTP} disabled={loading || otp.length < 6}
            style={{ width:'100%', padding:'14px', background:otp.length>=6?'#C4683A':'#E8E0D0', border:'none', borderRadius:12, color:otp.length>=6?'white':'#7A6E60', fontSize:14, fontWeight:500, cursor:otp.length>=6?'pointer':'default', fontFamily:F.sans, marginBottom:8 }}>
            {loading ? 'Verifying...' : 'Verify code →'}
          </button>
          <button onClick={()=>setStep('phone')}
            style={{ width:'100%', padding:'11px', background:'none', border:'none', fontSize:13, color:'#7A6E60', cursor:'pointer', fontFamily:F.sans }}>
            ← Change number
          </button>
        </>
      )}
    </div>
  )
}

// ── F3: One-tap reorder from notification ─────────────────────
export function useNotificationReorder() {
  useEffect(() => {
    const handler = async (e) => {
      const { orderId } = e.detail || {}
      if (!orderId) return
      try {
        const { supabase } = await import('../../lib/supabase')
        const { data: order } = await supabase
          .from('orders').select('*, order_items(*, products(*))')
          .eq('id', orderId).single()
        if (!order?.order_items) return
        const { addItem } = useCartStore.getState()
        order.order_items.forEach(item => {
          if (item.products) {
            for (let i=0;i<item.quantity;i++) addItem(item.products)
          }
        })
        toast.success('Order added to basket! 🛵', { duration:2000 })
      } catch {}
    }
    window.addEventListener('isla:repeat_order', handler)
    return () => window.removeEventListener('isla:repeat_order', handler)
  }, [])
}

// ── F4: In-app live support chat ──────────────────────────────
export function SupportChatWidget({ activeOrder, onClose }) {
  const [messages, setMessages] = useState([
    { role:'agent', text:'Hi! 👋 How can we help with your order today?', ts: new Date() }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const { user } = useAuthStore()
  const endRef = useRef(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:'smooth' }) }, [messages])

  const send = async () => {
    const text = input.trim()
    if (!text) return
    setInput('')
    const userMsg = { role:'user', text, ts: new Date() }
    setMessages(m => [...m, userMsg])
    setLoading(true)

    try {
      const orderCtx = activeOrder
        ? 'Order #'+activeOrder.order_number+' status: '+activeOrder.status+'. Items: '+
          (activeOrder.order_items?.map(i=>i.quantity+'x '+i.products?.name).join(', ') || 'unknown')
        : 'No active order'

      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST',
        headers:{ 'Content-Type':'application/json','anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true','x-api-key':import.meta.env.VITE_ANTHROPIC_API_KEY||'' },
        body: JSON.stringify({
          model:'claude-haiku-4-5-20251001', max_tokens:300,
          system:'You are Isla, a friendly Ibiza delivery support agent for Isla Drop. Be concise, warm and helpful. Context: '+orderCtx+'. If the issue needs a refund or escalation, say you will process it immediately and ask them to confirm. Never make up tracking info.',
          messages:[...messages.filter(m=>m.role==='user').map(m=>({role:'user',content:m.text})), {role:'user',content:text}]
        })
      })
      const data = await resp.json()
      const reply = data.content?.[0]?.text || 'Let me look into that for you right away.'
      setMessages(m => [...m, { role:'agent', text:reply, ts:new Date() }])
    } catch {
      setMessages(m => [...m, { role:'agent', text:'Sorry, having trouble connecting. Please try WhatsApp: +34 XXX XXX XXX', ts:new Date() }])
    }
    setLoading(false)
  }

  return (
    <div style={{ position:'fixed',inset:0,zIndex:700,background:'rgba(0,0,0,0.7)',display:'flex',alignItems:'flex-end' }} onClick={onClose}>
      <div style={{ width:'100%',maxWidth:480,margin:'0 auto',background:'#0D3545',borderRadius:'24px 24px 0 0',maxHeight:'80vh',display:'flex',flexDirection:'column' }} onClick={e=>e.stopPropagation()}>
        <div style={{ padding:'16px 20px 12px',borderBottom:'0.5px solid rgba(255,255,255,0.08)',flexShrink:0 }}>
          <div style={{ width:36,height:4,background:'rgba(255,255,255,0.2)',borderRadius:2,margin:'0 auto 14px' }}/>
          <div style={{ display:'flex',alignItems:'center',gap:10 }}>
            <div style={{ width:36,height:36,borderRadius:'50%',background:'linear-gradient(135deg,#C4683A,#E8854A)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18 }}>🌴</div>
            <div>
              <div style={{ fontFamily:F.serif,fontSize:17,color:'white' }}>Isla Support</div>
              <div style={{ fontSize:11,color:C.green,display:'flex',alignItems:'center',gap:4 }}>
                <span style={{ width:6,height:6,borderRadius:'50%',background:C.green,display:'inline-block' }}/>
                Available now
              </div>
            </div>
            <button onClick={onClose} style={{ marginLeft:'auto',background:'none',border:'none',color:C.muted,fontSize:20,cursor:'pointer' }}>✕</button>
          </div>
        </div>

        <div style={{ flex:1,overflowY:'auto',padding:'16px 20px',display:'flex',flexDirection:'column',gap:12 }}>
          {messages.map((m,i) => (
            <div key={i} style={{ display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start' }}>
              <div style={{ maxWidth:'80%',padding:'10px 14px',background:m.role==='user'?C.accent:'rgba(255,255,255,0.1)',borderRadius:m.role==='user'?'16px 16px 4px 16px':'16px 16px 16px 4px',fontSize:13,color:'white',fontFamily:F.sans,lineHeight:1.5 }}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display:'flex',gap:5,padding:'10px 14px',background:'rgba(255,255,255,0.1)',borderRadius:'16px 16px 16px 4px',width:'fit-content' }}>
              {[0,1,2].map(d=><div key={d} style={{ width:6,height:6,borderRadius:'50%',background:C.muted,animation:'chatBounce 1.2s '+(d*0.2)+'s infinite ease-in-out' }}/>)}
            </div>
          )}
          <div ref={endRef}/>
          <style>{'@keyframes chatBounce{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}'}</style>
        </div>

        <div style={{ padding:'12px 20px 32px',borderTop:'0.5px solid rgba(255,255,255,0.08)',flexShrink:0,display:'flex',gap:8 }}>
          <input value={input} onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&send()}
            placeholder="Type a message..."
            style={{ flex:1,padding:'11px 14px',background:'rgba(255,255,255,0.08)',border:'0.5px solid rgba(255,255,255,0.15)',borderRadius:24,color:'white',fontSize:13,fontFamily:F.sans,outline:'none' }}/>
          <button onClick={send} disabled={!input.trim()||loading}
            style={{ width:40,height:40,background:input.trim()?C.accent:'rgba(255,255,255,0.08)',border:'none',borderRadius:'50%',cursor:input.trim()?'pointer':'default',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M22 2L11 13"/><path d="M22 2L15 22l-4-9-9-4 20-7z"/></svg>
          </button>
        </div>
      </div>
    </div>
  )
}

// ── F5: Image search (camera → product ID) ────────────────────
export function ImageSearchButton({ onResult }) {
  const [loading, setLoading] = useState(false)
  const fileRef = useRef(null)

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    try {
      const reader = new FileReader()
      reader.onload = async (ev) => {
        const base64 = ev.target.result.split(',')[1]
        const productList = PRODUCTS.slice(0,80).map(p=>p.id+'|'+p.name+'|'+p.category).join('\n')
        const resp = await fetch('https://api.anthropic.com/v1/messages', {
          method:'POST',
          headers:{ 'Content-Type':'application/json','anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true','x-api-key':import.meta.env.VITE_ANTHROPIC_API_KEY||'' },
          body: JSON.stringify({
            model:'claude-haiku-4-5-20251001', max_tokens:200,
            messages:[{ role:'user', content:[
              { type:'image', source:{ type:'base64', media_type:file.type, data:base64 } },
              { type:'text', text:'What drink or product is in this image? Match it to the closest item from this list and return ONLY the product ID. If no match, return "none".\n\n'+productList }
            ]}]
          })
        })
        const data = await resp.json()
        const productId = data.content?.[0]?.text?.trim()
        if (productId && productId !== 'none') {
          const product = PRODUCTS.find(p=>p.id===productId)
          if (product) {
            onResult(product)
            toast.success('Found: '+product.name+' '+product.emoji, { duration:2000 })
          } else {
            toast('Could not find that product — try searching by name', { icon:'🔍' })
          }
        } else {
          toast('Could not identify the product — try a clearer photo', { icon:'📷' })
        }
        setLoading(false)
      }
      reader.readAsDataURL(file)
    } catch { setLoading(false); toast.error('Image search failed') }
  }

  return (
    <>
      <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFile} style={{ display:'none' }}/>
      <button onClick={()=>fileRef.current?.click()} disabled={loading}
        style={{ width:36,height:36,background:loading?'rgba(196,104,58,0.3)':'rgba(255,255,255,0.09)',border:'0.5px solid rgba(255,255,255,0.14)',borderRadius:10,cursor:loading?'default':'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
        {loading
          ? <div style={{ width:14,height:14,border:'2px solid rgba(255,255,255,0.2)',borderTopColor:'white',borderRadius:'50%',animation:'imgSpin 0.8s linear infinite' }}/>
          : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
        }
        <style>{'@keyframes imgSpin{to{transform:rotate(360deg)}}'}</style>
      </button>
    </>
  )
}

// ── F6: Smart quantity defaults (based on order history) ──────
export function useSmartQuantity(productId) {
  const [suggested, setSuggested] = useState(1)
  useEffect(() => {
    try {
      const history = JSON.parse(localStorage.getItem('isla_qty_history')||'{}')
      if (history[productId]) setSuggested(history[productId])
    } catch {}
  }, [productId])

  const recordQty = useCallback((qty) => {
    try {
      const history = JSON.parse(localStorage.getItem('isla_qty_history')||'{}')
      history[productId] = qty
      localStorage.setItem('isla_qty_history', JSON.stringify(history))
    } catch {}
  }, [productId])

  return { suggested, recordQty }
}

// ── F7: Order issue / missing item flow ───────────────────────
export function OrderIssueSheet({ order, onClose }) {
  const [step, setStep] = useState('type') // type | items | confirm | done
  const [issueType, setIssueType] = useState(null)
  const [selectedItems, setSelectedItems] = useState([])
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const ISSUE_TYPES = [
    { id:'missing',  emoji:'📦', label:'Missing items',      desc:'Items not in my delivery',      credit:true  },
    { id:'wrong',    emoji:'🔄', label:'Wrong items',        desc:'Got something I did not order',  credit:true  },
    { id:'damaged',  emoji:'💔', label:'Damaged / broken',   desc:'Items arrived damaged',          credit:true  },
    { id:'late',     emoji:'⏰', label:'Very late delivery',  desc:'Waited much longer than stated', credit:false },
    { id:'quality',  emoji:'👎', label:'Quality issue',      desc:'Product not as expected',        credit:true  },
    { id:'other',    emoji:'💬', label:'Something else',     desc:'Other issue with my order',      credit:false },
  ]

  const items = order?.order_items || []

  const toggleItem = (id) => setSelectedItems(s => s.includes(id) ? s.filter(i=>i!==id) : [...s, id])

  const submit = async () => {
    setSubmitting(true)
    try {
      const { supabase } = await import('../../lib/supabase')
      const issue = ISSUE_TYPES.find(i=>i.id===issueType)
      await supabase.from('order_issues').insert({
        order_id: order.id,
        issue_type: issueType,
        affected_items: selectedItems,
        notes,
        status: 'open',
        credit_requested: issue?.credit || false,
      })
      // Auto-credit for eligible issues
      if (issue?.credit && order.customer_id) {
        const creditAmount = selectedItems.length > 0
          ? items.filter(i=>selectedItems.includes(i.id)).reduce((s,i)=>s+(i.price||0)*i.quantity, 0)
          : Math.min(order.total * 0.2, 15) // 20% credit, max €15
        if (creditAmount > 0) {
          await supabase.from('customer_credits').insert({
            user_id: order.customer_id,
            amount: parseFloat(creditAmount.toFixed(2)),
            reason: 'Issue with order #'+order.order_number+' — '+issue.label,
            expires_at: new Date(Date.now()+90*86400000).toISOString(),
          })
        }
      }
      setStep('done')
    } catch { toast.error('Could not submit — try again') }
    setSubmitting(false)
  }

  return (
    <div style={{ position:'fixed',inset:0,zIndex:600,background:'rgba(0,0,0,0.75)',display:'flex',alignItems:'flex-end' }} onClick={onClose}>
      <div style={{ width:'100%',maxWidth:480,margin:'0 auto',background:'#0D3545',borderRadius:'24px 24px 0 0',maxHeight:'88vh',display:'flex',flexDirection:'column' }} onClick={e=>e.stopPropagation()}>
        <div style={{ padding:'16px 20px 12px',flexShrink:0 }}>
          <div style={{ width:36,height:4,background:'rgba(255,255,255,0.2)',borderRadius:2,margin:'0 auto 16px' }}/>
          {step !== 'done' && (
            <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:4 }}>
              {step !== 'type' && (
                <button onClick={()=>setStep('type')} style={{ background:'none',border:'none',color:C.muted,cursor:'pointer',fontSize:22,padding:0 }}>←</button>
              )}
              <div style={{ fontFamily:F.serif,fontSize:20,color:'white' }}>
                {step==='type'?'What went wrong?':step==='items'?'Which items?':'Confirm issue'}
              </div>
            </div>
          )}
        </div>

        <div style={{ overflowY:'auto',flex:1,padding:'0 20px 32px' }}>
          {step === 'type' && (
            <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
              {ISSUE_TYPES.map(issue => (
                <button key={issue.id} onClick={()=>{ setIssueType(issue.id); setStep(issue.id==='missing'||issue.id==='wrong'?'items':'confirm') }}
                  style={{ display:'flex',alignItems:'center',gap:14,padding:'14px 16px',background:'rgba(255,255,255,0.06)',border:'0.5px solid rgba(255,255,255,0.1)',borderRadius:14,cursor:'pointer',textAlign:'left' }}>
                  <span style={{ fontSize:26 }}>{issue.emoji}</span>
                  <div>
                    <div style={{ fontSize:14,fontWeight:600,color:'white',fontFamily:F.sans }}>{issue.label}</div>
                    <div style={{ fontSize:11,color:C.muted,marginTop:1 }}>{issue.desc}</div>
                  </div>
                  {issue.credit && <div style={{ marginLeft:'auto',fontSize:10,color:C.green,background:'rgba(126,232,162,0.1)',border:'0.5px solid rgba(126,232,162,0.25)',borderRadius:20,padding:'2px 8px',flexShrink:0 }}>Credit eligible</div>}
                </button>
              ))}
            </div>
          )}

          {step === 'items' && (
            <>
              <div style={{ fontSize:13,color:C.muted,marginBottom:14,fontFamily:F.sans }}>Select the affected items:</div>
              {items.map(item => (
                <button key={item.id} onClick={()=>toggleItem(item.id)}
                  style={{ display:'flex',alignItems:'center',gap:12,width:'100%',padding:'12px 14px',background:selectedItems.includes(item.id)?'rgba(196,104,58,0.2)':'rgba(255,255,255,0.05)',border:'0.5px solid '+(selectedItems.includes(item.id)?'rgba(196,104,58,0.5)':'rgba(255,255,255,0.08)'),borderRadius:12,cursor:'pointer',marginBottom:8,textAlign:'left' }}>
                  <span style={{ fontSize:20 }}>{item.products?.emoji||'📦'}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13,color:'white',fontFamily:F.sans }}>{item.products?.name||item.product_id}</div>
                    <div style={{ fontSize:11,color:C.muted }}>Qty: {item.quantity} · €{((item.price||0)*item.quantity).toFixed(2)}</div>
                  </div>
                  {selectedItems.includes(item.id) && <span style={{ color:C.accent,fontSize:18 }}>✓</span>}
                </button>
              ))}
              <button onClick={()=>setStep('confirm')} disabled={selectedItems.length===0}
                style={{ width:'100%',marginTop:10,padding:'14px',background:selectedItems.length>0?C.accent:'rgba(255,255,255,0.1)',border:'none',borderRadius:12,color:'white',fontSize:14,fontWeight:500,cursor:selectedItems.length>0?'pointer':'default',fontFamily:F.sans }}>
                Continue →
              </button>
            </>
          )}

          {step === 'confirm' && (
            <>
              <div style={{ background:'rgba(126,232,162,0.1)',border:'0.5px solid rgba(126,232,162,0.3)',borderRadius:12,padding:'12px 14px',marginBottom:16,fontSize:12,color:'rgba(126,232,162,0.9)',lineHeight:1.6 }}>
                ✅ We will review your issue and apply a credit to your account within minutes if eligible.
              </div>
              <div style={{ fontSize:12,color:C.muted,marginBottom:8 }}>Additional notes (optional)</div>
              <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={3}
                placeholder="Describe what happened..."
                style={{ width:'100%',padding:'11px 14px',background:'rgba(255,255,255,0.07)',border:'0.5px solid rgba(255,255,255,0.15)',borderRadius:10,color:'white',fontSize:13,fontFamily:F.sans,resize:'none',outline:'none',boxSizing:'border-box',marginBottom:16 }}/>
              <button onClick={submit} disabled={submitting}
                style={{ width:'100%',padding:'15px',background:C.accent,border:'none',borderRadius:14,color:'white',fontSize:15,fontWeight:600,cursor:'pointer',fontFamily:F.sans }}>
                {submitting?'Submitting...':'Submit issue →'}
              </button>
            </>
          )}

          {step === 'done' && (
            <div style={{ textAlign:'center',padding:'32px 0' }}>
              <div style={{ fontSize:56,marginBottom:16 }}>✅</div>
              <div style={{ fontFamily:F.serif,fontSize:22,color:'white',marginBottom:8 }}>Issue reported</div>
              <div style={{ fontSize:14,color:C.muted,lineHeight:1.6,marginBottom:24 }}>
                We have received your report and will process any credit within minutes. Thank you for your patience.
              </div>
              <button onClick={onClose}
                style={{ padding:'13px 32px',background:C.accent,border:'none',borderRadius:12,color:'white',fontSize:14,fontWeight:500,cursor:'pointer',fontFamily:F.sans }}>
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── F8: Real-time stock sync hook ─────────────────────────────
export function useRealtimeStock2() {
  const [stock, setStock] = useState({})
  useEffect(() => {
    const load = async () => {
      try {
        const { supabase } = await import('../../lib/supabase')
        const { data } = await supabase.from('product_stock').select('product_id,quantity,low_stock_threshold')
        if (data) {
          const map = {}
          data.forEach(s => { map[s.product_id] = { qty: s.quantity, low: s.quantity <= (s.low_stock_threshold||3) } })
          setStock(map)
        }
      } catch {}
    }
    load()
    // Subscribe to realtime changes
    const setup = async () => {
      const { supabase } = await import('../../lib/supabase')
      const sub = supabase.channel('stock-changes')
        .on('postgres_changes', { event:'UPDATE', schema:'public', table:'product_stock' }, payload => {
          const s = payload.new
          setStock(prev => ({ ...prev, [s.product_id]: { qty:s.quantity, low:s.quantity<=(s.low_stock_threshold||3) } }))
        })
        .subscribe()
      return sub
    }
    let sub
    setup().then(s => { sub = s })
    return () => { sub?.unsubscribe() }
  }, [])
  return stock
}

export function StockBadge2({ productId, stock }) {
  const s = stock?.[productId]
  if (!s || s.qty > 10) return null
  if (s.qty === 0) return (
    <div style={{ position:'absolute',inset:0,background:'rgba(13,53,69,0.75)',display:'flex',alignItems:'center',justifyContent:'center',borderRadius:'inherit' }}>
      <div style={{ fontSize:11,fontWeight:700,color:'white',background:'rgba(196,104,58,0.9)',padding:'3px 8px',borderRadius:20 }}>Out of stock</div>
    </div>
  )
  if (s.low) return (
    <div style={{ position:'absolute',top:5,right:5,fontSize:9,fontWeight:700,color:'white',background:'rgba(196,104,58,0.9)',padding:'2px 6px',borderRadius:20,zIndex:2 }}>
      Only {s.qty} left
    </div>
  )
  return null
}

// ── F9: Surge / dynamic pricing display ──────────────────────
export function useSurgePricing() {
  const [surge, setSurge] = useState(null)
  useEffect(() => {
    const hour = new Date().getHours()
    const day  = new Date().getDay()
    // Peak hours: Fri/Sat night (22-02), or any day 20-23
    const isFriSat = day === 5 || day === 6
    const isNight  = hour >= 22 || hour < 2
    const isEvening = hour >= 20 && hour < 22
    if (isFriSat && isNight) {
      setSurge({ multiplier:1.15, label:'Peak night pricing', reason:'High demand — Fri/Sat night', emoji:'🌙' })
    } else if (isEvening && isFriSat) {
      setSurge({ multiplier:1.10, label:'Evening surge', reason:'High demand this evening', emoji:'🌆' })
    } else {
      setSurge(null)
    }
  }, [])
  return surge
}

export function SurgePricingBanner({ surge }) {
  if (!surge) return null
  return (
    <div style={{ margin:'0 0 12px',background:'rgba(200,168,75,0.1)',border:'0.5px solid rgba(200,168,75,0.3)',borderRadius:10,padding:'9px 12px',display:'flex',alignItems:'center',gap:8 }}>
      <span style={{ fontSize:16 }}>{surge.emoji}</span>
      <div>
        <div style={{ fontSize:12,fontWeight:600,color:'#C8A84B',fontFamily:'DM Sans,sans-serif' }}>{surge.label} +{Math.round((surge.multiplier-1)*100)}%</div>
        <div style={{ fontSize:11,color:'rgba(255,255,255,0.5)' }}>{surge.reason}</div>
      </div>
    </div>
  )
}

// ── F10: Subscription / recurring orders UI ───────────────────
export function RecurringOrderSetup({ cart, onClose, onSchedule }) {
  const [frequency, setFrequency] = useState('weekly')
  const [day, setDay] = useState('Friday')
  const [time, setTime] = useState('18:00')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      const { supabase } = await import('../../lib/supabase')
      const { data:{ user } } = await supabase.auth.getUser()
      if (!user) { toast.error('Sign in to set up recurring orders'); setSaving(false); return }
      await supabase.from('subscriptions').insert({
        user_id: user.id,
        frequency,
        day_of_week: day,
        time_of_day: time,
        items: cart.items.map(i=>({ product_id:i.product.id, quantity:i.quantity })),
        delivery_address: cart.deliveryAddress,
        active: true,
        next_delivery: getNextDelivery(day, time),
      })
      toast.success('Recurring order set up! 🔄 First delivery '+getNextDelivery(day,time))
      onSchedule?.()
      onClose()
    } catch (err) { toast.error('Could not save — try again') }
    setSaving(false)
  }

  const getNextDelivery = (d, t) => {
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
    const target = days.indexOf(d)
    const now = new Date()
    const diff = (target - now.getDay() + 7) % 7 || 7
    const next = new Date(now)
    next.setDate(now.getDate() + diff)
    next.setHours(parseInt(t.split(':')[0]), parseInt(t.split(':')[1]), 0)
    return next.toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'short'})
  }

  return (
    <div style={{ position:'fixed',inset:0,zIndex:600,background:'rgba(0,0,0,0.75)',display:'flex',alignItems:'flex-end' }} onClick={onClose}>
      <div style={{ width:'100%',maxWidth:480,margin:'0 auto',background:'#0D3545',borderRadius:'24px 24px 0 0',padding:'20px 20px 40px' }} onClick={e=>e.stopPropagation()}>
        <div style={{ width:36,height:4,background:'rgba(255,255,255,0.2)',borderRadius:2,margin:'0 auto 18px' }}/>
        <div style={{ fontFamily:'DM Serif Display,serif',fontSize:22,color:'white',marginBottom:4 }}>🔄 Recurring order</div>
        <div style={{ fontSize:13,color:'rgba(255,255,255,0.5)',marginBottom:20 }}>Auto-deliver your current basket on a schedule</div>

        {[
          { label:'Frequency', options:['weekly','fortnightly','monthly'], value:frequency, set:setFrequency },
          { label:'Day', options:['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'], value:day, set:setDay },
          { label:'Time', options:['10:00','12:00','14:00','16:00','18:00','20:00','22:00'], value:time, set:setTime },
        ].map(({label,options,value,set}) => (
          <div key={label} style={{ marginBottom:14 }}>
            <div style={{ fontSize:11,color:'rgba(255,255,255,0.5)',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.5px',fontFamily:'DM Sans,sans-serif' }}>{label}</div>
            <div style={{ display:'flex',gap:6,flexWrap:'wrap' }}>
              {options.map(o=>(
                <button key={o} onClick={()=>set(o)}
                  style={{ padding:'7px 14px',borderRadius:20,border:'0.5px solid '+(value===o?'rgba(196,104,58,0.6)':'rgba(255,255,255,0.15)'),background:value===o?'rgba(196,104,58,0.2)':'transparent',color:value===o?'#E8A070':'rgba(255,255,255,0.6)',fontSize:12,cursor:'pointer',fontFamily:'DM Sans,sans-serif' }}>
                  {o}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div style={{ background:'rgba(43,122,139,0.15)',border:'0.5px solid rgba(43,122,139,0.3)',borderRadius:10,padding:'10px 14px',marginBottom:16,fontSize:12,color:'rgba(255,255,255,0.65)' }}>
          First delivery: <strong style={{ color:'white' }}>{getNextDelivery(day,time)}</strong>. Cancel anytime from your account.
        </div>

        <button onClick={save} disabled={saving}
          style={{ width:'100%',padding:'15px',background:'#C4683A',border:'none',borderRadius:14,color:'white',fontSize:15,fontWeight:600,cursor:'pointer',fontFamily:'DM Sans,sans-serif' }}>
          {saving?'Saving...':'Set up recurring delivery →'}
        </button>
      </div>
    </div>
  )
}

// ── F11: Product collections by occasion ──────────────────────
export function OccasionCollections({ onSelect }) {
  const OCCASIONS = [
    { id:'sundowner', emoji:'🌅', label:'Sundowner', products:['wn-021','ch-001','ic-001','sp-012'] },
    { id:'pool_day',  emoji:'🏊', label:'Pool day',  products:['wt-001','sd-028','ic-002','sn-001'] },
    { id:'club_night',emoji:'🎵', label:'Club night',products:['sp-004','sd-028','ic-002','tb-001'] },
    { id:'beach_day', emoji:'🏖️', label:'Beach day', products:['wt-001','sd-028','sn-001','ic-002'] },
    { id:'boat_trip', emoji:'⛵', label:'Boat trip', products:['ch-001','wn-021','wt-001','sn-001'] },
    { id:'bbq',       emoji:'🔥', label:'BBQ',       products:['br-001','sd-028','ic-002','sn-001'] },
    { id:'birthday',  emoji:'🎂', label:'Birthday',  products:['ch-001','sp-012','ic-001','sn-001'] },
    { id:'hangover',  emoji:'🤒', label:'Recovery',  products:['wt-001','sd-028','sn-001','es-013'] },
  ]
  const { addItem } = useCartStore()

  return (
    <div style={{ marginBottom:22 }}>
      <div style={{ fontFamily:'DM Serif Display,serif',fontSize:20,padding:'0 16px',marginBottom:12,color:'white' }}>Shop by occasion</div>
      <div style={{ display:'flex',gap:10,overflowX:'auto',padding:'0 16px 4px',scrollbarWidth:'none' }}>
        {OCCASIONS.map(occ => {
          const prods = occ.products.map(id=>PRODUCTS.find(p=>p.id===id)).filter(Boolean)
          return (
            <button key={occ.id} onClick={()=>onSelect(occ.id)}
              style={{ flexShrink:0,background:'rgba(255,255,255,0.07)',border:'0.5px solid rgba(255,255,255,0.12)',borderRadius:16,padding:'14px 16px',textAlign:'center',minWidth:110,cursor:'pointer' }}>
              <div style={{ fontSize:30,marginBottom:6 }}>{occ.emoji}</div>
              <div style={{ fontSize:12,fontWeight:600,color:'white',fontFamily:'DM Sans,sans-serif',marginBottom:2 }}>{occ.label}</div>
              <div style={{ fontSize:10,color:'rgba(255,255,255,0.45)' }}>{prods.length} items</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── F12: Size / price comparison ──────────────────────────────
export function SizePriceComparison({ product }) {
  const related = PRODUCTS.filter(p =>
    p.category === product.category &&
    p.id !== product.id &&
    p.name.split(' ').slice(0,-1).join(' ') === product.name.split(' ').slice(0,-1).join(' ')
  ).slice(0,3)

  if (!related.length) return null
  const all = [product, ...related].sort((a,b) => (a.price||0)-(b.price||0))
  const best = all.reduce((b,p) => {
    const unit = (p.price||0) / (parseFloat(p.name.match(/\d+(?:\.\d+)?(?:ml|cl|l)/i)?.[0]) || 1)
    const bestUnit = (b.price||0) / (parseFloat(b.name.match(/\d+(?:\.\d+)?(?:ml|cl|l)/i)?.[0]) || 1)
    return unit < bestUnit ? p : b
  }, all[0])

  return (
    <div style={{ marginTop:12,marginBottom:8 }}>
      <div style={{ fontSize:11,color:'rgba(255,255,255,0.4)',marginBottom:8,textTransform:'uppercase',letterSpacing:'0.5px',fontFamily:'DM Sans,sans-serif' }}>Other sizes</div>
      <div style={{ display:'flex',gap:8 }}>
        {all.map(p=>(
          <div key={p.id} style={{ flex:1,padding:'8px',background:p.id===product.id?'rgba(196,104,58,0.15)':'rgba(255,255,255,0.05)',border:'0.5px solid '+(p.id===product.id?'rgba(196,104,58,0.4)':'rgba(255,255,255,0.08)'),borderRadius:10,textAlign:'center' }}>
            <div style={{ fontSize:11,color:'white',fontFamily:'DM Sans,sans-serif',marginBottom:2 }}>{p.name.split(' ').slice(-1)[0]}</div>
            <div style={{ fontSize:13,fontWeight:700,color:'#E8A070' }}>€{p.price?.toFixed(2)}</div>
            {p.id===best.id && <div style={{ fontSize:9,color:C.green,marginTop:2 }}>Best value</div>}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── F13: QR code delivery confirmation ────────────────────────
export function DeliveryQRCode({ order }) {
  if (!order?.id) return null
  const qrData = JSON.stringify({ orderId:order.id, orderNumber:order.order_number, ts:Date.now() })
  const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data='+encodeURIComponent(qrData)+'&bgcolor=0D3545&color=FFFFFF&margin=10'

  return (
    <div style={{ background:'rgba(255,255,255,0.06)',border:'0.5px solid rgba(255,255,255,0.12)',borderRadius:16,padding:'16px',textAlign:'center',marginTop:12 }}>
      <div style={{ fontFamily:'DM Serif Display,serif',fontSize:16,color:'white',marginBottom:4 }}>Your delivery QR code</div>
      <div style={{ fontSize:12,color:'rgba(255,255,255,0.5)',marginBottom:14 }}>Show this to your driver at the gate or villa entrance</div>
      <img src={qrUrl} alt="Delivery QR" width={160} height={160} style={{ borderRadius:12,display:'block',margin:'0 auto' }}/>
      <div style={{ marginTop:10,fontSize:11,color:'rgba(255,255,255,0.4)',fontFamily:'DM Sans,sans-serif' }}>Order #{order.order_number}</div>
    </div>
  )
}

// ── F14: Driver rating system ─────────────────────────────────
export function DriverRatingSheet({ order, onClose }) {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [tags, setTags] = useState([])
  const [submitted, setSubmitted] = useState(false)

  const POSITIVE_TAGS = ['Fast delivery','Friendly','Careful with items','Easy to find','Great service']
  const NEGATIVE_TAGS = ['Took too long','Hard to find','Items damaged','Not responsive','Poor attitude']
  const activeTags = rating >= 4 ? POSITIVE_TAGS : NEGATIVE_TAGS

  const submit = async () => {
    try {
      const { supabase } = await import('../../lib/supabase')
      await supabase.from('driver_ratings').insert({
        order_id: order.id,
        driver_id: order.driver_id,
        rating,
        tags,
        comment,
        rated_at: new Date().toISOString(),
      })
      // Update driver average rating
      await supabase.rpc('update_driver_rating', { p_driver_id: order.driver_id, p_rating: rating })
      setSubmitted(true)
    } catch { toast.error('Could not submit — try again') }
  }

  if (submitted) return (
    <div style={{ position:'fixed',inset:0,zIndex:600,background:'rgba(0,0,0,0.75)',display:'flex',alignItems:'flex-end' }} onClick={onClose}>
      <div style={{ width:'100%',maxWidth:480,margin:'0 auto',background:'#0D3545',borderRadius:'24px 24px 0 0',padding:'32px 20px 48px',textAlign:'center' }} onClick={e=>e.stopPropagation()}>
        <div style={{ fontSize:56,marginBottom:12 }}>⭐</div>
        <div style={{ fontFamily:'DM Serif Display,serif',fontSize:22,color:'white',marginBottom:6 }}>Thanks for rating!</div>
        <div style={{ fontSize:14,color:C.muted,marginBottom:24 }}>Your feedback helps us improve every delivery.</div>
        <button onClick={onClose} style={{ padding:'12px 32px',background:C.accent,border:'none',borderRadius:12,color:'white',fontSize:14,cursor:'pointer',fontFamily:F.sans }}>Done</button>
      </div>
    </div>
  )

  return (
    <div style={{ position:'fixed',inset:0,zIndex:600,background:'rgba(0,0,0,0.75)',display:'flex',alignItems:'flex-end' }} onClick={onClose}>
      <div style={{ width:'100%',maxWidth:480,margin:'0 auto',background:'#0D3545',borderRadius:'24px 24px 0 0',padding:'20px 20px 40px' }} onClick={e=>e.stopPropagation()}>
        <div style={{ width:36,height:4,background:'rgba(255,255,255,0.2)',borderRadius:2,margin:'0 auto 18px' }}/>
        <div style={{ textAlign:'center',marginBottom:20 }}>
          <div style={{ fontFamily:F.serif,fontSize:22,color:'white',marginBottom:4 }}>Rate your delivery</div>
          <div style={{ fontSize:13,color:C.muted }}>Order #{order?.order_number}</div>
        </div>
        <div style={{ display:'flex',justifyContent:'center',gap:10,marginBottom:20 }}>
          {[1,2,3,4,5].map(star=>(
            <button key={star}
              onMouseEnter={()=>setHovered(star)} onMouseLeave={()=>setHovered(0)}
              onClick={()=>setRating(star)}
              style={{ background:'none',border:'none',cursor:'pointer',fontSize:38,transition:'transform 0.1s',transform:(hovered||rating)>=star?'scale(1.2)':'scale(1)' }}>
              {(hovered||rating)>=star?'⭐':'☆'}
            </button>
          ))}
        </div>
        {rating > 0 && (
          <>
            <div style={{ display:'flex',flexWrap:'wrap',gap:7,marginBottom:14,justifyContent:'center' }}>
              {activeTags.map(tag=>(
                <button key={tag} onClick={()=>setTags(t=>t.includes(tag)?t.filter(x=>x!==tag):[...t,tag])}
                  style={{ padding:'6px 13px',borderRadius:20,border:'0.5px solid '+(tags.includes(tag)?'rgba(196,104,58,0.6)':'rgba(255,255,255,0.15)'),background:tags.includes(tag)?'rgba(196,104,58,0.2)':'transparent',color:tags.includes(tag)?'#E8A070':C.muted,fontSize:12,cursor:'pointer',fontFamily:F.sans }}>
                  {tag}
                </button>
              ))}
            </div>
            <textarea value={comment} onChange={e=>setComment(e.target.value)} rows={2}
              placeholder="Any other comments? (optional)"
              style={{ width:'100%',padding:'11px 14px',background:'rgba(255,255,255,0.07)',border:'0.5px solid rgba(255,255,255,0.15)',borderRadius:10,color:'white',fontSize:13,fontFamily:F.sans,resize:'none',outline:'none',boxSizing:'border-box',marginBottom:16 }}/>
            <button onClick={submit}
              style={{ width:'100%',padding:'15px',background:C.accent,border:'none',borderRadius:14,color:'white',fontSize:15,fontWeight:600,cursor:'pointer',fontFamily:F.sans }}>
              Submit rating →
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ── F15: Gamification — challenges + badges ───────────────────
const CHALLENGES = [
  { id:'first_order',    emoji:'🌴', label:'First order',       desc:'Place your first order',         target:1,  reward:'€2 credit'  },
  { id:'three_streak',   emoji:'🔥', label:'3-day streak',      desc:'Order 3 days in a row',          target:3,  reward:'Free delivery' },
  { id:'night_owl',      emoji:'🦉', label:'Night owl',         desc:'Order after midnight 3 times',   target:3,  reward:'Bonus stamp'   },
  { id:'big_spender',    emoji:'💰', label:'Big spender',       desc:'Spend over €100 in one order',   target:100,reward:'€5 credit'  },
  { id:'beach_lover',    emoji:'🏖️', label:'Beach lover',       desc:'Use beach delivery 3 times',     target:3,  reward:'Free ice bag'  },
  { id:'pool_party_pro', emoji:'🏊', label:'Pool party pro',    desc:'Order in pool party mode 2×',    target:2,  reward:'Bonus stamp'   },
  { id:'loyal_regular',  emoji:'⭐', label:'Regular',           desc:'Complete 10 orders',             target:10, reward:'VIP tier boost' },
  { id:'referrer',       emoji:'🎁', label:'Ambassador',        desc:'Refer 3 friends who order',      target:3,  reward:'€15 credit' },
]

export function ChallengesBadgesView({ onClose }) {
  const [progress, setProgress] = useState({})
  const [badges, setBadges] = useState([])

  useEffect(() => {
    const load = async () => {
      try {
        const { supabase } = await import('../../lib/supabase')
        const { data:{ user } } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase.from('user_challenges')
          .select('challenge_id,progress,completed').eq('user_id', user.id)
        if (data) {
          const map = {}
          data.forEach(d => { map[d.challenge_id] = d })
          setProgress(map)
          setBadges(data.filter(d=>d.completed).map(d=>d.challenge_id))
        }
      } catch {}
    }
    load()
  }, [])

  return (
    <div style={{ position:'fixed',inset:0,zIndex:600,background:'rgba(0,0,0,0.75)',display:'flex',alignItems:'flex-end' }} onClick={onClose}>
      <div style={{ width:'100%',maxWidth:480,margin:'0 auto',background:'#0D3545',borderRadius:'24px 24px 0 0',maxHeight:'88vh',display:'flex',flexDirection:'column' }} onClick={e=>e.stopPropagation()}>
        <div style={{ padding:'16px 20px 12px',flexShrink:0 }}>
          <div style={{ width:36,height:4,background:'rgba(255,255,255,0.2)',borderRadius:2,margin:'0 auto 14px' }}/>
          <div style={{ fontFamily:F.serif,fontSize:22,color:'white',marginBottom:2 }}>Challenges & Badges</div>
          <div style={{ fontSize:12,color:C.muted }}>Complete challenges to earn rewards</div>
        </div>
        <div style={{ overflowY:'auto',flex:1,padding:'0 20px 32px' }}>
          {CHALLENGES.map(ch => {
            const p = progress[ch.id]
            const done = badges.includes(ch.id)
            const pct = Math.min(100, ((p?.progress||0)/ch.target)*100)
            return (
              <div key={ch.id} style={{ background:done?'rgba(126,232,162,0.08)':'rgba(255,255,255,0.05)',border:'0.5px solid '+(done?'rgba(126,232,162,0.25)':'rgba(255,255,255,0.08)'),borderRadius:14,padding:'14px 16px',marginBottom:10 }}>
                <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:8 }}>
                  <span style={{ fontSize:28 }}>{ch.emoji}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14,fontWeight:600,color:'white',fontFamily:F.sans }}>{ch.label} {done&&'✅'}</div>
                    <div style={{ fontSize:12,color:C.muted }}>{ch.desc}</div>
                  </div>
                  <div style={{ fontSize:11,color:C.green,background:'rgba(126,232,162,0.1)',border:'0.5px solid rgba(126,232,162,0.25)',borderRadius:20,padding:'3px 10px',flexShrink:0,fontFamily:F.sans }}>{ch.reward}</div>
                </div>
                {!done && (
                  <div style={{ background:'rgba(255,255,255,0.08)',borderRadius:99,height:6,overflow:'hidden' }}>
                    <div style={{ width:pct+'%',height:'100%',background:pct>=100?C.green:C.accent,borderRadius:99,transition:'width 0.5s' }}/>
                  </div>
                )}
                {!done && <div style={{ fontSize:10,color:C.muted,marginTop:4,fontFamily:F.sans }}>{p?.progress||0} / {ch.target}</div>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── F16: Refer-a-friend deep link ─────────────────────────────
export async function shareReferralLink(referralCode) {
  const url = window.location.origin + '/r/' + referralCode
  const text = 'Get €10 off your first Isla Drop order in Ibiza! Use my link:'
  if (navigator.share) {
    try {
      await navigator.share({ title:'Isla Drop — Ibiza delivery', text, url })
      return
    } catch {}
  }
  try {
    await navigator.clipboard.writeText(url)
    toast.success('Referral link copied! Share it with friends 🌴')
  } catch {
    toast(url, { icon:'🔗', duration:5000 })
  }
}

export function ReferralDeepLinkHandler() {
  useEffect(() => {
    // Handle /r/CODE deep links
    const path = window.location.pathname
    const match = path.match(/^\/r\/([A-Z0-9]+)$/i)
    if (match) {
      const code = match[1].toUpperCase()
      try { sessionStorage.setItem('isla_referral_code', code) } catch {}
      window.history.replaceState({}, '', '/')
      toast.success('Referral code '+code+' applied! Sign up to get €10 off 🎁', { duration:4000 })
    }
  }, [])
  return null
}

// ── F17: Abandoned basket push notification ───────────────────
export function useAbandonedBasketTracker() {
  const cart = useCartStore()
  const timerRef = useRef(null)

  useEffect(() => {
    if (cart.items.length > 0) {
      // Clear any existing timer
      if (timerRef.current) clearTimeout(timerRef.current)
      // Set timer — after 30 mins, trigger reminder
      timerRef.current = setTimeout(async () => {
        if (useCartStore.getState().items.length === 0) return
        try {
          const { supabase } = await import('../../lib/supabase')
          const { data:{ user } } = await supabase.auth.getUser()
          if (!user) return
          // Store abandoned basket record for push Edge Function to pick up
          await supabase.from('abandoned_baskets').upsert({
            user_id: user.id,
            items: useCartStore.getState().items.map(i=>({ product_id:i.product.id, quantity:i.quantity })),
            total: useCartStore.getState().getTotal(),
            abandoned_at: new Date().toISOString(),
            reminded: false,
          }, { onConflict:'user_id' })
        } catch {}
      }, 30 * 60 * 1000) // 30 minutes
    } else {
      // Cart cleared — remove abandoned basket record
      if (timerRef.current) clearTimeout(timerRef.current)
      import('../../lib/supabase').then(({ supabase }) => {
        supabase.auth.getUser().then(({ data:{ user } }) => {
          if (user) supabase.from('abandoned_baskets').delete().eq('user_id', user.id).catch(()=>{})
        })
      }).catch(()=>{})
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [cart.items.length])
}

// ── F18: First-order discount auto-apply ──────────────────────
export function useFirstOrderDiscount() {
  // DISABLED — enable from Ops Dashboard → Settings → Promotions
  return null
}

export function FirstOrderDiscountBanner({ discount, onApply }) {
  if (!discount) return null
  return (
    <div style={{ margin:'0 0 12px',background:'linear-gradient(135deg,rgba(126,232,162,0.12),rgba(43,122,139,0.15))',border:'0.5px solid rgba(126,232,162,0.3)',borderRadius:14,padding:'12px 14px',display:'flex',alignItems:'center',gap:12 }}>
      <span style={{ fontSize:24 }}>🎁</span>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:13,fontWeight:600,color:'white',fontFamily:'DM Sans,sans-serif',marginBottom:2 }}>{discount.label}</div>
        <div style={{ fontSize:11,color:'rgba(255,255,255,0.5)' }}>Applied automatically at checkout</div>
      </div>
      <button onClick={onApply}
        style={{ padding:'7px 14px',background:'rgba(126,232,162,0.2)',border:'0.5px solid rgba(126,232,162,0.4)',borderRadius:20,color:C.green,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'DM Sans,sans-serif',flexShrink:0 }}>
        Apply
      </button>
    </div>
  )
}

// ── F19: Free sample with order ───────────────────────────────
export function FreeSampleOffer({ subtotal, onAddSample }) {
  const MIN_FOR_SAMPLE = 40
  const [dismissed, setDismissed] = useState(false)
  const [added, setAdded] = useState(false)

  // Current free sample product — can be changed from Supabase
  const SAMPLE = PRODUCTS.find(p=>p.id==='sd-028') || PRODUCTS.find(p=>p.category==='soft_drinks')

  if (!SAMPLE || subtotal < MIN_FOR_SAMPLE || dismissed || added) return null

  return (
    <div style={{ background:'linear-gradient(135deg,rgba(200,168,75,0.12),rgba(196,104,58,0.1))',border:'0.5px solid rgba(200,168,75,0.3)',borderRadius:14,padding:'12px 14px',marginBottom:12,display:'flex',alignItems:'center',gap:12 }}>
      <span style={{ fontSize:28 }}>{SAMPLE.emoji}</span>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:12,fontWeight:600,color:'#C8A84B',fontFamily:'DM Sans,sans-serif',marginBottom:1 }}>Free sample included 🎁</div>
        <div style={{ fontSize:11,color:'rgba(255,255,255,0.55)' }}>+1 {SAMPLE.name} on us</div>
      </div>
      <div style={{ display:'flex',gap:6 }}>
        <button onClick={()=>{ onAddSample?.(SAMPLE); setAdded(true); toast.success('Free '+SAMPLE.name+' added! 🎁',{duration:1500}) }}
          style={{ padding:'6px 12px',background:'rgba(200,168,75,0.2)',border:'0.5px solid rgba(200,168,75,0.4)',borderRadius:20,color:'#C8A84B',fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:'DM Sans,sans-serif' }}>
          Add free
        </button>
        <button onClick={()=>setDismissed(true)}
          style={{ background:'none',border:'none',color:'rgba(255,255,255,0.3)',cursor:'pointer',fontSize:16,padding:'2px 4px' }}>✕</button>
      </div>
    </div>
  )
}

// ── F20: Birthday reward automation ──────────────────────────
export function useBirthdayReward() {
  const { user } = useAuthStore()
  const [hasBirthdayReward, setHasBirthdayReward] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    const check = async () => {
      try {
        const { supabase } = await import('../../lib/supabase')
        const { data: profile } = await supabase.from('profiles')
          .select('birthday').eq('id', user.id).single()
        if (!profile?.birthday) return
        const today = new Date()
        const bday  = new Date(profile.birthday)
        const isBirthday = today.getDate()===bday.getDate() && today.getMonth()===bday.getMonth()
        if (!isBirthday) return
        // Check if birthday credit already issued this year
        const thisYear = today.getFullYear()
        const { count } = await supabase.from('customer_credits')
          .select('id',{count:'exact',head:true})
          .eq('user_id', user.id)
          .like('reason', '%birthday%'+thisYear+'%')
        if (count > 0) return
        // Issue birthday credit
        await supabase.from('customer_credits').insert({
          user_id: user.id,
          amount: 15,
          reason: 'Happy birthday! 🎂 Gift from Isla Drop '+thisYear,
          expires_at: new Date(Date.now()+30*86400000).toISOString(),
        })
        setHasBirthdayReward(true)
        toast.success('🎂 Happy Birthday! €15 gift added to your account!', { duration:6000 })
      } catch {}
    }
    check()
  }, [user?.id])

  return hasBirthdayReward
}

export function BirthdayRewardBanner({ active }) {
  if (!active) return null
  return (
    <div style={{ margin:'0 16px 16px',background:'linear-gradient(135deg,rgba(196,104,58,0.2),rgba(200,168,75,0.15))',border:'0.5px solid rgba(200,168,75,0.4)',borderRadius:16,padding:'16px',display:'flex',alignItems:'center',gap:14 }}>
      <span style={{ fontSize:36 }}>🎂</span>
      <div>
        <div style={{ fontFamily:'DM Serif Display,serif',fontSize:18,color:'white',marginBottom:2 }}>Happy Birthday! 🎉</div>
        <div style={{ fontSize:12,color:'rgba(255,255,255,0.6)',lineHeight:1.5 }}>€15 birthday gift has been added to your account. Enjoy! 🌴</div>
      </div>
    </div>
  )
}
