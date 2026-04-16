import { useState } from 'react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../lib/store'

const C = {
  bg: 'linear-gradient(170deg,#0A2A38,#0D3545)',
  card: 'rgba(255,255,255,0.07)',
  border: 'rgba(255,255,255,0.15)',
  accent: '#C4683A',
  text: 'white',
  muted: 'rgba(255,255,255,0.5)',
}

function Input({ label, type='text', value, onChange, placeholder }) {
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ fontSize:11, color:C.muted, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.8px', fontFamily:'DM Sans,sans-serif' }}>{label}</div>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width:'100%', padding:'11px 14px', background:'rgba(255,255,255,0.08)', border:'0.5px solid ' + C.border, borderRadius:10, color:'white', fontFamily:'DM Sans,sans-serif', fontSize:14, outline:'none', boxSizing:'border-box' }}
      />
    </div>
  )
}

function Btn({ onClick, loading, children, secondary }) {
  return (
    <button onClick={onClick} disabled={loading}
      style={{ width:'100%', padding:'13px', background: secondary ? 'rgba(255,255,255,0.08)' : C.accent, border: secondary ? '0.5px solid ' + C.border : 'none', borderRadius:10, color:'white', fontSize:14, fontWeight:500, cursor:'pointer', fontFamily:'DM Sans,sans-serif', opacity: loading ? 0.7 : 1, marginBottom: secondary ? 0 : 10 }}>
      {loading ? 'Please wait...' : children}
    </button>
  )
}

// ── Sign In ──────────────────────────────────────────────────
function SignInForm({ role, onSuccess, onForgot, onCreateAccount }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { setUser, setProfile } = useAuthStore()

  const handle = async () => {
    if (!email.trim()) { toast.error('Please enter your email'); return }
    if (!password) { toast.error('Please enter your password'); return }
    setLoading(true)

    // Timeout after 10 seconds
    const timeout = setTimeout(() => {
      setLoading(false)
      toast.error('Request timed out — check your internet connection and try again')
    }, 10000)

    try {
      const { supabase } = await import('../../lib/supabase')

      // Sign in with 8s timeout
      const signInPromise = supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      })
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Connection timed out')), 8000)
      )
      const { data, error } = await Promise.race([signInPromise, timeoutPromise])

      clearTimeout(timeout)

      if (error) {
        const msg = error.message || ''
        if (msg.includes('Invalid login') || msg.includes('invalid_credentials') || msg.includes('Invalid email')) {
          toast.error('Incorrect email or password')
        } else if (msg.includes('Email not confirmed')) {
          toast.error('Please check your email and click the confirmation link first')
        } else if (msg.includes('timed out')) {
          toast.error('Connection timed out — check your internet and try again')
        } else {
          toast.error(msg || 'Sign in failed')
        }
        setLoading(false)
        return
      }

      if (!data?.user) {
        toast.error('Sign in failed — no user returned')
        setLoading(false)
        return
      }

      // Load profile
      let profile = null
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()
        profile = profileData
      } catch {}

      // Create profile if missing
      if (!profile) {
        const { data: newProfile } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            full_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
            role: role || 'customer',
            status: 'active'
          }, { onConflict: 'id' })
          .select()
          .single()
        profile = newProfile
      }

      if (!profile) {
        toast.error('Account loaded but profile missing — run the fix SQL in Supabase')
        setLoading(false)
        return
      }

      // Role check
      if (role === 'ops' && !['ops', 'admin'].includes(profile.role)) {
        await supabase.auth.signOut()
        toast.error('This email does not have ops access. Run the fix SQL to grant access.')
        setLoading(false)
        return
      }
      if (role === 'driver' && profile.role !== 'driver') {
        await supabase.auth.signOut()
        toast.error('This account does not have driver access.')
        setLoading(false)
        return
      }

      setUser(data.user)
      setProfile(profile)
      toast.success('Welcome back!')
    } catch(err) {
      clearTimeout(timeout)
      const msg = err?.message || 'Unknown error'
      if (msg.includes('timed out') || msg.includes('fetch')) {
        toast.error('Cannot reach the server — check your internet connection')
      } else {
        toast.error(msg)
      }
    }
    setLoading(false)
  }


  return (
    <div>
      <Input label="Email" type="email" value={email} onChange={setEmail} placeholder="your@email.com" />
      <Input label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" />
      <div style={{ marginBottom:16 }}>
        <Btn onClick={handle} loading={loading}>Sign in</Btn>
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, fontFamily:'DM Sans,sans-serif' }}>
        <button onClick={onForgot} style={{ background:'none', border:'none', color:C.muted, cursor:'pointer', fontSize:13, padding:0 }}>Forgot password?</button>
        {onCreateAccount && (
          <button onClick={onCreateAccount} style={{ background:'none', border:'none', color:C.accent, cursor:'pointer', fontSize:13, padding:0 }}>Create account →</button>
        )}
      </div>
    </div>
  )
}

// ── Create Account ───────────────────────────────────────────
function CreateAccountForm({ role, onSuccess, onSignIn }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const { setUser, setProfile } = useAuthStore()

  const handle = async () => {
    if (!name || !email || !password) { toast.error('Please fill in all fields'); return }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    if (password !== confirm) { toast.error('Passwords do not match'); return }
    setLoading(true)
    try {
      const { supabase } = await import('../../lib/supabase')
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: name.trim() } }
      })
      if (error) throw error
      if (data.user) {
        const profileData = {
          id: data.user.id,
          full_name: name.trim(),
          role: role || 'ops',
        }

        // Retry profile creation up to 3 times
        let profileCreated = false
        for (let attempt = 0; attempt < 3; attempt++) {
          const { error: pe } = await supabase.from('profiles').upsert(profileData, { onConflict: 'id' })
          if (!pe) { profileCreated = true; break }
          await new Promise(r => setTimeout(r, 500))
        }

        if (!profileCreated) {
          console.warn('Profile creation failed but auth user exists - will be created on first sign in')
        }

        if (data.session) {
          setUser(data.user)
          setProfile(profileData)
          toast.success('Account created! Welcome to Isla Drop 🌴')
          onSuccess?.()
        } else {
          toast.success('Account created! Check your email to confirm, then sign in here.', { duration: 6000 })
          onSignIn?.()
        }
      }
    } catch(err) {
      const msg = err.message || ''
      if (msg.includes('already registered') || msg.includes('already exists')) {
        toast.error('An account with this email already exists — try signing in')
      } else {
        toast.error(msg || 'Account creation failed')
      }
    }
    setLoading(false)
  }

  return (
    <div>
      <Input label="Full name" value={name} onChange={setName} placeholder="Your full name" />
      <Input label="Email" type="email" value={email} onChange={setEmail} placeholder="your@email.com" />
      <Input label="Password" type="password" value={password} onChange={setPassword} placeholder="At least 6 characters" />
      <Input label="Confirm password" type="password" value={confirm} onChange={setConfirm} placeholder="Repeat your password" />
      {role && role !== 'customer' && (
        <div style={{ fontSize:12, color:'rgba(245,201,122,0.8)', background:'rgba(245,201,122,0.1)', border:'0.5px solid rgba(245,201,122,0.3)', borderRadius:8, padding:'8px 12px', marginBottom:14, fontFamily:'DM Sans,sans-serif' }}>
          ⏳ {role === 'driver' ? 'Driver' : 'Staff'} accounts require approval before access is granted.
        </div>
      )}
      <div style={{ marginBottom:16 }}>
        <Btn onClick={handle} loading={loading}>Create account</Btn>
      </div>
      <div style={{ textAlign:'center', fontSize:13, fontFamily:'DM Sans,sans-serif' }}>
        <span style={{ color:C.muted }}>Already have an account? </span>
        <button onClick={onSignIn} style={{ background:'none', border:'none', color:C.accent, cursor:'pointer', fontSize:13, padding:0 }}>Sign in →</button>
      </div>
    </div>
  )
}

// ── Forgot Password ───────────────────────────────────────────
function ForgotPasswordForm({ onBack }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handle = async () => {
    if (!email) { toast.error('Please enter your email address'); return }
    setLoading(true)
    try {
      const { supabase } = await import('../../lib/supabase')
      const redirectTo = window.location.origin + '/?reset=true'
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo })
      if (error) throw error
      setSent(true)
    } catch(err) {
      toast.error(err.message || 'Could not send reset email')
    }
    setLoading(false)
  }

  if (sent) return (
    <div style={{ textAlign:'center' }}>
      <div style={{ fontSize:40, marginBottom:16 }}>📧</div>
      <div style={{ fontFamily:'DM Serif Display,serif', fontSize:20, color:'white', marginBottom:8 }}>Check your inbox</div>
      <div style={{ fontSize:13, color:C.muted, marginBottom:24, lineHeight:1.6, fontFamily:'DM Sans,sans-serif' }}>
        We sent a password reset link to <strong style={{ color:'white' }}>{email}</strong>. Click the link in the email to set a new password.
      </div>
      <Btn onClick={onBack} secondary>Back to sign in</Btn>
    </div>
  )

  return (
    <div>
      <div style={{ fontSize:13, color:C.muted, marginBottom:20, lineHeight:1.6, fontFamily:'DM Sans,sans-serif' }}>
        Enter your email address and we will send you a link to reset your password.
      </div>
      <Input label="Email address" type="email" value={email} onChange={setEmail} placeholder="your@email.com" />
      <div style={{ marginBottom:16 }}>
        <Btn onClick={handle} loading={loading}>Send reset link</Btn>
      </div>
      <button onClick={onBack} style={{ background:'none', border:'none', color:C.muted, cursor:'pointer', fontSize:13, fontFamily:'DM Sans,sans-serif', padding:0, width:'100%', textAlign:'center' }}>← Back to sign in</button>
    </div>
  )
}

// ── Reset Password (after clicking email link) ───────────────
function ResetPasswordForm({ onDone }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  const handle = async () => {
    if (!password) { toast.error('Please enter a new password'); return }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    if (password !== confirm) { toast.error('Passwords do not match'); return }
    setLoading(true)
    try {
      const { supabase } = await import('../../lib/supabase')
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      toast.success('Password updated! Please sign in.')
      onDone?.()
    } catch(err) {
      toast.error(err.message || 'Could not update password')
    }
    setLoading(false)
  }

  return (
    <div>
      <div style={{ fontSize:13, color:C.muted, marginBottom:20, lineHeight:1.6, fontFamily:'DM Sans,sans-serif' }}>
        Choose a new password for your account.
      </div>
      <Input label="New password" type="password" value={password} onChange={setPassword} placeholder="At least 6 characters" />
      <Input label="Confirm new password" type="password" value={confirm} onChange={setConfirm} placeholder="Repeat your new password" />
      <Btn onClick={handle} loading={loading}>Set new password</Btn>
    </div>
  )
}

// ── Main StaffLogin Component ────────────────────────────────
export default function StaffLogin({ role, onBack }) {
  const [screen, setScreen] = useState(
    window.location.search.includes('reset=true') ? 'reset' : 'signin'
  )

  const roleLabel = role === 'ops' ? 'Management' : role === 'driver' ? 'Driver' : 'Staff'
  const roleEmoji = role === 'ops' ? '⚙️' : role === 'driver' ? '🛵' : '👤'

  return (
    <div style={{ minHeight:'100vh', background:C.bg, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ width:'100%', maxWidth:400 }}>
        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ fontSize:40, marginBottom:12 }}>{roleEmoji}</div>
          <div style={{ fontFamily:'DM Serif Display,serif', fontSize:28, color:'white', marginBottom:4 }}>Isla Drop</div>
          <div style={{ fontSize:13, color:C.muted, letterSpacing:'1.5px', textTransform:'uppercase', fontFamily:'DM Sans,sans-serif' }}>
            {roleLabel} Portal
          </div>
        </div>

        {/* Card */}
        <div style={{ background:C.card, border:'0.5px solid ' + C.border, borderRadius:20, padding:'28px 24px' }}>
          {/* Screen title */}
          <div style={{ fontFamily:'DM Serif Display,serif', fontSize:20, color:'white', marginBottom:20 }}>
            {screen === 'signin' && 'Sign in'}
            {screen === 'create' && 'Create account'}
            {screen === 'forgot' && 'Reset password'}
            {screen === 'reset' && 'Set new password'}
          </div>

          {screen === 'signin' && (
            <SignInForm
              role={role}
              onForgot={() => setScreen('forgot')}
              onCreateAccount={role ? () => setScreen('create') : null}
            />
          )}
          {screen === 'create' && (
            <CreateAccountForm
              role={role}
              onSignIn={() => setScreen('signin')}
            />
          )}
          {screen === 'forgot' && (
            <ForgotPasswordForm onBack={() => setScreen('signin')} />
          )}
          {screen === 'reset' && (
            <ResetPasswordForm onDone={() => {
              window.history.replaceState({}, '', window.location.pathname)
              setScreen('signin')
            }} />
          )}
        </div>

        {/* Back link */}
        {screen !== 'reset' && onBack && (
          <button onClick={onBack}
            style={{ display:'block', margin:'20px auto 0', background:'none', border:'none', color:C.muted, cursor:'pointer', fontSize:13, fontFamily:'DM Sans,sans-serif' }}>
            ← Back to portal
          </button>
        )}
      </div>
    </div>
  )
}
