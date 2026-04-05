import { useState, useEffect } from 'react'

export default function CustomerProfiles() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading]     = useState(true)
  const [selected, setSelected]   = useState(null)
  const [orders, setOrders]       = useState([])
  const [search, setSearch]       = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const { supabase } = await import('../../lib/supabase')
        const { data } = await supabase
          .from('profiles')
          .select('*, orders(id, total, status, created_at)')
          .eq('role', 'customer')
          .order('created_at', { ascending: false })
          .limit(100)
        if (data) setCustomers(data)
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  const selectCustomer = async (customer) => {
    setSelected(customer)
    try {
      const { supabase } = await import('../../lib/supabase')
      const { data } = await supabase
        .from('orders')
        .select('*, order_items(quantity, product:products(name, emoji))')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false })
        .limit(20)
      if (data) setOrders(data)
    } catch {}
  }

  const filtered = customers.filter(c =>
    !search || (c.full_name||'').toLowerCase().includes(search.toLowerCase()) ||
    (c.email||'').toLowerCase().includes(search.toLowerCase())
  )

  const getCustomerStats = (c) => {
    const cOrders = c.orders || []
    const delivered = cOrders.filter(o => o.status === 'delivered')
    const ltv = delivered.reduce((s, o) => s + (o.total || 0), 0)
    return { orders: cOrders.length, delivered: delivered.length, ltv }
  }

  if (selected) {
    const stats = getCustomerStats(selected)
    return (
      <div>
        <button onClick={() => { setSelected(null); setOrders([]) }}
          style={{ background:'none', border:'none', color:'#7A6E60', cursor:'pointer', fontSize:13, marginBottom:16, display:'flex', alignItems:'center', gap:6, fontFamily:'DM Sans,sans-serif' }}>
          ← All customers
        </button>
        <div style={{ background:'white', borderRadius:14, padding:18, marginBottom:16, border:'0.5px solid rgba(42,35,24,0.1)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:14 }}>
            <div style={{ width:52, height:52, borderRadius:'50%', background:'linear-gradient(135deg,#C4683A,#E8854A)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, color:'white' }}>
              {(selected.full_name||'?').charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize:16, fontWeight:500, color:'#2A2318' }}>{selected.full_name || 'Unknown'}</div>
              <div style={{ fontSize:13, color:'#7A6E60' }}>{selected.email}</div>
              {selected.phone && <div style={{ fontSize:12, color:'#7A6E60' }}>{selected.phone}</div>}
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
            {[
              { v: stats.orders, l:'Total orders' },
              { v: stats.delivered, l:'Delivered' },
              { v: '€' + stats.ltv.toFixed(0), l:'Lifetime value', color:'#C4683A' },
            ].map(s => (
              <div key={s.l} style={{ background:'#F5F0E8', borderRadius:10, padding:'10px 12px', textAlign:'center' }}>
                <div style={{ fontSize:20, fontWeight:600, color: s.color || '#0D3B4A' }}>{s.v}</div>
                <div style={{ fontSize:11, color:'#7A6E60', marginTop:2 }}>{s.l}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop:10, fontSize:12, color:'#7A6E60' }}>
            Member since {new Date(selected.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })}
          </div>
        </div>

        <div style={{ fontSize:12, color:'#7A6E60', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:10 }}>Order history</div>
        {orders.map(o => (
          <div key={o.id} style={{ background:'white', borderRadius:10, padding:12, marginBottom:8, border:'0.5px solid rgba(42,35,24,0.08)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
              <div style={{ fontSize:13, fontWeight:500, color:'#2A2318' }}>#{o.order_number || o.id?.slice(0,8).toUpperCase()}</div>
              <div style={{ fontSize:13, fontWeight:500, color:'#C4683A' }}>€{o.total?.toFixed(2)}</div>
            </div>
            <div style={{ fontSize:12, color:'#7A6E60', marginBottom:2 }}>
              {(o.order_items||[]).slice(0,3).map(i => (i.product?.emoji || '') + ' ' + (i.product?.name || '')).join(', ')}
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#7A6E60' }}>
              <span>{new Date(o.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}</span>
              <span style={{ background: o.status==='delivered'?'rgba(90,107,58,0.1)':'rgba(196,104,58,0.1)', color: o.status==='delivered'?'#5A6B3A':'#C4683A', padding:'1px 7px', borderRadius:20 }}>{o.status}</span>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      <div style={{ fontFamily:'DM Serif Display,serif', fontSize:22, color:'#0D3B4A', marginBottom:4 }}>Customer Profiles</div>
      <div style={{ fontSize:13, color:'#7A6E60', marginBottom:14 }}>{customers.length} customers</div>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..."
        style={{ width:'100%', padding:'10px 12px', border:'0.5px solid rgba(42,35,24,0.15)', borderRadius:8, fontFamily:'DM Sans,sans-serif', fontSize:13, outline:'none', marginBottom:14, boxSizing:'border-box' }} />
      {loading ? <div style={{ textAlign:'center', padding:30, color:'#7A6E60' }}>Loading...</div> :
        filtered.map(c => {
          const stats = getCustomerStats(c)
          return (
            <div key={c.id} onClick={() => selectCustomer(c)}
              style={{ background:'white', borderRadius:12, padding:'12px 14px', marginBottom:8, border:'0.5px solid rgba(42,35,24,0.08)', cursor:'pointer', display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:40, height:40, borderRadius:'50%', background:'linear-gradient(135deg,#2B7A8B,#1A5060)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, color:'white', flexShrink:0 }}>
                {(c.full_name||'?').charAt(0).toUpperCase()}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:500, color:'#2A2318' }}>{c.full_name || 'Unknown'}</div>
                <div style={{ fontSize:12, color:'#7A6E60' }}>{c.email}</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:13, fontWeight:500, color:'#C4683A' }}>€{stats.ltv.toFixed(0)}</div>
                <div style={{ fontSize:11, color:'#7A6E60' }}>{stats.orders} orders</div>
              </div>
            </div>
          )
        })
      }
    </div>
  )
}
