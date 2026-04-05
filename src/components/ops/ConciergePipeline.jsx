import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

const STAGES = [
  { id:'new',       label:'New',           color:'#7A6E60', bg:'rgba(122,110,96,0.15)' },
  { id:'contacted', label:'Partner contacted', color:'#2B7A8B', bg:'rgba(43,122,139,0.15)' },
  { id:'confirmed', label:'Confirmed',      color:'#5A6B3A', bg:'rgba(90,107,58,0.15)' },
  { id:'completed', label:'Completed',      color:'#0D3B4A', bg:'rgba(13,59,74,0.15)' },
  { id:'cancelled', label:'Cancelled',      color:'#C4683A', bg:'rgba(196,104,58,0.15)' },
]

export default function ConciergePipeline() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading]   = useState(true)
  const [view, setView]         = useState('kanban') // kanban | list

  const load = async () => {
    try {
      const { supabase } = await import('../../lib/supabase')
      const { data } = await supabase
        .from('concierge_bookings')
        .select('*')
        .not('status', 'eq', 'cancelled')
        .order('booking_date', { ascending: true })
      if (data) setBookings(data)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const moveStage = async (id, stage) => {
    try {
      const { supabase } = await import('../../lib/supabase')
      const updates = { pipeline_stage: stage }
      if (stage === 'contacted') updates.partner_contacted_at = new Date().toISOString()
      if (stage === 'confirmed') updates.partner_confirmed_at = new Date().toISOString()
      await supabase.from('concierge_bookings').update(updates).eq('id', id)
      setBookings(prev => prev.map(b => b.id === id ? { ...b, pipeline_stage: stage, ...updates } : b))
      toast.success('Moved to ' + STAGES.find(s => s.id === stage)?.label)
    } catch { toast.error('Update failed') }
  }

  const BookingCard = ({ b }) => {
    const stage = STAGES.find(s => s.id === (b.pipeline_stage || 'new')) || STAGES[0]
    return (
      <div style={{ background:'white', borderRadius:12, padding:12, marginBottom:8, border:'0.5px solid rgba(42,35,24,0.08)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
          <div style={{ fontSize:12, fontWeight:600, color:'#0D3B4A', fontFamily:'monospace' }}>{b.booking_ref}</div>
          <div style={{ fontSize:11, color:'#C4683A', fontWeight:500 }}>€{b.total_price?.toLocaleString()}</div>
        </div>
        <div style={{ fontSize:13, fontWeight:500, color:'#2A2318', marginBottom:2 }}>{b.service_name}</div>
        <div style={{ fontSize:12, color:'#7A6E60', marginBottom:6 }}>
          {b.customer_name} · {b.guests} guests · {new Date(b.booking_date).toLocaleDateString('en-GB', { day:'numeric', month:'short' })}
        </div>
        <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
          {STAGES.filter(s => s.id !== 'cancelled').map(s => (
            <button key={s.id} onClick={() => moveStage(b.id, s.id)}
              style={{ padding:'3px 8px', borderRadius:20, fontSize:10, border:'none', cursor:'pointer', fontFamily:'DM Sans,sans-serif', fontWeight: (b.pipeline_stage||'new')===s.id?600:400, background: (b.pipeline_stage||'new')===s.id?s.bg:'rgba(0,0,0,0.04)', color: (b.pipeline_stage||'new')===s.id?s.color:'#7A6E60' }}>
              {s.label}
            </button>
          ))}
        </div>
      </div>
    )
  }

  const byStage = (stageId) => bookings.filter(b => (b.pipeline_stage || 'new') === stageId)

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div>
          <div style={{ fontFamily:'DM Serif Display,serif', fontSize:22, color:'#0D3B4A' }}>Concierge Pipeline</div>
          <div style={{ fontSize:13, color:'#7A6E60' }}>{bookings.length} active bookings</div>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {[['kanban','Kanban'],['list','List']].map(([v,l]) => (
            <button key={v} onClick={() => setView(v)}
              style={{ padding:'7px 12px', borderRadius:20, fontSize:12, background: view===v?'#0D3B4A':'rgba(0,0,0,0.05)', color: view===v?'white':'#7A6E60', border:'none', cursor:'pointer' }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {loading ? <div style={{ textAlign:'center', padding:40, color:'#7A6E60' }}>Loading...</div> :
        view === 'kanban' ? (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10 }}>
            {STAGES.filter(s => s.id !== 'cancelled').map(stage => (
              <div key={stage.id} style={{ background:stage.bg, borderRadius:12, padding:12, border:'0.5px solid ' + stage.color + '30' }}>
                <div style={{ fontSize:12, fontWeight:600, color:stage.color, marginBottom:10, textTransform:'uppercase', letterSpacing:'0.5px' }}>
                  {stage.label} ({byStage(stage.id).length})
                </div>
                {byStage(stage.id).length === 0
                  ? <div style={{ fontSize:11, color:'#7A6E60', textAlign:'center', padding:'10px 0' }}>Empty</div>
                  : byStage(stage.id).map(b => <BookingCard key={b.id} b={b} />)
                }
              </div>
            ))}
          </div>
        ) : (
          bookings.map(b => <BookingCard key={b.id} b={b} />)
        )
      }
    </div>
  )
}
