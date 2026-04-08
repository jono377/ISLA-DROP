import { useRef, useEffect, useState, useCallback } from 'react'
import { useLeafletMap, PIN_ICON, SCOOTER_ICON, DOT_ICON } from '../../lib/useLeafletMap'
import { supabase } from '../../lib/supabase'

const WAREHOUSE = [38.9090, 1.4340]

const STATUS_COLORS = {
  pending:    '#F5C97A',
  confirmed:  '#7ECFE0',
  preparing:  '#7ECFE0',
  assigned:   '#C4683A',
  picked_up:  '#C4683A',
  en_route:   '#E8A070',
  delivered:  '#7EE8A2',
  cancelled:  '#9A8E80',
}

const STATUS_EMOJI = {
  pending:   '🕐', confirmed: '✅', preparing: '📦',
  assigned:  '🛵', picked_up: '🛵', en_route:  '🚀',
  delivered: '✓',  cancelled: '✗',
}

export default function FleetMap({ drivers = [], orders = [] }) {
  const containerRef = useRef(null)
  const { mapRef, setMarker, removeMarker, fitBounds, flyTo } = useLeafletMap(containerRef, {
    center: WAREHOUSE,
    zoom: 12,
    darkStyle: true,
  })

  const [liveDrivers, setLiveDrivers] = useState(drivers)
  const [selectedDriver, setSelectedDriver] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [autoFit, setAutoFit] = useState(true)
  const tickRef = useRef(null)

  // Subscribe to realtime driver location updates
  useEffect(() => {
    const channel = supabase
      .channel('ops-fleet-map')
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'drivers',
      }, payload => {
        setLiveDrivers(prev => prev.map(d =>
          d.id === payload.new.id ? { ...d, ...payload.new } : d
        ))
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  // Sync prop changes into live state
  useEffect(() => {
    setLiveDrivers(drivers)
  }, [drivers])

  // Update all markers every 3 seconds
  useEffect(() => {
    const update = () => {
      if (!mapRef.current) return

      // Warehouse pin
      setMarker('warehouse', WAREHOUSE[0], WAREHOUSE[1],
        `<div style="font-size:22px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5))">🏪</div>`,
        '<b>Isla Drop Warehouse</b><br>Dispatch centre'
      )

      // Driver markers - pulsing when en route
      const onlineDrivers = liveDrivers.filter(d => d.is_online)
      onlineDrivers.forEach(driver => {
        const coords = driver.current_location?.coordinates
        if (!coords) return
        const [lng, lat] = coords
        const name = driver.profiles?.full_name || 'Driver'
        const activeOrder = orders.find(o => o.driver_id === driver.id && !['delivered','cancelled'].includes(o.status))
        const pulse = activeOrder ? 'animation:pulse 1s infinite' : ''
        setMarker(
          'driver-' + driver.id,
          lat, lng,
          `<div style="position:relative;${pulse}">
            <div style="font-size:28px;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.6));line-height:1">🛵</div>
            ${activeOrder ? '<div style="position:absolute;top:-4px;right:-4px;width:10px;height:10px;background:#7EE8A2;border-radius:50%;border:1.5px solid #1A1208;animation:pulse 1s infinite"></div>' : ''}
          </div>`,
          `<div style="font-family:DM Sans,sans-serif;min-width:160px">
            <div style="font-weight:600;margin-bottom:4px">🛵 ${name}</div>
            <div style="font-size:12px;color:#666;margin-bottom:2px">${activeOrder ? '📦 On delivery #' + (activeOrder.order_number || activeOrder.id.slice(0,6)) : '⏳ Available'}</div>
            <div style="font-size:11px;color:#999">${driver.total_deliveries || 0} total runs · ${driver.rating || 5}★</div>
          </div>`
        )
      })

      // Remove offline driver markers
      liveDrivers.filter(d => !d.is_online).forEach(d => removeMarker('driver-' + d.id))

      // Order drop-off pins
      const activeOrders = orders.filter(o =>
        o.delivery_lat && o.delivery_lng &&
        !['delivered', 'cancelled'].includes(o.status)
      )

      activeOrders.forEach(order => {
        const color = STATUS_COLORS[order.status] || '#C4683A'
        const emoji = STATUS_EMOJI[order.status] || '📍'
        const items = (order.order_items || []).slice(0, 3).map(i => i.products?.name || i.product_id).join(', ')
        setMarker(
          'order-' + order.id,
          order.delivery_lat,
          order.delivery_lng,
          `<div style="position:relative">
            <div style="width:34px;height:34px;background:${color};border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.4)">
              <div style="transform:rotate(45deg);font-size:14px">${emoji}</div>
            </div>
            <div style="position:absolute;top:-8px;left:38px;background:${color};color:#1A1208;font-size:9px;font-weight:700;padding:2px 5px;border-radius:6px;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.3)">
              #${order.order_number || order.id.slice(0,6)}
            </div>
          </div>`,
          `<div style="font-family:DM Sans,sans-serif;min-width:180px">
            <div style="font-weight:600;margin-bottom:4px">Order #${order.order_number || order.id.slice(0,6)}</div>
            <div style="font-size:12px;margin-bottom:3px;color:#555">${order.delivery_address || 'No address'}</div>
            <div style="font-size:11px;color:${color};font-weight:600;text-transform:capitalize;margin-bottom:3px">${order.status.replace('_',' ')}</div>
            ${items ? '<div style="font-size:11px;color:#999">' + items + '</div>' : ''}
            ${order.driver_id ? '<div style="font-size:11px;color:#666;margin-top:3px">Driver assigned</div>' : ''}
          </div>`
        )
      })

      // Remove delivered/cancelled order markers
      orders.filter(o => ['delivered','cancelled'].includes(o.status))
        .forEach(o => removeMarker('order-' + o.id))

      // Auto-fit map to show all markers
      if (autoFit) {
        const points = []
        onlineDrivers.forEach(d => {
          const coords = d.current_location?.coordinates
          if (coords) points.push([coords[1], coords[0]])
        })
        activeOrders.forEach(o => points.push([o.delivery_lat, o.delivery_lng]))
        points.push(WAREHOUSE)
        if (points.length > 1) fitBounds(points)
      }
    }

    tickRef.current = setInterval(update, 3000)
    update() // immediate first run

    return () => clearInterval(tickRef.current)
  }, [liveDrivers, orders, autoFit])

  const onlineDrivers = liveDrivers.filter(d => d.is_online)
  const activeOrders  = orders.filter(o => !['delivered','cancelled'].includes(o.status))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, borderRadius: 16, overflow: 'hidden', border: '0.5px solid rgba(42,35,24,0.12)', background: '#1A1208' }}>

      {/* Stats bar */}
      <div style={{ display: 'flex', gap: 0, background: '#1A1208' }}>
        {[
          { label: 'Online drivers', value: onlineDrivers.length, color: '#7EE8A2', icon: '🛵' },
          { label: 'Active orders',  value: activeOrders.length,  color: '#E8A070', icon: '📦' },
          { label: 'Delivering',     value: activeOrders.filter(o => ['en_route','picked_up'].includes(o.status)).length, color: '#7ECFE0', icon: '🚀' },
          { label: 'Pending',        value: activeOrders.filter(o => o.status === 'pending').length, color: '#F5C97A', icon: '🕐' },
        ].map(s => (
          <div key={s.label} style={{ flex: 1, padding: '12px 16px', borderRight: '0.5px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
            <div style={{ fontSize: 20, marginBottom: 2 }}>{s.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: 'DM Sans,sans-serif' }}>{s.value}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 8, padding: '10px 16px', background: '#221A0E', alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={() => { setAutoFit(true); fitBounds([[...WAREHOUSE]]) }}
          style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.08)', border: '0.5px solid rgba(255,255,255,0.15)', borderRadius: 8, color: 'white', fontSize: 12, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>
          🎯 Fit all
        </button>
        <button onClick={() => flyTo(WAREHOUSE[0], WAREHOUSE[1], 14)}
          style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.08)', border: '0.5px solid rgba(255,255,255,0.15)', borderRadius: 8, color: 'white', fontSize: 12, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>
          🏪 Warehouse
        </button>
        <button onClick={() => setAutoFit(a => !a)}
          style={{ padding: '6px 12px', background: autoFit ? 'rgba(126,232,162,0.15)' : 'rgba(255,255,255,0.08)', border: '0.5px solid ' + (autoFit ? 'rgba(126,232,162,0.4)' : 'rgba(255,255,255,0.15)'), borderRadius: 8, color: autoFit ? '#7EE8A2' : 'rgba(255,255,255,0.5)', fontSize: 12, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>
          {autoFit ? '🔒 Auto-fit on' : '🔓 Auto-fit off'}
        </button>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, fontSize: 11, color: 'rgba(255,255,255,0.4)', alignItems: 'center' }}>
          <span>🛵 Driver</span>
          <span style={{ color: '#F5C97A' }}>🕐 Pending</span>
          <span style={{ color: '#C4683A' }}>🚀 En route</span>
          <span style={{ color: '#7EE8A2' }}>✓ Delivered</span>
        </div>
      </div>

      {/* Map */}
      <div style={{ position: 'relative' }}>
        <style>{'@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.6;transform:scale(1.3)}}'}</style>
        <div ref={containerRef} style={{ height: 520, width: '100%' }} />

        {/* Driver list overlay */}
        {onlineDrivers.length > 0 && (
          <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 999, background: 'rgba(26,18,8,0.92)', borderRadius: 12, padding: '10px 12px', minWidth: 180, backdropFilter: 'blur(8px)', border: '0.5px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>Live drivers</div>
            {onlineDrivers.map(driver => {
              const coords = driver.current_location?.coordinates
              const hasLocation = !!coords
              const activeOrder = orders.find(o => o.driver_id === driver.id && !['delivered','cancelled'].includes(o.status))
              return (
                <div key={driver.id}
                  onClick={() => {
                    if (coords) flyTo(coords[1], coords[0], 15)
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '0.5px solid rgba(255,255,255,0.06)', cursor: hasLocation ? 'pointer' : 'default' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: hasLocation ? '#7EE8A2' : '#F5C97A', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: 'white', fontWeight: 500, fontFamily: 'DM Sans,sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {driver.profiles?.full_name || 'Driver'}
                    </div>
                    <div style={{ fontSize: 10, color: activeOrder ? '#E8A070' : 'rgba(255,255,255,0.35)', fontFamily: 'DM Sans,sans-serif' }}>
                      {activeOrder ? 'On delivery' : 'Available'}
                    </div>
                  </div>
                  {hasLocation && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>›</span>}
                </div>
              )
            })}
          </div>
        )}

        {/* No drivers message */}
        {onlineDrivers.length === 0 && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 999, background: 'rgba(26,18,8,0.85)', borderRadius: 12, padding: '16px 24px', textAlign: 'center', backdropFilter: 'blur(8px)' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🛵</div>
            <div style={{ color: 'white', fontSize: 14, fontFamily: 'DM Sans,sans-serif', fontWeight: 500 }}>No drivers online</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 4, fontFamily: 'DM Sans,sans-serif' }}>Map updates every 3 seconds</div>
          </div>
        )}
      </div>
    </div>
  )
}
