import { useState } from 'react'
import { useAuthStore } from '../../lib/store'
import AuthScreen from '../shared/AuthScreen'
import SupportChat from './SupportChat'

function AccordionItem({ icon, label, content }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ marginBottom: 8 }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'rgba(255,255,255,0.06)', borderRadius: open ? '12px 12px 0 0' : 12, cursor: 'pointer' }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.82)', fontFamily: 'DM Sans,sans-serif', flex: 1 }}>{label}</span>
        <svg style={{ transition: 'transform 0.2s', transform: open ? 'rotate(90deg)' : 'rotate(0)' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
      </div>
      {open && (
        <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '0 0 12px 12px', fontSize: 13, color: 'rgba(255,255,255,0.55)', fontFamily: 'DM Sans,sans-serif', lineHeight: 1.6 }}>
          {content}
        </div>
      )}
    </div>
  )
}

export default function AccountView({ t }) {
  const { user, profile, clear } = useAuthStore()
  const [showAuth, setShowAuth]       = useState(false)
  const [showSupport, setShowSupport] = useState(false)

  if (showSupport) return (
    <div style={{ padding: '20px 16px', height: '80vh', display: 'flex', flexDirection: 'column' }}>
      <SupportChat onBack={() => setShowSupport(false)} />
    </div>
  )

  return (
    <div style={{ padding: '20px 16px' }}>
      <div style={{ fontFamily: 'DM Serif Display,serif', fontSize: 26, color: 'white', marginBottom: 20 }}>Account</div>
      {user ? (
        <>
          <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 14, padding: 16, marginBottom: 12 }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,#C4683A,#E8854A)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 10 }}>
              {(profile?.full_name || 'U').charAt(0).toUpperCase()}
            </div>
            <div style={{ fontSize: 16, fontWeight: 500, color: 'white' }}>{profile?.full_name || 'Guest'}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{user.email}</div>
          </div>

          <AccordionItem icon="📦" label="Order history" content="Your past orders will appear here once you have placed them. Track, reorder and view receipts all in one place." />
          <AccordionItem icon="📍" label="Saved addresses" content="Save your villa, hotel or favourite spots for fast checkout. Use the address bar on the home screen to add one." />
          <AccordionItem icon="🔔" label="Notifications" content="Push notifications coming soon! You will get real-time updates on your order status and driver location." />
          <AccordionItem icon="🌍" label="Language and region" content="Use the flag icon in the top right of the home screen to switch between 13 languages." />

          <div onClick={() => setShowSupport(true)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'rgba(43,122,139,0.2)', border: '0.5px solid rgba(43,122,139,0.35)', borderRadius: 12, marginBottom: 8, cursor: 'pointer' }}>
            <span style={{ fontSize: 18 }}>💬</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, color: 'white', fontFamily: 'DM Sans,sans-serif' }}>Customer Support</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>AI-powered 24/7 support</div>
            </div>
            <svg style={{ marginLeft: 'auto' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
          </div>

          <button onClick={() => { import('../../lib/supabase').then(m => m.supabase.auth.signOut()); clear() }}
            style={{ width: '100%', marginTop: 8, padding: '13px', background: 'rgba(196,104,58,0.12)', border: '0.5px solid rgba(196,104,58,0.3)', borderRadius: 12, fontFamily: 'DM Sans,sans-serif', fontSize: 14, color: '#E8A070', cursor: 'pointer' }}>
            Sign out
          </button>
        </>
      ) : (
        <>
          {showAuth
            ? <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 20 }}>
                <AuthScreen onClose={() => setShowAuth(false)} />
              </div>
            : <>
                <div style={{ textAlign: 'center', padding: '30px 0 20px' }}>
                  <div style={{ fontSize: 48, marginBottom: 14 }}>👤</div>
                  <div style={{ fontFamily: 'DM Serif Display,serif', fontSize: 22, color: 'white', marginBottom: 8 }}>Your account</div>
                  <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', marginBottom: 24 }}>Sign in to track orders, save addresses and more</div>
                </div>
                <button onClick={() => setShowAuth(true)}
                  style={{ width: '100%', padding: '14px', background: '#C4683A', color: 'white', border: 'none', borderRadius: 12, fontFamily: 'DM Sans,sans-serif', fontSize: 15, fontWeight: 500, cursor: 'pointer', marginBottom: 10 }}>
                  Sign in / Create account
                </button>
                <div onClick={() => setShowSupport(true)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'rgba(255,255,255,0.06)', borderRadius: 12, cursor: 'pointer', marginTop: 8 }}>
                  <span style={{ fontSize: 18 }}>💬</span>
                  <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.82)', fontFamily: 'DM Sans,sans-serif' }}>Customer Support</span>
                  <svg style={{ marginLeft: 'auto' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                </div>
              </>
          }
        </>
      )}
    </div>
  )
}
