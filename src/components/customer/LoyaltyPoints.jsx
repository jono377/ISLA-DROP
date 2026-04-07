import { useT_ctx } from '../../i18n/TranslationContext'
import { useState, useEffect } from 'react'
import { useAuthStore } from '../../lib/store'
import toast from 'react-hot-toast'

const TIERS = [
  { name:'Island Explorer', min:0,    max:499,  emoji:'🌴', color:'#7A6E60', perks:['1 point per €1 spent','Priority support'] },
  { name:'Ibiza Regular',   min:500,  max:1499, emoji:'🌊', color:'#2B7A8B', perks:['1.5 points per €1 spent','5% discount monthly'] },
  { name:'White Isle VIP',  min:1500, max:4999, emoji:'⭐', color:'#C4683A', perks:['2 points per €1 spent','Free delivery on orders €50+','Monthly bonus'] },
  { name:'Isla Elite',      min:5000, max:99999, emoji:'👑', color:'#8B6020', perks:['3 points per €1 spent','Free delivery always','VIP concierge access','Monthly gift'] },
]

function getTier(points) {
  return TIERS.find(tier => points >= tier.min && points <= tier.max) || TIERS[0]
}

export default function LoyaltyPoints({
  const t = useT_ctx() onBack }) {
  const { user } = useAuthStore()
  const [balance, setBalance]   = useState(0)
  const [history, setHistory]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [referral, setReferral] = useState(null)
  const [copying, setCopying]   = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const { supabase } = await import('../../lib/supabase')
        const [{ data: pts }, { data: ref }] = await Promise.all([
          supabase.from('loyalty_points').select('*').eq('customer_id', user.id).order('created_at', { ascending: false }),
          supabase.from('referrals').select('*').eq('referrer_id', user.id).limit(1).single(),
        ])
        if (pts) {
          const bal = pts.reduce((s, p) => p.type === 'redeemed' || p.type === 'expired' ? s - p.points : s + p.points, 0)
          setBalance(Math.max(0, bal))
          setHistory(pts.slice(0, 20))
        }
        if (ref) setReferral(ref)
        else {
          // Create referral code if none exists
          const code = 'ISLA' + user.id.slice(0, 6).toUpperCase()
          const { data: newRef } = await supabase.from('referrals').insert({
            referrer_id: user.id,
            referred_email: '',
            referral_code: code,
            status: 'pending',
          }).select().single()
          if (newRef) setReferral(newRef)
        }
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  const copyReferral = async () => {
    if (!referral) return
    setCopying(true)
    const link = 'https://isla-drop.vercel.app?ref=' + referral.referral_code
    await navigator.clipboard?.writeText(link).catch(() => {})
    toast.success('Referral link copied!')
    setTimeout(() => setCopying(false), 1500)
  }

  const tier = getTier(balance)
  const nextTier = TIERS[TIERS.indexOf(tier) + 1]
  const progressPct = nextTier ? Math.round(((balance - tier.min) / (nextTier.min - tier.min)) * 100) : 100

  const TYPE_LABELS = { earned:'Order reward', redeemed:'Redeemed', bonus:'Bonus', referral:'Referral reward', expired:'Expired' }
  const TYPE_COLORS = { earned:'#5A6B3A', redeemed:'#C4683A', bonus:'#2B7A8B', referral:'#8B6020', expired:'#7A6E60' }

  return (
    <div style={{ padding:'0 16px 32px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
        <button onClick={onBack} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.6)', cursor:'pointer', fontSize:20, padding:0 }}>←</button>
        <div style={{ fontFamily:'DM Serif Display,serif', fontSize:22, color:'white' }}>{t.loyaltyRewards||'Isla Rewards'}</div>
      </div>

      {/* Tier card */}
      <div style={{ background:'linear-gradient(135deg,rgba(196,104,58,0.3),rgba(43,122,139,0.3))', border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:18, padding:20, marginBottom:16, textAlign:'center' }}>
        <div style={{ fontSize:40, marginBottom:8 }}>{tier.emoji}</div>
        <div style={{ fontFamily:'DM Serif Display,serif', fontSize:22, color:'white', marginBottom:4 }}>{tier.name}</div>
        <div style={{ fontFamily:'DM Serif Display,serif', fontSize:44, color:'white', marginBottom:4 }}>{balance.toLocaleString()}</div>
        <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', marginBottom:14 }}>points</div>
        {nextTier && (
          <>
            <div style={{ background:'rgba(255,255,255,0.1)', borderRadius:20, height:6, marginBottom:6 }}>
              <div style={{ height:'100%', width:progressPct + '%', background:tier.color, borderRadius:20, transition:'width 0.5s' }} />
            </div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.45)' }}>
              {nextTier.min - balance} points to {nextTier.name} {nextTier.emoji}
            </div>
          </>
        )}
      </div>

      {/* Perks */}
      <div style={{ background:'rgba(255,255,255,0.06)', borderRadius:14, padding:16, marginBottom:16 }}>
        <div style={{ fontSize:13, fontWeight:500, color:'white', marginBottom:10 }}>Your {tier.name} perks</div>
        {tier.perks.map((p, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:tier.color, flexShrink:0 }} />
            <div style={{ fontSize:13, color:'rgba(255,255,255,0.7)' }}>{p}</div>
          </div>
        ))}
      </div>

      {/* Referral */}
      <div style={{ background:'rgba(43,122,139,0.15)', border:'0.5px solid rgba(43,122,139,0.3)', borderRadius:14, padding:16, marginBottom:16 }}>
        <div style={{ fontSize:13, fontWeight:500, color:'#7ECFE0', marginBottom:6 }}>🎁 Refer a friend</div>
        <div style={{ fontSize:12, color:'rgba(255,255,255,0.55)', marginBottom:12, lineHeight:1.5 }}>
          Earn 200 points for every friend who places their first order with your link
        </div>
        {referral && (
          <div style={{ display:'flex', gap:8 }}>
            <div style={{ flex:1, background:'rgba(255,255,255,0.08)', borderRadius:10, padding:'10px 12px', fontFamily:'monospace', fontSize:13, color:'white', letterSpacing:1 }}>
              isla-drop.vercel.app?ref={referral.referral_code}
            </div>
            <button onClick={copyReferral}
              style={{ padding:'10px 14px', background: copying?'rgba(90,107,58,0.4)':'rgba(43,122,139,0.4)', border:'0.5px solid rgba(43,122,139,0.4)', borderRadius:10, fontSize:12, color:'white', cursor:'pointer', fontFamily:'DM Sans,sans-serif', whiteSpace:'nowrap' }}>
              {copying ? '✓' : 'Copy'}
            </button>
          </div>
        )}
      </div>

      {/* History */}
      {history.length > 0 && (
        <>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:10 }}>{t.pointsHistory||'Points history'}</div>
          {history.map((t, i) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 0', borderBottom:'0.5px solid rgba(255,255,255,0.07)' }}>
              <div>
                <div style={{ fontSize:13, color:'white' }}>{TYPE_LABELS[t.type] || t.type}</div>
                {t.description && <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginTop:1 }}>{t.description}</div>}
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', marginTop:1 }}>{new Date(t.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'short' })}</div>
              </div>
              <div style={{ fontSize:14, fontWeight:500, color: TYPE_COLORS[t.type] || 'white' }}>
                {t.type === 'redeemed' || t.type === 'expired' ? '-' : '+'}{t.points}
              </div>
            </div>
          ))}
        </>
      )}
      {!loading && history.length === 0 && (
        <div style={{ textAlign:'center', padding:'20px 0', color:'rgba(255,255,255,0.4)', fontSize:13 }}>
          Place your first order to start earning points!
        </div>
      )}
    </div>
  )
}
