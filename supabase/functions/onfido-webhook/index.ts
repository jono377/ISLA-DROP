// supabase/functions/onfido-webhook/index.ts
// Deploy with: supabase functions deploy onfido-webhook
//
// Set webhook URL in Onfido dashboard:
// https://YOUR_PROJECT.supabase.co/functions/v1/onfido-webhook

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req: Request) => {
  try {
    // Verify the webhook signature (recommended for production)
    // const signature = req.headers.get('X-SHA2-Signature')
    // ... validate HMAC signature against ONFIDO_WEBHOOK_TOKEN

    const payload = await req.json()
    console.log('Onfido webhook received:', JSON.stringify(payload))

    const action = payload.payload?.action
    const object = payload.payload?.object

    if (!action || !object) {
      return new Response('Missing payload', { status: 400 })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // ── Check completed ──────────────────────────────────────
    if (action === 'check.completed') {
      const checkId = object.id
      const result = object.result // 'clear' | 'consider' | 'unidentified'
      const status = object.status // 'complete'

      console.log(`Check ${checkId} result: ${result}`)

      if (result === 'clear') {
        // Mark customer as age-verified
        const { data: customer, error: findErr } = await supabase
          .from('customers')
          .select('id')
          .eq('onfido_check_id', checkId)
          .single()

        if (findErr || !customer) {
          console.error('Customer not found for check:', checkId)
          return new Response('Customer not found', { status: 404 })
        }

        // Update customer verified status
        await supabase
          .from('customers')
          .update({
            age_verified: true,
            age_verified_at: new Date().toISOString(),
          })
          .eq('id', customer.id)

        // Advance any orders stuck in age_check status
        const { data: pendingOrders } = await supabase
          .from('orders')
          .select('id, order_number')
          .eq('customer_id', customer.id)
          .eq('status', 'age_check')

        if (pendingOrders && pendingOrders.length > 0) {
          await supabase
            .from('orders')
            .update({
              status: 'confirmed',
              updated_at: new Date().toISOString(),
            })
            .eq('customer_id', customer.id)
            .eq('status', 'age_check')

          console.log(`Advanced ${pendingOrders.length} order(s) to confirmed for customer ${customer.id}`)
        }

      } else if (result === 'consider' || result === 'unidentified') {
        // Flag for manual review — notify ops team
        const { data: customer } = await supabase
          .from('customers')
          .select('id')
          .eq('onfido_check_id', checkId)
          .single()

        if (customer) {
          // Could insert an alert record here, or send a notification
          console.warn(`ID check failed for customer ${customer.id}: ${result}`)
          // Orders remain in 'age_check' status — driver will verify in person
        }
      }
    }

    // ── Report completed (individual reports) ───────────────
    if (action === 'report.completed') {
      console.log(`Report completed: ${object.name} — ${object.result}`)
      // Individual report results if needed for granular handling
    }

    return new Response('ok', { status: 200 })

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response('Internal error', { status: 500 })
  }
})
