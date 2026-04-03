import { useRef, useEffect, useState } from 'react'
import { useLeafletMap, PIN_ICON, SCOOTER_ICON } from '../../lib/useLeafletMap'
import { subscribeToDriverLocation } from '../../lib/supabase'

export default function OrderTrackingMap({ order, driverId }) {
  const containerRef = useRef(null)
  const { mapRef, setMarker, flyTo, fitBounds } = useLeafletMap(containerRef, {
    center: order.delivery_lat && order.delivery_lng
      ? [order.delivery_lat, order.delivery_lng]
      : [38.9067, 1.4326],
    zoom: 14,
    darkStyle: false,
  })
  const [driverPos, setDriverPos] = useState(null)

  // Place delivery pin on map
  useEffect(() => {
    if (!order.delivery_lat || !order.delivery_lng) return
    const interval = setInterval(() => {
      const map = mapRef.current
      if (!map) return
      clearInterval(interval)
      setMarker(
        'delivery',
        order.delivery_lat,
        order.delivery_lng,
        PIN_ICON('#C4683A'),
        `<b>Your delivery address</b><br>${order.delivery_address || ''}`
      )
    }, 600)
    return () => clearInterval(interval)
  }, [order])

  // Subscribe to live driver location
  useEffect(() => {
    if (!driverId) return
    const sub = subscribeToDriverLocation(driverId, (locRow) => {
      // locRow.location is a PostGIS point {coordinates:[lng,lat]}
      const coords = locRow.location?.coordinates
      if (!coords) return
      const [lng, lat] = coords
      setDriverPos({ lat, lng })
      setMarker('driver', lat, lng, SCOOTER_ICON, '<b>Your driver</b>')

      // Fit map to show both driver and destination
      if (order.delivery_lat && order.delivery_lng) {
        fitBounds([[lat, lng], [order.delivery_lat, order.delivery_lng]])
      } else {
        flyTo(lat, lng, 14)
      }
    })
    return () => sub?.unsubscribe()
  }, [driverId])

  return (
    <div style={{ borderRadius: 14, overflow: 'hidden', border: '0.5px solid rgba(255,255,255,0.1)' }}>
      <div ref={containerRef} style={{ height: 240, width: '100%' }} />
      <div style={{ padding: '10px 14px', background: 'rgba(13,59,74,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(255,255,255,0.7)', fontFamily: 'DM Sans,sans-serif' }}>
          <span>🛵</span>
          <span>{driverPos ? 'Driver is on the way' : 'Waiting for driver location…'}</span>
        </div>
        {order.delivery_lat && order.delivery_lng && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.7)', fontFamily: 'DM Sans,sans-serif' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#C4683A', display: 'inline-block' }} />
            Your pin
          </div>
        )}
      </div>
    </div>
  )
}
