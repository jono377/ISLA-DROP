// ================================================================
// PackagePage.jsx
// Full-screen curated package builder — For the Girls / For the Boys
// Matches OccasionPage architecture:
// - Preset products with qty steppers
// - AI "Build for me" with guest count + notes
// - Add more products from related categories
// - Add all to basket CTA
// ================================================================
import { useState, useEffect } from 'react'
import { useCartStore } from '../../lib/store'
import { PRODUCTS } from '../../lib/products'
import toast from 'react-hot-toast'

const F = { serif: 'DM Serif Display,serif', sans: 'DM Sans,sans-serif' }
const C = {
  accent: '#C4683A', green: '#7EE8A2',
  surface: 'rgba(255,255,255,0.07)', border: 'rgba(255,255,255,0.1)',
  muted: 'rgba(255,255,255,0.45)', bg: '#0D3545',
}

// ── Package definitions ───────────────────────────────────────
export const PACKAGES = [
  // ── For the Girls ──────────────────────────────────────────
  {
    id: 'boat_day_girls', group: 'girls', emoji: '🛥️', label: 'Boat Day',
    colour: 'linear-gradient(135deg,#E8897A,#C4683A)',
    desc: 'Rosé, bubbles and sun-soaked essentials for a perfect day on the water',
    vibe: 'Relaxed, glamorous, golden hour vibes',
    preset: ['wn-021', 'wn-020', 'ch-008', 'sd-019', 'sn-003', 'sn-007'],
    categories: ['wine', 'champagne', 'soft_drinks', 'snacks', 'water'],
    aiPrompt: 'Build a girls boat day selection for Ibiza. Elegant and fun — rosé wine, champagne rosé, sparkling water, premium snacks, maybe a sweet treat. For the girls on a beautiful boat day.',
  },
  {
    id: 'girls_night',    group: 'girls', emoji: '💅', label: "Girls' Night",
    colour: 'linear-gradient(135deg,#C4683A,#A03020)',
    desc: 'Champagne, cocktail mixers and treats for the ultimate girls night',
    vibe: 'Glam, celebratory, cocktail hour',
    preset: ['ch-011', 'ch-008', 'sp-010', 'sp-044', 'sd-025', 'sn-003'],
    categories: ['champagne', 'spirits', 'soft_drinks', 'snacks', 'wine'],
    aiPrompt: 'Build a girls night in selection for Ibiza. Glamorous and fun — champagne, tequila rose, cocktail mixers like tonic and cointreau, chocolates and sweet snacks. Perfect for a girly night in.',
  },
  {
    id: 'pool_slay',      group: 'girls', emoji: '🌸', label: 'Pool Slay',
    colour: 'linear-gradient(135deg,#B080D8,#8050B0)',
    desc: 'Rosé, light bites and all the good vibes for a day by the pool',
    vibe: 'Summery, refreshing, photogenic',
    preset: ['wn-021', 'wn-015', 'sd-020', 'sd-019', 'sn-007', 'sn-002'],
    categories: ['wine', 'soft_drinks', 'snacks', 'water', 'champagne'],
    aiPrompt: 'Build a pool day selection for girls in Ibiza. Light and refreshing — rosé wine, Laurent Perrier rosé, iced teas, sparkling water, light snacks and treats. Pool slay vibes.',
  },
  {
    id: 'girly_day',      group: 'girls', emoji: '🩷', label: 'Girly Day Out',
    colour: 'linear-gradient(135deg,#E870A0,#C05080)',
    desc: 'Prosecco, snacks and great energy for a day out with the girls',
    vibe: 'Fun, carefree, brunch energy',
    preset: ['wn-021', 'ch-010', 'sd-020', 'sd-021', 'sn-002', 'sn-003'],
    categories: ['wine', 'champagne', 'soft_drinks', 'snacks'],
    aiPrompt: 'Build a girly day out selection for Ibiza. Fun and carefree — prosecco, rosé, iced teas, Red Bull, chocolate and sweet snacks. Perfect for a day out with the girls.',
  },
  // ── For the Boys ───────────────────────────────────────────
  {
    id: 'lads_holiday',   group: 'boys', emoji: '🍺', label: 'Lads Holiday',
    colour: 'linear-gradient(135deg,#2B7A8B,#1A5060)',
    desc: 'Premium vodka, shots and party fuel for the ultimate lads holiday',
    vibe: 'High energy, shots, celebrations',
    preset: ['sp-033', 'sp-039', 'sp-003', 'sn-004', 'sn-006', 'sd-021'],
    categories: ['spirits', 'beer', 'soft_drinks', 'snacks', 'tobacco'],
    aiPrompt: 'Build a lads holiday selection for Ibiza. High energy and fun — premium vodka, tequila, energy drinks, sharing snacks like Doritos and Takis, Red Bull. For a group of lads on holiday.',
  },
  {
    id: 'gentleman',      group: 'boys', emoji: '🥃', label: 'Gentleman',
    colour: 'linear-gradient(135deg,#8B6914,#6B4A08)',
    desc: 'Premium whisky, cognac and refined tastes for the discerning gentleman',
    vibe: 'Sophisticated, premium, refined',
    preset: ['sp-015', 'sp-021', 'sp-027', 'sp-032', 'sn-005', 'tb-001'],
    categories: ['spirits', 'snacks', 'tobacco'],
    aiPrompt: 'Build a gentleman\'s drinks selection for Ibiza. Sophisticated and premium — aged whisky like Johnnie Walker Blue or Yamazaki, cognac like Hennessy XO, premium vodka, salted nuts. Refined evening vibes.',
  },
  {
    id: 'boat_day_boys',  group: 'boys', emoji: '⛵', label: 'Boat Day',
    colour: 'linear-gradient(135deg,#1A5A8A,#0A3060)',
    desc: 'Cold spirits, mixers and snacks for a day out on the water with the boys',
    vibe: 'Premium, celebratory, sea breeze',
    preset: ['sp-033', 'sp-035', 'sp-003', 'sn-004', 'sn-009', 'sd-021'],
    categories: ['spirits', 'soft_drinks', 'snacks', 'beer', 'water'],
    aiPrompt: 'Build a boys boat day selection for Ibiza. Premium and celebratory — Grey Goose vodka, Don Julio tequila, Belvedere, sharing snacks like Pringles and Doritos, Red Bull. A day on the water with the boys.',
  },
  {
    id: 'villa_party',    group: 'boys', emoji: '🏡', label: 'Villa Party',
    colour: 'linear-gradient(135deg,#6B3AAA,#4A2080)',
    desc: 'Magnums, mixers and the good stuff for a legendary villa party',
    vibe: 'Epic, large-format, party mode',
    preset: ['sp-034', 'sp-036', 'sd-024', 'sd-025', 'sn-004', 'sn-009'],
    categories: ['spirits', 'soft_drinks', 'snacks', 'ice', 'beer'],
    aiPrompt: 'Build a villa party selection for Ibiza. Epic and large-format — Belvedere magnum, Grey Goose magnum, soda water, tonic water, sharing snacks for a big group. Villa party that goes all night.',
  },
]

// ── AI builder ────────────────────────────────────────────────
async function buildPackageWithAI(pkg, guests, notes) {
  const productList = PRODUCTS.map(p =>
    p.id + '|' + p.name + '|' + p.category + '|€' + p.price.toFixed(2)
  ).join('\n')

  const prompt = pkg.aiPrompt +
    '\nGuests: ' + guests + '.' +
    (notes ? '\nSpecial requests: ' + notes + '.' : '') +
    '\nOnly use products from this list. Return ONLY a JSON array of product IDs, no markdown, no explanation:\n\n' +
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

// ── Product tile with stepper ─────────────────────────────────
function PackageProduct({ product, qty, onInc, onDec }) {
  return (
    <div style={{
      background: qty > 0 ? 'rgba(196,104,58,0.12)' : C.surface,
      border: '0.5px solid ' + (qty > 0 ? 'rgba(196,104,58,0.35)' : C.border),
      borderRadius: 16, padding: '12px 14px',
      display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.15s',
    }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>
        {product.emoji}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'white', fontFamily: F.sans, lineHeight: 1.3, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {product.name}
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#E8A070' }}>€{product.price.toFixed(2)}</div>
      </div>
      {qty === 0 ? (
        <button onClick={onInc}
          style={{ width: 32, height: 32, borderRadius: '50%', background: C.accent, border: 'none', color: 'white', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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

// ── Main PackagePage ──────────────────────────────────────────
export default function PackagePage({ packageId, onBack }) {
  const pkg = PACKAGES.find(p => p.id === packageId) || PACKAGES[0]
  const { addItem, updateQuantity, items: cartItems } = useCartStore()

  const [quantities, setQuantities] = useState(() => {
    const q = {}
    pkg.preset.map(id => PRODUCTS.find(p => p.id === id)).filter(Boolean)
      .forEach(p => { q[p.id] = 1 })
    return q
  })

  const [shownIds,    setShownIds]    = useState(() =>
    pkg.preset.map(id => PRODUCTS.find(p => p.id === id)).filter(Boolean).map(p => p.id)
  )
  const [aiLoading,   setAiLoading]   = useState(false)
  const [aiDone,      setAiDone]      = useState(false)
  const [guests,      setGuests]      = useState(4)
  const [notes,       setNotes]       = useState('')
  const [showAiPanel, setShowAiPanel] = useState(false)
  const [aiMessage,   setAiMessage]   = useState('')

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [])

  const shownProducts  = shownIds.map(id => PRODUCTS.find(p => p.id === id)).filter(Boolean)
  const relatedProducts = PRODUCTS
    .filter(p => pkg.categories.includes(p.category) && !shownIds.includes(p.id))
    .slice(0, 12)

  const getQty = id => quantities[id] || 0

  const inc = id => setQuantities(q => ({ ...q, [id]: (q[id] || 0) + 1 }))
  const dec = id => {
    const cur = quantities[id] || 0
    if (cur <= 1) {
      setShownIds(ids => ids.filter(i => i !== id))
      setQuantities(q => { const nq = { ...q }; delete nq[id]; return nq })
    } else {
      setQuantities(q => ({ ...q, [id]: cur - 1 }))
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
      const ids = await buildPackageWithAI(pkg, guests, notes)
      if (!ids.length) throw new Error('No products')
      const newQty = {}
      ids.forEach(id => { newQty[id] = quantities[id] || 1 })
      setShownIds(ids)
      setQuantities(newQty)
      setAiDone(true)
      setShowAiPanel(false)
      setAiMessage('Isla built your ' + pkg.label + ' package for ' + guests + ' guests 🌴')
      toast.success('Package ready! ' + pkg.emoji, { duration: 2000 })
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
      const existing = cartItems.find(i => i.product.id === id)
      if (existing) { updateQuantity(id, existing.quantity + qty) }
      else { for (let i = 0; i < qty; i++) addItem(product) }
      count += qty
    })
    navigator.vibrate?.([20, 50, 20])
    toast.success(count + ' items added to basket! ' + pkg.emoji, { duration: 2000 })
    onBack()
  }

  return (
    <div style={{ background: C.bg, minHeight: '100vh', paddingBottom: 120 }}>

      {/* ── Hero header ── */}
      <div style={{ background: pkg.colour, padding: '20px 20px 28px', position: 'relative' }}>
        <button onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.2)', border: '0.5px solid rgba(255,255,255,0.25)', borderRadius: 20, padding: '7px 14px 7px 10px', cursor: 'pointer', marginBottom: 16 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          <span style={{ fontSize: 12, color: 'white', fontFamily: F.sans, fontWeight: 500 }}>Back</span>
        </button>
        <div style={{ fontSize: 40, marginBottom: 8 }}>{pkg.emoji}</div>
        <div style={{ fontFamily: F.serif, fontSize: 28, color: 'white', marginBottom: 4 }}>{pkg.label}</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontFamily: F.sans, lineHeight: 1.5 }}>{pkg.desc}</div>
        <div style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.2)', borderRadius: 20, padding: '5px 12px' }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontFamily: F.sans }}>✨ {pkg.vibe}</span>
        </div>
      </div>

      <div style={{ padding: '20px 16px 0' }}>

        {/* ── AI Banner ── */}
        {!showAiPanel && (
          <button onClick={() => setShowAiPanel(true)}
            style={{ width: '100%', padding: '14px 18px', background: 'linear-gradient(135deg,rgba(196,104,58,0.25),rgba(232,160,112,0.15))', border: '0.5px solid rgba(196,104,58,0.4)', borderRadius: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, textAlign: 'left' }}>
            <span style={{ fontSize: 28, flexShrink: 0 }}>🤖</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'white', fontFamily: F.sans, marginBottom: 2 }}>
                {aiDone ? 'Rebuild with Isla AI ✨' : 'Let Isla AI build this for you'}
              </div>
              <div style={{ fontSize: 12, color: C.muted, fontFamily: F.sans }}>
                {aiDone ? aiMessage : 'Personalised to your group size and vibe'}
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        )}

        {/* ── AI Panel ── */}
        {showAiPanel && (
          <div style={{ background: 'rgba(196,104,58,0.12)', border: '0.5px solid rgba(196,104,58,0.35)', borderRadius: 16, padding: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'white', fontFamily: F.sans, marginBottom: 14 }}>🤖 Build with Isla AI</div>

            {/* Guest count */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: C.muted, fontFamily: F.sans, marginBottom: 8 }}>How many guests?</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[2, 4, 6, 8, 10, 15].map(n => (
                  <button key={n} onClick={() => setGuests(n)}
                    style={{ flex: 1, padding: '8px 0', background: guests === n ? C.accent : 'rgba(255,255,255,0.08)', border: '0.5px solid ' + (guests === n ? C.accent : 'rgba(255,255,255,0.15)'), borderRadius: 10, color: 'white', fontSize: 13, fontWeight: guests === n ? 600 : 400, cursor: 'pointer', fontFamily: F.sans }}>
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: C.muted, fontFamily: F.sans, marginBottom: 6 }}>Any special requests? (optional)</div>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder={'e.g. "no tobacco", "more snacks", "keep under €200"'}
                rows={2}
                style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.08)', border: '0.5px solid rgba(255,255,255,0.15)', borderRadius: 10, color: 'white', fontSize: 13, fontFamily: F.sans, resize: 'none', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowAiPanel(false)}
                style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.08)', border: '0.5px solid rgba(255,255,255,0.15)', borderRadius: 12, color: 'white', fontSize: 14, cursor: 'pointer', fontFamily: F.sans }}>
                Cancel
              </button>
              <button onClick={runAI} disabled={aiLoading}
                style={{ flex: 2, padding: '12px', background: aiLoading ? 'rgba(196,104,58,0.5)' : C.accent, border: 'none', borderRadius: 12, color: 'white', fontSize: 14, fontWeight: 600, cursor: aiLoading ? 'default' : 'pointer', fontFamily: F.sans, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {aiLoading ? (
                  <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'pkgSpin 0.8s linear infinite' }}/> Isla is building...</>
                ) : '🤖 Build my package'}
              </button>
            </div>
          </div>
        )}

        {/* ── Current selection ── */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.8px', fontFamily: F.sans, marginBottom: 12 }}>
            Your selection · {totalItems} item{totalItems !== 1 ? 's' : ''}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {shownProducts.map(p => (
              <PackageProduct key={p.id} product={p} qty={getQty(p.id)} onInc={() => inc(p.id)} onDec={() => dec(p.id)} />
            ))}
          </div>
        </div>

        {/* ── Add more ── */}
        {relatedProducts.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.8px', fontFamily: F.sans, marginBottom: 12 }}>
              Add more
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {relatedProducts.map(p => (
                <button key={p.id} onClick={() => addMore(p.id)}
                  style={{ background: C.surface, border: '0.5px solid ' + C.border, borderRadius: 14, padding: '12px 10px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{p.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: 'white', fontFamily: F.sans, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: '#E8A070', fontFamily: F.sans, marginTop: 1 }}>€{p.price.toFixed(2)}</div>
                  </div>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 14, color: 'white', lineHeight: 1 }}>+</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Sticky add to basket ── */}
      {totalItems > 0 && (
        <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, padding: '12px 16px 28px', background: 'linear-gradient(to top, ' + C.bg + ' 70%, transparent)', zIndex: 50 }}>
          <button onClick={addAllToBasket}
            style={{ width: '100%', padding: '16px', background: C.accent, border: 'none', borderRadius: 16, color: 'white', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: F.sans, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <span>Add {totalItems} item{totalItems !== 1 ? 's' : ''} to basket</span>
            <span style={{ opacity: 0.8 }}>€{totalCost.toFixed(2)}</span>
          </button>
        </div>
      )}

      <style>{'@keyframes pkgSpin{to{transform:rotate(360deg)}}'}</style>
    </div>
  )
}
