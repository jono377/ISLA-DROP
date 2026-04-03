import { useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { supabase, getProfile } from './lib/supabase'
import { useAuthStore } from './lib/store'
import AuthScreen from './components/shared/AuthScreen'
import CustomerApp from './components/customer/CustomerApp'
import DriverApp from './components/driver/DriverApp'
import OpsApp from './components/ops/OpsApp'

const TAB_BAR_ITEMS = {
  customer: [
    { id: 'shop', label: 'Order', icon: CartIcon },
    { id: 'orders', label: 'My Orders', icon: ClockIcon },
    { id: 'account', label: 'Account', icon: PersonIcon },
  ],
  driver: [
    { id: 'queue', label: 'Runs', icon: ScooterIcon },
    { id: 'history', label: 'History', icon: ClockIcon },
    { id: 'account', label: 'Account', icon: PersonIcon },
  ],
  ops: [
    { id: 'overview', label: 'Overview', icon: GridIcon },
    { id: 'orders', label: 'Orders', icon: CartIcon },
    { id: 'fleet', label: 'Fleet', icon: ScooterIcon },
    { id: 'map', label: 'Map', icon: MapIcon },
  ],
}

export default function App() {
  const { user, profile, setUser, setProfile, clear } = useAuthStore()

  useEffect(() => {
    // Restore session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        getProfile(session.user.id).then(setProfile).catch(() => {})
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user)
        const profile = await getProfile(session.user.id).catch(() => null)
        if (profile) setProfile(profile)
      }
      if (event === 'SIGNED_OUT') clear()
    })

    return () => subscription.unsubscribe()
  }, [])

  if (!user || !profile) {
    return (
      <>
        <AuthScreen />
        <Toaster position="top-center" />
      </>
    )
  }

  const role = profile.role ?? 'customer'

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: '#FEFCF9', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <Toaster position="top-center" containerStyle={{ top: 16 }} toastOptions={{ style: { fontFamily: 'DM Sans, sans-serif', fontSize: 14, borderRadius: 10, background: '#2A2318', color: 'white' } }} />

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 68 }}>
        {role === 'customer' && <CustomerApp />}
        {role === 'driver' && <DriverApp />}
        {role === 'ops' && <OpsApp />}
      </div>

      <TabBar role={role} onSignOut={() => { supabase.auth.signOut(); clear() }} />
    </div>
  )
}

function TabBar({ role, onSignOut }) {
  const items = TAB_BAR_ITEMS[role] ?? TAB_BAR_ITEMS.customer

  return (
    <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, display: 'flex', background: '#FEFCF9', borderTop: '0.5px solid rgba(42,35,24,0.12)', zIndex: 100 }}>
      {items.map(({ id, label, icon: Icon }) => (
        <button key={id} style={{ flex: 1, padding: '10px 4px 8px', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, fontFamily: 'DM Sans, sans-serif', fontSize: 10, color: '#7A6E60' }}>
          <Icon size={20} />
          {label}
        </button>
      ))}
      <button onClick={onSignOut} style={{ flex: 1, padding: '10px 4px 8px', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, fontFamily: 'DM Sans, sans-serif', fontSize: 10, color: '#7A6E60' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        Sign out
      </button>
    </div>
  )
}

// Icon components
function CartIcon({ size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
}
function ClockIcon({ size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
}
function PersonIcon({ size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
}
function ScooterIcon({ size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="5.5" cy="17.5" r="2.5"/><circle cx="18.5" cy="17.5" r="2.5"/><path d="M16 8h4l2 5H10l1-8h5v3z"/><path d="M10 13H4l1.5-4"/></svg>
}
function GridIcon({ size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
}
function MapIcon({ size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="1,6 1,22 8,18 16,22 23,18 23,2 16,6 8,2"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
}
