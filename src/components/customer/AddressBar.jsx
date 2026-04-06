import { useState, useRef, useEffect } from 'react'
import { useCartStore } from '../../lib/store'
import toast from 'react-hot-toast'

const IBIZA_PLACES = [
  'Playa den Bossa', 'San Antonio', 'Santa Eulalia', 'Ibiza Town', 'Dalt Vila',
  'Talamanca', 'Figueretas', 'Es Canar', 'Portinatx', 'San Juan', 'San Jose',
  'Cala Vadella', 'Cala Tarida', 'Cala Bassa', 'Cala Conta', 'Cala Jondal',
  'Ses Salines', 'Las Salinas', 'Cala Llonga', 'Santa Gertrudis', 'San Rafael',
  'Marina Botafoch', 'Pacha', 'Ushuaia Hotel', 'Hard Rock Hotel', 'ME Ibiza',
  'Nobu Hotel', 'Destino Hotel', 'Pikes Hotel', 'Aguas de Ibiza', 'Hacienda Na Xamena',
]

async function getAISuggestions(input) {
  if (!input || input.length < 3) return []
  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
        'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY || '',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: 'The user is typing a delivery address in Ibiza, Spain. Input: "' + input + '"\n\nSuggest 4 specific Ibiza addresses/locations that match. Include villa areas, hotels, beaches, towns. Be specific with Ibiza locations.\n\nReturn ONLY a JSON array of strings: ["Full Address 1", "Full Address 2", "Full Address 3", "Full Address 4"]\nNo explanations, just the JSON array.'
        }]
      })
    })
    if (!resp.ok) return []
    const data = await resp.json()
    const raw = data.content?.[0]?.text || '[]'
    return JSON.parse(raw.replace(/```json|```/g, '').trim())
  } catch { return [] }
}

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

  // Close suggestions on outside click
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

  const handleInput = (val) => {
    setInput(val)
    clearTimeout(debounceRef.current)

    if (val.length < 2) { setSuggestions([]); setShowSuggestions(false); return }

    // Instant local suggestions from Ibiza places
    const local = IBIZA_PLACES.filter(p => p.toLowerCase().includes(val.toLowerCase())).slice(0, 3)
    if (local.length > 0) { setSuggestions(local); setShowSuggestions(true) }

    // AI suggestions after 600ms
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      const aiSuggestions = await getAISuggestions(val)
      if (aiSuggestions.length > 0) {
        // Merge: AI suggestions first, then any local not already covered
        const merged = [...aiSuggestions, ...local.filter(l => !aiSuggestions.some(a => a.toLowerCase().includes(l.toLowerCase())))].slice(0, 5)
        setSuggestions(merged)
        setShowSuggestions(true)
      }
      setLoading(false)
    }, 600)
  }

  const selectSuggestion = (s) => {
    setInput(s)
    setDeliveryAddress(s)
    setSuggestions([])
    setShowSuggestions(false)
    setEditing(false)
    toast.success('Address set: ' + s.split(',')[0])
  }

  const confirmAddress = () => {
    if (input.trim().length < 5) { toast.error('Please enter a more specific address'); return }
    setDeliveryAddress(input.trim())
    setShowSuggestions(false)
    setEditing(false)
    toast.success('Delivery address set!')
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', padding: '8px 16px 10px' }}>
      {!editing ? (
        <div onClick={() => { setEditing(true); setTimeout(() => inputRef.current?.focus(), 50) }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '9px 12px', cursor: 'pointer' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <span style={{ fontSize: 13, color: deliveryAddress ? 'white' : 'rgba(255,255,255,0.4)', fontFamily: 'DM Sans,sans-serif', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {deliveryAddress || 'Enter your delivery address'}
          </span>
          {estimatedMins && deliveryAddress && (
            <span style={{ fontSize: 11, color: '#7EE8A2', fontFamily: 'DM Sans,sans-serif', flexShrink: 0 }}>~{estimatedMins} min</span>
          )}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '9px 12px', gap: 8, border: '1px solid rgba(255,255,255,0.3)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <input
                ref={inputRef}
                value={input}
                onChange={e => handleInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') confirmAddress(); if (e.key === 'Escape') { setEditing(false); setShowSuggestions(false) } }}
                placeholder="Villa name, hotel, area..."
                style={{ flex: 1, background: 'none', border: 'none', color: 'white', fontFamily: 'DM Sans,sans-serif', fontSize: 13, outline: 'none' }}
                autoComplete="off"
              />
              {loading && <div style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />}
            </div>
            <button onClick={confirmAddress}
              style={{ padding: '9px 14px', background: '#C4683A', border: 'none', borderRadius: 10, color: 'white', fontSize: 12, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', fontWeight: 500, whiteSpace: 'nowrap' }}>
              Set
            </button>
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 5, fontFamily: 'DM Sans,sans-serif' }}>
            ✨ Isla can find any villa, hotel or beach in Ibiza
          </div>
        </div>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 16, right: 16, background: 'white', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.3)', zIndex: 200, overflow: 'hidden', border: '0.5px solid rgba(42,35,24,0.1)' }}>
          {suggestions.map((s, i) => (
            <div key={i} onClick={() => selectSuggestion(s)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderBottom: i < suggestions.length - 1 ? '0.5px solid rgba(42,35,24,0.07)' : 'none', cursor: 'pointer', background: 'white' }}
              onMouseEnter={e => e.currentTarget.style.background = '#F5F0E8'}
              onMouseLeave={e => e.currentTarget.style.background = 'white'}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C4683A" strokeWidth="2" style={{ flexShrink: 0 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <span style={{ fontSize: 13, color: '#2A2318', fontFamily: 'DM Sans,sans-serif' }}>{s}</span>
            </div>
          ))}
        </div>
      )}
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  )
}
