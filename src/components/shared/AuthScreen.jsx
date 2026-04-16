import { useState } from 'react'
import { supabase, signIn, signUp, getProfile } from '../../lib/supabase'
import { useAuthStore } from '../../lib/store'
import toast from 'react-hot-toast'

const lbl = { display: 'block', fontSize: 12, color: '#7A6E60', marginBottom: 6, fontFamily: 'DM Sans, sans-serif', fontWeight: 500 }
const inp = { width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid rgba(42,35,24,0.15)', background: '#FEFCF9', fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#2A2318', outline: 'none', boxSizing: 'border-box', marginBottom: 14 }

function Field({ label, type = 'text', value, onChange, placeholder }) {
  return (
    <div>
      <label style={lbl}>{label}</label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={inp} />
    </div>
  )
}

export default function AuthScreen() {
  const [mode, setMode] = useState('signin')
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'customer' })
  const [loading, setLoading] = useState(false)
  const { setUser, setProfile } = useAuthStore()

  const handle = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  // Debug: check if supabase is configured
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
  const isConfigured = supabaseUrl && supabaseUrl !== '' && !supabaseUrl.includes('placeholder')

  const submit = async (e) => {
    e.preventDefault()
    if (!form.email.trim() || !form.password) {
      toast.error('Please fill in all fields')
      return
    }
    setLoading(true)

    // 10 second timeout safety net
    const timer = setTimeout(() => {
      setLoading(false)
      toast.error('Request timed out — please try again')
    }, 10000)

    try {
      if (mode === 'signin') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: form.email.trim().toLowerCase(),
          password: form.password
        })
        clearTimeout(timer)
        if (error) {
          if (error.message.includes('Invalid login') || error.message.includes('invalid_credentials')) {
            toast.error('Incorrect email or password')
          } else if (error.message.includes('Email not confirmed')) {
            toast.error('Please confirm your email first')
          } else {
            toast.error(error.message)
          }
          setLoading(false)
          return
        }
        const user = data.user
        setUser(user)

        // Load profile directly - no dynamic import
        let profile = null
        try {
          const { data: pd } = await supabase.from('profiles').select('*').eq('id', user.id).single()
          profile = pd
        } catch {}

        // Create profile if missing
        if (!profile) {
          const { data: np } = await supabase.from('profiles').upsert({
            id: user.id,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            role: 'customer',
            status: 'active'
          }, { onConflict: 'id' }).select().single()
          profile = np
        }

        setProfile(profile)
        toast.success('Welcome back!')

      } else {
        // Sign up
        const { data, error } = await supabase.auth.signUp({
          email: form.email.trim().toLowerCase(),
          password: form.password,
          options: { data: { full_name: form.name, role: form.role } }
        })
        clearTimeout(timer)
        if (error) { toast.error(error.message); setLoading(false); return }

        if (data.user) {
          const profileData = {
            id: data.user.id,
            full_name: form.name.trim() || form.email.split('@')[0],
            role: form.role || 'customer',
            status: 'active'
          }
          await supabase.from('profiles').upsert(profileData, { onConflict: 'id' })
          setUser(data.user)
          setProfile(profileData)
          if (data.session) {
            toast.success('Account created! Welcome to Isla Drop 🌴')
          } else {
            toast.success('Check your email to confirm your account, then sign in.')
            setMode('signin')
          }
        }
      }
    } catch (err) {
      clearTimeout(timer)
      console.error('Auth error:', err)
      const msg = err?.message || ''
      if (msg.includes('fetch') || msg.includes('network') || msg.includes('timed out') || msg.includes('Failed to fetch')) {
        toast.error('Cannot connect to server. Check Vercel env vars: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set correctly.')
      } else if (msg.includes('Invalid login') || msg.includes('invalid_credentials')) {
        toast.error('Incorrect email or password')
      } else if (msg.includes('placeholder')) {
        toast.error('Supabase not configured — set VITE_SUPABASE_URL in Vercel environment variables')
      } else {
        toast.error(msg || 'Sign in failed — please try again')
      }
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #D4EEF2 0%, #F5F0E8 50%, #F0DDD3 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 36, color: '#2A2318', letterSpacing: '-0.5px' }}>Isla Drop</div>
          <div style={{ fontSize: 14, color: '#7A6E60', marginTop: 4 }}>Ibiza · 24/7 Delivery</div>
        </div>

        {!isConfigured && (
          <div style={{ background: '#C43A3A', color: 'white', borderRadius: 10, padding: '10px 16px', marginBottom: 12, fontSize: 13, fontFamily: 'DM Sans, sans-serif', textAlign: 'center' }}>
            ⚠️ Supabase not configured. Set VITE_SUPABASE_URL in Vercel.
          </div>
        )}
        <div style={{ background: '#FEFCF9', borderRadius: 20, padding: 28, boxShadow: '0 4px 32px rgba(42,35,24,0.08)' }}>
          <div style={{ display: 'flex', gap: 4, background: '#F5F0E8', borderRadius: 10, padding: 4, marginBottom: 24 }}>
            {['signin', 'signup'].map(m => (
              <button key={m} onClick={() => setMode(m)}
                style={{ flex: 1, padding: '9px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: mode === m ? 500 : 400, background: mode === m ? '#FEFCF9' : 'none', color: mode === m ? '#2A2318' : '#7A6E60', boxShadow: mode === m ? '0 1px 4px rgba(42,35,24,0.08)' : 'none' }}>
                {m === 'signin' ? 'Sign in' : 'Sign up'}
              </button>
            ))}
          </div>

          <form onSubmit={submit}>
            {mode === 'signup' && (
              <>
                <Field label="Full name" value={form.name} onChange={handle('name')} placeholder="Your name" />
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
            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: 15, background: loading ? '#7A6E60' : '#2B7A8B', color: 'white', border: 'none', borderRadius: 12, fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 8 }}>
              {loading ? 'Please wait...' : mode === 'signin' ? 'Sign in →' : 'Create account →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
