// supabase/functions/send-order-receipt/index.ts
// Deploy: supabase functions deploy send-order-receipt
// Requires env: RESEND_API_KEY

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API = 'https://api.resend.com/emails'

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  try {
    const { orderId, orderNumber, email, items, total } = await req.json()
    if (!email) return new Response('No email', { status: 400 })

    const itemsHtml = (items || []).map((i: any) =>
      `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #f0e8e0">${i.product?.emoji || '📦'} ${i.product?.name || 'Item'}</td>
        <td style="padding:8px 0;border-bottom:1px solid #f0e8e0;text-align:center">${i.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px solid #f0e8e0;text-align:right">€${((i.product?.price || 0) * i.quantity).toFixed(2)}</td>
      </tr>`
    ).join('')

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:DM Sans,sans-serif">
  <div style="max-width:520px;margin:40px auto;background:white;borderRadius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#0D3545,#1a5a7a);padding:32px;text-align:center">
      <div style="font-size:40px;margin-bottom:8px">🌴</div>
      <div style="font-family:DM Serif Display,Georgia,serif;font-size:28px;color:white;margin-bottom:4px">Isla Drop</div>
      <div style="font-size:13px;color:rgba(255,255,255,0.6);letter-spacing:2px;text-transform:uppercase">Order Confirmed</div>
    </div>
    <!-- Body -->
    <div style="padding:32px">
      <div style="font-size:16px;color:#2A2318;margin-bottom:4px">Thank you for your order! 🎉</div>
      <div style="font-size:13px;color:#7A6E60;margin-bottom:24px">Order #${orderNumber || orderId?.slice(-6).toUpperCase()}</div>
      
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
        <thead>
          <tr>
            <th style="text-align:left;font-size:11px;color:#7A6E60;text-transform:uppercase;letter-spacing:1px;padding-bottom:8px">Item</th>
            <th style="text-align:center;font-size:11px;color:#7A6E60;text-transform:uppercase;letter-spacing:1px;padding-bottom:8px">Qty</th>
            <th style="text-align:right;font-size:11px;color:#7A6E60;text-transform:uppercase;letter-spacing:1px;padding-bottom:8px">Price</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      
      <div style="display:flex;justify-content:space-between;align-items:center;padding:16px;background:#f5f0e8;border-radius:12px;margin-bottom:24px">
        <div style="font-size:16px;font-weight:600;color:#2A2318">Total</div>
        <div style="font-size:20px;font-weight:700;color:#C4683A">€${(total || 0).toFixed(2)}</div>
      </div>
      
      <div style="background:#e8f5e9;border-radius:12px;padding:16px;margin-bottom:24px;text-align:center">
        <div style="font-size:24px;margin-bottom:4px">🛵</div>
        <div style="font-size:14px;font-weight:600;color:#2A2318">Your order is being prepared</div>
        <div style="font-size:12px;color:#7A6E60;margin-top:4px">Estimated delivery: 18–30 minutes</div>
      </div>
      
      <div style="text-align:center">
        <a href="https://www.isladrop.net" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#C4683A,#E8A070);color:white;border-radius:25px;text-decoration:none;font-size:14px;font-weight:600">Track Your Order →</a>
      </div>
    </div>
    <!-- Footer -->
    <div style="padding:20px 32px;background:#f5f0e8;text-align:center">
      <div style="font-size:11px;color:#7A6E60">Isla Drop · 24/7 Delivery · Ibiza</div>
      <div style="font-size:11px;color:#b0a898;margin-top:4px">Questions? Chat with us at isladrop.net</div>
    </div>
  </div>
</body>
</html>`

    const RESEND_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_KEY) {
      console.log('No RESEND_API_KEY — email not sent')
      return new Response(JSON.stringify({ ok: true, sent: false }), { headers: { 'Content-Type': 'application/json' } })
    }

    const res = await fetch(RESEND_API, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Isla Drop <orders@isladrop.net>',
        to: [email],
        subject: `🌴 Your Isla Drop order #${orderNumber || orderId?.slice(-6).toUpperCase()} is confirmed!`,
        html,
      })
    })

    const data = await res.json()
    return new Response(JSON.stringify({ ok: res.ok, data }), {
      headers: { 'Content-Type': 'application/json' },
      status: res.ok ? 200 : 500
    })

  } catch (err) {
    console.error('send-order-receipt error:', err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
