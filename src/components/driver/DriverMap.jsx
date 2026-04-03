import { useRef, useEffect } from 'react'
import { useLeafletMap, PIN_ICON, SCOOTER_ICON } from '../../lib/useLeafletMap'
import { updateDriverLocation } from '../../lib/supabase'
import { useAuthStore } from '../../lib/store'

export default function DriverMap({ order, isVisible }) {
  const containerRef = useRef(null)
  const { user } = useAuthStore()
  const { mapRef, setMarker, flyTo, fitBounds } = useLeafletMap(containerRef, {
    center: order?.delivery_lat && order?.delivery_lng
      ? [order.delivery_lat, order.delivery_lng]
      : [38.9067, 1.4326],
    zoom: 14,
  })

  // Place delivery destination pin
  useEffect(() => {
    if (!order?.delivery_lat || !order?.delivery_lng) return
    const interval = setInterval(() => {
      const map = mapRef.current
      if (!map) return
      clearInterval(interval)
      setMarker(
        'destination',
        order.delivery_lat,
        order.delivery_lng,
        PIN_ICON('#C4683A'),
        `<b>Drop-off</b><br>${order.delivery_address || ''}<br><small>${order.what3words ? '/// ' + order.what3words : ''}</small>`
      )
    }, 600)
    return () => clearInterval(interval)
  }, [order])

  // Track driver's own position and show on map
  useEffect(() => {
    if (!user || !isVisible) return

    const watchId = navigator.geolocation?.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setMarker('driver', latitude, longitude, SCOOTER_ICON, '<b>You</b>')
        updateDriverLocation(user.id, latitude, longitude).catch(() => {})

        if (order?.delivery_lat && order?.delivery_lng) {
          fitBounds([[latitude, longitude], [order.delivery_lat, order.delivery_lng]])
        }
      },
      null,
      { enableHighAccuracy: true, maximumAge: 8000, timeout: 10000 }
    )

    return () => {
      if (watchId) navigator.geolocation?.clearWatch(watchId)
    }
  }, [user, isVisible])

  const openGoogleMaps = () => {
    if (!order?.delivery_lat || !order?.delivery_lng) return
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${order.delivery_lat},${order.delivery_lng}&travelmode=driving`,
      '_blank'
    )
  }

  const openAppleMaps = () => {
    if (!order?.delivery_lat || !order?.delivery_lng) return
    window.open(
      `https://maps.apple.com/?daddr=${order.delivery_lat},${order.delivery_lng}&dirflg=d`,
      '_blank'
    )
  }

  if (!order) return null

  return (
    <div style={{ borderRadius: 14, overflow: 'hidden', border: '0.5px solid rgba(90,107,58,0.3)', marginBottom: 12 }}>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={containerRef} style={{ height: 220, width: '100%' }} />

      {/* Delivery info bar */}
      <div style={{ padding: '10px 14px', background: '#2A3A18' }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'white', marginBottom: 3, fontFamily: 'DM Sans,sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          📍 {order.delivery_address || 'Delivery address not set'}
        </div>
        {order.what3words && (
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 8, fontFamily: 'DM Sans,sans-serif' }}>
            /// {order.what3words}
          </div>
        )}
        {order.delivery_notes && (
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 10, fontFamily: 'DM Sans,sans-serif' }}>
            📝 {order.delivery_notes}
          </div>
        )}

        {/* Navigation buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={openGoogleMaps}
            style={{ flex: 1, padding: '9px', background: '#4285F4', color: 'white', border: 'none', borderRadius: 8, fontFamily: 'DM Sans,sans-serif', fontSize: 12, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
            Google Maps
          </button>
          <button onClick={openAppleMaps}
            style={{ flex: 1, padding: '9px', background: 'rgba(255,255,255,0.12)', color: 'white', border: '0.5px solid rgba(255,255,255,0.2)', borderRadius: 8, fontFamily: 'DM Sans,sans-serif', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
            🗺 Apple Maps
          </button>
        </div>
      </div>
    </div>
  )
}
