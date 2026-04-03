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

function CheckoutForm({ total, onSuccess, onCancel }) {
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

    const { error: payError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/order-confirmed`,
      },
      redirect: 'if_required',
    })

    if (payError) {
      setError(payError.message)
      setLoading(false)
    } else {
      onSuccess()
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
            `Pay €${total.toFixed(2)}`
          )}
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </form>
  )
}

export default function StripeCheckout({ onSuccess, onCancel }) {
  const [clientSecret, setClientSecret] = useState(null)
  const [paymentIntentId, setPaymentIntentId] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const { user } = useAuthStore()
  const cart = useCartStore()

  useEffect(() => {
    createPaymentIntent({
      amount: cart.getTotal(),
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
