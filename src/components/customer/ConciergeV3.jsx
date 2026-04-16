import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthStore, useCartStore } from '../../lib/store'
import toast from 'react-hot-toast'

const C = {
  bg:'linear-gradient(170deg,#0A2A38 0%,#0D3545 35%,#1A5060 70%,#2B7A8B 100%)',
  header:'linear-gradient(135deg,#0D3B4A,#1A5263)',
  card:'rgba(255,255,255,0.92)', surface:'rgba(255,255,255,0.07)',
  surfaceB:'rgba(255,255,255,0.12)', border:'rgba(255,255,255,0.1)',
  accent:'#C4683A', accentDim:'rgba(196,104,58,0.2)',
  gold:'#C8A84B', goldDim:'rgba(200,168,75,0.15)',
  green:'#7EE8A2', greenDim:'rgba(126,232,162,0.12)',
  blue:'rgba(43,122,139,0.3)', blueSolid:'#2B7A8B',
  text:'#2A2318', muted:'rgba(255,255,255,0.45)', white:'white',
}
const F = { serif:'DM Serif Display,serif', sans:'DM Sans,sans-serif' }

function Sheet({ onClose, children, maxH='92vh' }) {
  return (
    <div style={{ position:'fixed', inset:0, zIndex:600, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'flex-end' }} onClick={onClose}>
      <div style={{ width:'100%', maxWidth:480, margin:'0 auto', background:'#0D3545', borderRadius:'24px 24px 0 0', maxHeight:maxH, overflowY:'auto' }} onClick={e=>e.stopPropagation()}>
        <div style={{ width:36, height:4, background:'rgba(255,255,255,0.2)', borderRadius:2, margin:'20px auto 0' }}/>
        {children}
      </div>
    </div>
  )
}

// ─── Import services from original Concierge ─────────────────
import { SERVICES } from './Concierge_final'

// ═══════════════════════════════════════════════════════════════
// AVAILABILITY CALENDAR
// ═══════════════════════════════════════════════════════════════
export function AvailabilityCalendar({ service, onDateSelect, onClose }) {
  const [month, setMonth] = useState(new Date())
  const [availability, setAvailability] = useState({})
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const from = new Date(month.getFullYear(), month.getMonth(), 1)
      const to = new Date(month.getFullYear(), month.getMonth()+1, 0)
      const { data } = await supabase.from('service_availability')
        .select('*').eq('service_id', service.id)
        .gte('date', from.toISOString().slice(0,10))
        .lte('date', to.toISOString().slice(0,10))
      const map = {}
      if (data) data.forEach(d => { map[d.date] = d })
      // Fill remaining with available
      for (let d = new Date(from); d <= to; d.setDate(d.getDate()+1)) {
        const key = d.toISOString().slice(0,10)
        if (!map[key] && d >= new Date()) map[key] = { status:'available', slots:3 }
        else if (!map[key]) map[key] = { status:'past' }
      }
      setAvailability(map)
      setLoading(false)
    }
    load()
  }, [month, service.id])

  const days = []
  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const last = new Date(month.getFullYear(), month.getMonth()+1, 0)
  // Padding
  for (let i=0; i<first.getDay(); i++) days.push(null)
  for (let d=1; d<=last.getDate(); d++) days.push(d)

  const getAvail = (d) => {
    if (!d) return null
    const key = new Date(month.getFullYear(), month.getMonth(), d).toISOString().slice(0,10)
    return availability[key]
  }
  const getColor = (av) => {
    if (!av || av.status==='past') return 'rgba(255,255,255,0.05)'
    if (av.status==='booked') return C.accentDim
    if (av.slots <= 1) return 'rgba(200,168,75,0.15)'
    return 'rgba(126,232,162,0.12)'
  }
  const getBorder = (av) => {
    if (!av || av.status==='past') return '0.5px solid rgba(255,255,255,0.05)'
    if (av.status==='booked') return '0.5px solid rgba(196,104,58,0.3)'
    if (av.slots <= 1) return '0.5px solid rgba(200,168,75,0.3)'
    return '0.5px solid rgba(126,232,162,0.3)'
  }

  return (
    <Sheet onClose={onClose}>
      <div style={{ padding:'20px 20px 40px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div style={{ fontFamily:F.serif, fontSize:22, color:C.white }}>Check availability</div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:C.muted, fontSize:22, cursor:'pointer' }}>×</button>
        </div>
        <div style={{ fontSize:13, color:C.muted, marginBottom:16 }}>{service.name}</div>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <button onClick={()=>setMonth(m=>new Date(m.getFullYear(),m.getMonth()-1,1))}
            style={{ background:'rgba(255,255,255,0.1)', border:'none', borderRadius:8, padding:'6px 12px', color:C.white, cursor:'pointer', fontSize:16 }}>‹</button>
          <div style={{ fontFamily:F.serif, fontSize:18, color:C.white }}>
            {month.toLocaleDateString('en-GB',{month:'long',year:'numeric'})}
          </div>
          <button onClick={()=>setMonth(m=>new Date(m.getFullYear(),m.getMonth()+1,1))}
            style={{ background:'rgba(255,255,255,0.1)', border:'none', borderRadius:8, padding:'6px 12px', color:C.white, cursor:'pointer', fontSize:16 }}>›</button>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4, marginBottom:8 }}>
          {['S','M','T','W','T','F','S'].map((d,i)=>(
            <div key={i} style={{ textAlign:'center', fontSize:11, color:C.muted, padding:'4px 0', fontWeight:700 }}>{d}</div>
          ))}
        </div>

        {loading ? <div style={{textAlign:'center',padding:32,color:C.muted}}>Loading...</div>
        : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4, marginBottom:20 }}>
            {days.map((d,i) => {
              const av = getAvail(d)
              const isSelected = selected === d
              const isAvail = av && av.status !== 'past' && av.status !== 'booked'
              return (
                <button key={i} onClick={()=>{if(isAvail){setSelected(d)}}}
                  disabled={!isAvail}
                  style={{ aspectRatio:'1', borderRadius:10, background:isSelected?C.accent:getColor(av), border:isSelected?'none':getBorder(av), color:isSelected?'white':d?C.white:'transparent', fontSize:13, cursor:isAvail?'pointer':'default', fontWeight:isSelected?700:400, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {d||''}
                </button>
              )
            })}
          </div>
        )}

        <div style={{ display:'flex', gap:10, marginBottom:20, fontSize:11 }}>
          {[['rgba(126,232,162,0.12)','rgba(126,232,162,0.3)','Available'],['rgba(200,168,75,0.15)','rgba(200,168,75,0.3)','Last slot'],['rgba(196,104,58,0.2)','rgba(196,104,58,0.3)','Booked']].map(([bg,br,label])=>(
            <div key={label} style={{ display:'flex', alignItems:'center', gap:5 }}>
              <div style={{ width:14, height:14, borderRadius:4, background:bg, border:'0.5px solid '+br }}/>
              <span style={{ color:C.muted }}>{label}</span>
            </div>
          ))}
        </div>

        <button onClick={()=>selected&&onDateSelect(new Date(month.getFullYear(),month.getMonth(),selected))}
          disabled={!selected}
          style={{ width:'100%', padding:'14px', background:selected?C.accent:'rgba(255,255,255,0.1)', border:'none', borderRadius:14, color:'white', fontSize:15, fontWeight:600, cursor:selected?'pointer':'default', fontFamily:F.sans }}>
          {selected ? 'Continue with ' + new Date(month.getFullYear(),month.getMonth(),selected).toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'}) : 'Select a date'}
        </button>
      </div>
    </Sheet>
  )
}

// ═══════════════════════════════════════════════════════════════
// CONCIERGE CHAT
// ═══════════════════════════════════════════════════════════════
export function ConciergeChat({ booking, onClose }) {
  const { user, profile } = useAuthStore()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  const load = useCallback(async () => {
    if (!booking?.id) return
    const { data } = await supabase.from('concierge_messages')
      .select('*').eq('booking_id', booking.id).order('created_at',{ascending:true})
    setMessages(data||[{
      id:'welcome', from_ops:true, message:'Hi '+( profile?.full_name?.split(' ')[0]||'there')+'! I\'m your personal Isla Drop concierge. How can I help with your '+booking.service_name+' booking?', created_at:new Date().toISOString()
    }])
  }, [booking?.id, profile?.full_name, booking?.service_name])

  useEffect(() => { load() }, [load])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }) }, [messages])

  // Real-time subscription
  useEffect(() => {
    if (!booking?.id) return
    const ch = supabase.channel('concierge_chat_'+booking.id)
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'concierge_messages',filter:'booking_id=eq.'+booking.id}, (payload) => {
        setMessages(prev => [...prev, payload.new])
      }).subscribe()
    return () => ch.unsubscribe()
  }, [booking?.id])

  const send = async () => {
    if (!input.trim()||!booking?.id) return
    setSending(true)
    const msg = { booking_id:booking.id, from_ops:false, sender_id:user?.id, message:input.trim() }
    await supabase.from('concierge_messages').insert(msg)
    setInput('')
    setSending(false)
  }

  const QUICK_MSGS = ['Can we add a birthday cake?','What is the dress code?','Can we arrive early?','Please confirm our booking']

  return (
    <Sheet onClose={onClose} maxH="90vh">
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'20px 20px 16px', borderBottom:'0.5px solid rgba(255,255,255,0.1)' }}>
        <div style={{ width:40, height:40, borderRadius:'50%', background:C.accentDim, border:'2px solid '+C.accent, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>🌴</div>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:F.serif, fontSize:18, color:C.white }}>Isla Drop Concierge</div>
          <div style={{ fontSize:11, color:C.green }}>● Online · replies within minutes</div>
        </div>
        <button onClick={onClose} style={{ background:'none', border:'none', color:C.muted, fontSize:22, cursor:'pointer' }}>×</button>
      </div>

      <div style={{ padding:'16px', minHeight:300, maxHeight:'50vh', overflowY:'auto' }}>
        {messages.map(m => (
          <div key={m.id} style={{ display:'flex', justifyContent:m.from_ops?'flex-start':'flex-end', marginBottom:12 }}>
            <div style={{ maxWidth:'75%', padding:'10px 14px', borderRadius:m.from_ops?'4px 16px 16px 16px':'16px 4px 16px 16px', background:m.from_ops?C.surfaceB:C.accent, fontSize:13, color:C.white, lineHeight:1.5 }}>
              {m.message}
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.45)', marginTop:4, textAlign:'right' }}>
                {new Date(m.created_at).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef}/>
      </div>

      <div style={{ padding:'8px 16px', display:'flex', gap:6, flexWrap:'wrap', borderTop:'0.5px solid rgba(255,255,255,0.08)' }}>
        {QUICK_MSGS.map(q=>(
          <button key={q} onClick={()=>setInput(q)}
            style={{ padding:'5px 10px', background:'rgba(255,255,255,0.08)', border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:20, color:'rgba(255,255,255,0.7)', fontSize:11, cursor:'pointer' }}>
            {q}
          </button>
        ))}
      </div>

      <div style={{ padding:'12px 16px 40px', display:'flex', gap:10 }}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!sending&&send()}
          placeholder="Message your concierge..." autoFocus
          style={{ flex:1, padding:'11px 14px', background:'rgba(255,255,255,0.08)', border:'0.5px solid rgba(255,255,255,0.2)', borderRadius:12, color:C.white, fontSize:13, fontFamily:F.sans, outline:'none' }} />
        <button onClick={send} disabled={sending||!input.trim()}
          style={{ width:44, height:44, borderRadius:12, background:input.trim()?C.accent:'rgba(255,255,255,0.1)', border:'none', color:'white', fontSize:20, cursor:input.trim()?'pointer':'default' }}>
          ↑
        </button>
      </div>
    </Sheet>
  )
}

// ═══════════════════════════════════════════════════════════════
// CUSTOM PACKAGE BUILDER — Build your perfect Ibiza day
// ═══════════════════════════════════════════════════════════════
export function PackageBuilder({ onClose, onBook }) {
  const [step, setStep] = useState(0)
  const [selections, setSelections] = useState({ morning:null, afternoon:null, evening:null })
  const [guests, setGuests] = useState(4)
  const [date, setDate] = useState('')

  const SLOTS = {
    morning: {
      label:'🌅 Morning (8am–1pm)',
      options: SERVICES.filter(s=>['boats'].includes(s.category)).slice(0,4)
    },
    afternoon: {
      label:'☀️ Afternoon (1pm–7pm)',
      options: SERVICES.filter(s=>['villas','experiences'].includes(s.category)).slice(0,4)
    },
    evening: {
      label:'🌙 Evening (8pm onwards)',
      options: SERVICES.filter(s=>['clubs','restaurants'].includes(s.category)).slice(0,4)
    }
  }

  const slotKeys = Object.keys(SLOTS)
  const currentSlot = slotKeys[step]
  const total = Object.values(selections).filter(Boolean).reduce((s,sv)=>s+(sv.price*guests),0)
  const commission = total * 0.1

  const select = (service) => {
    setSelections(p=>({...p,[currentSlot]:service}))
    if (step < slotKeys.length-1) setTimeout(()=>setStep(s=>s+1), 300)
  }

  const book = async () => {
    const selected = Object.entries(selections).filter(([,v])=>v)
    for (const [slot, service] of selected) {
      await supabase.from('concierge_bookings').insert({
        service_id: service.id, service_name: service.name,
        booking_ref: 'PKG-' + Math.random().toString(36).slice(2,8).toUpperCase(),
        guests, booking_date: date, total_price: service.price*guests,
        commission_amount: service.price*guests*0.1,
        package_slot: slot, status:'pending'
      })
    }
    toast.success('Package request sent! Your concierge will confirm within 1 hour.')
    onBook?.()
    onClose()
  }

  if (step === slotKeys.length) {
    // Review
    const picked = Object.entries(selections).filter(([,v])=>v)
    return (
      <Sheet onClose={onClose}>
        <div style={{ padding:'20px 20px 48px' }}>
          <div style={{ fontFamily:F.serif, fontSize:24, color:C.white, marginBottom:4 }}>Your Ibiza day</div>
          <div style={{ fontSize:13, color:C.muted, marginBottom:20 }}>Review your perfect package</div>

          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:12, color:C.muted, marginBottom:8 }}>Date</div>
            <input type="date" value={date} onChange={e=>setDate(e.target.value)}
              min={new Date().toISOString().slice(0,10)}
              style={{ width:'100%', padding:'11px 14px', background:'rgba(255,255,255,0.08)', border:'0.5px solid rgba(255,255,255,0.2)', borderRadius:10, color:C.white, fontSize:14, fontFamily:F.sans, outline:'none', boxSizing:'border-box', marginBottom:10 }} />
            <div style={{ fontSize:12, color:C.muted, marginBottom:6 }}>Guests</div>
            <div style={{ display:'flex', gap:8 }}>
              {[2,4,6,8,10,12].map(n=>(
                <button key={n} onClick={()=>setGuests(n)}
                  style={{ flex:1, padding:'8px 0', borderRadius:8, border:'0.5px solid '+(guests===n?C.accent:C.border), background:guests===n?C.accentDim:'transparent', color:guests===n?C.accent:C.muted, cursor:'pointer', fontSize:13, fontWeight:guests===n?700:400 }}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          {picked.map(([slot,service])=>(
            <div key={slot} style={{ background:C.surface, borderRadius:12, padding:'14px', marginBottom:8, border:'0.5px solid '+C.border }}>
              <div style={{ fontSize:11, color:C.muted, textTransform:'uppercase', marginBottom:4 }}>{SLOTS[slot].label}</div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div style={{ fontSize:14, fontWeight:600, color:C.white }}>{service.emoji} {service.name}</div>
                <div style={{ fontSize:14, fontWeight:700, color:C.gold }}>€{(service.price*guests).toLocaleString()}</div>
              </div>
            </div>
          ))}

          <div style={{ padding:'14px 0', borderTop:'0.5px solid rgba(255,255,255,0.1)', marginBottom:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:C.muted, marginBottom:4 }}>
              <span>Subtotal ({guests} guests)</span><span>€{total.toLocaleString()}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:C.muted, marginBottom:4 }}>
              <span>Isla Drop concierge fee (10%)</span><span>€{commission.toFixed(0)}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:20, fontWeight:800, color:C.gold }}>
              <span>Total</span><span>€{(total+commission).toLocaleString()}</span>
            </div>
          </div>

          <button onClick={book} disabled={!date}
            style={{ width:'100%', padding:'16px', background:date?C.accent:'rgba(255,255,255,0.1)', border:'none', borderRadius:14, color:'white', fontSize:16, fontWeight:700, cursor:date?'pointer':'default', fontFamily:F.sans, marginBottom:10 }}>
            🌴 Request this package
          </button>
          <button onClick={()=>setStep(0)} style={{ width:'100%', padding:'12px', background:'transparent', border:'0.5px solid rgba(255,255,255,0.2)', borderRadius:12, color:C.muted, fontSize:13, cursor:'pointer' }}>
            ← Edit selections
          </button>
        </div>
      </Sheet>
    )
  }

  const slot = SLOTS[currentSlot]
  return (
    <Sheet onClose={onClose}>
      <div style={{ padding:'20px 20px 48px' }}>
        <div style={{ fontFamily:F.serif, fontSize:24, color:C.white, marginBottom:4 }}>Build your Ibiza day</div>
        <div style={{ display:'flex', gap:4, marginBottom:20 }}>
          {slotKeys.map((k,i)=>(
            <div key={k} style={{ flex:1, height:3, borderRadius:99, background:i<=step?C.accent:'rgba(255,255,255,0.15)' }}/>
          ))}
        </div>
        <div style={{ fontSize:16, fontWeight:700, color:C.gold, marginBottom:4 }}>{slot.label}</div>
        <div style={{ fontSize:13, color:C.muted, marginBottom:20 }}>Choose an experience or skip</div>

        <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:16 }}>
          {slot.options.map(s=>(
            <button key={s.id} onClick={()=>select(s)}
              style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 16px', background:selections[currentSlot]?.id===s.id?C.accentDim:C.surface, border:'0.5px solid '+(selections[currentSlot]?.id===s.id?C.accent:C.border), borderRadius:14, cursor:'pointer', textAlign:'left' }}>
              <span style={{ fontSize:28, flexShrink:0 }}>{s.emoji}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:600, color:C.white }}>{s.name}</div>
                <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{s.subtitle}</div>
              </div>
              <div style={{ fontSize:14, fontWeight:700, color:C.gold, flexShrink:0 }}>€{s.price.toLocaleString()}</div>
            </button>
          ))}
        </div>

        <button onClick={()=>setStep(s=>s+1)}
          style={{ width:'100%', padding:'12px', background:'transparent', border:'0.5px solid rgba(255,255,255,0.2)', borderRadius:12, color:C.muted, fontSize:13, cursor:'pointer' }}>
          Skip this slot →
        </button>
      </div>
    </Sheet>
  )
}

// ═══════════════════════════════════════════════════════════════
// CONCIERGE AI RECOMMENDATION ENGINE
// ═══════════════════════════════════════════════════════════════
export function ConciergeAI({ onClose, onBook }) {
  const [messages, setMessages] = useState([{
    role:'assistant',
    content:'✨ Welcome to Isla Drop Concierge! I\'m your personal Ibiza expert. Tell me about your perfect day — how many guests, your vibe, your budget — and I\'ll build you a bespoke itinerary with real pricing.',
    suggestions:['VIP night out for 8 people with a boat the next day','Romantic sunset boat trip followed by dinner','Party package for 12 — boat, villa pool, club','Ibiza arrival experience for 4 budget-conscious friends']
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }) }, [messages])

  const send = async (text) => {
    const q = text || input.trim()
    if (!q || loading) return
    const history = [...messages, { role:'user', content:q }]
    setMessages(history)
    setInput('')
    setLoading(true)

    try {
      const serviceContext = SERVICES.slice(0,20).map(s=>
        s.id+'|'+s.name+'|'+s.category+'|€'+s.price+'/'+s.unit+'|'+s.subtitle
      ).join('\n')

      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          model:'claude-sonnet-4-20250514', max_tokens:1000,
          system:'You are Isla Drop personal Ibiza concierge AI. Help customers build perfect experiences. Available services:\n'+serviceContext+'\n\nRules: Recommend 2-4 specific services with real prices. Build complete itineraries. Calculate total costs including 10% concierge fee. Be warm and aspirational. Format clearly with service names, prices and times. End with a Book this package suggestion. Keep under 300 words.',
          messages: history.map(m=>({role:m.role,content:m.content}))
        })
      })
      const data = await resp.json()
      const reply = data.content?.[0]?.text || 'I\'d love to help plan your perfect Ibiza day! Could you tell me more about your group size, dates and the vibe you\'re looking for?'
      setMessages(prev=>[...prev,{ role:'assistant', content:reply }])
    } catch {
      setMessages(prev=>[...prev,{ role:'assistant', content:'I\'m having trouble connecting right now. Please try again or contact us directly at concierge@isladrop.net.' }])
    }
    setLoading(false)
  }

  return (
    <Sheet onClose={onClose} maxH="92vh">
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'20px 20px 16px', borderBottom:'0.5px solid rgba(255,255,255,0.1)' }}>
        <div style={{ width:44, height:44, borderRadius:12, background:C.accentDim, border:'1px solid '+C.accent, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>🌴</div>
        <div>
          <div style={{ fontFamily:F.serif, fontSize:18, color:C.white }}>Concierge AI</div>
          <div style={{ fontSize:11, color:C.green }}>● Powered by Claude · Ibiza expert</div>
        </div>
        <button onClick={onClose} style={{ marginLeft:'auto', background:'none', border:'none', color:C.muted, fontSize:22, cursor:'pointer' }}>×</button>
      </div>

      <div style={{ padding:'16px', minHeight:280, maxHeight:'52vh', overflowY:'auto' }}>
        {messages.map((m,i) => (
          <div key={i} style={{ marginBottom:16 }}>
            <div style={{ display:'flex', justifyContent:m.role==='user'?'flex-end':'flex-start' }}>
              <div style={{ maxWidth:'80%', padding:'12px 16px', borderRadius:m.role==='user'?'16px 4px 16px 16px':'4px 16px 16px 16px', background:m.role==='user'?C.accent:C.surfaceB, fontSize:13, color:C.white, lineHeight:1.6, whiteSpace:'pre-wrap' }}>
                {m.content}
              </div>
            </div>
            {m.suggestions && (
              <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:10 }}>
                {m.suggestions.map(s=>(
                  <button key={s} onClick={()=>send(s)}
                    style={{ padding:'8px 14px', background:'rgba(200,168,75,0.1)', border:'0.5px solid rgba(200,168,75,0.3)', borderRadius:10, color:C.gold, fontSize:12, cursor:'pointer', textAlign:'left', fontFamily:F.sans }}>
                    ✨ {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ display:'flex', justifyContent:'flex-start' }}>
            <div style={{ padding:'12px 16px', background:C.surfaceB, borderRadius:'4px 16px 16px 16px', fontSize:13, color:C.muted }}>
              <span style={{ animation:'pulse 1s infinite' }}>✍️ Writing your itinerary...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      <div style={{ padding:'12px 16px 40px', display:'flex', gap:10 }}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!loading&&send()}
          placeholder="Tell me about your perfect Ibiza experience..."
          style={{ flex:1, padding:'11px 14px', background:'rgba(255,255,255,0.08)', border:'0.5px solid rgba(255,255,255,0.2)', borderRadius:12, color:C.white, fontSize:13, fontFamily:F.sans, outline:'none' }} />
        <button onClick={()=>send()} disabled={loading||!input.trim()}
          style={{ width:44, height:44, borderRadius:12, background:input.trim()&&!loading?C.accent:'rgba(255,255,255,0.1)', border:'none', color:'white', fontSize:20, cursor:input.trim()&&!loading?'pointer':'default' }}>
          ↑
        </button>
      </div>
    </Sheet>
  )
}
