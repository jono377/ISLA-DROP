import { useEffect, Component, lazy, Suspense } from 'react'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './lib/store'

const CustomerApp = lazy(() => import('./components/customer/CustomerApp'));
const DriverApp = lazy(() => import('./components/driver/DriverApp'));
const OpsApp = lazy(() => import('./components/ops/OpsApp'));


const CustomerAuthScreen = lazy(() => import('./components/shared/CustomerAuthScreen'));
const OpsAuthScreen = lazy(() => import('./components/shared/OpsAuthScreen'));
const DriverAuthScreen = lazy(() => import('./components/shared/DriverAuthScreen'));

import { getOrderNumberFromURL } from './components/customer/CustomerFeatures_launch'

const trackingOrderNumber = getOrderNumberFromURL();

// Subdomain detection
const _h      = window.location.hostname
const _isOps    = _h === 'ops.isladrop.net'    || _h.startsWith('ops.')
const _isDriver = _h === 'driver.isladrop.net' || _h.startsWith('driver.')

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
          {this.state.error?.message}
        </div>
        <button onClick={() => window.location.reload()} style={{ padding:'12px 24px', background:'#C4683A', color:'white', border:'none', borderRadius:10, fontSize:14, cursor:'pointer' }}>
          Reload
        </button>
      </div>
    )
    return this.props.children
  }
}

function AppInner() {
  const { user, profile, setUser, setProfile, clear } = useAuthStore()

  useEffect(() => {
    const url = import.meta.env.VITE_SUPABASE_URL
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY
    if (!url || !key) return

    import('./lib/supabase').then(({ supabase, getProfile }) => {
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (session?.user) {
          setUser(session.user)
          const p = await getProfile(session.user.id).catch(() => null)
          if (p) setProfile(p)
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


  // ── ops.isladrop.net ──────────────────────────────────────
  if (_isOps) {
    if ((!user)||(!profile)|| (profile.role !== 'ops')) return <OpsAuthScreen />
    return <OpsApp />
  }

  // ── driver.isladrop.net ───────────────────────────────────
  if (_isDriver) {
    if ((!user)||(!profile)|| (profile.role !== 'driver')) return <DriverAuthScreen />
    return <div style={{ maxWidth:480, margin:'0 auto', minHeight:'100vh' }}><DriverApp /></div>
  }

  // ── www.isladrop.net ──────────────────────────────────────
  /*
  if (user && profile?.role === 'driver') {
    return <div style={{ maxWidth:480, margin:'0 auto', minHeight:'100vh' }}>DRIVER APP <DriverApp /></div>
  }
  else if (user && profile?.role === 'ops') {
    return <div>OPS APP<OpsApp /></div>
  }
  else{
    */
    if (trackingOrderNumber) {
      return <PublicTrackingPage orderNumber={trackingOrderNumber} />
    }
    /*
    if(!user){
      return <CustomerAuthScreen />
    }
    */
    return (
        <div style={{ maxWidth:480, margin:'0 auto', minHeight:'100vh', position:'relative' }}>
          <CustomerApp />
        </div>
    )
  //}
}

export default function App() {
  return (
    <ErrorBoundary>
      <Toaster position="top-center" toastOptions={{ style:{ fontFamily:'DM Sans,sans-serif', fontSize:14, borderRadius:10, background:'#0D3B4A', color:'white' } }} />
      <Suspense fallback={<div style={{ color: 'white', textAlign: 'center', marginTop: '20vh' }}>Loading...</div>}>
        <AppInner />
      </Suspense>
    </ErrorBoundary>
  )
}
