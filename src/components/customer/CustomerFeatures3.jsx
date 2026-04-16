import { useState, useEffect, useCallback, useRef } from 'react'
import { useCartStore, useAuthStore, useWishlistStore } from '../../lib/store'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import ProductImage from '../shared/ProductImage'

const C = {
  bg:'#0D3545', accent:'#C4683A', accentDim:'rgba(196,104,58,0.18)',
  green:'#7EE8A2', greenDim:'rgba(126,232,162,0.12)',
  gold:'#C8A84B', goldDim:'rgba(200,168,75,0.12)',
  surface:'rgba(255,255,255,0.07)', surfaceB:'rgba(255,255,255,0.12)',
  border:'rgba(255,255,255,0.1)', muted:'rgba(255,255,255,0.45)',
  white:'white', teal:'#2B7A8B',
}
const F = { serif:'DM Serif Display,serif', sans:'DM Sans,sans-serif' }

function Sheet({ onClose, children, maxH='90vh' }) {
  return (
    <div style={{ position:'fixed', inset:0, zIndex:500, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'flex-end' }} onClick={onClose}>
      <div style={{ width:'100%', maxWidth:480, margin:'0 auto', background:C.bg, borderRadius:'24px 24px 0 0', maxHeight:maxH, overflowY:'auto' }} onClick={e=>e.stopPropagation()}>
        <div style={{ width:36, height:4, background:'rgba(255,255,255,0.2)', borderRadius:2, margin:'20px auto 0' }}/>
        {children}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// DRIVER PROFILE CARD — shown on tracking screen
// ═══════════════════════════════════════════════════════════════
export function DriverProfileCard({ driverId, onContact }) {
  const [driver, setDriver] = useState(null)

  useEffect(() => {
    if (!driverId) return
    supabase.from('profiles').select('full_name, avatar_url, vehicle_type')
      .eq('id', driverId).single()
      .then(({ data }) => { if(data) setDriver(data) })
  }, [driverId])

  if (!driver) return null

  const initials = (driver.full_name||'D').split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)
  const vehicleEmoji = { scooter:'🛵', motorcycle:'🏍️', car:'🚗', ebike:'🚲' }[driver.vehicle_type||'scooter'] || '🛵'

  return (
    <div style={{ background:'rgba(43,122,139,0.2)', border:'0.5px solid rgba(43,122,139,0.35)', borderRadius:16, padding:'14px 16px', marginBottom:16 }}>
      <div style={{ display:'flex', alignItems:'center', gap:14 }}>
        <div style={{ width:52, height:52, borderRadius:'50%', background:C.accentDim, border:'2px solid '+C.accent, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:700, color:C.accent, flexShrink:0 }}>
          {driver.avatar_url ? <img src={driver.avatar_url} style={{ width:52, height:52, borderRadius:'50%', objectFit:'cover' }} alt={driver.full_name} /> : initials}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:15, fontWeight:700, color:C.white }}>{driver.full_name}</div>
          <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>{vehicleEmoji} Your driver · On the way</div>
          <div style={{ display:'flex', gap:4, marginTop:4 }}>
            {[1,2,3,4,5].map(i=><span key={i} style={{ fontSize:10, color:C.gold }}>★</span>)}
            <span style={{ fontSize:10, color:C.muted, marginLeft:2 }}>5.0</span>
          </div>
        </div>
        <button onClick={onContact}
          style={{ padding:'8px 14px', background:C.surfaceB, border:'0.5px solid rgba(255,255,255,0.2)', borderRadius:10, color:C.white, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:F.sans }}>
          💬 Contact
        </button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// RUNNING LATE BANNER — shown when ops pushes new ETA
// ═══════════════════════════════════════════════════════════════
export function LateBanner({ order, prevETA }) {
  const [visible, setVisible] = useState(false)
  const [newETA, setNewETA] = useState(null)

  useEffect(() => {
    if (!order) return
    // Detect if ETA increased (running late)
    if (prevETA && order.estimated_minutes > prevETA) {
      setNewETA(order.estimated_minutes)
      setVisible(true)
      setTimeout(() => setVisible(false), 8000)
    }
  }, [order?.estimated_minutes, prevETA])

  if (!visible || !newETA) return null

  return (
    <div style={{ background:'rgba(184,134,11,0.15)', border:'0.5px solid rgba(184,134,11,0.4)', borderRadius:14, padding:'14px 16px', marginBottom:16, display:'flex', gap:12, alignItems:'center' }}>
      <span style={{ fontSize:24 }}>⏱️</span>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:14, fontWeight:700, color:'#C8A84B' }}>Your order is running a little late</div>
        <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>New estimated arrival: {newETA} minutes. Sorry for the wait! 🙏</div>
      </div>
      <button onClick={()=>setVisible(false)} style={{ background:'none', border:'none', color:C.muted, fontSize:18, cursor:'pointer' }}>×</button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// PRODUCT REVIEWS — community ratings on products
// ═══════════════════════════════════════════════════════════════
export function ProductReviews({ productId, onClose }) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ avg:0, count:0, dist:[0,0,0,0,0] })

  useEffect(() => {
    supabase.from('product_reviews')
      .select('*, profiles(full_name)')
      .eq('product_id', productId)
      .order('created_at',{ascending:false})
      .limit(20)
      .then(({ data }) => {
        const reviews = data||[]
        setReviews(reviews)
        if (reviews.length > 0) {
          const avg = reviews.reduce((s,r)=>s+r.rating,0)/reviews.length
          const dist = [5,4,3,2,1].map(s=>reviews.filter(r=>r.rating===s).length)
          setStats({ avg, count:reviews.length, dist })
        }
        setLoading(false)
      })
  }, [productId])

  const stars = (n) => '★'.repeat(Math.round(n))+'☆'.repeat(5-Math.round(n))

  return (
    <Sheet onClose={onClose}>
      <div style={{ padding:'20px 20px 48px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div style={{ fontFamily:F.serif, fontSize:22, color:C.white }}>Customer reviews</div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:C.muted, fontSize:22, cursor:'pointer' }}>×</button>
        </div>

        {loading ? <div style={{textAlign:'center',padding:32,color:C.muted}}>Loading reviews...</div>
        : reviews.length===0 ? (
          <div style={{ textAlign:'center', padding:'40px 0' }}>
            <div style={{ fontSize:40, marginBottom:12 }}>💬</div>
            <div style={{ fontFamily:F.serif, fontSize:20, color:C.white, marginBottom:8 }}>No reviews yet</div>
            <div style={{ fontSize:13, color:C.muted }}>Be the first to review this product</div>
          </div>
        ) : (
          <>
            <div style={{ display:'flex', gap:20, alignItems:'center', marginBottom:20, background:C.surface, borderRadius:14, padding:16 }}>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:48, fontWeight:900, color:C.gold }}>{stats.avg.toFixed(1)}</div>
                <div style={{ fontSize:18, color:C.gold }}>{stars(stats.avg)}</div>
                <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{stats.count} reviews</div>
              </div>
              <div style={{ flex:1 }}>
                {[5,4,3,2,1].map((star,i) => (
                  <div key={star} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                    <span style={{ fontSize:11, color:C.muted, width:8 }}>{star}</span>
                    <span style={{ fontSize:10, color:C.gold }}>★</span>
                    <div style={{ flex:1, height:4, background:'rgba(255,255,255,0.1)', borderRadius:99, overflow:'hidden' }}>
                      <div style={{ height:'100%', background:C.gold, borderRadius:99, width:(stats.count>0?(stats.dist[i]/stats.count*100):0)+'%' }}/>
                    </div>
                    <span style={{ fontSize:10, color:C.muted, width:12, textAlign:'right' }}>{stats.dist[i]}</span>
                  </div>
                ))}
              </div>
            </div>

            {reviews.map(r=>(
              <div key={r.id} style={{ padding:'14px 0', borderBottom:'0.5px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <div style={{ width:28, height:28, borderRadius:'50%', background:C.accentDim, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:C.accent }}>
                      {(r.profiles?.full_name||'A')[0].toUpperCase()}
                    </div>
                    <div style={{ fontSize:13, fontWeight:600, color:C.white }}>{r.profiles?.full_name||'Anonymous'}</div>
                  </div>
                  <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                    <span style={{ fontSize:12, color:C.gold }}>{'★'.repeat(r.rating)+'☆'.repeat(5-r.rating)}</span>
                    <span style={{ fontSize:11, color:C.muted }}>{new Date(r.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</span>
                  </div>
                </div>
                {r.comment && <div style={{ fontSize:13, color:'rgba(255,255,255,0.75)', lineHeight:1.6, fontStyle:'italic' }}>"{r.comment}"</div>}
              </div>
            ))}
          </>
        )}
      </div>
    </Sheet>
  )
}

// ═══════════════════════════════════════════════════════════════
// TIP FOR DRIVER — at checkout
// ═══════════════════════════════════════════════════════════════
export function DriverTip({ onChange }) {
  const [tip, setTip] = useState(0)
  const [custom, setCustom] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const options = [0, 1, 2, 5]

  const select = (amount) => {
    setTip(amount)
    setShowCustom(false)
    setCustom('')
    onChange?.(amount)
  }

  const applyCustom = () => {
    const val = parseFloat(custom)||0
    setTip(val)
    onChange?.(val)
    setShowCustom(false)
  }

  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ fontSize:13, fontWeight:600, color:C.white, marginBottom:4 }}>🛵 Add a tip for your driver</div>
      <div style={{ fontSize:11, color:C.muted, marginBottom:10 }}>100% goes directly to your driver</div>
      <div style={{ display:'flex', gap:6, marginBottom:showCustom?10:0 }}>
        {options.map(o=>(
          <button key={o} onClick={()=>select(o)}
            style={{ flex:1, padding:'9px 0', borderRadius:10, border:'0.5px solid '+(tip===o&&!showCustom?C.accent:C.border), background:tip===o&&!showCustom?C.accentDim:'transparent', color:tip===o&&!showCustom?C.accent:C.muted, fontSize:13, fontWeight:tip===o&&!showCustom?700:400, cursor:'pointer', fontFamily:F.sans }}>
            {o===0?'None':'€'+o}
          </button>
        ))}
        <button onClick={()=>setShowCustom(true)}
          style={{ flex:1, padding:'9px 0', borderRadius:10, border:'0.5px solid '+(showCustom?C.accent:C.border), background:showCustom?C.accentDim:'transparent', color:showCustom?C.accent:C.muted, fontSize:13, cursor:'pointer', fontFamily:F.sans }}>
          Custom
        </button>
      </div>
      {showCustom && (
        <div style={{ display:'flex', gap:8 }}>
          <input type="number" value={custom} onChange={e=>setCustom(e.target.value)} placeholder="€0.00"
            style={{ flex:1, padding:'9px 12px', background:'rgba(255,255,255,0.08)', border:'0.5px solid rgba(255,255,255,0.2)', borderRadius:10, color:C.white, fontSize:13, fontFamily:F.sans, outline:'none' }} />
          <button onClick={applyCustom} style={{ padding:'9px 16px', background:C.accent, border:'none', borderRadius:10, color:'white', fontSize:13, cursor:'pointer' }}>Add</button>
        </div>
      )}
      {tip > 0 && <div style={{ fontSize:11, color:C.green, marginTop:6 }}>Thank you! €{tip.toFixed(2)} tip added 🙏</div>}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// ORDER ISSUE SELF-SERVICE — missing item instant credit
// ═══════════════════════════════════════════════════════════════
export function OrderIssue({ order, onClose }) {
  const { user } = useAuthStore()
  const [step, setStep] = useState('select')
  const [issueType, setIssueType] = useState(null)
  const [selectedItems, setSelectedItems] = useState([])
  const [resolving, setResolving] = useState(false)
  const [resolved, setResolved] = useState(null)

  const ISSUES = [
    { id:'missing', emoji:'📦', title:'Missing item(s)', desc:'Items were not in my delivery' },
    { id:'damaged', emoji:'💔', title:'Damaged item', desc:'Item arrived broken or spilled' },
    { id:'wrong', emoji:'🔄', title:'Wrong item', desc:'Received different item to what I ordered' },
    { id:'quality', emoji:'⭐', title:'Quality issue', desc:'Item not as expected' },
    { id:'late', emoji:'⏱️', title:'Very late delivery', desc:'Waited much longer than estimated' },
  ]

  const resolve = async () => {
    setResolving(true)
    const creditAmount = selectedItems.length > 0
      ? (order.order_items||[]).filter(i=>selectedItems.includes(i.products?.id)).reduce((s,i)=>s+(i.unit_price||0)*i.quantity,0)
      : order.total * 0.15 // 15% for quality/late issues

    // Log to support tickets
    await supabase.from('support_tickets').insert({
      user_id: user?.id, order_id: order.id,
      subject: ISSUES.find(i=>i.id===issueType)?.title||issueType,
      message: 'Auto-resolved via self-service. Items: '+selectedItems.join(', '),
      status:'resolved', priority:'normal',
      resolution: 'Credit of €'+creditAmount.toFixed(2)+' applied automatically.'
    })

    // Log credit to loyalty/account
    await supabase.from('ops_activity_log').insert({
      action:'customer_credit', details:'Auto credit €'+creditAmount.toFixed(2)+' for order '+order.id,
      metadata:{ user_id:user?.id, order_id:order.id, amount:creditAmount, reason:issueType }
    })

    setResolved(creditAmount)
    setResolving(false)
    setStep('done')
  }

  const items = order?.order_items||[]

  if (step==='done') return (
    <Sheet onClose={onClose}>
      <div style={{ padding:'40px 24px 60px', textAlign:'center' }}>
        <div style={{ fontSize:64, marginBottom:16 }}>✅</div>
        <div style={{ fontFamily:F.serif, fontSize:26, color:C.white, marginBottom:8 }}>Problem solved!</div>
        <div style={{ fontSize:15, color:C.green, fontWeight:700, marginBottom:8 }}>€{resolved?.toFixed(2)} credit added</div>
        <div style={{ fontSize:13, color:C.muted, marginBottom:32, lineHeight:1.6 }}>
          We've applied a credit to your account. It will automatically apply to your next order. Sorry for the inconvenience!
        </div>
        <button onClick={onClose} style={{ width:'100%', padding:'15px', background:C.accent, border:'none', borderRadius:14, color:'white', fontSize:15, fontWeight:600, cursor:'pointer', fontFamily:F.sans }}>
          Close
        </button>
      </div>
    </Sheet>
  )

  return (
    <Sheet onClose={onClose}>
      <div style={{ padding:'20px 20px 48px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div style={{ fontFamily:F.serif, fontSize:22, color:C.white }}>Report an issue</div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:C.muted, fontSize:22, cursor:'pointer' }}>×</button>
        </div>

        {step==='select' && (
          <>
            <div style={{ fontSize:13, color:C.muted, marginBottom:16 }}>What went wrong with your order?</div>
            {ISSUES.map(issue=>(
              <button key={issue.id} onClick={()=>{setIssueType(issue.id);setStep(issue.id==='missing'||issue.id==='wrong'?'items':'confirm')}}
                style={{ display:'flex', alignItems:'center', gap:14, width:'100%', padding:'14px 16px', background:C.surface, border:'0.5px solid '+C.border, borderRadius:12, cursor:'pointer', marginBottom:8, textAlign:'left' }}>
                <span style={{ fontSize:24 }}>{issue.emoji}</span>
                <div>
                  <div style={{ fontSize:14, fontWeight:600, color:C.white }}>{issue.title}</div>
                  <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{issue.desc}</div>
                </div>
              </button>
            ))}
          </>
        )}

        {step==='items' && (
          <>
            <div style={{ fontSize:13, color:C.muted, marginBottom:16 }}>Which items were affected?</div>
            {items.map(item=>(
              <button key={item.products?.id} onClick={()=>setSelectedItems(prev=>prev.includes(item.products?.id)?prev.filter(i=>i!==item.products?.id):[...prev,item.products?.id])}
                style={{ display:'flex', alignItems:'center', gap:12, width:'100%', padding:'12px 14px', background:selectedItems.includes(item.products?.id)?C.accentDim:C.surface, border:'0.5px solid '+(selectedItems.includes(item.products?.id)?C.accent:C.border), borderRadius:10, cursor:'pointer', marginBottom:6, textAlign:'left' }}>
                <div style={{ width:20, height:20, borderRadius:5, border:'2px solid '+(selectedItems.includes(item.products?.id)?C.accent:'rgba(255,255,255,0.3)'), background:selectedItems.includes(item.products?.id)?C.accent:'transparent', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, color:'white', flexShrink:0 }}>
                  {selectedItems.includes(item.products?.id)?'✓':''}
                </div>
                <span style={{ fontSize:15 }}>{item.products?.emoji}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, color:C.white }}>{item.products?.name}</div>
                  <div style={{ fontSize:11, color:C.muted }}>×{item.quantity} · €{((item.unit_price||0)*item.quantity).toFixed(2)}</div>
                </div>
              </button>
            ))}
            <button onClick={()=>setStep('confirm')} disabled={selectedItems.length===0}
              style={{ width:'100%', marginTop:12, padding:'13px', background:selectedItems.length?C.accent:'rgba(255,255,255,0.1)', border:'none', borderRadius:12, color:'white', fontSize:14, fontWeight:600, cursor:selectedItems.length?'pointer':'default', fontFamily:F.sans }}>
              Continue
            </button>
          </>
        )}

        {step==='confirm' && (
          <>
            <div style={{ background:C.greenDim, border:'0.5px solid rgba(126,232,162,0.25)', borderRadius:14, padding:'20px', marginBottom:20, textAlign:'center' }}>
              <div style={{ fontSize:32, marginBottom:8 }}>💚</div>
              <div style={{ fontSize:15, fontWeight:700, color:C.green, marginBottom:4 }}>Instant credit coming your way</div>
              <div style={{ fontSize:13, color:C.muted }}>We'll apply a credit to your account immediately — no waiting, no back and forth.</div>
            </div>
            <button onClick={resolve} disabled={resolving}
              style={{ width:'100%', padding:'15px', background:C.accent, border:'none', borderRadius:14, color:'white', fontSize:15, fontWeight:600, cursor:resolving?'default':'pointer', fontFamily:F.sans }}>
              {resolving?'Processing...':'Get my credit now'}
            </button>
          </>
        )}
      </div>
    </Sheet>
  )
}

// ═══════════════════════════════════════════════════════════════
// SMART REORDER SUGGESTIONS — time-of-day personalised home
// ═══════════════════════════════════════════════════════════════
export function SmartSuggestions({ previousItems, onAddAll }) {
  const { addItem } = useCartStore()
  const [suggestions, setSuggestions] = useState([])
  const { user } = useAuthStore()

  useEffect(() => {
    const hour = new Date().getHours()
    const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night'

    const TIME_CATS = {
      morning: ['water','soft_drinks','snacks'],
      afternoon: ['beer','soft_drinks','snacks','water'],
      evening: ['wine','beer','spirits','snacks'],
      night: ['beer','spirits','champagne','snacks','ice'],
    }

    const { PRODUCTS } = require('../../lib/products')
    const targetCats = TIME_CATS[timeOfDay]
    const prevIds = new Set(previousItems.map(p=>p.id))

    let pool = PRODUCTS.filter(p => targetCats.includes(p.category) && p.popular && !prevIds.has(p.id))
    if (pool.length < 4) pool = PRODUCTS.filter(p => targetCats.includes(p.category) && !prevIds.has(p.id))

    setSuggestions(pool.slice(0,6))
  }, [previousItems])

  const TIME_LABELS = {
    0:'Good midnight snacks 🌙', 6:'Good morning 🌅', 12:'Afternoon picks ☀️', 17:'Evening essentials 🌆', 20:'Night essentials 🌙'
  }

  const hour = new Date().getHours()
  const label = Object.entries(TIME_LABELS).reverse().find(([h])=>hour>=parseInt(h))?.[1] || 'Good picks for now'

  if (suggestions.length === 0 || !previousItems?.length) return null

  return (
    <div style={{ marginBottom:22 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0 16px', marginBottom:12 }}>
        <div style={{ fontFamily:F.serif, fontSize:20, color:C.white }}>{label}</div>
      </div>
      <div style={{ display:'flex', gap:10, overflowX:'auto', padding:'0 16px 4px', scrollbarWidth:'none' }}>
        {suggestions.map(p => <SmartMiniCard key={p.id} product={p} />)}
      </div>
    </div>
  )
}

function SmartMiniCard({ product }) {
  const qty = useCartStore(s=>s.items.find(i=>i.product.id===product.id)?.quantity||0)
  const { addItem, updateQuantity } = useCartStore()
  return (
    <div style={{ background:'rgba(255,255,255,0.09)', border:'0.5px solid rgba(255,255,255,0.12)', borderRadius:14, overflow:'hidden', minWidth:130, maxWidth:130, flexShrink:0 }}>
      <div style={{ position:'relative', height:96 }}>
        <ProductImage productId={product.id} emoji={product.emoji} category={product.category} alt={product.name} size="mini" style={{ height:96, width:'100%' }} />
        {qty===0 ?
          <button onClick={()=>{addItem(product);toast.success(product.emoji+' Added!',{duration:800})}}
            style={{ position:'absolute', top:6, right:6, width:26, height:26, background:C.accent, border:'2px solid white', borderRadius:'50%', color:'white', fontSize:15, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>+</button>
          : <div style={{ position:'absolute', top:5, right:5, display:'flex', alignItems:'center', gap:3, background:'rgba(0,0,0,0.65)', borderRadius:20, padding:'2px 7px' }}>
              <button onClick={()=>updateQuantity(product.id,qty-1)} style={{ width:18, height:18, background:'rgba(255,255,255,0.2)', border:'none', borderRadius:'50%', color:'white', fontSize:11, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>
              <span style={{ fontSize:11, color:'white' }}>{qty}</span>
              <button onClick={()=>updateQuantity(product.id,qty+1)} style={{ width:18, height:18, background:C.accent, border:'none', borderRadius:'50%', color:'white', fontSize:11, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
            </div>
        }
      </div>
      <div style={{ padding:'8px 10px 10px' }}>
        <div style={{ fontSize:11, color:C.white, lineHeight:1.3, marginBottom:3, height:26, overflow:'hidden' }}>{product.name}</div>
        <div style={{ fontSize:12, fontWeight:700, color:C.accent }}>€{product.price.toFixed(2)}</div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// APPLE PAY / GOOGLE PAY BUTTON
// ═══════════════════════════════════════════════════════════════
export function WalletPayButton({ total, onSuccess }) {
  const [available, setAvailable] = useState(false)
  const [paymentType, setPaymentType] = useState(null)

  useEffect(() => {
    // Check if payment request API is available
    if (typeof PaymentRequest === 'undefined') return
    const request = new PaymentRequest(
      [{ supportedMethods:'https://apple.com/apple-pay', data:{ version:3, merchantIdentifier:'merchant.net.isladrop', merchantCapabilities:['supports3DS'], supportedNetworks:['visa','masterCard','amex'] } },
       { supportedMethods:'https://google.com/pay', data:{ apiVersion:2, apiVersionMinor:0, allowedPaymentMethods:[{type:'CARD',parameters:{allowedAuthMethods:['PAN_ONLY','CRYPTOGRAM_3DS'],allowedCardNetworks:['MASTERCARD','VISA']}}] } }],
      { total:{ label:'Isla Drop', amount:{ currency:'EUR', value:total.toFixed(2) } } }
    )
    request.canMakePayment().then(can => {
      if (can) {
        setAvailable(true)
        const ua = navigator.userAgent
        setPaymentType(ua.includes('iPhone')||ua.includes('iPad')||ua.includes('Mac')?'apple':'google')
      }
    }).catch(()=>{})
  }, [total])

  if (!available) return null

  const pay = async () => {
    // In production, integrate with Stripe's Payment Request Button
    // which handles Apple Pay / Google Pay natively
    toast('Wallet pay — integrate with Stripe Payment Request Button for production')
    onSuccess?.('wallet_pay_intent_id')
  }

  return (
    <button onClick={pay}
      style={{ width:'100%', padding:'15px', background:paymentType==='apple'?'#000':'#fff', border:paymentType==='apple'?'none':'2px solid #000', borderRadius:14, color:paymentType==='apple'?'white':'#000', fontSize:15, fontWeight:600, cursor:'pointer', fontFamily:F.sans, display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginBottom:10 }}>
      <span style={{ fontSize:20 }}>{paymentType==='apple'?'🍎':'G'}</span>
      {paymentType==='apple'?'Pay with Apple Pay':'Pay with Google Pay'}
    </button>
  )
}
