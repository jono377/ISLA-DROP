import { useState, useRef, useEffect } from 'react'
import { useCartStore } from '../../lib/store'
import toast from 'react-hot-toast'

// OpenStreetMap Nominatim - free, no API key needed, real map data
async function searchNominatim(query) {
  if (!query || query.length < 3) return []
  try {
    const encoded = encodeURIComponent(query + ' Ibiza Spain')
    const url = 'https://nominatim.openstreetmap.org/search?q=' + encoded +
      '&format=json&limit=6&countrycodes=es&viewbox=1.2,39.2,1.7,38.8&bounded=1' +
      '&addressdetails=1&accept-language=en'
    const resp = await fetch(url, {
      headers: { 'User-Agent': 'IslaDropIbiza/1.0' }
    })
    if (!resp.ok) return []
    const data = await resp.json()
    return data.map(r => {
      const a = r.address || {}
      const parts = [
        r.name && r.name !== a.road ? r.name : null,
        a.road,
        a.suburb || a.neighbourhood || a.village || a.town,
        a.city || a.county,
      ].filter(Boolean)
      const display = parts.length > 0 ? parts.join(', ') : r.display_name.split(',').slice(0,3).join(',')
      return { display, full: r.display_name, lat: parseFloat(r.lat), lng: parseFloat(r.lon) }
    }).filter(r => r.display.length > 3)
  } catch { return [] }
}

// Also search hotels/villas by name specifically
async function searchPlace(query) {
  if (!query || query.length < 2) return []
  try {
    const encoded = encodeURIComponent(query)
    const url = 'https://nominatim.openstreetmap.org/search?q=' + encoded +
      '&format=json&limit=5&viewbox=1.2,39.2,1.7,38.8&bounded=1&addressdetails=1&accept-language=en'
    const resp = await fetch(url, { headers: { 'User-Agent': 'IslaDropIbiza/1.0' } })
    if (!resp.ok) return []
    const data = await resp.json()
    return data.map(r => ({
      display: (r.name ? r.name + ', ' : '') + (r.address?.suburb || r.address?.village || r.address?.city || 'Ibiza'),
      full: r.display_name,
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
    })).filter(r => r.display.length > 3)
  } catch { return [] }
}

// Common Ibiza landmarks for instant suggestions
const QUICK_PLACES = [
  'Playa den Bossa', 'San Antonio', 'Santa Eulalia del Río', 'Ibiza Town',
  'Talamanca Beach', 'Figueretas', 'Es Canar', 'Portinatx',
  'San José', 'San Juan', 'Santa Gertrudis de Fruitera', 'San Rafael',
  'Marina Botafoch', 'Las Salinas Beach', 'Cala Jondal', 'Cala Bassa',
  'Cala Vadella', 'Cala Tarida', 'Cala Conta', 'Cala Llonga',
  'Ushuaia Beach Hotel', 'Hard Rock Hotel Ibiza', 'Nobu Hotel Ibiza Bay',
  'ME Ibiza Hotel', 'Destino Pacha Resort', 'Pikes Hotel',
  'Hacienda Na Xamena', 'Aguas de Ibiza', 'Pacha Ibiza',
]

export default function AddressBar({ estimatedMins }) {
  const { deliveryAddress, setDeliveryAddress } = useCartStore()
  const [input, setInput] = useState(deliveryAddress || '')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const debounceRef = useRef(null)
  const inputRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowSuggestions(false)
        setEditing(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleInput = async (val) => {
    setInput(val)
    clearTimeout(debounceRef.current)

    if (!val || val.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    // Instant local suggestions
    const local = QUICK_PLACES
      .filter(p => p.toLowerCase().includes(val.toLowerCase()))
      .slice(0, 3)
      .map(p => ({ display: p, full: p + ', Ibiza, Spain', lat: null, lng: null }))

    if (local.length > 0) {
      setSuggestions(local)
      setShowSuggestions(true)
    }

    // Real map data from OpenStreetMap after 400ms
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      const [mapResults, placeResults] = await Promise.all([
        searchNominatim(val),
        searchPlace(val),
      ])

      // Merge, deduplicate, prefer map results
      const seen = new Set()
      const merged = [...mapResults, ...placeResults, ...local].filter(r => {
        const key = r.display.toLowerCase().slice(0, 20)
        if (seen.has(key)) return false
        seen.add(key)
        return true
      }).slice(0, 6)

      if (merged.length > 0) {
        setSuggestions(merged)
        setShowSuggestions(true)
      }
      setLoading(false)
    }, 400)
  }

  const selectSuggestion = (s) => {
    const addr = s.display
    setInput(addr)
    setDeliveryAddress(addr)
    setSuggestions([])
    setShowSuggestions(false)
    setEditing(false)
    toast.success('📍 ' + addr.split(',')[0])
  }

  const confirmAddress = () => {
    if (!input || input.trim().length < 4) {
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
            <span style={{ fontSize: 11, color: '#7EE8A2', fontFamily: 'DM Sans,sans-serif', flexShrink: 0, fontWeight: 500 }}>
              ~{estimatedMins} min
            </span>
          )}
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '9px 12px', gap: 8, border: '1px solid rgba(255,255,255,0.35)' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5">
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
                placeholder="Hotel name, villa, street, beach..."
                style={{ flex: 1, background: 'none', border: 'none', color: 'white', fontFamily: 'DM Sans,sans-serif', fontSize: 13, outline: 'none' }}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />
              {loading && (
                <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: 'white', borderRadius: '50%', flexShrink: 0, animation: 'spin 0.7s linear infinite' }} />
              )}
            </div>
            <button onClick={confirmAddress}
              style={{ padding: '9px 14px', background: '#C4683A', border: 'none', borderRadius: 10, color: 'white', fontSize: 12, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', fontWeight: 600, whiteSpace: 'nowrap' }}>
              Set
            </button>
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4, fontFamily: 'DM Sans,sans-serif' }}>
            📍 Searching real map data — type any hotel, villa or street in Ibiza
          </div>
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 16, right: 16, background: 'white', borderRadius: 12, boxShadow: '0 10px 40px rgba(0,0,0,0.25)', zIndex: 300, overflow: 'hidden', border: '0.5px solid rgba(42,35,24,0.08)', marginTop: 4 }}>
          {suggestions.map((s, i) => (
            <div key={i} onClick={() => selectSuggestion(s)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderBottom: i < suggestions.length - 1 ? '0.5px solid rgba(42,35,24,0.06)' : 'none', cursor: 'pointer', transition: 'background 0.1s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#FDF8F2'}
              onMouseLeave={e => e.currentTarget.style.background = 'white'}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C4683A" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: '#2A2318', fontFamily: 'DM Sans,sans-serif', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.display.split(',')[0]}
                </div>
                {s.display.includes(',') && (
                  <div style={{ fontSize: 11, color: '#7A6E60', fontFamily: 'DM Sans,sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
                    {s.display.split(',').slice(1).join(',').trim()}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  )
}
