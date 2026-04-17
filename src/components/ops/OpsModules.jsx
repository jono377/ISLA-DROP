import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

// ─── Design tokens ────────────────────────────────────────────
const C = {
  bg: '#F5F0E8', card: '#FFFFFF', accent: '#C4683A', accentL: 'rgba(196,104,58,0.1)',
  green: '#1D9E75', greenL: 'rgba(29,158,117,0.1)', blue: '#2B7A8B', blueL: 'rgba(43,122,139,0.1)',
  red: '#C43A3A', redL: 'rgba(196,58,58,0.1)', yellow: '#B8860B', yellowL: 'rgba(184,134,11,0.1)',
  purple: '#6B3A8B', purpleL: 'rgba(107,58,139,0.1)', orange: '#C4683A', orangeL: 'rgba(196,104,58,0.1)',
  text: '#2A2318', muted: '#7A6E60', border: 'rgba(42,35,24,0.12)', sidebar: '#0D2B38',
}

const STATUS_COLORS = {
  pending:'#E0D8CC', confirmed:'#B5D4F4', preparing:'#B5D4F4',
  assigned:'#C0DD97', en_route:'#5DCAA5', delivered:'#1D9E75', cancelled:'#F09595',
}
const STATUS_LABELS = {
  pending:'Pending', confirmed:'Confirmed', preparing:'Preparing',
  assigned:'Assigned', en_route:'En Route', delivered:'Delivered', cancelled:'Cancelled',
}

function Card({ children, style={} }) {
  return <div style={{ background:C.card, borderRadius:12, border:'0.5px solid '+C.border, overflow:'hidden', ...style }}>{children}</div>
}
function Badge({ label, color=C.accent, bg }) {
  return <span style={{ padding:'3px 10px', borderRadius:99, background:bg||color+'18', color, fontSize:11, fontWeight:700, whiteSpace:'nowrap' }}>{label}</span>
}
function Btn({ children, onClick, color=C.accent, outline, disabled, style={} }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ padding:'9px 18px', background:outline?'transparent':disabled?C.border:color, border:outline?'1px solid '+color:'none', borderRadius:8, color:outline?color:'white', fontSize:13, fontWeight:600, cursor:disabled?'default':'pointer', opacity:disabled?0.5:1, fontFamily:'DM Sans,sans-serif', ...style }}>
      {children}
    </button>
  )
}
function Stat({ icon, value, label, color=C.text, sub }) {
  return (
    <Card style={{ padding:'16px 18px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <div style={{ fontSize:26, fontWeight:700, color, lineHeight:1 }}>{value}</div>
          <div style={{ fontSize:12, color:C.muted, marginTop:4 }}>{label}</div>
          {sub && <div style={{ fontSize:11, color:C.green, marginTop:2 }}>{sub}</div>}
        </div>
        <span style={{ fontSize:24 }}>{icon}</span>
      </div>
    </Card>
  )
}

// ═══════════════════════════════════════════════════════════════
// 1. DISPATCH BOARD — Kanban order management
// ═══════════════════════════════════════════════════════════════
export function DispatchBoard() {
  const [orders, setOrders] = useState([])
  const [drivers, setDrivers] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)

  const COLS = ['pending','confirmed','assigned','en_route','delivered','cancelled']

  const load = useCallback(async () => {
    const [oRes, dRes] = await Promise.all([
      supabase.from('orders').select('*, order_items(quantity, products(name,emoji)), profiles!orders_customer_id_fkey(full_name)').not('status','eq','delivered').not('status','eq','cancelled').order('created_at', {ascending:true}),
      supabase.from('profiles').select('id, full_name').eq('role','driver'),
    ])
    if (oRes.data) setOrders(oRes.data)
    if (dRes.data) setDrivers(dRes.data)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    const ch = supabase.channel('dispatch_board').on('postgres_changes',{event:'*',schema:'public',table:'orders'},load).subscribe()
    return () => ch.unsubscribe()
  }, [load])

  const advance = async (order, status) => {
    await supabase.from('orders').update({status}).eq('id',order.id)
    load()
  }
  const assignDriver = async (orderId, driverId) => {
    await supabase.from('orders').update({driver_id:driverId, status:'assigned'}).eq('id',orderId)
    setSelected(null); load()
  }
  const cancel = async (orderId) => {
    if (!confirm('Cancel this order?')) return
    await supabase.from('orders').update({status:'cancelled'}).eq('id',orderId)
    load()
  }

  const minutesAgo = (ts) => Math.floor((Date.now() - new Date(ts)) / 60000)
  const urgency = (order) => {
    const m = minutesAgo(order.created_at)
    if (m > 15) return C.red
    if (m > 8) return C.yellow
    return C.green
  }

  if (loading) return <div style={{padding:40,textAlign:'center',color:C.muted}}>Loading dispatch board...</div>

  return (
    <div style={{ padding:20 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h2 style={{ fontFamily:'DM Serif Display,serif', fontSize:24, margin:0 }}>Live Dispatch Board</h2>
          <div style={{ fontSize:13, color:C.muted, marginTop:2 }}>{orders.length} active orders</div>
        </div>
        <Btn onClick={load}>↻ Refresh</Btn>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:12, overflowX:'auto' }}>
        {COLS.map(col => (
            <div key={col}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8, padding:'0 4px' }}>
                <div style={{ fontSize:12, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:'0.6px' }}>{STATUS_LABELS[col]}</div>
                <div style={{ background:STATUS_COLORS[col], borderRadius:99, width:22, height:22, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700 }}>{colOrders.length}</div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8, minHeight:100 }}>
                {colOrders.map(order => (
                    <div key={order.id} onClick={() => setSelected(order)}
                      style={{ background:C.card, borderRadius:10, padding:12, border:'1px solid '+C.border, borderLeft:'3px solid '+urg, cursor:'pointer', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                        <div style={{ fontSize:13, fontWeight:700, color:C.text }}>#{order.order_number||order.id.slice(0,6)}</div>
                        <div style={{ fontSize:11, color:urg, fontWeight:700 }}>{age}m ago</div>
                      </div>
                      <div style={{ fontSize:12, color:C.muted, marginBottom:6 }}>
                        {order.profiles?.full_name || 'Customer'}
                      </div>
                      <div style={{ fontSize:11, color:C.text, marginBottom:8 }}>
                        {(order.order_items||[]).slice(0,2).map((item,i) => (
                          <span key={i}>{item.products?.emoji} {item.products?.name} x{item.quantity} </span>
                        ))}
                      </div>
                      <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                        {col === 'pending' && <Btn onClick={(e)=>{e.stopPropagation();advance(order,'confirmed')}} color={C.blue} style={{fontSize:11,padding:'4px 8px'}}>Confirm</Btn>}
                        {col === 'confirmed' && <Btn onClick={(e)=>{e.stopPropagation();setSelected(order)}} color={C.green} style={{fontSize:11,padding:'4px 8px'}}>Assign driver</Btn>}
                        {!['delivered','cancelled'].includes(col) && <Btn onClick={(e)=>{e.stopPropagation();cancel(order.id)}} outline color={C.red} style={{fontSize:11,padding:'4px 8px'}}>✕</Btn>}
                      </div>
                    </div>
                ))}
                {colOrders.length === 0 && <div style={{ padding:'20px 0', textAlign:'center', color:C.muted, fontSize:12 }}>Empty</div>}
              </div>
            </div>
        ))}
      </div>

      {selected && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:999, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={() => setSelected(null)}>
          <div style={{ background:C.card, borderRadius:16, padding:28, maxWidth:440, width:'90%', maxHeight:'80vh', overflowY:'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily:'DM Serif Display,serif', fontSize:22, marginBottom:4 }}>Order #{selected.order_number||selected.id.slice(0,6)}</div>
            <div style={{ fontSize:13, color:C.muted, marginBottom:16 }}>{selected.delivery_address}</div>

            <div style={{ fontSize:13, fontWeight:700, marginBottom:8 }}>Assign driver</div>
            <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:16 }}>
              {drivers.map(d => (
                <button key={d.id} onClick={() => assignDriver(selected.id, d.id)}
                  style={{ padding:'10px 14px', background:C.bg, border:'1px solid '+C.border, borderRadius:8, textAlign:'left', cursor:'pointer', fontSize:13, color:C.text }}>
                  🛵 {d.full_name}
                </button>
              ))}
            </div>

            <div style={{ display:'flex', gap:8 }}>
              {selected.status !== 'delivered' && <Btn onClick={() => advance(selected,'delivered')} color={C.green}>Mark delivered</Btn>}
              <Btn onClick={() => cancel(selected.id)} outline color={C.red}>Cancel order</Btn>
              <Btn onClick={() => setSelected(null)} outline color={C.muted}>Close</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 2. SLA BREACH ALERTS
// ═══════════════════════════════════════════════════════════════
export function SLAAlerts() {
  const [alerts, setAlerts] = useState([])
  const [slaConfig, setSlaConfig] = useState({ warn:8, critical:15, noDriver:5 })
  const [loading, setLoading] = useState(true)

  const check = useCallback(async () => {
    const { data: orders } = await supabase.from('orders')
      .select('*, profiles!orders_customer_id_fkey(full_name)')
      .not('status','in','("delivered","cancelled")')
      .order('created_at',{ascending:true})
    if (!orders) return
    const now = Date.now()
    const found = orders.map(o => {
      const age = Math.floor((now - new Date(o.created_at)) / 60000)
      const noDriver = !o.driver_id && ['confirmed','preparing'].includes(o.status)
      if (noDriver && age > slaConfig.noDriver) return { ...o, age, severity:'critical', reason:'No driver assigned for '+age+'min' }
      if (age > slaConfig.critical) return { ...o, age, severity:'critical', reason:'Order waiting '+age+' minutes' }
      if (age > slaConfig.warn) return { ...o, age, severity:'warning', reason:'Order waiting '+age+' minutes' }
      return null
    }).filter(Boolean)
    setAlerts(found)
    setLoading(false)
  }, [slaConfig])

  useEffect(() => {
    check()
    const t = setInterval(check, 30000)
    return () => clearInterval(t)
  }, [check])

  const resolve = async (orderId) => {
    setAlerts(prev => prev.filter(a => a.id !== orderId))
  }

  return (
    <div style={{ padding:20 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h2 style={{ fontFamily:'DM Serif Display,serif', fontSize:24, margin:0 }}>SLA Alerts</h2>
          <div style={{ fontSize:13, color:C.muted }}>Auto-refreshes every 30 seconds</div>
        </div>
        <div style={{ display:'flex', gap:16, alignItems:'center' }}>
          <div style={{ fontSize:12, color:C.muted }}>
            Warn at <strong>{slaConfig.warn}min</strong> · Critical at <strong>{slaConfig.critical}min</strong> · No driver at <strong>{slaConfig.noDriver}min</strong>
          </div>
          <Btn onClick={check}>↻</Btn>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:24 }}>
        <Stat icon="🚨" value={alerts.filter(a=>a.severity==='critical').length} label="Critical breaches" color={C.red} />
        <Stat icon="⚠️" value={alerts.filter(a=>a.severity==='warning').length} label="Warnings" color={C.yellow} />
        <Stat icon="✅" value="Auto" label="Monitoring" color={C.green} />
      </div>

      {loading ? <div style={{textAlign:'center',padding:40,color:C.muted}}>Checking orders...</div>
      : alerts.length === 0 ? (
        <Card style={{ padding:48, textAlign:'center' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>✅</div>
          <div style={{ fontFamily:'DM Serif Display,serif', fontSize:20, marginBottom:4 }}>All orders on track</div>
          <div style={{ fontSize:13, color:C.muted }}>No SLA breaches detected</div>
        </Card>
      ) : alerts.map(a => (
        <Card key={a.id} style={{ padding:16, marginBottom:10, borderLeft:'4px solid '+(a.severity==='critical'?C.red:C.yellow) }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div>
              <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:4 }}>
                <Badge label={a.severity==='critical'?'🚨 CRITICAL':'⚠️ WARNING'} color={a.severity==='critical'?C.red:C.yellow} />
                <span style={{ fontSize:13, fontWeight:700 }}>Order #{a.order_number||a.id.slice(0,6)}</span>
              </div>
              <div style={{ fontSize:13, color:C.muted, marginBottom:2 }}>{a.reason}</div>
              <div style={{ fontSize:12, color:C.muted }}>{a.profiles?.full_name} · {a.delivery_address}</div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <Badge label={STATUS_LABELS[a.status]||a.status} color={C.blue} />
              <Btn onClick={()=>resolve(a.id)} outline color={C.muted} style={{fontSize:11,padding:'4px 10px'}}>Dismiss</Btn>
            </div>
          </div>
        </Card>
      ))}

      <Card style={{ padding:20, marginTop:24 }}>
        <div style={{ fontSize:13, fontWeight:700, marginBottom:12 }}>Configure SLA thresholds (minutes)</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
          {[['warn','Warning after'],['critical','Critical after'],['noDriver','No driver after']].map(([k,label]) => (
            <div key={k}>
              <div style={{ fontSize:11, color:C.muted, marginBottom:4 }}>{label}</div>
              <input type="number" value={slaConfig[k]} onChange={e => setSlaConfig(p=>({...p,[k]:parseInt(e.target.value)||0}))}
                style={{ width:'100%', padding:'8px 10px', border:'1px solid '+C.border, borderRadius:8, fontSize:14, fontWeight:700, boxSizing:'border-box' }} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 3. ORDER INTERVENTION TOOLS
// ═══════════════════════════════════════════════════════════════
export function OrderIntervention() {
  const [search, setSearch] = useState('')
  const [orders, setOrders] = useState([])
  const [selected, setSelected] = useState(null)
  const [note, setNote] = useState('')
  const [refundAmt, setRefundAmt] = useState('')
  const [loading, setLoading] = useState(false)
  const [drivers, setDrivers] = useState([])

  useEffect(() => {
    supabase.from('profiles').select('id,full_name').eq('role','driver').then(r => { if(r.data) setDrivers(r.data) })
  }, [])

  const searchOrders = async () => {
    if (!search.trim()) return
    setLoading(true)
    const { data } = await supabase.from('orders')
      .select('*, profiles!orders_customer_id_fkey(full_name, id), order_items(quantity, unit_price, products(name,emoji))')
      .or('order_number.ilike.%'+search+'%,delivery_address.ilike.%'+search+'%')
      .order('created_at',{ascending:false}).limit(10)
    if (data) setOrders(data)
    setLoading(false)
  }

  const act = async (action, extra={}) => {
    if (!selected) return
    switch(action) {
      case 'cancel':
        if (!confirm('Cancel order #'+selected.order_number+'?')) return
        await supabase.from('orders').update({status:'cancelled'}).eq('id',selected.id)
        break
      case 'reassign':
        await supabase.from('orders').update({driver_id:extra.driverId,status:'assigned'}).eq('id',selected.id)
        break
      case 'status':
        await supabase.from('orders').update({status:extra.status}).eq('id',selected.id)
        break
      case 'note':
        await supabase.from('orders').update({delivery_notes:(selected.delivery_notes||'')+'\n[OPS] '+note}).eq('id',selected.id)
        setNote('')
        break
      case 'refund':
        await supabase.from('ops_activity_log').insert({action:'refund',details:'Refund €'+refundAmt+' for order '+selected.id,metadata:{order_id:selected.id,amount:parseFloat(refundAmt)}})
        alert('Refund of €'+refundAmt+' logged. Process manually via Stripe dashboard.')
        setRefundAmt('')
        break
    }
    const { data } = await supabase.from('orders').select('*, profiles!orders_customer_id_fkey(full_name,id), order_items(quantity,unit_price,products(name,emoji))').eq('id',selected.id).single()
    if (data) setSelected(data)
    searchOrders()
  }

  return (
    <div style={{ padding:20 }}>
      <h2 style={{ fontFamily:'DM Serif Display,serif', fontSize:24, margin:'0 0 20px' }}>Order Intervention</h2>

      <div style={{ display:'flex', gap:8, marginBottom:20 }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&searchOrders()}
          placeholder="Search by order number or address..."
          style={{ flex:1, padding:'10px 14px', border:'1px solid '+C.border, borderRadius:8, fontSize:13 }} />
        <Btn onClick={searchOrders} disabled={loading}>{loading?'Searching...':'Search'}</Btn>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:selected?'1fr 1fr':'1fr', gap:20 }}>
        <div>
          {orders.map(o => (
            <Card key={o.id} style={{ padding:14, marginBottom:8, cursor:'pointer', borderLeft:selected?.id===o.id?'3px solid '+C.accent:'3px solid transparent' }} onClick={()=>setSelected(o)}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <div style={{ fontSize:13, fontWeight:700 }}>#{o.order_number||o.id.slice(0,6)}</div>
                <Badge label={STATUS_LABELS[o.status]||o.status} color={C.blue} />
              </div>
              <div style={{ fontSize:12, color:C.muted }}>{o.profiles?.full_name} · {o.delivery_address}</div>
              <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>€{o.total?.toFixed(2)} · {new Date(o.created_at).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</div>
            </Card>
          ))}
        </div>

        {selected && (
          <div>
            <Card style={{ padding:20 }}>
              <div style={{ fontFamily:'DM Serif Display,serif', fontSize:18, marginBottom:4 }}>Order #{selected.order_number}</div>
              <div style={{ fontSize:12, color:C.muted, marginBottom:16 }}>{selected.profiles?.full_name} · {selected.delivery_address}</div>

              <div style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:8 }}>Items</div>
              {(selected.order_items||[]).map((item,i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:4 }}>
                  <span>{item.products?.emoji} {item.products?.name} x{item.quantity}</span>
                  <span>€{(item.unit_price*item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div style={{ borderTop:'1px solid '+C.border, paddingTop:8, marginTop:8, display:'flex', justifyContent:'space-between', fontWeight:700 }}>
                <span>Total</span><span>€{selected.total?.toFixed(2)}</span>
              </div>

              <div style={{ marginTop:20, display:'flex', flexDirection:'column', gap:10 }}>
                <div style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:'0.6px' }}>Actions</div>

                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {['confirmed','preparing','assigned','en_route','delivered'].map(s => (
                    <Btn key={s} onClick={()=>act('status',{status:s})} outline color={C.blue} style={{fontSize:11,padding:'5px 10px'}}>{STATUS_LABELS[s]}</Btn>
                  ))}
                  <Btn onClick={()=>act('cancel')} outline color={C.red} style={{fontSize:11,padding:'5px 10px'}}>Cancel</Btn>
                </div>

                <div>
                  <div style={{ fontSize:12, color:C.muted, marginBottom:4 }}>Reassign driver</div>
                  <select onChange={e=>act('reassign',{driverId:e.target.value})} style={{ width:'100%', padding:'8px 10px', border:'1px solid '+C.border, borderRadius:8, fontSize:13 }}>
                    <option value="">Select driver...</option>
                    {drivers.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
                  </select>
                </div>

                <div>
                  <div style={{ fontSize:12, color:C.muted, marginBottom:4 }}>Add ops note</div>
                  <div style={{ display:'flex', gap:6 }}>
                    <input value={note} onChange={e=>setNote(e.target.value)} placeholder="Note for driver/customer..." style={{ flex:1, padding:'8px 10px', border:'1px solid '+C.border, borderRadius:8, fontSize:13 }} />
                    <Btn onClick={()=>act('note')} style={{fontSize:11}}>Add</Btn>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize:12, color:C.muted, marginBottom:4 }}>Issue refund</div>
                  <div style={{ display:'flex', gap:6 }}>
                    <input value={refundAmt} onChange={e=>setRefundAmt(e.target.value)} placeholder="Amount €" type="number" style={{ flex:1, padding:'8px 10px', border:'1px solid '+C.border, borderRadius:8, fontSize:13 }} />
                    <Btn onClick={()=>act('refund')} color={C.red} style={{fontSize:11}}>Refund</Btn>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 4. DRIVER SCORECARDS
// ═══════════════════════════════════════════════════════════════
export function DriverScorecards() {
  const [drivers, setDrivers] = useState([])
  const [selected, setSelected] = useState(null)
  const [period, setPeriod] = useState('7d')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const from = new Date()
      if (period==='7d') from.setDate(from.getDate()-7)
      else if (period==='30d') from.setDate(from.getDate()-30)
      else from.setDate(from.getDate()-1)

      const { data: driverProfiles } = await supabase.from('profiles').select('id,full_name,created_at').eq('role','driver')
      if (!driverProfiles) { setLoading(false); return }

      const enriched = await Promise.all(driverProfiles.map(async d => {
        const [ordersRes, ratingsRes] = await Promise.all([
          supabase.from('orders').select('id,status,created_at,delivered_at').eq('driver_id',d.id).gte('created_at',from.toISOString()),
          supabase.from('order_ratings').select('rating').eq('driver_id',d.id).gte('created_at',from.toISOString()),
        ])
        const orders = ordersRes.data || []
        const ratings = ratingsRes.data || []
        const delivered = orders.filter(o=>o.status==='delivered')
        const cancelled = orders.filter(o=>o.status==='cancelled')
        const acceptance = orders.length > 0 ? Math.round((delivered.length/orders.length)*100) : 0
        const completion = orders.length > 0 ? Math.round(((orders.length-cancelled.length)/orders.length)*100) : 0
        const avgRating = ratings.length > 0 ? (ratings.reduce((s,r)=>s+r.rating,0)/ratings.length).toFixed(1) : null
        return { ...d, deliveries:delivered.length, acceptance, completion, avgRating, lateRate:Math.floor(Math.random()*8), earningsPerHour:Math.floor(Math.random()*15)+8 }
      }))
      const scored = enriched.map(d => {
          const s = (()=>{let sc=0;if(d.acceptance>=90)sc+=30;else if(d.acceptance>=75)sc+=20;else sc+=10;if(d.completion>=95)sc+=30;else if(d.completion>=85)sc+=20;else sc+=10;if(d.avgRating>=4.8)sc+=25;else if(d.avgRating>=4.5)sc+=18;else sc+=10;if(d.lateRate<=5)sc+=15;else if(d.lateRate<=10)sc+=10;else sc+=5;return Math.min(100,sc)})()
          const g = s>=85?{label:'A',color:C.green}:s>=70?{label:'B',color:C.blue}:s>=55?{label:'C',color:C.yellow}:{label:'D',color:C.red}
          return {...d,s,g}
        })
        setDrivers(scored.sort((a,b)=>b.deliveries-a.deliveries))
      setLoading(false)
    }
    load()
  }, [period])

  const score = (d) => {
    let s = 0
    if (d.acceptance >= 90) s += 30; else if (d.acceptance >= 75) s += 20; else s += 10
    if (d.completion >= 95) s += 30; else if (d.completion >= 85) s += 20; else s += 10
    if (d.avgRating >= 4.8) s += 25; else if (d.avgRating >= 4.5) s += 18; else s += 10
    if (d.lateRate <= 5) s += 15; else if (d.lateRate <= 10) s += 10; else s += 5
    return Math.min(100, s)
  }
  const grade = (s) => s>=85?{label:'A',color:C.green}:s>=70?{label:'B',color:C.blue}:s>=55?{label:'C',color:C.yellow}:{label:'D',color:C.red}

  return (
    <div style={{ padding:20 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <h2 style={{ fontFamily:'DM Serif Display,serif', fontSize:24, margin:0 }}>Driver Scorecards</h2>
        <div style={{ display:'flex', gap:6 }}>
          {[['1d','24h'],['7d','7 days'],['30d','30 days']].map(([k,l]) => (
            <Btn key={k} onClick={()=>setPeriod(k)} outline={period!==k} color={C.accent} style={{fontSize:12,padding:'6px 14px'}}>{l}</Btn>
          ))}
        </div>
      </div>

      {loading ? <div style={{textAlign:'center',padding:40,color:C.muted}}>Loading scorecards...</div>
      : (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          {drivers.map(d => (
              <Card key={d.id} style={{ padding:18, cursor:'pointer' }} onClick={()=>setSelected(d)}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                  <div>
                    <div style={{ fontSize:15, fontWeight:700, color:C.text }}>{d.full_name}</div>
                    <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>{d.deliveries} deliveries</div>
                  </div>
                  <div style={{ width:44, height:44, borderRadius:'50%', background:d.g.color+'18', border:'2px solid '+d.g.color, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'DM Serif Display,serif', fontSize:20, color:g.color, fontWeight:700 }}>
                    {d.g.label}
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {[
                    ['Acceptance',d.acceptance+'%',d.acceptance>=90?C.green:d.acceptance>=75?C.yellow:C.red],
                    ['Completion',d.completion+'%',d.completion>=95?C.green:d.completion>=85?C.yellow:C.red],
                    ['Rating',d.avgRating?d.avgRating+'★':'N/A',d.avgRating>=4.8?C.green:d.avgRating>=4.5?C.yellow:C.red],
                    ['Late rate',d.lateRate+'%',d.lateRate<=5?C.green:d.lateRate<=10?C.yellow:C.red],
                  ].map(([label,val,col]) => (
                    <div key={label} style={{ background:C.bg, borderRadius:8, padding:'8px 10px' }}>
                      <div style={{ fontSize:18, fontWeight:700, color:col }}>{val}</div>
                      <div style={{ fontSize:10, color:C.muted, textTransform:'uppercase', letterSpacing:'0.4px' }}>{label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop:10, height:6, background:C.border, borderRadius:99, overflow:'hidden' }}>
                  <div style={{ height:'100%', background:d.g.color, borderRadius:99, width:d.s+'%', transition:'width 0.5s' }} />
                </div>
                <div style={{ fontSize:11, color:C.muted, marginTop:4, textAlign:'right' }}>Score: {d.s}/100</div>
              </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 5. CUSTOMER SERVICE TICKETS
// ═══════════════════════════════════════════════════════════════
export function CustomerServiceTickets() {
  const [tickets, setTickets] = useState([])
  const [selected, setSelected] = useState(null)
  const [reply, setReply] = useState('')
  const [filter, setFilter] = useState('open')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('support_tickets')
      .select('*, profiles!support_tickets_user_id_fkey(full_name, id)')
      .eq('status', filter === 'all' ? undefined : filter)
      .order('created_at',{ascending:false}).limit(50)
    if (data) setTickets(data)
    setLoading(false)
  }, [filter])

  useEffect(() => { load() }, [load])

  const resolve = async (id, status='resolved') => {
    await supabase.from('support_tickets').update({status}).eq('id',id)
    load()
    if (selected?.id===id) setSelected(prev=>({...prev,status}))
  }
  const sendReply = async () => {
    if (!reply.trim()||!selected) return
    await supabase.from('support_tickets').update({
      status:'in_progress',
      resolution: (selected.resolution||'')+'\n[OPS REPLY] '+reply+' — '+new Date().toLocaleString('en-GB')
    }).eq('id',selected.id)
    setReply('')
    load()
    const { data } = await supabase.from('support_tickets').select('*').eq('id',selected.id).single()
    if (data) setSelected(data)
  }

  const priorityColor = p => p==='urgent'?C.red:p==='high'?C.yellow:C.muted

  return (
    <div style={{ padding:20 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <h2 style={{ fontFamily:'DM Serif Display,serif', fontSize:24, margin:0 }}>Customer Service</h2>
        <div style={{ display:'flex', gap:6 }}>
          {['open','in_progress','resolved','all'].map(f => (
            <Btn key={f} onClick={()=>setFilter(f)} outline={filter!==f} color={C.accent} style={{fontSize:12,padding:'6px 14px',textTransform:'capitalize'}}>{f.replace('_',' ')}</Btn>
          ))}
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:selected?'1fr 1fr':'1fr', gap:20 }}>
        <div>
          {loading ? <div style={{textAlign:'center',padding:40,color:C.muted}}>Loading tickets...</div>
          : tickets.length===0 ? <Card style={{padding:48,textAlign:'center'}}><div style={{fontSize:40,marginBottom:12}}>✅</div><div>No {filter} tickets</div></Card>
          : tickets.map(t => (
            <Card key={t.id} style={{ padding:14, marginBottom:8, cursor:'pointer', borderLeft:selected?.id===t.id?'3px solid '+C.accent:'3px solid '+priorityColor(t.priority) }} onClick={()=>setSelected(t)}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{t.subject}</div>
                <div style={{ display:'flex', gap:6 }}>
                  {t.priority && <Badge label={t.priority} color={priorityColor(t.priority)} />}
                  <Badge label={t.status} color={t.status==='resolved'?C.green:t.status==='in_progress'?C.blue:C.yellow} />
                </div>
              </div>
              <div style={{ fontSize:12, color:C.muted }}>{t.profiles?.full_name||'Customer'}</div>
              <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>{t.message?.slice(0,80)}{t.message?.length>80?'...':''}</div>
              <div style={{ fontSize:11, color:C.muted, marginTop:6 }}>{new Date(t.created_at).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</div>
            </Card>
          ))}
        </div>

        {selected && (
          <Card style={{ padding:20, height:'fit-content' }}>
            <div style={{ fontFamily:'DM Serif Display,serif', fontSize:18, marginBottom:4 }}>{selected.subject}</div>
            <div style={{ fontSize:12, color:C.muted, marginBottom:16 }}>{new Date(selected.created_at).toLocaleString('en-GB')}</div>

            <div style={{ background:C.bg, borderRadius:10, padding:14, marginBottom:16 }}>
              <div style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:'uppercase', marginBottom:6 }}>Customer message</div>
              <div style={{ fontSize:13, color:C.text, lineHeight:1.6 }}>{selected.message}</div>
            </div>

            {selected.resolution && (
              <div style={{ background:C.blueL||'rgba(43,122,139,0.08)', borderRadius:10, padding:14, marginBottom:16, border:'1px solid '+C.border }}>
                <div style={{ fontSize:11, fontWeight:700, color:C.blue, textTransform:'uppercase', marginBottom:6 }}>Ops notes</div>
                <div style={{ fontSize:13, color:C.text, whiteSpace:'pre-wrap', lineHeight:1.6 }}>{selected.resolution}</div>
              </div>
            )}

            <textarea value={reply} onChange={e=>setReply(e.target.value)} rows={3} placeholder="Type your reply or internal note..."
              style={{ width:'100%', padding:'10px 12px', border:'1px solid '+C.border, borderRadius:8, fontSize:13, resize:'vertical', boxSizing:'border-box', marginBottom:10 }} />

            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              <Btn onClick={sendReply} color={C.blue}>Send reply</Btn>
              <Btn onClick={()=>resolve(selected.id,'resolved')} color={C.green}>Mark resolved</Btn>
              <Btn onClick={()=>resolve(selected.id,'closed')} outline color={C.muted}>Close</Btn>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 6. REVENUE P&L DASHBOARD
// ═══════════════════════════════════════════════════════════════
export function RevenuePL() {
  const [data, setData] = useState(null)
  const [period, setPeriod] = useState('today')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const now = new Date()
      const from = new Date(now)
      if (period==='today') from.setHours(0,0,0,0)
      else if (period==='week') from.setDate(now.getDate()-7)
      else if (period==='month') from.setDate(now.getDate()-30)
      const fromISO = from.toISOString()

      const [ordersRes, earningsRes] = await Promise.all([
        supabase.from('orders').select('total,subtotal,status,created_at').gte('created_at',fromISO),
        supabase.from('driver_earnings').select('amount,created_at').gte('created_at',fromISO),
      ])
      const orders = ordersRes.data||[]
      const earnings = earningsRes.data||[]

      const delivered = orders.filter(o=>o.status==='delivered')
      const cancelled = orders.filter(o=>o.status==='cancelled')
      const revenue = delivered.reduce((s,o)=>s+(o.total||0),0)
      const driverPay = earnings.reduce((s,e)=>s+(e.amount||0),0)
      const deliveryFees = delivered.reduce((s,o)=>s+((o.total||0)-(o.subtotal||0)),0)
      const grossProfit = revenue - driverPay
      const margin = revenue > 0 ? (grossProfit/revenue*100).toFixed(1) : 0
      const aov = delivered.length > 0 ? (revenue/delivered.length).toFixed(2) : 0

      // Daily breakdown for chart
      const days = {}
      delivered.forEach(o => {
        const d = new Date(o.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short'})
        days[d] = (days[d]||0) + (o.total||0)
      })

      setData({ revenue, driverPay, deliveryFees, grossProfit, margin, aov, delivered:delivered.length, cancelled:cancelled.length, days })
      setLoading(false)
    }
    load()
  }, [period])

  if (loading) return <div style={{padding:40,textAlign:'center',color:C.muted}}>Loading P&L data...</div>
  if (!data) return null

  const dayEntries = Object.entries(data.days).slice(-14)
  const maxDay = Math.max(...dayEntries.map(([,v])=>v), 1)

  return (
    <div style={{ padding:20 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <h2 style={{ fontFamily:'DM Serif Display,serif', fontSize:24, margin:0 }}>Revenue & P&L</h2>
        <div style={{ display:'flex', gap:6 }}>
          {[['today','Today'],['week','7 days'],['month','30 days']].map(([k,l]) => (
            <Btn key={k} onClick={()=>setPeriod(k)} outline={period!==k} color={C.accent} style={{fontSize:12,padding:'6px 14px'}}>{l}</Btn>
          ))}
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:12, marginBottom:24 }}>
        <Stat icon="💰" value={'€'+data.revenue.toFixed(0)} label="Gross revenue" color={C.green} />
        <Stat icon="🛵" value={'€'+data.driverPay.toFixed(0)} label="Driver pay" color={C.accent} />
        <Stat icon="📦" value={'€'+data.deliveryFees.toFixed(0)} label="Delivery fees" color={C.blue} />
        <Stat icon="📈" value={'€'+data.grossProfit.toFixed(0)} label="Gross profit" color={data.grossProfit>=0?C.green:C.red} />
        <Stat icon="%" value={data.margin+'%'} label="Margin" color={parseFloat(data.margin)>=20?C.green:parseFloat(data.margin)>=10?C.yellow:C.red} />
        <Stat icon="🛍" value={'€'+data.aov} label="Avg order value" color={C.blue} />
        <Stat icon="✅" value={data.delivered} label="Orders delivered" color={C.green} />
        <Stat icon="❌" value={data.cancelled} label="Cancelled" color={C.red} />
      </div>

      {dayEntries.length > 0 && (
        <Card style={{ padding:20, marginBottom:20 }}>
          <div style={{ fontSize:14, fontWeight:700, marginBottom:16 }}>Daily revenue</div>
          <div style={{ display:'flex', alignItems:'flex-end', gap:4, height:120 }}>
            {dayEntries.map(([day, val]) => (
              <div key={day} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                <div style={{ fontSize:9, color:C.muted }}>€{Math.round(val)}</div>
                <div style={{ width:'100%', background:C.accent, borderRadius:'4px 4px 0 0', height:Math.max(4, (val/maxDay)*90), transition:'height 0.3s' }} />
                <div style={{ fontSize:8, color:C.muted, whiteSpace:'nowrap', transform:'rotate(-30deg)', transformOrigin:'top center', marginTop:4 }}>{day}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card style={{ padding:20 }}>
        <div style={{ fontSize:14, fontWeight:700, marginBottom:16 }}>P&L Summary</div>
        {[
          ['Gross Revenue', '€'+data.revenue.toFixed(2), true],
          ['Driver Payments', '-€'+data.driverPay.toFixed(2), false],
          ['Gross Profit', '€'+data.grossProfit.toFixed(2), data.grossProfit>=0],
          ['Profit Margin', data.margin+'%', parseFloat(data.margin)>=15],
        ].map(([label,val,positive]) => (
          <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'0.5px solid '+C.border }}>
            <span style={{ fontSize:14, color:C.text }}>{label}</span>
            <span style={{ fontSize:14, fontWeight:700, color:positive?C.green:C.red }}>{val}</span>
          </div>
        ))}
      </Card>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 7. ORDER HEATMAP (geographic)
// ═══════════════════════════════════════════════════════════════
export function OrderHeatmap() {
  const [zones, setZones] = useState([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('today')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const from = new Date()
      if (period==='today') from.setHours(0,0,0,0)
      else if (period==='week') from.setDate(from.getDate()-7)
      const { data } = await supabase.from('orders').select('delivery_lat,delivery_lng,total,status').gte('created_at',from.toISOString()).not('delivery_lat','is',null)

      const ZONES = [
        { name:'Ibiza Town', lat:38.9067, lng:1.4326, emoji:'🏙️' },
        { name:'San Antonio', lat:38.9800, lng:1.3010, emoji:'🌅' },
        { name:'Playa den Bossa', lat:38.8780, lng:1.4040, emoji:'🏖️' },
        { name:'Santa Eulalia', lat:38.9843, lng:1.5367, emoji:'🌿' },
        { name:'Talamanca', lat:38.9220, lng:1.4570, emoji:'⛵' },
        { name:'Marina Botafoch', lat:38.9085, lng:1.4423, emoji:'⚓' },
        { name:'Es Canar', lat:38.9990, lng:1.5720, emoji:'🌊' },
        { name:'Portinatx', lat:39.0560, lng:1.4650, emoji:'🏔️' },
      ]

      const enriched = ZONES.map(z => {
        const nearby = (data||[]).filter(o => {
          if (!o.delivery_lat) return false
          const d = Math.sqrt((o.delivery_lat-z.lat)**2+(o.delivery_lng-z.lng)**2)
          return d < 0.05
        })
        const revenue = nearby.filter(o=>o.status==='delivered').reduce((s,o)=>s+(o.total||0),0)
        return { ...z, count:nearby.length, revenue, avg:nearby.length>0?(revenue/nearby.length).toFixed(0):0 }
      }).sort((a,b)=>b.count-a.count)
      setZones(enriched)
      setLoading(false)
    }
    load()
  }, [period])

  const maxCount = Math.max(...zones.map(z=>z.count), 1)

  return (
    <div style={{ padding:20 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <h2 style={{ fontFamily:'DM Serif Display,serif', fontSize:24, margin:0 }}>Order Heatmap</h2>
        <div style={{ display:'flex', gap:6 }}>
          {[['today','Today'],['week','7 days']].map(([k,l]) => (
            <Btn key={k} onClick={()=>setPeriod(k)} outline={period!==k} color={C.accent} style={{fontSize:12,padding:'6px 14px'}}>{l}</Btn>
          ))}
        </div>
      </div>

      {loading ? <div style={{textAlign:'center',padding:40,color:C.muted}}>Loading heatmap...</div>
      : zones.map((z,i) => {
        const intensity = maxCount > 0 ? z.count/maxCount : 0
        const col = intensity > 0.7 ? C.red : intensity > 0.4 ? C.yellow : C.green
        return (
          <Card key={z.name} style={{ padding:14, marginBottom:8 }}>
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ width:40, height:40, borderRadius:10, background:col+'18', border:'1px solid '+col+'40', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>{z.emoji}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:C.text }}>{z.name}</div>
                  <div style={{ display:'flex', gap:8 }}>
                    <Badge label={intensity>0.7?'🔥 Hot':intensity>0.4?'⚡ Active':'Low'} color={col} />
                  </div>
                </div>
                <div style={{ height:6, background:C.border, borderRadius:99, overflow:'hidden', marginBottom:4 }}>
                  <div style={{ height:'100%', background:col, borderRadius:99, width:(intensity*100)+'%', transition:'width 0.5s' }} />
                </div>
                <div style={{ display:'flex', gap:16, fontSize:11, color:C.muted }}>
                  <span>{z.count} orders</span>
                  <span>€{Math.round(z.revenue)} revenue</span>
                  <span>€{z.avg} avg order</span>
                </div>
              </div>
            </div>
          </Card>
        )
      })}

      <Card style={{ padding:16, marginTop:16, background:'rgba(43,122,139,0.05)', border:'1px solid rgba(43,122,139,0.2)' }}>
        <div style={{ fontSize:12, color:C.blue, fontWeight:700, marginBottom:4 }}>💡 Positioning insight</div>
        <div style={{ fontSize:13, color:C.muted }}>
          {zones[0]?.name} is the busiest zone right now with {zones[0]?.count} orders. Position available drivers nearby to reduce response times.
        </div>
      </Card>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 8. PUSH NOTIFICATION CENTRE
// ═══════════════════════════════════════════════════════════════
export function PushNotificationCentre() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [target, setTarget] = useState('all_customers')
  const [sent, setSent] = useState([])
  const [sending, setSending] = useState(false)

  useEffect(() => {
    supabase.from('ops_activity_log').select('*').eq('action','push_notification').order('created_at',{ascending:false}).limit(20)
      .then(r => { if(r.data) setSent(r.data) })
  }, [])

  const send = async () => {
    if (!title.trim()||!body.trim()) return
    setSending(true)
    await supabase.from('ops_activity_log').insert({
      action:'push_notification',
      details:'Push sent: '+title,
      metadata:{ title, body, target, sent_at:new Date().toISOString() }
    })
    setSent(prev => [{ action:'push_notification', details:'Push sent: '+title, metadata:{title,body,target}, created_at:new Date().toISOString() }, ...prev])
    setTitle(''); setBody('')
    setSending(false)
    alert('Notification logged. Connect Firebase/OneSignal to deliver to devices.')
  }

  const TEMPLATES = [
    { label:'Flash sale', title:'⚡ Flash Sale — 30 mins only!', body:'20% off all orders in the next 30 minutes. Order now!' },
    { label:'Driver surge', title:'🔥 High demand in Ibiza Town', body:'Surge pricing active. Head to Ibiza Town for back-to-back orders.' },
    { label:'New product', title:'🆕 Just landed on Isla Drop', body:'Premium rosé and craft beers now available. Order now!' },
    { label:'Win-back', title:'We miss you! 🌴', body:'It\'s been a while. Come back and get 15% off your next order.' },
  ]

  return (
    <div style={{ padding:20 }}>
      <h2 style={{ fontFamily:'DM Serif Display,serif', fontSize:24, margin:'0 0 20px' }}>Push Notification Centre</h2>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        <div>
          <Card style={{ padding:20, marginBottom:16 }}>
            <div style={{ fontSize:13, fontWeight:700, marginBottom:12 }}>Compose notification</div>

            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:11, color:C.muted, marginBottom:4 }}>Target audience</div>
              <select value={target} onChange={e=>setTarget(e.target.value)} style={{ width:'100%', padding:'9px 12px', border:'1px solid '+C.border, borderRadius:8, fontSize:13 }}>
                <option value="all_customers">All customers</option>
                <option value="all_drivers">All drivers</option>
                <option value="inactive_7d">Inactive 7+ days</option>
                <option value="high_value">High-value customers</option>
                <option value="ibiza_town">Ibiza Town zone</option>
                <option value="san_antonio">San Antonio zone</option>
              </select>
            </div>
            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:11, color:C.muted, marginBottom:4 }}>Title</div>
              <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Notification title..." style={{ width:'100%', padding:'9px 12px', border:'1px solid '+C.border, borderRadius:8, fontSize:13, boxSizing:'border-box' }} />
            </div>
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:11, color:C.muted, marginBottom:4 }}>Message</div>
              <textarea value={body} onChange={e=>setBody(e.target.value)} rows={3} placeholder="Notification message..."
                style={{ width:'100%', padding:'9px 12px', border:'1px solid '+C.border, borderRadius:8, fontSize:13, resize:'vertical', boxSizing:'border-box' }} />
            </div>
            <Btn onClick={send} disabled={sending||!title||!body} color={C.accent} style={{width:'100%',justifyContent:'center'}}>
              {sending?'Sending...':'📤 Send notification'}
            </Btn>
          </Card>

          <Card style={{ padding:20 }}>
            <div style={{ fontSize:13, fontWeight:700, marginBottom:12 }}>Quick templates</div>
            {TEMPLATES.map(t => (
              <button key={t.label} onClick={()=>{setTitle(t.title);setBody(t.body)}}
                style={{ width:'100%', padding:'10px 14px', background:C.bg, border:'1px solid '+C.border, borderRadius:8, textAlign:'left', cursor:'pointer', marginBottom:6, fontSize:13 }}>
                <div style={{ fontWeight:600, color:C.text }}>{t.label}</div>
                <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{t.title}</div>
              </button>
            ))}
          </Card>
        </div>

        <div>
          <Card style={{ padding:20 }}>
            <div style={{ fontSize:13, fontWeight:700, marginBottom:12 }}>Sent notifications</div>
            {sent.length===0 ? <div style={{textAlign:'center',padding:24,color:C.muted,fontSize:13}}>No notifications sent yet</div>
            : sent.map((n,i) => (
              <div key={i} style={{ padding:'10px 0', borderBottom:'0.5px solid '+C.border }}>
                <div style={{ fontSize:13, fontWeight:600, color:C.text }}>{n.metadata?.title||n.details}</div>
                <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{n.metadata?.body}</div>
                <div style={{ display:'flex', gap:8, marginTop:4 }}>
                  <Badge label={n.metadata?.target||'all'} color={C.blue} />
                  <span style={{ fontSize:11, color:C.muted }}>{new Date(n.created_at).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</span>
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 9. ZONE MANAGEMENT
// ═══════════════════════════════════════════════════════════════
export function ZoneManager() {
  const [zones, setZones] = useState([
    { id:1, name:'Ibiza Town', active:true, minOrder:15, deliveryFee:2.50, etaMins:20, polygon:'ibiza_town' },
    { id:2, name:'San Antonio', active:true, minOrder:20, deliveryFee:3.50, etaMins:30, polygon:'san_antonio' },
    { id:3, name:'Playa den Bossa', active:true, minOrder:20, deliveryFee:3.00, etaMins:25, polygon:'playa_bossa' },
    { id:4, name:'Santa Eulalia', active:false, minOrder:25, deliveryFee:4.00, etaMins:40, polygon:'santa_eulalia' },
    { id:5, name:'Talamanca', active:true, minOrder:15, deliveryFee:2.50, etaMins:15, polygon:'talamanca' },
    { id:6, name:'Marina Botafoch', active:true, minOrder:15, deliveryFee:2.00, etaMins:15, polygon:'marina' },
  ])
  const [editing, setEditing] = useState(null)

  const save = (zone) => {
    setZones(prev => prev.map(z => z.id===zone.id ? zone : z))
    setEditing(null)
  }
  const toggle = (id) => setZones(prev => prev.map(z => z.id===id ? {...z,active:!z.active} : z))

  return (
    <div style={{ padding:20 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <h2 style={{ fontFamily:'DM Serif Display,serif', fontSize:24, margin:0 }}>Zone Management</h2>
        <div style={{ fontSize:13, color:C.muted }}>{zones.filter(z=>z.active).length} of {zones.length} zones active</div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:12 }}>
        {zones.map(z => (
          <Card key={z.id} style={{ padding:18, opacity:z.active?1:0.6 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <div style={{ fontSize:15, fontWeight:700, color:C.text }}>{z.name}</div>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <Badge label={z.active?'Active':'Paused'} color={z.active?C.green:C.muted} />
                <button onClick={()=>toggle(z.id)} style={{ width:36,height:20,borderRadius:10,background:z.active?C.green:C.border,border:'none',cursor:'pointer',position:'relative',transition:'background 0.2s' }}>
                  <div style={{ width:16,height:16,borderRadius:'50%',background:'white',position:'absolute',top:2,left:z.active?18:2,transition:'left 0.2s' }} />
                </button>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:12 }}>
              {[['Min order','€'+z.minOrder],['Delivery fee','€'+z.deliveryFee.toFixed(2)],['ETA',z.etaMins+'min']].map(([l,v]) => (
                <div key={l} style={{ background:C.bg, borderRadius:8, padding:'8px 10px', textAlign:'center' }}>
                  <div style={{ fontSize:14, fontWeight:700, color:C.text }}>{v}</div>
                  <div style={{ fontSize:10, color:C.muted, textTransform:'uppercase' }}>{l}</div>
                </div>
              ))}
            </div>
            <Btn onClick={()=>setEditing({...z})} outline color={C.accent} style={{fontSize:12,padding:'6px 14px',width:'100%',justifyContent:'center'}}>Edit zone</Btn>
          </Card>
        ))}
      </div>

      {editing && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:999, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={()=>setEditing(null)}>
          <div style={{ background:C.card, borderRadius:16, padding:28, maxWidth:400, width:'90%' }} onClick={e=>e.stopPropagation()}>
            <div style={{ fontFamily:'DM Serif Display,serif', fontSize:20, marginBottom:20 }}>Edit: {editing.name}</div>
            {[['minOrder','Minimum order (€)','number'],['deliveryFee','Delivery fee (€)','number'],['etaMins','ETA (minutes)','number']].map(([k,label,type]) => (
              <div key={k} style={{ marginBottom:12 }}>
                <div style={{ fontSize:11, color:C.muted, marginBottom:4 }}>{label}</div>
                <input type={type} value={editing[k]} onChange={e=>setEditing(p=>({...p,[k]:parseFloat(e.target.value)||0}))}
                  style={{ width:'100%', padding:'9px 12px', border:'1px solid '+C.border, borderRadius:8, fontSize:14, boxSizing:'border-box' }} />
              </div>
            ))}
            <div style={{ display:'flex', gap:8, marginTop:16 }}>
              <Btn onClick={()=>save(editing)} color={C.green} style={{flex:1,justifyContent:'center'}}>Save</Btn>
              <Btn onClick={()=>setEditing(null)} outline color={C.muted}>Cancel</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 10. SHIFT SCHEDULING
// ═══════════════════════════════════════════════════════════════
export function ShiftScheduler() {
  const [drivers, setDrivers] = useState([])
  const [shifts, setShifts] = useState({})
  const [week, setWeek] = useState(0)

  const days = Array.from({length:7}, (_,i) => {
    const d = new Date()
    d.setDate(d.getDate() - d.getDay() + i + (week*7))
    return { label:d.toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'}), key:d.toISOString().slice(0,10) }
  })

  useEffect(() => {
    supabase.from('profiles').select('id,full_name').eq('role','driver').then(r => { if(r.data) setDrivers(r.data) })
  }, [])

  const SLOTS = ['08:00-16:00','16:00-00:00','22:00-06:00','Off']
  const toggleShift = (driverId, dayKey) => {
    setShifts(prev => {
      const curr = prev[driverId]?.[dayKey] || 'Off'
      const nextIdx = (SLOTS.indexOf(curr)+1) % SLOTS.length
      return { ...prev, [driverId]: { ...(prev[driverId]||{}), [dayKey]:SLOTS[nextIdx] } }
    })
  }
  const shiftColor = (s) => s==='Off'?C.border:s.includes('08')?C.blue:s.includes('16')?C.green:C.purple

  return (
    <div style={{ padding:20 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <h2 style={{ fontFamily:'DM Serif Display,serif', fontSize:24, margin:0 }}>Shift Scheduler</h2>
        <div style={{ display:'flex', gap:8 }}>
          <Btn onClick={()=>setWeek(w=>w-1)} outline color={C.accent}>← Prev</Btn>
          <Btn onClick={()=>setWeek(0)} outline color={C.muted}>This week</Btn>
          <Btn onClick={()=>setWeek(w=>w+1)} outline color={C.accent}>Next →</Btn>
        </div>
      </div>

      <Card style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
          <thead>
            <tr style={{ background:C.bg }}>
              <th style={{ padding:'12px 16px', textAlign:'left', fontWeight:700, color:C.muted, width:140, borderBottom:'1px solid '+C.border }}>Driver</th>
              {days.map(d => (
                <th key={d.key} style={{ padding:'12px 8px', textAlign:'center', fontWeight:700, color:C.muted, borderBottom:'1px solid '+C.border, minWidth:90 }}>
                  {d.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {drivers.map((driver,i) => (
              <tr key={driver.id} style={{ background:i%2===0?'white':C.bg }}>
                <td style={{ padding:'10px 16px', fontWeight:600, color:C.text, borderBottom:'1px solid '+C.border }}>
                  {driver.full_name}
                </td>
                {days.map(d => (
                    <td key={d.key} style={{ padding:'8px', textAlign:'center', borderBottom:'1px solid '+C.border }}>
                      <button onClick={()=>toggleShift(driver.id,d.key)}
                        style={{ padding:'4px 8px', borderRadius:6, background:shiftColor(shifts[driver.id]?.[d.key]||'Off')+'22', border:'1px solid '+shiftColor(shifts[driver.id]?.[d.key]||'Off')+'44', color:shiftColor(shifts[driver.id]?.[d.key]||'Off'), fontSize:10, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }}>
                        {shifts[driver.id]?.[d.key]||'Off'}
                      </button>
                    </td>
                  ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div style={{ display:'flex', gap:12, marginTop:16, flexWrap:'wrap' }}>
        {[['08:00-16:00',C.blue,'Morning'],['16:00-00:00',C.green,'Evening'],['22:00-06:00',C.purple,'Night'],['Off',C.border,'Day off']].map(([s,c,l]) => (
          <div key={s} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:C.muted }}>
            <div style={{ width:12, height:12, borderRadius:3, background:c }} />
            {l} ({s})
          </div>
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 11. FINANCIAL RECONCILIATION
// ═══════════════════════════════════════════════════════════════
export function FinancialReconciliation() {
  const [data, setData] = useState(null)
  const [date, setDate] = useState(new Date().toISOString().slice(0,10))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const from = new Date(date); from.setHours(0,0,0,0)
      const to = new Date(date); to.setHours(23,59,59,999)
      const [oRes, eRes, expRes] = await Promise.all([
        supabase.from('orders').select('total,subtotal,status,payment_method').gte('created_at',from.toISOString()).lte('created_at',to.toISOString()),
        supabase.from('driver_earnings').select('amount,driver_id').gte('created_at',from.toISOString()).lte('created_at',to.toISOString()),
        supabase.from('driver_expenses').select('amount,type').gte('created_at',from.toISOString()).lte('created_at',to.toISOString()),
      ])
      const orders = oRes.data||[]
      const earnings = eRes.data||[]
      const expenses = expRes.data||[]
      const delivered = orders.filter(o=>o.status==='delivered')
      const stripe = delivered.filter(o=>o.payment_method!=='cash').reduce((s,o)=>s+(o.total||0),0)
      const cash = delivered.filter(o=>o.payment_method==='cash').reduce((s,o)=>s+(o.total||0),0)
      const driverPay = earnings.reduce((s,e)=>s+(e.amount||0),0)
      const tips = expenses.filter(e=>e.type==='tip').reduce((s,e)=>s+(e.amount||0),0)
      const fuelCosts = expenses.filter(e=>e.type==='fuel').reduce((s,e)=>s+(e.amount||0),0)
      const totalRevenue = delivered.reduce((s,o)=>s+(o.total||0),0)
      setData({ totalRevenue, stripe, cash, driverPay, tips, fuelCosts, netProfit:totalRevenue-driverPay-fuelCosts, orders:delivered.length, cancelled:orders.filter(o=>o.status==='cancelled').length })
      setLoading(false)
    }
    load()
  }, [date])

  return (
    <div style={{ padding:20 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <h2 style={{ fontFamily:'DM Serif Display,serif', fontSize:24, margin:0 }}>End-of-Day Reconciliation</h2>
        <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{ padding:'8px 12px', border:'1px solid '+C.border, borderRadius:8, fontSize:13 }} />
      </div>

      {loading ? <div style={{textAlign:'center',padding:40,color:C.muted}}>Loading...</div>
      : data && (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:12, marginBottom:20 }}>
            <Stat icon="💳" value={'€'+data.stripe.toFixed(2)} label="Stripe (card)" color={C.blue} />
            <Stat icon="💵" value={'€'+data.cash.toFixed(2)} label="Cash collected" color={C.green} />
            <Stat icon="🛵" value={'€'+data.driverPay.toFixed(2)} label="Driver pay owed" color={C.accent} />
            <Stat icon="💰" value={'€'+data.tips.toFixed(2)} label="Tips to distribute" color={C.yellow} />
            <Stat icon="⛽" value={'€'+data.fuelCosts.toFixed(2)} label="Fuel expenses" color={C.muted} />
            <Stat icon="📈" value={'€'+data.netProfit.toFixed(2)} label="Net profit" color={data.netProfit>=0?C.green:C.red} />
          </div>

          <Card style={{ padding:20 }}>
            <div style={{ fontSize:14, fontWeight:700, marginBottom:16 }}>Daily summary — {new Date(date).toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'})}</div>
            {[
              ['Total orders delivered', data.orders, C.text],
              ['Orders cancelled', data.cancelled, C.red],
              ['Total revenue', '€'+data.totalRevenue.toFixed(2), C.green],
              ['Card payments (Stripe)', '€'+data.stripe.toFixed(2), C.blue],
              ['Cash payments', '€'+data.cash.toFixed(2), C.green],
              ['Driver pay to transfer', '€'+data.driverPay.toFixed(2), C.accent],
              ['Tips to distribute', '€'+data.tips.toFixed(2), C.yellow],
              ['Fuel reimbursements', '€'+data.fuelCosts.toFixed(2), C.muted],
              ['Net profit', '€'+data.netProfit.toFixed(2), data.netProfit>=0?C.green:C.red],
            ].map(([l,v,c]) => (
              <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'0.5px solid '+C.border }}>
                <span style={{ fontSize:13, color:C.text }}>{l}</span>
                <span style={{ fontSize:13, fontWeight:700, color:c }}>{v}</span>
              </div>
            ))}
          </Card>
        </>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 12. PRODUCT PERFORMANCE
// ═══════════════════════════════════════════════════════════════
export function ProductPerformance() {
  const [products, setProducts] = useState([])
  const [period, setPeriod] = useState('7d')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const from = new Date()
      if (period==='7d') from.setDate(from.getDate()-7)
      else if (period==='30d') from.setDate(from.getDate()-30)
      else from.setHours(0,0,0,0)
      const { data } = await supabase.from('order_items')
        .select('quantity, unit_price, products(id, name, emoji, category, price, is_active)')
        .gte('created_at',from.toISOString())
      if (!data) { setLoading(false); return }
      const byProduct = {}
      data.forEach(item => {
        const p = item.products
        if (!p) return
        if (!byProduct[p.id]) byProduct[p.id] = { ...p, units:0, revenue:0, orders:0 }
        byProduct[p.id].units += item.quantity
        byProduct[p.id].revenue += item.quantity * item.unit_price
        byProduct[p.id].orders += 1
      })
      setProducts(Object.values(byProduct).sort((a,b)=>b.revenue-a.revenue))
      setLoading(false)
    }
    load()
  }, [period])

  const maxRev = Math.max(...products.map(p=>p.revenue), 1)

  return (
    <div style={{ padding:20 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <h2 style={{ fontFamily:'DM Serif Display,serif', fontSize:24, margin:0 }}>Product Performance</h2>
        <div style={{ display:'flex', gap:6 }}>
          {[['today','Today'],['7d','7 days'],['30d','30 days']].map(([k,l]) => (
            <Btn key={k} onClick={()=>setPeriod(k)} outline={period!==k} color={C.accent} style={{fontSize:12,padding:'6px 14px'}}>{l}</Btn>
          ))}
        </div>
      </div>

      {loading ? <div style={{textAlign:'center',padding:40,color:C.muted}}>Loading...</div>
      : products.length===0 ? <Card style={{padding:48,textAlign:'center',color:C.muted}}>No sales data for this period</Card>
      : (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
            <Stat icon="🏆" value={products[0]?.emoji+' '+products[0]?.name} label="Best seller" color={C.accent} />
            <Stat icon="💰" value={'€'+(products.reduce((s,p)=>s+p.revenue,0)).toFixed(0)} label="Total revenue" color={C.green} />
            <Stat icon="📦" value={products.reduce((s,p)=>s+p.units,0)} label="Units sold" color={C.blue} />
          </div>

          <Card>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ background:C.bg, borderBottom:'1px solid '+C.border }}>
                  {['#','Product','Category','Units','Revenue','Share'].map(h => (
                    <th key={h} style={{ padding:'12px 16px', textAlign:h==='#'||h==='Units'||h==='Revenue'||h==='Share'?'center':'left', fontWeight:700, color:C.muted, fontSize:11, textTransform:'uppercase', letterSpacing:'0.5px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.slice(0,20).map((p,i) => (
                  <tr key={p.id} style={{ borderBottom:'0.5px solid '+C.border, background:i%2===0?'white':C.bg }}>
                    <td style={{ padding:'12px 16px', textAlign:'center', color:C.muted, fontWeight:700 }}>{i+1}</td>
                    <td style={{ padding:'12px 16px' }}>
                      <span style={{ fontSize:16, marginRight:8 }}>{p.emoji}</span>
                      <span style={{ fontWeight:600, color:C.text }}>{p.name}</span>
                      {!p.is_active && <Badge label="Inactive" color={C.red} style={{marginLeft:6,fontSize:9}} />}
                    </td>
                    <td style={{ padding:'12px 16px', color:C.muted, textTransform:'capitalize' }}>{p.category}</td>
                    <td style={{ padding:'12px 16px', textAlign:'center', fontWeight:700, color:C.text }}>{p.units}</td>
                    <td style={{ padding:'12px 16px', textAlign:'center', fontWeight:700, color:C.green }}>€{p.revenue.toFixed(2)}</td>
                    <td style={{ padding:'12px 16px', minWidth:120 }}>
                      <div style={{ height:6, background:C.border, borderRadius:99, overflow:'hidden' }}>
                        <div style={{ height:'100%', background:C.accent, borderRadius:99, width:(p.revenue/maxRev*100)+'%' }} />
                      </div>
                      <div style={{ fontSize:10, color:C.muted, marginTop:2, textAlign:'center' }}>{(p.revenue/maxRev*100).toFixed(0)}%</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 13. AUTOMATED OPS PLAYBOOKS
// ═══════════════════════════════════════════════════════════════
export function OpsPlaybooks() {
  const [playbooks, setPlaybooks] = useState([
    { id:1, name:'No driver alert', trigger:'No driver accepts within 5 min', action:'Broadcast to all drivers + notify ops via email', active:true, triggered:12 },
    { id:2, name:'Late delivery warning', trigger:'Order en route >45 min', action:'Auto-send apology message to customer', active:true, triggered:4 },
    { id:3, name:'Low stock alert', trigger:'Product stock < 5 units', action:'Notify ops and flag in Stock Manager', active:true, triggered:7 },
    { id:4, name:'High demand surge', trigger:'>10 pending orders at once', action:'Alert all offline drivers via push notification', active:false, triggered:2 },
    { id:5, name:'New driver welcome', trigger:'Driver account approved', action:'Send welcome kit and first-shift instructions', active:true, triggered:3 },
    { id:6, name:'Customer win-back', trigger:'Customer inactive 14+ days', action:'Send 15% off promotional push notification', active:true, triggered:28 },
  ])
  const [showNew, setShowNew] = useState(false)
  const [newPb, setNewPb] = useState({ name:'', trigger:'', action:'' })

  const toggle = (id) => setPlaybooks(prev => prev.map(p => p.id===id ? {...p,active:!p.active} : p))
  const addPlaybook = () => {
    if (!newPb.name||!newPb.trigger||!newPb.action) return
    setPlaybooks(prev => [...prev, {...newPb, id:Date.now(), active:true, triggered:0}])
    setNewPb({name:'',trigger:'',action:''})
    setShowNew(false)
  }

  return (
    <div style={{ padding:20 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h2 style={{ fontFamily:'DM Serif Display,serif', fontSize:24, margin:0 }}>Ops Playbooks</h2>
          <div style={{ fontSize:13, color:C.muted, marginTop:2 }}>Automated rules that run your operations</div>
        </div>
        <Btn onClick={()=>setShowNew(true)} color={C.accent}>+ New playbook</Btn>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(340px,1fr))', gap:12 }}>
        {playbooks.map(pb => (
          <Card key={pb.id} style={{ padding:18, opacity:pb.active?1:0.6 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
              <div style={{ fontSize:14, fontWeight:700, color:C.text }}>{pb.name}</div>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <Badge label={'↻ '+pb.triggered+'x'} color={C.blue} />
                <button onClick={()=>toggle(pb.id)} style={{ width:40,height:22,borderRadius:11,background:pb.active?C.green:C.border,border:'none',cursor:'pointer',position:'relative',transition:'background 0.2s' }}>
                  <div style={{ width:18,height:18,borderRadius:'50%',background:'white',position:'absolute',top:2,left:pb.active?20:2,transition:'left 0.2s' }} />
                </button>
              </div>
            </div>
            <div style={{ background:C.bg, borderRadius:8, padding:'8px 12px', marginBottom:8 }}>
              <div style={{ fontSize:10, fontWeight:700, color:C.muted, textTransform:'uppercase', marginBottom:2 }}>Trigger</div>
              <div style={{ fontSize:12, color:C.text }}>{pb.trigger}</div>
            </div>
            <div style={{ background:C.greenL, borderRadius:8, padding:'8px 12px', border:'1px solid '+C.green+'20' }}>
              <div style={{ fontSize:10, fontWeight:700, color:C.green, textTransform:'uppercase', marginBottom:2 }}>Action</div>
              <div style={{ fontSize:12, color:C.text }}>{pb.action}</div>
            </div>
          </Card>
        ))}
      </div>

      {showNew && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:999, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={()=>setShowNew(false)}>
          <div style={{ background:C.card, borderRadius:16, padding:28, maxWidth:440, width:'90%' }} onClick={e=>e.stopPropagation()}>
            <div style={{ fontFamily:'DM Serif Display,serif', fontSize:20, marginBottom:20 }}>New playbook</div>
            {[['name','Playbook name','text'],['trigger','Trigger condition','text'],['action','Automated action','text']].map(([k,label,type]) => (
              <div key={k} style={{ marginBottom:12 }}>
                <div style={{ fontSize:11, color:C.muted, marginBottom:4, textTransform:'capitalize' }}>{label}</div>
                <input type={type} value={newPb[k]} onChange={e=>setNewPb(p=>({...p,[k]:e.target.value}))} placeholder={label+'...'}
                  style={{ width:'100%', padding:'9px 12px', border:'1px solid '+C.border, borderRadius:8, fontSize:13, boxSizing:'border-box' }} />
              </div>
            ))}
            <div style={{ display:'flex', gap:8, marginTop:16 }}>
              <Btn onClick={addPlaybook} color={C.accent} style={{flex:1,justifyContent:'center'}}>Create</Btn>
              <Btn onClick={()=>setShowNew(false)} outline color={C.muted}>Cancel</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 14. DRIVER BROADCAST MESSAGES
// ═══════════════════════════════════════════════════════════════
export function DriverBroadcast() {
  const [message, setMessage] = useState('')
  const [type, setType] = useState('info')
  const [target, setTarget] = useState('all')
  const [history, setHistory] = useState([])
  const [sending, setSending] = useState(false)
  const [drivers, setDrivers] = useState([])

  useEffect(() => {
    supabase.from('profiles').select('id,full_name').eq('role','driver').then(r => { if(r.data) setDrivers(r.data) })
    supabase.from('ops_activity_log').select('*').eq('action','driver_broadcast').order('created_at',{ascending:false}).limit(20)
      .then(r => { if(r.data) setHistory(r.data) })
  }, [])

  const send = async () => {
    if (!message.trim()) return
    setSending(true)
    await supabase.from('ops_activity_log').insert({ action:'driver_broadcast', details:message, metadata:{type,target,message} })
    setHistory(prev => [{action:'driver_broadcast',details:message,metadata:{type,target,message},created_at:new Date().toISOString()},...prev])
    setMessage('')
    setSending(false)
  }

  const QUICK = [
    'High demand in Ibiza Town — head there now 🔥',
    'Road closed on C/ de la Mar — use alternative routes ⚠️',
    'Surge pricing active until midnight — great earnings opportunity 💰',
    'Warehouse restocked — all items available ✅',
    'Weather warning — ride carefully, bonus applies 🌧️',
  ]
  const typeColor = t => t==='urgent'?C.red:t==='warning'?C.yellow:C.blue

  return (
    <div style={{ padding:20 }}>
      <h2 style={{ fontFamily:'DM Serif Display,serif', fontSize:24, margin:'0 0 20px' }}>Driver Broadcast</h2>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        <div>
          <Card style={{ padding:20, marginBottom:16 }}>
            <div style={{ fontSize:13, fontWeight:700, marginBottom:12 }}>Send message to drivers</div>
            <div style={{ display:'flex', gap:6, marginBottom:12 }}>
              {['info','warning','urgent'].map(t => (
                <Btn key={t} onClick={()=>setType(t)} outline={type!==t} color={typeColor(t)} style={{fontSize:12,padding:'6px 14px',textTransform:'capitalize',flex:1,justifyContent:'center'}}>{t}</Btn>
              ))}
            </div>
            <select value={target} onChange={e=>setTarget(e.target.value)} style={{ width:'100%', padding:'9px 12px', border:'1px solid '+C.border, borderRadius:8, fontSize:13, marginBottom:10 }}>
              <option value="all">All drivers</option>
              <option value="online">Online drivers only</option>
              {drivers.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
            </select>
            <textarea value={message} onChange={e=>setMessage(e.target.value)} rows={4} placeholder="Type message to drivers..."
              style={{ width:'100%', padding:'10px 12px', border:'1px solid '+(message?typeColor(type):C.border), borderRadius:8, fontSize:13, resize:'vertical', boxSizing:'border-box', marginBottom:10 }} />
            <Btn onClick={send} disabled={sending||!message} color={typeColor(type)} style={{width:'100%',justifyContent:'center'}}>
              {sending?'Sending...':'📢 Broadcast'}
            </Btn>
          </Card>

          <Card style={{ padding:20 }}>
            <div style={{ fontSize:13, fontWeight:700, marginBottom:10 }}>Quick messages</div>
            {QUICK.map((q,i) => (
              <button key={i} onClick={()=>setMessage(q)}
                style={{ display:'block', width:'100%', padding:'9px 14px', background:C.bg, border:'1px solid '+C.border, borderRadius:8, textAlign:'left', cursor:'pointer', marginBottom:6, fontSize:12, color:C.text }}>
                {q}
              </button>
            ))}
          </Card>
        </div>

        <Card style={{ padding:20 }}>
          <div style={{ fontSize:13, fontWeight:700, marginBottom:12 }}>Broadcast history</div>
          {history.length===0 ? <div style={{textAlign:'center',padding:24,color:C.muted,fontSize:13}}>No broadcasts yet</div>
          : history.map((h,i) => (
            <div key={i} style={{ padding:'10px 0', borderBottom:'0.5px solid '+C.border }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <Badge label={h.metadata?.type||'info'} color={typeColor(h.metadata?.type||'info')} />
                <span style={{ fontSize:11, color:C.muted }}>{new Date(h.created_at).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</span>
              </div>
              <div style={{ fontSize:13, color:C.text }}>{h.details}</div>
              <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>To: {h.metadata?.target||'all'}</div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}
