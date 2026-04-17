import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

// ─── Shared design tokens ──────────────────────────────────────
const C = {
  bg:'#F5F0E8', card:'#FFFFFF', accent:'#C4683A', accentL:'rgba(196,104,58,0.1)',
  green:'#1D9E75', greenL:'rgba(29,158,117,0.1)', blue:'#2B7A8B', blueL:'rgba(43,122,139,0.1)',
  red:'#C43A3A', redL:'rgba(196,58,58,0.1)', yellow:'#B8860B', yellowL:'rgba(184,134,11,0.1)',
  text:'#2A2318', muted:'#7A6E60', border:'rgba(42,35,24,0.12)',
}
const F = { serif:'DM Serif Display,serif', sans:'DM Sans,sans-serif' }

function Card({ children, style={} }) {
  return <div style={{ background:C.card, borderRadius:12, border:'0.5px solid '+C.border, ...style }}>{children}</div>
}
function Btn({ children, onClick, color=C.accent, outline, disabled, style={} }) {
  return <button onClick={onClick} disabled={disabled}
    style={{ padding:'9px 18px', background:outline?'transparent':disabled?C.border:color, border:outline?'1px solid '+color:'none', borderRadius:8, color:outline?color:'white', fontSize:13, fontWeight:600, cursor:disabled?'default':'pointer', opacity:disabled?0.5:1, fontFamily:F.sans, ...style }}>
    {children}
  </button>
}
function Toggle({ value, onChange }) {
  return (
    <button onClick={()=>onChange(!value)}
      style={{ width:48, height:26, borderRadius:13, background:value?C.green:C.border, border:'none', cursor:'pointer', position:'relative', transition:'background 0.2s', flexShrink:0 }}>
      <div style={{ width:22, height:22, borderRadius:'50%', background:'white', position:'absolute', top:2, left:value?24:2, transition:'left 0.2s' }}/>
    </button>
  )
}
function Row({ label, desc, children }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 0', borderBottom:'0.5px solid '+C.border }}>
      <div style={{ flex:1, paddingRight:16 }}>
        <div style={{ fontSize:14, fontWeight:600, color:C.text }}>{label}</div>
        {desc && <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>{desc}</div>}
      </div>
      {children}
    </div>
  )
}

// ── Supabase app_config table helper ──────────────────────────
async function getConfig(key) {
  const { data } = await supabase.from('app_config').select('value').eq('key', key).single()
  return data?.value
}
async function setConfig(key, value) {
  await supabase.from('app_config').upsert({ key, value: JSON.stringify(value) }, { onConflict:'key' })
}

// ═══════════════════════════════════════════════════════════════
// 19. OPERATING HOURS MANAGER
// ═══════════════════════════════════════════════════════════════
export function OperatingHoursManager() {
  const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
  const [hours, setHours] = useState(() => {
    const defaults = {}
    DAYS.forEach(d => { defaults[d] = { open:true, from:'00:00', to:'23:59' } })
    return defaults
  })
  const [closedMsg, setClosedMsg] = useState("We're closed right now. Back soon! 🌴")
  const [manualClosed, setManualClosed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getConfig('operating_hours'), getConfig('closed_message'), getConfig('manual_closed')])
      .then(([h, msg, mc]) => {
        if (h) setHours(JSON.parse(h))
        if (msg) setClosedMsg(JSON.parse(msg))
        if (mc !== null && mc !== undefined) setManualClosed(JSON.parse(mc))
        setLoading(false)
      }).catch(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    await Promise.all([
      setConfig('operating_hours', hours),
      setConfig('closed_message', closedMsg),
      setConfig('manual_closed', manualClosed),
    ])
    setSaving(false)
    toast.success('Operating hours saved!')
  }

  const isOpenNow = () => {
    if (manualClosed) return false
    const now = new Date()
    const day = DAYS[now.getDay() === 0 ? 6 : now.getDay()-1]
    const h = hours[day]
    if (!h?.open) return false
    const [fh,fm] = h.from.split(':').map(Number)
    const [th,tm] = h.to.split(':').map(Number)
    const mins = now.getHours()*60+now.getMinutes()
    return mins >= fh*60+fm && mins <= th*60+tm
  }

  if (loading) return <div style={{padding:40,textAlign:'center',color:C.muted}}>Loading...</div>

  return (
    <div style={{ padding:20 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h2 style={{ fontFamily:F.serif, fontSize:26, margin:0 }}>Operating Hours</h2>
          <div style={{ fontSize:13, color:C.muted }}>Controls the customer app open/closed state</div>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <div style={{ padding:'6px 14px', borderRadius:20, background:isOpenNow()?C.greenL:C.redL, border:'1px solid '+(isOpenNow()?C.green:C.red)+'40', fontSize:12, fontWeight:700, color:isOpenNow()?C.green:C.red }}>
            {isOpenNow() ? '● Open now' : '● Closed now'}
          </div>
          <Btn onClick={save} disabled={saving} color={C.green}>{saving?'Saving...':'Save hours'}</Btn>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:20 }}>
        <Card style={{ padding:20 }}>
          <Row label="🚨 Emergency close" desc="Immediately close the app with a custom message">
            <Toggle value={manualClosed} onChange={setManualClosed} />
          </Row>
          {manualClosed && (
            <div style={{ marginTop:12 }}>
              <div style={{ fontSize:11, color:C.muted, marginBottom:6, textTransform:'uppercase' }}>Closed message shown to customers</div>
              <input value={closedMsg} onChange={e=>setClosedMsg(e.target.value)}
                style={{ width:'100%', padding:'9px 12px', border:'1px solid '+C.border, borderRadius:8, fontSize:13, fontFamily:F.sans, boxSizing:'border-box' }} />
            </div>
          )}
          <div style={{ marginTop:20 }}>
            {DAYS.map(day => (
              <div key={day} style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 0', borderBottom:'0.5px solid '+C.border }}>
                <div style={{ width:100, fontSize:13, fontWeight:600, color:C.text }}>{day.slice(0,3)}</div>
                <Toggle value={hours[day]?.open ?? true} onChange={v=>setHours(p=>({...p,[day]:{...p[day],open:v}}))} />
                {hours[day]?.open && (
                  <>
                    <input type="time" value={hours[day]?.from||'00:00'} onChange={e=>setHours(p=>({...p,[day]:{...p[day],from:e.target.value}}))}
                      style={{ padding:'6px 10px', border:'1px solid '+C.border, borderRadius:8, fontSize:12, fontFamily:F.sans }} />
                    <span style={{ color:C.muted, fontSize:12 }}>to</span>
                    <input type="time" value={hours[day]?.to||'23:59'} onChange={e=>setHours(p=>({...p,[day]:{...p[day],to:e.target.value}}))}
                      style={{ padding:'6px 10px', border:'1px solid '+C.border, borderRadius:8, fontSize:12, fontFamily:F.sans }} />
                  </>
                )}
                {!hours[day]?.open && <span style={{ fontSize:12, color:C.muted }}>Closed</span>}
              </div>
            ))}
          </div>
        </Card>

        <Card style={{ padding:20 }}>
          <div style={{ fontFamily:F.serif, fontSize:18, marginBottom:12 }}>Quick presets</div>
          {[
            { label:'24/7 (always open)', fn:()=>{ const h={}; DAYS.forEach(d=>{h[d]={open:true,from:'00:00',to:'23:59'}}); setHours(h) } },
            { label:'9am–3am daily', fn:()=>{ const h={}; DAYS.forEach(d=>{h[d]={open:true,from:'09:00',to:'02:59'}}); setHours(h) } },
            { label:'Close Sunday', fn:()=>setHours(p=>({...p,Sunday:{...p.Sunday,open:false}})) },
            { label:'Peak season (8am–4am)', fn:()=>{ const h={}; DAYS.forEach(d=>{h[d]={open:true,from:'08:00',to:'03:59'}}); setHours(h) } },
          ].map(preset=>(
            <button key={preset.label} onClick={preset.fn}
              style={{ display:'block', width:'100%', padding:'10px 14px', marginBottom:8, background:C.bg, border:'1px solid '+C.border, borderRadius:8, textAlign:'left', cursor:'pointer', fontSize:13, color:C.text, fontFamily:F.sans }}>
              {preset.label}
            </button>
          ))}
        </Card>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 20. SURGE MODE / ETA MULTIPLIER
// ═══════════════════════════════════════════════════════════════
export function SurgeManager() {
  const [surge, setSurge] = useState(false)
  const [multiplier, setMultiplier] = useState(1.5)
  const [baseETA, setBaseETA] = useState(20)
  const [surgeMsg, setSurgeMsg] = useState("High demand right now — your order may take a little longer 🛵")
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getConfig('surge_active'), getConfig('surge_multiplier'), getConfig('base_eta_mins'), getConfig('surge_message')])
      .then(([s, m, e, msg]) => {
        if (s !== null) setSurge(JSON.parse(s))
        if (m !== null) setMultiplier(JSON.parse(m))
        if (e !== null) setBaseETA(JSON.parse(e))
        if (msg !== null) setSurgeMsg(JSON.parse(msg))
        setLoading(false)
      }).catch(()=>setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    await Promise.all([
      setConfig('surge_active', surge),
      setConfig('surge_multiplier', multiplier),
      setConfig('base_eta_mins', baseETA),
      setConfig('surge_message', surgeMsg),
    ])
    setSaving(false)
    toast.success(surge ? '🔥 Surge mode activated!' : '✅ Surge mode deactivated')
  }

  const effectiveETA = surge ? Math.round(baseETA * multiplier) : baseETA

  if (loading) return <div style={{padding:40,textAlign:'center',color:C.muted}}>Loading...</div>

  return (
    <div style={{ padding:20 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h2 style={{ fontFamily:F.serif, fontSize:26, margin:0 }}>Surge Mode & ETA</h2>
          <div style={{ fontSize:13, color:C.muted }}>Control delivery times shown to customers in real-time</div>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <div style={{ padding:'6px 14px', borderRadius:20, background:surge?C.redL:C.greenL, border:'1px solid '+(surge?C.red:C.green)+'40', fontSize:12, fontWeight:700, color:surge?C.red:C.green }}>
            {surge ? '🔥 Surge active' : '✅ Normal mode'}
          </div>
          <Btn onClick={save} disabled={saving} color={surge?C.red:C.green}>{saving?'Saving...':surge?'Save surge settings':'Save settings'}</Btn>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        <Card style={{ padding:20 }}>
          <Row label="🔥 Surge mode" desc="Multiplies all ETAs and shows warning to customers">
            <Toggle value={surge} onChange={setSurge} />
          </Row>

          <div style={{ marginTop:20 }}>
            <div style={{ fontSize:11, color:C.muted, marginBottom:8, textTransform:'uppercase' }}>Base ETA (normal conditions)</div>
            <div style={{ display:'flex', gap:8, marginBottom:20 }}>
              {[15,18,20,25,30].map(n=>(
                <button key={n} onClick={()=>setBaseETA(n)}
                  style={{ flex:1, padding:'10px 0', borderRadius:8, border:'1px solid '+(baseETA===n?C.accent:C.border), background:baseETA===n?C.accentL:'transparent', color:baseETA===n?C.accent:C.text, cursor:'pointer', fontSize:13, fontWeight:baseETA===n?700:400 }}>
                  {n}m
                </button>
              ))}
            </div>

            {surge && (
              <>
                <div style={{ fontSize:11, color:C.muted, marginBottom:8, textTransform:'uppercase' }}>Surge multiplier</div>
                <div style={{ display:'flex', gap:8, marginBottom:20 }}>
                  {[1.25, 1.5, 1.75, 2.0].map(n=>(
                    <button key={n} onClick={()=>setMultiplier(n)}
                      style={{ flex:1, padding:'10px 0', borderRadius:8, border:'1px solid '+(multiplier===n?C.red:C.border), background:multiplier===n?C.redL:'transparent', color:multiplier===n?C.red:C.text, cursor:'pointer', fontSize:12, fontWeight:multiplier===n?700:400 }}>
                      {n}×
                    </button>
                  ))}
                </div>

                <div style={{ fontSize:11, color:C.muted, marginBottom:6, textTransform:'uppercase' }}>Surge message shown to customers</div>
                <textarea value={surgeMsg} onChange={e=>setSurgeMsg(e.target.value)} rows={3}
                  style={{ width:'100%', padding:'9px 12px', border:'1px solid '+C.border, borderRadius:8, fontSize:13, fontFamily:F.sans, resize:'vertical', boxSizing:'border-box' }} />
              </>
            )}
          </div>
        </Card>

        <Card style={{ padding:20 }}>
          <div style={{ fontFamily:F.serif, fontSize:18, marginBottom:16 }}>Live preview</div>
          <div style={{ background:C.bg, borderRadius:12, padding:20, textAlign:'center' }}>
            <div style={{ fontSize:11, color:C.muted, marginBottom:4, textTransform:'uppercase' }}>Customer sees</div>
            <div style={{ fontSize:48, fontWeight:900, color:surge?C.red:C.green }}>{effectiveETA}</div>
            <div style={{ fontSize:14, color:C.muted }}>minutes estimated</div>
            {surge && (
              <div style={{ marginTop:12, padding:'8px 12px', background:C.redL, border:'1px solid '+C.red+'30', borderRadius:8, fontSize:12, color:C.red }}>
                {surgeMsg}
              </div>
            )}
          </div>
          <div style={{ marginTop:16, fontSize:12, color:C.muted, lineHeight:1.6 }}>
            Base ETA: {baseETA} min{surge ? ' × '+multiplier+' = '+effectiveETA+' min' : ''}
          </div>
        </Card>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 21. HOMEPAGE CATEGORY ORDER
// ═══════════════════════════════════════════════════════════════
export function CategoryOrderManager() {
  const DEFAULT_CATS = [
    { key:'spirits', emoji:'🥃', label:'Spirits' },
    { key:'beer', emoji:'🍺', label:'Beer & Cider' },
    { key:'wine', emoji:'🍷', label:'Wine' },
    { key:'champagne', emoji:'🥂', label:'Champagne' },
    { key:'soft_drinks', emoji:'🥤', label:'Soft Drinks' },
    { key:'water', emoji:'💧', label:'Water' },
    { key:'snacks', emoji:'🍟', label:'Snacks' },
    { key:'ice', emoji:'🧊', label:'Ice' },
    { key:'tobacco', emoji:'🚬', label:'Tobacco' },
  ]

  const [cats, setCats] = useState(DEFAULT_CATS)
  const [pinned, setPinned] = useState(null)
  const [spotlight, setSpotlight] = useState({ enabled:false, label:'Summer Essentials 🌞', key:'beer' })
  const [saving, setSaving] = useState(false)
  const [dragging, setDragging] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getConfig('category_order'), getConfig('pinned_category'), getConfig('spotlight_category')])
      .then(([order, pin, spot]) => {
        if (order) setCats(JSON.parse(order))
        if (pin !== null) setPinned(JSON.parse(pin))
        if (spot !== null) setSpotlight(JSON.parse(spot))
        setLoading(false)
      }).catch(()=>setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    await Promise.all([
      setConfig('category_order', cats),
      setConfig('pinned_category', pinned),
      setConfig('spotlight_category', spotlight),
    ])
    setSaving(false)
    toast.success('Category order saved!')
  }

  const moveUp = (i) => { if(i===0) return; const n=[...cats]; [n[i-1],n[i]]=[n[i],n[i-1]]; setCats(n) }
  const moveDown = (i) => { if(i===cats.length-1) return; const n=[...cats]; [n[i],n[i+1]]=[n[i+1],n[i]]; setCats(n) }

  if (loading) return <div style={{padding:40,textAlign:'center',color:C.muted}}>Loading...</div>

  return (
    <div style={{ padding:20 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h2 style={{ fontFamily:F.serif, fontSize:26, margin:0 }}>Category Order</h2>
          <div style={{ fontSize:13, color:C.muted }}>Drag categories to control order on the customer home screen</div>
        </div>
        <Btn onClick={save} disabled={saving} color={C.green}>{saving?'Saving...':'Save order'}</Btn>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        <div>
          <Card style={{ padding:20, marginBottom:16 }}>
            <div style={{ fontSize:14, fontWeight:700, marginBottom:12 }}>Category order (drag to reorder)</div>
            {cats.map((cat,i) => (
              <div key={cat.key} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', marginBottom:6, background:pinned===cat.key?C.accentL:C.bg, border:'1px solid '+(pinned===cat.key?C.accent:C.border), borderRadius:10 }}>
                <span style={{ fontSize:20 }}>{cat.emoji}</span>
                <span style={{ flex:1, fontSize:13, fontWeight:600, color:C.text }}>{cat.label}</span>
                {pinned===cat.key && <span style={{ fontSize:10, color:C.accent, fontWeight:700, background:C.accentL, padding:'2px 8px', borderRadius:99 }}>📌 PINNED</span>}
                <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                  <button onClick={()=>moveUp(i)} style={{ background:C.border, border:'none', borderRadius:4, width:20, height:16, cursor:'pointer', fontSize:10, display:'flex', alignItems:'center', justifyContent:'center' }}>▲</button>
                  <button onClick={()=>moveDown(i)} style={{ background:C.border, border:'none', borderRadius:4, width:20, height:16, cursor:'pointer', fontSize:10, display:'flex', alignItems:'center', justifyContent:'center' }}>▼</button>
                </div>
                <button onClick={()=>setPinned(pinned===cat.key?null:cat.key)}
                  style={{ padding:'4px 8px', fontSize:10, borderRadius:6, border:'1px solid '+C.border, background:'white', cursor:'pointer', color:C.muted }}>
                  {pinned===cat.key ? 'Unpin' : 'Pin top'}
                </button>
              </div>
            ))}
          </Card>
        </div>

        <div>
          <Card style={{ padding:20 }}>
            <div style={{ fontSize:14, fontWeight:700, marginBottom:12 }}>Seasonal spotlight banner</div>
            <Row label="Show spotlight" desc="Pin a custom banner above all categories">
              <Toggle value={spotlight.enabled} onChange={v=>setSpotlight(p=>({...p,enabled:v}))} />
            </Row>
            {spotlight.enabled && (
              <>
                <div style={{ marginTop:12 }}>
                  <div style={{ fontSize:11, color:C.muted, marginBottom:6, textTransform:'uppercase' }}>Banner label</div>
                  <input value={spotlight.label} onChange={e=>setSpotlight(p=>({...p,label:e.target.value}))}
                    style={{ width:'100%', padding:'9px 12px', border:'1px solid '+C.border, borderRadius:8, fontSize:13, fontFamily:F.sans, boxSizing:'border-box', marginBottom:10 }} />
                  <div style={{ fontSize:11, color:C.muted, marginBottom:6, textTransform:'uppercase' }}>Links to category</div>
                  <select value={spotlight.key} onChange={e=>setSpotlight(p=>({...p,key:e.target.value}))}
                    style={{ width:'100%', padding:'9px 12px', border:'1px solid '+C.border, borderRadius:8, fontSize:13, fontFamily:F.sans }}>
                    {cats.map(c=><option key={c.key} value={c.key}>{c.emoji} {c.label}</option>)}
                  </select>
                </div>
                <div style={{ marginTop:12, padding:'12px 16px', background:'linear-gradient(135deg,rgba(43,122,139,0.2),rgba(196,104,58,0.15))', border:'0.5px solid rgba(43,122,139,0.3)', borderRadius:10 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:C.text }}>Preview</div>
                  <div style={{ fontSize:12, color:C.muted }}>{spotlight.label}</div>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 23. WELCOME DISCOUNT & PROMO SETTINGS
// ═══════════════════════════════════════════════════════════════
export function PromoSettingsManager() {
  const [settings, setSettings] = useState({
    welcome_enabled: true, welcome_amount: 5, welcome_min_order: 15,
    referral_giver: 10, referral_receiver: 10, referral_min_order: 20,
    first_order_banner: 'Welcome to Isla Drop 🌴 Get €5 off your first order!',
  })
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getConfig('promo_settings').then(v => {
      if (v) setSettings(JSON.parse(v))
      setLoading(false)
    }).catch(()=>setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    await setConfig('promo_settings', settings)
    setSaving(false)
    toast.success('Promo settings saved!')
  }

  const Field = ({ label, desc, field, type='number', min=0 }) => (
    <div style={{ marginBottom:14 }}>
      <div style={{ fontSize:11, color:C.muted, marginBottom:5, textTransform:'uppercase' }}>{label}</div>
      {desc && <div style={{ fontSize:11, color:C.muted, marginBottom:5 }}>{desc}</div>}
      <input type={type} value={settings[field]} min={min}
        onChange={e=>setSettings(p=>({...p,[field]:type==='number'?parseFloat(e.target.value)||0:e.target.value}))}
        style={{ width:'100%', padding:'9px 12px', border:'1px solid '+C.border, borderRadius:8, fontSize:13, fontFamily:F.sans, boxSizing:'border-box' }} />
    </div>
  )

  if (loading) return <div style={{padding:40,textAlign:'center',color:C.muted}}>Loading...</div>

  return (
    <div style={{ padding:20 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h2 style={{ fontFamily:F.serif, fontSize:26, margin:0 }}>Promo & Discount Settings</h2>
          <div style={{ fontSize:13, color:C.muted }}>Control all discount amounts without touching code</div>
        </div>
        <Btn onClick={save} disabled={saving} color={C.green}>{saving?'Saving...':'Save settings'}</Btn>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        <Card style={{ padding:20 }}>
          <div style={{ fontFamily:F.serif, fontSize:18, marginBottom:16 }}>First-order welcome discount</div>
          <Row label="Enable welcome discount" desc="Show €X off banner to first-time customers">
            <Toggle value={settings.welcome_enabled} onChange={v=>setSettings(p=>({...p,welcome_enabled:v}))} />
          </Row>
          {settings.welcome_enabled && (
            <div style={{ marginTop:16 }}>
              <Field label="Discount amount (€)" field="welcome_amount" />
              <Field label="Minimum order value (€)" field="welcome_min_order" />
              <Field label="Banner text shown to customers" field="first_order_banner" type="text" />
              <div style={{ padding:'10px 14px', background:C.greenL, border:'1px solid '+C.green+'30', borderRadius:8, fontSize:12, color:C.green }}>
                Preview: {settings.first_order_banner}
              </div>
            </div>
          )}
        </Card>

        <Card style={{ padding:20 }}>
          <div style={{ fontFamily:F.serif, fontSize:18, marginBottom:16 }}>Referral programme</div>
          <Field label="Reward for referrer (€)" desc="Person who shares their code gets" field="referral_giver" />
          <Field label="Discount for referee (€)" desc="New customer gets off first order" field="referral_receiver" />
          <Field label="Minimum order to claim referral (€)" field="referral_min_order" />
          <div style={{ padding:'10px 14px', background:C.accentL, border:'1px solid '+C.accent+'30', borderRadius:8, fontSize:12, color:C.accent, marginTop:4 }}>
            Share €{settings.referral_receiver}, earn €{settings.referral_giver} — when they spend min €{settings.referral_min_order}
          </div>
        </Card>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 24. SPLASH / HERO IMAGE MANAGER
// ═══════════════════════════════════════════════════════════════
export function SplashImageManager() {
  const [currentUrl, setCurrentUrl] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getConfig('splash_image_url').then(v => {
      if (v) { const url = JSON.parse(v); setCurrentUrl(url); setNewUrl(url) }
      setLoading(false)
    }).catch(()=>setLoading(false))
  }, [])

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = 'splash/splash-' + Date.now() + '.' + ext
    const { data, error } = await supabase.storage.from('public-assets').upload(path, file, { upsert:true })
    if (!error && data) {
      const { data:{ publicUrl } } = supabase.storage.from('public-assets').getPublicUrl(path)
      setNewUrl(publicUrl)
    } else {
      toast.error('Upload failed: ' + (error?.message||'unknown'))
    }
    setUploading(false)
  }

  const save = async () => {
    setSaving(true)
    await setConfig('splash_image_url', newUrl)
    setCurrentUrl(newUrl)
    setSaving(false)
    toast.success('Splash image updated! Changes live in customer app.')
  }

  if (loading) return <div style={{padding:40,textAlign:'center',color:C.muted}}>Loading...</div>

  return (
    <div style={{ padding:20 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h2 style={{ fontFamily:F.serif, fontSize:26, margin:0 }}>Splash & Hero Images</h2>
          <div style={{ fontSize:13, color:C.muted }}>Update the customer app splash screen without a code deployment</div>
        </div>
        <Btn onClick={save} disabled={saving||!newUrl||newUrl===currentUrl} color={C.green}>{saving?'Saving...':'Publish image'}</Btn>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        <Card style={{ padding:20 }}>
          <div style={{ fontSize:14, fontWeight:700, marginBottom:12 }}>Upload new image</div>
          <label style={{ display:'block', border:'2px dashed '+C.border, borderRadius:12, padding:'32px', textAlign:'center', cursor:'pointer', background:C.bg, marginBottom:14 }}>
            <input type="file" accept="image/*" onChange={handleFile} style={{ display:'none' }} />
            {uploading ? (
              <div style={{ color:C.muted, fontSize:14 }}>Uploading...</div>
            ) : (
              <>
                <div style={{ fontSize:32, marginBottom:8 }}>🖼️</div>
                <div style={{ fontSize:13, fontWeight:600, color:C.text }}>Click to upload</div>
                <div style={{ fontSize:11, color:C.muted, marginTop:4 }}>JPG, PNG, WebP · Recommended: 1080×1920px portrait</div>
              </>
            )}
          </label>
          <div style={{ fontSize:11, color:C.muted, marginBottom:6, textTransform:'uppercase' }}>Or paste image URL</div>
          <input value={newUrl} onChange={e=>setNewUrl(e.target.value)}
            placeholder="https://..."
            style={{ width:'100%', padding:'9px 12px', border:'1px solid '+C.border, borderRadius:8, fontSize:13, fontFamily:F.sans, boxSizing:'border-box' }} />
        </Card>

        <Card style={{ padding:20 }}>
          <div style={{ fontSize:14, fontWeight:700, marginBottom:12 }}>Preview</div>
          {newUrl ? (
            <div style={{ position:'relative', borderRadius:12, overflow:'hidden', background:'#0A2A38' }}>
              <img src={newUrl} style={{ width:'100%', aspectRatio:'9/16', objectFit:'cover', display:'block' }} alt="Splash preview" onError={e=>{e.target.style.display='none'}} />
              <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'20px 16px', background:'linear-gradient(transparent,rgba(0,0,0,0.8))' }}>
                <div style={{ fontFamily:F.serif, fontSize:28, color:'white' }}>Isla Drop</div>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.6)', letterSpacing:'2px' }}>24/7 DELIVERY · IBIZA</div>
              </div>
            </div>
          ) : (
            <div style={{ height:200, background:C.bg, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', color:C.muted }}>No image set</div>
          )}
        </Card>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 25. BRAND SETTINGS — colours without code changes
// ═══════════════════════════════════════════════════════════════
export function BrandSettingsManager() {
  const [brand, setBrand] = useState({
    accent: '#C4683A', accentName: 'Terracotta', dark: '#0D3545', darkName: 'Deep Ocean',
    gold: '#C8A84B', logo: '', appName: 'Isla Drop', tagline: '24/7 Delivery · Ibiza'
  })
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getConfig('brand_settings').then(v => {
      if (v) setBrand(JSON.parse(v))
      setLoading(false)
    }).catch(()=>setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    await setConfig('brand_settings', brand)
    setSaving(false)
    toast.success('Brand settings saved! Restart customer app to apply.')
  }

  const PRESETS = [
    { label:'Terracotta (default)', accent:'#C4683A', dark:'#0D3545' },
    { label:'Midnight blue', accent:'#1A4A8B', dark:'#0A0F1E' },
    { label:'Forest green', accent:'#2A7A3A', dark:'#0A1E0F' },
    { label:'Rose gold', accent:'#C4768B', dark:'#1E0A14' },
    { label:'Electric purple', accent:'#6B3A8B', dark:'#10041A' },
    { label:'Ibiza coral', accent:'#E8534A', dark:'#1A0A0A' },
  ]

  const ColourPicker = ({ label, field }) => (
    <div style={{ marginBottom:14 }}>
      <div style={{ fontSize:11, color:C.muted, marginBottom:6, textTransform:'uppercase' }}>{label}</div>
      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
        <input type="color" value={brand[field]} onChange={e=>setBrand(p=>({...p,[field]:e.target.value}))}
          style={{ width:40, height:40, borderRadius:8, border:'1px solid '+C.border, cursor:'pointer', padding:2 }} />
        <input value={brand[field]} onChange={e=>setBrand(p=>({...p,[field]:e.target.value}))}
          style={{ flex:1, padding:'9px 12px', border:'1px solid '+C.border, borderRadius:8, fontSize:13, fontFamily:'monospace' }} />
        <div style={{ width:40, height:40, borderRadius:8, background:brand[field], border:'1px solid '+C.border }} />
      </div>
    </div>
  )

  if (loading) return <div style={{padding:40,textAlign:'center',color:C.muted}}>Loading...</div>

  return (
    <div style={{ padding:20 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h2 style={{ fontFamily:F.serif, fontSize:26, margin:0 }}>Brand Settings</h2>
          <div style={{ fontSize:13, color:C.muted }}>Update colours, name and tagline — no code changes needed</div>
        </div>
        <Btn onClick={save} disabled={saving} color={C.green}>{saving?'Saving...':'Save brand'}</Btn>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        <Card style={{ padding:20 }}>
          <div style={{ fontFamily:F.serif, fontSize:18, marginBottom:16 }}>Colour presets</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:20 }}>
            {PRESETS.map(p=>(
              <button key={p.label} onClick={()=>setBrand(prev=>({...prev,accent:p.accent,dark:p.dark}))}
                style={{ padding:'10px 12px', borderRadius:10, border:'2px solid '+(brand.accent===p.accent?p.accent:C.border), background:brand.accent===p.accent?p.accent+'12':'transparent', cursor:'pointer', textAlign:'left', fontSize:12, fontFamily:F.sans }}>
                <div style={{ display:'flex', gap:6, marginBottom:4 }}>
                  <div style={{ width:16, height:16, borderRadius:'50%', background:p.accent }}/>
                  <div style={{ width:16, height:16, borderRadius:'50%', background:p.dark }}/>
                </div>
                {p.label}
              </button>
            ))}
          </div>
          <ColourPicker label="Primary accent colour" field="accent" />
          <ColourPicker label="Dark background colour" field="dark" />
          <ColourPicker label="Gold / premium colour" field="gold" />
        </Card>

        <Card style={{ padding:20 }}>
          <div style={{ fontFamily:F.serif, fontSize:18, marginBottom:16 }}>App identity</div>
          {[['appName','App name'],['tagline','Tagline']].map(([k,l])=>(
            <div key={k} style={{ marginBottom:14 }}>
              <div style={{ fontSize:11, color:C.muted, marginBottom:5, textTransform:'uppercase' }}>{l}</div>
              <input value={brand[k]} onChange={e=>setBrand(p=>({...p,[k]:e.target.value}))}
                style={{ width:'100%', padding:'9px 12px', border:'1px solid '+C.border, borderRadius:8, fontSize:13, fontFamily:F.sans, boxSizing:'border-box' }} />
            </div>
          ))}
          <div style={{ marginTop:16 }}>
            <div style={{ fontSize:14, fontWeight:700, marginBottom:8 }}>Preview</div>
            <div style={{ background:brand.dark, borderRadius:12, padding:'20px 16px', textAlign:'center' }}>
              <div style={{ fontFamily:F.serif, fontSize:32, color:'white', marginBottom:4 }}>{brand.appName}</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.5)', letterSpacing:'2px', textTransform:'uppercase' }}>{brand.tagline}</div>
              <button style={{ marginTop:16, padding:'12px 24px', background:brand.accent, border:'none', borderRadius:12, color:'white', fontSize:14, fontWeight:600, cursor:'pointer' }}>Order Now</button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 26. NOTIFICATION COPY EDITOR
// ═══════════════════════════════════════════════════════════════
export function NotificationCopyEditor() {
  const [copy, setCopy] = useState({
    order_confirmed: '✅ Order confirmed! We\'re preparing your order.',
    driver_assigned: '🛵 Your driver is on the way!',
    order_arriving: '🚀 Almost there — your order is nearby!',
    order_delivered: '🎉 Delivered! Enjoy your order.',
    order_late: '⏱️ Running a little late — new ETA {mins} minutes. Sorry!',
    flash_sale: '⚡ Flash sale! {desc} — order now!',
  })
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getConfig('notification_copy').then(v => {
      if (v) setCopy(JSON.parse(v))
      setLoading(false)
    }).catch(()=>setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    await setConfig('notification_copy', copy)
    setSaving(false)
    toast.success('Notification copy saved!')
  }

  const EVENTS = [
    { key:'order_confirmed', label:'Order confirmed', desc:'Sent when ops confirms the order', vars:[] },
    { key:'driver_assigned', label:'Driver assigned', desc:'Sent when a driver accepts the job', vars:['{driver}'] },
    { key:'order_arriving', label:'Arriving soon', desc:'Sent when driver is ~5 min away', vars:['{mins}'] },
    { key:'order_delivered', label:'Order delivered', desc:'Sent on delivery completion', vars:[] },
    { key:'order_late', label:'Running late', desc:'Sent when ops pushes a new ETA', vars:['{mins}'] },
    { key:'flash_sale', label:'Flash sale alert', desc:'Sent when a flash sale starts', vars:['{desc}','{pct}'] },
  ]

  if (loading) return <div style={{padding:40,textAlign:'center',color:C.muted}}>Loading...</div>

  return (
    <div style={{ padding:20 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h2 style={{ fontFamily:F.serif, fontSize:26, margin:0 }}>Notification Copy</h2>
          <div style={{ fontSize:13, color:C.muted }}>Edit all customer notification messages without touching code</div>
        </div>
        <Btn onClick={save} disabled={saving} color={C.green}>{saving?'Saving...':'Save copy'}</Btn>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        {EVENTS.map(event => (
          <Card key={event.key} style={{ padding:18 }}>
            <div style={{ fontSize:14, fontWeight:700, color:C.text, marginBottom:2 }}>{event.label}</div>
            <div style={{ fontSize:11, color:C.muted, marginBottom:10 }}>{event.desc}</div>
            <textarea value={copy[event.key]} onChange={e=>setCopy(p=>({...p,[event.key]:e.target.value}))} rows={3}
              style={{ width:'100%', padding:'9px 12px', border:'1px solid '+C.border, borderRadius:8, fontSize:13, fontFamily:F.sans, resize:'vertical', boxSizing:'border-box' }} />
            {event.vars.length > 0 && (
              <div style={{ fontSize:10, color:C.muted, marginTop:4 }}>
                Variables: {event.vars.map(v=><code key={v} style={{ background:C.bg, padding:'1px 5px', borderRadius:4, marginRight:4 }}>{v}</code>)}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 27. PRODUCT SPOTLIGHT — pin products to top of category
// ═══════════════════════════════════════════════════════════════
export function ProductSpotlightManager() {
  const [products, setProducts] = useState([])
  const [spotlights, setSpotlights] = useState([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    Promise.all([
      supabase.from('products').select('id,name,emoji,category,price,is_active').eq('is_active',true).order('name'),
      getConfig('product_spotlights')
    ]).then(([productsRes, spots]) => {
      setProducts(productsRes.data||[])
      if (spots) setSpotlights(JSON.parse(spots))
      setLoading(false)
    }).catch(()=>setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    await setConfig('product_spotlights', spotlights)
    setSaving(false)
    toast.success('Spotlights saved!')
  }

  const toggle = (product) => {
    setSpotlights(prev => {
      const exists = prev.find(s=>s.id===product.id)
      return exists ? prev.filter(s=>s.id!==product.id) : [...prev, product]
    })
  }

  const filtered = products.filter(p=>p.name.toLowerCase().includes(search.toLowerCase()))
  const spotlightIds = new Set(spotlights.map(s=>s.id))

  if (loading) return <div style={{padding:40,textAlign:'center',color:C.muted}}>Loading...</div>

  return (
    <div style={{ padding:20 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h2 style={{ fontFamily:F.serif, fontSize:26, margin:0 }}>Product Spotlight</h2>
          <div style={{ fontSize:13, color:C.muted }}>Pin products to the top of their category — no code needed</div>
        </div>
        <Btn onClick={save} disabled={saving} color={C.green}>{saving?'Saving...':'Save spotlights'}</Btn>
      </div>

      {spotlights.length > 0 && (
        <Card style={{ padding:16, marginBottom:16, borderLeft:'3px solid '+C.accent }}>
          <div style={{ fontSize:12, fontWeight:700, color:C.muted, textTransform:'uppercase', marginBottom:10 }}>Currently spotlighted ({spotlights.length})</div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {spotlights.map(s=>(
              <div key={s.id} style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 10px', background:C.accentL, border:'1px solid '+C.accent+'30', borderRadius:20 }}>
                <span>{s.emoji}</span>
                <span style={{ fontSize:12, fontWeight:600 }}>{s.name}</span>
                <button onClick={()=>toggle(s)} style={{ background:'none', border:'none', color:C.accent, cursor:'pointer', fontSize:14, lineHeight:1 }}>×</button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search products to spotlight..."
        style={{ width:'100%', padding:'11px 16px', border:'1px solid '+C.border, borderRadius:10, fontSize:13, fontFamily:F.sans, marginBottom:16, boxSizing:'border-box' }} />

      <Card>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
          <thead>
            <tr style={{ background:C.bg }}>
              {['','Product','Category','Price','Spotlighted'].map(h=>(
                <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontWeight:700, color:C.muted, fontSize:11, textTransform:'uppercase', borderBottom:'1px solid '+C.border }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0,40).map((p,i) => (
              <tr key={p.id} style={{ borderBottom:'0.5px solid '+C.border, background:spotlightIds.has(p.id)?C.accentL:i%2===0?'white':C.bg }}>
                <td style={{ padding:'10px 14px', fontSize:20 }}>{p.emoji}</td>
                <td style={{ padding:'10px 14px', fontWeight:600, color:C.text }}>{p.name}</td>
                <td style={{ padding:'10px 14px', color:C.muted, textTransform:'capitalize' }}>{p.category}</td>
                <td style={{ padding:'10px 14px', fontWeight:700, color:'#1D9E75' }}>€{parseFloat(p.price).toFixed(2)}</td>
                <td style={{ padding:'10px 14px' }}>
                  <button onClick={()=>toggle(p)}
                    style={{ padding:'5px 14px', borderRadius:20, border:'1px solid '+(spotlightIds.has(p.id)?C.accent:C.border), background:spotlightIds.has(p.id)?C.accentL:'transparent', color:spotlightIds.has(p.id)?C.accent:C.muted, cursor:'pointer', fontSize:12, fontWeight:spotlightIds.has(p.id)?700:400 }}>
                    {spotlightIds.has(p.id) ? '📌 Spotlighted' : '+ Spotlight'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 28. REFERRAL REWARD AMOUNT CONTROL
// (now embedded in PromoSettingsManager above — exported separately for nav)
// ═══════════════════════════════════════════════════════════════
export function AppConfigOverview({ onNavigate }) {
  const [configs, setConfigs] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('app_config').select('key,value').then(({ data }) => {
      const map = {}
      if (data) data.forEach(r=>{ try { map[r.key]=JSON.parse(r.value) } catch { map[r.key]=r.value } })
      setConfigs(map)
      setLoading(false)
    }).catch(()=>setLoading(false))
  }, [])

  const isOpen = () => {
    if (configs.manual_closed) return false
    return true
  }

  const CONFIG_SECTIONS = [
    { icon:'🕐', label:'Operating hours', tab:'hours', status: isOpen() ? '24/7 open' : '⚠️ Closed' },
    { icon:'🔥', label:'Surge mode', tab:'surge', status: configs.surge_active ? '🔥 Active ('+configs.surge_multiplier+'×)' : 'Normal' },
    { icon:'📋', label:'Category order', tab:'cat_order', status: configs.category_order ? 'Customised' : 'Default' },
    { icon:'🎁', label:'Promo settings', tab:'promo_settings', status: 'Welcome €'+(configs.promo_settings?.welcome_amount||5) },
    { icon:'🖼️', label:'Splash image', tab:'splash_img', status: configs.splash_image_url ? '✓ Custom' : 'Default' },
    { icon:'🎨', label:'Brand settings', tab:'brand', status: configs.brand_settings?.appName || 'Isla Drop' },
    { icon:'📣', label:'Notification copy', tab:'notif_copy', status: 'Customised' },
    { icon:'📌', label:'Product spotlight', tab:'spotlight', status: (configs.product_spotlights?.length||0)+' spotlighted' },
  ]

  return (
    <div style={{ padding:20 }}>
      <h2 style={{ fontFamily:F.serif, fontSize:26, margin:'0 0 8px' }}>App Config Centre</h2>
      <div style={{ fontSize:13, color:C.muted, marginBottom:24 }}>Everything you can control without touching code or Supabase</div>
      {loading ? <div style={{textAlign:'center',padding:32,color:C.muted}}>Loading...</div>
      : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:12 }}>
          {CONFIG_SECTIONS.map(s=>(
            <button key={s.tab} onClick={()=>onNavigate?.(s.tab)}
              style={{ padding:'20px', background:'white', border:'0.5px solid '+C.border, borderRadius:14, cursor:'pointer', textAlign:'left' }}>
              <div style={{ fontSize:32, marginBottom:8 }}>{s.icon}</div>
              <div style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:4 }}>{s.label}</div>
              <div style={{ fontSize:12, color:C.muted }}>{s.status}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
