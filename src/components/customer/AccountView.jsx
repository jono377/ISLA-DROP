import { useState, useEffect } from 'react'
import { useAuthStore, useCartStore } from '../../lib/store'
import AuthScreen from '../shared/AuthScreen'
import SupportChat from './SupportChat'
import LoyaltyPoints from './LoyaltyPoints'

const C = {
  teal: '#0D3B4A', accent: '#C4683A', card: 'rgba(255,255,255,0.06)',
  border: 'rgba(255,255,255,0.10)', text: 'white', muted: 'rgba(255,255,255,0.45)',
}

function Row({ icon, label, sub, onClick, accent: useAccent, danger, right }) {
  return (
    <div onClick={onClick} style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 16px', background: useAccent?'rgba(43,122,139,0.18)':danger?'rgba(196,104,58,0.08)':C.card, border:('0.5px solid ' + (useAccent?'rgba(43,122,139,0.3)':danger?'rgba(196,104,58,0.25)':C.border)), borderRadius:12, marginBottom:8, cursor:'pointer' }}>
      <span style={{ fontSize:18, flexShrink:0 }}>{icon}</span>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:14, color: danger?'#E8A070':C.text, fontFamily:'DM Sans,sans-serif' }}>{label}</div>
        {sub && <div style={{ fontSize:11, color:C.muted, marginTop:1, fontFamily:'DM Sans,sans-serif' }}>{sub}</div>}
      </div>
      {right || <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>}
    </div>
  )
}

// ── My Orders ─────────────────────────────────────────────────
function MyOrders({ onBack }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const { addItem } = useCartStore()

  useEffect(() => {
    const load = async () => {
      try {
        const { supabase } = await import('../../lib/supabase')
        const { data } = await supabase
          .from('orders')
          .select('*, order_items(*, product:products(*))')
          .order('created_at', { ascending: false })
          .limit(30)
        if (data) setOrders(data)
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  const STATUS_LABELS = { pending:'Placed', assigned:'Driver assigned', warehouse_confirmed:'Items collected', en_route:'On the way', delivered:'Delivered', cancelled:'Cancelled' }
  const STATUS_COLORS = { pending:'#F5C97A', assigned:'#7ECFE0', warehouse_confirmed:'#7EE8A2', en_route:'#C4683A', delivered:'#7EE8A2', cancelled:'rgba(255,255,255,0.3)' }

  return (
    <div style={{ padding:'20px 16px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
        <button onClick={onBack} style={{ background:'none', border:'none', color:C.muted, cursor:'pointer', fontSize:20, padding:0 }}>←</button>
        <div style={{ fontFamily:'DM Serif Display,serif', fontSize:22, color:C.text }}>My Orders</div>
      </div>
      {loading && <div style={{ textAlign:'center', padding:40, color:C.muted }}>Loading orders...</div>}
      {!loading && orders.length === 0 && (
        <div style={{ textAlign:'center', padding:'40px 0' }}>
          <div style={{ fontSize:48, marginBottom:12 }}>📦</div>
          <div style={{ fontFamily:'DM Serif Display,serif', fontSize:20, color:C.text, marginBottom:8 }}>{'No orders yet'||'No orders yet'}</div>
          <div style={{ fontSize:14, color:C.muted }}>Your order history will appear here</div>
        </div>
      )}
      {orders.map(order => (
        <div key={order.id} style={{ background:C.card, border:'0.5px solid ' + C.border, borderRadius:14, padding:14, marginBottom:12 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
            <div>
              <div style={{ fontSize:13, fontWeight:500, color:C.text }}>#{order.order_number || order.id?.slice(0,8).toUpperCase()}</div>
              <div style={{ fontSize:11, color:C.muted, marginTop:1 }}>{new Date(order.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}</div>
            </div>
            <span style={{ fontSize:11, fontWeight:500, color:STATUS_COLORS[order.status]||C.muted, background:'rgba(255,255,255,0.06)', padding:'3px 9px', borderRadius:20 }}>
              {STATUS_LABELS[order.status] || order.status}
            </span>
          </div>
          <div style={{ fontSize:12, color:C.muted, marginBottom:10 }}>
            {order.order_items?.slice(0,3).map(i => i.quantity + 'x ' + (i.product?.name||'Item')).join(', ')}
            {order.order_items?.length > 3 ? ' +' + (order.order_items.length-3) + ' more' : ''}
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontSize:15, fontWeight:500, color:'#E8A070' }}>€{order.total?.toFixed(2)}</div>
            {order.status === 'delivered' && (
              <button onClick={() => { order.order_items?.forEach(i => i.product && addItem(i.product)); }}
                style={{ padding:'7px 14px', background:'rgba(196,104,58,0.15)', border:`0.5px solid rgba(196,104,58,0.3)`, borderRadius:8, fontSize:12, color:'#E8A070', cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
                Reorder
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── My Favourites ─────────────────────────────────────────────
function MyFavourites({ onBack }) {
  const [favourites, setFavourites] = useState([])
  const { addItem } = useCartStore()

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('isla_favourites') || '[]')
      setFavourites(saved)
    } catch {}
  }, [])

  const remove = (id) => {
    const updated = favourites.filter(f => f.id !== id)
    setFavourites(updated)
    localStorage.setItem('isla_favourites', JSON.stringify(updated))
  }

  return (
    <div style={{ padding:'20px 16px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
        <button onClick={onBack} style={{ background:'none', border:'none', color:C.muted, cursor:'pointer', fontSize:20, padding:0 }}>←</button>
        <div style={{ fontFamily:'DM Serif Display,serif', fontSize:22, color:C.text }}>My Favourites</div>
      </div>
      {favourites.length === 0 ? (
        <div style={{ textAlign:'center', padding:'40px 0' }}>
          <div style={{ fontSize:48, marginBottom:12 }}>❤️</div>
          <div style={{ fontFamily:'DM Serif Display,serif', fontSize:20, color:C.text, marginBottom:8 }}>No favourites yet</div>
          <div style={{ fontSize:14, color:C.muted }}>Tap the heart on any product to save it here</div>
        </div>
      ) : favourites.map(p => (
        <div key={p.id} style={{ display:'flex', alignItems:'center', gap:12, background:C.card, border:'0.5px solid ' + C.border, borderRadius:12, padding:'12px 14px', marginBottom:8 }}>
          <span style={{ fontSize:24 }}>{p.emoji}</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, color:C.text, fontFamily:'DM Sans,sans-serif' }}>{p.name}</div>
            <div style={{ fontSize:12, color:'#E8A070', marginTop:1 }}>€{p.price?.toFixed(2)}</div>
          </div>
          <button onClick={() => addItem(p)} style={{ padding:'7px 12px', background:'rgba(196,104,58,0.15)', border:`0.5px solid rgba(196,104,58,0.3)`, borderRadius:8, fontSize:12, color:'#E8A070', cursor:'pointer', fontFamily:'DM Sans,sans-serif', marginRight:6 }}>Add</button>
          <button onClick={() => remove(p.id)} style={{ padding:'7px 10px', background:'rgba(255,255,255,0.06)', border:'0.5px solid ' + C.border, borderRadius:8, fontSize:12, color:C.muted, cursor:'pointer' }}>✕</button>
        </div>
      ))}
    </div>
  )
}

// ── My Details ────────────────────────────────────────────────
function MyDetails({ onBack }) {
  const { user, profile, setProfile } = useAuthStore()
  const [name, setName]   = useState(profile?.full_name || '')
  const [phone, setPhone] = useState(profile?.phone || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      const { supabase } = await import('../../lib/supabase')
      await supabase.from('profiles').update({ full_name: name.trim(), phone: phone.trim() }).eq('id', user.id)
      setProfile({ ...profile, full_name: name.trim(), phone: phone.trim() })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {}
    setSaving(false)
  }

  const inp = { width:'100%', padding:'12px 14px', background:'rgba(255,255,255,0.07)', border:'0.5px solid ' + C.border, borderRadius:10, fontFamily:'DM Sans,sans-serif', fontSize:14, color:C.text, outline:'none', boxSizing:'border-box', marginBottom:12 }

  return (
    <div style={{ padding:'20px 16px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
        <button onClick={onBack} style={{ background:'none', border:'none', color:C.muted, cursor:'pointer', fontSize:20, padding:0 }}>←</button>
        <div style={{ fontFamily:'DM Serif Display,serif', fontSize:22, color:C.text }}>{'My Details'||'My Details'}</div>
      </div>
      <input value={name} onChange={e=>setName(e.target.value)} placeholder="Full name" style={inp} />
      <input value={user?.email||''} disabled placeholder="Email" style={{ ...inp, opacity:0.5, cursor:'not-allowed' }} />
      <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Phone / WhatsApp number" type="tel" style={{ ...inp, marginBottom:20 }} />
      <button onClick={save} disabled={saving}
        style={{ width:'100%', padding:'13px', background: saved?'rgba(90,107,58,0.4)':'#C4683A', color:C.text, border:'none', borderRadius:12, fontFamily:'DM Sans,sans-serif', fontSize:14, fontWeight:500, cursor:'pointer' }}>
        {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Details'}
      </button>
      <div style={{ marginTop:16, padding:'12px 14px', background:'rgba(255,255,255,0.04)', borderRadius:10, fontSize:12, color:C.muted, fontFamily:'DM Sans,sans-serif' }}>
        Member since {new Date(user?.created_at||Date.now()).toLocaleDateString('en-GB', { month:'long', year:'numeric' })}
      </div>
    </div>
  )
}

// ── Addresses ─────────────────────────────────────────────────
function MyAddresses({ onBack }) {
  const { user } = useAuthStore()
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const { supabase } = await import('../../lib/supabase')
        const { data } = await supabase
          .from('orders')
          .select('delivery_address, delivery_lat, delivery_lng, what3words, created_at')
          .not('delivery_address', 'is', null)
          .order('created_at', { ascending: false })
          .limit(20)
        if (data) {
          // Deduplicate by address
          const seen = new Set()
          const unique = data.filter(d => { if (seen.has(d.delivery_address)) return false; seen.add(d.delivery_address); return true })
          setAddresses(unique)
        }
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div style={{ padding:'20px 16px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
        <button onClick={onBack} style={{ background:'none', border:'none', color:C.muted, cursor:'pointer', fontSize:20, padding:0 }}>←</button>
        <div style={{ fontFamily:'DM Serif Display,serif', fontSize:22, color:C.text }}>My Addresses</div>
      </div>
      <div style={{ fontSize:13, color:C.muted, marginBottom:16, fontFamily:'DM Sans,sans-serif' }}>Addresses from your previous orders</div>
      {loading && <div style={{ textAlign:'center', padding:30, color:C.muted }}>{'Loading...'||'Loading...'}</div>}
      {!loading && addresses.length === 0 && (
        <div style={{ textAlign:'center', padding:'30px 0' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>📍</div>
          <div style={{ fontSize:14, color:C.muted }}>Your delivery addresses will appear here after your first order</div>
        </div>
      )}
      {addresses.map((addr, i) => (
        <div key={i} style={{ background:C.card, border:'0.5px solid ' + C.border, borderRadius:12, padding:'12px 14px', marginBottom:8, display:'flex', alignItems:'flex-start', gap:10 }}>
          <span style={{ fontSize:16, marginTop:1 }}>📍</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, color:C.text, fontFamily:'DM Sans,sans-serif', lineHeight:1.4 }}>{addr.delivery_address}</div>
            {addr.what3words && <div style={{ fontSize:11, color:'#5A6B3A', marginTop:3 }}>/// {addr.what3words}</div>}
            <div style={{ fontSize:11, color:C.muted, marginTop:3 }}>Used {new Date(addr.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'short' })}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Credit ────────────────────────────────────────────────────
function MyCredit({ onBack }) {
  const { user } = useAuthStore()
  const [credit, setCredit] = useState(0)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [redeeming, setRedeeming] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const { supabase } = await import('../../lib/supabase')
        const { data } = await supabase
          .from('customer_credit')
          .select('*')
          .eq('customer_id', user.id)
          .order('created_at', { ascending: false })
        if (data) {
          const bal = data.filter(t=>t.type==='credit').reduce((s,t)=>s+t.amount,0)
                    - data.filter(t=>t.type==='used').reduce((s,t)=>s+t.amount,0)
          setCredit(Math.max(0, bal))
          setTransactions(data.slice(0,10))
        }
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  const requestCashback = async () => {
    setRedeeming(true)
    try {
      const { supabase } = await import('../../lib/supabase')
      await supabase.from('support_tickets').insert({
        customer_id: user.id,
        type: 'credit_cashback_request',
        message: 'Customer requesting cash refund of credit balance: €' + credit.toFixed(2),
        status: 'open',
      })
      alert('Request sent! Our team will process your €' + credit.toFixed(2) + ' cashback to your original payment method within 3-5 business days.')
    } catch { alert('Request failed — please email support@isladrop.net') }
    setRedeeming(false)
  }

  const TRANS_LABELS = { credit:'Credit added', used:'Credit used', refund:'Refund credit', bonus:'Bonus credit' }
  const TRANS_COLORS = { credit:'#7EE8A2', used:'#E8A070', refund:'#7EE8A2', bonus:'#F5C97A' }

  return (
    <div style={{ padding:'20px 16px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
        <button onClick={onBack} style={{ background:'none', border:'none', color:C.muted, cursor:'pointer', fontSize:20, padding:0 }}>←</button>
        <div style={{ fontFamily:'DM Serif Display,serif', fontSize:22, color:C.text }}>{'My Credit'||'My Credit'}</div>
      </div>

      {/* Balance card */}
      <div style={{ background:'linear-gradient(135deg,rgba(196,104,58,0.3),rgba(43,122,139,0.3))', border:`0.5px solid rgba(196,104,58,0.3)`, borderRadius:16, padding:24, marginBottom:20, textAlign:'center' }}>
        <div style={{ fontSize:12, color:C.muted, textTransform:'uppercase', letterSpacing:'1px', marginBottom:8 }}>Available Credit</div>
        <div style={{ fontFamily:'DM Serif Display,serif', fontSize:48, color:C.text, marginBottom:4 }}>€{loading?'—':credit.toFixed(2)}</div>
        <div style={{ fontSize:12, color:C.muted }}>Applied automatically at checkout</div>
      </div>

      {/* How it works */}
      <div style={{ background:'rgba(255,255,255,0.04)', borderRadius:12, padding:'14px 16px', marginBottom:16 }}>
        <div style={{ fontSize:13, fontWeight:500, color:C.text, marginBottom:8, fontFamily:'DM Sans,sans-serif' }}>{'How credit works'||'How credit works'}</div>
        <div style={{ fontSize:12, color:C.muted, lineHeight:1.7, fontFamily:'DM Sans,sans-serif' }}>
          When you are due a refund, you can choose to receive it as Isla Drop credit instead of waiting 3-5 business days for a bank transfer. Credit is applied instantly and automatically deducted from your next order. You can also request a cash refund at any time using the button below.
        </div>
      </div>

      {credit > 0 && (
        <button onClick={requestCashback} disabled={redeeming}
          style={{ width:'100%', padding:'13px', background:'rgba(255,255,255,0.08)', border:'0.5px solid ' + C.border, borderRadius:12, fontFamily:'DM Sans,sans-serif', fontSize:14, color:C.muted, cursor:'pointer', marginBottom:16 }}>
          {redeeming ? 'Requesting...' : 'Request cash refund instead'}
        </button>
      )}

      {/* Transactions */}
      {transactions.length > 0 && (
        <>
          <div style={{ fontSize:11, color:C.muted, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:10, fontFamily:'DM Sans,sans-serif' }}>Transaction History</div>
          {transactions.map((t,i) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:`0.5px solid rgba(255,255,255,0.06)` }}>
              <div>
                <div style={{ fontSize:13, color:C.text, fontFamily:'DM Sans,sans-serif' }}>{TRANS_LABELS[t.type]||t.type}</div>
                <div style={{ fontSize:11, color:C.muted, marginTop:1 }}>{new Date(t.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}</div>
              </div>
              <div style={{ fontSize:14, fontWeight:500, color:TRANS_COLORS[t.type]||C.text }}>
                {t.type==='used'?'-':'+'}€{t.amount?.toFixed(2)}
              </div>
            </div>
          ))}
        </>
      )}
      {!loading && transactions.length === 0 && (
        <div style={{ textAlign:'center', padding:'20px 0', color:C.muted, fontSize:13 }}>No credit transactions yet</div>
      )}
    </div>
  )
}

// ── About ─────────────────────────────────────────────────────
function AboutIsla({ onBack }) {
  return (
    <div style={{ padding:'20px 16px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:24 }}>
        <button onClick={onBack} style={{ background:'none', border:'none', color:C.muted, cursor:'pointer', fontSize:20, padding:0 }}>←</button>
        <div style={{ fontFamily:'DM Serif Display,serif', fontSize:22, color:C.text }}>About Isla Drop</div>
      </div>

      <div style={{ textAlign:'center', marginBottom:28 }}>
        <div style={{ fontFamily:'DM Serif Display,serif', fontSize:36, color:C.text, marginBottom:4 }}>Isla Drop</div>
        <div style={{ fontSize:12, color:C.muted, letterSpacing:'2px', textTransform:'uppercase' }}>Ibiza · 24/7</div>
      </div>

      {[
        { title:'Who we are', body:"Isla Drop is Ibiza's premium 24/7 delivery service. We deliver drinks, food, tobacco, beach essentials and luxury concierge experiences directly to your villa, hotel, beach or yacht — anywhere on the island, any time of day or night." },
        { title:'Our mission', body:"We believe the best moments in Ibiza should never be interrupted. Whether you need ice at 3am, champagne for a sunset or a Michelin-star dinner reservation — Isla Drop is your personal Ibiza concierge, always one tap away." },
        { title:'Delivery', body:"We deliver across the entire island of Ibiza. Our drivers are online 24 hours a day, 7 days a week throughout the season. Estimated delivery time is 20-40 minutes depending on your location." },
        { title:'Concierge', body:"Beyond delivery, we partner with the finest boats, villas, restaurants, beach clubs and experiences on the island. Our AI concierge and human team work together to secure the best bookings for you." },
        { title:'Contact', body:"Email: support@isladrop.net\nConcierge: concierge@isladrop.net\nWebsite: isladrop.net" },
      ].map(({ title, body }) => (
        <div key={title} style={{ background:C.card, border:'0.5px solid ' + C.border, borderRadius:12, padding:'14px 16px', marginBottom:10 }}>
          <div style={{ fontSize:13, fontWeight:500, color:C.text, marginBottom:6, fontFamily:'DM Sans,sans-serif' }}>{title}</div>
          <div style={{ fontSize:13, color:C.muted, lineHeight:1.65, fontFamily:'DM Sans,sans-serif', whiteSpace:'pre-line' }}>{body}</div>
        </div>
      ))}

      <div style={{ textAlign:'center', marginTop:20, fontSize:11, color:'rgba(255,255,255,0.2)', fontFamily:'DM Sans,sans-serif' }}>
        Version 1.0 · Made with ❤️ for Ibiza
      </div>
    </div>
  )
}

// ── Main AccountView ──────────────────────────────────────────

// ── Spend Tracker ─────────────────────────────────────────────
function SpendTracker({ onBack }) {
  const { user } = useAuthStore()
  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod]   = useState('month')

  useEffect(() => {
    const load = async () => {
      try {
        const { supabase } = await import('../../lib/supabase')
        const since = period === 'month'
          ? new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
          : period === '3months'
            ? new Date(Date.now() - 90 * 86400000).toISOString()
            : new Date(new Date().getFullYear(), 0, 1).toISOString()
        const { data } = await supabase
          .from('orders')
          .select('total, created_at, status, order_items(quantity, product_id)')
          .eq('customer_id', user.id)
          .eq('status', 'delivered')
          .gte('created_at', since)
          .order('created_at', { ascending: false })
        if (data) setOrders(data)
      } catch {}
      setLoading(false)
    }
    load()
  }, [period])

  const total  = orders.reduce((s, o) => s + (o.total || 0), 0)
  const avgOrder = orders.length > 0 ? total / orders.length : 0
  const thisMonthName = new Date().toLocaleDateString('en-GB', { month:'long' })

  return (
    <div style={{ padding:'0 16px 32px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
        <button onClick={onBack} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.6)', cursor:'pointer', fontSize:20, padding:0 }}>←</button>
        <div style={{ fontFamily:'DM Serif Display,serif', fontSize:22, color:'white' }}>My Spend</div>
      </div>

      <div style={{ display:'flex', gap:6, marginBottom:16 }}>
        {[['month', thisMonthName], ['3months', '3 Months'], ['year', 'This Year']].map(([v,l]) => (
          <button key={v} onClick={() => { setPeriod(v); setLoading(true) }}
            style={{ flex:1, padding:'8px', borderRadius:20, fontSize:11, background: period===v?'rgba(255,255,255,0.9)':'rgba(255,255,255,0.08)', color: period===v?'#0D3B4A':'rgba(255,255,255,0.6)', border:'none', cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
            {l}
          </button>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:20 }}>
        {[
          { v:'€' + total.toFixed(2), l:'Total spent', color:'#E8A070' },
          { v:orders.length, l:'Orders placed', color:'white' },
          { v:'€' + avgOrder.toFixed(2), l:'Avg order', color:'white' },
          { v: orders.length > 0 ? '€' + (total / Math.max(1, new Date().getDate())).toFixed(2) : '€0', l:'Daily avg', color:'white' },
        ].map(s => (
          <div key={s.l} style={{ background:'rgba(255,255,255,0.08)', borderRadius:12, padding:'14px' }}>
            <div style={{ fontSize:22, fontWeight:600, color:s.color }}>{s.v}</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.45)', marginTop:2 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {loading ? <div style={{ textAlign:'center', padding:20, color:'rgba(255,255,255,0.4)' }}>{'Loading...'||'Loading...'}</div> : (
        orders.length === 0
          ? <div style={{ textAlign:'center', padding:30, color:'rgba(255,255,255,0.4)', fontSize:13 }}>No orders in this period</div>
          : orders.map((o, i) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'0.5px solid rgba(255,255,255,0.07)' }}>
              <div style={{ fontSize:13, color:'white' }}>
                {new Date(o.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'short' })}
              </div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)' }}>{(o.order_items||[]).reduce((s,i)=>s+(i.quantity||1),0)} items</div>
              <div style={{ fontSize:14, fontWeight:500, color:'#E8A070' }}>€{(o.total||0).toFixed(2)}</div>
            </div>
          ))
      )}
    </div>
  )
}

export default function AccountView({ t }) {
  const { user, profile, clear } = useAuthStore()
  const [showAuth, setShowAuth]   = useState(false)
  const [screen, setScreen]       = useState(null) // null | 'orders' | 'favourites' | 'details' | 'addresses' | 'credit' | 'support' | 'about'

  const signOut = () => {
    import('../../lib/supabase').then(m => m.supabase.auth.signOut())
    clear()
  }

  // Sub-screens
  if (screen === 'orders')     return <MyOrders      onBack={() => setScreen(null)} />
  if (screen === 'favourites') return <MyFavourites  onBack={() => setScreen(null)} />
  if (screen === 'details')    return <MyDetails     onBack={() => setScreen(null)} />
  if (screen === 'addresses')  return <MyAddresses   onBack={() => setScreen(null)} />
  if (screen === 'credit')     return <MyCredit      onBack={() => setScreen(null)} />
  if (screen === 'about')      return <AboutIsla     onBack={() => setScreen(null)} />
  if (screen === 'loyalty')    return <LoyaltyPoints  onBack={() => setScreen(null)} />
  if (screen === 'spend')      return <SpendTracker   onBack={() => setScreen(null)} />
  if (screen === 'support')    return (
    <div style={{ padding:'20px 16px', height:'80vh', display:'flex', flexDirection:'column' }}>
      <SupportChat onBack={() => setScreen(null)} />
    </div>
  )

  return (
    <div style={{ padding:'20px 16px 32px' }}>
      <div style={{ fontFamily:'DM Serif Display,serif', fontSize:26, color:C.text, marginBottom:20 }}>Account</div>

      {user ? (
        <>
          {/* Profile card */}
          <div style={{ background:'rgba(255,255,255,0.07)', borderRadius:14, padding:16, marginBottom:16, display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:52, height:52, borderRadius:'50%', background:'linear-gradient(135deg,#C4683A,#E8854A)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>
              {(profile?.full_name||'U').charAt(0).toUpperCase()}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:16, fontWeight:500, color:C.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{profile?.full_name||'Guest'}</div>
              <div style={{ fontSize:12, color:C.muted, marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.email}</div>
            </div>
            <button onClick={() => setScreen('details')} style={{ padding:'7px 12px', background:'rgba(255,255,255,0.08)', border:'0.5px solid ' + C.border, borderRadius:8, fontSize:12, color:C.muted, cursor:'pointer', fontFamily:'DM Sans,sans-serif', flexShrink:0 }}>Edit</button>
          </div>

          {/* Main menu */}
          <Row icon="📦" label="My Orders"     sub="Order history and receipts"          onClick={() => setScreen('orders')} />
          <Row icon="❤️" label="My Favourites" sub="Saved products for quick ordering"    onClick={() => setScreen('favourites')} />
          <Row icon="👤" label="My Details"    sub="Name, phone and profile info"         onClick={() => setScreen('details')} />
          <Row icon="📍" label="Addresses"     sub="Your saved and recent addresses"      onClick={() => setScreen('addresses')} />

          {/* Credit — highlighted */}
          <div onClick={() => setScreen('credit')}
            style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 16px', background:'rgba(196,104,58,0.12)', border:'0.5px solid rgba(196,104,58,0.3)', borderRadius:12, marginBottom:8, cursor:'pointer' }}>
            <span style={{ fontSize:18 }}>💳</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, color:C.text, fontFamily:'DM Sans,sans-serif' }}>{'My Credit'||'My Credit'}</div>
              <div style={{ fontSize:11, color:'rgba(196,104,58,0.8)', marginTop:1, fontFamily:'DM Sans,sans-serif' }}>Refund credit · Instant to use at checkout</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
          </div>

          {/* Spend Tracker */}
          <Row icon="📊" label="My Spend" sub="Monthly spend summary" onPress={() => setScreen('spend')} />
          {/* Loyalty */}
          <div onClick={() => setScreen('loyalty')}
            style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 16px', background:'linear-gradient(135deg,rgba(139,96,32,0.2),rgba(196,104,58,0.1))', border:'0.5px solid rgba(139,96,32,0.3)', borderRadius:12, marginBottom:8, cursor:'pointer' }}>
            <span style={{ fontSize:18 }}>⭐</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, color:'white', fontFamily:'DM Sans,sans-serif' }}>Isla Rewards</div>
              <div style={{ fontSize:11, color:'rgba(196,104,58,0.8)', marginTop:1, fontFamily:'DM Sans,sans-serif' }}>Earn points · Tier rewards · Refer friends</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
          </div>

          {/* Support */}
          <Row icon="💬" label="Customer Support" sub="AI-powered 24/7 support" onClick={() => setScreen('support')} accent />

          {/* About */}
          <Row icon="🌴" label="About Isla Drop" sub="Our story and contact details" onClick={() => setScreen('about')} />

          {/* Divider */}
          <div style={{ height:1, background:'rgba(255,255,255,0.07)', margin:'16px 0' }} />

          {/* Sign out */}
          <div onClick={signOut}
            style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 16px', background:'rgba(196,104,58,0.08)', border:'0.5px solid rgba(196,104,58,0.2)', borderRadius:12, cursor:'pointer' }}>
            <span style={{ fontSize:18 }}>🚪</span>
            <span style={{ fontSize:14, color:'#E8A070', fontFamily:'DM Sans,sans-serif' }}>{'Sign out'||'Sign out'}</span>
          </div>
        </>
      ) : (
        <>
          {showAuth
            ? <div style={{ background:'rgba(255,255,255,0.05)', borderRadius:16, padding:20 }}>
                <AuthScreen onClose={() => setShowAuth(false)} />
              </div>
            : <>
                <div style={{ textAlign:'center', padding:'30px 0 20px' }}>
                  <div style={{ fontSize:48, marginBottom:14 }}>👤</div>
                  <div style={{ fontFamily:'DM Serif Display,serif', fontSize:22, color:C.text, marginBottom:8 }}>{'My account'||'Your account'}</div>
                  <div style={{ fontSize:14, color:C.muted, marginBottom:24 }}>Sign in to track orders, save addresses and more</div>
                </div>
                <button onClick={() => setShowAuth(true)}
                  style={{ width:'100%', padding:'14px', background:'#C4683A', color:C.text, border:'none', borderRadius:12, fontFamily:'DM Sans,sans-serif', fontSize:15, fontWeight:500, cursor:'pointer', marginBottom:10 }}>
                  Sign in / Create account
                </button>
                <Row icon="💬" label="Customer Support" sub="Get help without signing in" onClick={() => setScreen('support')} />
                <Row icon="🌴" label="About Isla Drop"  sub="Our story and contact details" onClick={() => setScreen('about')} />
              </>
          }
        </>
      )}
    </div>
  )
}
