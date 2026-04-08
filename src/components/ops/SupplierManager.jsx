import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

const CATS = ['spirits','champagne','wine','beer_cider','soft_drinks','water','snacks','tobacco','ice','party','wellness','essentials','beach','fresh','cocktail']

export default function SupplierManager() {
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name:'', contact_name:'', contact_email:'', contact_phone:'', product_categories:[], lead_time_days:2, notes:'' })
  const [saving, setSaving]     = useState(false)

  const load = async () => {
    try {
      const { supabase } = await import('../../lib/supabase')
      const { data } = await supabase.from('suppliers').select('*').eq('active', true).order('name')
      if (data) setSuppliers(data)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const toggleCat = (cat) => setForm(prev => ({
    ...prev,
    product_categories: prev.product_categories.includes(cat)
      ? prev.product_categories.filter(c => c !== cat)
      : [...prev.product_categories, cat]
  }))

  const save = async () => {
    if (!form.name.trim()) { toast.error('Supplier name required'); return }
    setSaving(true)
    try {
      const { supabase } = await import('../../lib/supabase')
      await supabase.from('suppliers').insert({ ...form, active: true })
      toast.success('Supplier added!')
      setShowForm(false)
      setForm({ name:'', contact_name:'', contact_email:'', contact_phone:'', product_categories:[], lead_time_days:2, notes:'' })
      load()
    } catch { toast.error('Save failed') }
    setSaving(false)
  }

  const markDelivery = async (id) => {
    const { supabase } = await import('../../lib/supabase')
    await supabase.from('suppliers').update({ last_delivery: new Date().toISOString().slice(0,10) }).eq('id', id)
    toast.success('Delivery recorded!')
    load()
  }

  const inp = { width:'100%', padding:'9px 12px', border:'0.5px solid rgba(42,35,24,0.15)', borderRadius:8, fontFamily:'DM Sans,sans-serif', fontSize:13, outline:'none', background:'white', boxSizing:'border-box', marginBottom:8 }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <div>
          <div style={{ fontFamily:'DM Serif Display,serif', fontSize:22, color:'#0D3B4A' }}>Suppliers</div>
          <div style={{ fontSize:13, color:'#7A6E60' }}>{suppliers.length} active suppliers</div>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          style={{ padding:'9px 16px', background:'#0D3B4A', color:'white', border:'none', borderRadius:10, fontFamily:'DM Sans,sans-serif', fontSize:13, cursor:'pointer', fontWeight:500 }}>
          + Add Supplier
        </button>
      </div>

      {showForm && (
        <div style={{ background:'white', borderRadius:14, padding:16, marginBottom:14, border:'0.5px solid rgba(42,35,24,0.1)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
            <div style={{ fontFamily:'DM Serif Display,serif', fontSize:16, color:'#0D3B4A' }}>New Supplier</div>
            <button onClick={() => setShowForm(false)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:18 }}>✕</button>
          </div>
          <input value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} placeholder="Supplier name *" style={inp} />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <input value={form.contact_name} onChange={e => setForm(p=>({...p,contact_name:e.target.value}))} placeholder="Contact name" style={inp} />
            <input value={form.contact_phone} onChange={e => setForm(p=>({...p,contact_phone:e.target.value}))} placeholder="Phone / WhatsApp" style={inp} />
          </div>
          <input value={form.contact_email} onChange={e => setForm(p=>({...p,contact_email:e.target.value}))} placeholder="Email address" style={inp} />
          <div style={{ fontSize:12, color:'#7A6E60', marginBottom:6 }}>Product categories supplied</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:10 }}>
            {CATS.map(cat => (
              <button key={cat} onClick={() => toggleCat(cat)}
                style={{ padding:'4px 10px', borderRadius:20, fontSize:11, background: form.product_categories.includes(cat)?'#0D3B4A':'rgba(0,0,0,0.05)', color: form.product_categories.includes(cat)?'white':'#7A6E60', border:'none', cursor:'pointer' }}>
                {cat}
              </button>
            ))}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <div>
              <div style={{ fontSize:12, color:'#7A6E60', marginBottom:4 }}>Lead time (days)</div>
              <input type="number" value={form.lead_time_days} onChange={e => setForm(p=>({...p,lead_time_days:parseInt(e.target.value)||2}))} style={inp} />
            </div>
            <div>
              <div style={{ fontSize:12, color:'#7A6E60', marginBottom:4 }}>Notes</div>
              <input value={form.notes} onChange={e => setForm(p=>({...p,notes:e.target.value}))} placeholder="e.g. Min order €500" style={inp} />
            </div>
          </div>
          <button onClick={save} disabled={saving}
            style={{ width:'100%', padding:'11px', background:'#0D3B4A', color:'white', border:'none', borderRadius:10, fontFamily:'DM Sans,sans-serif', fontSize:13, cursor:'pointer', fontWeight:500 }}>
            {saving ? 'Saving...' : 'Add Supplier'}
          </button>
        </div>
      )}

      {loading ? <div style={{ textAlign:'center', padding:30, color:'#7A6E60' }}>Loading...</div> :
        suppliers.length === 0 && !showForm ? (
          <div style={{ textAlign:'center', padding:'40px 0' }}>
            <div style={{ fontSize:40, marginBottom:10 }}>🏭</div>
            <div style={{ fontSize:14, color:'#0D3B4A', fontWeight:500 }}>No suppliers yet</div>
            <div style={{ fontSize:13, color:'#7A6E60', marginTop:4 }}>Add your product suppliers to track deliveries and contacts</div>
          </div>
        ) : suppliers.map(s => (
          <div key={s.id} style={{ background:'white', borderRadius:12, padding:14, marginBottom:8, border:'0.5px solid rgba(42,35,24,0.08)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
              <div>
                <div style={{ fontSize:15, fontWeight:500, color:'#2A2318' }}>🏭 {s.name}</div>
                <div style={{ fontSize:11, color:'#7A6E60', marginTop:2 }}>Lead time: {s.lead_time_days} days</div>
              </div>
              <button onClick={() => markDelivery(s.id)}
                style={{ padding:'5px 12px', background:'rgba(90,107,58,0.1)', border:'0.5px solid rgba(90,107,58,0.2)', borderRadius:8, fontSize:11, color:'#5A6B3A', cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
                ✓ Mark delivery
              </button>
            </div>
            {s.contact_name && <div style={{ fontSize:12, color:'#7A6E60' }}>👤 {s.contact_name}</div>}
            {s.contact_email && <div style={{ fontSize:12, color:'#2B7A8B' }}>✉️ {s.contact_email}</div>}
            {s.contact_phone && <div style={{ fontSize:12, color:'#7A6E60' }}>📱 {s.contact_phone}</div>}
            {s.product_categories?.length > 0 && (
              <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginTop:6 }}>
                {s.product_categories.map(c => (
                  <span key={c} style={{ fontSize:10, background:'rgba(13,59,74,0.08)', padding:'2px 7px', borderRadius:20, color:'#0D3B4A' }}>{c}</span>
                ))}
              </div>
            )}
            {s.last_delivery && <div style={{ fontSize:11, color:'#7A6E60', marginTop:6 }}>Last delivery: {new Date(s.last_delivery).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}</div>}
            {s.notes && <div style={{ fontSize:11, color:'#7A6E60', marginTop:4, fontStyle:'italic' }}>{s.notes}</div>}
          </div>
        ))
      }
    </div>
  )
}
