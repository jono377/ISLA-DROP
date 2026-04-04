import { useState } from 'react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../lib/store'

export default function StaffLogin({ role, onBack }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { setUser, setProfile } = useAuthStore()

  const isDriver = role === 'driver'
  const accent = isDriver ? '#5A6B3A' : '#1A5263'
  const label = isDriver ? 'Driver' : 'Management'
  const icon = isDriver ? '🛵' : '⚙️'

  const handle = async () => {
    if (!email || !password) { toast.error('Please fill in all fields'); return }
    setLoading(true)
    try {
      const { supabase, getProfile } = await import('../../lib/supabase')
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (error) throw error

      const profile = await getProfile(data.user.id).catch(() => null)
      if (!profile) throw new Error('Profile not found. Contact your administrator.')

      if (profile.role !== role) {
        await supabase.auth.signOut()
        throw new Error(`This account is not a ${label} account.`)
      }

      setUser(data.user)
      setProfile(profile)
      toast.success(`Welcome, ${profile.full_name || label}!`)
    } catch (err) {
      const msg = err.message || 'Login failed'
      if (msg.includes('Invalid login credentials')) {
        toast.error('Incorrect email or password')
      } else {
        toast.error(msg)
      }
    }
    setLoading(false)
  }

  const inp = {
    width: '100%', padding: '13px 14px', border: `0.5px solid rgba(255,255,255,0.15)`,
    borderRadius: 10, fontFamily: 'DM Sans,sans-serif', fontSize: 14,
    background: 'rgba(255,255,255,0.08)', color: 'white', outline: 'none',
    boxSizing: 'border-box', marginBottom: 10,
  }

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(170deg,#0A1A20 0%,${accent}40 50%,#0A1A20 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 360 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 13, fontFamily: 'DM Sans,sans-serif', marginBottom: 24, padding: 0 }}>
          ← Back
        </button>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>{icon}</div>
          <div style={{ fontFamily: 'DM Serif Display,serif', fontSize: 28, color: 'white', marginBottom: 6 }}>
            {label} Login
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
            Isla Drop {label} Portal
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 24 }}>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" type="email" style={inp} />
          <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password"
            style={{ ...inp, marginBottom: 20 }} onKeyDown={e => e.key === 'Enter' && handle()} />
          <button onClick={handle} disabled={loading}
            style={{ width: '100%', padding: '14px', background: accent, color: 'white', border: 'none', borderRadius: 12, fontFamily: 'DM Sans,sans-serif', fontSize: 15, fontWeight: 500, cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Signing in...' : `Sign in as ${label}`}
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'rgba(255,255,255,0.3)', fontFamily: 'DM Sans,sans-serif' }}>
          Account access is restricted to authorised {label.toLowerCase()}s only.
          <br />Contact admin@isladrop.com for access.
        </div>
      </div>
    </div>
  )
}
