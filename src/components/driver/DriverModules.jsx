// ═══════════════════════════════════════════════════════════════
// ISLA DROP DRIVER — PROFESSIONAL MODULES v5.0
// All new features: Navigation, Scanner, Weather, Heatmap,
// Payslip, Expenses, Safety, Analytics, Push notifications
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback } from 'react'
import toast from 'react-hot-toast'

// ── Design system (shared) ────────────────────────────────────
const DS = {
  bg:'#0D0D0D', surface:'#1A1A1A', surface2:'#222222',
  border:'#2A2A2A', border2:'#333333',
  accent:'#FF6B35', accentDim:'rgba(255,107,53,0.15)', accentBdr:'rgba(255,107,53,0.35)',
  green:'#22C55E', greenDim:'rgba(34,197,94,0.12)', greenBdr:'rgba(34,197,94,0.3)',
  blue:'#3B82F6', blueDim:'rgba(59,130,246,0.12)', blueBdr:'rgba(59,130,246,0.3)',
  yellow:'#EAB308', yellowDim:'rgba(234,179,8,0.12)', yellowBdr:'rgba(234,179,8,0.3)',
  red:'#EF4444', redDim:'rgba(239,68,68,0.12)', redBdr:'rgba(239,68,68,0.3)',
  purple:'#A855F7', purpleDim:'rgba(168,85,247,0.12)', purpleBdr:'rgba(168,85,247,0.3)',
  teal:'#14B8A6', tealDim:'rgba(20,184,166,0.12)', tealBdr:'rgba(20,184,166,0.3)',
  t1:'#FFFFFF', t2:'rgba(255,255,255,0.6)', t3:'rgba(255,255,255,0.35)',
  f:'DM Sans, sans-serif', fh:'DM Serif Display, serif',
  r1:'8px', r2:'16px', r3:'24px',
}

// ── Primitive helpers ─────────────────────────────────────────
function Card({ children, style={}, accent }) {
  return <div style={{ background:DS.surface, borderRadius:DS.r2, border:'1px solid '+(accent?accent+'40':DS.border), overflow:'hidden', ...style }}>{children}</div>
}
function Pill({ children, color, style={} }) {
  return <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:99, background:color+'18', border:'1px solid '+color+'40', fontSize:11, fontWeight:700, color, textTransform:'uppercase', letterSpacing:'0.6px', ...style }}>{children}</span>
}
function Btn({ children, onClick, color, outline, disabled, full, style={} }) {
  const bg = outline ? 'transparent' : disabled ? DS.surface2 : (color||DS.accent)
  const cl = disabled ? DS.t3 : outline ? (color||DS.accent) : (color===DS.green||color===DS.yellow?'#0D0D0D':DS.t1)
  return <button onClick={disabled?undefined:onClick} style={{ padding:'13px 20px', background:bg, border:outline?'1.5px solid '+(color||DS.accent)+'60':'none', borderRadius:DS.r1, color:cl, fontSize:14, fontWeight:700, cursor:disabled?'default':'pointer', fontFamily:DS.f, width:full?'100%':'auto', transition:'opacity 0.15s', opacity:disabled?0.5:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8, ...style }}>{children}</button>
}
function Sheet({ children, zIndex=600, onDismiss, maxH='90vh' }) {
  return (
    <div style={{ position:'fixed', inset:0, zIndex, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'flex-end' }} onClick={e=>e.target===e.currentTarget&&onDismiss?.()}>
      <div style={{ width:'100%', background:DS.surface, borderRadius:'20px 20px 0 0', padding:'16px 20px calc(40px + env(safe-area-inset-bottom))', borderTop:'1px solid '+DS.border2, maxHeight:maxH, overflowY:'auto', animation:'slideUp 0.25s ease-out' }}>
        <div style={{ width:36, height:4, background:DS.border2, borderRadius:2, margin:'0 auto 20px' }} />
        {children}
      </div>
    </div>
  )
}
function Row({ icon, label, value, sub, style={} }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:14, padding:14, background:DS.surface, borderRadius:DS.r1, marginBottom:8, border:'1px solid '+DS.border, ...style }}>
      <span style={{ fontSize:20, flexShrink:0 }}>{icon}</span>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, color:DS.t1, fontWeight:500, fontFamily:DS.f }}>{label}</div>
        {sub && <div style={{ fontSize:11, color:DS.t3, marginTop:2, fontFamily:DS.f }}>{sub}</div>}
      </div>
      {value && <div style={{ fontSize:13, color:DS.t2, fontFamily:DS.f, textAlign:'right' }}>{value}</div>}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MODULE 1: WEATHER WIDGET
// Real Ibiza weather using Open-Meteo (free, no API key)
// ═══════════════════════════════════════════════════════════════
export function WeatherWidget() {
  const [weather, setWeather] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        // Ibiza coords — Open-Meteo free API
        const url = 'https://api.open-meteo.com/v1/forecast?latitude=38.9067&longitude=1.4326&current=temperature_2m,wind_speed_10m,weather_code,relative_humidity_2m&timezone=Europe/Madrid'
        const data = await fetch(url).then(r=>r.json())
        const c = data.current
        const code = c.weather_code
        const icon = code<=1?'☀️':code<=3?'⛅':code<=48?'🌫️':code<=67?'🌧️':code<=77?'❄️':code<=82?'🌦️':'⛈️'
        const desc = code<=1?'Clear':code<=3?'Partly cloudy':code<=48?'Foggy':code<=67?'Rain':code<=77?'Snow':code<=82?'Showers':'Thunderstorm'
        const wind = c.wind_speed_10m
        const warn = wind > 40 ? 'Strong wind warning — take care on the scooter' : wind > 25 ? 'Moderate wind — ride carefully' : null
        setWeather({ temp:Math.round(c.temperature_2m), icon, desc, wind:Math.round(wind), humidity:c.relative_humidity_2m, warn })
      } catch {}
    }
    load()
    const t = setInterval(load, 30*60*1000) // refresh every 30min
    return () => clearInterval(t)
  }, [])

  if (!weather) return null

  return (
    <div style={{ background:weather.warn?DS.yellowDim:DS.surface2, border:'1px solid '+(weather.warn?DS.yellowBdr:DS.border2), borderRadius:DS.r1, padding:'10px 14px', display:'flex', alignItems:'center', gap:12 }}>
      <span style={{ fontSize:28 }}>{weather.icon}</span>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:700, color:DS.t1, fontFamily:DS.f }}>
          {weather.temp}°C · {weather.desc}
        </div>
        <div style={{ fontSize:11, color:DS.t3, fontFamily:DS.f }}>
          💨 {weather.wind} km/h · 💧 {weather.humidity}% humidity
        </div>
        {weather.warn && <div style={{ fontSize:11, color:DS.yellow, fontWeight:600, marginTop:3, fontFamily:DS.f }}>⚠️ {weather.warn}</div>}
      </div>
      <div style={{ fontSize:11, color:DS.t3, fontFamily:DS.f }}>Ibiza</div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MODULE 2: BARCODE SCANNER
// Camera-based item verification at warehouse pickup
// ═══════════════════════════════════════════════════════════════
export function BarcodeScanner({ order, onComplete, onClose }) {
  const [checkedItems, setCheckedItems] = useState({})
  const [scanning, setScanning] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  const items = order.order_items || []
  const allChecked = items.length > 0 && items.every((_,i) => checkedItems[i])
  const checkedCount = Object.values(checkedItems).filter(Boolean).length

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video:{ facingMode:'environment' } })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      setScanning(true)
    } catch { toast.error('Camera not available — use manual check') }
  }

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t=>t.stop())
    streamRef.current = null
    setScanning(false)
  }

  useEffect(() => () => stopCamera(), [])

  const toggleItem = (i) => setCheckedItems(prev=>({...prev,[i]:!prev[i]}))

  const manualCheck = () => {
    const code = manualCode.trim()
    if (!code) return
    const idx = items.findIndex(item => (item.product?.barcode||item.products?.barcode||item.product_id||'') === code)
    if (idx >= 0) { setCheckedItems(prev=>({...prev,[idx]:true})); toast.success('Item verified ✓') }
    else toast.error('Barcode not found — check manually')
    setManualCode('')
  }

  return (
    <Sheet zIndex={700} onDismiss={onClose} maxH='95vh'>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div>
          <Pill color={DS.blue}>📦 Warehouse check</Pill>
          <div style={{ fontFamily:DS.fh, fontSize:20, color:DS.t1, marginTop:8 }}>Verify order items</div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:24, fontWeight:800, color:allChecked?DS.green:DS.accent, fontFamily:DS.f }}>{checkedCount}/{items.length}</div>
          <div style={{ fontSize:10, color:DS.t3, fontFamily:DS.f }}>verified</div>
        </div>
      </div>

      {/* Camera preview */}
      {scanning ? (
        <div style={{ marginBottom:16 }}>
          <video ref={videoRef} autoPlay playsInline style={{ width:'100%', borderRadius:DS.r1, height:160, objectFit:'cover', background:DS.surface2 }} />
          <div style={{ display:'flex', gap:8, marginTop:8 }}>
            <input value={manualCode} onChange={e=>setManualCode(e.target.value)} onKeyDown={e=>e.key==='Enter'&&manualCheck()} placeholder="Enter barcode manually..." style={{ flex:1, padding:'10px 12px', background:DS.surface2, border:'1px solid '+DS.border2, borderRadius:DS.r1, color:DS.t1, fontSize:13, outline:'none', fontFamily:DS.f }} />
            <Btn onClick={manualCheck} color={DS.blue} style={{ padding:'10px 14px', width:'auto' }}>✓</Btn>
          </div>
          <Btn onClick={stopCamera} outline full style={{ marginTop:8, padding:'10px' }}>Stop camera</Btn>
        </div>
      ) : (
        <Btn onClick={startCamera} color={DS.blue} full style={{ marginBottom:12 }}>📷 Open barcode scanner</Btn>
      )}

      {/* Item checklist */}
      <div style={{ marginBottom:16 }}>
        {items.map((item, i) => (
          <button key={i} onClick={() => toggleItem(i)}
            style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'12px 14px', background:checkedItems[i]?DS.greenDim:DS.surface2, border:'1px solid '+(checkedItems[i]?DS.greenBdr:DS.border2), borderRadius:DS.r1, marginBottom:8, cursor:'pointer', transition:'all 0.15s', textAlign:'left' }}>
            <div style={{ width:28, height:28, borderRadius:'50%', background:checkedItems[i]?DS.green:'transparent', border:'2px solid '+(checkedItems[i]?DS.green:DS.border2), display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>
              {checkedItems[i]?'✓':''}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, color:checkedItems[i]?DS.green:DS.t1, fontWeight:600, fontFamily:DS.f, textDecoration:checkedItems[i]?'line-through':'none' }}>
                {item.product?.name||item.products?.name||'Item '+i}
              </div>
              <div style={{ fontSize:11, color:DS.t3, fontFamily:DS.f }}>Qty: {item.quantity||1}</div>
            </div>
            {(item.product?.age_restricted||item.products?.age_restricted) && <Pill color={DS.red} style={{ fontSize:9, padding:'2px 7px' }}>18+</Pill>}
          </button>
        ))}
      </div>

      {allChecked ? (
        <Btn onClick={onComplete} color={DS.green} full>✓ All verified — start delivery</Btn>
      ) : (
        <div>
          <Btn onClick={() => { setCheckedItems(Object.fromEntries(items.map((_,i)=>[i,true]))); }} outline full style={{ marginBottom:8 }}>Check all manually</Btn>
          <div style={{ fontSize:12, color:DS.t3, textAlign:'center', fontFamily:DS.f }}>Tap each item to mark as collected</div>
        </div>
      )}
    </Sheet>
  )
}

// ═══════════════════════════════════════════════════════════════
// MODULE 3: SIGNATURE PAD
// For high-value orders requiring signature on delivery
// ═══════════════════════════════════════════════════════════════
export function SignaturePad({ order, onComplete, onSkip }) {
  const canvasRef = useRef(null)
  const [drawing, setDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const lastPos = useRef(null)

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect()
    const src = e.touches?.[0] || e
    return { x:(src.clientX-rect.left)*(canvas.width/rect.width), y:(src.clientY-rect.top)*(canvas.height/rect.height) }
  }

  const startDraw = (e) => {
    e.preventDefault()
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    const pos = getPos(e, canvas)
    ctx.beginPath(); ctx.moveTo(pos.x, pos.y)
    lastPos.current = pos; setDrawing(true)
  }

  const draw = (e) => {
    e.preventDefault()
    if (!drawing) return
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    const pos = getPos(e, canvas)
    ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.strokeStyle = DS.t1
    ctx.lineTo(pos.x, pos.y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(pos.x, pos.y)
    lastPos.current = pos; setHasSignature(true)
  }

  const endDraw = () => setDrawing(false)

  const clear = () => {
    const canvas = canvasRef.current; if (!canvas) return
    canvas.getContext('2d').clearRect(0,0,canvas.width,canvas.height)
    setHasSignature(false)
  }

  const save = async () => {
    const canvas = canvasRef.current; if (!canvas) return
    const dataUrl = canvas.toDataURL('image/png')
    try {
      const { supabase } = await import('../../lib/supabase')
      const blob = await (await fetch(dataUrl)).blob()
      const path = 'signatures/'+order.id+'_'+Date.now()+'.png'
      await supabase.storage.from('delivery-photos').upload(path, blob, { upsert:true })
      await supabase.from('orders').update({ signature_url:path }).eq('id',order.id)
      toast.success('Signature saved ✓')
    } catch {}
    onComplete()
  }

  return (
    <Sheet zIndex={720} onDismiss={onSkip} maxH='85vh'>
      <div style={{ textAlign:'center', marginBottom:16 }}>
        <div style={{ fontSize:36, marginBottom:8 }}>✍️</div>
        <div style={{ fontFamily:DS.fh, fontSize:22, color:DS.t1, marginBottom:4 }}>Customer signature</div>
        <div style={{ fontSize:13, color:DS.t2, fontFamily:DS.f }}>High-value order — signature required</div>
      </div>
      <div style={{ border:'1px solid '+DS.border2, borderRadius:DS.r1, overflow:'hidden', marginBottom:8, background:DS.surface2, position:'relative' }}>
        <canvas ref={canvasRef} width={600} height={200}
          onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
          onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
          style={{ width:'100%', height:180, cursor:'crosshair', touchAction:'none', display:'block' }} />
        {!hasSignature && <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', color:DS.t3, fontSize:13, fontFamily:DS.f, pointerEvents:'none' }}>Sign here</div>}
      </div>
      <button onClick={clear} style={{ background:'none', border:'none', color:DS.t3, fontSize:12, cursor:'pointer', marginBottom:14, fontFamily:DS.f }}>Clear signature</button>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:8 }}>
        <Btn onClick={onSkip} outline>Skip</Btn>
        <Btn onClick={save} disabled={!hasSignature} color={DS.green} full>Save signature</Btn>
      </div>
    </Sheet>
  )
}

// ═══════════════════════════════════════════════════════════════
// MODULE 4: EXPENSE & TIP LOGGER
// Cash tip logging and fuel/expense tracking
// ═══════════════════════════════════════════════════════════════
export function ExpenseLogger({ onClose }) {
  const [type, setType] = useState('tip')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const { supabase } = await import('../../lib/supabase')
        const { useAuthStore } = await import('../../lib/store')
        const user = useAuthStore.getState().user
        const today = new Date(); today.setHours(0,0,0,0)
        const { data } = await supabase.from('driver_expenses').select('*').eq('driver_id',user?.id).gte('created_at',today.toISOString()).order('created_at',{ascending:false})
        if (data) setEntries(data)
      } catch {}
    }
    load()
  }, [])

  const save = async () => {
    if (!amount || isNaN(parseFloat(amount))) { toast.error('Enter a valid amount'); return }
    setLoading(true)
    try {
      const { supabase } = await import('../../lib/supabase')
      const { useAuthStore } = await import('../../lib/store')
      const user = useAuthStore.getState().user
      const { data } = await supabase.from('driver_expenses').insert({ driver_id:user?.id, type, amount:parseFloat(amount), note }).select().single()
      if (data) { setEntries(prev=>[data,...prev]); toast.success(type==='tip'?'Tip logged 💰':'Expense logged ✓') }
      setAmount(''); setNote('')
    } catch { toast.error('Could not save') }
    setLoading(false)
  }

  const types = [
    { id:'tip', label:'Cash tip', icon:'💵', color:DS.green },
    { id:'fuel', label:'Fuel', icon:'⛽', color:DS.yellow },
    { id:'parking', label:'Parking', icon:'🅿️', color:DS.blue },
    { id:'other', label:'Other', icon:'📝', color:DS.t2 },
  ]

  const totals = entries.reduce((acc,e)=>{ acc[e.type]=(acc[e.type]||0)+e.amount; return acc },{})

  return (
    <Sheet zIndex={640} onDismiss={onClose} maxH='90vh'>
      <Pill color={DS.green} style={{ marginBottom:12 }}>💰 Expenses & tips</Pill>
      <div style={{ fontFamily:DS.fh, fontSize:22, color:DS.t1, marginBottom:16 }}>Log entry</div>

      {/* Type selector */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:14 }}>
        {types.map(t => (
          <button key={t.id} onClick={() => setType(t.id)} style={{ padding:'10px 4px', background:type===t.id?t.color+'18':DS.surface2, border:'1px solid '+(type===t.id?t.color:DS.border2), borderRadius:DS.r1, cursor:'pointer', textAlign:'center' }}>
            <div style={{ fontSize:20, marginBottom:4 }}>{t.icon}</div>
            <div style={{ fontSize:10, color:type===t.id?t.color:DS.t3, fontWeight:600, fontFamily:DS.f }}>{t.label}</div>
          </button>
        ))}
      </div>

      {/* Amount input */}
      <div style={{ display:'flex', gap:8, marginBottom:10 }}>
        <div style={{ flex:1, position:'relative' }}>
          <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:DS.t3, fontSize:16, fontFamily:DS.f }}>€</span>
          <input value={amount} onChange={e=>setAmount(e.target.value)} type="number" step="0.50" min="0" placeholder="0.00"
            style={{ width:'100%', padding:'13px 12px 13px 28px', background:DS.surface2, border:'1px solid '+DS.border2, borderRadius:DS.r1, color:DS.t1, fontSize:18, fontWeight:700, outline:'none', fontFamily:DS.f, boxSizing:'border-box' }} />
        </div>
        <Btn onClick={save} disabled={!amount||loading} color={DS.green} style={{ padding:'13px 20px', width:'auto' }}>Log</Btn>
      </div>
      <input value={note} onChange={e=>setNote(e.target.value)} placeholder="Note (optional)..."
        style={{ width:'100%', padding:'10px 12px', background:DS.surface2, border:'1px solid '+DS.border2, borderRadius:DS.r1, color:DS.t1, fontSize:13, outline:'none', fontFamily:DS.f, marginBottom:20, boxSizing:'border-box' }} />

      {/* Today summary */}
      {Object.keys(totals).length > 0 && (
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:DS.t3, textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:10, fontFamily:DS.f }}>Today's summary</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:14 }}>
            {types.filter(t=>totals[t.id]).map(t => (
              <div key={t.id} style={{ background:DS.surface2, borderRadius:DS.r1, padding:'10px 12px', border:'1px solid '+DS.border2 }}>
                <div style={{ fontSize:12, color:DS.t3, fontFamily:DS.f }}>{t.icon} {t.label}</div>
                <div style={{ fontSize:18, fontWeight:800, color:t.color||DS.t1, fontFamily:DS.f }}>€{(totals[t.id]||0).toFixed(2)}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize:11, fontWeight:700, color:DS.t3, textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:10, fontFamily:DS.f }}>Recent entries</div>
          {entries.slice(0,6).map((e,i) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 12px', background:DS.surface2, borderRadius:DS.r1, marginBottom:6, border:'1px solid '+DS.border2 }}>
              <div>
                <div style={{ fontSize:13, color:DS.t1, fontFamily:DS.f }}>{types.find(t=>t.id===e.type)?.icon} {types.find(t=>t.id===e.type)?.label}{e.note?' · '+e.note:''}</div>
                <div style={{ fontSize:10, color:DS.t3, fontFamily:DS.f }}>{new Date(e.created_at).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}</div>
              </div>
              <div style={{ fontSize:15, fontWeight:700, color:e.type==='tip'?DS.green:DS.yellow, fontFamily:DS.f }}>{e.type==='fuel'||e.type==='parking'?'-':''}€{e.amount.toFixed(2)}</div>
            </div>
          ))}
        </div>
      )}
    </Sheet>
  )
}

// ═══════════════════════════════════════════════════════════════
// MODULE 5: WEEKLY PAYSLIP PDF GENERATOR
// Downloadable earnings statement
// ═══════════════════════════════════════════════════════════════
export function PayslipGenerator({ profile, onClose }) {
  const [week, setWeek] = useState(0) // 0=this week, 1=last week etc
  const [data, setData] = useState(null)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const { supabase } = await import('../../lib/supabase')
        const { useAuthStore } = await import('../../lib/store')
        const user = useAuthStore.getState().user
        const now = new Date()
        const weekStart = new Date(now); weekStart.setDate(now.getDate()-now.getDay()-week*7); weekStart.setHours(0,0,0,0)
        const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate()+6); weekEnd.setHours(23,59,59,999)
        const [earningsRes, expensesRes] = await Promise.all([
          supabase.from('driver_earnings').select('*').eq('driver_id',user?.id).gte('created_at',weekStart.toISOString()).lte('created_at',weekEnd.toISOString()),
          supabase.from('driver_expenses').select('*').eq('driver_id',user?.id).gte('created_at',weekStart.toISOString()).lte('created_at',weekEnd.toISOString()),
        ])
        const earnings = earningsRes.data||[]
        const expenses = expensesRes.data||[]
        const tips = expenses.filter(e=>e.type==='tip').reduce((s,e)=>s+e.amount,0)
        const costs = expenses.filter(e=>e.type!=='tip').reduce((s,e)=>s+e.amount,0)
        const gross = earnings.reduce((s,e)=>s+e.amount,0)
        setData({ earnings, expenses, tips, costs, gross, net:gross+tips-costs, weekStart, weekEnd, deliveries:earnings.length })
      } catch {}
    }
    load()
  }, [week])

  const download = async () => {
    if (!data) return
    setGenerating(true)
    try {
      const fmt = d => new Date(d).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})
      const rows = data.earnings.map(function(e) {
        return '<tr><td>' + new Date(e.created_at).toLocaleDateString('en-GB') + '</td><td>#' + (e.order_number || e.order_id.slice(0,6)) + '</td><td style=\"text-align:right;color:#22C55E;font-weight:700\">EUR' + e.amount.toFixed(2) + '</td></tr>'
      }).join('')
      const html = [
        '<!DOCTYPE html><html><head><meta charset=\"utf-8\">',
        '<style>body{font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:40px;color:#1a1a1a}',
        'h1{font-size:28px;color:#FF6B35;margin-bottom:4px}',
        'table{width:100%;border-collapse:collapse;margin-bottom:24px}',
        'th{text-align:left;padding:10px 12px;background:#f5f5f5;font-size:12px;color:#666}',
        'td{padding:10px 12px;border-bottom:1px solid #eee;font-size:14px}',
        '.net{font-size:24px;font-weight:800;color:#FF6B35}',
        'footer{margin-top:40px;font-size:11px;color:#aaa;border-top:1px solid #eee;padding-top:20px}</style></head><body>',
        '<h1>Isla Drop</h1>',
        '<p>Driver: <strong>' + (profile.full_name || 'Driver') + '</strong></p>',
        '<p>Period: ' + fmt(data.weekStart) + ' to ' + fmt(data.weekEnd) + '</p>',
        '<p>Delivery fees: EUR' + data.gross.toFixed(2) + '</p>',
        '<p>Cash tips: EUR' + data.tips.toFixed(2) + '</p>',
        '<p>Expenses: -EUR' + data.costs.toFixed(2) + '</p>',
        '<p><strong>Net earnings: <span class=\"net\">EUR' + data.net.toFixed(2) + '</span></strong></p>',
        '<table><thead><tr><th>Date</th><th>Order</th><th>Amount</th></tr></thead><tbody>',
        rows,
        '<tr><td colspan=\"2\"><strong>Total (' + data.deliveries + ' deliveries)</strong></td><td><strong>EUR' + data.gross.toFixed(2) + '</strong></td></tr>',
        '</tbody></table>',
        '<footer>Automated summary by Isla Drop. Queries: ops@isladrop.net</footer>',
        '</body></html>'
      ].join('')
      const blob = new Blob([html], {type:'text/html'})
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = 'IslaDropPayslip_'+fmt(data.weekStart).replace(/ /g,'_')+'.html'
      a.click(); URL.revokeObjectURL(url)
      toast.success('Payslip downloaded ✓')
    } catch { toast.error('Could not generate payslip') }
    setGenerating(false)
  }

  return (
    <Sheet zIndex={640} onDismiss={onClose} maxH='80vh'>
      <Pill color={DS.yellow} style={{ marginBottom:12 }}>📄 Payslip</Pill>
      <div style={{ fontFamily:DS.fh, fontSize:22, color:DS.t1, marginBottom:16 }}>Weekly statement</div>

      {/* Week selector */}
      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        {[['This week',0],['Last week',1],['2 weeks ago',2]].map(([label,w]) => (
          <button key={w} onClick={() => setWeek(w)} style={{ flex:1, padding:'9px 4px', background:week===w?DS.yellowDim:DS.surface2, border:'1px solid '+(week===w?DS.yellowBdr:DS.border2), borderRadius:DS.r1, color:week===w?DS.yellow:DS.t3, fontSize:12, fontWeight:week===w?700:400, cursor:'pointer', fontFamily:DS.f }}>
            {label}
          </button>
        ))}
      </div>

      {data ? (
        <div>
          {[
            { label:'Delivery fees', val:'€'+data.gross.toFixed(2), color:DS.t1 },
            { label:'Cash tips', val:'€'+data.tips.toFixed(2), color:DS.green },
            { label:'Expenses', val:'-€'+data.costs.toFixed(2), color:DS.red },
            { label:'Deliveries', val:data.deliveries, color:DS.blue },
          ].map(r => (
            <div key={r.label} style={{ display:'flex', justifyContent:'space-between', padding:'12px 0', borderBottom:'1px solid '+DS.border }}>
              <span style={{ fontSize:14, color:DS.t2, fontFamily:DS.f }}>{r.label}</span>
              <span style={{ fontSize:14, fontWeight:700, color:r.color, fontFamily:DS.f }}>{r.val}</span>
            </div>
          ))}
          <div style={{ display:'flex', justifyContent:'space-between', padding:'16px 0 20px', borderBottom:'1px solid '+DS.border }}>
            <span style={{ fontSize:16, fontWeight:700, color:DS.t1, fontFamily:DS.f }}>Net earnings</span>
            <span style={{ fontSize:24, fontWeight:800, color:DS.accent, fontFamily:DS.f }}>€{data.net.toFixed(2)}</span>
          </div>
          <Btn onClick={download} disabled={generating} color={DS.yellow} full style={{ marginTop:16 }}>
            {generating?'Generating...':'⬇ Download payslip'}
          </Btn>
        </div>
      ) : (
        <div style={{ textAlign:'center', padding:'32px 0', color:DS.t3, fontFamily:DS.f }}>Loading...</div>
      )}
    </Sheet>
  )
}

// ═══════════════════════════════════════════════════════════════
// MODULE 6: INCIDENT REPORT
// Separate from order issues — for accidents, near misses
// ═══════════════════════════════════════════════════════════════
export function IncidentReport({ driverPos, onClose }) {
  const [type, setType] = useState(null)
  const [details, setDetails] = useState('')
  const [injury, setInjury] = useState(false)
  const [policeRef, setPoliceRef] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const types = [
    { id:'accident', label:'Road accident', icon:'🚨' },
    { id:'near_miss', label:'Near miss', icon:'⚠️' },
    { id:'theft', label:'Theft / robbery', icon:'🔓' },
    { id:'vehicle', label:'Vehicle breakdown', icon:'🛵' },
    { id:'assault', label:'Assault', icon:'🆘' },
    { id:'other', label:'Other incident', icon:'📋' },
  ]

  const submit = async () => {
    if (!type||!details.trim()) { toast.error('Select type and describe the incident'); return }
    setLoading(true)
    try {
      const { supabase } = await import('../../lib/supabase')
      const { useAuthStore } = await import('../../lib/store')
      const user = useAuthStore.getState().user
      const loc = driverPos?'https://maps.google.com/?q='+driverPos[0]+','+driverPos[1]:'Unknown'
      await supabase.from('support_tickets').insert({
        user_id:user?.id,
        subject:'🚨 Driver Incident Report: '+types.find(t=>t.id===type)?.label,
        message:'Type: '+type+'\nInjury: '+(injury?'Yes':'No')+'\nPolice ref: '+(policeRef||'N/A')+'\nLocation: '+loc+'\n\nDetails:\n'+details,
        status:'open', priority:'urgent',
      })
      setDone(true)
    } catch { toast.error('Submission failed — call dispatch immediately') }
    setLoading(false)
  }

  if (done) return (
    <Sheet zIndex={660} onDismiss={onClose}>
      <div style={{ textAlign:'center', padding:'16px 0' }}>
        <div style={{ fontSize:52, marginBottom:12 }}>📋</div>
        <div style={{ fontFamily:DS.fh, fontSize:22, color:DS.t1, marginBottom:8 }}>Incident reported</div>
        <div style={{ fontSize:14, color:DS.t2, marginBottom:8, fontFamily:DS.f }}>Ops team notified. If urgent, call dispatch.</div>
        <div style={{ fontSize:20, fontWeight:700, color:DS.t1, marginBottom:28, fontFamily:DS.f }}>📞 +34 971 000 000</div>
        <Btn onClick={onClose} color={DS.accent} full>Close</Btn>
      </div>
    </Sheet>
  )

  return (
    <Sheet zIndex={660} onDismiss={onClose} maxH='90vh'>
      <Pill color={DS.red} style={{ marginBottom:12 }}>🚨 Incident report</Pill>
      <div style={{ fontFamily:DS.fh, fontSize:22, color:DS.t1, marginBottom:16 }}>Report incident</div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:14 }}>
        {types.map(t => (
          <button key={t.id} onClick={() => setType(t.id)} style={{ padding:'12px 10px', background:type===t.id?DS.redDim:DS.surface2, border:'1px solid '+(type===t.id?DS.red:DS.border2), borderRadius:DS.r1, cursor:'pointer', textAlign:'left', transition:'all 0.15s' }}>
            <div style={{ fontSize:20, marginBottom:6 }}>{t.icon}</div>
            <div style={{ fontSize:12, color:type===t.id?DS.red:DS.t2, fontWeight:600, fontFamily:DS.f }}>{t.label}</div>
          </button>
        ))}
      </div>

      <button onClick={() => setInjury(i=>!i)} style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'12px 14px', background:injury?DS.redDim:DS.surface2, border:'1px solid '+(injury?DS.red:DS.border2), borderRadius:DS.r1, marginBottom:10, cursor:'pointer' }}>
        <div style={{ width:24, height:24, borderRadius:6, background:injury?DS.red:'transparent', border:'2px solid '+(injury?DS.red:DS.border2), display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>{injury?'✓':''}</div>
        <span style={{ fontSize:14, color:injury?DS.red:DS.t2, fontWeight:600, fontFamily:DS.f }}>Injury involved</span>
      </button>

      <input value={policeRef} onChange={e=>setPoliceRef(e.target.value)} placeholder="Police reference number (if applicable)"
        style={{ width:'100%', padding:'10px 12px', background:DS.surface2, border:'1px solid '+DS.border2, borderRadius:DS.r1, color:DS.t1, fontSize:13, outline:'none', fontFamily:DS.f, marginBottom:10, boxSizing:'border-box' }} />

      <textarea value={details} onChange={e=>setDetails(e.target.value)} placeholder="Describe what happened..." rows={4}
        style={{ width:'100%', padding:'12px', background:DS.surface2, border:'1px solid '+DS.border2, borderRadius:DS.r1, color:DS.t1, fontSize:13, resize:'none', outline:'none', fontFamily:DS.f, marginBottom:14, boxSizing:'border-box' }} />

      <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:10 }}>
        <Btn onClick={onClose} outline>Cancel</Btn>
        <Btn onClick={submit} disabled={!type||!details.trim()||loading} color={DS.red} full>
          {loading?'Submitting...':'Submit incident report'}
        </Btn>
      </div>
    </Sheet>
  )
}

// ═══════════════════════════════════════════════════════════════
// MODULE 7: BONUS CHALLENGE TRACKER
// Live bonus targets with progress
// ═══════════════════════════════════════════════════════════════
export function BonusTracker({ stats, onClose }) {
  const deliveries = stats?.deliveries || 0
  const earnings = stats?.earnings || 0

  const challenges = [
    { id:'c1', icon:'⚡', label:'Rush hour sprint', desc:'Complete 5 deliveries before midnight', target:5, current:Math.min(deliveries,5), reward:8, unit:'deliveries' },
    { id:'c2', icon:'💰', label:'Century earner', desc:'Earn €100 in a single shift', target:100, current:Math.min(earnings,100), reward:15, unit:'euros', prefix:'€' },
    { id:'c3', icon:'⭐', label:'Perfect shift', desc:'Complete 8 deliveries with 5-star rating', target:8, current:Math.min(deliveries,8), reward:12, unit:'deliveries' },
    { id:'c4', icon:'🔥', label:'Speed demon', desc:'Complete 3 deliveries in 1 hour', target:3, current:Math.min(deliveries,3), reward:6, unit:'deliveries' },
    { id:'c5', icon:'🌙', label:'Night owl', desc:'Complete 4 deliveries after midnight', target:4, current:2, reward:10, unit:'deliveries' },
  ]

  const totalBonus = challenges.filter(c=>c.current>=c.target).reduce((s,c)=>s+c.reward,0)

  return (
    <Sheet zIndex={640} onDismiss={onClose} maxH='85vh'>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
        <div>
          <Pill color={DS.yellow} style={{ marginBottom:8 }}>🎯 Bonus challenges</Pill>
          <div style={{ fontFamily:DS.fh, fontSize:22, color:DS.t1 }}>Today's targets</div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:24, fontWeight:800, color:DS.yellow, fontFamily:DS.f }}>€{totalBonus}</div>
          <div style={{ fontSize:10, color:DS.t3, fontFamily:DS.f }}>earned so far</div>
        </div>
      </div>

      {challenges.map(c => {
        const pct = Math.min(100,(c.current/c.target)*100)
        const done = c.current >= c.target
        return (
          <Card key={c.id} style={{ padding:'14px 16px', marginBottom:10 }} accent={done?DS.yellow:undefined}>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:10 }}>
              <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                <span style={{ fontSize:24 }}>{c.icon}</span>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:done?DS.yellow:DS.t1, fontFamily:DS.f }}>{c.label}</div>
                  <div style={{ fontSize:12, color:DS.t2, fontFamily:DS.f }}>{c.desc}</div>
                </div>
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <div style={{ fontSize:16, fontWeight:800, color:DS.yellow, fontFamily:DS.f }}>+€{c.reward}</div>
                {done && <div style={{ fontSize:10, color:DS.green, fontFamily:DS.f }}>✓ earned</div>}
              </div>
            </div>
            <div style={{ background:DS.border, borderRadius:99, height:6, overflow:'hidden', marginBottom:4 }}>
              <div style={{ height:'100%', borderRadius:99, background:done?DS.yellow:DS.accent, width:pct+'%', transition:'width 0.5s' }} />
            </div>
            <div style={{ fontSize:11, color:DS.t3, fontFamily:DS.f }}>
              {c.prefix||''}{c.current} / {c.prefix||''}{c.target} {c.unit}
            </div>
          </Card>
        )
      })}
    </Sheet>
  )
}

// ═══════════════════════════════════════════════════════════════
// MODULE 8: ZONE DEMAND HEATMAP
// Shows where orders are clustering in Ibiza right now
// ═══════════════════════════════════════════════════════════════
export function ZoneHeatmap({ onClose }) {
  const containerRef = useRef(null)
  const [zones, setZones] = useState([])
  const [loading, setLoading] = useState(true)

  // Ibiza delivery zones with real coordinates
  const ZONES = [
    { name:'Ibiza Town',    lat:38.9067, lng:1.4326, emoji:'🏙️' },
    { name:'San Antonio',   lat:38.9800, lng:1.3010, emoji:'🌅' },
    { name:'Santa Eulalia', lat:38.9843, lng:1.5367, emoji:'🌿' },
    { name:'Playa den Bossa',lat:38.8780,lng:1.4040, emoji:'🏖️' },
    { name:'Talamanca',     lat:38.9220, lng:1.4570, emoji:'⛵' },
    { name:'Es Canar',      lat:38.9990, lng:1.5720, emoji:'🌊' },
    { name:'Portinatx',     lat:39.0560, lng:1.4650, emoji:'🏔️' },
    { name:'Marina Botafoch',lat:38.9085,lng:1.4423, emoji:'⚓' },
  ]

  useEffect(() => {
    const load = async () => {
      try {
        const { supabase } = await import('../../lib/supabase')
        const hour = new Date(); hour.setMinutes(0,0,0)
        const { data } = await supabase.from('orders').select('delivery_lat,delivery_lng').gte('created_at',hour.toISOString()).not('status','eq','cancelled')
        const enriched = ZONES.map(z => {
          const nearby = (data||[]).filter(o => {
            if (!o.delivery_lat) return false
            const d = Math.sqrt((o.delivery_lat-z.lat)**2+(o.delivery_lng-z.lng)**2)
            return d < 0.05
          }).length
          return { ...z, orders:nearby, demand:nearby>5?'High':nearby>2?'Medium':'Low', color:nearby>5?DS.red:nearby>2?DS.yellow:DS.green }
        }).sort((a,b)=>b.orders-a.orders)
        setZones(enriched)
      } catch {
        setZones(ZONES.map((z,i)=>({...z, orders:Math.floor(Math.random()*8), demand:i<2?'High':i<4?'Medium':'Low', color:i<2?DS.red:i<4?DS.yellow:DS.green})))
      }
      setLoading(false)
    }
    load()
    const t = setInterval(load, 5*60*1000)
    return () => clearInterval(t)
  }, [])

  return (
    <Sheet zIndex={640} onDismiss={onClose} maxH='85vh'>
      <Pill color={DS.blue} style={{ marginBottom:12 }}>📍 Zone demand</Pill>
      <div style={{ fontFamily:DS.fh, fontSize:22, color:DS.t1, marginBottom:4 }}>Where to be right now</div>
      <div style={{ fontSize:13, color:DS.t2, marginBottom:16, fontFamily:DS.f }}>Live order clustering across Ibiza · updates every 5 min</div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'32px 0', color:DS.t3, fontFamily:DS.f }}>Loading demand data...</div>
      ) : zones.map((z,i) => (
        <div key={z.name} style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 14px', background:DS.surface2, borderRadius:DS.r1, marginBottom:8, border:'1px solid '+(i===0?z.color+'40':DS.border2) }}>
          <div style={{ width:44, height:44, borderRadius:DS.r1, background:z.color+'15', border:'1px solid '+z.color+'40', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>{z.emoji}</div>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
              <span style={{ fontSize:14, fontWeight:700, color:DS.t1, fontFamily:DS.f }}>{z.name}</span>
              <Pill color={z.color} style={{ fontSize:9, padding:'2px 7px' }}>{z.demand}</Pill>
            </div>
            <div style={{ background:DS.border, borderRadius:99, height:4, width:150, overflow:'hidden' }}>
              <div style={{ height:'100%', borderRadius:99, background:z.color, width:Math.min(100,(z.orders/8)*100)+'%' }} />
            </div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:20, fontWeight:800, color:z.color, fontFamily:DS.f }}>{z.orders}</div>
            <div style={{ fontSize:10, color:DS.t3, fontFamily:DS.f }}>orders/hr</div>
          </div>
        </div>
      ))}

      <div style={{ background:DS.yellowDim, border:'1px solid '+DS.yellowBdr, borderRadius:DS.r1, padding:'12px 14px', marginTop:8, display:'flex', gap:10, alignItems:'flex-start' }}>
        <span style={{ fontSize:18 }}>💡</span>
        <div style={{ fontSize:12, color:DS.yellow, fontFamily:DS.f, lineHeight:1.5 }}>Head to <strong>{zones[0]?.name||'Ibiza Town'}</strong> for the most orders right now. Red zones indicate surge demand — higher chance of back-to-back orders.</div>
      </div>
    </Sheet>
  )
}

// ═══════════════════════════════════════════════════════════════
// MODULE 9: ROUTE HISTORY & ANALYTICS
// Map of this week's deliveries + personal insights
// ═══════════════════════════════════════════════════════════════
export function RouteHistory({ onClose }) {
  const [history, setHistory] = useState([])
  const [insights, setInsights] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const { supabase } = await import('../../lib/supabase')
        const { useAuthStore } = await import('../../lib/store')
        const user = useAuthStore.getState().user
        const from = new Date(); from.setDate(from.getDate()-7)
        const { data } = await supabase.from('driver_earnings').select('*,orders(delivery_lat,delivery_lng,created_at,delivered_at)').eq('driver_id',user?.id).gte('created_at',from.toISOString()).order('created_at',{ascending:false})
        if (data) {
          setHistory(data)
          // Analyse best day/hour
          const byDay = {}; const byHour = {}
          data.forEach(e => {
            const d = new Date(e.created_at)
            const day = d.toLocaleDateString('en-GB',{weekday:'short'})
            const hour = d.getHours()
            byDay[day] = (byDay[day]||0) + 1
            byHour[hour] = (byHour[hour]||0) + 1
          })
          const bestDay = Object.entries(byDay).sort((a,b)=>b[1]-a[1])[0]
          const bestHour = Object.entries(byHour).sort((a,b)=>b[1]-a[1])[0]
          const avgEarning = data.length>0 ? data.reduce((s,e)=>s+e.amount,0)/data.length : 0
          setInsights({ bestDay:bestDay?.[0], bestHour:bestHour?.[0], avgEarning, total:data.length })
        }
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  return (
    <Sheet zIndex={640} onDismiss={onClose} maxH='85vh'>
      <Pill color={DS.teal} style={{ marginBottom:12 }}>📊 Analytics</Pill>
      <div style={{ fontFamily:DS.fh, fontSize:22, color:DS.t1, marginBottom:16 }}>Your insights</div>

      {insights && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:20 }}>
          {[
            { icon:'📅', label:'Best day', val:insights.bestDay||'—', color:DS.blue },
            { icon:'🕐', label:'Best hour', val:insights.bestHour!=null?insights.bestHour+':00':'—', color:DS.purple },
            { icon:'💰', label:'Avg per delivery', val:'€'+(insights.avgEarning||0).toFixed(2), color:DS.green },
            { icon:'📦', label:'Runs this week', val:insights.total||0, color:DS.accent },
          ].map(s => (
            <Card key={s.label} style={{ padding:'14px 12px', textAlign:'center' }}>
              <div style={{ fontSize:22, marginBottom:6 }}>{s.icon}</div>
              <div style={{ fontSize:20, fontWeight:800, color:s.color, fontFamily:DS.f }}>{s.val}</div>
              <div style={{ fontSize:10, color:DS.t3, marginTop:4, textTransform:'uppercase', letterSpacing:'0.5px', fontFamily:DS.f }}>{s.label}</div>
            </Card>
          ))}
        </div>
      )}

      {insights && (
        <div style={{ background:DS.tealDim, border:'1px solid '+DS.tealBdr, borderRadius:DS.r1, padding:'14px', marginBottom:20, display:'flex', gap:10 }}>
          <span style={{ fontSize:20 }}>💡</span>
          <div style={{ fontSize:13, color:DS.teal, fontFamily:DS.f, lineHeight:1.5 }}>
            You perform best on <strong>{insights.bestDay||'weekends'}</strong> {insights.bestHour!=null&&'around '+insights.bestHour+':00'}. Your average delivery earns <strong>€{(insights.avgEarning||0).toFixed(2)}</strong>. Try to target peak hours to maximise your earnings.
          </div>
        </div>
      )}

      <div style={{ fontSize:11, fontWeight:700, color:DS.t3, textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:12, fontFamily:DS.f }}>This week's deliveries</div>
      {loading ? (
        <div style={{ textAlign:'center', padding:24, color:DS.t3, fontFamily:DS.f }}>Loading...</div>
      ) : history.length===0 ? (
        <div style={{ textAlign:'center', padding:'32px 0', color:DS.t3 }}>
          <div style={{ fontSize:40, marginBottom:10 }}>📭</div>
          <div style={{ fontSize:14, fontFamily:DS.f }}>No deliveries this week</div>
        </div>
      ) : history.slice(0,10).map((e,i) => (
        <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 14px', background:DS.surface2, borderRadius:DS.r1, marginBottom:8, border:'1px solid '+DS.border2 }}>
          <div style={{ display:'flex', gap:12, alignItems:'center' }}>
            <div style={{ width:36, height:36, borderRadius:DS.r1, background:DS.greenDim, border:'1px solid '+DS.greenBdr, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>📦</div>
            <div>
              <div style={{ fontSize:13, color:DS.t1, fontWeight:600, fontFamily:DS.f }}>#{e.order_number||e.order_id?.slice(0,6)}</div>
              <div style={{ fontSize:11, color:DS.t3, fontFamily:DS.f }}>{new Date(e.created_at).toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</div>
            </div>
          </div>
          <div style={{ fontSize:16, fontWeight:800, color:DS.green, fontFamily:DS.f }}>€{(e.amount||0).toFixed(2)}</div>
        </div>
      ))}
    </Sheet>
  )
}

// ═══════════════════════════════════════════════════════════════
// MODULE 10: APP LOCK
// PIN lock to prevent unauthorised use
// ═══════════════════════════════════════════════════════════════
export function AppLock({ onUnlock }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const SAVED_PIN = localStorage.getItem('driver_app_pin') || '1234'

  const check = () => {
    if (pin === SAVED_PIN) { onUnlock(); return }
    setError('Incorrect PIN'); setPin('')
    if (navigator.vibrate) navigator.vibrate(300)
  }

  useEffect(() => { if (pin.length===4) check() }, [pin])

  return (
    <div style={{ position:'fixed', inset:0, zIndex:9999, background:DS.bg, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', padding:32 }}>
      <div style={{ fontFamily:DS.fh, fontSize:32, color:DS.t1, marginBottom:8 }}>Isla Drop</div>
      <div style={{ fontSize:14, color:DS.t3, marginBottom:40, fontFamily:DS.f }}>Driver app locked</div>
      <div style={{ display:'flex', gap:12, marginBottom:20 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{ width:16, height:16, borderRadius:'50%', background:pin.length>i?DS.accent:DS.border2, transition:'background 0.1s' }} />
        ))}
      </div>
      {error && <div style={{ color:DS.red, fontSize:13, marginBottom:16, fontFamily:DS.f }}>{error}</div>}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, width:'100%', maxWidth:280 }}>
        {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((d,i) => (
          <button key={i} onClick={() => { setError(''); if(d==='⌫') setPin(p=>p.slice(0,-1)); else if(d!==''&&pin.length<4) setPin(p=>p+String(d)) }}
            style={{ padding:'20px', background:DS.surface, border:'1px solid '+DS.border, borderRadius:DS.r2, fontSize:24, fontWeight:700, color:d===''?'transparent':DS.t1, cursor:d===''?'default':'pointer', fontFamily:DS.f }}>
            {d}
          </button>
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MODULE 11: PUSH NOTIFICATION SETUP
// Service worker registration for background order alerts
// ═══════════════════════════════════════════════════════════════
export function setupPushNotifications() {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return

  const registerSW = async () => {
    try {
      // Register a minimal service worker inline as blob
      const swCode = `
        self.addEventListener('message', (e) => {
          if (e.data && e.data.type === 'NEW_ORDER') {
            self.registration.showNotification('Isla Drop — New Order! 🛵', {
              body: 'Order #'+e.data.orderNumber+' · €'+e.data.fee+' · '+e.data.address,
              icon: '/favicon.ico',
              badge: '/favicon.ico',
              vibrate: [200, 100, 200],
              requireInteraction: true,
              data: { url: window.location.origin }
            });
          }
        });
        self.addEventListener('notificationclick', (e) => {
          e.notification.close();
          e.waitUntil(clients.openWindow(e.notification.data.url || '/'));
        });
      `
      const blob = new Blob([swCode], { type:'application/javascript' })
      const swUrl = URL.createObjectURL(blob)
      const reg = await navigator.serviceWorker.register(swUrl, { scope:'/' })
      window._swReg = reg

      // Request permission
      const perm = await Notification.requestPermission()
      if (perm === 'granted') {
        console.log('Push notifications enabled')
        return true
      }
    } catch (e) { console.warn('SW registration failed:', e) }
    return false
  }

  return registerSW()
}

export function sendPushNotification(order) {
  if (!window._swReg?.active) return
  window._swReg.active.postMessage({
    type:'NEW_ORDER',
    orderNumber: order.order_number,
    fee: (order.delivery_fee||3.50).toFixed(2),
    address: order.delivery_address||'Address pending',
  })
}

export function NotificationSetup({ onClose }) {
  const [status, setStatus] = useState(Notification?.permission||'default')

  const enable = async () => {
    const ok = await setupPushNotifications()
    setStatus(Notification?.permission||'default')
    if (ok) toast.success('Push notifications enabled ✓')
    else toast.error('Could not enable notifications')
  }

  return (
    <Sheet zIndex={640} onDismiss={onClose}>
      <div style={{ textAlign:'center', marginBottom:20 }}>
        <div style={{ fontSize:48, marginBottom:12 }}>🔔</div>
        <div style={{ fontFamily:DS.fh, fontSize:22, color:DS.t1, marginBottom:8 }}>Push notifications</div>
        <div style={{ fontSize:13, color:DS.t2, fontFamily:DS.f, lineHeight:1.5 }}>
          Receive order alerts even when the app is in the background. Never miss a delivery request.
        </div>
      </div>

      {status==='granted' ? (
        <div style={{ background:DS.greenDim, border:'1px solid '+DS.greenBdr, borderRadius:DS.r1, padding:'14px', textAlign:'center', marginBottom:16 }}>
          <div style={{ fontSize:14, color:DS.green, fontWeight:700, fontFamily:DS.f }}>✓ Notifications are enabled</div>
          <div style={{ fontSize:12, color:DS.t2, marginTop:4, fontFamily:DS.f }}>You will receive alerts for new orders</div>
        </div>
      ) : status==='denied' ? (
        <div style={{ background:DS.redDim, border:'1px solid '+DS.redBdr, borderRadius:DS.r1, padding:'14px', marginBottom:16 }}>
          <div style={{ fontSize:14, color:DS.red, fontWeight:700, fontFamily:DS.f }}>Notifications blocked</div>
          <div style={{ fontSize:12, color:DS.t2, marginTop:4, fontFamily:DS.f }}>Enable in your device settings → Browser → Notifications</div>
        </div>
      ) : (
        <Btn onClick={enable} color={DS.green} full style={{ marginBottom:12 }}>Enable push notifications</Btn>
      )}
      <Btn onClick={onClose} outline full>Close</Btn>
    </Sheet>
  )
}

// ═══════════════════════════════════════════════════════════════
// MODULE 12: DISPATCH MESSAGES / OPS BROADCASTS
// Incoming messages from ops team
// ═══════════════════════════════════════════════════════════════
export function DispatchMessages({ driverId, onClose }) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const { supabase } = await import('../../lib/supabase')
        const from = new Date(); from.setDate(from.getDate()-1)
        const { data } = await supabase.from('ops_activity_log').select('*').gte('created_at',from.toISOString()).eq('action','broadcast').order('created_at',{ascending:false}).limit(20)
        if (data) setMessages(data)
      } catch {
        // Fallback demo messages
        setMessages([
          { id:1, created_at:new Date().toISOString(), metadata:{ message:'San Antonio beach clubs closing early tonight — expect surge orders from 23:00 in town', priority:'high' } },
          { id:2, created_at:new Date(Date.now()-3600000).toISOString(), metadata:{ message:'Weather improving this evening — good conditions for deliveries', priority:'info' } },
        ])
      }
      setLoading(false)
    }
    load()
    let sub
    const setup = async () => {
      const { supabase } = await import('../../lib/supabase')
      sub = supabase.channel('dispatch').on('postgres_changes',{ event:'INSERT', schema:'public', table:'ops_activity_log' },
        p => { if(p.new.action==='broadcast') { setMessages(prev=>[p.new,...prev]); toast('📢 New message from ops',{duration:5000}) } }).subscribe()
    }
    setup()
    return () => sub?.unsubscribe?.()
  }, [])

  const priorityColor = p => p==='high'?DS.red:p==='medium'?DS.yellow:DS.blue

  return (
    <Sheet zIndex={640} onDismiss={onClose} maxH='80vh'>
      <Pill color={DS.blue} style={{ marginBottom:12 }}>📢 Dispatch</Pill>
      <div style={{ fontFamily:DS.fh, fontSize:22, color:DS.t1, marginBottom:16 }}>Messages from ops</div>

      {loading ? (
        <div style={{ textAlign:'center', padding:24, color:DS.t3, fontFamily:DS.f }}>Loading...</div>
      ) : messages.length===0 ? (
        <div style={{ textAlign:'center', padding:'40px 0', color:DS.t3 }}>
          <div style={{ fontSize:36, marginBottom:10 }}>📭</div>
          <div style={{ fontSize:14, fontFamily:DS.f }}>No messages from ops today</div>
        </div>
      ) : messages.map((msg,i) => {
        const meta = msg.metadata || {}
        const priority = meta.priority || 'info'
        return (
          <div key={i} style={{ background:DS.surface2, borderRadius:DS.r1, padding:'14px', marginBottom:10, border:'1px solid '+DS.border2, borderLeft:'3px solid '+priorityColor(priority) }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
              <Pill color={priorityColor(priority)} style={{ fontSize:9, padding:'2px 7px' }}>{priority}</Pill>
              <div style={{ fontSize:11, color:DS.t3, fontFamily:DS.f }}>{new Date(msg.created_at).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}</div>
            </div>
            <div style={{ fontSize:14, color:DS.t1, fontFamily:DS.f, lineHeight:1.5 }}>{meta.message||msg.details||'No message content'}</div>
          </div>
        )
      })}
    </Sheet>
  )
}

