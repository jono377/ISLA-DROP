import { useState, useEffect } from 'react'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { getStripe, createPaymentIntent } from '../../lib/stripe'
import { useCartStore, useAuthStore } from '../../lib/store'

const STRIPE_APPEARANCE = {
  theme: 'stripe',
  variables: {
    colorPrimary: '#2B7A8B',
    colorBackground: '#FEFCF9',
    colorText: '#2A2318',
    colorDanger: '#C4683A',
    fontFamily: 'DM Sans, system-ui, sans-serif',
    borderRadius: '10px',
    spacingUnit: '4px',
  },
}

function CheckoutForm({ total, onSuccess, onCancel, onBeforeRedirect }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setLoading(true)
    setError(null)

    const { error: submitError } = await elements.submit()
    if (submitError) { setError(submitError.message); setLoading(false); return }

    onBeforeRedirect?.()
    const { error: payError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Return to app after 3DS — the app reads ?payment_intent= on load
        return_url: window.location.origin + '/?payment=complete',
      },
      // 'if_required' redirects for 3DS cards — always_resolve means we handle it here too
      redirect: 'if_required',
    })

    if (payError) {
      // Card declined, auth failed, etc
      if (payError.type === 'card_error' || payError.type === 'validation_error') {
        setError(payError.message)
      } else {
        setError('Payment failed — please try again or use a different card.')
      }
      setLoading(false)
    } else if (paymentIntent && (paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing')) {
      onSuccess(paymentIntent.id)
    } else {
      // Still loading or pending — rare
      setError('Payment is being processed. Please wait.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement options={{ layout: 'tabs' }} />

      {error && (
        <div style={{ marginTop: 12, padding: '10px 14px', background: '#FAECE7', borderRadius: 8, fontSize: 13, color: '#993C1D' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        <button
          type="button"
          onClick={onCancel}
          style={{ flex: 1, padding: '14px', background: 'none', border: '0.5px solid rgba(42,35,24,0.2)', borderRadius: 12, fontFamily: 'DM Sans, sans-serif', fontSize: 14, cursor: 'pointer', color: '#7A6E60' }}
        >
          Back
        </button>
        <button
          type="submit"
          disabled={!stripe || loading}
          style={{ flex: 2, padding: '14px', background: loading ? '#7A6E60' : '#C4683A', color: 'white', border: 'none', borderRadius: 12, fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          {loading ? (
            <>
              <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
              Processing...
            </>
          ) : (
            'Pay €' + total.toFixed(2)
          )}
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </form>
  )
}

export default function StripeCheckout({ onSuccess, onCancel, onBeforeRedirect }) {
  const [clientSecret, setClientSecret] = useState(null)
  const [paymentIntentId, setPaymentIntentId] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [discountCode, setDiscountCode] = useState('')
  const [appliedDiscount, setAppliedDiscount] = useState(null)
  const [codeChecking, setCodeChecking] = useState(false)
  const [codeError, setCodeError] = useState('')
  const { user } = useAuthStore()
  const cart = useCartStore()

  const subtotal = cart.getTotal()
  const discountAmount = appliedDiscount
    ? appliedDiscount.discount_type === 'percentage'
      ? Math.round(subtotal * (appliedDiscount.discount_value / 100) * 100) / 100
      : appliedDiscount.discount_type === 'fixed'
        ? Math.min(appliedDiscount.discount_value, subtotal)
        : 0
    : 0
  const finalTotal = Math.max(0, subtotal - discountAmount)

  const applyCode = async () => {
    const code = discountCode.trim().toUpperCase()
    if (!code) return
    setCodeChecking(true)
    setCodeError('')
    try {
      const { supabase } = await import('../../lib/supabase')
      const { data, error } = await supabase
        .from('discount_codes')
        .select('*')
        .eq('code', code)
        .eq('active', true)
        .single()

      if (error || !data) { setCodeError('Invalid or expired code'); setCodeChecking(false); return }
      if (data.valid_until && new Date(data.valid_until) < new Date()) { setCodeError('This code has expired'); setCodeChecking(false); return }
      if (data.max_uses && data.uses_count >= data.max_uses) { setCodeError('This code has reached its usage limit'); setCodeChecking(false); return }
      if (data.min_order_value && subtotal < data.min_order_value) { setCodeError('Minimum order €' + data.min_order_value + ' required for this code'); setCodeChecking(false); return }

      setAppliedDiscount(data)
      setCodeError('')
    } catch { setCodeError('Could not verify code — try again') }
    setCodeChecking(false)
  }

  const removeCode = () => { setAppliedDiscount(null); setDiscountCode(''); setCodeError('') }

  useEffect(() => {
    createPaymentIntent({
      amount: finalTotal,
      currency: 'eur',
      customerId: user?.id,
    })
      .then(({ clientSecret, paymentIntentId }) => {
        setClientSecret(clientSecret)
        setPaymentIntentId(paymentIntentId)
      })
      .catch(err => setLoadError(err.message))
  }, [])

  if (loadError) {
    return (
      <div style={{ padding: 20, background: '#FAECE7', borderRadius: 12, color: '#993C1D', fontSize: 14 }}>
        Failed to load payment: {loadError}
        <br /><br />
        <em style={{ fontSize: 12, opacity: 0.7 }}>Ensure your Stripe keys are configured in .env and the Edge Function is deployed.</em>
      </div>
    )
  }

  if (!clientSecret) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: '#7A6E60', fontSize: 14 }}>
        <div style={{ width: 24, height: 24, border: '2px solid #E8E0D0', borderTopColor: '#C4683A', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        Preparing secure checkout…
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  return (
    <Elements
      stripe={getStripe()}
      options={{ clientSecret, appearance: STRIPE_APPEARANCE }}
    >
      <CheckoutForm
        total={cart.getTotal()}
        paymentIntentId={paymentIntentId}
        onSuccess={() => onSuccess(paymentIntentId)}
        onCancel={onCancel}
      />
    </Elements>
  )
}
