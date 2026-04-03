import { useState } from 'react'
import { useAuthStore } from '../../lib/store'
import AuthScreen from '../shared/AuthScreen'

function AccordionItem({ icon, label, content }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ marginBottom:8 }}>
      <div onClick={()=>setOpen(o=>!o)} style={{ display:'flex',alignItems:'center',gap:12,padding:'14px 16px',background:'rgba(255,255,255,0.06)',borderRadius:open?'12px 12px 0 0':12,cursor:'pointer' }}>
        <span style={{ fontSize:18 }}>{icon}</span>
        <span style={{ fontSize:14,color:'rgba(255,255,255,0.82)',fontFamily:'DM Sans,sans-serif',flex:1 }}>{label}</span>
        <svg style={{ transition:'transform 0.2s',transform:open?'rotate(90deg)':'rotate(0)' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
      </div>
      {open && (
        <div style={{ padding:'12px 16px',background:'rgba(255,255,255,0.03)',borderRadius:'0 0 12px 12px',fontSize:13,color:'rgba(255,255,255,0.55)',fontFamily:'DM Sans,sans-serif',lineHeight:1.6 }}>
          {content}
        </div>
      )}
    </div>
  )
}

const SUPPORT_ANSWERS = [
  { q:['order','tracking','delivery','late','arrived'],
    a:'Your order updates in real time once a driver is assigned. Allow 30 minutes before contacting us — Ibiza traffic can be unpredictable!' },
  { q:['refund','money','payment','charge','wrong'],
    a:'For billing issues or refunds please email support@isladrop.com and we will resolve it within 24 hours.' },
  { q:['product','stock','available','item'],
    a:'Our catalogue updates regularly. If something is out of stock we will contact you with alternatives.' },
  { q:['driver','rude','behaviour','complaint'],
    a:'We are sorry to hear that. Please email support@isladrop.com with your order number and we will look into this immediately.' },
  { q:['address','location','villa','hotel','find'],
    a:'Set your delivery pin on the map at checkout, or type your villa or hotel name. Adding gate codes in notes really helps!' },
  { q:['cancel','cancellation'],
    a:'Orders can be cancelled within 2 minutes of placing. After that contact support@isladrop.com as quickly as possible.' },
  { q:['hours','open','time'],
    a:'We are open 24/7 — every day, all night, all season!' },
  { q:['minimum','min','order'],
    a:'No minimum order at all! Delivery is a flat rate of 3.50 euros regardless of order size.' },
]

function SupportChat({ onBack }) {
  const [messages, setMessages] = useState([
    { role:'assistant', text:'Hi! I am Isla. What can I help you with today? Ask about your order, delivery, products or anything else.' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const send = async (text) => {
    const q = (text || input).toLowerCase().trim()
    if (!q) return
    setMessages(prev => [...prev, { role:'user', text: text || input }])
    setInput('')
    setLoading(true)
    await new Promise(r => setTimeout(r, 500))
    let answer = null
    for (const entry of SUPPORT_ANSWERS) {
      if (entry.q.some(kw => q.includes(kw))) { answer = entry.a; break }
    }
    if (!answer) answer = 'Not sure about that one! Email support@isladrop.com or call +34 XXX XXX XXX and our team will help.'
    setMessages(prev => [...prev, { role:'assistant', text: answer }])
    setLoading(false)
  }

  return (
    <div style={{ padding:'16px 16px 20px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
        <button onClick={onBack} style={{ background:'none',border:'none',color:'rgba(255,255,255,0.6)',cursor:'pointer',fontSize:20,padding:0 }}>←</button>
        <div style={{ fontFamily:'DM Serif Display,serif',fontSize:22,color:'white' }}>Customer Support</div>
      </div>
      <div style={{ background:'rgba(255,255,255,0.05)',borderRadius:14,padding:14,marginBottom:16,minHeight:280,maxHeight:380,overflowY:'auto',display:'flex',flexDirection:'column',gap:10 }}>
        {messages.map((m,i) => (
          <div key={i} style={{ display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start' }}>
            <div style={{ background:m.role==='user'?'#C4683A':'rgba(255,255,255,0.1)',borderRadius:12,padding:'9px 13px',maxWidth:'82%',fontSize:13,color:'white',lineHeight:1.5,fontFamily:'DM Sans,sans-serif' }}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && <div style={{ fontSize:13,color:'rgba(255,255,255,0.4)',fontFamily:'DM Sans,sans-serif' }}>Isla is typing...</div>}
      </div>
      <div style={{ display:'flex',flexWrap:'wrap',gap:7,marginBottom:12 }}>
        {['Track my order','Refund request','Wrong item','Cancel order','Address help'].map(s=>(
          <button key={s} onClick={()=>send(s)} style={{ padding:'7px 12px',background:'rgba(255,255,255,0.08)',border:'0.5px solid rgba(255,255,255,0.15)',borderRadius:20,fontSize:11,color:'rgba(255,255,255,0.8)',cursor:'pointer',fontFamily:'DM Sans,sans-serif' }}>{s}</button>
        ))}
      </div>
      <div style={{ display:'flex',gap:8 }}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Ask Isla anything..." style={{ flex:1,padding:'11px 14px',background:'rgba(255,255,255,0.08)',border:'0.5px solid rgba(255,255,255,0.15)',borderRadius:24,fontFamily:'DM Sans,sans-serif',fontSize:13,color:'white',outline:'none' }}/>
        <button onClick={()=>send()} style={{ width:42,height:42,background:'#C4683A',border:'none',borderRadius:'50%',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M22 2L11 13"/><path d="M22 2L15 22l-4-9-9-4 20-7z"/></svg>
        </button>
      </div>
      <div style={{ marginTop:14,padding:'12px 14px',background:'rgba(255,255,255,0.05)',borderRadius:10,fontSize:12,color:'rgba(255,255,255,0.5)',fontFamily:'DM Sans,sans-serif',textAlign:'center' }}>
        Still need help? Email us at<br/>
        <a href="mailto:support@isladrop.com" style={{ color:'#E8A070' }}>support@isladrop.com</a>
      </div>
    </div>
  )
}

export default function AccountView({ t }) {
  const { user, profile, clear } = useAuthStore()
  const [showAuth, setShowAuth]       = useState(false)
  const [showSupport, setShowSupport] = useState(false)

  if (showSupport) return <SupportChat onBack={()=>setShowSupport(false)} />

  return (
    <div style={{ padding:'20px 16px' }}>
      <div style={{ fontFamily:'DM Serif Display,serif',fontSize:26,color:'white',marginBottom:20 }}>Account</div>
      {user ? (
        <>
          <div style={{ background:'rgba(255,255,255,0.07)',borderRadius:14,padding:16,marginBottom:12 }}>
            <div style={{ width:52,height:52,borderRadius:'50%',background:'linear-gradient(135deg,#C4683A,#E8854A)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,marginBottom:10 }}>
              {(profile?.full_name||'U').charAt(0).toUpperCase()}
            </div>
            <div style={{ fontSize:16,fontWeight:500,color:'white' }}>{profile?.full_name||'Guest'}</div>
            <div style={{ fontSize:13,color:'rgba(255,255,255,0.45)',marginTop:2 }}>{user.email}</div>
          </div>
          {[
            { icon:'📦', label:'Order history',     content:'Your past orders will appear here once placed. Track, reorder and view receipts all in one place.' },
            { icon:'📍', label:'Saved addresses',   content:'Save your villa, hotel or favourite spots for fast checkout. Use the address bar on the home screen to add one.' },
            { icon:'🔔', label:'Notifications',     content:'Push notifications coming soon! Get real-time updates on your order status and driver location.' },
            { icon:'🌍', label:'Language & region', content:'Use the flag icon in the top right of the home screen to switch between 13 languages.' },
          ].map(({icon,label,content})=>(
            <AccordionItem key={label} icon={icon} label={label} content={content} />
          ))}
          <div onClick={()=>setShowSupport(true)} style={{ display:'flex',alignItems:'center',gap:12,padding:'14px 16px',background:'rgba(196,104,58,0.15)',border:'0.5px solid rgba(196,104,58,0.3)',borderRadius:12,marginBottom:8,cursor:'pointer' }}>
            <span style={{ fontSize:18 }}>💬</span>
            <span style={{ fontSize:14,color:'white',fontFamily:'DM Sans,sans-serif' }}>Customer Support</span>
            <svg style={{ marginLeft:'auto' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
          </div>
          <button onClick={()=>{ import('../../lib/supabase').then(m=>m.supabase.auth.signOut()); clear() }}
            style={{ width:'100%',marginTop:8,padding:'13px',background:'rgba(196,104,58,0.12)',border:'0.5px solid rgba(196,104,58,0.3)',borderRadius:12,fontFamily:'DM Sans,sans-serif',fontSize:14,color:'#E8A070',cursor:'pointer' }}>
            Sign out
          </button>
        </>
      ) : (
        <>
          {showAuth
            ? <div style={{ background:'rgba(255,255,255,0.05)',borderRadius:16,padding:20 }}>
                <AuthScreen onClose={()=>setShowAuth(false)} />
              </div>
            : <>
                <div style={{ textAlign:'center',padding:'30px 0 20px' }}>
                  <div style={{ fontSize:48,marginBottom:14 }}>👤</div>
                  <div style={{ fontFamily:'DM Serif Display,serif',fontSize:22,color:'white',marginBottom:8 }}>Your account</div>
                  <div style={{ fontSize:14,color:'rgba(255,255,255,0.45)',marginBottom:24 }}>Sign in to track orders, save addresses and more</div>
                </div>
                <button onClick={()=>setShowAuth(true)}
                  style={{ width:'100%',padding:'14px',background:'#C4683A',color:'white',border:'none',borderRadius:12,fontFamily:'DM Sans,sans-serif',fontSize:15,fontWeight:500,cursor:'pointer',marginBottom:10 }}>
                  Sign in / Create account
                </button>
                <div onClick={()=>setShowSupport(true)} style={{ display:'flex',alignItems:'center',gap:12,padding:'14px 16px',background:'rgba(255,255,255,0.06)',borderRadius:12,cursor:'pointer',marginTop:8 }}>
                  <span style={{ fontSize:18 }}>💬</span>
                  <span style={{ fontSize:14,color:'rgba(255,255,255,0.82)',fontFamily:'DM Sans,sans-serif' }}>Customer Support</span>
                  <svg style={{ marginLeft:'auto' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                </div>
              </>
          }
        </>
      )}
    </div>
  )
}
