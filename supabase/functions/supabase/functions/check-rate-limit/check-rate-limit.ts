// ================================================================
// Supabase Edge Function: check-rate-limit
// Point 30: Server-side rate limiting on orders
// Deploy: supabase functions deploy check-rate-limit
// Call from: createOrder in supabase.js before inserting
// ================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const LIMITS = {
  orders_per_minute: 3,
  orders_per_hour: 20,
  orders_per_day: 50,
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { customerId } = await req.json()
    if (!customerId) return new Response(JSON.stringify({ allowed: true }), { headers: { ...CORS, 'Content-Type': 'application/json' } })

    const now = new Date()
    const windows = [
      { key: customerId + ':1min', start: new Date(now.getTime() - 60000).toISOString(), limit: LIMITS.orders_per_minute, label: '1 minute' },
      { key: customerId + ':1hr',  start: new Date(now.getTime() - 3600000).toISOString(), limit: LIMITS.orders_per_hour, label: '1 hour' },
      { key: customerId + ':1day', start: new Date(now.getTime() - 86400000).toISOString(), limit: LIMITS.orders_per_day, label: '24 hours' },
    ]

    for (const window of windows) {
      const { count } = await supabase.from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('customer_id', customerId)
        .gte('created_at', window.start)

      if ((count || 0) >= window.limit) {
        return new Response(JSON.stringify({
          allowed: false,
          reason: 'Rate limit exceeded: ' + LIMITS[window.key.includes('1min')?'orders_per_minute':window.key.includes('1hr')?'orders_per_hour':'orders_per_day'] + ' orders per ' + window.label
        }), { status: 429, headers: { ...CORS, 'Content-Type': 'application/json' } })
      }
    }

    // Check for suspicious patterns — same address, multiple payment attempts
    const { data: recentOrders } = await supabase.from('orders')
      .select('delivery_address, total')
      .eq('customer_id', customerId)
      .gte('created_at', new Date(now.getTime() - 300000).toISOString()) // 5 min

    if (recentOrders && recentOrders.length > 0) {
      const uniqueAddresses = new Set(recentOrders.map((o: any) => o.delivery_address)).size
      if (recentOrders.length >= 2 && uniqueAddresses === 1) {
        return new Response(JSON.stringify({
          allowed: false,
          reason: 'Duplicate order detected. Please wait before placing another order to the same address.'
        }), { status: 429, headers: { ...CORS, 'Content-Type': 'application/json' } })
      }
    }

    return new Response(JSON.stringify({ allowed: true }), {
      headers: { ...CORS, 'Content-Type': 'application/json' }
    })
  } catch (err: any) {
    // Fail open — don't block orders if rate limiting itself fails
    console.error('Rate limit check failed:', err.message)
    return new Response(JSON.stringify({ allowed: true }), {
      headers: { ...CORS, 'Content-Type': 'application/json' }
    })
  }
})
