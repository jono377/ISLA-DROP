import { useState, useEffect, useCallback, useRef } from 'react'
import { useCartStore, useAuthStore } from '../../lib/store'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { PRODUCTS } from '../../lib/products'

const C = {
  bg:'#0D3545', accent:'#C4683A', accentDim:'rgba(196,104,58,0.18)',
  green:'#7EE8A2', greenDim:'rgba(126,232,162,0.12)',
  surface:'rgba(255,255,255,0.07)', surfaceB:'rgba(255,255,255,0.12)',
  border:'rgba(255,255,255,0.1)', muted:'rgba(255,255,255,0.45)',
  white:'white', gold:'#C8A84B',
}
const F = { serif:'DM Serif Display,serif', sans:'DM Sans,sans-serif' }

function Sheet({ onClose, children, maxH='90vh' }) {
  return (
    <div style={{ position:'fixed', inset:0, zIndex:500, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'flex-end' }} onClick={onClose}>
      <div style={{ width:'100%', maxWidth:480, margin:'0 auto', background:C.bg, borderRadius:'24px 24px 0 0', maxHeight:maxH, overflowY:'auto' }} onClick={e=>e.stopPropagation()}>
        <div style={{ width:36, height:4, background:'rgba(255,255,255,0.2)', borderRadius:2, margin:'20px auto 0' }}/>
        {children}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 9. IN-APP REVIEW RESPONSES — ops can reply
// (Customer-facing: shows ops reply under reviews)
// ═══════════════════════════════════════════════════════════════
export function ReviewWithReply({ review }) {
  return (
    <div style={{ padding:'14px 0', borderBottom:'0.5px solid rgba(255,255,255,0.08)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <div style={{ width:28, height:28, borderRadius:'50%', background:C.accentDim, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:C.accent }}>
            {(review.profiles?.full_name||'A')[0].toUpperCase()}
          </div>
          <span style={{ fontSize:13, fontWeight:600, color:C.white }}>{review.profiles?.full_name||'Anonymous'}</span>
        </div>
        <div style={{ display:'flex', gap:6, alignItems:'center' }}>
          <span style={{ fontSize:12, color:C.gold }}>{'★'.repeat(review.rating)+'☆'.repeat(5-review.rating)}</span>
          <span style={{ fontSize:11, color:C.muted }}>{new Date(review.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</span>
        </div>
      </div>
      {review.comment && <div style={{ fontSize:13, color:'rgba(255,255,255,0.75)', lineHeight:1.6, fontStyle:'italic' }}>"{review.comment}"</div>}
      {review.ops_reply && (
        <div style={{ marginTop:10, marginLeft:16, padding:'10px 14px', background:'rgba(43,122,139,0.15)', border:'0.5px solid rgba(43,122,139,0.3)', borderRadius:10 }}>
          <div style={{ fontSize:10, fontWeight:700, color:'#7EE8C8', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:4 }}>🌴 Isla Drop replied</div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.7)', lineHeight:1.5 }}>{review.ops_reply}</div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 10. REAL-TIME STOCK DEPLETION — shows "X sold in last hour"
// ═══════════════════════════════════════════════════════════════
export function LiveStockBadge({ product }) {
  const [recentSales, setRecentSales] = useState(null)

  useEffect(() => {
    const oneHourAgo = new Date(Date.now()-3600000).toISOString()
    supabase.from('order_items').select('quantity')
      .eq('product_id', product.id)
      .gte('created_at', oneHourAgo)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const qty = data.reduce((s,i)=>s+(i.quantity||1),0)
          setRecentSales(qty)
        }
      }).catch(()=>{})
  }, [product.id])

  if (!recentSales) return null

  return (
    <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:10, color:'rgba(255,255,255,0.7)', background:'rgba(0,0,0,0.4)', padding:'2px 8px', borderRadius:20, marginTop:4 }}>
      <span style={{ width:6, height:6, borderRadius:'50%', background:'#7EE8A2', display:'inline-block', animation:'pulse 1.5s infinite' }}/>
      {recentSales} sold in the last hour
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 11. ORDER CONFIRMATION + RECEIPT DOWNLOAD
// ═══════════════════════════════════════════════════════════════
export function OrderReceipt({ order, onClose }) {
  const [downloading, setDownloading] = useState(false)

  const downloadPDF = async () => {
    setDownloading(true)
    const items = order.order_items || order.items || []
    const html = '<!DOCTYPE html><html><head><meta charset="utf-8"><style>'
      + 'body{font-family:Georgia,serif;max-width:600px;margin:40px auto;color:#2A2318;}'
      + 'h1{font-size:28px;color:#0D3545;margin-bottom:4px}h2{font-size:16px;font-weight:400;color:#7A6E60;margin:0 0 24px}'
      + '.row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f0ebe2}'
      + '.total{font-size:18px;font-weight:700;margin-top:12px}.accent{color:#C4683A}'
      + 'footer{margin-top:40px;font-size:11px;color:#aaa;border-top:1px solid #f0ebe2;padding-top:16px}'
      + '</style></head><body>'
      + '<h1>Isla Drop 🌴</h1><h2>Delivery Receipt</h2>'
      + '<div class="row"><span>Order #</span><span><strong>'+(order.order_number||order.id?.slice(0,8))+'</strong></span></div>'
      + '<div class="row"><span>Date</span><span>'+new Date(order.created_at).toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'})+'</span></div>'
      + '<div class="row"><span>Delivery address</span><span>'+order.delivery_address+'</span></div>'
      + '<br/>'
      + items.map(i=>'<div class="row"><span>'+(i.products?.emoji||'')+(i.products?.name||i.product_name||'')+(i.quantity>1?' × '+i.quantity:'')+'</span><span class="accent">€'+((i.unit_price||i.product_price||0)*i.quantity).toFixed(2)+'</span></div>').join('')
      + '<div class="row total"><span>Delivery</span><span>€3.50</span></div>'
      + (order.tip_amount>0?'<div class="row"><span>Driver tip</span><span>€'+order.tip_amount.toFixed(2)+'</span></div>':'')
      + '<div class="row total"><span><strong>Total paid</strong></span><span class="accent"><strong>€'+order.total?.toFixed(2)+'</strong></span></div>'
      + '<footer>Thank you for using Isla Drop · isladrop.net · support@isladrop.net · +34 971 000 000<br/>Isla Drop SL · Ibiza, Balearic Islands, Spain</footer>'
      + '</body></html>'

    const blob = new Blob([html], { type:'text/html' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'isla-drop-receipt-'+(order.order_number||order.id?.slice(0,8))+'.html'
    a.click()
    URL.revokeObjectURL(a.href)
    setDownloading(false)
    toast.success('Receipt downloaded!')
  }

  return (
    <Sheet onClose={onClose}>
      <div style={{ padding:'20px 20px 48px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div style={{ fontFamily:F.serif, fontSize:22, color:C.white }}>Order receipt</div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:C.muted, fontSize:22, cursor:'pointer' }}>×</button>
        </div>

        <div style={{ background:C.surface, borderRadius:14, padding:16, marginBottom:20, border:'0.5px solid '+C.border }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
            <span style={{ fontSize:13, color:C.muted }}>Order</span>
            <span style={{ fontSize:13, fontWeight:700, color:C.white }}>#{order.order_number||order.id?.slice(0,8)}</span>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
            <span style={{ fontSize:13, color:C.muted }}>Date</span>
            <span style={{ fontSize:13, color:C.white }}>{new Date(order.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</span>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
            <span style={{ fontSize:13, color:C.muted }}>Address</span>
            <span style={{ fontSize:12, color:C.white, maxWidth:'60%', textAlign:'right' }}>{order.delivery_address}</span>
          </div>
          {(order.order_items||order.items||[]).map((item,i)=>(
            <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderTop:'0.5px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize:13, color:'rgba(255,255,255,0.8)' }}>{item.products?.emoji||''} {item.products?.name||item.product_name||''} {item.quantity>1?'× '+item.quantity:''}</span>
              <span style={{ fontSize:13, color:C.accent }}>€{((item.unit_price||item.product_price||0)*item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div style={{ display:'flex', justifyContent:'space-between', padding:'12px 0 4px', borderTop:'0.5px solid rgba(255,255,255,0.15)', marginTop:8 }}>
            <span style={{ fontSize:14, color:C.muted }}>Delivery</span>
            <span style={{ fontSize:14, color:C.muted }}>€3.50</span>
          </div>
          {order.tip_amount > 0 && (
            <div style={{ display:'flex', justifyContent:'space-between', padding:'4px 0' }}>
              <span style={{ fontSize:14, color:C.muted }}>Driver tip</span>
              <span style={{ fontSize:14, color:C.muted }}>€{order.tip_amount?.toFixed(2)}</span>
            </div>
          )}
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:8 }}>
            <span style={{ fontSize:16, fontWeight:700, color:C.white }}>Total paid</span>
            <span style={{ fontSize:18, fontWeight:800, color:C.accent }}>€{order.total?.toFixed(2)}</span>
          </div>
        </div>

        <button onClick={downloadPDF} disabled={downloading}
          style={{ width:'100%', padding:'15px', background:C.accent, border:'none', borderRadius:14, color:'white', fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:F.sans, display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
          <span>⬇</span>{downloading?'Generating...':'Download receipt'}
        </button>
        <button onClick={()=>{ navigator.share?.({ title:'Isla Drop Receipt', text:'Order #'+(order.order_number||'') }); }}
          style={{ width:'100%', padding:'12px', marginTop:8, background:'transparent', border:'0.5px solid rgba(255,255,255,0.2)', borderRadius:12, color:C.muted, fontSize:13, cursor:'pointer', fontFamily:F.sans }}>
          📤 Share receipt
        </button>
      </div>
    </Sheet>
  )
}

// ═══════════════════════════════════════════════════════════════
// 12. REPEAT ORDER SCHEDULING
// ═══════════════════════════════════════════════════════════════
export function RepeatOrderSetup({ order, onClose }) {
  const { user } = useAuthStore()
  const [frequency, setFrequency] = useState('weekly')
  const [day, setDay] = useState('Friday')
  const [time, setTime] = useState('20:00')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
  const FREQS = [
    { id:'daily', label:'Every day' },
    { id:'weekly', label:'Every week' },
    { id:'biweekly', label:'Every 2 weeks' },
    { id:'monthly', label:'Every month' },
  ]

  const save = async () => {
    setSaving(true)
    await supabase.from('repeat_orders').upsert({
      user_id: user?.id, source_order_id: order.id,
      frequency, day_of_week: day, time_of_day: time,
      active: true, next_run: new Date().toISOString(),
      order_items: order.order_items || [],
      delivery_address: order.delivery_address,
    }, { onConflict:'source_order_id' })
    setSaved(true); setSaving(false)
    toast.success('Repeat order set up! 🔄')
  }

  if (saved) return (
    <Sheet onClose={onClose}>
      <div style={{ padding:'40px 24px 60px', textAlign:'center' }}>
        <div style={{ fontSize:56, marginBottom:16 }}>🔄</div>
        <div style={{ fontFamily:F.serif, fontSize:24, color:C.white, marginBottom:8 }}>Repeat order set!</div>
        <div style={{ fontSize:14, color:C.muted, marginBottom:24 }}>
          We'll automatically re-order this for you every {frequency === 'daily' ? 'day' : frequency === 'weekly' ? 'week on '+day : frequency === 'biweekly' ? '2 weeks' : 'month'} at {time}
        </div>
        <button onClick={onClose} style={{ padding:'13px 32px', background:C.accent, border:'none', borderRadius:12, color:'white', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:F.sans }}>Done</button>
      </div>
    </Sheet>
  )

  return (
    <Sheet onClose={onClose}>
      <div style={{ padding:'20px 20px 48px' }}>
        <div style={{ fontFamily:F.serif, fontSize:24, color:C.white, marginBottom:6 }}>🔄 Repeat this order</div>
        <div style={{ fontSize:13, color:C.muted, marginBottom:24 }}>Automatically re-order on a schedule</div>

        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:11, color:C.muted, marginBottom:8, textTransform:'uppercase', letterSpacing:'0.5px' }}>Frequency</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {FREQS.map(f=>(
              <button key={f.id} onClick={()=>setFrequency(f.id)}
                style={{ padding:'11px', borderRadius:12, border:'0.5px solid '+(frequency===f.id?C.accent:C.border), background:frequency===f.id?C.accentDim:'transparent', color:frequency===f.id?C.accent:C.muted, fontSize:13, cursor:'pointer', fontFamily:F.sans, fontWeight:frequency===f.id?700:400 }}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {frequency === 'weekly' && (
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:11, color:C.muted, marginBottom:8, textTransform:'uppercase', letterSpacing:'0.5px' }}>Day</div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {DAYS.map(d=>(
                <button key={d} onClick={()=>setDay(d)}
                  style={{ padding:'7px 12px', borderRadius:20, border:'0.5px solid '+(day===d?C.accent:C.border), background:day===d?C.accentDim:'transparent', color:day===d?C.accent:C.muted, fontSize:12, cursor:'pointer', fontFamily:F.sans }}>
                  {d.slice(0,3)}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:11, color:C.muted, marginBottom:8, textTransform:'uppercase', letterSpacing:'0.5px' }}>Time</div>
          <input type="time" value={time} onChange={e=>setTime(e.target.value)}
            style={{ padding:'11px 16px', background:C.surface, border:'0.5px solid '+C.border, borderRadius:12, color:C.white, fontSize:16, fontFamily:'monospace', outline:'none' }} />
        </div>

        <div style={{ background:C.surface, borderRadius:12, padding:14, marginBottom:20, border:'0.5px solid '+C.border }}>
          <div style={{ fontSize:13, fontWeight:600, color:C.white, marginBottom:4 }}>What will be ordered</div>
          {(order.order_items||[]).slice(0,4).map((item,i)=>(
            <div key={i} style={{ fontSize:12, color:C.muted, marginBottom:2 }}>
              {item.products?.emoji} {item.products?.name} × {item.quantity}
            </div>
          ))}
          {(order.order_items||[]).length > 4 && <div style={{ fontSize:11, color:C.muted }}>+ {(order.order_items||[]).length-4} more items</div>}
        </div>

        <button onClick={save} disabled={saving}
          style={{ width:'100%', padding:'15px', background:C.accent, border:'none', borderRadius:14, color:'white', fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:F.sans }}>
          {saving?'Setting up...':'Set up repeat order'}
        </button>
      </div>
    </Sheet>
  )
}

// ═══════════════════════════════════════════════════════════════
// 13. DARK MODE TOGGLE — customer app
// ═══════════════════════════════════════════════════════════════
export function useDarkMode() {
  const [dark, setDark] = useState(() => localStorage.getItem('isla_dark') === '1')

  const toggle = useCallback(() => {
    setDark(d => {
      const next = !d
      localStorage.setItem('isla_dark', next?'1':'0')
      document.documentElement.style.setProperty('--bg-primary', next?'#050E14':'')
      document.documentElement.style.setProperty('--card-bg', next?'rgba(255,255,255,0.05)':'')
      return next
    })
  }, [])

  useEffect(() => {
    if (dark) {
      document.documentElement.style.setProperty('--bg-primary', '#050E14')
    }
  }, [dark])

  return { dark, toggle }
}

export function DarkModeToggle({ dark, onToggle }) {
  return (
    <button onClick={onToggle}
      style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'14px 16px', background:'rgba(255,255,255,0.06)', border:'none', borderRadius:12, marginBottom:8, cursor:'pointer', textAlign:'left', fontFamily:F.sans }}>
      <span style={{ fontSize:18 }}>{dark?'☀️':'🌙'}</span>
      <span style={{ fontSize:14, color:'rgba(255,255,255,0.82)', flex:1 }}>{dark?'Light mode':'Dark mode'}</span>
      <div style={{ width:44, height:24, borderRadius:12, background:dark?'#C4683A':'rgba(255,255,255,0.2)', position:'relative', transition:'background 0.2s' }}>
        <div style={{ width:20, height:20, borderRadius:'50%', background:'white', position:'absolute', top:2, left:dark?22:2, transition:'left 0.2s' }}/>
      </div>
    </button>
  )
}

// ═══════════════════════════════════════════════════════════════
// 14. TRANSLATION COMPLETIONS — Russian and Chinese
// ═══════════════════════════════════════════════════════════════
export const EXTRA_TRANSLATIONS = {
  ru: {
    tagline: 'Доставка 24/7 · Ибица',
    orderNow: 'Заказать',
    searchPlaceholder: 'Поиск напитков, снеков…',
    bestSellers: 'Хиты продаж',
    newIn: 'Новинки',
    orderAgain: 'Заказать снова',
    categories: 'Категории',
    addToCart: 'Добавить',
    viewCart: 'Корзина',
    checkout: 'Оформить',
    total: 'Итого',
    delivery: 'Доставка',
    items: 'товаров',
    item: 'товар',
    free: 'Бесплатно',
    ageWarning: 'Для алкоголя нужно 18+ · покажите ID',
  },
  zh: {
    tagline: '24/7送货 · 伊维萨',
    orderNow: '立即订购',
    searchPlaceholder: '搜索饮品、零食…',
    bestSellers: '畅销产品',
    newIn: '新品上架',
    orderAgain: '再次订购',
    categories: '分类',
    addToCart: '加入购物车',
    viewCart: '查看购物车',
    checkout: '结账',
    total: '总计',
    delivery: '配送费',
    items: '件',
    item: '件',
    free: '免费',
    ageWarning: '酒精类需18岁以上 · 请出示身份证',
  }
}

// ═══════════════════════════════════════════════════════════════
// 15. CASH ON DELIVERY OPTION
// ═══════════════════════════════════════════════════════════════
export function PaymentMethodSelector({ total, onCard, onCash }) {
  const [selected, setSelected] = useState('card')

  const methods = [
    {
      id:'card', emoji:'💳',
      label:'Pay by card',
      desc:'Visa, Mastercard, Apple Pay, Google Pay',
      action: onCard
    },
    {
      id:'cash', emoji:'💵',
      label:'Pay cash on delivery',
      desc:'Have exact change ready for the driver',
      action: onCash
    },
  ]

  return (
    <div>
      <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:16 }}>
        {methods.map(m=>(
          <button key={m.id} onClick={()=>setSelected(m.id)}
            style={{ display:'flex', alignItems:'center', gap:14, padding:'16px', background:selected===m.id?C.accentDim:C.surface, border:'0.5px solid '+(selected===m.id?C.accent:C.border), borderRadius:14, cursor:'pointer', textAlign:'left' }}>
            <span style={{ fontSize:28, flexShrink:0 }}>{m.emoji}</span>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:selected===m.id?C.accent:C.white }}>{m.label}</div>
              <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>{m.desc}</div>
            </div>
            {selected===m.id && <div style={{ marginLeft:'auto', width:20, height:20, borderRadius:'50%', background:C.accent, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
            </div>}
          </button>
        ))}
      </div>

      <button onClick={()=>selected==='cash'?onCash?.():onCard?.()}
        style={{ width:'100%', padding:'16px', background:C.accent, border:'none', borderRadius:14, color:'white', fontSize:16, fontWeight:700, cursor:'pointer', fontFamily:F.sans }}>
        {selected==='cash' ? 'Place order — pay €'+total.toFixed(2)+' cash' : 'Continue to card payment →'}
      </button>

      {selected==='cash' && (
        <div style={{ marginTop:10, padding:'10px 14px', background:'rgba(184,134,11,0.15)', border:'0.5px solid rgba(184,134,11,0.3)', borderRadius:10, fontSize:12, color:'#C8A84B' }}>
          ⚠️ Please have exact change ready. Our drivers may not carry change. Tip not included.
        </div>
      )}
    </div>
  )
}
