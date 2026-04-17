// ================================================================
// Supabase Edge Function: send-order-confirmation
// Point 11: Order confirmation email to customer
// Deploy: supabase functions deploy send-order-confirmation
// ================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { to, orderNumber, items, total, address, eta } = await req.json()
    if (!to || !orderNumber) return new Response('Missing required fields', { status: 400, headers: CORS })

    const RESEND_KEY = Deno.env.get('RESEND_API_KEY') || ''
    const FROM_EMAIL = 'orders@isladrop.net'

    const itemsHtml = (items || []).map((i: any) =>
      `<tr><td style="padding:8px 0;border-bottom:1px solid #f0ebe2">${i.product?.emoji||''} ${i.product?.name||i.product_name||''} × ${i.quantity}</td><td style="padding:8px 0;border-bottom:1px solid #f0ebe2;text-align:right;color:#C4683A;font-weight:600">€${((i.unit_price||i.product_price||0)*i.quantity).toFixed(2)}</td></tr>`
    ).join('')

    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width">
<style>
  body { font-family: Georgia, serif; background: #F5F0E8; margin: 0; padding: 20px; }
  .card { background: white; max-width: 520px; margin: 0 auto; border-radius: 16px; overflow: hidden; }
  .header { background: linear-gradient(135deg, #0D3B4A, #1A5263); padding: 32px; text-align: center; }
  .header h1 { color: white; font-size: 32px; margin: 0 0 4px; }
  .header p { color: rgba(255,255,255,0.6); margin: 0; font-size: 13px; letter-spacing: 2px; text-transform: uppercase; }
  .body { padding: 32px; }
  .status { background: #EAF8F0; border: 1px solid #1D9E75; border-radius: 10px; padding: 14px 16px; margin-bottom: 24px; color: #1D9E75; font-weight: 600; }
  .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0ebe2; font-size: 14px; }
  .total-row { display: flex; justify-content: space-between; padding: 14px 0; font-size: 18px; font-weight: 700; }
  .total-row span:last-child { color: #C4683A; }
  .footer { background: #0D3545; padding: 24px 32px; text-align: center; color: rgba(255,255,255,0.5); font-size: 12px; }
  table { width: 100%; border-collapse: collapse; }
</style>
</head>
<body>
<div class="card">
  <div class="header">
    <h1>Isla Drop 🌴</h1>
    <p>24/7 Delivery · Ibiza</p>
  </div>
  <div class="body">
    <div class="status">✅ Order confirmed — on its way!</div>
    <div class="detail-row"><span>Order number</span><strong>#${orderNumber}</strong></div>
    <div class="detail-row"><span>Delivery to</span><span>${address}</span></div>
    <div class="detail-row"><span>Estimated delivery</span><strong>${eta} minutes</strong></div>
    <br>
    <table>
      <tbody>${itemsHtml}</tbody>
    </table>
    <br>
    <div class="total-row"><span>Total paid</span><span>€${Number(total).toFixed(2)}</span></div>
    <p style="font-size:13px;color:#7A6E60;margin-top:24px">Track your order in the Isla Drop app. If you have any issues, contact us at <a href="mailto:support@isladrop.net" style="color:#C4683A">support@isladrop.net</a> or WhatsApp <a href="https://wa.me/34971000000" style="color:#C4683A">+34 971 000 000</a></p>
  </div>
  <div class="footer">
    Isla Drop SL · Ibiza, Balearic Islands, Spain<br>
    <a href="https://www.isladrop.net" style="color:rgba(255,255,255,0.5)">isladrop.net</a>
  </div>
</div>
</body>
</html>`

    if (!RESEND_KEY) {
      console.log('RESEND_API_KEY not set — email preview:', { to, subject: 'Order #'+orderNumber+' Confirmed — Isla Drop' })
      return new Response(JSON.stringify({ sent: false, reason: 'RESEND_API_KEY not configured' }), {
        headers: { ...CORS, 'Content-Type': 'application/json' }
      })
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + RESEND_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Isla Drop <' + FROM_EMAIL + '>',
        to: [to],
        subject: 'Order #' + orderNumber + ' confirmed — on its way! 🛵',
        html,
      })
    })

    const result = await res.json()
    return new Response(JSON.stringify({ sent: res.ok, result }), {
      status: res.ok ? 200 : 500,
      headers: { ...CORS, 'Content-Type': 'application/json' }
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' }
    })
  }
})
