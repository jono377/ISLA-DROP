// ================================================================
// Isla Drop — PartnerManager.jsx (Ops Dashboard)
// Includes full concierge photo management:
//   • Partners upload photos per service via URL or Supabase Storage
//   • Admins approve/reject in a dedicated photo queue
//   • Live photo table: concierge_service_photos
// ================================================================
import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'

const CATEGORIES = ['boat','villa','restaurant','beach_club','club','experience','other']
const CAT_EMOJI = { boat:'⛵', villa:'🏡', restaurant:'🍽️', beach_club:'🏖️', club:'🎉', experience:'🌟', other:'📋' }

// Concierge service IDs — matches Concierge_final.jsx SERVICES array
const CONCIERGE_SERVICES = [
  { id:'boat-001', name:'RIB Speedboat — Half Day',          category:'boat' },
  { id:'boat-002', name:'RIB Speedboat — Full Day',          category:'boat' },
  { id:'boat-003', name:'Sailing Catamaran — Full Day',      category:'boat' },
  { id:'boat-004', name:'Luxury Motor Yacht — Full Day',     category:'boat' },
  { id:'boat-005', name:'Sunset Cruise — 3 Hours',           category:'boat' },
  { id:'villa-001', name:'Luxury Finca — 4 Bedrooms',        category:'villa' },
  { id:'villa-002', name:'Sunset View Villa — 6 Bedrooms',   category:'villa' },
  { id:'villa-003', name:'Ultra-Luxury Es Cubells Estate',   category:'villa' },
  { id:'vip-001',  name:'Pacha VIP Table — 4 Guests',        category:'club' },
  { id:'vip-002',  name:'Ushuaia VIP Daybed — 4 Guests',     category:'club' },
  { id:'vip-003',  name:'Amnesia VIP Table — 5 Guests',      category:'club' },
  { id:'bc-001',   name:'Blue Marlin Ibiza — VIP Daybed',    category:'beach_club' },
  { id:'bc-002',   name:'Cala Bassa Beach Club — Balinese Bed', category:'beach_club' },
  { id:'bc-003',   name:'Cotton Beach Club — Clifftop Table',category:'beach_club' },
  { id:'bc-004',   name:'Nassau Beach Club — VIP Table',     category:'beach_club' },
  { id:'bc-005',   name:'Nikki Beach — Champagne Brunch',    category:'beach_club' },
  { id:'bc-007',   name:'Beso Beach — Long Lunch',           category:'beach_club' },
  { id:'rest-001', name:'La Gaia — Michelin Star Dinner',    category:'restaurant' },
  { id:'rest-002', name:'Nobu Ibiza — Omakase Experience',   category:'restaurant' },
  { id:'rest-003', name:'Amante Ibiza — Clifftop Dinner',    category:'restaurant' },
  { id:'rest-004', name:'Blue Marlin — Beach Restaurant',    category:'restaurant' },
  { id:'rest-005', name:'Atzaro — Garden Estate Dinner',     category:'restaurant' },
  { id:'rest-010', name:"Gordon Ramsay Hell's Kitchen",      category:'restaurant' },
  { id:'rest-011', name:'Sublimotion — Gastro-sensory',      category:'restaurant' },
  { id:'exp-001',  name:'Private Chef — Villa Dinner',       category:'experience' },
  { id:'exp-002',  name:'Sunrise Yoga — Ses Salines Beach',  category:'experience' },
  { id:'exp-003',  name:'Quad Bike Adventure Tour',          category:'experience' },
  { id:'exp-004',  name:'Private Helicopter Tour',           category:'experience' },
  { id:'exp-005',  name:'Dalt Vila Guided Night Tour',       category:'experience' },
  { id:'club-001', name:'Pacha Ibiza — Entry',               category:'club' },
  { id:'club-002', name:'Ushuaia — Open-air Show',           category:'club' },
  { id:'club-003', name:'Hi Ibiza — Entry Ticket',           category:'club' },
  { id:'club-004', name:'Amnesia Ibiza — Entry',             category:'club' },
  { id:'club-005', name:'DC-10 — Entry Ticket',              category:'club' },
  { id:'club-006', name:'UNVRS Ibiza — Entry',               category:'club' },
  { id:'club-007', name:'Cova Santa — Dinner & Party',       category:'club' },
  { id:'club-008', name:'Lio Ibiza — Cabaret Show',          category:'club' },
  { id:'club-014', name:'Heart Ibiza — Show & Club',         category:'club' },
]

// ── Shared styling ───────────────────────────────────────────
const inp = {
  width:'100%', padding:'9px 12px',
  border:'0.5px solid rgba(42,35,24,0.15)', borderRadius:8,
  fontFamily:'DM Sans,sans-serif', fontSize:13, outline:'none',
  background:'white', boxSizing:'border-box', marginBottom:8,
}
const btn = (primary) => ({
  padding:'9px 18px', borderRadius:10,
  background: primary ? '#0D3B4A' : 'white',
  color: primary ? 'white' : '#0D3B4A',
  border: primary ? 'none' : '0.5px solid rgba(13,59,74,0.3)',
  fontFamily:'DM Sans,sans-serif', fontSize:13, cursor:'pointer', fontWeight:500,
})

// ── Tab: Photo management (partner uploads + admin approval) ─
function PhotoManager() {
  const [tab, setTab] = useState('upload')   // 'upload' | 'approve'
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [photoUrl, setPhotoUrl] = useState('')
  const [selectedService, setSelectedService] = useState('')
  const [filterStatus, setFilterStatus] = useState('pending')
  const fileRef = useRef(null)

  const loadPhotos = async () => {
    setLoading(true)
    try {
      const { supabase } = await import('../../lib/supabase')
      const { data } = await supabase
        .from('concierge_service_photos')
        .select('*')
        .order('created_at', { ascending: false })
      if (data) setPhotos(data)
    } catch { toast.error('Could not load photos') }
    setLoading(false)
  }

  useEffect(() => { loadPhotos() }, [])

  // ── Submit a photo URL (partner or admin) ─────────────────
  const submitUrl = async () => {
    if (!photoUrl.trim()) { toast.error('Enter a photo URL'); return }
    if (!selectedService) { toast.error('Select a service'); return }
    setUploading(true)
    try {
      const { supabase } = await import('../../lib/supabase')
      const svc = CONCIERGE_SERVICES.find(s => s.id === selectedService)
      await supabase.from('concierge_service_photos').insert({
        service_id: selectedService,
        service_name: svc?.name || selectedService,
        photo_url: photoUrl.trim(),
        approved: false,
        source: 'partner_url',
        created_at: new Date().toISOString(),
      })
      toast.success('Photo submitted for admin approval')
      setPhotoUrl('')
      setSelectedService('')
      loadPhotos()
    } catch { toast.error('Upload failed') }
    setUploading(false)
  }

  // ── Upload file to Supabase Storage ──────────────────────
  const uploadFile = async (file) => {
    if (!selectedService) { toast.error('Select a service first'); return }
    if (!file) return
    setUploading(true)
    try {
      const { supabase } = await import('../../lib/supabase')
      const ext = file.name.split('.').pop()
      const path = 'concierge/'+selectedService+'/'+Date.now()+'.'+ext
      const { data: storageData, error: storageErr } = await supabase
        .storage.from('photos').upload(path, file, { contentType: file.type, upsert: false })
      if (storageErr) throw storageErr
      const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(path)
      const svc = CONCIERGE_SERVICES.find(s => s.id === selectedService)
      await supabase.from('concierge_service_photos').insert({
        service_id: selectedService,
        service_name: svc?.name || selectedService,
        photo_url: publicUrl,
        approved: false,
        source: 'partner_upload',
        storage_path: path,
        created_at: new Date().toISOString(),
      })
      toast.success('Photo uploaded — pending admin approval')
      setSelectedService('')
      loadPhotos()
    } catch (err) { toast.error('Upload failed: '+(err.message||'unknown error')) }
    setUploading(false)
  }

  // ── Admin: approve or reject ──────────────────────────────
  const setApproval = async (id, approved) => {
    try {
      const { supabase } = await import('../../lib/supabase')
      await supabase.from('concierge_service_photos')
        .update({ approved, reviewed_at: new Date().toISOString() }).eq('id', id)
      toast.success(approved ? '✓ Photo approved — now live in app' : 'Photo rejected')
      loadPhotos()
    } catch { toast.error('Could not update') }
  }

  const deletePhoto = async (id, storagePath) => {
    if (!window.confirm('Delete this photo permanently?')) return
    try {
      const { supabase } = await import('../../lib/supabase')
      if (storagePath) await supabase.storage.from('photos').remove([storagePath])
      await supabase.from('concierge_service_photos').delete().eq('id', id)
      toast.success('Photo deleted')
      loadPhotos()
    } catch { toast.error('Delete failed') }
  }

  const pendingCount = photos.filter(p => !p.approved && p.approved !== false).length
    + photos.filter(p => p.approved === false && !p.reviewed_at).length

  const filteredPhotos = photos.filter(p => {
    if (filterStatus === 'pending') return !p.reviewed_at
    if (filterStatus === 'approved') return p.approved === true
    if (filterStatus === 'rejected') return p.approved === false && p.reviewed_at
    return true
  })

  return (
    <div>
      <div style={{ fontFamily:'DM Serif Display,serif', fontSize:20, color:'#0D3B4A', marginBottom:4 }}>Concierge Photos</div>
      <div style={{ fontSize:13, color:'#7A6E60', marginBottom:16 }}>
        Partners submit photos per service. Admins approve before they go live in the app.
      </div>

      {/* Tab switcher */}
      <div style={{ display:'flex', gap:8, marginBottom:20 }}>
        {[['upload','Submit photo'],['approve','Review queue'+(pendingCount>0?' ('+pendingCount+')':'')]].map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t)}
            style={{ ...btn(tab===t), padding:'8px 16px', fontSize:12, borderRadius:20 }}>
            {l}
          </button>
        ))}
      </div>

      {/* ── SUBMIT TAB ────────────────────────────────────── */}
      {tab === 'upload' && (
        <div>
          <div style={{ background:'white', borderRadius:14, padding:18, border:'0.5px solid rgba(42,35,24,0.1)', marginBottom:16 }}>
            <div style={{ fontFamily:'DM Serif Display,serif', fontSize:16, color:'#0D3B4A', marginBottom:14 }}>Submit a new photo</div>

            {/* Service selector */}
            <div style={{ fontSize:12, color:'#7A6E60', marginBottom:6 }}>Select service *</div>
            <select value={selectedService} onChange={e=>setSelectedService(e.target.value)} style={{ ...inp }}>
              <option value="">Choose a concierge service...</option>
              {Object.entries(
                CONCIERGE_SERVICES.reduce((acc, s) => {
                  const grp = s.category.replace('_',' ')
                  if (!acc[grp]) acc[grp] = []
                  acc[grp].push(s)
                  return acc
                }, {})
              ).map(([grp, svcs]) => (
                <optgroup key={grp} label={grp.charAt(0).toUpperCase()+grp.slice(1)}>
                  {svcs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </optgroup>
              ))}
            </select>

            {/* Option A: URL */}
            <div style={{ marginTop:4, marginBottom:12 }}>
              <div style={{ fontSize:12, color:'#7A6E60', marginBottom:6 }}>Option A — Paste a photo URL</div>
              <div style={{ display:'flex', gap:8 }}>
                <input value={photoUrl} onChange={e=>setPhotoUrl(e.target.value)}
                  placeholder="https://... (jpg, png, webp)"
                  style={{ ...inp, flex:1, marginBottom:0 }} />
                <button onClick={submitUrl} disabled={uploading || !photoUrl.trim() || !selectedService}
                  style={{ ...btn(true), whiteSpace:'nowrap', opacity: (!photoUrl.trim()||!selectedService)?0.5:1 }}>
                  {uploading ? 'Sending...' : 'Submit'}
                </button>
              </div>
              {photoUrl && (
                <div style={{ marginTop:8, borderRadius:10, overflow:'hidden', height:120 }}>
                  <img src={photoUrl} alt="preview"
                    style={{ width:'100%', height:'100%', objectFit:'cover' }}
                    onError={e=>{ e.target.style.display='none' }} />
                </div>
              )}
            </div>

            {/* Divider */}
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
              <div style={{ flex:1, height:1, background:'rgba(42,35,24,0.1)' }}/>
              <span style={{ fontSize:11, color:'#7A6E60' }}>or</span>
              <div style={{ flex:1, height:1, background:'rgba(42,35,24,0.1)' }}/>
            </div>

            {/* Option B: File upload */}
            <div style={{ fontSize:12, color:'#7A6E60', marginBottom:6 }}>Option B — Upload from device</div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }}
              onChange={e=>{ if(e.target.files?.[0]) uploadFile(e.target.files[0]) }} />
            <button onClick={()=>{ if(!selectedService){toast.error('Select a service first');return}; fileRef.current?.click() }}
              disabled={uploading}
              style={{ width:'100%', padding:'12px', background:'rgba(13,59,74,0.06)', border:'1.5px dashed rgba(13,59,74,0.25)', borderRadius:10, color:'#0D3B4A', fontSize:13, cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
              {uploading ? '⏳ Uploading...' : '📁 Choose photo from device'}
            </button>
            <div style={{ fontSize:11, color:'#7A6E60', marginTop:8, lineHeight:1.5 }}>
              Photos go live only after admin approval. Max 5MB. JPG or PNG recommended. Use landscape photos (16:9) for best results in the app.
            </div>
          </div>

          {/* Recent submissions by this partner */}
          <div style={{ fontFamily:'DM Serif Display,serif', fontSize:16, color:'#0D3B4A', marginBottom:10 }}>Recent submissions</div>
          {loading && <div style={{ textAlign:'center', padding:20, color:'#7A6E60' }}>Loading...</div>}
          {!loading && photos.slice(0,5).map(photo=>(
            <div key={photo.id} style={{ background:'white', borderRadius:12, padding:12, marginBottom:8, border:'0.5px solid rgba(42,35,24,0.08)', display:'flex', gap:12, alignItems:'center' }}>
              <div style={{ width:60, height:60, borderRadius:8, overflow:'hidden', flexShrink:0 }}>
                <img src={photo.photo_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}
                  onError={e=>{ e.target.style.background='#f0f0f0' }} />
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:500, color:'#2A2318', marginBottom:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{photo.service_name||photo.service_id}</div>
                <div style={{ fontSize:11, color:'#7A6E60' }}>{new Date(photo.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</div>
              </div>
              <div style={{ padding:'3px 10px', borderRadius:20, fontSize:10, fontWeight:700,
                background: photo.approved ? 'rgba(90,107,58,0.12)' : photo.reviewed_at ? 'rgba(196,104,58,0.12)' : 'rgba(200,168,75,0.12)',
                color: photo.approved ? '#5A6B3A' : photo.reviewed_at ? '#C4683A' : '#8B7540' }}>
                {photo.approved ? '✓ Live' : photo.reviewed_at ? '✗ Rejected' : '⏳ Pending'}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── APPROVE TAB (admin only) ─────────────────────── */}
      {tab === 'approve' && (
        <div>
          {/* Filter */}
          <div style={{ display:'flex', gap:6, marginBottom:14 }}>
            {[['pending','Pending'],['approved','Approved'],['rejected','Rejected'],['all','All']].map(([v,l])=>(
              <button key={v} onClick={()=>setFilterStatus(v)}
                style={{ padding:'5px 14px', borderRadius:20, fontSize:11, border:'none', cursor:'pointer',
                  background: filterStatus===v?'#0D3B4A':'rgba(0,0,0,0.05)',
                  color: filterStatus===v?'white':'#7A6E60',
                  fontFamily:'DM Sans,sans-serif' }}>
                {l}
              </button>
            ))}
          </div>

          {loading && <div style={{ textAlign:'center', padding:20, color:'#7A6E60' }}>Loading...</div>}

          {!loading && filteredPhotos.length === 0 && (
            <div style={{ textAlign:'center', padding:40, color:'#7A6E60' }}>
              <div style={{ fontSize:32, marginBottom:10 }}>📷</div>
              <div>No {filterStatus} photos</div>
            </div>
          )}

          {filteredPhotos.map(photo => (
            <div key={photo.id} style={{ background:'white', borderRadius:16, overflow:'hidden', marginBottom:12, border:'0.5px solid rgba(42,35,24,0.1)', boxShadow:'0 1px 8px rgba(0,0,0,0.04)' }}>
              {/* Photo preview */}
              <div style={{ height:180, position:'relative', background:'#f5f5f5' }}>
                <img src={photo.photo_url} alt={photo.service_name}
                  style={{ width:'100%', height:'100%', objectFit:'cover' }}
                  onError={e=>{ e.target.style.background='#e8e0d0'; e.target.style.opacity='0.3' }} />
                {photo.approved && (
                  <div style={{ position:'absolute', top:10, right:10, background:'rgba(90,107,58,0.9)', color:'white', fontSize:11, fontWeight:700, padding:'4px 12px', borderRadius:20 }}>✓ LIVE</div>
                )}
                {photo.reviewed_at && !photo.approved && (
                  <div style={{ position:'absolute', top:10, right:10, background:'rgba(196,104,58,0.9)', color:'white', fontSize:11, fontWeight:700, padding:'4px 12px', borderRadius:20 }}>✗ REJECTED</div>
                )}
                {!photo.reviewed_at && (
                  <div style={{ position:'absolute', top:10, right:10, background:'rgba(200,168,75,0.9)', color:'white', fontSize:11, fontWeight:700, padding:'4px 12px', borderRadius:20 }}>⏳ PENDING</div>
                )}
              </div>

              <div style={{ padding:'14px 16px' }}>
                <div style={{ fontSize:15, fontWeight:600, color:'#2A2318', marginBottom:4 }}>
                  {photo.service_name || photo.service_id}
                </div>
                <div style={{ fontSize:11, color:'#7A6E60', marginBottom:2 }}>
                  ID: {photo.service_id} · Source: {photo.source || 'unknown'}
                </div>
                <div style={{ fontSize:11, color:'#7A6E60', marginBottom:10 }}>
                  Submitted: {new Date(photo.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}
                </div>

                {/* URL preview */}
                <div style={{ fontSize:11, color:'#2B7A8B', marginBottom:14, wordBreak:'break-all', background:'rgba(43,122,139,0.05)', borderRadius:8, padding:'6px 10px', lineHeight:1.5 }}>
                  {photo.photo_url}
                </div>

                {/* Action buttons */}
                <div style={{ display:'flex', gap:8 }}>
                  {!photo.approved && (
                    <button onClick={()=>setApproval(photo.id, true)}
                      style={{ flex:1, padding:'10px', background:'rgba(90,107,58,0.1)', border:'0.5px solid rgba(90,107,58,0.3)', borderRadius:10, color:'#5A6B3A', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
                      ✓ Approve
                    </button>
                  )}
                  {photo.approved && (
                    <button onClick={()=>setApproval(photo.id, false)}
                      style={{ flex:1, padding:'10px', background:'rgba(200,168,75,0.1)', border:'0.5px solid rgba(200,168,75,0.3)', borderRadius:10, color:'#8B7540', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
                      Unpublish
                    </button>
                  )}
                  {photo.reviewed_at && !photo.approved && (
                    <button onClick={()=>setApproval(photo.id, true)}
                      style={{ flex:1, padding:'10px', background:'rgba(90,107,58,0.1)', border:'0.5px solid rgba(90,107,58,0.3)', borderRadius:10, color:'#5A6B3A', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
                      Re-approve
                    </button>
                  )}
                  {!photo.reviewed_at && (
                    <button onClick={()=>setApproval(photo.id, false)}
                      style={{ flex:1, padding:'10px', background:'rgba(196,104,58,0.1)', border:'0.5px solid rgba(196,104,58,0.3)', borderRadius:10, color:'#C4683A', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
                      ✗ Reject
                    </button>
                  )}
                  <button onClick={()=>deletePhoto(photo.id, photo.storage_path)}
                    style={{ padding:'10px 14px', background:'rgba(196,58,58,0.08)', border:'0.5px solid rgba(196,58,58,0.25)', borderRadius:10, color:'#C43A3A', fontSize:13, cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
                    🗑
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main PartnerManager (existing + photo tab) ────────────────
export default function PartnerManager() {
  const [activeTab, setActiveTab] = useState('partners')
  const [partners, setPartners] = useState([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter]     = useState('all')
  const [form, setForm] = useState({
    name:'', category:'restaurant', contact_name:'', contact_email:'',
    contact_phone:'', booking_url:'', commission_rate:10, notes:'',
  })
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
      await supabase.from('partners').insert({
        ...form, commission_rate: parseFloat(form.commission_rate)/100, active: true,
      })
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
  const filtered = filter === 'all' ? partners : partners.filter(p => p.category === filter)

  const TABS = [
    { id:'partners', label:'Partners' },
    { id:'photos',   label:'Concierge Photos' },
  ]

  return (
    <div>
      {/* Tab selector */}
      <div style={{ display:'flex', gap:6, marginBottom:20, borderBottom:'1px solid rgba(42,35,24,0.08)', paddingBottom:12 }}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setActiveTab(t.id)}
            style={{ padding:'8px 20px', borderRadius:20, fontSize:13, fontWeight:activeTab===t.id?600:400,
              background: activeTab===t.id?'#0D3B4A':'transparent',
              color: activeTab===t.id?'white':'#7A6E60',
              border: activeTab===t.id?'none':'0.5px solid rgba(42,35,24,0.15)',
              cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── PARTNERS TAB ─────────────────────────────────── */}
      {activeTab === 'partners' && (
        <>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div>
              <div style={{ fontFamily:'DM Serif Display,serif', fontSize:22, color:'#0D3B4A' }}>Partners</div>
              <div style={{ fontSize:13, color:'#7A6E60' }}>{partners.length} concierge partners</div>
            </div>
            <button onClick={()=>setShowForm(!showForm)} style={{ ...btn(true) }}>+ Add Partner</button>
          </div>

          {showForm && (
            <div style={{ background:'white', borderRadius:14, padding:16, marginBottom:14, border:'0.5px solid rgba(42,35,24,0.1)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
                <div style={{ fontFamily:'DM Serif Display,serif', fontSize:16, color:'#0D3B4A' }}>New Partner</div>
                <button onClick={()=>setShowForm(false)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:18, color:'#7A6E60' }}>✕</button>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                <div style={{ gridColumn:'1/-1' }}>
                  <input value={form.name} onChange={set('name')} placeholder="Partner name *" style={inp} />
                </div>
                <select value={form.category} onChange={set('category')} style={inp}>
                  {CATEGORIES.map(c=><option key={c} value={c}>{CAT_EMOJI[c]} {c.replace('_',' ')}</option>)}
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
              <button onClick={save} disabled={saving} style={{ ...btn(true), width:'100%', padding:'11px' }}>
                {saving ? 'Saving...' : 'Add Partner'}
              </button>
            </div>
          )}

          <div style={{ display:'flex', gap:6, marginBottom:12, flexWrap:'wrap' }}>
            {['all', ...CATEGORIES].map(cat=>(
              <button key={cat} onClick={()=>setFilter(cat)}
                style={{ padding:'5px 12px', borderRadius:20, fontSize:11, cursor:'pointer', fontFamily:'DM Sans,sans-serif', border:'none',
                  background: filter===cat?'#0D3B4A':'rgba(0,0,0,0.05)',
                  color: filter===cat?'white':'#7A6E60' }}>
                {cat==='all'?'All': CAT_EMOJI[cat]+' '+cat.replace('_',' ')}
              </button>
            ))}
          </div>

          {loading ? <div style={{ textAlign:'center', padding:30, color:'#7A6E60' }}>Loading...</div> :
            filtered.map(p=>(
              <div key={p.id} style={{ background:'white', borderRadius:12, padding:14, marginBottom:8, border:'0.5px solid rgba(42,35,24,0.08)', opacity:p.active?1:0.6 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                  <div>
                    <div style={{ fontSize:15, fontWeight:500, color:'#2A2318' }}>{CAT_EMOJI[p.category]} {p.name}</div>
                    <div style={{ fontSize:11, color:'#7A6E60', marginTop:2 }}>{p.category.replace('_',' ')} · {Math.round((p.commission_rate||0.1)*100)}% commission</div>
                  </div>
                  <button onClick={()=>toggleActive(p.id, p.active)}
                    style={{ padding:'4px 10px', border:'none', borderRadius:20, fontSize:11, cursor:'pointer',
                      background: p.active?'rgba(90,107,58,0.1)':'rgba(196,104,58,0.1)',
                      color: p.active?'#5A6B3A':'#C4683A' }}>
                    {p.active ? 'Active' : 'Inactive'}
                  </button>
                </div>
                {p.contact_name  && <div style={{ fontSize:12, color:'#7A6E60', marginBottom:2 }}>👤 {p.contact_name}</div>}
                {p.contact_email && <div style={{ fontSize:12, color:'#2B7A8B', marginBottom:2 }}>✉️ {p.contact_email}</div>}
                {p.contact_phone && <div style={{ fontSize:12, color:'#7A6E60', marginBottom:2 }}>📱 {p.contact_phone}</div>}
                {p.booking_url   && (
                  <a href={p.booking_url} target="_blank" rel="noreferrer"
                    style={{ fontSize:12, color:'#C4683A', display:'block', marginTop:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    🔗 {p.booking_url}
                  </a>
                )}
                {p.notes && <div style={{ fontSize:11, color:'#7A6E60', marginTop:6, fontStyle:'italic' }}>{p.notes}</div>}

                {/* Quick link to upload photos for this partner */}
                <button onClick={()=>setActiveTab('photos')}
                  style={{ marginTop:10, padding:'5px 12px', background:'rgba(43,122,139,0.08)', border:'0.5px solid rgba(43,122,139,0.2)', borderRadius:20, fontSize:11, color:'#2B7A8B', cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
                  📷 Manage concierge photos →
                </button>
              </div>
            ))
          }
        </>
      )}

      {/* ── PHOTOS TAB ───────────────────────────────────── */}
      {activeTab === 'photos' && <PhotoManager />}
    </div>
  )
}
