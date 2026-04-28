import { useEffect, Component } from 'react'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './lib/store'
import CustomerApp from './components/customer/CustomerApp'
import DriverApp from './components/driver/DriverApp'
import OpsApp from './components/ops/OpsApp'
import AuthScreen from './components/shared/AuthScreen'

// Subdomain detection
const _h = window.location.hostname
const _ops    = _h === 'ops.isladrop.net'    || _h.startsWith('ops.')
const _driver = _h === 'driver.isladrop.net' || _h.startsWith('driver.')

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, fontFamily: 'sans-serif', textAlign: 'center', background: '#0D3B4A', minHeight: '100vh', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🌴</div>
          <div style={{ fontFamily: 'serif', fontSize: 28, marginBottom: 8 }}>Isla Drop</div>
          <div style={{ fontSize: 14, opacity: 0.7, marginBottom: 24 }}>Something went wrong loading the app</div>
          <div style={{ fontSize: 11, opacity: 0.4, maxWidth: 400, wordBreak: 'break-all', background: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 8 }}>
            {this.state.error?.message || 'Unknown error'}
          </div>
          <button onClick={() => window.location.reload()} style={{ marginTop: 24, padding: '12px 24px', background: '#C4683A', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, cursor: 'pointer' }}>
            Reload app
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

const toastStyle = {
  position: 'top-center',
  toastOptions: {
    style: { fontFamily: 'DM Sans, sans-serif', fontSize: 14, borderRadius: 10, background: '#0D3B4A', color: 'white' }
  }
}

function AppInner() {
  const { user, profile, setUser, setProfile, clear } = useAuthStore()

  useEffect(() => {
    const url = import.meta.env.VITE_SUPABASE_URL
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY
    if (!url || !key || url === '' || key === '') return

    import('./lib/supabase').then(({ supabase, getProfile }) => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUser(session.user)
          getProfile(session.user.id).then(setProfile).catch(() => {})
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

  // ops.isladrop.net
  if (_ops) {
    if (!user)                    return <AuthScreen />
    if (profile?.role === 'ops')  return <OpsApp />
    if (profile)                  return <AuthScreen />
    return null
  }

  // driver.isladrop.net
  if (_driver) {
    if (!user)                       return <AuthScreen />
    if (profile?.role === 'driver')  return <div style={{ maxWidth:480, margin:'0 auto', minHeight:'100vh' }}><DriverApp /></div>
    if (profile)                     return <AuthScreen />
    return null
  }

  // www.isladrop.net
  if (user && profile?.role === 'driver') {
    return <div style={{ maxWidth:480, margin:'0 auto', minHeight:'100vh' }}><DriverApp /></div>
  }
  if (user && profile?.role === 'ops') {
    return <div style={{ maxWidth:480, margin:'0 auto', minHeight:'100vh' }}><OpsApp /></div>
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
      <Toaster {...toastStyle} />
      <AppInner />
    </ErrorBoundary>
  )
}
