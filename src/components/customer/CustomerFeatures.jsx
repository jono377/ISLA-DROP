import { useState, useEffect, useCallback, useRef } from 'react'
import { useCartStore, useAuthStore } from '../../lib/store'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import ProductImage from '../shared/ProductImage'

// ── Design tokens ─────────────────────────────────────────────
const C = {
  bg: 'linear-gradient(170deg,#0A2A38 0%,#0D3545 35%,#1A5060 70%,#2B7A8B 100%)',
  card: 'rgba(255,255,255,0.92)', cardBorder: 'rgba(255,255,255,0.5)',
  surface: 'rgba(255,255,255,0.07)', surfaceB: 'rgba(255,255,255,0.12)',
  accent: '#C4683A', accentDim: 'rgba(196,104,58,0.18)',
  green: '#7EE8A2', greenDim: 'rgba(126,232,162,0.15)',
  text: '#2A2318', muted: 'rgba(255,255,255,0.45)', mutedDark: '#7A6E60',
  white: 'white', border: 'rgba(255,255,255,0.1)',
  teal: '#2B7A8B', tealDim: 'rgba(43,122,139,0.2)',
}
const F = { serif: 'DM Serif Display,serif', sans: 'DM Sans,sans-serif' }

// ── Skeleton loader ───────────────────────────────────────────
function Skeleton({ width='100%', height=20, radius=8, style={} }) {
  return (
    <div style={{ width, height, borderRadius:radius, background:'rgba(255,255,255,0.08)', animation:'shimmer 1.4s ease-in-out infinite', ...style }}>
      <style>{`@keyframes shimmer{0%,100%{opacity:0.4}50%{opacity:0.9}}`}</style>
    </div>
  )
}
export function ProductCardSkeleton() {
  return (
    <div style={{ background:'rgba(255,255,255,0.07)', borderRadius:14, overflow:'hidden', minWidth:134, maxWidth:134, flexShrink:0 }}>
      <Skeleton height={100} radius={0} />
      <div style={{ padding:'8px 10px 10px' }}>
        <Skeleton height={12} style={{ marginBottom:6 }} />
        <Skeleton height={14} width="50%" />
      </div>
    </div>
  )
}
export function OrderCardSkeleton() {
  return (
    <div style={{ background:C.surface, borderRadius:14, padding:16, marginBottom:10 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
        <Skeleton height={16} width="40%" />
        <Skeleton height={16} width="20%" />
      </div>
      <Skeleton height={12} style={{ marginBottom:6 }} />
      <Skeleton height={12} width="60%" />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// ORDER HISTORY
// ═══════════════════════════════════════════════════════════════
export function OrderHistory({ onClose, onReorder }) {
  const { user } = useAuthStore()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [rating, setRating] = useState({})
  const { addItem } = useCartStore()

  useEffect(() => {
    if (!user) { setLoading(false); return }
    supabase.from('orders')
      .select('*, order_items(quantity, unit_price, products(id,name,emoji,price,category))')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30)
      .then(({ data }) => { setOrders(data || []); setLoading(false) })
  }, [user])

  const submitRating = async (orderId, stars, comment) => {
    await supabase.from('order_ratings').upsert({
      order_id: orderId, customer_id: user.id, rating: stars, comment
    }, { onConflict: 'order_id,customer_id' })
    setRating(p => ({ ...p, [orderId]: { stars, comment, submitted: true } }))
    toast.success('Thanks for your feedback!')
  }

  const reorder = (order) => {
    const items = order.order_items || []
    items.forEach(item => { if (item.products) addItem(item.products) })
    toast.success('Added ' + items.length + ' items to basket!')
    onClose()
  }

  const statusColor = s => s==='delivered'?C.green:s==='cancelled'?'#F09595':C.accent
  const statusEmoji = s => s==='delivered'?'✅':s==='cancelled'?'❌':'🛵'

  return (
    <div style={{ position:'fixed', inset:0, zIndex:500, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'flex-end' }} onClick={onClose}>
      <div style={{ width:'100%', maxWidth:480, margin:'0 auto', background:'#0D3545', borderRadius:'24px 24px 0 0', maxHeight:'88vh', overflowY:'auto' }} onClick={e=>e.stopPropagation()}>
        <div style={{ padding:'20px 20px 0' }}>
          <div style={{ width:36, height:4, background:'rgba(255,255,255,0.2)', borderRadius:2, margin:'0 auto 20px' }} />
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
            <div style={{ fontFamily:F.serif, fontSize:24, color:C.white }}>Order history</div>
            <button onClick={onClose} style={{ background:'none', border:'none', color:C.muted, fontSize:22, cursor:'pointer' }}>×</button>
          </div>
        </div>

        <div style={{ padding:'0 20px 40px' }}>
          {!user ? (
            <div style={{ textAlign:'center', padding:'40px 0' }}>
              <div style={{ fontSize:40, marginBottom:12 }}>👤</div>
              <div style={{ fontFamily:F.serif, fontSize:20, color:C.white, marginBottom:8 }}>Sign in to see orders</div>
              <div style={{ fontSize:13, color:C.muted }}>Your order history will appear here</div>
            </div>
          ) : loading ? (
            [1,2,3].map(i => <OrderCardSkeleton key={i} />)
          ) : orders.length === 0 ? (
            <div style={{ textAlign:'center', padding:'40px 0' }}>
              <div style={{ fontSize:40, marginBottom:12 }}>📦</div>
              <div style={{ fontFamily:F.serif, fontSize:20, color:C.white, marginBottom:8 }}>No orders yet</div>
              <div style={{ fontSize:13, color:C.muted }}>Your first order will appear here</div>
            </div>
          ) : orders.map(order => {
            const r = rating[order.id]
            const isDelivered = order.status === 'delivered'
            const hasRated = r?.submitted
            return (
              <div key={order.id} style={{ background:C.surface, borderRadius:14, marginBottom:12, overflow:'hidden', border:'0.5px solid '+C.border }}>
                <div style={{ padding:'14px 16px', cursor:'pointer' }} onClick={() => setSelected(selected===order.id?null:order.id)}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600, color:C.white }}>Order #{order.order_number || order.id.slice(0,6)}</div>
                      <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>
                        {new Date(order.created_at).toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                      <span style={{ fontSize:11, color:statusColor(order.status), fontWeight:700 }}>{statusEmoji(order.status)} {order.status}</span>
                      <span style={{ fontSize:15, fontWeight:700, color:C.accent }}>€{order.total?.toFixed(2)}</span>
                    </div>
                  </div>
                  <div style={{ fontSize:12, color:C.muted }}>
                    {(order.order_items||[]).slice(0,3).map(i=>i.products?.emoji+' '+i.products?.name).join(' · ')}
                    {(order.order_items||[]).length > 3 && ' +' + ((order.order_items||[]).length-3) + ' more'}
                  </div>
                </div>

                {selected === order.id && (
                  <div style={{ padding:'0 16px 16px', borderTop:'0.5px solid '+C.border }}>
                    <div style={{ paddingTop:12 }}>
                      {(order.order_items||[]).map((item,i) => (
                        <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:6, color:'rgba(255,255,255,0.8)' }}>
                          <span>{item.products?.emoji} {item.products?.name} × {item.quantity}</span>
                          <span>€{((item.unit_price||item.products?.price||0)*item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                      <div style={{ borderTop:'0.5px solid '+C.border, paddingTop:8, marginTop:8, display:'flex', justifyContent:'space-between', fontSize:14, fontWeight:700, color:C.white }}>
                        <span>Total</span><span style={{ color:C.accent }}>€{order.total?.toFixed(2)}</span>
                      </div>
                    </div>

                    <div style={{ display:'flex', gap:8, marginTop:12 }}>
                      <button onClick={() => reorder(order)}
                        style={{ flex:1, padding:'10px', background:C.accentDim, border:'0.5px solid rgba(196,104,58,0.4)', borderRadius:10, color:C.accent, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:F.sans }}>
                        🔄 Reorder
                      </button>
                      {isDelivered && !hasRated && (
                        <button onClick={() => setRating(p=>({...p,[order.id]:{stars:0,comment:'',open:true}}))}
                          style={{ flex:1, padding:'10px', background:C.greenDim, border:'0.5px solid rgba(126,232,162,0.3)', borderRadius:10, color:C.green, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:F.sans }}>
                          ⭐ Rate order
                        </button>
                      )}
                      {hasRated && <div style={{ flex:1, padding:'10px', textAlign:'center', fontSize:12, color:C.green }}>{'★'.repeat(r.stars)} Rated!</div>}
                    </div>

                    {r?.open && !r?.submitted && (
                      <div style={{ marginTop:12, padding:14, background:C.surfaceB, borderRadius:12 }}>
                        <div style={{ fontSize:13, color:C.white, marginBottom:10 }}>How was your order?</div>
                        <div style={{ display:'flex', gap:8, marginBottom:10 }}>
                          {[1,2,3,4,5].map(s => (
                            <button key={s} onClick={() => setRating(p=>({...p,[order.id]:{...p[order.id],stars:s}}))}
                              style={{ fontSize:24, background:'none', border:'none', cursor:'pointer', opacity:r.stars>=s?1:0.3 }}>★</button>
                          ))}
                        </div>
                        <textarea value={r.comment||''} onChange={e=>setRating(p=>({...p,[order.id]:{...p[order.id],comment:e.target.value}}))}
                          placeholder="Any comments? (optional)" rows={2}
                          style={{ width:'100%', padding:'8px 10px', background:'rgba(255,255,255,0.08)', border:'0.5px solid '+C.border, borderRadius:8, color:C.white, fontSize:13, resize:'none', fontFamily:F.sans, boxSizing:'border-box', marginBottom:8, outline:'none' }} />
                        <button onClick={() => submitRating(order.id, r.stars, r.comment)}
                          disabled={!r.stars}
                          style={{ width:'100%', padding:'10px', background:r.stars?C.accent:'rgba(255,255,255,0.1)', border:'none', borderRadius:8, color:'white', fontSize:13, fontWeight:600, cursor:r.stars?'pointer':'default', fontFamily:F.sans }}>
                          Submit rating
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// SAVED ADDRESSES
// ═══════════════════════════════════════════════════════════════
export function SavedAddresses({ onClose, onSelect }) {
  const { user } = useAuthStore()
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ label:'', address:'' })

  useEffect(() => {
    if (!user) { setLoading(false); return }
    supabase.from('saved_addresses')
      .select('*').eq('user_id', user.id).order('is_default',{ascending:false})
      .then(({ data }) => { setAddresses(data || []); setLoading(false) })
  }, [user])

  const save = async () => {
    if (!form.address.trim()) return
    const { data } = await supabase.from('saved_addresses').insert({
      user_id: user.id, label: form.label || 'Address', address: form.address.trim(), is_default: addresses.length === 0
    }).select().single()
    if (data) setAddresses(p => [...p, data])
    setAdding(false); setForm({ label:'', address:'' })
  }

  const remove = async (id) => {
    await supabase.from('saved_addresses').delete().eq('id', id)
    setAddresses(p => p.filter(a=>a.id!==id))
  }

  const setDefault = async (id) => {
    await supabase.from('saved_addresses').update({ is_default:false }).eq('user_id', user.id)
    await supabase.from('saved_addresses').update({ is_default:true }).eq('id', id)
    setAddresses(p => p.map(a => ({...a, is_default: a.id===id})))
  }

  const ICONS = { Home:'🏠', Hotel:'🏨', Beach:'🏖️', Boat:'⛵', Villa:'🏡', Office:'🏢', Other:'📍' }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:500, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'flex-end' }} onClick={onClose}>
      <div style={{ width:'100%', maxWidth:480, margin:'0 auto', background:'#0D3545', borderRadius:'24px 24px 0 0', maxHeight:'85vh', overflowY:'auto' }} onClick={e=>e.stopPropagation()}>
        <div style={{ padding:'20px 20px 40px' }}>
          <div style={{ width:36, height:4, background:'rgba(255,255,255,0.2)', borderRadius:2, margin:'0 auto 20px' }} />
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
            <div style={{ fontFamily:F.serif, fontSize:24, color:C.white }}>Saved addresses</div>
            <button onClick={onClose} style={{ background:'none', border:'none', color:C.muted, fontSize:22, cursor:'pointer' }}>×</button>
          </div>

          {!user ? (
            <div style={{ textAlign:'center', padding:'30px 0', color:C.muted }}>Sign in to save addresses</div>
          ) : loading ? [1,2].map(i=><Skeleton key={i} height={64} radius={12} style={{marginBottom:8}} />) : (
            <>
              {addresses.map(a => (
                <div key={a.id} style={{ background:C.surface, borderRadius:12, padding:'14px 16px', marginBottom:8, display:'flex', alignItems:'center', gap:12, border:'0.5px solid '+(a.is_default?'rgba(196,104,58,0.4)':C.border) }}>
                  <span style={{ fontSize:24 }}>{ICONS[a.label] || '📍'}</span>
                  <div style={{ flex:1, cursor:'pointer' }} onClick={() => { onSelect?.(a.address); onClose() }}>
                    <div style={{ fontSize:13, fontWeight:600, color:C.white }}>{a.label}</div>
                    <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{a.address}</div>
                    {a.is_default && <div style={{ fontSize:10, color:C.accent, marginTop:2 }}>Default</div>}
                  </div>
                  <div style={{ display:'flex', gap:6 }}>
                    {!a.is_default && <button onClick={()=>setDefault(a.id)} style={{ fontSize:10, color:C.muted, background:'none', border:'0.5px solid rgba(255,255,255,0.2)', borderRadius:6, padding:'4px 8px', cursor:'pointer' }}>Set default</button>}
                    <button onClick={()=>remove(a.id)} style={{ fontSize:16, color:C.muted, background:'none', border:'none', cursor:'pointer' }}>×</button>
                  </div>
                </div>
              ))}

              {adding ? (
                <div style={{ background:C.surface, borderRadius:12, padding:16, border:'0.5px solid rgba(196,104,58,0.3)' }}>
                  <div style={{ marginBottom:10 }}>
                    <div style={{ fontSize:11, color:C.muted, marginBottom:6 }}>Label</div>
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:10 }}>
                      {Object.keys(ICONS).map(k => (
                        <button key={k} onClick={()=>setForm(p=>({...p,label:k}))}
                          style={{ padding:'5px 10px', borderRadius:20, border:'0.5px solid '+(form.label===k?C.accent:C.border), background:form.label===k?C.accentDim:'transparent', color:form.label===k?C.accent:C.muted, fontSize:12, cursor:'pointer' }}>
                          {ICONS[k]} {k}
                        </button>
                      ))}
                    </div>
                    <input value={form.address} onChange={e=>setForm(p=>({...p,address:e.target.value}))}
                      placeholder="Full address, villa name or hotel..." autoFocus
                      style={{ width:'100%', padding:'11px 14px', background:'rgba(255,255,255,0.08)', border:'0.5px solid rgba(255,255,255,0.2)', borderRadius:10, color:C.white, fontSize:13, fontFamily:F.sans, outline:'none', boxSizing:'border-box' }} />
                  </div>
                  <div style={{ display:'flex', gap:8 }}>
                    <button onClick={save} style={{ flex:1, padding:'11px', background:C.accent, border:'none', borderRadius:10, color:'white', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:F.sans }}>Save address</button>
                    <button onClick={()=>setAdding(false)} style={{ padding:'11px 16px', background:'rgba(255,255,255,0.08)', border:'none', borderRadius:10, color:C.muted, fontSize:13, cursor:'pointer' }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={()=>setAdding(true)}
                  style={{ width:'100%', padding:'13px', background:C.accentDim, border:'0.5px solid rgba(196,104,58,0.3)', borderRadius:12, color:C.accent, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:F.sans }}>
                  + Add new address
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// HELP & SUPPORT
// ═══════════════════════════════════════════════════════════════
export function HelpSupport({ onClose }) {
  const { user } = useAuthStore()
  const [tab, setTab] = useState('faq')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)

  const FAQS = [
    { q:'How long does delivery take?', a:'Most orders arrive within 15–30 minutes depending on your location in Ibiza. You can track your driver in real time once the order is picked up.' },
    { q:'What areas do you deliver to?', a:'We deliver across Ibiza island including Ibiza Town, San Antonio, Playa den Bossa, Santa Eulalia, Talamanca, Marina Botafoch and surrounding areas.' },
    { q:'Is there a minimum order?', a:'Minimum orders vary by zone, typically €15–€25. Any minimum is shown at checkout based on your delivery address.' },
    { q:'Do you deliver 24/7?', a:'Yes! Isla Drop operates around the clock, every day of the year. Perfect for late-night Ibiza needs.' },
    { q:'Can I pay with cash?', a:'We accept all major cards via Stripe. Cash on delivery is available for selected orders — select at checkout.' },
    { q:'Age-restricted products?', a:'For alcohol and tobacco you must be 18+. Our driver will verify your ID at the door. Have a valid ID ready.' },
    { q:'Can I cancel my order?', a:'You can cancel within 2 minutes of placing your order. After that, contact us immediately via the chat below.' },
    { q:'Something wrong with my order?', a:'If an item is missing or damaged, use the "Contact us" tab to raise a ticket and we\'ll make it right immediately.' },
  ]

  const submitTicket = async () => {
    if (!subject.trim() || !message.trim()) return
    setSending(true)
    await supabase.from('support_tickets').insert({
      user_id: user?.id, subject, message, status:'open', priority:'normal'
    })
    setSent(true); setSending(false)
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:500, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'flex-end' }} onClick={onClose}>
      <div style={{ width:'100%', maxWidth:480, margin:'0 auto', background:'#0D3545', borderRadius:'24px 24px 0 0', maxHeight:'88vh', overflowY:'auto' }} onClick={e=>e.stopPropagation()}>
        <div style={{ padding:'20px 20px 40px' }}>
          <div style={{ width:36, height:4, background:'rgba(255,255,255,0.2)', borderRadius:2, margin:'0 auto 20px' }} />
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
            <div style={{ fontFamily:F.serif, fontSize:24, color:C.white }}>Help & support</div>
            <button onClick={onClose} style={{ background:'none', border:'none', color:C.muted, fontSize:22, cursor:'pointer' }}>×</button>
          </div>

          <div style={{ display:'flex', gap:6, marginBottom:20, background:'rgba(255,255,255,0.06)', borderRadius:12, padding:4 }}>
            {[['faq','FAQs'],['contact','Contact us']].map(([k,l]) => (
              <button key={k} onClick={()=>setTab(k)}
                style={{ flex:1, padding:'9px', borderRadius:9, border:'none', background:tab===k?C.accent:'transparent', color:tab===k?'white':C.muted, fontSize:13, fontWeight:tab===k?600:400, cursor:'pointer', fontFamily:F.sans }}>
                {l}
              </button>
            ))}
          </div>

          {tab === 'faq' ? FAQS.map((faq,i) => (
            <FaqItem key={i} q={faq.q} a={faq.a} />
          )) : sent ? (
            <div style={{ textAlign:'center', padding:'40px 0' }}>
              <div style={{ fontSize:48, marginBottom:16 }}>✅</div>
              <div style={{ fontFamily:F.serif, fontSize:22, color:C.white, marginBottom:8 }}>Message sent!</div>
              <div style={{ fontSize:13, color:C.muted, marginBottom:24 }}>We typically respond within 30 minutes during operating hours.</div>
              <button onClick={onClose} style={{ padding:'12px 32px', background:C.accent, border:'none', borderRadius:12, color:'white', fontSize:14, cursor:'pointer', fontFamily:F.sans }}>Close</button>
            </div>
          ) : (
            <>
              <div style={{ marginBottom:10 }}>
                <div style={{ fontSize:11, color:C.muted, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.5px' }}>Subject</div>
                <select value={subject} onChange={e=>setSubject(e.target.value)}
                  style={{ width:'100%', padding:'11px 14px', background:'rgba(255,255,255,0.08)', border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:10, color:C.white, fontSize:13, fontFamily:F.sans, outline:'none' }}>
                  <option value="" style={{background:'#0D3545'}}>Select a topic...</option>
                  {['Missing item','Wrong item delivered','Order not arrived','Driver issue','Payment problem','App not working','Other'].map(s => (
                    <option key={s} value={s} style={{background:'#0D3545'}}>{s}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:11, color:C.muted, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.5px' }}>Message</div>
                <textarea value={message} onChange={e=>setMessage(e.target.value)} rows={5}
                  placeholder="Tell us what happened..."
                  style={{ width:'100%', padding:'11px 14px', background:'rgba(255,255,255,0.08)', border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:10, color:C.white, fontSize:13, fontFamily:F.sans, resize:'none', outline:'none', boxSizing:'border-box' }} />
              </div>
              <button onClick={submitTicket} disabled={sending||!subject||!message}
                style={{ width:'100%', padding:'14px', background:subject&&message?C.accent:'rgba(255,255,255,0.1)', border:'none', borderRadius:12, color:'white', fontSize:14, fontWeight:600, cursor:subject&&message?'pointer':'default', fontFamily:F.sans }}>
                {sending ? 'Sending...' : 'Send message'}
              </button>
              <div style={{ textAlign:'center', marginTop:16, fontSize:12, color:C.muted }}>
                📞 Emergency: +34 971 000 000 · Available 24/7
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderBottom:'0.5px solid rgba(255,255,255,0.08)', marginBottom:0 }}>
      <button onClick={()=>setOpen(o=>!o)}
        style={{ width:'100%', display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 0', background:'none', border:'none', cursor:'pointer', textAlign:'left' }}>
        <span style={{ fontSize:14, color:C.white, fontFamily:F.sans, paddingRight:12 }}>{q}</span>
        <span style={{ color:C.muted, fontSize:18, flexShrink:0, transition:'transform 0.2s', transform:open?'rotate(180deg)':'none' }}>⌄</span>
      </button>
      {open && <div style={{ fontSize:13, color:C.muted, paddingBottom:14, lineHeight:1.6 }}>{a}</div>}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// LOYALTY / STAMP CARD
// ═══════════════════════════════════════════════════════════════
export function LoyaltyCard({ onClose }) {
  const { user } = useAuthStore()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    supabase.from('loyalty_cards')
      .select('*').eq('user_id', user.id).single()
      .then(({ data: d }) => {
        if (d) { setData(d); setLoading(false) }
        else {
          supabase.from('loyalty_cards').insert({ user_id: user.id, stamps:0, total_orders:0, points:0 }).select().single()
            .then(({ data: nd }) => { setData(nd || { stamps:0, total_orders:0, points:0 }); setLoading(false) })
        }
      })
  }, [user])

  const stamps = data?.stamps || 0
  const totalOrders = data?.total_orders || 0
  const points = data?.points || 0
  const stampsToFree = 10
  const progress = stamps % stampsToFree

  return (
    <div style={{ position:'fixed', inset:0, zIndex:500, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'flex-end' }} onClick={onClose}>
      <div style={{ width:'100%', maxWidth:480, margin:'0 auto', background:'#0D3545', borderRadius:'24px 24px 0 0', maxHeight:'85vh', overflowY:'auto' }} onClick={e=>e.stopPropagation()}>
        <div style={{ padding:'20px 20px 48px' }}>
          <div style={{ width:36, height:4, background:'rgba(255,255,255,0.2)', borderRadius:2, margin:'0 auto 20px' }} />
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
            <div style={{ fontFamily:F.serif, fontSize:24, color:C.white }}>Loyalty rewards</div>
            <button onClick={onClose} style={{ background:'none', border:'none', color:C.muted, fontSize:22, cursor:'pointer' }}>×</button>
          </div>

          {!user ? (
            <div style={{ textAlign:'center', padding:'30px 0', color:C.muted }}>Sign in to track your rewards</div>
          ) : loading ? <Skeleton height={200} radius={16} /> : (
            <>
              <div style={{ background:'linear-gradient(135deg,#C4683A,#E8854A)', borderRadius:20, padding:'24px 20px', marginBottom:20, position:'relative', overflow:'hidden' }}>
                <div style={{ position:'absolute', top:-30, right:-30, width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,0.08)' }} />
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.7)', textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:4 }}>Isla Drop</div>
                <div style={{ fontFamily:F.serif, fontSize:28, color:'white', marginBottom:4 }}>Stamp card</div>
                <div style={{ fontSize:13, color:'rgba(255,255,255,0.75)' }}>Every 10th delivery free 🎉</div>
                <div style={{ display:'flex', gap:8, marginTop:20, flexWrap:'wrap' }}>
                  {Array(stampsToFree).fill(0).map((_,i) => (
                    <div key={i} style={{ width:36, height:36, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.5)', background:i<progress?'white':'transparent', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>
                      {i<progress?'🌴':''}
                    </div>
                  ))}
                </div>
                <div style={{ marginTop:12, fontSize:13, color:'rgba(255,255,255,0.8)' }}>
                  {progress}/{stampsToFree} stamps · {stampsToFree-progress} to go!
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:20 }}>
                {[['🛵',totalOrders,'Total orders'],['🌴',stamps,'Stamps earned'],['⭐',points,'Points']].map(([icon,val,label]) => (
                  <div key={label} style={{ background:C.surface, borderRadius:12, padding:'14px 10px', textAlign:'center', border:'0.5px solid '+C.border }}>
                    <div style={{ fontSize:22, marginBottom:4 }}>{icon}</div>
                    <div style={{ fontSize:22, fontWeight:700, color:C.white }}>{val}</div>
                    <div style={{ fontSize:10, color:C.muted, textTransform:'uppercase', letterSpacing:'0.5px' }}>{label}</div>
                  </div>
                ))}
              </div>

              <div style={{ background:C.surface, borderRadius:14, padding:16, border:'0.5px solid '+C.border }}>
                <div style={{ fontFamily:F.serif, fontSize:18, color:C.white, marginBottom:12 }}>How it works</div>
                {[['🛵','Order delivery','Earn 1 stamp per order'],['🌴','Collect 10 stamps','Get your next delivery free'],['⭐','Earn points','Every €1 spent = 1 point'],['🎁','Redeem points','100 points = €1 off your order']].map(([icon,title,desc]) => (
                  <div key={title} style={{ display:'flex', gap:12, alignItems:'center', marginBottom:12 }}>
                    <span style={{ fontSize:20, flexShrink:0 }}>{icon}</span>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600, color:C.white }}>{title}</div>
                      <div style={{ fontSize:11, color:C.muted }}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// PRODUCT DETAIL MODAL
// ═══════════════════════════════════════════════════════════════
export function ProductDetail({ product, onClose }) {
  const { addItem, items, updateQuantity } = useCartStore()
  const qty = items.find(i=>i.product.id===product.id)?.quantity || 0

  const RELATED_KEYS = {
    spirits: ['soft_drinks','ice','mixers'],
    beer: ['ice','snacks','soft_drinks'],
    wine: ['snacks','ice'],
    champagne: ['soft_drinks','ice','snacks'],
    soft_drinks: ['snacks','ice'],
  }

  const allergenMap = {
    beer: 'Contains gluten (barley, wheat)',
    wine: 'Contains sulphites',
    champagne: 'Contains sulphites',
    spirits: 'Check label for specific allergens',
    snacks: 'May contain nuts, gluten, dairy',
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:500, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'flex-end' }} onClick={onClose}>
      <div style={{ width:'100%', maxWidth:480, margin:'0 auto', background:'#0D3545', borderRadius:'24px 24px 0 0', overflow:'hidden' }} onClick={e=>e.stopPropagation()}>
        <div style={{ position:'relative', height:220 }}>
          <ProductImage productId={product.id} emoji={product.emoji} category={product.category} alt={product.name} size="hero" style={{ width:'100%', height:220, objectFit:'cover' }} />
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, #0D3545 0%, transparent 60%)' }} />
          <button onClick={onClose} style={{ position:'absolute', top:16, right:16, width:36, height:36, borderRadius:'50%', background:'rgba(0,0,0,0.5)', border:'none', color:'white', fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
          {product.age_restricted && (
            <div style={{ position:'absolute', top:16, left:16, background:'#C4683A', borderRadius:20, padding:'4px 10px', fontSize:11, color:'white', fontWeight:700 }}>18+ ID Required</div>
          )}
        </div>

        <div style={{ padding:'20px 20px 40px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:F.serif, fontSize:26, color:C.white, lineHeight:1.2 }}>{product.name}</div>
              <div style={{ fontSize:12, color:C.muted, marginTop:4, textTransform:'capitalize' }}>{product.category?.replace('_',' ')} · {product.sub || ''}</div>
            </div>
            <div style={{ fontSize:26, fontWeight:800, color:C.accent, marginLeft:12 }}>€{product.price.toFixed(2)}</div>
          </div>

          {product.description && <div style={{ fontSize:13, color:'rgba(255,255,255,0.7)', lineHeight:1.6, marginBottom:16 }}>{product.description}</div>}

          {allergenMap[product.category] && (
            <div style={{ background:'rgba(196,104,58,0.12)', border:'0.5px solid rgba(196,104,58,0.3)', borderRadius:10, padding:'8px 12px', fontSize:11, color:'#E8C090', marginBottom:16 }}>
              ⚠️ {allergenMap[product.category]}
            </div>
          )}

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:20 }}>
            {[product.volume&&['📦','Volume',product.volume],product.abv&&['🍷','ABV',product.abv],['📍','Origin',product.origin||'Spain'],['🌡️','Serve','Chilled']].filter(Boolean).map(([icon,label,val]) => (
              <div key={label} style={{ background:C.surface, borderRadius:10, padding:'10px 12px', border:'0.5px solid '+C.border }}>
                <div style={{ fontSize:11, color:C.muted, marginBottom:2 }}>{icon} {label}</div>
                <div style={{ fontSize:13, fontWeight:600, color:C.white }}>{val}</div>
              </div>
            ))}
          </div>

          {qty === 0 ? (
            <button onClick={()=>{addItem(product);toast.success(product.emoji+' Added to basket!',{duration:1000})}}
              style={{ width:'100%', padding:'16px', background:C.accent, border:'none', borderRadius:14, color:'white', fontSize:16, fontWeight:600, cursor:'pointer', fontFamily:F.sans }}>
              Add to basket — €{product.price.toFixed(2)}
            </button>
          ) : (
            <div style={{ display:'flex', alignItems:'center', gap:16, justifyContent:'center' }}>
              <button onClick={()=>updateQuantity(product.id,qty-1)} style={{ width:52, height:52, borderRadius:14, background:C.surface, border:'0.5px solid '+C.border, color:'white', fontSize:24, cursor:'pointer' }}>−</button>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:26, fontWeight:700, color:C.white }}>{qty}</div>
                <div style={{ fontSize:11, color:C.muted }}>€{(product.price*qty).toFixed(2)}</div>
              </div>
              <button onClick={()=>updateQuantity(product.id,qty+1)} style={{ width:52, height:52, borderRadius:14, background:C.accent, border:'none', color:'white', fontSize:24, cursor:'pointer' }}>+</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// RATING PROMPT — shown after delivery
// ═══════════════════════════════════════════════════════════════
export function RatingPrompt({ order, onClose }) {
  const { user } = useAuthStore()
  const [stars, setStars] = useState(0)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [hovered, setHovered] = useState(0)

  const submit = async () => {
    if (!stars) return
    await supabase.from('order_ratings').upsert({
      order_id: order.id, customer_id: user?.id,
      driver_id: order.driver_id, rating: stars, comment
    }, { onConflict:'order_id,customer_id' })
    setSubmitted(true)
    setTimeout(onClose, 2500)
  }

  const LABELS = ['','Terrible','Poor','OK','Great','Amazing!']

  return (
    <div style={{ position:'fixed', inset:0, zIndex:600, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ background:'#0D3545', borderRadius:24, padding:32, maxWidth:340, width:'100%', textAlign:'center' }}>
        {submitted ? (
          <>
            <div style={{ fontSize:56, marginBottom:16 }}>🌴</div>
            <div style={{ fontFamily:F.serif, fontSize:24, color:C.white, marginBottom:8 }}>Thank you!</div>
            <div style={{ fontSize:14, color:C.muted }}>Your feedback helps us improve</div>
          </>
        ) : (
          <>
            <div style={{ fontSize:48, marginBottom:12 }}>🎉</div>
            <div style={{ fontFamily:F.serif, fontSize:22, color:C.white, marginBottom:4 }}>Order delivered!</div>
            <div style={{ fontSize:13, color:C.muted, marginBottom:24 }}>How was your experience?</div>
            <div style={{ display:'flex', gap:8, justifyContent:'center', marginBottom:8 }}>
              {[1,2,3,4,5].map(s => (
                <button key={s} onMouseEnter={()=>setHovered(s)} onMouseLeave={()=>setHovered(0)}
                  onClick={()=>setStars(s)}
                  style={{ fontSize:36, background:'none', border:'none', cursor:'pointer', transition:'transform 0.1s', transform:(hovered||stars)>=s?'scale(1.2)':'scale(1)', opacity:(hovered||stars)>=s?1:0.35 }}>
                  ★
                </button>
              ))}
            </div>
            {(hovered||stars) > 0 && <div style={{ fontSize:14, color:C.accent, marginBottom:16, fontWeight:600 }}>{LABELS[hovered||stars]}</div>}
            <textarea value={comment} onChange={e=>setComment(e.target.value)} rows={3}
              placeholder="Any comments? (optional)" style={{ width:'100%', padding:'10px 12px', background:'rgba(255,255,255,0.08)', border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:10, color:C.white, fontSize:13, fontFamily:F.sans, resize:'none', outline:'none', boxSizing:'border-box', marginBottom:16 }} />
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={onClose} style={{ flex:1, padding:'12px', background:'rgba(255,255,255,0.08)', border:'none', borderRadius:12, color:C.muted, fontSize:13, cursor:'pointer' }}>Skip</button>
              <button onClick={submit} disabled={!stars} style={{ flex:2, padding:'12px', background:stars?C.accent:'rgba(255,255,255,0.1)', border:'none', borderRadius:12, color:'white', fontSize:14, fontWeight:600, cursor:stars?'pointer':'default' }}>Submit rating</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// COCKTAIL BUILDER
// ═══════════════════════════════════════════════════════════════
export function CocktailBuilder({ products, onClose }) {
  const { addItem } = useCartStore()
  const [step, setStep] = useState(0)
  const [base, setBase] = useState(null)
  const [mixers, setMixers] = useState([])
  const [garnish, setGarnish] = useState([])

  const spirits = products.filter(p => p.category === 'spirits').slice(0, 12)
  const mixerOpts = products.filter(p => p.category === 'soft_drinks' || p.sub === 'mixers').slice(0, 12)
  const garnishOpts = products.filter(p => p.category === 'snacks' || p.sub === 'garnish').slice(0, 6)

  const COCKTAILS = {
    'sp-012': { name:'G&T', mixers:['sd-025','sd-028'], emoji:'🍸' },
    'sp-033': { name:'Vodka Tonic', mixers:['sd-025'], emoji:'🍹' },
    'sp-035': { name:'Vodka Soda', mixers:['sd-024'], emoji:'🥂' },
    'sp-022': { name:'Rum & Coke', mixers:['sd-001'], emoji:'🥃' },
    'sp-015': { name:'Whisky Sour', mixers:['sd-019'], emoji:'🥃' },
    'sp-001': { name:'Margarita', mixers:['sd-020'], emoji:'🍹' },
  }

  const suggested = base ? COCKTAILS[base.id] : null
  const total = [base,...mixers,...garnish].filter(Boolean).reduce((s,p)=>s+(p?.price||0),0)

  const addAll = () => {
    if (base) addItem(base)
    mixers.forEach(m => addItem(m))
    garnish.forEach(g => addItem(g))
    toast.success('🍹 Cocktail kit added to basket!')
    onClose()
  }

  const STEPS = ['Choose spirit','Add mixers','Review & add']

  return (
    <div style={{ position:'fixed', inset:0, zIndex:500, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'flex-end' }} onClick={onClose}>
      <div style={{ width:'100%', maxWidth:480, margin:'0 auto', background:'#0D3545', borderRadius:'24px 24px 0 0', maxHeight:'88vh', overflowY:'auto' }} onClick={e=>e.stopPropagation()}>
        <div style={{ padding:'20px 20px 48px' }}>
          <div style={{ width:36, height:4, background:'rgba(255,255,255,0.2)', borderRadius:2, margin:'0 auto 20px' }} />
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <div style={{ fontFamily:F.serif, fontSize:24, color:C.white }}>🍹 Cocktail builder</div>
            <button onClick={onClose} style={{ background:'none', border:'none', color:C.muted, fontSize:22, cursor:'pointer' }}>×</button>
          </div>
          <div style={{ fontSize:12, color:C.muted, marginBottom:20 }}>Build your perfect cocktail kit and add everything at once</div>

          <div style={{ display:'flex', gap:4, marginBottom:20 }}>
            {STEPS.map((s,i) => (
              <div key={i} style={{ flex:1, height:3, borderRadius:99, background:i<=step?C.accent:'rgba(255,255,255,0.15)' }} />
            ))}
          </div>

          {step === 0 && (
            <>
              <div style={{ fontSize:14, fontWeight:600, color:C.white, marginBottom:12 }}>Choose your spirit</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {spirits.map(p => (
                  <button key={p.id} onClick={()=>{setBase(p);setStep(1)}}
                    style={{ padding:'12px', background:base?.id===p.id?C.accentDim:C.surface, border:'0.5px solid '+(base?.id===p.id?C.accent:C.border), borderRadius:12, cursor:'pointer', textAlign:'left' }}>
                    <div style={{ fontSize:20, marginBottom:4 }}>{p.emoji}</div>
                    <div style={{ fontSize:12, fontWeight:600, color:C.white, lineHeight:1.3 }}>{p.name}</div>
                    <div style={{ fontSize:12, color:C.accent, marginTop:4 }}>€{p.price.toFixed(2)}</div>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 1 && (
            <>
              {suggested && (
                <div style={{ background:C.accentDim, border:'0.5px solid rgba(196,104,58,0.3)', borderRadius:12, padding:'12px 14px', marginBottom:16 }}>
                  <div style={{ fontSize:12, color:C.accent, fontWeight:600, marginBottom:2 }}>{suggested.emoji} Perfect for {suggested.name}</div>
                  <div style={{ fontSize:12, color:C.muted }}>We suggest adding the highlighted mixers below</div>
                </div>
              )}
              <div style={{ fontSize:14, fontWeight:600, color:C.white, marginBottom:12 }}>Add mixers (optional)</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
                {mixerOpts.map(p => {
                  const sel = mixers.find(m=>m.id===p.id)
                  const isSuggested = suggested?.mixers?.includes(p.id)
                  return (
                    <button key={p.id} onClick={()=>setMixers(m=>sel?m.filter(x=>x.id!==p.id):[...m,p])}
                      style={{ padding:'12px', background:sel?C.accentDim:isSuggested?C.tealDim:C.surface, border:'0.5px solid '+(sel?C.accent:isSuggested?C.teal:C.border), borderRadius:12, cursor:'pointer', textAlign:'left', position:'relative' }}>
                      {isSuggested && <div style={{ position:'absolute', top:6, right:6, fontSize:9, background:C.teal, color:'white', borderRadius:4, padding:'1px 5px' }}>Suggested</div>}
                      <div style={{ fontSize:18, marginBottom:4 }}>{p.emoji}</div>
                      <div style={{ fontSize:11, fontWeight:600, color:C.white, lineHeight:1.3 }}>{p.name}</div>
                      <div style={{ fontSize:11, color:C.accent, marginTop:4 }}>€{p.price.toFixed(2)}</div>
                    </button>
                  )
                })}
              </div>
              <button onClick={()=>setStep(2)} style={{ width:'100%', padding:'13px', background:C.accent, border:'none', borderRadius:12, color:'white', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:F.sans }}>
                Next →
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div style={{ fontSize:14, fontWeight:600, color:C.white, marginBottom:16 }}>Your cocktail kit</div>
              {[base,...mixers,...garnish].filter(Boolean).map(p => (
                <div key={p.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'0.5px solid '+C.border }}>
                  <span style={{ fontSize:13, color:C.white }}>{p.emoji} {p.name}</span>
                  <span style={{ fontSize:13, fontWeight:700, color:C.accent }}>€{p.price.toFixed(2)}</span>
                </div>
              ))}
              <div style={{ display:'flex', justifyContent:'space-between', padding:'14px 0', marginBottom:16 }}>
                <span style={{ fontSize:15, fontWeight:700, color:C.white }}>Total</span>
                <span style={{ fontSize:20, fontWeight:800, color:C.accent }}>€{total.toFixed(2)}</span>
              </div>
              <button onClick={addAll} style={{ width:'100%', padding:'16px', background:C.accent, border:'none', borderRadius:14, color:'white', fontSize:16, fontWeight:600, cursor:'pointer', fontFamily:F.sans }}>
                🍹 Add all to basket
              </button>
              <button onClick={()=>setStep(1)} style={{ width:'100%', padding:'12px', marginTop:8, background:'transparent', border:'0.5px solid rgba(255,255,255,0.2)', borderRadius:12, color:C.muted, fontSize:13, cursor:'pointer', fontFamily:F.sans }}>
                ← Edit mixers
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// BUNDLE DEALS — party packs
// ═══════════════════════════════════════════════════════════════
export function BundleDeals({ products, onClose }) {
  const { addItem } = useCartStore()

  const findProduct = (id) => products.find(p=>p.id===id)

  const BUNDLES = [
    {
      id:'party', name:'Party Pack', emoji:'🎉', desc:'Perfect for pre-drinks and parties',
      originalPrice: 89.50, bundlePrice: 74.99, saving: 14.51,
      items:[
        {id:'ch-001',qty:2,label:'Prosecco x2'},
        {id:'br-001',qty:12,label:'Beer x12'},
        {id:'ic-002',qty:1,label:'Ice 5kg'},
        {id:'sd-001',qty:2,label:'Coke x2'},
        {id:'sn-004',qty:2,label:'Crisps x2'},
      ]
    },
    {
      id:'cocktail', name:'Cocktail Night', emoji:'🍸', desc:'Everything for an epic cocktail session',
      originalPrice: 72.00, bundlePrice: 59.99, saving: 12.01,
      items:[
        {id:'sp-012',qty:1,label:'Gin'},
        {id:'sp-033',qty:1,label:'Vodka'},
        {id:'sd-028',qty:2,label:'Fever-Tree x2'},
        {id:'sd-024',qty:1,label:'Soda water'},
        {id:'ic-001',qty:2,label:'Ice x2'},
      ]
    },
    {
      id:'sunset', name:'Sunset Rosé', emoji:'🌅', desc:'The perfect Ibiza sunset spread',
      originalPrice: 55.00, bundlePrice: 44.99, saving: 10.01,
      items:[
        {id:'wn-021',qty:2,label:'Rosé x2'},
        {id:'ch-007',qty:1,label:'Champagne'},
        {id:'sd-019',qty:1,label:'San Pellegrino'},
        {id:'ic-001',qty:1,label:'Ice'},
      ]
    },
    {
      id:'bbq', name:'Beach BBQ', emoji:'🏖️', desc:'Beers, snacks and mixers for the beach',
      originalPrice: 48.00, bundlePrice: 39.99, saving: 8.01,
      items:[
        {id:'br-001',qty:6,label:'Beer x6'},
        {id:'br-004',qty:6,label:'Lager x6'},
        {id:'ic-002',qty:1,label:'Ice 5kg'},
        {id:'wt-002',qty:2,label:'Water x2'},
        {id:'sn-004',qty:3,label:'Crisps x3'},
      ]
    },
  ]

  const addBundle = (bundle) => {
    bundle.items.forEach(item => {
      const product = findProduct(item.id)
      if (product) {
        for (let i=0; i<item.qty; i++) addItem(product)
      }
    })
    toast.success(bundle.emoji + ' ' + bundle.name + ' added to basket!')
    onClose()
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:500, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'flex-end' }} onClick={onClose}>
      <div style={{ width:'100%', maxWidth:480, margin:'0 auto', background:'#0D3545', borderRadius:'24px 24px 0 0', maxHeight:'88vh', overflowY:'auto' }} onClick={e=>e.stopPropagation()}>
        <div style={{ padding:'20px 20px 48px' }}>
          <div style={{ width:36, height:4, background:'rgba(255,255,255,0.2)', borderRadius:2, margin:'0 auto 20px' }} />
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <div style={{ fontFamily:F.serif, fontSize:24, color:C.white }}>🎁 Bundle deals</div>
            <button onClick={onClose} style={{ background:'none', border:'none', color:C.muted, fontSize:22, cursor:'pointer' }}>×</button>
          </div>
          <div style={{ fontSize:13, color:C.muted, marginBottom:24 }}>Save money with our curated party packs</div>

          {BUNDLES.map(bundle => (
            <div key={bundle.id} style={{ background:C.surface, borderRadius:16, marginBottom:14, overflow:'hidden', border:'0.5px solid '+C.border }}>
              <div style={{ padding:'16px 16px 12px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                      <span style={{ fontSize:24 }}>{bundle.emoji}</span>
                      <div style={{ fontFamily:F.serif, fontSize:20, color:C.white }}>{bundle.name}</div>
                    </div>
                    <div style={{ fontSize:12, color:C.muted }}>{bundle.desc}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:22, fontWeight:800, color:C.accent }}>€{bundle.bundlePrice}</div>
                    <div style={{ fontSize:11, color:C.muted, textDecoration:'line-through' }}>€{bundle.originalPrice}</div>
                    <div style={{ fontSize:11, color:C.green, fontWeight:700 }}>Save €{bundle.saving.toFixed(2)}</div>
                  </div>
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:12 }}>
                  {bundle.items.map(item => (
                    <span key={item.id} style={{ padding:'3px 10px', background:C.surfaceB, borderRadius:20, fontSize:11, color:'rgba(255,255,255,0.7)' }}>
                      {findProduct(item.id)?.emoji} {item.label}
                    </span>
                  ))}
                </div>
                <button onClick={()=>addBundle(bundle)}
                  style={{ width:'100%', padding:'12px', background:C.accent, border:'none', borderRadius:12, color:'white', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:F.sans }}>
                  Add bundle — €{bundle.bundlePrice}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// SCHEDULED DELIVERY
// ═══════════════════════════════════════════════════════════════
export function ScheduleDelivery({ onClose, onSchedule }) {
  const [type, setType] = useState('now')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')

  const timeSlots = []
  for (let h=8; h<=23; h++) {
    timeSlots.push(h.toString().padStart(2,'0')+':00')
    timeSlots.push(h.toString().padStart(2,'0')+':30')
  }
  timeSlots.push('00:00','00:30','01:00','01:30','02:00','02:30','03:00')

  const minDate = new Date().toISOString().slice(0,10)

  return (
    <div style={{ position:'fixed', inset:0, zIndex:500, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'flex-end' }} onClick={onClose}>
      <div style={{ width:'100%', maxWidth:480, margin:'0 auto', background:'#0D3545', borderRadius:'24px 24px 0 0' }} onClick={e=>e.stopPropagation()}>
        <div style={{ padding:'20px 20px 48px' }}>
          <div style={{ width:36, height:4, background:'rgba(255,255,255,0.2)', borderRadius:2, margin:'0 auto 20px' }} />
          <div style={{ fontFamily:F.serif, fontSize:24, color:C.white, marginBottom:20 }}>Schedule delivery</div>

          <div style={{ display:'flex', gap:8, marginBottom:24 }}>
            {[['now','🚀 Deliver now'],['later','🕐 Schedule for later']].map(([k,l]) => (
              <button key={k} onClick={()=>setType(k)}
                style={{ flex:1, padding:'12px', borderRadius:12, border:'0.5px solid '+(type===k?C.accent:C.border), background:type===k?C.accentDim:'transparent', color:type===k?C.accent:C.muted, fontSize:13, fontWeight:type===k?700:400, cursor:'pointer', fontFamily:F.sans }}>
                {l}
              </button>
            ))}
          </div>

          {type === 'now' ? (
            <div style={{ background:C.greenDim, border:'0.5px solid rgba(126,232,162,0.3)', borderRadius:12, padding:'14px 16px', marginBottom:20 }}>
              <div style={{ fontSize:14, fontWeight:700, color:C.green }}>🚀 Express delivery</div>
              <div style={{ fontSize:13, color:C.muted, marginTop:4 }}>Order now and receive in 15–30 minutes</div>
            </div>
          ) : (
            <>
              <div style={{ marginBottom:12 }}>
                <div style={{ fontSize:12, color:C.muted, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.5px' }}>Date</div>
                <input type="date" value={date} onChange={e=>setDate(e.target.value)} min={minDate}
                  style={{ width:'100%', padding:'11px 14px', background:'rgba(255,255,255,0.08)', border:'0.5px solid rgba(255,255,255,0.2)', borderRadius:10, color:C.white, fontSize:14, fontFamily:F.sans, outline:'none', boxSizing:'border-box' }} />
              </div>
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:12, color:C.muted, marginBottom:8, textTransform:'uppercase', letterSpacing:'0.5px' }}>Time slot</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6, maxHeight:180, overflowY:'auto' }}>
                  {timeSlots.map(t => (
                    <button key={t} onClick={()=>setTime(t)}
                      style={{ padding:'7px 12px', borderRadius:20, border:'0.5px solid '+(time===t?C.accent:C.border), background:time===t?C.accentDim:'transparent', color:time===t?C.accent:C.muted, fontSize:12, cursor:'pointer' }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <button onClick={()=>onSchedule(type==='now'?null:{date,time})}
            style={{ width:'100%', padding:'15px', background:C.accent, border:'none', borderRadius:14, color:'white', fontSize:15, fontWeight:600, cursor:'pointer', fontFamily:F.sans }}>
            {type==='now' ? 'Confirm — deliver now' : 'Schedule for '+time+' on '+date}
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// PROMO CODE ENTRY
// ═══════════════════════════════════════════════════════════════
export function PromoCodeEntry({ onApply }) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [applied, setApplied] = useState(null)
  const [error, setError] = useState('')

  const apply = async () => {
    if (!code.trim()) return
    setLoading(true); setError('')
    const { data } = await supabase.from('referral_codes')
      .select('*').eq('code', code.trim().toUpperCase()).eq('status','active').single()
    if (!data) { setError('Invalid or expired promo code'); setLoading(false); return }
    if (data.max_uses && data.uses >= data.max_uses) { setError('This code has reached its usage limit'); setLoading(false); return }
    if (data.expires_at && new Date(data.expires_at) < new Date()) { setError('This code has expired'); setLoading(false); return }
    setApplied(data)
    onApply?.(data)
    toast.success('Code applied! €' + data.reward_eur + ' off your order 🎉')
    setLoading(false)
  }

  if (applied) return (
    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:'rgba(126,232,162,0.12)', border:'0.5px solid rgba(126,232,162,0.3)', borderRadius:10 }}>
      <span style={{ fontSize:16 }}>✅</span>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:12, fontWeight:700, color:C.green }}>{applied.code}</div>
        <div style={{ fontSize:11, color:C.muted }}>€{applied.reward_eur} discount applied</div>
      </div>
      <button onClick={()=>{setApplied(null);setCode('');onApply?.(null)}} style={{ fontSize:16, background:'none', border:'none', color:C.muted, cursor:'pointer' }}>×</button>
    </div>
  )

  return (
    <div>
      <div style={{ display:'flex', gap:8 }}>
        <input value={code} onChange={e=>setCode(e.target.value.toUpperCase())} onKeyDown={e=>e.key==='Enter'&&apply()}
          placeholder="Promo or referral code" style={{ flex:1, padding:'11px 14px', background:'rgba(255,255,255,0.08)', border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:10, color:C.white, fontSize:13, fontFamily:F.sans, outline:'none' }} />
        <button onClick={apply} disabled={loading||!code}
          style={{ padding:'11px 16px', background:code?C.accent:'rgba(255,255,255,0.1)', border:'none', borderRadius:10, color:'white', fontSize:13, fontWeight:600, cursor:code?'pointer':'default', fontFamily:F.sans }}>
          {loading?'...':'Apply'}
        </button>
      </div>
      {error && <div style={{ fontSize:11, color:'#F09595', marginTop:6 }}>{error}</div>}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// NOTIFICATION SETTINGS
// ═══════════════════════════════════════════════════════════════
export function NotificationSettings({ onClose }) {
  const [perms, setPerms] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'default')
  const [prefs, setPrefs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('notif_prefs')||'{}') } catch { return {} }
  })

  const request = async () => {
    const p = await Notification.requestPermission()
    setPerms(p)
    if (p === 'granted') {
      new Notification('Isla Drop notifications enabled!', { body:'You\'ll now get real-time updates on your orders 🌴' })
    }
  }

  const toggle = (key) => {
    const next = {...prefs,[key]:!prefs[key]}
    setPrefs(next)
    localStorage.setItem('notif_prefs', JSON.stringify(next))
  }

  const NOTIFS = [
    { key:'order_confirmed', label:'Order confirmed', desc:'When your order is accepted' },
    { key:'driver_assigned', label:'Driver assigned', desc:'When a driver picks up your order' },
    { key:'order_arriving', label:'Driver nearby', desc:'When your order is 5 min away' },
    { key:'order_delivered', label:'Order delivered', desc:'When your order arrives' },
    { key:'promotions', label:'Promotions & offers', desc:'Flash sales and exclusive deals' },
  ]

  return (
    <div style={{ position:'fixed', inset:0, zIndex:500, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'flex-end' }} onClick={onClose}>
      <div style={{ width:'100%', maxWidth:480, margin:'0 auto', background:'#0D3545', borderRadius:'24px 24px 0 0' }} onClick={e=>e.stopPropagation()}>
        <div style={{ padding:'20px 20px 48px' }}>
          <div style={{ width:36, height:4, background:'rgba(255,255,255,0.2)', borderRadius:2, margin:'0 auto 20px' }} />
          <div style={{ fontFamily:F.serif, fontSize:24, color:C.white, marginBottom:20 }}>Notifications</div>

          {perms !== 'granted' ? (
            <div style={{ textAlign:'center', padding:'24px 0' }}>
              <div style={{ fontSize:48, marginBottom:16 }}>🔔</div>
              <div style={{ fontSize:16, fontWeight:600, color:C.white, marginBottom:8 }}>Enable notifications</div>
              <div style={{ fontSize:13, color:C.muted, marginBottom:24 }}>Get real-time updates on your order status</div>
              {perms === 'denied' ? (
                <div style={{ padding:'12px', background:'rgba(196,104,58,0.15)', borderRadius:10, fontSize:12, color:'#E8C090' }}>
                  Notifications are blocked. Go to your browser settings to enable them for isladrop.net
                </div>
              ) : (
                <button onClick={request} style={{ width:'100%', padding:'14px', background:C.accent, border:'none', borderRadius:12, color:'white', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:F.sans }}>
                  Enable push notifications
                </button>
              )}
            </div>
          ) : (
            <>
              <div style={{ background:C.greenDim, border:'0.5px solid rgba(126,232,162,0.3)', borderRadius:10, padding:'10px 14px', marginBottom:20 }}>
                <div style={{ fontSize:12, fontWeight:700, color:C.green }}>✅ Notifications enabled</div>
              </div>
              {NOTIFS.map(n => (
                <div key={n.key} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 0', borderBottom:'0.5px solid rgba(255,255,255,0.08)' }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:500, color:C.white }}>{n.label}</div>
                    <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{n.desc}</div>
                  </div>
                  <button onClick={()=>toggle(n.key)}
                    style={{ width:44, height:24, borderRadius:12, background:prefs[n.key]!==false?C.green:'rgba(255,255,255,0.15)', border:'none', cursor:'pointer', position:'relative', flexShrink:0, transition:'background 0.2s' }}>
                    <div style={{ width:20, height:20, borderRadius:'50%', background:'white', position:'absolute', top:2, left:prefs[n.key]!==false?22:2, transition:'left 0.2s' }} />
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
