import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import DriverMap from './DriverMap'
import {
  getAvailableOrders, acceptOrder, updateOrderStatus,
  updateDriverLocation, setDriverOnlineStatus,
  subscribeToAvailableOrders
} from '../../lib/supabase'
import { useAuthStore, useDriverStore } from '../../lib/store'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

// Status flow:
// assigned -> warehouse_confirmed (driver confirms picked up from warehouse)
// warehouse_confirmed -> en_route (driver leaves for delivery)
// en_route -> delivered (PIN verified by customer)

function orderItems(order) {
  if (!order.order_items?.length) return 'Order items'
  const items = order.order_items.slice(0, 3).map(i => `${i.quantity}x ${i.product?.name || ''}`)
  const extra = order.order_items.length > 3 ? ` +${order.order_items.length - 3} more` : ''
  return items.join(', ') + extra
}

function openNavigation(order) {
  const dest = order.delivery_lat && order.delivery_lng
    ? `${order.delivery_lat},${order.delivery_lng}`
    : encodeURIComponent(order.delivery_address || '')
  const ua = navigator.userAgent
  if (/iPhone|iPad/i.test(ua)) window.open(`maps://maps.apple.com/?daddr=${dest}`)
  else window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}`)
}

// ── Warehouse Stock Panel ─────────────────────────────────────
function WarehouseStock() {
  const [stock, setStock]   = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('low') // 'low' | 'all'

  useEffect(() => {
    const load = async () => {
      try {
        const { supabase } = await import('../../lib/supabase')
        const [{ data: s }, { data: a }] = await Promise.all([
          supabase.from('stock').select('product_id,product_name,category,current_qty,max_qty,alert_threshold,velocity').order('category').order('product_name'),
          supabase.from('stock_alerts').select('*').eq('resolved', false).order('created_at', { ascending: false }).limit(20),
        ])
        if (s) setStock(s)
        if (a) setAlerts(a)
      } catch (err) { console.error(err) }
      setLoading(false)
    }
    load()
  }, [])

  const NEARBY_STORES = [
    { name: 'Mercadona Ibiza Town', distance: '5 min', items: ['water','soft_drinks','snacks','ice'] },
    { name: 'Mercadona San Antonio', distance: '12 min', items: ['water','soft_drinks','snacks','beer','ice'] },
    { name: 'Cash & Carry (Airport area)', distance: '8 min', items: ['tobacco','spirits','beer','champagne','wine'] },
    { name: 'Eroski Santa Eulalia', distance: '18 min', items: ['water','snacks','soft_drinks','wine'] },
    { name: 'Lidl San Antonio', distance: '14 min', items: ['water','snacks','beer','soft_drinks'] },
  ]

  const lowStock = stock.filter(s => s.max_qty > 0 && (s.current_qty / s.max_qty) <= (s.alert_threshold || 0.25))
  const displayed = filter === 'low' ? lowStock : stock

  function pct(s) { return s.max_qty > 0 ? Math.round((s.current_qty / s.max_qty) * 100) : 0 }
  function pctColor(p) {
    if (p <= 0)  return '#C4683A'
    if (p <= 15) return '#C4683A'
    if (p <= 30) return '#E8A070'
    if (p <= 50) return '#F5C97A'
    return '#7EE8A2'
  }

  if (loading) return <div style={{ padding:20, textAlign:'center', color:'rgba(255,255,255,0.5)', fontSize:13 }}>Loading stock levels...</div>

  return (
    <div style={{ padding:'0 16px 16px' }}>
      <div style={{ fontFamily:'DM Serif Display,serif', fontSize:20, color:'white', marginBottom:4 }}>Warehouse Stock</div>
      <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', marginBottom:14 }}>Live inventory at base · {new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}</div>

      {/* Low stock alerts for driver */}
      {alerts.length > 0 && (
        <div style={{ background:'rgba(196,104,58,0.15)', border:'0.5px solid rgba(196,104,58,0.35)', borderRadius:12, padding:14, marginBottom:14 }}>
          <div style={{ fontSize:12, fontWeight:500, color:'#E8A070', marginBottom:10 }}>⚠️ Stock Alerts — Ops team notified</div>
          {alerts.slice(0,5).map(a => (
            <div key={a.id} style={{ fontSize:12, color:'rgba(255,255,255,0.7)', marginBottom:6, paddingBottom:6, borderBottom:'0.5px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontWeight:500 }}>{a.product_name}</span> — {a.alert_type === 'out_of_stock' ? '🚨 OUT OF STOCK' : `${Math.round(a.pct_at_alert || 0)}% remaining`}
              {a.message && <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginTop:2 }}>{a.message}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Nearby stores */}
      {lowStock.length > 0 && (
        <div style={{ background:'rgba(43,122,139,0.15)', border:'0.5px solid rgba(43,122,139,0.3)', borderRadius:12, padding:14, marginBottom:14 }}>
          <div style={{ fontSize:12, fontWeight:500, color:'#7ECFE0', marginBottom:10 }}>🏪 Nearby stores for low stock items</div>
          {NEARBY_STORES.filter(store =>
            lowStock.some(ls => store.items.includes(ls.category))
          ).slice(0,3).map(store => {
            const relevantItems = lowStock.filter(ls => store.items.includes(ls.category))
            return (
              <div key={store.name} style={{ marginBottom:10, paddingBottom:10, borderBottom:'0.5px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                  <span style={{ fontSize:12, fontWeight:500, color:'white' }}>{store.name}</span>
                  <span style={{ fontSize:11, color:'rgba(255,255,255,0.45)', background:'rgba(255,255,255,0.08)', padding:'2px 7px', borderRadius:10 }}>🛵 {store.distance}</span>
                </div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)' }}>
                  Can restock: {relevantItems.slice(0,3).map(i => i.product_name).join(', ')}
                  {relevantItems.length > 3 ? ` +${relevantItems.length-3} more` : ''}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Filter toggle */}
      <div style={{ display:'flex', gap:8, marginBottom:12 }}>
        {['low','all'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding:'6px 14px', borderRadius:20, fontSize:12, background: filter===f?'rgba(255,255,255,0.9)':'rgba(255,255,255,0.1)', color: filter===f?'#0D3B4A':'rgba(255,255,255,0.7)', border:'none', cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
            {f === 'low' ? `⚠️ Low stock (${lowStock.length})` : `All (${stock.length})`}
          </button>
        ))}
      </div>

      {/* Stock list */}
      {displayed.length === 0 && filter === 'low' && (
        <div style={{ textAlign:'center', padding:'20px', color:'rgba(255,255,255,0.4)', fontSize:13 }}>
          ✅ All stock levels are healthy
        </div>
      )}
      {displayed.map(s => {
        const p = pct(s)
        const color = pctColor(p)
        return (
          <div key={s.product_id} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 0', borderBottom:'0.5px solid rgba(255,255,255,0.06)' }}>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, color:'white', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.product_name}</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', marginTop:1 }}>{s.category}</div>
            </div>
            <div style={{ width:60, textAlign:'center' }}>
              <div style={{ height:5, background:'rgba(255,255,255,0.1)', borderRadius:3, overflow:'hidden', marginBottom:2 }}>
                <div style={{ height:'100%', width:`${Math.min(100,p)}%`, background:color, borderRadius:3 }} />
              </div>
              <div style={{ fontSize:11, fontWeight:600, color }}>{p}%</div>
            </div>
            <div style={{ fontSize:13, fontWeight:500, color:'white', minWidth:30, textAlign:'right' }}>{s.current_qty}</div>
          </div>
        )
      })}
    </div>
  )
}

// ── PIN Entry for delivery confirmation ───────────────────────
function PinEntry({ expectedPin, onSuccess, onCancel }) {
  const [entered, setEntered] = useState('')
  const [error, setError] = useState(false)

  const tap = (digit) => {
    if (entered.length >= 4) return
    const next = entered + digit
    setEntered(next)
    setError(false)
    if (next.length === 4) {
      setTimeout(() => {
        if (next === String(expectedPin)) {
          onSuccess()
        } else {
          setError(true)
          setEntered('')
        }
      }, 200)
    }
  }

  const del = () => setEntered(prev => prev.slice(0, -1))

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ background:'linear-gradient(170deg,#0D3545,#1A5060)', borderRadius:20, padding:32, width:'100%', maxWidth:360, textAlign:'center' }}>
        <div style={{ fontSize:48, marginBottom:12 }}>🔐</div>
        <div style={{ fontFamily:'DM Serif Display,serif', fontSize:22, color:'white', marginBottom:6 }}>Delivery Confirmation</div>
        <div style={{ fontSize:13, color:'rgba(255,255,255,0.5)', marginBottom:28 }}>Ask the customer for their 4-digit delivery code</div>

        {/* PIN dots */}
        <div style={{ display:'flex', justifyContent:'center', gap:14, marginBottom:28 }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ width:16, height:16, borderRadius:'50%', background: entered.length > i ? (error ? '#C4683A' : '#7EE8A2') : 'rgba(255,255,255,0.2)', transition:'background 0.2s' }} />
          ))}
        </div>

        {error && <div style={{ color:'#E8A070', fontSize:13, marginBottom:16 }}>Incorrect code — try again</div>}

        {/* Numpad */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:16 }}>
          {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((d,i) => (
            <button key={i} onClick={() => d === '⌫' ? del() : d ? tap(d) : null}
              disabled={!d && d !== '0'}
              style={{ padding:'16px', background: d ? 'rgba(255,255,255,0.1)' : 'transparent', border:'none', borderRadius:12, fontSize:20, fontWeight:500, color:'white', cursor: d ? 'pointer' : 'default', fontFamily:'DM Sans,sans-serif', opacity: !d ? 0 : 1 }}>
              {d}
            </button>
          ))}
        </div>

        <button onClick={onCancel} style={{ width:'100%', padding:'12px', background:'none', border:'0.5px solid rgba(255,255,255,0.2)', borderRadius:12, color:'rgba(255,255,255,0.5)', fontSize:13, cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── Pickup Confirmation ───────────────────────────────────────
function PickupConfirmation({ order, onConfirm, onCancel }) {
  const [checked, setChecked] = useState({})
  const items = order.order_items || []
  const allChecked = items.length > 0 && items.every((_,i) => checked[i])

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:200, display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
      <div style={{ background:'linear-gradient(170deg,#0D3545,#1A5060)', borderRadius:'20px 20px 0 0', padding:24, width:'100%', maxWidth:480, maxHeight:'80vh', overflowY:'auto' }}>
        <div style={{ width:36, height:4, background:'rgba(255,255,255,0.15)', borderRadius:2, margin:'0 auto 20px' }} />
        <div style={{ fontFamily:'DM Serif Display,serif', fontSize:22, color:'white', marginBottom:4 }}>Warehouse Pickup</div>
        <div style={{ fontSize:13, color:'rgba(255,255,255,0.5)', marginBottom:20 }}>Check off each item as you pick it up</div>

        <div style={{ marginBottom:20 }}>
          {items.map((item, i) => (
            <div key={i} onClick={() => setChecked(prev => ({ ...prev, [i]: !prev[i] }))}
              style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 0', borderBottom:'0.5px solid rgba(255,255,255,0.08)', cursor:'pointer' }}>
              <div style={{ width:24, height:24, borderRadius:6, background: checked[i] ? '#7EE8A2' : 'rgba(255,255,255,0.1)', border: checked[i] ? 'none' : '1.5px solid rgba(255,255,255,0.3)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.2s' }}>
                {checked[i] && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0D3B4A" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, color:'white', fontFamily:'DM Sans,sans-serif' }}>{item.product?.name || 'Item'}</div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', marginTop:1 }}>Qty: {item.quantity}</div>
              </div>
            </div>
          ))}
        </div>

        {!allChecked && items.length > 0 && (
          <div style={{ padding:'10px 14px', background:'rgba(245,201,122,0.15)', border:'0.5px solid rgba(245,201,122,0.3)', borderRadius:10, fontSize:12, color:'#F5C97A', marginBottom:16, fontFamily:'DM Sans,sans-serif' }}>
            Tick all items to confirm pickup
          </div>
        )}

        <button onClick={onConfirm} disabled={!allChecked}
          style={{ width:'100%', padding:'15px', background: allChecked ? '#5A6B3A' : 'rgba(255,255,255,0.1)', color:'white', border:'none', borderRadius:12, fontFamily:'DM Sans,sans-serif', fontSize:15, fontWeight:500, cursor: allChecked ? 'pointer' : 'default', marginBottom:10, opacity: allChecked ? 1 : 0.5, transition:'all 0.2s' }}>
          Confirm Pickup — All Items Checked
        </button>
        <button onClick={onCancel} style={{ width:'100%', padding:'12px', background:'none', border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:12, color:'rgba(255,255,255,0.5)', fontSize:13, cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── Main DriverApp ────────────────────────────────────────────
export default function DriverApp() {
  const { user, profile } = useAuthStore()
  const { isOnline, setOnline, currentOrder, setCurrentOrder, availableOrders, setAvailableOrders, updateLocation } = useDriverStore()
  const [stats, setStats]           = useState({ runs: 0, earnings: 0, avgTime: 0 })
  const [loading, setLoading]       = useState(false)
  const [showPickup, setShowPickup] = useState(false)
  const [showPin, setShowPin]       = useState(false)
  const [activeTab, setActiveTab]   = useState('orders') // 'orders' | 'stock'

  const loadOrders = useCallback(async () => {
    try {
      const orders = await getAvailableOrders()
      setAvailableOrders(orders)
    } catch (err) { console.error('Failed to load orders:', err) }
  }, [setAvailableOrders])

  useEffect(() => {
    if (!isOnline) return
    loadOrders()
    const sub = subscribeToAvailableOrders(loadOrders)
    return () => sub.unsubscribe()
  }, [isOnline, loadOrders])

  useEffect(() => {
    if (!isOnline || !user) return
    const watchId = navigator.geolocation?.watchPosition(
      (pos) => { updateLocation(pos.coords.latitude, pos.coords.longitude); updateDriverLocation(user.id, pos.coords.latitude, pos.coords.longitude).catch(console.error) },
      (err) => console.warn('GPS error:', err),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
    )
    return () => { if (watchId) navigator.geolocation?.clearWatch(watchId) }
  }, [isOnline, user])

  const toggleOnline = async () => {
    const next = !isOnline
    setOnline(next)
    if (user) await setDriverOnlineStatus(user.id, next).catch(console.error)
    toast(next ? '🟢 You are now online' : '🔴 You are offline')
  }

  const handleAccept = async (order) => {
    setLoading(true)
    try {
      const accepted = await acceptOrder(order.id, user.id)
      setCurrentOrder(accepted)
      setAvailableOrders(prev => prev.filter(o => o.id !== order.id))
      toast.success('Order accepted! Head to warehouse for pickup.')
    } catch { toast.error('Order already taken'); loadOrders() }
    setLoading(false)
  }

  // Step 1: Driver arrives at warehouse, confirms each item is picked up
  const handleWarehousePickup = () => setShowPickup(true)

  const confirmPickup = async () => {
    setShowPickup(false)
    setLoading(true)
    try {
      await updateOrderStatus(currentOrder.id, 'warehouse_confirmed')
      setCurrentOrder(prev => ({ ...prev, status: 'warehouse_confirmed' }))
      toast.success('Pickup confirmed! Head to the customer.')
    } catch { toast.error('Update failed') }
    setLoading(false)
  }

  // Step 2: Driver arrives, starts delivery
  const handleStartDelivery = async () => {
    setLoading(true)
    try {
      await updateOrderStatus(currentOrder.id, 'en_route')
      setCurrentOrder(prev => ({ ...prev, status: 'en_route' }))
      toast.success('En route!')
    } catch { toast.error('Update failed') }
    setLoading(false)
  }

  // Step 3: Driver at door — enter PIN to confirm delivery
  const handleDeliveryAtDoor = () => setShowPin(true)

  const confirmDelivery = async () => {
    setShowPin(false)
    setLoading(true)
    try {
      await updateOrderStatus(currentOrder.id, 'delivered')

      // Deduct stock NOW (only on confirmed delivery)
      if (currentOrder.order_items?.length) {
        await fetch(`${SUPABASE_URL}/functions/v1/stock-manager`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_KEY}` },
          body: JSON.stringify({
            type: 'order_placed',
            order_items: currentOrder.order_items.map(i => ({
              product_id: i.product_id || i.product?.id,
              product_name: i.product?.name || 'Unknown',
              quantity: i.quantity,
            })),
          }),
        }).catch(err => console.error('Stock deduction failed:', err))
      }

      setCurrentOrder(null)
      setStats(prev => ({ ...prev, runs: prev.runs + 1, earnings: prev.earnings + (currentOrder.total || 0) }))
      toast.success('Delivery confirmed! Great work 🌴')
    } catch { toast.error('Update failed') }
    setLoading(false)
  }

  // Status steps
  const STATUS_STEPS = {
    assigned:             { label: 'Confirm Warehouse Pickup', icon: '📦', color:'#5A6B3A', action: handleWarehousePickup, desc: 'Head to warehouse · Collect all items' },
    warehouse_confirmed:  { label: 'Start Delivery',           icon: '🛵', color:'#2B7A8B', action: handleStartDelivery,  desc: 'All items collected · Navigate to customer' },
    en_route:             { label: 'Confirm Delivery',         icon: '🔐', color:'#C4683A', action: handleDeliveryAtDoor, desc: 'At the door · Enter customer PIN' },
  }

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(170deg,#0A2A38,#0D3545)', color:'white', fontFamily:'DM Sans,sans-serif', paddingBottom:20 }}>

      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,#0D3B4A,#1A5263)', padding:'16px 16px 14px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <div>
            <div style={{ fontFamily:'DM Serif Display,serif', fontSize:22, color:'white', lineHeight:1 }}>Isla Drop Driver</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.45)', marginTop:2 }}>{profile?.full_name || user?.email}</div>
          </div>
          <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
            <div style={{ fontSize:12, color: isOnline?'#7EE8A2':'rgba(255,255,255,0.4)' }}>{isOnline ? 'Online' : 'Offline'}</div>
            <div style={{ position:'relative', width:44, height:24 }}>
              <input type="checkbox" checked={isOnline} onChange={toggleOnline} style={{ opacity:0, width:0, height:0, position:'absolute' }} />
              <div style={{ position:'absolute', inset:0, borderRadius:12, background: isOnline?'#5A6B3A':'rgba(255,255,255,0.15)', transition:'0.3s' }}>
                <div style={{ position:'absolute', top:2, left: isOnline?'calc(100% - 22px)':2, width:20, height:20, borderRadius:'50%', background:'white', transition:'left 0.3s' }} />
              </div>
            </div>
          </label>
        </div>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
          {[
            { val: stats.runs,                label:"Today's runs"  },
            { val: `€${stats.earnings.toFixed(0)}`, label:'Earnings'  },
            { val: `${stats.avgTime||'—'}m`,  label:'Avg time'     },
          ].map(({ val, label }) => (
            <div key={label} style={{ background:'rgba(255,255,255,0.1)', borderRadius:10, padding:'10px 12px' }}>
              <div style={{ fontSize:20, fontWeight:500 }}>{val}</div>
              <div style={{ fontSize:10, opacity:0.65, marginTop:2 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:'0.5px solid rgba(255,255,255,0.1)', background:'rgba(0,0,0,0.2)' }}>
        {[{id:'orders',label:'📦 Orders'},{id:'stock',label:'🏪 Warehouse Stock'}].map(t => (
          <button key={t.id} onClick={()=>setActiveTab(t.id)}
            style={{ flex:1, padding:'12px 8px', border:'none', background:'none', color: activeTab===t.id?'white':'rgba(255,255,255,0.45)', fontSize:13, fontWeight: activeTab===t.id?500:400, cursor:'pointer', borderBottom: activeTab===t.id?'2px solid #C4683A':'2px solid transparent', fontFamily:'DM Sans,sans-serif', transition:'all 0.15s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Stock tab */}
      {activeTab === 'stock' && <WarehouseStock />}

      {/* Orders tab */}
      {activeTab === 'orders' && (
        <div style={{ padding:'16px 16px 0' }}>

          {/* Active order */}
          {currentOrder && STATUS_STEPS[currentOrder.status] && (
            <div style={{ background:'rgba(255,255,255,0.07)', border:`1.5px solid ${STATUS_STEPS[currentOrder.status].color}`, borderRadius:14, padding:16, marginBottom:20 }}>

              {/* Progress bar */}
              <div style={{ display:'flex', gap:6, marginBottom:14 }}>
                {['assigned','warehouse_confirmed','en_route','delivered'].map((step, i) => {
                  const steps = ['assigned','warehouse_confirmed','en_route','delivered']
                  const currentIdx = steps.indexOf(currentOrder.status)
                  const done = i <= currentIdx
                  return (
                    <div key={step} style={{ flex:1, height:4, borderRadius:2, background: done ? STATUS_STEPS[currentOrder.status]?.color || '#5A6B3A' : 'rgba(255,255,255,0.15)', transition:'background 0.3s' }} />
                  )
                })}
              </div>

              <div style={{ fontSize:10, fontWeight:500, color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:6 }}>
                {STATUS_STEPS[currentOrder.status]?.desc}
              </div>

              <div style={{ fontSize:16, fontWeight:500, color:'white', marginBottom:2 }}>#{currentOrder.order_number}</div>
              <div style={{ fontSize:14, color:'rgba(255,255,255,0.7)', marginBottom:2 }}>{currentOrder.delivery_address}</div>
              {currentOrder.what3words && <div style={{ fontSize:12, color:'#5A6B3A', marginBottom:4 }}>/// {currentOrder.what3words}</div>}
              {currentOrder.delivery_notes && <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', marginBottom:8 }}>📝 {currentOrder.delivery_notes}</div>}
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', marginBottom:14 }}>{orderItems(currentOrder)}</div>

              {/* Items checklist preview */}
              {currentOrder.order_items?.length > 0 && currentOrder.status === 'assigned' && (
                <div style={{ background:'rgba(255,255,255,0.05)', borderRadius:8, padding:'8px 12px', marginBottom:12 }}>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginBottom:6 }}>ITEMS TO COLLECT:</div>
                  {currentOrder.order_items.slice(0,5).map((item,i) => (
                    <div key={i} style={{ fontSize:12, color:'rgba(255,255,255,0.7)', marginBottom:3 }}>
                      · {item.quantity}x {item.product?.name || 'Item'}
                    </div>
                  ))}
                  {currentOrder.order_items.length > 5 && <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)' }}>+{currentOrder.order_items.length-5} more items</div>}
                </div>
              )}

              {/* Customer PIN reminder at delivery */}
              {currentOrder.status === 'en_route' && (
                <div style={{ background:'rgba(196,104,58,0.15)', border:'0.5px solid rgba(196,104,58,0.35)', borderRadius:8, padding:'10px 12px', marginBottom:12, fontSize:12, color:'#E8A070' }}>
                  🔐 Ask the customer for their 4-digit delivery code to confirm handover
                </div>
              )}

              <div style={{ display:'flex', gap:8 }}>
                <button onClick={STATUS_STEPS[currentOrder.status]?.action} disabled={loading}
                  style={{ flex:2, padding:'13px', background: STATUS_STEPS[currentOrder.status]?.color, color:'white', border:'none', borderRadius:10, fontFamily:'DM Sans,sans-serif', fontSize:14, fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                  <span>{STATUS_STEPS[currentOrder.status]?.icon}</span>
                  {loading ? '...' : STATUS_STEPS[currentOrder.status]?.label}
                </button>
                <button onClick={() => openNavigation(currentOrder)}
                  style={{ flex:1, padding:'13px', background:'rgba(255,255,255,0.1)', color:'white', border:'none', borderRadius:10, fontFamily:'DM Sans,sans-serif', fontSize:13, cursor:'pointer' }}>
                  🗺 Nav
                </button>
              </div>

              <div style={{ marginTop:12 }}>
                <DriverMap order={currentOrder} isVisible={true} />
              </div>

              <div style={{ marginTop:10, padding:'8px 12px', background:'rgba(196,104,58,0.1)', borderRadius:8, fontSize:11, color:'#E8A070', display:'flex', gap:6 }}>
                <span>🆔</span>
                <span>Check photo ID for age-restricted items. Refuse if under 18.</span>
              </div>
            </div>
          )}

          {/* Available orders */}
          {isOnline ? (
            <>
              {!currentOrder && (
                <div style={{ fontSize:11, fontWeight:500, color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:12 }}>
                  {availableOrders.length > 0 ? `${availableOrders.length} new request${availableOrders.length !== 1 ? 's' : ''}` : 'Waiting for orders…'}
                </div>
              )}

              {availableOrders.length === 0 && !currentOrder && (
                <div style={{ textAlign:'center', padding:'40px 20px', color:'rgba(255,255,255,0.4)', fontSize:14 }}>
                  <div style={{ fontSize:40, marginBottom:12 }}>🛵</div>
                  <div>No orders right now.</div>
                  <div style={{ fontSize:12, marginTop:4 }}>Stay online — new orders will appear here.</div>
                </div>
              )}

              {availableOrders.map(order => (
                <div key={order.id} style={{ background:'rgba(255,255,255,0.07)', border: order.total > 100 ? '1.5px solid rgba(196,104,58,0.4)' : '0.5px solid rgba(255,255,255,0.1)', borderRadius:14, padding:16, marginBottom:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)' }}>#{order.order_number}</div>
                    <span style={{ fontSize:10, padding:'3px 8px', borderRadius:12, fontWeight:500, background: order.total>100?'rgba(196,104,58,0.2)':'rgba(90,107,58,0.2)', color: order.total>100?'#E8A070':'#7EE8A2' }}>
                      {order.total > 100 ? 'High value' : 'Standard'}
                    </span>
                  </div>
                  <div style={{ fontSize:14, fontWeight:500, color:'white', marginBottom:2 }}>{order.delivery_address}</div>
                  {order.what3words && <div style={{ fontSize:12, color:'#5A6B3A', marginBottom:2 }}>/// {order.what3words}</div>}
                  <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', marginBottom:12 }}>{orderItems(order)} · <strong style={{ color:'white' }}>€{order.total?.toFixed(2)}</strong></div>
                  <div style={{ display:'flex', gap:8 }}>
                    <button onClick={() => handleAccept(order)} disabled={loading || !!currentOrder}
                      style={{ flex:1, padding:'10px', background: currentOrder?'rgba(255,255,255,0.08)':'#3D4F22', color:'white', border:'none', borderRadius:10, fontFamily:'DM Sans,sans-serif', fontSize:13, fontWeight:500, cursor: currentOrder?'default':'pointer', opacity: currentOrder?0.5:1 }}>
                      {currentOrder ? 'Finish current run' : 'Accept run'}
                    </button>
                    <button onClick={() => openNavigation(order)} style={{ padding:'10px 14px', background:'rgba(255,255,255,0.1)', color:'white', border:'none', borderRadius:10, fontFamily:'DM Sans,sans-serif', fontSize:13, cursor:'pointer' }}>🗺</button>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div style={{ textAlign:'center', padding:'60px 20px', color:'rgba(255,255,255,0.4)' }}>
              <div style={{ fontSize:48, marginBottom:12 }}>😴</div>
              <div style={{ fontSize:16, fontWeight:500, marginBottom:6 }}>You are offline</div>
              <div style={{ fontSize:14 }}>Toggle online above to start receiving orders.</div>
            </div>
          )}
        </div>
      )}

      {/* Pickup confirmation overlay */}
      {showPickup && currentOrder && (
        <PickupConfirmation
          order={currentOrder}
          onConfirm={confirmPickup}
          onCancel={() => setShowPickup(false)}
        />
      )}

      {/* PIN entry overlay */}
      {showPin && currentOrder && (
        <PinEntry
          expectedPin={currentOrder.delivery_pin || currentOrder.pin}
          onSuccess={confirmDelivery}
          onCancel={() => setShowPin(false)}
        />
      )}
    </div>
  )
}
