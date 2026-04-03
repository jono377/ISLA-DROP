import { useRef, useState, useEffect } from 'react'
import { useLeafletMap, PIN_ICON } from '../../lib/useLeafletMap'
import { useCartStore } from '../../lib/store'

const IBIZA = [38.9067, 1.4326]

async function reverseGeocode(lat, lng) {
  try {
    const token = import.meta.env.VITE_MAPBOX_TOKEN
    if (token) {
      const r = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&language=en`)
      const d = await r.json()
      return d.features?.[0]?.place_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`
    }
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
    const d = await r.json()
    return d.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
  }
}

export default function DeliveryMap({ onLocationSet }) {
  const containerRef = useRef(null)
  const { mapRef, setMarker, flyTo } = useLeafletMap(containerRef, { center: IBIZA, zoom: 12 })
  const [address, setAddress] = useState('')
  const [manualInput, setManualInput] = useState('')
  const [loading, setLoading] = useState(false)
  const { deliveryAddress, setDeliveryLocation } = useCartStore()

  const onDrop = async (lat, lng) => {
    setLoading(true)
    const addr = await reverseGeocode(lat, lng)
    setAddress(addr)
    setDeliveryLocation(lat, lng, addr)
    onLocationSet?.({ lat, lng, address: addr })
    setMarker('delivery', lat, lng, PIN_ICON('#C4683A'), '<b>Delivery here</b>')
    setLoading(false)
  }

  useEffect(() => {
    const interval = setInterval(() => {
      const map = mapRef.current
      if (!map) return
      clearInterval(interval)
      map.on('click', (e) => {
        onDrop(e.latlng.lat, e.latlng.lng)
        flyTo(e.latlng.lat, e.latlng.lng, 15)
      })
    }, 500)
    return () => clearInterval(interval)
  }, [])

  const useCurrentLocation = () => {
    setLoading(true)
    navigator.geolocation?.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        flyTo(latitude, longitude, 16)
        await onDrop(latitude, longitude)
      },
      () => setLoading(false),
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  const saveManual = () => {
    if (!manualInput.trim()) return
    setAddress(manualInput.trim())
    setDeliveryLocation(null, null, manualInput.trim())
    setManualInput('')
    onLocationSet?.()
  }

  return (
    <div>
      <div ref={containerRef} style={{ height:220, width:'100%', borderRadius:'0 0 14px 14px', overflow:'hidden' }} />
      <div style={{ padding:'10px 14px 14px', background:'rgba(13,59,74,0.98)' }}>
        {address && (
          <div style={{ background:'rgba(43,122,139,0.25)', border:'0.5px solid rgba(43,122,139,0.4)', borderRadius:8, padding:'8px 12px', marginBottom:10, fontSize:12, color:'rgba(255,255,255,0.85)', fontFamily:'DM Sans,sans-serif', display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ flexShrink:0 }}>📍</span>
            <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{address}</span>
            <span style={{ background:'#1D9E75', color:'white', fontSize:10, padding:'2px 6px', borderRadius:8, flexShrink:0 }}>✓ Set</span>
          </div>
        )}
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={useCurrentLocation} disabled={loading}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 12px', background:'rgba(43,122,139,0.2)', border:'0.5px solid rgba(43,122,139,0.35)', borderRadius:8, cursor:'pointer', fontFamily:'DM Sans,sans-serif', fontSize:12, color:'white', flexShrink:0 }}>
            {loading
              ? <span style={{ width:14, height:14, border:'2px solid rgba(255,255,255,0.2)', borderTopColor:'white', borderRadius:'50%', animation:'spin 0.8s linear infinite', display:'inline-block' }}/>
              : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>
            }
            {loading ? 'Locating…' : 'My location'}
          </button>
          <input value={manualInput} onChange={e=>setManualInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&saveManual()}
            placeholder="Villa, hotel, beach club…"
            style={{ flex:1, padding:'9px 12px', border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:8, fontFamily:'DM Sans,sans-serif', fontSize:12, background:'rgba(255,255,255,0.07)', color:'white', outline:'none' }}/>
          <button onClick={saveManual}
            style={{ padding:'9px 13px', background:'#C4683A', color:'white', border:'none', borderRadius:8, fontFamily:'DM Sans,sans-serif', fontSize:12, fontWeight:500, cursor:'pointer', flexShrink:0 }}>
            Set
          </button>
        </div>
        <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', marginTop:8, fontFamily:'DM Sans,sans-serif', textAlign:'center' }}>
          Tap the map to drop your pin · or use location above
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
