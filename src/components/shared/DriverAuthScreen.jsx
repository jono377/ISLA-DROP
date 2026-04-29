import { useState } from 'react'
import { signIn, getProfile } from '../../lib/supabase'
import { useAuthStore } from '../../lib/store'
import toast from 'react-hot-toast'

export default function DriverAuthScreen() {
  const [form, setForm]       = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const { setUser, setProfile } = useAuthStore()

  const handle = field => e => setForm(f => ({ ...f, [field]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      const { user } = await signIn(form.email, form.password)
      const profile  = await getProfile(user.id)

      if (profile?.role !== 'driver') {
        const { supabase } = await import('../../lib/supabase')
        await supabase.auth.signOut()
        toast.error('Access denied — drivers only')
        setLoading(false)
        return
      }

      setUser(user)
      setProfile(profile)
      toast.success('Welcome back, driver!')
    } catch (err) {
      toast.error(err.message || 'Sign in failed')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight:'100vh', background:'#0D3545', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ width:'100%', maxWidth:400 }}>

        <div style={{ textAlign:'center', marginBottom:36 }}>
          <div style={{ fontSize:48, marginBottom:12 }}>🛵</div>
          <div style={{ fontFamily:'DM Serif Display,serif', fontSize:32, color:'white', marginBottom:4 }}>Isla Drop</div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,0.45)', letterSpacing:'1.5px', textTransform:'uppercase' }}>Driver Portal</div>
        </div>

        <div style={{ background:'rgba(255,255,255,0.06)', border:'0.5px solid rgba(255,255,255,0.12)', borderRadius:20, padding:28 }}>
          <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div>
              <label style={lbl}>Email</label>
              <input type="email" value={form.email} onChange={handle('email')}
                placeholder="driver@isladrop.net" required autoComplete="email"
                style={inp} />
            </div>
            <div>
              <label style={lbl}>Password</label>
              <input type="password" value={form.password} onChange={handle('password')}
                placeholder="••••••••" required autoComplete="current-password"
                style={inp} />
            </div>
            <button type="submit" disabled={loading}
              style={{ width:'100%', padding:'14px', marginTop:4, background:loading?'rgba(43,122,139,0.5)':'#2B7A8B', border:'none', borderRadius:12, color:'white', fontSize:15, fontWeight:600, cursor:loading?'default':'pointer', fontFamily:'DM Sans,sans-serif', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              {loading
                ? <><Spinner /> Signing in...</>
                : 'Sign in to Driver Portal →'
              }
            </button>
          </form>
        </div>

        <div style={{ textAlign:'center', marginTop:20, fontSize:12, color:'rgba(255,255,255,0.2)', fontFamily:'DM Sans,sans-serif' }}>
          Restricted access · Isla Drop drivers only
        </div>
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <div style={{ width:16, height:16, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'white', borderRadius:'50%', animation:'drvSpin 0.8s linear infinite' }}>
      <style>{'@keyframes drvSpin{to{transform:rotate(360deg)}}'}</style>
    </div>
  )
}

const lbl = { display:'block', fontSize:11, fontWeight:500, color:'rgba(255,255,255,0.45)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:6, fontFamily:'DM Sans,sans-serif' }
const inp = { width:'100%', padding:'13px 14px', background:'rgba(255,255,255,0.08)', border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:10, color:'white', fontSize:14, fontFamily:'DM Sans,sans-serif', outline:'none', boxSizing:'border-box' }
