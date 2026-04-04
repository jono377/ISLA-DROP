import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ANTHROPIC_API_KEY    = Deno.env.get('ANTHROPIC_API_KEY')!
const RESEND_API_KEY       = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL         = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function sendEmail(to: string | string[], subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Isla Drop Operations <admin@isladrop.net>',
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    }),
  })
  if (!res.ok) console.error('Email failed:', await res.text())
}

// ── AI analyses stock and adjusts thresholds ──────────────────
async function aiAnalyseStock(stockItems: any[], recentAlerts: any[]) {
  const summary = stockItems.map(s =>
    `${s.product_name}|${s.category}|qty:${s.current_qty}|max:${s.max_qty}|sold_week:${s.units_sold_week}|sold_today:${s.units_sold_today}|velocity:${s.velocity}|threshold:${s.alert_threshold}`
  ).join('\n')

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'anthropic-version': '2023-06-01', 'x-api-key': ANTHROPIC_API_KEY },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `You are the stock management AI for Isla Drop, a 24/7 delivery service in Ibiza.

Analyse this stock data and return recommendations:

STOCK DATA (name|category|qty|max|sold_week|sold_today|velocity|current_threshold):
${summary}

RECENT ALERTS (last 24h):
${recentAlerts.map(a => `${a.product_name}: ${a.alert_type} at ${a.pct_at_alert}%`).join('\n') || 'None'}

For each item that needs attention, return a JSON array:
[
  {
    "product_id": "...",
    "action": "adjust_threshold" | "send_alert" | "critical_alert" | "ok",
    "new_threshold": 0.25,
    "new_velocity": "slow|normal|fast|critical",
    "alert_type": "low|critical|out_of_stock",
    "message": "Brief reason",
    "driver_instruction": "Optional: nearest store to buy from if critically low"
  }
]

Rules:
- Fast-moving items (ice, Red Bull, water) should alert at 35% stock remaining
- Normal items alert at 25%
- Slow items alert at 15%
- If sold_today > sold_week/7 * 1.5 it means demand is spiking — increase threshold
- If qty is 0 — always critical_alert
- If qty/max < threshold — send_alert
- Only include items that need action, skip items that are fine
- Return ONLY the JSON array, no other text`
      }]
    })
  })

  if (!res.ok) return []
  const data = await res.json()
  const raw = data.content?.[0]?.text || '[]'
  try {
    return JSON.parse(raw.replace(/```json|```/g, '').trim())
  } catch {
    return []
  }
}

// ── Process order — deduct stock ──────────────────────────────
async function processOrderStock(orderItems: any[]) {
  const results = []
  for (const item of orderItems) {
    const { data: stock } = await supabase
      .from('stock')
      .select('*')
      .eq('product_id', item.product_id)
      .single()

    if (!stock) continue

    const newQty = Math.max(0, stock.current_qty - item.quantity)
    const pctRemaining = stock.max_qty > 0 ? (newQty / stock.max_qty) * 100 : 0

    await supabase.from('stock').update({
      current_qty: newQty,
      units_sold_today: stock.units_sold_today + item.quantity,
      units_sold_week: stock.units_sold_week + item.quantity,
      units_sold_total: stock.units_sold_total + item.quantity,
      last_sold: new Date().toISOString(),
    }).eq('product_id', item.product_id)

    results.push({ ...stock, current_qty: newQty, pct_remaining: pctRemaining })
  }
  return results
}

// ── Format alert email ────────────────────────────────────────
function formatAlertEmail(alerts: any[], stockMap: Record<string, any>): string {
  const criticals = alerts.filter(a => a.action === 'critical_alert' || a.alert_type === 'out_of_stock')
  const lows = alerts.filter(a => a.action === 'send_alert' && a.alert_type === 'low')

  return `
<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f5f0e8;">
<div style="background:white;border-radius:12px;padding:24px;">
  <h2 style="color:#0D3B4A;margin-top:0;">⚠️ Isla Drop Stock Alert</h2>
  <p style="color:#666;">Automatic stock monitoring report — ${new Date().toLocaleString('en-GB', { timeZone: 'Europe/Madrid' })} (Ibiza time)</p>

  ${criticals.length > 0 ? `
  <div style="background:#fff0f0;border-left:4px solid #C4683A;padding:16px;border-radius:0 8px 8px 0;margin:16px 0;">
    <h3 style="color:#C4683A;margin:0 0 12px;">🚨 Critical / Out of Stock (${criticals.length} items)</h3>
    <table style="width:100%;border-collapse:collapse;">
      <tr style="background:#f5f0e8;"><th style="padding:8px;text-align:left;">Product</th><th style="padding:8px;">Qty</th><th style="padding:8px;">% Left</th><th style="padding:8px;text-align:left;">Action</th></tr>
      ${criticals.map(a => {
        const s = stockMap[a.product_id] || {}
        const pct = s.max_qty > 0 ? Math.round((s.current_qty / s.max_qty) * 100) : 0
        return `<tr>
          <td style="padding:8px;border-bottom:1px solid #eee;"><strong>${a.product_id}</strong><br><small style="color:#666;">${a.message}</small></td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${s.current_qty ?? '?'}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;color:#C4683A;font-weight:bold;">${pct}%</td>
          <td style="padding:8px;border-bottom:1px solid #eee;font-size:12px;">${a.driver_instruction || 'Restock immediately'}</td>
        </tr>`
      }).join('')}
    </table>
  </div>` : ''}

  ${lows.length > 0 ? `
  <div style="background:#fffbf0;border-left:4px solid #F5C97A;padding:16px;border-radius:0 8px 8px 0;margin:16px 0;">
    <h3 style="color:#8B7020;margin:0 0 12px;">⚡ Low Stock Warning (${lows.length} items)</h3>
    <table style="width:100%;border-collapse:collapse;">
      <tr style="background:#f5f0e8;"><th style="padding:8px;text-align:left;">Product</th><th style="padding:8px;">Qty</th><th style="padding:8px;">% Left</th><th style="padding:8px;text-align:left;">Note</th></tr>
      ${lows.map(a => {
        const s = stockMap[a.product_id] || {}
        const pct = s.max_qty > 0 ? Math.round((s.current_qty / s.max_qty) * 100) : 0
        return `<tr>
          <td style="padding:8px;border-bottom:1px solid #eee;">${a.product_id}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${s.current_qty ?? '?'}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;color:#8B7020;font-weight:bold;">${pct}%</td>
          <td style="padding:8px;border-bottom:1px solid #eee;font-size:12px;">${a.message}</td>
        </tr>`
      }).join('')}
    </table>
  </div>` : ''}

  <p style="color:#666;font-size:12px;margin-top:20px;">
    <a href="https://isla-drop.vercel.app/?staff=true" style="color:#C4683A;">Open Stock Dashboard →</a><br>
    Isla Drop Operations · admin@isladrop.net
  </p>
</div>
</body></html>`
}

// ── Main handler ──────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' } })
  }

  try {
    const body = await req.json()

    // ── Deduct stock when order placed ───────────────────────
    if (body.type === 'order_placed') {
      const { order_items } = body
      const updated = await processOrderStock(order_items)

      // Check if any updated items are now below threshold
      const alerts = []
      for (const item of updated) {
        const pct = item.pct_remaining
        if (pct <= (item.alert_threshold * 100) && !item.alert_sent_at) {
          alerts.push({
            product_id: item.product_id,
            action: pct === 0 ? 'critical_alert' : 'send_alert',
            alert_type: pct === 0 ? 'out_of_stock' : 'low',
            message: pct === 0 ? 'OUT OF STOCK' : `${Math.round(pct)}% remaining`,
          })
          // Log alert
          await supabase.from('stock_alerts').insert({
            product_id: item.product_id,
            product_name: item.product_name,
            alert_type: pct === 0 ? 'out_of_stock' : 'low',
            qty_at_alert: item.current_qty,
            pct_at_alert: pct,
            message: `Dropped below threshold after order`,
          })
          // Mark alert sent
          await supabase.from('stock').update({ alert_sent_at: new Date().toISOString() })
            .eq('product_id', item.product_id)
        }
      }

      if (alerts.length > 0) {
        const stockMap = Object.fromEntries(updated.map(s => [s.product_id, s]))
        const html = formatAlertEmail(alerts, stockMap)
        await sendEmail(
          ['admin@isladrop.net', 'jonathon@isladrop.net', 'alejandro@isladrop.net'],
          `⚠️ Stock Alert — ${alerts.length} item${alerts.length > 1 ? 's' : ''} need attention`,
          html
        )
      }

      return new Response(JSON.stringify({ success: true, alerts_sent: alerts.length }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      })
    }

    // ── Run AI stock analysis (called periodically or manually) ─
    if (body.type === 'analyse') {
      const { data: stockItems } = await supabase.from('stock').select('*')
      const { data: recentAlerts } = await supabase.from('stock_alerts')
        .select('*').gte('created_at', new Date(Date.now() - 86400000).toISOString())

      if (!stockItems?.length) {
        return new Response(JSON.stringify({ success: true, message: 'No stock data yet' }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        })
      }

      const recommendations = await aiAnalyseStock(stockItems, recentAlerts || [])
      const stockMap = Object.fromEntries(stockItems.map(s => [s.product_id, s]))

      let alertsToSend = []
      for (const rec of recommendations) {
        if (rec.action === 'adjust_threshold') {
          await supabase.from('stock').update({
            alert_threshold: rec.new_threshold,
            velocity: rec.new_velocity,
          }).eq('product_id', rec.product_id)
        }
        if (rec.action === 'send_alert' || rec.action === 'critical_alert') {
          // Check we haven't already alerted in last 4 hours
          const stock = stockMap[rec.product_id]
          const lastAlert = stock?.alert_sent_at ? new Date(stock.alert_sent_at).getTime() : 0
          const hoursSince = (Date.now() - lastAlert) / 3600000
          if (hoursSince > 4) {
            alertsToSend.push(rec)
            await supabase.from('stock_alerts').insert({
              product_id: rec.product_id,
              product_name: stockMap[rec.product_id]?.product_name || rec.product_id,
              alert_type: rec.alert_type || 'low',
              qty_at_alert: stockMap[rec.product_id]?.current_qty,
              pct_at_alert: stockMap[rec.product_id]?.max_qty > 0
                ? (stockMap[rec.product_id].current_qty / stockMap[rec.product_id].max_qty) * 100
                : 0,
              message: rec.message,
            })
            await supabase.from('stock').update({ alert_sent_at: new Date().toISOString() })
              .eq('product_id', rec.product_id)
          }
        }
      }

      if (alertsToSend.length > 0) {
        const html = formatAlertEmail(alertsToSend, stockMap)
        await sendEmail(
          ['admin@isladrop.net', 'jonathon@isladrop.net', 'alejandro@isladrop.net'],
          `⚠️ Stock Alert — AI Analysis — ${alertsToSend.length} item${alertsToSend.length > 1 ? 's' : ''} need attention`,
          html
        )
      }

      return new Response(JSON.stringify({
        success: true,
        recommendations: recommendations.length,
        alerts_sent: alertsToSend.length,
      }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
    }

    // ── Manual restock ────────────────────────────────────────
    if (body.type === 'restock') {
      const { product_id, qty_added, notes } = body
      const { data: stock } = await supabase.from('stock').select('*').eq('product_id', product_id).single()
      if (!stock) throw new Error('Product not found in stock')

      await supabase.from('stock').update({
        current_qty: stock.current_qty + qty_added,
        last_restocked: new Date().toISOString(),
        alert_sent_at: null, // Reset alert so it can fire again if needed
        notes,
      }).eq('product_id', product_id)

      await supabase.from('stock_alerts').insert({
        product_id,
        product_name: stock.product_name,
        alert_type: 'restocked',
        qty_at_alert: stock.current_qty + qty_added,
        message: `Restocked +${qty_added} units. ${notes || ''}`,
      })

      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      })
    }

    return new Response(JSON.stringify({ error: 'Unknown type' }), { status: 400 })

  } catch (err) {
    console.error('Stock manager error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  }
})
