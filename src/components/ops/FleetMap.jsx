import { useRef, useEffect, useState } from 'react'
import { useLeafletMap, PIN_ICON, SCOOTER_ICON, DOT_ICON } from '../../lib/useLeafletMap'
import { subscribeToAllOrders } from '../../lib/supabase'

export default function FleetMap({ drivers, orders }) {
  const containerRef = useRef(null)
  const { mapRef, setMarker, removeMarker } = useLeafletMap(containerRef, {
    center: [38.9067, 1.4326],
    zoom: 11,
  })
  const [markerIds, setMarkerIds] = useState([])

  // Update driver markers whenever driver data changes
  useEffect(() => {
    const interval = setInterval(() => {
      if (!mapRef.current) return
      clearInterval(interval)

      const online = drivers.filter(d => d.is_online)

      online.forEach(driver => {
        const coords = driver.current_location?.coordinates
        if (!coords) return
        const [lng, lat] = coords
        const name = driver.profiles?.full_name ?? 'Driver'
        setMarker(
          `driver-${driver.id}`,
          lat, lng,
          SCOOTER_ICON,
          `<b>🛵 ${name}</b><br>Online · ${driver.total_deliveries ?? 0} runs`
        )
      })

      // Place order destination pins
      orders.filter(o => o.delivery_lat && o.delivery_lng && !['delivered','cancelled'].includes(o.status))
        .forEach(order => {
          setMarker(
            `order-${order.id}`,
            order.delivery_lat,
            order.delivery_lng,
            PIN_ICON('#2B7A8B'),
            `<b>#${order.order_number}</b><br>${order.delivery_address ?? ''}<br>Status: ${order.status}`
          )
        })
    }, 800)

    return () => clearInterval(interval)
  }, [drivers, orders])

  const onlineCount  = drivers.filter(d => d.is_online).length
  const activeOrders = orders.filter(o => !['delivered','cancelled'].includes(o.status)).length

  return (
    <div style={{ margin: '0 -16px' }}>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

      {/* Legend */}
      <div style={{ padding: '8px 16px 10px', display: 'flex', gap: 16, fontSize: 12, color: '#7A6E60', background: 'white' }}>
        <span>🛵 {onlineCount} driver{onlineCount !== 1 ? 's' : ''} online</span>
        <span>📍 {activeOrders} active order{activeOrders !== 1 ? 's' : ''}</span>
      </div>

      {/* Map */}
      <div ref={containerRef} style={{ height: 420, width: '100%' }} />
    </div>
  )
}
