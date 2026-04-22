import { useState } from 'react'
import { signIn, signUp, getProfile } from '../../lib/supabase'
import { useAuthStore } from '../../lib/store'
import { SocialLoginButtons, PhoneOTPLogin } from '../customer/CustomerFeatures_world2'
import toast from 'react-hot-toast'

export default function AuthScreen() {
  const [mode, setMode] = useState('signin')
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'customer' })
  const [loading, setLoading] = useState(false)
  const [showPhone, setShowPhone] = useState(false)
  const { setUser, setProfile } = useAuthStore()

  const handle = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'signin') {
        const { user } = await signIn(form.email, form.password)
        setUser(user)
        const profile = await getProfile(user.id)
        setProfile(profile)
        toast.success('Welcome back!')
      } else {
        const { user } = await signUp(form.email, form.password, form.name, form.role)
        setUser(user)
        setProfile({ role: form.role, full_name: form.name })
        toast.success('Account created!')
      }
    } catch (err) {
      toast.error(err.message)
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #D4EEF2 0%, #F5F0E8 50%, #F0DDD3 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 36, color: '#2A2318', letterSpacing: '-0.5px' }}>Isla Drop</div>
          <div style={{ fontSize: 14, color: '#7A6E60', marginTop: 4 }}>Ibiza · 24/7 Beverage Delivery</div>
        </div>

        <div style={{ background: '#FEFCF9', borderRadius: 20, padding: 28, boxShadow: '0 4px 32px rgba(42,35,24,0.08)' }}>
          <div style={{ display: 'flex', gap: 4, background: '#F5F0E8', borderRadius: 10, padding: 4, marginBottom: 24 }}>
            {['signin', 'signup'].map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{ flex: 1, padding: '9px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: mode === m ? 500 : 400, background: mode === m ? '#FEFCF9' : 'none', color: mode === m ? '#2A2318' : '#7A6E60', boxShadow: mode === m ? '0 1px 4px rgba(42,35,24,0.08)' : 'none' }}
              >
                {m === 'signin' ? 'Sign in' : 'Sign up'}
              </button>
            ))}
          </div>

          {/* Social login */}
          <SocialLoginButtons onSuccess={()=>window.location.reload()} />

          {/* Phone OTP */}
          {mode === 'signin' && !showPhone && (
            <button onClick={()=>setShowPhone(true)}
              style={{ width:'100%', marginBottom:12, padding:'11px', background:'none', border:'0.5px solid rgba(42,35,24,0.18)', borderRadius:10, fontFamily:'DM Sans,sans-serif', fontSize:13, color:'#7A6E60', cursor:'pointer' }}>
              📱 Sign in with phone number instead
            </button>
          )}
          {showPhone ? (
            <PhoneOTPLogin onSuccess={()=>window.location.reload()} onBack={()=>setShowPhone(false)} />
          ) : (
          <form onSubmit={submit}>
            {mode === 'signup' && (
              <>
                <Field label="Full name" value={form.name} onChange={handle('name')} placeholder="Maria García" />
                <div style={{ marginBottom: 14 }}>
                  <label style={lbl}>Account type</label>
                  <select value={form.role} onChange={handle('role')} style={inp}>
                    <option value="customer">Customer</option>
                    <option value="driver">Driver</option>
                    <option value="ops">Operations</option>
                  </select>
                </div>
              </>
            )}
            <Field label="Email" type="email" value={form.email} onChange={handle('email')} placeholder="you@example.com" />
            <Field label="Password" type="password" value={form.password} onChange={handle('password')} placeholder="••••••••" />

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: 15, background: loading ? '#7A6E60' : '#2B7A8B', color: 'white', border: 'none', borderRadius: 12, fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 8 }}
            >
              {loading ? 'Loading…' : mode === 'signin' ? 'Sign in →' : 'Create account →'}
            </button>
          </form>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#7A6E60', lineHeight: 1.6 }}>
          By signing up you confirm you are 18+ and agree to our terms.
          <br />Alcohol sales regulated under Spanish law.
        </div>
      </div>
    </div>
  )
}

function Field({ label, type = 'text', value, onChange, placeholder }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={lbl}>{label}</label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} required style={inp} />
    </div>
  )
}

const lbl = { display: 'block', fontSize: 11, fontWeight: 500, color: '#7A6E60', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }
const inp = { width: '100%', padding: '11px 13px', border: '0.5px solid rgba(42,35,24,0.18)', borderRadius: 10, fontFamily: 'DM Sans, sans-serif', fontSize: 14, background: '#F5F0E8', color: '#2A2318', outline: 'none', boxSizing: 'border-box' }
