import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

const CATEGORIES = ['boat','villa','restaurant','beach_club','club','experience','other']
const CAT_EMOJI  = { boat:'⛵', villa:'🏡', restaurant:'🍽️', beach_club:'🏖️', club:'🎉', experience:'🌟', other:'📋' }

export default function PartnerManager() {
  const [partners, setPartners] = useState([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter]     = useState('all')
  const [form, setForm] = useState({ name:'', category:'restaurant', contact_name:'', contact_email:'', contact_phone:'', booking_url:'', commission_rate:10, notes:'' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      const { supabase } = await import('../../lib/supabase')
      const { data } = await supabase.from('partners').select('*').order('category').order('name')
      if (data) setPartners(data)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    if (!form.name.trim()) { toast.error('Partner name required'); return }
    setSaving(true)
    try {
      const { supabase } = await import('../../lib/supabase')
      await supabase.from('partners').insert({ ...form, commission_rate: parseFloat(form.commission_rate)/100, active: true })
      toast.success('Partner added!')
      setShowForm(false)
      setForm({ name:'', category:'restaurant', contact_name:'', contact_email:'', contact_phone:'', booking_url:'', commission_rate:10, notes:'' })
      load()
    } catch { toast.error('Save failed') }
    setSaving(false)
  }

  const toggleActive = async (id, active) => {
    const { supabase } = await import('../../lib/supabase')
    await supabase.from('partners').update({ active: !active }).eq('id', id)
    load()
  }

  const set = f => e => setForm(prev => ({ ...prev, [f]: e.target.value }))
  const inp = { width:'100%', padding:'9px 12px', border:'0.5px solid rgba(42,35,24,0.15)', borderRadius:8, fontFamily:'DM Sans,sans-serif', fontSize:13, outline:'none', background:'white', boxSizing:'border-box', marginBottom:8 }
  const filtered = filter === 'all' ? partners : partners.filter(p => p.category === filter)

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <div>
          <div style={{ fontFamily:'DM Serif Display,serif', fontSize:22, color:'#0D3B4A' }}>Partners</div>
          <div style={{ fontSize:13, color:'#7A6E60' }}>{partners.length} concierge partners</div>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          style={{ padding:'9px 16px', background:'#0D3B4A', color:'white', border:'none', borderRadius:10, fontFamily:'DM Sans,sans-serif', fontSize:13, cursor:'pointer', fontWeight:500 }}>
          + Add Partner
        </button>
      </div>

      {showForm && (
        <div style={{ background:'white', borderRadius:14, padding:16, marginBottom:14, border:'0.5px solid rgba(42,35,24,0.1)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
            <div style={{ fontFamily:'DM Serif Display,serif', fontSize:16, color:'#0D3B4A' }}>New Partner</div>
            <button onClick={() => setShowForm(false)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:18, color:'#7A6E60' }}>✕</button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <div style={{ gridColumn:'1/-1' }}>
              <input value={form.name} onChange={set('name')} placeholder="Partner name *" style={inp} />
            </div>
            <select value={form.category} onChange={set('category')} style={inp}>
              {CATEGORIES.map(c => <option key={c} value={c}>{CAT_EMOJI[c]} {c.replace('_',' ')}</option>)}
            </select>
            <input type="number" value={form.commission_rate} onChange={set('commission_rate')} placeholder="Commission %" style={inp} />
            <input value={form.contact_name} onChange={set('contact_name')} placeholder="Contact name" style={inp} />
            <input value={form.contact_phone} onChange={set('contact_phone')} placeholder="Phone / WhatsApp" style={inp} />
            <div style={{ gridColumn:'1/-1' }}>
              <input value={form.contact_email} onChange={set('contact_email')} placeholder="Email address" style={inp} />
              <input value={form.booking_url} onChange={set('booking_url')} placeholder="Booking URL" style={inp} />
              <textarea value={form.notes} onChange={set('notes')} placeholder="Notes..." rows={2}
                style={{ ...inp, resize:'none', lineHeight:1.5, marginBottom:12 }} />
            </div>
          </div>
          <button onClick={save} disabled={saving}
            style={{ width:'100%', padding:'11px', background:'#0D3B4A', color:'white', border:'none', borderRadius:10, fontFamily:'DM Sans,sans-serif', fontSize:13, cursor:'pointer', fontWeight:500 }}>
            {saving ? 'Saving...' : 'Add Partner'}
          </button>
        </div>
      )}

      <div style={{ display:'flex', gap:6, marginBottom:12, flexWrap:'wrap' }}>
        {['all', ...CATEGORIES].map(cat => (
          <button key={cat} onClick={() => setFilter(cat)}
            style={{ padding:'5px 12px', borderRadius:20, fontSize:11, background: filter===cat?'#0D3B4A':'rgba(0,0,0,0.05)', color: filter===cat?'white':'#7A6E60', border:'none', cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
            {cat === 'all' ? 'All' : CAT_EMOJI[cat] + ' ' + cat.replace('_',' ')}
          </button>
        ))}
      </div>

      {loading ? <div style={{ textAlign:'center', padding:30, color:'#7A6E60' }}>Loading...</div> :
        filtered.map(p => (
          <div key={p.id} style={{ background:'white', borderRadius:12, padding:14, marginBottom:8, border:'0.5px solid rgba(42,35,24,0.08)', opacity: p.active ? 1 : 0.6 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
              <div>
                <div style={{ fontSize:15, fontWeight:500, color:'#2A2318' }}>{CAT_EMOJI[p.category]} {p.name}</div>
                <div style={{ fontSize:11, color:'#7A6E60', marginTop:2 }}>{p.category.replace('_',' ')} · {Math.round((p.commission_rate||0.1)*100)}% commission</div>
              </div>
              <button onClick={() => toggleActive(p.id, p.active)}
                style={{ padding:'4px 10px', background: p.active?'rgba(90,107,58,0.1)':'rgba(196,104,58,0.1)', border:'none', borderRadius:20, fontSize:11, color: p.active?'#5A6B3A':'#C4683A', cursor:'pointer' }}>
                {p.active ? 'Active' : 'Inactive'}
              </button>
            </div>
            {p.contact_name && <div style={{ fontSize:12, color:'#7A6E60', marginBottom:2 }}>👤 {p.contact_name}</div>}
            {p.contact_email && <div style={{ fontSize:12, color:'#2B7A8B', marginBottom:2 }}>✉️ {p.contact_email}</div>}
            {p.contact_phone && <div style={{ fontSize:12, color:'#7A6E60', marginBottom:2 }}>📱 {p.contact_phone}</div>}
            {p.booking_url && (
              <a href={p.booking_url} target="_blank" rel="noreferrer"
                style={{ fontSize:12, color:'#C4683A', display:'block', marginTop:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                🔗 {p.booking_url}
              </a>
            )}
            {p.notes && <div style={{ fontSize:11, color:'#7A6E60', marginTop:6, fontStyle:'italic' }}>{p.notes}</div>}
          </div>
        ))
      }
    </div>
  )
}
