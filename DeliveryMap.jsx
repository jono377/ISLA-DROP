import { useRef, useEffect, useState, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useCartStore } from '../../lib/store'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

// Ibiza centre
const IBIZA_CENTER = [1.4326, 38.9067]
const IBIZA_BOUNDS = [
  [1.2, 38.78], // SW
  [1.65, 39.05], // NE
]

export default function DeliveryMap({ onLocationSet }) {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const marker = useRef(null)
  const [address, setAddress] = useState('')
  const [w3w, setW3w] = useState('')
  const [loading, setLoading] = useState(false)
  const setDeliveryLocation = useCartStore(s => s.setDeliveryLocation)

  const reverseGeocode = useCallback(async (lng, lat) => {
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken}&language=en`
      )
      const data = await res.json()
      const place = data.features?.[0]?.place_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`
      return place
    } catch {
      return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
    }
  }, [])

  const onMarkerDrop = useCallback(async (lng, lat) => {
    setLoading(true)
    const addr = await reverseGeocode(lng, lat)
    setAddress(addr)
    setDeliveryLocation(lat, lng, addr, w3w)
    onLocationSet?.({ lat, lng, address: addr })
    setLoading(false)
  }, [reverseGeocode, setDeliveryLocation, onLocationSet, w3w])

  useEffect(() => {
    if (map.current) return

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: IBIZA_CENTER,
      zoom: 11,
      maxBounds: IBIZA_BOUNDS,
      attributionControl: false,
    })

    map.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')

    // Custom draggable marker
    const el = document.createElement('div')
    el.className = 'custom-marker'
    el.innerHTML = `
      <div class="marker-pin">
        <svg viewBox="0 0 24 24" fill="white" width="16" height="16">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      </div>
      <div class="marker-shadow"></div>
    `

    marker.current = new mapboxgl.Marker({ element: el, draggable: true })
      .setLngLat(IBIZA_CENTER)
      .addTo(map.current)

    marker.current.on('dragend', () => {
      const { lng, lat } = marker.current.getLngLat()
      onMarkerDrop(lng, lat)
    })

    map.current.on('click', (e) => {
      marker.current.setLngLat(e.lngLat)
      onMarkerDrop(e.lngLat.lng, e.lngLat.lat)
    })

    // Locate user
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { longitude, latitude } = pos.coords
          map.current.flyTo({ center: [longitude, latitude], zoom: 15 })
          marker.current.setLngLat([longitude, latitude])
          onMarkerDrop(longitude, latitude)
        },
        () => {
          // Default to Ibiza town if geolocation denied
          onMarkerDrop(IBIZA_CENTER[0], IBIZA_CENTER[1])
        }
      )
    }

    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [])

  return (
    <div style={{ position: 'relative' }}>
      <style>{`
        .custom-marker { cursor: grab; }
        .custom-marker:active { cursor: grabbing; }
        .marker-pin {
          width: 36px; height: 36px;
          background: #C4683A;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 3px 12px rgba(196,104,58,0.45);
          border: 2px solid white;
        }
        .marker-pin svg { transform: rotate(45deg); }
        .marker-shadow {
          width: 12px; height: 6px;
          background: rgba(0,0,0,0.2);
          border-radius: 50%;
          margin: 2px auto 0;
          filter: blur(2px);
        }
        .mapboxgl-ctrl-group { border-radius: 10px !important; }
      `}</style>

      <div ref={mapContainer} style={{ height: 220, borderRadius: '0 0 16px 16px' }} />

      <div style={{
        position: 'absolute', bottom: 12, left: 12, right: 12,
        background: 'rgba(254,252,249,0.95)',
        backdropFilter: 'blur(8px)',
        borderRadius: 10, padding: '8px 12px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="#C4683A">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
        </svg>
        <span style={{ fontSize: 12, color: '#2A2318', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {loading ? 'Locating...' : address || 'Tap the map or drag the pin to set your delivery location'}
        </span>
        {address && (
          <span style={{ fontSize: 10, background: '#E8F4E8', color: '#3B6D11', padding: '2px 7px', borderRadius: 10, whiteSpace: 'nowrap' }}>
            ✓ Set
          </span>
        )}
      </div>
    </div>
  )
}
