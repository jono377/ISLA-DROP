import { useT_ctx } from '../../i18n/TranslationContext'
import { useState, useEffect } from 'react'
import { PRODUCTS } from '../../lib/products'
import { useCartStore, useAuthStore } from '../../lib/store'
import toast from 'react-hot-toast'

function generateCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

export default function GroupOrder({ onBack, onJoinedOrder }) {
  const t = useT_ctx()
  const { user, profile } = useAuthStore()
  const { addItem } = useCartStore()
  const [mode, setMode]         = useState(null) // null | 'create' | 'join'
  const [groupOrder, setGroupOrder] = useState(null)
  const [items, setItems]       = useState([])
  const [joinCode, setJoinCode] = useState('')
  const [myName, setMyName]     = useState(profile?.full_name || '')
  const [search, setSearch]     = useState('')
  const [loading, setLoading]   = useState(false)
  const [shareUrl, setShareUrl] = useState('')

  const createGroup = async () => {
    setLoading(true)
    try {
      const { supabase } = await import('../../lib/supabase')
      const code = generateCode()
      const { data, error } = await supabase.from('group_orders').insert({
        share_code: code,
        host_id: user?.id,
        name: (profile?.full_name || 'Group') + "'s order",
        status: 'open',
      }).select().single()
      if (error) throw error
      setGroupOrder(data)
      setShareUrl(window.location.origin + '?group=' + code)
      setMode('create')
      toast.success('Group order created!')
    } catch (err) { toast.error(err.message || 'Failed to create') }
    setLoading(false)
  }

  const joinGroup = async () => {
    if (!joinCode.trim() || !myName.trim()) { toast.error('Enter your name and the code'); return }
    setLoading(true)
    try {
      const { supabase } = await import('../../lib/supabase')
      const { data, error } = await supabase.from('group_orders').select('*').eq('share_code', joinCode.toUpperCase()).eq('status', 'open').single()
      if (error || !data) { toast.error('Group order not found or closed'); setLoading(false); return }
      const { data: its } = await supabase.from('group_order_items').select('*').eq('group_order_id', data.id)
      setGroupOrder(data)
      setItems(its || [])
      setMode('join')
    } catch { toast.error('Failed to join') }
    setLoading(false)
  }

  const addToGroup = async (product) => {
    if (!myName.trim()) { toast.error('Enter your name first'); return }
    try {
      const { supabase } = await import('../../lib/supabase')
      const { data, error } = await supabase.from('group_order_items').insert({
        group_order_id: groupOrder.id,
        participant_name: myName.trim(),
        product_id: product.id,
        product_name: product.name,
        quantity: 1,
        price: product.price,
      }).select().single()
      if (error) throw error
      setItems(prev => [...prev, data])
      toast.success(product.emoji + ' Added to group order!')
    } catch { toast.error('Failed to add item') }
  }

  const checkoutGroup = async () => {
    if (items.length === 0) { toast.error('No items in group order'); return }
    items.forEach(item => {
      const product = PRODUCTS.find(p => p.id === item.product_id)
      if (product) for (let i = 0; i < item.quantity; i++) addItem(product)
    })
    // Close the group order
    const { supabase } = await import('../../lib/supabase')
    await supabase.from('group_orders').update({ status:'locked' }).eq('id', groupOrder.id)
    toast.success('All items added to basket!')
    onBack()
  }

  const filtered = PRODUCTS.filter(p =>
    ['spirits','champagne','wine','beer_cider','soft_drinks','water','snacks','party','cocktail'].includes(p.category) &&
    (!search || p.name.toLowerCase().includes(search.toLowerCase()))
  )

  const myItems = items.filter(i => i.participant_name === myName)
  const totalPrice = items.reduce((s, i) => s + (i.price || 0) * (i.quantity || 1), 0)
  const byPerson = items.reduce((acc, i) => { acc[i.participant_name] = (acc[i.participant_name] || 0) + (i.price || 0); return acc }, {})

  return (
    <div style={{ padding:'0 16px 32px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
        <button onClick={onBack} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.6)', cursor:'pointer', fontSize:20, padding:0 }}>←</button>
        <div style={{ fontFamily:'DM Serif Display,serif', fontSize:22, color:'white' }}>{t.groupOrder2||'Group Order'}</div>
      </div>

      {!mode && (
        <>
          <div style={{ textAlign:'center', padding:'20px 0 28px' }}>
            <div style={{ fontSize:48, marginBottom:12 }}>👥</div>
            <div style={{ fontFamily:'DM Serif Display,serif', fontSize:22, color:'white', marginBottom:8 }}>{t.orderTogether||'Order together'}</div>
            <div style={{ fontSize:14, color:'rgba(255,255,255,0.5)', lineHeight:1.6 }}>Create a shared basket and invite your group to add their own items — then place one order together</div>
          </div>
          <button onClick={createGroup} disabled={loading}
            style={{ width:'100%', padding:'14px', background:'#C4683A', color:'white', border:'none', borderRadius:12, fontFamily:'DM Sans,sans-serif', fontSize:15, fontWeight:500, cursor:'pointer', marginBottom:12 }}>
            {loading ? 'Creating...' : '+ Start a group order'}
          </button>
          <div style={{ display:'flex', gap:8, marginBottom:16 }}>
            <input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} placeholder="Group code"
              style={{ flex:1, padding:'12px 14px', background:'rgba(255,255,255,0.08)', border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:10, fontFamily:'DM Sans,sans-serif', fontSize:14, color:'white', outline:'none' }} />
            <button onClick={joinGroup} disabled={loading}
              style={{ padding:'12px 18px', background:'rgba(255,255,255,0.1)', border:'0.5px solid rgba(255,255,255,0.2)', borderRadius:10, color:'white', cursor:'pointer', fontFamily:'DM Sans,sans-serif', fontSize:14 }}>
              Join
            </button>
          </div>
          <input value={myName} onChange={e => setMyName(e.target.value)} placeholder="Your name (for group order)"
            style={{ width:'100%', padding:'12px 14px', background:'rgba(255,255,255,0.08)', border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:10, fontFamily:'DM Sans,sans-serif', fontSize:14, color:'white', outline:'none', boxSizing:'border-box' }} />
        </>
      )}

      {mode && groupOrder && (
        <>
          <div style={{ background:'rgba(43,122,139,0.15)', border:'0.5px solid rgba(43,122,139,0.3)', borderRadius:12, padding:14, marginBottom:16 }}>
            <div style={{ fontSize:13, color:'#7ECFE0', marginBottom:4 }}>{groupOrder.name}</div>
            <div style={{ fontFamily:'monospace', fontSize:22, fontWeight:700, color:'white', letterSpacing:3, marginBottom:8 }}>{groupOrder.share_code}</div>
            {mode === 'create' && (
              <button onClick={() => { navigator.clipboard?.writeText(shareUrl); toast.success('Link copied!') }}
                style={{ padding:'7px 14px', background:'rgba(43,122,139,0.4)', border:'none', borderRadius:8, fontSize:12, color:'white', cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
                📋 Copy invite link
              </button>
            )}
          </div>

          {/* Name input */}
          <input value={myName} onChange={e => setMyName(e.target.value)} placeholder="Your name"
            style={{ width:'100%', padding:'10px 14px', background:'rgba(255,255,255,0.08)', border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:10, fontFamily:'DM Sans,sans-serif', fontSize:14, color:'white', outline:'none', boxSizing:'border-box', marginBottom:12 }} />

          {/* Group items summary */}
          {items.length > 0 && (
            <div style={{ background:'rgba(255,255,255,0.05)', borderRadius:12, padding:14, marginBottom:14 }}>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', marginBottom:8 }}>GROUP BASKET — €{totalPrice.toFixed(2)}</div>
              {Object.entries(byPerson).map(([name, total]) => (
                <div key={name} style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'rgba(255,255,255,0.7)', marginBottom:4 }}>
                  <span>{name} ({items.filter(i=>i.participant_name===name).length} items)</span>
                  <span>€{total.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Product search */}
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products to add..."
            style={{ width:'100%', padding:'10px 14px', background:'rgba(255,255,255,0.08)', border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:10, fontFamily:'DM Sans,sans-serif', fontSize:13, color:'white', outline:'none', boxSizing:'border-box', marginBottom:12 }} />

          <div style={{ maxHeight:280, overflowY:'auto', marginBottom:16 }}>
            {filtered.slice(0, 30).map(p => (
              <div key={p.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'0.5px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize:20 }}>{p.emoji}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, color:'white' }}>{p.name}</div>
                  <div style={{ fontSize:11, color:'#E8A070' }}>€{p.price.toFixed(2)}</div>
                </div>
                <button onClick={() => addToGroup(p)}
                  style={{ padding:'5px 12px', background:'rgba(196,104,58,0.3)', border:'0.5px solid rgba(196,104,58,0.4)', borderRadius:8, fontSize:11, color:'#E8A070', cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
                  + Add
                </button>
              </div>
            ))}
          </div>

          {mode === 'create' && items.length > 0 && (
            <button onClick={checkoutGroup}
              style={{ width:'100%', padding:'14px', background:'#C4683A', color:'white', border:'none', borderRadius:12, fontFamily:'DM Sans,sans-serif', fontSize:15, fontWeight:500, cursor:'pointer' }}>
              Checkout — {items.length} items · €{totalPrice.toFixed(2)}
            </button>
          )}
        </>
      )}
    </div>
  )
}
