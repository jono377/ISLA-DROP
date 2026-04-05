import { useState } from 'react'
import { useAuthStore } from '../../lib/store'
import toast from 'react-hot-toast'

function Stars({ value, onChange, size = 28 }) {
  const [hover, setHover] = useState(0)
  return (
    <div style={{ display:'flex', gap:6 }}>
      {[1,2,3,4,5].map(n => (
        <span key={n}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          style={{ fontSize:size, cursor:'pointer', filter: (hover||value) >= n ? 'none' : 'grayscale(1) opacity(0.3)', transition:'filter 0.1s' }}>
          ⭐
        </span>
      ))}
    </div>
  )
}

const TIPS = [0, 1, 2, 3, 5]

export default function OrderRating({ order, onDone }) {
  const { user } = useAuthStore()
  const [orderRating,  setOrderRating]  = useState(0)
  const [driverRating, setDriverRating] = useState(0)
  const [tip,          setTip]          = useState(0)
  const [comment,      setComment]      = useState('')
  const [saving,       setSaving]       = useState(false)

  const submit = async () => {
    if (!orderRating) { toast.error('Please rate your order'); return }
    setSaving(true)
    try {
      const { supabase } = await import('../../lib/supabase')
      await supabase.from('order_ratings').insert({
        order_id: order.id,
        customer_id: user?.id,
        driver_id: order.driver_id,
        order_rating: orderRating,
        driver_rating: driverRating || null,
        tip,
        comment: comment.trim() || null,
      })
      if (tip > 0 && order.driver_id) {
        await supabase.from('driver_earnings').insert({
          driver_id: order.driver_id,
          order_id: order.id,
          base_pay: 3.50,
          tip,
          total: 3.50 + tip,
          status: 'pending',
        })
      }
      toast.success('Thank you for your feedback! 🌴')
      onDone()
    } catch (err) {
      if (err.message?.includes('unique')) { toast.success('Already rated — thanks!'); onDone() }
      else toast.error('Could not save rating')
    }
    setSaving(false)
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'linear-gradient(170deg,#0D3545,#1A5060)', borderRadius:20, padding:28, width:'100%', maxWidth:380 }}>
        <div style={{ textAlign:'center', marginBottom:24 }}>
          <div style={{ fontSize:48, marginBottom:10 }}>🌴</div>
          <div style={{ fontFamily:'DM Serif Display,serif', fontSize:24, color:'white', marginBottom:6 }}>How was your order?</div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,0.5)' }}>Order #{order.order_number || order.id?.slice(0,8).toUpperCase()}</div>
        </div>

        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:13, color:'rgba(255,255,255,0.7)', marginBottom:10, fontFamily:'DM Sans,sans-serif' }}>Rate your order</div>
          <Stars value={orderRating} onChange={setOrderRating} />
        </div>

        {order.driver_id && (
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:13, color:'rgba(255,255,255,0.7)', marginBottom:10, fontFamily:'DM Sans,sans-serif' }}>Rate your driver</div>
            <Stars value={driverRating} onChange={setDriverRating} />
          </div>
        )}

        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:13, color:'rgba(255,255,255,0.7)', marginBottom:10, fontFamily:'DM Sans,sans-serif' }}>Add a tip for your driver</div>
          <div style={{ display:'flex', gap:8 }}>
            {TIPS.map(t => (
              <button key={t} onClick={() => setTip(t)}
                style={{ flex:1, padding:'10px 6px', background: tip===t?'rgba(196,104,58,0.4)':'rgba(255,255,255,0.08)', border:'0.5px solid ' + (tip===t?'rgba(196,104,58,0.6)':'rgba(255,255,255,0.15)'), borderRadius:10, fontSize:13, color:'white', cursor:'pointer', fontFamily:'DM Sans,sans-serif', fontWeight: tip===t?500:400 }}>
                {t === 0 ? 'None' : '€' + t}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom:20 }}>
          <textarea value={comment} onChange={e => setComment(e.target.value)} rows={2}
            placeholder="Any comments? (optional)"
            style={{ width:'100%', padding:'11px 14px', background:'rgba(255,255,255,0.08)', border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:12, fontFamily:'DM Sans,sans-serif', fontSize:13, color:'white', outline:'none', resize:'none', boxSizing:'border-box', lineHeight:1.5 }} />
        </div>

        <button onClick={submit} disabled={saving}
          style={{ width:'100%', padding:'14px', background: saving?'rgba(196,104,58,0.4)':'#C4683A', color:'white', border:'none', borderRadius:12, fontFamily:'DM Sans,sans-serif', fontSize:15, fontWeight:500, cursor:'pointer', marginBottom:10 }}>
          {saving ? 'Saving...' : 'Submit Rating'}
        </button>
        <button onClick={onDone}
          style={{ width:'100%', padding:'11px', background:'none', border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:12, color:'rgba(255,255,255,0.5)', fontSize:13, cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
          Skip
        </button>
      </div>
    </div>
  )
}
