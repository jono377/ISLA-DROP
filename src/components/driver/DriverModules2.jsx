import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../lib/store'
import toast from 'react-hot-toast'

// Driver design system tokens
const DS = {
  bg:'#F5F4F2', surface:'#FFFFFF', surface2:'#F0EEE9',
  accent:'#C4683A', accentDim:'rgba(196,104,58,0.1)',
  green:'#1D9E75', greenDim:'rgba(29,158,117,0.1)',
  blue:'#2B7A8B', blueDim:'rgba(43,122,139,0.1)',
  red:'#C43A3A', redDim:'rgba(196,58,58,0.1)',
  yellow:'#B8860B', yellowDim:'rgba(184,134,11,0.1)',
  t1:'#1A1A1A', t2:'#5A5A5A', t3:'#9A9A9A',
  border:'rgba(0,0,0,0.08)', border2:'rgba(0,0,0,0.12)',
  f:'DM Sans,sans-serif', fh:'DM Serif Display,serif',
  r1:10, r2:16,
}

function Card({ children, style={} }) {
  return <div style={{ background:DS.surface, borderRadius:DS.r2, border:'1px solid '+DS.border, marginBottom:12, overflow:'hidden', ...style }}>{children}</div>
}
function Btn({ children, onClick, color=DS.accent, outline, disabled, style={} }) {
  return <button onClick={onClick} disabled={disabled}
    style={{ padding:'12px 18px', background:outline?'transparent':disabled?DS.border:color, border:outline?'1px solid '+color:'none', borderRadius:DS.r1, color:outline?color:'white', fontSize:14, fontWeight:700, cursor:disabled?'default':'pointer', opacity:disabled?0.5:1, fontFamily:DS.f, ...style }}>
    {children}
  </button>
}

// ═══════════════════════════════════════════════════════════════
// 17. PAYOUT REQUEST
// ═══════════════════════════════════════════════════════════════
export function PayoutRequestTab({ profile }) {
  const [balance, setBalance] = useState(0)
  const [pending, setPending] = useState(0)
  const [history, setHistory] = useState([])
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('bank')
  const [details, setDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.id) { setLoading(false); return }
    Promise.all([
      supabase.from('driver_earnings').select('amount,type,created_at').eq('driver_id',profile.id).order('created_at',{ascending:false}),
      supabase.from('driver_payout_requests').select('*').eq('driver_id',profile.id).order('created_at',{ascending:false}).limit(10)
    ]).then(([earnings, payouts]) => {
      const totalEarned = (earnings.data||[]).reduce((s,e)=>s+(e.amount||0),0)
      const totalPaid = (payouts.data||[]).filter(p=>p.status==='paid').reduce((s,p)=>s+(p.amount||0),0)
      const pendingAmt = (payouts.data||[]).filter(p=>p.status==='pending').reduce((s,p)=>s+(p.amount||0),0)
      setBalance(Math.max(0, totalEarned-totalPaid-pendingAmt))
      setPending(pendingAmt)
      setHistory(payouts.data||[])
      setLoading(false)
    }).catch(()=>setLoading(false))
  }, [profile?.id])

  const request = async () => {
    const amt = parseFloat(amount)
    if (!amt || amt < 10) { toast.error('Minimum payout is €10'); return }
    if (amt > balance) { toast.error('Amount exceeds available balance'); return }
    if (!details.trim()) { toast.error('Please enter payment details'); return }
    setSubmitting(true)
    const { error } = await supabase.from('driver_payout_requests').insert({
      driver_id: profile.id, amount: amt, method, details, status:'pending'
    })
    if (!error) {
      toast.success('Payout request submitted! Processed within 24 hours.')
      setBalance(b=>b-amt); setPending(p=>p+amt); setAmount(''); setDetails('')
    } else toast.error('Request failed: '+error.message)
    setSubmitting(false)
  }

  const statusColor = s => s==='paid'?DS.green:s==='rejected'?DS.red:DS.yellow
  const statusLabel = s => s==='paid'?'✅ Paid':s==='rejected'?'❌ Rejected':'⏳ Pending'

  return (
    <div style={{ padding:16 }}>
      <div style={{ fontFamily:DS.fh, fontSize:22, marginBottom:16 }}>Earnings & Payouts</div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
        {[['💰','€'+balance.toFixed(2),'Available',DS.green],['⏳','€'+pending.toFixed(2),'Pending',DS.yellow]].map(([icon,val,label,color])=>(
          <Card key={label} style={{ padding:'16px', margin:0 }}>
            <div style={{ fontSize:24 }}>{icon}</div>
            <div style={{ fontSize:26, fontWeight:900, color, marginTop:4 }}>{val}</div>
            <div style={{ fontSize:12, color:DS.t3, marginTop:2 }}>{label}</div>
          </Card>
        ))}
      </div>

      <Card style={{ padding:18 }}>
        <div style={{ fontSize:16, fontWeight:700, color:DS.t1, marginBottom:14 }}>Request payout</div>
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:11, color:DS.t3, marginBottom:6, textTransform:'uppercase' }}>Amount (€)</div>
          <div style={{ display:'flex', gap:6, marginBottom:8 }}>
            {[25,50,100].map(a=>(
              <button key={a} onClick={()=>setAmount(Math.min(a,balance).toString())}
                style={{ flex:1, padding:'8px 0', borderRadius:8, border:'1px solid '+(parseFloat(amount)===a?DS.accent:DS.border), background:parseFloat(amount)===a?DS.accentDim:'transparent', color:parseFloat(amount)===a?DS.accent:DS.t2, cursor:'pointer', fontSize:13, fontWeight:parseFloat(amount)===a?700:400 }}>
                €{a}
              </button>
            ))}
            <button onClick={()=>setAmount(balance.toFixed(2))}
              style={{ flex:1, padding:'8px 0', borderRadius:8, border:'1px solid '+DS.border, background:'transparent', color:DS.t2, cursor:'pointer', fontSize:12 }}>
              All
            </button>
          </div>
          <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="Or enter amount..."
            style={{ width:'100%', padding:'11px 14px', border:'1px solid '+DS.border, borderRadius:DS.r1, fontSize:16, fontFamily:DS.f, boxSizing:'border-box' }} />
        </div>

        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:11, color:DS.t3, marginBottom:6, textTransform:'uppercase' }}>Payment method</div>
          {[['bank','🏦','Bank transfer','Next working day'],['paypal','💙','PayPal','Within 2 hours'],['cash','💵','Cash from ops','Next shift']].map(([id,icon,label,time])=>(
            <button key={id} onClick={()=>setMethod(id)}
              style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'11px 14px', marginBottom:6, background:method===id?DS.accentDim:'transparent', border:'1px solid '+(method===id?DS.accent:DS.border), borderRadius:DS.r1, cursor:'pointer', textAlign:'left' }}>
              <span style={{ fontSize:20 }}>{icon}</span>
              <div>
                <div style={{ fontSize:14, fontWeight:600, color:method===id?DS.accent:DS.t1 }}>{label}</div>
                <div style={{ fontSize:11, color:DS.t3 }}>{time}</div>
              </div>
            </button>
          ))}
        </div>

        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:11, color:DS.t3, marginBottom:6, textTransform:'uppercase' }}>
            {method==='bank'?'Bank details (IBAN)':method==='paypal'?'PayPal email':'Notes'}
          </div>
          <input value={details} onChange={e=>setDetails(e.target.value)}
            placeholder={method==='bank'?'ES76 2100 0418 4502 0005 1332':method==='paypal'?'email@paypal.com':'Any notes...'}
            style={{ width:'100%', padding:'11px 14px', border:'1px solid '+DS.border, borderRadius:DS.r1, fontSize:13, fontFamily:DS.f, boxSizing:'border-box' }} />
        </div>

        <Btn onClick={request} disabled={submitting||!amount||parseFloat(amount)<10||parseFloat(amount)>balance||!details}
          style={{ width:'100%', justifyContent:'center' }}>
          {submitting?'Submitting...':'Request €'+(parseFloat(amount)||0).toFixed(2)+' payout'}
        </Btn>
      </Card>

      {history.length > 0 && (
        <Card style={{ padding:0 }}>
          <div style={{ padding:'14px 16px', borderBottom:'1px solid '+DS.border, fontSize:14, fontWeight:700 }}>Payout history</div>
          {history.map(p=>(
            <div key={p.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px', borderBottom:'0.5px solid '+DS.border }}>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:DS.t1 }}>€{p.amount?.toFixed(2)} via {p.method}</div>
                <div style={{ fontSize:11, color:DS.t3 }}>{new Date(p.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</div>
              </div>
              <span style={{ fontSize:12, fontWeight:700, color:statusColor(p.status) }}>{statusLabel(p.status)}</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 18. AVAILABILITY SCHEDULING
// ═══════════════════════════════════════════════════════════════
export function ScheduleAvailabilityTab({ profile }) {
  const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
  const [schedule, setSchedule] = useState(() => {
    const s = {}
    DAYS.forEach(d=>{ s[d]={ available:false, from:'18:00', to:'03:00' } })
    return s
  })
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.id) { setLoading(false); return }
    supabase.from('driver_availability').select('*').eq('driver_id', profile.id).single()
      .then(({ data }) => {
        if (data?.schedule) setSchedule(data.schedule)
        setLoading(false)
      }).catch(()=>setLoading(false))
  }, [profile?.id])

  const save = async () => {
    setSaving(true)
    await supabase.from('driver_availability').upsert({ driver_id:profile?.id, schedule }, { onConflict:'driver_id' })
    toast.success('Availability saved! Ops can now plan rosters.')
    setSaving(false)
  }

  const toggle = (day) => setSchedule(s=>({...s,[day]:{...s[day],available:!s[day].available}}))
  const setTime = (day, field, val) => setSchedule(s=>({...s,[day]:{...s[day],[field]:val}}))

  const activeDays = DAYS.filter(d=>schedule[d]?.available).length

  return (
    <div style={{ padding:16 }}>
      <div style={{ fontFamily:DS.fh, fontSize:22, marginBottom:6 }}>My availability</div>
      <div style={{ fontSize:13, color:DS.t3, marginBottom:16 }}>Let ops know when you're planning to work · {activeDays} days set</div>

      {loading ? <div style={{textAlign:'center',padding:40,color:DS.t3}}>Loading...</div> : (
        <>
          {DAYS.map(day => (
            <Card key={day} style={{ padding:'14px 16px', marginBottom:8 }}>
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:40, fontWeight:700, color:DS.t1, fontSize:14 }}>{day}</div>
                <button onClick={()=>toggle(day)}
                  style={{ width:48, height:26, borderRadius:13, background:schedule[day]?.available?DS.green:DS.border, border:'none', cursor:'pointer', position:'relative', transition:'background 0.2s', flexShrink:0 }}>
                  <div style={{ width:22, height:22, borderRadius:'50%', background:'white', position:'absolute', top:2, left:schedule[day]?.available?24:2, transition:'left 0.2s' }}/>
                </button>
                {schedule[day]?.available && (
                  <div style={{ display:'flex', gap:8, alignItems:'center', flex:1 }}>
                    <input type="time" value={schedule[day]?.from||'18:00'} onChange={e=>setTime(day,'from',e.target.value)}
                      style={{ padding:'6px 10px', border:'1px solid '+DS.border, borderRadius:8, fontSize:13, flex:1, fontFamily:DS.f }} />
                    <span style={{ color:DS.t3, fontSize:12 }}>to</span>
                    <input type="time" value={schedule[day]?.to||'03:00'} onChange={e=>setTime(day,'to',e.target.value)}
                      style={{ padding:'6px 10px', border:'1px solid '+DS.border, borderRadius:8, fontSize:13, flex:1, fontFamily:DS.f }} />
                  </div>
                )}
                {!schedule[day]?.available && <span style={{ fontSize:12, color:DS.t3 }}>Not working</span>}
              </div>
            </Card>
          ))}
          <Btn onClick={save} disabled={saving} style={{ width:'100%', justifyContent:'center', marginTop:8 }}>
            {saving?'Saving...':'Save availability'}
          </Btn>
        </>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 19. DRIVER ONBOARDING FLOW
// ═══════════════════════════════════════════════════════════════
export function DriverOnboarding({ onComplete }) {
  const { profile } = useAuthStore()
  const [step, setStep] = useState(0)
  const [quiz, setQuiz] = useState({})
  const [agreed, setAgreed] = useState(false)
  const [completing, setCompleting] = useState(false)

  const STEPS = [
    {
      title:'Welcome to Isla Drop 🛵',
      subtitle:'Complete onboarding before your first delivery',
      content: (
        <div style={{ textAlign:'center', padding:'24px 0' }}>
          <div style={{ fontSize:72, marginBottom:16 }}>🌴</div>
          <div style={{ fontSize:16, color:'#5A5A5A', lineHeight:1.7, marginBottom:24 }}>
            You're joining Ibiza's premium 24/7 delivery team. This onboarding takes about 5 minutes and covers everything you need to deliver safely and professionally.
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {[['🗺️','Navigation & routes'],['📦','Handling orders'],['🪪','Age verification'],['⭐','Earning 5 stars']].map(([icon,label])=>(
              <div key={label} style={{ padding:'14px', background:'#F5F4F2', borderRadius:12, textAlign:'center' }}>
                <div style={{ fontSize:28, marginBottom:6 }}>{icon}</div>
                <div style={{ fontSize:12, color:'#5A5A5A' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      title:'Handling alcohol & age verification',
      subtitle:'Legal requirements — read carefully',
      content: (
        <div>
          <div style={{ background:'rgba(196,104,58,0.1)', border:'1px solid rgba(196,104,58,0.3)', borderRadius:12, padding:16, marginBottom:16 }}>
            <div style={{ fontSize:14, fontWeight:700, color:'#C4683A', marginBottom:8 }}>⚖️ Spanish Law — Ley 7/2006</div>
            <div style={{ fontSize:13, color:'#5A5A5A', lineHeight:1.6 }}>You must verify the customer's age before handing over any alcohol or tobacco. Ask for their ID — passport, national ID or driver's licence. If they cannot show ID, do NOT hand over the items.</div>
          </div>
          {[['Always check ID for alcohol and tobacco','✓'],['Customer must be 18+ to receive age-restricted items','✓'],["If customer seems drunk or doesn't have ID, call ops","✓"],['You are legally liable if you deliver to a minor','⚠️']].map(([text,icon])=>(
            <div key={text} style={{ display:'flex', gap:10, padding:'10px 0', borderBottom:'0.5px solid #f0ebe2' }}>
              <span style={{ fontSize:16 }}>{icon}</span>
              <span style={{ fontSize:13, color:'#2A2318' }}>{text}</span>
            </div>
          ))}
        </div>
      )
    },
    {
      title:'Quiz — Age verification',
      subtitle:'Answer correctly to continue',
      content: (
        <div>
          <div style={{ fontSize:15, fontWeight:600, color:'#2A2318', marginBottom:16 }}>A customer orders 2 bottles of wine. When you arrive, they can't find their ID. What do you do?</div>
          {[
            { id:'a', text:'Hand over the wine anyway — they probably are old enough' },
            { id:'b', text:"Keep the wine and call ops — do not deliver without ID" },
            { id:'c', text:'Ask a neighbour to confirm their age' },
            { id:'d', text:'Leave the wine at the door' },
          ].map(opt=>(
            <button key={opt.id} onClick={()=>setQuiz({...quiz, q1:opt.id})}
              style={{ display:'block', width:'100%', padding:'13px 16px', marginBottom:8, textAlign:'left', borderRadius:12, border:'1px solid '+(quiz.q1===opt.id?(opt.id==='b'?'#1D9E75':'#C43A3A'):'rgba(0,0,0,0.1)'), background:quiz.q1===opt.id?(opt.id==='b'?'rgba(29,158,117,0.1)':'rgba(196,58,58,0.1)'):'white', cursor:'pointer', fontSize:13, color:'#2A2318', fontFamily:DS.f }}>
              {quiz.q1===opt.id && (opt.id==='b'?'✅ ':'❌ ')}{opt.text}
            </button>
          ))}
          {quiz.q1 && quiz.q1 !== 'b' && <div style={{ padding:'12px', background:'rgba(196,58,58,0.1)', borderRadius:10, fontSize:12, color:'#C43A3A' }}>Incorrect. Never deliver alcohol without valid ID — call ops and keep the items.</div>}
          {quiz.q1 === 'b' && <div style={{ padding:'12px', background:'rgba(29,158,117,0.1)', borderRadius:10, fontSize:12, color:'#1D9E75' }}>Correct! Always keep age-restricted items and contact ops.</div>}
        </div>
      ),
      canProceed: quiz.q1 === 'b'
    },
    {
      title:'Delivery best practices',
      subtitle:'How to earn 5 stars every time',
      content: (
        <div>
          {[
            ['🔔','Ring the bell or knock — don\'t just leave bags'],
            ['📦','Check order items match before leaving the warehouse'],
            ['📸','Take a photo of delivered items for proof'],
            ['💬','Read delivery notes carefully — customers leave important info'],
            ['🌡️','Keep cold drinks cold — don\'t leave orders in hot sun'],
            ['🛵','Park safely and legally — penalties affect everyone'],
            ['⭐','Be friendly — a smile earns 5-star reviews'],
          ].map(([icon,text])=>(
            <div key={text} style={{ display:'flex', gap:12, padding:'12px 0', borderBottom:'0.5px solid #f0ebe2', alignItems:'flex-start' }}>
              <span style={{ fontSize:22, flexShrink:0 }}>{icon}</span>
              <span style={{ fontSize:14, color:'#2A2318', lineHeight:1.5 }}>{text}</span>
            </div>
          ))}
        </div>
      )
    },
    {
      title:'Terms & conditions',
      subtitle:'Read and accept to start driving',
      content: (
        <div>
          <div style={{ background:'#F5F4F2', borderRadius:12, padding:16, maxHeight:240, overflowY:'auto', marginBottom:16, fontSize:13, color:'#5A5A5A', lineHeight:1.7 }}>
            <strong>Isla Drop Driver Agreement</strong><br/><br/>
            As an Isla Drop delivery partner you agree to:<br/>
            1. Always verify customer age for alcohol and tobacco orders<br/>
            2. Handle customer property with care and professionalism<br/>
            3. Maintain your vehicle in a roadworthy condition<br/>
            4. Carry valid insurance at all times<br/>
            5. Not deliver to visibly intoxicated customers<br/>
            6. Report any incidents immediately to ops<br/>
            7. Maintain a minimum 4.5-star average<br/>
            8. Complete at least 3 deliveries per session when online<br/><br/>
            Earnings are paid weekly or on request. Rates are base fee + distance + tips.
          </div>
          <label style={{ display:'flex', gap:12, alignItems:'flex-start', cursor:'pointer' }}>
            <input type="checkbox" checked={agreed} onChange={e=>setAgreed(e.target.checked)}
              style={{ width:20, height:20, marginTop:2, accentColor:'#C4683A', flexShrink:0 }} />
            <span style={{ fontSize:14, color:'#2A2318' }}>I have read and agree to the Isla Drop Driver Terms and Conditions</span>
          </label>
        </div>
      ),
      canProceed: agreed
    }
  ]

  const current = STEPS[step]
  const canProceed = current.canProceed !== undefined ? current.canProceed : true

  const complete = async () => {
    setCompleting(true)
    await supabase.from('profiles').update({ onboarding_complete:true, onboarding_completed_at:new Date().toISOString() }).eq('id', profile?.id)
    toast.success('Onboarding complete! Welcome to the team 🎉')
    onComplete?.()
    setCompleting(false)
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'white', zIndex:900, overflowY:'auto', fontFamily:DS.f }}>
      {/* Progress */}
      <div style={{ padding:'16px 20px 0', background:'white', position:'sticky', top:0, zIndex:10, borderBottom:'1px solid #f0ebe2' }}>
        <div style={{ display:'flex', gap:4, marginBottom:12 }}>
          {STEPS.map((_,i)=>(
            <div key={i} style={{ flex:1, height:4, borderRadius:99, background:i<=step?'#C4683A':'#f0ebe2', transition:'background 0.3s' }}/>
          ))}
        </div>
        <div style={{ fontFamily:DS.fh, fontSize:22, color:'#2A2318', marginBottom:2 }}>{current.title}</div>
        <div style={{ fontSize:13, color:'#7A6E60', paddingBottom:14 }}>{current.subtitle}</div>
      </div>

      <div style={{ padding:'20px 20px 100px' }}>{current.content}</div>

      <div style={{ position:'fixed', bottom:0, left:0, right:0, padding:'12px 20px 24px', background:'white', borderTop:'1px solid #f0ebe2' }}>
        <div style={{ display:'flex', gap:10 }}>
          {step > 0 && <button onClick={()=>setStep(s=>s-1)} style={{ flex:1, padding:'13px', background:'transparent', border:'1px solid #ddd', borderRadius:12, cursor:'pointer', fontFamily:DS.f, fontSize:14 }}>← Back</button>}
          {step < STEPS.length-1 ? (
            <button onClick={()=>setStep(s=>s+1)} disabled={!canProceed}
              style={{ flex:2, padding:'13px', background:canProceed?'#C4683A':'#ddd', border:'none', borderRadius:12, color:'white', fontSize:14, fontWeight:700, cursor:canProceed?'pointer':'default', fontFamily:DS.f }}>
              Continue →
            </button>
          ) : (
            <button onClick={complete} disabled={!agreed||completing}
              style={{ flex:2, padding:'13px', background:agreed&&!completing?'#1D9E75':'#ddd', border:'none', borderRadius:12, color:'white', fontSize:15, fontWeight:700, cursor:agreed?'pointer':'default', fontFamily:DS.f }}>
              {completing?'Completing...':'🎉 Start driving!'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
