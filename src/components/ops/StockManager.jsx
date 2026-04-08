import { useState, useEffect, useCallback } from 'react'
import { PRODUCTS, CATEGORIES } from '../../lib/products'
import toast from 'react-hot-toast'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const VELOCITY_COLORS = {
  slow:     { bg:'rgba(200,200,200,0.15)', color:'#888',    label:'Slow'     },
  normal:   { bg:'rgba(43,122,139,0.15)',  color:'#2B7A8B', label:'Normal'   },
  fast:     { bg:'rgba(245,201,122,0.2)',  color:'#8B7020', label:'Fast'     },
  critical: { bg:'rgba(196,104,58,0.2)',   color:'#C4683A', label:'Critical' },
}

function pctColor(pct) {
  if (pct <= 0)  return '#C4683A'
  if (pct <= 15) return '#C4683A'
  if (pct <= 30) return '#E8A070'
  if (pct <= 50) return '#F5C97A'
  return '#7EE8A2'
}

function StockBar({ pct }) {
  const color = pctColor(pct)
  return (
    <div style={{ height:6, background:'rgba(0,0,0,0.08)', borderRadius:3, overflow:'hidden', minWidth:60 }}>
      <div style={{ height:'100%', width:`${Math.min(100,Math.max(0,pct))}%`, background:color, borderRadius:3, transition:'width 0.4s' }} />
    </div>
  )
}

// ── Seed stock from products catalogue ────────────────────────
async function seedStockFromProducts(supabase) {
  const rows = PRODUCTS.map(p => ({
    product_id:      p.id,
    product_name:    p.name,
    category:        p.category,
    current_qty:     50,
    min_qty:         5,
    max_qty:         100,
    reorder_point:   25,
    alert_threshold: p.popular ? 0.35 : 0.25,
    unit_cost:       p.price * 0.6,
    velocity:        p.popular ? 'fast' : 'normal',
  }))

  // Batch into chunks of 50 to avoid auth lock contention
  const CHUNK = 50
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK)
    const { error } = await supabase
      .from('stock')
      .upsert(chunk, { onConflict: 'product_id', ignoreDuplicates: true })
    if (error) return error
    // Small delay between batches to release the auth lock
    if (i + CHUNK < rows.length) {
      await new Promise(r => setTimeout(r, 300))
    }
  }
  return null
}

export default function StockManager() {
  const [stock, setStock]       = useState([])
  const [alerts, setAlerts]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(null)
  const [filter, setFilter]     = useState('all')
  const [search, setSearch]     = useState('')
  const [editing, setEditing]   = useState({}) // product_id -> field edits
  const [seeding, setSeeding]   = useState(false)
  const [analysing, setAnalysing] = useState(false)
  const [showAlerts, setShowAlerts] = useState(false)

  const loadStock = useCallback(async () => {
    try {
      const { supabase } = await import('../../lib/supabase')
      const [{ data: s }, { data: a }] = await Promise.all([
        supabase.from('stock').select('*').order('category').order('product_name'),
        supabase.from('stock_alerts').select('*').eq('resolved', false).order('created_at', { ascending: false }).limit(50),
      ])
      if (s) setStock(s)
      if (a) setAlerts(a)
    } catch (err) {
      console.error('Stock load error:', err)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadStock()
    // Real-time subscription
    const setup = async () => {
      const { supabase } = await import('../../lib/supabase')
      const sub = supabase.channel('stock-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'stock' }, loadStock)
        .subscribe()
      return () => supabase.removeChannel(sub)
    }
    setup()
    const interval = setInterval(loadStock, 60000)
    return () => clearInterval(interval)
  }, [loadStock])

  const saveEdit = async (productId, field, value) => {
    setSaving(productId + field)
    try {
      const { supabase } = await import('../../lib/supabase')
      const numVal = ['current_qty','min_qty','max_qty','reorder_point','unit_cost'].includes(field)
        ? parseFloat(value) || 0
        : field === 'alert_threshold' ? parseFloat(value) / 100 : value

      await supabase.from('stock').update({ [field]: numVal }).eq('product_id', productId)
      setStock(prev => prev.map(s => s.product_id === productId ? { ...s, [field]: numVal } : s))
      setEditing(prev => { const n = { ...prev }; delete n[productId + field]; return n })
      toast.success('Saved')
    } catch {
      toast.error('Save failed')
    }
    setSaving(null)
  }

  const handleSeed = async () => {
    setSeeding(true)
    const { supabase } = await import('../../lib/supabase')
    const err = await seedStockFromProducts(supabase)
    if (err) toast.error('Seed failed: ' + err.message)
    else { toast.success('Stock catalogue seeded!'); await loadStock() }
    setSeeding(false)
  }

  const runAIAnalysis = async () => {
    setAnalysing(true)
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/stock-manager`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_KEY}` },
        body: JSON.stringify({ type: 'analyse' }),
      })
      const data = await res.json()
      toast.success(`Analysis complete — ${data.alerts_sent} alert${data.alerts_sent !== 1 ? 's' : ''} sent`)
      await loadStock()
    } catch {
      toast.error('Analysis failed')
    }
    setAnalysing(false)
  }

  const restock = async (productId, qty) => {
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/stock-manager`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_KEY}` },
        body: JSON.stringify({ type: 'restock', product_id: productId, qty_added: qty }),
      })
      if ((await res.json()).success) { toast.success(`+${qty} units added`); loadStock() }
    } catch { toast.error('Restock failed') }
  }

  const resolveAlert = async (alertId) => {
    const { supabase } = await import('../../lib/supabase')
    await supabase.from('stock_alerts').update({ resolved: true }).eq('id', alertId)
    setAlerts(prev => prev.filter(a => a.id !== alertId))
  }

  // Filter and search
  const categories = ['all', ...new Set(stock.map(s => s.category))]
  const filtered = stock.filter(s => {
    const matchCat  = filter === 'all' || s.category === filter
    const matchLow  = filter === 'low' ? (s.current_qty / s.max_qty) <= s.alert_threshold : true
    const matchSrch = !search || s.product_name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchLow && matchSrch
  })

  // Stats
  const totalItems   = stock.length
  const lowItems     = stock.filter(s => s.max_qty > 0 && (s.current_qty / s.max_qty) <= s.alert_threshold).length
  const outOfStock   = stock.filter(s => s.current_qty === 0).length
  const totalValue   = stock.reduce((sum, s) => sum + (s.current_qty * (s.unit_cost || 0)), 0)
  const unresolvedAlerts = alerts.filter(a => !a.resolved).length

  const EditableCell = ({ productId, field, value, type = 'number', suffix = '' }) => {
    const key = productId + field
    const isEditing = editing[key] !== undefined
    const editVal = isEditing ? editing[key] : (type === 'number' ? (field === 'alert_threshold' ? Math.round(value * 100) : value) : value)

    return isEditing ? (
      <div style={{ display:'flex', alignItems:'center', gap:4 }}>
        <input
          type={type}
          value={editVal}
          autoFocus
          onChange={e => setEditing(prev => ({ ...prev, [key]: e.target.value }))}
          onBlur={() => saveEdit(productId, field, editVal)}
          onKeyDown={e => { if (e.key === 'Enter') saveEdit(productId, field, editVal); if (e.key === 'Escape') setEditing(prev => { const n={...prev}; delete n[key]; return n }) }}
          style={{ width: type === 'number' ? 60 : 80, padding:'3px 6px', borderRadius:6, border:'1.5px solid #2B7A8B', fontFamily:'DM Sans,sans-serif', fontSize:13, outline:'none', background:'white' }}
        />
        {suffix && <span style={{ fontSize:11, color:'#999' }}>{suffix}</span>}
        {saving === key && <span style={{ fontSize:10, color:'#2B7A8B' }}>...</span>}
      </div>
    ) : (
      <span
        onClick={() => setEditing(prev => ({ ...prev, [key]: editVal }))}
        style={{ cursor:'pointer', padding:'2px 6px', borderRadius:4, border:'1px dashed transparent', fontSize:13, fontFamily:'DM Sans,sans-serif' }}
        onMouseEnter={e => e.target.style.borderColor='#2B7A8B'}
        onMouseLeave={e => e.target.style.borderColor='transparent'}
      >
        {type === 'number' ? (field === 'alert_threshold' ? `${Math.round((value||0)*100)}%` : (value ?? 0)) : (value || '—')}
        {suffix && !isEditing && <span style={{ fontSize:10, color:'#999', marginLeft:2 }}>{suffix}</span>}
      </span>
    )
  }

  if (loading) return (
    <div style={{ textAlign:'center', padding:60, color:'#7A6E60' }}>
      <div style={{ fontSize:32, marginBottom:12 }}>📦</div>
      Loading stock data...
    </div>
  )

  if (stock.length === 0) return (
    <div style={{ textAlign:'center', padding:60 }}>
      <div style={{ fontSize:48, marginBottom:16 }}>📦</div>
      <div style={{ fontFamily:'DM Serif Display,serif', fontSize:22, color:'#0D3B4A', marginBottom:8 }}>No stock data yet</div>
      <div style={{ fontSize:14, color:'#7A6E60', marginBottom:24 }}>Seed the database with all products from the catalogue to get started.</div>
      <button onClick={handleSeed} disabled={seeding}
        style={{ padding:'12px 28px', background:'#0D3B4A', color:'white', border:'none', borderRadius:10, fontFamily:'DM Sans,sans-serif', fontSize:14, cursor:'pointer' }}>
        {seeding ? 'Seeding...' : '🌱 Seed Stock Catalogue'}
      </button>
    </div>
  )

  return (
    <div>
      {/* Header stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:16 }}>
        {[
          { label:'Total SKUs',    value:totalItems,                            color:'#0D3B4A' },
          { label:'Low Stock',     value:lowItems,    click:()=>setFilter('low'), color: lowItems>0?'#8B7020':'#5A6B3A', alert:lowItems>0 },
          { label:'Out of Stock',  value:outOfStock,                            color: outOfStock>0?'#C4683A':'#5A6B3A' },
          { label:'Stock Value',   value:`€${totalValue.toLocaleString('en',{maximumFractionDigits:0})}`, color:'#0D3B4A' },
        ].map(s => (
          <div key={s.label} onClick={s.click} style={{ background:'white', borderRadius:12, padding:'12px 14px', border:`0.5px solid ${s.alert?'rgba(196,104,58,0.3)':'rgba(42,35,24,0.1)'}`, cursor:s.click?'pointer':'default', transition:'transform 0.1s' }}>
            <div style={{ fontSize:22, fontWeight:600, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:11, color:'#7A6E60', marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Unresolved alerts banner */}
      {unresolvedAlerts > 0 && (
        <div onClick={() => setShowAlerts(true)} style={{ background:'rgba(196,104,58,0.12)', border:'0.5px solid rgba(196,104,58,0.3)', borderRadius:10, padding:'10px 14px', marginBottom:14, cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}>
          <span>⚠️</span>
          <span style={{ fontSize:13, fontFamily:'DM Sans,sans-serif', color:'#C4683A', fontWeight:500 }}>{unresolvedAlerts} unresolved stock alert{unresolvedAlerts>1?'s':''} — tap to review</span>
          <svg style={{ marginLeft:'auto' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C4683A" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
        </div>
      )}

      {/* Alerts panel */}
      {showAlerts && (
        <div style={{ background:'white', borderRadius:12, padding:16, marginBottom:16, border:'0.5px solid rgba(42,35,24,0.1)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <div style={{ fontWeight:600, color:'#0D3B4A', fontFamily:'DM Sans,sans-serif' }}>Active Stock Alerts</div>
            <button onClick={() => setShowAlerts(false)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:18, color:'#7A6E60' }}>✕</button>
          </div>
          {alerts.filter(a=>!a.resolved).map(a => (
            <div key={a.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'0.5px solid #f0e8e0' }}>
              <span style={{ fontSize:16 }}>{a.alert_type==='out_of_stock'?'🚨':a.alert_type==='critical'?'⚠️':'⚡'}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:500, color:'#2A2318' }}>{a.product_name}</div>
                <div style={{ fontSize:11, color:'#7A6E60' }}>{a.message} · {new Date(a.created_at).toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' })}</div>
              </div>
              <button onClick={() => resolveAlert(a.id)} style={{ padding:'5px 10px', background:'rgba(90,107,58,0.1)', border:'0.5px solid rgba(90,107,58,0.3)', borderRadius:6, fontSize:11, color:'#5A6B3A', cursor:'pointer' }}>Resolve</button>
            </div>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap', alignItems:'center' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." style={{ flex:1, minWidth:140, padding:'8px 12px', border:'0.5px solid rgba(42,35,24,0.15)', borderRadius:8, fontFamily:'DM Sans,sans-serif', fontSize:13, outline:'none', background:'white' }} />
        <select value={filter} onChange={e=>setFilter(e.target.value)} style={{ padding:'8px 12px', border:'0.5px solid rgba(42,35,24,0.15)', borderRadius:8, fontFamily:'DM Sans,sans-serif', fontSize:13, background:'white', cursor:'pointer' }}>
          <option value="all">All categories</option>
          <option value="low">⚠️ Low stock only</option>
          {[...new Set(stock.map(s=>s.category))].sort().map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={runAIAnalysis} disabled={analysing} style={{ padding:'8px 14px', background:'#0D3B4A', color:'white', border:'none', borderRadius:8, fontFamily:'DM Sans,sans-serif', fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', gap:5, whiteSpace:'nowrap' }}>
          {analysing ? '⏳ Analysing...' : '🤖 AI Analysis'}
        </button>
        <button onClick={handleSeed} disabled={seeding} style={{ padding:'8px 14px', background:'rgba(42,35,24,0.08)', border:'0.5px solid rgba(42,35,24,0.15)', borderRadius:8, fontFamily:'DM Sans,sans-serif', fontSize:12, cursor:'pointer', whiteSpace:'nowrap' }}>
          {seeding ? 'Seeding...' : '🌱 Seed/Refresh'}
        </button>
      </div>

      {/* Legend */}
      <div style={{ display:'flex', gap:12, marginBottom:10, fontSize:11, color:'#7A6E60', flexWrap:'wrap' }}>
        <span>Click any value to edit inline</span>
        <span>·</span>
        <span style={{ color:'#7EE8A2' }}>■ Good</span>
        <span style={{ color:'#F5C97A' }}>■ 50%</span>
        <span style={{ color:'#E8A070' }}>■ 30%</span>
        <span style={{ color:'#C4683A' }}>■ Critical</span>
      </div>

      {/* Stock table */}
      <div style={{ background:'white', borderRadius:12, overflow:'hidden', border:'0.5px solid rgba(42,35,24,0.1)' }}>
        {/* Table header */}
        <div style={{ display:'grid', gridTemplateColumns:'2fr 80px 80px 80px 80px 70px 70px 70px 60px', gap:0, background:'#f5f0e8', padding:'8px 12px', fontSize:11, fontWeight:600, color:'#7A6E60', textTransform:'uppercase', letterSpacing:'0.5px' }}>
          <span>Product</span>
          <span style={{ textAlign:'center' }}>Stock</span>
          <span style={{ textAlign:'center' }}>Level</span>
          <span style={{ textAlign:'center' }}>Min</span>
          <span style={{ textAlign:'center' }}>Max</span>
          <span style={{ textAlign:'center' }}>Alert%</span>
          <span style={{ textAlign:'center' }}>Sold/wk</span>
          <span style={{ textAlign:'center' }}>Speed</span>
          <span style={{ textAlign:'center' }}>Action</span>
        </div>

        {/* Group by category */}
        {[...new Set(filtered.map(s => s.category))].map(cat => (
          <div key={cat}>
            <div style={{ background:'rgba(13,59,74,0.05)', padding:'6px 12px', fontSize:11, fontWeight:600, color:'#0D3B4A', textTransform:'uppercase', letterSpacing:'0.5px', borderTop:'0.5px solid rgba(42,35,24,0.08)' }}>
              {cat.replace(/_/g,' ')}
            </div>
            {filtered.filter(s => s.category === cat).map((s, idx) => {
              const pct = s.max_qty > 0 ? Math.round((s.current_qty / s.max_qty) * 100) : 0
              const isLow = pct <= (s.alert_threshold * 100)
              const vc = VELOCITY_COLORS[s.velocity] || VELOCITY_COLORS.normal
              return (
                <div key={s.product_id} style={{ display:'grid', gridTemplateColumns:'2fr 80px 80px 80px 80px 70px 70px 70px 60px', gap:0, padding:'7px 12px', background: isLow ? 'rgba(196,104,58,0.04)' : idx%2===0 ? 'white' : 'rgba(0,0,0,0.01)', borderBottom:'0.5px solid rgba(42,35,24,0.05)', alignItems:'center', borderLeft: isLow ? '3px solid #C4683A' : '3px solid transparent' }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:500, color:'#2A2318', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:180 }}>{s.product_name}</div>
                    <div style={{ fontSize:10, color:'#7A6E60' }}>{s.product_id}</div>
                  </div>
                  <div style={{ textAlign:'center' }}>
                    <EditableCell productId={s.product_id} field="current_qty" value={s.current_qty} />
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:3, alignItems:'center' }}>
                    <StockBar pct={pct} />
                    <span style={{ fontSize:10, fontWeight:600, color:pctColor(pct) }}>{pct}%</span>
                  </div>
                  <div style={{ textAlign:'center' }}>
                    <EditableCell productId={s.product_id} field="min_qty" value={s.min_qty} />
                  </div>
                  <div style={{ textAlign:'center' }}>
                    <EditableCell productId={s.product_id} field="max_qty" value={s.max_qty} />
                  </div>
                  <div style={{ textAlign:'center' }}>
                    <EditableCell productId={s.product_id} field="alert_threshold" value={s.alert_threshold} suffix="%" />
                  </div>
                  <div style={{ textAlign:'center', fontSize:13, color:'#2A2318' }}>{s.units_sold_week || 0}</div>
                  <div style={{ textAlign:'center' }}>
                    <span style={{ background:vc.bg, color:vc.color, borderRadius:10, padding:'2px 7px', fontSize:10, fontWeight:500 }}>{vc.label}</span>
                  </div>
                  <div style={{ textAlign:'center' }}>
                    <button onClick={() => restock(s.product_id, 50)} title="Quick restock +50"
                      style={{ padding:'4px 8px', background:'rgba(90,107,58,0.1)', border:'0.5px solid rgba(90,107,58,0.3)', borderRadius:6, fontSize:10, color:'#5A6B3A', cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
                      +50
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={{ textAlign:'center', padding:40, color:'#7A6E60', fontSize:14 }}>No products match your filter</div>
        )}
      </div>

      <div style={{ marginTop:12, fontSize:11, color:'#7A6E60', fontFamily:'DM Sans,sans-serif' }}>
        {filtered.length} of {totalItems} products shown · Last updated: {new Date().toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' })} · Auto-refreshes every 60s
      </div>
    </div>
  )
}
