import { useEffect, Component } from 'react'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './lib/store'
import { supabase, getProfile } from './lib/supabase'
import CustomerApp from './components/customer/CustomerApp'
import DriverApp from './components/driver/DriverApp'
import OpsApp from './components/ops/OpsApp'

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

function AppInner() {
  const { user, profile, setUser, setProfile, clear } = useAuthStore()

  useEffect(() => {
    // Restore session on load
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
  }, [])

  // Ops dashboard — full width, no mobile constraint
  if (user && profile?.role === 'ops') return <OpsApp />

  // Driver app — mobile width
  if (user && profile?.role === 'driver') return <DriverApp />

  // Customer app — mobile width  
  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', position: 'relative' }}>
      <CustomerApp />
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
