import { useState, useRef, useEffect, useCallback } from 'react'
import { useCartStore } from '../../lib/store'
import toast from 'react-hot-toast'

// Ibiza bounding box for Nominatim
const IBIZA_BOUNDS = '1.15,38.82,1.75,39.15'

// Comprehensive Ibiza place database for instant offline suggestions
const IBIZA_PLACES = [
  // ── Towns, Villages & Barrios ──────────────────────────────
  'Ibiza Town', 'Eivissa', 'Dalt Vila', 'La Marina', 'La Penya', 'Sa Penya',
  'San Antonio', 'San Antonio Abad', 'Sant Antoni de Portmany',
  'Santa Eulalia del Río', 'Santa Eulalia', 'Sant Eulàlia des Riu',
  'San José', 'Sant Josep de sa Talaia', 'San Juan', 'Sant Joan de Labritja',
  'San Rafael', 'San Carlos', 'San Lorenzo', 'San Mateo', 'San Miguel',
  'Sant Miquel de Balansat', 'Santa Agnès de Corona', 'Santa Gertrudis de Fruitera',
  'Es Canar', 'Portinatx', 'Cala de Sant Vicent', 'Es Figueral', 'Figueretas',
  'Talamanca', 'Jesús', 'Roca Llisa', 'Can Furnet', 'Can Misses', 'Can Sion',
  'Puig den Valls', 'San Jordi', 'Can Escandell', 'Cas Serres', 'Es Vive',
  'Siesta', 'Playamar', 'Sol den Serra', 'Cap des Falco', 'Benimussa',
  'Can Pep Simo', 'Can Rimbau', 'Vista Alegre', 'Na Xamena',
  'Es Cubells', 'Cala Llentrisca', 'Cap Llentrisca', 'El Pilar de la Mola',
  'Sant Francesc de s Estany', 'Ses Torres', 'Es Joncs', 'Can Bossa',
  'Platja den Bossa Urbanización', 'Es Codolar', 'Ses Fontanelles',

  // ── Beaches & Calas ────────────────────────────────────────
  "Playa d'en Bossa", 'Playa den Bossa', 'Ses Salines Beach', 'Las Salinas Beach',
  'Cala Jondal', 'Cala Bassa', 'Cala Conta', 'Cala Tarida', 'Cala Vadella',
  'Cala Gracioneta', 'Cala Llonga', 'Cala Nova', 'Cala Martina', 'Cala Lenya',
  'Cala Mastella', 'Cala Boix', 'Cala Pada', 'Cala Olivera', 'Cala Molí',
  'Cala Corral', 'Cala Salada', 'Cala Saladeta', 'Cala Gracio',
  'Pou des Lleó', 'Es Caló des Mort', 'Aguas Blancas', 'Aigues Blanques',
  'Benirràs', 'Es Cavallet', 'Ses Illetes', 'Playa de Talamanca',
  'Figueretas Beach', 'Playa de Figueretas', 'Ses Fonts', 'Es Torrent',
  'Cap Negret', 'Port des Torrent', 'Cala Gració',

  // ── Marinas & Ports ────────────────────────────────────────
  'Marina Botafoch', 'Puerto de Ibiza', 'Ibiza Marina', 'Marina Ibiza',
  'Puerto Deportivo San Antonio', 'Santa Eulalia Marina', 'Port de Santa Eulalia',
  'Port de San Miguel', 'Port de Portinatx',

  // ── Hotels & Resorts ───────────────────────────────────────
  'Nobu Hotel Ibiza Bay', 'Nobu Ibiza Bay',
  'Me Ibiza Hotel', 'ME Ibiza',
  'Destino Pacha Resort', 'Destino Pacha Hotel',
  'Hacienda Na Xamena Hotel', 'Hacienda Na Xamena',
  'Aguas de Ibiza Grand Aria', 'Aguas de Ibiza Hotel',
  'Palladium Hotel Ibiza', 'Palladium Hotel',
  'Hard Rock Hotel Ibiza', 'Hard Rock Hotel',
  'Ushuaia Ibiza Beach Hotel', 'Ushuaia Hotel',
  'Hotel Riomar Santa Eulalia', 'Hotel Riomar',
  'La Torre del Canonigo', 'Gran Hotel Montesol',
  'Montesol Experimental Hotel', 'Experimental Ibiza',
  'Pikes Hotel Ibiza', 'Pikes Hotel',
  'Six Senses Ibiza', 'Bless Hotel Ibiza',
  'Ocean Drive Hotel', 'Lio Hotel Ibiza',
  'Hostal La Torre', 'Hotel El Corsario',
  'Boutique Hotel El Puerto', 'Casa de Colonos',
  'Can Pau Ibiza Hotel', 'Argos Ibiza',
  'Hotel Vibra Riviera', 'Hotel Vibra',
  'Ibiza Gran Hotel', 'Hotel Las Arenas',
  'Siau Ibiza Hotel', 'The Standard Ibiza',
  'Riomar Hotel Santa Eulalia', 'Ca Na Xica Hotel',
  'Cubanito Ibiza Hotel', 'Cas Gasi Agroturismo',
  'Atzaro Agroturismo', 'Atzaro Hotel',
  'Hostal La Savina', 'Hotel Torre del Mar',
  'Coral Beach Hotel', 'Hotel Nautilus',
  'Invisa Hotel Club Cala Verde', 'Invisa Hotel',

  // ── Apartments & Residential Areas ────────────────────────
  'Marina Botafoch Apartments', 'Playa Bella Apartments',
  'Los Molinos Apartments', 'Es Vive Ibiza Apartments',
  'Apartamentos Cala Bassa', 'Cala Bassa Apartments',
  'Roca Llisa Golf Course', 'Las Boas de Ibiza',
  'Sea Senses Apartments', 'Intertur Hawaii Ibiza',

  // ── Clubs & Beach Clubs ────────────────────────────────────
  'Pacha Ibiza', 'Amnesia Ibiza', 'DC-10 Ibiza', 'Hi Ibiza', 'UNVRS Ibiza',
  'Cova Santa', 'Lio Ibiza', 'O Beach Ibiza', 'Destino Five',
  'Blue Marlin Ibiza', 'Nassau Beach Club', 'Nikki Beach Ibiza',
  'Beso Beach Ibiza', 'Jockey Club Ibiza', 'Cotton Beach Club',
  'Beachouse Ibiza', 'Tropicana Ibiza', 'El Chiringuito Es Cavallet',
  'Sa Trinxa Beach Bar', 'Experimental Beach Ibiza',
  'Tanit Beach Club', 'Amante Ibiza', 'Kumharas',

  // ── Restaurants ────────────────────────────────────────────
  'La Gaia Ibiza', 'Nobu Restaurant Ibiza Bay', 'Sublimotion Ibiza',
  'El Chiringuito', 'Jondal Restaurant', 'Atzaro Restaurant',
  'El Ayoun Ibiza', 'Suki Ibiza', 'La Paloma San Lorenzo',

  // ── Roads & Carreteras ─────────────────────────────────────
  'Carretera Ibiza San Antonio', 'Carretera San Jose', 'Carretera Santa Eulalia',
  'Carretera San Miguel', 'Carretera San Juan', 'Carretera del Aeropuerto',
  'Avenida España Ibiza', 'Passeig de ses Fonts', 'Cami de sa Vorera',
  'Avenida Ignasi Wallis', 'Carrer de la Constitució',
  'Via Romana', 'Ronda de Can Misses',

  // ── Airport & Transport ────────────────────────────────────
  'Ibiza Airport', 'Aeropuerto de Ibiza', 'Ibiza Bus Station',
  'Estación Marítima Ibiza', 'Ibiza Ferry Terminal',
]

// Reverse geocode coordinates to address using Nominatim
async function reverseGeocode(lat, lng) {
  try {
    const url = 'https://nominatim.openstreetmap.org/reverse?lat=' + lat + '&lon=' + lng +
      '&format=json&addressdetails=1&accept-language=en'
    const resp = await fetch(url, { headers: { 'User-Agent': 'IslaDropIbiza/1.0' } })
    if (!resp.ok) return null
    const data = await resp.json()
    if (!data || data.error) return null
    const a = data.address || {}
    const parts = [
      data.name && data.name !== a.road ? data.name : null,
      a.road && a.house_number ? a.house_number + ' ' + a.road : a.road,
      a.suburb || a.neighbourhood || a.village || a.town || a.city,
    ].filter(Boolean)
    return parts.join(', ') || data.display_name.split(',').slice(0,3).join(',').trim()
  } catch { return null }
}

// Search Nominatim - bounded to Ibiza
async function searchNominatim(query) {
  if (!query || query.length < 2) return []
  try {
    const encoded = encodeURIComponent(query + ' Ibiza')
    const url = 'https://nominatim.openstreetmap.org/search?q=' + encoded +
      '&format=json&limit=8&viewbox=' + IBIZA_BOUNDS + '&bounded=1' +
      '&addressdetails=1&accept-language=en&dedupe=1'
    const resp = await fetch(url, { headers: { 'User-Agent': 'IslaDropIbiza/1.0' } })
    if (!resp.ok) return []
    const data = await resp.json()
    return data.map(r => {
      const a = r.address || {}
      const namePart = r.name && r.name !== a.road ? r.name : null
      const roadPart = a.road && a.house_number ? a.house_number + ' ' + a.road : a.road
      const areaPart = a.suburb || a.neighbourhood || a.village || a.town || a.city
      const parts = [namePart, roadPart, areaPart].filter(Boolean)
      return {
        display: parts.length > 0 ? parts.join(', ') : r.display_name.split(',').slice(0,3).join(',').trim(),
        lat: parseFloat(r.lat), lng: parseFloat(r.lon),
        type: r.type,
      }
    }).filter(r => r.display.length > 2)
  } catch { return [] }
}

export default function AddressBar({ estimatedMins }) {
  const { deliveryAddress, setDeliveryAddress } = useCartStore()
  const [input, setInput] = useState(deliveryAddress || '')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)
  const [locating, setLocating] = useState(false)
  const [editing, setEditing] = useState(false)
  const debounceRef = useRef(null)
  const inputRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    const handler = e => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowSuggestions(false)
        setEditing(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const useCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Location not available on this device')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude, longitude } = pos.coords
        const addr = await reverseGeocode(latitude, longitude)
        if (addr) {
          setInput(addr)
          setDeliveryAddress(addr)
          toast.success('📍 Location detected: ' + addr.split(',')[0])
        } else {
          // Use coordinates as fallback
          const coords = latitude.toFixed(5) + ', ' + longitude.toFixed(5)
          setInput(coords)
          setDeliveryAddress(coords)
          toast.success('📍 Location set from GPS')
        }
        setEditing(false)
        setLocating(false)
      },
      err => {
        setLocating(false)
        if (err.code === 1) toast.error('Location permission denied — please enter address manually')
        else toast.error('Could not get location — please enter address manually')
      },
      { timeout: 10000, enableHighAccuracy: true }
    )
  }, [setDeliveryAddress])

  const handleInput = useCallback(async val => {
    setInput(val)
    clearTimeout(debounceRef.current)

    if (!val || val.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    // Instant local matches
    const ql = val.toLowerCase()
    const local = IBIZA_PLACES
      .filter(p => p.toLowerCase().includes(ql))
      .slice(0, 4)
      .map(p => ({ display: p, lat: null, lng: null, type: 'local' }))

    if (local.length > 0) {
      setSuggestions(local)
      setShowSuggestions(true)
    }

    // Real OSM map data after 350ms
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      const mapResults = await searchNominatim(val)
      
      // Merge: map results first, then local not already in results
      const seen = new Set()
      const merged = [...mapResults, ...local].filter(r => {
        const key = r.display.toLowerCase().replace(/\s+/g, '').slice(0, 25)
        if (seen.has(key)) return false
        seen.add(key)
        return true
      }).slice(0, 7)

      if (merged.length > 0) {
        setSuggestions(merged)
        setShowSuggestions(true)
      }
      setLoading(false)
    }, 350)
  }, [])

  const selectSuggestion = s => {
    setInput(s.display)
    setDeliveryAddress(s.display)
    setSuggestions([])
    setShowSuggestions(false)
    setEditing(false)
    toast.success('📍 ' + s.display.split(',')[0])
  }

  const confirmAddress = () => {
    if (!input || input.trim().length < 3) {
      toast.error('Please enter your delivery address')
      return
    }
    setDeliveryAddress(input.trim())
    setShowSuggestions(false)
    setEditing(false)
    toast.success('Delivery address set!')
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', padding: '6px 16px 8px' }}>
      {!editing ? (
        <div onClick={() => { setEditing(true); setTimeout(() => inputRef.current?.focus(), 50) }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 12px', cursor: 'pointer' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          <span style={{ fontSize: 12, color: deliveryAddress ? 'white' : 'rgba(255,255,255,0.45)', fontFamily: 'DM Sans,sans-serif', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {deliveryAddress || 'Enter delivery address'}
          </span>
          {estimatedMins && deliveryAddress && (
            <span style={{ fontSize: 11, color: '#7EE8A2', fontFamily: 'DM Sans,sans-serif', flexShrink: 0, fontWeight: 500 }}>~{estimatedMins} min</span>
          )}
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* Current location button */}
            <button onClick={useCurrentLocation} disabled={locating}
              style={{ width: 38, height: 38, background: locating ? 'rgba(43,122,139,0.3)' : 'rgba(43,122,139,0.2)', border: '0.5px solid rgba(43,122,139,0.5)', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              title="Use my current location">
              {locating
                ? <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#7ECFE0', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7ECFE0" strokeWidth="2.5"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="9" strokeDasharray="2 3"/></svg>
              }
            </button>
            {/* Text input */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '9px 12px', gap: 8, border: '1px solid rgba(255,255,255,0.35)' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              <input
                ref={inputRef}
                value={input}
                onChange={e => handleInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { if (suggestions.length > 0) selectSuggestion(suggestions[0]); else confirmAddress() }
                  if (e.key === 'Escape') { setEditing(false); setShowSuggestions(false) }
                }}
                placeholder="Hotel, villa, street, beach..."
                style={{ flex: 1, background: 'none', border: 'none', color: 'white', fontFamily: 'DM Sans,sans-serif', fontSize: 13, outline: 'none' }}
                autoComplete="off" autoCorrect="off" spellCheck={false}
              />
              {loading && <div style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: 'white', borderRadius: '50%', flexShrink: 0, animation: 'spin 0.7s linear infinite' }} />}
              {input && !loading && <button onClick={() => { setInput(''); setSuggestions([]); inputRef.current?.focus() }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 16, padding: 0, lineHeight: 1 }}>✕</button>}
            </div>
            <button onClick={confirmAddress}
              style={{ padding: '9px 14px', background: '#C4683A', border: 'none', borderRadius: 10, color: 'white', fontSize: 12, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', fontWeight: 600, whiteSpace: 'nowrap' }}>
              Set
            </button>
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4, fontFamily: 'DM Sans,sans-serif', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#7ECFE0' }}>📡</span> Real map data · Any hotel, villa or street in Ibiza
          </div>
        </div>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 16, right: 16, background: 'white', borderRadius: 12, boxShadow: '0 10px 40px rgba(0,0,0,0.2)', zIndex: 300, overflow: 'hidden', border: '0.5px solid rgba(42,35,24,0.08)', marginTop: 4 }}>
          {suggestions.map((s, i) => {
            const name = s.display.split(',')[0]
            const sub = s.display.split(',').slice(1).join(',').trim()
            const isMap = s.type !== 'local'
            return (
              <div key={i} onClick={() => selectSuggestion(s)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: i < suggestions.length - 1 ? '0.5px solid rgba(42,35,24,0.06)' : 'none', cursor: 'pointer', background: 'white', transition: 'background 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#FDF8F2'}
                onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={isMap ? '#2B7A8B' : '#C4683A'} strokeWidth="2.5" style={{ flexShrink: 0 }}>
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: '#2A2318', fontFamily: 'DM Sans,sans-serif', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                  {sub && <div style={{ fontSize: 11, color: '#7A6E60', fontFamily: 'DM Sans,sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>{sub}</div>}
                </div>
                {isMap && <span style={{ fontSize: 9, color: '#2B7A8B', fontFamily: 'DM Sans,sans-serif', flexShrink: 0, opacity: 0.7 }}>MAP</span>}
              </div>
            )
          })}
        </div>
      )}
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  )
}
