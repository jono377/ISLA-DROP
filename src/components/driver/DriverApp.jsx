import { useState, useEffect, useCallback, useRef } from 'react'
import toast from 'react-hot-toast'
import {
  getAvailableOrders, acceptOrder, updateOrderStatus,
  updateDriverLocation, setDriverOnlineStatus,
  subscribeToAvailableOrders
} from '../../lib/supabase'
import { useAuthStore, useDriverStore } from '../../lib/store'
import { useLeafletMap, PIN_ICON, SCOOTER_ICON } from '../../lib/useLeafletMap'

// ── Constants ─────────────────────────────────────────────────
const C = {
  bg: '#0A1628', card: 'rgba(255,255,255,0.06)', card2: 'rgba(255,255,255,0.10)',
  border: 'rgba(255,255,255,0.10)', accent: '#FF6B35', green: '#00E676',
  blue: '#00B4D8', yellow: '#FFD60A', red: '#FF4757', purple: '#A855F7',
  orange: '#FF9500', teal: '#00CEC9',
  text: 'white', muted: 'rgba(255,255,255,0.45)', dim: 'rgba(255,255,255,0.20)',
}

const WAREHOUSE = [38.9090, 1.4340]

const STATUS_CONFIG = {
  assigned:            { label: 'Head to warehouse',    color: C.blue,   step: 0, next: 'warehouse_confirmed', nextLabel: '✅ Picked up', icon: '🏪' },
  warehouse_confirmed: { label: 'Head to customer',     color: C.yellow, step: 1, next: 'en_route',           nextLabel: '🛵 On my way', icon: '🛵' },
  en_route:            { label: 'Arriving at customer', color: C.green,  step: 2, next: null,                 nextLabel: null,           icon: '📍' },
  delivered:           { label: 'Delivered ✓',          color: C.green,  step: 3, next: null,                 nextLabel: null,           icon: '✓'  },
}

const STEPS = ['assigned', 'warehouse_confirmed', 'en_route', 'delivered']
const STEP_LABELS = ['Warehouse', 'Collected', 'En Route', 'Delivered']

const ISSUE_TYPES = [
  { id: 'not_home',      label: 'Customer not home',     icon: '🚪' },
  { id: 'wrong_address', label: 'Wrong address',          icon: '📍' },
  { id: 'damaged_item',  label: 'Item damaged',           icon: '📦' },
  { id: 'access',        label: 'Cannot access building', icon: '🔒' },
  { id: 'refused',       label: 'Customer refused order', icon: '🚫' },
  { id: 'other',         label: 'Other issue',            icon: '⚠️' },
]

const QUICK_REPLIES = [
  'On my way 🛵', 'Outside your building 📍', "Can't find parking — 2 mins 🙏",
  'At the door 🚪', 'Looking for you — can you come down?', 'Delivered to reception ✓',
]

const BADGES = [
  { id: 'first',    icon: '🌟', label: 'First Delivery',    desc: 'Complete your first delivery',   req: d => d >= 1 },
  { id: 'ten',      icon: '🔟', label: '10 Deliveries',      desc: '10 deliveries completed',        req: d => d >= 10 },
  { id: 'fifty',    icon: '💪', label: '50 Club',             desc: '50 deliveries completed',        req: d => d >= 50 },
  { id: 'hundred',  icon: '💯', label: 'Century',             desc: '100 deliveries completed',       req: d => d >= 100 },
  { id: 'speedy',   icon: '⚡', label: 'Speed Demon',         desc: 'Avg delivery under 20 mins',     req: () => false },
  { id: 'star',     icon: '⭐', label: 'Five Star',           desc: 'Maintain 5.0 rating for a week', req: r => r >= 5.0 },
  { id: 'streak3',  icon: '🔥', label: '3-Day Streak',       desc: '3 consecutive days worked',      req: () => false },
  { id: 'earner',   icon: '💰', label: 'Top Earner',         desc: 'Earn €100+ in a day',            req: () => false },
]

const PEAK_HOURS = [
  { hour:'18', label:'6pm', h:40 }, { hour:'19', label:'7pm', h:55 },
  { hour:'20', label:'8pm', h:75 }, { hour:'21', label:'9pm', h:90 },
  { hour:'22', label:'10pm', h:100 },{ hour:'23', label:'11pm', h:95 },
  { hour:'00', label:'12am', h:85 }, { hour:'01', label:'1am', h:70 },
  { hour:'02', label:'2am', h:80 },  { hour:'03', label:'3am', h:65 },
  { hour:'04', label:'4am', h:40 },  { hour:'05', label:'5am', h:20 },
]

// ── Helpers ───────────────────────────────────────────────────
function formatDuration(secs) {
  const h = String(Math.floor(secs / 3600)).padStart(2,'0')
  const m = String(Math.floor((secs % 3600) / 60)).padStart(2,'0')
  const s = String(secs % 60).padStart(2,'0')
  return h + ':' + m + ':' + s
}

function orderItems(order) {
  if (!order.order_items?.length) return 'No items'
  const items = order.order_items.slice(0,4).map(i => (i.quantity||1) + 'x ' + (i.product?.name || i.products?.name || 'Item'))
  const extra = order.order_items.length > 4 ? ' +' + (order.order_items.length-4) + ' more' : ''
  return items.join(' · ') + extra
}

// ── Btn helper ────────────────────────────────────────────────
function Btn({ onClick, children, color, disabled, style = {} }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ padding:'13px', background: disabled ? 'rgba(255,255,255,0.06)' : (color || C.accent), border:'none', borderRadius:12, color: disabled ? C.muted : (color === C.green || color === C.yellow ? '#0A1628' : 'white'), fontSize:13, fontWeight:700, cursor: disabled ? 'default' : 'pointer', width:'100%', fontFamily:'DM Sans,sans-serif', opacity: disabled ? 0.6 : 1, ...style }}>
      {children}
    </button>
  )
}

// ── Delivery Map with routing ─────────────────────────────────
function DeliveryMap({ order, driverPos, onClose }) {
  const containerRef = useRef(null)
  const { mapRef, setMarker, fitBounds, flyTo } = useLeafletMap(containerRef, {
    center: order?.delivery_lat ? [order.delivery_lat, order.delivery_lng] : WAREHOUSE,
    zoom: 14, darkStyle: true,
  })
  const routeLayerRef = useRef(null)

  // Draw route using OSRM free routing API
  const drawRoute = useCallback(async (from, to) => {
    if (!mapRef.current || !from || !to) return
    try {
      const url = 'https://router.project-osrm.org/route/v1/driving/' + from[1] + ',' + from[0] + ';' + to[1] + ',' + to[0] + '?overview=full&geometries=geojson'
      const resp = await fetch(url)
      const data = await resp.json()
      if (data.routes?.[0]) {
        const L = mapRef.current._L
        if (!L) return
        if (routeLayerRef.current) { routeLayerRef.current.remove(); routeLayerRef.current = null }
        const coords = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng])
        routeLayerRef.current = L.polyline(coords, { color: C.accent, weight: 4, opacity: 0.8, dashArray: null })
        routeLayerRef.current.addTo(mapRef.current)
        const dist = (data.routes[0].distance / 1000).toFixed(1)
        const mins = Math.ceil(data.routes[0].duration / 60)
        toast(dist + ' km · ~' + mins + ' min', { icon: '🗺', duration: 3000 })
      }
    } catch {}
  }, [mapRef])

  useEffect(() => {
    const t = setInterval(() => {
      if (!mapRef.current) return
      clearInterval(t)
      setMarker('warehouse', WAREHOUSE[0], WAREHOUSE[1],
        '<div style="font-size:26px;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.6))">🏪</div>',
        '<b>Warehouse</b>')
      if (order?.delivery_lat) {
        setMarker('dest', order.delivery_lat, order.delivery_lng, PIN_ICON(C.accent),
          '<b>Drop-off</b><br>' + (order.delivery_address||'') + (order.what3words ? '<br>/// '+order.what3words : ''))
      }
      if (driverPos) {
        setMarker('driver', driverPos[0], driverPos[1],
          '<div style="font-size:30px;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.5))">🛵</div>', '<b>You</b>')
        if (order?.delivery_lat) {
          fitBounds([[driverPos[0], driverPos[1]], [order.delivery_lat, order.delivery_lng]])
          drawRoute(driverPos, [order.delivery_lat, order.delivery_lng])
        }
      }
    }, 600)
    return () => { clearInterval(t); routeLayerRef.current?.remove() }
  }, [order, driverPos])

  const openNav = () => {
    if (!order?.delivery_lat) return
    const dest = order.delivery_lat + ',' + order.delivery_lng
    if (/iPhone|iPad/i.test(navigator.userAgent)) window.open('maps://maps.apple.com/?daddr=' + dest)
    else window.open('https://www.google.com/maps/dir/?api=1&destination=' + dest + '&travelmode=driving')
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:500, background:C.bg, display:'flex', flexDirection:'column' }}>
      <div style={{ background:'rgba(10,22,40,0.97)', padding:'14px 16px', display:'flex', alignItems:'center', gap:10, borderBottom:'0.5px solid rgba(255,255,255,0.08)' }}>
        <button onClick={onClose} style={{ background:C.card2, border:'none', borderRadius:10, width:38, height:38, color:'white', fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>←</button>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:14, fontWeight:700, color:'white' }}>Order #{order?.order_number}</div>
          <div style={{ fontSize:11, color:C.muted, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>📍 {order?.delivery_address || 'Address not set'}</div>
        </div>
        <button onClick={openNav} style={{ background:C.accent, border:'none', borderRadius:10, padding:'9px 14px', color:'white', fontSize:12, fontWeight:700, cursor:'pointer' }}>🗺 Navigate</button>
      </div>
      <div ref={containerRef} style={{ flex:1 }} />
      <div style={{ background:'rgba(10,22,40,0.97)', padding:'12px 16px', borderTop:'0.5px solid rgba(255,255,255,0.08)' }}>
        {order?.what3words && <div style={{ fontSize:13, color:C.green, marginBottom:4 }}>/// {order.what3words}</div>}
        {order?.delivery_notes && <div style={{ fontSize:12, color:C.yellow, marginBottom:8 }}>📝 {order.delivery_notes}</div>}
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => order?.customer_phone && window.open('tel:'+order.customer_phone)} style={{ flex:1, padding:'10px', background:'rgba(0,230,118,0.1)', border:'0.5px solid rgba(0,230,118,0.3)', borderRadius:10, color:C.green, fontSize:13, fontWeight:600, cursor:'pointer' }}>📞 Call</button>
          <button onClick={() => { const p = (order?.customer_phone||'').replace(/\D/g,''); p && window.open('https://wa.me/'+p) }} style={{ flex:1, padding:'10px', background:'rgba(0,230,118,0.1)', border:'0.5px solid rgba(0,230,118,0.3)', borderRadius:10, color:C.green, fontSize:13, fontWeight:600, cursor:'pointer' }}>💬 WhatsApp</button>
          <button onClick={onClose} style={{ flex:1, padding:'10px', background:C.card2, border:'0.5px solid '+C.border, borderRadius:10, color:'white', fontSize:13, cursor:'pointer' }}>← Back</button>
        </div>
      </div>
    </div>
  )
}

// ── In-app Customer Chat ──────────────────────────────────────
function CustomerChat({ order, driverId, onClose }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    const load = async () => {
      try {
        const { supabase } = await import('../../lib/supabase')
        const { data } = await supabase.from('order_messages').select('*').eq('order_id', order.id).order('created_at')
        if (data) setMessages(data)
      } catch {}
    }
    load()
    let sub
    const setup = async () => {
      const { supabase } = await import('../../lib/supabase')
      sub = supabase.channel('chat-'+order.id)
        .on('postgres_changes', { event:'INSERT', schema:'public', table:'order_messages', filter:'order_id=eq.'+order.id },
          payload => setMessages(prev => [...prev, payload.new]))
        .subscribe()
    }
    setup()
    return () => { sub?.unsubscribe?.() }
  }, [order.id])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }) }, [messages])

  const send = async (msg) => {
    const content = msg || text.trim()
    if (!content) return
    setSending(true)
    setText('')
    try {
      const { supabase } = await import('../../lib/supabase')
      await supabase.from('order_messages').insert({ order_id: order.id, sender_id: driverId, sender_role: 'driver', content })
    } catch { toast.error('Message failed') }
    setSending(false)
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:550, background:C.bg, display:'flex', flexDirection:'column' }}>
      <div style={{ background:'rgba(10,22,40,0.97)', padding:'14px 16px', display:'flex', alignItems:'center', gap:12, borderBottom:'0.5px solid rgba(255,255,255,0.08)' }}>
        <button onClick={onClose} style={{ background:C.card2, border:'none', borderRadius:10, width:38, height:38, color:'white', fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>←</button>
        <div>
          <div style={{ fontSize:14, fontWeight:700, color:'white' }}>Customer · Order #{order.order_number}</div>
          <div style={{ fontSize:11, color:C.green }}>● Connected</div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex:1, overflowY:'auto', padding:'16px', display:'flex', flexDirection:'column', gap:8 }}>
        {messages.length === 0 && (
          <div style={{ textAlign:'center', padding:'32px 0', color:C.muted, fontSize:13 }}>
            <div style={{ fontSize:32, marginBottom:8 }}>💬</div>
            Send a message to the customer
          </div>
        )}
        {messages.map((msg, i) => {
          const isDriver = msg.sender_role === 'driver'
          return (
            <div key={i} style={{ display:'flex', justifyContent: isDriver ? 'flex-end' : 'flex-start' }}>
              <div style={{ maxWidth:'75%', background: isDriver ? 'rgba(255,107,53,0.2)' : C.card2, border:'0.5px solid '+(isDriver ? 'rgba(255,107,53,0.3)' : C.border), borderRadius: isDriver ? '16px 16px 4px 16px' : '16px 16px 16px 4px', padding:'10px 14px' }}>
                <div style={{ fontSize:13, color:'white' }}>{msg.content}</div>
                <div style={{ fontSize:10, color:C.muted, marginTop:4, textAlign:'right' }}>
                  {new Date(msg.created_at).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Quick replies */}
      <div style={{ padding:'8px 16px', overflowX:'auto', whiteSpace:'nowrap', borderTop:'0.5px solid rgba(255,255,255,0.06)' }}>
        {QUICK_REPLIES.map((qr, i) => (
          <button key={i} onClick={() => send(qr)}
            style={{ display:'inline-block', marginRight:8, padding:'7px 12px', background:C.card2, border:'0.5px solid '+C.border, borderRadius:20, color:C.muted, fontSize:12, cursor:'pointer', whiteSpace:'nowrap', fontFamily:'DM Sans,sans-serif' }}>
            {qr}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{ padding:'12px 16px', display:'flex', gap:10, background:'rgba(10,22,40,0.97)', borderTop:'0.5px solid rgba(255,255,255,0.08)', paddingBottom:'calc(12px + env(safe-area-inset-bottom))' }}>
        <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key==='Enter' && send()}
          placeholder="Message customer..." maxLength={200}
          style={{ flex:1, padding:'12px 14px', background:C.card2, border:'0.5px solid '+C.border, borderRadius:12, color:'white', fontSize:14, outline:'none', fontFamily:'DM Sans,sans-serif' }} />
        <button onClick={() => send()} disabled={!text.trim() || sending}
          style={{ width:44, height:44, background: text.trim() ? C.accent : C.card2, border:'none', borderRadius:12, color:'white', fontSize:20, cursor: text.trim() ? 'pointer' : 'default', display:'flex', alignItems:'center', justifyContent:'center' }}>
          ➤
        </button>
      </div>
    </div>
  )
}

// ── Photo Proof of Delivery ───────────────────────────────────
function PhotoCapture({ order, onDone, onSkip }) {
  const [photo, setPhoto] = useState(null)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef(null)

  const upload = async () => {
    if (!photo) return
    setUploading(true)
    try {
      const { supabase } = await import('../../lib/supabase')
      const blob = await (await fetch(photo)).blob()
      const path = 'deliveries/' + order.id + '_' + Date.now() + '.jpg'
      await supabase.storage.from('delivery-photos').upload(path, blob, { upsert: true })
      await supabase.from('orders').update({ proof_of_delivery: path }).eq('id', order.id)
      toast.success('Photo saved 📸')
    } catch {}
    setUploading(false)
    onDone()
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:650, background:'rgba(0,0,0,0.95)', display:'flex', alignItems:'flex-end' }}>
      <div style={{ width:'100%', background:'linear-gradient(180deg,#0D2137,#0A1628)', borderRadius:'24px 24px 0 0', padding:'20px 20px 44px', borderTop:'0.5px solid rgba(255,255,255,0.12)' }}>
        <div style={{ width:40, height:4, background:'rgba(255,255,255,0.15)', borderRadius:2, margin:'0 auto 20px' }} />
        <div style={{ textAlign:'center', marginBottom:20 }}>
          <div style={{ fontSize:36, marginBottom:8 }}>📸</div>
          <div style={{ fontFamily:'DM Serif Display,serif', fontSize:22, color:'white', marginBottom:4 }}>Proof of Delivery</div>
          <div style={{ fontSize:13, color:C.muted }}>Take a photo of the delivered order</div>
        </div>
        {photo ? (
          <div style={{ marginBottom:16 }}>
            <img src={photo} alt="proof" style={{ width:'100%', borderRadius:14, maxHeight:220, objectFit:'cover' }} />
            <button onClick={() => setPhoto(null)} style={{ marginTop:8, background:'none', border:'none', color:C.muted, fontSize:13, cursor:'pointer', width:'100%' }}>Retake photo</button>
          </div>
        ) : (
          <button onClick={() => inputRef.current?.click()} style={{ width:'100%', padding:'20px', background:'rgba(255,107,53,0.08)', border:'1.5px dashed rgba(255,107,53,0.4)', borderRadius:16, color:C.accent, fontSize:15, fontWeight:600, cursor:'pointer', marginBottom:16 }}>
            📷 Open camera
          </button>
        )}
        <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => setPhoto(r.result); r.readAsDataURL(f) } }} style={{ display:'none' }} />
        {photo && <Btn onClick={upload} disabled={uploading} color={C.green} style={{ marginBottom:10 }}>{uploading ? 'Uploading...' : '✓ Save & Complete'}</Btn>}
        <button onClick={onSkip} style={{ width:'100%', padding:'12px', background:'none', border:'none', color:C.muted, fontSize:13, cursor:'pointer' }}>Skip (no photo)</button>
      </div>
    </div>
  )
}

// ── PIN Entry ─────────────────────────────────────────────────
function PinEntry({ order, onSuccess, onCancel }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPhoto, setShowPhoto] = useState(false)

  const verify = async () => {
    if (pin.length < 4) { setError('Enter the 4-digit PIN'); return }
    setLoading(true)
    try {
      if (pin !== String(order.delivery_pin)) { setError('Incorrect PIN — ask the customer again'); setLoading(false); return }
      await updateOrderStatus(order.id, 'delivered', { delivered_at: new Date().toISOString() })
      setShowPhoto(true)
    } catch { setError('Verification failed — try again') }
    setLoading(false)
  }

  if (showPhoto) return (
    <PhotoCapture order={order}
      onDone={() => { toast.success('Delivery complete! Great work 🎉', { duration:4000 }); onSuccess() }}
      onSkip={() => { toast.success('Delivered! 🎉', { duration:4000 }); onSuccess() }} />
  )

  return (
    <div style={{ position:'fixed', inset:0, zIndex:600, background:'rgba(0,0,0,0.9)', display:'flex', alignItems:'flex-end' }}>
      <div style={{ width:'100%', background:'linear-gradient(180deg,#0D2137,#0A1628)', borderRadius:'24px 24px 0 0', padding:'20px 20px 44px', borderTop:'0.5px solid rgba(255,255,255,0.12)' }}>
        <div style={{ width:40, height:4, background:'rgba(255,255,255,0.15)', borderRadius:2, margin:'0 auto 20px' }} />
        <div style={{ textAlign:'center', marginBottom:20 }}>
          <div style={{ fontSize:40, marginBottom:8 }}>🔐</div>
          <div style={{ fontFamily:'DM Serif Display,serif', fontSize:24, color:'white', marginBottom:4 }}>Delivery PIN</div>
          <div style={{ fontSize:13, color:C.muted }}>Ask the customer for their 4-digit code</div>
        </div>
        <div style={{ display:'flex', gap:12, justifyContent:'center', marginBottom:20 }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ width:56, height:64, background: pin[i] ? 'rgba(255,107,53,0.15)' : C.card, borderRadius:14, border:'1.5px solid '+(pin[i] ? C.accent : C.border), display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, color:'white', transition:'all 0.15s' }}>
              {pin[i] ? '●' : ''}
            </div>
          ))}
        </div>
        {error && <div style={{ background:'rgba(255,71,87,0.12)', border:'0.5px solid rgba(255,71,87,0.3)', borderRadius:10, padding:'10px', textAlign:'center', color:'#FF6B6B', fontSize:13, marginBottom:14 }}>{error}</div>}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:16 }}>
          {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((d, i) => (
            <button key={i} onClick={() => { setError(''); if (d==='⌫') setPin(p=>p.slice(0,-1)); else if (d!=='' && pin.length<4) setPin(p=>p+String(d)) }}
              style={{ padding:'18px', background: d==='⌫' ? 'rgba(255,107,53,0.1)' : C.card2, border:'0.5px solid '+C.border, borderRadius:14, fontSize:22, fontWeight:600, color: d==='' ? 'transparent' : 'white', cursor: d==='' ? 'default' : 'pointer' }}>
              {d}
            </button>
          ))}
        </div>
        <Btn onClick={verify} disabled={pin.length < 4 || loading} color={pin.length===4 ? C.green : undefined} style={{ marginBottom:10 }}>
          {loading ? '⏳ Verifying...' : '✓ Confirm Delivery'}
        </Btn>
        <button onClick={onCancel} style={{ width:'100%', padding:'12px', background:'none', border:'none', color:C.muted, fontSize:14, cursor:'pointer' }}>Cancel</button>
      </div>
    </div>
  )
}

// ── Issue Report ──────────────────────────────────────────────
function IssueReport({ order, onClose }) {
  const [type, setType] = useState(null)
  const [notes, setNotes] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!type) { toast.error('Select an issue type'); return }
    setLoading(true)
    try {
      const { supabase } = await import('../../lib/supabase')
      const { useAuthStore } = await import('../../lib/store')
      const user = useAuthStore.getState().user
      await supabase.from('support_tickets').insert({
        user_id: user?.id, order_id: order?.id,
        subject: 'Driver issue: ' + type,
        message: (ISSUE_TYPES.find(i=>i.id===type)?.label||type) + (notes ? '\n\nNotes: '+notes : ''),
        status: 'open', priority: 'high',
      })
      setSubmitted(true)
    } catch { toast.error('Could not submit — call dispatch') }
    setLoading(false)
  }

  if (submitted) return (
    <div style={{ position:'fixed', inset:0, zIndex:620, background:'rgba(0,0,0,0.9)', display:'flex', alignItems:'flex-end' }}>
      <div style={{ width:'100%', background:'linear-gradient(180deg,#0D2137,#0A1628)', borderRadius:'24px 24px 0 0', padding:'32px 20px 48px', textAlign:'center', borderTop:'0.5px solid rgba(255,255,255,0.12)' }}>
        <div style={{ fontSize:52, marginBottom:12 }}>✅</div>
        <div style={{ fontFamily:'DM Serif Display,serif', fontSize:22, color:'white', marginBottom:8 }}>Issue Reported</div>
        <div style={{ fontSize:14, color:C.muted, marginBottom:28 }}>Ops team has been notified and will respond shortly.</div>
        <Btn onClick={onClose} color={C.accent}>Back to delivery</Btn>
      </div>
    </div>
  )

  return (
    <div style={{ position:'fixed', inset:0, zIndex:620, background:'rgba(0,0,0,0.9)', display:'flex', alignItems:'flex-end' }}>
      <div style={{ width:'100%', background:'linear-gradient(180deg,#0D2137,#0A1628)', borderRadius:'24px 24px 0 0', padding:'20px 20px 44px', borderTop:'0.5px solid rgba(255,71,87,0.4)', maxHeight:'85vh', overflowY:'auto' }}>
        <div style={{ width:40, height:4, background:'rgba(255,255,255,0.15)', borderRadius:2, margin:'0 auto 16px' }} />
        <div style={{ fontSize:13, fontWeight:700, color:C.red, textTransform:'uppercase', letterSpacing:'1px', marginBottom:6 }}>⚠️ Report Issue</div>
        <div style={{ fontFamily:'DM Serif Display,serif', fontSize:20, color:'white', marginBottom:16 }}>What is the problem?</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
          {ISSUE_TYPES.map(it => (
            <button key={it.id} onClick={() => setType(it.id)}
              style={{ padding:'12px 10px', background: type===it.id ? 'rgba(255,71,87,0.15)' : C.card, border:'0.5px solid '+(type===it.id ? C.red : C.border), borderRadius:12, cursor:'pointer', textAlign:'left' }}>
              <div style={{ fontSize:20, marginBottom:4 }}>{it.icon}</div>
              <div style={{ fontSize:12, color: type===it.id ? '#FF8A97' : 'rgba(255,255,255,0.7)', fontWeight:500 }}>{it.label}</div>
            </button>
          ))}
        </div>
        <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Additional notes (optional)..." rows={3}
          style={{ width:'100%', padding:'12px', background:C.card, border:'0.5px solid '+C.border, borderRadius:12, color:'white', fontSize:13, resize:'none', outline:'none', boxSizing:'border-box', marginBottom:14, fontFamily:'DM Sans,sans-serif' }} />
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:'14px', background:C.card2, border:'0.5px solid '+C.border, borderRadius:12, color:C.muted, fontSize:14, cursor:'pointer' }}>Cancel</button>
          <button onClick={submit} disabled={!type||loading} style={{ flex:2, padding:'14px', background: type ? C.red : 'rgba(255,255,255,0.08)', border:'none', borderRadius:12, color: type ? 'white' : C.muted, fontSize:14, fontWeight:700, cursor: type ? 'pointer' : 'default' }}>
            {loading ? 'Submitting...' : '📤 Report to Ops'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── SOS ───────────────────────────────────────────────────────
function SosPanel({ driverPos, onClose }) {
  const [sent, setSent] = useState(false)
  const sendSOS = async () => {
    try {
      const { supabase } = await import('../../lib/supabase')
      const { useAuthStore } = await import('../../lib/store')
      const user = useAuthStore.getState().user
      const loc = driverPos ? 'https://maps.google.com/?q='+driverPos[0]+','+driverPos[1] : 'Location unknown'
      await supabase.from('support_tickets').insert({
        user_id: user?.id, subject:'🚨 SOS — Driver Emergency',
        message:'Driver triggered SOS.\nLocation: '+loc, status:'open', priority:'urgent',
      })
      if (navigator.vibrate) navigator.vibrate([500,200,500,200,500])
      setSent(true)
    } catch { toast.error('SOS failed — call +34 971 000 000') }
  }
  return (
    <div style={{ position:'fixed', inset:0, zIndex:800, background:'rgba(0,0,0,0.95)', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ width:'100%', maxWidth:360, textAlign:'center' }}>
        {sent ? (
          <>
            <div style={{ fontSize:64, marginBottom:16 }}>🚨</div>
            <div style={{ fontFamily:'DM Serif Display,serif', fontSize:26, color:C.red, marginBottom:8 }}>SOS Sent!</div>
            <div style={{ fontSize:14, color:C.muted, marginBottom:8 }}>Ops team alerted with your location.</div>
            <div style={{ fontSize:18, fontWeight:700, color:'white', marginBottom:28 }}>📞 +34 971 000 000</div>
            <Btn onClick={onClose} color={C.card2}>Close</Btn>
          </>
        ) : (
          <>
            <div style={{ fontSize:64, marginBottom:16 }}>🆘</div>
            <div style={{ fontFamily:'DM Serif Display,serif', fontSize:26, color:'white', marginBottom:8 }}>Emergency SOS</div>
            <div style={{ fontSize:14, color:C.muted, marginBottom:12 }}>Alerts ops team with your GPS location.</div>
            <div style={{ fontSize:13, color:C.yellow, background:'rgba(255,214,10,0.08)', border:'0.5px solid rgba(255,214,10,0.2)', borderRadius:10, padding:'10px', marginBottom:28 }}>Only use in a genuine emergency</div>
            <button onClick={sendSOS} style={{ width:'100%', padding:'18px', background:C.red, border:'none', borderRadius:16, color:'white', fontSize:18, fontWeight:800, cursor:'pointer', marginBottom:12, boxShadow:'0 0 32px rgba(255,71,87,0.4)' }}>🚨 Send SOS Alert</button>
            <button onClick={onClose} style={{ width:'100%', padding:'14px', background:'none', border:'none', color:C.muted, fontSize:14, cursor:'pointer' }}>Cancel</button>
          </>
        )}
      </div>
    </div>
  )
}

// ── New Order Alert ───────────────────────────────────────────
function NewOrderAlert({ order, onAccept, onDecline, loading }) {
  const [countdown, setCountdown] = useState(30)
  useEffect(() => {
    const t = setInterval(() => setCountdown(c => { if (c<=1) { onDecline(); return 0 } return c-1 }), 1000)
    return () => clearInterval(t)
  }, [])
  const dist = order.distance_km ? order.distance_km.toFixed(1)+' km' : '~2 km'
  return (
    <div style={{ position:'fixed', inset:0, zIndex:700, background:'rgba(0,0,0,0.92)', display:'flex', alignItems:'flex-end' }}>
      <div style={{ width:'100%', background:'linear-gradient(180deg,#0D2137,#0A1628)', borderRadius:'24px 24px 0 0', padding:'24px 20px 44px', borderTop:'2px solid '+C.green }}>
        <div style={{ display:'flex', justifyContent:'center', marginBottom:16 }}>
          <div style={{ width:64, height:64, borderRadius:'50%', background: countdown>10 ? 'rgba(0,230,118,0.12)' : 'rgba(255,71,87,0.12)', border:'2px solid '+(countdown>10 ? C.green : C.red), display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, fontWeight:800, color: countdown>10 ? C.green : C.red }}>
            {countdown}
          </div>
        </div>
        <div style={{ textAlign:'center', marginBottom:20 }}>
          <div style={{ fontSize:12, color:C.green, fontWeight:700, textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:6 }}>🔔 New Order</div>
          <div style={{ fontFamily:'DM Serif Display,serif', fontSize:26, color:'white' }}>#{order.order_number}</div>
        </div>
        <div style={{ background:C.card, borderRadius:16, padding:'14px', marginBottom:20, border:'0.5px solid '+C.border }}>
          <div style={{ display:'flex', justifyContent:'space-around', marginBottom:14, paddingBottom:14, borderBottom:'0.5px solid '+C.border }}>
            {[
              { val:'€'+(order.delivery_fee||3.50).toFixed(2), label:'Earnings', color:C.green },
              { val:dist, label:'Distance', color:C.blue },
              { val:order.order_items?.length||'?', label:'Items', color:C.yellow },
            ].map(s => (
              <div key={s.label} style={{ textAlign:'center' }}>
                <div style={{ fontSize:22, fontWeight:800, color:s.color }}>{s.val}</div>
                <div style={{ fontSize:10, color:C.muted, textTransform:'uppercase', marginTop:2 }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,0.75)', marginBottom:4, display:'flex', gap:6 }}>
            <span>📍</span><span>{order.delivery_address||'Address pending'}</span>
          </div>
          {order.what3words && <div style={{ fontSize:12, color:C.green, marginTop:4 }}>/// {order.what3words}</div>}
          {order.delivery_notes && <div style={{ fontSize:12, color:C.yellow, marginTop:6 }}>📝 {order.delivery_notes}</div>}
        </div>
        <div style={{ display:'flex', gap:12 }}>
          <button onClick={onDecline} style={{ flex:1, padding:'16px', background:'rgba(255,71,87,0.1)', border:'1.5px solid rgba(255,71,87,0.4)', borderRadius:14, color:C.red, fontSize:16, fontWeight:700, cursor:'pointer' }}>✕ Decline</button>
          <button onClick={() => onAccept(order)} disabled={loading} style={{ flex:2, padding:'16px', background:C.green, border:'none', borderRadius:14, color:'#0A1628', fontSize:16, fontWeight:800, cursor:'pointer' }}>
            {loading ? '⏳ Accepting...' : '✓ Accept'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Earnings Tab ──────────────────────────────────────────────
function EarningsTab({ stats }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('today')
  const [goal, setGoal] = useState(100)
  const todayEarnings = stats?.earnings || 0
  const goalPct = Math.min(100, (todayEarnings / goal) * 100)
  const currentHour = new Date().getHours()

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const { supabase } = await import('../../lib/supabase')
        const { useAuthStore } = await import('../../lib/store')
        const user = useAuthStore.getState().user
        if (!user) return
        const from = new Date()
        if (period==='today') from.setHours(0,0,0,0)
        else if (period==='week') from.setDate(from.getDate()-7)
        else from.setDate(1)
        const { data } = await supabase.from('driver_earnings').select('*').eq('driver_id', user.id).gte('created_at', from.toISOString()).order('created_at', { ascending:false })
        if (data) setHistory(data)
      } catch {}
      setLoading(false)
    }
    load()
  }, [period])

  const total = history.reduce((s,e) => s+(e.amount||0), 0)

  return (
    <div style={{ padding:'16px', paddingBottom:100 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10, marginBottom:16 }}>
        {[
          { label:"Today's earnings", value:'€'+todayEarnings.toFixed(2), color:C.green, icon:'💰' },
          { label:'Deliveries today', value:stats?.deliveries||0, color:C.blue, icon:'📦' },
          { label:'Period total', value:'€'+total.toFixed(2), color:C.yellow, icon:'📊' },
          { label:'Rating', value:(stats?.rating||5.0).toFixed(1)+'★', color:C.accent, icon:'⭐' },
        ].map(s => (
          <div key={s.label} style={{ background:C.card, border:'0.5px solid '+C.border, borderRadius:14, padding:'14px 12px', textAlign:'center' }}>
            <div style={{ fontSize:22, marginBottom:4 }}>{s.icon}</div>
            <div style={{ fontSize:20, fontWeight:700, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:10, color:C.muted, marginTop:2, textTransform:'uppercase', letterSpacing:'0.5px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Goal tracker */}
      <div style={{ background:C.card, border:'0.5px solid '+C.border, borderRadius:16, padding:'16px', marginBottom:14 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'white' }}>🎯 Daily Goal</div>
          <div style={{ display:'flex', gap:6 }}>
            {[50,100,150,200].map(g => (
              <button key={g} onClick={() => setGoal(g)}
                style={{ padding:'4px 8px', background: goal===g ? 'rgba(255,107,53,0.2)' : C.card2, border:'0.5px solid '+(goal===g ? C.accent : C.border), borderRadius:6, color: goal===g ? C.accent : C.muted, fontSize:11, cursor:'pointer' }}>
                €{g}
              </button>
            ))}
          </div>
        </div>
        <div style={{ background:'rgba(255,255,255,0.08)', borderRadius:8, height:10, marginBottom:8, overflow:'hidden' }}>
          <div style={{ height:'100%', borderRadius:8, background: goalPct>=100 ? C.green : 'linear-gradient(90deg,'+C.accent+','+C.yellow+')', width:goalPct+'%', transition:'width 0.5s' }} />
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
          <span style={{ color: goalPct>=100 ? C.green : C.accent, fontWeight:600 }}>€{todayEarnings.toFixed(2)} earned</span>
          <span style={{ color:C.muted }}>€{Math.max(0,goal-todayEarnings).toFixed(2)} to go</span>
        </div>
        {goalPct>=100 && <div style={{ marginTop:8, textAlign:'center', fontSize:13, color:C.green, fontWeight:700 }}>🎉 Goal reached!</div>}
      </div>

      {/* Peak hours */}
      <div style={{ background:C.card, border:'0.5px solid '+C.border, borderRadius:16, padding:'16px', marginBottom:14 }}>
        <div style={{ fontSize:13, fontWeight:700, color:'white', marginBottom:2 }}>🔥 Ibiza Peak Hours</div>
        <div style={{ fontSize:11, color:C.muted, marginBottom:12 }}>Busiest delivery windows — plan your shift</div>
        <div style={{ display:'flex', gap:3, height:70, alignItems:'flex-end' }}>
          {PEAK_HOURS.map(h => {
            const isCurrent = String(currentHour).padStart(2,'0') === h.hour
            return (
              <div key={h.hour} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                <div style={{ width:'100%', height:(h.h/100*54)+'px', background: isCurrent ? C.green : h.h>80 ? C.accent : h.h>50 ? C.yellow : 'rgba(255,255,255,0.12)', borderRadius:'3px 3px 0 0' }} />
                <div style={{ fontSize:7, color: isCurrent ? C.green : C.dim, whiteSpace:'nowrap' }}>{h.label}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* History */}
      <div style={{ display:'flex', gap:8, marginBottom:12 }}>
        {[['today','Today'],['week','This week'],['month','Month']].map(([id,label]) => (
          <button key={id} onClick={() => setPeriod(id)}
            style={{ flex:1, padding:'8px', background: period===id ? 'rgba(255,107,53,0.15)' : C.card, border:'0.5px solid '+(period===id ? C.accent : C.border), borderRadius:10, color: period===id ? C.accent : C.muted, fontSize:12, fontWeight: period===id ? 700 : 400, cursor:'pointer' }}>
            {label}
          </button>
        ))}
      </div>
      <div style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:10 }}>Delivery history</div>
      {loading ? <div style={{ textAlign:'center', padding:'24px', color:C.muted }}>Loading...</div>
        : history.length===0 ? (
          <div style={{ textAlign:'center', padding:'32px 0', color:C.muted }}>
            <div style={{ fontSize:36, marginBottom:8 }}>📭</div>No deliveries in this period
          </div>
        ) : history.map((e,i) => (
          <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 14px', background:C.card, borderRadius:12, marginBottom:8 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:'rgba(0,230,118,0.1)', border:'0.5px solid rgba(0,230,118,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>📦</div>
              <div>
                <div style={{ fontSize:13, color:'white', fontWeight:600 }}>#{e.order_number||e.order_id?.slice(0,6)}</div>
                <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{new Date(e.created_at).toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</div>
              </div>
            </div>
            <div style={{ fontSize:16, fontWeight:700, color:C.green }}>€{(e.amount||0).toFixed(2)}</div>
          </div>
        ))}
    </div>
  )
}

// ── Performance Tab ───────────────────────────────────────────
function PerformanceTab({ stats }) {
  const [leaderboard, setLeaderboard] = useState([])
  const [myRank, setMyRank] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const { supabase } = await import('../../lib/supabase')
        const { useAuthStore } = await import('../../lib/store')
        const user = useAuthStore.getState().user
        const today = new Date(); today.setHours(0,0,0,0)
        const { data } = await supabase.from('driver_earnings')
          .select('driver_id, amount, profiles(full_name)')
          .gte('created_at', today.toISOString())
        if (data) {
          const totals = {}
          data.forEach(e => {
            if (!totals[e.driver_id]) totals[e.driver_id] = { name: e.profiles?.full_name || 'Driver', total: 0, runs: 0 }
            totals[e.driver_id].total += e.amount || 0
            totals[e.driver_id].runs++
          })
          const sorted = Object.entries(totals).sort((a,b) => b[1].total - a[1].total).map(([id, d],i) => ({ id, ...d, rank:i+1 }))
          setLeaderboard(sorted.slice(0,10))
          const rank = sorted.findIndex(d => d.id === user?.id)
          if (rank >= 0) setMyRank(rank+1)
        }
      } catch {}
    }
    load()
  }, [])

  const deliveries = stats?.deliveries || 0
  const rating = stats?.rating || 5.0
  const earnings = stats?.earnings || 0
  const earnedBadges = BADGES.filter(b => b.req(deliveries, rating, earnings))

  const metrics = [
    { label:'Acceptance rate', value:'94%', color:C.green, icon:'✓', good:true },
    { label:'Completion rate', value:'98%', color:C.green, icon:'📦', good:true },
    { label:'Avg delivery time', value:'22 min', color:C.yellow, icon:'⏱', good:false },
    { label:'Late deliveries', value:'2%', color:C.green, icon:'🕐', good:true },
    { label:'Customer rating', value:rating.toFixed(1)+'★', color: rating>=4.8 ? C.green : rating>=4.5 ? C.yellow : C.red, icon:'⭐', good:rating>=4.8 },
    { label:'Deliveries today', value:deliveries, color:C.blue, icon:'📦', good:true },
  ]

  return (
    <div style={{ padding:'16px', paddingBottom:100 }}>
      {/* Performance metrics */}
      <div style={{ fontSize:12, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:12 }}>Performance</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:20 }}>
        {metrics.map(m => (
          <div key={m.label} style={{ background:C.card, border:'0.5px solid '+C.border, borderRadius:14, padding:'12px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4 }}>
              <span style={{ fontSize:16 }}>{m.icon}</span>
              <span style={{ fontSize:10, color: m.good ? C.green : C.yellow, fontWeight:600 }}>{m.good ? '●' : '▲'}</span>
            </div>
            <div style={{ fontSize:20, fontWeight:700, color:m.color }}>{m.value}</div>
            <div style={{ fontSize:10, color:C.muted, marginTop:2, textTransform:'uppercase', letterSpacing:'0.4px' }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Badges */}
      <div style={{ fontSize:12, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:12 }}>🏆 Badges</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:20 }}>
        {BADGES.map(b => {
          const earned = b.req(deliveries, rating, earnings)
          return (
            <div key={b.id} style={{ background: earned ? 'rgba(255,214,10,0.08)' : C.card, border:'0.5px solid '+(earned ? 'rgba(255,214,10,0.3)' : C.border), borderRadius:12, padding:'10px 6px', textAlign:'center', opacity: earned ? 1 : 0.4 }}>
              <div style={{ fontSize:24, marginBottom:4, filter: earned ? 'none' : 'grayscale(100%)' }}>{b.icon}</div>
              <div style={{ fontSize:9, color: earned ? C.yellow : C.muted, fontWeight:600, lineHeight:1.2 }}>{b.label}</div>
            </div>
          )
        })}
      </div>

      {/* Leaderboard */}
      <div style={{ fontSize:12, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:12 }}>
        🏆 Today's Leaderboard {myRank && <span style={{ color:C.accent }}>· You #{myRank}</span>}
      </div>
      {leaderboard.length === 0 ? (
        <div style={{ textAlign:'center', padding:'24px', color:C.muted, fontSize:13 }}>
          <div style={{ fontSize:32, marginBottom:8 }}>🏁</div>No data yet today
        </div>
      ) : leaderboard.map((d,i) => (
        <div key={d.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', background: i===0 ? 'rgba(255,214,10,0.08)' : C.card, border:'0.5px solid '+(i===0 ? 'rgba(255,214,10,0.25)' : C.border), borderRadius:12, marginBottom:8 }}>
          <div style={{ width:28, height:28, borderRadius:'50%', background: i===0 ? 'rgba(255,214,10,0.2)' : i===1 ? 'rgba(200,200,200,0.15)' : i===2 ? 'rgba(205,127,50,0.15)' : 'rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color: i===0 ? C.yellow : i===1 ? '#C0C0C0' : i===2 ? '#CD7F32' : C.muted }}>
            {i===0 ? '🥇' : i===1 ? '🥈' : i===2 ? '🥉' : d.rank}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, color:'white', fontWeight:600 }}>{d.name}</div>
            <div style={{ fontSize:11, color:C.muted }}>{d.runs} deliveries</div>
          </div>
          <div style={{ fontSize:16, fontWeight:700, color:i===0 ? C.yellow : C.green }}>€{d.total.toFixed(2)}</div>
        </div>
      ))}
    </div>
  )
}

// ── Settings Tab ──────────────────────────────────────────────
function SettingsTab({ profile, stats, onSignOut }) {
  const [vehicle, setVehicle] = useState('scooter')
  const [notifSound, setNotifSound] = useState(true)
  const [screenLock, setScreenLock] = useState(true)
  const [darkMode, setDarkMode] = useState(true)
  const [breakMode, setBreakMode] = useState(false)
  const [language, setLanguage] = useState('en')

  const toggleBreak = () => {
    setBreakMode(b => !b)
    toast(breakMode ? 'Back to work! 🛵' : 'Break started ☕', { duration:3000 })
  }

  const Toggle = ({ val, onToggle }) => (
    <button onClick={onToggle} style={{ width:46, height:26, borderRadius:13, background: val ? C.green : 'rgba(255,255,255,0.15)', border:'none', cursor:'pointer', position:'relative', transition:'background 0.2s' }}>
      <div style={{ width:20, height:20, borderRadius:'50%', background:'white', position:'absolute', top:3, left: val ? 23 : 3, transition:'left 0.2s', boxShadow:'0 1px 4px rgba(0,0,0,0.3)' }} />
    </button>
  )

  return (
    <div style={{ padding:'16px', paddingBottom:100 }}>
      {/* Profile card */}
      <div style={{ background:C.card, border:'0.5px solid '+C.border, borderRadius:18, padding:'20px', marginBottom:16, textAlign:'center' }}>
        <div style={{ width:72, height:72, borderRadius:'50%', background:'rgba(255,107,53,0.15)', border:'2px solid '+C.accent, display:'flex', alignItems:'center', justifyContent:'center', fontSize:32, margin:'0 auto 12px' }}>🛵</div>
        <div style={{ fontFamily:'DM Serif Display,serif', fontSize:22, color:'white', marginBottom:4 }}>{profile?.full_name||'Driver'}</div>
        <div style={{ fontSize:12, color:C.muted, marginBottom:14 }}>Isla Drop · Ibiza</div>
        <div style={{ display:'flex', justifyContent:'center', gap:0, background:'rgba(255,255,255,0.04)', borderRadius:12, padding:'10px 0' }}>
          {[
            { val:stats?.deliveries||0, label:'Deliveries', color:C.green },
            { val:(stats?.rating||5.0).toFixed(1)+'★', label:'Rating', color:C.yellow },
            { val:'€'+(stats?.earnings||0).toFixed(0), label:'Today', color:C.accent },
          ].map((s,i) => (
            <div key={s.label} style={{ flex:1, textAlign:'center', borderRight: i<2 ? '0.5px solid '+C.border : 'none' }}>
              <div style={{ fontSize:18, fontWeight:700, color:s.color }}>{s.val}</div>
              <div style={{ fontSize:9, color:C.muted, textTransform:'uppercase', marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Vehicle type */}
      <div style={{ background:C.card, border:'0.5px solid '+C.border, borderRadius:14, padding:'14px', marginBottom:10 }}>
        <div style={{ fontSize:12, color:C.muted, textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:10 }}>Vehicle type</div>
        <div style={{ display:'flex', gap:8 }}>
          {[['scooter','🛵','Scooter'],['car','🚗','Car'],['ebike','🚲','E-bike']].map(([id,icon,label]) => (
            <button key={id} onClick={() => setVehicle(id)}
              style={{ flex:1, padding:'10px 6px', background: vehicle===id ? 'rgba(255,107,53,0.15)' : C.card2, border:'0.5px solid '+(vehicle===id ? C.accent : C.border), borderRadius:10, cursor:'pointer' }}>
              <div style={{ fontSize:20, marginBottom:4 }}>{icon}</div>
              <div style={{ fontSize:11, color: vehicle===id ? C.accent : C.muted }}>{label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Break mode */}
      <button onClick={toggleBreak} style={{ width:'100%', padding:'14px', background: breakMode ? 'rgba(168,85,247,0.15)' : C.card, border:'0.5px solid '+(breakMode ? C.purple : C.border), borderRadius:14, color: breakMode ? C.purple : 'white', fontSize:14, fontWeight:600, cursor:'pointer', marginBottom:10, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
        {breakMode ? '☕ On break — tap to return to work' : '☕ Take a break'}
      </button>

      {/* Toggles */}
      {[
        { label:'Order notification sound', sub:'Alert sound for new orders', val:notifSound, fn:() => setNotifSound(v=>!v), icon:'🔔' },
        { label:'Keep screen on', sub:'Prevents screen lock while delivering', val:screenLock, fn:() => setScreenLock(v=>!v), icon:'📱' },
      ].map(item => (
        <div key={item.label} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px', background:C.card, borderRadius:12, marginBottom:8, border:'0.5px solid '+C.border }}>
          <span style={{ fontSize:20 }}>{item.icon}</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, color:'white', fontWeight:500 }}>{item.label}</div>
            <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{item.sub}</div>
          </div>
          <Toggle val={item.val} onToggle={item.fn} />
        </div>
      ))}

      {/* Info */}
      {[
        { icon:'🌴', label:'Zone', value:'Ibiza Island' },
        { icon:'📞', label:'Dispatch', value:'+34 971 000 000' },
        { icon:'🕐', label:'Support hours', value:'08:00–06:00 daily' },
        { icon:'📱', label:'App version', value:'Isla Drop Driver 3.0' },
      ].map(item => (
        <div key={item.label} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px', background:C.card, borderRadius:12, marginBottom:8, border:'0.5px solid '+C.border }}>
          <span style={{ fontSize:20 }}>{item.icon}</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:10, color:C.muted, textTransform:'uppercase', letterSpacing:'0.5px' }}>{item.label}</div>
            <div style={{ fontSize:14, color:'white', fontWeight:500, marginTop:2 }}>{item.value}</div>
          </div>
        </div>
      ))}

      <button onClick={onSignOut} style={{ width:'100%', marginTop:8, padding:'14px', background:'rgba(255,71,87,0.1)', border:'0.5px solid rgba(255,71,87,0.3)', borderRadius:14, color:C.red, fontSize:15, fontWeight:600, cursor:'pointer' }}>
        🚪 Sign out
      </button>
    </div>
  )
}

// ── Main DriverApp ────────────────────────────────────────────
export default function DriverApp() {
  const { user, profile, clear } = useAuthStore()
  const { isOnline, currentOrder, availableOrders, stats,
          setOnline, setCurrentOrder, setAvailableOrders, updateLocation } = useDriverStore()

  const [activeTab, setActiveTab] = useState('home')
  const [showPin, setShowPin] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [showIssue, setShowIssue] = useState(false)
  const [showSOS, setShowSOS] = useState(false)
  const [accepting, setAccepting] = useState(false)
  const [driverPos, setDriverPos] = useState(null)
  const [newOrderAlert, setNewOrderAlert] = useState(null)
  const [shiftStart, setShiftStart] = useState(null)
  const [shiftSecs, setShiftSecs] = useState(0)
  const [orderTimer, setOrderTimer] = useState(0)

  // Shift timer
  useEffect(() => {
    if (!isOnline) { setShiftStart(null); setShiftSecs(0); return }
    if (!shiftStart) setShiftStart(Date.now())
    const t = setInterval(() => setShiftSecs(Math.floor((Date.now()-(shiftStart||Date.now()))/1000)), 1000)
    return () => clearInterval(t)
  }, [isOnline, shiftStart])

  // Order timer
  useEffect(() => {
    if (!currentOrder) { setOrderTimer(0); return }
    const start = new Date(currentOrder.created_at).getTime()
    const t = setInterval(() => setOrderTimer(Math.floor((Date.now()-start)/1000)), 1000)
    return () => clearInterval(t)
  }, [currentOrder])

  const loadOrders = useCallback(async () => {
    if (!isOnline || !user) return
    try { const orders = await getAvailableOrders(); setAvailableOrders(orders||[]) } catch {}
  }, [isOnline, user])

  const toggleOnline = async () => {
    const next = !isOnline
    setOnline(next)
    if (user) await setDriverOnlineStatus(user.id, next).catch(()=>{})
    if (next) { loadOrders(); toast.success('You are ONLINE 🟢', { duration:3000 }) }
    else toast('You are offline ⚫', { duration:3000 })
  }

  const handleAccept = async (order) => {
    setAccepting(true); setNewOrderAlert(null)
    try {
      await acceptOrder(order.id, user.id)
      setCurrentOrder({...order, status:'assigned'})
      setAvailableOrders([])
      setActiveTab('home')
      toast.success('Order accepted! Head to warehouse 🏪', { duration:4000 })
    } catch (err) { toast.error('Could not accept: '+(err.message||'try again')) }
    setAccepting(false)
  }

  const handleAdvanceStatus = async () => {
    if (!currentOrder) return
    const cfg = STATUS_CONFIG[currentOrder.status]
    if (!cfg?.next) return
    try {
      await updateOrderStatus(currentOrder.id, cfg.next)
      setCurrentOrder({...currentOrder, status:cfg.next})
      const msg = { warehouse_confirmed:'✅ Collected! Head to the customer', en_route:'🛵 On your way!' }
      if (msg[cfg.next]) toast.success(msg[cfg.next], { duration:3000 })
    } catch { toast.error('Status update failed') }
  }

  useEffect(() => {
    if (!isOnline || !user) return
    loadOrders()
    const sub = subscribeToAvailableOrders(order => {
      if (!currentOrder) {
        setNewOrderAlert(order)
        if (navigator.vibrate) navigator.vibrate([200,100,200,100,200])
      }
    })
    const interval = setInterval(loadOrders, 20000)
    return () => { sub?.unsubscribe?.(); clearInterval(interval) }
  }, [isOnline, user, currentOrder])

  useEffect(() => {
    if (!isOnline || !user) return
    const watchId = navigator.geolocation?.watchPosition(
      async pos => {
        const { latitude:lat, longitude:lng } = pos.coords
        setDriverPos([lat,lng]); updateLocation(lat,lng)
        updateDriverLocation(user.id, lat, lng).catch(()=>{})
        if (currentOrder && ['warehouse_confirmed','en_route'].includes(currentOrder.status)) {
          try {
            const { supabase } = await import('../../lib/supabase')
            const { calculateETA } = await import('../../lib/eta')
            const eta = calculateETA({ driverLat:lat, driverLng:lng, orderStatus:currentOrder.status, deliveryLat:currentOrder.delivery_lat, deliveryLng:currentOrder.delivery_lng })
            await supabase.from('orders').update({ driver_lat:lat, driver_lng:lng, eta_minutes:eta?.totalMins||null }).eq('id', currentOrder.id)
          } catch {}
        }
      }, null, { enableHighAccuracy:true, maximumAge:5000, timeout:10000 }
    )
    return () => { if (watchId) navigator.geolocation?.clearWatch(watchId) }
  }, [isOnline, user, currentOrder])

  const cfg = currentOrder ? STATUS_CONFIG[currentOrder.status] : null
  const name = profile?.full_name?.split(' ')[0] || 'Driver'

  const TABS = [
    { id:'home',        icon:'🏠', label:'Home' },
    { id:'earnings',    icon:'💰', label:'Earnings' },
    { id:'performance', icon:'📊', label:'Stats' },
    { id:'settings',    icon:'⚙️', label:'Settings' },
  ]

  return (
    <div style={{ minHeight:'100vh', background:C.bg, color:'white', fontFamily:'DM Sans,sans-serif' }}>

      {/* Overlays */}
      {showMap && currentOrder && <DeliveryMap order={currentOrder} driverPos={driverPos} onClose={() => setShowMap(false)} />}
      {showChat && currentOrder && <CustomerChat order={currentOrder} driverId={user?.id} onClose={() => setShowChat(false)} />}
      {showPin && currentOrder && <PinEntry order={currentOrder} onSuccess={() => { setShowPin(false); setCurrentOrder(null); setActiveTab('home') }} onCancel={() => setShowPin(false)} />}
      {showIssue && currentOrder && <IssueReport order={currentOrder} onClose={() => setShowIssue(false)} />}
      {showSOS && <SosPanel driverPos={driverPos} onClose={() => setShowSOS(false)} />}
      {newOrderAlert && !currentOrder && <NewOrderAlert order={newOrderAlert} onAccept={handleAccept} onDecline={() => setNewOrderAlert(null)} loading={accepting} />}

      {/* Header */}
      <div style={{ background:'rgba(0,0,0,0.35)', padding:'14px 16px 0', borderBottom:'0.5px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <div>
            <div style={{ fontSize:18, fontWeight:700, color:'white' }}>Hey, {name} 👋</div>
            <div style={{ fontSize:11, color: isOnline ? C.green : C.muted, marginTop:2, display:'flex', alignItems:'center', gap:5 }}>
              <div style={{ width:7, height:7, borderRadius:'50%', background: isOnline ? C.green : '#555', animation: isOnline ? 'pulse 1.5s infinite' : 'none' }} />
              {isOnline ? 'Online · '+formatDuration(shiftSecs) : 'Offline'}
            </div>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <button onClick={() => setShowSOS(true)} style={{ background:'rgba(255,71,87,0.12)', border:'1.5px solid rgba(255,71,87,0.4)', borderRadius:10, padding:'7px 12px', color:C.red, fontSize:12, fontWeight:700, cursor:'pointer' }}>🆘 SOS</button>
            <button onClick={toggleOnline} style={{ background: isOnline ? 'rgba(0,230,118,0.12)' : 'rgba(255,107,53,0.12)', border:'1.5px solid '+(isOnline ? C.green : C.accent), borderRadius:22, padding:'8px 16px', color: isOnline ? C.green : C.accent, fontSize:13, fontWeight:700, cursor:'pointer' }}>
              {isOnline ? '● Online' : '○ Go online'}
            </button>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)' }}>
          {[
            { icon:'💰', val:'€'+(stats?.earnings||0).toFixed(0), label:'Today' },
            { icon:'📦', val:stats?.deliveries||0, label:'Runs' },
            { icon:'⭐', val:(stats?.rating||5.0).toFixed(1), label:'Rating' },
            { icon:'🕐', val:formatDuration(shiftSecs).slice(0,5), label:'Shift' },
          ].map(s => (
            <div key={s.label} style={{ padding:'10px 4px', textAlign:'center', borderTop:'0.5px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize:13 }}>{s.icon}</div>
              <div style={{ fontSize:15, fontWeight:700, lineHeight:1.2 }}>{s.val}</div>
              <div style={{ fontSize:9, color:C.muted, textTransform:'uppercase', letterSpacing:'0.4px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* HOME TAB */}
      {activeTab === 'home' && (
        <div style={{ padding:16, paddingBottom:90 }}>

          {currentOrder && cfg && (
            <div style={{ background:'linear-gradient(135deg,rgba(255,107,53,0.08),rgba(0,180,216,0.06))', border:'0.5px solid rgba(255,107,53,0.25)', borderRadius:20, overflow:'hidden', marginBottom:16 }}>

              {/* Status bar */}
              <div style={{ background:cfg.color+'18', borderBottom:'0.5px solid '+cfg.color+'30', padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:18 }}>{cfg.icon}</span>
                  <span style={{ fontSize:13, fontWeight:700, color:cfg.color, textTransform:'uppercase', letterSpacing:'0.5px' }}>{cfg.label}</span>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:11, color:C.muted }}>#{currentOrder.order_number}</div>
                  <div style={{ fontSize:11, color: orderTimer>1800 ? C.red : orderTimer>900 ? C.yellow : C.muted, fontWeight: orderTimer>900 ? 700 : 400 }}>
                    ⏱ {formatDuration(orderTimer).slice(3)}
                  </div>
                </div>
              </div>

              {/* Stepper */}
              <div style={{ padding:'14px 16px 10px', display:'flex', alignItems:'center' }}>
                {STEPS.map((step, i) => {
                  const curr = STEPS.indexOf(currentOrder.status)
                  const done = i < curr, active = i === curr
                  return (
                    <div key={step} style={{ display:'flex', alignItems:'center', flex: i<STEPS.length-1 ? 1 : 0 }}>
                      <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                        <div style={{ width:28, height:28, borderRadius:'50%', background: done ? C.green : active ? cfg.color : 'rgba(255,255,255,0.1)', border:'2px solid '+(done ? C.green : active ? cfg.color : 'rgba(255,255,255,0.15)'), display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, transition:'all 0.3s' }}>
                          {done ? '✓' : i+1}
                        </div>
                        <div style={{ fontSize:8, color: active ? cfg.color : done ? C.green : C.dim, marginTop:4, textTransform:'uppercase', whiteSpace:'nowrap' }}>{STEP_LABELS[i]}</div>
                      </div>
                      {i < STEPS.length-1 && <div style={{ flex:1, height:2, background: done ? C.green : 'rgba(255,255,255,0.1)', margin:'0 4px', marginBottom:16, transition:'background 0.3s' }} />}
                    </div>
                  )
                })}
              </div>

              <div style={{ padding:'0 16px 16px' }}>
                {/* Address */}
                <div style={{ fontSize:15, fontWeight:700, color:'white', marginBottom:4 }}>📍 {currentOrder.delivery_address||'Delivery address'}</div>
                {currentOrder.what3words && <div style={{ fontSize:12, color:C.green, marginBottom:6 }}>/// {currentOrder.what3words}</div>}
                {currentOrder.delivery_notes && (
                  <div style={{ background:'rgba(255,214,10,0.08)', border:'0.5px solid rgba(255,214,10,0.2)', borderRadius:8, padding:'8px 12px', marginBottom:10, fontSize:12, color:C.yellow }}>
                    📝 {currentOrder.delivery_notes}
                  </div>
                )}

                {/* Items */}
                <div style={{ background:'rgba(255,255,255,0.04)', borderRadius:10, padding:'10px 12px', marginBottom:14 }}>
                  <div style={{ fontSize:10, color:C.muted, textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:6 }}>Items to deliver</div>
                  {(currentOrder.order_items||[]).map((item,i) => (
                    <div key={i} style={{ fontSize:13, color:'rgba(255,255,255,0.8)', marginBottom:3, display:'flex', gap:8 }}>
                      <span style={{ color:C.muted }}>×{item.quantity||1}</span>
                      <span>{item.product?.name||item.products?.name||'Item'}</span>
                      {(item.product?.age_restricted||item.products?.age_restricted) && (
                        <span style={{ fontSize:10, color:C.red, fontWeight:700, background:'rgba(255,71,87,0.12)', borderRadius:4, padding:'0 4px' }}>18+</span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Age check reminder */}
                {currentOrder.order_items?.some(i => i.product?.age_restricted||i.products?.age_restricted) && currentOrder.status==='en_route' && (
                  <div style={{ background:'rgba(255,71,87,0.08)', border:'1px solid rgba(255,71,87,0.25)', borderRadius:10, padding:'10px 14px', marginBottom:12, display:'flex', gap:10, alignItems:'center' }}>
                    <span style={{ fontSize:20 }}>🪪</span>
                    <div>
                      <div style={{ fontSize:12, fontWeight:700, color:C.red }}>ID Check Required</div>
                      <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>This order contains age-restricted items. Ask for ID before handing over.</div>
                    </div>
                  </div>
                )}

                {/* PIN */}
                {currentOrder.status==='en_route' && currentOrder.delivery_pin && (
                  <div style={{ background:'rgba(255,107,53,0.08)', border:'1px solid rgba(255,107,53,0.25)', borderRadius:12, padding:'12px 14px', marginBottom:14, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div>
                      <div style={{ fontSize:10, color:C.muted, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:4 }}>Customer delivery PIN</div>
                      <div style={{ fontSize:28, fontWeight:800, color:'white', letterSpacing:10 }}>{currentOrder.delivery_pin}</div>
                    </div>
                    <div style={{ fontSize:28 }}>🔐</div>
                  </div>
                )}

                {/* Primary action buttons */}
                <div style={{ display:'flex', gap:8, marginBottom:8 }}>
                  <button onClick={() => setShowMap(true)} style={{ flex:1, padding:'12px', background:'rgba(0,180,216,0.1)', border:'0.5px solid rgba(0,180,216,0.3)', borderRadius:12, color:C.blue, fontSize:13, fontWeight:600, cursor:'pointer' }}>🗺 Map</button>
                  <button onClick={() => setShowChat(true)} style={{ flex:1, padding:'12px', background:'rgba(168,85,247,0.1)', border:'0.5px solid rgba(168,85,247,0.3)', borderRadius:12, color:C.purple, fontSize:13, fontWeight:600, cursor:'pointer' }}>💬 Chat</button>
                  {cfg.next && (
                    <button onClick={handleAdvanceStatus} style={{ flex:2, padding:'12px', background:cfg.color, border:'none', borderRadius:12, color:'#0A1628', fontSize:13, fontWeight:800, cursor:'pointer' }}>{cfg.nextLabel}</button>
                  )}
                  {currentOrder.status==='en_route' && (
                    <button onClick={() => setShowPin(true)} style={{ flex:2, padding:'12px', background:C.green, border:'none', borderRadius:12, color:'#0A1628', fontSize:13, fontWeight:800, cursor:'pointer' }}>🔐 Enter PIN</button>
                  )}
                </div>

                {/* Report issue */}
                <button onClick={() => setShowIssue(true)} style={{ width:'100%', padding:'10px', background:'rgba(255,71,87,0.06)', border:'0.5px solid rgba(255,71,87,0.2)', borderRadius:10, color:'rgba(255,100,100,0.7)', fontSize:12, cursor:'pointer' }}>
                  ⚠️ Report an issue with this delivery
                </button>
              </div>
            </div>
          )}

          {!currentOrder && (
            isOnline ? (
              <div style={{ background:C.card, border:'0.5px solid '+C.border, borderRadius:20, padding:'32px 20px', textAlign:'center', marginBottom:16 }}>
                <div style={{ fontSize:52, marginBottom:12 }}>🛵</div>
                <div style={{ fontFamily:'DM Serif Display,serif', fontSize:22, color:'white', marginBottom:6 }}>Ready for deliveries</div>
                <div style={{ fontSize:14, color:C.muted }}>New orders appear automatically · 30 seconds to accept</div>
              </div>
            ) : (
              <div style={{ background:C.card, border:'0.5px solid '+C.border, borderRadius:20, padding:'32px 20px', textAlign:'center', marginBottom:16 }}>
                <div style={{ fontSize:52, marginBottom:12 }}>😴</div>
                <div style={{ fontFamily:'DM Serif Display,serif', fontSize:22, color:'white', marginBottom:6 }}>You are offline</div>
                <div style={{ fontSize:14, color:C.muted, marginBottom:24 }}>Go online to start receiving delivery requests</div>
                <button onClick={toggleOnline} style={{ padding:'14px 36px', background:C.green, border:'none', borderRadius:14, color:'#0A1628', fontSize:16, fontWeight:800, cursor:'pointer' }}>Go online</button>
              </div>
            )
          )}

          {isOnline && !currentOrder && availableOrders.length>0 && !newOrderAlert && (
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:10 }}>{availableOrders.length} order{availableOrders.length!==1 ? 's' : ''} waiting</div>
              {availableOrders.slice(0,3).map(order => (
                <div key={order.id} style={{ background:C.card, border:'0.5px solid rgba(0,230,118,0.2)', borderRadius:14, padding:'14px', marginBottom:10 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                    <div style={{ fontSize:14, fontWeight:700 }}>#{order.order_number}</div>
                    <div style={{ fontSize:16, fontWeight:700, color:C.green }}>€{(order.delivery_fee||3.5).toFixed(2)}</div>
                  </div>
                  <div style={{ fontSize:12, color:C.muted, marginBottom:10 }}>📍 {order.delivery_address}</div>
                  <button onClick={() => handleAccept(order)} disabled={accepting} style={{ width:'100%', padding:'12px', background:C.green, border:'none', borderRadius:10, color:'#0A1628', fontSize:14, fontWeight:700, cursor:'pointer' }}>Accept</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'earnings' && <EarningsTab stats={stats} />}
      {activeTab === 'performance' && <PerformanceTab stats={stats} />}
      {activeTab === 'settings' && <SettingsTab profile={profile} stats={stats} onSignOut={clear} />}

      {/* Bottom tab bar */}
      <div style={{ position:'fixed', bottom:0, left:0, right:0, background:'rgba(10,22,40,0.98)', borderTop:'0.5px solid rgba(255,255,255,0.08)', display:'flex', paddingBottom:'env(safe-area-inset-bottom)', backdropFilter:'blur(20px)', zIndex:100 }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ flex:1, padding:'12px 0 10px', background:'none', border:'none', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:3, position:'relative' }}>
            {tab.id==='home' && currentOrder && <div style={{ position:'absolute', top:8, right:'28%', width:8, height:8, borderRadius:'50%', background:cfg?.color||C.accent }} />}
            <span style={{ fontSize:20 }}>{tab.icon}</span>
            <span style={{ fontSize:10, color: activeTab===tab.id ? C.accent : C.muted, fontWeight: activeTab===tab.id ? 700 : 400 }}>{tab.label}</span>
            {activeTab===tab.id && <div style={{ position:'absolute', bottom:0, left:'20%', right:'20%', height:2, background:C.accent, borderRadius:1 }} />}
          </button>
        ))}
      </div>

      <style>{'@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}'}</style>
    </div>
  )
}
