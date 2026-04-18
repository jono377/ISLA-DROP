import { useState, useEffect } from 'react'
import { ProductReviews } from './CustomerFeatures_world'
import { usePaginatedOrders, generateLocalizedReceipt } from './CustomerFeatures_final'
import { BackInStockButton, PeopleViewingBadge } from './CustomerFeatures_polish'
import { AllergenInfo, ResponsibleDrinkingBadge, FrequentlyBoughtTogether } from './CustomerFeatures_getir'
import { SmartReorderButton, CaloriesBadge } from './CustomerFeatures_v2'
import { useProductImages, ImageGallery } from './CustomerFeatures_launch'
import { useCartStore, useAuthStore } from '../../lib/store'
import { supabase } from '../../lib/supabase'
import { PRODUCTS, BEST_SELLERS } from '../../lib/products'
import ProductImage from '../shared/ProductImage'
import toast from 'react-hot-toast'

const F = { serif:'DM Serif Display,serif', sans:'DM Sans,sans-serif' }
const C = {
  bg:'#0D3545', accent:'#C4683A', green:'#7EE8A2',
  surface:'rgba(255,255,255,0.07)', border:'rgba(255,255,255,0.1)',
  muted:'rgba(255,255,255,0.45)', white:'white', gold:'#C8A84B',
}

// ── Back button helper ────────────────────────────────────────
function BackBtn({ onBack }) {
  return (
    <button onClick={onBack} style={{ width:36,height:36,background:'rgba(255,255,255,0.1)',border:'0.5px solid rgba(255,255,255,0.18)',borderRadius:'50%',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
    </button>
  )
}

// ── POINT 1: Product Detail Sheet ────────────────────────────

function ProductImageGallery({ product }) {
  const imgs = useProductImages(product.id)
  return <ImageGallery product={product} images={imgs} />
}

export function ProductDetailSheet({ product, onClose }) {
  const qty = useCartStore(s=>s.items.find(i=>i.product.id===product.id)?.quantity??0)
  const { addItem, updateQuantity } = useCartStore()
  const related = PRODUCTS.filter(p=>p.category===product.category&&p.id!==product.id&&p.popular).slice(0,4)

  return (
    <div style={{ position:'fixed',inset:0,zIndex:600,background:'rgba(0,0,0,0.75)',display:'flex',alignItems:'flex-end' }} onClick={onClose}>
      <div style={{ width:'100%',maxWidth:480,margin:'0 auto',background:'#0D3545',borderRadius:'24px 24px 0 0',maxHeight:'92vh',overflowY:'auto' }} onClick={e=>e.stopPropagation()}>
        <div style={{ width:36,height:4,background:'rgba(255,255,255,0.2)',borderRadius:2,margin:'16px auto 0' }}/>
        <button onClick={onClose} style={{ position:'absolute',top:18,right:18,width:32,height:32,borderRadius:'50%',background:'rgba(255,255,255,0.15)',border:'none',color:'white',fontSize:18,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>x</button>
        <ProductImageGallery product={product} />
        <div style={{ padding:'16px 20px 40px' }}>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10 }}>
            <div style={{ flex:1,marginRight:12 }}>
              <div style={{ fontFamily:F.serif,fontSize:24,color:'white',lineHeight:1.2,marginBottom:3 }}>{product.name}</div>
              <div style={{ fontSize:12,color:C.muted,textTransform:'capitalize' }}>{(product.category||'').replace('_',' ')}</div>
            </div>
            <div style={{ fontFamily:F.serif,fontSize:28,color:'#E8A070',fontWeight:700,flexShrink:0 }}>
              {product.price!=null ? '€'+product.price.toFixed(2) : ''}
            </div>
          </div>
          {/* Feature 11: People viewing */}
          <div style={{ marginBottom:10 }}>
            <PeopleViewingBadge productId={product.id} />
          </div>
          {product.age_restricted && (
            <div style={{ display:'inline-flex',alignItems:'center',gap:6,background:'rgba(196,104,58,0.2)',border:'0.5px solid rgba(196,104,58,0.4)',borderRadius:20,padding:'4px 12px',fontSize:11,color:'#E8A070',marginBottom:12 }}>
              Age restricted — ID required at delivery
            </div>
          )}
          <div style={{ fontSize:14,color:'rgba(255,255,255,0.65)',lineHeight:1.7,marginBottom:16 }}>
            {product.description || 'Premium quality delivered to your door anywhere in Ibiza in under 30 minutes. Villas, hotels, beaches and boats all covered.'}
          </div>
          {product.popular && (
            <div style={{ fontSize:12,background:'rgba(200,168,75,0.15)',border:'0.5px solid rgba(200,168,75,0.3)',borderRadius:20,padding:'3px 12px',color:'#C8A84B',fontWeight:600,display:'inline-block',marginBottom:14 }}>
              Popular choice in Ibiza
            </div>
          )}
          {qty===0 ? (
            <button onClick={()=>{ addItem(product); navigator.vibrate&&navigator.vibrate(25); toast.success(product.emoji+' Added!',{duration:900}) }}
              style={{ width:'100%',padding:'16px',background:'#C4683A',border:'none',borderRadius:14,color:'white',fontSize:16,fontWeight:600,cursor:'pointer',fontFamily:F.sans,boxShadow:'0 4px 20px rgba(196,104,58,0.4)',marginBottom:10 }}>
              Add to basket — {product.price!=null ? '€'+product.price.toFixed(2) : ''}
            </button>
          ) : (
            <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:10 }}>
              <button onClick={()=>updateQuantity(product.id,qty-1)} style={{ width:48,height:48,borderRadius:'50%',background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.2)',color:'white',fontSize:22,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>-</button>
              <div style={{ flex:1,textAlign:'center' }}>
                <div style={{ fontSize:24,fontWeight:700,color:'white' }}>{qty}</div>
                <div style={{ fontSize:11,color:C.muted }}>in basket</div>
              </div>
              <button onClick={()=>updateQuantity(product.id,qty+1)} style={{ width:48,height:48,borderRadius:'50%',background:'#C4683A',border:'none',color:'white',fontSize:22,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>+</button>
            </div>
          )}
          <button onClick={()=>{
            const url=window.location.origin+'?p='+product.id
            if(navigator.share) navigator.share({title:'Isla Drop',text:'Check out '+product.name+' on Isla Drop',url}).catch(()=>{})
            else { navigator.clipboard.writeText(url); toast.success('Link copied!') }
          }} style={{ width:'100%',padding:'12px',background:'transparent',border:'0.5px solid rgba(255,255,255,0.2)',borderRadius:12,color:'rgba(255,255,255,0.6)',fontSize:13,cursor:'pointer',fontFamily:F.sans,marginBottom:20 }}>
            Share this product
          </button>
          {related.length>0 && (
            <div>
              <div style={{ fontFamily:F.serif,fontSize:18,color:'white',marginBottom:12 }}>You might also like</div>
              <div style={{ display:'flex',gap:10,overflowX:'auto',scrollbarWidth:'none',paddingBottom:4 }}>
                {related.map(p=>(
                  <div key={p.id} style={{ background:C.surface,border:'0.5px solid '+C.border,borderRadius:12,overflow:'hidden',minWidth:110,flexShrink:0 }}>
                    <div style={{ height:80,display:'flex',alignItems:'center',justifyContent:'center',fontSize:30,background:'rgba(255,255,255,0.04)' }}>{p.emoji}</div>
                    <div style={{ padding:'8px 10px 10px' }}>
                      <div style={{ fontSize:10,color:'white',lineHeight:1.3,marginBottom:4 }}>{p.name}</div>
                      <div style={{ fontSize:12,fontWeight:700,color:'#E8A070' }}>{p.price!=null ? '€'+p.price.toFixed(2) : ''}</div>
                      <button onClick={()=>{ addItem(p); toast.success(p.emoji+' Added!',{duration:800}) }}
                        style={{ width:'100%',marginTop:6,padding:'5px',background:'#C4683A',border:'none',borderRadius:6,color:'white',fontSize:11,fontWeight:600,cursor:'pointer' }}>Add</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── POINT 5: Rating Sheet ─────────────────────────────────────
export function RatingSheet({ order, onClose }) {
  const [oRating, setORating] = useState(0)
  const [dRating, setDRating] = useState(0)
  const [comment, setComment] = useState('')
  const [done, setDone] = useState(false)
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    setSaving(true)
    await supabase.from('order_ratings').upsert({
      order_id:order.id, order_rating:oRating, driver_rating:dRating,
      comment, rated_at:new Date().toISOString()
    },{onConflict:'order_id'}).catch(()=>{})
    setDone(true); setSaving(false)
  }

  const Stars = ({ value, onChange, label }) => (
    <div style={{ marginBottom:18 }}>
      <div style={{ fontSize:13,color:C.muted,marginBottom:8,fontFamily:F.sans }}>{label}</div>
      <div style={{ display:'flex',gap:8 }}>
        {[1,2,3,4,5].map(n=>(
          <button key={n} onClick={()=>onChange(n)}
            style={{ fontSize:28,background:'none',border:'none',cursor:'pointer',opacity:n<=value?1:0.25,transform:n<=value?'scale(1.15)':'scale(1)',transition:'all 0.1s',padding:0 }}>
            *
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div style={{ position:'fixed',inset:0,zIndex:600,background:'rgba(0,0,0,0.75)',display:'flex',alignItems:'flex-end' }} onClick={onClose}>
      <div style={{ width:'100%',maxWidth:480,margin:'0 auto',background:'#0D3545',borderRadius:'24px 24px 0 0',padding:'24px 24px 48px' }} onClick={e=>e.stopPropagation()}>
        <div style={{ width:36,height:4,background:'rgba(255,255,255,0.2)',borderRadius:2,margin:'0 auto 20px' }}/>
        {done ? (
          <div style={{ textAlign:'center',padding:'20px 0' }}>
            <div style={{ fontSize:52,marginBottom:12 }}>🌟</div>
            <div style={{ fontFamily:F.serif,fontSize:24,color:'white',marginBottom:8 }}>Thanks for rating!</div>
            <div style={{ fontSize:13,color:C.muted,marginBottom:24 }}>Your feedback helps us improve</div>
            <button onClick={onClose} style={{ padding:'12px 32px',background:'#C4683A',border:'none',borderRadius:12,color:'white',fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:F.sans }}>Done</button>
          </div>
        ) : (
          <>
            <div style={{ fontFamily:F.serif,fontSize:24,color:'white',marginBottom:4 }}>How was your order?</div>
            <div style={{ fontSize:13,color:C.muted,marginBottom:22 }}>#{order.order_number||'Order'}</div>
            <Stars value={oRating} onChange={setORating} label="Rate your order" />
            <Stars value={dRating} onChange={setDRating} label="Rate your driver" />
            <div style={{ marginBottom:18 }}>
              <div style={{ fontSize:13,color:C.muted,marginBottom:8,fontFamily:F.sans }}>Any comments? (optional)</div>
              <textarea value={comment} onChange={e=>setComment(e.target.value)} rows={3}
                placeholder="Tell us how we can improve..."
                style={{ width:'100%',padding:'11px 14px',background:'rgba(255,255,255,0.08)',border:'0.5px solid rgba(255,255,255,0.2)',borderRadius:10,color:'white',fontSize:13,fontFamily:F.sans,resize:'none',outline:'none',boxSizing:'border-box' }}/>
            </div>
            <button onClick={submit} disabled={saving||oRating===0}
              style={{ width:'100%',padding:'15px',background:oRating>0?'#C4683A':'rgba(255,255,255,0.1)',border:'none',borderRadius:14,color:'white',fontSize:15,fontWeight:600,cursor:oRating>0?'pointer':'default',fontFamily:F.sans }}>
              {saving?'Saving...':'Submit rating'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ── POINT 6: Report Issue + instant credit ───────────────────
export function ReportIssueSheet({ order, onClose }) {
  const { user } = useAuthStore()
  const [step, setStep] = useState('type')
  const [issueType, setIssueType] = useState('')
  const [selected, setSelected] = useState([])
  const [saving, setSaving] = useState(false)
  const [credit, setCredit] = useState(0)

  const ISSUES = [
    { id:'missing', emoji:'📦', label:'Missing items', desc:'Items not in my delivery' },
    { id:'damaged', emoji:'💔', label:'Damaged item', desc:'Arrived broken or spilled' },
    { id:'wrong',   emoji:'🔄', label:'Wrong item',   desc:'Received something different' },
    { id:'quality', emoji:'⭐', label:'Quality issue', desc:'Not as expected' },
    { id:'late',    emoji:'⏱', label:'Very late',     desc:'Much longer than estimated' },
  ]

  const orderItems = order?.order_items || []

  const resolve = async () => {
    setSaving(true)
    const amt = selected.length>0
      ? orderItems.filter(i=>selected.includes(i.product_id)).reduce((s,i)=>s+(i.unit_price||0)*i.quantity,0)
      : (order?.total||0)*0.15
    setCredit(amt)
    await supabase.from('support_tickets').insert({
      user_id:user?.id, order_id:order?.id,
      subject: ISSUES.find(i=>i.id===issueType)?.label||issueType,
      message:'Items: '+selected.join(', '),
      status:'resolved', resolution:'Credit €'+amt.toFixed(2)+' applied.'
    }).catch(()=>{})
    setStep('done'); setSaving(false)
  }

  const Overlay = ({ children }) => (
    <div style={{ position:'fixed',inset:0,zIndex:600,background:'rgba(0,0,0,0.75)',display:'flex',alignItems:'flex-end' }} onClick={onClose}>
      <div style={{ width:'100%',maxWidth:480,margin:'0 auto',background:'#0D3545',borderRadius:'24px 24px 0 0',maxHeight:'80vh',overflowY:'auto',padding:'24px 20px 48px' }} onClick={e=>e.stopPropagation()}>
        <div style={{ width:36,height:4,background:'rgba(255,255,255,0.2)',borderRadius:2,margin:'0 auto 20px' }}/>
        {children}
      </div>
    </div>
  )

  if (step==='done') return (
    <Overlay>
      <div style={{ textAlign:'center',padding:'20px 0' }}>
        <div style={{ fontSize:52,marginBottom:12 }}>✅</div>
        <div style={{ fontFamily:F.serif,fontSize:24,color:'white',marginBottom:6 }}>Problem sorted!</div>
        <div style={{ fontSize:18,color:C.green,fontWeight:700,marginBottom:8 }}>€{credit.toFixed(2)} credit added</div>
        <div style={{ fontSize:13,color:C.muted,marginBottom:24 }}>Applied to your next order automatically</div>
        <button onClick={onClose} style={{ padding:'12px 32px',background:'#C4683A',border:'none',borderRadius:12,color:'white',fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:F.sans }}>Close</button>
      </div>
    </Overlay>
  )

  return (
    <Overlay>
      <div style={{ fontFamily:F.serif,fontSize:22,color:'white',marginBottom:4 }}>Report an issue</div>
      <div style={{ fontSize:13,color:C.muted,marginBottom:18 }}>We will sort it right away</div>
      {step==='type' && ISSUES.map(issue=>(
        <button key={issue.id} onClick={()=>{setIssueType(issue.id);setStep(issue.id==='missing'||issue.id==='wrong'?'items':'confirm')}}
          style={{ display:'flex',alignItems:'center',gap:14,width:'100%',padding:'14px 16px',background:C.surface,border:'0.5px solid '+C.border,borderRadius:12,cursor:'pointer',marginBottom:8,textAlign:'left' }}>
          <span style={{ fontSize:22,flexShrink:0 }}>{issue.emoji}</span>
          <div>
            <div style={{ fontSize:14,fontWeight:600,color:'white',fontFamily:F.sans }}>{issue.label}</div>
            <div style={{ fontSize:11,color:C.muted }}>{issue.desc}</div>
          </div>
        </button>
      ))}
      {step==='items' && (
        <>
          <div style={{ fontSize:13,color:C.muted,marginBottom:12 }}>Which items were affected?</div>
          {orderItems.length===0 && <div style={{ fontSize:13,color:C.muted,marginBottom:16 }}>No items found</div>}
          {orderItems.map(item=>(
            <button key={item.product_id} onClick={()=>setSelected(p=>p.includes(item.product_id)?p.filter(x=>x!==item.product_id):[...p,item.product_id])}
              style={{ display:'flex',alignItems:'center',gap:12,width:'100%',padding:'12px 14px',background:selected.includes(item.product_id)?'rgba(196,104,58,0.2)':C.surface,border:'0.5px solid '+(selected.includes(item.product_id)?C.accent:C.border),borderRadius:10,cursor:'pointer',marginBottom:6,textAlign:'left' }}>
              <div style={{ width:20,height:20,borderRadius:5,border:'2px solid '+(selected.includes(item.product_id)?C.accent:'rgba(255,255,255,0.3)'),background:selected.includes(item.product_id)?C.accent:'transparent',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,color:'white',flexShrink:0 }}>
                {selected.includes(item.product_id)?'v':''}
              </div>
              <span style={{ fontSize:13,color:'white',fontFamily:F.sans }}>{item.product_name||'Item'} x{item.quantity}</span>
            </button>
          ))}
          <button onClick={()=>setStep('confirm')} style={{ width:'100%',marginTop:12,padding:'13px',background:C.accent,border:'none',borderRadius:12,color:'white',fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:F.sans }}>Continue</button>
        </>
      )}
      {step==='confirm' && (
        <>
          <div style={{ background:'rgba(126,232,162,0.1)',border:'0.5px solid rgba(126,232,162,0.25)',borderRadius:14,padding:20,marginBottom:20,textAlign:'center' }}>
            <div style={{ fontSize:30,marginBottom:8 }}>💚</div>
            <div style={{ fontSize:15,fontWeight:700,color:C.green,marginBottom:4 }}>Instant credit incoming</div>
            <div style={{ fontSize:13,color:C.muted }}>No waiting. Credit applied immediately to your account.</div>
          </div>
          <button onClick={resolve} disabled={saving}
            style={{ width:'100%',padding:'15px',background:'#C4683A',border:'none',borderRadius:14,color:'white',fontSize:15,fontWeight:600,cursor:saving?'default':'pointer',fontFamily:F.sans }}>
            {saving?'Processing...':'Get my credit now'}
          </button>
        </>
      )}
    </Overlay>
  )
}

// ── POINT 7: Order History with re-order ─────────────────────
export function OrderHistoryView({ onBack, lang='en' }) {
  const { user } = useAuthStore()
  const { addItem } = useCartStore()
  const { orders, loading, hasMore, loadMore } = usePaginatedOrders(user?.id, 10)

  const reorder = (order) => {
    const items = order.order_items||[]
    if(items.length===0){toast.error('No items found');return}
    items.forEach(item=>{
      const p=PRODUCTS.find(p=>p.id===item.product_id)
      if(p) for(let i=0;i<item.quantity;i++) addItem(p)
    })
    navigator.vibrate&&navigator.vibrate([20,50,20])
    toast.success('Items added to basket!',{duration:2000})
    onBack()
  }

  const statusCol = s=>s==='delivered'?'#7EE8A2':s==='cancelled'?'#F09595':'#C8A84B'

  return (
    <div style={{ minHeight:'100vh',background:'linear-gradient(170deg,#0A2A38 0%,#0D3545 100%)',paddingBottom:100 }}>
      <div style={{ background:'linear-gradient(135deg,#0D3B4A,#1A5263)',padding:'16px 16px 20px',position:'sticky',top:0,zIndex:50 }}>
        <div style={{ display:'flex',alignItems:'center',gap:12 }}>
          <BackBtn onBack={onBack}/>
          <div style={{ fontFamily:F.serif,fontSize:24,color:'white' }}>Order history</div>
        </div>
      </div>
      <div style={{ padding:16 }}>
        {loading&&<div style={{ textAlign:'center',padding:40,color:C.muted }}>Loading orders...</div>}
        {!loading&&!user&&<div style={{ textAlign:'center',padding:40 }}><div style={{ fontFamily:F.serif,fontSize:20,color:'white' }}>Sign in to see orders</div></div>}
        {!loading&&user&&orders.length===0&&(
          <div style={{ textAlign:'center',padding:40 }}>
            <div style={{ fontSize:40,marginBottom:12 }}>📦</div>
            <div style={{ fontFamily:F.serif,fontSize:20,color:'white',marginBottom:8 }}>No orders yet</div>
            <div style={{ fontSize:13,color:C.muted }}>Your orders will appear here</div>
          </div>
        )}
        {orders.map(order=>(
          <div key={order.id} style={{ background:C.surface,border:'0.5px solid '+C.border,borderRadius:16,padding:16,marginBottom:12 }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10 }}>
              <div>
                <div style={{ fontSize:14,fontWeight:600,color:'white',fontFamily:F.sans }}>Order #{order.order_number||order.id?.slice(0,8)}</div>
                <div style={{ fontSize:11,color:C.muted,marginTop:2 }}>{new Date(order.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</div>
              </div>
              <span style={{ fontSize:11,fontWeight:700,color:statusCol(order.status),background:'rgba(0,0,0,0.3)',padding:'3px 10px',borderRadius:20 }}>
                {order.status==='delivered'?'Delivered':order.status==='cancelled'?'Cancelled':'Processing'}
              </span>
            </div>
            <div style={{ marginBottom:10 }}>
              {(order.order_items||[]).slice(0,3).map((item,i)=>(
                <div key={i} style={{ fontSize:12,color:'rgba(255,255,255,0.65)',marginBottom:2 }}>
                  {item.product_name||'Item'} x{item.quantity}
                </div>
              ))}
              {(order.order_items||[]).length>3&&<div style={{ fontSize:11,color:'rgba(255,255,255,0.35)' }}>+{(order.order_items||[]).length-3} more</div>}
            </div>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
              <div style={{ fontSize:14,fontWeight:600,color:'#E8A070' }}>€{order.total?.toFixed(2)||'0.00'}</div>
              {order.status==='delivered'&&(
                <SmartReorderButton order={order} onDone={onBack} />
              )}
            </div>
          </div>
        ))}
        {/* Feature 13: Load more */}
        {hasMore && !loading && (
          <button onClick={loadMore}
            style={{ width:'100%',padding:'13px',background:'rgba(255,255,255,0.07)',border:'0.5px solid rgba(255,255,255,0.12)',borderRadius:12,color:'rgba(255,255,255,0.6)',fontSize:13,cursor:'pointer',fontFamily:'DM Sans,sans-serif',marginTop:4 }}>
            Load more orders
          </button>
        )}
        {loading && orders.length > 0 && (
          <div style={{ textAlign:'center',padding:'16px',color:'rgba(255,255,255,0.4)',fontSize:13 }}>Loading...</div>
        )}
      </div>
    </div>
  )
}

// ── POINT 9: Saved Addresses ─────────────────────────────────
export function SavedAddressesView({ onBack }) {
  const { user } = useAuthStore()
  const cart = useCartStore()
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [label, setLabel] = useState('')
  const [addr, setAddr] = useState('')

  useEffect(()=>{
    if(!user){setLoading(false);return}
    supabase.from('saved_addresses').select('*').eq('user_id',user.id).order('created_at',{ascending:false})
      .then(({data})=>{setAddresses(data||[]);setLoading(false)}).catch(()=>setLoading(false))
  },[user])

  const save = async () => {
    if(!addr.trim()) return
    const {data} = await supabase.from('saved_addresses').insert({user_id:user.id,label:label||addr.split(',')[0],address:addr}).select().single()
    if(data) setAddresses(p=>[data,...p])
    setAdding(false); setLabel(''); setAddr('')
    toast.success('Address saved!')
  }

  const remove = async (id) => {
    await supabase.from('saved_addresses').delete().eq('id',id)
    setAddresses(p=>p.filter(a=>a.id!==id))
  }

  const select = (a) => {
    cart.setDeliveryAddress&&cart.setDeliveryAddress(a.address)
    toast.success(a.label+' selected as delivery address')
    onBack()
  }

  const EMOJIS = {Home:'🏠',Villa:'🏡',Hotel:'🏨',Beach:'🏖',Boat:'⛵',Work:'💼'}

  return (
    <div style={{ minHeight:'100vh',background:'linear-gradient(170deg,#0A2A38 0%,#0D3545 100%)',paddingBottom:100 }}>
      <div style={{ background:'linear-gradient(135deg,#0D3B4A,#1A5263)',padding:'16px 16px 20px',position:'sticky',top:0,zIndex:50 }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
          <div style={{ display:'flex',alignItems:'center',gap:12 }}>
            <BackBtn onBack={onBack}/>
            <div style={{ fontFamily:F.serif,fontSize:24,color:'white' }}>Saved addresses</div>
          </div>
          <button onClick={()=>setAdding(true)} style={{ padding:'8px 14px',background:'rgba(196,104,58,0.3)',border:'0.5px solid rgba(196,104,58,0.5)',borderRadius:20,color:'#E8A070',fontSize:12,cursor:'pointer',fontFamily:F.sans,fontWeight:600 }}>+ Add</button>
        </div>
      </div>
      <div style={{ padding:16 }}>
        {adding && (
          <div style={{ background:C.surface,border:'0.5px solid '+C.border,borderRadius:16,padding:16,marginBottom:16 }}>
            <div style={{ fontSize:14,fontWeight:600,color:'white',marginBottom:12,fontFamily:F.sans }}>New address</div>
            {[['Label','e.g. Villa Blanca',label,setLabel],['Address','Street, Ibiza',addr,setAddr]].map(([lbl,ph,val,setter])=>(
              <div key={lbl} style={{ marginBottom:10 }}>
                <div style={{ fontSize:11,color:C.muted,marginBottom:6 }}>{lbl}</div>
                <input value={val} onChange={e=>setter(e.target.value)} placeholder={ph}
                  style={{ width:'100%',padding:'11px 14px',background:'rgba(255,255,255,0.08)',border:'0.5px solid rgba(255,255,255,0.2)',borderRadius:10,color:'white',fontSize:13,fontFamily:F.sans,outline:'none',boxSizing:'border-box' }}/>
              </div>
            ))}
            <div style={{ display:'flex',gap:8,marginTop:4 }}>
              <button onClick={save} disabled={!addr.trim()} style={{ flex:1,padding:'12px',background:addr.trim()?'#C4683A':'rgba(255,255,255,0.1)',border:'none',borderRadius:10,color:'white',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:F.sans }}>Save</button>
              <button onClick={()=>setAdding(false)} style={{ flex:1,padding:'12px',background:'transparent',border:'0.5px solid rgba(255,255,255,0.2)',borderRadius:10,color:C.muted,fontSize:13,cursor:'pointer',fontFamily:F.sans }}>Cancel</button>
            </div>
          </div>
        )}
        {loading&&<div style={{ textAlign:'center',padding:40,color:C.muted }}>Loading...</div>}
        {!loading&&addresses.length===0&&!adding&&(
          <div style={{ textAlign:'center',padding:40 }}>
            <div style={{ fontSize:40,marginBottom:12 }}>📍</div>
            <div style={{ fontFamily:F.serif,fontSize:20,color:'white',marginBottom:8 }}>No saved addresses</div>
            <div style={{ fontSize:13,color:C.muted,marginBottom:20 }}>Save your villa, hotel or favourite beach for faster checkout</div>
            <button onClick={()=>setAdding(true)} style={{ padding:'12px 24px',background:'#C4683A',border:'none',borderRadius:12,color:'white',fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:F.sans }}>Add address</button>
          </div>
        )}
        {addresses.map(a=>(
          <div key={a.id} style={{ background:C.surface,border:'0.5px solid '+C.border,borderRadius:14,padding:'14px 16px',marginBottom:10,display:'flex',alignItems:'center',gap:12 }}>
            <span style={{ fontSize:24,flexShrink:0 }}>{EMOJIS[a.label]||'📍'}</span>
            <div style={{ flex:1,cursor:'pointer' }} onClick={()=>select(a)}>
              <div style={{ fontSize:14,fontWeight:600,color:'white',fontFamily:F.sans }}>{a.label}</div>
              <div style={{ fontSize:12,color:C.muted,marginTop:2 }}>{a.address}</div>
            </div>
            <button onClick={()=>remove(a.id)} style={{ background:'none',border:'none',color:'rgba(255,255,255,0.3)',cursor:'pointer',fontSize:20,flexShrink:0 }}>x</button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── POINT 14: Edit Profile ────────────────────────────────────
export function EditProfileView({ onBack }) {
  const { user, profile, setProfile } = useAuthStore()
  const [name, setName] = useState(profile?.full_name||'')
  const [phone, setPhone] = useState(profile?.phone||'')
  const [birthday, setBirthday] = useState(profile?.birthday||'')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if(!user) return
    setSaving(true)
    const updates = {full_name:name, phone, birthday:birthday||null}
    const {data} = await supabase.from('profiles').update(updates).eq('id',user.id).select().single()
    if(data) setProfile(data)
    toast.success('Profile updated!')
    setSaving(false)
    onBack()
  }

  return (
    <div style={{ minHeight:'100vh',background:'linear-gradient(170deg,#0A2A38 0%,#0D3545 100%)',paddingBottom:100 }}>
      <div style={{ background:'linear-gradient(135deg,#0D3B4A,#1A5263)',padding:'16px 16px 20px',position:'sticky',top:0,zIndex:50 }}>
        <div style={{ display:'flex',alignItems:'center',gap:12 }}>
          <BackBtn onBack={onBack}/>
          <div style={{ fontFamily:F.serif,fontSize:24,color:'white' }}>Edit profile</div>
        </div>
      </div>
      <div style={{ padding:'24px 20px' }}>
        <div style={{ textAlign:'center',marginBottom:28 }}>
          <div style={{ width:80,height:80,borderRadius:'50%',background:'linear-gradient(135deg,#C4683A,#E8854A)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:32,margin:'0 auto 12px',fontWeight:700,color:'white' }}>
            {(name||user?.email||'U')[0].toUpperCase()}
          </div>
          <div style={{ fontSize:12,color:C.muted }}>{user?.email}</div>
        </div>
        {[['Full name','Your name',name,setName,'text'],['Phone','+34 000 000 000',phone,setPhone,'tel']].map(([lbl,ph,val,setter,type])=>(
          <div key={lbl} style={{ marginBottom:16 }}>
            <div style={{ fontSize:12,color:C.muted,marginBottom:8,textTransform:'uppercase',letterSpacing:'0.5px',fontFamily:F.sans }}>{lbl}</div>
            <input type={type} value={val} onChange={e=>setter(e.target.value)} placeholder={ph}
              style={{ width:'100%',padding:'14px 16px',background:'rgba(255,255,255,0.08)',border:'0.5px solid rgba(255,255,255,0.2)',borderRadius:12,color:'white',fontSize:15,fontFamily:F.sans,outline:'none',boxSizing:'border-box' }}/>
          </div>
        ))}
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.5px', fontFamily:'DM Sans,sans-serif' }}>Birthday (optional)</div>
          <input type="date" value={birthday} onChange={e=>setBirthday(e.target.value)}
            style={{ width:'100%', padding:'14px 16px', background:'rgba(255,255,255,0.08)', border:'0.5px solid rgba(255,255,255,0.2)', borderRadius:12, color:'white', fontSize:15, fontFamily:'DM Sans,sans-serif', outline:'none', boxSizing:'border-box', colorScheme:'dark' }}/>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', marginTop:6 }}>We send you a birthday gift every year 🎂</div>
        </div>
        <button onClick={save} disabled={saving}
          style={{ width:'100%',padding:'16px',background:'#C4683A',border:'none',borderRadius:14,color:'white',fontSize:15,fontWeight:600,cursor:'pointer',fontFamily:F.sans,marginTop:8 }}>
          {saving?'Saving...':'Save changes'}
        </button>
      </div>
    </div>
  )
}

// ── POINT 15: PWA Install Prompt ─────────────────────────────
export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [show, setShow] = useState(false)

  useEffect(()=>{
    const handler = e => { e.preventDefault(); setDeferredPrompt(e); setShow(true) }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  },[])

  if(!show) return null
  return (
    <div style={{ position:'fixed',bottom:80,left:16,right:16,maxWidth:448,margin:'0 auto',background:'linear-gradient(135deg,#0D3B4A,#1A5263)',border:'0.5px solid rgba(43,122,139,0.5)',borderRadius:16,padding:'16px 18px',zIndex:200,display:'flex',alignItems:'center',gap:14,boxShadow:'0 8px 32px rgba(0,0,0,0.3)' }}>
      <div style={{ width:44,height:44,borderRadius:12,background:'#C4683A',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:22 }}>🌴</div>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:14,fontWeight:600,color:'white',marginBottom:2,fontFamily:F.sans }}>Add Isla Drop to Home Screen</div>
        <div style={{ fontSize:11,color:'rgba(255,255,255,0.5)' }}>Faster ordering, instant access</div>
      </div>
      <div style={{ display:'flex',flexDirection:'column',gap:6,flexShrink:0 }}>
        <button onClick={async()=>{ if(deferredPrompt){await deferredPrompt.prompt();setShow(false)} }}
          style={{ padding:'7px 14px',background:'#C4683A',border:'none',borderRadius:10,color:'white',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:F.sans }}>Install</button>
        <button onClick={()=>setShow(false)}
          style={{ padding:'7px 14px',background:'transparent',border:'none',color:'rgba(255,255,255,0.4)',fontSize:11,cursor:'pointer',fontFamily:F.sans }}>Not now</button>
      </div>
    </div>
  )
}
