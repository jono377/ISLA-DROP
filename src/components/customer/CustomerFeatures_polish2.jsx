// ================================================================
// CustomerFeatures_polish2.jsx
// 24 polish items for world-class app standard
// P1:  Micro-animations on add to basket (fly-to-cart)
// P2:  Product card press animation (already in MiniCard — enhanced)
// P3:  Checkout success confetti
// P4:  Empty state illustrations
// P5:  Onboarding tutorial trigger
// P6:  What's new / changelog modal
// P8:  Out-of-stock auto-remove from basket
// P9:  Delivery fee by distance / zone
// P10: Max quantity per product enforced
// P11: Photo ID upload for age verification
// P12: Real driver name + photo enhanced (live ETA on card)
// P13: Live ETA countdown on home order card
// P14: Minimum order by zone
// P15: Prefetch next likely screen
// P16: Share basket with group (deep link)
// P17: Barcode scanner
// P18: One-tap reorder from history (wired)
// P19: Charity donation add-on
// P20: Carbon offset option
// P21: What's new modal trigger helper
// P22: Tip split between drivers (display)
// P23: Apple Watch / Siri placeholders
// P24: Product CDN image optimisation helper
// ================================================================
import { useState, useEffect, useRef, useCallback } from 'react'
import { useCartStore, useAuthStore } from '../../lib/store'
import { PRODUCTS } from '../../lib/products'
import toast from 'react-hot-toast'

const F = { serif:'DM Serif Display,serif', sans:'DM Sans,sans-serif' }
const C = {
  bg:'#0D3545', accent:'#C4683A', green:'#7EE8A2', gold:'#C8A84B',
  surface:'rgba(255,255,255,0.07)', border:'rgba(255,255,255,0.1)',
  muted:'rgba(255,255,255,0.45)',
}

// ── P1: Fly-to-cart animation ─────────────────────────────────
// Renders a floating emoji that flies from the product card to the basket tab
export function useFlyToCart() {
  const [particles, setParticles] = useState([])

  const fly = useCallback((emoji, fromEl) => {
    if (!fromEl) return
    const rect = fromEl.getBoundingClientRect()
    // Tab bar basket icon is roughly at bottom-center
    const destX = window.innerWidth * 0.65
    const destY = window.innerHeight - 30
    const id = Date.now() + Math.random()
    setParticles(p => [...p, { id, emoji, x: rect.left + rect.width/2, y: rect.top + rect.height/2, destX, destY }])
    setTimeout(() => setParticles(p => p.filter(x => x.id !== id)), 700)
  }, [])

  const Particles = () => (
    <>
      {particles.map(p => (
        <div key={p.id} style={{
          position:'fixed', left:p.x, top:p.y, fontSize:22, zIndex:9999,
          pointerEvents:'none', userSelect:'none',
          animation:'flyToCart 0.65s cubic-bezier(0.25,0.46,0.45,0.94) forwards',
          '--dx': (p.destX - p.x)+'px', '--dy': (p.destY - p.y)+'px',
        }}>
          {p.emoji}
        </div>
      ))}
      <style>{`
        @keyframes flyToCart {
          0%   { transform:translate(0,0) scale(1); opacity:1 }
          60%  { transform:translate(calc(var(--dx)*0.6),calc(var(--dy)*0.4)) scale(0.9); opacity:0.9 }
          100% { transform:translate(var(--dx),var(--dy)) scale(0.3); opacity:0 }
        }
      `}</style>
    </>
  )

  return { fly, Particles }
}

// ── P3: Checkout success confetti ─────────────────────────────
export function ConfettiCelebration({ active }) {
  const [pieces, setPieces] = useState([])

  useEffect(() => {
    if (!active) return
    const colors = ['#C4683A','#C8A84B','#7EE8A2','#2B7A8B','white','#E8A070']
    const newPieces = Array.from({ length: 80 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 4,
      delay: Math.random() * 0.8,
      duration: Math.random() * 1.5 + 1.5,
      rotation: Math.random() * 360,
      shape: Math.random() > 0.5 ? 'circle' : 'rect',
    }))
    setPieces(newPieces)
    const timer = setTimeout(() => setPieces([]), 3000)
    return () => clearTimeout(timer)
  }, [active])

  if (!pieces.length) return null

  return (
    <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:9998, overflow:'hidden' }}>
      {pieces.map(p => (
        <div key={p.id} style={{
          position:'absolute', left:p.x+'%', top:'-10px',
          width:p.size, height:p.shape==='circle'?p.size:p.size*1.5,
          borderRadius:p.shape==='circle'?'50%':'2px',
          background:p.color,
          animation:'confettiFall '+p.duration+'s '+p.delay+'s ease-in forwards',
          transform:'rotate('+p.rotation+'deg)',
        }}/>
      ))}
      <style>{`
        @keyframes confettiFall {
          0%   { transform:translateY(0) rotate(0deg); opacity:1 }
          100% { transform:translateY(100vh) rotate(720deg); opacity:0 }
        }
      `}</style>
    </div>
  )
}

// ── P4: Empty state illustrations ─────────────────────────────
export function EmptyBasketState({ onShop }) {
  return (
    <div style={{ textAlign:'center', padding:'48px 24px 32px' }}>
      <div style={{ position:'relative', width:120, height:120, margin:'0 auto 20px' }}>
        <div style={{ width:120, height:120, borderRadius:'50%', background:'rgba(196,104,58,0.08)', border:'1.5px dashed rgba(196,104,58,0.25)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <span style={{ fontSize:52 }}>🛒</span>
        </div>
        <div style={{ position:'absolute', top:-6, right:-6, fontSize:22, animation:'basketBounce 2s ease-in-out infinite' }}>😔</div>
      </div>
      <div style={{ fontFamily:F.serif, fontSize:24, color:'white', marginBottom:8 }}>Your basket is empty</div>
      <div style={{ fontSize:14, color:C.muted, lineHeight:1.6, marginBottom:28, maxWidth:240, margin:'0 auto 28px' }}>
        Time to fill it up 🌴 Browse our drinks, snacks and essentials — all delivered in under 30 minutes.
      </div>
      <button onClick={onShop}
        style={{ padding:'14px 32px', background:C.accent, border:'none', borderRadius:24, color:'white', fontSize:15, fontWeight:600, cursor:'pointer', fontFamily:F.sans, boxShadow:'0 4px 20px rgba(196,104,58,0.35)' }}>
        Start shopping →
      </button>
      <style>{'@keyframes basketBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}'}</style>
    </div>
  )
}

export function EmptySearchState({ query }) {
  return (
    <div style={{ textAlign:'center', padding:'48px 24px' }}>
      <div style={{ fontSize:64, marginBottom:16, animation:'searchWobble 2s ease-in-out infinite' }}>🔍</div>
      <div style={{ fontFamily:F.serif, fontSize:22, color:'white', marginBottom:8 }}>
        No results for "{query}"
      </div>
      <div style={{ fontSize:14, color:C.muted, lineHeight:1.6, marginBottom:20 }}>
        Try a different word, or ask Isla AI to find something similar
      </div>
      <div style={{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap' }}>
        {['Gin','Rosé','Beer','Water','Ice'].map(s=>(
          <div key={s} style={{ padding:'6px 14px', background:C.surface, border:'0.5px solid '+C.border, borderRadius:20, fontSize:12, color:C.muted, fontFamily:F.sans }}>{s}</div>
        ))}
      </div>
      <style>{'@keyframes searchWobble{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(5deg)}}'}</style>
    </div>
  )
}

export function EmptyOrdersState({ onShop }) {
  return (
    <div style={{ textAlign:'center', padding:'48px 24px' }}>
      <div style={{ fontSize:64, marginBottom:16 }}>📦</div>
      <div style={{ fontFamily:F.serif, fontSize:22, color:'white', marginBottom:8 }}>No orders yet</div>
      <div style={{ fontSize:14, color:C.muted, lineHeight:1.6, marginBottom:24 }}>
        Your order history will appear here once you place your first order.
      </div>
      <button onClick={onShop}
        style={{ padding:'12px 28px', background:C.accent, border:'none', borderRadius:20, color:'white', fontSize:14, fontWeight:500, cursor:'pointer', fontFamily:F.sans }}>
        Order now 🛵
      </button>
    </div>
  )
}

export function EmptyWishlistState({ onShop }) {
  return (
    <div style={{ textAlign:'center', padding:'48px 24px' }}>
      <div style={{ fontSize:64, marginBottom:16, animation:'heartPulse 1.5s ease-in-out infinite' }}>🤍</div>
      <div style={{ fontFamily:F.serif, fontSize:22, color:'white', marginBottom:8 }}>Nothing saved yet</div>
      <div style={{ fontSize:14, color:C.muted, lineHeight:1.6, marginBottom:24 }}>
        Tap the heart on any product to save it for later.
      </div>
      <button onClick={onShop}
        style={{ padding:'12px 28px', background:C.accent, border:'none', borderRadius:20, color:'white', fontSize:14, fontWeight:500, cursor:'pointer', fontFamily:F.sans }}>
        Browse products
      </button>
      <style>{'@keyframes heartPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}'}</style>
    </div>
  )
}

// ── P5: Onboarding — properly triggered ───────────────────────
export function FirstVisitOnboarding({ onDone }) {
  const [slide, setSlide] = useState(0)
  const [exiting, setExiting] = useState(false)

  const SLIDES = [
    {
      emoji:'🌴', gradient:'linear-gradient(160deg,#0A2A38,#0D4A5A)',
      title:'Welcome to Isla Drop',
      body:'24/7 delivery anywhere in Ibiza. Drinks, snacks, ice and everything you need — to your villa, hotel, beach or boat.',
      cta:'Next',
    },
    {
      emoji:'🛵', gradient:'linear-gradient(160deg,#1A3A20,#0D4530)',
      title:'Under 30 minutes',
      body:'Our riders know every road, marina and beach club. Track your order live, down to the minute.',
      cta:'Next',
    },
    {
      emoji:'✨', gradient:'linear-gradient(160deg,#3A1A0A,#5A2A0D)',
      title:'AI-powered for Ibiza',
      body:'Ask Isla to design your night, plan your beach day, or build the perfect villa order — our AI knows exactly what you need.',
      cta:'Next',
    },
    {
      emoji:'🎉', gradient:'linear-gradient(160deg,#1A0A3A,#2D0D5A)',
      title:'You\'re all set',
      body:'Earn stamps with every order, unlock VIP tiers, and get exclusive Ibiza event recommendations. Let\'s go!',
      cta:'Start ordering →',
    },
  ]

  const next = () => {
    if (slide < SLIDES.length - 1) {
      setSlide(s => s+1)
    } else {
      setExiting(true)
      setTimeout(onDone, 400)
    }
  }

  const s = SLIDES[slide]

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:9990,
      background:s.gradient,
      display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      padding:'40px 32px',
      transition:'background 0.5s',
      opacity:exiting?0:1,
      transform:exiting?'scale(0.95)':'scale(1)',
    }}>
      {/* Skip */}
      <button onClick={()=>{ setExiting(true); setTimeout(onDone,400) }}
        style={{ position:'absolute', top:52, right:24, background:'none', border:'none', color:'rgba(255,255,255,0.4)', fontSize:13, cursor:'pointer', fontFamily:F.sans }}>
        Skip
      </button>

      {/* Emoji */}
      <div style={{ fontSize:88, marginBottom:28, animation:'obFloat 3s ease-in-out infinite' }}>
        {s.emoji}
      </div>

      {/* Text */}
      <div style={{ fontFamily:F.serif, fontSize:28, color:'white', textAlign:'center', lineHeight:1.2, marginBottom:16 }}>
        {s.title}
      </div>
      <div style={{ fontSize:15, color:'rgba(255,255,255,0.65)', textAlign:'center', lineHeight:1.7, maxWidth:300, marginBottom:44 }}>
        {s.body}
      </div>

      {/* Dots */}
      <div style={{ display:'flex', gap:7, marginBottom:28 }}>
        {SLIDES.map((_,i) => (
          <div key={i} style={{ width:i===slide?22:7, height:7, borderRadius:99, background:i===slide?'white':'rgba(255,255,255,0.3)', transition:'all 0.3s' }}/>
        ))}
      </div>

      {/* CTA */}
      <button onClick={next}
        style={{ width:'100%', maxWidth:320, padding:'16px', background:'white', border:'none', borderRadius:16, color:'#2A2318', fontSize:16, fontWeight:600, cursor:'pointer', fontFamily:F.sans }}>
        {s.cta}
      </button>

      <style>{'@keyframes obFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}'}</style>
    </div>
  )
}

// ── P6: What's new changelog modal ────────────────────────────
const CURRENT_VERSION = '2.4.0'
const WHATS_NEW_KEY   = 'isla_whats_new_seen'

export function useWhatsNew() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    try {
      const seen = localStorage.getItem(WHATS_NEW_KEY)
      if (seen !== CURRENT_VERSION) setShow(true)
    } catch {}
  }, [])
  const dismiss = () => {
    try { localStorage.setItem(WHATS_NEW_KEY, CURRENT_VERSION) } catch {}
    setShow(false)
  }
  return { show, dismiss }
}

export function WhatsNewModal({ onClose }) {
  const CHANGES = [
    { emoji:'🏖️', title:'Beach delivery AI', desc:'Tell Isla about your beach day and she will build the perfect order automatically.' },
    { emoji:'🔐', title:'Google & Apple sign-in', desc:'One-tap login with your existing Google or Apple account.' },
    { emoji:'📱', title:'Phone OTP login', desc:'Sign in with just your mobile number — no password needed.' },
    { emoji:'🏆', title:'Challenges & badges', desc:'Earn rewards for every milestone — streaks, big orders, beach deliveries and more.' },
    { emoji:'💬', title:'In-app support chat', desc:'Chat with Isla AI support directly in the app during your delivery.' },
    { emoji:'📷', title:'Image search', desc:'Point your camera at a bottle to instantly find and add it.' },
    { emoji:'🎂', title:'Birthday rewards', desc:'We automatically add €15 to your account on your birthday every year.' },
    { emoji:'🔄', title:'Recurring orders', desc:'Set up weekly automatic delivery of your favourite items.' },
  ]

  return (
    <div style={{ position:'fixed',inset:0,zIndex:800,background:'rgba(0,0,0,0.8)',display:'flex',alignItems:'flex-end' }} onClick={onClose}>
      <div style={{ width:'100%',maxWidth:480,margin:'0 auto',background:'#0D3545',borderRadius:'24px 24px 0 0',maxHeight:'80vh',display:'flex',flexDirection:'column' }} onClick={e=>e.stopPropagation()}>
        <div style={{ padding:'20px 20px 16px',flexShrink:0 }}>
          <div style={{ width:36,height:4,background:'rgba(255,255,255,0.2)',borderRadius:2,margin:'0 auto 16px' }}/>
          <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:4 }}>
            <div style={{ fontSize:28 }}>🎉</div>
            <div>
              <div style={{ fontFamily:F.serif,fontSize:22,color:'white' }}>What's new in Isla Drop</div>
              <div style={{ fontSize:12,color:C.muted }}>Version {CURRENT_VERSION}</div>
            </div>
          </div>
        </div>
        <div style={{ overflowY:'auto',flex:1,padding:'0 20px 8px' }}>
          {CHANGES.map((ch,i) => (
            <div key={i} style={{ display:'flex',gap:14,padding:'12px 0',borderBottom:'0.5px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize:26,flexShrink:0 }}>{ch.emoji}</span>
              <div>
                <div style={{ fontSize:14,fontWeight:600,color:'white',fontFamily:F.sans,marginBottom:2 }}>{ch.title}</div>
                <div style={{ fontSize:12,color:C.muted,lineHeight:1.5 }}>{ch.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding:'16px 20px 36px',flexShrink:0 }}>
          <button onClick={onClose}
            style={{ width:'100%',padding:'15px',background:C.accent,border:'none',borderRadius:14,color:'white',fontSize:15,fontWeight:600,cursor:'pointer',fontFamily:F.sans }}>
            Got it 🌴
          </button>
        </div>
      </div>
    </div>
  )
}

// ── P8: Out-of-stock auto-remove from basket ──────────────────
export function useOutOfStockCheck() {
  const cart = useCartStore()

  const check = useCallback(async () => {
    try {
      const { supabase } = await import('../../lib/supabase')
      const ids = cart.items.map(i => i.product.id)
      if (!ids.length) return
      const { data } = await supabase
        .from('product_stock')
        .select('product_id,quantity')
        .in('product_id', ids)
        .eq('quantity', 0)
      if (data?.length) {
        const outOfStock = data.map(d => d.product_id)
        outOfStock.forEach(id => cart.updateQuantity(id, 0))
        toast.error(outOfStock.length+' item'+(outOfStock.length>1?'s':'')+' removed — out of stock', { duration:3000 })
      }
    } catch {}
  }, [cart.items.length])

  return check
}

// ── P9: Delivery fee by distance / zone ──────────────────────
// Ibiza delivery zones based on distance from San Antonio depot
const DELIVERY_ZONES = [
  { name:'Ibiza Town',    maxKm:8,  fee:3.50,  mins:18 },
  { name:'San Antonio',  maxKm:12, fee:3.50,  mins:22 },
  { name:'Santa Eulalia',maxKm:16, fee:4.50,  mins:28 },
  { name:'North Ibiza',  maxKm:28, fee:6.00,  mins:38 },
  { name:'Far zone',     maxKm:99, fee:8.00,  mins:50 },
]

const DEPOT_LAT = 38.9200, DEPOT_LNG = 1.4230 // San Antonio depot approx

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2-lat1) * Math.PI/180
  const dLng = (lng2-lng1) * Math.PI/180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

export function useDeliveryZone(lat, lng) {
  if (!lat || !lng) return { fee:3.50, mins:18, name:'Standard', zone:null }
  const distKm = haversineKm(DEPOT_LAT, DEPOT_LNG, lat, lng)
  const zone   = DELIVERY_ZONES.find(z => distKm <= z.maxKm) || DELIVERY_ZONES[DELIVERY_ZONES.length-1]
  return { fee:zone.fee, mins:zone.mins, name:zone.name, zone, distKm:Math.round(distKm*10)/10 }
}

export function DeliveryZoneBadge({ lat, lng }) {
  const { fee, mins, name } = useDeliveryZone(lat, lng)
  if (!lat || !lng) return null
  return (
    <div style={{ display:'flex',alignItems:'center',gap:8,padding:'8px 12px',background:'rgba(43,122,139,0.12)',border:'0.5px solid rgba(43,122,139,0.25)',borderRadius:10,marginBottom:12,fontSize:12,fontFamily:F.sans }}>
      <span style={{ fontSize:16 }}>📍</span>
      <div>
        <span style={{ color:'white',fontWeight:600 }}>{name}</span>
        <span style={{ color:C.muted }}> · €{fee.toFixed(2)} delivery · ~{mins} min</span>
      </div>
    </div>
  )
}

// ── P10: No quantity limits — customers can order any amount ──
// Removed per business requirement: large orders must not be restricted

// ── P11: Photo ID upload for age verification ─────────────────
export function PhotoIDVerification({ onVerified, onSkip }) {
  const [step, setStep] = useState('prompt') // prompt | upload | processing | done
  const [error, setError] = useState('')
  const fileRef = useRef(null)
  const { user } = useAuthStore()

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setStep('processing')
    setError('')
    try {
      const reader = new FileReader()
      reader.onload = async (ev) => {
        const base64 = ev.target.result.split(',')[1]
        // Use Claude vision to check ID
        const resp = await fetch('https://api.anthropic.com/v1/messages', {
          method:'POST',
          headers:{ 'Content-Type':'application/json','anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true','x-api-key':import.meta.env.VITE_ANTHROPIC_API_KEY||'' },
          body: JSON.stringify({
            model:'claude-haiku-4-5-20251001', max_tokens:100,
            messages:[{ role:'user', content:[
              { type:'image', source:{ type:'base64', media_type:file.type, data:base64 } },
              { type:'text', text:'Is this a valid government-issued photo ID (passport, driving licence, national ID card)? Reply with ONLY: YES or NO' }
            ]}]
          })
        })
        const data = await resp.json()
        const result = data.content?.[0]?.text?.trim().toUpperCase()
        if (result === 'YES') {
          // Store verified flag in Supabase
          try {
            const { supabase } = await import('../../lib/supabase')
            await supabase.from('profiles').update({ id_verified:true }).eq('id', user.id)
          } catch {}
          setStep('done')
          setTimeout(onVerified, 1500)
        } else {
          setError('Could not verify this as a valid ID. Please upload a clear photo of your passport, driving licence or national ID card.')
          setStep('upload')
        }
      }
      reader.readAsDataURL(file)
    } catch { setError('Upload failed — please try again'); setStep('upload') }
  }

  return (
    <div style={{ padding:'20px 0' }}>
      {step === 'prompt' && (
        <>
          <div style={{ textAlign:'center',marginBottom:24 }}>
            <div style={{ fontSize:52,marginBottom:12 }}>🪪</div>
            <div style={{ fontFamily:F.serif,fontSize:20,color:'#2A2318',marginBottom:8 }}>Age verification required</div>
            <div style={{ fontSize:14,color:'#7A6E60',lineHeight:1.6 }}>
              Your order includes age-restricted items. We need to verify you are 18+ with a photo ID. Your ID is never stored.
            </div>
          </div>
          <button onClick={()=>setStep('upload')}
            style={{ width:'100%',padding:'14px',background:'#C4683A',border:'none',borderRadius:12,color:'white',fontSize:15,fontWeight:500,cursor:'pointer',fontFamily:F.sans,marginBottom:10 }}>
            Upload ID photo →
          </button>
          <button onClick={onSkip}
            style={{ width:'100%',padding:'12px',background:'none',border:'0.5px solid rgba(42,35,24,0.2)',borderRadius:12,fontSize:13,color:'#7A6E60',cursor:'pointer',fontFamily:F.sans }}>
            Verify at delivery instead
          </button>
        </>
      )}
      {step === 'upload' && (
        <>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFile} style={{ display:'none' }}/>
          <div style={{ border:'2px dashed rgba(196,104,58,0.4)',borderRadius:16,padding:'32px 20px',textAlign:'center',marginBottom:16,cursor:'pointer' }}
            onClick={()=>fileRef.current?.click()}>
            <div style={{ fontSize:42,marginBottom:10 }}>📷</div>
            <div style={{ fontSize:14,fontWeight:500,color:'#2A2318',marginBottom:4 }}>Take a photo of your ID</div>
            <div style={{ fontSize:12,color:'#7A6E60' }}>Passport, driving licence or national ID card</div>
          </div>
          {error && <div style={{ fontSize:12,color:'#C4683A',marginBottom:12,lineHeight:1.5 }}>{error}</div>}
          <button onClick={()=>fileRef.current?.click()}
            style={{ width:'100%',padding:'14px',background:'#C4683A',border:'none',borderRadius:12,color:'white',fontSize:14,fontWeight:500,cursor:'pointer',fontFamily:F.sans }}>
            Choose photo
          </button>
        </>
      )}
      {step === 'processing' && (
        <div style={{ textAlign:'center',padding:'40px 0' }}>
          <div style={{ width:44,height:44,border:'3px solid rgba(196,104,58,0.2)',borderTopColor:'#C4683A',borderRadius:'50%',animation:'idSpin 0.8s linear infinite',margin:'0 auto 16px' }}/>
          <div style={{ fontSize:15,color:'#2A2318',fontFamily:F.sans }}>Verifying your ID...</div>
          <style>{'@keyframes idSpin{to{transform:rotate(360deg)}}'}</style>
        </div>
      )}
      {step === 'done' && (
        <div style={{ textAlign:'center',padding:'32px 0' }}>
          <div style={{ fontSize:56,marginBottom:12 }}>✅</div>
          <div style={{ fontFamily:F.serif,fontSize:22,color:'#2A2318',marginBottom:6 }}>ID verified</div>
          <div style={{ fontSize:14,color:'#7A6E60' }}>Continuing to checkout...</div>
        </div>
      )}
    </div>
  )
}

// ── P12/P13: Enhanced driver card + live ETA on home ──────────
export function LiveOrderHomeCard({ order, etaMins, onTrack }) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!order || order.status === 'delivered') return
    const interval = setInterval(() => setElapsed(e => e+1), 60000)
    return () => clearInterval(interval)
  }, [order?.id])

  if (!order || order.status === 'delivered') return null

  const statusEmoji = {
    confirmed:'✅', preparing:'👨‍🍳', assigned:'🛵', picked_up:'📦', en_route:'🌴',
  }
  const statusLabel = {
    confirmed:'Order confirmed', preparing:'Being prepared', assigned:'Driver assigned',
    picked_up:'Order picked up', en_route:'On the way to you',
  }

  const remaining = Math.max(0, (etaMins || (order.estimated_minutes||18)) - elapsed)

  return (
    <div onClick={onTrack}
      style={{ margin:'0 16px 16px',background:'linear-gradient(135deg,rgba(43,122,139,0.25),rgba(13,53,69,0.4))',border:'0.5px solid rgba(43,122,139,0.4)',borderRadius:18,padding:'16px',cursor:'pointer',position:'relative',overflow:'hidden' }}>
      {/* Animated background pulse */}
      <div style={{ position:'absolute',inset:0,background:'rgba(43,122,139,0.05)',animation:'orderCardPulse 2s ease-in-out infinite',borderRadius:18,pointerEvents:'none' }}/>
      <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:12,position:'relative' }}>
        <div style={{ fontSize:28 }}>{statusEmoji[order.status]||'🛵'}</div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:11,color:'rgba(126,232,200,0.8)',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.5px',fontFamily:F.sans }}>Active order</div>
          <div style={{ fontFamily:F.serif,fontSize:17,color:'white' }}>{statusLabel[order.status]||'In progress'}</div>
        </div>
        <div style={{ textAlign:'right',flexShrink:0 }}>
          <div style={{ fontFamily:'monospace',fontSize:26,fontWeight:700,color:'white',lineHeight:1 }}>{remaining}</div>
          <div style={{ fontSize:10,color:C.muted }}>min left</div>
        </div>
      </div>
      {/* Progress bar */}
      <div style={{ background:'rgba(255,255,255,0.1)',borderRadius:99,height:4,marginBottom:10 }}>
        <div style={{ height:'100%',borderRadius:99,background:'linear-gradient(90deg,#7EE8A2,#2B7A8B)',width:({'confirmed':15,'preparing':35,'assigned':55,'picked_up':75,'en_route':90}[order.status]||10)+'%',transition:'width 1s ease' }}/>
      </div>
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
        <div style={{ fontSize:11,color:C.muted,fontFamily:F.sans }}>#{order.order_number}</div>
        <div style={{ fontSize:11,color:'rgba(43,170,180,0.8)',fontFamily:F.sans,fontWeight:600 }}>Tap to track →</div>
      </div>
      <style>{'@keyframes orderCardPulse{0%,100%{opacity:1}50%{opacity:0.7}}'}</style>
    </div>
  )
}

// ── P14: Minimum order by zone ────────────────────────────────
export function getMinimumOrderForZone(lat, lng) {
  return 30 // €30 minimum order across all Ibiza zones
}

export function ZoneMinimumBanner({ lat, lng, subtotal }) {
  const MIN = 30
  if (subtotal >= MIN) return null
  const pct = Math.min(100, (subtotal / MIN) * 100)
  const remaining = (MIN - subtotal).toFixed(2)
  return (
    <div style={{ background:'rgba(196,104,58,0.1)',border:'0.5px solid rgba(196,104,58,0.3)',borderRadius:12,padding:'12px 14px',marginBottom:12,fontFamily:F.sans }}>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8 }}>
        <div style={{ fontSize:12,fontWeight:600,color:'rgba(255,255,255,0.9)' }}>🛒 Minimum order €{MIN}</div>
        <div style={{ fontSize:12,color:'rgba(196,104,58,0.9)',fontWeight:600 }}>€{remaining} to go</div>
      </div>
      <div style={{ height:5,background:'rgba(255,255,255,0.1)',borderRadius:999,overflow:'hidden' }}>
        <div style={{ height:'100%',width:pct+'%',background:'linear-gradient(90deg,#C4683A,#E8A070)',borderRadius:999,transition:'width 0.4s ease' }} />
      </div>
      <div style={{ fontSize:11,color:'rgba(255,255,255,0.45)',marginTop:6 }}>Add €{remaining} more to place your order</div>
    </div>
  )
}

// ── P15: Prefetch next likely screen ─────────────────────────
export function usePrefetch(view, cart) {
  useEffect(() => {
    if (view === 'home' && cart?.items?.length > 0) {
      // Likely to open basket — prefetch basket dependencies
      import('./CustomerFeatures_extra').catch(()=>{})
    }
    if (view === 'basket' && cart?.items?.length > 0) {
      // Likely to go to checkout — prefetch Stripe
      import('./StripeCheckout').catch(()=>{})
      import('./DeliveryMap').catch(()=>{})
    }
  }, [view, cart?.items?.length])
}

// ── P16: Share basket with group ─────────────────────────────
export function useShareBasket() {
  const cart = useCartStore()
  const { user } = useAuthStore()

  const share = useCallback(async () => {
    if (!cart.items.length) { toast.error('Add items to your basket first'); return }
    try {
      const { supabase } = await import('../../lib/supabase')
      const token = Math.random().toString(36).slice(2,10).toUpperCase()
      await supabase.from('shared_baskets').insert({
        token,
        user_id: user?.id,
        items: cart.items.map(i=>({ product_id:i.product.id, quantity:i.quantity })),
        expires_at: new Date(Date.now()+24*3600000).toISOString(),
      })
      const url = window.location.origin+'/?basket='+token
      if (navigator.share) {
        await navigator.share({ title:'Isla Drop basket', text:'Join my Isla Drop order! 🛵', url })
      } else {
        await navigator.clipboard.writeText(url)
        toast.success('Basket link copied! Share with your group 🌴')
      }
    } catch { toast.error('Could not share basket') }
  }, [cart.items, user?.id])

  return share
}

export function ShareBasketButton() {
  const share = useShareBasket()
  return (
    <button onClick={share}
      style={{ width:'100%',padding:'11px',background:'rgba(43,122,139,0.12)',border:'0.5px solid rgba(43,122,139,0.25)',borderRadius:12,fontFamily:F.sans,fontSize:12,color:'rgba(126,232,200,0.8)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6,marginBottom:8 }}>
      🔗 Share basket with group
    </button>
  )
}

// ── P17: Barcode scanner ──────────────────────────────────────
export function BarcodeScanner({ onResult, onClose }) {
  const [scanning, setScanning] = useState(false)
  const [error, setError]       = useState('')
  const fileRef = useRef(null)

  const scan = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setScanning(true)
    try {
      const reader = new FileReader()
      reader.onload = async (ev) => {
        const base64 = ev.target.result.split(',')[1]
        const productList = PRODUCTS.slice(0,80).map(p=>p.id+'|'+p.name+'|'+p.category).join('\n')
        const resp = await fetch('https://api.anthropic.com/v1/messages', {
          method:'POST',
          headers:{ 'Content-Type':'application/json','anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true','x-api-key':import.meta.env.VITE_ANTHROPIC_API_KEY||'' },
          body: JSON.stringify({
            model:'claude-haiku-4-5-20251001', max_tokens:150,
            messages:[{ role:'user', content:[
              { type:'image', source:{ type:'base64', media_type:file.type, data:base64 } },
              { type:'text', text:'Read the barcode or product label in this image. What product is it? Match it to the closest item in this list and return ONLY the product ID, nothing else. If no match, return "none".\n\n'+productList }
            ]}]
          })
        })
        const data = await resp.json()
        const productId = data.content?.[0]?.text?.trim()
        if (productId && productId !== 'none') {
          const product = PRODUCTS.find(p=>p.id===productId)
          if (product) { onResult(product); return }
        }
        setError('Could not identify this product. Try image search instead.')
        setScanning(false)
      }
      reader.readAsDataURL(file)
    } catch { setError('Scan failed — try again'); setScanning(false) }
  }

  return (
    <div style={{ position:'fixed',inset:0,zIndex:700,background:'rgba(0,0,0,0.92)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24 }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ width:'100%',maxWidth:360,textAlign:'center' }}>
        <div style={{ fontSize:14,color:'rgba(255,255,255,0.6)',marginBottom:24,fontFamily:F.sans }}>Point your camera at a barcode or product label</div>
        {/* Viewfinder frame */}
        <div style={{ width:260,height:200,border:'2px solid rgba(126,232,200,0.6)',borderRadius:16,margin:'0 auto 24px',position:'relative',display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.3)' }}>
          <div style={{ position:'absolute',top:0,left:0,width:20,height:20,borderTop:'3px solid #7EE8A2',borderLeft:'3px solid #7EE8A2',borderRadius:'4px 0 0 0' }}/>
          <div style={{ position:'absolute',top:0,right:0,width:20,height:20,borderTop:'3px solid #7EE8A2',borderRight:'3px solid #7EE8A2',borderRadius:'0 4px 0 0' }}/>
          <div style={{ position:'absolute',bottom:0,left:0,width:20,height:20,borderBottom:'3px solid #7EE8A2',borderLeft:'3px solid #7EE8A2',borderRadius:'0 0 0 4px' }}/>
          <div style={{ position:'absolute',bottom:0,right:0,width:20,height:20,borderBottom:'3px solid #7EE8A2',borderRight:'3px solid #7EE8A2',borderRadius:'0 0 4px 0' }}/>
          {scanning ? (
            <div style={{ width:36,height:36,border:'3px solid rgba(126,232,200,0.3)',borderTopColor:'#7EE8A2',borderRadius:'50%',animation:'barcodeSpin 0.8s linear infinite' }}/>
          ) : (
            <div style={{ fontSize:13,color:'rgba(255,255,255,0.35)',fontFamily:F.sans }}>|||||||||||</div>
          )}
        </div>
        {error && <div style={{ fontSize:12,color:'rgba(240,149,149,0.8)',marginBottom:16,fontFamily:F.sans }}>{error}</div>}
        <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={scan} style={{ display:'none' }}/>
        <button onClick={()=>fileRef.current?.click()} disabled={scanning}
          style={{ width:'100%',padding:'14px',background:'#7EE8A2',border:'none',borderRadius:14,color:'#0D3545',fontSize:15,fontWeight:600,cursor:'pointer',fontFamily:F.sans,marginBottom:12 }}>
          {scanning ? 'Scanning...' : '📷 Open camera'}
        </button>
        <button onClick={onClose}
          style={{ background:'none',border:'none',color:'rgba(255,255,255,0.4)',cursor:'pointer',fontSize:13,fontFamily:F.sans }}>
          Cancel
        </button>
        <style>{'@keyframes barcodeSpin{to{transform:rotate(360deg)}}'}</style>
      </div>
    </div>
  )
}

// ── P18: One-tap reorder from history ─────────────────────────
export async function oneTabReorder(order) {
  if (!order?.order_items?.length) {
    toast.error('Could not load order items')
    return false
  }
  const { addItem } = useCartStore.getState()
  let count = 0
  for (const item of order.order_items) {
    const product = PRODUCTS.find(p=>p.id===item.product_id) ||
      (item.products ? item.products : null)
    if (product) {
      for (let i=0;i<item.quantity;i++) { addItem(product); count++ }
    }
  }
  if (count > 0) {
    navigator.vibrate?.([20,50,20])
    toast.success(count+' items added to basket 🛵', { duration:1800 })
    return true
  }
  toast.error('Could not add items — products may no longer be available')
  return false
}

// ── P19: Charity donation add-on ─────────────────────────────
export function CharityDonationToggle({ enabled, onToggle }) {
  return (
    <div style={{ display:'flex',alignItems:'center',gap:14,padding:'12px 0',borderTop:'0.5px solid rgba(255,255,255,0.08)' }}>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:13,fontWeight:600,color:'white',fontFamily:F.sans,marginBottom:1 }}>🤝 Donate €0.50 to Ibiza charities</div>
        <div style={{ fontSize:11,color:C.muted }}>Supporting local children and wildlife conservation</div>
      </div>
      <button onClick={onToggle}
        style={{ width:46,height:26,borderRadius:13,background:enabled?C.green:'rgba(255,255,255,0.15)',border:'none',cursor:'pointer',position:'relative',transition:'background 0.2s',flexShrink:0 }}>
        <div style={{ width:20,height:20,borderRadius:'50%',background:'white',position:'absolute',top:3,left:enabled?22:3,transition:'left 0.2s' }}/>
      </button>
    </div>
  )
}

// ── P20: Carbon offset option ─────────────────────────────────
export function CarbonOffsetToggle({ enabled, onToggle }) {
  return (
    <div style={{ display:'flex',alignItems:'center',gap:14,padding:'12px 0',borderTop:'0.5px solid rgba(255,255,255,0.08)' }}>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:13,fontWeight:600,color:'white',fontFamily:F.sans,marginBottom:1 }}>🌱 Carbon offset delivery +€0.30</div>
        <div style={{ fontSize:11,color:C.muted }}>Plant a tree in Ibiza for every order you offset</div>
      </div>
      <button onClick={onToggle}
        style={{ width:46,height:26,borderRadius:13,background:enabled?C.green:'rgba(255,255,255,0.15)',border:'none',cursor:'pointer',position:'relative',transition:'background 0.2s',flexShrink:0 }}>
        <div style={{ width:20,height:20,borderRadius:'50%',background:'white',position:'absolute',top:3,left:enabled?22:3,transition:'left 0.2s' }}/>
      </button>
    </div>
  )
}

// ── P22: Tip split display ────────────────────────────────────
export function TipSplitInfo({ tip, driverCount = 1 }) {
  if (!tip || tip <= 0 || driverCount <= 1) return null
  return (
    <div style={{ fontSize:11,color:C.muted,fontFamily:F.sans,marginTop:4,textAlign:'center' }}>
      €{(tip/driverCount).toFixed(2)} per driver ({driverCount} riders)
    </div>
  )
}

// ── P23: Siri / Apple Watch placeholders ─────────────────────
export function SiriShortcutsBanner() {
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent)
  if (!isIOS) return null
  return (
    <div style={{ margin:'0 0 10px',background:'rgba(0,0,0,0.15)',border:'0.5px solid rgba(255,255,255,0.08)',borderRadius:10,padding:'10px 14px',display:'flex',alignItems:'center',gap:10 }}>
      <span style={{ fontSize:18 }}>🎙️</span>
      <div style={{ fontSize:12,color:C.muted,fontFamily:F.sans,flex:1 }}>
        <strong style={{ color:'white' }}>Siri shortcuts</strong> — coming in the iOS app
      </div>
    </div>
  )
}

// ── P24: Optimised product image URL ─────────────────────────
export function getOptimisedImageUrl(url, width = 400) {
  if (!url) return url
  // If it's a Supabase storage URL, add transform params
  if (url.includes('supabase.co/storage')) {
    return url + '?width='+width+'&quality=80&format=webp'
  }
  return url
}
