import { useState, useEffect, useCallback, useRef } from 'react'
import { useCartStore, useAuthStore } from '../../lib/store'
import { supabase } from '../../lib/supabase'
import { PRODUCTS } from '../../lib/products'
import toast from 'react-hot-toast'

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
// 1. GROUP ORDERING — wired version
// ═══════════════════════════════════════════════════════════════
export function GroupOrderSheet({ onClose }) {
  const { user, profile } = useAuthStore()
  const { addItem, items: cartItems } = useCartStore()
  const [mode, setMode] = useState(null)
  const [groupOrder, setGroupOrder] = useState(null)
  const [groupItems, setGroupItems] = useState([])
  const [joinCode, setJoinCode] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const shareCode = groupOrder?.share_code

  const createGroup = async () => {
    setLoading(true)
    const code = Math.random().toString(36).slice(2,8).toUpperCase()
    const { data, error } = await supabase.from('group_orders').insert({
      share_code: code, host_id: user?.id,
      name: (profile?.full_name || 'Group') + "'s order",
      status: 'open',
    }).select().single()
    if (!error && data) { setGroupOrder(data); setMode('host') }
    else toast.error('Could not create group order')
    setLoading(false)
  }

  const joinGroup = async () => {
    if (!joinCode.trim()) return
    setLoading(true)
    const { data } = await supabase.from('group_orders').select('*').eq('share_code', joinCode.toUpperCase().trim()).eq('status','open').single()
    if (data) { setGroupOrder(data); setMode('guest') }
    else toast.error('Group order not found or already closed')
    setLoading(false)
  }

  // Real-time subscription to group items
  useEffect(() => {
    if (!groupOrder?.id) return
    const loadItems = () => supabase.from('group_order_items')
      .select('*, profiles(full_name)').eq('group_order_id', groupOrder.id)
      .then(({ data }) => { if (data) setGroupItems(data) })
    loadItems()
    const ch = supabase.channel('group_'+groupOrder.id)
      .on('postgres_changes',{event:'*',schema:'public',table:'group_order_items',filter:'group_order_id=eq.'+groupOrder.id}, loadItems)
      .subscribe()
    return () => ch.unsubscribe()
  }, [groupOrder?.id])

  const addToGroup = async (product) => {
    if (!groupOrder?.id) return
    const existing = groupItems.find(i=>i.product_id===product.id && i.added_by===user?.id)
    if (existing) {
      await supabase.from('group_order_items').update({ quantity: existing.quantity+1 }).eq('id', existing.id)
    } else {
      await supabase.from('group_order_items').insert({
        group_order_id: groupOrder.id, product_id: product.id,
        product_name: product.name, product_emoji: product.emoji,
        product_price: product.price, quantity: 1, added_by: user?.id
      })
    }
    navigator.vibrate?.(20)
    toast.success(product.emoji + ' Added to group!', { duration:800 })
  }

  const checkoutGroup = async () => {
    // Merge group items into personal cart
    groupItems.forEach(gi => {
      const product = PRODUCTS.find(p=>p.id===gi.product_id)
      if (product) { for (let i=0;i<gi.quantity;i++) addItem(product) }
    })
    await supabase.from('group_orders').update({ status:'checkout' }).eq('id', groupOrder.id)
    toast.success('Group items added to your basket! 🛒')
    onClose()
  }

  const copyCode = () => {
    const msg = 'Join my Isla Drop group order! Code: ' + shareCode + ' — or open: ' + window.location.origin + '?group=' + shareCode
    navigator.clipboard.writeText(msg)
    setCopied(true); setTimeout(()=>setCopied(false), 2000)
    toast.success('Link copied!')
  }

  const searchResults = search.length > 1 ? PRODUCTS.filter(p=>p.name.toLowerCase().includes(search.toLowerCase())).slice(0,20) : []
  const groupTotal = groupItems.reduce((s,i)=>s+(i.product_price*i.quantity),0)
  const byPerson = {}
  groupItems.forEach(i=>{ const n=i.profiles?.full_name||'You'; if(!byPerson[n]) byPerson[n]=[]; byPerson[n].push(i) })

  if (!mode) return (
    <Sheet onClose={onClose}>
      <div style={{ padding:'20px 20px 48px' }}>
        <div style={{ fontFamily:F.serif, fontSize:24, color:C.white, marginBottom:6 }}>🛒 Group order</div>
        <div style={{ fontSize:13, color:C.muted, marginBottom:28 }}>Everyone adds what they want, one person pays</div>
        <button onClick={createGroup} disabled={loading||!user}
          style={{ width:'100%', padding:'16px', background:C.accent, border:'none', borderRadius:14, color:'white', fontSize:15, fontWeight:700, cursor:user?'pointer':'default', fontFamily:F.sans, marginBottom:12 }}>
          {loading?'Creating...':'🎉 Create group order'}
        </button>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
          <div style={{ flex:1, height:1, background:C.border }}/><span style={{ fontSize:12, color:C.muted }}>or</span><div style={{ flex:1, height:1, background:C.border }}/>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <input value={joinCode} onChange={e=>setJoinCode(e.target.value.toUpperCase())}
            placeholder="Enter group code..." style={{ flex:1, padding:'13px 16px', background:C.surface, border:'0.5px solid '+C.border, borderRadius:12, color:C.white, fontSize:14, fontFamily:F.sans, outline:'none', letterSpacing:3 }} />
          <button onClick={joinGroup} disabled={loading||!joinCode}
            style={{ padding:'13px 18px', background:C.green, border:'none', borderRadius:12, color:'#0A1E14', fontSize:14, fontWeight:700, cursor:'pointer' }}>
            Join
          </button>
        </div>
        {!user && <div style={{ fontSize:12, color:'#F09595', marginTop:12, textAlign:'center' }}>Sign in to create or join group orders</div>}
      </div>
    </Sheet>
  )

  return (
    <Sheet onClose={onClose} maxH="95vh">
      <div style={{ padding:'20px 20px 0' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <div>
            <div style={{ fontFamily:F.serif, fontSize:20, color:C.white }}>{groupOrder?.name}</div>
            <div style={{ fontSize:12, color:C.muted }}>Code: <strong style={{ color:C.accent, letterSpacing:2 }}>{shareCode}</strong></div>
          </div>
          {mode==='host' && (
            <button onClick={copyCode} style={{ padding:'8px 14px', background:copied?C.greenDim:C.accentDim, border:'0.5px solid '+(copied?C.green:C.accent), borderRadius:10, color:copied?C.green:C.accent, fontSize:12, fontWeight:700, cursor:'pointer' }}>
              {copied?'✓ Copied':'📤 Share'}
            </button>
          )}
        </div>
      </div>

      {/* Search to add */}
      <div style={{ padding:'10px 20px' }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search to add items..."
          style={{ width:'100%', padding:'11px 16px', background:C.surface, border:'0.5px solid '+C.border, borderRadius:12, color:C.white, fontSize:13, fontFamily:F.sans, outline:'none', boxSizing:'border-box' }} />
      </div>

      {search.length > 1 ? (
        <div style={{ padding:'0 20px', maxHeight:240, overflowY:'auto' }}>
          {searchResults.map(p => (
            <div key={p.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'0.5px solid '+C.border }}>
              <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                <span style={{ fontSize:20 }}>{p.emoji}</span>
                <div>
                  <div style={{ fontSize:13, color:C.white }}>{p.name}</div>
                  <div style={{ fontSize:11, color:C.accent }}>€{p.price.toFixed(2)}</div>
                </div>
              </div>
              <button onClick={()=>addToGroup(p)} style={{ width:28, height:28, borderRadius:'50%', background:C.accent, border:'none', color:'white', fontSize:16, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding:'0 20px', maxHeight:320, overflowY:'auto' }}>
          {Object.entries(byPerson).map(([name, items]) => (
            <div key={name} style={{ marginBottom:16 }}>
              <div style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:'uppercase', marginBottom:8 }}>{name}</div>
              {items.map(item => (
                <div key={item.id} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'0.5px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize:13, color:C.white }}>{item.product_emoji} {item.product_name} × {item.quantity}</span>
                  <span style={{ fontSize:13, color:C.accent }}>€{(item.product_price*item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          ))}
          {groupItems.length === 0 && <div style={{ textAlign:'center', padding:'24px 0', color:C.muted, fontSize:13 }}>Search above to add items 👆</div>}
        </div>
      )}

      <div style={{ padding:'14px 20px 40px', borderTop:'0.5px solid '+C.border, marginTop:8 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14 }}>
          <span style={{ fontSize:14, color:C.muted }}>Group total ({groupItems.reduce((s,i)=>s+i.quantity,0)} items)</span>
          <span style={{ fontSize:16, fontWeight:700, color:C.accent }}>€{groupTotal.toFixed(2)}</span>
        </div>
        {mode==='host' && (
          <button onClick={checkoutGroup} disabled={groupItems.length===0}
            style={{ width:'100%', padding:'15px', background:groupItems.length?C.accent:'rgba(255,255,255,0.1)', border:'none', borderRadius:14, color:'white', fontSize:15, fontWeight:700, cursor:groupItems.length?'pointer':'default', fontFamily:F.sans }}>
            Checkout for everyone →
          </button>
        )}
        {mode==='guest' && <div style={{ textAlign:'center', fontSize:13, color:C.muted }}>Add your items above. The host will checkout for everyone.</div>}
      </div>
    </Sheet>
  )
}

// ═══════════════════════════════════════════════════════════════
// 2. TIERED LOYALTY PROGRAMME — full wired view
// ═══════════════════════════════════════════════════════════════
export function LoyaltyTierView({ onClose }) {
  const { user } = useAuthStore()
  const [points, setPoints] = useState(0)
  const [stamps, setStamps] = useState(0)
  const [totalOrders, setTotalOrders] = useState(0)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  const TIERS = [
    { name:'Island Explorer', min:0,    max:499,  emoji:'🌴', color:'#7A6E60', perks:['1 point per €1 spent','Standard delivery','Priority support'] },
    { name:'Ibiza Regular',   min:500,  max:1499, emoji:'🌊', color:'#2B7A8B', perks:['1.5× points per €1','5% monthly discount','Free delivery on €40+'] },
    { name:'White Isle VIP',  min:1500, max:4999, emoji:'⭐', color:C.accent,   perks:['2× points per €1','Free delivery on €25+','Monthly VIP bonus','Concierge priority'] },
    { name:'Isla Elite',      min:5000, max:99999,emoji:'👑', color:C.gold,    perks:['3× points per €1','Always free delivery','Monthly gift delivery','Dedicated concierge'] },
  ]

  const getTier = (pts) => TIERS.find(t=>pts>=t.min&&pts<=t.max) || TIERS[0]
  const getNext = (pts) => TIERS.find(t=>t.min>pts)
  const tier = getTier(points)
  const next = getNext(points)
  const pct = next ? Math.round(((points-tier.min)/(next.min-tier.min))*100) : 100

  useEffect(() => {
    if (!user) { setLoading(false); return }
    supabase.from('loyalty_cards').select('*').eq('user_id', user.id).single()
      .then(({ data }) => {
        if (data) { setPoints(data.points||0); setStamps(data.stamps||0); setTotalOrders(data.total_orders||0) }
        setLoading(false)
      }).catch(()=>setLoading(false))
  }, [user])

  if (!user) return (
    <Sheet onClose={onClose}>
      <div style={{ padding:'40px 24px 60px', textAlign:'center' }}>
        <div style={{ fontSize:48, marginBottom:16 }}>🌴</div>
        <div style={{ fontFamily:F.serif, fontSize:22, color:C.white, marginBottom:8 }}>Sign in to earn rewards</div>
        <div style={{ fontSize:13, color:C.muted }}>Join Isla Drop to earn points, stamps and unlock VIP perks</div>
        <button onClick={onClose} style={{ marginTop:24, padding:'13px 32px', background:C.accent, border:'none', borderRadius:12, color:'white', fontSize:14, fontWeight:600, cursor:'pointer' }}>Sign in</button>
      </div>
    </Sheet>
  )

  return (
    <Sheet onClose={onClose}>
      <div style={{ padding:'20px 20px 48px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div style={{ fontFamily:F.serif, fontSize:24, color:C.white }}>Loyalty rewards</div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:C.muted, fontSize:22, cursor:'pointer' }}>×</button>
        </div>

        {/* Current tier card */}
        {loading ? <div style={{ height:140, background:C.surface, borderRadius:16, marginBottom:20 }}/> : (
          <div style={{ background:'linear-gradient(135deg,'+tier.color+','+tier.color+'aa)', borderRadius:20, padding:'22px 20px', marginBottom:20, position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:-30, right:-30, width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,0.08)' }}/>
            <div style={{ fontSize:32, marginBottom:4 }}>{tier.emoji}</div>
            <div style={{ fontFamily:F.serif, fontSize:24, color:'white', marginBottom:2 }}>{tier.name}</div>
            <div style={{ fontSize:28, fontWeight:900, color:'white' }}>{points.toLocaleString()} pts</div>
            {next && (
              <>
                <div style={{ height:6, background:'rgba(255,255,255,0.2)', borderRadius:99, marginTop:12, overflow:'hidden' }}>
                  <div style={{ height:'100%', background:'white', borderRadius:99, width:pct+'%', transition:'width 1s ease' }}/>
                </div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.75)', marginTop:6 }}>
                  {(next.min-points).toLocaleString()} pts to {next.emoji} {next.name}
                </div>
              </>
            )}
          </div>
        )}

        {/* Stats row */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:20 }}>
          {[['🛵',totalOrders,'Orders'],['🌴',stamps,'Stamps'],['⭐',Math.floor(points/100),'€ redeemable']].map(([icon,val,label])=>(
            <div key={label} style={{ background:C.surface, borderRadius:12, padding:'14px 10px', textAlign:'center', border:'0.5px solid '+C.border }}>
              <div style={{ fontSize:20, marginBottom:4 }}>{icon}</div>
              <div style={{ fontSize:22, fontWeight:700, color:C.white }}>{val}</div>
              <div style={{ fontSize:10, color:C.muted, textTransform:'uppercase', marginTop:2 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Tier progression */}
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:14, fontWeight:700, color:C.white, marginBottom:12 }}>All tiers</div>
          {TIERS.map(t => {
            const isActive = t.name === tier.name
            const isDone = t.min < tier.min
            return (
              <div key={t.name} style={{ display:'flex', gap:14, alignItems:'flex-start', padding:'12px 14px', background:isActive?t.color+'20':C.surface, border:'0.5px solid '+(isActive?t.color:C.border), borderRadius:12, marginBottom:8 }}>
                <span style={{ fontSize:24, flexShrink:0 }}>{t.emoji}</span>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:isActive?t.color:C.white }}>{t.name}</div>
                    <div style={{ fontSize:11, color:C.muted }}>{t.min.toLocaleString()}+ pts</div>
                  </div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                    {t.perks.map(p=>(
                      <span key={p} style={{ fontSize:10, padding:'2px 8px', background:'rgba(255,255,255,0.08)', borderRadius:99, color:isActive?t.color:C.muted }}>{p}</span>
                    ))}
                  </div>
                </div>
                {(isActive||isDone) && <span style={{ fontSize:16, flexShrink:0, color:t.color }}>{isDone?'✓':'●'}</span>}
              </div>
            )
          })}
        </div>

        {/* Stamp card */}
        <div style={{ background:'linear-gradient(135deg,#C4683A,#E8854A)', borderRadius:16, padding:'18px 20px' }}>
          <div style={{ fontFamily:F.serif, fontSize:18, color:'white', marginBottom:12 }}>Stamp card — every 10th free 🎁</div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {Array(10).fill(0).map((_,i)=>(
              <div key={i} style={{ width:36, height:36, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.5)', background:i<(stamps%10)?'white':'transparent', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>
                {i<(stamps%10)?'🌴':''}
              </div>
            ))}
          </div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.8)', marginTop:10 }}>
            {stamps%10}/{10} stamps · {10-(stamps%10)} to go!
          </div>
        </div>
      </div>
    </Sheet>
  )
}

// ═══════════════════════════════════════════════════════════════
// 3. WHAT3WORDS PICKER
// ═══════════════════════════════════════════════════════════════
export function W3WPicker({ onSelect, onClose }) {
  const [w3w, setW3w] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const lookup = async () => {
    if (!w3w.trim() || !w3w.includes('.')) { setError('Enter a valid what3words address (e.g. grape.lamp.stove)'); return }
    setLoading(true); setError('')
    const words = w3w.trim().replace('///', '')
    const apiKey = import.meta.env.VITE_W3W_API_KEY || ''
    try {
      const res = await fetch('https://api.what3words.com/v3/convert-to-coordinates?words='+encodeURIComponent(words)+'&key='+apiKey)
      const data = await res.json()
      if (data.error) { setError('Address not found. Check spelling.'); setLoading(false); return }
      setResult({ words:data.words, lat:data.coordinates.lat, lng:data.coordinates.lng, nearestPlace:data.nearestPlace })
    } catch { setError('Could not look up address. Check your W3W API key.') }
    setLoading(false)
  }

  return (
    <Sheet onClose={onClose}>
      <div style={{ padding:'20px 20px 48px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <div style={{ fontFamily:F.serif, fontSize:22, color:C.white }}>///what3words</div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:C.muted, fontSize:22, cursor:'pointer' }}>×</button>
        </div>
        <div style={{ fontSize:13, color:C.muted, marginBottom:20 }}>Perfect for villa driveways, beaches and boat docks that have no street address</div>

        <div style={{ background:'rgba(229,0,26,0.1)', border:'0.5px solid rgba(229,0,26,0.3)', borderRadius:12, padding:'12px 14px', marginBottom:16 }}>
          <div style={{ fontSize:12, fontWeight:700, color:'#E5001A', marginBottom:2 }}>///what3words</div>
          <div style={{ fontSize:11, color:C.muted }}>Every 3m × 3m square on Earth has a unique 3-word address. Find yours at what3words.com</div>
        </div>

        <div style={{ display:'flex', gap:8, marginBottom:14 }}>
          <input value={w3w} onChange={e=>setW3w(e.target.value.toLowerCase())}
            placeholder="grape.lamp.stove" onKeyDown={e=>e.key==='Enter'&&lookup()}
            style={{ flex:1, padding:'12px 16px', background:C.surface, border:'0.5px solid '+(error?'rgba(229,0,26,0.5)':C.border), borderRadius:12, color:C.white, fontSize:14, fontFamily:'monospace', outline:'none', letterSpacing:1 }} />
          <button onClick={lookup} disabled={loading}
            style={{ padding:'12px 18px', background:'#E5001A', border:'none', borderRadius:12, color:'white', fontSize:13, fontWeight:700, cursor:'pointer' }}>
            {loading?'...':'Find'}
          </button>
        </div>
        {error && <div style={{ fontSize:12, color:'#F09595', marginBottom:12 }}>{error}</div>}

        {result && (
          <div style={{ background:C.surface, border:'0.5px solid '+C.green, borderRadius:14, padding:16, marginBottom:16 }}>
            <div style={{ fontSize:14, fontWeight:700, color:'#E5001A', marginBottom:4, fontFamily:'monospace' }}>///{result.words}</div>
            <div style={{ fontSize:13, color:C.white, marginBottom:2 }}>{result.nearestPlace}</div>
            <div style={{ fontSize:11, color:C.muted, marginBottom:12 }}>Lat: {result.lat.toFixed(5)}, Lng: {result.lng.toFixed(5)}</div>
            <button onClick={()=>{onSelect(result); onClose()}}
              style={{ width:'100%', padding:'13px', background:C.accent, border:'none', borderRadius:12, color:'white', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:F.sans }}>
              ✓ Use this location
            </button>
          </div>
        )}

        <button onClick={()=>window.open('https://what3words.com/map','_blank')}
          style={{ width:'100%', padding:'12px', background:'transparent', border:'0.5px solid rgba(229,0,26,0.4)', borderRadius:12, color:'rgba(229,0,26,0.8)', fontSize:13, cursor:'pointer', fontFamily:F.sans }}>
          🗺️ Open what3words map to find my location
        </button>
      </div>
    </Sheet>
  )
}

// ═══════════════════════════════════════════════════════════════
// 5. SOCIAL LOGIN BUTTONS (Google + Apple)
// ═══════════════════════════════════════════════════════════════
export function SocialLoginButtons({ onSuccess }) {
  const [loading, setLoading] = useState(null)

  const signInWith = async (provider) => {
    setLoading(provider)
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
        queryParams: provider === 'google' ? { access_type:'offline', prompt:'consent' } : {}
      }
    })
    if (error) { toast.error('Sign in failed: ' + error.message); setLoading(null) }
  }

  const isIOS = /iPhone|iPad|Mac/i.test(navigator.userAgent)

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      {isIOS && (
        <button onClick={()=>signInWith('apple')} disabled={loading==='apple'}
          style={{ width:'100%', padding:'14px 16px', background:loading==='apple'?C.surface:'#000', border:'none', borderRadius:14, color:'white', fontSize:15, fontWeight:600, cursor:'pointer', fontFamily:F.sans, display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
          {loading==='apple'?'Signing in...':'Continue with Apple'}
        </button>
      )}
      <button onClick={()=>signInWith('google')} disabled={loading==='google'}
        style={{ width:'100%', padding:'14px 16px', background:loading==='google'?C.surface:'white', border:'none', borderRadius:14, color:'#1a1a1a', fontSize:15, fontWeight:600, cursor:'pointer', fontFamily:F.sans, display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
        <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
        {loading==='google'?'Signing in...':'Continue with Google'}
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 6. PHONE OTP VERIFICATION
// ═══════════════════════════════════════════════════════════════
export function PhoneVerification({ onVerified, onClose }) {
  const [step, setStep] = useState('phone')
  const [phone, setPhone] = useState('+34')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const otpRefs = [useRef(),useRef(),useRef(),useRef(),useRef(),useRef()]

  const sendOTP = async () => {
    if (phone.length < 8) { setError('Enter a valid phone number'); return }
    setLoading(true); setError('')
    const { error: e } = await supabase.auth.signInWithOtp({ phone })
    if (e) setError(e.message)
    else setStep('verify')
    setLoading(false)
  }

  const verifyOTP = async () => {
    if (otp.length < 6) { setError('Enter the 6-digit code'); return }
    setLoading(true); setError('')
    const { error: e } = await supabase.auth.verifyOtp({ phone, token:otp, type:'sms' })
    if (e) setError(e.message)
    else { toast.success('Phone verified! ✓'); onVerified?.() }
    setLoading(false)
  }

  const handleOTPInput = (i, val) => {
    const digits = val.replace(/[^0-9]/g,'')
    if (digits.length > 1) {
      // Paste handling
      setOtp(digits.slice(0,6))
      otpRefs[Math.min(5,digits.length-1)]?.current?.focus()
    } else {
      const arr = otp.split(''); arr[i] = digits; setOtp(arr.join(''))
      if (digits && i < 5) otpRefs[i+1]?.current?.focus()
    }
  }

  return (
    <Sheet onClose={onClose}>
      <div style={{ padding:'20px 24px 48px' }}>
        <div style={{ fontFamily:F.serif, fontSize:24, color:C.white, marginBottom:6 }}>
          {step==='phone' ? '📱 Verify your number' : '💬 Enter code'}
        </div>
        <div style={{ fontSize:13, color:C.muted, marginBottom:24 }}>
          {step==='phone' ? "We'll send a 6-digit code to your phone" : 'Code sent to '+phone}
        </div>

        {step==='phone' ? (
          <>
            <input value={phone} onChange={e=>setPhone(e.target.value)} type="tel"
              style={{ width:'100%', padding:'14px 16px', background:C.surface, border:'0.5px solid '+C.border, borderRadius:12, color:C.white, fontSize:18, fontFamily:'monospace', outline:'none', boxSizing:'border-box', marginBottom:10 }} />
            {error && <div style={{ fontSize:12, color:'#F09595', marginBottom:10 }}>{error}</div>}
            <button onClick={sendOTP} disabled={loading}
              style={{ width:'100%', padding:'15px', background:C.accent, border:'none', borderRadius:14, color:'white', fontSize:15, fontWeight:700, cursor:'pointer' }}>
              {loading?'Sending...':'Send code'}
            </button>
          </>
        ) : (
          <>
            <div style={{ display:'flex', gap:8, justifyContent:'center', marginBottom:16 }}>
              {Array(6).fill(0).map((_,i)=>(
                <input key={i} ref={otpRefs[i]} maxLength={1} value={otp[i]||''} onChange={e=>handleOTPInput(i,e.target.value)}
                  onKeyDown={e=>{ if(e.key==='Backspace'&&!otp[i]&&i>0) otpRefs[i-1]?.current?.focus() }}
                  style={{ width:44, height:52, textAlign:'center', background:C.surface, border:'0.5px solid '+(otp[i]?C.accent:C.border), borderRadius:10, color:C.white, fontSize:24, fontWeight:700, fontFamily:'monospace', outline:'none' }} />
              ))}
            </div>
            {error && <div style={{ fontSize:12, color:'#F09595', marginBottom:10, textAlign:'center' }}>{error}</div>}
            <button onClick={verifyOTP} disabled={loading||otp.length<6}
              style={{ width:'100%', padding:'15px', background:otp.length>=6?C.accent:'rgba(255,255,255,0.1)', border:'none', borderRadius:14, color:'white', fontSize:15, fontWeight:700, cursor:otp.length>=6?'pointer':'default' }}>
              {loading?'Verifying...':'Verify'}
            </button>
            <button onClick={()=>{setStep('phone');setOtp('');setError('')}} style={{ width:'100%', padding:'12px', marginTop:8, background:'transparent', border:'none', color:C.muted, fontSize:13, cursor:'pointer' }}>
              Change number
            </button>
          </>
        )}
      </div>
    </Sheet>
  )
}

// ═══════════════════════════════════════════════════════════════
// 7. ORDER CONFIRMATION EMAIL TRIGGER
// ═══════════════════════════════════════════════════════════════
export async function sendOrderConfirmationEmail(order, user) {
  try {
    await supabase.functions.invoke('send-order-confirmation', {
      body: {
        to: user?.email,
        orderNumber: order.order_number || order.id?.slice(0,8),
        items: order.order_items || [],
        total: order.total,
        address: order.delivery_address,
        eta: order.estimated_minutes || 20,
      }
    })
  } catch (e) {
    console.log('Email confirmation would send to:', user?.email, 'Order:', order.order_number)
  }
}

// ═══════════════════════════════════════════════════════════════
// 8. SHARE / DEEP LINK  
// ═══════════════════════════════════════════════════════════════
export function useDeepLink(onCategorySelect, onDetail) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const cat = params.get('cat')
    const product = params.get('p')
    const group = params.get('group')
    if (cat && onCategorySelect) { onCategorySelect(cat); window.history.replaceState({}, '', '/') }
    if (product) {
      const p = PRODUCTS.find(pr=>pr.id===product)
      if (p && onDetail) { onDetail(p); window.history.replaceState({}, '', '/') }
    }
    return group
  }, [])
}

export function shareProduct(product) {
  const url = window.location.origin + '?p=' + product.id
  const text = 'Check out ' + product.name + ' on Isla Drop — 24/7 delivery in Ibiza 🌴'
  if (navigator.share) {
    navigator.share({ title:'Isla Drop', text, url }).catch(()=>{})
  } else {
    navigator.clipboard.writeText(url)
    toast.success('Product link copied!')
  }
}

export function shareCategory(category, label) {
  const url = window.location.origin + '?cat=' + category
  if (navigator.share) {
    navigator.share({ title:'Isla Drop — '+label, text:'Order '+label+' delivered in Ibiza 🌴', url }).catch(()=>{})
  } else {
    navigator.clipboard.writeText(url)
    toast.success('Category link copied!')
  }
}
