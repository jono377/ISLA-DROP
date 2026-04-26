import { useState, useEffect, Component } from 'react'
import { Toaster } from 'react-hot-toast'
import toast from 'react-hot-toast'
import { useAuthStore } from './lib/store'
import CustomerApp from './components/customer/CustomerApp'
import DriverApp from './components/driver/DriverApp'
import OpsApp from './components/ops/OpsApp'  

// ── Subdomain detection — runs once at module load ────────────
const HOST = window.location.hostname
const IS_OPS    = HOST === 'ops.isladrop.net'    || HOST.startsWith('ops.')
const IS_DRIVER = HOST === 'driver.isladrop.net' || HOST.startsWith('driver.')
const IS_STAFF  = IS_OPS || IS_DRIVER

// ── Inline staff login — no dependency on AuthScreen ─────────
function StaffLogin({ portalName, requiredRole }) {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)

  const signIn = async (e) => {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    try {
      const { supabase, getProfile } = await import('./lib/supabase')
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      const profile = await getProfile(data.user.id)
      if (profile?.role !== requiredRole) {
        await supabase.auth.signOut()
        toast.error('Access denied — this portal is for ' + portalName + ' staff only')
        setLoading(false)
        return
      }
      // Success — page will re-render via onAuthStateChange
    } catch (err) {
      toast.error(err.message || 'Sign in failed')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight:'100vh', background:'#0D3545', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ width:'100%', maxWidth:380 }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ fontSize:48, marginBottom:8 }}>{IS_OPS ? '🖥️' : '🛵'}</div>
          <div style={{ fontFamily:'DM Serif Display,Georgia,serif', fontSize:30, color:'white', marginBottom:4 }}>Isla Drop</div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,0.45)', letterSpacing:1 }}>{portalName} Portal</div>
        </div>

        <form onSubmit={signIn} style={{ background:'rgba(255,255,255,0.06)', border:'0.5px solid rgba(255,255,255,0.12)', borderRadius:18, padding:28, display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', marginBottom:6, fontFamily:'DM Sans,sans-serif', textTransform:'uppercase', letterSpacing:1 }}>Email</div>
            <input
              type="email" value={email} onChange={e=>setEmail(e.target.value)}
              placeholder="staff@isladrop.net" required autoComplete="email"
              style={{ width:'100%', padding:'13px 14px', background:'rgba(255,255,255,0.08)', border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:10, color:'white', fontSize:14, fontFamily:'DM Sans,sans-serif', outline:'none', boxSizing:'border-box' }}
            />
          </div>
          <div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', marginBottom:6, fontFamily:'DM Sans,sans-serif', textTransform:'uppercase', letterSpacing:1 }}>Password</div>
            <input
              type="password" value={password} onChange={e=>setPassword(e.target.value)}
              placeholder="••••••••" required autoComplete="current-password"
              style={{ width:'100%', padding:'13px 14px', background:'rgba(255,255,255,0.08)', border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:10, color:'white', fontSize:14, fontFamily:'DM Sans,sans-serif', outline:'none', boxSizing:'border-box' }}
            />
          </div>
          <button type="submit" disabled={loading}
            style={{ width:'100%', padding:'14px', background: loading ? 'rgba(196,104,58,0.5)' : '#C4683A', border:'none', borderRadius:12, color:'white', fontSize:15, fontWeight:600, cursor: loading ? 'default' : 'pointer', fontFamily:'DM Sans,sans-serif', marginTop:4, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            {loading
              ? <><div style={{ width:16,height:16,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'white',borderRadius:'50%',animation:'staffSpin 0.8s linear infinite' }}/> Signing in...</>
              : 'Sign in to ' + portalName
            }
          </button>
        </form>
        <div style={{ textAlign:'center', marginTop:20, fontSize:12, color:'rgba(255,255,255,0.25)', fontFamily:'DM Sans,sans-serif' }}>
          Staff access only · isladrop.net
        </div>
      </div>
      <style>{'@keyframes staffSpin{to{transform:rotate(360deg)}}'}</style>
    </div>
  )
}

// ── Error boundary ─────────────────────────────────────────────
class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(e) { return { error: e } }
  render() {
    if (this.state.error) return (
      <div style={{ padding:40, textAlign:'center', background:'#0D3B4A', minHeight:'100vh', color:'white', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
        <div style={{ fontSize:48, marginBottom:12 }}>🌴</div>
        <div style={{ fontFamily:'serif', fontSize:24, marginBottom:8 }}>Isla Drop</div>
        <div style={{ fontSize:13, opacity:0.6, marginBottom:20 }}>Something went wrong</div>
        <div style={{ fontSize:11, opacity:0.35, maxWidth:380, wordBreak:'break-all', background:'rgba(0,0,0,0.3)', padding:12, borderRadius:8, marginBottom:20 }}>
          {this.state.error?.message || 'Unknown error'}
        </div>
        <button onClick={()=>window.location.reload()} style={{ padding:'12px 24px', background:'#C4683A', color:'white', border:'none', borderRadius:10, fontSize:14, cursor:'pointer' }}>
          Reload
        </button>
      </div>
    )
    return this.props.children
  }
}

// ── Main app router ────────────────────────────────────────────
function AppInner() {
  const { user, profile, setUser, setProfile, clear } = useAuthStore()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const url = import.meta.env.VITE_SUPABASE_URL
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY
    if (!url || !key) { setReady(true); return }

    import('./lib/supabase').then(({ supabase, getProfile }) => {
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (session?.user) {
          setUser(session.user)
          const p = await getProfile(session.user.id).catch(() => null)
          if (p) setProfile(p)
        }
        setReady(true)
      }).catch(() => setReady(true))

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user)
          const p = await getProfile(session.user.id).catch(() => null)
          if (p) setProfile(p)
        }
        if (event === 'SIGNED_OUT') { clear() }
      })

      return () => subscription.unsubscribe()
    }).catch(() => setReady(true))
  }, [])

  // Show nothing while loading session (avoids flash of wrong app)
  if (!ready) return (
    <div style={{ minHeight:'100vh', background:'#0D3545', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ fontSize:36 }}>🌴</div>
    </div>
  )

  // ── ops.isladrop.net ────────────────────────────────────────
  if (IS_OPS) {
    if (!user || !profile) return <StaffLogin portalName="Ops" requiredRole="ops" />
    if (profile.role !== 'ops') {
      return (
        <div style={{ minHeight:'100vh', background:'#0D3545', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, padding:32 }}>
          <div style={{ fontSize:48 }}>🔒</div>
          <div style={{ color:'white', fontFamily:'DM Serif Display,serif', fontSize:22 }}>Access restricted</div>
          <div style={{ color:'rgba(255,255,255,0.5)', fontSize:13, textAlign:'center' }}>Ops staff only</div>
          <button onClick={()=>{ import('./lib/supabase').then(({supabase})=>supabase.auth.signOut()); clear() }}
            style={{ padding:'12px 28px', background:'#C4683A', color:'white', border:'none', borderRadius:10, fontSize:14, cursor:'pointer' }}>
            Sign out
          </button>
        </div>
      )
    }
    return <OpsApp />
  }

  // ── driver.isladrop.net ─────────────────────────────────────
  if (IS_DRIVER) {
    if (!user || !profile) return <StaffLogin portalName="Driver" requiredRole="driver" />
    if (profile.role !== 'driver') {
      return (
        <div style={{ minHeight:'100vh', background:'#0D3545', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, padding:32 }}>
          <div style={{ fontSize:48 }}>🔒</div>
          <div style={{ color:'white', fontFamily:'DM Serif Display,serif', fontSize:22 }}>Access restricted</div>
          <div style={{ color:'rgba(255,255,255,0.5)', fontSize:13, textAlign:'center' }}>Drivers only</div>
          <button onClick={()=>{ import('./lib/supabase').then(({supabase})=>supabase.auth.signOut()); clear() }}
            style={{ padding:'12px 28px', background:'#C4683A', color:'white', border:'none', borderRadius:10, fontSize:14, cursor:'pointer' }}>
            Sign out
          </button>
        </div>
      )
    }
    return <div style={{ maxWidth:480, margin:'0 auto', minHeight:'100vh' }}><DriverApp /></div>
  }

  // ── www.isladrop.net ────────────────────────────────────────
  // Role-based fallback kept so staff who visit wrong URL are redirected
  if (user && profile?.role === 'driver') {
    return <div style={{ maxWidth:480, margin:'0 auto', minHeight:'100vh' }}><DriverApp /></div>
  }
  if (user && profile?.role === 'ops') {
    return <OpsApp />
  }

  return (
    <div style={{ maxWidth:480, margin:'0 auto', minHeight:'100vh', position:'relative' }}>
      <CustomerApp />
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <Toaster position="top-center" toastOptions={{ style:{ fontFamily:'DM Sans,sans-serif', fontSize:14, borderRadius:10, background:'#0D3B4A', color:'white' } }} />
      <AppInner />
    </ErrorBoundary>
  )
}
