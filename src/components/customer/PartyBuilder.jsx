import { useState, useRef } from 'react'
import { PRODUCTS } from '../../lib/products'
import { useCartStore } from '../../lib/store'
import toast from 'react-hot-toast'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

// ── AI Package Builder ────────────────────────────────────────
async function buildPackage(details) {
  // Send focused catalogue — drinks, food, party essentials (skip wellness/beach/essentials for smaller prompt)
  const relevantCats = ['spirits','champagne','wine','beer_cider','soft_drinks','water','ice','snacks','party','fresh','tobacco']
  const catalogue = PRODUCTS
    .filter(p => relevantCats.includes(p.category))
    .map(p => p.id + '|' + p.name + '|' + p.category + '|€' + p.price.toFixed(2) + (p.popular ? '|*' : ''))
    .join('\n')

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
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: 'You are Isla, the greatest party planner in Ibiza. No budget is too big, no party too ambitious. You have planned 1000-person raves, intimate villa soirees, legendary boat parties. Build the PERFECT package right now.\n\nEVENT DETAILS:\nType: ' + details.packageType + '\nVibe: ' + details.vibe + '\nGuests: ' + details.guests + '\nDuration: ' + details.duration + ' hours\nBudget: ' + (details.budget === 'no_limit' ? 'UNLIMITED - go all out' : 'up to EUR' + details.budget) + '\nAlcohol: ' + details.alcohol + '\nTime of day: ' + details.time + '\nSpecial requests: ' + (details.notes || 'none') + '\n\nAVAILABLE PRODUCTS (id|name|category|price|*=popular):\n' + catalogue + '\n\nRULES:\n- ONLY use product IDs from the catalogue above - never invent IDs\n- Max 6 sections, max 8 items per section\n- Quantities must be realistic integers\n- Always include ice and mixers for spirit events\n- Always include soft drink alternatives\n- Reason field: be specific about why and how many\n\nRespond with ONLY valid JSON, no markdown, no text before or after:\n{"package_name":"name","tagline":"one line","hero_emoji":"emoji","sections":[{"title":"title","emoji":"emoji","items":[{"product_id":"id","quantity":1,"reason":"why"}]}],"hosting_tips":["tip1","tip2","tip3"],"isla_note":"personal note"}'
      }]
    })
  })

  if (!resp.ok) {
    const errText = await resp.text().catch(() => '')
    throw new Error('API ' + resp.status + ': ' + errText.slice(0, 100))
  }
  const data = await resp.json()
  const raw = data.content?.[0]?.text || '{}'
  const cleaned = raw.replace(/```json|```/g, '').trim()
  
  // Try to parse — if truncated JSON, attempt to recover
  try {
    return JSON.parse(cleaned)
  } catch {
    // Try to extract partial JSON up to last complete section
    const lastBrace = cleaned.lastIndexOf('}')
    const lastBracket = cleaned.lastIndexOf(']')
    const cutPoint = Math.max(lastBrace, lastBracket)
    if (cutPoint > 100) {
      try {
        // Close any open arrays/objects to make valid JSON
        let partial = cleaned.slice(0, cutPoint + 1)
        // Count unclosed brackets
        let opens = (partial.match(/\[/g)||[]).length - (partial.match(/\]/g)||[]).length
        let braces = (partial.match(/\{/g)||[]).length - (partial.match(/\}/g)||[]).length
        for (let i = 0; i < opens; i++) partial += ']'
        for (let i = 0; i < braces; i++) partial += '}'
        return JSON.parse(partial)
      } catch {}
    }
    throw new Error('JSON parse failed — response may have been truncated')
  }
}

// ── Package Item Card ─────────────────────────────────────────
function PackageItemCard({ productId, quantity, reason, onQtyChange }) {
  const product = PRODUCTS.find(p => p.id === productId)
  if (!product) return null
  const [qty, setQty] = useState(quantity)

  const update = (n) => { const v = Math.max(0, n); setQty(v); onQtyChange(productId, v) }

  return (
    <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 0', borderBottom:'0.5px solid rgba(255,255,255,0.07)' }}>
      <span style={{ fontSize:22, flexShrink:0, marginTop:2 }}>{product.emoji}</span>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:500, color:'white', fontFamily:'DM Sans,sans-serif' }}>{product.name}</div>
        <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginTop:2, lineHeight:1.4 }}>{reason}</div>
      </div>
      <div style={{ flexShrink:0, textAlign:'right' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, justifyContent:'flex-end', marginBottom:3 }}>
          <button onClick={() => update(qty-1)} style={{ width:22, height:22, borderRadius:'50%', background:'rgba(255,255,255,0.1)', border:'none', color:'white', fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>
          <span style={{ fontSize:13, fontWeight:500, color:'white', minWidth:18, textAlign:'center' }}>{qty}</span>
          <button onClick={() => update(qty+1)} style={{ width:22, height:22, borderRadius:'50%', background:'rgba(196,104,58,0.5)', border:'none', color:'white', fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
        </div>
        <div style={{ fontSize:12, color:'#E8A070' }}>€{(product.price * qty).toFixed(2)}</div>
      </div>
    </div>
  )
}

// ── Package Types ─────────────────────────────────────────────
const PACKAGE_TYPES = [
  {
    id: 'design_night', emoji:'🌙', label:'Design Your Night',
    desc:'AI plans your perfect Ibiza night — drinks, timing, everything',
    color:'linear-gradient(135deg,rgba(90,30,120,0.6),rgba(30,60,120,0.6))',
    vibes: [
      { value:'club_night',      label:'🎉 Club Night',          desc:'Pacha, Ushuaia, Hi Ibiza' },
      { value:'villa_party',     label:'🏡 Villa Party',          desc:'House party, your space' },
      { value:'ladies_night',    label:'👑 Ladies Night',         desc:'Champagne, classy cocktails, VIP vibes' },
      { value:'boys_night',      label:'🍺 Boys Night',           desc:'Beers, shots, good energy' },
      { value:'gentlemans',      label:"🎩 Gentleman's Evening",  desc:'Premium spirits, cigars, sophistication' },
      { value:'pre_drinks',      label:'🍹 Pre-drinks',           desc:'Getting the night started right' },
      { value:'date_night',      label:'💕 Date Night',           desc:'Intimate, romantic, memorable' },
      { value:'birthday_night',  label:'🎂 Birthday Night',       desc:'Make it legendary' },
    ]
  },
  {
    id: 'design_day', emoji:'☀️', label:'Design Your Day',
    desc:'Build the ultimate Ibiza day from sunrise to sunset',
    color:'linear-gradient(135deg,rgba(196,104,58,0.5),rgba(200,140,30,0.5))',
    vibes: [
      { value:'pool_party',      label:'💦 Pool Party',       desc:'Floats, music, cold drinks' },
      { value:'beach_day',       label:'🏖️ Beach Day',         desc:'Sand, sea and sundowners' },
      { value:'daytime_party',   label:'☀️ Daytime Party',    desc:'Afternoon fun in the sun' },
      { value:'boat_day',        label:'⛵ Boat Day',          desc:'Out on the water all day' },
      { value:'special_occasion', label:'🥂 Special Occasion', desc:'Anniversary, engagement' },
      { value:'birthday_day',    label:'🎂 Birthday Day',     desc:'Celebrate in style' },
      { value:'family_gathering', label:'👨‍👩‍👧 Family Gathering', desc:'All ages, relaxed vibes' },
      { value:'wellness_day',    label:'🧘 Wellness Day',     desc:'Mindful, light, refreshing' },
    ]
  },
]

// ── Package Form ──────────────────────────────────────────────
function PackageForm({ packageType, onBuild, onBack }) {
  const pt = PACKAGE_TYPES.find(p => p.id === packageType)
  const [form, setForm] = useState({
    vibe: pt.vibes[0].value, guests:'10', duration:'5',
    budget:'300', alcohol:'yes_mixed', notes:'', time: packageType === 'design_night' ? 'night' : 'afternoon',
    packageType,
  })
  const [building, setBuilding] = useState(false)
  const set = f => e => setForm(prev => ({ ...prev, [f]: typeof e === 'string' ? e : e.target.value }))

  const handle = async () => {
    setBuilding(true)
    try {
      const pkg = await buildPackage(form)
      onBuild(pkg, form)
    } catch (err) {
      console.error('Package build error:', err)
      // Retry once automatically
      try {
        const pkg = await buildPackage({ ...form, retry: true })
        onBuild(pkg, form)
        return
      } catch (err2) {
        console.error('Retry failed:', err2)
        toast.error('Isla is very busy right now — tap Build again and she will get it done!')
      }
    }
    setBuilding(false)
  }

  const sel = { width:'100%', padding:'11px 14px', background:'rgba(255,255,255,0.08)', border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:10, fontFamily:'DM Sans,sans-serif', fontSize:14, color:'white', outline:'none', marginBottom:14, boxSizing:'border-box' }

  return (
    <div style={{ padding:'0 16px 100px' }}>
      <div style={{ textAlign:'center', padding:'24px 0 20px' }}>
        <div style={{ fontSize:44, marginBottom:10 }}>{pt.emoji}</div>
        <div style={{ fontFamily:'DM Serif Display,serif', fontSize:26, color:'white', marginBottom:6 }}>{pt.label}</div>
        <div style={{ fontSize:13, color:'rgba(255,255,255,0.5)', lineHeight:1.5 }}>{pt.desc}</div>
      </div>

      <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:10, fontFamily:'DM Sans,sans-serif' }}>What kind of {packageType === 'design_night' ? 'night' : 'day'}?</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:18 }}>
        {pt.vibes.map(v => (
          <div key={v.value} onClick={() => setForm(prev => ({ ...prev, vibe: v.value }))}
            style={{ padding:'11px 12px', background: form.vibe===v.value?'rgba(196,104,58,0.25)':'rgba(255,255,255,0.06)', border:'0.5px solid ' + (form.vibe===v.value?'rgba(196,104,58,0.5)':'rgba(255,255,255,0.1)'), borderRadius:12, cursor:'pointer', transition:'all 0.15s' }}>
            <div style={{ fontSize:13, fontWeight:500, color:'white', fontFamily:'DM Sans,sans-serif' }}>{v.label}</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginTop:2 }}>{v.desc}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:0 }}>
        <div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', marginBottom:6, fontFamily:'DM Sans,sans-serif' }}>Guests</div>
          <select value={form.guests} onChange={set('guests')} style={sel}>
            {['2','4','6','8','10','12','15','20','25','30','40','50+'].map(n => <option key={n} value={n}>{n} guests</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', marginBottom:6, fontFamily:'DM Sans,sans-serif' }}>Duration</div>
          <select value={form.duration} onChange={set('duration')} style={sel}>
            {['2','3','4','5','6','8','all night'].map(h => <option key={h} value={h}>{h === 'all night' ? 'All night' : h + ' hours'}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        <div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', marginBottom:6, fontFamily:'DM Sans,sans-serif' }}>Alcohol</div>
          <select value={form.alcohol} onChange={set('alcohol')} style={sel}>
            <option value="yes_mixed">Mixed — spirits and wine</option>
            <option value="yes_champagne">Champagne focused</option>
            <option value="yes_spirits">Spirits only</option>
            <option value="yes_beer_wine">Beer and wine</option>
            <option value="yes_premium">Premium — no limit</option>
            <option value="no">No alcohol</option>
          </select>
        </div>
        <div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', marginBottom:6, fontFamily:'DM Sans,sans-serif' }}>Budget</div>
          <select value={form.budget} onChange={set('budget')} style={sel}>
            <option value="100">Up to €100</option>
            <option value="200">Up to €200</option>
            <option value="300">Up to €300</option>
            <option value="500">Up to €500</option>
            <option value="750">Up to €750</option>
            <option value="1000">Up to €1,000</option>
            <option value="no_limit">No limit 🚀</option>
          </select>
        </div>
      </div>

      <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', marginBottom:6, fontFamily:'DM Sans,sans-serif' }}>Anything specific? (dietary needs, preferences, occasions)</div>
      <textarea value={form.notes} onChange={set('notes')} rows={2} placeholder="e.g. Someone is vegetarian, love Aperol Spritz, it is a 30th birthday..."
        style={{ ...sel, resize:'none', lineHeight:1.5 }} />

      <button onClick={handle} disabled={building}
        style={{ width:'100%', padding:'16px', background: building ? 'rgba(196,104,58,0.4)' : 'linear-gradient(135deg,#C4683A,#E8854A)', color:'white', border:'none', borderRadius:14, fontFamily:'DM Sans,sans-serif', fontSize:16, fontWeight:500, cursor: building ? 'default' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10, boxShadow: building ? 'none' : '0 4px 20px rgba(196,104,58,0.4)' }}>
        {building ? (
          <>
            <div style={{ width:18, height:18, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'white', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
            Isla is crafting your package...
          </>
        ) : (
          <>✨ Build My Package</>
        )}
      </button>
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  )
}

// ── Package Result ────────────────────────────────────────────
function PackageResult({ pkg, details, onRebuild, onBack }) {
  const { addItem, updateQuantity, items } = useCartStore()
  const [quantities, setQuantities] = useState(() => {
    const q = {}
    pkg.sections?.forEach(s => s.items?.forEach(i => { q[i.product_id] = i.quantity }))
    return q
  })
  const [adding, setAdding] = useState(false)

  const totalCost = Object.entries(quantities).reduce((sum, [pid, qty]) => {
    const p = PRODUCTS.find(p => p.id === pid)
    return sum + (p ? p.price * qty : 0)
  }, 0)
  const totalItems = Object.values(quantities).reduce((s, q) => s + q, 0)

  const handleQtyChange = (pid, qty) => setQuantities(prev => ({ ...prev, [pid]: qty }))

  const addAll = async () => {
    setAdding(true)
    let count = 0
    for (const [pid, qty] of Object.entries(quantities)) {
      if (qty <= 0) continue
      const product = PRODUCTS.find(p => p.id === pid)
      if (!product) continue
      const existing = items.find(i => i.product.id === pid)
      if (existing) updateQuantity(pid, qty)
      else for (let i = 0; i < qty; i++) addItem(product)
      count++
    }
    await new Promise(r => setTimeout(r, 400))
    setAdding(false)
    toast.success(count + ' products added to basket 🎉', { duration:3000 })
    onBack()
  }

  return (
    <div style={{ paddingBottom:110 }}>
      <div style={{ background:'linear-gradient(135deg,rgba(196,104,58,0.3),rgba(43,122,139,0.3))', padding:'24px 16px', textAlign:'center' }}>
        <div style={{ fontSize:44, marginBottom:10 }}>{pkg.hero_emoji || '🎉'}</div>
        <div style={{ fontFamily:'DM Serif Display,serif', fontSize:22, color:'white', marginBottom:4 }}>{pkg.package_name}</div>
        <div style={{ fontSize:13, color:'rgba(255,255,255,0.6)', marginBottom:14 }}>{pkg.tagline}</div>
        <div style={{ display:'flex', justifyContent:'center', gap:20 }}>
          {[{v:details.guests,l:'guests'},{v:totalItems,l:'items'},{v:'€'+totalCost.toFixed(0),l:'total'}].map(({v,l}) => (
            <div key={l} style={{ textAlign:'center' }}>
              <div style={{ fontSize:20, fontWeight:500, color:'#E8A070' }}>{v}</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding:'0 16px' }}>
        {pkg.isla_note && (
          <div style={{ marginTop:16, background:'rgba(43,122,139,0.2)', border:'0.5px solid rgba(43,122,139,0.3)', borderRadius:12, padding:'12px 14px', fontSize:13, color:'rgba(255,255,255,0.8)', fontStyle:'italic', lineHeight:1.55, fontFamily:'DM Sans,sans-serif' }}>
            "{pkg.isla_note}"
          </div>
        )}

        {pkg.sections?.map((section, si) => (
          <div key={si} style={{ marginTop:18 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
              <span style={{ fontSize:20 }}>{section.emoji}</span>
              <div style={{ fontFamily:'DM Serif Display,serif', fontSize:18, color:'white' }}>{section.title}</div>
            </div>
            <div style={{ background:'rgba(255,255,255,0.05)', borderRadius:12, padding:'4px 14px' }}>
              {section.items?.map((item, ii) => (
                <PackageItemCard key={ii} productId={item.product_id}
                  quantity={quantities[item.product_id] ?? item.quantity}
                  reason={item.reason} onQtyChange={handleQtyChange} />
              ))}
            </div>
          </div>
        ))}

        {pkg.hosting_tips?.length > 0 && (
          <div style={{ marginTop:18, background:'rgba(196,104,58,0.1)', border:'0.5px solid rgba(196,104,58,0.25)', borderRadius:12, padding:'14px 16px' }}>
            <div style={{ fontSize:13, fontWeight:500, color:'#E8A070', marginBottom:10 }}>🌴 Isla's hosting tips</div>
            {pkg.hosting_tips.map((tip, i) => (
              <div key={i} style={{ fontSize:12, color:'rgba(255,255,255,0.6)', marginBottom:6, paddingLeft:12, position:'relative', lineHeight:1.5, fontFamily:'DM Sans,sans-serif' }}>
                <span style={{ position:'absolute', left:0 }}>·</span>{tip}
              </div>
            ))}
          </div>
        )}

        <button onClick={onRebuild} style={{ width:'100%', marginTop:16, padding:'12px', background:'rgba(255,255,255,0.06)', border:'0.5px solid rgba(255,255,255,0.12)', borderRadius:12, color:'rgba(255,255,255,0.6)', fontSize:13, cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
          ↺ Rebuild with different options
        </button>
      </div>

      <div style={{ position:'fixed', bottom:68, left:0, right:0, maxWidth:480, margin:'0 auto', padding:'12px 16px', background:'rgba(10,30,40,0.95)', backdropFilter:'blur(16px)', borderTop:'0.5px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
          <span style={{ fontSize:13, color:'rgba(255,255,255,0.5)' }}>{totalItems} items</span>
          <span style={{ fontSize:17, fontWeight:500, color:'#E8A070' }}>€{totalCost.toFixed(2)}</span>
        </div>
        <button onClick={addAll} disabled={adding}
          style={{ width:'100%', padding:'15px', background: adding ? 'rgba(196,104,58,0.4)' : '#C4683A', color:'white', border:'none', borderRadius:12, fontFamily:'DM Sans,sans-serif', fontSize:15, fontWeight:500, cursor: adding ? 'default' : 'pointer', boxShadow:'0 4px 20px rgba(196,104,58,0.4)' }}>
          {adding ? 'Adding...' : '🛒 Add Entire Package to Basket'}
        </button>
      </div>
    </div>
  )
}

// ── Package Type Selector ─────────────────────────────────────
function PackageTypeSelector({ onSelect }) {
  return (
    <div style={{ padding:'20px 16px' }}>
      <div style={{ textAlign:'center', marginBottom:28 }}>
        <div style={{ fontSize:13, color:'rgba(255,255,255,0.5)', fontFamily:'DM Sans,sans-serif', lineHeight:1.6 }}>
          Tell Isla what you have in mind and she will build the perfect package — delivered to your door
        </div>
      </div>
      {PACKAGE_TYPES.map(pt => (
        <div key={pt.id} onClick={() => onSelect(pt.id)}
          style={{ background:pt.color, border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:18, padding:'22px 20px', marginBottom:14, cursor:'pointer', display:'flex', alignItems:'center', gap:16, boxShadow:'0 4px 24px rgba(0,0,0,0.3)' }}>
          <div style={{ fontSize:52, flexShrink:0 }}>{pt.emoji}</div>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:'DM Serif Display,serif', fontSize:22, color:'white', marginBottom:4 }}>{pt.label}</div>
            <div style={{ fontSize:13, color:'rgba(255,255,255,0.6)', lineHeight:1.4, fontFamily:'DM Sans,sans-serif', marginBottom:12 }}>{pt.desc}</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {pt.vibes.slice(0,4).map(v => (
                <span key={v.value} style={{ fontSize:11, background:'rgba(255,255,255,0.12)', borderRadius:20, padding:'3px 10px', color:'rgba(255,255,255,0.7)', fontFamily:'DM Sans,sans-serif' }}>{v.label}</span>
              ))}
              <span style={{ fontSize:11, color:'rgba(255,255,255,0.4)', padding:'3px 4px', fontFamily:'DM Sans,sans-serif' }}>+{pt.vibes.length - 4} more</span>
            </div>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" style={{ flexShrink:0 }}><path d="M9 18l6-6-6-6"/></svg>
        </div>
      ))}
    </div>
  )
}

// ── Main PartyBuilder ─────────────────────────────────────────
export default function PartyBuilder({ onBack, initialType }) {
  const [step, setStep]       = useState(initialType ? 'form' : 'select')
  const [packageType, setPkgType] = useState(initialType || null)
  const [pkg, setPkg]         = useState(null)
  const [details, setDetails] = useState(null)

  const handleTypeSelect = (type) => { setPkgType(type); setStep('form') }
  const handleBuild = (builtPkg, formDetails) => { setPkg(builtPkg); setDetails(formDetails); setStep('result') }

  const handleBack = () => {
    if (step === 'result') { setStep('form'); return }
    if (step === 'form')   { if (initialType) { onBack(); return } setStep('select'); return }
    onBack()
  }

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(170deg,#0A2A38 0%,#0D3545 40%,#1A5060 100%)', paddingBottom:20 }}>
      <div style={{ background:'linear-gradient(135deg,#0D3B4A,#1A5263)', padding:'16px 16px 14px', position:'sticky', top:0, zIndex:50 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={handleBack} style={{ width:36, height:36, background:'rgba(255,255,255,0.1)', border:'0.5px solid rgba(255,255,255,0.18)', borderRadius:'50%', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          </button>
          <div>
            <div style={{ fontFamily:'DM Serif Display,serif', fontSize:20, color:'white', lineHeight:1 }}>
              {step === 'select' ? 'Design Your Experience' : step === 'form' ? PACKAGE_TYPES.find(p => p.id === packageType)?.label : pkg?.package_name || 'Your Package'}
            </div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.45)', marginTop:2 }}>Curated by Isla · Delivered to your door</div>
          </div>
        </div>
      </div>

      {step === 'select' && <PackageTypeSelector onSelect={handleTypeSelect} />}
      {step === 'form'   && <PackageForm packageType={packageType} onBuild={handleBuild} onBack={handleBack} />}
      {step === 'result' && pkg && <PackageResult pkg={pkg} details={details} onRebuild={() => setStep('form')} onBack={onBack} />}
    </div>
  )
}
