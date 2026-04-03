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
