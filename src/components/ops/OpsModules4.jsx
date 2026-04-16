import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../lib/store'

const C = {
  bg:'#F5F0E8', card:'#FFFFFF', accent:'#C4683A', accentL:'rgba(196,104,58,0.1)',
  green:'#1D9E75', greenL:'rgba(29,158,117,0.1)', blue:'#2B7A8B', blueL:'rgba(43,122,139,0.1)',
  red:'#C43A3A', redL:'rgba(196,58,58,0.1)', yellow:'#B8860B', yellowL:'rgba(184,134,11,0.1)',
  text:'#2A2318', muted:'#7A6E60', border:'rgba(42,35,24,0.12)',
  dark:{ bg:'#0D1117', card:'#161B22', border:'rgba(255,255,255,0.08)', text:'#E6EDF3', muted:'#7D8590', sidebar:'#010409' }
}
function Card({ children, style={} }) {
  return <div style={{ background:C.card, borderRadius:12, border:'0.5px solid '+C.border, ...style }}>{children}</div>
}
function Btn({ children, onClick, color=C.accent, outline, disabled, style={} }) {
  return <button onClick={onClick} disabled={disabled} style={{ padding:'9px 18px', background:outline?'transparent':disabled?C.border:color, border:outline?'1px solid '+color:'none', borderRadius:8, color:outline?color:'white', fontSize:13, fontWeight:600, cursor:disabled?'default':'pointer', opacity:disabled?0.5:1, fontFamily:'DM Sans,sans-serif', ...style }}>{children}</button>
}

// ═══════════════════════════════════════════════════════════════
// 10. GLOBAL SEARCH
// ═══════════════════════════════════════════════════════════════
export function GlobalSearch({ onNavigate }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const search = useCallback(async (q) => {
    if (!q.trim() || q.length < 2) { setResults(null); return }
    setLoading(true)
    const [ordersRes, customersRes, driversRes, productsRes] = await Promise.all([
      supabase.from('orders').select('id, order_number, status, total, created_at, delivery_address, profiles!orders_customer_id_fkey(full_name)')
        .or('order_number.ilike.%'+q+'%,delivery_address.ilike.%'+q+'%').limit(5),
      supabase.from('profiles').select('id, full_name, created_at').eq('role','customer').ilike('full_name','%'+q+'%').limit(5),
      supabase.from('profiles').select('id, full_name').eq('role','driver').ilike('full_name','%'+q+'%').limit(5),
      supabase.from('products').select('id, name, emoji, category, price').ilike('name','%'+q+'%').limit(5),
    ])
    setResults({
      orders: ordersRes.data || [],
      customers: customersRes.data || [],
      drivers: driversRes.data || [],
      products: productsRes.data || [],
    })
    setLoading(false)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => search(query), 300)
    return () => clearTimeout(t)
  }, [query, search])

  const total = results ? results.orders.length + results.customers.length + results.drivers.length + results.products.length : 0

  return (
    <div style={{ padding:20, maxWidth:700, margin:'0 auto' }}>
      <h2 style={{ fontFamily:'DM Serif Display,serif', fontSize:24, margin:'0 0 20px' }}>Global Search</h2>
      <div style={{ position:'relative', marginBottom:20 }}>
        <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', fontSize:18, color:C.muted }}>🔍</span>
        <input
          ref={inputRef}
          value={query}
          onChange={e=>setQuery(e.target.value)}
          placeholder="Search orders, customers, drivers, products..."
          style={{ width:'100%', padding:'14px 14px 14px 44px', border:'2px solid '+(query?C.accent:C.border), borderRadius:12, fontSize:16, boxSizing:'border-box', outline:'none', transition:'border-color 0.2s', fontFamily:'DM Sans,sans-serif' }}
        />
        {loading && <span style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', color:C.muted, fontSize:12 }}>Searching...</span>}
      </div>

      {!query && (
        <Card style={{ padding:48, textAlign:'center' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🔍</div>
          <div style={{ fontFamily:'DM Serif Display,serif', fontSize:20, marginBottom:8 }}>Search everything</div>
          <div style={{ fontSize:13, color:C.muted }}>Orders by number or address · Customers by name · Drivers · Products</div>
        </Card>
      )}

      {results && total === 0 && (
        <Card style={{ padding:32, textAlign:'center' }}>
          <div style={{ fontSize:13, color:C.muted }}>No results for "{query}"</div>
        </Card>
      )}

      {results && results.orders.length > 0 && (
        <Card style={{ marginBottom:12 }}>
          <div style={{ padding:'12px 16px', borderBottom:'1px solid '+C.border, fontSize:11, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:'0.6px' }}>📦 Orders ({results.orders.length})</div>
          {results.orders.map(o => (
            <div key={o.id} style={{ padding:'12px 16px', borderBottom:'0.5px solid '+C.border, display:'flex', justifyContent:'space-between', cursor:'pointer' }} onClick={()=>onNavigate&&onNavigate('intervene',o)}>
              <div>
                <div style={{ fontSize:13, fontWeight:700 }}>#{o.order_number||o.id.slice(0,6)} · {o.profiles?.full_name}</div>
                <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{o.delivery_address}</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:13, fontWeight:700, color:C.green }}>€{o.total?.toFixed(2)}</div>
                <div style={{ fontSize:11, color:C.muted }}>{o.status}</div>
              </div>
            </div>
          ))}
        </Card>
      )}

      {results && results.customers.length > 0 && (
        <Card style={{ marginBottom:12 }}>
          <div style={{ padding:'12px 16px', borderBottom:'1px solid '+C.border, fontSize:11, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:'0.6px' }}>👥 Customers ({results.customers.length})</div>
          {results.customers.map(c => (
            <div key={c.id} style={{ padding:'12px 16px', borderBottom:'0.5px solid '+C.border, display:'flex', justifyContent:'space-between', cursor:'pointer' }} onClick={()=>onNavigate&&onNavigate('customers')}>
              <div style={{ fontSize:13, fontWeight:700 }}>{c.full_name}</div>
              <div style={{ fontSize:11, color:C.muted }}>Since {new Date(c.created_at).toLocaleDateString('en-GB',{month:'short',year:'numeric'})}</div>
            </div>
          ))}
        </Card>
      )}

      {results && results.drivers.length > 0 && (
        <Card style={{ marginBottom:12 }}>
          <div style={{ padding:'12px 16px', borderBottom:'1px solid '+C.border, fontSize:11, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:'0.6px' }}>🛵 Drivers ({results.drivers.length})</div>
          {results.drivers.map(d => (
            <div key={d.id} style={{ padding:'12px 16px', borderBottom:'0.5px solid '+C.border, cursor:'pointer' }} onClick={()=>onNavigate&&onNavigate('scorecards')}>
              <div style={{ fontSize:13, fontWeight:700 }}>{d.full_name}</div>
            </div>
          ))}
        </Card>
      )}

      {results && results.products.length > 0 && (
        <Card style={{ marginBottom:12 }}>
          <div style={{ padding:'12px 16px', borderBottom:'1px solid '+C.border, fontSize:11, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:'0.6px' }}>📦 Products ({results.products.length})</div>
          {results.products.map(p => (
            <div key={p.id} style={{ padding:'12px 16px', borderBottom:'0.5px solid '+C.border, display:'flex', justifyContent:'space-between', cursor:'pointer' }} onClick={()=>onNavigate&&onNavigate('product_perf')}>
              <div style={{ fontSize:13, fontWeight:700 }}><span style={{ marginRight:8 }}>{p.emoji}</span>{p.name}</div>
              <div style={{ fontSize:13, color:C.green, fontWeight:700 }}>€{p.price?.toFixed(2)}</div>
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 11. EXPORT MANAGER — CSV/PDF export for every dataset
// ═══════════════════════════════════════════════════════════════
export function ExportManager() {
  const [exporting, setExporting] = useState(null)
  const [dateFrom, setDateFrom] = useState(() => { const d=new Date(); d.setDate(d.getDate()-30); return d.toISOString().slice(0,10) })
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0,10))
  const [log, setLog] = useState([])

  const exportCSV = (filename, headers, rows) => {
    const csv = [headers.join(','), ...rows.map(r => r.map(v=>('"'+(v||'').toString().replace(/"/g,'""')+'"')).join(','))].join('\n')
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href=url; a.download=filename+'.csv'; a.click()
    URL.revokeObjectURL(url)
    setLog(prev => [{ name:filename, time:new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}), rows:rows.length }, ...prev.slice(0,9)])
  }

  const run = async (type) => {
    setExporting(type)
    const from = new Date(dateFrom); from.setHours(0,0,0,0)
    const to = new Date(dateTo); to.setHours(23,59,59,999)
    try {
      switch(type) {
        case 'orders': {
          const { data } = await supabase.from('orders')
            .select('order_number, status, total, subtotal, created_at, delivery_address, profiles!orders_customer_id_fkey(full_name)')
            .gte('created_at',from.toISOString()).lte('created_at',to.toISOString()).order('created_at',{ascending:false})
          exportCSV('orders_'+dateFrom+'_'+dateTo,
            ['Order #','Status','Customer','Total','Subtotal','Address','Date'],
            (data||[]).map(o => [o.order_number||o.id?.slice(0,8), o.status, o.profiles?.full_name, o.total, o.subtotal, o.delivery_address, new Date(o.created_at).toLocaleDateString('en-GB')])
          ); break
        }
        case 'customers': {
          const { data } = await supabase.from('profiles').select('full_name, created_at, id').eq('role','customer').gte('created_at',from.toISOString()).lte('created_at',to.toISOString())
          exportCSV('customers_'+dateFrom+'_'+dateTo,
            ['Name','ID','Joined'],
            (data||[]).map(c => [c.full_name, c.id, new Date(c.created_at).toLocaleDateString('en-GB')])
          ); break
        }
        case 'drivers': {
          const { data } = await supabase.from('profiles').select('full_name, created_at, status').eq('role','driver')
          exportCSV('drivers_'+dateTo,
            ['Name','Status','Joined'],
            (data||[]).map(d => [d.full_name, d.status, new Date(d.created_at).toLocaleDateString('en-GB')])
          ); break
        }
        case 'revenue': {
          const { data } = await supabase.from('orders').select('order_number, total, created_at, status')
            .eq('status','delivered').gte('created_at',from.toISOString()).lte('created_at',to.toISOString())
          exportCSV('revenue_'+dateFrom+'_'+dateTo,
            ['Order #','Revenue','Date'],
            (data||[]).map(o => [o.order_number, o.total, new Date(o.created_at).toLocaleDateString('en-GB')])
          ); break
        }
        case 'products': {
          const { data } = await supabase.from('products').select('name, emoji, category, price, stock_quantity, is_active')
          exportCSV('products_'+dateTo,
            ['Name','Category','Price','Stock','Active'],
            (data||[]).map(p => [p.name, p.category, p.price, p.stock_quantity, p.is_active?'Yes':'No'])
          ); break
        }
        case 'compliance': {
          const { data } = await supabase.from('ops_activity_log').select('*').gte('created_at',from.toISOString()).lte('created_at',to.toISOString())
          exportCSV('compliance_log_'+dateFrom+'_'+dateTo,
            ['Action','Details','Date'],
            (data||[]).map(l => [l.action, l.details, new Date(l.created_at).toLocaleString('en-GB')])
          ); break
        }
        case 'earnings': {
          const { data } = await supabase.from('driver_earnings').select('*, profiles(full_name)').gte('created_at',from.toISOString()).lte('created_at',to.toISOString())
          exportCSV('driver_earnings_'+dateFrom+'_'+dateTo,
            ['Driver','Amount','Date'],
            (data||[]).map(e => [e.profiles?.full_name, e.amount, new Date(e.created_at).toLocaleDateString('en-GB')])
          ); break
        }
      }
    } catch (err) {
      alert('Export failed: ' + err.message)
    }
    setExporting(null)
  }

  const EXPORTS = [
    { id:'orders', icon:'📦', label:'Orders', desc:'All orders with status, customer, total and address' },
    { id:'revenue', icon:'💰', label:'Revenue', desc:'Delivered orders with revenue breakdown' },
    { id:'customers', icon:'👥', label:'Customers', desc:'Customer list with join dates' },
    { id:'drivers', icon:'🛵', label:'Drivers', desc:'Driver roster with status' },
    { id:'products', icon:'🛍', label:'Products', desc:'Full product catalogue with prices and stock' },
    { id:'earnings', icon:'💳', label:'Driver earnings', desc:'Driver payment records for payroll' },
    { id:'compliance', icon:'⚖️', label:'Compliance log', desc:'Full audit trail for regulatory purposes' },
  ]

  return (
    <div style={{ padding:20 }}>
      <h2 style={{ fontFamily:'DM Serif Display,serif', fontSize:24, margin:'0 0 20px' }}>Export Manager</h2>

      <Card style={{ padding:16, marginBottom:20 }}>
        <div style={{ fontSize:13, fontWeight:700, marginBottom:12 }}>Date range</div>
        <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
          <div>
            <div style={{ fontSize:11, color:C.muted, marginBottom:4 }}>From</div>
            <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} style={{ padding:'8px 12px', border:'1px solid '+C.border, borderRadius:8, fontSize:13 }} />
          </div>
          <div>
            <div style={{ fontSize:11, color:C.muted, marginBottom:4 }}>To</div>
            <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} style={{ padding:'8px 12px', border:'1px solid '+C.border, borderRadius:8, fontSize:13 }} />
          </div>
          <div style={{ display:'flex', gap:6, alignItems:'flex-end' }}>
            {[['Today',0],['7d',7],['30d',30],['90d',90]].map(([l,d]) => (
              <Btn key={l} onClick={()=>{ const f=new Date(); f.setDate(f.getDate()-d); setDateFrom(f.toISOString().slice(0,10)); setDateTo(new Date().toISOString().slice(0,10)) }}
                outline color={C.accent} style={{fontSize:12,padding:'8px 12px'}}>{l}</Btn>
            ))}
          </div>
        </div>
      </Card>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:12, marginBottom:24 }}>
        {EXPORTS.map(exp => (
          <Card key={exp.id} style={{ padding:18 }}>
            <div style={{ display:'flex', gap:12, alignItems:'flex-start', marginBottom:12 }}>
              <span style={{ fontSize:28 }}>{exp.icon}</span>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:C.text }}>{exp.label}</div>
                <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>{exp.desc}</div>
              </div>
            </div>
            <Btn onClick={()=>run(exp.id)} disabled={exporting===exp.id} color={C.accent} style={{width:'100%',justifyContent:'center'}}>
              {exporting===exp.id ? 'Exporting...' : '⬇ Export CSV'}
            </Btn>
          </Card>
        ))}
      </div>

      {log.length > 0 && (
        <Card style={{ padding:20 }}>
          <div style={{ fontSize:13, fontWeight:700, marginBottom:12 }}>Recent exports</div>
          {log.map((l,i) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'0.5px solid '+C.border, fontSize:12 }}>
              <span style={{ fontWeight:600 }}>{l.name}.csv</span>
              <span style={{ color:C.muted }}>{l.rows} rows · {l.time}</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 12. OPS SETTINGS — dark mode, language, keyboard shortcuts
// ═══════════════════════════════════════════════════════════════
export function OpsSettings({ onDarkMode }) {
  const profile = useAuthStore(s=>s.profile)
  const [settings, setSettings] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ops_settings')||'{}') } catch { return {} }
  })
  const [saved, setSaved] = useState(false)

  const update = (key, val) => {
    const next = { ...settings, [key]:val }
    setSettings(next)
    localStorage.setItem('ops_settings', JSON.stringify(next))
    if (key==='darkMode') onDarkMode?.(val)
  }

  const save = () => { setSaved(true); setTimeout(()=>setSaved(false),2000) }

  const SHORTCUTS = [
    ['G then O', 'Go to Overview'],
    ['G then D', 'Go to Dispatch Board'],
    ['G then A', 'Go to Analytics'],
    ['G then C', 'Go to Customer Service'],
    ['G then S', 'Go to SLA Alerts'],
    ['/', 'Open Global Search'],
    ['Escape', 'Close modal / overlay'],
    ['R', 'Refresh current tab'],
  ]

  const LANGS = [
    { code:'en', label:'English', flag:'🇬🇧' },
    { code:'es', label:'Español', flag:'🇪🇸' },
    { code:'de', label:'Deutsch', flag:'🇩🇪' },
    { code:'fr', label:'Français', flag:'🇫🇷' },
    { code:'it', label:'Italiano', flag:'🇮🇹' },
  ]

  return (
    <div style={{ padding:20, maxWidth:700 }}>
      <h2 style={{ fontFamily:'DM Serif Display,serif', fontSize:24, margin:'0 0 24px' }}>Ops Dashboard Settings</h2>

      <Card style={{ padding:20, marginBottom:16 }}>
        <div style={{ fontSize:14, fontWeight:700, marginBottom:16 }}>Account</div>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ width:56, height:56, borderRadius:'50%', background:C.accentL, border:'2px solid '+C.accent, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, fontWeight:700, color:C.accent }}>
            {profile?.full_name?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:C.text }}>{profile?.full_name || 'Ops Manager'}</div>
            <div style={{ fontSize:13, color:C.muted, marginTop:2 }}>{profile?.role} · Isla Drop</div>
          </div>
        </div>
      </Card>

      <Card style={{ padding:20, marginBottom:16 }}>
        <div style={{ fontSize:14, fontWeight:700, marginBottom:16 }}>Appearance</div>
        {[
          { key:'darkMode', label:'Dark mode', desc:'Easy on the eyes for late-night ops' },
          { key:'compactSidebar', label:'Compact sidebar', desc:'Collapse sidebar to icons only by default' },
          { key:'soundAlerts', label:'Sound alerts', desc:'Play a sound when SLA breaches occur' },
          { key:'desktopNotifs', label:'Desktop notifications', desc:'Get notified of new orders even when tab is inactive' },
        ].map(opt => (
          <div key={opt.key} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0', borderBottom:'0.5px solid '+C.border }}>
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:C.text }}>{opt.label}</div>
              <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>{opt.desc}</div>
            </div>
            <button onClick={()=>update(opt.key, !settings[opt.key])}
              style={{ width:44, height:24, borderRadius:12, background:settings[opt.key]?C.green:C.border, border:'none', cursor:'pointer', position:'relative', transition:'background 0.2s', flexShrink:0 }}>
              <div style={{ width:20, height:20, borderRadius:'50%', background:'white', position:'absolute', top:2, left:settings[opt.key]?22:2, transition:'left 0.2s' }} />
            </button>
          </div>
        ))}
      </Card>

      <Card style={{ padding:20, marginBottom:16 }}>
        <div style={{ fontSize:14, fontWeight:700, marginBottom:16 }}>Dashboard language</div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {LANGS.map(l => (
            <button key={l.code} onClick={()=>update('lang',l.code)}
              style={{ padding:'10px 16px', borderRadius:10, border:'1px solid '+(settings.lang===l.code?C.accent:C.border), background:settings.lang===l.code?C.accentL:'transparent', cursor:'pointer', fontSize:13, color:settings.lang===l.code?C.accent:C.text, fontWeight:settings.lang===l.code?700:400 }}>
              {l.flag} {l.label}
            </button>
          ))}
        </div>
      </Card>

      <Card style={{ padding:20, marginBottom:16 }}>
        <div style={{ fontSize:14, fontWeight:700, marginBottom:16 }}>Keyboard shortcuts</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          {SHORTCUTS.map(([key,action]) => (
            <div key={key} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 12px', background:C.bg, borderRadius:8 }}>
              <span style={{ fontSize:12, color:C.muted }}>{action}</span>
              <kbd style={{ padding:'3px 8px', background:'white', border:'1px solid '+C.border, borderRadius:5, fontSize:11, fontFamily:'monospace', fontWeight:700, color:C.text }}>{key}</kbd>
            </div>
          ))}
        </div>
      </Card>

      <Card style={{ padding:20, marginBottom:16 }}>
        <div style={{ fontSize:14, fontWeight:700, marginBottom:16 }}>Notifications & alerts</div>
        {[
          { key:'alertSLA', label:'SLA breach alerts', desc:'Notify when orders exceed time thresholds' },
          { key:'alertNewOrder', label:'New order alerts', desc:'Notify when a new order is placed' },
          { key:'alertDriverOffline', label:'Driver went offline', desc:'Notify when an active driver disconnects' },
          { key:'alertLowStock', label:'Low stock alerts', desc:'Notify when stock falls below safe levels' },
          { key:'alertNewTicket', label:'New support ticket', desc:'Notify when a customer raises a complaint' },
        ].map(opt => (
          <div key={opt.key} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'0.5px solid '+C.border }}>
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:C.text }}>{opt.label}</div>
              <div style={{ fontSize:12, color:C.muted, marginTop:1 }}>{opt.desc}</div>
            </div>
            <button onClick={()=>update(opt.key, !settings[opt.key])}
              style={{ width:44, height:24, borderRadius:12, background:settings[opt.key]!==false?C.green:C.border, border:'none', cursor:'pointer', position:'relative', transition:'background 0.2s', flexShrink:0 }}>
              <div style={{ width:20, height:20, borderRadius:'50%', background:'white', position:'absolute', top:2, left:settings[opt.key]!==false?22:2, transition:'left 0.2s' }} />
            </button>
          </div>
        ))}
      </Card>

      <div style={{ display:'flex', gap:10 }}>
        <Btn onClick={save} color={C.green}>{saved ? '✓ Saved' : 'Save settings'}</Btn>
        <Btn onClick={()=>supabase.auth.signOut()} outline color={C.red}>Sign out</Btn>
      </div>
    </div>
  )
}
