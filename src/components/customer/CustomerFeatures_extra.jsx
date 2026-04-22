// ================================================================
// Isla Drop — CustomerFeatures_extra.jsx
// All 16 remaining Getir-parity features
// ================================================================
import { useState, useEffect, useRef, useCallback } from 'react'
import { useCartStore, useAuthStore } from '../../lib/store'
import { PRODUCTS } from '../../lib/products'
import toast from 'react-hot-toast'

const F = { serif:'DM Serif Display,serif', sans:'DM Sans,sans-serif' }
const C = {
  bg:'#0D3545', accent:'#C4683A', green:'#7EE8A2', gold:'#C8A84B',
  surface:'rgba(255,255,255,0.07)', border:'rgba(255,255,255,0.1)',
  muted:'rgba(255,255,255,0.45)', white:'white',
}
const hdr = { background:'linear-gradient(135deg,#0D3B4A,#1A5263)', padding:'16px 16px 20px', position:'sticky', top:0, zIndex:50 }
const backBtn = (onBack) => (
  <button onClick={onBack} style={{ width:36,height:36,background:'rgba(255,255,255,0.1)',border:'0.5px solid rgba(255,255,255,0.18)',borderRadius:'50%',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
  </button>
)

// ── FEATURE 1: Pull-to-refresh ────────────────────────────────
export function usePullToRefresh(onRefresh) {
  const startY = useRef(0)
  const [pulling, setPulling] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const onTouchStart = useCallback(e => {
    if (window.scrollY === 0) startY.current = e.touches[0].clientY
  }, [])

  const onTouchMove = useCallback(e => {
    if (!startY.current) return
    const delta = e.touches[0].clientY - startY.current
    if (delta > 60 && window.scrollY === 0) setPulling(true)
  }, [])

  const onTouchEnd = useCallback(async () => {
    if (pulling) {
      setRefreshing(true)
      setPulling(false)
      await onRefresh()
      setRefreshing(false)
    }
    startY.current = 0
  }, [pulling, onRefresh])

  return { pulling, refreshing, onTouchStart, onTouchMove, onTouchEnd }
}

export function PullToRefreshIndicator({ pulling, refreshing }) {
  if (!pulling && !refreshing) return null
  return (
    <div style={{ position:'fixed', top:0, left:0, right:0, zIndex:999, display:'flex', justifyContent:'center', padding:'12px 0', pointerEvents:'none' }}>
      <div style={{ background:'rgba(13,53,69,0.95)', backdropFilter:'blur(10px)', borderRadius:99, padding:'8px 20px', display:'flex', alignItems:'center', gap:8, boxShadow:'0 4px 20px rgba(0,0,0,0.3)' }}>
        {refreshing ? (
          <>
            <div style={{ width:16, height:16, border:'2px solid rgba(255,255,255,0.2)', borderTopColor:'#C4683A', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>
            <span style={{ fontSize:12, color:'white', fontFamily:F.sans }}>Refreshing...</span>
          </>
        ) : (
          <span style={{ fontSize:12, color:C.muted, fontFamily:F.sans }}>Release to refresh</span>
        )}
      </div>
    </div>
  )
}

// ── FEATURE 3: Driver name on tracking ───────────────────────
export function useDriverInfo(driverId) {
  const [driver, setDriver] = useState(null)
  useEffect(() => {
    if (!driverId) return
    import('../../lib/supabase').then(({ supabase }) => {
      supabase.from('driver_profiles').select('full_name,avatar_url,rating').eq('id', driverId).single()
        .then(({ data }) => { if (data) setDriver(data) }).catch(() => {})
    }).catch(() => {})
  }, [driverId])
  return driver
}

export function DriverInfoCard({ driverId }) {
  const driver = useDriverInfo(driverId)
  const name = driver?.full_name?.split(' ')[0] || 'Your driver'
  const rating = driver?.rating ? Number(driver.rating).toFixed(1) : '5.0'
  return (
    <div style={{ background:C.surface, border:'0.5px solid '+C.border, borderRadius:14, padding:'14px 16px', marginBottom:16, display:'flex', alignItems:'center', gap:12 }}>
      <div style={{ width:48, height:48, borderRadius:'50%', background:'linear-gradient(135deg,#C4683A,#E8854A)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0, fontWeight:700, color:'white', overflow:'hidden' }}>
        {driver?.avatar_url ? <img src={driver.avatar_url} alt={name} style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : name[0]}
      </div>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:15, fontWeight:600, color:'white', fontFamily:F.sans }}>{name} is on the way 🛵</div>
        <div style={{ fontSize:11, color:C.muted, marginTop:3, display:'flex', alignItems:'center', gap:4 }}>
          <span>⭐ {rating}</span>
          <span>·</span>
          <span>Verified Isla Drop driver</span>
        </div>
      </div>
    </div>
  )
}

// ── FEATURE 4: Tip in basket total ───────────────────────────
// This is a hook that reads tip from cart store
// Usage: const { tip, setTip } = useCartTip()
const TIP_KEY = 'isla_tip'
export function useCartTip() {
  const [tip, setTipState] = useState(() => {
    try { return Number(sessionStorage.getItem(TIP_KEY) || 0) } catch { return 0 }
  })
  const setTip = (val) => {
    const n = Number(val) || 0
    setTipState(n)
    try { sessionStorage.setItem(TIP_KEY, String(n)) } catch {}
  }
  return { tip, setTip }
}

export function BasketTipLine({ tip }) {
  if (!tip) return null
  return (
    <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:C.muted, marginBottom:5 }}>
      <span>Driver tip ❤️</span>
      <span>€{Number(tip).toFixed(2)}</span>
    </div>
  )
}

// ── FEATURE 5: Guest checkout ─────────────────────────────────
export function GuestCheckoutModal({ onClose, onContinue }) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  const proceed = async () => {
    if (!email.trim() || !email.includes('@')) { toast.error('Enter a valid email address'); return }
    if (!name.trim()) { toast.error('Enter your name'); return }
    setSaving(true)
    // Store guest details in sessionStorage for order creation
    try {
      sessionStorage.setItem('isla_guest', JSON.stringify({ email: email.trim(), name: name.trim() }))
    } catch {}
    toast.success('Continuing as guest')
    setSaving(false)
    onContinue({ email: email.trim(), name: name.trim() })
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:600, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'flex-end' }} onClick={onClose}>
      <div style={{ width:'100%', maxWidth:480, margin:'0 auto', background:'#0D3545', borderRadius:'24px 24px 0 0', padding:'24px 20px 48px' }} onClick={e=>e.stopPropagation()}>
        <div style={{ width:36, height:4, background:'rgba(255,255,255,0.2)', borderRadius:2, margin:'0 auto 20px' }}/>
        <div style={{ fontFamily:F.serif, fontSize:24, color:'white', marginBottom:6 }}>Continue as guest</div>
        <div style={{ fontSize:13, color:C.muted, marginBottom:22, lineHeight:1.6 }}>No account needed. Enter your details to receive your order confirmation.</div>
        {[['Your name','Alex Smith',name,setName,'text'],['Email address','hello@example.com',email,setEmail,'email']].map(([label,ph,val,setter,type])=>(
          <div key={label} style={{ marginBottom:14 }}>
            <div style={{ fontSize:12, color:C.muted, marginBottom:8 }}>{label}</div>
            <input type={type} value={val} onChange={e=>setter(e.target.value)} placeholder={ph}
              style={{ width:'100%', padding:'13px 16px', background:'rgba(255,255,255,0.08)', border:'0.5px solid rgba(255,255,255,0.2)', borderRadius:12, color:'white', fontSize:14, fontFamily:F.sans, outline:'none', boxSizing:'border-box' }}/>
          </div>
        ))}
        <button onClick={proceed} disabled={saving}
          style={{ width:'100%', padding:'16px', background:'#C4683A', border:'none', borderRadius:14, color:'white', fontSize:15, fontWeight:600, cursor:'pointer', fontFamily:F.sans, marginTop:4, marginBottom:12 }}>
          {saving ? 'One moment...' : 'Continue to checkout →'}
        </button>
        <div style={{ textAlign:'center', fontSize:12, color:C.muted }}>
          Already have an account? <button onClick={onClose} style={{ background:'none', border:'none', color:'#E8A070', cursor:'pointer', fontFamily:F.sans, fontSize:12 }}>Sign in instead</button>
        </div>
      </div>
    </div>
  )
}

// ── FEATURE 6: Stock quantity on product card ─────────────────
export function StockBadge({ product, style={} }) {
  const qty = product?.stock_quantity
  if (qty == null) return null
  if (qty === 0) return (
    <div style={{ position:'absolute', bottom:6, left:6, background:'rgba(60,60,60,0.9)', color:'rgba(255,255,255,0.6)', fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:6, fontFamily:F.sans, ...style }}>
      Out of stock
    </div>
  )
  if (qty <= 5) return (
    <div style={{ position:'absolute', bottom:6, left:6, background:'rgba(200,50,50,0.85)', color:'white', fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:6, fontFamily:F.sans, ...style }}>
      Only {qty} left
    </div>
  )
  return null
}

// ── FEATURE 7: Out-of-stock greyed state ──────────────────────
// Use this wrapper on any product card — dims it when OOS
export function OutOfStockOverlay({ product, children }) {
  const oos = product?.stock_quantity === 0
  return (
    <div style={{ position:'relative', opacity: oos ? 0.55 : 1 }}>
      {children}
      {oos && (
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
          <div style={{ background:'rgba(13,30,40,0.7)', borderRadius:8, padding:'4px 12px', fontSize:11, color:'rgba(255,255,255,0.7)', fontWeight:600, fontFamily:F.sans }}>
            Out of stock
          </div>
        </div>
      )}
    </div>
  )
}

// ── FEATURE 8: Onboarding carousel ───────────────────────────
const OB_KEY = 'isla_onboarded'
export function useOnboarding() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    try {
      if (!localStorage.getItem(OB_KEY)) setShow(true)
    } catch {}
  }, [])
  const finish = () => {
    try { localStorage.setItem(OB_KEY, '1') } catch {}
    setShow(false)
  }
  return { show, finish }
}

export function OnboardingCarousel({ onDone }) {
  const [slide, setSlide] = useState(0)

  const SLIDES = [
    {
      emoji: '🌴',
      title: 'Welcome to Isla Drop',
      body: '24/7 delivery across all of Ibiza. Drinks, snacks, ice, tobacco — everything you need delivered to your villa, hotel, beach or boat.',
      cta: 'Next',
      bg: 'linear-gradient(170deg,#0A2A38,#0D3545)',
    },
    {
      emoji: '🛵',
      title: 'Delivered in under 30 min',
      body: 'Our local riders know every road, marina and beach club in Ibiza. Track your order live, right down to the minute.',
      cta: 'Next',
      bg: 'linear-gradient(170deg,#1A3020,#0D3545)',
    },
    {
      emoji: '🎯',
      title: 'More than just delivery',
      body: 'Design your night with AI, book VIP tables and yacht charters in our Concierge, or tell Isla what you need and she will find it.',
      cta: "Let's go 🌴",
      bg: 'linear-gradient(170deg,#2A1A08,#0D3545)',
    },
  ]

  const s = SLIDES[slide]
  const isLast = slide === SLIDES.length - 1

  return (
    <div style={{ position:'fixed', inset:0, zIndex:800, background:s.bg, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'32px 28px 60px', transition:'background 0.5s' }}>
      {/* Skip */}
      <button onClick={onDone} style={{ position:'absolute', top:24, right:24, background:'rgba(255,255,255,0.1)', border:'none', borderRadius:20, padding:'6px 14px', color:'rgba(255,255,255,0.5)', fontSize:12, cursor:'pointer', fontFamily:F.sans }}>
        Skip
      </button>

      {/* Content */}
      <div style={{ textAlign:'center', flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
        <div style={{ fontSize:80, marginBottom:28, animation:'bounce 1s ease infinite alternate' }}>{s.emoji}</div>
        <div style={{ fontFamily:F.serif, fontSize:30, color:'white', marginBottom:16, lineHeight:1.2 }}>{s.title}</div>
        <div style={{ fontSize:16, color:'rgba(255,255,255,0.6)', lineHeight:1.7, maxWidth:320 }}>{s.body}</div>
      </div>

      {/* Dots */}
      <div style={{ display:'flex', gap:8, marginBottom:28 }}>
        {SLIDES.map((_, i) => (
          <div key={i} onClick={()=>setSlide(i)}
            style={{ width:i===slide?24:8, height:8, borderRadius:99, background:i===slide?'#C4683A':'rgba(255,255,255,0.25)', cursor:'pointer', transition:'all 0.3s' }}/>
        ))}
      </div>

      {/* CTA */}
      <button onClick={()=>{ if(isLast) onDone(); else setSlide(s=>s+1) }}
        style={{ width:'100%', maxWidth:340, padding:'18px', background:'#C4683A', border:'none', borderRadius:16, color:'white', fontSize:17, fontWeight:600, cursor:'pointer', fontFamily:F.sans, boxShadow:'0 8px 32px rgba(196,104,58,0.5)' }}>
        {s.cta}
      </button>

      <style>{`@keyframes bounce{from{transform:translateY(0)}to{transform:translateY(-12px)}} @keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

// ── FEATURE 9: Scroll-to-top button ──────────────────────────
export function ScrollToTop({ scrollRef }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = scrollRef?.current || window
    const check = () => {
      const scrollY = scrollRef?.current ? scrollRef.current.scrollTop : window.scrollY
      setVisible(scrollY > 400)
    }
    el.addEventListener('scroll', check, { passive:true })
    return () => el.removeEventListener('scroll', check)
  }, [scrollRef])

  const scrollTop = () => {
    const el = scrollRef?.current
    if (el) el.scrollTo({ top:0, behavior:'smooth' })
    else window.scrollTo({ top:0, behavior:'smooth' })
  }

  if (!visible) return null
  return (
    <button onClick={scrollTop}
      style={{ position:'fixed', bottom:88, right:16, width:44, height:44, borderRadius:'50%', background:'rgba(13,59,74,0.95)', backdropFilter:'blur(10px)', border:'0.5px solid rgba(255,255,255,0.2)', color:'white', fontSize:18, cursor:'pointer', zIndex:150, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 20px rgba(0,0,0,0.3)', animation:'slideUp 0.2s ease' }}>
      ↑
    </button>
  )
}

// ── FEATURE 10: Free delivery threshold in basket ─────────────
export function FreeDeliveryBar({ subtotal }) {
  const FREE_AT = 200 // €200 = free delivery
  const progress = Math.min(100, (subtotal / FREE_AT) * 100)
  const needed = (FREE_AT - subtotal).toFixed(2)
  const pct = Math.round(progress)

  if (subtotal >= FREE_AT) return (
    <div style={{ background:'linear-gradient(135deg,rgba(126,232,162,0.18),rgba(43,122,139,0.15))', border:'0.5px solid rgba(126,232,162,0.4)', borderRadius:14, padding:'14px 16px', marginBottom:14 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
        <span style={{ fontSize:22 }}>🎉</span>
        <div>
          <div style={{ fontSize:14, fontWeight:700, color:'#7EE8A2', fontFamily:'DM Sans,sans-serif' }}>Free delivery unlocked!</div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', marginTop:2 }}>No delivery fee on this order</div>
        </div>
        <div style={{ marginLeft:'auto', fontSize:13, fontWeight:700, color:'#7EE8A2', textDecoration:'line-through', opacity:0.6 }}>€3.50</div>
      </div>
      <div style={{ height:8, background:'rgba(255,255,255,0.1)', borderRadius:99, overflow:'hidden' }}>
        <div style={{ height:'100%', width:'100%', background:'linear-gradient(90deg,#7EE8A2,#C8A84B)', borderRadius:99 }}/>
      </div>
    </div>
  )

  return (
    <div style={{ background:'rgba(255,255,255,0.05)', border:'0.5px solid rgba(255,255,255,0.12)', borderRadius:14, padding:'14px 16px', marginBottom:14 }}>
      {/* Header row */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
        <span style={{ fontSize:20 }}>🚚</span>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:13, fontWeight:600, color:'white', fontFamily:'DM Sans,sans-serif' }}>
            Add <span style={{ color:'#E8A070' }}>€{needed}</span> more for free delivery
          </div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginTop:2 }}>
            Free delivery on orders over €{FREE_AT}
          </div>
        </div>
        <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.4)', background:'rgba(255,255,255,0.08)', padding:'3px 10px', borderRadius:99 }}>
          {pct}%
        </div>
      </div>

      {/* Progress track */}
      <div style={{ position:'relative' }}>
        <div style={{ height:10, background:'rgba(255,255,255,0.08)', borderRadius:99, overflow:'hidden' }}>
          <div style={{
            height:'100%',
            width:progress+'%',
            background:'linear-gradient(90deg,#C4683A,#C8A84B)',
            borderRadius:99,
            transition:'width 0.5s cubic-bezier(0.4,0,0.2,1)',
            position:'relative',
          }}>
            {/* Shimmer sweep */}
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.25) 50%,transparent 100%)', animation:'sweep 2s ease-in-out infinite' }}/>
          </div>
        </div>
        {/* Milestone marker at €200 */}
        <div style={{ position:'absolute', right:0, top:-4, fontSize:12 }}>🎁</div>
      </div>

      {/* Labels */}
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:8, fontSize:10, color:'rgba(255,255,255,0.3)', fontFamily:'DM Sans,sans-serif' }}>
        <span>€0</span>
        <span>€50</span>
        <span>€100</span>
        <span>€150</span>
        <span style={{ color: subtotal >= FREE_AT ? '#7EE8A2' : 'rgba(255,255,255,0.3)' }}>€200 🎁</span>
      </div>

      <style>{'@keyframes sweep{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}'}</style>
    </div>
  )
}

// ── FEATURE 11: Earn stamps line in basket ────────────────────
export function EarnStampsLine({ orderCount }) {
  // Show how many stamps they have and that this order earns one more
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 12px', background:'rgba(200,168,75,0.08)', border:'0.5px solid rgba(200,168,75,0.2)', borderRadius:10, marginBottom:10, fontSize:12 }}>
      <span style={{ fontSize:16 }}>🌴</span>
      <span style={{ color:'rgba(255,255,255,0.7)', fontFamily:F.sans }}>
        You will earn <strong style={{ color:'#C8A84B' }}>1 stamp</strong> on this order
      </span>
    </div>
  )
}

// ── FEATURE 12: Delete account (GDPR) ────────────────────────
export function DeleteAccountSheet({ onClose }) {
  const { user, clear } = useAuthStore()
  const { clearCart } = useCartStore()
  const [step, setStep] = useState('confirm')
  const [confirm, setConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)

  const doDelete = async () => {
    if (confirm.toLowerCase() !== 'delete') { toast.error('Type DELETE to confirm'); return }
    setDeleting(true)
    try {
      const { supabase } = await import('../../lib/supabase')
      // Anonymise — GDPR right to erasure
      await supabase.from('profiles').update({
        full_name: 'Deleted User',
        phone: null,
        avatar_url: null,
        deleted_at: new Date().toISOString(),
      }).eq('id', user.id)
      await supabase.auth.signOut()
      clear()
      clearCart()
      toast.success('Account deleted. Sorry to see you go.')
      onClose()
    } catch (err) {
      toast.error('Could not delete account. Please email support@isladrop.net')
    }
    setDeleting(false)
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:600, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'flex-end' }} onClick={onClose}>
      <div style={{ width:'100%', maxWidth:480, margin:'0 auto', background:'#0D3545', borderRadius:'24px 24px 0 0', padding:'24px 20px 48px' }} onClick={e=>e.stopPropagation()}>
        <div style={{ width:36, height:4, background:'rgba(255,255,255,0.2)', borderRadius:2, margin:'0 auto 20px' }}/>
        <div style={{ fontSize:40, textAlign:'center', marginBottom:12 }}>⚠️</div>
        <div style={{ fontFamily:F.serif, fontSize:22, color:'white', textAlign:'center', marginBottom:8 }}>Delete account</div>
        <div style={{ fontSize:13, color:C.muted, textAlign:'center', lineHeight:1.65, marginBottom:20 }}>
          This will permanently delete your account and anonymise your data under GDPR. Your order history will be retained in anonymised form. This cannot be undone.
        </div>
        <div style={{ background:'rgba(240,149,149,0.1)', border:'0.5px solid rgba(240,149,149,0.3)', borderRadius:12, padding:'14px', marginBottom:18, fontSize:12, color:'#F09595', lineHeight:1.6 }}>
          You will lose: saved addresses, loyalty stamps, referral credits, order history and your account preferences.
        </div>
        <div style={{ fontSize:12, color:C.muted, marginBottom:8 }}>Type <strong style={{ color:'white' }}>DELETE</strong> to confirm</div>
        <input value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Type DELETE"
          style={{ width:'100%', padding:'13px 16px', background:'rgba(255,255,255,0.08)', border:'0.5px solid rgba(255,255,255,0.2)', borderRadius:12, color:'white', fontSize:14, fontFamily:F.sans, outline:'none', boxSizing:'border-box', marginBottom:14, textTransform:'uppercase', letterSpacing:2 }}/>
        <button onClick={doDelete} disabled={deleting || confirm.toLowerCase()!=='delete'}
          style={{ width:'100%', padding:'15px', background:confirm.toLowerCase()==='delete'?'rgba(200,50,50,0.8)':'rgba(255,255,255,0.08)', border:'none', borderRadius:14, color:'white', fontSize:15, fontWeight:600, cursor:confirm.toLowerCase()==='delete'?'pointer':'default', fontFamily:F.sans, marginBottom:10 }}>
          {deleting ? 'Deleting...' : 'Permanently delete account'}
        </button>
        <button onClick={onClose} style={{ width:'100%', padding:'13px', background:'transparent', border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:12, color:C.muted, fontSize:14, cursor:'pointer', fontFamily:F.sans }}>
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── FEATURE 13: Change email / change password ────────────────
export function ChangeCredentialsSheet({ mode, onClose }) {
  const [value, setValue] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)

  const isEmail = mode === 'email'
  const title = isEmail ? 'Change email' : 'Change password'

  const save = async () => {
    if (!value.trim()) { toast.error(isEmail ? 'Enter new email' : 'Enter new password'); return }
    if (!isEmail && value !== confirm) { toast.error('Passwords do not match'); return }
    if (!isEmail && value.length < 8) { toast.error('Password must be at least 8 characters'); return }
    if (isEmail && !value.includes('@')) { toast.error('Enter a valid email address'); return }
    setSaving(true)
    try {
      const { supabase } = await import('../../lib/supabase')
      const update = isEmail ? { email: value.trim() } : { password: value }
      const { error } = await supabase.auth.updateUser(update)
      if (error) throw error
      toast.success(isEmail ? 'Verification email sent — check your inbox' : 'Password updated successfully')
      onClose()
    } catch (err) {
      toast.error(err.message || 'Update failed')
    }
    setSaving(false)
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:600, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'flex-end' }} onClick={onClose}>
      <div style={{ width:'100%', maxWidth:480, margin:'0 auto', background:'#0D3545', borderRadius:'24px 24px 0 0', padding:'24px 20px 48px' }} onClick={e=>e.stopPropagation()}>
        <div style={{ width:36, height:4, background:'rgba(255,255,255,0.2)', borderRadius:2, margin:'0 auto 20px' }}/>
        <div style={{ fontFamily:F.serif, fontSize:22, color:'white', marginBottom:6 }}>{title}</div>
        <div style={{ fontSize:13, color:C.muted, marginBottom:20 }}>
          {isEmail ? 'A verification link will be sent to your new email address.' : 'Choose a strong password of at least 8 characters.'}
        </div>
        <div style={{ fontSize:12, color:C.muted, marginBottom:8 }}>
          {isEmail ? 'New email address' : 'New password'}
        </div>
        <input type={isEmail ? 'email' : 'password'} value={value} onChange={e=>setValue(e.target.value)}
          placeholder={isEmail ? 'new@example.com' : 'At least 8 characters'}
          style={{ width:'100%', padding:'13px 16px', background:'rgba(255,255,255,0.08)', border:'0.5px solid rgba(255,255,255,0.2)', borderRadius:12, color:'white', fontSize:14, fontFamily:F.sans, outline:'none', boxSizing:'border-box', marginBottom:14 }}/>
        {!isEmail && (
          <>
            <div style={{ fontSize:12, color:C.muted, marginBottom:8 }}>Confirm new password</div>
            <input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Repeat password"
              style={{ width:'100%', padding:'13px 16px', background:'rgba(255,255,255,0.08)', border:'0.5px solid rgba(255,255,255,0.2)', borderRadius:12, color:'white', fontSize:14, fontFamily:F.sans, outline:'none', boxSizing:'border-box', marginBottom:14 }}/>
          </>
        )}
        <button onClick={save} disabled={saving}
          style={{ width:'100%', padding:'15px', background:'#C4683A', border:'none', borderRadius:14, color:'white', fontSize:15, fontWeight:600, cursor:'pointer', fontFamily:F.sans, marginBottom:10 }}>
          {saving ? 'Saving...' : 'Save changes'}
        </button>
        <button onClick={onClose} style={{ width:'100%', padding:'13px', background:'transparent', border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:12, color:C.muted, fontSize:14, cursor:'pointer', fontFamily:F.sans }}>
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── FEATURE 14: Share product with branded card ───────────────
export function shareProduct(product) {
  const url = window.location.origin + '?ref=share&p=' + product.id
  const text = product.emoji + ' ' + product.name + ' — available now on Isla Drop, 24/7 delivery in Ibiza 🌴'
  if (navigator.share) {
    navigator.share({ title:'Isla Drop — ' + product.name, text, url }).catch(() => {})
  } else {
    navigator.clipboard.writeText(text + '\n' + url)
    toast.success('Product link copied to clipboard!')
  }
}

// ── FEATURE 15: Hotel room delivery address type ──────────────
export function HotelDeliverySheet({ onClose, onConfirm }) {
  const [hotel, setHotel] = useState('')
  const [room, setRoom] = useState('')
  const [floor, setFloor] = useState('')

  const HOTELS = [
    'Hard Rock Hotel Ibiza', 'Nobu Hotel Ibiza Bay', 'Gran Hotel Montesol',
    'Ushuaia Tower Hotel', 'The Unexpected Hotel', 'Aguas de Ibiza',
    'ME Ibiza', 'Bless Hotel Ibiza', '7Pines Resort Ibiza',
    'Destino Pacha Resort', 'Ibiza Gran Hotel', 'Hotel Hacienda',
    'Casa de la Tierra', 'Atzaro Agroturismo', 'Cubanito Ibiza',
    'Other hotel',
  ]

  const confirm = () => {
    if (!hotel) { toast.error('Select your hotel'); return }
    if (!room.trim()) { toast.error('Enter your room number'); return }
    const address = hotel + ', Room ' + room + (floor ? ', Floor ' + floor : '')
    onConfirm({ address, notes:'Hotel delivery — ' + hotel + ' Room ' + room + (floor?' Floor '+floor:'') })
    toast.success('Hotel room delivery set')
    onClose()
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:600, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'flex-end' }} onClick={onClose}>
      <div style={{ width:'100%', maxWidth:480, margin:'0 auto', background:'#0D3545', borderRadius:'24px 24px 0 0', maxHeight:'80vh', overflowY:'auto', padding:'24px 20px 48px' }} onClick={e=>e.stopPropagation()}>
        <div style={{ width:36, height:4, background:'rgba(255,255,255,0.2)', borderRadius:2, margin:'0 auto 20px' }}/>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
          <span style={{ fontSize:32 }}>🏨</span>
          <div>
            <div style={{ fontFamily:F.serif, fontSize:22, color:'white' }}>Hotel room delivery</div>
            <div style={{ fontSize:12, color:C.muted }}>We deliver directly to your room</div>
          </div>
        </div>

        <div style={{ fontSize:12, color:C.muted, marginBottom:8 }}>Your hotel *</div>
        <select value={hotel} onChange={e=>setHotel(e.target.value)}
          style={{ width:'100%', padding:'13px 14px', background:'rgba(255,255,255,0.08)', border:'0.5px solid rgba(255,255,255,0.2)', borderRadius:12, color:'white', fontSize:14, fontFamily:F.sans, outline:'none', marginBottom:14 }}>
          <option value="">Select your hotel...</option>
          {HOTELS.map(h=><option key={h} value={h}>{h}</option>)}
        </select>

        {[['Room number *','e.g. 412',room,setRoom],['Floor (optional)','e.g. 4',floor,setFloor]].map(([label,ph,val,setter])=>(
          <div key={label}>
            <div style={{ fontSize:12, color:C.muted, marginBottom:8 }}>{label}</div>
            <input value={val} onChange={e=>setter(e.target.value)} placeholder={ph}
              style={{ width:'100%', padding:'13px 16px', background:'rgba(255,255,255,0.08)', border:'0.5px solid rgba(255,255,255,0.2)', borderRadius:12, color:'white', fontSize:14, fontFamily:F.sans, outline:'none', boxSizing:'border-box', marginBottom:14 }}/>
          </div>
        ))}

        <div style={{ background:'rgba(43,122,139,0.15)', border:'0.5px solid rgba(43,122,139,0.3)', borderRadius:12, padding:'12px 14px', marginBottom:20, fontSize:12, color:'rgba(255,255,255,0.65)', lineHeight:1.6 }}>
          🏨 Our rider will come to the hotel reception and ask for your room. Please be available to collect or leave a note for reception.
        </div>

        <button onClick={confirm}
          style={{ width:'100%', padding:'16px', background:'#C4683A', border:'none', borderRadius:14, color:'white', fontSize:15, fontWeight:600, cursor:'pointer', fontFamily:F.sans }}>
          Confirm hotel delivery 🏨
        </button>
      </div>
    </div>
  )
}

// ── FEATURE 16: Birthday field ────────────────────────────────
export function BirthdayField({ value, onChange }) {
  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ fontSize:12, color:C.muted, marginBottom:8, textTransform:'uppercase', letterSpacing:'0.5px', fontFamily:F.sans }}>Birthday 🎂 (optional)</div>
      <input type="date" value={value||''} onChange={e=>onChange(e.target.value)}
        style={{ width:'100%', padding:'14px 16px', background:'rgba(255,255,255,0.08)', border:'0.5px solid rgba(255,255,255,0.2)', borderRadius:12, color:'white', fontSize:15, fontFamily:F.sans, outline:'none', boxSizing:'border-box', colorScheme:'dark' }}/>
      <div style={{ fontSize:11, color:C.muted, marginTop:6 }}>We will send you a birthday reward every year 🌴</div>
    </div>
  )
}

// Save birthday to Supabase profile
export async function saveBirthday(userId, birthday) {
  if (!userId || !birthday) return
  try {
    const { supabase } = await import('../../lib/supabase')
    await supabase.from('profiles').update({ birthday }).eq('id', userId)
    toast.success('Birthday saved! Expect a gift 🎁')
  } catch { toast.error('Could not save birthday') }
}

// ── Beach Delivery Sheet ──────────────────────────────────────
const IBIZA_BEACHES = [
  { name:'Playa de Salinas', emoji:'🏖️', lat:38.8710, lng:1.3960, note:'Near Beso Beach · car park on the right' },
  { name:'Playa den Bossa', emoji:'🏄', lat:38.8820, lng:1.4050, note:'Ushuaia end · main beach access' },
  { name:'Cala Bassa', emoji:'🌊', lat:38.9600, lng:1.2350, note:'Beach bar pickup point' },
  { name:'Cala Conta', emoji:'🐠', lat:38.9560, lng:1.2200, note:'Rocky steps entrance' },
  { name:'Cala Tarida', emoji:'🌴', lat:38.9740, lng:1.2390, note:'Beach restaurant area' },
  { name:'Es Cavallet', emoji:'🌞', lat:38.8690, lng:1.3890, note:'Chiringuito end' },
  { name:'Las Salinas Beach', emoji:'🦩', lat:38.8640, lng:1.3950, note:'South end near salt flats' },
  { name:'Aguas Blancas', emoji:'🌿', lat:39.0850, lng:1.5680, note:'North coast, rocky cove' },
  { name:'Benirras', emoji:'🥁', lat:39.0650, lng:1.4030, note:'Famous drum circle beach' },
  { name:'Port des Torrent', emoji:'⛵', lat:38.9790, lng:1.2350, note:'Calm bay, families' },
  { name:'Cala Llonga', emoji:'🏝️', lat:38.9170, lng:1.5340, note:'Small sheltered cove' },
  { name:'Blue Marlin Beach', emoji:'🍹', lat:38.8720, lng:1.3580, note:'Beach club, main gate' },
]

export function BeachDeliverySheet({ onClose, onSet }) {
  const { addItem } = useCartStore()
  const [tab, setTab] = useState('select') // select | ai
  const [selected, setSelected] = useState(null)
  const [searching, setSearching] = useState(false)
  // AI state
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState(null)
  const [aiError, setAiError] = useState('')

  const QUICK_PROMPTS = [
    'Sunny beach day for 4, need cold drinks and snacks',
    'Long afternoon session at the beach, keeping cool',
    'Romantic sunset picnic for 2',
    'Group of 8 at Salinas, big afternoon session',
    'Kids and family beach day, soft drinks and snacks',
    'Pre-club warm up at the beach for 6',
  ]

  const useGPS = () => {
    setSearching(true)
    navigator.geolocation?.getCurrentPosition(pos => {
      const { latitude:lat, longitude:lng } = pos.coords
      let nearest = null, nearestDist = Infinity
      IBIZA_BEACHES.forEach(b => {
        const d = Math.sqrt(Math.pow(b.lat-lat,2)+Math.pow(b.lng-lng,2))
        if (d < nearestDist) { nearestDist = d; nearest = b }
      })
      if (nearest && nearestDist < 0.05) {
        setSelected(nearest)
        setTab('select')
      } else {
        onSet({ lat, lng, address:'Beach location ('+lat.toFixed(4)+', '+lng.toFixed(4)+')' })
      }
      setSearching(false)
    }, () => { toast.error('Could not get location — select a beach below'); setSearching(false) })
  }

  const runAI = async (prompt) => {
    const p = prompt || aiPrompt
    if (!p.trim()) return
    setAiLoading(true); setAiResult(null); setAiError('')
    try {
      const { PRODUCTS } = await import('../../lib/products')
      const productList = PRODUCTS.slice(0,60).map(p=>p.id+'|'+p.name+'|EUR'+p.price+'|'+p.category).join(', ')
      const beachCtx = selected ? 'Delivering to '+selected.name+' beach in Ibiza. ' : 'Delivering to an Ibiza beach. '
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'anthropic-version':'2023-06-01', 'anthropic-dangerous-direct-browser-access':'true', 'x-api-key':import.meta.env.VITE_ANTHROPIC_API_KEY||'' },
        body: JSON.stringify({
          model:'claude-haiku-4-5-20251001', max_tokens:600,
          system:'You are Isla, an expert Ibiza beach concierge. Build the perfect beach day drinks and snacks order. Consider the heat, the occasion and the group. Respond ONLY with valid JSON: {"title":"string","vibe":"string","items":[{"product_id":"string","quantity":number,"reason":"string"}],"total_estimate":"string","beach_tip":"string"}',
          messages:[{role:'user',content:beachCtx+'Beach order for: '+p+'. Available products: '+productList+'. Pick 5-10 items. Only use product IDs from the list above.'}]
        })
      })
      const data = await resp.json()
      const raw = data.content?.[0]?.text || ''
      const result = JSON.parse(raw.replace(/```json|```/g,'').trim())
      setAiResult(result)
    } catch {
      setAiError('Could not generate right now — try again or pick items manually')
    }
    setAiLoading(false)
  }

  const addAiOrder = async () => {
    if (!aiResult?.items) return
    const { PRODUCTS } = await import('../../lib/products')
    const { useCartStore: cart } = await import('../../lib/store')
    const { addItem: add } = cart.getState()
    let count = 0
    aiResult.items.forEach(item => {
      const p = PRODUCTS.find(p=>p.id===item.product_id)
      if (p) for (let i=0;i<(item.quantity||1);i++) { add(p); count++ }
    })
    toast.success(count+' beach items added to basket! 🏖️', { duration:2000 })
    if (selected) onSet({ lat:selected.lat, lng:selected.lng, address:selected.name+', Ibiza 🏖️' })
    else onClose()
  }

  const confirm = () => {
    if (!selected) return
    onSet({ lat:selected.lat, lng:selected.lng, address:selected.name+', Ibiza 🏖️' })
  }

  return (
    <div style={{ position:'fixed',inset:0,zIndex:600,background:'rgba(0,0,0,0.75)',display:'flex',alignItems:'flex-end' }} onClick={onClose}>
      <div style={{ width:'100%',maxWidth:480,margin:'0 auto',background:'#0D3545',borderRadius:'24px 24px 0 0',maxHeight:'92vh',display:'flex',flexDirection:'column' }} onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding:'16px 20px 12px',borderBottom:'0.5px solid rgba(255,255,255,0.08)',flexShrink:0 }}>
          <div style={{ width:36,height:4,background:'rgba(255,255,255,0.2)',borderRadius:2,margin:'0 auto 14px' }}/>
        <button onClick={onClose}
          style={{ display:'flex',alignItems:'center',gap:6,background:'rgba(255,255,255,0.08)',border:'0.5px solid rgba(255,255,255,0.15)',borderRadius:20,padding:'6px 14px 6px 10px',cursor:'pointer',marginBottom:10,width:'fit-content' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          <span style={{ fontSize:12,color:'white',fontFamily:'DM Sans,sans-serif',fontWeight:500 }}>Back</span>
        </button>
          <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:14 }}>
            <span style={{ fontSize:28 }}>🏖️</span>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:'DM Serif Display,serif',fontSize:20,color:'white' }}>Beach delivery</div>
              <div style={{ fontSize:12,color:'rgba(255,255,255,0.45)' }}>
                {selected ? 'Delivering to: '+selected.name : 'Select your beach or ask Isla AI'}
              </div>
            </div>
            <button onClick={onClose} style={{ background:'none',border:'none',color:'rgba(255,255,255,0.4)',cursor:'pointer',fontSize:22,padding:0 }}>✕</button>
          </div>

          {/* Tabs */}
          <div style={{ display:'flex',gap:0,background:'rgba(255,255,255,0.05)',borderRadius:12,padding:3 }}>
            {[{id:'select',label:'🗺️ Pick beach'},{id:'ai',label:'✨ AI order builder'}].map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)}
                style={{ flex:1,padding:'9px',border:'none',borderRadius:10,cursor:'pointer',fontSize:12,fontFamily:'DM Sans,sans-serif',fontWeight:tab===t.id?600:400,background:tab===t.id?'#C4683A':'transparent',color:'white',transition:'all 0.15s' }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Beach selection tab */}
        {tab==='select' && (
          <>
            <div style={{ padding:'10px 20px 4px',flexShrink:0 }}>
              <button onClick={useGPS} disabled={searching}
                style={{ width:'100%',padding:'10px',background:'rgba(196,104,58,0.2)',border:'0.5px solid rgba(196,104,58,0.4)',borderRadius:12,color:'#E8A070',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'DM Sans,sans-serif',display:'flex',alignItems:'center',justifyContent:'center',gap:8 }}>
                {searching ? '📍 Finding your beach...' : '📍 Use my current location'}
              </button>
            </div>
            <div style={{ overflowY:'auto',flex:1,padding:'8px 20px' }}>
              {IBIZA_BEACHES.map(beach=>(
                <button key={beach.name} onClick={()=>setSelected(beach)}
                  style={{ width:'100%',display:'flex',alignItems:'center',gap:12,padding:'12px 14px',background:selected?.name===beach.name?'rgba(196,104,58,0.2)':'rgba(255,255,255,0.04)',border:'0.5px solid '+(selected?.name===beach.name?'rgba(196,104,58,0.5)':'rgba(255,255,255,0.08)'),borderRadius:12,cursor:'pointer',marginBottom:8,textAlign:'left',transition:'all 0.15s' }}>
                  <span style={{ fontSize:24,flexShrink:0 }}>{beach.emoji}</span>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontSize:13,fontWeight:600,color:'white',fontFamily:'DM Sans,sans-serif' }}>{beach.name}</div>
                    <div style={{ fontSize:11,color:'rgba(255,255,255,0.4)',marginTop:2 }}>{beach.note}</div>
                  </div>
                  {selected?.name===beach.name && <span style={{ color:'#C4683A',fontSize:18,flexShrink:0 }}>✓</span>}
                </button>
              ))}
            </div>
            <div style={{ padding:'12px 20px 32px',borderTop:'0.5px solid rgba(255,255,255,0.08)',flexShrink:0 }}>
              <button onClick={confirm} disabled={!selected}
                style={{ width:'100%',padding:'15px',background:selected?'#C4683A':'rgba(255,255,255,0.1)',border:'none',borderRadius:14,color:'white',fontSize:15,fontWeight:600,cursor:selected?'pointer':'default',fontFamily:'DM Sans,sans-serif' }}>
                {selected ? 'Deliver to '+selected.name+' →' : 'Select a beach above'}
              </button>
            </div>
          </>
        )}

        {/* AI builder tab */}
        {tab==='ai' && (
          <div style={{ overflowY:'auto',flex:1,padding:'16px 20px 32px' }}>
            {/* Beach context */}
            {selected && (
              <div style={{ background:'rgba(43,122,139,0.15)',border:'0.5px solid rgba(43,122,139,0.3)',borderRadius:12,padding:'10px 14px',marginBottom:14,fontSize:12,color:'rgba(255,255,255,0.7)',display:'flex',alignItems:'center',gap:8 }}>
                <span>{selected.emoji}</span>
                <span>Building order for <strong style={{ color:'white' }}>{selected.name}</strong> — {selected.note}</span>
              </div>
            )}
            {!selected && (
              <div style={{ background:'rgba(196,104,58,0.1)',border:'0.5px solid rgba(196,104,58,0.25)',borderRadius:12,padding:'10px 14px',marginBottom:14,fontSize:12,color:'rgba(255,255,255,0.6)',display:'flex',alignItems:'center',gap:8 }}>
                <span>💡</span><span>Select a beach first to set your delivery location, or Isla will build the order and you can set the address in checkout.</span>
              </div>
            )}

            {/* AI intro card */}
            {!aiResult && !aiLoading && (
              <div style={{ background:'linear-gradient(135deg,rgba(196,104,58,0.12),rgba(43,122,139,0.12))',border:'0.5px solid rgba(196,104,58,0.25)',borderRadius:14,padding:'14px 16px',marginBottom:16 }}>
                <div style={{ fontFamily:'DM Serif Display,serif',fontSize:17,color:'white',marginBottom:4 }}>✨ Isla AI Beach Planner</div>
                <div style={{ fontSize:12,color:'rgba(255,255,255,0.55)',lineHeight:1.6 }}>Tell Isla about your beach day — who you are, how many people, what vibe. She will pick the perfect drinks, snacks and essentials.</div>
              </div>
            )}

            {/* Quick prompts */}
            {!aiResult && !aiLoading && (
              <>
                <div style={{ display:'flex',flexWrap:'wrap',gap:7,marginBottom:14 }}>
                  {QUICK_PROMPTS.map(p=>(
                    <button key={p} onClick={()=>runAI(p)}
                      style={{ padding:'7px 13px',background:'rgba(255,255,255,0.07)',border:'0.5px solid rgba(255,255,255,0.13)',borderRadius:20,fontSize:11,color:'rgba(255,255,255,0.75)',cursor:'pointer',fontFamily:'DM Sans,sans-serif',textAlign:'left' }}>
                      {p}
                    </button>
                  ))}
                </div>
                <div style={{ display:'flex',gap:8,marginBottom:aiError?10:0 }}>
                  <input value={aiPrompt} onChange={e=>setAiPrompt(e.target.value)}
                    onKeyDown={e=>e.key==='Enter'&&runAI()}
                    placeholder='Describe your beach day...'
                    style={{ flex:1,padding:'12px 14px',background:'rgba(255,255,255,0.08)',border:'0.5px solid rgba(255,255,255,0.15)',borderRadius:24,color:'white',fontSize:13,fontFamily:'DM Sans,sans-serif',outline:'none' }}/>
                  <button onClick={()=>runAI()} disabled={!aiPrompt.trim()}
                    style={{ width:44,height:44,background:aiPrompt.trim()?'#C4683A':'rgba(255,255,255,0.08)',border:'none',borderRadius:'50%',cursor:aiPrompt.trim()?'pointer':'default',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M22 2L11 13"/><path d="M22 2L15 22l-4-9-9-4 20-7z"/></svg>
                  </button>
                </div>
                {aiError && <div style={{ fontSize:12,color:'rgba(240,149,149,0.8)',padding:'8px 0' }}>{aiError}</div>}
              </>
            )}

            {/* Loading */}
            {aiLoading && (
              <div style={{ textAlign:'center',padding:'40px 0' }}>
                <div style={{ width:44,height:44,border:'3px solid rgba(255,255,255,0.1)',borderTopColor:'#C4683A',borderRadius:'50%',animation:'beachSpinAI 0.8s linear infinite',margin:'0 auto 16px' }}/>
                <div style={{ fontFamily:'DM Serif Display,serif',fontSize:18,color:'white',marginBottom:6 }}>Isla is planning your beach day...</div>
                <div style={{ fontSize:12,color:'rgba(255,255,255,0.45)' }}>Picking the perfect drinks and snacks</div>
                <style>{'@keyframes beachSpinAI{to{transform:rotate(360deg)}}'}</style>
              </div>
            )}

            {/* AI Result */}
            {aiResult && !aiLoading && (
              <>
                <div style={{ background:'rgba(255,255,255,0.04)',borderRadius:14,padding:'14px',marginBottom:14 }}>
                  <div style={{ fontFamily:'DM Serif Display,serif',fontSize:18,color:'white',marginBottom:2 }}>{aiResult.title}</div>
                  {aiResult.vibe && <div style={{ fontSize:12,color:'rgba(255,255,255,0.5)',marginBottom:12,fontStyle:'italic' }}>"{aiResult.vibe}"</div>}
                  {(aiResult.items||[]).map((item,i)=>{
                    const getProduct = () => {
                      try { return null } catch { return null }
                    }
                    return (
                      <div key={i} style={{ display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:'0.5px solid rgba(255,255,255,0.06)' }}>
                        <span style={{ fontSize:18,flexShrink:0 }}>🏖️</span>
                        <div style={{ flex:1,minWidth:0 }}>
                          <div style={{ fontSize:12,color:'white',fontFamily:'DM Sans,sans-serif' }}>{item.product_id}</div>
                          {item.reason && <div style={{ fontSize:10,color:'rgba(255,255,255,0.4)',marginTop:1 }}>{item.reason}</div>}
                        </div>
                        <div style={{ fontSize:11,color:'rgba(255,255,255,0.5)',flexShrink:0 }}>×{item.quantity||1}</div>
                      </div>
                    )
                  })}
                  {aiResult.total_estimate && (
                    <div style={{ display:'flex',justifyContent:'space-between',paddingTop:10,marginTop:4 }}>
                      <span style={{ fontSize:13,fontWeight:600,color:'white',fontFamily:'DM Sans,sans-serif' }}>Estimated total</span>
                      <span style={{ fontSize:14,fontWeight:700,color:'#E8A070' }}>{aiResult.total_estimate}</span>
                    </div>
                  )}
                  {aiResult.beach_tip && (
                    <div style={{ marginTop:12,padding:'8px 12px',background:'rgba(43,122,139,0.15)',borderRadius:8,fontSize:11,color:'rgba(126,232,200,0.8)',lineHeight:1.5 }}>
                      🌴 Isla tip: {aiResult.beach_tip}
                    </div>
                  )}
                </div>
                <div style={{ display:'flex',gap:8,marginBottom:10 }}>
                  <button onClick={addAiOrder}
                    style={{ flex:1,padding:'13px',background:'#C4683A',border:'none',borderRadius:12,color:'white',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'DM Sans,sans-serif' }}>
                    Add to basket{selected?' + set beach':''}  →
                  </button>
                </div>
                <button onClick={()=>{setAiResult(null);setAiPrompt('')}}
                  style={{ width:'100%',padding:'11px',background:'transparent',border:'0.5px solid rgba(255,255,255,0.12)',borderRadius:10,color:'rgba(255,255,255,0.5)',fontSize:12,cursor:'pointer',fontFamily:'DM Sans,sans-serif' }}>
                  Plan a different beach day
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
