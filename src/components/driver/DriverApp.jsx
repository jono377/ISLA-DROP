import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import DriverMap from './DriverMap'
import {
  getAvailableOrders, acceptOrder, updateOrderStatus,
  updateDriverLocation, setDriverOnlineStatus,
  subscribeToAvailableOrders
} from '../../lib/supabase'
import { useAuthStore, useDriverStore } from '../../lib/store'

const STATUS_FLOW = {
  assigned: { next: 'picked_up', label: 'Mark as picked up', color: '#5A6B3A' },
  picked_up: { next: 'en_route', label: 'Start delivery', color: '#2B7A8B' },
  en_route: { next: 'delivered', label: 'Mark as delivered', color: '#C4683A' },
}

export default function DriverApp() {
  const { user, profile } = useAuthStore()
  const { isOnline, setOnline, currentOrder, setCurrentOrder, availableOrders, setAvailableOrders, updateLocation } = useDriverStore()
  const [stats, setStats] = useState({ runs: 0, earnings: 0, avgTime: 0 })
  const [loading, setLoading] = useState(false)

  const loadOrders = useCallback(async () => {
    try {
      const orders = await getAvailableOrders()
      setAvailableOrders(orders)
    } catch (err) {
      console.error('Failed to load orders:', err)
    }
  }, [setAvailableOrders])

  useEffect(() => {
    if (!isOnline) return
    loadOrders()
    const sub = subscribeToAvailableOrders(loadOrders)
    return () => sub.unsubscribe()
  }, [isOnline, loadOrders])

  // GPS tracking
  useEffect(() => {
    if (!isOnline || !user) return

    const watchId = navigator.geolocation?.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        updateLocation(latitude, longitude)
        updateDriverLocation(user.id, latitude, longitude).catch(console.error)
      },
      (err) => console.warn('GPS error:', err),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
    )

    return () => {
      if (watchId) navigator.geolocation?.clearWatch(watchId)
    }
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
      toast.success('Order accepted!')
    } catch {
      toast.error('Order already taken')
      loadOrders()
    }
    setLoading(false)
  }

  const handleAdvanceStatus = async () => {
    if (!currentOrder) return
    const flow = STATUS_FLOW[currentOrder.status]
    if (!flow) return

    setLoading(true)
    try {
      const extra = {}
      if (flow.next === 'picked_up') extra.picked_up_at = new Date().toISOString()
      if (flow.next === 'delivered') extra.delivered_at = new Date().toISOString()

      const updated = await updateOrderStatus(currentOrder.id, flow.next, extra)
      setCurrentOrder(updated)

      if (flow.next === 'delivered') {
        toast.success('🎉 Delivery complete!')
        setStats(s => ({ runs: s.runs + 1, earnings: s.earnings + (currentOrder.total * 0.8), avgTime: s.avgTime }))
        setTimeout(() => setCurrentOrder(null), 2000)
      }
    } catch (err) {
      toast.error('Failed to update: ' + err.message)
    }
    setLoading(false)
  }

  const openNavigation = (order) => {
    const { delivery_lat, delivery_lng } = order
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${delivery_lat},${delivery_lng}&travelmode=driving`)
  }

  const orderItems = (order) => order.order_items
    ?.map(i => `${i.quantity}× ${i.products?.emoji ?? ''} ${i.products?.name ?? ''}`)
    .join(', ') ?? ''

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: '#3D4F22', padding: '20px 20px 16px', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 22 }}>
              Hola, {profile?.full_name?.split(' ')[0] ?? 'Driver'}
            </div>
            <div style={{ fontSize: 12, opacity: 0.65, marginTop: 2 }}>
              {isOnline ? '🟢 Online · GPS active' : '🔴 Offline'}
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <span style={{ fontSize: 12 }}>{isOnline ? 'Online' : 'Offline'}</span>
            <div
              onClick={toggleOnline}
              style={{
                width: 44, height: 24, borderRadius: 12,
                background: isOnline ? '#7EE8A2' : 'rgba(255,255,255,0.25)',
                position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
              }}
            >
              <div style={{
                width: 20, height: 20, background: 'white', borderRadius: '50%',
                position: 'absolute', top: 2, left: isOnline ? 22 : 2,
                transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }} />
            </div>
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
          {[
            { val: stats.runs, label: "Today's runs" },
            { val: `€${stats.earnings.toFixed(0)}`, label: 'Earnings' },
            { val: `${stats.avgTime || '—'}m`, label: 'Avg time' },
          ].map(({ val, label }) => (
            <div key={label} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ fontSize: 20, fontWeight: 500 }}>{val}</div>
              <div style={{ fontSize: 10, opacity: 0.65, marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '20px 16px' }}>
        {/* Active delivery */}
        {currentOrder && STATUS_FLOW[currentOrder.status] && (
          <div style={{ background: '#EAF3DE', border: '1.5px solid #5A6B3A', borderRadius: 14, padding: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 500, color: '#3B6D11', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>
              Active delivery · #{currentOrder.order_number}
            </div>
            <div style={{ fontSize: 15, fontWeight: 500, color: '#2A2318', marginBottom: 3 }}>
              {currentOrder.delivery_address}
            </div>
            {currentOrder.what3words && (
              <div style={{ fontSize: 12, color: '#5A6B3A', marginBottom: 3 }}>
                ///  {currentOrder.what3words}
              </div>
            )}
            {currentOrder.delivery_notes && (
              <div style={{ fontSize: 12, color: '#7A6E60', marginBottom: 8 }}>
                📝 {currentOrder.delivery_notes}
              </div>
            )}
            <div style={{ fontSize: 12, color: '#7A6E60', marginBottom: 12 }}>{orderItems(currentOrder)}</div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleAdvanceStatus}
                disabled={loading}
                style={{ flex: 2, padding: '11px', background: STATUS_FLOW[currentOrder.status]?.color, color: 'white', border: 'none', borderRadius: 10, fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
              >
                {loading ? '...' : STATUS_FLOW[currentOrder.status]?.label}
              </button>
              <button
                onClick={() => openNavigation(currentOrder)}
                style={{ flex: 1, padding: '11px', background: '#D4EEF2', color: '#1A5263', border: 'none', borderRadius: 10, fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
              >
                🗺 Navigate
              </button>
            </div>

            {/* Live map for active delivery */}
            <div style={{ marginTop: 12 }}>
              <DriverMap order={currentOrder} isVisible={true} />
            </div>

            {/* ID Check reminder */}
            <div style={{ marginTop: 10, padding: '8px 12px', background: '#F0DDD3', borderRadius: 8, fontSize: 11, color: '#8B4220', display: 'flex', gap: 6 }}>
              <span>🆔</span>
              <span>Remember to check photo ID. Refuse delivery if customer cannot verify age 18+.</span>
            </div>
          </div>
        )}

        {/* Available orders */}
        {isOnline ? (
          <>
            <div style={{ fontSize: 11, fontWeight: 500, color: '#7A6E60', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 }}>
              {availableOrders.length > 0 ? `${availableOrders.length} new request${availableOrders.length !== 1 ? 's' : ''}` : 'Waiting for orders…'}
            </div>

            {availableOrders.length === 0 && !currentOrder && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#7A6E60', fontSize: 14 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🛵</div>
                <div>No orders right now.</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Stay online — new orders will appear here.</div>
              </div>
            )}

            {availableOrders.map(order => (
              <AvailableOrderCard
                key={order.id}
                order={order}
                onAccept={() => handleAccept(order)}
                onNavigate={() => openNavigation(order)}
                loading={loading}
                itemsText={orderItems(order)}
              />
            ))}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#7A6E60' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>😴</div>
            <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 6 }}>You're offline</div>
            <div style={{ fontSize: 14 }}>Toggle online above to start receiving orders.</div>
          </div>
        )}
      </div>
    </div>
  )
}

function AvailableOrderCard({ order, onAccept, onNavigate, loading, itemsText }) {
  const isPriority = order.total > 100

  return (
    <div style={{
      background: '#FEFCF9',
      border: isPriority ? '1.5px solid #C4683A' : '0.5px solid rgba(42,35,24,0.12)',
      borderRadius: 14, padding: 16, marginBottom: 12,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: '#7A6E60' }}>#{order.order_number}</div>
        <span style={{
          fontSize: 10, padding: '3px 8px', borderRadius: 12, fontWeight: 500,
          background: isPriority ? '#F0DDD3' : '#EAF3DE',
          color: isPriority ? '#8B4220' : '#3B6D11',
        }}>
          {isPriority ? 'High value' : 'Standard'}
        </span>
      </div>

      <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 3 }}>{order.delivery_address}</div>
      {order.what3words && <div style={{ fontSize: 12, color: '#5A6B3A', marginBottom: 3 }}>/// {order.what3words}</div>}
      <div style={{ fontSize: 12, color: '#7A6E60', marginBottom: 12 }}>{itemsText} · <strong style={{ color: '#2A2318' }}>€{order.total?.toFixed(2)}</strong></div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={onAccept}
          disabled={loading}
          style={{ flex: 1, padding: '10px', background: '#3D4F22', color: 'white', border: 'none', borderRadius: 10, fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
        >
          Accept run
        </button>
        <button
          onClick={onNavigate}
          style={{ padding: '10px 14px', background: '#D4EEF2', color: '#1A5263', border: 'none', borderRadius: 10, fontFamily: 'DM Sans, sans-serif', fontSize: 13, cursor: 'pointer' }}
        >
          🗺
        </button>
      </div>
    </div>
  )
}
