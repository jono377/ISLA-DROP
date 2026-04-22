// ================================================================
// OccasionPage.jsx
// Full-screen occasion builder with:
// - Preset product grid for the occasion
// - Add/remove individual items
// - AI "Build for me" that curates the perfect order
// - Quantity adjustments
// - Add all to basket CTA
// ================================================================
import { useState, useEffect, useRef } from 'react'
import { useCartStore } from '../../lib/store'
import { PRODUCTS } from '../../lib/products'
import toast from 'react-hot-toast'

const F = { serif:'DM Serif Display,serif', sans:'DM Sans,sans-serif' }
const C = {
  accent:'#C4683A', green:'#7EE8A2', gold:'#C8A84B',
  surface:'rgba(255,255,255,0.07)', border:'rgba(255,255,255,0.1)',
  muted:'rgba(255,255,255,0.45)', bg:'#0D3545',
}

// ── Occasion definitions ──────────────────────────────────────
const OCCASIONS = [
  {
    id:'sundowner',
    emoji:'🌅',
    label:'Sundowner',
    colour:'linear-gradient(135deg,#C4683A,#E8A070)',
    desc:'Golden hour drinks for the perfect Ibiza sunset',
    vibe:'Relaxed, romantic, golden hour',
    preset:['wn-021','ch-001','ic-001','sp-012','wt-001'],
    categories:['wine','champagne','spirits','soft_drinks'],
    aiPrompt:'Build a sundowner drinks selection for Ibiza. Golden hour vibes — rosé, prosecco, light spirits, mixers. About 8 products.',
  },
  {
    id:'pool_day',
    emoji:'🏊',
    label:'Pool day',
    colour:'linear-gradient(135deg,#2B7A8B,#7EE8C8)',
    desc:'Cold drinks and snacks for a perfect pool session',
    vibe:'Refreshing, fun, all-day vibes',
    preset:['wt-001','sd-028','ic-002','sn-001','br-001'],
    categories:['water_juice','soft_drinks','beer_cider','snacks','ice'],
    aiPrompt:'Build a pool day drinks and snacks list for Ibiza. Refreshing — cold beers, water, soft drinks, ice, snacks. About 8 products.',
  },
  {
    id:'club_night',
    emoji:'🎵',
    label:'Club night',
    colour:'linear-gradient(135deg,#50147C,#8B2FBB)',
    desc:'Pre-drinks for Pacha, Ushuaia, Hi Ibiza and beyond',
    vibe:'High energy, shots, mixers',
    preset:['sp-004','sd-028','ic-002','tb-001','sp-012'],
    categories:['spirits','soft_drinks','ice','tobacco'],
    aiPrompt:'Build a club night pre-drinks selection for Ibiza. High energy — premium spirits, mixers, shots, ice. About 8 products.',
  },
  {
    id:'beach_day',
    emoji:'🏖️',
    label:'Beach day',
    colour:'linear-gradient(135deg,#C8A84B,#E8D080)',
    desc:'Everything for a day at Ses Salines or Playa den Bossa',
    vibe:'Sunny, snacks, hydration',
    preset:['wt-001','sd-028','sn-001','ic-002','br-001'],
    categories:['water_juice','soft_drinks','snacks','beer_cider'],
    aiPrompt:'Build a beach day selection for Ibiza. Sun, sand — water, soft drinks, cold beers, snacks, ice. About 8 products.',
  },
  {
    id:'boat_trip',
    emoji:'⛵',
    label:'Boat trip',
    colour:'linear-gradient(135deg,#0A6E8A,#2BB8D8)',
    desc:'Drinks and snacks for a day on the water',
    vibe:'Premium, celebratory, sea breeze',
    preset:['ch-001','wn-021','wt-001','sn-001','ic-001'],
    categories:['champagne','wine','water_juice','snacks'],
    aiPrompt:'Build a boat trip drinks selection for Ibiza. Luxury on the water — champagne, rosé, water, premium snacks. About 8 products.',
  },
  {
    id:'bbq',
    emoji:'🔥',
    label:'BBQ',
    colour:'linear-gradient(135deg,#8B3A1A,#C4683A)',
    desc:'Cold beers and drinks for a villa BBQ',
    vibe:'Casual, social, refreshing',
    preset:['br-001','sd-028','ic-002','sn-001','wt-001'],
    categories:['beer_cider','soft_drinks','ice','snacks'],
    aiPrompt:'Build a BBQ drinks selection. Cold beers, soft drinks, ice, water, snacks. About 8 products.',
  },
  {
    id:'birthday',
    emoji:'🎂',
    label:'Birthday',
    colour:'linear-gradient(135deg,#C8A84B,#C4683A)',
    desc:'Make it unforgettable with champagne and sparklers',
    vibe:'Celebratory, premium, festive',
    preset:['ch-001','sp-012','ic-001','sn-001','wn-021'],
    categories:['champagne','spirits','wine','snacks'],
    aiPrompt:'Build a birthday celebration drinks selection for Ibiza. Champagne, prosecco, premium spirits, party snacks. About 8 products.',
  },
  {
    id:'hangover',
    emoji:'🤒',
    label:'Recovery',
    colour:'linear-gradient(135deg,#2A5C3A,#4A9C6A)',
    desc:'Electrolytes, vitamins and everything your body needs',
    vibe:'Restorative, hydrating, gentle',
    preset:['wt-001','sd-028','sn-001'],
    categories:['water_juice','soft_drinks','snacks','wellness'],
    aiPrompt:'Build a hangover recovery selection. Water, electrolytes, coconut water, soft drinks, light snacks, vitamins. About 8 products.',
  },
]

// ── AI builder ─────────────────────────────────────────────────
async function buildWithAI(occasion, guests, notes) {
  const productList = PRODUCTS.map(p =>
    p.id + '|' + p.name + '|' + p.category + '|€' + p.price.toFixed(2)
  ).join('\n')

  const prompt = occasion.aiPrompt +
    '\nGuests: ' + guests + '.' +
    (notes ? '\nSpecial requests: ' + notes + '.' : '') +
    '\nOnly use products from this list. Return ONLY a JSON array of product IDs, no markdown:\n\n' +
    productList

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
      'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY || '',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  const data = await resp.json()
  const raw  = data.content?.[0]?.text?.trim() || '[]'
  const ids  = JSON.parse(raw.replace(/```json|```/g, '').trim())
  return ids.filter(id => PRODUCTS.find(p => p.id === id))
}

// ── Product tile with stepper ──────────────────────────────────
function OccasionProduct({ product, qty, onInc, onDec, onRemove }) {
  const [pressed, setPressed] = useState(false)

  return (
    <div style={{
      background: qty > 0 ? 'rgba(196,104,58,0.12)' : C.surface,
      border: '0.5px solid ' + (qty > 0 ? 'rgba(196,104,58,0.35)' : C.border),
      borderRadius: 16, padding: '12px 14px',
      display: 'flex', alignItems: 'center', gap: 12,
      transition: 'all 0.15s',
    }}>
      {/* Emoji / image */}
      <div style={{
        width: 48, height: 48, borderRadius: 12, flexShrink: 0,
        background: 'rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 26,
      }}>
        {product.emoji}
      </div>

      {/* Name + price */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'white', fontFamily: F.sans, lineHeight: 1.3, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {product.name}
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#E8A070' }}>
          €{product.price.toFixed(2)}
        </div>
      </div>

      {/* Stepper */}
      {qty === 0 ? (
        <button
          onTouchStart={() => setPressed(true)}
          onTouchEnd={() => setPressed(false)}
          onClick={onInc}
          style={{
            width: 32, height: 32, borderRadius: '50%',
            background: C.accent, border: 'none', color: 'white',
            fontSize: 20, cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            transform: pressed ? 'scale(0.88)' : 'scale(1)',
            transition: 'transform 0.1s',
          }}>
          +
        </button>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <button onClick={onDec}
            style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', border: 'none', color: 'white', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {qty === 1 ? '🗑' : '−'}
          </button>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'white', minWidth: 20, textAlign: 'center' }}>{qty}</span>
          <button onClick={onInc}
            style={{ width: 28, height: 28, borderRadius: '50%', background: C.accent, border: 'none', color: 'white', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            +
          </button>
        </div>
      )}
    </div>
  )
}

// ── Main OccasionPage ──────────────────────────────────────────
export default function OccasionPage({ occasionId, onBack }) {
  const occasion = OCCASIONS.find(o => o.id === occasionId) || OCCASIONS[0]
  const { addItem, updateQuantity, items: cartItems } = useCartStore()

  // quantities: { productId: qty } for items in this session
  const [quantities, setQuantities] = useState(() => {
    const q = {}
    const preset = occasion.preset
      .map(id => PRODUCTS.find(p => p.id === id))
      .filter(Boolean)
    preset.forEach(p => { q[p.id] = 1 })
    return q
  })

  // All products shown — starts with preset, AI may add/replace
  const [shownIds, setShownIds] = useState(() => {
    const preset = occasion.preset
      .map(id => PRODUCTS.find(p => p.id === id))
      .filter(Boolean)
    return preset.map(p => p.id)
  })

  // AI state
  const [aiLoading, setAiLoading]   = useState(false)
  const [aiDone, setAiDone]         = useState(false)
  const [guests, setGuests]         = useState(4)
  const [notes, setNotes]           = useState('')
  const [showAiPanel, setShowAiPanel] = useState(false)
  const [aiMessage, setAiMessage]   = useState('')

  // Scroll to top on mount
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [])

  const shownProducts = shownIds
    .map(id => PRODUCTS.find(p => p.id === id))
    .filter(Boolean)

  // Related products not yet shown (for manual adding)
  const relatedProducts = PRODUCTS
    .filter(p => occasion.categories.includes(p.category) && !shownIds.includes(p.id))
    .slice(0, 12)

  const getQty = id => quantities[id] || 0

  const inc = id => setQuantities(q => ({ ...q, [id]: (q[id] || 0) + 1 }))
  const dec = id => {
    const current = quantities[id] || 0
    if (current <= 1) {
      // Remove from shown
      setShownIds(ids => ids.filter(i => i !== id))
      setQuantities(q => { const nq = { ...q }; delete nq[id]; return nq })
    } else {
      setQuantities(q => ({ ...q, [id]: current - 1 }))
    }
  }

  const addMore = id => {
    if (!shownIds.includes(id)) setShownIds(ids => [...ids, id])
    setQuantities(q => ({ ...q, [id]: (q[id] || 0) + 1 }))
  }

  const totalItems = Object.values(quantities).reduce((s, q) => s + q, 0)
  const totalCost  = Object.entries(quantities).reduce((s, [id, q]) => {
    const p = PRODUCTS.find(pr => pr.id === id)
    return s + (p ? p.price * q : 0)
  }, 0)

  const runAI = async () => {
    setAiLoading(true)
    setAiMessage('')
    try {
      const ids = await buildWithAI(occasion, guests, notes)
      if (!ids.length) throw new Error('No products returned')
      // Replace shown list with AI selection, preserve existing quantities
      const newQty = {}
      ids.forEach(id => { newQty[id] = quantities[id] || 1 })
      setShownIds(ids)
      setQuantities(newQty)
      setAiDone(true)
      setShowAiPanel(false)
      setAiMessage('Isla built your ' + occasion.label.toLowerCase() + ' selection for ' + guests + ' guests 🌴')
      toast.success('AI selection ready! ' + occasion.emoji, { duration: 2000 })
    } catch {
      toast.error('AI builder failed — try again')
    }
    setAiLoading(false)
  }

  const addAllToBasket = () => {
    let count = 0
    Object.entries(quantities).forEach(([id, qty]) => {
      if (qty <= 0) return
      const product = PRODUCTS.find(p => p.id === id)
      if (!product) return
      // Set quantity in cart
      const existing = cartItems.find(i => i.product.id === id)
      if (existing) {
        updateQuantity(id, existing.quantity + qty)
      } else {
        for (let i = 0; i < qty; i++) addItem(product)
      }
      count += qty
    })
    navigator.vibrate?.([20, 50, 20])
    toast.success(count + ' items added to basket! ' + occasion.emoji, { duration: 2000 })
    onBack()
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, paddingBottom: 100 }}>
      {/* Hero header */}
      <div style={{ background: occasion.colour, padding: '20px 16px 24px', position: 'relative' }}>
        {/* Back button */}
        <button onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.2)', border: '0.5px solid rgba(255,255,255,0.25)', borderRadius: 20, padding: '7px 14px 7px 10px', cursor: 'pointer', marginBottom: 18 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          <span style={{ fontSize: 12, color: 'white', fontFamily: F.sans, fontWeight: 500 }}>Back</span>
        </button>

        <div style={{ fontSize: 48, marginBottom: 8 }}>{occasion.emoji}</div>
        <div style={{ fontFamily: F.serif, fontSize: 28, color: 'white', marginBottom: 4 }}>{occasion.label}</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 0, fontFamily: F.sans }}>{occasion.desc}</div>
      </div>

      {/* AI message */}
      {aiMessage && (
        <div style={{ margin: '12px 16px 0', background: 'rgba(126,232,162,0.1)', border: '0.5px solid rgba(126,232,162,0.3)', borderRadius: 12, padding: '10px 14px', fontSize: 13, color: C.green, fontFamily: F.sans }}>
          ✨ {aiMessage}
        </div>
      )}

      {/* AI builder button */}
      <div style={{ padding: '16px 16px 0' }}>
        <button onClick={() => setShowAiPanel(p => !p)}
          style={{ width: '100%', padding: '13px 16px', background: 'linear-gradient(135deg,rgba(196,104,58,0.25),rgba(43,122,139,0.25))', border: '0.5px solid rgba(196,104,58,0.4)', borderRadius: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#C4683A,#E8854A)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
          </div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'white', fontFamily: F.sans }}>
              {aiDone ? 'Rebuild with Isla AI ✨' : 'Build with Isla AI ✨'}
            </div>
            <div style={{ fontSize: 11, color: C.muted, fontFamily: F.sans }}>Curated for your guests and vibe</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2">
            <path d={showAiPanel ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"}/>
          </svg>
        </button>

        {/* AI panel */}
        {showAiPanel && (
          <div style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: 16, marginTop: 8 }}>
            {/* Guest count */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 8, fontFamily: F.sans }}>How many guests?</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button onClick={() => setGuests(g => Math.max(1, g - 1))}
                  style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                <span style={{ fontSize: 22, fontWeight: 700, color: 'white', minWidth: 32, textAlign: 'center' }}>{guests}</span>
                <button onClick={() => setGuests(g => g + 1)}
                  style={{ width: 32, height: 32, borderRadius: '50%', background: C.accent, border: 'none', color: 'white', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                <span style={{ fontSize: 13, color: C.muted, fontFamily: F.sans }}>guests</span>
              </div>
            </div>

            {/* Special requests */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 6, fontFamily: F.sans }}>Any special requests? (optional)</div>
              <input value={notes} onChange={e => setNotes(e.target.value)}
                placeholder={'e.g. No tobacco, extra ice, budget €80...'}
                style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.07)', border: '0.5px solid rgba(255,255,255,0.15)', borderRadius: 10, color: 'white', fontSize: 13, fontFamily: F.sans, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <button onClick={runAI} disabled={aiLoading}
              style={{ width: '100%', padding: '13px', background: aiLoading ? 'rgba(196,104,58,0.4)' : C.accent, border: 'none', borderRadius: 12, color: 'white', fontSize: 14, fontWeight: 600, cursor: aiLoading ? 'default' : 'pointer', fontFamily: F.sans, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {aiLoading ? (
                <>
                  <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'occasionSpin 0.8s linear infinite' }}/>
                  Isla is building your selection...
                </>
              ) : 'Build my ' + occasion.label.toLowerCase() + ' →'}
            </button>
          </div>
        )}
      </div>

      {/* Current selection */}
      <div style={{ padding: '20px 16px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontFamily: F.serif, fontSize: 20, color: 'white' }}>
            Your selection
          </div>
          <div style={{ fontSize: 12, color: C.muted, fontFamily: F.sans, background: C.surface, padding: '4px 10px', borderRadius: 20 }}>
            {totalItems} items · €{totalCost.toFixed(2)}
          </div>
        </div>

        {shownProducts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 0', color: C.muted, fontSize: 14, fontFamily: F.sans }}>
            No items yet — use AI builder or add from below
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {shownProducts.map(p => (
            <OccasionProduct
              key={p.id}
              product={p}
              qty={getQty(p.id)}
              onInc={() => inc(p.id)}
              onDec={() => dec(p.id)}
              onRemove={() => dec(p.id)}
            />
          ))}
        </div>
      </div>

      {/* Add more products */}
      {relatedProducts.length > 0 && (
        <div style={{ padding: '4px 16px 16px' }}>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 10, fontFamily: F.sans, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Add more
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {relatedProducts.map(p => (
              <button key={p.id} onClick={() => addMore(p.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: C.surface, border: '0.5px solid ' + C.border, borderRadius: 14, cursor: 'pointer', textAlign: 'left' }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>{p.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: 'white', fontFamily: F.sans, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 1 }}>
                    {p.name.split(' ').slice(0, 3).join(' ')}
                  </div>
                  <div style={{ fontSize: 12, color: '#E8A070', fontWeight: 600 }}>€{p.price.toFixed(2)}</div>
                </div>
                <span style={{ color: C.accent, fontSize: 18, flexShrink: 0 }}>+</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sticky CTA */}
      {totalItems > 0 && (
        <div style={{ position: 'fixed', bottom: 68, left: 0, right: 0, maxWidth: 480, margin: '0 auto', padding: '12px 16px', background: 'rgba(10,30,40,0.97)', backdropFilter: 'blur(16px)', borderTop: '0.5px solid rgba(255,255,255,0.08)', zIndex: 50 }}>
          <button onClick={addAllToBasket}
            style={{ width: '100%', padding: '16px', background: C.accent, border: 'none', borderRadius: 14, color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: F.sans, boxShadow: '0 4px 20px rgba(196,104,58,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <span>🛒</span>
            Add {totalItems} items to basket · €{totalCost.toFixed(2)}
          </button>
        </div>
      )}

      <style>{'@keyframes occasionSpin{to{transform:rotate(360deg)}}'}</style>
    </div>
  )
}

// Also export the OCCASIONS array for the selector
export { OCCASIONS }
