import { useState, useEffect } from 'react'
import { PRODUCTS } from '../../lib/products'
import toast from 'react-hot-toast'

const REASONS = [
  { value:'clear_stock', label:'Clear Stock', emoji:'📦', desc:'Reduce inventory before discontinuing' },
  { value:'loss_leader',  label:'Loss Leader',  emoji:'🎯', desc:'Drive demand and new customers' },
  { value:'promotion',    label:'Promotion',    emoji:'🎉', desc:'Seasonal or event promotion' },
  { value:'seasonal',     label:'Seasonal',     emoji:'🌞', desc:'End of season clearance' },
]

function randomPct(max = 20) {
  const steps = [5, 8, 10, 12, 15, 18, 20]
  return steps[Math.floor(Math.random() * steps.length)]
}

export default function SaleManager() {
  const [sales, setSales]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [showAdd, setShowAdd]     = useState(false)
  const [selected, setSelected]   = useState([]) // product IDs being added
  const [discounts, setDiscounts] = useState({}) // productId -> pct
  const [reason, setReason]       = useState('clear_stock')
  const [saving, setSaving]       = useState(false)

  const load = async () => {
    try {
      const { supabase } = await import('../../lib/supabase')
      const { data } = await supabase.from('sale_products').select('*').order('created_at', { ascending: false })
      if (data) setSales(data)
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const saleProductIds = new Set(sales.filter(s => s.active).map(s => s.product_id))

  const filteredProducts = PRODUCTS.filter(p =>
    !saleProductIds.has(p.id) &&
    (p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase()))
  )

  const toggleSelect = (product) => {
    setSelected(prev => {
      if (prev.includes(product.id)) return prev.filter(id => id !== product.id)
      return [...prev, product.id]
    })
    setDiscounts(prev => {
      if (prev[product.id]) return prev
      return { ...prev, [product.id]: randomPct() }
    })
  }

  const saveSales = async () => {
    if (selected.length === 0) { toast.error('Select at least one product'); return }
    setSaving(true)
    try {
      const { supabase } = await import('../../lib/supabase')
      const { data: { user } } = await supabase.auth.getUser()
      const rows = selected.map(pid => {
        const product = PRODUCTS.find(p => p.id === pid)
        const pct = discounts[pid] || 10
        const salePrice = Math.round(product.price * (1 - pct / 100) * 100) / 100
        return {
          product_id: pid,
          product_name: product.name,
          original_price: product.price,
          discount_pct: pct,
          sale_price: salePrice,
          reason,
          active: true,
          created_by: user?.id,
        }
      })
      const { error } = await supabase.from('sale_products').upsert(rows, { onConflict: 'product_id' })
      if (error) throw error
      toast.success(selected.length + ' product' + (selected.length > 1 ? 's' : '') + ' added to sale!')
      setSelected([])
      setDiscounts({})
      setShowAdd(false)
      load()
    } catch (err) { toast.error(err.message || 'Save failed') }
    setSaving(false)
  }

  const removeSale = async (id) => {
    try {
      const { supabase } = await import('../../lib/supabase')
      await supabase.from('sale_products').update({ active: false }).eq('id', id)
      toast.success('Removed from sale')
      load()
    } catch { toast.error('Failed') }
  }

  const updateDiscount = async (id, productId, originalPrice, newPct) => {
    const clamped = Math.min(20, Math.max(1, parseFloat(newPct) || 10))
    const newPrice = Math.round(originalPrice * (1 - clamped / 100) * 100) / 100
    try {
      const { supabase } = await import('../../lib/supabase')
      await supabase.from('sale_products').update({ discount_pct: clamped, sale_price: newPrice }).eq('id', id)
      setSales(prev => prev.map(s => s.id === id ? { ...s, discount_pct: clamped, sale_price: newPrice } : s))
    } catch { toast.error('Update failed') }
  }

  const activeSales  = sales.filter(s => s.active)
  const totalSavings = activeSales.reduce((sum, s) => sum + (s.original_price - s.sale_price), 0)

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
        <div>
          <div style={{ fontFamily:'DM Serif Display,serif', fontSize:22, color:'#0D3B4A', marginBottom:4 }}>On Sale</div>
          <div style={{ fontSize:13, color:'#7A6E60' }}>
            {activeSales.length} products on sale · avg saving €{activeSales.length > 0 ? (totalSavings / activeSales.length).toFixed(2) : '0.00'}
          </div>
        </div>
        <button onClick={() => setShowAdd(!showAdd)}
          style={{ padding:'10px 16px', background:'#C4683A', color:'white', border:'none', borderRadius:10, fontFamily:'DM Sans,sans-serif', fontSize:13, cursor:'pointer', fontWeight:500 }}>
          + Add to Sale
        </button>
      </div>

      {/* Add products panel */}
      {showAdd && (
        <div style={{ background:'white', borderRadius:14, padding:18, marginBottom:16, border:'0.5px solid rgba(42,35,24,0.1)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div style={{ fontFamily:'DM Serif Display,serif', fontSize:18, color:'#0D3B4A' }}>Select products to put on sale</div>
            <button onClick={() => { setShowAdd(false); setSelected([]); setDiscounts({}) }}
              style={{ background:'none', border:'none', cursor:'pointer', fontSize:18, color:'#7A6E60' }}>✕</button>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:14 }}>
            {REASONS.map(r => (
              <div key={r.value} onClick={() => setReason(r.value)}
                style={{ padding:'10px 12px', background: reason===r.value?'rgba(196,104,58,0.1)':'rgba(0,0,0,0.03)', border:'0.5px solid ' + (reason===r.value?'rgba(196,104,58,0.4)':'rgba(42,35,24,0.1)'), borderRadius:10, cursor:'pointer' }}>
                <div style={{ fontSize:13, fontWeight:500, color:'#2A2318' }}>{r.emoji} {r.label}</div>
                <div style={{ fontSize:11, color:'#7A6E60', marginTop:2 }}>{r.desc}</div>
              </div>
            ))}
          </div>

          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search products..."
            style={{ width:'100%', padding:'10px 12px', border:'0.5px solid rgba(42,35,24,0.15)', borderRadius:8, fontFamily:'DM Sans,sans-serif', fontSize:13, outline:'none', marginBottom:10, boxSizing:'border-box' }} />

          {selected.length > 0 && (
            <div style={{ background:'rgba(196,104,58,0.08)', borderRadius:8, padding:'8px 12px', marginBottom:10, fontSize:12, color:'#C4683A', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span>{selected.length} product{selected.length>1?'s':''} selected</span>
              <button onClick={saveSales} disabled={saving}
                style={{ padding:'6px 14px', background:'#C4683A', color:'white', border:'none', borderRadius:6, fontSize:12, cursor:'pointer', fontFamily:'DM Sans,sans-serif', fontWeight:500 }}>
                {saving ? 'Saving...' : 'Add to Sale'}
              </button>
            </div>
          )}

          <div style={{ maxHeight:320, overflowY:'auto' }}>
            {filteredProducts.slice(0, 50).map(p => {
              const isSelected = selected.includes(p.id)
              const pct = discounts[p.id] || 10
              const salePrice = Math.round(p.price * (1 - pct / 100) * 100) / 100
              return (
                <div key={p.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 0', borderBottom:'0.5px solid rgba(42,35,24,0.06)', cursor:'pointer' }}
                  onClick={() => toggleSelect(p)}>
                  <div style={{ width:22, height:22, borderRadius:6, background: isSelected?'#C4683A':'rgba(0,0,0,0.05)', border: isSelected?'none':'1px solid rgba(42,35,24,0.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    {isSelected && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>}
                  </div>
                  <span style={{ fontSize:18, flexShrink:0 }}>{p.emoji}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, color:'#2A2318', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</div>
                    <div style={{ fontSize:11, color:'#7A6E60' }}>{p.category}</div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontSize:13, fontWeight:500, color:'#2A2318' }}>€{p.price.toFixed(2)}</div>
                    {isSelected && <div style={{ fontSize:11, color:'#C4683A' }}>→ €{salePrice.toFixed(2)}</div>}
                  </div>
                  {isSelected && (
                    <div onClick={e => e.stopPropagation()} style={{ display:'flex', alignItems:'center', gap:4 }}>
                      <input type="number" min="1" max="20" value={pct}
                        onChange={e => setDiscounts(prev => ({ ...prev, [p.id]: Math.min(20, Math.max(1, parseInt(e.target.value)||10)) }))}
                        style={{ width:44, padding:'3px 6px', border:'1px solid rgba(196,104,58,0.4)', borderRadius:6, fontSize:12, textAlign:'center', outline:'none' }} />
                      <span style={{ fontSize:11, color:'#C4683A' }}>%</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Active sales */}
      {loading && <div style={{ textAlign:'center', padding:30, color:'#7A6E60' }}>Loading...</div>}

      {!loading && activeSales.length === 0 && !showAdd && (
        <div style={{ textAlign:'center', padding:'40px 0' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🏷️</div>
          <div style={{ fontSize:15, fontWeight:500, color:'#0D3B4A', marginBottom:6 }}>No products on sale</div>
          <div style={{ fontSize:13, color:'#7A6E60' }}>Add products above to create a sale section on the home screen</div>
        </div>
      )}

      {activeSales.map(s => (
        <div key={s.id} style={{ background:'white', borderRadius:12, padding:14, marginBottom:10, border:'0.5px solid rgba(42,35,24,0.1)', display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:14, fontWeight:500, color:'#2A2318', marginBottom:2 }}>{s.product_name}</div>
            <div style={{ fontSize:11, color:'#7A6E60' }}>{REASONS.find(r=>r.value===s.reason)?.label || s.reason}</div>
          </div>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:11, color:'#7A6E60', textDecoration:'line-through' }}>€{s.original_price.toFixed(2)}</div>
            <div style={{ fontSize:15, fontWeight:600, color:'#C4683A' }}>€{s.sale_price.toFixed(2)}</div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
            <input type="number" min="1" max="20" defaultValue={s.discount_pct}
              onBlur={e => updateDiscount(s.id, s.product_id, s.original_price, e.target.value)}
              style={{ width:44, padding:'4px 6px', border:'1px solid rgba(196,104,58,0.3)', borderRadius:6, fontSize:12, textAlign:'center', outline:'none' }} />
            <span style={{ fontSize:12, color:'#C4683A', fontWeight:600 }}>%</span>
          </div>
          <button onClick={() => removeSale(s.id)}
            style={{ padding:'6px 10px', background:'rgba(196,104,58,0.08)', border:'0.5px solid rgba(196,104,58,0.2)', borderRadius:8, fontSize:12, color:'#C4683A', cursor:'pointer' }}>
            Remove
          </button>
        </div>
      ))}
    </div>
  )
}
