import { useEffect, useState, Component } from 'react'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './lib/store'
import CustomerApp from './components/customer/CustomerApp'
import DriverApp from './components/driver/DriverApp'
import OpsApp from './components/ops/OpsApp'
import StaffLogin from './components/shared/StaffLogin'

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, textAlign: 'center', background: '#0D3B4A', minHeight: '100vh', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🌴</div>
          <div style={{ fontFamily: 'serif', fontSize: 28, marginBottom: 8 }}>Isla Drop</div>
          <div style={{ fontSize: 14, opacity: 0.6, marginBottom: 24 }}>Something went wrong loading the app</div>
          <div style={{ fontSize: 11, opacity: 0.35, maxWidth: 360, wordBreak: 'break-all', background: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 8, marginBottom: 20 }}>
            {this.state.error?.message}
          </div>
          <button onClick={() => window.location.reload()} style={{ padding: '12px 24px', background: '#C4683A', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, cursor: 'pointer' }}>
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

const toastCfg = {
  position: 'top-center',
  toastOptions: {
    style: { fontFamily: 'DM Sans, sans-serif', fontSize: 14, borderRadius: 10, background: '#0D3B4A', color: 'white' }
  }
}

function StaffPortal({ autoRole }) {
  const [role, setRole] = useState(autoRole || null)
  if (role) return <StaffLogin role={role} onBack={() => setRole(null)} />
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(170deg,#0A2A38,#0D3545)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 360, textAlign: 'center' }}>
        <div style={{ fontFamily: 'DM Serif Display,serif', fontSize: 32, color: 'white', marginBottom: 8 }}>Isla Drop</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 40, letterSpacing: '2px', textTransform: 'uppercase' }}>Staff Portal</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button onClick={() => setRole('driver')}
            style={{ padding: '18px', background: 'rgba(90,107,58,0.2)', border: '0.5px solid rgba(90,107,58,0.4)', borderRadius: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left' }}>
            <span style={{ fontSize: 32 }}>🛵</span>
            <div>
              <div style={{ fontSize: 16, fontWeight: 500, color: 'white', fontFamily: 'DM Sans,sans-serif' }}>Driver App</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>Accept and manage deliveries</div>
            </div>
          </button>
          <button onClick={() => setRole('ops')}
            style={{ padding: '18px', background: 'rgba(26,80,99,0.3)', border: '0.5px solid rgba(43,122,139,0.4)', borderRadius: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left' }}>
            <span style={{ fontSize: 32 }}>⚙️</span>
            <div>
              <div style={{ fontSize: 16, fontWeight: 500, color: 'white', fontFamily: 'DM Sans,sans-serif' }}>Management Dashboard</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>Orders, fleet and operations</div>
            </div>
          </button>
        </div>
        <div style={{ marginTop: 32, fontSize: 12, color: 'rgba(255,255,255,0.25)', fontFamily: 'DM Sans,sans-serif' }}>Authorised staff only</div>
      </div>
    </div>
  )
}

function AppInner() {
  const { user, profile, setUser, setProfile, clear } = useAuthStore()
  const hostname = window.location.hostname
  const isStaffUrl = window.location.pathname.startsWith('/staff') ||
                     window.location.search.includes('staff=true') ||
                     hostname.includes('staff') ||
                     hostname.startsWith('ops.') ||
                     hostname.startsWith('driver.')
  const autoRole = hostname.startsWith('ops.') ? 'ops' : hostname.startsWith('driver.') ? 'driver' : null

  useEffect(() => {
    const url = import.meta.env.VITE_SUPABASE_URL
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY
    if (!url || !key || !url.startsWith('https://')) return
    import('./lib/supabase').then(({ supabase, getProfile }) => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUser(session.user)
          getProfile(session.user.id).then(p => { if (p) setProfile(p) }).catch(() => {})
        }
      }).catch(() => {})
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user)
          const p = await getProfile(session.user.id).catch(() => null)
          if (p) setProfile(p)
        }
        if (event === 'SIGNED_OUT') clear()
      })
      return () => subscription.unsubscribe()
    }).catch(() => {})
  }, [])

  if (user && profile?.role === 'driver') return <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh' }}><DriverApp /></div>
  if (user && profile?.role === 'ops') return <OpsApp />
  if (isStaffUrl) return <StaffPortal autoRole={autoRole} />

  return (
    <div style={{ minHeight: '100vh', background: '#0A2A38', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 480, position: 'relative', background: 'linear-gradient(170deg,#0A2A38,#0D3545)', minHeight: '100vh' }}>
        <CustomerApp />
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <Toaster {...toastCfg} />
      <AppInner />
    </ErrorBoundary>
  )
}
