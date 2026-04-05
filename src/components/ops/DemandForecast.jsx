import { useState, useEffect } from 'react'

async function runForecast(orderHistory) {
  const summary = orderHistory.slice(0, 50).map(o =>
    new Date(o.created_at).toLocaleDateString('en-GB', { weekday:'short' }) +
    ' ' + new Date(o.created_at).getHours() + 'h: ' +
    (o.order_items||[]).map(i => i.product_name || i.product_id).join(', ')
  ).join('\n')

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
      'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY || '',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      messages: [{
        role: 'user',
        content: 'You are the demand forecasting AI for Isla Drop, a 24/7 delivery service in Ibiza. Analyse these recent orders and provide actionable stocking recommendations.\n\nRECENT ORDERS:\n' + summary + '\n\nProvide analysis as JSON:\n{"peak_times":["e.g. Friday 10pm-2am","Saturday afternoons"],"top_products":["product name","product name"],"restock_urgently":["product that will run out soon"],"restock_soon":["product to watch"],"insights":["Key insight 1","Key insight 2","Key insight 3"],"weekend_prep":"What to stock up on before the weekend"}'
      }]
    })
  })
  if (!resp.ok) throw new Error('API error')
  const data = await resp.json()
  const raw = data.content?.[0]?.text || '{}'
  return JSON.parse(raw.replace(/```json|```/g, '').trim())
}

export default function DemandForecast() {
  const [forecast, setForecast] = useState(null)
  const [loading, setLoading]   = useState(false)
  const [lastRun, setLastRun]   = useState(null)

  const run = async () => {
    setLoading(true)
    try {
      const { supabase } = await import('../../lib/supabase')
      const { data } = await supabase
        .from('orders')
        .select('created_at, order_items(product_id, quantity, product:products(name))')
        .eq('status', 'delivered')
        .order('created_at', { ascending: false })
        .limit(100)
      const enriched = (data || []).map(o => ({
        ...o,
        order_items: (o.order_items || []).map(i => ({ ...i, product_name: i.product?.name }))
      }))
      const result = await runForecast(enriched)
      setForecast(result)
      setLastRun(new Date())
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  useEffect(() => { run() }, [])

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
        <div>
          <div style={{ fontFamily:'DM Serif Display,serif', fontSize:22, color:'#0D3B4A' }}>Demand Forecast</div>
          <div style={{ fontSize:13, color:'#7A6E60' }}>
            {lastRun ? 'Last run: ' + lastRun.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' }) : 'AI analysis of order patterns'}
          </div>
        </div>
        <button onClick={run} disabled={loading}
          style={{ padding:'9px 16px', background: loading?'rgba(13,59,74,0.4)':'#0D3B4A', color:'white', border:'none', borderRadius:10, fontFamily:'DM Sans,sans-serif', fontSize:13, cursor:'pointer', fontWeight:500 }}>
          {loading ? '⏳ Analysing...' : '🤖 Refresh Forecast'}
        </button>
      </div>

      {loading && !forecast && (
        <div style={{ textAlign:'center', padding:60, color:'#7A6E60' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🤖</div>
          <div>Analysing order patterns...</div>
        </div>
      )}

      {forecast && (
        <>
          {forecast.weekend_prep && (
            <div style={{ background:'rgba(196,104,58,0.1)', border:'0.5px solid rgba(196,104,58,0.3)', borderRadius:14, padding:16, marginBottom:14 }}>
              <div style={{ fontSize:13, fontWeight:600, color:'#C4683A', marginBottom:6 }}>🚀 Weekend prep</div>
              <div style={{ fontSize:13, color:'#2A2318', lineHeight:1.6 }}>{forecast.weekend_prep}</div>
            </div>
          )}

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
            {forecast.restock_urgently?.length > 0 && (
              <div style={{ background:'rgba(196,104,58,0.08)', border:'0.5px solid rgba(196,104,58,0.2)', borderRadius:12, padding:14 }}>
                <div style={{ fontSize:12, fontWeight:600, color:'#C4683A', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.5px' }}>🚨 Restock urgently</div>
                {forecast.restock_urgently.map((p, i) => <div key={i} style={{ fontSize:13, color:'#2A2318', marginBottom:4 }}>· {p}</div>)}
              </div>
            )}
            {forecast.restock_soon?.length > 0 && (
              <div style={{ background:'rgba(245,201,122,0.1)', border:'0.5px solid rgba(245,201,122,0.3)', borderRadius:12, padding:14 }}>
                <div style={{ fontSize:12, fontWeight:600, color:'#8B7020', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.5px' }}>⚡ Restock soon</div>
                {forecast.restock_soon.map((p, i) => <div key={i} style={{ fontSize:13, color:'#2A2318', marginBottom:4 }}>· {p}</div>)}
              </div>
            )}
          </div>

          {forecast.peak_times?.length > 0 && (
            <div style={{ background:'white', borderRadius:12, padding:14, marginBottom:10, border:'0.5px solid rgba(42,35,24,0.08)' }}>
              <div style={{ fontSize:12, fontWeight:600, color:'#0D3B4A', marginBottom:8 }}>⏰ Peak demand times</div>
              {forecast.peak_times.map((t, i) => <div key={i} style={{ fontSize:13, color:'#2A2318', marginBottom:3 }}>· {t}</div>)}
            </div>
          )}

          {forecast.insights?.length > 0 && (
            <div style={{ background:'rgba(43,122,139,0.08)', borderRadius:12, padding:14, border:'0.5px solid rgba(43,122,139,0.15)' }}>
              <div style={{ fontSize:12, fontWeight:600, color:'#2B7A8B', marginBottom:8 }}>💡 Key insights</div>
              {forecast.insights.map((ins, i) => <div key={i} style={{ fontSize:13, color:'#2A2318', marginBottom:6, paddingLeft:12, position:'relative' }}><span style={{ position:'absolute', left:0 }}>·</span>{ins}</div>)}
            </div>
          )}
        </>
      )}
    </div>
  )
}
