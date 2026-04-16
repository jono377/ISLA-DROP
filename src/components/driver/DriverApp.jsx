import { useState, useEffect, useCallback, useRef } from 'react'
import toast from 'react-hot-toast'
import {
  getAvailableOrders, acceptOrder, updateOrderStatus,
  updateDriverLocation, setDriverOnlineStatus,
  subscribeToAvailableOrders
} from '../../lib/supabase'
import { useAuthStore, useDriverStore } from '../../lib/store'
import { useLeafletMap, PIN_ICON } from '../../lib/useLeafletMap'
import {
  WeatherWidget, BarcodeScanner, SignaturePad, ExpenseLogger,
  PayslipGenerator, IncidentReport, BonusTracker, ZoneHeatmap,
  RouteHistory, AppLock, NotificationSetup, DispatchMessages,
  setupPushNotifications, sendPushNotification
} from './DriverModules'
import {
  haptic, OrderCardSkeleton, EarningsRowSkeleton,
  usePWAInstall, PWAInstallBanner,
  useOfflineMode, OfflineBanner,
  useCrashDetection, CrashAlert,
  EarningsForecast,
  CustomerFeedback,
  RunningLateButton,
  MultiOrderPanel,
  VoiceMessage,
  StreakBadge,
  StatusBar,
  useAppUpdate, UpdateBanner,
  EmergencyCall,
} from './DriverExtras'

// ─────────────────────────────────────────────────────────────
// DESIGN SYSTEM
// ─────────────────────────────────────────────────────────────
const DS = {
  // Colours
  bg:       '#0D0D0D',
  surface:  '#1A1A1A',
  surface2: '#222222',
  border:   '#2A2A2A',
  border2:  '#333333',
  accent:   '#FF6B35',
  accentDim:'rgba(255,107,53,0.15)',
  accentBdr:'rgba(255,107,53,0.35)',
  green:    '#22C55E',
  greenDim: 'rgba(34,197,94,0.12)',
  greenBdr: 'rgba(34,197,94,0.3)',
  blue:     '#3B82F6',
  blueDim:  'rgba(59,130,246,0.12)',
  blueBdr:  'rgba(59,130,246,0.3)',
  yellow:   '#EAB308',
  yellowDim:'rgba(234,179,8,0.12)',
  yellowBdr:'rgba(234,179,8,0.3)',
  red:      '#EF4444',
  redDim:   'rgba(239,68,68,0.12)',
  redBdr:   'rgba(239,68,68,0.3)',
  purple:   '#A855F7',
  // Text
  t1: '#FFFFFF',
  t2: 'rgba(255,255,255,0.6)',
  t3: 'rgba(255,255,255,0.35)',
  // Typography
  f: 'DM Sans, sans-serif',
  fh: 'DM Serif Display, serif',
  // Spacing (8px grid)
  s1: '8px', s2: '16px', s3: '24px', s4: '32px',
  // Radii
  r1: '8px', r2: '16px', r3: '24px',
  // Shadows
  sh1: '0 1px 3px rgba(0,0,0,0.4)',
  sh2: '0 4px 16px rgba(0,0,0,0.5)',
  sh3: '0 8px 32px rgba(0,0,0,0.6)',
}

const WAREHOUSE = [38.9090, 1.4340]

const STATUS_CONFIG = {
  assigned:            { label: 'Head to warehouse',    color: DS.blue,   step: 0, next: 'warehouse_confirmed', nextLabel: 'Confirm pickup',   icon: '🏪' },
  warehouse_confirmed: { label: 'Head to customer',     color: DS.yellow, step: 1, next: 'en_route',           nextLabel: 'Start delivery',   icon: '🛵' },
  en_route:            { label: 'Arriving at customer', color: DS.green,  step: 2, next: null,                 nextLabel: null,               icon: '📍' },
  delivered:           { label: 'Delivered',            color: DS.green,  step: 3, next: null,                 nextLabel: null,               icon: '✓'  },
}

const STEPS = ['assigned','warehouse_confirmed','en_route','delivered']
const STEP_LABELS = ['Warehouse','Collected','En Route','Delivered']

const ISSUE_TYPES = [
  { id:'not_home',      label:'Not home',        icon:'🚪' },
  { id:'wrong_address', label:'Wrong address',    icon:'📍' },
  { id:'damaged_item',  label:'Item damaged',     icon:'📦' },
  { id:'access',        label:'No access',        icon:'🔒' },
  { id:'refused',       label:'Refused delivery', icon:'🚫' },
  { id:'other',         label:'Other',            icon:'⚠️' },
]

const QUICK_REPLIES = [
  'On my way! 🛵',
  'Arriving in 2 minutes 📍',
  "Outside your building",
  "Can't find parking — 1 min 🙏",
  'At the door 🚪',
  'Delivered to reception ✓',
]

const BADGES = [
  { id:'first',   icon:'🌟', label:'First Run',    req:(d)=>d>=1   },
  { id:'ten',     icon:'🔟', label:'10 Deliveries', req:(d)=>d>=10  },
  { id:'fifty',   icon:'💪', label:'50 Club',       req:(d)=>d>=50  },
  { id:'hundred', icon:'💯', label:'Century',       req:(d)=>d>=100 },
  { id:'star',    icon:'⭐', label:'Five Star',     req:(_,r)=>r>=5.0 },
  { id:'earner',  icon:'💰', label:'Top Earner',    req:()=>false   },
  { id:'streak',  icon:'🔥', label:'3-Day Streak',  req:()=>false   },
  { id:'speedy',  icon:'⚡', label:'Speed Demon',   req:()=>false   },
]

const PEAK_HOURS = [
  {h:'18',l:'6pm',v:40},{h:'19',l:'7pm',v:55},{h:'20',l:'8pm',v:75},
  {h:'21',l:'9pm',v:90},{h:'22',l:'10pm',v:100},{h:'23',l:'11pm',v:95},
  {h:'00',l:'12am',v:85},{h:'01',l:'1am',v:70},{h:'02',l:'2am',v:80},
  {h:'03',l:'3am',v:65},{h:'04',l:'4am',v:40},{h:'05',l:'5am',v:20},
]

// ─────────────────────────────────────────────────────────────
// PRIMITIVE COMPONENTS
// ─────────────────────────────────────────────────────────────
function Card({ children, style={}, accent }) {
  return (
    <div style={{
      background: DS.surface, borderRadius: DS.r2,
      border: '1px solid ' + (accent ? accent + '40' : DS.border),
      overflow: 'hidden', ...style
    }}>{children}</div>
  )
}

function Pill({ children, color, style={} }) {
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:5,
      padding:'4px 10px', borderRadius:99,
      background: color + '18', border: '1px solid ' + color + '40',
      fontSize:11, fontWeight:700, color,
      textTransform:'uppercase', letterSpacing:'0.6px', ...style
    }}>{children}</span>
  )
}

function ActionBtn({ children, onClick, color, outline, disabled, style={} }) {
  const bg = outline ? 'transparent' : (disabled ? DS.surface2 : color || DS.accent)
  const cl = disabled ? DS.t3 : outline ? (color || DS.accent) : (color===DS.green||color===DS.yellow ? '#0D0D0D' : DS.t1)
  const bd = outline ? '1.5px solid ' + (color || DS.accent) + '60' : 'none'
  return (
    <button onClick={disabled ? undefined : onClick}
      style={{ padding:'14px 20px', background:bg, border:bd, borderRadius:DS.r1,
        color:cl, fontSize:14, fontWeight:700, cursor:disabled?'default':'pointer',
        fontFamily:DS.f, width:'100%', transition:'opacity 0.15s',
        opacity:disabled?0.5:1, display:'flex', alignItems:'center',
        justifyContent:'center', gap:8, ...style }}>
      {children}
    </button>
  )
}

function Toggle({ val, onToggle }) {
  return (
    <button onClick={onToggle} style={{
      width:48, height:28, borderRadius:14,
      background: val ? DS.green : DS.border2,
      border:'none', cursor:'pointer', position:'relative',
      transition:'background 0.2s', flexShrink:0
    }}>
      <div style={{
        width:22, height:22, borderRadius:'50%', background:DS.t1,
        position:'absolute', top:3, left: val ? 23 : 3,
        transition:'left 0.2s', boxShadow:DS.sh1
      }} />
    </button>
  )
}

function SheetHandle() {
  return <div style={{ width:36, height:4, background:DS.border2, borderRadius:2, margin:'0 auto 20px' }} />
}

function BottomSheet({ children, zIndex=600, onDismiss, maxH='90vh' }) {
  return (
    <div style={{ position:'fixed', inset:0, zIndex, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'flex-end' }}
      onClick={e => e.target===e.currentTarget && onDismiss?.()}>
      <div style={{
        width:'100%', background:DS.surface, borderRadius:'20px 20px 0 0',
        padding:'16px 20px calc(40px + env(safe-area-inset-bottom))',
        borderTop:'1px solid '+DS.border2, maxHeight:maxH, overflowY:'auto',
        animation:'slideUp 0.25s ease-out',
      }}>
        <SheetHandle />{children}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
function fmt(secs) {
  const h = String(Math.floor(secs/3600)).padStart(2,'0')
  const m = String(Math.floor((secs%3600)/60)).padStart(2,'0')
  const s = String(secs%60).padStart(2,'0')
  return h+':'+m+':'+s
}

function fmtShort(secs) { return fmt(secs).slice(3) }

function orderSummary(order) {
  if (!order.order_items?.length) return 'No items'
  const names = order.order_items.slice(0,3).map(i=>(i.quantity||1)+'× '+(i.product?.name||i.products?.name||'Item'))
  const extra = order.order_items.length>3 ? ' +'+(order.order_items.length-3)+' more' : ''
  return names.join(', ')+extra
}

function hasAgeRestricted(order) {
  return order.order_items?.some(i=>i.product?.age_restricted||i.products?.age_restricted)
}

// ─────────────────────────────────────────────────────────────
// DELIVERY MAP — with OSRM routing
// ─────────────────────────────────────────────────────────────
function DeliveryMap({ order, driverPos, onClose }) {
  const containerRef = useRef(null)
  const { mapRef, setMarker, fitBounds, flyTo } = useLeafletMap(containerRef, {
    center: order?.delivery_lat ? [order.delivery_lat, order.delivery_lng] : WAREHOUSE,
    zoom: 14, darkStyle: true,
  })
  const routeRef = useRef(null)
  const [eta, setEta] = useState(null)
  const [dist, setDist] = useState(null)

  const drawRoute = useCallback(async (from, to) => {
    if (!mapRef.current || !from || !to) return
    try {
      const url = 'https://router.project-osrm.org/route/v1/driving/'+from[1]+','+from[0]+';'+to[1]+','+to[0]+'?overview=full&geometries=geojson'
      const data = await fetch(url).then(r=>r.json())
      if (!data.routes?.[0]) return
      const L = mapRef.current._L
      if (!L) return
      routeRef.current?.remove()
      const coords = data.routes[0].geometry.coordinates.map(([lng,lat])=>[lat,lng])
      routeRef.current = L.polyline(coords, { color:DS.accent, weight:5, opacity:0.85 })
      routeRef.current.addTo(mapRef.current)
      setDist((data.routes[0].distance/1000).toFixed(1))
      setEta(Math.ceil(data.routes[0].duration/60))
    } catch {}
  }, [mapRef])

  useEffect(() => {
    const t = setInterval(() => {
      if (!mapRef.current) return
      clearInterval(t)
      setMarker('wh', WAREHOUSE[0], WAREHOUSE[1],
        '<div style="font-size:28px;filter:drop-shadow(0 2px 8px rgba(0,0,0,0.8))">🏪</div>',
        '<b>Warehouse</b>')
      if (order?.delivery_lat) {
        setMarker('dest', order.delivery_lat, order.delivery_lng,
          '<div style="width:40px;height:40px;background:#FF6B35;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 4px 16px rgba(255,107,53,0.5)"><div style="transform:rotate(45deg);font-size:16px">📍</div></div>',
          '<b>Drop-off</b><br>'+(order.delivery_address||''))
      }
      if (driverPos) {
        setMarker('me', driverPos[0], driverPos[1],
          '<div style="width:44px;height:44px;background:#0D0D0D;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid #FF6B35;box-shadow:0 4px 16px rgba(255,107,53,0.6);font-size:22px">🛵</div>',
          '<b>You</b>')
        if (order?.delivery_lat) {
          fitBounds([[driverPos[0],driverPos[1]],[order.delivery_lat,order.delivery_lng]])
          drawRoute(driverPos,[order.delivery_lat,order.delivery_lng])
        }
      }
    }, 600)
    return () => { clearInterval(t); routeRef.current?.remove() }
  }, [order, driverPos])

  const openExtNav = () => {
    if (!order?.delivery_lat) return
    const d = order.delivery_lat+','+order.delivery_lng
    if (/iPhone|iPad/i.test(navigator.userAgent)) window.open('maps://maps.apple.com/?daddr='+d+'&dirflg=d')
    else window.open('https://www.google.com/maps/dir/?api=1&destination='+d+'&travelmode=driving')
  }
  const openWaze = () => {
    if (!order?.delivery_lat) return
    window.open('waze://?ll='+order.delivery_lat+','+order.delivery_lng+'&navigate=yes')
  }
  const call = () => order?.customer_phone && window.open('tel:'+order.customer_phone)
  const whatsapp = () => { const p=(order?.customer_phone||'').replace(/\D/g,''); p&&window.open('https://wa.me/'+p) }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:500, background:DS.bg, display:'flex', flexDirection:'column' }}>
      {/* Topbar */}
      <div style={{ background:DS.surface, padding:'14px 16px', display:'flex', alignItems:'center', gap:12, borderBottom:'1px solid '+DS.border }}>
        <button onClick={onClose} style={{ width:40, height:40, borderRadius:DS.r1, background:DS.surface2, border:'none', color:DS.t1, fontSize:20, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>←</button>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:15, fontWeight:700, color:DS.t1 }}>Order #{order?.order_number}</div>
          <div style={{ fontSize:12, color:DS.t2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>📍 {order?.delivery_address||'Address not set'}</div>
        </div>
        {eta && <Pill color={DS.green}>{eta} min · {dist} km</Pill>}
      </div>

      {/* Map */}
      <div ref={containerRef} style={{ flex:1 }} />

      {/* Bottom panel */}
      <div style={{ background:DS.surface, borderTop:'1px solid '+DS.border, padding:'14px 16px calc(20px + env(safe-area-inset-bottom))' }}>
        {order?.what3words && <div style={{ fontSize:13, color:DS.green, marginBottom:6, fontFamily:DS.f }}>/// {order.what3words}</div>}
        {order?.delivery_notes && <div style={{ fontSize:12, color:DS.yellow, marginBottom:10, background:DS.yellowDim, borderRadius:DS.r1, padding:'8px 12px', border:'1px solid '+DS.yellowBdr }}>📝 {order.delivery_notes}</div>}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:8 }}>
          <ActionBtn onClick={openExtNav} color={DS.blue} outline style={{ fontSize:12, padding:'10px 4px' }}>🗺 Google</ActionBtn>
          <ActionBtn onClick={openWaze} color={DS.purple} outline style={{ fontSize:12, padding:'10px 4px' }}>🗺 Waze</ActionBtn>
          <ActionBtn onClick={call} color={DS.green} outline style={{ fontSize:12, padding:'10px 4px' }}>📞 Call</ActionBtn>
          <ActionBtn onClick={whatsapp} color={DS.green} outline style={{ fontSize:12, padding:'10px 4px' }}>💬 WA</ActionBtn>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// CUSTOMER CHAT
// ─────────────────────────────────────────────────────────────
function CustomerChat({ order, driverId, onClose }) {
  const [msgs, setMsgs] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    const load = async () => {
      try {
        const { supabase } = await import('../../lib/supabase')
        const { data } = await supabase.from('order_messages').select('*').eq('order_id', order.id).order('created_at')
        if (data) setMsgs(data)
      } catch {}
    }
    load()
    let sub
    const setup = async () => {
      const { supabase } = await import('../../lib/supabase')
      sub = supabase.channel('chat-'+order.id)
        .on('postgres_changes',{ event:'INSERT', schema:'public', table:'order_messages', filter:'order_id=eq.'+order.id },
          p => setMsgs(prev=>[...prev,p.new]))
        .subscribe()
    }
    setup()
    return () => sub?.unsubscribe?.()
  }, [order.id])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }) }, [msgs])

  const send = async (content) => {
    const msg = content || text.trim()
    if (!msg) return
    setSending(true); setText('')
    try {
      const { supabase } = await import('../../lib/supabase')
      await supabase.from('order_messages').insert({ order_id:order.id, sender_id:driverId, sender_role:'driver', content:msg })
    } catch { toast.error('Message failed') }
    setSending(false)
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:520, background:DS.bg, display:'flex', flexDirection:'column' }}>
      <div style={{ background:DS.surface, padding:'14px 16px', display:'flex', alignItems:'center', gap:12, borderBottom:'1px solid '+DS.border }}>
        <button onClick={onClose} style={{ width:40, height:40, borderRadius:DS.r1, background:DS.surface2, border:'none', color:DS.t1, fontSize:20, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>←</button>
        <div>
          <div style={{ fontSize:15, fontWeight:700, color:DS.t1 }}>Customer · #{order.order_number}</div>
          <div style={{ fontSize:11, color:DS.green, display:'flex', alignItems:'center', gap:4 }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:DS.green }} />Live chat
          </div>
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'16px', display:'flex', flexDirection:'column', gap:10 }}>
        {msgs.length===0 && (
          <div style={{ textAlign:'center', padding:'48px 0', color:DS.t3 }}>
            <div style={{ fontSize:40, marginBottom:12 }}>💬</div>
            <div style={{ fontSize:14, fontFamily:DS.f }}>Send a message to the customer</div>
          </div>
        )}
        {msgs.map((msg,i) => {
          const mine = msg.sender_role==='driver'
          return (
            <div key={i} style={{ display:'flex', justifyContent:mine?'flex-end':'flex-start' }}>
              <div style={{ maxWidth:'78%', background:mine?DS.accentDim:DS.surface2, border:'1px solid '+(mine?DS.accentBdr:DS.border2), borderRadius:mine?'16px 4px 16px 16px':'4px 16px 16px 16px', padding:'10px 14px' }}>
                <div style={{ fontSize:14, color:DS.t1, fontFamily:DS.f, lineHeight:1.4 }}>{msg.content}</div>
                <div style={{ fontSize:10, color:DS.t3, marginTop:4, textAlign:'right' }}>
                  {new Date(msg.created_at).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <div style={{ background:DS.surface, borderTop:'1px solid '+DS.border }}>
        <div style={{ padding:'8px 16px 6px', overflowX:'auto', whiteSpace:'nowrap', display:'flex', gap:6 }}>
          {QUICK_REPLIES.map((qr,i) => (
            <button key={i} onClick={() => send(qr)}
              style={{ display:'inline-block', padding:'6px 12px', background:DS.surface2, border:'1px solid '+DS.border2, borderRadius:99, color:DS.t2, fontSize:12, cursor:'pointer', whiteSpace:'nowrap', fontFamily:DS.f, flexShrink:0 }}>
              {qr}
            </button>
          ))}
        </div>
        <div style={{ display:'flex', gap:10, padding:'8px 16px 20px' }}>
          <input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()}
            placeholder="Message..." maxLength={200}
            style={{ flex:1, padding:'12px 16px', background:DS.surface2, border:'1px solid '+DS.border2, borderRadius:DS.r1, color:DS.t1, fontSize:14, outline:'none', fontFamily:DS.f }} />
          <button onClick={() => send()} disabled={!text.trim()||sending}
            style={{ width:48, height:48, background:text.trim()?DS.accent:DS.surface2, border:'none', borderRadius:DS.r1, color:DS.t1, fontSize:20, cursor:text.trim()?'pointer':'default', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            ➤
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// PHOTO PROOF
// ─────────────────────────────────────────────────────────────
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
      const path = 'deliveries/'+order.id+'_'+Date.now()+'.jpg'
      await supabase.storage.from('delivery-photos').upload(path, blob, { upsert:true })
      await supabase.from('orders').update({ proof_of_delivery:path }).eq('id', order.id)
      toast.success('Photo saved ✓')
    } catch {}
    setUploading(false); onDone()
  }

  return (
    <BottomSheet zIndex={680}>
      <div style={{ textAlign:'center', marginBottom:20 }}>
        <div style={{ fontSize:40, marginBottom:10 }}>📸</div>
        <div style={{ fontFamily:DS.fh, fontSize:22, color:DS.t1, marginBottom:4 }}>Proof of delivery</div>
        <div style={{ fontSize:13, color:DS.t2 }}>Take a photo of the delivered order</div>
      </div>
      {photo ? (
        <div style={{ marginBottom:16 }}>
          <img src={photo} alt="proof" style={{ width:'100%', borderRadius:DS.r2, maxHeight:240, objectFit:'cover', border:'1px solid '+DS.border }} />
          <button onClick={() => setPhoto(null)} style={{ marginTop:8, background:'none', border:'none', color:DS.t3, fontSize:13, cursor:'pointer', width:'100%', fontFamily:DS.f }}>Retake</button>
        </div>
      ) : (
        <button onClick={() => inputRef.current?.click()}
          style={{ width:'100%', padding:'24px', background:DS.accentDim, border:'2px dashed '+DS.accentBdr, borderRadius:DS.r2, color:DS.accent, fontSize:15, fontWeight:700, cursor:'pointer', marginBottom:16, fontFamily:DS.f }}>
          📷 Open camera
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" capture="environment" style={{ display:'none' }}
        onChange={e => { const f=e.target.files?.[0]; if(f){ const r=new FileReader(); r.onload=()=>setPhoto(r.result); r.readAsDataURL(f) } }} />
      {photo && <ActionBtn onClick={upload} disabled={uploading} color={DS.green} style={{ marginBottom:10 }}>{uploading?'Uploading...':'✓ Save & complete'}</ActionBtn>}
      <ActionBtn onClick={onSkip} outline>{photo?'Skip photo':'Skip — no photo'}</ActionBtn>
    </BottomSheet>
  )
}

// ─────────────────────────────────────────────────────────────
// PIN ENTRY
// ─────────────────────────────────────────────────────────────
function PinEntry({ order, onSuccess, onCancel }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPhoto, setShowPhoto] = useState(false)

  const verify = async () => {
    if (pin.length<4) { setError('Enter the 4-digit PIN'); return }
    setLoading(true)
    try {
      if (pin!==String(order.delivery_pin)) { setError('Incorrect PIN — ask the customer again'); setLoading(false); return }
      await updateOrderStatus(order.id,'delivered',{ delivered_at:new Date().toISOString() })
      setShowPhoto(true)
    } catch { setError('Verification failed') }
    setLoading(false)
  }

  if (showPhoto) return <PhotoCapture order={order} onDone={() => { toast.success('Delivery complete! 🎉',{duration:4000}); onSuccess() }} onSkip={() => { toast.success('Delivered! 🎉',{duration:4000}); onSuccess() }} />

  return (
    <BottomSheet zIndex={660} onDismiss={onCancel}>
      <div style={{ textAlign:'center', marginBottom:24 }}>
        <div style={{ width:64, height:64, borderRadius:'50%', background:DS.accentDim, border:'1px solid '+DS.accentBdr, display:'flex', alignItems:'center', justifyContent:'center', fontSize:30, margin:'0 auto 12px' }}>🔐</div>
        <div style={{ fontFamily:DS.fh, fontSize:24, color:DS.t1, marginBottom:4 }}>Delivery PIN</div>
        <div style={{ fontSize:13, color:DS.t2 }}>Ask the customer for their 4-digit code</div>
      </div>

      <div style={{ display:'flex', gap:10, justifyContent:'center', marginBottom:20 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{ width:60, height:70, background: pin[i]?DS.accentDim:DS.surface2, borderRadius:DS.r1, border:'2px solid '+(pin[i]?DS.accent:DS.border2), display:'flex', alignItems:'center', justifyContent:'center', fontSize:32, color:DS.t1, transition:'all 0.15s' }}>
            {pin[i]?'●':''}
          </div>
        ))}
      </div>

      {error && (
        <div style={{ background:DS.redDim, border:'1px solid '+DS.redBdr, borderRadius:DS.r1, padding:'10px 14px', textAlign:'center', color:DS.red, fontSize:13, marginBottom:16, fontFamily:DS.f }}>{error}</div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:16 }}>
        {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((d,i) => (
          <button key={i} onClick={() => { setError(''); if(d==='⌫') setPin(p=>p.slice(0,-1)); else if(d!==''&&pin.length<4) setPin(p=>p+String(d)) }}
            style={{ padding:'18px', background: d==='⌫'?DS.redDim:DS.surface2, border:'1px solid '+(d==='⌫'?DS.redBdr:DS.border2), borderRadius:DS.r1, fontSize:22, fontWeight:600, color:d===''?'transparent':DS.t1, cursor:d===''?'default':'pointer', fontFamily:DS.f, transition:'background 0.1s' }}>
            {d}
          </button>
        ))}
      </div>

      <ActionBtn onClick={verify} disabled={pin.length<4||loading} color={pin.length===4?DS.green:undefined} style={{ marginBottom:10 }}>
        {loading?'Verifying...':'Confirm delivery'}
      </ActionBtn>
      <ActionBtn onClick={onCancel} outline>Cancel</ActionBtn>
    </BottomSheet>
  )
}

// ─────────────────────────────────────────────────────────────
// ISSUE REPORT
// ─────────────────────────────────────────────────────────────
function IssueReport({ order, onClose }) {
  const [type, setType] = useState(null)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const submit = async () => {
    if (!type) { toast.error('Select an issue type'); return }
    setLoading(true)
    try {
      const { supabase } = await import('../../lib/supabase')
      const { useAuthStore } = await import('../../lib/store')
      const user = useAuthStore.getState().user
      await supabase.from('support_tickets').insert({
        user_id:user?.id, order_id:order?.id,
        subject:'Driver issue: '+type,
        message:(ISSUE_TYPES.find(i=>i.id===type)?.label||type)+(notes?'\n\nNotes: '+notes:''),
        status:'open', priority:'high',
      })
      setDone(true)
    } catch { toast.error('Could not submit — call dispatch') }
    setLoading(false)
  }

  if (done) return (
    <BottomSheet zIndex={640} onDismiss={onClose}>
      <div style={{ textAlign:'center', padding:'16px 0 8px' }}>
        <div style={{ fontSize:52, marginBottom:12 }}>✅</div>
        <div style={{ fontFamily:DS.fh, fontSize:22, color:DS.t1, marginBottom:8 }}>Issue reported</div>
        <div style={{ fontSize:14, color:DS.t2, marginBottom:28 }}>Ops team notified — they will respond shortly.</div>
        <ActionBtn onClick={onClose} color={DS.accent}>Back to delivery</ActionBtn>
      </div>
    </BottomSheet>
  )

  return (
    <BottomSheet zIndex={640} onDismiss={onClose} maxH='85vh'>
      <Pill color={DS.red} style={{ marginBottom:14 }}>⚠️ Report issue</Pill>
      <div style={{ fontFamily:DS.fh, fontSize:22, color:DS.t1, marginBottom:16 }}>What is the problem?</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
        {ISSUE_TYPES.map(it => (
          <button key={it.id} onClick={() => setType(it.id)}
            style={{ padding:'14px 10px', background:type===it.id?DS.redDim:DS.surface2, border:'1px solid '+(type===it.id?DS.red:DS.border2), borderRadius:DS.r1, cursor:'pointer', textAlign:'left', transition:'all 0.15s' }}>
            <div style={{ fontSize:22, marginBottom:6 }}>{it.icon}</div>
            <div style={{ fontSize:13, color:type===it.id?DS.red:DS.t2, fontWeight:600, fontFamily:DS.f }}>{it.label}</div>
          </button>
        ))}
      </div>
      <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Additional notes (optional)..." rows={3}
        style={{ width:'100%', padding:'12px', background:DS.surface2, border:'1px solid '+DS.border2, borderRadius:DS.r1, color:DS.t1, fontSize:13, resize:'none', outline:'none', boxSizing:'border-box', marginBottom:14, fontFamily:DS.f }} />
      <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:10 }}>
        <ActionBtn onClick={onClose} outline>Cancel</ActionBtn>
        <ActionBtn onClick={submit} disabled={!type||loading} color={DS.red}>
          {loading?'Submitting...':'Report to ops'}
        </ActionBtn>
      </div>
    </BottomSheet>
  )
}

// ─────────────────────────────────────────────────────────────
// SOS
// ─────────────────────────────────────────────────────────────
function SosPanel({ driverPos, onClose }) {
  const [sent, setSent] = useState(false)
  const sendSOS = async () => {
    try {
      const { supabase } = await import('../../lib/supabase')
      const { useAuthStore } = await import('../../lib/store')
      const user = useAuthStore.getState().user
      const loc = driverPos?'https://maps.google.com/?q='+driverPos[0]+','+driverPos[1]:'Unknown'
      await supabase.from('support_tickets').insert({
        user_id:user?.id, subject:'🚨 SOS — Driver Emergency',
        message:'Driver SOS alert triggered.\nLocation: '+loc, status:'open', priority:'urgent',
      })
      if (navigator.vibrate) navigator.vibrate([500,200,500,200,500])
      setSent(true)
    } catch { toast.error('SOS failed — call +34 971 000 000 immediately') }
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:900, background:'rgba(0,0,0,0.95)', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ width:'100%', maxWidth:340, textAlign:'center' }}>
        {sent ? (
          <>
            <div style={{ fontSize:72, marginBottom:16 }}>🚨</div>
            <div style={{ fontFamily:DS.fh, fontSize:28, color:DS.red, marginBottom:8 }}>SOS Sent</div>
            <div style={{ fontSize:14, color:DS.t2, marginBottom:16 }}>Ops team alerted with your GPS location.</div>
            <div style={{ background:DS.surface, borderRadius:DS.r2, padding:20, marginBottom:24, border:'1px solid '+DS.border }}>
              <div style={{ fontSize:12, color:DS.t3, marginBottom:4 }}>DISPATCH LINE</div>
              <a href="tel:+34971000000" style={{ fontSize:24, fontWeight:800, color:DS.t1, textDecoration:'none', fontFamily:DS.f }}>+34 971 000 000</a>
            </div>
            <ActionBtn onClick={onClose} outline>Close</ActionBtn>
          </>
        ) : (
          <>
            <div style={{ fontSize:72, marginBottom:16 }}>🆘</div>
            <div style={{ fontFamily:DS.fh, fontSize:28, color:DS.t1, marginBottom:8 }}>Emergency SOS</div>
            <div style={{ fontSize:14, color:DS.t2, marginBottom:8 }}>This will alert ops with your GPS location instantly.</div>
            <div style={{ background:DS.yellowDim, border:'1px solid '+DS.yellowBdr, borderRadius:DS.r1, padding:'10px 14px', marginBottom:28, fontSize:13, color:DS.yellow, fontFamily:DS.f }}>
              Only use in a genuine emergency
            </div>
            <button onClick={sendSOS} style={{ width:'100%', padding:'20px', background:DS.red, border:'none', borderRadius:DS.r2, color:DS.t1, fontSize:18, fontWeight:800, cursor:'pointer', marginBottom:12, boxShadow:'0 0 40px rgba(239,68,68,0.5)', fontFamily:DS.f }}>
              🚨 Send SOS alert
            </button>
            <ActionBtn onClick={onClose} outline>Cancel</ActionBtn>
          </>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// NEW ORDER ALERT
// ─────────────────────────────────────────────────────────────
function NewOrderAlert({ order, onAccept, onDecline, loading }) {
  const [countdown, setCountdown] = useState(30)
  useEffect(() => {
    const t = setInterval(() => setCountdown(c => { if(c<=1){ onDecline(); return 0 } return c-1 }), 1000)
    return () => clearInterval(t)
  }, [])

  const dist = order.distance_km ? order.distance_km.toFixed(1)+' km' : '~2 km'

  return (
    <div style={{ position:'fixed', inset:0, zIndex:800, background:'rgba(0,0,0,0.9)', display:'flex', alignItems:'flex-end' }}>
      <div style={{ width:'100%', background:DS.surface, borderRadius:'24px 24px 0 0', padding:'20px 20px calc(32px + env(safe-area-inset-bottom))', borderTop:'2px solid '+DS.green, animation:'slideUp 0.3s ease-out' }}>

        {/* Countdown ring */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <Pill color={DS.green}>🔔 New order</Pill>
          <div style={{ width:52, height:52, borderRadius:'50%', background:countdown>10?DS.greenDim:DS.redDim, border:'2px solid '+(countdown>10?DS.green:DS.red), display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:800, color:countdown>10?DS.green:DS.red, transition:'all 0.5s', fontFamily:DS.f }}>
            {countdown}
          </div>
        </div>

        <div style={{ fontFamily:DS.fh, fontSize:28, color:DS.t1, marginBottom:16 }}>Order #{order.order_number}</div>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:16 }}>
          {[
            { val:'€'+(order.delivery_fee||3.50).toFixed(2), label:'Earnings', color:DS.green },
            { val:dist, label:'Distance', color:DS.blue },
            { val:(order.order_items?.length||'?')+' items', label:'Items', color:DS.yellow },
          ].map(s => (
            <div key={s.label} style={{ background:DS.surface2, borderRadius:DS.r1, padding:'12px 8px', textAlign:'center', border:'1px solid '+DS.border2 }}>
              <div style={{ fontSize:18, fontWeight:800, color:s.color, fontFamily:DS.f }}>{s.val}</div>
              <div style={{ fontSize:10, color:DS.t3, textTransform:'uppercase', letterSpacing:'0.5px', marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Address */}
        <Card style={{ padding:'12px 14px', marginBottom:16 }}>
          <div style={{ fontSize:14, color:DS.t1, marginBottom:4, fontFamily:DS.f }}>📍 {order.delivery_address||'Address pending'}</div>
          {order.what3words && <div style={{ fontSize:12, color:DS.green, fontFamily:DS.f }}>/// {order.what3words}</div>}
          {order.delivery_notes && <div style={{ fontSize:12, color:DS.yellow, marginTop:6, background:DS.yellowDim, borderRadius:6, padding:'6px 8px', border:'1px solid '+DS.yellowBdr }}>📝 {order.delivery_notes}</div>}
        </Card>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:10 }}>
          <ActionBtn onClick={onDecline} color={DS.red} outline>✕ Decline</ActionBtn>
          <ActionBtn onClick={() => onAccept(order)} disabled={loading} color={DS.green}>
            {loading?'Accepting...':'✓ Accept order'}
          </ActionBtn>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// EARNINGS TAB
// ─────────────────────────────────────────────────────────────
function EarningsTab({ stats, isDesktop }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('today')
  const [goal, setGoal] = useState(100)
  const todayEarnings = stats?.earnings || 0
  const goalPct = Math.min(100, (todayEarnings/goal)*100)
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
        const { data } = await supabase.from('driver_earnings').select('*').eq('driver_id',user.id).gte('created_at',from.toISOString()).order('created_at',{ascending:false})
        if (data) setHistory(data)
      } catch {}
      setLoading(false)
    }
    load()
  }, [period])

  const total = history.reduce((s,e) => s+(e.amount||0), 0)

  return (
    <div style={{ padding:isDesktop?24:16, paddingBottom:isDesktop?24:90, maxWidth:isDesktop?900:'none', margin:isDesktop?'0 auto':'0', width:'100%', boxSizing:'border-box', overflowX:'hidden' }}>

      {/* Summary */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
        {[
          { label:"Today's earnings", val:'€'+todayEarnings.toFixed(2), color:DS.green, icon:'💰' },
          { label:'Deliveries today',  val:stats?.deliveries||0,          color:DS.blue,  icon:'📦' },
          { label:'Period total',      val:'€'+total.toFixed(2),          color:DS.yellow,icon:'📊' },
          { label:'Driver rating',     val:(stats?.rating||5.0).toFixed(1)+'★', color:DS.accent, icon:'⭐' },
        ].map(s => (
          <Card key={s.label} style={{ padding:'16px 12px', textAlign:'center' }}>
            <div style={{ fontSize:24, marginBottom:6 }}>{s.icon}</div>
            <div style={{ fontSize:22, fontWeight:800, color:s.color, fontFamily:DS.f }}>{s.val}</div>
            <div style={{ fontSize:10, color:DS.t3, marginTop:4, textTransform:'uppercase', letterSpacing:'0.5px', fontFamily:DS.f }}>{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Goal tracker */}
      <Card style={{ padding:16, marginBottom:12 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <div style={{ fontSize:14, fontWeight:700, color:DS.t1, fontFamily:DS.f }}>🎯 Daily goal</div>
          <div style={{ display:'flex', gap:6 }}>
            {[50,100,150,200].map(g => (
              <button key={g} onClick={() => setGoal(g)}
                style={{ padding:'4px 9px', background:goal===g?DS.accentDim:DS.surface2, border:'1px solid '+(goal===g?DS.accent:DS.border2), borderRadius:99, color:goal===g?DS.accent:DS.t3, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:DS.f }}>
                €{g}
              </button>
            ))}
          </div>
        </div>
        <div style={{ background:DS.border, borderRadius:99, height:8, overflow:'hidden', marginBottom:8 }}>
          <div style={{ height:'100%', borderRadius:99, background:goalPct>=100?DS.green:'linear-gradient(90deg,'+DS.accent+','+DS.yellow+')', width:goalPct+'%', transition:'width 0.6s ease' }} />
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, fontFamily:DS.f }}>
          <span style={{ color:goalPct>=100?DS.green:DS.accent, fontWeight:700 }}>€{todayEarnings.toFixed(2)} earned</span>
          <span style={{ color:DS.t3 }}>€{Math.max(0,goal-todayEarnings).toFixed(2)} to go</span>
        </div>
        {goalPct>=100 && <div style={{ marginTop:10, textAlign:'center', fontSize:13, color:DS.green, fontWeight:700, fontFamily:DS.f }}>🎉 Goal reached!</div>}
      </Card>

      {/* Peak hours */}
      <Card style={{ padding:16, marginBottom:12 }}>
        <div style={{ fontSize:13, fontWeight:700, color:DS.t1, marginBottom:2, fontFamily:DS.f }}>🔥 Ibiza peak hours</div>
        <div style={{ fontSize:11, color:DS.t3, marginBottom:16, fontFamily:DS.f }}>Plan your shift around peak demand</div>
        <div style={{ display:'flex', gap:3, height:72, alignItems:'flex-end' }}>
          {PEAK_HOURS.map(h => {
            const curr = String(currentHour).padStart(2,'0')===h.h
            return (
              <div key={h.h} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                <div style={{ width:'100%', height:(h.v/100*56)+'px', background:curr?DS.green:h.v>80?DS.accent:h.v>50?DS.yellow:DS.border2, borderRadius:'4px 4px 0 0', transition:'height 0.3s' }} />
                <div style={{ fontSize:7, color:curr?DS.green:DS.t3, fontFamily:DS.f, whiteSpace:'nowrap' }}>{h.l}</div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Period filter */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:14 }}>
        {[['today','Today'],['week','This week'],['month','This month']].map(([id,label]) => (
          <button key={id} onClick={() => setPeriod(id)}
            style={{ padding:'10px', background:period===id?DS.accentDim:DS.surface, border:'1px solid '+(period===id?DS.accent:DS.border), borderRadius:DS.r1, color:period===id?DS.accent:DS.t2, fontSize:12, fontWeight:period===id?700:400, cursor:'pointer', fontFamily:DS.f }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ fontSize:11, fontWeight:700, color:DS.t3, textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:12, fontFamily:DS.f }}>Delivery history</div>
      {loading ? <div style={{ textAlign:'center', padding:32, color:DS.t3, fontFamily:DS.f }}>Loading...</div>
        : history.length===0 ? (
          <div style={{ textAlign:'center', padding:'40px 0', color:DS.t3 }}>
            <div style={{ fontSize:40, marginBottom:12 }}>📭</div>
            <div style={{ fontSize:14, fontFamily:DS.f }}>No deliveries in this period</div>
          </div>
        ) : history.map((e,i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', background:DS.surface, borderRadius:DS.r1, marginBottom:8, border:'1px solid '+DS.border }}>
            <div style={{ width:40, height:40, borderRadius:DS.r1, background:DS.greenDim, border:'1px solid '+DS.greenBdr, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>📦</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, color:DS.t1, fontWeight:600, fontFamily:DS.f }}>Order #{e.order_number||e.order_id?.slice(0,6)}</div>
              <div style={{ fontSize:11, color:DS.t3, marginTop:2, fontFamily:DS.f }}>{new Date(e.created_at).toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</div>
            </div>
            <div style={{ fontSize:17, fontWeight:800, color:DS.green, fontFamily:DS.f }}>€{(e.amount||0).toFixed(2)}</div>
          </div>
        ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// PERFORMANCE TAB
// ─────────────────────────────────────────────────────────────
function PerformanceTab({ stats, onShowFeedback, isDesktop }) {
  const [leaderboard, setLeaderboard] = useState([])
  const deliveries = stats?.deliveries||0
  const rating = stats?.rating||5.0

  useEffect(() => {
    const load = async () => {
      try {
        const { supabase } = await import('../../lib/supabase')
        const { useAuthStore } = await import('../../lib/store')
        const user = useAuthStore.getState().user
        const today = new Date(); today.setHours(0,0,0,0)
        const { data } = await supabase.from('driver_earnings').select('driver_id,amount,profiles(full_name)').gte('created_at',today.toISOString())
        if (data) {
          const totals = {}
          data.forEach(e => {
            if (!totals[e.driver_id]) totals[e.driver_id]={ name:e.profiles?.full_name||'Driver', total:0, runs:0 }
            totals[e.driver_id].total += e.amount||0
            totals[e.driver_id].runs++
          })
          setLeaderboard(Object.entries(totals).sort((a,b)=>b[1].total-a[1].total).slice(0,8).map(([id,d],i)=>({id,...d,rank:i+1})))
        }
      } catch {}
    }
    load()
  }, [])

  const metrics = [
    { label:'Acceptance rate', val:'94%',    color:DS.green,  good:true  },
    { label:'Completion rate', val:'98%',    color:DS.green,  good:true  },
    { label:'Avg delivery',    val:'22 min', color:DS.yellow, good:false },
    { label:'Late rate',       val:'2%',     color:DS.green,  good:true  },
    { label:'Rating',          val:rating.toFixed(1)+'★', color:rating>=4.8?DS.green:rating>=4.5?DS.yellow:DS.red, good:rating>=4.8 },
    { label:'Today runs',      val:deliveries, color:DS.blue,  good:true  },
  ]

  const earnedBadges = BADGES.filter(b=>b.req(deliveries,rating))

  return (
    <div style={{ padding:isDesktop?24:16, paddingBottom:isDesktop?24:90, maxWidth:isDesktop?900:'none', margin:isDesktop?'0 auto':'0', width:'100%', boxSizing:'border-box', overflowX:'hidden' }}>

      {/* Metrics */}
      <div style={{ fontSize:11, fontWeight:700, color:DS.t3, textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:12, fontFamily:DS.f }}>Performance</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:20 }}>
        {metrics.map(m => (
          <Card key={m.label} style={{ padding:'14px 12px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:m.good?DS.green:DS.yellow, marginTop:2 }} />
              <div style={{ fontSize:10, color:DS.t3, textTransform:'uppercase', letterSpacing:'0.4px', fontFamily:DS.f }}>{m.label}</div>
            </div>
            <div style={{ fontSize:24, fontWeight:800, color:m.color, fontFamily:DS.f }}>{m.val}</div>
          </Card>
        ))}
      </div>

      {/* Acceptance rate warning */}
      <div style={{ background:DS.greenDim, border:'1px solid '+DS.greenBdr, borderRadius:DS.r1, padding:'12px 14px', marginBottom:20, display:'flex', gap:10, alignItems:'center' }}>
        <span style={{ fontSize:20 }}>✅</span>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:DS.green, fontFamily:DS.f }}>Great acceptance rate</div>
          <div style={{ fontSize:11, color:DS.t2, marginTop:2, fontFamily:DS.f }}>Keep above 80% to maintain priority order routing</div>
        </div>
      </div>

      {/* Badges */}
      <div style={{ fontSize:11, fontWeight:700, color:DS.t3, textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:12, fontFamily:DS.f }}>Achievements</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:20 }}>
        {BADGES.map(b => {
          const earned = b.req(deliveries,rating)
          return (
            <div key={b.id} style={{ background:earned?DS.yellowDim:DS.surface, border:'1px solid '+(earned?DS.yellowBdr:DS.border), borderRadius:DS.r1, padding:'12px 6px', textAlign:'center', opacity:earned?1:0.35, transition:'all 0.2s' }}>
              <div style={{ fontSize:26, marginBottom:4, filter:earned?'none':'grayscale(100%)' }}>{b.icon}</div>
              <div style={{ fontSize:9, color:earned?DS.yellow:DS.t3, fontWeight:700, lineHeight:1.3, fontFamily:DS.f }}>{b.label}</div>
            </div>
          )
        })}
      </div>

      {/* Leaderboard */}
      <button onClick={onShowFeedback} style={{ width:'100%', padding:'14px', background:DS.yellowDim, border:'1px solid '+DS.yellowBdr, borderRadius:DS.r1, color:DS.yellow, fontSize:14, fontWeight:700, cursor:'pointer', marginBottom:20, fontFamily:DS.f, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
        ⭐ View customer feedback & reviews
      </button>

      <div style={{ fontSize:11, fontWeight:700, color:DS.t3, textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:12, fontFamily:DS.f }}>🏆 Today's leaderboard</div>
      {leaderboard.length===0 ? (
        <div style={{ textAlign:'center', padding:'32px 0', color:DS.t3 }}>
          <div style={{ fontSize:36, marginBottom:10 }}>🏁</div>
          <div style={{ fontSize:14, fontFamily:DS.f }}>No data yet today</div>
        </div>
      ) : leaderboard.map((d,i) => (
        <div key={d.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', background:i===0?DS.yellowDim:DS.surface, border:'1px solid '+(i===0?DS.yellowBdr:DS.border), borderRadius:DS.r1, marginBottom:8 }}>
          <div style={{ fontSize:i<3?22:14, fontWeight:800, color:i===0?DS.yellow:i===1?'#C0C0C0':i===2?'#CD7F32':DS.t3, width:28, textAlign:'center', fontFamily:DS.f }}>
            {i===0?'🥇':i===1?'🥈':i===2?'🥉':d.rank}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, color:DS.t1, fontWeight:600, fontFamily:DS.f }}>{d.name}</div>
            <div style={{ fontSize:11, color:DS.t3, fontFamily:DS.f }}>{d.runs} deliveries</div>
          </div>
          <div style={{ fontSize:16, fontWeight:800, color:i===0?DS.yellow:DS.green, fontFamily:DS.f }}>€{d.total.toFixed(2)}</div>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// SETTINGS TAB
// ─────────────────────────────────────────────────────────────
function SettingsTab({ profile, stats, onSignOut, isDesktop }) {
  const [vehicle, setVehicle] = useState('scooter')
  const [notifSound, setNotifSound] = useState(true)
  const [screenLock, setScreenLock] = useState(true)
  const [breakMode, setBreakMode] = useState(false)
  const [speedAlert, setSpeedAlert] = useState(true)
  const [fatigueAlert, setFatigueAlert] = useState(true)

  const toggleBreak = () => { setBreakMode(b=>!b); toast(breakMode?'Back to work! 🛵':'Break started ☕',{duration:3000}) }

  return (
    <div style={{ padding:isDesktop?24:16, paddingBottom:isDesktop?24:90, maxWidth:isDesktop?900:'none', margin:isDesktop?'0 auto':'0', width:'100%', boxSizing:'border-box', overflowX:'hidden' }}>

      {/* Profile card */}
      <Card style={{ padding:20, marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:16 }}>
          <div style={{ width:60, height:60, borderRadius:'50%', background:DS.accentDim, border:'2px solid '+DS.accent, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, flexShrink:0 }}>🛵</div>
          <div>
            <div style={{ fontFamily:DS.fh, fontSize:20, color:DS.t1 }}>{profile?.full_name||'Driver'}</div>
            <div style={{ fontSize:12, color:DS.t3, marginTop:2, fontFamily:DS.f }}>Isla Drop · Ibiza</div>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', background:DS.surface2, borderRadius:DS.r1, padding:'12px 0', border:'1px solid '+DS.border2 }}>
          {[
            { val:stats?.deliveries||0, label:'Deliveries', color:DS.green },
            { val:(stats?.rating||5.0).toFixed(1)+'★', label:'Rating', color:DS.yellow },
            { val:'€'+(stats?.earnings||0).toFixed(0), label:'Today', color:DS.accent },
          ].map((s,i) => (
            <div key={s.label} style={{ textAlign:'center', borderRight:i<2?'1px solid '+DS.border2:'none' }}>
              <div style={{ fontSize:20, fontWeight:800, color:s.color, fontFamily:DS.f }}>{s.val}</div>
              <div style={{ fontSize:9, color:DS.t3, textTransform:'uppercase', marginTop:2, fontFamily:DS.f }}>{s.label}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Vehicle */}
      <div style={{ fontSize:11, fontWeight:700, color:DS.t3, textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:10, fontFamily:DS.f }}>Vehicle type</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:16 }}>
        {[['scooter','🛵','Scooter'],['car','🚗','Car'],['ebike','🚲','E-bike']].map(([id,icon,label]) => (
          <button key={id} onClick={() => setVehicle(id)}
            style={{ padding:'14px 6px', background:vehicle===id?DS.accentDim:DS.surface, border:'1px solid '+(vehicle===id?DS.accent:DS.border), borderRadius:DS.r1, cursor:'pointer', textAlign:'center', transition:'all 0.15s' }}>
            <div style={{ fontSize:24, marginBottom:4 }}>{icon}</div>
            <div style={{ fontSize:12, color:vehicle===id?DS.accent:DS.t2, fontWeight:vehicle===id?700:400, fontFamily:DS.f }}>{label}</div>
          </button>
        ))}
      </div>

      {/* Break mode */}
      <button onClick={toggleBreak} style={{ width:'100%', padding:14, background:breakMode?DS.purpleDim||'rgba(168,85,247,0.12)':DS.surface, border:'1px solid '+(breakMode?DS.purple:DS.border), borderRadius:DS.r1, color:breakMode?DS.purple:DS.t1, fontSize:14, fontWeight:600, cursor:'pointer', marginBottom:16, fontFamily:DS.f, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
        {breakMode?'☕ On break — tap to return':'☕ Take a break'}
      </button>

      {/* Toggle settings */}
      <div style={{ fontSize:11, fontWeight:700, color:DS.t3, textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:10, fontFamily:DS.f }}>Preferences</div>
      {[
        { label:'Order notification sound', sub:'Alert tone when new order arrives', val:notifSound, fn:()=>setNotifSound(v=>!v), icon:'🔔' },
        { label:'Keep screen on', sub:'Prevents lock during deliveries', val:screenLock, fn:()=>setScreenLock(v=>!v), icon:'📱' },
        { label:'Speed alert (80 km/h)', sub:'Warning when riding too fast', val:speedAlert, fn:()=>setSpeedAlert(v=>!v), icon:'⚡' },
        { label:'Fatigue reminder', sub:'Break reminder after 4 hours online', val:fatigueAlert, fn:()=>setFatigueAlert(v=>!v), icon:'😴' },
      ].map(item => (
        <div key={item.label} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px', background:DS.surface, borderRadius:DS.r1, marginBottom:8, border:'1px solid '+DS.border }}>
          <span style={{ fontSize:20, flexShrink:0 }}>{item.icon}</span>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:14, color:DS.t1, fontWeight:500, fontFamily:DS.f }}>{item.label}</div>
            <div style={{ fontSize:11, color:DS.t3, marginTop:2, fontFamily:DS.f }}>{item.sub}</div>
          </div>
          <Toggle val={item.val} onToggle={item.fn} />
        </div>
      ))}

      {/* Info */}
      <div style={{ fontSize:11, fontWeight:700, color:DS.t3, textTransform:'uppercase', letterSpacing:'0.8px', margin:'20px 0 10px', fontFamily:DS.f }}>Support</div>
      {[
        { icon:'🌴', label:'Zone', value:'Ibiza Island' },
        { icon:'📞', label:'Dispatch', value:'+34 971 000 000' },
        { icon:'🕐', label:'Hours', value:'08:00 – 06:00 daily' },
        { icon:'📱', label:'Version', value:'Isla Drop Driver 4.0' },
      ].map(item => (
        <div key={item.label} style={{ display:'flex', alignItems:'center', gap:14, padding:14, background:DS.surface, borderRadius:DS.r1, marginBottom:8, border:'1px solid '+DS.border }}>
          <span style={{ fontSize:18, flexShrink:0 }}>{item.icon}</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:10, color:DS.t3, textTransform:'uppercase', letterSpacing:'0.5px', fontFamily:DS.f }}>{item.label}</div>
            <div style={{ fontSize:14, color:DS.t1, fontWeight:500, marginTop:2, fontFamily:DS.f }}>{item.value}</div>
          </div>
        </div>
      ))}

      <div style={{ fontSize:11, fontWeight:700, color:DS.t3, textTransform:'uppercase', letterSpacing:'0.8px', margin:'20px 0 10px', fontFamily:DS.f }}>Finance</div>
      <button onClick={() => setShowExpenses(true)} style={{ width:'100%', display:'flex', alignItems:'center', gap:14, padding:14, background:DS.surface, borderRadius:DS.r1, marginBottom:8, border:'1px solid '+DS.border, cursor:'pointer' }}><span style={{ fontSize:20, flexShrink:0 }}>💰</span><div style={{ flex:1, textAlign:'left' }}><div style={{ fontSize:13, color:DS.t1, fontWeight:500, fontFamily:DS.f }}>Expenses and tips</div><div style={{ fontSize:11, color:DS.t3, marginTop:2, fontFamily:DS.f }}>Log cash tips and fuel costs</div></div><span style={{ color:DS.t3, fontSize:14 }}>›</span></button>
      <button onClick={() => setShowPayslip(true)} style={{ width:'100%', display:'flex', alignItems:'center', gap:14, padding:14, background:DS.surface, borderRadius:DS.r1, marginBottom:8, border:'1px solid '+DS.border, cursor:'pointer' }}><span style={{ fontSize:20, flexShrink:0 }}>📄</span><div style={{ flex:1, textAlign:'left' }}><div style={{ fontSize:13, color:DS.t1, fontWeight:500, fontFamily:DS.f }}>Weekly payslip</div><div style={{ fontSize:11, color:DS.t3, marginTop:2, fontFamily:DS.f }}>Download earnings statement</div></div><span style={{ color:DS.t3, fontSize:14 }}>›</span></button>

      <div style={{ fontSize:11, fontWeight:700, color:DS.t3, textTransform:'uppercase', letterSpacing:'0.8px', margin:'20px 0 10px', fontFamily:DS.f }}>Safety</div>
      <button onClick={() => setShowIncident(true)} style={{ width:'100%', display:'flex', alignItems:'center', gap:14, padding:14, background:DS.surface, borderRadius:DS.r1, marginBottom:8, border:'1px solid '+DS.border, cursor:'pointer' }}><span style={{ fontSize:20, flexShrink:0 }}>🚨</span><div style={{ flex:1, textAlign:'left' }}><div style={{ fontSize:13, color:DS.t1, fontWeight:500, fontFamily:DS.f }}>Report incident</div><div style={{ fontSize:11, color:DS.t3, marginTop:2, fontFamily:DS.f }}>Accidents, near misses, theft</div></div><span style={{ color:DS.t3, fontSize:14 }}>›</span></button>
      <button onClick={() => setShowNotifSetup(true)} style={{ width:'100%', display:'flex', alignItems:'center', gap:14, padding:14, background:DS.surface, borderRadius:DS.r1, marginBottom:8, border:'1px solid '+DS.border, cursor:'pointer' }}><span style={{ fontSize:20, flexShrink:0 }}>🔔</span><div style={{ flex:1, textAlign:'left' }}><div style={{ fontSize:13, color:DS.t1, fontWeight:500, fontFamily:DS.f }}>Push notifications</div><div style={{ fontSize:11, color:DS.t3, marginTop:2, fontFamily:DS.f }}>Get order alerts in background</div></div><span style={{ color:DS.t3, fontSize:14 }}>›</span></button>
      <button onClick={() => setAppLocked(true)} style={{ width:'100%', display:'flex', alignItems:'center', gap:14, padding:14, background:DS.surface, borderRadius:DS.r1, marginBottom:8, border:'1px solid '+DS.border, cursor:'pointer' }}><span style={{ fontSize:20, flexShrink:0 }}>🔒</span><div style={{ flex:1, textAlign:'left' }}><div style={{ fontSize:13, color:DS.t1, fontWeight:500, fontFamily:DS.f }}>App lock</div><div style={{ fontSize:11, color:DS.t3, marginTop:2, fontFamily:DS.f }}>PIN protect the driver app</div></div><span style={{ color:DS.t3, fontSize:14 }}>›</span></button>

      <button onClick={onSignOut} style={{ width:'100%', marginTop:12, padding:14, background:DS.redDim, border:'1px solid '+DS.redBdr, borderRadius:DS.r1, color:DS.red, fontSize:15, fontWeight:600, cursor:'pointer', fontFamily:DS.f }}>
        🚪 Sign out
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MAIN DRIVER APP
// ─────────────────────────────────────────────────────────────
export default function DriverApp() {
  const { user, profile, clear } = useAuthStore()
  const { isOnline, currentOrder, availableOrders, stats,
          setOnline, setCurrentOrder, setAvailableOrders, updateLocation } = useDriverStore()

  const [activeTab, setActiveTab]     = useState('home')
  const { canInstall, install }         = usePWAInstall()
  const { isOffline, getCachedOrder }   = useOfflineMode(currentOrder)
  const { updateAvailable, refresh }    = useAppUpdate()
  const [showPin, setShowPin]         = useState(false)
  const [showMap, setShowMap]         = useState(false)
  const [showChat, setShowChat]       = useState(false)
  const [showIssue, setShowIssue]     = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [showSignature, setShowSignature] = useState(false)
  const [showExpenses, setShowExpenses] = useState(false)
  const [showPayslip, setShowPayslip] = useState(false)
  const [showIncident, setShowIncident] = useState(false)
  const [showBonus, setShowBonus]     = useState(false)
  const [showHeatmap, setShowHeatmap] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showNotifSetup, setShowNotifSetup] = useState(false)
  const [showDispatch, setShowDispatch] = useState(false)
  const [appLocked, setAppLocked]     = useState(false)
  const [dispatchUnread, setDispatchUnread] = useState(0)
  const [showFeedback, setShowFeedback]   = useState(false)
  const [showVoice, setShowVoice]         = useState(false)
  const [showEmergency, setShowEmergency] = useState(false)
  const [showCrashAlert, setShowCrashAlert] = useState(false)
  const [showPWABanner, setShowPWABanner] = useState(true)
  const [gpsAccuracy, setGpsAccuracy]     = useState(null)
  const [multiOrders, setMultiOrders]     = useState([])
  const [activeOrderIdx, setActiveOrderIdx] = useState(0)
  const [showSOS, setShowSOS]         = useState(false)
  const [accepting, setAccepting]     = useState(false)
  const [driverPos, setDriverPos]     = useState(null)
  const [newOrder, setNewOrder]       = useState(null)
  const [shiftStart, setShiftStart]   = useState(null)
  const [shiftSecs, setShiftSecs]     = useState(0)
  const [orderTimer, setOrderTimer]   = useState(0)
  const shiftRef = useRef(null)

  // Shift timer
  useEffect(() => {
    if (!isOnline) { clearInterval(shiftRef.current); setShiftStart(null); setShiftSecs(0); return }
    const t0 = Date.now()
    setShiftStart(t0)
    shiftRef.current = setInterval(() => setShiftSecs(Math.floor((Date.now()-t0)/1000)), 1000)
    return () => clearInterval(shiftRef.current)
  }, [isOnline])

  // Order elapsed timer
  useEffect(() => {
    if (!currentOrder) { setOrderTimer(0); return }
    const start = new Date(currentOrder.created_at).getTime()
    const t = setInterval(() => setOrderTimer(Math.floor((Date.now()-start)/1000)), 1000)
    return () => clearInterval(t)
  }, [currentOrder])

  // Fatigue alert
  useEffect(() => {
    if (!isOnline) return
    const t = setTimeout(() => toast('⏸ You have been online for 4 hours. Consider taking a short break.', { duration:8000, icon:'😴' }), 4*60*60*1000)
    return () => clearTimeout(t)
  }, [isOnline])

  const loadOrders = useCallback(async () => {
    if (!isOnline||!user) return
    try { const orders = await getAvailableOrders(); setAvailableOrders(orders||[]) } catch {}
  }, [isOnline, user])

  const toggleOnline = async () => {
    const next = !isOnline
    setOnline(next)
    if (user) await setDriverOnlineStatus(user.id, next).catch(()=>{})
    if (next) {
      loadOrders()
      toast.success('You are ONLINE',{duration:3000})
      // Setup push notifications on first go-online
      if (Notification?.permission === 'default') setupPushNotifications()
    } else toast('You are offline',{duration:3000})
  }

  const handleAccept = async (order) => {
    haptic.success()
    setAccepting(true); setNewOrder(null)
    try {
      await acceptOrder(order.id, user.id)
      setCurrentOrder({...order, status:'assigned'})
      setAvailableOrders([])
      setActiveTab('home')
      toast.success('Order accepted — head to warehouse 🏪',{duration:4000})
    } catch (err) { toast.error('Could not accept: '+(err.message||'try again')) }
    setAccepting(false)
  }

  const handleAdvance = async () => {
    haptic.medium()
    if (!currentOrder) return
    const cfg = STATUS_CONFIG[currentOrder.status]
    if (!cfg?.next) return
    try {
      await updateOrderStatus(currentOrder.id, cfg.next)
      setCurrentOrder({...currentOrder, status:cfg.next})
      const msgs = { warehouse_confirmed:'Items collected ✅ Head to the customer!', en_route:'On your way 🛵 Customer notified.' }
      if (msgs[cfg.next]) toast.success(msgs[cfg.next],{duration:3000})
    } catch { toast.error('Update failed — try again') }
  }

  useEffect(() => {
    if (!isOnline||!user) return
    loadOrders()
    const sub = subscribeToAvailableOrders(order => {
      if (!currentOrder) {
        setNewOrder(order)
        if (navigator.vibrate) navigator.vibrate([200,100,200,100,200])
        sendPushNotification(order)
      }
    })
    const iv = setInterval(loadOrders, 20000)
    return () => { sub?.unsubscribe?.(); clearInterval(iv) }
  }, [isOnline, user, currentOrder])

  // GPS + proximity alert
  useEffect(() => {
    if (!isOnline||!user) return
    let alertedProximity = false
    const wid = navigator.geolocation?.watchPosition(async pos => {
      const { latitude:lat, longitude:lng } = pos.coords
      setDriverPos([lat,lng])
      updateLocation(lat,lng)
      updateDriverLocation(user.id,lat,lng).catch(()=>{})

      // Speed alert (approximate from consecutive positions)
      // Proximity alert — 2 min away
      if (currentOrder?.delivery_lat && !alertedProximity && ['en_route'].includes(currentOrder.status)) {
        const R=6371, dLat=(currentOrder.delivery_lat-lat)*Math.PI/180, dLng=(currentOrder.delivery_lng-lng)*Math.PI/180
        const a=Math.sin(dLat/2)**2+Math.cos(lat*Math.PI/180)*Math.cos(currentOrder.delivery_lat*Math.PI/180)*Math.sin(dLng/2)**2
        const dist=R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))
        if (dist < 0.3) {
          alertedProximity = true
          toast('📍 Almost there — 300m away!',{duration:4000})
          // Auto-notify customer
          try {
            const { supabase } = await import('../../lib/supabase')
            await supabase.from('order_messages').insert({ order_id:currentOrder.id, sender_id:user.id, sender_role:'driver', content:'I am almost at your location — see you in 2 minutes! 🛵' })
          } catch {}
        }
      }

      if (currentOrder && ['warehouse_confirmed','en_route'].includes(currentOrder.status)) {
        try {
          const { supabase } = await import('../../lib/supabase')
          const { calculateETA } = await import('../../lib/eta')
          const eta = calculateETA({ driverLat:lat, driverLng:lng, orderStatus:currentOrder.status, deliveryLat:currentOrder.delivery_lat, deliveryLng:currentOrder.delivery_lng })
          await supabase.from('orders').update({ driver_lat:lat, driver_lng:lng, eta_minutes:eta?.totalMins||null }).eq('id',currentOrder.id)
        } catch {}
      }
    }, null, { enableHighAccuracy:true, maximumAge:5000, timeout:10000 })
    return () => { if (wid) navigator.geolocation?.clearWatch(wid) }
  }, [isOnline, user, currentOrder])

  // Crash detection
  useCrashDetection({
    enabled: isOnline,
    driverPos,
    onCrash: () => {
      haptic.error()
      setShowCrashAlert(true)
    }
  })

  const cfg = currentOrder ? STATUS_CONFIG[currentOrder.status] : null
  const name = profile?.full_name?.split(' ')[0] || 'Driver'
  const ageCheck = currentOrder ? hasAgeRestricted(currentOrder) : false

  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768)
  useEffect(() => {
    const handle = () => setIsDesktop(window.innerWidth >= 768)
    window.addEventListener('resize', handle)
    return () => window.removeEventListener('resize', handle)
  }, [])

  const TABS = [
    { id:'home',        icon:'🏠', label:'Home' },
    { id:'earnings',    icon:'💰', label:'Earnings' },
    { id:'performance', icon:'📊', label:'Stats' },
    { id:'settings',    icon:'⚙️', label:'Settings' },
  ]

  const globalStyles = "@keyframes slideUp{from{transform:translateY(40px);opacity:0}to{transform:translateY(0);opacity:1}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}} *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}"

  return (
    <div style={{ minHeight:'100vh', background:DS.bg, color:DS.t1, fontFamily:DS.f, display:'flex', overflow:'hidden', width:'100%' }}>

      {/* ── OVERLAYS ── */}
      {showMap   && currentOrder && <DeliveryMap order={currentOrder} driverPos={driverPos} onClose={() => setShowMap(false)} />}
      {showChat  && currentOrder && <CustomerChat order={currentOrder} driverId={user?.id} onClose={() => setShowChat(false)} />}
      {showPin   && currentOrder && <PinEntry order={currentOrder} onSuccess={() => { setShowPin(false); setCurrentOrder(null); setActiveTab('home') }} onCancel={() => setShowPin(false)} />}
      {showIssue && currentOrder && <IssueReport order={currentOrder} onClose={() => setShowIssue(false)} />}
      {showSOS        && <SosPanel driverPos={driverPos} onClose={() => setShowSOS(false)} />}
      {showScanner    && currentOrder && <BarcodeScanner order={currentOrder} onComplete={() => { setShowScanner(false); toast.success('Items verified! Start delivery 🛵') }} onClose={() => setShowScanner(false)} />}
      {showSignature  && currentOrder && <SignaturePad order={currentOrder} onComplete={() => setShowSignature(false)} onSkip={() => setShowSignature(false)} />}
      {showExpenses   && <ExpenseLogger onClose={() => setShowExpenses(false)} />}
      {showPayslip    && <PayslipGenerator profile={profile} onClose={() => setShowPayslip(false)} />}
      {showIncident   && <IncidentReport driverPos={driverPos} onClose={() => setShowIncident(false)} />}
      {showBonus      && <BonusTracker stats={stats} onClose={() => setShowBonus(false)} />}
      {showHeatmap    && <ZoneHeatmap onClose={() => setShowHeatmap(false)} />}
      {showHistory    && <RouteHistory onClose={() => setShowHistory(false)} />}
      {showNotifSetup && <NotificationSetup onClose={() => setShowNotifSetup(false)} />}
      {showDispatch   && <DispatchMessages driverId={user?.id} onClose={() => { setShowDispatch(false); setDispatchUnread(0) }} />}
      {appLocked        && <AppLock onUnlock={() => setAppLocked(false)} />}
      {showCrashAlert   && <CrashAlert driverPos={driverPos} onDismiss={() => { haptic.light(); setShowCrashAlert(false) }} onConfirmSOS={() => { setShowCrashAlert(false); setShowSOS(true) }} />}
      {showFeedback     && <CustomerFeedback onClose={() => setShowFeedback(false)} />}
      {showVoice && currentOrder && <VoiceMessage order={currentOrder} driverId={user?.id} onClose={() => setShowVoice(false)} />}
      {showEmergency    && <EmergencyCall onClose={() => setShowEmergency(false)} />}
      {newOrder  && !currentOrder && <NewOrderAlert order={newOrder} onAccept={handleAccept} onDecline={() => setNewOrder(null)} loading={accepting} />}

      {/* ── DESKTOP SIDEBAR (768px+) ── */}
      {isDesktop && (
        <div style={{ width:240, flexShrink:0, background:DS.surface, borderRight:'1px solid '+DS.border, display:'flex', flexDirection:'column', position:'sticky', top:0, height:'100vh', overflowY:'auto' }}>
          {/* Logo */}
          <div style={{ padding:'24px 20px 20px', borderBottom:'1px solid '+DS.border }}>
            <div style={{ fontFamily:DS.fh, fontSize:22, color:DS.t1 }}>Isla Drop</div>
            <div style={{ fontSize:11, color:DS.t3, marginTop:2, fontFamily:DS.f }}>Driver Dashboard</div>
          </div>

          {/* Driver info */}
          <div style={{ padding:'16px 20px', borderBottom:'1px solid '+DS.border }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:40, height:40, borderRadius:'50%', background:DS.accentDim, border:'1px solid '+DS.accentBdr, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>🛵</div>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:DS.t1, fontFamily:DS.f }}>{profile?.full_name||'Driver'}</div>
                <div style={{ fontSize:11, color:isOnline?DS.green:DS.t3, display:'flex', alignItems:'center', gap:4, marginTop:2 }}>
                  <div style={{ width:6, height:6, borderRadius:'50%', background:isOnline?DS.green:DS.border2 }} />
                  {isOnline ? 'Online' : 'Offline'}
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div style={{ padding:'12px 20px', borderBottom:'1px solid '+DS.border }}>
            {[
              { icon:'💰', val:'€'+(stats?.earnings||0).toFixed(0), label:'Today' },
              { icon:'📦', val:stats?.deliveries||0, label:'Deliveries' },
              { icon:'⭐', val:(stats?.rating||5.0).toFixed(1), label:'Rating' },
              { icon:'🕐', val:fmt(shiftSecs).slice(0,5), label:'Shift' },
            ].map(s => (
              <div key={s.label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid '+DS.border }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:14 }}>{s.icon}</span>
                  <span style={{ fontSize:12, color:DS.t2, fontFamily:DS.f }}>{s.label}</span>
                </div>
                <span style={{ fontSize:13, fontWeight:700, color:DS.t1, fontFamily:DS.f }}>{s.val}</span>
              </div>
            ))}
          </div>

          {/* Nav links */}
          <nav style={{ flex:1, padding:'8px 0' }}>
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id); haptic.light() }}
                style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'12px 20px', background:activeTab===tab.id?DS.accentDim:'transparent', border:'none', borderLeft:'3px solid '+(activeTab===tab.id?DS.accent:'transparent'), cursor:'pointer', transition:'all 0.15s' }}>
                <span style={{ fontSize:18 }}>{tab.icon}</span>
                <span style={{ fontSize:14, color:activeTab===tab.id?DS.accent:DS.t2, fontWeight:activeTab===tab.id?700:400, fontFamily:DS.f }}>{tab.label}</span>
              </button>
            ))}
          </nav>

          {/* Online toggle */}
          <div style={{ padding:'16px 20px', borderTop:'1px solid '+DS.border }}>
            <button onClick={toggleOnline} style={{ width:'100%', padding:'11px', background:isOnline?DS.greenDim:DS.accentDim, border:'1px solid '+(isOnline?DS.greenBdr:DS.accentBdr), borderRadius:DS.r1, color:isOnline?DS.green:DS.accent, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:DS.f }}>
              {isOnline ? '● Go offline' : '○ Go online'}
            </button>
            <button onClick={() => setShowSOS(true)} style={{ width:'100%', marginTop:8, padding:'11px', background:DS.redDim, border:'1px solid '+DS.redBdr, borderRadius:DS.r1, color:DS.red, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:DS.f }}>
              🆘 SOS Emergency
            </button>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT COLUMN ── */}
      <div style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column', overflow:'hidden', width:0 }}>

      {/* Status bar */}
      <StatusBar gpsAccuracy={gpsAccuracy} isOffline={isOffline} />

      {/* ── HEADER ── */}
      <div style={{ background:DS.surface, borderBottom:'1px solid '+DS.border, padding:'14px 16px 12px' }}>
        {/* Row 1: Name */}
        <div style={{ marginBottom:10 }}>
          <div style={{ fontFamily:DS.fh, fontSize:22, color:DS.t1 }}>Hey, {name} 👋</div>
          <div style={{ fontSize:12, color:isOnline?DS.green:DS.t3, marginTop:3, display:'flex', alignItems:'center', gap:5 }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background:isOnline?DS.green:DS.border2, flexShrink:0 }} />
            {isOnline ? 'Online · '+fmt(shiftSecs) : 'Offline · tap to go online'}
          </div>
        </div>
        {/* Row 2: Action buttons */}
        <div style={{ display:'flex', gap:8, width:'100%' }}>
          <button onClick={() => setShowSOS(true)}
            style={{ flex:1, height:38, borderRadius:DS.r1, background:DS.redDim, border:'1px solid '+DS.redBdr, color:DS.red, fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
            🆘 SOS
          </button>
          <button onClick={toggleOnline}
            style={{ flex:2, height:38, borderRadius:DS.r1, background:isOnline?DS.greenDim:DS.accentDim, border:'1px solid '+(isOnline?DS.greenBdr:DS.accentBdr), color:isOnline?DS.green:DS.accent, fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
            {isOnline ? '● Go offline' : '○ Go online'}
          </button>
          <button onClick={() => setShowEmergency(true)}
            style={{ flex:1, height:38, borderRadius:DS.r1, background:DS.redDim, border:'1px solid '+DS.redBdr, color:DS.red, fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
            🚑 112
          </button>
        </div>
      </div>

        {/* Stats strip */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', borderTop:'1px solid '+DS.border }}>
          {[
            { icon:'💰', val:'€'+(stats?.earnings||0).toFixed(0), label:'Today' },
            { icon:'📦', val:stats?.deliveries||0,                 label:'Runs' },
            { icon:'⭐', val:(stats?.rating||5.0).toFixed(1),      label:'Rating' },
            { icon:'🕐', val:fmt(shiftSecs).slice(0,5),            label:'Shift' },
          ].map(s => (
            <div key={s.label} style={{ padding:'10px 4px', textAlign:'center' }}>
              <div style={{ fontSize:14, marginBottom:2 }}>{s.icon}</div>
              <div style={{ fontSize:16, fontWeight:800, color:DS.t1, lineHeight:1 }}>{s.val}</div>
              <div style={{ fontSize:9, color:DS.t3, textTransform:'uppercase', letterSpacing:'0.4px', marginTop:3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── HOME TAB ── */}
      {activeTab==='home' && (
        <div style={{ padding:isDesktop?24:16, paddingBottom:isDesktop?24:90, maxWidth:isDesktop?900:'none', margin:isDesktop?'0 auto':'0', width:'100%', boxSizing:'border-box', overflowX:'hidden' }}>

          {/* Weather + quick actions */}
          <div style={{ marginBottom:12 }}>
            <WeatherWidget />
          </div>

          {/* Quick action bar */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6, marginBottom:16 }}>
            {[
              { icon:'📍', label:'Demand', action:()=>setShowHeatmap(true), color:DS.blue },
              { icon:'🎯', label:'Bonuses', action:()=>setShowBonus(true), color:DS.yellow },
              { icon:'📢', label:'Dispatch'+(dispatchUnread>0?' ('+dispatchUnread+')':''), action:()=>setShowDispatch(true), color:DS.purple },
              { icon:'📊', label:'Insights', action:()=>setShowHistory(true), color:DS.teal },
            ].map(qa => (
              <button key={qa.label} onClick={qa.action} style={{ padding:'10px 4px', background:DS.surface, border:'1px solid '+DS.border, borderRadius:DS.r1, cursor:'pointer', textAlign:'center' }}>
                <div style={{ fontSize:18, marginBottom:3 }}>{qa.icon}</div>
                <div style={{ fontSize:9, color:qa.color, fontWeight:600, fontFamily:DS.f, lineHeight:1.2 }}>{qa.label}</div>
              </button>
            ))}
          </div>

          {/* PWA install banner */}
          {canInstall && showPWABanner && <PWAInstallBanner onInstall={() => { install(); setShowPWABanner(false) }} onDismiss={() => setShowPWABanner(false)} />}

          {/* Update banner */}
          {updateAvailable && <UpdateBanner onUpdate={refresh} onDismiss={() => {}} />}

          {/* Offline banner */}
          {isOffline && <OfflineBanner />}

          {/* Earnings forecast */}
          {isOnline && (stats?.deliveries||0) > 0 && <EarningsForecast stats={stats} shiftSecs={shiftSecs} />}

          {/* Streak badge */}
          <StreakBadge />

          {/* Multi-order panel */}
          {multiOrders.length > 1 && <MultiOrderPanel orders={multiOrders} activeOrderIndex={activeOrderIdx} onSwitch={setActiveOrderIdx} onClose={() => setMultiOrders([])} />}

          {/* Active order card */}
          {currentOrder && cfg && (
            <Card accent={cfg.color} style={{ marginBottom:16 }}>

              {/* Status header */}
              <div style={{ background:cfg.color+'14', borderBottom:'1px solid '+cfg.color+'30', padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <Pill color={cfg.color}>{cfg.icon} {cfg.label}</Pill>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:12, color:DS.t3 }}>#{currentOrder.order_number}</div>
                  <div style={{ fontSize:12, color:orderTimer>1800?DS.red:orderTimer>900?DS.yellow:DS.t3, fontWeight:orderTimer>900?700:400, marginTop:1 }}>
                    ⏱ {fmtShort(orderTimer)}
                  </div>
                </div>
              </div>

              {/* Progress stepper */}
              <div style={{ padding:'16px 16px 12px', display:'flex', alignItems:'center' }}>
                {STEPS.map((step,i) => {
                  const curr = STEPS.indexOf(currentOrder.status)
                  const done = i<curr, active = i===curr
                  return (
                    <div key={step} style={{ display:'flex', alignItems:'center', flex:i<STEPS.length-1?1:0 }}>
                      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                        <div style={{ width:30, height:30, borderRadius:'50%', background:done?DS.green:active?cfg.color:DS.border2, border:'2px solid '+(done?DS.green:active?cfg.color:DS.border2), display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color:done||active?'#0D0D0D':DS.t3, transition:'all 0.3s' }}>
                          {done?'✓':i+1}
                        </div>
                        <div style={{ fontSize:8, color:active?cfg.color:done?DS.green:DS.t3, textTransform:'uppercase', letterSpacing:'0.3px', whiteSpace:'nowrap' }}>{STEP_LABELS[i]}</div>
                      </div>
                      {i<STEPS.length-1 && <div style={{ flex:1, height:2, background:done?DS.green:DS.border2, margin:'0 4px', marginBottom:14, transition:'background 0.3s' }} />}
                    </div>
                  )
                })}
              </div>

              <div style={{ padding:'0 16px 16px' }}>
                {/* Address */}
                <div style={{ fontSize:16, fontWeight:700, color:DS.t1, marginBottom:4 }}>📍 {currentOrder.delivery_address||'Delivery address'}</div>
                {currentOrder.what3words && <div style={{ fontSize:13, color:DS.green, marginBottom:8, fontFamily:DS.f }}>/// {currentOrder.what3words}</div>}

                {/* Delivery notes */}
                {currentOrder.delivery_notes && (
                  <div style={{ background:DS.yellowDim, border:'1px solid '+DS.yellowBdr, borderRadius:DS.r1, padding:'10px 12px', marginBottom:12, display:'flex', gap:8, alignItems:'flex-start' }}>
                    <span style={{ fontSize:16, flexShrink:0 }}>📝</span>
                    <span style={{ fontSize:13, color:DS.yellow, lineHeight:1.4 }}>{currentOrder.delivery_notes}</span>
                  </div>
                )}

                {/* Items */}
                <div style={{ background:DS.surface2, borderRadius:DS.r1, padding:'12px', marginBottom:14, border:'1px solid '+DS.border2 }}>
                  <div style={{ fontSize:10, color:DS.t3, textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:8 }}>Items to deliver</div>
                  {(currentOrder.order_items||[]).map((item,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:i<(currentOrder.order_items.length-1)?6:0 }}>
                      <span style={{ fontSize:12, color:DS.t3, minWidth:20 }}>×{item.quantity||1}</span>
                      <span style={{ fontSize:13, color:DS.t1, flex:1 }}>{item.product?.name||item.products?.name||'Item'}</span>
                      {(item.product?.age_restricted||item.products?.age_restricted) && (
                        <span style={{ fontSize:10, color:DS.red, fontWeight:700, background:DS.redDim, borderRadius:4, padding:'1px 6px', border:'1px solid '+DS.redBdr }}>18+</span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Age check */}
                {ageCheck && currentOrder.status==='en_route' && (
                  <div style={{ background:DS.redDim, border:'1px solid '+DS.redBdr, borderRadius:DS.r1, padding:'12px 14px', marginBottom:14, display:'flex', gap:10, alignItems:'center' }}>
                    <span style={{ fontSize:22, flexShrink:0 }}>🪪</span>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:DS.red }}>ID check required</div>
                      <div style={{ fontSize:11, color:DS.t2, marginTop:2 }}>Order contains age-restricted items. Check ID before handing over.</div>
                    </div>
                  </div>
                )}

                {/* PIN display */}
                {currentOrder.status==='en_route' && currentOrder.delivery_pin && (
                  <div style={{ background:DS.accentDim, border:'1px solid '+DS.accentBdr, borderRadius:DS.r1, padding:'14px', marginBottom:14, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div>
                      <div style={{ fontSize:10, color:DS.t3, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>Customer PIN</div>
                      <div style={{ fontSize:32, fontWeight:900, color:DS.t1, letterSpacing:12, fontFamily:DS.f }}>{currentOrder.delivery_pin}</div>
                    </div>
                    <div style={{ fontSize:32 }}>🔐</div>
                  </div>
                )}

                {/* Primary actions */}
                <div style={{ display:'grid', gridTemplateColumns:cfg.next?'1fr 1fr 2fr':'1fr 1fr', gap:8, marginBottom:8 }}>
                  <button onClick={() => setShowMap(true)} style={{ padding:'12px 8px', background:DS.blueDim, border:'1px solid '+DS.blueBdr, borderRadius:DS.r1, color:DS.blue, fontSize:13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
                    🗺 Map
                  </button>
                  {currentOrder.status==='assigned' && (
                    <button onClick={() => setShowScanner(true)} style={{ padding:'12px 8px', background:DS.tealDim||'rgba(20,184,166,0.12)', border:'1px solid rgba(20,184,166,0.3)', borderRadius:DS.r1, color:DS.teal||'#14B8A6', fontSize:13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
                      📦 Scan
                    </button>
                  )}
                  <button onClick={() => setShowChat(true)} style={{ padding:'12px 8px', background:'rgba(168,85,247,0.12)', border:'1px solid rgba(168,85,247,0.3)', borderRadius:DS.r1, color:DS.purple, fontSize:13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
                    💬 Chat
                  </button>
                  {cfg.next && (
                    <button onClick={handleAdvance} style={{ padding:'12px', background:cfg.color, border:'none', borderRadius:DS.r1, color:'#0D0D0D', fontSize:13, fontWeight:800, cursor:'pointer' }}>
                      {cfg.nextLabel}
                    </button>
                  )}
                </div>

                {/* Enter PIN (en route) */}
                {currentOrder.status==='en_route' && (
                  <button onClick={() => setShowPin(true)} style={{ width:'100%', padding:'14px', background:DS.green, border:'none', borderRadius:DS.r1, color:'#0D0D0D', fontSize:15, fontWeight:800, cursor:'pointer', marginBottom:8 }}>
                    🔐 Enter delivery PIN
                  </button>
                )}

                {/* Running late */}
                {currentOrder.status === 'en_route' && <RunningLateButton order={currentOrder} driverPos={driverPos} />}

                {/* Report issue + voice */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:0 }}>
                  <button onClick={() => setShowIssue(true)} style={{ padding:'10px', background:'transparent', border:'1px solid '+DS.border, borderRadius:DS.r1, color:DS.t3, fontSize:12, cursor:'pointer' }}>
                    ⚠️ Report issue
                  </button>
                  <button onClick={() => setShowSignature(true)} style={{ padding:'10px', background:'transparent', border:'1px solid '+DS.border, borderRadius:DS.r1, color:DS.t3, fontSize:12, cursor:'pointer' }}>
                    ✍️ Sign
                  </button>
                  <button onClick={() => setShowVoice(true)} style={{ padding:'10px', background:'transparent', border:'1px solid '+DS.border, borderRadius:DS.r1, color:DS.t3, fontSize:12, cursor:'pointer' }}>
                    🎤 Voice
                  </button>
                </div>
              </div>
            </Card>
          )}

          {/* No active order */}
          {!currentOrder && (
            isOnline ? (
              <Card style={{ padding:'40px 20px', textAlign:'center', marginBottom:16 }}>
                <div style={{ fontSize:56, marginBottom:14 }}>🛵</div>
                <div style={{ fontFamily:DS.fh, fontSize:24, color:DS.t1, marginBottom:8 }}>Ready for deliveries</div>
                <div style={{ fontSize:14, color:DS.t2, lineHeight:1.5 }}>New orders appear automatically. You have 30 seconds to accept each one.</div>
              </Card>
            ) : (
              <Card style={{ padding:'40px 20px', textAlign:'center', marginBottom:16 }}>
                <div style={{ fontSize:56, marginBottom:14 }}>😴</div>
                <div style={{ fontFamily:DS.fh, fontSize:24, color:DS.t1, marginBottom:8 }}>You are offline</div>
                <div style={{ fontSize:14, color:DS.t2, marginBottom:28, lineHeight:1.5 }}>Go online to start receiving delivery requests</div>
                <button onClick={toggleOnline} style={{ padding:'16px 40px', background:DS.green, border:'none', borderRadius:DS.r1, color:'#0D0D0D', fontSize:16, fontWeight:800, cursor:'pointer' }}>Go online</button>
              </Card>
            )
          )}

          {/* Available orders list */}
          {isOnline && !currentOrder && availableOrders.length>0 && !newOrder && (
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:DS.t3, textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:12 }}>
                {availableOrders.length} order{availableOrders.length!==1?'s':''} available
              </div>
              {availableOrders.slice(0,3).map(order => (
                <Card key={order.id} style={{ padding:16, marginBottom:10 }} accent={DS.green}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                    <div>
                      <div style={{ fontSize:16, fontWeight:700, color:DS.t1 }}>#{order.order_number}</div>
                      <div style={{ fontSize:11, color:DS.t3, marginTop:2 }}>{new Date(order.created_at).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:20, fontWeight:800, color:DS.green }}>€{(order.delivery_fee||3.5).toFixed(2)}</div>
                      {order.distance_km && <div style={{ fontSize:11, color:DS.t3, marginTop:2 }}>{order.distance_km.toFixed(1)} km</div>}
                    </div>
                  </div>
                  <div style={{ fontSize:13, color:DS.t2, marginBottom:12 }}>📍 {order.delivery_address}</div>
                  <ActionBtn onClick={() => handleAccept(order)} disabled={accepting} color={DS.green}>
                    {accepting?'Accepting...':'Accept order'}
                  </ActionBtn>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab==='earnings'    && <EarningsTab stats={stats} isDesktop={isDesktop} />}
      {activeTab==='performance' && <PerformanceTab stats={stats} onShowFeedback={() => setShowFeedback(true)} isDesktop={isDesktop} />}
      {activeTab==='settings'    && <SettingsTab profile={profile} stats={stats} onSignOut={clear} isDesktop={isDesktop} />}


      {/* ── BOTTOM TAB BAR (mobile only) ── */}
      {!isDesktop && <div style={{ position:'fixed', bottom:0, left:0, right:0, background:DS.surface, borderTop:'1px solid '+DS.border, display:'flex', paddingBottom:'env(safe-area-inset-bottom)', zIndex:200 }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ flex:1, padding:'12px 0 8px', background:'none', border:'none', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:3, position:'relative' }}>
            {tab.id==='home' && currentOrder && (
              <div style={{ position:'absolute', top:8, right:'calc(50% - 18px)', width:8, height:8, borderRadius:'50%', background:cfg?.color||DS.accent, boxShadow:'0 0 6px '+(cfg?.color||DS.accent) }} />
            )}
            <span style={{ fontSize:21 }}>{tab.icon}</span>
            <span style={{ fontSize:10, color:activeTab===tab.id?DS.accent:DS.t3, fontWeight:activeTab===tab.id?700:400, fontFamily:DS.f }}>{tab.label}</span>
            {activeTab===tab.id && <div style={{ position:'absolute', top:0, left:'15%', right:'15%', height:2, background:DS.accent, borderRadius:1 }} />}
          </button>
        ))}
      </div>}

      <style>{globalStyles}</style>
      </div>
    </div>
  )
}
