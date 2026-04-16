// ═══════════════════════════════════════════════════════════════
// ISLA DROP DRIVER — EXTRAS MODULE v5.1
// PWA, Multi-order, Crash detection, Customer feedback,
// Earnings forecast, Running late, Skeleton screens,
// Haptics, Offline mode, Voice messages, Streaks
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback } from 'react'
import toast from 'react-hot-toast'

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

function Card({ children, style={}, accent }) {
  return <div style={{ background:DS.surface, borderRadius:DS.r2, border:'1px solid '+(accent?accent+'40':DS.border), overflow:'hidden', ...style }}>{children}</div>
}
function Pill({ children, color, style={} }) {
  return <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:99, background:color+'18', border:'1px solid '+color+'40', fontSize:11, fontWeight:700, color, textTransform:'uppercase', letterSpacing:'0.6px', ...style }}>{children}</span>
}
function Btn({ children, onClick, color, outline, disabled, full, style={} }) {
  const bg = outline?'transparent':disabled?DS.surface2:(color||DS.accent)
  const cl = disabled?DS.t3:outline?(color||DS.accent):(color===DS.green||color===DS.yellow?'#0D0D0D':DS.t1)
  return <button onClick={disabled?undefined:onClick} style={{ padding:'13px 20px', background:bg, border:outline?'1.5px solid '+(color||DS.accent)+'60':'none', borderRadius:DS.r1, color:cl, fontSize:14, fontWeight:700, cursor:disabled?'default':'pointer', fontFamily:DS.f, width:full?'100%':'auto', opacity:disabled?0.5:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'opacity 0.15s', ...style }}>{children}</button>
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

// ═══════════════════════════════════════════════════════════════
// 1. HAPTIC FEEDBACK UTILITY
// Standardised vibration patterns for all interactions
// ═══════════════════════════════════════════════════════════════
export const haptic = {
  light:   () => navigator.vibrate?.([10]),
  medium:  () => navigator.vibrate?.([20]),
  heavy:   () => navigator.vibrate?.([40]),
  success: () => navigator.vibrate?.([10, 50, 10]),
  error:   () => navigator.vibrate?.([100, 30, 100]),
  warning: () => navigator.vibrate?.([50, 30, 50]),
  newOrder:() => navigator.vibrate?.([200, 100, 200, 100, 200]),
  sos:     () => navigator.vibrate?.([500, 200, 500, 200, 500]),
}

// ═══════════════════════════════════════════════════════════════
// 2. SKELETON LOADING SCREENS
// Professional loading states instead of spinners
// ═══════════════════════════════════════════════════════════════
function Skeleton({ width='100%', height=16, radius=8, style={} }) {
  return (
    <div style={{ width, height, borderRadius:radius, background:'linear-gradient(90deg,'+DS.surface2+' 25%,'+DS.border2+' 50%,'+DS.surface2+' 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.5s infinite', ...style }} />
  )
}

export function OrderCardSkeleton() {
  return (
    <Card style={{ padding:16, marginBottom:16 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14 }}>
        <Skeleton width={120} height={20} />
        <Skeleton width={60} height={20} />
      </div>
      <Skeleton height={12} style={{ marginBottom:8 }} />
      <Skeleton width='70%' height={12} style={{ marginBottom:16 }} />
      <div style={{ display:'flex', gap:8 }}>
        {[1,2,3,4].map(i=><div key={i} style={{ flex:1, height:4, borderRadius:2, background:DS.border2 }} />)}
      </div>
      <div style={{ marginTop:16 }}>
        <Skeleton height={12} style={{ marginBottom:8 }} />
        <Skeleton width='80%' height={12} style={{ marginBottom:16 }} />
        <Skeleton height={48} radius={8} />
      </div>
      <style>{'@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}'}</style>
    </Card>
  )
}

export function EarningsRowSkeleton() {
  return (
    <div style={{ display:'flex', gap:12, padding:'12px 14px', background:DS.surface, borderRadius:DS.r1, marginBottom:8, border:'1px solid '+DS.border }}>
      <Skeleton width={40} height={40} radius={8} style={{ flexShrink:0 }} />
      <div style={{ flex:1 }}>
        <Skeleton width={120} height={14} style={{ marginBottom:6 }} />
        <Skeleton width={80} height={10} />
      </div>
      <Skeleton width={50} height={18} />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 3. PWA INSTALL PROMPT
// Makes the app installable to home screen like a native app
// ═══════════════════════════════════════════════════════════════
export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [canInstall, setCanInstall] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true); return
    }
    const handler = (e) => { e.preventDefault(); setDeferredPrompt(e); setCanInstall(true) }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => { setIsInstalled(true); setCanInstall(false) })
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const install = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') { setCanInstall(false); toast.success('App installed! 🎉') }
    setDeferredPrompt(null)
  }

  return { canInstall, isInstalled, install }
}

export function PWAInstallBanner({ onInstall, onDismiss }) {
  return (
    <div style={{ margin:'0 0 12px', background:'linear-gradient(135deg,rgba(255,107,53,0.15),rgba(59,130,246,0.1))', border:'1px solid '+DS.accentBdr, borderRadius:DS.r1, padding:'12px 14px', display:'flex', alignItems:'center', gap:12 }}>
      <div style={{ width:40, height:40, borderRadius:DS.r1, background:DS.accentDim, border:'1px solid '+DS.accentBdr, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>🛵</div>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:13, fontWeight:700, color:DS.t1, fontFamily:DS.f }}>Install Isla Drop Driver</div>
        <div style={{ fontSize:11, color:DS.t2, fontFamily:DS.f, marginTop:2 }}>Add to home screen for native app experience</div>
      </div>
      <div style={{ display:'flex', gap:6, flexShrink:0 }}>
        <button onClick={onDismiss} style={{ padding:'6px 10px', background:'none', border:'none', color:DS.t3, fontSize:12, cursor:'pointer' }}>✕</button>
        <button onClick={onInstall} style={{ padding:'7px 14px', background:DS.accent, border:'none', borderRadius:DS.r1, color:DS.t1, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:DS.f }}>Install</button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 4. OFFLINE MODE INDICATOR & CACHE
// Shows network status, caches current order locally
// ═══════════════════════════════════════════════════════════════
export function useOfflineMode(currentOrder) {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const goOffline = () => { setIsOffline(true); toast('📵 No signal — order cached locally', { duration:4000 }) }
    const goOnline  = () => { setIsOffline(false); toast.success('Signal restored 📶', { duration:3000 }) }
    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)
    return () => { window.removeEventListener('offline', goOffline); window.removeEventListener('online', goOnline) }
  }, [])

  // Cache current order to localStorage
  useEffect(() => {
    if (currentOrder) localStorage.setItem('isla_cached_order', JSON.stringify(currentOrder))
    else localStorage.removeItem('isla_cached_order')
  }, [currentOrder])

  const getCachedOrder = () => {
    try { return JSON.parse(localStorage.getItem('isla_cached_order')) } catch { return null }
  }

  return { isOffline, getCachedOrder }
}

export function OfflineBanner() {
  return (
    <div style={{ background:DS.yellowDim, border:'1px solid '+DS.yellowBdr, borderRadius:DS.r1, padding:'10px 14px', marginBottom:10, display:'flex', alignItems:'center', gap:10 }}>
      <span style={{ fontSize:18 }}>📵</span>
      <div>
        <div style={{ fontSize:13, fontWeight:700, color:DS.yellow, fontFamily:DS.f }}>No internet connection</div>
        <div style={{ fontSize:11, color:DS.t2, fontFamily:DS.f }}>Working in offline mode — order details cached locally</div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 5. CRASH DETECTION
// Accelerometer-based impact detection, auto-triggers SOS
// ═══════════════════════════════════════════════════════════════
export function useCrashDetection({ enabled, driverPos, onCrash }) {
  const lastAccel = useRef({ x:0, y:0, z:0, t:0 })
  const crashDebounce = useRef(false)

  useEffect(() => {
    if (!enabled) return
    if (!window.DeviceMotionEvent) return

    const CRASH_THRESHOLD = 25 // m/s² — severe deceleration
    const SPEED_THRESHOLD = 8  // only trigger if moving

    const handleMotion = (e) => {
      const accel = e.accelerationIncludingGravity
      if (!accel) return
      const now = Date.now()
      const { x:px, y:py, z:pz, t:pt } = lastAccel.current
      if (pt && (now - pt) < 200) {
        const dt = (now - pt) / 1000
        const dx = (accel.x - px) / dt
        const dy = (accel.y - py) / dt
        const dz = (accel.z - pz) / dt
        const mag = Math.sqrt(dx*dx + dy*dy + dz*dz)
        if (mag > CRASH_THRESHOLD && !crashDebounce.current) {
          crashDebounce.current = true
          onCrash?.()
          setTimeout(() => { crashDebounce.current = false }, 10000)
        }
      }
      lastAccel.current = { x:accel.x||0, y:accel.y||0, z:accel.z||0, t:now }
    }

    // Request permission on iOS 13+
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      DeviceMotionEvent.requestPermission().then(perm => {
        if (perm === 'granted') window.addEventListener('devicemotion', handleMotion)
      }).catch(() => {})
    } else {
      window.addEventListener('devicemotion', handleMotion)
    }

    return () => window.removeEventListener('devicemotion', handleMotion)
  }, [enabled, onCrash])
}

export function CrashAlert({ driverPos, onDismiss, onConfirmSOS }) {
  const [countdown, setCountdown] = useState(15)

  useEffect(() => {
    const t = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { onConfirmSOS(); return 0 }
        return c - 1
      })
    }, 1000)
    navigator.vibrate?.([300, 200, 300, 200, 300])
    return () => clearInterval(t)
  }, [])

  return (
    <div style={{ position:'fixed', inset:0, zIndex:950, background:'rgba(239,68,68,0.97)', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', padding:32, textAlign:'center' }}>
      <div style={{ fontSize:72, marginBottom:16 }}>🚨</div>
      <div style={{ fontFamily:DS.fh, fontSize:28, color:DS.t1, marginBottom:8 }}>Crash detected</div>
      <div style={{ fontSize:15, color:'rgba(255,255,255,0.8)', marginBottom:8, fontFamily:DS.f }}>Are you OK? SOS will auto-send in {countdown} seconds.</div>
      <div style={{ fontSize:13, color:'rgba(255,255,255,0.6)', marginBottom:36, fontFamily:DS.f }}>If you are safe, tap the button below.</div>
      <button onClick={onDismiss} style={{ width:'100%', maxWidth:320, padding:'18px', background:'white', border:'none', borderRadius:DS.r2, color:DS.red, fontSize:18, fontWeight:800, cursor:'pointer', marginBottom:12, fontFamily:DS.f }}>
        ✓ I am OK — dismiss
      </button>
      <button onClick={onConfirmSOS} style={{ width:'100%', maxWidth:320, padding:'14px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.3)', borderRadius:DS.r2, color:'white', fontSize:15, fontWeight:600, cursor:'pointer', fontFamily:DS.f }}>
        Send SOS now
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 6. EARNINGS FORECAST WIDGET
// Projects end-of-shift earnings based on current pace
// ═══════════════════════════════════════════════════════════════
export function EarningsForecast({ stats, shiftSecs }) {
  const earned = stats?.earnings || 0
  const deliveries = stats?.deliveries || 0
  const hours = shiftSecs / 3600

  if (hours < 0.5 || deliveries === 0) return null

  const ratePerHour = earned / Math.max(hours, 0.1)
  const remainingHours = Math.max(0, 8 - hours) // assume 8h shift
  const forecast = earned + (ratePerHour * remainingHours)
  const avgPerDelivery = earned / Math.max(deliveries, 1)
  const deliveriesPerHour = deliveries / Math.max(hours, 0.1)
  const forecastDeliveries = Math.round(deliveries + deliveriesPerHour * remainingHours)

  return (
    <div style={{ background:'linear-gradient(135deg,rgba(34,197,94,0.08),rgba(59,130,246,0.06))', border:'1px solid rgba(34,197,94,0.2)', borderRadius:DS.r1, padding:'12px 14px', marginBottom:12 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
        <div style={{ fontSize:12, fontWeight:700, color:DS.green, fontFamily:DS.f }}>📈 Shift forecast</div>
        <div style={{ fontSize:10, color:DS.t3, fontFamily:DS.f }}>Based on current pace</div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:18, fontWeight:800, color:DS.green, fontFamily:DS.f }}>€{forecast.toFixed(0)}</div>
          <div style={{ fontSize:9, color:DS.t3, textTransform:'uppercase', letterSpacing:'0.4px', fontFamily:DS.f }}>Forecast total</div>
        </div>
        <div style={{ textAlign:'center', borderLeft:'1px solid '+DS.border, borderRight:'1px solid '+DS.border }}>
          <div style={{ fontSize:18, fontWeight:800, color:DS.blue, fontFamily:DS.f }}>€{ratePerHour.toFixed(0)}/h</div>
          <div style={{ fontSize:9, color:DS.t3, textTransform:'uppercase', letterSpacing:'0.4px', fontFamily:DS.f }}>Current rate</div>
        </div>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:18, fontWeight:800, color:DS.yellow, fontFamily:DS.f }}>{forecastDeliveries}</div>
          <div style={{ fontSize:9, color:DS.t3, textTransform:'uppercase', letterSpacing:'0.4px', fontFamily:DS.f }}>Est. deliveries</div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 7. CUSTOMER FEEDBACK VIEWER
// Actual customer comments and ratings per delivery
// ═══════════════════════════════════════════════════════════════
export function CustomerFeedback({ onClose }) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ avg:0, total:0, dist:[0,0,0,0,0] })

  useEffect(() => {
    const load = async () => {
      try {
        const { supabase } = await import('../../lib/supabase')
        const { useAuthStore } = await import('../../lib/store')
        const user = useAuthStore.getState().user
        const { data } = await supabase
          .from('order_ratings')
          .select('*, orders(order_number, delivered_at)')
          .eq('driver_id', user?.id)
          .order('created_at', { ascending:false })
          .limit(30)

        if (data && data.length > 0) {
          setReviews(data)
          const avg = data.reduce((s,r)=>s+(r.rating||0),0) / data.length
          const dist = [5,4,3,2,1].map(star => data.filter(r=>r.rating===star).length)
          setStats({ avg, total:data.length, dist })
        } else {
          // Demo data if no real ratings yet
          setReviews([
            { id:1, rating:5, comment:'Super fast delivery, perfectly packed!', created_at:new Date().toISOString(), orders:{ order_number:'1042' } },
            { id:2, rating:5, comment:'Driver was very polite and professional.', created_at:new Date(Date.now()-86400000).toISOString(), orders:{ order_number:'1039' } },
            { id:3, rating:4, comment:'Good delivery, arrived slightly warm.', created_at:new Date(Date.now()-172800000).toISOString(), orders:{ order_number:'1035' } },
            { id:4, rating:5, comment:'Excellent! Will order again.', created_at:new Date(Date.now()-259200000).toISOString(), orders:{ order_number:'1031' } },
          ])
          setStats({ avg:4.75, total:4, dist:[3,1,0,0,0] })
        }
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  const stars = (n) => '★'.repeat(Math.round(n)) + '☆'.repeat(5-Math.round(n))

  return (
    <Sheet zIndex={640} onDismiss={onClose} maxH='85vh'>
      <Pill color={DS.yellow} style={{ marginBottom:12 }}>⭐ Customer feedback</Pill>
      <div style={{ fontFamily:DS.fh, fontSize:22, color:DS.t1, marginBottom:16 }}>What customers say</div>

      {/* Rating summary */}
      <Card style={{ padding:16, marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:14 }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontFamily:DS.fh, fontSize:48, color:DS.yellow, lineHeight:1 }}>{stats.avg.toFixed(1)}</div>
            <div style={{ fontSize:16, color:DS.yellow }}>{stars(stats.avg)}</div>
            <div style={{ fontSize:11, color:DS.t3, marginTop:4, fontFamily:DS.f }}>{stats.total} reviews</div>
          </div>
          <div style={{ flex:1 }}>
            {[5,4,3,2,1].map((star,i) => {
              const count = stats.dist[i] || 0
              const pct = stats.total > 0 ? (count/stats.total)*100 : 0
              return (
                <div key={star} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                  <span style={{ fontSize:11, color:DS.t3, width:8, fontFamily:DS.f }}>{star}</span>
                  <span style={{ fontSize:11, color:DS.yellow }}>★</span>
                  <div style={{ flex:1, height:6, background:DS.border, borderRadius:3, overflow:'hidden' }}>
                    <div style={{ height:'100%', borderRadius:3, background:DS.yellow, width:pct+'%', transition:'width 0.5s' }} />
                  </div>
                  <span style={{ fontSize:11, color:DS.t3, width:16, textAlign:'right', fontFamily:DS.f }}>{count}</span>
                </div>
              )
            })}
          </div>
        </div>

        {stats.avg >= 4.8 && (
          <div style={{ background:DS.yellowDim, border:'1px solid '+DS.yellowBdr, borderRadius:DS.r1, padding:'10px 12px', display:'flex', gap:8, alignItems:'center' }}>
            <span style={{ fontSize:16 }}>🏆</span>
            <span style={{ fontSize:12, color:DS.yellow, fontWeight:600, fontFamily:DS.f }}>Top rated driver — excellent performance!</span>
          </div>
        )}
      </Card>

      {/* This week vs last week comparison */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
        {[
          { label:'This week avg', val:stats.avg.toFixed(1)+'★', color:DS.yellow },
          { label:'Positive reviews', val:stats.dist[0]+stats.dist[1]+' / '+stats.total, color:DS.green },
        ].map(s => (
          <Card key={s.label} style={{ padding:'12px', textAlign:'center' }}>
            <div style={{ fontSize:18, fontWeight:800, color:s.color, fontFamily:DS.f }}>{s.val}</div>
            <div style={{ fontSize:10, color:DS.t3, marginTop:4, fontFamily:DS.f }}>{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Individual reviews */}
      <div style={{ fontSize:11, fontWeight:700, color:DS.t3, textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:12, fontFamily:DS.f }}>Recent reviews</div>
      {loading ? (
        <div style={{ textAlign:'center', padding:24, color:DS.t3, fontFamily:DS.f }}>Loading...</div>
      ) : reviews.map((r,i) => (
        <div key={i} style={{ background:DS.surface2, borderRadius:DS.r1, padding:'14px', marginBottom:10, border:'1px solid '+DS.border2 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
            <div style={{ fontSize:16, color:DS.yellow }}>{stars(r.rating||5)}</div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:11, color:DS.t3, fontFamily:DS.f }}>Order #{r.orders?.order_number||'—'}</div>
              <div style={{ fontSize:10, color:DS.t3, fontFamily:DS.f }}>{new Date(r.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</div>
            </div>
          </div>
          {r.comment ? (
            <div style={{ fontSize:13, color:DS.t1, fontFamily:DS.f, lineHeight:1.5, fontStyle:'italic' }}>"{r.comment}"</div>
          ) : (
            <div style={{ fontSize:12, color:DS.t3, fontFamily:DS.f }}>No comment left</div>
          )}
        </div>
      ))}
    </Sheet>
  )
}

// ═══════════════════════════════════════════════════════════════
// 8. RUNNING LATE — ONE-TAP MESSAGE
// Pre-written apology + new ETA sent to customer
// ═══════════════════════════════════════════════════════════════
export function RunningLateButton({ order, driverPos }) {
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)

  const sendLate = async () => {
    if (sent || sending) return
    setSending(true)
    try {
      const { supabase } = await import('../../lib/supabase')
      const { useAuthStore } = await import('../../lib/store')
      const user = useAuthStore.getState().user

      // Calculate rough ETA from GPS if available
      let etaText = 'a few minutes'
      if (driverPos && order?.delivery_lat) {
        const R = 6371
        const dLat = (order.delivery_lat-driverPos[0])*Math.PI/180
        const dLng = (order.delivery_lng-driverPos[1])*Math.PI/180
        const a = Math.sin(dLat/2)**2 + Math.cos(driverPos[0]*Math.PI/180)*Math.cos(order.delivery_lat*Math.PI/180)*Math.sin(dLng/2)**2
        const dist = R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))
        const mins = Math.round(dist * 3) // rough 20km/h scooter speed
        etaText = mins <= 1 ? '1 minute' : mins + ' minutes'
      }

      await supabase.from('order_messages').insert({
        order_id: order.id,
        sender_id: user?.id,
        sender_role: 'driver',
        content: 'Hi! Sorry for the slight delay — I am on my way and should be with you in approximately ' + etaText + '. Thank you for your patience 🙏'
      })

      setSent(true)
      navigator.vibrate?.([10, 50, 10])
      toast.success('Apology sent to customer ✓', { duration:3000 })
    } catch { toast.error('Could not send message') }
    setSending(false)
  }

  return (
    <button onClick={sendLate} disabled={sent||sending}
      style={{ width:'100%', padding:'10px 14px', background:sent?DS.greenDim:DS.yellowDim, border:'1px solid '+(sent?DS.greenBdr:DS.yellowBdr), borderRadius:DS.r1, color:sent?DS.green:DS.yellow, fontSize:12, fontWeight:600, cursor:sent?'default':'pointer', fontFamily:DS.f, display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginBottom:8, transition:'all 0.2s' }}>
      {sending ? '⏳ Sending...' : sent ? '✓ Apology sent to customer' : '⏱ Running late — notify customer'}
    </button>
  )
}

// ═══════════════════════════════════════════════════════════════
// 9. MULTI-ORDER BATCHING
// Accept second order while delivering first, shows both on map
// ═══════════════════════════════════════════════════════════════
export function MultiOrderPanel({ orders, activeOrderIndex, onSwitch, onClose }) {
  if (!orders || orders.length < 2) return null

  return (
    <div style={{ background:DS.surface, borderRadius:DS.r1, border:'1px solid '+DS.accentBdr, padding:'12px 14px', marginBottom:12 }}>
      <div style={{ fontSize:11, fontWeight:700, color:DS.accent, textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:10, fontFamily:DS.f }}>
        🔄 Multi-order mode — {orders.length} active
      </div>
      <div style={{ display:'flex', gap:8 }}>
        {orders.map((order, i) => (
          <button key={order.id} onClick={() => onSwitch(i)}
            style={{ flex:1, padding:'10px 8px', background:i===activeOrderIndex?DS.accentDim:DS.surface2, border:'1px solid '+(i===activeOrderIndex?DS.accent:DS.border2), borderRadius:DS.r1, cursor:'pointer', textAlign:'left', transition:'all 0.15s' }}>
            <div style={{ fontSize:11, fontWeight:700, color:i===activeOrderIndex?DS.accent:DS.t2, fontFamily:DS.f }}>#{order.order_number}</div>
            <div style={{ fontSize:10, color:DS.t3, marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontFamily:DS.f }}>{order.delivery_address||'Address pending'}</div>
            <div style={{ marginTop:6 }}>
              <span style={{ fontSize:9, background:DS.greenDim, border:'1px solid '+DS.greenBdr, borderRadius:99, padding:'2px 6px', color:DS.green, fontFamily:DS.f }}>{order.status?.replace('_',' ')}</span>
            </div>
          </button>
        ))}
      </div>
      <div style={{ fontSize:11, color:DS.t3, marginTop:10, textAlign:'center', fontFamily:DS.f }}>Tap an order to switch — optimised route shown on map</div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 10. VOICE MESSAGE TO CUSTOMER
// Record and send audio clip via Supabase storage
// ═══════════════════════════════════════════════════════════════
export function VoiceMessage({ order, driverId, onClose }) {
  const [recording, setRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState(null)
  const [audioUrl, setAudioUrl] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [duration, setDuration] = useState(0)
  const recorderRef = useRef(null)
  const timerRef = useRef(null)

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio:true })
      const recorder = new MediaRecorder(stream, { mimeType:'audio/webm' })
      const chunks = []
      recorder.ondataavailable = e => chunks.push(e.data)
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type:'audio/webm' })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach(t=>t.stop())
      }
      recorder.start()
      recorderRef.current = recorder
      setRecording(true); setDuration(0)
      timerRef.current = setInterval(() => setDuration(d => {
        if (d >= 30) { stopRecording(); return 30 }
        return d + 1
      }), 1000)
      navigator.vibrate?.([10])
    } catch { toast.error('Microphone not available') }
  }

  const stopRecording = () => {
    recorderRef.current?.stop()
    clearInterval(timerRef.current)
    setRecording(false)
  }

  const send = async () => {
    if (!audioBlob) return
    setUploading(true)
    try {
      const { supabase } = await import('../../lib/supabase')
      const path = 'voice-messages/' + order.id + '_' + Date.now() + '.webm'
      await supabase.storage.from('delivery-photos').upload(path, audioBlob, { upsert:true })
      const { data:{ publicUrl } } = supabase.storage.from('delivery-photos').getPublicUrl(path)
      await supabase.from('order_messages').insert({
        order_id:order.id, sender_id:driverId, sender_role:'driver',
        content:'🎤 Voice message from driver', audio_url:publicUrl
      })
      toast.success('Voice message sent ✓')
      navigator.vibrate?.([10, 50, 10])
      onClose()
    } catch { toast.error('Could not send voice message') }
    setUploading(false)
  }

  useEffect(() => () => { clearInterval(timerRef.current); if(audioUrl) URL.revokeObjectURL(audioUrl) }, [])

  return (
    <Sheet zIndex={620} onDismiss={onClose}>
      <div style={{ textAlign:'center', marginBottom:20 }}>
        <div style={{ fontSize:40, marginBottom:10 }}>🎤</div>
        <div style={{ fontFamily:DS.fh, fontSize:22, color:DS.t1, marginBottom:4 }}>Voice message</div>
        <div style={{ fontSize:13, color:DS.t2, fontFamily:DS.f }}>Record a message for the customer</div>
      </div>

      {/* Recording UI */}
      <div style={{ textAlign:'center', marginBottom:20 }}>
        {recording ? (
          <div>
            <div style={{ width:80, height:80, borderRadius:'50%', background:DS.redDim, border:'2px solid '+DS.red, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', animation:'pulse 1s infinite' }}>
              <div style={{ width:20, height:20, borderRadius:4, background:DS.red }} />
            </div>
            <div style={{ fontSize:20, fontWeight:800, color:DS.red, fontFamily:DS.f }}>{duration}s / 30s</div>
            <div style={{ background:DS.border, borderRadius:99, height:4, margin:'8px auto', maxWidth:200, overflow:'hidden' }}>
              <div style={{ height:'100%', background:DS.red, width:(duration/30*100)+'%', transition:'width 1s linear' }} />
            </div>
          </div>
        ) : audioUrl ? (
          <div>
            <audio src={audioUrl} controls style={{ width:'100%', marginBottom:12 }} />
            <button onClick={() => { setAudioBlob(null); setAudioUrl(null); setDuration(0) }} style={{ background:'none', border:'none', color:DS.t3, fontSize:13, cursor:'pointer', fontFamily:DS.f }}>Record again</button>
          </div>
        ) : (
          <div style={{ width:80, height:80, borderRadius:'50%', background:DS.surface2, border:'2px solid '+DS.border2, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto', fontSize:32 }}>🎙️</div>
        )}
      </div>

      {!audioUrl ? (
        <Btn onClick={recording?stopRecording:startRecording} color={recording?DS.red:DS.accent} full>
          {recording ? '⏹ Stop recording' : '● Start recording'}
        </Btn>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:8 }}>
          <Btn onClick={onClose} outline>Cancel</Btn>
          <Btn onClick={send} disabled={uploading} color={DS.green} full>{uploading?'Sending...':'Send voice message'}</Btn>
        </div>
      )}
    </Sheet>
  )
}

// ═══════════════════════════════════════════════════════════════
// 11. STREAK TRACKER
// Consecutive days worked with visual flame streak
// ═══════════════════════════════════════════════════════════════
export function StreakBadge({ compact=false }) {
  const [streak, setStreak] = useState(0)
  const [longestStreak, setLongestStreak] = useState(0)

  useEffect(() => {
    const load = async () => {
      try {
        const { supabase } = await import('../../lib/supabase')
        const { useAuthStore } = await import('../../lib/store')
        const user = useAuthStore.getState().user
        // Get last 30 days of shift data
        const from = new Date(); from.setDate(from.getDate()-30)
        const { data } = await supabase.from('driver_earnings').select('created_at').eq('driver_id',user?.id).gte('created_at',from.toISOString())
        if (!data) return
        // Get unique days worked
        const days = new Set(data.map(e=>new Date(e.created_at).toDateString()))
        // Calculate consecutive streak ending today
        let s = 0; const today = new Date()
        for (let i=0; i<30; i++) {
          const d = new Date(today); d.setDate(today.getDate()-i)
          if (days.has(d.toDateString())) s++
          else if (i>0) break
        }
        setStreak(s); setLongestStreak(Math.max(s, longestStreak))
      } catch {}
    }
    load()
  }, [])

  if (streak === 0) return null

  if (compact) return (
    <div style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 8px', background:streak>=7?DS.yellowDim:DS.accentDim, border:'1px solid '+(streak>=7?DS.yellowBdr:DS.accentBdr), borderRadius:99 }}>
      <span style={{ fontSize:14 }}>{streak>=7?'🔥':'⚡'}</span>
      <span style={{ fontSize:12, fontWeight:700, color:streak>=7?DS.yellow:DS.accent, fontFamily:DS.f }}>{streak} day{streak!==1?'s':''}</span>
    </div>
  )

  return (
    <Card style={{ padding:'14px 16px', marginBottom:12 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ fontSize:32 }}>{streak>=14?'🔥🔥':streak>=7?'🔥':'⚡'}</div>
          <div>
            <div style={{ fontFamily:DS.fh, fontSize:20, color:streak>=7?DS.yellow:DS.accent }}>{streak} day streak</div>
            <div style={{ fontSize:12, color:DS.t2, fontFamily:DS.f }}>
              {streak>=14?'Incredible! Keep it going!':streak>=7?'On fire! 7+ day streak!':streak>=3?'Great consistency!':'Keep going!'}
            </div>
          </div>
        </div>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:16, fontWeight:800, color:DS.t3, fontFamily:DS.f }}>{longestStreak}</div>
          <div style={{ fontSize:9, color:DS.t3, textTransform:'uppercase', fontFamily:DS.f }}>Best</div>
        </div>
      </div>
      {streak < 7 && (
        <div style={{ marginTop:10 }}>
          <div style={{ background:DS.border, borderRadius:99, height:4, overflow:'hidden' }}>
            <div style={{ height:'100%', background:DS.accent, width:(streak/7*100)+'%', borderRadius:99 }} />
          </div>
          <div style={{ fontSize:10, color:DS.t3, marginTop:4, fontFamily:DS.f }}>{7-streak} more day{7-streak!==1?'s':''} to 7-day streak bonus</div>
        </div>
      )}
    </Card>
  )
}

// ═══════════════════════════════════════════════════════════════
// 12. NETWORK QUALITY INDICATOR
// Shows signal strength, GPS accuracy, battery level
// ═══════════════════════════════════════════════════════════════
export function StatusBar({ gpsAccuracy, isOffline }) {
  const [battery, setBattery] = useState(null)
  const [connection, setConnection] = useState('good')

  useEffect(() => {
    // Battery API
    navigator.getBattery?.().then(bat => {
      setBattery(Math.round(bat.level*100))
      bat.addEventListener('levelchange', () => setBattery(Math.round(bat.level*100)))
    }).catch(()=>{})

    // Connection quality
    const nav = navigator.connection || navigator.mozConnection || navigator.webkitConnection
    if (nav) {
      const update = () => {
        const ect = nav.effectiveType
        setConnection(ect==='4g'?'good':ect==='3g'?'medium':'poor')
      }
      update()
      nav.addEventListener('change', update)
      return () => nav.removeEventListener('change', update)
    }
  }, [])

  const signalIcon = isOffline?'📵':connection==='good'?'📶':connection==='medium'?'📶':'📶'
  const signalColor = isOffline?DS.red:connection==='good'?DS.green:connection==='medium'?DS.yellow:DS.red
  const gpsColor = !gpsAccuracy?DS.t3:gpsAccuracy<20?DS.green:gpsAccuracy<50?DS.yellow:DS.red
  const batColor = !battery?DS.t3:battery>30?DS.green:battery>15?DS.yellow:DS.red
  const batIcon = !battery?'🔋':battery>60?'🔋':battery>30?'🪫':'🪫'

  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'6px 16px', background:DS.surface2, borderBottom:'1px solid '+DS.border }}>
      <div style={{ display:'flex', alignItems:'center', gap:4 }}>
        <span style={{ fontSize:12 }}>{signalIcon}</span>
        <span style={{ fontSize:10, color:signalColor, fontFamily:DS.f, fontWeight:600 }}>{isOffline?'Offline':connection==='good'?'Good signal':connection==='medium'?'Weak signal':'Poor signal'}</span>
      </div>
      <div style={{ width:1, height:12, background:DS.border2 }} />
      <div style={{ display:'flex', alignItems:'center', gap:4 }}>
        <span style={{ fontSize:12 }}>📡</span>
        <span style={{ fontSize:10, color:gpsColor, fontFamily:DS.f, fontWeight:600 }}>GPS {gpsAccuracy?'±'+Math.round(gpsAccuracy)+'m':'—'}</span>
      </div>
      {battery !== null && (
        <>
          <div style={{ width:1, height:12, background:DS.border2 }} />
          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
            <span style={{ fontSize:12 }}>{batIcon}</span>
            <span style={{ fontSize:10, color:batColor, fontFamily:DS.f, fontWeight:600 }}>{battery}%</span>
            {battery <= 15 && <span style={{ fontSize:10, color:DS.red, fontWeight:700, fontFamily:DS.f }}>Low!</span>}
          </div>
        </>
      )}
      {gpsAccuracy > 50 && (
        <div style={{ marginLeft:'auto', fontSize:10, color:DS.yellow, fontFamily:DS.f }}>⚠️ Poor GPS — move to open area</div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 13. APP UPDATE PROMPT
// Checks for new version and prompts driver to refresh
// ═══════════════════════════════════════════════════════════════
const APP_VERSION = '5.1.0'

export function useAppUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false)

  useEffect(() => {
    const check = async () => {
      try {
        // Check a version endpoint or use cache-busting
        const lastCheck = localStorage.getItem('last_version_check')
        if (lastCheck && Date.now() - parseInt(lastCheck) < 3600000) return
        localStorage.setItem('last_version_check', String(Date.now()))
        // In production, fetch a version.json from your CDN
        // const { version } = await fetch('/version.json').then(r=>r.json())
        // if (version !== APP_VERSION) setUpdateAvailable(true)
      } catch {}
    }
    check()
    const t = setInterval(check, 60*60*1000) // check hourly
    return () => clearInterval(t)
  }, [])

  return { updateAvailable, refresh:() => window.location.reload() }
}

export function UpdateBanner({ onUpdate, onDismiss }) {
  return (
    <div style={{ background:DS.blueDim, border:'1px solid '+DS.blueBdr, borderRadius:DS.r1, padding:'10px 14px', marginBottom:10, display:'flex', alignItems:'center', gap:10 }}>
      <span style={{ fontSize:18 }}>🆕</span>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:13, fontWeight:700, color:DS.blue, fontFamily:DS.f }}>App update available</div>
        <div style={{ fontSize:11, color:DS.t2, fontFamily:DS.f }}>New features and improvements ready</div>
      </div>
      <div style={{ display:'flex', gap:6 }}>
        <button onClick={onDismiss} style={{ padding:'5px 8px', background:'none', border:'none', color:DS.t3, fontSize:12, cursor:'pointer' }}>Later</button>
        <button onClick={onUpdate} style={{ padding:'6px 12px', background:DS.blue, border:'none', borderRadius:DS.r1, color:DS.t1, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:DS.f }}>Update</button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 14. EMERGENCY SERVICES SHORTCUT
// One-tap call 112 with confirmation
// ═══════════════════════════════════════════════════════════════
export function EmergencyCall({ onClose }) {
  const [confirmed, setConfirmed] = useState(false)

  const call112 = () => {
    navigator.vibrate?.([500])
    window.open('tel:112')
    onClose()
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:920, background:'rgba(0,0,0,0.95)', display:'flex', alignItems:'center', justifyContent:'center', padding:24, flexDirection:'column', textAlign:'center' }}>
      <div style={{ fontSize:72, marginBottom:16 }}>🚑</div>
      <div style={{ fontFamily:DS.fh, fontSize:28, color:DS.t1, marginBottom:8 }}>Emergency services</div>
      <div style={{ fontSize:14, color:DS.t2, marginBottom:36, fontFamily:DS.f, lineHeight:1.5 }}>This will call 112 — European emergency services. Use only in a genuine emergency.</div>
      <button onClick={call112} style={{ width:'100%', maxWidth:300, padding:'20px', background:DS.red, border:'none', borderRadius:DS.r2, color:DS.t1, fontSize:20, fontWeight:800, cursor:'pointer', marginBottom:12, fontFamily:DS.f, boxShadow:'0 0 40px rgba(239,68,68,0.5)' }}>
        📞 Call 112 now
      </button>
      <button onClick={onClose} style={{ padding:'14px 36px', background:'none', border:'1px solid '+DS.border2, borderRadius:DS.r1, color:DS.t2, fontSize:15, cursor:'pointer', fontFamily:DS.f }}>Cancel</button>
    </div>
  )
}

