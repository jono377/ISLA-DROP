// supabase/functions/abandoned-basket-reminder/index.ts
// Deploy: supabase functions deploy abandoned-basket-reminder
// Schedule: every 30 minutes via pg_cron or Supabase cron
// SQL: select cron.schedule('abandoned-basket', '*/30 * * * *', 'select net.http_post(...)');

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API = 'https://api.resend.com/emails'

serve(async (_req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Find baskets abandoned 25-35 minutes ago (not already reminded)
  const cutoffFrom = new Date(Date.now() - 35 * 60 * 1000).toISOString()
  const cutoffTo   = new Date(Date.now() - 25 * 60 * 1000).toISOString()

  const { data: abandoned } = await supabase
    .from('abandoned_baskets')
    .select('*, profiles(email, full_name)')
    .gte('abandoned_at', cutoffFrom)
    .lte('abandoned_at', cutoffTo)
    .eq('reminded', false)

  if (!abandoned?.length) return new Response(JSON.stringify({ checked: 0 }))

  const RESEND_KEY = Deno.env.get('RESEND_API_KEY')
  let sent = 0

  for (const basket of abandoned) {
    const email = basket.profiles?.email
    if (!email) continue

    const items = basket.items || []
    const total = basket.total || 0
    const firstName = basket.profiles?.full_name?.split(' ')[0] || 'there'

    const itemsText = items.slice(0, 3).map((i: any) => `${i.emoji} ${i.name}`).join(', ')

    if (RESEND_KEY) {
      await fetch(RESEND_API, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Isla Drop <orders@isladrop.net>',
          to: [email],
          subject: `${firstName}, you left something behind 🛒`,
          html: `
            <div style="font-family:DM Sans,sans-serif;max-width:480px;margin:0 auto;padding:32px">
              <div style="font-size:32px;margin-bottom:16px">🌴</div>
              <h2 style="font-family:Georgia,serif;color:#0D3545">Hey ${firstName}, your basket is waiting</h2>
              <p style="color:#7A6E60">You left <strong>${itemsText}</strong>${items.length > 3 ? ` and ${items.length-3} more` : ''} in your basket.</p>
              <p style="color:#7A6E60">Total: <strong>€${total.toFixed(2)}</strong></p>
              <a href="https://www.isladrop.net?basket=resume" style="display:inline-block;padding:14px 28px;background:#C4683A;color:white;border-radius:25px;text-decoration:none;font-weight:600;margin:16px 0">
                Complete my order →
              </a>
              <p style="color:#b0a898;font-size:12px">Isla Drop · 24/7 Delivery · Ibiza</p>
            </div>`
        })
      }).catch(() => {})
    }

    // Mark as reminded
    await supabase.from('abandoned_baskets').update({ reminded: true }).eq('user_id', basket.user_id)
    sent++
  }

  return new Response(JSON.stringify({ checked: abandoned.length, sent }))
})
