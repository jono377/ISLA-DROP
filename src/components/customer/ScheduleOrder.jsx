import { useState } from 'react'

export default function ScheduleOrder({ onSchedule, onCancel, currentTotal }) {
  const [date, setDate]   = useState('')
  const [time, setTime]   = useState('')
  const [error, setError] = useState('')

  const now = new Date()
  const minDate = now.toISOString().slice(0, 10)
  const maxDate = new Date(now.getTime() + 7 * 86400000).toISOString().slice(0, 10)

  const confirm = () => {
    if (!date || !time) { setError('Please select a date and time'); return }
    const scheduled = new Date(date + 'T' + time)
    const minTime = new Date(now.getTime() + 30 * 60000) // min 30 mins from now
    if (scheduled < minTime) { setError('Scheduled time must be at least 30 minutes from now'); return }
    onSchedule(scheduled.toISOString())
  }

  const QUICK_TIMES = [
    { label:'Tonight 8pm',    fn: () => { const d = new Date(); d.setHours(20,0,0); setDate(d.toISOString().slice(0,10)); setTime('20:00') } },
    { label:'Tonight 10pm',   fn: () => { const d = new Date(); d.setHours(22,0,0); setDate(d.toISOString().slice(0,10)); setTime('22:00') } },
    { label:'Tomorrow noon',  fn: () => { const d = new Date(now.getTime()+86400000); setDate(d.toISOString().slice(0,10)); setTime('12:00') } },
    { label:'Tomorrow 6pm',   fn: () => { const d = new Date(now.getTime()+86400000); setDate(d.toISOString().slice(0,10)); setTime('18:00') } },
  ]

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:300, display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
      <div style={{ background:'linear-gradient(170deg,#0D3545,#1A5060)', borderRadius:'20px 20px 0 0', padding:24, width:'100%', maxWidth:480 }}>
        <div style={{ width:36, height:4, background:'rgba(255,255,255,0.2)', borderRadius:2, margin:'0 auto 20px' }} />
        <div style={{ fontFamily:'DM Serif Display,serif', fontSize:22, color:'white', marginBottom:6 }}>Schedule Your Order</div>
        <div style={{ fontSize:13, color:'rgba(255,255,255,0.5)', marginBottom:20 }}>Order in advance — we will deliver at your chosen time</div>

        <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
          {QUICK_TIMES.map(qt => (
            <button key={qt.label} onClick={qt.fn}
              style={{ padding:'8px 14px', background:'rgba(255,255,255,0.1)', border:'0.5px solid rgba(255,255,255,0.2)', borderRadius:20, fontSize:12, color:'rgba(255,255,255,0.8)', cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
              {qt.label}
            </button>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
          <div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', marginBottom:6 }}>Date</div>
            <input type="date" value={date} onChange={e => { setDate(e.target.value); setError('') }}
              min={minDate} max={maxDate}
              style={{ width:'100%', padding:'11px 12px', background:'rgba(255,255,255,0.1)', border:'0.5px solid rgba(255,255,255,0.2)', borderRadius:10, fontFamily:'DM Sans,sans-serif', fontSize:14, color:'white', outline:'none', boxSizing:'border-box' }} />
          </div>
          <div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', marginBottom:6 }}>Time</div>
            <input type="time" value={time} onChange={e => { setTime(e.target.value); setError('') }}
              style={{ width:'100%', padding:'11px 12px', background:'rgba(255,255,255,0.1)', border:'0.5px solid rgba(255,255,255,0.2)', borderRadius:10, fontFamily:'DM Sans,sans-serif', fontSize:14, color:'white', outline:'none', boxSizing:'border-box' }} />
          </div>
        </div>

        {error && <div style={{ fontSize:12, color:'#E8A070', marginBottom:12 }}>{error}</div>}

        <div style={{ background:'rgba(255,255,255,0.06)', borderRadius:10, padding:'10px 14px', marginBottom:16, fontSize:12, color:'rgba(255,255,255,0.55)', lineHeight:1.5 }}>
          Your order will be prepared and dispatched to arrive at your scheduled time. A driver will be assigned 45 minutes before delivery.
        </div>

        <button onClick={confirm}
          style={{ width:'100%', padding:'14px', background:'#C4683A', color:'white', border:'none', borderRadius:12, fontFamily:'DM Sans,sans-serif', fontSize:15, fontWeight:500, cursor:'pointer', marginBottom:10 }}>
          Schedule Order — €{currentTotal?.toFixed(2) || '0.00'}
        </button>
        <button onClick={onCancel}
          style={{ width:'100%', padding:'12px', background:'none', border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:12, color:'rgba(255,255,255,0.5)', fontSize:13, cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
          Cancel
        </button>
      </div>
    </div>
  )
}
