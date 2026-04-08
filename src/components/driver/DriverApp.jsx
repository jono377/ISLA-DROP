import { useState, useEffect, useCallback, useRef } from 'react'
import toast from 'react-hot-toast'
import {
  getAvailableOrders, acceptOrder, updateOrderStatus,
  updateDriverLocation, setDriverOnlineStatus,
  subscribeToAvailableOrders
} from '../../lib/supabase'
import { useAuthStore, useDriverStore } from '../../lib/store'
import { useLeafletMap, PIN_ICON, SCOOTER_ICON } from '../../lib/useLeafletMap'

const C = {
  bg:      'linear-gradient(170deg,#0A2A38,#0D3545)',
  card:    'rgba(255,255,255,0.07)',
  border:  'rgba(255,255,255,0.12)',
  accent:  '#C4683A',
  green:   '#7EE8A2',
  teal:    '#2B7A8B',
  text:    'white',
  muted:   'rgba(255,255,255,0.5)',
  dim:     'rgba(255,255,255,0.25)',
}

const WAREHOUSE = [38.9090, 1.4340]

const STATUS_CONFIG = {
  assigned:            { label: 'Go to warehouse',    color: '#7ECFE0', next: 'warehouse_confirmed', nextLabel: '✅ Collected from warehouse' },
  warehouse_confirmed: { label: 'Head to customer',   color: '#C4683A', next: 'en_route',            nextLabel: '🛵 On my way' },
  en_route:            { label: 'At delivery address', color: '#7EE8A2', next: null,                  nextLabel: null },
  delivered:           { label: 'Delivered',           color: '#7EE8A2', next: null,                  nextLabel: null },
}

function orderItems(order) {
  if (!order.order_items?.length) return 'No items'
  const items = order.order_items.slice(0, 3).map(i => i.quantity + 'x ' + (i.product?.name || i.products?.name || 'Item'))
  const extra = order.order_items.length > 3 ? ' +' + (order.order_items.length - 3) + ' more' : ''
  return items.join(', ') + extra
}

// ── Delivery Map ──────────────────────────────────────────────
function DeliveryMap({ order, driverPos, onClose }) {
  const containerRef = useRef(null)
  const { mapRef, setMarker, fitBounds, flyTo } = useLeafletMap(containerRef, {
    center: order?.delivery_lat ? [order.delivery_lat, order.delivery_lng] : WAREHOUSE,
    zoom: 14,
    darkStyle: true,
  })

  useEffect(() => {
    const timer = setInterval(() => {
      if (!mapRef.current) return
      clearInterval(timer)

      // Warehouse pin
      setMarker('warehouse', WAREHOUSE[0], WAREHOUSE[1],
        '<div style="font-size:24px">🏪</div>',
        '<b>Warehouse</b><br>Isla Drop dispatch'
      )

      // Destination pin
      if (order?.delivery_lat) {
        setMarker('dest', order.delivery_lat, order.delivery_lng,
          PIN_ICON('#C4683A'),
          '<b>Drop-off</b><br>' + (order.delivery_address || '') + (order.what3words ? '<br>/// ' + order.what3words : '')
        )
      }

      // Driver position
      if (driverPos) {
        setMarker('driver', driverPos[0], driverPos[1],
          '<div style="font-size:28px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5))">🛵</div>',
          '<b>You</b>'
        )
        if (order?.delivery_lat) {
          fitBounds([[driverPos[0], driverPos[1]], [order.delivery_lat, order.delivery_lng]])
        }
      }
    }, 600)
    return () => clearInterval(timer)
  }, [order, driverPos])

  const openNav = () => {
    if (!order?.delivery_lat) return
    const dest = order.delivery_lat + ',' + order.delivery_lng
    const ua = navigator.userAgent
    if (/iPhone|iPad/i.test(ua)) window.open('maps://maps.apple.com/?daddr=' + dest)
    else window.open('https://www.google.com/maps/dir/?api=1&destination=' + dest + '&travelmode=driving')
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: '#0A2A38', display: 'flex', flexDirection: 'column' }}>
      {/* Map header */}
      <div style={{ background: 'rgba(10,26,35,0.95)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, zIndex: 10 }}>
        <button onClick={onClose}
          style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 10, width: 36, height: 36, color: 'white', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          ←
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>Order #{order?.order_number}</div>
          <div style={{ fontSize: 12, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            📍 {order?.delivery_address || 'Address not set'}
          </div>
        </div>
        <button onClick={openNav}
          style={{ background: C.accent, border: 'none', borderRadius: 10, padding: '8px 14px', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>
          🗺 Navigate
        </button>
      </div>

      {/* Map */}
      <div ref={containerRef} style={{ flex: 1 }} />

      {/* Bottom info */}
      {order?.what3words && (
        <div style={{ background: 'rgba(10,26,35,0.95)', padding: '10px 16px', fontSize: 13, color: '#7EE8A2', fontFamily: 'DM Sans,sans-serif' }}>
          /// {order.what3words}
        </div>
      )}
      {order?.delivery_notes && (
        <div style={{ background: 'rgba(10,26,35,0.95)', padding: '8px 16px', fontSize: 12, color: C.muted, fontFamily: 'DM Sans,sans-serif', borderTop: '0.5px solid rgba(255,255,255,0.08)' }}>
          📝 {order.delivery_notes}
        </div>
      )}
    </div>
  )
}

// ── PIN Entry overlay ─────────────────────────────────────────
function PinEntry({ order, onSuccess, onCancel }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const verify = async () => {
    if (pin.length < 4) { setError('Enter the 4-digit PIN'); return }
    setLoading(true)
    try {
      if (pin !== String(order.delivery_pin)) { setError('Incorrect PIN — ask the customer again'); setLoading(false); return }
      await updateOrderStatus(order.id, 'delivered', { delivered_at: new Date().toISOString() })
      toast.success('Order delivered! 🎉')
      onSuccess()
    } catch { setError('Could not verify — try again') }
    setLoading(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 600, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'flex-end' }}>
      <div style={{ width: '100%', background: 'linear-gradient(170deg,#0D3545,#1A5060)', borderRadius: '20px 20px 0 0', padding: '24px 20px 36px' }}>
        <div style={{ width: 36, height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 2, margin: '0 auto 20px' }} />
        <div style={{ fontFamily: 'DM Serif Display,serif', fontSize: 22, color: 'white', marginBottom: 6, textAlign: 'center' }}>Customer PIN</div>
        <div style={{ fontSize: 13, color: C.muted, textAlign: 'center', marginBottom: 24 }}>Ask the customer for their 4-digit delivery code</div>

        {/* PIN display */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 20 }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ width: 52, height: 60, background: 'rgba(255,255,255,0.08)', borderRadius: 12, border: '0.5px solid ' + (pin[i] ? C.accent : C.border), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, color: 'white' }}>
              {pin[i] || ''}
            </div>
          ))}
        </div>

        {error && <div style={{ color: '#FF6B6B', textAlign: 'center', fontSize: 13, marginBottom: 12 }}>{error}</div>}

        {/* Numpad */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
          {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((d, i) => (
            <button key={i} onClick={() => {
              setError('')
              if (d === '⌫') setPin(p => p.slice(0,-1))
              else if (d !== '' && pin.length < 4) setPin(p => p + d)
            }}
              style={{ padding: '16px', background: d === '⌫' ? 'rgba(196,104,58,0.15)' : 'rgba(255,255,255,0.08)', border: '0.5px solid ' + C.border, borderRadius: 12, fontSize: 20, color: 'white', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', fontWeight: 500 }}>
              {d}
            </button>
          ))}
        </div>

        <button onClick={verify} disabled={pin.length < 4 || loading}
          style={{ width: '100%', padding: '15px', background: pin.length === 4 ? C.accent : 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 14, color: 'white', fontSize: 16, fontWeight: 600, cursor: pin.length === 4 ? 'pointer' : 'default', fontFamily: 'DM Sans,sans-serif', marginBottom: 10 }}>
          {loading ? 'Verifying...' : 'Confirm Delivery'}
        </button>
        <button onClick={onCancel} style={{ width: '100%', padding: '12px', background: 'none', border: 'none', color: C.muted, fontSize: 14, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── Available Order Card ──────────────────────────────────────
function AvailableOrderCard({ order, onAccept, loading }) {
  const dist = order.distance_km ? order.distance_km.toFixed(1) + ' km' : ''
  return (
    <div style={{ background: C.card, border: '0.5px solid ' + C.border, borderRadius: 16, padding: 16, marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'white', marginBottom: 2 }}>Order #{order.order_number}</div>
          <div style={{ fontSize: 12, color: C.muted }}>{new Date(order.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.green }}>€{(order.delivery_fee || 3.5).toFixed(2)}</div>
          {dist && <div style={{ fontSize: 11, color: C.muted }}>{dist}</div>}
        </div>
      </div>

      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 6, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
        <span>📍</span><span style={{ flex: 1 }}>{order.delivery_address || 'Address pending'}</span>
      </div>
      {order.what3words && (
        <div style={{ fontSize: 12, color: '#7EE8A2', marginBottom: 6 }}>/// {order.what3words}</div>
      )}
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>📦 {orderItems(order)}</div>

      <button onClick={() => onAccept(order)} disabled={loading}
        style={{ width: '100%', padding: '14px', background: C.accent, border: 'none', borderRadius: 12, color: 'white', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', opacity: loading ? 0.7 : 1 }}>
        {loading ? 'Accepting...' : '✓ Accept order'}
      </button>
    </div>
  )
}

// ── Earnings Tab ──────────────────────────────────────────────
function EarningsTab({ stats }) {
  const [history, setHistory] = useState([])
  useEffect(() => {
    const load = async () => {
      try {
        const { supabase } = await import('../../lib/supabase')
        const { useAuthStore } = await import('../../lib/store')
        const user = useAuthStore.getState().user
        if (!user) return
        const { data } = await supabase.from('driver_earnings')
          .select('*').eq('driver_id', user.id).order('created_at', { ascending: false }).limit(20)
        if (data) setHistory(data)
      } catch {}
    }
    load()
  }, [])

  return (
    <div style={{ padding: '16px' }}>
      {/* Today summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        {[
          { label: "Today's earnings", value: '€' + (stats?.earnings || 0).toFixed(2), color: C.green, icon: '💰' },
          { label: 'Deliveries today', value: stats?.deliveries || 0, color: '#7ECFE0', icon: '📦' },
        ].map(s => (
          <div key={s.label} style={{ background: C.card, border: '0.5px solid ' + C.border, borderRadius: 14, padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: 'DM Sans,sans-serif' }}>{s.value}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 13, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 }}>Recent deliveries</div>
      {history.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 0', color: C.muted, fontSize: 14 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>💸</div>
          No earnings recorded yet
        </div>
      ) : history.map((e, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '0.5px solid rgba(255,255,255,0.07)' }}>
          <div>
            <div style={{ fontSize: 13, color: 'white', fontWeight: 500 }}>Order #{e.order_number || e.order_id?.slice(0,6)}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{new Date(e.created_at).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: C.green }}>€{(e.amount || 0).toFixed(2)}</div>
        </div>
      ))}
    </div>
  )
}

// ── Main DriverApp ────────────────────────────────────────────
export default function DriverApp() {
  const { user, profile, clear } = useAuthStore()
  const { isOnline, currentOrder, availableOrders, stats,
          setOnline, setCurrentOrder, setAvailableOrders, updateLocation } = useDriverStore()

  const [activeTab, setActiveTab] = useState('home')
  const [showPin, setShowPin] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const [accepting, setAccepting] = useState(false)
  const [driverPos, setDriverPos] = useState(null)

  const loadOrders = useCallback(async () => {
    if (!isOnline || !user) return
    try {
      const orders = await getAvailableOrders()
      setAvailableOrders(orders || [])
    } catch {}
  }, [isOnline, user])

  // Go online/offline
  const toggleOnline = async () => {
    const next = !isOnline
    setOnline(next)
    if (user) await setDriverOnlineStatus(user.id, next).catch(() => {})
    if (next) { loadOrders(); toast.success('You are now online 🟢') }
    else toast('You are now offline 🔴', { icon: '⚫' })
  }

  // Accept order
  const handleAccept = async (order) => {
    setAccepting(true)
    try {
      await acceptOrder(order.id, user.id)
      setCurrentOrder({ ...order, status: 'assigned' })
      setAvailableOrders([])
      setActiveTab('home')
      toast.success('Order accepted! Head to warehouse 🏪')
    } catch (err) {
      toast.error('Could not accept — ' + (err.message || 'try again'))
    }
    setAccepting(false)
  }

  // Advance order status
  const handleAdvanceStatus = async () => {
    if (!currentOrder) return
    const cfg = STATUS_CONFIG[currentOrder.status]
    if (!cfg?.next) return
    if (cfg.next === 'delivered') { setShowPin(true); return }
    try {
      await updateOrderStatus(currentOrder.id, cfg.next)
      setCurrentOrder({ ...currentOrder, status: cfg.next })
      if (cfg.next === 'en_route') toast.success('On your way! 🛵')
    } catch { toast.error('Status update failed') }
  }

  // Subscribe to new orders
  useEffect(() => {
    if (!isOnline || !user) return
    loadOrders()
    const sub = subscribeToAvailableOrders((order) => {
      if (!currentOrder) {
        setAvailableOrders(prev => {
          if (prev.find(o => o.id === order.id)) return prev
          toast('New order available! 📦', { icon: '🛵' })
          return [order, ...prev]
        })
      }
    })
    const interval = setInterval(loadOrders, 30000)
    return () => { sub?.unsubscribe?.(); clearInterval(interval) }
  }, [isOnline, user, currentOrder])

  // GPS tracking
  useEffect(() => {
    if (!isOnline || !user) return
    const watchId = navigator.geolocation?.watchPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        setDriverPos([lat, lng])
        updateLocation(lat, lng)
        updateDriverLocation(user.id, lat, lng).catch(() => {})
        // Push ETA to active order
        if (currentOrder && ['warehouse_confirmed', 'en_route'].includes(currentOrder.status)) {
          try {
            const { supabase } = await import('../../lib/supabase')
            const { calculateETA } = await import('../../lib/eta')
            const eta = calculateETA({ driverLat: lat, driverLng: lng, orderStatus: currentOrder.status, deliveryLat: currentOrder.delivery_lat, deliveryLng: currentOrder.delivery_lng })
            await supabase.from('orders').update({ driver_lat: lat, driver_lng: lng, eta_minutes: eta?.totalMins || null }).eq('id', currentOrder.id)
          } catch {}
        }
      },
      null,
      { enableHighAccuracy: true, maximumAge: 8000, timeout: 10000 }
    )
    return () => { if (watchId) navigator.geolocation?.clearWatch(watchId) }
  }, [isOnline, user, currentOrder])

  const cfg = currentOrder ? STATUS_CONFIG[currentOrder.status] : null
  const name = profile?.full_name?.split(' ')[0] || 'Driver'

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: 'white', fontFamily: 'DM Sans,sans-serif', paddingBottom: 80 }}>

      {/* Delivery Map (full screen overlay) */}
      {showMap && currentOrder && (
        <DeliveryMap order={currentOrder} driverPos={driverPos} onClose={() => setShowMap(false)} />
      )}

      {/* PIN entry overlay */}
      {showPin && currentOrder && (
        <PinEntry
          order={currentOrder}
          onSuccess={() => { setShowPin(false); setCurrentOrder(null); setActiveTab('home') }}
          onCancel={() => setShowPin(false)}
        />
      )}

      {/* Header */}
      <div style={{ background: 'rgba(0,0,0,0.25)', padding: '16px 16px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'DM Serif Display,serif', fontSize: 20, color: 'white' }}>Hey, {name} 👋</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
            {isOnline ? '🟢 Online · receiving orders' : '⚫ Offline'}
          </div>
        </div>
        {/* Online toggle */}
        <button onClick={toggleOnline}
          style={{ background: isOnline ? 'rgba(126,232,162,0.15)' : 'rgba(255,255,255,0.08)', border: '0.5px solid ' + (isOnline ? 'rgba(126,232,162,0.4)' : C.border), borderRadius: 20, padding: '8px 16px', color: isOnline ? C.green : C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>
          {isOnline ? 'Go offline' : 'Go online'}
        </button>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 0, background: 'rgba(0,0,0,0.2)', borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}>
        {[
          { icon: '💰', val: '€' + (stats?.earnings || 0).toFixed(0), label: 'Today' },
          { icon: '📦', val: stats?.deliveries || 0,                   label: 'Deliveries' },
          { icon: '⭐', val: (stats?.rating || 5.0).toFixed(1),        label: 'Rating' },
        ].map(s => (
          <div key={s.label} style={{ padding: '10px 8px', textAlign: 'center', borderRight: '0.5px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 14 }}>{s.icon}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'white' }}>{s.val}</div>
            <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── HOME TAB ── */}
      {activeTab === 'home' && (
        <div style={{ padding: '16px' }}>

          {/* Active order */}
          {currentOrder && cfg && (
            <div style={{ background: C.card, border: '0.5px solid rgba(196,104,58,0.4)', borderRadius: 18, padding: 16, marginBottom: 16 }}>
              {/* Status badge */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ background: cfg.color + '22', border: '0.5px solid ' + cfg.color + '66', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600, color: cfg.color }}>
                  {cfg.label}
                </div>
                <div style={{ fontSize: 13, color: C.muted }}>#{currentOrder.order_number}</div>
              </div>

              {/* Progress */}
              <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
                {['assigned', 'warehouse_confirmed', 'en_route', 'delivered'].map((step, i) => {
                  const steps = ['assigned', 'warehouse_confirmed', 'en_route', 'delivered']
                  const curr = steps.indexOf(currentOrder.status)
                  const done = i <= curr
                  return <div key={step} style={{ flex: 1, height: 4, borderRadius: 2, background: done ? cfg.color : 'rgba(255,255,255,0.12)', transition: 'background 0.3s' }} />
                })}
              </div>

              {/* Address */}
              <div style={{ fontSize: 15, fontWeight: 600, color: 'white', marginBottom: 4 }}>
                📍 {currentOrder.delivery_address || 'Delivery address'}
              </div>
              {currentOrder.what3words && (
                <div style={{ fontSize: 12, color: C.green, marginBottom: 4 }}>/// {currentOrder.what3words}</div>
              )}
              {currentOrder.delivery_notes && (
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>📝 {currentOrder.delivery_notes}</div>
              )}
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>{orderItems(currentOrder)}</div>

              {/* PIN reminder */}
              {currentOrder.status === 'en_route' && currentOrder.delivery_pin && (
                <div style={{ background: 'rgba(196,104,58,0.12)', border: '0.5px solid rgba(196,104,58,0.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>🔐</span>
                  <div>
                    <div style={{ fontSize: 11, color: C.muted, marginBottom: 2 }}>Customer PIN</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'white', letterSpacing: 4 }}>{currentOrder.delivery_pin}</div>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setShowMap(true)}
                  style={{ flex: 1, padding: '12px', background: 'rgba(43,122,139,0.2)', border: '0.5px solid rgba(43,122,139,0.4)', borderRadius: 12, color: '#7ECFE0', fontSize: 14, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', fontWeight: 500 }}>
                  🗺 Map
                </button>
                {cfg.next && (
                  <button onClick={handleAdvanceStatus}
                    style={{ flex: 2, padding: '12px', background: cfg.color, border: 'none', borderRadius: 12, color: '#0A2A38', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>
                    {cfg.nextLabel}
                  </button>
                )}
                {currentOrder.status === 'en_route' && (
                  <button onClick={() => setShowPin(true)}
                    style={{ flex: 2, padding: '12px', background: C.green, border: 'none', borderRadius: 12, color: '#0A2A38', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>
                    🔐 Enter PIN
                  </button>
                )}
              </div>
            </div>
          )}

          {/* No active order */}
          {!currentOrder && (
            <div style={{ textAlign: 'center', padding: '32px 16px' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🛵</div>
              <div style={{ fontFamily: 'DM Serif Display,serif', fontSize: 22, color: 'white', marginBottom: 6 }}>
                {isOnline ? 'Ready for deliveries' : 'You are offline'}
              </div>
              <div style={{ fontSize: 14, color: C.muted, marginBottom: 24 }}>
                {isOnline ? 'New orders will appear here automatically' : 'Go online to start receiving orders'}
              </div>
              {!isOnline && (
                <button onClick={toggleOnline}
                  style={{ padding: '14px 32px', background: C.accent, border: 'none', borderRadius: 14, color: 'white', fontSize: 16, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>
                  Go online
                </button>
              )}
            </div>
          )}

          {/* Available orders */}
          {isOnline && !currentOrder && availableOrders.length > 0 && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 }}>
                {availableOrders.length} order{availableOrders.length !== 1 ? 's' : ''} available
              </div>
              {availableOrders.map(order => (
                <AvailableOrderCard key={order.id} order={order} onAccept={handleAccept} loading={accepting} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── EARNINGS TAB ── */}
      {activeTab === 'earnings' && <EarningsTab stats={stats} />}

      {/* ── Bottom tab bar ── */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(10,26,35,0.97)', borderTop: '0.5px solid rgba(255,255,255,0.1)', display: 'flex', backdropFilter: 'blur(12px)', zIndex: 100 }}>
        {[
          { id: 'home',     icon: '🏠', label: 'Home' },
          { id: 'earnings', icon: '💰', label: 'Earnings' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ flex: 1, padding: '12px 0 10px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <span style={{ fontSize: 22 }}>{tab.icon}</span>
            <span style={{ fontSize: 10, color: activeTab === tab.id ? C.accent : C.muted, fontFamily: 'DM Sans,sans-serif', fontWeight: activeTab === tab.id ? 600 : 400 }}>
              {tab.label}
            </span>
          </button>
        ))}
        <button onClick={clear}
          style={{ flex: 1, padding: '12px 0 10px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <span style={{ fontSize: 22 }}>🚪</span>
          <span style={{ fontSize: 10, color: C.muted, fontFamily: 'DM Sans,sans-serif' }}>Sign out</span>
        </button>
      </div>
    </div>
  )
}
