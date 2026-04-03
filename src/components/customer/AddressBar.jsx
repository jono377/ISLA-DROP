import { useState } from 'react'
import { useCartStore } from '../../lib/store'

export default function AddressBar({ estimatedMins = null }) {
  const [open, setOpen]       = useState(false)
  const [managing, setManaging] = useState(false)
  const [manual, setManual]   = useState('')
  const [loading, setLoading] = useState(false)
  const { deliveryAddress, setDeliveryLocation } = useCartStore()

  const short = deliveryAddress
    ? deliveryAddress.length > 28 ? deliveryAddress.slice(0, 28) + '…' : deliveryAddress
    : 'Set delivery address'

  const useCurrentLocation = () => {
    setLoading(true)
    navigator.geolocation?.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        try {
          const token = import.meta.env.VITE_MAPBOX_TOKEN
          const res   = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${token}&language=en`)
          const data  = await res.json()
          const addr  = data.features?.[0]?.place_name ?? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
          setDeliveryLocation(latitude, longitude, addr)
        } catch {
          setDeliveryLocation(latitude, longitude, `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)
        }
        setLoading(false)
        setOpen(false)
      },
      () => { setLoading(false); alert('Location access denied. Please type your address.') },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  const saveManual = () => {
    if (!manual.trim()) return
    setDeliveryLocation(null, null, manual.trim())
    setManual('')
    setOpen(false)
  }

  return (
    <>
      {/* Address + ETA row */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px 12px', borderTop:'0.5px solid rgba(255,255,255,0.1)' }}>
        {/* Left — address picker */}
        <button onClick={()=>setOpen(true)} style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.12)', border:'0.5px solid rgba(255,255,255,0.2)', borderRadius:20, padding:'6px 12px', cursor:'pointer', maxWidth:'60%' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <span style={{ fontSize:12, color:'white', fontFamily:'DM Sans,sans-serif', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{short}</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5"><polyline points="6,9 12,15 18,9"/></svg>
        </button>

        {/* Right — ETA */}
        {estimatedMins !== null && (
          <div style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(255,255,255,0.12)', border:'0.5px solid rgba(255,255,255,0.2)', borderRadius:20, padding:'6px 12px' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
            <span style={{ fontSize:12, color:'white', fontFamily:'DM Sans,sans-serif' }}>{estimatedMins} min</span>
          </div>
        )}
      </div>

      {/* Dropdown overlay */}
      {open && (
        <div style={{ position:'fixed', inset:0, zIndex:400, display:'flex', alignItems:'flex-end', justifyContent:'center' }} onClick={()=>setOpen(false)}>
          <div style={{ background:'#FEFCF9', borderRadius:'20px 20px 0 0', padding:'20px 20px 32px', width:'100%', maxWidth:480, boxShadow:'0 -8px 40px rgba(0,0,0,0.2)' }} onClick={e=>e.stopPropagation()}>
            <div style={{ width:36, height:4, background:'rgba(42,35,24,0.15)', borderRadius:2, margin:'0 auto 18px' }}/>
            <div style={{ fontFamily:'DM Serif Display,serif', fontSize:20, marginBottom:16 }}>Delivery address</div>

            {/* Use current location */}
            <button onClick={useCurrentLocation} disabled={loading}
              style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'14px 16px', background:'#D4EEF2', border:'none', borderRadius:12, cursor:'pointer', marginBottom:10, fontFamily:'DM Sans,sans-serif', fontSize:14, color:'#0C4450' }}>
              {loading
                ? <span style={{ width:18,height:18,border:'2px solid rgba(0,0,0,0.15)',borderTopColor:'#0C4450',borderRadius:'50%',animation:'spin 0.8s linear infinite',display:'inline-block' }}/>
                : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0C4450" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>}
              {loading ? 'Finding your location…' : 'Use current location'}
            </button>

            {/* Manual address input */}
            <div style={{ display:'flex', gap:8 }}>
              <input
                value={manual}
                onChange={e=>setManual(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&saveManual()}
                placeholder="Type address, villa or hotel…"
                style={{ flex:1, padding:'12px 14px', border:'0.5px solid rgba(42,35,24,0.18)', borderRadius:10, fontFamily:'DM Sans,sans-serif', fontSize:14, background:'#F5F0E8', color:'#2A2318', outline:'none' }}
              />
              <button onClick={saveManual} style={{ padding:'12px 16px', background:'#C4683A', color:'white', border:'none', borderRadius:10, fontFamily:'DM Sans,sans-serif', fontSize:14, fontWeight:500, cursor:'pointer' }}>Save</button>
            </div>

            {deliveryAddress && (
              <div style={{ marginTop:12, padding:'10px 14px', background:'#EAF3DE', borderRadius:10, fontSize:13, color:'#3B6D11' }}>
                ✓ Current: {deliveryAddress}
              </div>
            )}

            {/* Manage addresses link */}
            <button onClick={()=>{ setOpen(false); setManaging(true) }}
              style={{ width:'100%', marginTop:14, padding:'12px', background:'none', border:'0.5px solid rgba(42,35,24,0.15)', borderRadius:10, fontFamily:'DM Sans,sans-serif', fontSize:13, color:'#7A6E60', cursor:'pointer' }}>
              Manage saved addresses
            </button>
          </div>
        </div>
      )}

      {/* Manage addresses modal */}
      {managing && (
        <div style={{ position:'fixed', inset:0, zIndex:400, display:'flex', alignItems:'flex-end', justifyContent:'center' }} onClick={()=>setManaging(false)}>
          <div style={{ background:'#FEFCF9', borderRadius:'20px 20px 0 0', padding:'20px 20px 40px', width:'100%', maxWidth:480 }} onClick={e=>e.stopPropagation()}>
            <div style={{ width:36,height:4,background:'rgba(42,35,24,0.15)',borderRadius:2,margin:'0 auto 18px' }}/>
            <div style={{ fontFamily:'DM Serif Display,serif',fontSize:20,marginBottom:16 }}>Saved addresses</div>
            <div style={{ textAlign:'center', padding:'30px 0', color:'#7A6E60', fontSize:14 }}>
              <div style={{ fontSize:32, marginBottom:10 }}>📍</div>
              Sign in to save and manage multiple delivery addresses.
            </div>
            <button onClick={()=>setManaging(false)} style={{ width:'100%',padding:13,background:'#1A5263',color:'white',border:'none',borderRadius:12,fontFamily:'DM Sans,sans-serif',fontSize:14,cursor:'pointer' }}>Close</button>
          </div>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </>
  )
}
