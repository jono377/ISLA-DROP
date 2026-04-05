import { useState, useEffect, useRef, useCallback } from 'react'
import {
  getOpsStats, subscribeToAllOrders, subscribeToDriverLocation
} from '../../lib/supabase'
import { supabase } from '../../lib/supabase'
import { useOpsStore } from '../../lib/store'
import { formatDistanceToNow } from 'date-fns'


const ORDER_STATUS_LABELS = {
  pending: 'Pending', age_check: 'ID Check', confirmed: 'Confirmed',
  preparing: 'Preparing', assigned: 'Assigned', picked_up: 'Picked up',
  en_route: 'En route', delivered: 'Delivered', cancelled: 'Cancelled',
}

const STATUS_COLORS = {
  pending: '#E0D8CC', age_check: '#FAC775', confirmed: '#B5D4F4',
  preparing: '#B5D4F4', assigned: '#C0DD97', picked_up: '#9FE1CB',
  en_route: '#5DCAA5', delivered: '#1D9E75', cancelled: '#F09595',
}



// ── AI Stock & Supply Assistant ───────────────────────────────
function StockAI() {
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: 'Hi! I am your stock management AI. Tell me what items are running low and I will find the nearest places for drivers to restock. I can also analyse order patterns and flag what needs restocking before it runs out.'
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const send = async (text) => {
    const q = (text || input).trim()
    if (!q || loading) return
    const history = [...messages, { role: 'user', content: q }]
    setMessages(history)
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 500,
          system: `You are the stock and supply AI for Isla Drop, a 24/7 delivery service in Ibiza, Spain.

Your job:
1. When told items are low in stock, find the nearest places in Ibiza where drivers can quickly purchase them
2. Suggest specific supermarkets, wholesale suppliers and convenience stores in Ibiza that stock these items
3. Give practical routing advice based on driver locations in Ibiza
4. Flag items that are likely to run out based on order patterns (e.g. ice runs out fastest in summer, Red Bull popular after midnight)
5. Suggest order quantities and timing

KNOWN IBIZA SUPPLIERS:
- Mercadona (several locations: Ibiza Town, San Antonio, Santa Eulalia) - general groceries, ice, soft drinks
- Eroski (Ibiza Town, Santa Eulalia) - general groceries
- Supeco (San Antonio area) - wholesale, bulk items
- Cash & Carry Ibiza (Polígono Industrial, near airport) - wholesale tobacco, drinks, snacks
- Lidl (San Antonio, Ibiza Town) - value restocking
- El Corte Ingles (Ibiza Town) - premium items, wines, spirits
- Several 24h petrol station shops for emergency small restocks

Keep responses practical and concise — under 150 words. Include specific store names and rough drive times from common areas.`,
          messages: history.map(m => ({ role: m.role, content: m.content })),
        }),
      })
      const data = await res.json()
      const reply = data.content?.[0]?.text || 'Unable to process right now.'
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Check your network and try again.' }])
    }
    setLoading(false)
  }

  const QUICK = ['Ice running low', 'Red Bull out of stock', 'Champagne low', 'Tobacco almost gone', 'Water stock check', 'Snacks reorder needed']

  return (
    <div>
      <div style={{ fontFamily: 'DM Serif Display,serif', fontSize: 22, marginBottom: 6 }}>Stock AI</div>
      <div style={{ fontSize: 13, color: '#7A6E60', marginBottom: 16 }}>Find restock locations for drivers · Analyse low stock</div>

      <div style={{ background: '#F5F0E8', borderRadius: 12, padding: 14, marginBottom: 14, minHeight: 240, maxHeight: 360, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{ background: m.role === 'user' ? '#0D3B4A' : 'white', color: m.role === 'user' ? 'white' : '#2A2318', borderRadius: 10, padding: '9px 13px', maxWidth: '85%', fontSize: 13, lineHeight: 1.55, fontFamily: 'DM Sans,sans-serif', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: 5, padding: '8px 12px', background: 'white', borderRadius: 10, alignItems: 'center', width: 'fit-content', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            {[0,1,2].map(d => <div key={d} style={{ width: 6, height: 6, borderRadius: '50%', background: '#7A6E60', animation: 'bounce 1.2s ' + (d*0.2) + 's infinite ease-in-out' }} />)}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 12 }}>
        {QUICK.map(q => (
          <button key={q} onClick={() => send(q)} style={{ padding: '6px 12px', background: 'white', border: '0.5px solid rgba(42,35,24,0.15)', borderRadius: 20, fontSize: 11, color: '#7A6E60', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>{q}</button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="e.g. We are out of ice bags at the warehouse..."
          style={{ flex: 1, padding: '11px 14px', background: 'white', border: '0.5px solid rgba(42,35,24,0.15)', borderRadius: 24, fontFamily: 'DM Sans,sans-serif', fontSize: 13, color: '#2A2318', outline: 'none' }} />
        <button onClick={() => send()} style={{ width: 42, height: 42, background: '#0D3B4A', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M22 2L11 13"/><path d="M22 2L15 22l-4-9-9-4 20-7z"/></svg>
        </button>
      </div>
      <style>{`@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}`}</style>
    </div>
  )
}

function ConciergeBookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [updating, setUpdating] = useState(null)

  useEffect(() => {
    loadBookings()
    const interval = setInterval(loadBookings, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadBookings = async () => {
    try {
      const { supabase } = await import('../../lib/supabase')
      const { data } = await supabase
        .from('concierge_bookings')
        .select('*')
        .order('created_at', { ascending: false })
      if (data) setBookings(data)
    } catch (err) {
      console.error('Failed to load bookings:', err)
    }
    setLoading(false)
  }

  const updateStatus = async (id, status, notes = '') => {
    setUpdating(id)
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      await fetch(supabaseUrl + '/functions/v1/process-concierge-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + supabaseKey },
        body: JSON.stringify({ type: 'update_status', booking_id: id, status, ops_notes: notes })
      })
      await loadBookings()
      toast.success('Booking ' + status)
    } catch {
      toast.error('Update failed')
    }
    setUpdating(null)
  }

  const STATUS_COLORS = {
    pending: { bg: 'rgba(245,201,122,0.2)', color: '#8B7020', label: 'Pending' },
    confirmed: { bg: 'rgba(90,107,58,0.2)', color: '#5A6B3A', label: 'Confirmed' },
    cancelled: { bg: 'rgba(196,104,58,0.2)', color: '#C4683A', label: 'Cancelled' },
    completed: { bg: 'rgba(43,122,139,0.2)', color: '#2B7A8B', label: 'Completed' },
  }

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter)
  const revenue = bookings.filter(b => b.status === 'confirmed' || b.status === 'completed').reduce((s, b) => s + (b.commission_amount || 0), 0)

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: '#7A6E60' }}>Loading bookings...</div>

  return (
    <div>
      <div style={{ fontFamily: 'DM Serif Display,serif', fontSize: 22, marginBottom: 16 }}>Concierge Bookings</div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Total', value: bookings.length, color: '#0D3B4A' },
          { label: 'Pending', value: bookings.filter(b => b.status === 'pending').length, color: '#8B7020' },
          { label: 'Commission', value: '€' + revenue.toFixed(0), color: '#5A6B3A' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', borderRadius: 12, padding: '12px 14px', border: '0.5px solid rgba(42,35,24,0.1)' }}>
            <div style={{ fontSize: 22, fontWeight: 500, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#7A6E60', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 7, marginBottom: 14, flexWrap: 'wrap' }}>
        {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, background: filter === f ? '#0D3B4A' : 'white', color: filter === f ? 'white' : '#7A6E60', border: '0.5px solid rgba(42,35,24,0.15)', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', textTransform: 'capitalize' }}>
            {f}
          </button>
        ))}
      </div>

      {/* Bookings list */}
      {filtered.length === 0 && <div style={{ textAlign: 'center', padding: '40px 0', color: '#7A6E60', fontSize: 14 }}>No {filter} bookings yet</div>}

      {filtered.map(b => {
        const sc = STATUS_COLORS[b.status] || STATUS_COLORS.pending
        return (
          <div key={b.id} style={{ background: 'white', borderRadius: 14, padding: 16, marginBottom: 12, border: '0.5px solid rgba(42,35,24,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#2A2318' }}>{b.service_name}</div>
                <div style={{ fontSize: 11, color: '#7A6E60', marginTop: 2 }}>{b.booking_ref} · {b.partner}</div>
              </div>
              <div style={{ background: sc.bg, color: sc.color, borderRadius: 20, padding: '4px 10px', fontSize: 11, fontWeight: 500 }}>{sc.label}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 12, fontSize: 12, color: '#7A6E60' }}>
              <span>📅 {new Date(b.booking_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              <span>👥 {b.guests} guests</span>
              <span>💰 €{b.total_price?.toLocaleString()}</span>
              <span>🏷 Commission: €{b.commission_amount?.toFixed(2) || '0'}</span>
              <span style={{ gridColumn: 'span 2' }}>👤 {b.customer_name} · {b.customer_email}</span>
            </div>
            {b.special_notes && <div style={{ fontSize: 12, color: '#7A6E60', background: '#F5F0E8', borderRadius: 8, padding: '8px 10px', marginBottom: 10 }}>Notes: {b.special_notes}</div>}
            {b.ai_notes && <div style={{ fontSize: 11, color: '#2B7A8B', background: 'rgba(43,122,139,0.08)', borderRadius: 8, padding: '7px 10px', marginBottom: 10 }}>AI: {b.ai_notes}</div>}
            {b.status === 'pending' && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => updateStatus(b.id, 'confirmed', 'Booking confirmed by Isla Drop concierge team.')} disabled={updating === b.id}
                  style={{ flex: 1, padding: '9px', background: '#5A6B3A', color: 'white', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>
                  Confirm
                </button>
                <button onClick={() => updateStatus(b.id, 'cancelled', 'Unfortunately this booking cannot be accommodated.')} disabled={updating === b.id}
                  style={{ flex: 1, padding: '9px', background: 'rgba(196,104,58,0.1)', color: '#C4683A', border: '0.5px solid rgba(196,104,58,0.3)', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>
                  Cancel
                </button>
              </div>
            )}
            {b.status === 'confirmed' && (
              <button onClick={() => updateStatus(b.id, 'completed')} disabled={updating === b.id}
                style={{ width: '100%', padding: '9px', background: 'rgba(43,122,139,0.1)', color: '#2B7A8B', border: '0.5px solid rgba(43,122,139,0.3)', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>
                Mark as Completed
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}


// ── Driver Approval Queue ─────────────────────────────────────
function DriverApprovals() {
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing]   = useState(null)

  const load = async () => {
    try {
      const { supabase } = await import('../../lib/supabase')
      const { data } = await supabase
        .from('profiles')
        .select(`*, drivers(vehicle_type, vehicle_plate, licence_number, status)`)
        .eq('role', 'driver')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
      if (data) setPending(data)
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const approve = async (driver) => {
    setActing(driver.id)
    try {
      const { supabase } = await import('../../lib/supabase')
      await supabase.from('profiles').update({ status: 'active' }).eq('id', driver.id)
      await supabase.from('drivers').update({ status: 'active' }).eq('id', driver.id)
      toast.success('Driver approved!')
      setPending(prev => prev.filter(d => d.id !== driver.id))
    } catch { toast.error('Approval failed') }
    setActing(null)
  }

  const reject = async (driver) => {
    if (!confirm('Reject this driver? This will delete their account.')) return
    setActing(driver.id)
    try {
      const { supabase } = await import('../../lib/supabase')
      await supabase.from('profiles').delete().eq('id', driver.id)
      toast.success('Application rejected')
      setPending(prev => prev.filter(d => d.id !== driver.id))
    } catch { toast.error('Rejection failed') }
    setActing(null)
  }

  if (loading) return <div style={{ textAlign:'center', padding:40, color:'#7A6E60' }}>Loading applications...</div>

  return (
    <div>
      <div style={{ fontFamily:'DM Serif Display,serif', fontSize:22, marginBottom:6 }}>Driver Applications</div>
      <div style={{ fontSize:13, color:'#7A6E60', marginBottom:20 }}>Review and approve new driver registrations</div>

      {pending.length === 0 ? (
        <div style={{ textAlign:'center', padding:'50px 0' }}>
          <div style={{ fontSize:48, marginBottom:12 }}>✅</div>
          <div style={{ fontSize:16, fontWeight:500, color:'#0D3B4A', marginBottom:6 }}>All clear</div>
          <div style={{ fontSize:13, color:'#7A6E60' }}>No pending driver applications right now</div>
        </div>
      ) : (
        <>
          <div style={{ background:'rgba(245,201,122,0.15)', border:'0.5px solid rgba(245,201,122,0.4)', borderRadius:10, padding:'10px 14px', marginBottom:16, fontSize:13, color:'#8B7020' }}>
            {pending.length} application{pending.length !== 1 ? 's' : ''} awaiting review
          </div>

          {pending.map(driver => (
            <div key={driver.id} style={{ background:'white', borderRadius:14, padding:18, marginBottom:12, border:'0.5px solid rgba(42,35,24,0.1)' }}>
              {/* Header */}
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                <div style={{ width:44, height:44, borderRadius:'50%', background:'linear-gradient(135deg,#C4683A,#E8854A)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, color:'white', fontWeight:500, flexShrink:0 }}>
                  {(driver.full_name||'?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize:15, fontWeight:500, color:'#2A2318' }}>{driver.full_name || 'Unknown'}</div>
                  <div style={{ fontSize:12, color:'#7A6E60', marginTop:1 }}>{driver.email || '—'}</div>
                </div>
                <div style={{ marginLeft:'auto', background:'rgba(245,201,122,0.2)', color:'#8B7020', borderRadius:20, padding:'4px 10px', fontSize:11, fontWeight:500 }}>
                  Pending
                </div>
              </div>

              {/* Details grid */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:14 }}>
                {[
                  { label:'Phone', value: driver.phone || 'Not provided' },
                  { label:'Vehicle', value: driver.drivers?.vehicle_type || 'Not provided' },
                  { label:'Plate', value: driver.drivers?.vehicle_plate || 'Not provided' },
                  { label:'Licence', value: driver.drivers?.licence_number || 'Not provided' },
                  { label:'Applied', value: new Date(driver.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' }) },
                  { label:'Status', value: 'Awaiting approval' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background:'#F5F0E8', borderRadius:8, padding:'8px 10px' }}>
                    <div style={{ fontSize:10, color:'#7A6E60', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:3 }}>{label}</div>
                    <div style={{ fontSize:13, color:'#2A2318', fontWeight:500 }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div style={{ display:'flex', gap:8 }}>
                <button
                  onClick={() => approve(driver)}
                  disabled={acting === driver.id}
                  style={{ flex:1, padding:'11px', background:'#5A6B3A', color:'white', border:'none', borderRadius:10, fontFamily:'DM Sans,sans-serif', fontSize:13, fontWeight:500, cursor:'pointer', opacity: acting===driver.id?0.6:1 }}>
                  {acting === driver.id ? '...' : '✓ Approve Driver'}
                </button>
                <button
                  onClick={() => reject(driver)}
                  disabled={acting === driver.id}
                  style={{ flex:1, padding:'11px', background:'rgba(196,104,58,0.08)', color:'#C4683A', border:'0.5px solid rgba(196,104,58,0.3)', borderRadius:10, fontFamily:'DM Sans,sans-serif', fontSize:13, cursor:'pointer', opacity: acting===driver.id?0.6:1 }}>
                  ✕ Reject
                </button>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  )
}

export default function OpsApp() {
  const [tab, setTab] = useState('overview')
  const { stats, liveOrders, drivers, alerts, setStats, setLiveOrders, setDrivers, addAlert } = useOpsStore()
  const [clock, setClock] = useState(new Date())

  const loadData = useCallback(async () => {
    const [statsData, ordersRes, driversRes] = await Promise.all([
      getOpsStats(),
      supabase.from('orders').select(`*, order_items(quantity, products(name,emoji)), drivers(*, profiles(full_name))`).not('status', 'eq', 'cancelled').order('created_at', { ascending: false }).limit(50),
      supabase.from('drivers').select('*, profiles(full_name, avatar_url)').order('is_online', { ascending: false }),
    ])
    setStats(statsData)
    if (ordersRes.data) setLiveOrders(ordersRes.data)
    if (driversRes.data) setDrivers(driversRes.data)
  }, [setStats, setLiveOrders, setDrivers])

  useEffect(() => {
    loadData()
    const sub = subscribeToAllOrders(() => { loadData(); addAlert({ text: 'Order updated', time: new Date(), type: 'info' }) })
    const tick = setInterval(() => setClock(new Date()), 1000)
    return () => { sub.unsubscribe(); clearInterval(tick) }
  }, [loadData])

  const activeOrders = liveOrders.filter(o => !['delivered', 'cancelled'].includes(o.status))
  const recentDelivered = liveOrders.filter(o => o.status === 'delivered').slice(0, 5)

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: '#1E1810', padding: '20px 20px 16px', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 22 }}>Ops Dashboard</div>
          <div style={{ fontSize: 11, opacity: 0.45, textAlign: 'right' }}>
            <div>{clock.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
            <div>Ibiza · Live</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
          <KPI val={stats.activeOrders} label="Active orders" delta="Live" />
          <KPI val={stats.onlineDrivers} label="Drivers online" delta={drivers.filter(d => d.is_online && !d.current_order_id).length + ' idle'} />
          <KPI val={stats.avgEta ? stats.avgEta + 'm' : '—'} label="Avg ETA" delta="Today" />
        </div>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', background: '#F5F0E8', borderBottom: '0.5px solid rgba(42,35,24,0.12)' }}>
        {['overview', 'orders', 'fleet', 'map', 'stock', 'sale', 'discounts', 'concierge', 'drivers', 'images'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1, padding: '12px 4px', border: 'none', background: 'none', cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: tab === t ? 500 : 400,
              color: tab === t ? '#C4683A' : '#7A6E60',
              borderBottom: tab === t ? '2px solid #C4683A' : '2px solid transparent',
              textTransform: 'capitalize',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        {tab === 'overview' && <OverviewTab activeOrders={activeOrders} drivers={drivers} alerts={alerts} />}
        {tab === 'orders' && <OrdersTab orders={liveOrders} />}
        {tab === 'fleet' && <FleetTab drivers={drivers} />}
        {tab === 'map' && <MapTab drivers={drivers} orders={activeOrders} />}
        {tab === 'images' && <div style={{ margin:'0 -16px' }}><ImageManager /></div>}
        {tab === 'stock' && <StockManager />}
        {tab === 'sale' && <SaleManager />}
        {tab === 'discounts' && <DiscountManager />}
        {tab === 'concierge' && <ConciergeBookings />}
        {tab === 'drivers' && <DriverApprovals />}
      </div>
    </div>
  )
}

function KPI({ val, label, delta }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 10, padding: '10px 12px' }}>
      <div style={{ fontSize: 22, fontWeight: 500 }}>{val}</div>
      <div style={{ fontSize: 10, opacity: 0.5, marginTop: 1 }}>{label}</div>
      {delta && <div style={{ fontSize: 10, color: '#7EE8A2', marginTop: 2 }}>{delta}</div>}
    </div>
  )
}

function OverviewTab({ activeOrders, drivers, alerts }) {
  const onlineDrivers = drivers.filter(d => d.is_online)

  return (
    <>
      <Section title="Live orders" count={activeOrders.length}>
        {activeOrders.slice(0, 6).map(order => (
          <LiveOrderRow key={order.id} order={order} />
        ))}
        {activeOrders.length === 0 && <EmptyState icon="📋" text="No active orders" />}
      </Section>

      <Section title="Online drivers" count={onlineDrivers.length}>
        {onlineDrivers.slice(0, 4).map(driver => (
          <DriverRow key={driver.id} driver={driver} />
        ))}
        {onlineDrivers.length === 0 && <EmptyState icon="🛵" text="No drivers online" />}
      </Section>

      <Section title="Alerts">
        {alerts.slice(0, 5).map((a, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, paddingBottom: 10, marginBottom: 10, borderBottom: '0.5px solid rgba(42,35,24,0.08)' }}>
            <span style={{ fontSize: 16 }}>{a.type === 'warn' ? '⚠️' : 'ℹ️'}</span>
            <div>
              <div style={{ fontSize: 13, color: '#2A2318' }}>{a.text}</div>
              <div style={{ fontSize: 11, color: '#7A6E60', marginTop: 2 }}>{a.time ? formatDistanceToNow(a.time, { addSuffix: true }) : 'Just now'}</div>
            </div>
          </div>
        ))}
        {alerts.length === 0 && <EmptyState icon="✅" text="No alerts" />}
      </Section>
    </>
  )
}

function OrdersTab({ orders }) {
  const [filter, setFilter] = useState('active')
  const filtered = filter === 'active'
    ? orders.filter(o => !['delivered', 'cancelled'].includes(o.status))
    : filter === 'delivered'
    ? orders.filter(o => o.status === 'delivered')
    : orders

  return (
    <>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['active', 'delivered', 'all'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: filter === f ? 500 : 400, background: filter === f ? '#2A2318' : '#F5F0E8', color: filter === f ? 'white' : '#7A6E60', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', textTransform: 'capitalize' }}>{f}</button>
        ))}
      </div>
      {filtered.map(order => <FullOrderCard key={order.id} order={order} />)}
      {filtered.length === 0 && <EmptyState icon="📋" text="No orders in this category" />}
    </>
  )
}

function FleetTab({ drivers }) {
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Total drivers', val: drivers.length },
          { label: 'Online now', val: drivers.filter(d => d.is_online).length },
          { label: 'Delivering', val: drivers.filter(d => d.is_online).length },
          { label: 'Avg rating', val: drivers.length ? (drivers.reduce((s, d) => s + (d.rating ?? 5), 0) / drivers.length).toFixed(2) : '—' },
        ].map(({ label, val }) => (
          <div key={label} style={{ background: '#F5F0E8', borderRadius: 12, padding: '12px 14px' }}>
            <div style={{ fontSize: 22, fontWeight: 500 }}>{val}</div>
            <div style={{ fontSize: 11, color: '#7A6E60', marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {drivers.map(driver => (
        <div key={driver.id} style={{ background: '#FEFCF9', border: '0.5px solid rgba(42,35,24,0.12)', borderRadius: 14, padding: 14, marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#EAF3DE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 500, color: '#3B6D11', flexShrink: 0 }}>
              {(driver.profiles?.full_name ?? 'D').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{driver.profiles?.full_name ?? 'Driver'}</div>
              <div style={{ fontSize: 12, color: '#7A6E60', marginTop: 1 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: driver.is_online ? '#5A6B3A' : '#CCC', display: 'inline-block', marginRight: 4 }} />
                {driver.is_online ? 'Online' : 'Offline'}
                {driver.vehicle_plate ? ' · ' + driver.vehicle_plate : ''}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>⭐ {driver.rating?.toFixed(2) ?? '5.00'}</div>
              <div style={{ fontSize: 11, color: '#7A6E60' }}>{driver.total_deliveries ?? 0} runs</div>
            </div>
          </div>
        </div>
      ))}
    </>
  )
}



function LiveOrderRow({ order }) {
  const statusColor = STATUS_COLORS[order.status] ?? '#E0D8CC'
  const itemsText = order.order_items?.map(i => i.quantity + '× ' + (i.products?.emoji ?? '')).join(' ') ?? ''

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 12, marginBottom: 12, borderBottom: '0.5px solid rgba(42,35,24,0.08)' }}>
      <div style={{ fontSize: 11, fontWeight: 500, color: '#7A6E60', width: 52, flexShrink: 0 }}>#{order.order_number?.slice(-4)}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.delivery_address ?? 'Unknown'}</div>
        <div style={{ fontSize: 11, color: '#7A6E60' }}>{itemsText} · €{order.total?.toFixed(2)}</div>
      </div>
      <div style={{ background: statusColor, color: '#2A2318', fontSize: 10, padding: '3px 8px', borderRadius: 10, fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0 }}>
        {ORDER_STATUS_LABELS[order.status]}
      </div>
    </div>
  )
}

function FullOrderCard({ order }) {
  const statusColor = STATUS_COLORS[order.status] ?? '#E0D8CC'
  const itemsText = order.order_items?.map(i => i.quantity + '× ' + (i.products?.emoji ?? '') + ' ' + (i.products?.name ?? '')).join(', ') ?? ''
  const driverName = order.drivers?.profiles?.full_name

  return (
    <div style={{ background: '#FEFCF9', border: '0.5px solid rgba(42,35,24,0.12)', borderRadius: 14, padding: 14, marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: '#7A6E60' }}>#{order.order_number}</span>
        <span style={{ background: statusColor, color: '#2A2318', fontSize: 10, padding: '3px 8px', borderRadius: 10, fontWeight: 500 }}>
          {ORDER_STATUS_LABELS[order.status]}
        </span>
      </div>
      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 3 }}>{order.delivery_address}</div>
      <div style={{ fontSize: 12, color: '#7A6E60', marginBottom: 6 }}>{itemsText}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
        <span style={{ color: '#7A6E60' }}>{driverName ? '🛵 ' + driverName : '🕐 Unassigned'}</span>
        <span style={{ fontWeight: 500 }}>€{order.total?.toFixed(2)}</span>
      </div>
      <div style={{ fontSize: 11, color: '#7A6E60', marginTop: 4 }}>
        {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
      </div>
    </div>
  )
}

function DriverRow({ driver }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 12, marginBottom: 12, borderBottom: '0.5px solid rgba(42,35,24,0.08)' }}>
      <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#EAF3DE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 500, color: '#3B6D11', flexShrink: 0 }}>
        {(driver.profiles?.full_name ?? 'D').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{driver.profiles?.full_name ?? 'Driver'}</div>
        <div style={{ fontSize: 11, color: '#7A6E60' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#5A6B3A', display: 'inline-block', marginRight: 4 }} />
          Online · {driver.total_deliveries ?? 0} total runs
        </div>
      </div>
      <div style={{ fontSize: 12, fontWeight: 500 }}>⭐ {driver.rating?.toFixed(1) ?? '5.0'}</div>
    </div>
  )
}

function Section({ title, count, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 11, fontWeight: 500, color: '#7A6E60', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
        <span>{title}</span>
        {count !== undefined && <span style={{ background: '#F5F0E8', padding: '1px 7px', borderRadius: 10, color: '#2A2318' }}>{count}</span>}
      </div>
      {children}
    </div>
  )
}

function EmptyState({ icon, text }) {
  return (
    <div style={{ textAlign: 'center', padding: '24px', color: '#7A6E60', fontSize: 13 }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
      {text}
    </div>
  )
}
