import { useState } from 'react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../lib/store'

export default function AuthScreen({ onClose }) {
  const [mode, setMode] = useState('signin') // signin | signup | reset
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const { setUser, setProfile } = useAuthStore()

  const handle = async () => {
    if (!email || !password) { toast.error('Please fill in all fields'); return }
    setLoading(true)
    try {
      const { supabase, getProfile } = await import('../../lib/supabase')
      if (mode === 'signin') {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        setUser(data.user)
        const profile = await getProfile(data.user.id).catch(() => null)
        if (profile) setProfile(profile)
        toast.success('Welcome back! 🌴')
        onClose?.()
      } else if (mode === 'signup') {
        if (!name.trim()) { toast.error('Please enter your name'); setLoading(false); return }
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })
        if (error) throw error
        if (data.user) {
          await supabase.from('profiles').upsert({ id: data.user.id, full_name: name, role: 'customer' })
          setUser(data.user)
          setProfile({ id: data.user.id, full_name: name, role: 'customer' })
        }
        toast.success('Account created! Welcome to Isla Drop 🌴')
        onClose?.()
      } else {
        const { supabase: sb } = await import('../../lib/supabase')
        const { error } = await sb.auth.resetPasswordForEmail(email)
        if (error) throw error
        toast.success('Reset email sent — check your inbox')
        setMode('signin')
      }
    } catch (err) {
      toast.error(err.message || 'Something went wrong')
    }
    setLoading(false)
  }

  const inp = { border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:10, fontFamily:'DM Sans,sans-serif', fontSize:14, background:'rgba(255,255,255,0.08)', color:'white', outline:'none', padding:'13px 14px', width:'100%', boxSizing:'border-box' }

  return (
    <div style={{ padding:'0 0 8px' }}>
      <div style={{ fontFamily:'DM Serif Display,serif', fontSize:24, color:'white', marginBottom:6 }}>
        {mode==='signin' ? 'Sign in' : mode==='signup' ? 'Create account' : 'Reset password'}
      </div>
      <div style={{ fontSize:13, color:'rgba(255,255,255,0.5)', marginBottom:24 }}>
        {mode==='signin' ? 'Welcome back to Isla Drop 🌴' : mode==='signup' ? 'Join Isla Drop — free to sign up' : 'We\'ll email you a reset link'}
      </div>

      {mode==='signup' && (
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Full name" style={{ ...inp, marginBottom:10 }} />
      )}
      <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address" type="email" style={{ ...inp, marginBottom:10 }} />
      {mode!=='reset' && (
        <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" type="password" style={{ ...inp, marginBottom:20 }}
          onKeyDown={e=>e.key==='Enter'&&handle()} />
      )}
      {mode==='reset' && <div style={{ height:10 }}/>}

      <button onClick={handle} disabled={loading}
        style={{ width:'100%', padding:'14px', background:'#C4683A', color:'white', border:'none', borderRadius:12, fontFamily:'DM Sans,sans-serif', fontSize:15, fontWeight:500, cursor:'pointer', marginBottom:14, opacity:loading?0.7:1 }}>
        {loading ? 'Please wait…' : mode==='signin' ? 'Sign in' : mode==='signup' ? 'Create account' : 'Send reset link'}
      </button>

      {mode==='signin' && (
        <>
          <button onClick={()=>setMode('signup')} style={{ width:'100%', padding:'13px', background:'rgba(255,255,255,0.08)', border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:12, fontFamily:'DM Sans,sans-serif', fontSize:14, color:'white', cursor:'pointer', marginBottom:10 }}>
            New to Isla Drop? Create account
          </button>
          <button onClick={()=>setMode('reset')} style={{ width:'100%', padding:'10px', background:'none', border:'none', fontFamily:'DM Sans,sans-serif', fontSize:13, color:'rgba(255,255,255,0.45)', cursor:'pointer' }}>
            Forgot password?
          </button>
        </>
      )}
      {mode!=='signin' && (
        <button onClick={()=>setMode('signin')} style={{ width:'100%', padding:'10px', background:'none', border:'none', fontFamily:'DM Sans,sans-serif', fontSize:13, color:'rgba(255,255,255,0.45)', cursor:'pointer' }}>
          ← Back to sign in
        </button>
      )}
    </div>
  )
}
