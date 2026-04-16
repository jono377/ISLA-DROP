import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../lib/store'

// ─── Shared tokens ────────────────────────────────────────────
const C = {
  bg:'#F5F0E8', card:'#FFFFFF', accent:'#C4683A', accentL:'rgba(196,104,58,0.1)',
  green:'#1D9E75', greenL:'rgba(29,158,117,0.1)', blue:'#2B7A8B', blueL:'rgba(43,122,139,0.1)',
  red:'#C43A3A', redL:'rgba(196,58,58,0.1)', yellow:'#B8860B', yellowL:'rgba(184,134,11,0.1)',
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
function Inp({ label, value, onChange, type='text', placeholder='', required }) {
  return (
    <div style={{ marginBottom:14 }}>
      {label && <div style={{ fontSize:11, color:C.muted, marginBottom:5, textTransform:'uppercase', letterSpacing:'0.5px' }}>{label}{required&&<span style={{color:C.red}}> *</span>}</div>}
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{ width:'100%', padding:'9px 12px', border:'1px solid '+C.border, borderRadius:8, fontSize:13, fontFamily:F.sans, boxSizing:'border-box', outline:'none' }} />
    </div>
  )
}
function Modal({ title, onClose, children, wide }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }} onClick={onClose}>
      <div style={{ background:C.card, borderRadius:16, padding:28, maxWidth:wide?700:480, width:'100%', maxHeight:'85vh', overflowY:'auto' }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div style={{ fontFamily:F.serif, fontSize:22, color:C.text }}>{title}</div>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:C.muted }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 9. PRODUCT MANAGER — full CRUD without Supabase access
// ═══════════════════════════════════════════════════════════════
export function ProductManager() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [saving, setSaving] = useState(false)

  const CATEGORIES = ['spirits','beer','wine','champagne','soft_drinks','water','snacks','ice','tobacco','accessories']
  const EMPTY = { name:'', price:'', category:'spirits', emoji:'🥃', description:'', stock_quantity:999, is_active:true, age_restricted:false, popular:false, sub:'' }

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('products').select('*').order('category').order('name')
    setProducts(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const save = async () => {
    if (!editing.name || !editing.price) return
    setSaving(true)
    const payload = { ...editing, price: parseFloat(editing.price)||0, stock_quantity: parseInt(editing.stock_quantity)||0 }
    if (editing.id) {
      await supabase.from('products').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('products').insert(payload)
    }
    setSaving(false)
    setEditing(null)
    load()
  }

  const toggleActive = async (id, val) => {
    await supabase.from('products').update({ is_active: val }).eq('id', id)
    setProducts(prev => prev.map(p => p.id===id ? {...p,is_active:val} : p))
  }

  const deleteProduct = async (id) => {
    if (!confirm('Delete this product?')) return
    await supabase.from('products').delete().eq('id', id)
    setProducts(prev => prev.filter(p=>p.id!==id))
  }

  const filtered = products.filter(p =>
    (catFilter==='all'||p.category===catFilter) &&
    (p.name?.toLowerCase().includes(search.toLowerCase()))
  )

  const stats = { total:products.length, active:products.filter(p=>p.is_active).length, lowStock:products.filter(p=>p.stock_quantity<10&&p.is_active).length }

  return (
    <div style={{ padding:20 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h2 style={{ fontFamily:F.serif, fontSize:26, margin:0 }}>Product Manager</h2>
          <div style={{ fontSize:13, color:C.muted, marginTop:2 }}>{stats.active} active · {stats.lowStock} low stock</div>
        </div>
        <Btn onClick={()=>setEditing({...EMPTY})}>+ Add product</Btn>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:20 }}>
        {[['📦',stats.total,'Total products',C.text],['✅',stats.active,'Active',C.green],['⚠️',stats.lowStock,'Low stock',C.red]].map(([icon,val,label,color])=>(
          <Card key={label} style={{padding:'14px 18px'}}>
            <div style={{display:'flex',justifyContent:'space-between'}}>
              <div><div style={{fontSize:24,fontWeight:700,color}}>{val}</div><div style={{fontSize:12,color:C.muted,marginTop:4}}>{label}</div></div>
              <span style={{fontSize:24}}>{icon}</span>
            </div>
          </Card>
        ))}
      </div>

      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search products..."
          style={{ flex:1, minWidth:200, padding:'9px 14px', border:'1px solid '+C.border, borderRadius:8, fontSize:13, fontFamily:F.sans }} />
        <select value={catFilter} onChange={e=>setCatFilter(e.target.value)}
          style={{ padding:'9px 14px', border:'1px solid '+C.border, borderRadius:8, fontSize:13, fontFamily:F.sans }}>
          <option value="all">All categories</option>
          {CATEGORIES.map(c=><option key={c} value={c} style={{textTransform:'capitalize'}}>{c}</option>)}
        </select>
      </div>

      {loading ? <div style={{textAlign:'center',padding:40,color:C.muted}}>Loading products...</div>
      : (
        <Card>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ background:C.bg }}>
                {['','Product','Category','Price','Stock','Status',''].map((h,i)=>(
                  <th key={i} style={{ padding:'10px 14px', textAlign:'left', fontWeight:700, color:C.muted, fontSize:11, textTransform:'uppercase', borderBottom:'1px solid '+C.border }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p,i) => (
                <tr key={p.id} style={{ borderBottom:'0.5px solid '+C.border, background:i%2===0?'white':C.bg }}>
                  <td style={{ padding:'10px 14px', fontSize:22 }}>{p.emoji}</td>
                  <td style={{ padding:'10px 14px' }}>
                    <div style={{ fontWeight:600, color:C.text }}>{p.name}</div>
                    {p.age_restricted && <Badge label="18+" color={C.red} />}
                  </td>
                  <td style={{ padding:'10px 14px', color:C.muted, textTransform:'capitalize' }}>{p.category}</td>
                  <td style={{ padding:'10px 14px', fontWeight:700, color:C.green }}>€{parseFloat(p.price||0).toFixed(2)}</td>
                  <td style={{ padding:'10px 14px', color:p.stock_quantity<10?C.red:C.text, fontWeight:p.stock_quantity<10?700:400 }}>{p.stock_quantity}</td>
                  <td style={{ padding:'10px 14px' }}>
                    <button onClick={()=>toggleActive(p.id,!p.is_active)}
                      style={{ width:44, height:24, borderRadius:12, background:p.is_active?C.green:C.border, border:'none', cursor:'pointer', position:'relative', transition:'background 0.2s' }}>
                      <div style={{ width:20, height:20, borderRadius:'50%', background:'white', position:'absolute', top:2, left:p.is_active?22:2, transition:'left 0.2s' }}/>
                    </button>
                  </td>
                  <td style={{ padding:'10px 14px' }}>
                    <div style={{ display:'flex', gap:6 }}>
                      <Btn onClick={()=>setEditing({...p,price:p.price?.toString()})} outline color={C.blue} style={{fontSize:11,padding:'4px 10px'}}>Edit</Btn>
                      <Btn onClick={()=>deleteProduct(p.id)} outline color={C.red} style={{fontSize:11,padding:'4px 10px'}}>Del</Btn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {editing && (
        <Modal title={editing.id ? 'Edit product' : 'Add product'} onClose={()=>setEditing(null)} wide>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <div>
              <Inp label="Product name" value={editing.name} onChange={v=>setEditing(p=>({...p,name:v}))} required />
              <Inp label="Price (€)" type="number" value={editing.price} onChange={v=>setEditing(p=>({...p,price:v}))} required />
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:11, color:C.muted, marginBottom:5, textTransform:'uppercase' }}>Category</div>
                <select value={editing.category} onChange={e=>setEditing(p=>({...p,category:e.target.value}))}
                  style={{ width:'100%', padding:'9px 12px', border:'1px solid '+C.border, borderRadius:8, fontSize:13, fontFamily:F.sans }}>
                  {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <Inp label="Emoji" value={editing.emoji} onChange={v=>setEditing(p=>({...p,emoji:v}))} />
              <Inp label="Sub-category" value={editing.sub||''} onChange={v=>setEditing(p=>({...p,sub:v}))} placeholder="e.g. red_wine, lager" />
            </div>
            <div>
              <Inp label="Stock quantity" type="number" value={editing.stock_quantity?.toString()} onChange={v=>setEditing(p=>({...p,stock_quantity:parseInt(v)||0}))} />
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:11, color:C.muted, marginBottom:5, textTransform:'uppercase' }}>Description</div>
                <textarea value={editing.description||''} onChange={e=>setEditing(p=>({...p,description:e.target.value}))} rows={4} placeholder="Product description..."
                  style={{ width:'100%', padding:'9px 12px', border:'1px solid '+C.border, borderRadius:8, fontSize:13, fontFamily:F.sans, resize:'vertical', boxSizing:'border-box' }} />
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:16 }}>
                {[['is_active','Active (visible to customers)'],['age_restricted','Age restricted (18+)'],['popular','Mark as popular']].map(([k,label])=>(
                  <label key={k} style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', fontSize:13 }}>
                    <input type="checkbox" checked={!!editing[k]} onChange={e=>setEditing(p=>({...p,[k]:e.target.checked}))} style={{ width:16, height:16, accentColor:C.accent }} />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display:'flex', gap:10, marginTop:8 }}>
            <Btn onClick={save} disabled={saving||!editing.name||!editing.price} color={C.green} style={{flex:1,justifyContent:'center'}}>
              {saving?'Saving...':'Save product'}
            </Btn>
            <Btn onClick={()=>setEditing(null)} outline color={C.muted}>Cancel</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 10. FLASH SALE CREATOR — no more SQL
// ═══════════════════════════════════════════════════════════════
export function FlashSaleCreator() {
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ title:'⚡ Flash Sale', description:'', discount_pct:20, category:'all', hours:4, active:true })

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('flash_sales').select('*').order('created_at',{ascending:false})
    setSales(data||[])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const create = async () => {
    if (!form.description) return
    await supabase.from('flash_sales').insert({
      title: form.title, description: form.description, discount_pct: form.discount_pct,
      category: form.category === 'all' ? null : form.category,
      active: true, ends_at: new Date(Date.now() + form.hours*3600000).toISOString()
    })
    setCreating(false)
    setForm({ title:'⚡ Flash Sale', description:'', discount_pct:20, category:'all', hours:4, active:true })
    load()
  }

  const toggle = async (id, active) => {
    await supabase.from('flash_sales').update({ active }).eq('id', id)
    setSales(prev=>prev.map(s=>s.id===id?{...s,active}:s))
  }

  const CATS = ['all','spirits','beer','wine','champagne','soft_drinks','snacks','water','ice']

  const timeLeft = (ends) => {
    const diff = new Date(ends) - new Date()
    if (diff <= 0) return 'Expired'
    const h = Math.floor(diff/3600000)
    const m = Math.floor((diff%3600000)/60000)
    return h+'h '+m+'m remaining'
  }

  return (
    <div style={{ padding:20 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h2 style={{ fontFamily:F.serif, fontSize:26, margin:0 }}>Flash Sale Creator</h2>
          <div style={{ fontSize:13, color:C.muted }}>Create live countdown sales for the customer app</div>
        </div>
        <Btn onClick={()=>setCreating(true)}>+ Create flash sale</Btn>
      </div>

      {creating && (
        <Card style={{ padding:20, marginBottom:20, borderLeft:'4px solid '+C.accent }}>
          <div style={{ fontFamily:F.serif, fontSize:18, marginBottom:16 }}>New flash sale</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <Inp label="Title" value={form.title} onChange={v=>setForm(p=>({...p,title:v}))} />
            <Inp label="Description shown to customers" value={form.description} onChange={v=>setForm(p=>({...p,description:v}))} placeholder="20% off all beer tonight!" required />
            <div>
              <div style={{ fontSize:11, color:C.muted, marginBottom:5, textTransform:'uppercase' }}>Discount %</div>
              <div style={{ display:'flex', gap:6 }}>
                {[10,15,20,25,30,50].map(n=>(
                  <button key={n} onClick={()=>setForm(p=>({...p,discount_pct:n}))}
                    style={{ padding:'6px 12px', borderRadius:8, border:'1px solid '+(form.discount_pct===n?C.accent:C.border), background:form.discount_pct===n?C.accentL:'transparent', color:form.discount_pct===n?C.accent:C.text, cursor:'pointer', fontSize:13, fontWeight:form.discount_pct===n?700:400 }}>
                    {n}%
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize:11, color:C.muted, marginBottom:5, textTransform:'uppercase' }}>Category</div>
              <select value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))}
                style={{ width:'100%', padding:'9px 12px', border:'1px solid '+C.border, borderRadius:8, fontSize:13, fontFamily:F.sans }}>
                {CATS.map(c=><option key={c} value={c} style={{textTransform:'capitalize'}}>{c==='all'?'All products':c}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize:11, color:C.muted, marginBottom:5, textTransform:'uppercase' }}>Duration</div>
              <div style={{ display:'flex', gap:6 }}>
                {[1,2,4,6,12,24].map(h=>(
                  <button key={h} onClick={()=>setForm(p=>({...p,hours:h}))}
                    style={{ padding:'6px 10px', borderRadius:8, border:'1px solid '+(form.hours===h?C.accent:C.border), background:form.hours===h?C.accentL:'transparent', color:form.hours===h?C.accent:C.text, cursor:'pointer', fontSize:12, fontWeight:form.hours===h?700:400 }}>
                    {h}h
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display:'flex', gap:10, marginTop:16 }}>
            <Btn onClick={create} disabled={!form.description} color={C.accent} style={{flex:1,justifyContent:'center'}}>🚀 Launch flash sale</Btn>
            <Btn onClick={()=>setCreating(false)} outline color={C.muted}>Cancel</Btn>
          </div>
        </Card>
      )}

      {loading ? <div style={{textAlign:'center',padding:32,color:C.muted}}>Loading...</div>
      : sales.map(s => (
        <Card key={s.id} style={{ padding:16, marginBottom:10, borderLeft:'3px solid '+(s.active&&new Date(s.ends_at)>new Date()?C.accent:C.border) }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div>
              <div style={{ fontWeight:700, fontSize:15, color:C.text }}>{s.title}</div>
              <div style={{ fontSize:13, color:C.muted, marginTop:2 }}>{s.description}</div>
              <div style={{ display:'flex', gap:10, marginTop:6, fontSize:12 }}>
                <Badge label={s.discount_pct+'% off'} color={C.accent} />
                <Badge label={s.category||'all products'} color={C.blue} />
                <span style={{ color:new Date(s.ends_at)>new Date()?C.green:C.red, fontWeight:600 }}>{timeLeft(s.ends_at)}</span>
              </div>
            </div>
            <button onClick={()=>toggle(s.id,!s.active)}
              style={{ width:44, height:24, borderRadius:12, background:s.active?C.green:C.border, border:'none', cursor:'pointer', position:'relative', flexShrink:0 }}>
              <div style={{ width:20, height:20, borderRadius:'50%', background:'white', position:'absolute', top:2, left:s.active?22:2, transition:'left 0.2s' }}/>
            </button>
          </div>
        </Card>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 11. APP ANNOUNCEMENT MANAGER — push banners from ops
// ═══════════════════════════════════════════════════════════════
export function AnnouncementManager() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState({ title:'', body:'', type:'info', active:true, cta:'', cta_action:'' })
  const [adding, setAdding] = useState(false)
  const [loading, setLoading] = useState(true)

  const TYPES = [
    { id:'info', label:'Info', color:C.blue },
    { id:'promo', label:'Promotion', color:C.green },
    { id:'urgent', label:'Urgent', color:C.red },
    { id:'new', label:'New feature', color:C.accent },
  ]

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('app_announcements').select('*').order('created_at',{ascending:false})
    setItems(data||[])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const publish = async () => {
    if (!form.title||!form.body) return
    await supabase.from('app_announcements').insert({ ...form })
    setAdding(false)
    setForm({ title:'', body:'', type:'info', active:true, cta:'', cta_action:'' })
    load()
  }

  const toggle = async (id, active) => {
    await supabase.from('app_announcements').update({ active }).eq('id', id)
    setItems(prev=>prev.map(i=>i.id===id?{...i,active}:i))
  }

  const del = async (id) => {
    await supabase.from('app_announcements').delete().eq('id', id)
    setItems(prev=>prev.filter(i=>i.id!==id))
  }

  return (
    <div style={{ padding:20 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h2 style={{ fontFamily:F.serif, fontSize:26, margin:0 }}>App Announcements</h2>
          <div style={{ fontSize:13, color:C.muted }}>Push banners to the customer app home screen</div>
        </div>
        <Btn onClick={()=>setAdding(true)}>+ New announcement</Btn>
      </div>

      {adding && (
        <Card style={{ padding:20, marginBottom:20 }}>
          <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
            <div style={{ flex:1, minWidth:200 }}>
              <Inp label="Title" value={form.title} onChange={v=>setForm(p=>({...p,title:v}))} required />
              <Inp label="Body text" value={form.body} onChange={v=>setForm(p=>({...p,body:v}))} required />
              <Inp label="CTA button text (optional)" value={form.cta} onChange={v=>setForm(p=>({...p,cta:v}))} placeholder="Shop now" />
              <Inp label="CTA action (category/url)" value={form.cta_action} onChange={v=>setForm(p=>({...p,cta_action:v}))} placeholder="beer / https://..." />
            </div>
            <div style={{ width:200 }}>
              <div style={{ fontSize:11, color:C.muted, marginBottom:8, textTransform:'uppercase' }}>Type</div>
              {TYPES.map(t => (
                <button key={t.id} onClick={()=>setForm(p=>({...p,type:t.id}))}
                  style={{ display:'block', width:'100%', padding:'8px 12px', marginBottom:6, background:form.type===t.id?t.color+'18':'transparent', border:'1px solid '+(form.type===t.id?t.color:C.border), borderRadius:8, color:form.type===t.id?t.color:C.text, cursor:'pointer', textAlign:'left', fontSize:13, fontWeight:form.type===t.id?700:400 }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display:'flex', gap:8, marginTop:10 }}>
            <Btn onClick={publish} disabled={!form.title||!form.body} color={C.accent} style={{flex:1,justifyContent:'center'}}>Publish</Btn>
            <Btn onClick={()=>setAdding(false)} outline color={C.muted}>Cancel</Btn>
          </div>
        </Card>
      )}

      {loading ? <div style={{textAlign:'center',padding:32,color:C.muted}}>Loading...</div>
      : items.map(item => {
        const tc = TYPES.find(t=>t.id===item.type)||TYPES[0]
        return (
          <Card key={item.id} style={{ padding:16, marginBottom:10, borderLeft:'3px solid '+(item.active?tc.color:C.border) }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', gap:8, marginBottom:4 }}>
                  <Badge label={tc.label} color={tc.color} />
                  <span style={{ fontSize:14, fontWeight:700, color:C.text }}>{item.title}</span>
                </div>
                <div style={{ fontSize:13, color:C.muted }}>{item.body}</div>
                {item.cta && <div style={{ fontSize:11, color:C.blue, marginTop:4 }}>CTA: {item.cta} → {item.cta_action}</div>}
              </div>
              <div style={{ display:'flex', gap:8, alignItems:'center', marginLeft:12 }}>
                <button onClick={()=>toggle(item.id,!item.active)} style={{ width:44, height:24, borderRadius:12, background:item.active?C.green:C.border, border:'none', cursor:'pointer', position:'relative' }}>
                  <div style={{ width:20, height:20, borderRadius:'50%', background:'white', position:'absolute', top:2, left:item.active?22:2, transition:'left 0.2s' }}/>
                </button>
                <button onClick={()=>del(item.id)} style={{ background:'none', border:'none', color:C.red, cursor:'pointer', fontSize:18 }}>×</button>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 13. PUSH NOTIFICATION DELIVERY — OneSignal integration
// ═══════════════════════════════════════════════════════════════
export function PushDeliveryManager() {
  const [config, setConfig] = useState(() => {
    try { return JSON.parse(localStorage.getItem('onesignal_config')||'{}') } catch { return {} }
  })
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [target, setTarget] = useState('all')
  const [sending, setSending] = useState(false)
  const [history, setHistory] = useState([])
  const [tab, setTab] = useState('compose')

  useEffect(() => {
    supabase.from('push_notifications').select('*').order('created_at',{ascending:false}).limit(20)
      .then(r=>{ if(r.data) setHistory(r.data) })
  }, [])

  const saveConfig = () => {
    localStorage.setItem('onesignal_config', JSON.stringify(config))
    alert('Configuration saved!')
  }

  const send = async () => {
    if (!title||!body) return
    setSending(true)
    try {
      if (config.app_id && config.rest_key) {
        const resp = await fetch('https://onesignal.com/api/v1/notifications', {
          method:'POST',
          headers:{ 'Content-Type':'application/json', 'Authorization':'Basic '+config.rest_key },
          body: JSON.stringify({
            app_id: config.app_id,
            headings: { en:title },
            contents: { en:body },
            included_segments: target==='all' ? ['All'] : ['Active Users'],
          })
        })
        const result = await resp.json()
        if (result.id) {
          await supabase.from('push_notifications').insert({ title, body, target, status:'sent', onesignal_id:result.id, recipients:result.recipients||0 })
          alert('Sent to '+result.recipients+' devices!')
        } else {
          alert('Error: '+JSON.stringify(result.errors))
        }
      } else {
        await supabase.from('push_notifications').insert({ title, body, target, status:'logged' })
        alert('Logged (connect OneSignal to deliver to devices)')
      }
      setTitle(''); setBody('')
    } catch(e) { alert('Send failed: '+e.message) }
    setSending(false)
  }

  const TEMPLATES = [
    { label:'Flash sale', title:'⚡ Flash Sale!', body:'Limited time offer — order now for a special discount!' },
    { label:'Driver surge', title:'🔥 High demand tonight', body:'Surge pricing active. Order now before slots fill up!' },
    { label:'New products', title:'🆕 Just landed on Isla Drop', body:'Fresh arrivals now available — check the app!' },
    { label:'Win-back', title:'We miss you! 🌴', body:'Come back and get €5 off your next order with code COMEBACK5' },
  ]

  return (
    <div style={{ padding:20 }}>
      <h2 style={{ fontFamily:F.serif, fontSize:26, margin:'0 0 20px' }}>Push Notification Delivery</h2>
      <div style={{ display:'flex', gap:6, marginBottom:20 }}>
        {['compose','config','history'].map(t=>(
          <Btn key={t} onClick={()=>setTab(t)} outline={tab!==t} color={C.accent} style={{fontSize:12,padding:'7px 16px',textTransform:'capitalize'}}>{t}</Btn>
        ))}
      </div>

      {tab==='compose' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          <Card style={{ padding:20 }}>
            <Inp label="Title" value={title} onChange={setTitle} />
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:11, color:C.muted, marginBottom:5, textTransform:'uppercase' }}>Message</div>
              <textarea value={body} onChange={e=>setBody(e.target.value)} rows={4} placeholder="Notification message..."
                style={{ width:'100%', padding:'9px 12px', border:'1px solid '+C.border, borderRadius:8, fontSize:13, resize:'vertical', fontFamily:F.sans, boxSizing:'border-box' }} />
            </div>
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:11, color:C.muted, marginBottom:8, textTransform:'uppercase' }}>Target</div>
              {[['all','All users'],['active','Active users (7d)'],['dormant','Dormant users (14d+)']].map(([k,l])=>(
                <label key={k} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6, cursor:'pointer', fontSize:13 }}>
                  <input type="radio" name="target" value={k} checked={target===k} onChange={()=>setTarget(k)} style={{accentColor:C.accent}} /> {l}
                </label>
              ))}
            </div>
            {!config.app_id && (
              <div style={{ padding:'10px 12px', background:C.yellowL, border:'1px solid '+C.yellow+'40', borderRadius:8, fontSize:12, color:C.yellow, marginBottom:12 }}>
                ⚠️ OneSignal not configured — notifications will be logged only. Go to Config tab to connect.
              </div>
            )}
            <Btn onClick={send} disabled={sending||!title||!body} color={C.accent} style={{width:'100%',justifyContent:'center'}}>
              {sending?'Sending...':'📤 Send notification'}
            </Btn>
          </Card>
          <div>
            <Card style={{ padding:20 }}>
              <div style={{ fontSize:13, fontWeight:700, marginBottom:12 }}>Quick templates</div>
              {TEMPLATES.map(t=>(
                <button key={t.label} onClick={()=>{setTitle(t.title);setBody(t.body)}}
                  style={{ display:'block', width:'100%', padding:'10px 14px', background:C.bg, border:'1px solid '+C.border, borderRadius:8, textAlign:'left', cursor:'pointer', marginBottom:8, fontSize:13 }}>
                  <div style={{ fontWeight:600, color:C.text }}>{t.label}</div>
                  <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{t.title}</div>
                </button>
              ))}
            </Card>
          </div>
        </div>
      )}

      {tab==='config' && (
        <Card style={{ padding:24, maxWidth:500 }}>
          <div style={{ fontFamily:F.serif, fontSize:20, marginBottom:16 }}>OneSignal Configuration</div>
          <Inp label="OneSignal App ID" value={config.app_id||''} onChange={v=>setConfig(p=>({...p,app_id:v}))} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
          <Inp label="REST API Key" value={config.rest_key||''} onChange={v=>setConfig(p=>({...p,rest_key:v}))} placeholder="Your OneSignal REST API Key" />
          <div style={{ padding:'12px', background:C.blueL, borderRadius:8, fontSize:12, color:C.blue, marginBottom:16 }}>
            Get these from <strong>onesignal.com</strong> → Your App → Settings → Keys & IDs
          </div>
          <Btn onClick={saveConfig} color={C.green} style={{width:'100%',justifyContent:'center'}}>Save configuration</Btn>
        </Card>
      )}

      {tab==='history' && (
        <Card>
          {history.length===0 ? <div style={{padding:40,textAlign:'center',color:C.muted}}>No notifications sent yet</div>
          : history.map(n=>(
            <div key={n.id} style={{ padding:'12px 16px', borderBottom:'0.5px solid '+C.border }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <div style={{ fontWeight:600, fontSize:13 }}>{n.title}</div>
                <div style={{ display:'flex', gap:8 }}>
                  <Badge label={n.status} color={n.status==='sent'?C.green:C.muted} />
                  <span style={{ fontSize:11, color:C.muted }}>{new Date(n.created_at).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</span>
                </div>
              </div>
              <div style={{ fontSize:12, color:C.muted }}>{n.body}</div>
              {n.recipients && <div style={{ fontSize:11, color:C.green, marginTop:4 }}>Delivered to {n.recipients} devices</div>}
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 14. DRIVER ACCOUNT CREATOR — no Supabase access needed
// ═══════════════════════════════════════════════════════════════
export function DriverAccountCreator() {
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ full_name:'', email:'', phone:'', vehicle:'scooter' })
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('profiles').select('*').eq('role','driver').order('created_at',{ascending:false})
    setDrivers(data||[])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const createDriver = async () => {
    if (!form.full_name||!form.email) return
    setSaving(true)
    try {
      // Create auth user with random password (they'll reset via email)
      const tempPwd = Math.random().toString(36).slice(2,10)+'Aa1!'
      const { data, error } = await supabase.auth.admin.createUser({
        email: form.email, password: tempPwd,
        email_confirm: true,
        user_metadata: { full_name: form.full_name, role:'driver' }
      })
      if (error) throw error
      await supabase.from('profiles').upsert({
        id: data.user.id, full_name: form.full_name, role:'driver', status:'active',
        phone: form.phone, vehicle_type: form.vehicle
      }, { onConflict:'id' })
      setCreating(false)
      setForm({ full_name:'', email:'', phone:'', vehicle:'scooter' })
      load()
      alert('Driver account created! They can sign in at driver.isladrop.net with '+form.email)
    } catch(e) {
      alert('Could not create via admin API. Instead: have the driver sign up at driver.isladrop.net, then use the Approvals tab to activate them. Error: '+e.message)
    }
    setSaving(false)
  }

  const updateStatus = async (id, status) => {
    await supabase.from('profiles').update({ status }).eq('id', id)
    setDrivers(prev=>prev.map(d=>d.id===id?{...d,status}:d))
  }

  const statusColor = s => s==='active'?C.green:s==='blocked'?C.red:C.yellow

  return (
    <div style={{ padding:20 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h2 style={{ fontFamily:F.serif, fontSize:26, margin:0 }}>Driver Accounts</h2>
          <div style={{ fontSize:13, color:C.muted }}>{drivers.filter(d=>d.status==='active').length} active drivers</div>
        </div>
        <Btn onClick={()=>setCreating(true)}>+ Add driver</Btn>
      </div>

      {creating && (
        <Card style={{ padding:20, marginBottom:20 }}>
          <div style={{ fontFamily:F.serif, fontSize:18, marginBottom:16 }}>Create driver account</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <Inp label="Full name" value={form.full_name} onChange={v=>setForm(p=>({...p,full_name:v}))} required />
            <Inp label="Email address" type="email" value={form.email} onChange={v=>setForm(p=>({...p,email:v}))} required />
            <Inp label="Phone number" value={form.phone} onChange={v=>setForm(p=>({...p,phone:v}))} />
            <div>
              <div style={{ fontSize:11, color:C.muted, marginBottom:5, textTransform:'uppercase' }}>Vehicle type</div>
              <select value={form.vehicle} onChange={e=>setForm(p=>({...p,vehicle:e.target.value}))}
                style={{ width:'100%', padding:'9px 12px', border:'1px solid '+C.border, borderRadius:8, fontSize:13, fontFamily:F.sans }}>
                <option value="scooter">🛵 Scooter</option>
                <option value="motorcycle">🏍️ Motorcycle</option>
                <option value="car">🚗 Car</option>
                <option value="ebike">🚲 E-Bike</option>
              </select>
            </div>
          </div>
          <div style={{ display:'flex', gap:8, marginTop:16 }}>
            <Btn onClick={createDriver} disabled={saving||!form.full_name||!form.email} color={C.green} style={{flex:1,justifyContent:'center'}}>
              {saving?'Creating...':'Create account'}
            </Btn>
            <Btn onClick={()=>setCreating(false)} outline color={C.muted}>Cancel</Btn>
          </div>
        </Card>
      )}

      {loading ? <div style={{textAlign:'center',padding:32,color:C.muted}}>Loading drivers...</div>
      : (
        <Card>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ background:C.bg }}>
                {['Driver','Email','Vehicle','Status','Joined','Actions'].map(h=>(
                  <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontWeight:700, color:C.muted, fontSize:11, textTransform:'uppercase', borderBottom:'1px solid '+C.border }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {drivers.map((d,i) => (
                <tr key={d.id} style={{ borderBottom:'0.5px solid '+C.border, background:i%2===0?'white':C.bg }}>
                  <td style={{ padding:'10px 14px', fontWeight:600, color:C.text }}>{d.full_name||'—'}</td>
                  <td style={{ padding:'10px 14px', color:C.muted }}>{d.id.slice(0,12)}...</td>
                  <td style={{ padding:'10px 14px', textTransform:'capitalize' }}>{d.vehicle_type||'scooter'}</td>
                  <td style={{ padding:'10px 14px' }}><Badge label={d.status||'pending'} color={statusColor(d.status)} /></td>
                  <td style={{ padding:'10px 14px', color:C.muted }}>{new Date(d.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</td>
                  <td style={{ padding:'10px 14px' }}>
                    <div style={{ display:'flex', gap:6 }}>
                      {d.status!=='active' && <Btn onClick={()=>updateStatus(d.id,'active')} color={C.green} style={{fontSize:11,padding:'4px 10px'}}>Activate</Btn>}
                      {d.status!=='blocked' && <Btn onClick={()=>updateStatus(d.id,'blocked')} outline color={C.red} style={{fontSize:11,padding:'4px 10px'}}>Block</Btn>}
                    </div>
                  </td>
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
// 15. ZONE FEE MANAGER — cross-linked to live checkout
// ═══════════════════════════════════════════════════════════════
export function LiveZoneManager() {
  const [zones, setZones] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('delivery_zones').select('*').order('name')
    if (data && data.length > 0) { setZones(data); setLoading(false); return }
    // Seed default zones if none exist
    const defaults = [
      { name:'Ibiza Town', active:true, min_order:15, delivery_fee:2.50, eta_mins:20 },
      { name:'San Antonio', active:true, min_order:20, delivery_fee:3.50, eta_mins:30 },
      { name:'Playa den Bossa', active:true, min_order:20, delivery_fee:3.00, eta_mins:25 },
      { name:'Santa Eulalia', active:false, min_order:25, delivery_fee:4.00, eta_mins:40 },
      { name:'Talamanca', active:true, min_order:15, delivery_fee:2.00, eta_mins:15 },
      { name:'Marina Botafoch', active:true, min_order:15, delivery_fee:2.00, eta_mins:15 },
    ]
    const { data: seeded } = await supabase.from('delivery_zones').insert(defaults).select()
    setZones(seeded||defaults)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const save = async () => {
    if (!editing) return
    setSaving(true)
    if (editing.id) {
      await supabase.from('delivery_zones').update(editing).eq('id', editing.id)
    } else {
      await supabase.from('delivery_zones').insert(editing)
    }
    setSaving(false)
    setEditing(null)
    load()
  }

  const toggleZone = async (id, active) => {
    await supabase.from('delivery_zones').update({ active }).eq('id', id)
    setZones(prev=>prev.map(z=>z.id===id?{...z,active}:z))
  }

  return (
    <div style={{ padding:20 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h2 style={{ fontFamily:F.serif, fontSize:26, margin:0 }}>Zone Fee Manager</h2>
          <div style={{ fontSize:13, color:C.muted }}>Changes apply to customer checkout in real-time</div>
        </div>
        <Btn onClick={()=>setEditing({ name:'', active:true, min_order:20, delivery_fee:3.50, eta_mins:25 })}>+ Add zone</Btn>
      </div>

      <div style={{ padding:'10px 16px', background:C.blueL, border:'1px solid '+C.blue+'40', borderRadius:10, fontSize:13, color:C.blue, marginBottom:20 }}>
        🔗 <strong>Live-linked:</strong> Changes here instantly update the delivery fee and minimum order shown to customers at checkout. No code deployment needed.
      </div>

      {loading ? <div style={{textAlign:'center',padding:32,color:C.muted}}>Loading zones...</div>
      : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:12 }}>
          {zones.map(z => (
            <Card key={z.id||z.name} style={{ padding:18, opacity:z.active?1:0.6 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <div style={{ fontSize:15, fontWeight:700, color:C.text }}>📍 {z.name}</div>
                <button onClick={()=>toggleZone(z.id,!z.active)}
                  style={{ width:44, height:24, borderRadius:12, background:z.active?C.green:C.border, border:'none', cursor:'pointer', position:'relative' }}>
                  <div style={{ width:20, height:20, borderRadius:'50%', background:'white', position:'absolute', top:2, left:z.active?22:2, transition:'left 0.2s' }}/>
                </button>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:12 }}>
                {[['Min order','€'+z.min_order],['Delivery fee','€'+parseFloat(z.delivery_fee||0).toFixed(2)],['ETA',z.eta_mins+'min']].map(([l,v])=>(
                  <div key={l} style={{ background:C.bg, borderRadius:8, padding:'8px 10px', textAlign:'center' }}>
                    <div style={{ fontSize:15, fontWeight:700, color:C.text }}>{v}</div>
                    <div style={{ fontSize:10, color:C.muted, textTransform:'uppercase', marginTop:2 }}>{l}</div>
                  </div>
                ))}
              </div>
              <Btn onClick={()=>setEditing({...z})} outline color={C.accent} style={{width:'100%',justifyContent:'center',fontSize:12}}>Edit zone</Btn>
            </Card>
          ))}
        </div>
      )}

      {editing && (
        <Modal title={(editing.id?'Edit':'Add')+' zone: '+(editing.name||'New zone')} onClose={()=>setEditing(null)}>
          <Inp label="Zone name" value={editing.name} onChange={v=>setEditing(p=>({...p,name:v}))} required />
          <Inp label="Minimum order (€)" type="number" value={editing.min_order?.toString()} onChange={v=>setEditing(p=>({...p,min_order:parseFloat(v)||0}))} />
          <Inp label="Delivery fee (€)" type="number" value={editing.delivery_fee?.toString()} onChange={v=>setEditing(p=>({...p,delivery_fee:parseFloat(v)||0}))} />
          <Inp label="ETA (minutes)" type="number" value={editing.eta_mins?.toString()} onChange={v=>setEditing(p=>({...p,eta_mins:parseInt(v)||0}))} />
          <div style={{ display:'flex', gap:8, marginTop:8 }}>
            <Btn onClick={save} disabled={saving||!editing.name} color={C.green} style={{flex:1,justifyContent:'center'}}>{saving?'Saving...':'Save zone'}</Btn>
            <Btn onClick={()=>setEditing(null)} outline color={C.muted}>Cancel</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}
