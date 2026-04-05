import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

const BG_OPTIONS = [
  { label:'Teal', value:'linear-gradient(135deg,rgba(13,59,74,0.9),rgba(43,122,139,0.7))' },
  { label:'Sunset', value:'linear-gradient(135deg,rgba(196,104,58,0.8),rgba(232,133,74,0.6))' },
  { label:'Purple', value:'linear-gradient(135deg,rgba(90,30,120,0.8),rgba(30,60,120,0.7))' },
  { label:'Gold', value:'linear-gradient(135deg,rgba(139,96,32,0.8),rgba(196,160,58,0.6))' },
  { label:'Green', value:'linear-gradient(135deg,rgba(42,79,22,0.8),rgba(90,107,58,0.6))' },
]

export default function PromoBannerManager() {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title:'', subtitle:'', cta_label:'Shop now', cta_action:'home', bg_color:BG_OPTIONS[0].value, emoji:'🌴', valid_until:'' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      const { supabase } = await import('../../lib/supabase')
      const { data } = await supabase.from('promo_banners').select('*').order('sort_order').order('created_at', { ascending:false })
      if (data) setBanners(data)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    if (!form.title.trim()) { toast.error('Title required'); return }
    setSaving(true)
    try {
      const { supabase } = await import('../../lib/supabase')
      await supabase.from('promo_banners').insert({ ...form, active:true })
      toast.success('Banner created!')
      setShowForm(false)
      setForm({ title:'', subtitle:'', cta_label:'Shop now', cta_action:'home', bg_color:BG_OPTIONS[0].value, emoji:'🌴', valid_until:'' })
      load()
    } catch { toast.error('Save failed') }
    setSaving(false)
  }

  const toggle = async (id, active) => {
    const { supabase } = await import('../../lib/supabase')
    await supabase.from('promo_banners').update({ active: !active }).eq('id', id)
    load()
  }

  const remove = async (id) => {
    if (!confirm('Delete this banner?')) return
    const { supabase } = await import('../../lib/supabase')
    await supabase.from('promo_banners').delete().eq('id', id)
    load()
  }

  const set = f => e => setForm(prev => ({ ...prev, [f]: e.target.value }))
  const inp = { width:'100%', padding:'10px 12px', border:'0.5px solid rgba(42,35,24,0.15)', borderRadius:8, fontFamily:'DM Sans,sans-serif', fontSize:13, outline:'none', background:'white', boxSizing:'border-box', marginBottom:10 }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div>
          <div style={{ fontFamily:'DM Serif Display,serif', fontSize:22, color:'#0D3B4A' }}>Promo Banners</div>
          <div style={{ fontSize:13, color:'#7A6E60' }}>Banners shown on the customer home screen</div>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          style={{ padding:'10px 16px', background:'#0D3B4A', color:'white', border:'none', borderRadius:10, fontFamily:'DM Sans,sans-serif', fontSize:13, cursor:'pointer', fontWeight:500 }}>
          + New Banner
        </button>
      </div>

      {showForm && (
        <div style={{ background:'white', borderRadius:14, padding:18, marginBottom:16, border:'0.5px solid rgba(42,35,24,0.1)' }}>
          <div style={{ display:'flex', gap:10, marginBottom:0 }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12, color:'#7A6E60', marginBottom:4 }}>Title *</div>
              <input value={form.title} onChange={set('title')} placeholder="Summer launch 🌴" style={inp} />
            </div>
            <div style={{ width:70 }}>
              <div style={{ fontSize:12, color:'#7A6E60', marginBottom:4 }}>Emoji</div>
              <input value={form.emoji} onChange={set('emoji')} style={{ ...inp, textAlign:'center', fontSize:20 }} />
            </div>
          </div>
          <input value={form.subtitle} onChange={set('subtitle')} placeholder="Subtitle / description" style={inp} />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div>
              <div style={{ fontSize:12, color:'#7A6E60', marginBottom:4 }}>Button label</div>
              <input value={form.cta_label} onChange={set('cta_label')} style={inp} />
            </div>
            <div>
              <div style={{ fontSize:12, color:'#7A6E60', marginBottom:4 }}>Expires (optional)</div>
              <input type="date" value={form.valid_until} onChange={set('valid_until')} style={inp} />
            </div>
          </div>
          <div style={{ fontSize:12, color:'#7A6E60', marginBottom:6 }}>Background colour</div>
          <div style={{ display:'flex', gap:8, marginBottom:14 }}>
            {BG_OPTIONS.map(bg => (
              <div key={bg.value} onClick={() => setForm(prev => ({ ...prev, bg_color: bg.value }))}
                style={{ flex:1, height:32, background:bg.value, borderRadius:8, cursor:'pointer', border: form.bg_color===bg.value?'2px solid #0D3B4A':'2px solid transparent' }} />
            ))}
          </div>
          {/* Preview */}
          <div style={{ background:form.bg_color, borderRadius:12, padding:'14px 16px', marginBottom:14, display:'flex', alignItems:'center', gap:12 }}>
            <span style={{ fontSize:32 }}>{form.emoji}</span>
            <div>
              <div style={{ fontFamily:'DM Serif Display,serif', fontSize:16, color:'white' }}>{form.title || 'Banner title'}</div>
              {form.subtitle && <div style={{ fontSize:12, color:'rgba(255,255,255,0.6)', marginTop:2 }}>{form.subtitle}</div>}
            </div>
            <div style={{ marginLeft:'auto', background:'rgba(255,255,255,0.2)', borderRadius:20, padding:'5px 12px', fontSize:11, color:'white' }}>{form.cta_label}</div>
          </div>
          <button onClick={save} disabled={saving}
            style={{ width:'100%', padding:'11px', background:'#0D3B4A', color:'white', border:'none', borderRadius:10, fontFamily:'DM Sans,sans-serif', fontSize:13, cursor:'pointer', fontWeight:500 }}>
            {saving ? 'Saving...' : 'Create Banner'}
          </button>
        </div>
      )}

      {loading && <div style={{ textAlign:'center', padding:30, color:'#7A6E60' }}>Loading...</div>}
      {!loading && banners.length === 0 && !showForm && (
        <div style={{ textAlign:'center', padding:'40px 0' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>📣</div>
          <div style={{ fontSize:15, color:'#0D3B4A', fontWeight:500 }}>No banners yet</div>
          <div style={{ fontSize:13, color:'#7A6E60', marginTop:4 }}>Create a banner to show promotions on the home screen</div>
        </div>
      )}

      {banners.map(b => (
        <div key={b.id} style={{ background:'white', borderRadius:12, padding:14, marginBottom:10, border:'0.5px solid rgba(42,35,24,0.1)' }}>
          <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:10 }}>
            <div style={{ background:b.bg_color, borderRadius:10, padding:'8px 12px', display:'flex', alignItems:'center', gap:8, flex:1 }}>
              <span style={{ fontSize:20 }}>{b.emoji}</span>
              <div>
                <div style={{ fontSize:13, fontWeight:500, color:'white' }}>{b.title}</div>
                {b.subtitle && <div style={{ fontSize:11, color:'rgba(255,255,255,0.6)' }}>{b.subtitle}</div>}
              </div>
            </div>
            <span style={{ fontSize:11, padding:'3px 8px', borderRadius:20, background: b.active?'rgba(90,107,58,0.1)':'rgba(196,104,58,0.1)', color: b.active?'#5A6B3A':'#C4683A', whiteSpace:'nowrap' }}>
              {b.active ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => toggle(b.id, b.active)}
              style={{ flex:1, padding:'7px', background: b.active?'rgba(196,104,58,0.08)':'rgba(90,107,58,0.1)', border:'0.5px solid ' + (b.active?'rgba(196,104,58,0.2)':'rgba(90,107,58,0.2)'), borderRadius:8, fontSize:12, color: b.active?'#C4683A':'#5A6B3A', cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
              {b.active ? 'Deactivate' : 'Activate'}
            </button>
            <button onClick={() => remove(b.id)}
              style={{ padding:'7px 12px', background:'rgba(196,104,58,0.05)', border:'0.5px solid rgba(196,104,58,0.15)', borderRadius:8, fontSize:12, color:'#C4683A', cursor:'pointer' }}>
              🗑
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
