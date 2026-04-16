import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

const C = {
  bg:'#F5F0E8', card:'#FFFFFF', accent:'#C4683A', accentL:'rgba(196,104,58,0.1)',
  green:'#1D9E75', greenL:'rgba(29,158,117,0.1)', blue:'#2B7A8B', blueL:'rgba(43,122,139,0.1)',
  red:'#C43A3A', redL:'rgba(196,58,58,0.1)', yellow:'#B8860B', yellowL:'rgba(184,134,11,0.1)',
  gold:'#C4A435', goldL:'rgba(196,164,53,0.1)',
  text:'#2A2318', muted:'#7A6E60', border:'rgba(42,35,24,0.12)',
}
const F = { serif:'DM Serif Display,serif', sans:'DM Sans,sans-serif' }

function Card({ children, style={} }) {
  return <div style={{ background:C.card, borderRadius:12, border:'0.5px solid '+C.border, ...style }}>{children}</div>
}
function Btn({ children, onClick, color=C.accent, outline, disabled, style={} }) {
  return <button onClick={onClick} disabled={disabled}
    style={{ padding:'9px 18px', background:outline?'transparent':disabled?C.border:color, border:outline?'1px solid '+color:'none', borderRadius:8, color:outline?color:'white', fontSize:13, fontWeight:600, cursor:disabled?'default':'pointer', opacity:disabled?0.5:1, fontFamily:F.sans, ...style }}>
    {children}
  </button>
}
function Badge({ label, color=C.accent }) {
  return <span style={{ padding:'3px 10px', borderRadius:99, background:color+'18', color, fontSize:11, fontWeight:700 }}>{label}</span>
}

// ═══════════════════════════════════════════════════════════════
// 20. COMMISSION DASHBOARD — monthly view
// ═══════════════════════════════════════════════════════════════
export function CommissionDashboard() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('month')
  const [view, setView] = useState('summary')

  const load = useCallback(async () => {
    setLoading(true)
    const now = new Date()
    const fromDate = period === 'month'
      ? new Date(now.getFullYear(), now.getMonth(), 1)
      : period === 'quarter'
        ? new Date(now.getFullYear(), Math.floor(now.getMonth()/3)*3, 1)
        : new Date(now.getFullYear(), 0, 1)

    const { data } = await supabase.from('concierge_bookings')
      .select('*')
      .gte('created_at', fromDate.toISOString())
      .in('status', ['confirmed','completed'])
      .order('created_at', { ascending:false })

    setBookings(data||[])
    setLoading(false)
  }, [period])

  useEffect(() => { load() }, [load])

  const totalRevenue = bookings.reduce((s,b)=>s+(b.total_price||0),0)
  const totalCommission = bookings.reduce((s,b)=>s+(b.commission_amount||0),0)
  const byPartner = {}
  bookings.forEach(b => {
    if (!byPartner[b.partner]) byPartner[b.partner] = { name:b.partner, bookings:0, revenue:0, commission:0 }
    byPartner[b.partner].bookings++
    byPartner[b.partner].revenue += b.total_price||0
    byPartner[b.partner].commission += b.commission_amount||0
  })
  const partners = Object.values(byPartner).sort((a,b)=>b.commission-a.commission)

  const byCategory = {}
  bookings.forEach(b => {
    const cat = b.service_name?.split(' ')[0]||'Other'
    if (!byCategory[cat]) byCategory[cat] = { label:cat, bookings:0, commission:0 }
    byCategory[cat].bookings++
    byCategory[cat].commission += b.commission_amount||0
  })

  const exportCSV = () => {
    const rows = [['Date','Service','Partner','Guests','Total','Commission','Status'].join(',')]
    bookings.forEach(b => {
      rows.push([
        new Date(b.created_at).toLocaleDateString('en-GB'),
        (b.service_name||'').replace(/,/g,' '), (b.partner||'').replace(/,/g,' '),
        b.guests, b.total_price, b.commission_amount, b.status
      ].join(','))
    })
    const blob = new Blob([rows.join('\n')], { type:'text/csv' })
    const a = document.createElement('a'); a.href=URL.createObjectURL(blob)
    a.download='commission_'+period+'_'+new Date().toISOString().slice(0,10)+'.csv'; a.click()
  }

  const PERIOD_LABEL = { month:'This month', quarter:'This quarter', year:'This year' }

  return (
    <div style={{ padding:20 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h2 style={{ fontFamily:F.serif, fontSize:26, margin:0 }}>Commission Dashboard</h2>
          <div style={{ fontSize:13, color:C.muted }}>{PERIOD_LABEL[period]} · {bookings.length} bookings</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {['month','quarter','year'].map(p=>(
            <Btn key={p} onClick={()=>setPeriod(p)} outline={period!==p} color={C.accent} style={{fontSize:12,padding:'6px 14px',textTransform:'capitalize'}}>{p}</Btn>
          ))}
          <Btn onClick={exportCSV} outline color={C.blue} style={{fontSize:12,padding:'6px 14px'}}>⬇ CSV</Btn>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }}>
        {[
          ['💰','€'+totalRevenue.toLocaleString(),'Total revenue',C.green],
          ['🏷️','€'+totalCommission.toFixed(0),'Commission earned',C.gold],
          ['📋',bookings.length,'Confirmed bookings',C.blue],
          ['📊',(totalRevenue>0?(totalCommission/totalRevenue*100).toFixed(1):0)+'%','Avg margin',C.accent],
        ].map(([icon,val,label,color])=>(
          <Card key={label} style={{padding:'14px 18px'}}>
            <div style={{display:'flex',justifyContent:'space-between'}}>
              <div><div style={{fontSize:24,fontWeight:700,color}}>{val}</div><div style={{fontSize:12,color:C.muted,marginTop:4}}>{label}</div></div>
              <span style={{fontSize:24}}>{icon}</span>
            </div>
          </Card>
        ))}
      </div>

      <div style={{ display:'flex', gap:6, marginBottom:20 }}>
        {[['summary','Summary'],['partners','By partner'],['bookings','Bookings']].map(([k,l])=>(
          <Btn key={k} onClick={()=>setView(k)} outline={view!==k} color={C.accent} style={{fontSize:12,padding:'7px 16px'}}>{l}</Btn>
        ))}
      </div>

      {loading ? <div style={{textAlign:'center',padding:32,color:C.muted}}>Loading...</div>
      : view==='summary' ? (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <Card style={{ padding:20 }}>
            <div style={{ fontFamily:F.serif, fontSize:18, marginBottom:16 }}>By partner</div>
            {partners.slice(0,6).map(p=>(
              <div key={p.name} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'0.5px solid '+C.border }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:C.text }}>{p.name}</div>
                  <div style={{ fontSize:11, color:C.muted }}>{p.bookings} bookings · €{p.revenue.toLocaleString()} revenue</div>
                </div>
                <div style={{ fontSize:16, fontWeight:700, color:C.gold }}>€{p.commission.toFixed(0)}</div>
              </div>
            ))}
          </Card>
          <Card style={{ padding:20 }}>
            <div style={{ fontFamily:F.serif, fontSize:18, marginBottom:16 }}>Monthly trend</div>
            {bookings.length === 0 ? (
              <div style={{ textAlign:'center', padding:'32px 0', color:C.muted }}>No data yet</div>
            ) : (
              <div style={{ fontSize:13, color:C.muted, lineHeight:2 }}>
                {Object.values(byCategory).map(cat=>(
                  <div key={cat.label} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'0.5px solid '+C.border }}>
                    <span style={{ color:C.text }}>{cat.label}</span>
                    <span style={{ fontWeight:700, color:C.gold }}>€{cat.commission.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      ) : view==='partners' ? (
        <Card>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ background:C.bg }}>
                {['Partner','Bookings','Total revenue','Commission','Avg booking'].map(h=>(
                  <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontWeight:700, color:C.muted, fontSize:11, textTransform:'uppercase', borderBottom:'1px solid '+C.border }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {partners.map((p,i)=>(
                <tr key={p.name} style={{ borderBottom:'0.5px solid '+C.border, background:i%2===0?'white':C.bg }}>
                  <td style={{ padding:'10px 14px', fontWeight:600 }}>{p.name}</td>
                  <td style={{ padding:'10px 14px', textAlign:'center' }}>{p.bookings}</td>
                  <td style={{ padding:'10px 14px', fontWeight:700, color:C.green }}>€{p.revenue.toLocaleString()}</td>
                  <td style={{ padding:'10px 14px', fontWeight:700, color:C.gold }}>€{p.commission.toFixed(0)}</td>
                  <td style={{ padding:'10px 14px', color:C.muted }}>€{p.bookings>0?(p.revenue/p.bookings).toFixed(0):0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <Card>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead>
              <tr style={{ background:C.bg }}>
                {['Ref','Service','Partner','Date','Guests','Total','Commission'].map(h=>(
                  <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontWeight:700, color:C.muted, fontSize:11, textTransform:'uppercase', borderBottom:'1px solid '+C.border }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bookings.map((b,i)=>(
                <tr key={b.id} style={{ borderBottom:'0.5px solid '+C.border, background:i%2===0?'white':C.bg }}>
                  <td style={{ padding:'10px 14px', fontFamily:'monospace', fontSize:11 }}>{b.booking_ref}</td>
                  <td style={{ padding:'10px 14px', fontWeight:600 }}>{b.service_name}</td>
                  <td style={{ padding:'10px 14px', color:C.muted }}>{b.partner}</td>
                  <td style={{ padding:'10px 14px', color:C.muted }}>{new Date(b.booking_date||b.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</td>
                  <td style={{ padding:'10px 14px', textAlign:'center' }}>{b.guests}</td>
                  <td style={{ padding:'10px 14px', fontWeight:700, color:C.green }}>€{b.total_price?.toLocaleString()}</td>
                  <td style={{ padding:'10px 14px', fontWeight:700, color:C.gold }}>€{b.commission_amount?.toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 18. BOOKING CONFIRMATION EMAIL SENDER — from ops
// ═══════════════════════════════════════════════════════════════
export function BookingConfirmationSender() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(null)
  const [sent, setSent] = useState([])

  useEffect(() => {
    supabase.from('concierge_bookings')
      .select('*').eq('status','confirmed')
      .order('created_at',{ascending:false}).limit(30)
      .then(({ data }) => { setBookings(data||[]); setLoading(false) })
  }, [])

  const sendConfirmation = async (booking) => {
    setSending(booking.id)
    // In production: call Supabase Edge Function to send email
    const emailBody = buildEmailHTML(booking)
    try {
      const { error } = await supabase.functions.invoke('send-booking-confirmation', {
        body: { booking, emailBody }
      })
      if (!error) {
        await supabase.from('concierge_bookings').update({ confirmation_sent_at: new Date().toISOString() }).eq('id', booking.id)
        setSent(prev=>[...prev, booking.id])
        toast.success('Confirmation sent to '+booking.customer_email)
      } else {
        // Log what would be sent
        console.log('Email preview:', emailBody)
        setSent(prev=>[...prev, booking.id])
        toast.success('Confirmation queued (deploy send-booking-confirmation edge function to deliver)')
      }
    } catch {
      setSent(prev=>[...prev, booking.id])
      toast('Edge function not deployed — email content logged to console')
    }
    setSending(null)
  }

  const buildEmailHTML = (b) => {
    return '<h1>Booking Confirmed — Isla Drop Concierge</h1>' +
      '<p>Dear '+b.customer_name+',</p>' +
      '<p>Your booking is confirmed.</p>' +
      '<h2>Booking Details</h2>' +
      '<table><tr><td>Service:</td><td><strong>'+b.service_name+'</strong></td></tr>' +
      '<tr><td>Date:</td><td>'+new Date(b.booking_date).toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'})+'</td></tr>' +
      '<tr><td>Guests:</td><td>'+b.guests+'</td></tr>' +
      '<tr><td>Location:</td><td>'+b.partner+'</td></tr>' +
      '<tr><td>Total:</td><td>€'+b.total_price?.toLocaleString()+'</td></tr>' +
      '<tr><td>Booking Ref:</td><td><strong>'+b.booking_ref+'</strong></td></tr></table>' +
      '<p>Your concierge team will be in touch within 2 hours to finalise details.</p>' +
      '<p>For any queries: concierge@isladrop.net or WhatsApp +34 971 000 000</p>' +
      '<p>See you in Ibiza! 🌴<br/>The Isla Drop Concierge Team</p>'
  }

  return (
    <div style={{ padding:20 }}>
      <div style={{ marginBottom:20 }}>
        <h2 style={{ fontFamily:F.serif, fontSize:26, margin:0 }}>Booking Confirmations</h2>
        <div style={{ fontSize:13, color:C.muted }}>Send confirmation emails to customers</div>
      </div>

      <div style={{ padding:'10px 16px', background:C.blueL, border:'1px solid '+C.blue+'40', borderRadius:10, fontSize:12, color:C.blue, marginBottom:20 }}>
        💡 Deploy the <code>send-booking-confirmation</code> Supabase Edge Function to enable real email delivery. Until then, emails are previewed in console.
      </div>

      {loading ? <div style={{textAlign:'center',padding:32,color:C.muted}}>Loading...</div>
      : bookings.length===0 ? (
        <Card style={{padding:48,textAlign:'center'}}>
          <div style={{fontSize:40,marginBottom:12}}>✅</div>
          <div style={{fontFamily:F.serif,fontSize:20}}>All confirmations sent</div>
        </Card>
      ) : bookings.map(b => (
        <Card key={b.id} style={{ padding:16, marginBottom:10, opacity:sent.includes(b.id)?0.6:1 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, fontWeight:700, color:C.text }}>{b.service_name}</div>
              <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>
                {b.customer_name} · {b.customer_email} · {b.guests} guests
              </div>
              <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>
                {new Date(b.booking_date).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})} · {b.booking_ref}
              </div>
              {b.confirmation_sent_at && (
                <div style={{ fontSize:11, color:C.green, marginTop:4 }}>
                  ✅ Sent {new Date(b.confirmation_sent_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}
                </div>
              )}
            </div>
            <Btn onClick={()=>sendConfirmation(b)} disabled={sending===b.id||sent.includes(b.id)||!!b.confirmation_sent_at}
              color={sent.includes(b.id)||b.confirmation_sent_at?C.green:C.accent} style={{fontSize:12,padding:'7px 14px'}}>
              {sent.includes(b.id)||b.confirmation_sent_at?'✓ Sent':sending===b.id?'Sending...':'📧 Send'}
            </Btn>
          </div>
        </Card>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 22. PARTNER PORTAL MANAGER — manage partner access
// ═══════════════════════════════════════════════════════════════
export function PartnerPortalManager() {
  const [partners, setPartners] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name:'', email:'', category:'boats', commission_pct:10, contact_phone:'', notes:'' })
  const [saving, setSaving] = useState(false)

  const CATS = ['boats','villas','clubs','restaurants','experiences','transfers','wellness']

  useEffect(() => {
    supabase.from('concierge_partners').select('*, concierge_bookings(id,total_price,commission_amount,status)')
      .order('name')
      .then(({ data }) => { setPartners(data||[]); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    await supabase.from('concierge_partners').insert({
      ...form, active:true, portal_enabled:false,
      portal_token: Math.random().toString(36).slice(2,18)
    })
    setSaving(false)
    setShowAdd(false)
    setForm({ name:'', email:'', category:'boats', commission_pct:10, contact_phone:'', notes:'' })
    const { data } = await supabase.from('concierge_partners').select('*').order('name')
    setPartners(data||[])
  }

  const togglePortal = async (id, enabled) => {
    await supabase.from('concierge_partners').update({ portal_enabled:enabled }).eq('id', id)
    setPartners(prev=>prev.map(p=>p.id===id?{...p,portal_enabled:enabled}:p))
    toast.success(enabled ? 'Partner portal access enabled' : 'Portal access disabled')
  }

  const copyPortalLink = (partner) => {
    const link = 'https://partner.isladrop.net/'+partner.portal_token
    navigator.clipboard.writeText(link)
    toast.success('Partner portal link copied!')
  }

  return (
    <div style={{ padding:20 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h2 style={{ fontFamily:F.serif, fontSize:26, margin:0 }}>Partner Portal Manager</h2>
          <div style={{ fontSize:13, color:C.muted }}>{partners.length} partners · Manage access and bookings</div>
        </div>
        <Btn onClick={()=>setShowAdd(true)}>+ Add partner</Btn>
      </div>

      {showAdd && (
        <Card style={{ padding:20, marginBottom:20 }}>
          <div style={{ fontFamily:F.serif, fontSize:18, marginBottom:16 }}>New partner</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            {[['name','Company name'],['email','Email address'],['contact_phone','Phone'],['notes','Notes']].map(([k,label])=>(
              <div key={k} style={{ marginBottom:0 }}>
                <div style={{ fontSize:11, color:C.muted, marginBottom:5, textTransform:'uppercase' }}>{label}</div>
                <input value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))}
                  style={{ width:'100%', padding:'9px 12px', border:'1px solid '+C.border, borderRadius:8, fontSize:13, fontFamily:F.sans, boxSizing:'border-box' }} />
              </div>
            ))}
            <div>
              <div style={{ fontSize:11, color:C.muted, marginBottom:5, textTransform:'uppercase' }}>Category</div>
              <select value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))}
                style={{ width:'100%', padding:'9px 12px', border:'1px solid '+C.border, borderRadius:8, fontSize:13, fontFamily:F.sans }}>
                {CATS.map(c=><option key={c} value={c} style={{textTransform:'capitalize'}}>{c}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize:11, color:C.muted, marginBottom:5, textTransform:'uppercase' }}>Commission %</div>
              <div style={{ display:'flex', gap:6 }}>
                {[8,10,12,15].map(n=>(
                  <button key={n} onClick={()=>setForm(p=>({...p,commission_pct:n}))}
                    style={{ flex:1, padding:'8px 0', borderRadius:8, border:'1px solid '+(form.commission_pct===n?C.accent:C.border), background:form.commission_pct===n?C.accentL:'transparent', color:form.commission_pct===n?C.accent:C.text, cursor:'pointer', fontSize:13, fontWeight:form.commission_pct===n?700:400 }}>
                    {n}%
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display:'flex', gap:8, marginTop:16 }}>
            <Btn onClick={save} disabled={saving||!form.name||!form.email} color={C.green} style={{flex:1,justifyContent:'center'}}>
              {saving?'Saving...':'Save partner'}
            </Btn>
            <Btn onClick={()=>setShowAdd(false)} outline color={C.muted}>Cancel</Btn>
          </div>
        </Card>
      )}

      {loading ? <div style={{textAlign:'center',padding:32,color:C.muted}}>Loading partners...</div>
      : partners.map(partner => {
        const bookings = partner.concierge_bookings || []
        const revenue = bookings.filter(b=>b.status!=='cancelled').reduce((s,b)=>s+(b.total_price||0),0)
        const commission = bookings.filter(b=>b.status!=='cancelled').reduce((s,b)=>s+(b.commission_amount||0),0)
        return (
          <Card key={partner.id} style={{ padding:18, marginBottom:12 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
              <div>
                <div style={{ fontSize:16, fontWeight:700, color:C.text }}>{partner.name}</div>
                <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>{partner.email} · {partner.contact_phone}</div>
                <div style={{ display:'flex', gap:6, marginTop:6 }}>
                  <Badge label={partner.category} color={C.blue} />
                  <Badge label={partner.commission_pct+'% commission'} color={C.gold} />
                  {partner.portal_enabled && <Badge label="Portal enabled" color={C.green} />}
                </div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:20, fontWeight:700, color:C.gold }}>€{commission.toFixed(0)}</div>
                <div style={{ fontSize:11, color:C.muted }}>commission</div>
                <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>{bookings.length} bookings</div>
              </div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={()=>togglePortal(partner.id, !partner.portal_enabled)}
                style={{ flex:1, padding:'8px', background:partner.portal_enabled?C.greenL:C.accentL, border:'0.5px solid '+(partner.portal_enabled?C.green:C.accent)+'40', borderRadius:8, color:partner.portal_enabled?C.green:C.accent, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:F.sans }}>
                {partner.portal_enabled ? '🔓 Portal on' : '🔒 Enable portal'}
              </button>
              {partner.portal_enabled && (
                <Btn onClick={()=>copyPortalLink(partner)} outline color={C.blue} style={{fontSize:12,padding:'8px 14px'}}>📋 Copy link</Btn>
              )}
            </div>
          </Card>
        )
      })}

      <Card style={{ padding:16, marginTop:20, background:C.blueL, border:'1px solid '+C.blue+'30' }}>
        <div style={{ fontSize:13, fontWeight:700, color:C.blue, marginBottom:6 }}>🌐 Partner portal</div>
        <div style={{ fontSize:12, color:C.muted, lineHeight:1.6 }}>
          When enabled, partners receive a unique link to <strong>partner.isladrop.net</strong> where they can view their upcoming bookings, confirm or reject requests, and update their availability — without contacting Isla Drop ops.
        </div>
      </Card>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// CONCIERGE OVERVIEW — quick stats tab in Concierge group
// ═══════════════════════════════════════════════════════════════
export function ConciergeOverview({ onNavigate }) {
  const [stats, setStats] = useState({ pending:0, confirmed:0, completed:0, monthRevenue:0, monthCommission:0, unread:0 })
  const [recent, setRecent] = useState([])

  useEffect(() => {
    const load = async () => {
      const [bookRes, msgRes] = await Promise.all([
        supabase.from('concierge_bookings').select('status, total_price, commission_amount, created_at'),
        supabase.from('concierge_messages').select('id').eq('from_ops', false).eq('read', false)
      ])
      const all = bookRes.data||[]
      const now = new Date()
      const thisMonth = all.filter(b=>new Date(b.created_at).getMonth()===now.getMonth())
      setStats({
        pending: all.filter(b=>b.status==='pending').length,
        confirmed: all.filter(b=>b.status==='confirmed').length,
        completed: all.filter(b=>b.status==='completed').length,
        monthRevenue: thisMonth.filter(b=>b.status!=='cancelled').reduce((s,b)=>s+(b.total_price||0),0),
        monthCommission: thisMonth.filter(b=>b.status!=='cancelled').reduce((s,b)=>s+(b.commission_amount||0),0),
        unread: (msgRes.data||[]).length,
      })
    }
    load()
    const { data } = supabase.from('concierge_bookings').select('*').order('created_at',{ascending:false}).limit(5)
      .then(r=>setRecent(r.data||[]))
  }, [])

  const SHORTCUTS = [
    { icon:'📋', label:'Bookings', tab:'concierge', badge:stats.pending },
    { icon:'📊', label:'Pipeline', tab:'pipeline' },
    { icon:'💰', label:'Commission', tab:'commission' },
    { icon:'🤝', label:'Partners', tab:'partners' },
    { icon:'📧', label:'Confirmations', tab:'confirmations' },
    { icon:'📩', label:'Messages', tab:'messages', badge:stats.unread },
  ]

  return (
    <div style={{ padding:20 }}>
      <div style={{ fontFamily:F.serif, fontSize:26, margin:'0 0 20px' }}>Concierge Overview</div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:24 }}>
        {[
          ['⏳',stats.pending,'Pending',C.yellow],
          ['✅',stats.confirmed,'Confirmed',C.green],
          ['💰','€'+stats.monthCommission.toFixed(0),'Month commission',C.gold],
        ].map(([icon,val,label,color])=>(
          <Card key={label} style={{padding:'14px 16px'}}>
            <div style={{display:'flex',justifyContent:'space-between'}}>
              <div><div style={{fontSize:22,fontWeight:700,color}}>{val}</div><div style={{fontSize:11,color:C.muted,marginTop:4}}>{label}</div></div>
              <span style={{fontSize:22}}>{icon}</span>
            </div>
          </Card>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:24 }}>
        {SHORTCUTS.map(s=>(
          <button key={s.tab} onClick={()=>onNavigate?.(s.tab)}
            style={{ padding:'14px 10px', background:'white', border:'0.5px solid '+C.border, borderRadius:12, cursor:'pointer', textAlign:'center', position:'relative' }}>
            <div style={{ fontSize:24, marginBottom:4 }}>{s.icon}</div>
            <div style={{ fontSize:12, fontWeight:600, color:C.text }}>{s.label}</div>
            {s.badge > 0 && (
              <div style={{ position:'absolute', top:8, right:8, width:18, height:18, background:C.red, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'white', fontWeight:700 }}>{s.badge}</div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
