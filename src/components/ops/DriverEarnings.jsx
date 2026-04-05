import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

export default function DriverEarnings() {
  const [earnings, setEarnings] = useState([])
  const [drivers, setDrivers]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState('all')
  const [paying, setPaying]     = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const { supabase } = await import('../../lib/supabase')
        const [{ data: e }, { data: d }] = await Promise.all([
          supabase.from('driver_earnings').select('*, driver:profiles(full_name, email)').order('created_at', { ascending: false }).limit(100),
          supabase.from('profiles').select('id, full_name').eq('role', 'driver').eq('status', 'active'),
        ])
        if (e) setEarnings(e)
        if (d) setDrivers(d)
      } catch (err) { console.error(err) }
      setLoading(false)
    }
    load()
  }, [])

  const markPaid = async (driverId) => {
    setPaying(driverId)
    try {
      const { supabase } = await import('../../lib/supabase')
      await supabase.from('driver_earnings')
        .update({ status:'paid', paid_at: new Date().toISOString() })
        .eq('driver_id', driverId).eq('status', 'pending')
      toast.success('Marked as paid!')
      setEarnings(prev => prev.map(e => e.driver_id === driverId ? { ...e, status:'paid' } : e))
    } catch { toast.error('Failed') }
    setPaying(null)
  }

  const filtered = selected === 'all' ? earnings : earnings.filter(e => e.driver_id === selected)

  const driverTotals = drivers.map(d => {
    const dEarnings = earnings.filter(e => e.driver_id === d.id)
    const pending = dEarnings.filter(e => e.status === 'pending').reduce((s, e) => s + (e.total || 0), 0)
    const total = dEarnings.reduce((s, e) => s + (e.total || 0), 0)
    const runs = dEarnings.length
    return { ...d, pending, total, runs }
  }).sort((a, b) => b.pending - a.pending)

  return (
    <div>
      <div style={{ fontFamily:'DM Serif Display,serif', fontSize:22, color:'#0D3B4A', marginBottom:4 }}>Driver Earnings</div>
      <div style={{ fontSize:13, color:'#7A6E60', marginBottom:16 }}>Track and process driver payouts</div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:16 }}>
        {[
          { v:'€' + earnings.filter(e=>e.status==='pending').reduce((s,e)=>s+(e.total||0),0).toFixed(0), l:'Total pending', color:'#C4683A' },
          { v:'€' + earnings.filter(e=>e.status==='paid').reduce((s,e)=>s+(e.total||0),0).toFixed(0), l:'Total paid', color:'#5A6B3A' },
          { v: earnings.length, l:'Total runs', color:'#0D3B4A' },
        ].map(({v,l,color}) => (
          <div key={l} style={{ background:'white', borderRadius:12, padding:'12px 14px', border:'0.5px solid rgba(42,35,24,0.1)' }}>
            <div style={{ fontSize:22, fontWeight:600, color }}>{v}</div>
            <div style={{ fontSize:11, color:'#7A6E60', marginTop:2 }}>{l}</div>
          </div>
        ))}
      </div>

      {driverTotals.filter(d => d.pending > 0).length > 0 && (
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:12, color:'#7A6E60', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:10 }}>Pending Payouts</div>
          {driverTotals.filter(d => d.pending > 0).map(d => (
            <div key={d.id} style={{ background:'white', borderRadius:12, padding:14, marginBottom:8, border:'0.5px solid rgba(245,201,122,0.4)', display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:40, height:40, borderRadius:'50%', background:'linear-gradient(135deg,#C4683A,#E8854A)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, color:'white', fontWeight:500, flexShrink:0 }}>
                {(d.full_name||'?').charAt(0).toUpperCase()}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:500, color:'#2A2318' }}>{d.full_name}</div>
                <div style={{ fontSize:12, color:'#7A6E60' }}>{d.runs} runs · €{d.total.toFixed(2)} total earned</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:18, fontWeight:600, color:'#C4683A' }}>€{d.pending.toFixed(2)}</div>
                <div style={{ fontSize:10, color:'#7A6E60' }}>pending</div>
              </div>
              <button onClick={() => markPaid(d.id)} disabled={paying === d.id}
                style={{ padding:'8px 14px', background:'#5A6B3A', color:'white', border:'none', borderRadius:8, fontSize:12, cursor:'pointer', fontFamily:'DM Sans,sans-serif', fontWeight:500, whiteSpace:'nowrap' }}>
                {paying === d.id ? '...' : 'Mark Paid'}
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' }}>
        <button onClick={() => setSelected('all')}
          style={{ padding:'6px 12px', borderRadius:20, fontSize:12, background: selected==='all'?'#0D3B4A':'rgba(0,0,0,0.05)', color: selected==='all'?'white':'#7A6E60', border:'none', cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
          All drivers
        </button>
        {drivers.map(d => (
          <button key={d.id} onClick={() => setSelected(d.id)}
            style={{ padding:'6px 12px', borderRadius:20, fontSize:12, background: selected===d.id?'#0D3B4A':'rgba(0,0,0,0.05)', color: selected===d.id?'white':'#7A6E60', border:'none', cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
            {d.full_name?.split(' ')[0]}
          </button>
        ))}
      </div>

      {loading ? <div style={{ textAlign:'center', padding:30, color:'#7A6E60' }}>Loading...</div> : (
        filtered.slice(0, 50).map(e => (
          <div key={e.id} style={{ background:'white', borderRadius:10, padding:'10px 14px', marginBottom:6, border:'0.5px solid rgba(42,35,24,0.08)', display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, color:'#2A2318' }}>{e.driver?.full_name || 'Driver'}</div>
              <div style={{ fontSize:11, color:'#7A6E60' }}>{new Date(e.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}</div>
            </div>
            <div style={{ fontSize:13, color:'#2A2318' }}>Base €{(e.base_pay||0).toFixed(2)}{e.tip > 0 ? ' + €' + e.tip.toFixed(2) + ' tip' : ''}</div>
            <div style={{ fontSize:14, fontWeight:600, color: e.status==='paid'?'#5A6B3A':'#C4683A', minWidth:60, textAlign:'right' }}>€{(e.total||0).toFixed(2)}</div>
            <span style={{ fontSize:10, padding:'2px 7px', borderRadius:20, background: e.status==='paid'?'rgba(90,107,58,0.1)':'rgba(196,104,58,0.1)', color: e.status==='paid'?'#5A6B3A':'#C4683A' }}>{e.status}</span>
          </div>
        ))
      )}
    </div>
  )
}
