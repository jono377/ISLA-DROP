import { useState } from 'react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../lib/store'

const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  // Must have real values - not placeholders
  return !!(url && url.startsWith('https://') && url.includes('supabase') && 
            !url.includes('placeholder') && key && key.length > 20)
}

export default function AuthScreen({ onClose }) {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const { setUser, setProfile } = useAuthStore()

  const handle = async () => {
    if (!isSupabaseConfigured()) {
      toast.error('Connection error — please check your internet and try again')
      return
    }
    if (mode !== 'reset' && (!email || !password)) {
      toast.error('Please fill in all fields')
      return
    }
    if (mode === 'reset' && !email) {
      toast.error('Please enter your email')
      return
    }
    setLoading(true)
    try {
      const { supabase, getProfile } = await import('../../lib/supabase')

      if (mode === 'signin') {
        const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (error) throw error
        setUser(data.user)
        const profile = await getProfile(data.user.id).catch(() => null)
        if (profile) setProfile(profile)
        toast.success('Welcome back! 🌴')
        onClose?.()

      } else if (mode === 'signup') {
        if (!name.trim()) { toast.error('Please enter your name'); setLoading(false); return }
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: name.trim() } }
        })
        if (error) throw error
        if (data.user) {
          try {
            await supabase.from('profiles').upsert({
              id: data.user.id,
              full_name: name.trim(),
              role: 'customer',
              email: email.trim(),
            })
          } catch {}
          setUser(data.user)
          setProfile({ id: data.user.id, full_name: name.trim(), role: 'customer' })
          toast.success('Account created! Welcome to Isla Drop 🌴')
          onClose?.()
        } else {
          toast.success('Check your email to confirm your account')
        }

      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: window.location.origin,
        })
        if (error) throw error
        toast.success('Password reset email sent — check your inbox')
        setMode('signin')
      }
    } catch (err) {
      console.error('Auth error full:', err, 'URL:', import.meta.env.VITE_SUPABASE_URL?.slice(0,30))
      // Translate common Supabase error messages
      const msg = err.message || 'Something went wrong'
      if (msg.includes('Invalid login credentials')) {
        toast.error('Incorrect email or password')
      } else if (msg.includes('Email not confirmed')) {
        toast.error('Please check your email and confirm your account first')
      } else if (msg.includes('User already registered')) {
        toast.error('An account with this email already exists — try signing in')
      } else if (msg.includes('Password should be')) {
        toast.error('Password must be at least 6 characters')
      } else if (msg.includes('latch') || msg.includes('placeholder') || msg.includes('fetch')) {
        toast.error('Connection error — please check your internet and try again')
      } else if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('fetch')) {
        toast.error('Cannot connect to server. Check your internet connection.')
      } else {
        toast.error(msg)
      }
    }
    setLoading(false)
  }

  const inp = {
    border: '0.5px solid rgba(255,255,255,0.15)',
    borderRadius: 10,
    fontFamily: 'DM Sans,sans-serif',
    fontSize: 14,
    background: 'rgba(255,255,255,0.08)',
    color: 'white',
    outline: 'none',
    padding: '13px 14px',
    width: '100%',
    boxSizing: 'border-box',
    marginBottom: 10,
  }

  return (
    <div style={{ padding: '0 0 8px' }}>
      <div style={{ fontFamily: 'DM Serif Display,serif', fontSize: 24, color: 'white', marginBottom: 6 }}>
        {mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Reset password'}
      </div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 20 }}>
        {mode === 'signin' ? 'Welcome back to Isla Drop 🌴' : mode === 'signup' ? 'Join Isla Drop — free to sign up' : 'Enter your email and we will send a reset link'}
      </div>

      {mode === 'signup' && (
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Full name" style={inp} />
      )}
      <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address" type="email" autoComplete="email" style={inp} />
      {mode !== 'reset' && (
        <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password (min 6 characters)" type="password" autoComplete={mode==='signin'?'current-password':'new-password'}
          style={{ ...inp, marginBottom: 20 }} onKeyDown={e=>e.key==='Enter'&&handle()} />
      )}
      {mode === 'reset' && <div style={{ height: 10 }} />}

      <button onClick={handle} disabled={loading}
        style={{ width: '100%', padding: '14px', background: '#C4683A', color: 'white', border: 'none', borderRadius: 12, fontFamily: 'DM Sans,sans-serif', fontSize: 15, fontWeight: 500, cursor: loading ? 'default' : 'pointer', marginBottom: 14, opacity: loading ? 0.7 : 1 }}>
        {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
      </button>

      {mode === 'signin' && (
        <>
          <button onClick={()=>setMode('signup')} style={{ width: '100%', padding: '13px', background: 'rgba(255,255,255,0.08)', border: '0.5px solid rgba(255,255,255,0.15)', borderRadius: 12, fontFamily: 'DM Sans,sans-serif', fontSize: 14, color: 'white', cursor: 'pointer', marginBottom: 10 }}>
            New to Isla Drop? Create account
          </button>
          <button onClick={()=>setMode('reset')} style={{ width: '100%', padding: '10px', background: 'none', border: 'none', fontFamily: 'DM Sans,sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.45)', cursor: 'pointer' }}>
            Forgot password?
          </button>
        </>
      )}
      {mode !== 'signin' && (
        <button onClick={()=>setMode('signin')} style={{ width: '100%', padding: '10px', background: 'none', border: 'none', fontFamily: 'DM Sans,sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.45)', cursor: 'pointer' }}>
          Back to sign in
        </button>
      )}
    </div>
  )
}
