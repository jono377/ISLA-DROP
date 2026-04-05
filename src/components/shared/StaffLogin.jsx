import { useState } from 'react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../lib/store'

// ── Driver sign up form ───────────────────────────────────────
function DriverSignUp({ onBack }) {
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', phone: '',
    vehicleType: 'scooter', vehiclePlate: '', licenceNumber: '',
  })
  const [loading, setLoading] = useState(false)
  const { setUser, setProfile } = useAuthStore()

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  const handle = async () => {
    if (!form.fullName || !form.email || !form.password || !form.phone) {
      toast.error('Please fill in all required fields'); return
    }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      const { supabase } = await import('../../lib/supabase')
      const { data, error } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: { data: { full_name: form.fullName.trim(), role: 'driver' } }
      })
      if (error) throw error
      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id, full_name: form.fullName.trim(),
          role: 'driver', phone: form.phone.trim(),
          status: 'pending',
        })
        await supabase.from('drivers').upsert({
          id: data.user.id, vehicle_type: form.vehicleType,
          vehicle_plate: form.vehiclePlate.trim(),
          licence_number: form.licenceNumber.trim(),
          status: 'pending',
        })
        // Don't log them in — account needs approval first
        toast.success('Application submitted! We will review your details and contact you within 24 hours.')
        setTimeout(() => onBack(), 2500)
      }
    } catch (err) {
      const msg = err.message || 'Sign up failed'
      if (msg.includes('already registered')) toast.error('An account with this email already exists')
      else toast.error(msg)
    }
    setLoading(false)
  }

  const inp = { width:'100%', padding:'12px 14px', border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:10, fontFamily:'DM Sans,sans-serif', fontSize:14, background:'rgba(255,255,255,0.08)', color:'white', outline:'none', boxSizing:'border-box', marginBottom:10 }

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(170deg,#0A1A20,rgba(90,107,58,0.25),#0A1A20)', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ width:'100%', maxWidth:380 }}>
        <button onClick={onBack} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.5)', cursor:'pointer', fontSize:13, fontFamily:'DM Sans,sans-serif', marginBottom:20, padding:0 }}>← Back</button>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ fontSize:44, marginBottom:10 }}>🛵</div>
          <div style={{ fontFamily:'DM Serif Display,serif', fontSize:26, color:'white', marginBottom:4 }}>Driver Registration</div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,0.45)' }}>Join the Isla Drop delivery team</div>
        </div>
        <div style={{ background:'rgba(255,255,255,0.05)', borderRadius:16, padding:20 }}>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginBottom:14, textTransform:'uppercase', letterSpacing:'0.5px' }}>Personal Details</div>
          <input value={form.fullName} onChange={set('fullName')} placeholder="Full name *" style={inp} />
          <input value={form.email} onChange={set('email')} placeholder="Email address *" type="email" style={inp} />
          <input value={form.password} onChange={set('password')} placeholder="Password (min 6 characters) *" type="password" style={{ ...inp, marginBottom:16 }} />
          <input value={form.phone} onChange={set('phone')} placeholder="Phone number (WhatsApp) *" type="tel" style={inp} />

          <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginBottom:10, marginTop:6, textTransform:'uppercase', letterSpacing:'0.5px' }}>Vehicle Details</div>
          <select value={form.vehicleType} onChange={set('vehicleType')} style={{ ...inp, marginBottom:10 }}>
            <option value="scooter">Scooter / Moped</option>
            <option value="motorcycle">Motorcycle</option>
            <option value="car">Car</option>
            <option value="bicycle">Bicycle / E-bike</option>
          </select>
          <input value={form.vehiclePlate} onChange={set('vehiclePlate')} placeholder="Vehicle plate number" style={inp} />
          <input value={form.licenceNumber} onChange={set('licenceNumber')} placeholder="Driving licence number" style={{ ...inp, marginBottom:20 }} />

          <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginBottom:16, lineHeight:1.5 }}>
            By registering you confirm you have a valid driving licence and agree to Isla Drop driver terms and conditions. Your account will be reviewed by our team before activation.
          </div>

          <button onClick={handle} disabled={loading}
            style={{ width:'100%', padding:'14px', background:'#5A6B3A', color:'white', border:'none', borderRadius:12, fontFamily:'DM Sans,sans-serif', fontSize:15, fontWeight:500, cursor:loading?'default':'pointer', opacity:loading?0.7:1 }}>
            {loading ? 'Creating account...' : 'Register as Driver'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Admin secret sign up ──────────────────────────────────────
// Hidden route — not linked from driver portal, accessed via ?admin_setup=true
function AdminSetup({ onBack }) {
  const [form, setForm] = useState({ fullName:'', email:'', password:'', adminCode:'' })
  const [loading, setLoading] = useState(false)
  const { setUser, setProfile } = useAuthStore()

  // Simple code to prevent random sign ups — change this to something secret
  const ADMIN_CODE = import.meta.env.VITE_ADMIN_SETUP_CODE || 'ISLADROP2025'

  const set = (f) => (e) => setForm(prev => ({ ...prev, [f]: e.target.value }))

  const handle = async () => {
    if (form.adminCode !== ADMIN_CODE) { toast.error('Invalid admin setup code'); return }
    if (!form.fullName || !form.email || !form.password) { toast.error('Please fill in all fields'); return }
    setLoading(true)
    try {
      const { supabase } = await import('../../lib/supabase')
      const { data, error } = await supabase.auth.signUp({
        email: form.email.trim(), password: form.password,
        options: { data: { full_name: form.fullName.trim(), role: 'ops' } }
      })
      if (error) throw error
      if (data.user) {
        await supabase.from('profiles').upsert({ id: data.user.id, full_name: form.fullName.trim(), role: 'ops', email: form.email.trim() })
        setUser(data.user)
        setProfile({ id: data.user.id, full_name: form.fullName.trim(), role: 'ops' })
        toast.success('Admin account created! Welcome to Isla Drop management 🌴')
      }
    } catch (err) {
      toast.error(err.message || 'Setup failed')
    }
    setLoading(false)
  }

  const inp = { width:'100%', padding:'12px 14px', border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:10, fontFamily:'DM Sans,sans-serif', fontSize:14, background:'rgba(255,255,255,0.08)', color:'white', outline:'none', boxSizing:'border-box', marginBottom:10 }

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(170deg,#0A1A20,rgba(26,80,99,0.4),#0A1A20)', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ width:'100%', maxWidth:360 }}>
        <button onClick={onBack} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.5)', cursor:'pointer', fontSize:13, fontFamily:'DM Sans,sans-serif', marginBottom:20, padding:0 }}>← Back</button>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ fontSize:44, marginBottom:10 }}>🔐</div>
          <div style={{ fontFamily:'DM Serif Display,serif', fontSize:26, color:'white', marginBottom:4 }}>Admin Setup</div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,0.45)' }}>Management account creation</div>
        </div>
        <div style={{ background:'rgba(255,255,255,0.05)', borderRadius:16, padding:20 }}>
          <input value={form.adminCode} onChange={set('adminCode')} placeholder="Admin setup code" type="password" style={inp} />
          <input value={form.fullName} onChange={set('fullName')} placeholder="Full name" style={inp} />
          <input value={form.email} onChange={set('email')} placeholder="Email address" type="email" style={inp} />
          <input value={form.password} onChange={set('password')} placeholder="Password" type="password" style={{ ...inp, marginBottom:20 }} onKeyDown={e=>e.key==='Enter'&&handle()} />
          <button onClick={handle} disabled={loading}
            style={{ width:'100%', padding:'14px', background:'#1A5263', color:'white', border:'none', borderRadius:12, fontFamily:'DM Sans,sans-serif', fontSize:15, fontWeight:500, cursor:'pointer', opacity:loading?0.7:1 }}>
            {loading ? 'Creating...' : 'Create Admin Account'}
          </button>
        </div>
        <div style={{ textAlign:'center', marginTop:16, fontSize:11, color:'rgba(255,255,255,0.2)', fontFamily:'DM Sans,sans-serif' }}>
          This page is for authorised administrators only
        </div>
      </div>
    </div>
  )
}

// ── Main StaffLogin ───────────────────────────────────────────
export default function StaffLogin({ role, onBack }) {
  const [mode, setMode]     = useState('signin') // signin | signup (driver only)
  const [email, setEmail]   = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const { setUser, setProfile } = useAuthStore()

  // Admin setup backdoor — accessible via ?admin_setup=true on staff URL
  if (role === 'ops' && typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('admin_setup') === 'true') {
    return <AdminSetup onBack={onBack} />
  }

  if (role === 'driver' && mode === 'signup') {
    return <DriverSignUp onBack={() => setMode('signin')} />
  }

  const isDriver = role === 'driver'
  const accent   = isDriver ? '#5A6B3A' : '#1A5263'
  const label    = isDriver ? 'Driver' : 'Management'
  const icon     = isDriver ? '🛵' : '⚙️'

  const handle = async () => {
    if (!email || !password) { toast.error('Please fill in all fields'); return }
    setLoading(true)
    try {
      const { supabase, getProfile } = await import('../../lib/supabase')
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (error) {
        if (error.message.includes('Invalid login')) toast.error('Incorrect email or password')
        else if (error.message.includes('fetch')) toast.error('Connection error — check your internet and try again')
        else toast.error(error.message)
        setLoading(false); return
      }
      const profile = await getProfile(data.user.id).catch(() => null)
      if (!profile) { await supabase.auth.signOut(); toast.error('Profile not found. Contact admin@isladrop.net'); setLoading(false); return }
      if (profile.role !== role) { await supabase.auth.signOut(); toast.error(`This is not a ${label} account`); setLoading(false); return }
      if (profile.status === 'pending') { await supabase.auth.signOut(); toast.error('Your account is pending approval. We will contact you within 24 hours.'); setLoading(false); return }
      setUser(data.user)
      setProfile(profile)
      toast.success(`Welcome, ${profile.full_name || label}!`)
    } catch (err) {
      toast.error(err.message?.includes('fetch') ? 'Connection error — check your internet' : err.message || 'Login failed')
    }
    setLoading(false)
  }

  const inp = { width:'100%', padding:'13px 14px', border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:10, fontFamily:'DM Sans,sans-serif', fontSize:14, background:'rgba(255,255,255,0.08)', color:'white', outline:'none', boxSizing:'border-box', marginBottom:10 }

  return (
    <div style={{ minHeight:'100vh', background:`linear-gradient(170deg,#0A1A20,${accent}40,#0A1A20)`, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ width:'100%', maxWidth:360 }}>
        <button onClick={onBack} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.5)', cursor:'pointer', fontSize:13, fontFamily:'DM Sans,sans-serif', marginBottom:24, padding:0 }}>← Back</button>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ fontSize:48, marginBottom:12 }}>{icon}</div>
          <div style={{ fontFamily:'DM Serif Display,serif', fontSize:28, color:'white', marginBottom:6 }}>{label} Login</div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,0.45)' }}>Isla Drop {label} Portal</div>
        </div>
        <div style={{ background:'rgba(255,255,255,0.05)', borderRadius:16, padding:24 }}>
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address" type="email" style={inp} />
          <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" type="password"
            style={{ ...inp, marginBottom:20 }} onKeyDown={e=>e.key==='Enter'&&handle()} />
          <button onClick={handle} disabled={loading}
            style={{ width:'100%', padding:'14px', background:accent, color:'white', border:'none', borderRadius:12, fontFamily:'DM Sans,sans-serif', fontSize:15, fontWeight:500, cursor:loading?'default':'pointer', opacity:loading?0.7:1, marginBottom: isDriver?10:0 }}>
            {loading ? 'Signing in...' : `Sign in as ${label}`}
          </button>
          {isDriver && (
            <button onClick={() => setMode('signup')}
              style={{ width:'100%', padding:'13px', background:'rgba(255,255,255,0.08)', border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:12, fontFamily:'DM Sans,sans-serif', fontSize:14, color:'white', cursor:'pointer' }}>
              New driver? Register here
            </button>
          )}
        </div>
        <div style={{ textAlign:'center', marginTop:20, fontSize:12, color:'rgba(255,255,255,0.3)', fontFamily:'DM Sans,sans-serif' }}>
          {isDriver ? 'Driver access only · Contact admin@isladrop.net for help' : 'Management access only · Contact admin@isladrop.net'}
        </div>
        {role === 'ops' && (
          <div style={{ textAlign:'center', marginTop:8 }}>
            <a href="?staff=true&admin_setup=true" style={{ fontSize:11, color:'rgba(255,255,255,0.15)', fontFamily:'DM Sans,sans-serif', textDecoration:'none' }}>First time setup</a>
          </div>
        )}
      </div>
    </div>
  )
}
