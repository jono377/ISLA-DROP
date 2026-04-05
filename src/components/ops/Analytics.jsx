import { useState, useEffect } from 'react'

function StatCard({ value, label, sub, color, icon }) {
  return (
    <div style={{ background:'white', borderRadius:12, padding:'14px 16px', border:'0.5px solid rgba(42,35,24,0.1)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <div style={{ fontSize:26, fontWeight:600, color: color || '#0D3B4A' }}>{value}</div>
          <div style={{ fontSize:12, color:'#7A6E60', marginTop:2 }}>{label}</div>
          {sub && <div style={{ fontSize:11, color:'#5A6B3A', marginTop:2 }}>{sub}</div>}
        </div>
        <span style={{ fontSize:22 }}>{icon}</span>
      </div>
    </div>
  )
}

function BarChart({ data, label, color }) {
  if (!data || data.length === 0) return null
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div>
      <div style={{ fontSize:12, color:'#7A6E60', marginBottom:10, fontWeight:500 }}>{label}</div>
      <div style={{ display:'flex', alignItems:'flex-end', gap:4, height:80 }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
            <div style={{ fontSize:9, color:'#7A6E60' }}>{d.value > 0 ? d.value : ''}</div>
            <div style={{ width:'100%', background: color || '#C4683A', borderRadius:'3px 3px 0 0', height: Math.max(4, (d.value / max) * 60), transition:'height 0.4s' }} />
            <div style={{ fontSize:9, color:'#7A6E60', whiteSpace:'nowrap' }}>{d.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Analytics() {
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod]   = useState('7d')
  const [target, setTarget]   = useState(null)
  const [showTargetForm, setShowTargetForm] = useState(false)
  const [newTarget, setNewTarget] = useState('')

  const saveTarget = async () => {
    if (!newTarget) return
    try {
      const { supabase } = await import('../../lib/supabase')
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from('revenue_targets').upsert({ period, target_eur: parseFloat(newTarget), set_by: user?.id }, { onConflict: 'period' })
      setTarget(parseFloat(newTarget))
      setShowTargetForm(false)
      setNewTarget('')
    } catch {}
  }

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const { supabase } = await import('../../lib/supabase')
        const now = new Date()
        const daysBack = period === '7d' ? 7 : period === '30d' ? 30 : 1
        const since = new Date(now - daysBack * 86400000).toISOString()

        const [ordersRes, profilesRes, driversRes, earningsRes, ratingsRes, targetRes] = await Promise.all([
          supabase.from('orders').select('id, total, status, created_at, order_items(quantity)').gte('created_at', since),
          supabase.from('profiles').select('id, role, created_at').gte('created_at', since),
          supabase.from('profiles').select('id').eq('role', 'driver'),
          supabase.from('driver_earnings').select('total, status').gte('created_at', since),
          supabase.from('order_ratings').select('order_rating').gte('created_at', since),
          supabase.from('revenue_targets').select('target_eur').eq('period', period).single(),
        ])
        if (targetRes.data) setTarget(targetRes.data.target_eur)

        const orders = ordersRes.data || []
        const delivered = orders.filter(o => o.status === 'delivered')
        const revenue = delivered.reduce((s, o) => s + (o.total || 0), 0)
        const newCustomers = (profilesRes.data || []).filter(p => p.role === 'customer').length
        const totalItems = delivered.reduce((s, o) => s + (o.order_items || []).reduce((ss, i) => ss + (i.quantity || 1), 0), 0)
        const avgOrder = delivered.length > 0 ? revenue / delivered.length : 0

        // Build hourly chart (last 24h)
        const hourlyMap = {}
        const hourOrders = period === '1d' ? orders : orders.filter(o => new Date(o.created_at) > new Date(now - 86400000))
        hourOrders.forEach(o => {
          const h = new Date(o.created_at).getHours()
          hourlyMap[h] = (hourlyMap[h] || 0) + 1
        })
        const hourlyData = Array.from({length: 24}, (_, h) => ({
          label: h % 6 === 0 ? h + 'h' : '',
          value: hourlyMap[h] || 0
        }))

        // Daily revenue chart
        const dailyMap = {}
        orders.forEach(o => {
          const d = new Date(o.created_at).toLocaleDateString('en-GB', { weekday:'short' })
          dailyMap[d] = (dailyMap[d] || 0) + (o.total || 0)
        })

        const ratings = (ratingsRes.data || []).map(r => r.order_rating).filter(Boolean)
        const avgRating = ratings.length > 0 ? ratings.reduce((s,r)=>s+r,0)/ratings.length : null
        setStats({
          totalOrders: orders.length,
          avgRating,
          delivered: delivered.length,
          revenue,
          avgOrder,
          newCustomers,
          totalItems,
          totalDrivers: (driversRes.data || []).length,
          pendingPayouts: (earningsRes.data || []).filter(e => e.status === 'pending').reduce((s, e) => s + (e.total || 0), 0),
          hourlyData,
          conversionRate: orders.length > 0 ? Math.round((delivered.length / orders.length) * 100) : 0,
        })
      } catch (err) { console.error(err) }
      setLoading(false)
    }
    load()
  }, [period])

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div style={{ fontFamily:'DM Serif Display,serif', fontSize:22, color:'#0D3B4A' }}>Analytics</div>
        <div style={{ display:'flex', gap:6 }}>
          {[['1d','Today'],['7d','7 days'],['30d','30 days']].map(([v,l]) => (
            <button key={v} onClick={() => setPeriod(v)}
              style={{ padding:'6px 12px', borderRadius:20, fontSize:12, background: period===v?'#0D3B4A':'rgba(0,0,0,0.05)', color: period===v?'white':'#7A6E60', border:'none', cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:40, color:'#7A6E60' }}>Loading analytics...</div>
      ) : stats ? (
        <>
          {/* Revenue target */}
          {target && (
            <div style={{ background:'white', borderRadius:12, padding:'14px 16px', border:'0.5px solid rgba(42,35,24,0.1)', marginBottom:10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <div style={{ fontSize:13, color:'#7A6E60' }}>Revenue target ({period})</div>
                <div style={{ fontSize:13, fontWeight:500, color:'#0D3B4A' }}>€{stats.revenue.toFixed(0)} / €{target.toFixed(0)}</div>
              </div>
              <div style={{ background:'#F5F0E8', borderRadius:20, height:8 }}>
                <div style={{ height:'100%', width:Math.min(100,Math.round((stats.revenue/target)*100))+'%', background: stats.revenue>=target?'#5A6B3A':'#C4683A', borderRadius:20, transition:'width 0.5s' }} />
              </div>
              <div style={{ fontSize:11, color: stats.revenue>=target?'#5A6B3A':'#C4683A', marginTop:4 }}>
                {stats.revenue>=target ? '✓ Target achieved!' : '€' + (target-stats.revenue).toFixed(0) + ' to go'}
              </div>
            </div>
          )}
          {/* Set target */}
          <div style={{ marginBottom:12 }}>
            <button onClick={()=>setShowTargetForm(!showTargetForm)}
              style={{ fontSize:12, color:'#7A6E60', background:'none', border:'none', cursor:'pointer', fontFamily:'DM Sans,sans-serif', padding:0, textDecoration:'underline' }}>
              {showTargetForm?'Cancel':'Set revenue target'}
            </button>
            {showTargetForm && (
              <div style={{ display:'flex', gap:8, marginTop:8 }}>
                <input type="number" value={newTarget} onChange={e=>setNewTarget(e.target.value)} placeholder="Target €"
                  style={{ flex:1, padding:'8px 12px', border:'0.5px solid rgba(42,35,24,0.2)', borderRadius:8, fontFamily:'DM Sans,sans-serif', fontSize:13, outline:'none' }} />
                <button onClick={saveTarget}
                  style={{ padding:'8px 14px', background:'#0D3B4A', color:'white', border:'none', borderRadius:8, fontSize:12, cursor:'pointer' }}>
                  Save
                </button>
              </div>
            )}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
            <StatCard value={'€' + stats.revenue.toFixed(0)} label="Revenue" sub={'Period: ' + period} color='#C4683A' icon="💰" />
            <StatCard value={stats.totalOrders} label="Total orders" sub={stats.delivered + ' delivered'} icon="📦" />
            <StatCard value={'€' + stats.avgOrder.toFixed(2)} label="Avg order value" icon="📊" />
            <StatCard value={stats.conversionRate + '%'} label="Completion rate" icon="✅" />
            <StatCard value={stats.avgRating ? stats.avgRating.toFixed(1) + ' ⭐' : '—'} label="Avg order rating" icon="⭐" />
            <StatCard value={stats.newCustomers} label="New customers" icon="👤" />
            <StatCard value={stats.totalItems} label="Items delivered" icon="🛒" />
            <StatCard value={'€' + stats.pendingPayouts.toFixed(0)} label="Driver payouts due" color='#8B7020' icon="💳" />
          </div>

          <div style={{ background:'white', borderRadius:12, padding:16, border:'0.5px solid rgba(42,35,24,0.1)', marginBottom:12 }}>
            <BarChart data={stats.hourlyData} label="Orders by hour (last 24h)" color='#2B7A8B' />
          </div>
        </>
      ) : (
        <div style={{ textAlign:'center', padding:40, color:'#7A6E60' }}>No data available</div>
      )}
    </div>
  )
}
