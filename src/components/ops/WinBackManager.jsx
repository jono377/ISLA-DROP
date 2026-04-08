import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

export default function WinBackManager() {
  const [dormant, setDormant]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [sending, setSending]   = useState(null)
  const [threshold, setThreshold] = useState(14)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const { supabase } = await import('../../lib/supabase')
        const cutoff = new Date(Date.now() - threshold * 86400000).toISOString()
        // Find customers whose last order was before the cutoff
        const { data: orders } = await supabase
          .from('orders')
          .select('customer_id, created_at, profiles(id, full_name, email)')
          .eq('status', 'delivered')
          .order('created_at', { ascending: false })

        if (orders) {
          // Group by customer, find last order date
          const lastOrder = {}
          orders.forEach(o => {
            if (!lastOrder[o.customer_id]) lastOrder[o.customer_id] = { ...o }
          })
          const dormantCustomers = Object.values(lastOrder)
            .filter(o => o.created_at < cutoff && o.profiles?.email)
            .slice(0, 50)
          setDormant(dormantCustomers)
        }
      } catch (err) { console.error(err) }
      setLoading(false)
    }
    load()
  }, [threshold])

  const generateCode = (email) => {
    return 'COMEBACK' + email.slice(0,3).toUpperCase() + Math.floor(Math.random()*99)
  }

  const sendWinBack = async (customer) => {
    setSending(customer.customer_id)
    try {
      const { supabase } = await import('../../lib/supabase')
      const code = generateCode(customer.profiles?.email || 'XX')
      // Create discount code
      await supabase.from('discount_codes').insert({
        code, description: 'Win-back offer — welcome back to Isla Drop!',
        discount_type: 'percentage', discount_value: 15,
        min_order_value: 30, max_uses: 1, active: true,
        notes: 'Auto-generated win-back for ' + customer.profiles?.full_name,
        ai_generated: false,
      })
      // Log campaign
      await supabase.from('winback_campaigns').insert({
        customer_id: customer.customer_id,
        discount_code: code, sent_at: new Date().toISOString(),
      })
      toast.success('Win-back code ' + code + ' created for ' + customer.profiles?.full_name)
    } catch (err) { toast.error('Failed: ' + (err.message || 'unknown error')) }
    setSending(null)
  }

  const daysAgo = (date) => Math.floor((Date.now() - new Date(date)) / 86400000)

  return (
    <div>
      <div style={{ fontFamily:'DM Serif Display,serif', fontSize:22, color:'#0D3B4A', marginBottom:4 }}>Win-Back Campaigns</div>
      <div style={{ fontSize:13, color:'#7A6E60', marginBottom:14 }}>Re-engage customers who haven\'t ordered recently</div>

      <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:16, background:'white', borderRadius:12, padding:'12px 14px', border:'0.5px solid rgba(42,35,24,0.1)' }}>
        <div style={{ fontSize:13, color:'#2A2318', flex:1 }}>Show customers inactive for more than</div>
        <select value={threshold} onChange={e => setThreshold(Number(e.target.value))}
          style={{ padding:'6px 10px', border:'0.5px solid rgba(42,35,24,0.2)', borderRadius:8, fontFamily:'DM Sans,sans-serif', fontSize:13, outline:'none' }}>
          {[7,10,14,21,30].map(d => <option key={d} value={d}>{d} days</option>)}
        </select>
      </div>

      {loading ? <div style={{ textAlign:'center', padding:30, color:'#7A6E60' }}>Finding dormant customers...</div> :
        dormant.length === 0 ? (
          <div style={{ textAlign:'center', padding:'40px 0' }}>
            <div style={{ fontSize:40, marginBottom:10 }}>🎉</div>
            <div style={{ fontSize:14, color:'#0D3B4A', fontWeight:500 }}>No dormant customers</div>
            <div style={{ fontSize:13, color:'#7A6E60', marginTop:4 }}>Everyone has ordered in the last {threshold} days!</div>
          </div>
        ) : (
          <>
            <div style={{ fontSize:12, color:'#7A6E60', marginBottom:10 }}>
              {dormant.length} customers haven\'t ordered in {threshold}+ days
            </div>
            {dormant.map(c => (
              <div key={c.customer_id} style={{ background:'white', borderRadius:12, padding:'12px 14px', marginBottom:8, border:'0.5px solid rgba(42,35,24,0.08)', display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:38, height:38, borderRadius:'50%', background:'linear-gradient(135deg,#C4683A,#E8854A)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, color:'white', flexShrink:0 }}>
                  {(c.profiles?.full_name||'?').charAt(0).toUpperCase()}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:500, color:'#2A2318' }}>{c.profiles?.full_name || 'Customer'}</div>
                  <div style={{ fontSize:12, color:'#7A6E60' }}>{c.profiles?.email}</div>
                  <div style={{ fontSize:11, color:'#C4683A', marginTop:1 }}>Last order {daysAgo(c.created_at)} days ago</div>
                </div>
                <button onClick={() => sendWinBack(c)} disabled={sending === c.customer_id}
                  style={{ padding:'8px 14px', background: sending===c.customer_id?'rgba(13,59,74,0.3)':'#0D3B4A', color:'white', border:'none', borderRadius:8, fontSize:12, cursor:'pointer', fontFamily:'DM Sans,sans-serif', fontWeight:500, whiteSpace:'nowrap' }}>
                  {sending === c.customer_id ? '...' : '🎟️ Send code'}
                </button>
              </div>
            ))}
          </>
        )
      }
    </div>
  )
}
