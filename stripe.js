import { loadStripe } from '@stripe/stripe-js'

let stripePromise = null

export function getStripe() {
  if (!stripePromise) {
    const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
    if (!key) throw new Error('Missing VITE_STRIPE_PUBLISHABLE_KEY')
    stripePromise = loadStripe(key)
  }
  return stripePromise
}

/**
 * Create a PaymentIntent via your Supabase Edge Function.
 * The Edge Function handles the Stripe secret key server-side.
 *
 * Edge Function endpoint: /functions/v1/create-payment-intent
 */
export async function createPaymentIntent({ amount, currency = 'eur', customerId, orderId }) {
  const { supabase } = await import('./supabase')
  const { data, error } = await supabase.functions.invoke('create-payment-intent', {
    body: { amount: Math.round(amount * 100), currency, customerId, orderId },
  })
  if (error) throw error
  return data // { clientSecret, paymentIntentId }
}

/**
 * Supabase Edge Function to deploy at /functions/v1/create-payment-intent
 * Save this as: supabase/functions/create-payment-intent/index.ts
 */
export const EDGE_FUNCTION_CODE = `
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' })

Deno.serve(async (req) => {
  const { amount, currency, customerId, orderId } = await req.json()

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency,
    metadata: { customerId, orderId },
    automatic_payment_methods: { enabled: true },
  })

  return new Response(JSON.stringify({
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
  }), { headers: { 'Content-Type': 'application/json' } })
})
`
