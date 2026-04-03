import { useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { supabase, getProfile } from './lib/supabase'
import { useAuthStore } from './lib/store'
import CustomerApp from './components/customer/CustomerApp'
import DriverApp from './components/driver/DriverApp'
import OpsApp from './components/ops/OpsApp'
import AuthScreen from './components/shared/AuthScreen'

export default function App() {
  const { user, profile, setUser, setProfile, clear } = useAuthStore()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        getProfile(session.user.id).then(setProfile).catch(() => {})
      }
    })

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

  const toastStyle = {
    position: 'top-center',
    toastOptions: {
      style: { fontFamily: 'DM Sans, sans-serif', fontSize: 14, borderRadius: 10, background: '#0D3B4A', color: 'white' }
    }
  }

  // Drivers and Ops still require login
  if (user && profile?.role === 'driver') {
    return (
      <div style={{ maxWidth:480, margin:'0 auto', minHeight:'100vh' }}>
        <Toaster {...toastStyle} />
        <DriverApp />
      </div>
    )
  }

  if (user && profile?.role === 'ops') {
    return (
      <div style={{ maxWidth:480, margin:'0 auto', minHeight:'100vh' }}>
        <Toaster {...toastStyle} />
        <OpsApp />
      </div>
    )
  }

  // Driver/Ops login gate — only if they somehow land here without a customer role
  if (user && profile && profile.role !== 'customer') {
    return (
      <>
        <AuthScreen />
        <Toaster {...toastStyle} />
      </>
    )
  }

  // Customers (logged in or not) go straight to the app
  // Sign-in is prompted only at checkout inside CustomerApp
  return (
    <div style={{ maxWidth:480, margin:'0 auto', minHeight:'100vh', position:'relative' }}>
      <Toaster {...toastStyle} />
      <CustomerApp />
    </div>
  )
}
