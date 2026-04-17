import React, { useState, useEffect, useCallback, useRef } from 'react'
import toast from 'react-hot-toast'
import {
  getAvailableOrders, acceptOrder, updateOrderStatus,
  updateDriverLocation, setDriverOnlineStatus,
  subscribeToAvailableOrders, supabase } from '../../lib/supabase'
import { useAuthStore, useDriverStore } from '../../lib/store'
import { useLeafletMap, PIN_ICON } from '../../lib/useLeafletMap'
import { calculateETA } from '../../lib/eta'
// DriverModules2 components - inline stubs until file is uploaded
function ScheduleAvailabilityTab({ profile }) {
  return <div style={{ padding:24, textAlign:'center', color:'#5A5A5A' }}>
    <div style={{ fontSize:40, marginBottom:12 }}>📅</div>
    <div style={{ fontFamily:'DM Serif Display,serif', fontSize:20, marginBottom:8 }}>Schedule coming soon</div>
    <div style={{ fontSize:13 }}>Upload DriverModules2.jsx to enable scheduling</div>
  </div>
}
function PayoutRequestTab({ profile }) {
  return <div style={{ padding:24, textAlign:'center', color:'#5A5A5A' }}>
    <div style={{ fontSize:40, marginBottom:12 }}>💰</div>
    <div style={{ fontFamily:'DM Serif Display,serif', fontSize:20, marginBottom:8 }}>Payouts coming soon</div>
    <div style={{ fontSize:13 }}>Upload DriverModules2.jsx to enable payouts</div>
  </div>
}
// ── Utility stubs
const haptic = { light:()=>navigator.vibrate&&navigator.vibrate(10), medium:()=>navigator.vibrate&&navigator.vibrate(20), success:()=>navigator.vibrate&&navigator.vibrate([10,50,10]), error:()=>navigator.vibrate&&navigator.vibrate([100,30,100]), newOrder:()=>navigator.vibrate&&navigator.vibrate([200,100,200,100,200]) }
const setupPushNotifications = () => { if ('Notification' in window) Notification.requestPermission() }
const sendPushNotification = () => {}
const usePWAInstall = () => ({ canInstall:false, isInstalled:false, install:()=>{} })
const useOfflineMode = () => ({ isOffline:!navigator.onLine, getCachedOrder:()=>null })
const useAppUpdate = () => ({ updateAvailable:false, refresh:()=>window.location.reload() })
const useCrashDetection = () => {}
const WeatherWidget = () => null
const RunningLateButton = () => null
const MultiOrderPanel = () => null
const StreakBadge = () => null
const StatusBar = () => null
const BonusTracker = () => null
const ZoneHeatmap = () => null
const RouteHistory = () => null
const VoiceMessage = () => null
const EarningsForecast = () => null
const CrashAlert = () => null
const PWAInstallBanner = () => null
const OfflineBanner = () => null
const UpdateBanner = () => null
const EmergencyCall = () => null
const BarcodeScanner = () => null
const SignaturePad = () => null
const OrderCardSkeleton = () => null
const EarningsRowSkeleton = () => null
const DispatchMessages = () => null

// ─────────────────────────────────────────────────────────────
// CUSTOMER FEEDBACK COMPONENT
// ─────────────────────────────────────────────────────────────
function CustomerFeedback({ onClose }) {
  const [reviews] = React.useState([
    { id:1, rating:5, comment:'Super fast delivery, perfectly packed!', date:'Today' },
    { id:2, rating:5, comment:'Driver was very polite and professional.', date:'Yesterday' },
    { id:3, rating:4, comment:'Good delivery, arrived slightly warm.', date:'Mon' },
    { id:4, rating:5, comment:'Excellent! Will order again.', date:'Sun' },
  ])
  const avg = 4.75
  const starData = [5,4,3,2,1].map(star => ({ star, count: reviews.filter(r => r.rating===star).length }))
  const stars = (n) => Array(5).fill(0).map((_,i) => i < Math.round(n) ? '★' : '☆').join('')
  return (
    <div style={{ position:'fixed', inset:0, zIndex:600, background:'rgba(0,0,0,0.85)', display:'flex', alignItems: window.innerWidth>=768?'center':'flex-end', justifyContent:'center' }} onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{ width:'100%', maxWidth: window.innerWidth>=768?600:'100%', background:DS.surface, borderRadius: window.innerWidth>=768?DS.r2:'20px 20px 0 0', padding:'20px 20px 48px', maxHeight:'85vh', overflowY:'auto' }}>
        <div style={{ width:36, height:4, background:DS.border2, borderRadius:2, margin:'0 auto 20px' }} />
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:DS.yellow, textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:4 }}>⭐ Customer feedback</div>
            <div style={{ fontFamily:DS.fh, fontSize:22, color:DS.t1 }}>Your reviews</div>
          </div>
          <div style={{ textAlign:'center', background:DS.yellowDim, border:'1px solid '+DS.yellowBdr, borderRadius:DS.r2, padding:'12px 16px' }}>
            <div style={{ fontSize:32, fontWeight:900, color:DS.yellow, fontFamily:DS.f }}>{avg.toFixed(1)}</div>
            <div style={{ fontSize:14, color:DS.yellow }}>{stars(avg)}</div>
            <div style={{ fontSize:10, color:DS.t3, marginTop:2, fontFamily:DS.f }}>{reviews.length} reviews</div>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:20 }}>
          {starData.map(s => (
            <div key={s.star} style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ fontSize:11, color:DS.t3, width:8, fontFamily:DS.f }}>{s.star}</span>
              <span style={{ fontSize:11, color:DS.yellow }}>★</span>
              <div style={{ flex:1, height:6, background:DS.border, borderRadius:3, overflow:'hidden' }}>
                <div style={{ height:'100%', background:DS.yellow, width: Math.round((s.count/Math.max(reviews.length,1))*80) + 'px', transition:'width 0.5s' }} />
              </div>
              <span style={{ fontSize:10, color:DS.t3, width:14, fontFamily:DS.f }}>{s.count}</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize:11, fontWeight:700, color:DS.t3, textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:12, fontFamily:DS.f }}>Recent reviews</div>
        {reviews.map(r => (
          <div key={r.id} style={{ background:DS.surface2, borderRadius:DS.r1, padding:'14px', marginBottom:10, border:'1px solid '+DS.border2 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
              <div style={{ fontSize:16, color:DS.yellow }}>{stars(r.rating)}</div>
              <div style={{ fontSize:11, color:DS.t3, fontFamily:DS.f }}>{r.date}</div>
            </div>
            <div style={{ fontSize:13, color:DS.t1, fontFamily:DS.f, lineHeight:1.5, fontStyle:'italic' }}>"{r.comment}"</div>
          </div>
        ))}
        <button onClick={onClose} style={{ width:'100%', marginTop:8, padding:'14px', background:DS.surface2, border:'1px solid '+DS.border2, borderRadius:DS.r1, color:DS.t2, fontSize:14, cursor:'pointer', fontFamily:DS.f }}>Close</button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// EXPENSE LOGGER COMPONENT
// ─────────────────────────────────────────────────────────────
function ExpenseLogger({ onClose }) {
  const [type, setType] = React.useState('tip')
  const [amount, setAmount] = React.useState('')
  const [note, setNote] = React.useState('')
  const [entries, setEntries] = React.useState([])

  const types = [
    { id:'tip', label:'Cash tip', icon:'💵', color:DS.green },
    { id:'fuel', label:'Fuel', icon:'⛽', color:DS.yellow },
    { id:'parking', label:'Parking', icon:'🅿️', color:DS.blue },
    { id:'other', label:'Other', icon:'📝', color:DS.t2 },
  ]

  const save = () => {
    if (!amount || isNaN(parseFloat(amount))) return
    const entry = { type, amount:parseFloat(amount), note, time:new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}) }
    setEntries(prev => [entry, ...prev])
    setAmount(''); setNote('')
    haptic.success()
  }

  const totals = entries.reduce((acc,e) => { acc[e.type]=(acc[e.type]||0)+e.amount; return acc }, {})

  return (
    <div style={{ position:'fixed', inset:0, zIndex:600, background:'rgba(0,0,0,0.85)', display:'flex', alignItems: window.innerWidth>=768?'center':'flex-end', justifyContent:'center' }} onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{ width:'100%', maxWidth: window.innerWidth>=768?600:'100%', background:DS.surface, borderRadius: window.innerWidth>=768?DS.r2:'20px 20px 0 0', padding:'20px 20px 48px', maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ width:36, height:4, background:DS.border2, borderRadius:2, margin:'0 auto 20px' }} />
        <div style={{ fontSize:11, fontWeight:700, color:DS.green, textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:4 }}>💰 Finance</div>
        <div style={{ fontFamily:DS.fh, fontSize:22, color:DS.t1, marginBottom:16 }}>Expenses and tips</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:14 }}>
          {types.map(t => (
            <button key={t.id} onClick={() => setType(t.id)} style={{ padding:'10px 4px', background:type===t.id?t.color+'18':DS.surface2, border:'1px solid '+(type===t.id?t.color:DS.border2), borderRadius:DS.r1, cursor:'pointer', textAlign:'center' }}>
              <div style={{ fontSize:20, marginBottom:4 }}>{t.icon}</div>
              <div style={{ fontSize:10, color:type===t.id?t.color:DS.t3, fontWeight:600, fontFamily:DS.f }}>{t.label}</div>
            </button>
          ))}
        </div>
        <div style={{ display:'flex', gap:8, marginBottom:10 }}>
          <div style={{ flex:1, position:'relative' }}>
            <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:DS.t3, fontSize:16 }}>€</span>
            <input value={amount} onChange={e=>setAmount(e.target.value)} type="number" step="0.50" min="0" placeholder="0.00"
              style={{ width:'100%', padding:'13px 12px 13px 28px', background:DS.surface2, border:'1px solid '+DS.border2, borderRadius:DS.r1, color:DS.t1, fontSize:18, fontWeight:700, outline:'none', fontFamily:DS.f, boxSizing:'border-box' }} />
          </div>
          <button onClick={save} style={{ padding:'13px 20px', background:DS.green, border:'none', borderRadius:DS.r1, color:'#0D0D0D', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:DS.f }}>Log</button>
        </div>
        <input value={note} onChange={e=>setNote(e.target.value)} placeholder="Note (optional)..."
          style={{ width:'100%', padding:'10px 12px', background:DS.surface2, border:'1px solid '+DS.border2, borderRadius:DS.r1, color:DS.t1, fontSize:13, outline:'none', fontFamily:DS.f, marginBottom:16, boxSizing:'border-box' }} />
        {Object.keys(totals).length > 0 && (
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:DS.t3, textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:10, fontFamily:DS.f }}>Today</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:14 }}>
              {types.filter(t=>totals[t.id]).map(t => (
                <div key={t.id} style={{ background:DS.surface2, borderRadius:DS.r1, padding:'10px 12px', border:'1px solid '+DS.border2 }}>
                  <div style={{ fontSize:12, color:DS.t3, fontFamily:DS.f }}>{t.icon} {t.label}</div>
                  <div style={{ fontSize:18, fontWeight:800, color:t.color||DS.t1, fontFamily:DS.f }}>€{(totals[t.id]||0).toFixed(2)}</div>
                </div>
              ))}
            </div>
            {entries.slice(0,5).map((e,i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'10px 12px', background:DS.surface2, borderRadius:DS.r1, marginBottom:6, border:'1px solid '+DS.border2 }}>
                <div style={{ fontSize:13, color:DS.t1, fontFamily:DS.f }}>{types.find(t=>t.id===e.type)?.icon} {e.note||types.find(t=>t.id===e.type)?.label}</div>
                <div style={{ fontSize:14, fontWeight:700, color:e.type==='tip'?DS.green:DS.yellow, fontFamily:DS.f }}>€{e.amount.toFixed(2)}</div>
              </div>
            ))}
          </div>
        )}
        <button onClick={onClose} style={{ width:'100%', marginTop:8, padding:'14px', background:DS.surface2, border:'1px solid '+DS.border2, borderRadius:DS.r1, color:DS.t2, fontSize:14, cursor:'pointer', fontFamily:DS.f }}>Close</button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// PAYSLIP GENERATOR COMPONENT
// ─────────────────────────────────────────────────────────────
function PayslipGenerator({ profile, onClose }) {
  const [week, setWeek] = React.useState(0)
  const weeks = ['This week', 'Last week', '2 weeks ago']
  const grossData = [87.50, 124.00, 96.75]
  const tipsData  = [12.00, 8.50, 15.00]
  const costsData = [18.00, 22.00, 14.50]
  const gross = grossData[week]
  const tips  = tipsData[week]
  const costs = costsData[week]
  const net   = gross + tips - costs
  const delivs = [18, 26, 20]

  const download = () => {
    const css = 'body{font-family:Arial,sans-serif;max-width:600px;margin:40px auto;color:#1a1a1a;padding:0 20px}h1{color:#FF6B35}table{width:100%;border-collapse:collapse;margin:20px 0}td,th{padding:10px;border-bottom:1px solid #eee;text-align:left}th{background:#f5f5f5;font-size:12px;text-transform:uppercase}.total{font-weight:700;font-size:18px;color:#FF6B35}'
    const rows = '<tr><td>Delivery fees</td><td style="text-align:right">EUR' + gross.toFixed(2) + '</td></tr><tr><td>Cash tips</td><td style="text-align:right">EUR' + tips.toFixed(2) + '</td></tr><tr><td>Expenses</td><td style="text-align:right">-EUR' + costs.toFixed(2) + '</td></tr>'
    const html = '<!DOCTYPE html><html><head><meta charset="utf-8"><style>' + css + '</style></head><body><h1>Isla Drop</h1><h2>Driver Earnings Statement</h2><p><strong>Driver:</strong> ' + (profile?.full_name||'Driver') + '</p><p><strong>Period:</strong> ' + weeks[week] + '</p><p><strong>Deliveries:</strong> ' + delivs[week] + '</p><table><thead><tr><th>Description</th><th style="text-align:right">Amount</th></tr></thead><tbody>' + rows + '</tbody></table><p class="total">Net earnings: EUR' + net.toFixed(2) + '</p><footer style="margin-top:40px;font-size:11px;color:#aaa">Generated by Isla Drop · ops@isladrop.net</footer></body></html>'
    const blob = new Blob([html], {type:'text/html'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'IslaDropPayslip_' + weeks[week].replace(' ','_') + '.html'
    a.click(); URL.revokeObjectURL(url)
    haptic.success()
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:600, background:'rgba(0,0,0,0.85)', display:'flex', alignItems: window.innerWidth>=768?'center':'flex-end', justifyContent:'center' }} onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{ width:'100%', maxWidth: window.innerWidth>=768?600:'100%', background:DS.surface, borderRadius: window.innerWidth>=768?DS.r2:'20px 20px 0 0', padding:'20px 20px 48px', maxHeight:'85vh', overflowY:'auto' }}>
        <div style={{ width:36, height:4, background:DS.border2, borderRadius:2, margin:'0 auto 20px' }} />
        <div style={{ fontSize:11, fontWeight:700, color:DS.yellow, textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:4 }}>📄 Finance</div>
        <div style={{ fontFamily:DS.fh, fontSize:22, color:DS.t1, marginBottom:16 }}>Weekly payslip</div>
        <div style={{ display:'flex', gap:8, marginBottom:20 }}>
          {weeks.map((w,i) => (
            <button key={i} onClick={() => setWeek(i)} style={{ flex:1, padding:'9px 4px', background:week===i?DS.yellowDim:DS.surface2, border:'1px solid '+(week===i?DS.yellowBdr:DS.border2), borderRadius:DS.r1, color:week===i?DS.yellow:DS.t3, fontSize:11, fontWeight:week===i?700:400, cursor:'pointer', fontFamily:DS.f }}>{w}</button>
          ))}
        </div>
        {[
          { label:'Delivery fees', val:'€'+gross.toFixed(2), color:DS.t1 },
          { label:'Cash tips', val:'€'+tips.toFixed(2), color:DS.green },
          { label:'Expenses (fuel, parking)', val:'-€'+costs.toFixed(2), color:DS.red },
          { label:'Deliveries', val:delivs[week], color:DS.blue },
        ].map(r => (
          <div key={r.label} style={{ display:'flex', justifyContent:'space-between', padding:'12px 0', borderBottom:'1px solid '+DS.border }}>
            <span style={{ fontSize:14, color:DS.t2, fontFamily:DS.f }}>{r.label}</span>
            <span style={{ fontSize:14, fontWeight:700, color:r.color, fontFamily:DS.f }}>{r.val}</span>
          </div>
        ))}
        <div style={{ display:'flex', justifyContent:'space-between', padding:'16px 0', marginBottom:20 }}>
          <span style={{ fontSize:16, fontWeight:700, color:DS.t1, fontFamily:DS.f }}>Net earnings</span>
          <span style={{ fontSize:26, fontWeight:900, color:DS.accent, fontFamily:DS.f }}>€{net.toFixed(2)}</span>
        </div>
        <button onClick={download} style={{ width:'100%', padding:'15px', background:DS.yellow, border:'none', borderRadius:DS.r1, color:'#0D0D0D', fontSize:15, fontWeight:800, cursor:'pointer', fontFamily:DS.f, marginBottom:10 }}>
          ⬇ Download payslip
        </button>
        <button onClick={onClose} style={{ width:'100%', padding:'14px', background:DS.surface2, border:'1px solid '+DS.border2, borderRadius:DS.r1, color:DS.t2, fontSize:14, cursor:'pointer', fontFamily:DS.f }}>Close</button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// INCIDENT REPORT COMPONENT
// ─────────────────────────────────────────────────────────────
function IncidentReport({ onClose }) {
  const [type, setType] = React.useState(null)
  const [details, setDetails] = React.useState('')
  const [injury, setInjury] = React.useState(false)
  const [done, setDone] = React.useState(false)

  const types = [
    { id:'accident', label:'Road accident', icon:'🚨' },
    { id:'near_miss', label:'Near miss', icon:'⚠️' },
    { id:'theft', label:'Theft / robbery', icon:'🔓' },
    { id:'vehicle', label:'Vehicle breakdown', icon:'🛵' },
    { id:'assault', label:'Assault', icon:'🆘' },
    { id:'other', label:'Other', icon:'📋' },
  ]

  const submit = () => {
    if (!type || !details.trim()) return
    haptic.success()
    setDone(true)
  }

  if (done) return (
    <div style={{ position:'fixed', inset:0, zIndex:600, background:'rgba(0,0,0,0.92)', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', padding:32, textAlign:'center' }}>
      <div style={{ fontSize:52, marginBottom:16 }}>📋</div>
      <div style={{ fontFamily:DS.fh, fontSize:24, color:DS.t1, marginBottom:8 }}>Incident reported</div>
      <div style={{ fontSize:14, color:DS.t2, marginBottom:8, fontFamily:DS.f }}>Ops team has been notified.</div>
      <div style={{ fontSize:20, fontWeight:700, color:DS.t1, marginBottom:32, fontFamily:DS.f }}>📞 +34 971 000 000</div>
      <button onClick={onClose} style={{ width:'100%', maxWidth:320, padding:'15px', background:DS.accent, border:'none', borderRadius:DS.r1, color:'#0D0D0D', fontSize:16, fontWeight:800, cursor:'pointer', fontFamily:DS.f }}>Close</button>
    </div>
  )

  return (
    <div style={{ position:'fixed', inset:0, zIndex:600, background:'rgba(0,0,0,0.85)', display:'flex', alignItems: window.innerWidth>=768?'center':'flex-end', justifyContent:'center' }} onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{ width:'100%', maxWidth: window.innerWidth>=768?600:'100%', background:DS.surface, borderRadius: window.innerWidth>=768?DS.r2:'20px 20px 0 0', padding:'20px 20px 48px', maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ width:36, height:4, background:DS.border2, borderRadius:2, margin:'0 auto 20px' }} />
        <div style={{ fontSize:11, fontWeight:700, color:DS.red, textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:4 }}>🚨 Safety</div>
        <div style={{ fontFamily:DS.fh, fontSize:22, color:DS.t1, marginBottom:16 }}>Report incident</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:14 }}>
          {types.map(t => (
            <button key={t.id} onClick={() => setType(t.id)} style={{ padding:'12px 10px', background:type===t.id?DS.redDim:DS.surface2, border:'1px solid '+(type===t.id?DS.redBdr:DS.border2), borderRadius:DS.r1, cursor:'pointer', textAlign:'left' }}>
              <div style={{ fontSize:20, marginBottom:4 }}>{t.icon}</div>
              <div style={{ fontSize:12, color:type===t.id?DS.red:DS.t2, fontWeight:600, fontFamily:DS.f }}>{t.label}</div>
            </button>
          ))}
        </div>
        <button onClick={() => setInjury(i=>!i)} style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'12px 14px', background:injury?DS.redDim:DS.surface2, border:'1px solid '+(injury?DS.redBdr:DS.border2), borderRadius:DS.r1, marginBottom:10, cursor:'pointer' }}>
          <div style={{ width:24, height:24, borderRadius:6, background:injury?DS.red:'transparent', border:'2px solid '+(injury?DS.red:DS.border2), display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>{injury?'✓':''}</div>
          <span style={{ fontSize:14, color:injury?DS.red:DS.t2, fontWeight:600, fontFamily:DS.f }}>Injury involved</span>
        </button>
        <textarea value={details} onChange={e=>setDetails(e.target.value)} placeholder="Describe what happened..." rows={4}
          style={{ width:'100%', padding:'12px', background:DS.surface2, border:'1px solid '+DS.border2, borderRadius:DS.r1, color:DS.t1, fontSize:13, resize:'none', outline:'none', fontFamily:DS.f, marginBottom:14, boxSizing:'border-box' }} />
        <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:10 }}>
          <button onClick={onClose} style={{ padding:'13px', background:'transparent', border:'1px solid '+DS.border2, borderRadius:DS.r1, color:DS.t2, fontSize:14, cursor:'pointer', fontFamily:DS.f }}>Cancel</button>
          <button onClick={submit} disabled={!type||!details.trim()} style={{ padding:'13px', background:!type||!details.trim()?DS.surface2:DS.red, border:'none', borderRadius:DS.r1, color:!type||!details.trim()?DS.t3:DS.t1, fontSize:14, fontWeight:700, cursor:!type||!details.trim()?'default':'pointer', fontFamily:DS.f }}>Submit report</button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// NOTIFICATION SETUP COMPONENT
// ─────────────────────────────────────────────────────────────
function NotificationSetup({ onClose }) {
  const [status, setStatus] = React.useState(typeof Notification !== 'undefined' ? Notification.permission : 'default')
  const [checking, setChecking] = React.useState(false)

  const enable = async () => {
    setChecking(true)
    try {
      const perm = await Notification.requestPermission()
      setStatus(perm)
      if (perm === 'granted') {
        haptic.success()
        new Notification('Isla Drop notifications enabled!', { body:'You will now receive order alerts even when the app is in the background.' })
      }
    } catch (e) { setStatus('denied') }
    setChecking(false)
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:600, background:'rgba(0,0,0,0.85)', display:'flex', alignItems: window.innerWidth>=768?'center':'flex-end', justifyContent:'center' }} onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{ width:'100%', maxWidth: window.innerWidth>=768?600:'100%', background:DS.surface, borderRadius: window.innerWidth>=768?DS.r2:'20px 20px 0 0', padding:'20px 20px 48px' }}>
        <div style={{ width:36, height:4, background:DS.border2, borderRadius:2, margin:'0 auto 20px' }} />
        <div style={{ textAlign:'center', marginBottom:24 }}>
          <div style={{ fontSize:52, marginBottom:12 }}>🔔</div>
          <div style={{ fontFamily:DS.fh, fontSize:22, color:DS.t1, marginBottom:8 }}>Push notifications</div>
          <div style={{ fontSize:13, color:DS.t2, fontFamily:DS.f, lineHeight:1.6 }}>Get order alerts even when the app is in the background. Never miss a delivery.</div>
        </div>
        {status === 'granted' ? (
          <div style={{ background:DS.greenDim, border:'1px solid '+DS.greenBdr, borderRadius:DS.r1, padding:'16px', textAlign:'center', marginBottom:16 }}>
            <div style={{ fontSize:22, marginBottom:6 }}>✅</div>
            <div style={{ fontSize:15, color:DS.green, fontWeight:700, fontFamily:DS.f }}>Notifications are enabled</div>
            <div style={{ fontSize:12, color:DS.t2, marginTop:4, fontFamily:DS.f }}>You will receive alerts for new orders</div>
          </div>
        ) : status === 'denied' ? (
          <div style={{ background:DS.redDim, border:'1px solid '+DS.redBdr, borderRadius:DS.r1, padding:'16px', marginBottom:16 }}>
            <div style={{ fontSize:14, color:DS.red, fontWeight:700, fontFamily:DS.f, textAlign:'center' }}>Notifications blocked by browser</div>
            <div style={{ fontSize:12, color:DS.t2, marginTop:6, fontFamily:DS.f, textAlign:'center' }}>Go to your browser settings → Notifications and allow isladrop.net</div>
          </div>
        ) : (
          <button onClick={enable} disabled={checking} style={{ width:'100%', padding:'15px', background:DS.green, border:'none', borderRadius:DS.r1, color:'#0D0D0D', fontSize:15, fontWeight:800, cursor:'pointer', fontFamily:DS.f, marginBottom:10 }}>
            {checking ? 'Requesting...' : 'Enable push notifications'}
          </button>
        )}
        <button onClick={onClose} style={{ width:'100%', padding:'14px', background:DS.surface2, border:'1px solid '+DS.border2, borderRadius:DS.r1, color:DS.t2, fontSize:14, cursor:'pointer', fontFamily:DS.f }}>Close</button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// APP LOCK COMPONENT  
// Full PIN setup (enter twice to confirm) + lock screen
// ─────────────────────────────────────────────────────────────
function AppLock({ onUnlock }) {
  const savedPin = typeof localStorage !== 'undefined' ? localStorage.getItem('driver_pin') : null
  const [mode, setMode] = React.useState(savedPin ? 'unlock' : 'setup1')
  const [pin, setPin] = React.useState('')
  const [firstPin, setFirstPin] = React.useState('')
  const [error, setError] = React.useState('')

  const handleKey = (k) => {
    setError('')
    if (k === '⌫') { setPin(p => p.slice(0,-1)); return }
    if (pin.length >= 4) return
    const next = pin + k
    setPin(next)
    if (next.length === 4) {
      setTimeout(() => {
        if (mode === 'setup1') {
          setFirstPin(next); setPin(''); setMode('setup2')
        } else if (mode === 'setup2') {
          if (next === firstPin) {
            localStorage.setItem('driver_pin', next)
            haptic.success()
            onUnlock()
          } else {
            haptic.error()
            setError('PINs do not match — try again')
            setPin(''); setFirstPin(''); setMode('setup1')
          }
        } else {
          if (next === savedPin) {
            haptic.success()
            onUnlock()
          } else {
            haptic.error()
            setError('Incorrect PIN')
            setPin('')
          }
        }
      }, 120)
    }
  }

  const titles = { setup1:'Create your PIN', setup2:'Confirm your PIN', unlock:'Enter PIN to unlock' }
  const subs = { setup1:'Enter a 4-digit PIN to protect the driver app', setup2:'Enter the same PIN again to confirm', unlock:'Isla Drop Driver is locked' }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:9999, background:DS.bg, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', padding:32 }}>
      <div style={{ fontFamily:DS.fh, fontSize:30, color:DS.t1, marginBottom:8 }}>Isla Drop</div>
      <div style={{ fontSize:13, color:DS.t3, marginBottom:36, fontFamily:DS.f, textAlign:'center', maxWidth:260, lineHeight:1.5 }}>{subs[mode]}</div>
      <div style={{ fontFamily:DS.fh, fontSize:18, color:DS.t1, marginBottom:20 }}>{titles[mode]}</div>
      <div style={{ display:'flex', gap:14, marginBottom:10 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{ width:18, height:18, borderRadius:'50%', background:pin.length>i?DS.accent:DS.border2, transition:'background 0.15s', border:'2px solid '+(pin.length>i?DS.accent:DS.border2) }} />
        ))}
      </div>
      {error && <div style={{ color:DS.red, fontSize:13, marginBottom:16, fontFamily:DS.f, textAlign:'center' }}>{error}</div>}
      {!error && <div style={{ height:24, marginBottom:16 }} />}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, width:'100%', maxWidth:280 }}>
        {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((d,i) => (
          <button key={i} onClick={() => d!=='' && handleKey(String(d))}
            style={{ padding:'18px', background:d===''?'transparent':DS.surface, border:d===''?'none':'1px solid '+DS.border, borderRadius:DS.r2, fontSize:22, fontWeight:700, color:DS.t1, cursor:d===''?'default':'pointer', fontFamily:DS.f, transition:'background 0.1s' }}>
            {d}
          </button>
        ))}
      </div>
      {mode !== 'unlock' && (
        <button onClick={onUnlock} style={{ marginTop:28, background:'none', border:'none', color:DS.t3, fontSize:13, cursor:'pointer', fontFamily:DS.f }}>Cancel — skip PIN setup</button>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// DESIGN SYSTEM
// ─────────────────────────────────────────────────────────────
const pcs = n => n.toFixed(0) + String.fromCharCode(37)

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
  const wide = window.innerWidth >= 768
  return (
    <div style={{ position:'fixed', inset:0, zIndex, background:'rgba(0,0,0,0.85)', display:'flex', alignItems: wide?'center':'flex-end', justifyContent:'center' }}
      onClick={e => e.target===e.currentTarget && onDismiss?.()}>
      <div style={{
        width:'100%', maxWidth: wide ? 580 : '100%',
        background:DS.surface, borderRadius: wide ? DS.r2 : '20px 20px 0 0',
        padding:'16px 20px 40px',
        border: wide ? '1px solid '+DS.border2 : 'none',
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
      setDist((data.routes[0].distance * 0.001).toFixed(1))
      setEta(Math.ceil(data.routes[0].duration * 0.01667))
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
        {order?.what3words && <div style={{ fontSize:13, color:DS.green, marginBottom:6, fontFamily:DS.f }}>+++ {order.what3words}</div>}
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
        // imports resolved statically
        const { data } = await supabase.from('order_messages').select('*').eq('order_id', order.id).order('created_at')
        if (data) setMsgs(data)
      } catch {}
    }
    load()
    let sub
    const setup = async () => {
      // imports resolved statically
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
      // imports resolved statically
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
              <div style={{ maxWidth:'78vw', background:mine?DS.accentDim:DS.surface2, border:'1px solid '+(mine?DS.accentBdr:DS.border2), borderRadius:mine?'16px 4px 16px 16px':'4px 16px 16px 16px', padding:'10px 14px' }}>
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
      // imports resolved statically
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
      // imports resolved statically
      // imports resolved statically
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
      // imports resolved statically
      // imports resolved statically
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
          {order.what3words && <div style={{ fontSize:12, color:DS.green, fontFamily:DS.f }}>+++ {order.what3words}</div>}
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
  const [period, setPeriod] = React.useState('today')
  const [goal, setGoal] = React.useState(100)
  const [history, setHistory] = React.useState([])
  const [loading, setLoading] = React.useState(false)

  const todayEarnings = stats?.earnings || 0
  const goalPct = Math.min(100, todayEarnings * 100 / Math.max(goal, 1))
  const currentHour = new Date().getHours()
  const total = history.reduce((s, e) => s + (e.amount || 0), 0)

  React.useEffect(() => {
    setLoading(true)
    const user = useAuthStore.getState().user
    const now = new Date()
    const from = new Date(now)
    if (period === 'today') from.setHours(0, 0, 0, 0)
    else if (period === 'week') from.setDate(now.getDate() - 7)
    else from.setDate(now.getDate() - 30)
    supabase.from('driver_earnings').select('*').eq('driver_id', user?.id)
      .gte('created_at', from.toISOString()).order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setHistory(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [period])

  const PEAK = [
    { h:'00', l:'12am', v:90 }, { h:'01', l:'1am',  v:95 }, { h:'02', l:'2am',  v:85 },
    { h:'03', l:'3am',  v:60 }, { h:'04', l:'4am',  v:30 }, { h:'05', l:'5am',  v:20 },
    { h:'12', l:'12pm', v:40 }, { h:'18', l:'6pm',  v:50 }, { h:'20', l:'8pm',  v:65 },
    { h:'22', l:'10pm', v:80 }, { h:'23', l:'11pm', v:88 },
  ]

  const padHour = String(currentHour).padStart(2, '0')
  const peakBars = PEAK.map(h => ({
    ...h,
    isCurr: h.h === String(currentHour).padStart(2, '0'),
    ht: Math.round(h.v * 0.56) + 'px',
    bg: h.h === String(currentHour).padStart(2, '0') ? DS.green : h.v > 80 ? DS.accent : h.v > 50 ? DS.yellow : DS.border2
  }))

  return (
    <div style={{ padding: isDesktop ? 24 : 16, paddingBottom: isDesktop ? 24 : 90, boxSizing:'border-box' }}>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
        {[
          { label:'Today earnings', val:'€' + todayEarnings.toFixed(2), color:DS.green, icon:'💰' },
          { label:'Deliveries',     val:stats?.deliveries || 0,         color:DS.blue,  icon:'📦' },
          { label:'Period total',   val:'€' + total.toFixed(2),         color:DS.yellow,icon:'📊' },
          { label:'Rating',         val:(stats?.rating || 5).toFixed(1) + '★', color:DS.accent, icon:'⭐' },
        ].map(s => (
          <Card key={s.label} style={{ padding:'16px 12px', textAlign:'center' }}>
            <div style={{ fontSize:24, marginBottom:6 }}>{s.icon}</div>
            <div style={{ fontSize:22, fontWeight:800, color:s.color }}>{s.val}</div>
            <div style={{ fontSize:10, color:DS.t3, marginTop:4, textTransform:'uppercase' }}>{s.label}</div>
          </Card>
        ))}
      </div>

      <Card style={{ padding:16, marginBottom:12 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <div style={{ fontSize:14, fontWeight:700, color:DS.t1 }}>Daily goal</div>
          <div style={{ display:'flex', gap:6 }}>
            {[50, 100, 150, 200].map(g => (
              <button key={g} onClick={() => setGoal(g)}
                style={{ padding:'4px 9px', background:goal===g?DS.accentDim:DS.surface2, border:'1px solid '+(goal===g?DS.accent:DS.border2), borderRadius:DS.r1, color:goal===g?DS.accent:DS.t3, fontSize:12, cursor:'pointer' }}>
                {g}
              </button>
            ))}
          </div>
        </div>
        <div style={{ background:DS.border, borderRadius:99, height:8, overflow:'hidden', marginBottom:8 }}>
          <div style={{ height:'100%', borderRadius:99, background:goalPct>=100?DS.green:DS.accent, width: pcs(Math.min(100, goalPct)), transition:'width 0.5s' }} />
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
          <span style={{ color:goalPct>=100?DS.green:DS.accent, fontWeight:700 }}>€{todayEarnings.toFixed(2)}</span>
          <span style={{ color:DS.t3 }}>€{Math.max(0, goal - todayEarnings).toFixed(2)} to go</span>
        </div>
      </Card>

      <Card style={{ padding:16, marginBottom:12 }}>
        <div style={{ fontSize:13, fontWeight:700, color:DS.t1, marginBottom:2 }}>Peak hours</div>
        <div style={{ fontSize:11, color:DS.t3, marginBottom:14 }}>Best times to be online in Ibiza</div>
        <div style={{ display:'flex', gap:3, height:72, alignItems:'flex-end' }}>
          {peakBars.map(h => (
            <div key={h.h} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
              <div style={{ width:'100%', height:h.ht, background:h.bg, borderRadius:'4px 4px 0 0', transition:'height 0.3s' }} />
              <div style={{ fontSize:7, color:h.isCurr?DS.green:DS.t3, whiteSpace:'nowrap' }}>{h.l}</div>
            </div>
          ))}
        </div>
      </Card>

      <div style={{ display:'flex', gap:8, marginBottom:14 }}>
        {[['today','Today'],['week','Week'],['month','Month']].map(([id, label]) => (
          <button key={id} onClick={() => setPeriod(id)}
            style={{ flex:1, padding:'10px', background:period===id?DS.accentDim:DS.surface, border:'1px solid '+(period===id?DS.accent:DS.border2), borderRadius:DS.r1, color:period===id?DS.accent:DS.t3, fontSize:13, fontWeight:period===id?700:400, cursor:'pointer' }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ fontSize:11, fontWeight:700, color:DS.t3, textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:10 }}>
        Delivery history
      </div>

      {loading && (
        <div style={{ textAlign:'center', padding:32, color:DS.t3 }}>Loading...</div>
      )}

      {!loading && history.length === 0 && (
        <div style={{ textAlign:'center', padding:'40px 0', color:DS.t3 }}>
          <div style={{ fontSize:40, marginBottom:12 }}>📭</div>
          <div style={{ fontSize:14 }}>No deliveries in this period</div>
        </div>
      )}

      {!loading && history.map((e, idx) => (
        <div key={idx} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', background:DS.surface, borderRadius:DS.r1, marginBottom:8, border:'1px solid '+DS.border }}>
          <div style={{ width:40, height:40, borderRadius:DS.r1, background:DS.greenDim, border:'1px solid '+DS.greenBdr, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>📦</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, color:DS.t1, fontWeight:600 }}>#{e.order_number||'order'}</div>
            <div style={{ fontSize:11, color:DS.t3, marginTop:2 }}>{new Date(e.created_at).toDateString().slice(0,10)}</div>
          </div>
          <div style={{ fontSize:17, fontWeight:800, color:DS.green }}>€{(e.amount||0).toFixed(2)}</div>
        </div>
      ))}

    </div>
  )
}


function PerformanceTab({ stats, onShowFeedback, isDesktop }) {
  const [leaderboard, setLeaderboard] = useState([])
  const deliveries = stats?.deliveries||0
  const rating = stats?.rating||5.0
  const BADGES_DATA = BADGES.map(b => ({ ...b, earned: b.req(deliveries, rating) }))

  useEffect(() => {
    const load = async () => {
      try {
        // imports resolved statically
        // imports resolved statically
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
        {BADGES_DATA.map(b => (
          <div key={b.id} style={{ background:b.earned?DS.yellowDim:DS.surface, border:'1px solid '+(b.earned?DS.yellowBdr:DS.border2), borderRadius:DS.r1, padding:10, textAlign:'center' }}>
            <div style={{ fontSize:26, marginBottom:4, filter:b.earned?'none':'grayscale(1)' }}>{b.icon}</div>
            <div style={{ fontSize:9, color:b.earned?DS.yellow:DS.t3, fontWeight:700, lineHeight:1.3 }}>{b.label}</div>
          </div>
        ))}
      </div>

      {/* Leaderboard */}
      <button onClick={onShowFeedback} style={{ width:'100%', padding:'14px', background:DS.yellowDim, border:'1px solid '+DS.yellowBdr, borderRadius:DS.r1, color:DS.yellow, fontSize:14, fontWeight:700, cursor:'pointer', marginBottom:20, fontFamily:DS.f, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
        ⭐ View customer feedback & reviews
      </button>

      <div style={{ fontSize:11, fontWeight:700, color:DS.t3, textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:12, fontFamily:DS.f }}>🏆 Today's leaderboard</div>
      {leaderboard.length===0 && (
        <div style={{ textAlign:'center', padding:'32px 0', color:DS.t3 }}>
          <div style={{ fontSize:36, marginBottom:10 }}>🏁</div>
          <div style={{ fontSize:14, fontFamily:DS.f }}>No data yet today</div>
        </div>
      )}
      {leaderboard.length > 0 && leaderboard.map((d,i) => (
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
// INLINE FEATURE COMPONENTS
// ─────────────────────────────────────────────────────────────

function Sheet({ children, zIndex=600, onDismiss }) {
  return (
    <div style={{ position:'fixed', inset:0, zIndex, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'flex-end' }}
      onClick={e => e.target===e.currentTarget && onDismiss?.()}>
      <div style={{ width:'100%', background:DS.surface, borderRadius:'20px 20px 0 0', padding:'20px 20px calc(40px + env(safe-area-inset-bottom))', borderTop:'1px solid '+DS.border2, maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ width:36, height:4, background:DS.border2, borderRadius:2, margin:'0 auto 20px' }} />
        {children}
      </div>
    </div>
  )
}


// ─────────────────────────────────────────────────────────────
// MAIN DRIVER APP
// ─────────────────────────────────────────────────────────────
function SettingsTab({ profile, stats, onSignOut, isDesktop, onExpenses, onPayslip, onIncident, onNotifs, onLock }) {
  const [vehicle, setVehicle] = useState('scooter')
  const [notifSound, setNotifSound] = useState(true)
  const [screenLock, setScreenLock] = useState(true)
  const [breakMode, setBreakMode] = useState(false)
  const [speedAlert, setSpeedAlert] = useState(true)
  const [fatigueAlert, setFatigueAlert] = useState(true)

  const toggleBreak = async () => {
    setBreakMode(v => !v)
    try {
      // imports resolved statically
      // imports resolved statically
      const user = useAuthStore.getState().user
      await supabase.from('profiles').update({ on_break: !breakMode }).eq('id', user?.id)
    } catch {}
  }

  const pad = isDesktop ? 24 : 16
  const pb  = isDesktop ? 24 : 90

  return (
    <div style={{ padding:pad, paddingBottom:pb, boxSizing:'border-box', maxWidth:isDesktop?860:'none', margin:isDesktop?'0 auto':'0', width:'100%' }}>

      <div style={{ background:DS.surface, borderRadius:DS.r2, border:'1px solid '+DS.border, padding:20, marginBottom:16 }}>
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
      </div>

      <div style={{ fontSize:11, fontWeight:700, color:DS.t3, textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:10, fontFamily:DS.f }}>Vehicle type</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:16 }}>
        {[['scooter','🛵','Scooter'],['car','🚗','Car'],['ebike','🚲','E-bike']].map(([id,icon,label]) => (
          <button key={id} onClick={() => setVehicle(id)}
            style={{ padding:'14px 6px', background:vehicle===id?DS.accentDim:DS.surface, border:'1px solid '+(vehicle===id?DS.accent:DS.border), borderRadius:DS.r1, cursor:'pointer', textAlign:'center' }}>
            <div style={{ fontSize:24, marginBottom:4 }}>{icon}</div>
            <div style={{ fontSize:12, color:vehicle===id?DS.accent:DS.t2, fontWeight:vehicle===id?700:400, fontFamily:DS.f }}>{label}</div>
          </button>
        ))}
      </div>

      <button onClick={toggleBreak} style={{ width:'100%', padding:14, background:breakMode?'rgba(168,85,247,0.12)':DS.surface, border:'1px solid '+(breakMode?'#A855F7':DS.border), borderRadius:DS.r1, color:breakMode?'#A855F7':DS.t1, fontSize:14, fontWeight:600, cursor:'pointer', marginBottom:16, fontFamily:DS.f, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
        {breakMode?'☕ On break — tap to return':'☕ Take a break'}
      </button>

      <div style={{ fontSize:11, fontWeight:700, color:DS.t3, textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:10, fontFamily:DS.f }}>Preferences</div>
      {[
        { label:'Notification sound', sub:'Alert tone for new orders', val:notifSound, fn:()=>setNotifSound(v=>!v), icon:'🔔' },
        { label:'Keep screen on', sub:'Prevents lock during deliveries', val:screenLock, fn:()=>setScreenLock(v=>!v), icon:'📱' },
        { label:'Speed alert (80 km/h)', sub:'Warning when riding fast', val:speedAlert, fn:()=>setSpeedAlert(v=>!v), icon:'⚡' },
        { label:'Fatigue reminder', sub:'Break reminder after 4h online', val:fatigueAlert, fn:()=>setFatigueAlert(v=>!v), icon:'😴' },
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

      <div style={{ fontSize:11, fontWeight:700, color:DS.t3, textTransform:'uppercase', letterSpacing:'0.8px', margin:'20px 0 10px', fontFamily:DS.f }}>Support</div>
      {[
        { icon:'🌴', label:'Zone', value:'Ibiza Island' },
        { icon:'📞', label:'Dispatch', value:'+34 971 000 000' },
        { icon:'🕐', label:'Hours', value:'08:00 – 06:00 daily' },
        { icon:'📱', label:'Version', value:'Isla Drop Driver 5.0' },
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
      <button onClick={onExpenses} style={{ width:'100%', display:'flex', alignItems:'center', gap:14, padding:14, background:DS.surface, borderRadius:DS.r1, marginBottom:8, border:'1px solid '+DS.border, cursor:'pointer' }}>
        <span style={{ fontSize:20 }}>💰</span>
        <div style={{ flex:1, textAlign:'left' }}>
          <div style={{ fontSize:13, color:DS.t1, fontWeight:500, fontFamily:DS.f }}>Expenses and tips</div>
          <div style={{ fontSize:11, color:DS.t3, marginTop:2, fontFamily:DS.f }}>Log cash tips and fuel costs</div>
        </div>
        <span style={{ color:DS.t3 }}>›</span>
      </button>
      <button onClick={onPayslip} style={{ width:'100%', display:'flex', alignItems:'center', gap:14, padding:14, background:DS.surface, borderRadius:DS.r1, marginBottom:8, border:'1px solid '+DS.border, cursor:'pointer' }}>
        <span style={{ fontSize:20 }}>📄</span>
        <div style={{ flex:1, textAlign:'left' }}>
          <div style={{ fontSize:13, color:DS.t1, fontWeight:500, fontFamily:DS.f }}>Weekly payslip</div>
          <div style={{ fontSize:11, color:DS.t3, marginTop:2, fontFamily:DS.f }}>Download earnings statement</div>
        </div>
        <span style={{ color:DS.t3 }}>›</span>
      </button>

      <div style={{ fontSize:11, fontWeight:700, color:DS.t3, textTransform:'uppercase', letterSpacing:'0.8px', margin:'20px 0 10px', fontFamily:DS.f }}>Safety</div>
      <button onClick={onIncident} style={{ width:'100%', display:'flex', alignItems:'center', gap:14, padding:14, background:DS.surface, borderRadius:DS.r1, marginBottom:8, border:'1px solid '+DS.border, cursor:'pointer' }}>
        <span style={{ fontSize:20 }}>🚨</span>
        <div style={{ flex:1, textAlign:'left' }}>
          <div style={{ fontSize:13, color:DS.t1, fontWeight:500, fontFamily:DS.f }}>Report incident</div>
          <div style={{ fontSize:11, color:DS.t3, marginTop:2, fontFamily:DS.f }}>Accidents, near misses, theft</div>
        </div>
        <span style={{ color:DS.t3 }}>›</span>
      </button>
      <button onClick={onNotifs} style={{ width:'100%', display:'flex', alignItems:'center', gap:14, padding:14, background:DS.surface, borderRadius:DS.r1, marginBottom:8, border:'1px solid '+DS.border, cursor:'pointer' }}>
        <span style={{ fontSize:20 }}>🔔</span>
        <div style={{ flex:1, textAlign:'left' }}>
          <div style={{ fontSize:13, color:DS.t1, fontWeight:500, fontFamily:DS.f }}>Push notifications</div>
          <div style={{ fontSize:11, color:DS.t3, marginTop:2, fontFamily:DS.f }}>Get order alerts in background</div>
        </div>
        <span style={{ color:DS.t3 }}>›</span>
      </button>
      <button onClick={onLock} style={{ width:'100%', display:'flex', alignItems:'center', gap:14, padding:14, background:DS.surface, borderRadius:DS.r1, marginBottom:8, border:'1px solid '+DS.border, cursor:'pointer' }}>
        <span style={{ fontSize:20 }}>🔒</span>
        <div style={{ flex:1, textAlign:'left' }}>
          <div style={{ fontSize:13, color:DS.t1, fontWeight:500, fontFamily:DS.f }}>App lock</div>
          <div style={{ fontSize:11, color:DS.t3, marginTop:2, fontFamily:DS.f }}>PIN protect the driver app</div>
        </div>
        <span style={{ color:DS.t3 }}>›</span>
      </button>

      <button onClick={onSignOut} style={{ width:'100%', marginTop:12, padding:14, background:DS.redDim, border:'1px solid '+DS.redBdr, borderRadius:DS.r1, color:DS.red, fontSize:15, fontWeight:600, cursor:'pointer', fontFamily:DS.f }}>
        🚪 Sign out
      </button>
    </div>
  )
}


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
    shiftRef.current = setInterval(() => setShiftSecs(Math.floor((Date.now()-t0) * 0.001)), 1000)
    return () => clearInterval(shiftRef.current)
  }, [isOnline])

  // Order elapsed timer
  useEffect(() => {
    if (!currentOrder) { setOrderTimer(0); return }
    const start = new Date(currentOrder.created_at).getTime()
    const t = setInterval(() => setOrderTimer(Math.floor((Date.now()-start) * 0.001)), 1000)
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
        const R=6371, dLat=(currentOrder.delivery_lat-lat)*0.01745, dLng=(currentOrder.delivery_lng-lng)*0.01745
        const a=Math.sin(dLat/2)**2+Math.cos(lat*0.01745)*Math.cos(currentOrder.delivery_lat*0.01745)*Math.sin(dLng/2)**2
        const dist=R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))
        if (dist < 0.3) {
          alertedProximity = true
          toast('📍 Almost there — 300m away!',{duration:4000})
          // Auto-notify customer
          try {
            // imports resolved statically
            await supabase.from('order_messages').insert({ order_id:currentOrder.id, sender_id:user.id, sender_role:'driver', content:'I am almost at your location — see you in 2 minutes! 🛵' })
          } catch {}
        }
      }

      if (currentOrder && ['warehouse_confirmed','en_route'].includes(currentOrder.status)) {
        try {
          // imports resolved statically
          // imports resolved statically
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

  const [isWide, setIsWide] = React.useState(window.innerWidth >= 800)
  React.useEffect(() => {
    const fn = () => setIsWide(window.innerWidth >= 800)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  const TABS = [
    { id:'home',        icon:'🏠', label:'Home' },
    { id:'earnings',    icon:'💰', label:'Earnings' },
    { id:'schedule',    icon:'📅', label:'Schedule' },
    { id:'performance', icon:'📊', label:'Stats' },
    { id:'settings',    icon:'⚙️', label:'Settings' },
  ]

  useEffect(() => {
    const el = document.createElement('style')
    el.id = 'driver-app-styles'
    el.textContent = [
      '@keyframes slideUp{from{transform:translateY(40px);opacity:0}to{transform:translateY(0);opacity:1}}',
      '@keyframes pulse{0%25,100%25{opacity:1}50%25{opacity:0.4}}',
      '*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}'
    ].join(' ').split('%25').join('%')
    if (!document.getElementById('driver-app-styles')) document.head.appendChild(el)
    return () => { el.remove() }
  }, [])

  return (
    <div style={{ minHeight:'100vh', background:DS.bg, color:DS.t1, fontFamily:DS.f, display:'flex' }}>

      {showMap && currentOrder && <DeliveryMap order={currentOrder} driverPos={driverPos} onClose={() => setShowMap(false)} />}
      {showChat && currentOrder && <CustomerChat order={currentOrder} driverId={user?.id} onClose={() => setShowChat(false)} />}
      {showPin && currentOrder && <PinEntry order={currentOrder} onSuccess={() => { setShowPin(false); setCurrentOrder(null); setActiveTab('home') }} onCancel={() => setShowPin(false)} />}
      {showIssue && currentOrder && <IssueReport order={currentOrder} onClose={() => setShowIssue(false)} />}
      {showSOS      && <SosPanel driverPos={driverPos} onClose={() => setShowSOS(false)} />}
      {showFeedback  && <CustomerFeedback onClose={() => setShowFeedback(false)} />}
      {showExpenses  && <ExpenseLogger onClose={() => setShowExpenses(false)} />}
      {showPayslip   && <PayslipGenerator profile={profile} onClose={() => setShowPayslip(false)} />}
      {showIncident  && <IncidentReport onClose={() => setShowIncident(false)} />}
      {showNotifSetup && <NotificationSetup onClose={() => setShowNotifSetup(false)} />}
      {appLocked     && <AppLock onUnlock={() => setAppLocked(false)} />}
      {showScanner   && currentOrder && <BarcodeScanner order={currentOrder} onComplete={() => setShowScanner(false)} onClose={() => setShowScanner(false)} />}
      {showSignature && currentOrder && <SignaturePad order={currentOrder} onComplete={() => setShowSignature(false)} onSkip={() => setShowSignature(false)} />}
      {newOrder && !currentOrder && <NewOrderAlert order={newOrder} onAccept={handleAccept} onDecline={() => setNewOrder(null)} loading={accepting} />}

      {/* Desktop sidebar */}
      {isWide && (
        <div style={{ width:220, flexShrink:0, background:DS.surface, borderRight:'1px solid '+DS.border, display:'flex', flexDirection:'column', position:'sticky', top:0, height:'100vh', overflowY:'auto' }}>
          <div style={{ padding:'20px 16px 16px', borderBottom:'1px solid '+DS.border }}>
            <div style={{ fontFamily:DS.fh, fontSize:20, color:DS.t1 }}>Isla Drop</div>
            <div style={{ fontSize:11, color:DS.t3, marginTop:2 }}>Driver Dashboard</div>
          </div>
          <div style={{ padding:'14px 16px', borderBottom:'1px solid '+DS.border }}>
            <div style={{ fontSize:13, fontWeight:700, color:DS.t1 }}>{name}</div>
            <div style={{ fontSize:11, color:isOnline?DS.green:DS.t3, marginTop:3, display:'flex', alignItems:'center', gap:5 }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:isOnline?DS.green:DS.border2 }} />
              {isOnline ? 'Online' : 'Offline'}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginTop:10 }}>
              <div style={{ background:DS.surface2, borderRadius:DS.r1, padding:'8px 6px', textAlign:'center', border:'1px solid '+DS.border2 }}>
                <div style={{ fontSize:14, fontWeight:700, color:DS.green }}>€{(stats?.earnings||0).toFixed(0)}</div>
                <div style={{ fontSize:9, color:DS.t3, textTransform:'uppercase' }}>Today</div>
              </div>
              <div style={{ background:DS.surface2, borderRadius:DS.r1, padding:'8px 6px', textAlign:'center', border:'1px solid '+DS.border2 }}>
                <div style={{ fontSize:14, fontWeight:700, color:DS.blue }}>{stats?.deliveries||0}</div>
                <div style={{ fontSize:9, color:DS.t3, textTransform:'uppercase' }}>Runs</div>
              </div>
            </div>
          </div>
          <nav style={{ flex:1, padding:'8px 0' }}>
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'11px 16px', background:activeTab===tab.id?DS.accentDim:'transparent', border:'none', borderLeft:'3px solid '+(activeTab===tab.id?DS.accent:'transparent'), cursor:'pointer', transition:'all 0.15s' }}>
                <span style={{ fontSize:18 }}>{tab.icon}</span>
                <span style={{ fontSize:13, color:activeTab===tab.id?DS.accent:DS.t2, fontWeight:activeTab===tab.id?700:400, fontFamily:DS.f }}>{tab.label}</span>
              </button>
            ))}
          </nav>
          <div style={{ padding:'12px 16px', borderTop:'1px solid '+DS.border, display:'flex', flexDirection:'column', gap:8 }}>
            <button onClick={toggleOnline} style={{ width:'100%', padding:'10px', background:isOnline?DS.greenDim:DS.accentDim, border:'1px solid '+(isOnline?DS.greenBdr:DS.accentBdr), borderRadius:DS.r1, color:isOnline?DS.green:DS.accent, fontSize:12, fontWeight:700, cursor:'pointer' }}>
              {isOnline ? 'Go offline' : 'Go online'}
            </button>
            <button onClick={() => setShowSOS(true)} style={{ width:'100%', padding:'10px', background:DS.redDim, border:'1px solid '+DS.redBdr, borderRadius:DS.r1, color:DS.red, fontSize:12, fontWeight:700, cursor:'pointer' }}>
              SOS Emergency
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column' }}>

      {/* Header */}
      <div style={{ background:DS.surface, borderBottom:'1px solid '+DS.border, padding:'14px 16px 12px' }}>
        <div style={{ marginBottom:10 }}>
          <div style={{ fontFamily:DS.fh, fontSize:20, color:DS.t1 }}>Hey, {name}</div>
          <div style={{ fontSize:11, color:isOnline?DS.green:DS.t3, marginTop:2, display:'flex', alignItems:'center', gap:5 }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:isOnline?DS.green:DS.border2 }} />
            {isOnline ? 'Online' : 'Offline'}
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => setShowSOS(true)} style={{ flex:1, height:38, borderRadius:DS.r1, background:DS.redDim, border:'1px solid '+DS.redBdr, color:DS.red, fontSize:13, fontWeight:700, cursor:'pointer' }}>
            SOS
          </button>
          <button onClick={toggleOnline} style={{ flex:2, height:38, borderRadius:DS.r1, background:isOnline?DS.greenDim:DS.accentDim, border:'1px solid '+(isOnline?DS.greenBdr:DS.accentBdr), color:isOnline?DS.green:DS.accent, fontSize:13, fontWeight:700, cursor:'pointer' }}>
            {isOnline ? 'Go offline' : 'Go online'}
          </button>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', marginTop:10, borderTop:'1px solid '+DS.border, paddingTop:8 }}>
          {[
            { icon:'💰', val:'€'+(stats?.earnings||0).toFixed(0), label:'Today' },
            { icon:'📦', val:stats?.deliveries||0, label:'Runs' },
            { icon:'⭐', val:(stats?.rating||5.0).toFixed(1), label:'Rating' },
            { icon:'🕐', val:fmt(shiftSecs).slice(0,5), label:'Shift' },
          ].map(s => (
            <div key={s.label} style={{ textAlign:'center' }}>
              <div style={{ fontSize:13 }}>{s.icon}</div>
              <div style={{ fontSize:14, fontWeight:700 }}>{s.val}</div>
              <div style={{ fontSize:9, color:DS.t3, textTransform:'uppercase' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ paddingBottom:isWide?24:80 }}>
        {activeTab === 'home' && (
          <div style={{ padding:16 }}>

            {currentOrder && cfg && (
              <Card accent={cfg.color} style={{ marginBottom:16 }}>
                <div style={{ background:cfg.color+'14', borderBottom:'1px solid '+cfg.color+'30', padding:'12px 16px', display:'flex', justifyContent:'space-between' }}>
                  <Pill color={cfg.color}>{cfg.icon} {cfg.label}</Pill>
                  <span style={{ fontSize:11, color:DS.t3 }}>#{currentOrder.order_number}</span>
                </div>

                <div style={{ padding:'12px 16px 8px', display:'flex', alignItems:'center', gap:4 }}>
                  {STEPS.map((step, i) => {
                    const curr = STEPS.indexOf(currentOrder.status)
                    return (
                      <React.Fragment key={step}>
                        <div style={{ width:24, height:24, borderRadius:'50%', background:i<curr?DS.green:i===curr?cfg.color:DS.border2, border:'2px solid '+(i<curr?DS.green:i===curr?cfg.color:DS.border2), display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'#0D0D0D', flexShrink:0 }}>
                          {i<curr?'✓':i+1}
                        </div>
                        {i < STEPS.length-1 && <div style={{ flex:1, height:2, background:i<curr?DS.green:DS.border2 }} />}
                      </React.Fragment>
                    )
                  })}
                </div>

                <div style={{ padding:'0 16px 16px' }}>
                  <div style={{ fontSize:15, fontWeight:700, color:DS.t1, marginBottom:4 }}>
                    {currentOrder.delivery_address || 'Delivery address'}
                  </div>
                  {currentOrder.what3words && <div style={{ fontSize:12, color:DS.green, marginBottom:6 }}>
                    {currentOrder.what3words}
                  </div>}
                  {currentOrder.delivery_notes && (
                    <div style={{ background:DS.yellowDim, border:'1px solid '+DS.yellowBdr, borderRadius:DS.r1, padding:'8px 12px', marginBottom:10, fontSize:12, color:DS.yellow }}>
                      {currentOrder.delivery_notes}
                    </div>
                  )}

                  <div style={{ background:DS.surface2, borderRadius:DS.r1, padding:'10px 12px', marginBottom:14, border:'1px solid '+DS.border2 }}>
                    <div style={{ fontSize:10, color:DS.t3, textTransform:'uppercase', marginBottom:6 }}>Items</div>
                    {(currentOrder.order_items||[]).map((item,i) => (
                      <div key={i} style={{ fontSize:13, color:DS.t1, marginBottom:3 }}>
                        x{item.quantity||1} {item.product?.name||item.products?.name||'Item'}
                      </div>
                    ))}
                  </div>

                  {currentOrder.status === 'en_route' && currentOrder.delivery_pin && (
                    <div style={{ background:DS.accentDim, border:'1px solid '+DS.accentBdr, borderRadius:DS.r1, padding:'12px 14px', marginBottom:14, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <div>
                        <div style={{ fontSize:10, color:DS.t3, textTransform:'uppercase', marginBottom:4 }}>Customer PIN</div>
                        <div style={{ fontSize:28, fontWeight:900, color:DS.t1, letterSpacing:10 }}>{currentOrder.delivery_pin}</div>
                      </div>
                      <span style={{ fontSize:24 }}>🔐</span>
                    </div>
                  )}

                  {/* Navigation app selector */}
                  {currentOrder?.delivery_address && (
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, marginBottom:10 }}>
                      {[
                        { label:'🗺️ Maps', fn:()=>{ const d=encodeURIComponent(currentOrder.delivery_address); if(/iPhone|iPad|Mac/i.test(navigator.userAgent)) window.open('maps://maps.apple.com/?daddr='+d+'&dirflg=d'); else window.open('https://maps.google.com/maps?daddr='+d+'&travelmode=driving') } },
                        { label:'📍 Waze', fn:()=>{ const ll=currentOrder.delivery_lat+','+currentOrder.delivery_lng; window.open('waze://?ll='+ll+'&navigate=yes') } },
                        { label:'🗺️ Google', fn:()=>{ const d=encodeURIComponent(currentOrder.delivery_address); window.open('https://www.google.com/maps/dir/?api=1&destination='+d+'&travelmode=driving') } },
                      ].map(nav=>(
                        <button key={nav.label} onClick={nav.fn}
                          style={{ padding:'9px 4px', background:DS.surface2, border:'1px solid '+DS.border, borderRadius:DS.r1, color:DS.t2, fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:DS.f }}>
                          {nav.label}
                        </button>
                      ))}
                    </div>
                  )}

                  <div style={{ display:'flex', gap:8, marginBottom:8 }}>
                    <button onClick={() => setShowMap(true)} style={{ flex:1, padding:'12px', background:DS.blueDim, border:'1px solid '+DS.blueBdr, borderRadius:DS.r1, color:DS.blue, fontSize:13, fontWeight:600, cursor:'pointer' }}>Map</button>
                    <button onClick={() => setShowChat(true)} style={{ flex:1, padding:'12px', background:'rgba(168,85,247,0.12)', border:'1px solid rgba(168,85,247,0.3)', borderRadius:DS.r1, color:'#A855F7', fontSize:13, fontWeight:600, cursor:'pointer' }}>Chat</button>
                    {cfg.next && (
                      <button onClick={handleAdvance} style={{ flex:2, padding:'12px', background:cfg.color, border:'none', borderRadius:DS.r1, color:'#0D0D0D', fontSize:13, fontWeight:800, cursor:'pointer' }}>{cfg.nextLabel}</button>
                    )}
                  </div>

                  {currentOrder.status === 'en_route' && (
                    <button onClick={() => setShowPin(true)} style={{ width:'100%', padding:'14px', background:DS.green, border:'none', borderRadius:DS.r1, color:'#0D0D0D', fontSize:15, fontWeight:800, cursor:'pointer', marginBottom:8 }}>
                      Enter delivery PIN
                    </button>
                  )}

                  <button onClick={() => setShowIssue(true)} style={{ width:'100%', padding:'10px', background:'transparent', border:'1px solid '+DS.border, borderRadius:DS.r1, color:DS.t3, fontSize:12, cursor:'pointer' }}>
                    Report issue
                  </button>
                </div>
              </Card>
            )}

            {!currentOrder && (
              isOnline ? (
                <Card style={{ padding:'40px 20px', textAlign:'center', marginBottom:16 }}>
                  <div style={{ fontSize:52, marginBottom:12 }}>🛵</div>
                  <div style={{ fontFamily:DS.fh, fontSize:22, color:DS.t1, marginBottom:6 }}>Ready for deliveries</div>
                  <div style={{ fontSize:14, color:DS.t2 }}>New orders appear automatically</div>
                </Card>
              ) : (
                <Card style={{ padding:'40px 20px', textAlign:'center', marginBottom:16 }}>
                  <div style={{ fontSize:52, marginBottom:12 }}>😴</div>
                  <div style={{ fontFamily:DS.fh, fontSize:22, color:DS.t1, marginBottom:6 }}>You are offline</div>
                  <div style={{ fontSize:14, color:DS.t2, marginBottom:24 }}>Go online to receive orders</div>
                  <button onClick={toggleOnline} style={{ padding:'14px 36px', background:DS.green, border:'none', borderRadius:DS.r1, color:'#0D0D0D', fontSize:16, fontWeight:800, cursor:'pointer' }}>Go online</button>
                </Card>
              )
            )}

            {isOnline && !currentOrder && availableOrders.length > 0 && !newOrder && (
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:DS.t3, textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:10 }}>
                  {availableOrders.length} order{availableOrders.length!==1?'s':''} waiting
                </div>
                {availableOrders.slice(0,3).map(order => (
                  <Card key={order.id} style={{ padding:16, marginBottom:10 }} accent={DS.green}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                      <div style={{ fontSize:14, fontWeight:700 }}>#{order.order_number}</div>
                      <div style={{ fontSize:16, fontWeight:700, color:DS.green }}>€{(order.delivery_fee||3.5).toFixed(2)}</div>
                    </div>
                    <div style={{ fontSize:12, color:DS.t2, marginBottom:10 }}>📍 {order.delivery_address}</div>
                    <ActionBtn onClick={() => handleAccept(order)} disabled={accepting} color={DS.green} full>Accept</ActionBtn>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'earnings' && <EarningsTab stats={stats} isDesktop={isWide} />}
        {activeTab === 'schedule' && <ScheduleAvailabilityTab profile={profile} />}
        {activeTab === 'performance' && <PerformanceTab stats={stats} onShowFeedback={() => setShowFeedback(true)} isDesktop={isWide} />}
        {activeTab === 'settings' && <SettingsTab profile={profile} stats={stats} onSignOut={clear} isDesktop={isWide} onExpenses={() => setShowExpenses(true)} onPayslip={() => setShowPayslip(true)} onIncident={() => setShowIncident(true)} onNotifs={() => setShowNotifSetup(true)} onLock={() => setAppLocked(true)} />}
      </div>

      {/* Bottom tab bar - mobile only */}
      {!isWide && <div style={{ position:'fixed', bottom:0, left:0, right:0, background:DS.surface, borderTop:'1px solid '+DS.border, display:'flex', paddingBottom:'env(safe-area-inset-bottom)', zIndex:200 }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ flex:1, padding:'12px 0 8px', background:'none', border:'none', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
            <span style={{ fontSize:20 }}>{tab.icon}</span>
            <span style={{ fontSize:10, color:activeTab===tab.id?DS.accent:DS.t3, fontWeight:activeTab===tab.id?700:400 }}>{tab.label}</span>
          </button>
        ))}
      </div>}
      </div>
    </div>
  )
}