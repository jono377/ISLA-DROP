import { useState, useEffect } from 'react'
import { PRODUCTS } from '../../lib/products'
import { useCartStore } from '../../lib/store'
import { useT_ctx } from '../../i18n/TranslationContext'
import toast from 'react-hot-toast'

const ARRIVAL_PACKAGES = [
  {
    id: 'solo_traveller', emoji: '🧳', label: 'Solo Traveller',
    desc: 'Everything you need for your first night — water, snacks, suncream, paracetamol and a celebratory drink.',
    productIds: ['wt-001','wt-003','sn-029','sd-003','es-013','wl-014','sp-004'],
  },
  {
    id: 'romantic', emoji: '💕', label: 'Romantic Arrival',
    desc: 'A beautiful welcome for two — premium champagne on ice, fresh garnish, water and something indulgent.',
    productIds: ['ch-001','wt-001','ic-001','sn-029','fr-001','wl-014','ck-013'],
  },
  {
    id: 'group_landing', emoji: '🎉', label: 'Group Landing Kit',
    desc: 'Stock the villa for the squad — spirits, mixers, cold beers, ice, snacks and all the essentials.',
    productIds: ['sp-001','sp-004','sp-035','br-001','sd-001','sd-003','ic-002','sn-001','sn-002','wt-001','wl-014'],
  },
  {
    id: 'villa_welcome', emoji: '🏡', label: 'Villa Welcome Package',
    desc: 'A fully stocked villa bar — premium spirits, champagne, wine, mixers, garnish, ice and snacks.',
    productIds: ['ch-001','wn-021','sp-001','sp-004','sd-001','sd-003','ic-002','ic-001','fr-001','fr-002','sn-001','sn-029'],
  },
  {
    id: 'wellness', emoji: '🌿', label: 'Wellness Arrival',
    desc: 'Reset and recharge — coconut water, electrolytes, vitamins, fresh fruit and healthy snacks.',
    productIds: ['wt-001','wt-002','wt-003','wl-014','wl-013','wl-012','sd-019','sn-029'],
  },
  {
    id: 'family', emoji: '👨‍👩‍👧‍👦', label: 'Family Arrival',
    desc: 'Everything for the whole family — soft drinks, water, snacks, suncream and holiday essentials.',
    productIds: ['wt-001','wt-002','sd-019','sd-001','sn-001','sn-002','es-013','wl-014'],
  },
  {
    id: 'vip', emoji: '👑', label: 'VIP Arrival',
    desc: 'The full luxury treatment — Dom Pérignon on ice, premium spirits, garnish kit, wellness and caviar snacks.',
    productIds: ['ch-002','ch-001','sp-001','ic-001','ic-002','fr-001','ck-013','wl-014','wt-001','sn-029'],
  },
]

function PackageCard({ pkg, onSelect, selected }) {
  const products = pkg.productIds.map(id => PRODUCTS.find(p => p.id === id)).filter(Boolean)
  const total = products.reduce((s, p) => s + p.price, 0)

  return (
    <div onClick={() => onSelect(pkg.id)}
      style={{ background: selected ? 'rgba(196,104,58,0.15)' : 'rgba(255,255,255,0.05)', border: '0.5px solid ' + (selected ? 'rgba(196,104,58,0.5)' : 'rgba(255,255,255,0.1)'), borderRadius: 16, padding: '16px', marginBottom: 12, cursor: 'pointer', transition: 'all 0.15s' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 28 }}>{pkg.emoji}</span>
          <div>
            <div style={{ fontFamily: 'DM Serif Display,serif', fontSize: 17, color: 'white' }}>{pkg.label}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>€{total.toFixed(2)} · {products.length} items</div>
          </div>
        </div>
        <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid ' + (selected ? '#C4683A' : 'rgba(255,255,255,0.3)'), background: selected ? '#C4683A' : 'none', flexShrink: 0, marginTop: 4 }}>
          {selected && <div style={{ width: 8, height: 8, background: 'white', borderRadius: '50%', margin: '4px auto' }} />}
        </div>
      </div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, marginBottom: 10 }}>{pkg.desc}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {products.map(p => (
          <span key={p.id} style={{ fontSize: 11, background: 'rgba(255,255,255,0.08)', borderRadius: 20, padding: '3px 8px', color: 'rgba(255,255,255,0.6)' }}>
            {p.emoji} {p.name.split(' ').slice(0, 3).join(' ')}
          </span>
        ))}
      </div>
    </div>
  )
}

function CustomisePanel({ pkg, onDone }) {
  const { addItem } = useCartStore()
  const baseProducts = pkg.productIds.map(id => PRODUCTS.find(p => p.id === id)).filter(Boolean)
  const [selected, setSelected] = useState(new Set(pkg.productIds))
  const allProducts = PRODUCTS.filter(p =>
    ['water','soft_drinks','spirits','beer_cider','champagne','wine','snacks',
     'wellness','essentials','ice','fresh','cocktail'].includes(p.category)
  ).slice(0, 60)

  const toggle = (id) => {
    const s = new Set(selected)
    if (s.has(id)) s.delete(id)
    else s.add(id)
    setSelected(s)
  }

  const addAll = () => {
    let count = 0
    for (const id of selected) {
      const p = PRODUCTS.find(pr => pr.id === id)
      if (p) { addItem(p); count++ }
    }
    toast.success(count + ' items added to basket! 🌴')
    onDone()
  }

  const total = [...selected].map(id => PRODUCTS.find(p => p.id === id)).filter(Boolean).reduce((s, p) => s + p.price, 0)

  return (
    <div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 14, fontFamily: 'DM Sans,sans-serif' }}>
        Tap items to add or remove from your package. Your selection: {selected.size} items · €{total.toFixed(2)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20, maxHeight: 400, overflowY: 'auto' }}>
        {allProducts.map(p => {
          const on = selected.has(p.id)
          return (
            <div key={p.id} onClick={() => toggle(p.id)}
              style={{ background: on ? 'rgba(196,104,58,0.2)' : 'rgba(255,255,255,0.05)', border: '0.5px solid ' + (on ? '#C4683A' : 'rgba(255,255,255,0.1)'), borderRadius: 10, padding: '8px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>{p.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                <div style={{ fontSize: 10, color: '#E8A070' }}>€{p.price.toFixed(2)}</div>
              </div>
              {on && <span style={{ fontSize: 14, color: '#C4683A', flexShrink: 0 }}>✓</span>}
            </div>
          )
        })}
      </div>
      <button onClick={addAll} disabled={selected.size === 0}
        style={{ width: '100%', padding: '14px', background: '#C4683A', border: 'none', borderRadius: 12, color: 'white', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>
        Add {selected.size} items to basket · €{total.toFixed(2)}
      </button>
    </div>
  )
}

function IslaDesignPanel({ onDone }) {
  const { addItem } = useCartStore()
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const design = async () => {
    if (!prompt.trim()) return
    setLoading(true)
    try {
      const catalogue = PRODUCTS.filter(p =>
        ['water','soft_drinks','spirits','beer_cider','champagne','wine','snacks',
         'wellness','essentials','ice','fresh','cocktail'].includes(p.category)
      ).map(p => p.id + '|' + p.name + '|€' + p.price.toFixed(2)).join('\n')

      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
          'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY || '',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 600,
          messages: [{
            role: 'user',
            content: 'You are Isla, the Ibiza delivery AI. Design a perfect arrival package for this request: "' + prompt + '"\n\nCATALOGUE (id|name|price):\n' + catalogue + '\n\nReturn JSON only:\n{"items":[{"id":"product-id","reason":"why this fits"}],"message":"warm welcome message from Isla, max 2 sentences"}\nMax 8 items. Only use real IDs from catalogue.'
          }]
        })
      })
      if (!resp.ok) throw new Error('AI unavailable')
      const data = await resp.json()
      const raw = data.content?.[0]?.text || '{}'
      const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())
      const products = (parsed.items || []).map(item => ({
        product: PRODUCTS.find(p => p.id === item.id),
        reason: item.reason
      })).filter(i => i.product)
      setResult({ products, message: parsed.message })
    } catch {
      toast.error('Isla is busy — please try again')
    }
    setLoading(false)
  }

  if (result) return (
    <div>
      <div style={{ background: 'rgba(43,122,139,0.15)', border: '0.5px solid rgba(43,122,139,0.3)', borderRadius: 12, padding: '12px 14px', marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: '#7ECFE0', marginBottom: 4 }}>✨ Isla says</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>{result.message}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {result.products.map(({ product, reason }) => (
          <div key={product.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '10px 12px' }}>
            <span style={{ fontSize: 22 }}>{product.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: 'white', fontWeight: 500 }}>{product.name}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{reason}</div>
            </div>
            <span style={{ fontSize: 13, color: '#E8A070', fontWeight: 600 }}>€{product.price.toFixed(2)}</span>
          </div>
        ))}
      </div>
      <button onClick={() => {
        result.products.forEach(({ product }) => addItem(product))
        toast.success('Isla package added to basket! 🌴')
        onDone()
      }}
        style={{ width: '100%', padding: '14px', background: '#C4683A', border: 'none', borderRadius: 12, color: 'white', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', marginBottom: 10 }}>
        Add all to basket · €{result.products.reduce((s, { product }) => s + product.price, 0).toFixed(2)}
      </button>
      <button onClick={() => setResult(null)}
        style={{ width: '100%', padding: '10px', background: 'none', border: '0.5px solid rgba(255,255,255,0.2)', borderRadius: 10, color: 'rgba(255,255,255,0.5)', fontSize: 13, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>
        Try a different request
      </button>
    </div>
  )

  return (
    <div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 14, lineHeight: 1.6 }}>
        Tell Isla what you need and she will design the perfect arrival package for you.
      </div>
      <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
        placeholder="e.g. I am arriving with 4 friends for a week, we love cocktails and the beach..."
        rows={3}
        style={{ width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.08)', border: '0.5px solid rgba(255,255,255,0.2)', borderRadius: 12, color: 'white', fontFamily: 'DM Sans,sans-serif', fontSize: 13, outline: 'none', resize: 'none', boxSizing: 'border-box', marginBottom: 12 }}
      />
      <button onClick={design} disabled={loading || !prompt.trim()}
        style={{ width: '100%', padding: '14px', background: loading ? 'rgba(196,104,58,0.5)' : '#C4683A', border: 'none', borderRadius: 12, color: 'white', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>
        {loading ? '✨ Isla is designing your package...' : '✨ Design my arrival with Isla'}
      </button>
    </div>
  )
}

export default function ArrivalPackage({ onBack }) {
  const t = useT_ctx()
  const { addItem } = useCartStore()
  const [selected, setSelected] = useState(null)
  const [mode, setMode] = useState('select')  // select | customise | isla

  // Scroll to top on mount
  useEffect(() => {
    // Fire multiple times to override browser scroll restoration after content loads
    window.scrollTo({ top: 0, behavior: 'instant' })
    const t1 = setTimeout(() => window.scrollTo({ top: 0, behavior: 'instant' }), 50)
    const t2 = setTimeout(() => window.scrollTo({ top: 0, behavior: 'instant' }), 150)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  const selectedPkg = ARRIVAL_PACKAGES.find(p => p.id === selected)

  const addAll = () => {
    if (!selectedPkg) return
    selectedPkg.productIds.forEach(id => {
      const p = PRODUCTS.find(pr => pr.id === id)
      if (p) addItem(p)
    })
    toast.success('Package added to basket! 🌴')
    onBack?.()
  }

  return (
    <div style={{ background: 'linear-gradient(170deg,#0A2A38,#0D3545)', minHeight: '100vh', paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ padding: '20px 16px 16px', borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 13, fontFamily: 'DM Sans,sans-serif', padding: 0, marginBottom: 12 }}>
          ← {(t.back || 'Back') || 'Back'}
        </button>
        <div style={{ fontFamily: 'DM Serif Display,serif', fontSize: 26, color: 'white' }}>
          {(t.welcomeWhiteIsle || 'Welcome to the White Isle') || 'Welcome to the White Isle'} 🌴
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4, fontFamily: 'DM Sans,sans-serif' }}>
          Get everything delivered before you even unpack
        </div>
      </div>

      <div style={{ padding: '20px 16px' }}>
        {/* Mode tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[
            { key: 'select', label: '📦 Ready-made' },
            { key: 'isla', label: '✨ Ask Isla' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setMode(tab.key)}
              style={{ flex: 1, padding: '10px', background: mode === tab.key ? 'rgba(196,104,58,0.3)' : 'rgba(255,255,255,0.06)', border: '0.5px solid ' + (mode === tab.key ? 'rgba(196,104,58,0.6)' : 'rgba(255,255,255,0.12)'), borderRadius: 10, color: mode === tab.key ? '#E8A070' : 'rgba(255,255,255,0.6)', fontSize: 13, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', fontWeight: mode === tab.key ? 500 : 400 }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Select mode */}
        {mode === 'select' && !selectedPkg && (
          <>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12, fontFamily: 'DM Sans,sans-serif' }}>
              Choose your package
            </div>
            {ARRIVAL_PACKAGES.map(pkg => (
              <PackageCard key={pkg.id} pkg={pkg} selected={selected === pkg.id} onSelect={setSelected} />
            ))}
          </>
        )}

        {/* Package selected - actions */}
        {mode === 'select' && selectedPkg && (
          <>
            <PackageCard pkg={selectedPkg} selected={true} onSelect={() => setSelected(null)} />
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button onClick={addAll}
                style={{ flex: 2, padding: '14px', background: '#C4683A', border: 'none', borderRadius: 12, color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>
                {(t.addAllToBasket || 'Add all to basket') || 'Add all to basket'}
              </button>
              <button onClick={() => setMode('customise')}
                style={{ flex: 1, padding: '14px', background: 'rgba(255,255,255,0.08)', border: '0.5px solid rgba(255,255,255,0.2)', borderRadius: 12, color: 'white', fontSize: 14, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>
                ✏️ Customise
              </button>
            </div>
            <button onClick={() => setSelected(null)}
              style={{ width: '100%', padding: '10px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 13, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', marginTop: 8 }}>
              ← Choose a different package
            </button>
          </>
        )}

        {/* Customise mode */}
        {mode === 'customise' && selectedPkg && (
          <>
            <div style={{ fontFamily: 'DM Serif Display,serif', fontSize: 18, color: 'white', marginBottom: 12 }}>
              Customise your {selectedPkg.label}
            </div>
            <CustomisePanel pkg={selectedPkg} onDone={() => { setMode('select'); onBack?.() }} />
            <button onClick={() => setMode('select')}
              style={{ width: '100%', padding: '10px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 13, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', marginTop: 8 }}>
              ← Back to packages
            </button>
          </>
        )}

        {/* Isla AI mode */}
        {mode === 'isla' && (
          <IslaDesignPanel onDone={() => onBack?.()} />
        )}
      </div>
    </div>
  )
}
