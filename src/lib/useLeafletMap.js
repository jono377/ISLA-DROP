// useLeafletMap.js
// Leaflet must only run in the browser (no SSR).
// This hook handles mounting, cleanup and marker management.

import { useEffect, useRef } from 'react'

const IBIZA = [38.9067, 1.4326]

export function useLeafletMap(containerRef, options = {}) {
  const mapRef    = useRef(null)
  const markersRef = useRef({})

  const {
    center    = IBIZA,
    zoom      = 13,
    darkStyle = false,
  } = options

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    // Dynamically import leaflet — avoids any SSR/build issues
    import('leaflet').then(L => {
      // Fix default icon paths broken by Vite bundling
      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const tileUrl = darkStyle
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

      const attribution = darkStyle
        ? '© <a href="https://carto.com">CARTO</a>'
        : '© <a href="https://openstreetmap.org">OpenStreetMap</a>'

      mapRef.current = L.map(containerRef.current, {
        center,
        zoom,
        zoomControl: true,
        attributionControl: true,
      })

      L.tileLayer(tileUrl, { attribution, maxZoom: 19 }).addTo(mapRef.current)

      // Store L on ref so callers can use it
      mapRef.current._L = L
    })

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        markersRef.current = {}
      }
    }
  }, [])

  // Helper: add or update a named marker
  const setMarker = (id, lat, lng, iconHtml, popupHtml) => {
    const map = mapRef.current
    if (!map || !map._L) return
    const L = map._L

    const icon = L.divIcon({
      html: iconHtml,
      className: '',
      iconAnchor: [16, 16],
    })

    if (markersRef.current[id]) {
      markersRef.current[id].setLatLng([lat, lng])
    } else {
      const m = L.marker([lat, lng], { icon })
      if (popupHtml) m.bindPopup(popupHtml)
      m.addTo(map)
      markersRef.current[id] = m
    }
  }

  const removeMarker = (id) => {
    if (markersRef.current[id]) {
      markersRef.current[id].remove()
      delete markersRef.current[id]
    }
  }

  const flyTo = (lat, lng, z = 15) => {
    mapRef.current?.flyTo([lat, lng], z, { animate: true, duration: 1.2 })
  }

  const fitBounds = (points) => {
    if (!mapRef.current || points.length < 2) return
    const L = mapRef.current._L
    const bounds = L.latLngBounds(points.map(([lat, lng]) => [lat, lng]))
    mapRef.current.fitBounds(bounds, { padding: [40, 40] })
  }

  return { mapRef, markersRef, setMarker, removeMarker, flyTo, fitBounds }
}

// ── Icon HTML helpers ─────────────────────────────────────────
export const PIN_ICON = (color = '#C4683A') => `
  <div style="width:32px;height:32px;background:${color};border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)">
    <div style="width:10px;height:10px;background:white;border-radius:50%;transform:rotate(45deg)"></div>
  </div>`

export const SCOOTER_ICON = `
  <div style="font-size:26px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));line-height:1">🛵</div>`

export const DOT_ICON = (color = '#2B7A8B') => `
  <div style="width:14px;height:14px;background:${color};border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`
