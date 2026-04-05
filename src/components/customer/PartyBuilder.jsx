import { useState, useRef, useEffect } from 'react'
import { PRODUCTS } from '../../lib/products'
import { useCartStore } from '../../lib/store'
import toast from 'react-hot-toast'

// ── AI Package Builder ────────────────────────────────────────
async function buildPartyPackage(details) {
  const catalogue = PRODUCTS.map(p =>
    `${p.id}|${p.name}|${p.category}|€${p.price.toFixed(2)}|${p.popular ? 'popular' : ''}`
  ).join('\n')

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
      max_tokens: 1200,
      messages: [{
        role: 'user',
        content: `You are Isla — Ibiza's best party planner. Build a complete house party package for this event.

PARTY DETAILS:
- Guest count: ${details.guests}
- Vibe: ${details.vibe}
- Duration: ${details.duration} hours
- Budget: ${details.budget === 'no_limit' ? 'No limit — go all out' : `€${details.budget}`}
- Alcohol preference: ${details.alcohol}
- Special requests: ${details.notes || 'None'}
- Time: ${details.time}

AVAILABLE PRODUCTS (id|name|category|price|popular):
${catalogue}

Build a COMPLETE party package. Think like a professional party planner:
- Calculate quantities based on guest count and duration
- Include drinks (enough for everyone for the full duration)
- Add mixers, ice, soft drinks for non-drinkers
- Include snacks and finger food
- Add party essentials (cups, napkins, ice etc.)
- Consider the vibe — beach party vs villa party vs birthday are different

Respond ONLY with this JSON format (no markdown, no extra text):
{
  "package_name": "Creative package name",
  "tagline": "Short exciting description",
  "sections": [
    {
      "title": "Section name e.g. The Bar",
      "emoji": "🍾",
      "items": [
        { "product_id": "ch-001", "quantity": 3, "reason": "Why this was chosen" }
      ]
    }
  ],
  "hosting_tips": ["Tip 1", "Tip 2", "Tip 3"],
  "total_products": 15
}`
      }]
    })
  })

  if (!resp.ok) throw new Error(`API ${resp.status}`)
  const data = await resp.json()
  const raw = data.content?.[0]?.text || '{}'
  return JSON.parse(raw.replace(/```json|```/g, '').trim())
}

// ── Package Item Card ─────────────────────────────────────────
function PackageItemCard({ productId, quantity, reason, onQtyChange }) {
  const product = PRODUCTS.find(p => p.id === productId)
  if (!product) return null
  const [qty, setQty] = useState(quantity)
  const lineTotal = (product.price * qty).toFixed(2)

  const update = (newQty) => {
    setQty(newQty)
    onQtyChange(productId, newQty)
  }

  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom:'0.5px solid rgba(255,255,255,0.07)' }}>
      <span style={{ fontSize:22, flexShrink:0 }}>{product.emoji}</span>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:500, color:'white', fontFamily:'DM Sans,sans-serif', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{product.name}</div>
        <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginTop:1, fontFamily:'DM Sans,sans-serif' }}>{reason}</div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
        <button onClick={() => update(Math.max(0, qty - 1))}
          style={{ width:24, height:24, borderRadius:'50%', background:'rgba(255,255,255,0.1)', border:'none', color:'white', fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>
        <span style={{ fontSize:13, fontWeight:500, color:'white', minWidth:20, textAlign:'center' }}>{qty}</span>
        <button onClick={() => update(qty + 1)}
          style={{ width:24, height:24, borderRadius:'50%', background:'rgba(196,104,58,0.4)', border:'none', color:'white', fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
      </div>
      <div style={{ fontSize:12, fontWeight:500, color:'#E8A070', minWidth:42, textAlign:'right' }}>€{lineTotal}</div>
    </div>
  )
}

// ── Step 1: Party Details Form ────────────────────────────────
function PartyForm({ onBuild }) {
  const [form, setForm] = useState({
    guests: '10', vibe: 'villa_party', duration: '5',
    budget: '300', alcohol: 'yes_mixed', notes: '', time: 'evening',
  })
  const [building, setBuilding] = useState(false)
  const set = f => e => setForm(prev => ({ ...prev, [f]: e.target.value || e }))

  const VIBES = [
    { value:'villa_party',   label:'🏡 Villa Party',       desc:'Classic Ibiza house party' },
    { value:'pool_party',    label:'💦 Pool Party',         desc:'Floats, music, cold drinks' },
    { value:'beach_party',   label:'🏖️ Beach Party',        desc:'Sand, sea and sundowners' },
    { value:'daytime_party', label:'☀️ Daytime Party',      desc:'Afternoon fun in the sun' },
    { value:'night_party',   label:'🌙 Night Party',        desc:'Late night, good vibes' },
    { value:'birthday',      label:'🎂 Birthday Party',     desc:'Make it unforgettable' },
    { value:'special_occasion', label:'🥂 Special Occasion', desc:'Anniversary, engagement, celebration' },
    { value:'pre_drinks',    label:'🍹 Pre-drinks',         desc:'Getting the night started' },
    { value:'girls_night',   label:'💅 Girls Night',        desc:'Champagne and good times' },
    { value:'lads_night',    label:'🍺 Lads Night',         desc:'Beers, shots and banter' },
    { value:'date_night',    label:'💕 Date Night',         desc:'Intimate and romantic' },
    { value:'family_gathering', label:'👨‍👩‍👧 Family Gathering', desc:'All ages, relaxed vibes' },
  ]

  const handle = async () => {
    setBuilding(true)
    try {
      const pkg = await buildPartyPackage(form)
      onBuild(pkg, form)
    } catch (err) {
      console.error(err)
      toast.error('Could not build package — please try again')
    }
    setBuilding(false)
  }

  const sel = { width:'100%', padding:'11px 14px', background:'rgba(255,255,255,0.08)', border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:10, fontFamily:'DM Sans,sans-serif', fontSize:14, color:'white', outline:'none', marginBottom:14, boxSizing:'border-box' }

  return (
    <div style={{ padding:'0 16px 24px' }}>
      {/* Header */}
      <div style={{ textAlign:'center', padding:'28px 0 24px' }}>
        <div style={{ fontSize:52, marginBottom:12 }}>🎉</div>
        <div style={{ fontFamily:'DM Serif Display,serif', fontSize:28, color:'white', marginBottom:6 }}>Party Package Builder</div>
        <div style={{ fontSize:14, color:'rgba(255,255,255,0.5)', lineHeight:1.5 }}>Tell Isla about your party and she will build the perfect package — delivered to your door</div>
      </div>

      {/* Vibe selector */}
      <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:10, fontFamily:'DM Sans,sans-serif' }}>What kind of party?</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
        {VIBES.map(v => (
          <div key={v.value} onClick={() => setForm(prev => ({ ...prev, vibe: v.value }))}
            style={{ padding:'11px 12px', background: form.vibe===v.value?'rgba(196,104,58,0.25)':'rgba(255,255,255,0.06)', border:`0.5px solid ${form.vibe===v.value?'rgba(196,104,58,0.5)':'rgba(255,255,255,0.1)'}`, borderRadius:12, cursor:'pointer', transition:'all 0.15s' }}>
            <div style={{ fontSize:13, fontWeight:500, color:'white', fontFamily:'DM Sans,sans-serif' }}>{v.label}</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginTop:2, fontFamily:'DM Sans,sans-serif' }}>{v.desc}</div>
          </div>
        ))}
      </div>

      {/* Numbers */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:4 }}>
        <div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', marginBottom:6, fontFamily:'DM Sans,sans-serif' }}>Number of guests</div>
          <select value={form.guests} onChange={set('guests')} style={sel}>
            {['2','4','6','8','10','12','15','20','25','30','40','50+'].map(n => <option key={n} value={n}>{n} guests</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', marginBottom:6, fontFamily:'DM Sans,sans-serif' }}>Duration</div>
          <select value={form.duration} onChange={set('duration')} style={sel}>
            {['2','3','4','5','6','8','all night'].map(h => <option key={h} value={h}>{h === 'all night' ? 'All night' : `${h} hours`}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:4 }}>
        <div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', marginBottom:6, fontFamily:'DM Sans,sans-serif' }}>Time of party</div>
          <select value={form.time} onChange={set('time')} style={sel}>
            <option value="afternoon">Afternoon</option>
            <option value="evening">Evening</option>
            <option value="night">Late night</option>
            <option value="all_day">All day</option>
          </select>
        </div>
        <div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', marginBottom:6, fontFamily:'DM Sans,sans-serif' }}>Alcohol</div>
          <select value={form.alcohol} onChange={set('alcohol')} style={sel}>
            <option value="yes_mixed">Yes — mixed drinks</option>
            <option value="yes_beer_wine">Beer and wine only</option>
            <option value="yes_spirits">Spirits focused</option>
            <option value="yes_champagne">Champagne heavy</option>
            <option value="no">No alcohol</option>
          </select>
        </div>
      </div>

      <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', marginBottom:6, fontFamily:'DM Sans,sans-serif' }}>Budget</div>
      <select value={form.budget} onChange={set('budget')} style={sel}>
        <option value="100">Up to €100</option>
        <option value="200">Up to €200</option>
        <option value="300">Up to €300</option>
        <option value="500">Up to €500</option>
        <option value="750">Up to €750</option>
        <option value="1000">Up to €1,000</option>
        <option value="no_limit">No limit — go all out 🚀</option>
      </select>

      <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', marginBottom:6, fontFamily:'DM Sans,sans-serif' }}>Special requests (optional)</div>
      <textarea value={form.notes} onChange={set('notes')} rows={2}
        placeholder="e.g. Someone is vegetarian, prefer Spanish wines, need cigar options..."
        style={{ ...sel, resize:'none', lineHeight:1.5, marginBottom:20 }} />

      <button onClick={handle} disabled={building}
        style={{ width:'100%', padding:'16px', background: building?'rgba(196,104,58,0.4)':'linear-gradient(135deg,#C4683A,#E8854A)', color:'white', border:'none', borderRadius:14, fontFamily:'DM Sans,sans-serif', fontSize:16, fontWeight:500, cursor: building?'default':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10, boxShadow: building?'none':'0 4px 20px rgba(196,104,58,0.4)' }}>
        {building ? (
          <>
            <div style={{ width:18, height:18, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'white', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
            Isla is building your package...
          </>
        ) : (
          <>✨ Build My Party Package</>
        )}
      </button>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

// ── Step 2: Package Result ────────────────────────────────────
function PackageResult({ pkg, details, onRebuild, onBack }) {
  const { addItem, updateQuantity, items } = useCartStore()
  const [quantities, setQuantities] = useState(() => {
    const q = {}
    pkg.sections?.forEach(section => {
      section.items?.forEach(item => { q[item.product_id] = item.quantity })
    })
    return q
  })
  const [adding, setAdding] = useState(false)

  const totalItems = Object.values(quantities).reduce((s, q) => s + q, 0)
  const totalCost = Object.entries(quantities).reduce((sum, [pid, qty]) => {
    const p = PRODUCTS.find(p => p.id === pid)
    return sum + (p ? p.price * qty : 0)
  }, 0)

  const handleQtyChange = (productId, qty) => {
    setQuantities(prev => ({ ...prev, [productId]: qty }))
  }

  const addAllToBasket = async () => {
    setAdding(true)
    let count = 0
    for (const [productId, qty] of Object.entries(quantities)) {
      if (qty <= 0) continue
      const product = PRODUCTS.find(p => p.id === productId)
      if (!product) continue
      const existing = items.find(i => i.product.id === productId)
      if (existing) updateQuantity(productId, qty)
      else { for (let i = 0; i < qty; i++) addItem(product) }
      count++
    }
    await new Promise(r => setTimeout(r, 400))
    setAdding(false)
    toast.success(`${count} products added to basket 🎉`, { duration: 3000 })
    onBack()
  }

  return (
    <div style={{ padding:'0 0 100px' }}>
      {/* Package header */}
      <div style={{ background:'linear-gradient(135deg,rgba(196,104,58,0.3),rgba(43,122,139,0.3))', padding:'24px 16px', textAlign:'center' }}>
        <div style={{ fontSize:44, marginBottom:10 }}>🎉</div>
        <div style={{ fontFamily:'DM Serif Display,serif', fontSize:24, color:'white', marginBottom:4 }}>{pkg.package_name}</div>
        <div style={{ fontSize:14, color:'rgba(255,255,255,0.6)', fontFamily:'DM Sans,sans-serif' }}>{pkg.tagline}</div>
        <div style={{ display:'flex', justifyContent:'center', gap:16, marginTop:14 }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:20, fontWeight:500, color:'#E8A070' }}>{details.guests}</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)' }}>guests</div>
          </div>
          <div style={{ width:1, background:'rgba(255,255,255,0.1)' }} />
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:20, fontWeight:500, color:'#E8A070' }}>{totalItems}</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)' }}>items</div>
          </div>
          <div style={{ width:1, background:'rgba(255,255,255,0.1)' }} />
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:20, fontWeight:500, color:'#E8A070' }}>€{totalCost.toFixed(0)}</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)' }}>total</div>
          </div>
        </div>
      </div>

      <div style={{ padding:'0 16px' }}>
        {/* Sections */}
        {pkg.sections?.map((section, si) => (
          <div key={si} style={{ marginTop:20 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
              <span style={{ fontSize:20 }}>{section.emoji}</span>
              <div style={{ fontFamily:'DM Serif Display,serif', fontSize:18, color:'white' }}>{section.title}</div>
            </div>
            <div style={{ background:'rgba(255,255,255,0.05)', borderRadius:12, padding:'4px 14px' }}>
              {section.items?.map((item, ii) => (
                <PackageItemCard
                  key={ii}
                  productId={item.product_id}
                  quantity={quantities[item.product_id] ?? item.quantity}
                  reason={item.reason}
                  onQtyChange={handleQtyChange}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Hosting tips */}
        {pkg.hosting_tips?.length > 0 && (
          <div style={{ marginTop:20, background:'rgba(43,122,139,0.15)', border:'0.5px solid rgba(43,122,139,0.3)', borderRadius:12, padding:'14px 16px' }}>
            <div style={{ fontSize:13, fontWeight:500, color:'#7ECFE0', marginBottom:10, fontFamily:'DM Sans,sans-serif' }}>🌴 Isla's hosting tips</div>
            {pkg.hosting_tips.map((tip, i) => (
              <div key={i} style={{ fontSize:12, color:'rgba(255,255,255,0.6)', marginBottom:6, paddingLeft:12, position:'relative', fontFamily:'DM Sans,sans-serif', lineHeight:1.5 }}>
                <span style={{ position:'absolute', left:0, color:'rgba(43,122,139,0.8)' }}>·</span>
                {tip}
              </div>
            ))}
          </div>
        )}

        {/* Rebuild option */}
        <button onClick={onRebuild}
          style={{ width:'100%', marginTop:16, padding:'12px', background:'rgba(255,255,255,0.06)', border:'0.5px solid rgba(255,255,255,0.12)', borderRadius:12, color:'rgba(255,255,255,0.6)', fontSize:13, cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
          ↺ Rebuild with different options
        </button>
      </div>

      {/* Sticky add to basket */}
      <div style={{ position:'fixed', bottom:68, left:0, right:0, maxWidth:480, margin:'0 auto', padding:'12px 16px', background:'rgba(10,30,40,0.95)', backdropFilter:'blur(16px)', borderTop:'0.5px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
          <div style={{ fontSize:13, color:'rgba(255,255,255,0.5)', fontFamily:'DM Sans,sans-serif' }}>{totalItems} items</div>
          <div style={{ fontSize:18, fontWeight:500, color:'#E8A070' }}>€{totalCost.toFixed(2)}</div>
        </div>
        <button onClick={addAllToBasket} disabled={adding}
          style={{ width:'100%', padding:'15px', background: adding?'rgba(196,104,58,0.4)':'#C4683A', color:'white', border:'none', borderRadius:12, fontFamily:'DM Sans,sans-serif', fontSize:15, fontWeight:500, cursor: adding?'default':'pointer', boxShadow:'0 4px 20px rgba(196,104,58,0.4)', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
          {adding ? 'Adding to basket...' : '🛒 Add Entire Package to Basket'}
        </button>
      </div>
    </div>
  )
}

// ── Main PartyBuilder ─────────────────────────────────────────
export default function PartyBuilder({ onBack }) {
  const [step, setStep]       = useState('form') // form | result
  const [pkg, setPkg]         = useState(null)
  const [details, setDetails] = useState(null)

  const handleBuild = (builtPkg, formDetails) => {
    setPkg(builtPkg)
    setDetails(formDetails)
    setStep('result')
  }

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(170deg,#0A2A38 0%,#0D3545 40%,#1A5060 100%)', paddingBottom:20 }}>
      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,#0D3B4A,#1A5263)', padding:'16px 16px 14px', position:'sticky', top:0, zIndex:50 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={onBack}
            style={{ width:36, height:36, background:'rgba(255,255,255,0.1)', border:'0.5px solid rgba(255,255,255,0.18)', borderRadius:'50%', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          </button>
          <div>
            <div style={{ fontFamily:'DM Serif Display,serif', fontSize:20, color:'white', lineHeight:1 }}>Party Builder</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.45)', marginTop:2 }}>AI-curated packages · Delivered to your door</div>
          </div>
        </div>
      </div>

      {step === 'form' && <PartyForm onBuild={handleBuild} />}
      {step === 'result' && pkg && (
        <PackageResult
          pkg={pkg}
          details={details}
          onRebuild={() => setStep('form')}
          onBack={onBack}
        />
      )}
    </div>
  )
}
