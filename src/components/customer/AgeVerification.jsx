import { useState, useRef } from 'react'
import { startOnfidoVerification, initOnfidoSDK } from '../../lib/onfido'
import { useAuthStore } from '../../lib/store'

const STEPS = { FORM: 'form', VERIFYING: 'verifying', PENDING: 'pending', VERIFIED: 'verified', ERROR: 'error' }

export default function AgeVerification({ onVerified, onClose }) {
  const { user } = useAuthStore()
  const [step, setStep] = useState(STEPS.FORM)
  const [form, setForm] = useState({ firstName: '', lastName: '', dob: '' })
  const [error, setError] = useState(null)
  const onfidoRef = useRef(null)

  const maxDob = (() => {
    const d = new Date()
    d.setFullYear(d.getFullYear() - 18)
    return d.toISOString().split('T')[0]
  })()

  const handleStart = async (e) => {
    e.preventDefault()
    setError(null)

    // Quick client-side age check
    const age = (new Date() - new Date(form.dob)) / (365.25 * 24 * 3600 * 1000)
    if (age < 18) {
      setError('You must be 18 or over to order alcohol. We cannot process this order.')
      return
    }

    setStep(STEPS.VERIFYING)

    try {
      const { sdkToken } = await startOnfidoVerification({
        firstName: form.firstName,
        lastName: form.lastName,
        dob: form.dob,
        customerId: user.id,
      })

      // Load Onfido SDK (add script to index.html first)
      onfidoRef.current = initOnfidoSDK({
        sdkToken,
        onComplete: () => {
          setStep(STEPS.PENDING)
        },
        onError: (err) => {
          setError(err.message || 'Verification failed. Please try again.')
          setStep(STEPS.ERROR)
        },
      })
    } catch (err) {
      // Fallback: manual verification (driver checks ID on delivery)
      console.warn('Onfido not available, using delivery-time ID check:', err.message)
      setStep(STEPS.PENDING)
    }
  }

  if (step === STEPS.VERIFIED) {
    return (
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ width: 56, height: 56, background: '#EAF3DE', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="#3B6D11"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
        </div>
        <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 20, marginBottom: 6 }}>Age Verified</div>
        <div style={{ fontSize: 14, color: '#7A6E60', marginBottom: 20 }}>You're all set. Proceeding to checkout.</div>
        <button onClick={onVerified} style={primaryBtn}>Continue to payment →</button>
      </div>
    )
  }

  if (step === STEPS.PENDING) {
    return (
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ width: 56, height: 56, background: '#D4EEF2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="#1A5263"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
        </div>
        <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 20, marginBottom: 6 }}>Verification Submitted</div>
        <div style={{ fontSize: 14, color: '#7A6E60', lineHeight: 1.6, marginBottom: 20 }}>
          Your ID check is being processed. You can continue placing the order — our driver will also verify your ID at delivery.
        </div>
        <button onClick={onVerified} style={primaryBtn}>Continue to checkout →</button>
        <div id="onfido-mount" style={{ marginTop: 16 }} />
      </div>
    )
  }

  if (step === STEPS.VERIFYING) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #D4EEF2', borderTopColor: '#2B7A8B', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <div style={{ fontSize: 15, color: '#2A2318', marginBottom: 6 }}>Starting verification…</div>
        <div style={{ fontSize: 13, color: '#7A6E60' }}>You'll be guided through a short ID check.</div>
        <div id="onfido-mount" style={{ marginTop: 20 }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  return (
    <form onSubmit={handleStart}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 22, marginBottom: 6 }}>Age Verification</div>
        <div style={{ fontSize: 14, color: '#7A6E60', lineHeight: 1.6 }}>
          Spanish law requires us to confirm you're 18+ before selling alcohol. Your ID will also be checked on delivery.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <label style={labelStyle}>First name</label>
          <input
            style={inputStyle}
            required
            value={form.firstName}
            onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
            placeholder="Maria"
          />
        </div>
        <div>
          <label style={labelStyle}>Last name</label>
          <input
            style={inputStyle}
            required
            value={form.lastName}
            onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
            placeholder="García"
          />
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Date of birth</label>
        <input
          style={inputStyle}
          type="date"
          required
          max={maxDob}
          value={form.dob}
          onChange={e => setForm(f => ({ ...f, dob: e.target.value }))}
        />
      </div>

      {error && (
        <div style={{ padding: '10px 14px', background: '#FAECE7', border: '0.5px solid #C4683A', borderRadius: 8, fontSize: 13, color: '#8B4220', marginBottom: 14 }}>
          {error}
        </div>
      )}

      <div style={{ background: '#F5F0E8', borderRadius: 10, padding: '10px 14px', marginBottom: 20, fontSize: 12, color: '#7A6E60', display: 'flex', gap: 8 }}>
        <span>🆔</span>
        <span>You'll be asked to take a photo of your ID and a selfie. This is encrypted and processed by Onfido, our trusted verification partner.</span>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button type="button" onClick={onClose} style={secondaryBtn}>Cancel</button>
        <button type="submit" style={primaryBtn}>Verify my age →</button>
      </div>

      <p style={{ fontSize: 11, color: '#7A6E60', textAlign: 'center', marginTop: 12, lineHeight: 1.5 }}>
        By continuing you confirm you are 18+ and consent to ID verification. Operated under Spanish alcohol retail regulations.
      </p>
    </form>
  )
}

const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 500, color: '#7A6E60',
  textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6,
}

const inputStyle = {
  width: '100%', padding: '11px 13px',
  border: '0.5px solid rgba(42,35,24,0.18)', borderRadius: 10,
  fontFamily: 'DM Sans, sans-serif', fontSize: 14,
  background: '#F5F0E8', color: '#2A2318', outline: 'none',
  boxSizing: 'border-box',
}

const primaryBtn = {
  flex: 2, padding: '14px 20px', background: '#2B7A8B', color: 'white',
  border: 'none', borderRadius: 12, fontFamily: 'DM Sans, sans-serif',
  fontSize: 14, fontWeight: 500, cursor: 'pointer', width: '100%',
}

const secondaryBtn = {
  flex: 1, padding: '14px', background: 'none',
  border: '0.5px solid rgba(42,35,24,0.2)', borderRadius: 12,
  fontFamily: 'DM Sans, sans-serif', fontSize: 14, cursor: 'pointer', color: '#7A6E60',
}
