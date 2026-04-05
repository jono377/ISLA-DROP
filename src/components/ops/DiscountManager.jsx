import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

async function generateCodeWithAI(prompt) {
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
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: 'Generate a discount code campaign for Isla Drop (Ibiza premium delivery) based on this brief: ' + prompt + '\n\nReturn ONLY this JSON:\n{"code":"UPPERCASE6CHARS","description":"Short promo description","discount_type":"percentage or fixed or free_delivery","discount_value":10,"min_order_value":0,"target_audience":"all or customers or drivers or vip","notes":"Brief rationale"}\n\nFor percentage: value is 0-100. For fixed: value is euros. Code must be memorable, Ibiza-themed, max 10 chars uppercase.'
      }]
    })
  })
  if (!resp.ok) throw new Error('API error')
  const data = await resp.json()
  const raw = data.content?.[0]?.text || '{}'
  return JSON.parse(raw.replace(/```json|```/g, '').trim())
}

function CodeRow({ code, onApprove, onDeactivate, onDelete }) {
  const isExpired = code.valid_until && new Date(code.valid_until) < new Date()
  const isExhausted = code.max_uses && code.uses_count >= code.max_uses

  const statusColor = code.active && !isExpired && !isExhausted
    ? { bg:'rgba(90,107,58,0.15)', color:'#7EE8A2', label:'Active' }
    : code.active === false && !code.approved_at
    ? { bg:'rgba(245,201,122,0.15)', color:'#F5C97A', label:'Pending approval' }
    : { bg:'rgba(196,104,58,0.15)', color:'#E8A070', label: isExpired ? 'Expired' : isExhausted ? 'Exhausted' : 'Inactive' }

  return (
    <div style={{ background:'white', borderRadius:12, padding:14, marginBottom:10, border:'0.5px solid rgba(42,35,24,0.1)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ fontFamily:'monospace', fontSize:18, fontWeight:700, color:'#0D3B4A', letterSpacing:2 }}>{code.code}</div>
          <span style={{ fontSize:11, padding:'2px 8px', borderRadius:20, background:statusColor.bg, color:statusColor.color, fontWeight:500 }}>{statusColor.label}</span>
          {code.ai_generated && <span style={{ fontSize:10, padding:'2px 7px', borderRadius:20, background:'rgba(43,122,139,0.1)', color:'#2B7A8B' }}>✨ AI</span>}
        </div>
        <div style={{ fontSize:15, fontWeight:600, color:'#C4683A' }}>
          {code.discount_type === 'percentage' ? code.discount_value + '%' : code.discount_type === 'fixed' ? '€' + code.discount_value + ' off' : 'Free delivery'}
        </div>
      </div>

      <div style={{ fontSize:13, color:'#2A2318', marginBottom:4 }}>{code.description}</div>
      {code.notes && <div style={{ fontSize:11, color:'#7A6E60', marginBottom:8 }}>{code.notes}</div>}

      <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:10, fontSize:11, color:'#7A6E60' }}>
        {code.min_order_value > 0 && <span>Min order: €{code.min_order_value}</span>}
        {code.max_uses && <span>Uses: {code.uses_count}/{code.max_uses}</span>}
        {!code.max_uses && <span>Uses: {code.uses_count} (unlimited)</span>}
        <span>Audience: {code.target_audience}</span>
        {code.valid_until && <span>Expires: {new Date(code.valid_until).toLocaleDateString('en-GB')}</span>}
      </div>

      <div style={{ display:'flex', gap:8 }}>
        {!code.active && !code.approved_at && (
          <button onClick={() => onApprove(code)}
            style={{ flex:1, padding:'8px', background:'#5A6B3A', color:'white', border:'none', borderRadius:8, fontSize:12, cursor:'pointer', fontFamily:'DM Sans,sans-serif', fontWeight:500 }}>
            ✓ Approve & Activate
          </button>
        )}
        {code.active && (
          <button onClick={() => onDeactivate(code)}
            style={{ flex:1, padding:'8px', background:'rgba(196,104,58,0.1)', border:'0.5px solid rgba(196,104,58,0.3)', borderRadius:8, fontSize:12, color:'#C4683A', cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
            Deactivate
          </button>
        )}
        {!code.active && code.approved_at && (
          <button onClick={() => onApprove(code)}
            style={{ flex:1, padding:'8px', background:'rgba(43,122,139,0.1)', border:'0.5px solid rgba(43,122,139,0.3)', borderRadius:8, fontSize:12, color:'#2B7A8B', cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
            Reactivate
          </button>
        )}
        <button onClick={() => { navigator.clipboard?.writeText(code.code); toast.success('Code copied!') }}
          style={{ padding:'8px 12px', background:'rgba(0,0,0,0.05)', border:'0.5px solid rgba(42,35,24,0.1)', borderRadius:8, fontSize:12, cursor:'pointer' }}>
          📋
        </button>
        <button onClick={() => onDelete(code)}
          style={{ padding:'8px 12px', background:'rgba(196,104,58,0.05)', border:'0.5px solid rgba(196,104,58,0.15)', borderRadius:8, fontSize:12, color:'#C4683A', cursor:'pointer' }}>
          🗑
        </button>
      </div>
    </div>
  )
}

function CreateCodeForm({ onCreated, onClose }) {
  const [mode, setMode] = useState('manual') // manual | ai
  const [aiPrompt, setAiPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [form, setForm] = useState({
    code: '', description: '', discount_type: 'percentage', discount_value: 10,
    min_order_value: 0, max_uses: '', valid_until: '', target_audience: 'all',
    notes: '', ai_generated: false, ai_prompt: '',
  })
  const [saving, setSaving] = useState(false)
  const set = f => e => setForm(prev => ({ ...prev, [f]: e.target.value }))

  const generateWithAI = async () => {
    if (!aiPrompt.trim()) { toast.error('Describe the promotion first'); return }
    setGenerating(true)
    try {
      const result = await generateCodeWithAI(aiPrompt)
      setForm(prev => ({
        ...prev,
        code: result.code || '',
        description: result.description || '',
        discount_type: result.discount_type || 'percentage',
        discount_value: result.discount_value || 10,
        min_order_value: result.min_order_value || 0,
        target_audience: result.target_audience || 'all',
        notes: result.notes || '',
        ai_generated: true,
        ai_prompt: aiPrompt,
      }))
      setMode('manual')
      toast.success('AI generated a code — review and save!')
    } catch {
      toast.error('AI generation failed — create manually')
      setMode('manual')
    }
    setGenerating(false)
  }

  const save = async () => {
    if (!form.code.trim()) { toast.error('Code is required'); return }
    if (!form.description.trim()) { toast.error('Description is required'); return }
    setSaving(true)
    try {
      const { supabase } = await import('../../lib/supabase')
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('discount_codes').insert({
        code: form.code.toUpperCase().trim(),
        description: form.description,
        discount_type: form.discount_type,
        discount_value: parseFloat(form.discount_value),
        min_order_value: parseFloat(form.min_order_value) || 0,
        max_uses: form.max_uses ? parseInt(form.max_uses) : null,
        valid_until: form.valid_until || null,
        target_audience: form.target_audience,
        notes: form.notes,
        ai_generated: form.ai_generated,
        ai_prompt: form.ai_prompt,
        active: false,
        created_by: user?.id,
      })
      if (error) throw error
      toast.success('Code created — now approve it to activate')
      onCreated()
    } catch (err) {
      toast.error(err.message || 'Save failed')
    }
    setSaving(false)
  }

  const inp = { width:'100%', padding:'10px 12px', border:'0.5px solid rgba(42,35,24,0.15)', borderRadius:8, fontFamily:'DM Sans,sans-serif', fontSize:13, outline:'none', background:'white', boxSizing:'border-box', marginBottom:10 }

  return (
    <div style={{ background:'white', borderRadius:14, padding:20, marginBottom:16, border:'0.5px solid rgba(42,35,24,0.12)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div style={{ fontFamily:'DM Serif Display,serif', fontSize:18, color:'#0D3B4A' }}>New Discount Code</div>
        <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:18, color:'#7A6E60' }}>✕</button>
      </div>

      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        {['manual','ai'].map(m => (
          <button key={m} onClick={() => setMode(m)}
            style={{ flex:1, padding:'9px', background: mode===m?'#0D3B4A':'rgba(0,0,0,0.04)', color: mode===m?'white':'#7A6E60', border:'none', borderRadius:8, fontFamily:'DM Sans,sans-serif', fontSize:13, cursor:'pointer', fontWeight: mode===m?500:400 }}>
            {m === 'ai' ? '✨ Generate with AI' : '✏️ Create manually'}
          </button>
        ))}
      </div>

      {mode === 'ai' && (
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:12, color:'#7A6E60', marginBottom:6 }}>Describe the promotion</div>
          <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} rows={3}
            placeholder="e.g. Summer launch promo, 15% off for new customers. Or: Driver reward for completing 50 runs. Or: VIP code for villa guests spending over €200..."
            style={{ ...inp, resize:'none', lineHeight:1.5 }} />
          <button onClick={generateWithAI} disabled={generating}
            style={{ width:'100%', padding:'11px', background: generating?'rgba(43,122,139,0.4)':'#2B7A8B', color:'white', border:'none', borderRadius:8, fontFamily:'DM Sans,sans-serif', fontSize:13, cursor:'pointer', fontWeight:500 }}>
            {generating ? '✨ Isla is creating your code...' : '✨ Generate Code'}
          </button>
        </div>
      )}

      {mode === 'manual' && (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div>
              <div style={{ fontSize:12, color:'#7A6E60', marginBottom:4 }}>Code *</div>
              <input value={form.code} onChange={e => setForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                placeholder="IBIZA2025" style={inp} />
            </div>
            <div>
              <div style={{ fontSize:12, color:'#7A6E60', marginBottom:4 }}>Discount type</div>
              <select value={form.discount_type} onChange={set('discount_type')} style={inp}>
                <option value="percentage">Percentage off (%)</option>
                <option value="fixed">Fixed amount off (€)</option>
                <option value="free_delivery">Free delivery</option>
              </select>
            </div>
          </div>

          {form.discount_type !== 'free_delivery' && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div>
                <div style={{ fontSize:12, color:'#7A6E60', marginBottom:4 }}>
                  {form.discount_type === 'percentage' ? 'Discount %' : 'Amount off (€)'}
                </div>
                <input type="number" value={form.discount_value} onChange={set('discount_value')} style={inp} />
              </div>
              <div>
                <div style={{ fontSize:12, color:'#7A6E60', marginBottom:4 }}>Min order value (€)</div>
                <input type="number" value={form.min_order_value} onChange={set('min_order_value')} placeholder="0" style={inp} />
              </div>
            </div>
          )}

          <div>
            <div style={{ fontSize:12, color:'#7A6E60', marginBottom:4 }}>Description *</div>
            <input value={form.description} onChange={set('description')} placeholder="Summer launch — 15% off all orders" style={inp} />
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
            <div>
              <div style={{ fontSize:12, color:'#7A6E60', marginBottom:4 }}>Max uses</div>
              <input type="number" value={form.max_uses} onChange={set('max_uses')} placeholder="Unlimited" style={inp} />
            </div>
            <div>
              <div style={{ fontSize:12, color:'#7A6E60', marginBottom:4 }}>Target</div>
              <select value={form.target_audience} onChange={set('target_audience')} style={inp}>
                <option value="all">Everyone</option>
                <option value="customers">Customers</option>
                <option value="drivers">Drivers</option>
                <option value="vip">VIP only</option>
              </select>
            </div>
            <div>
              <div style={{ fontSize:12, color:'#7A6E60', marginBottom:4 }}>Expires</div>
              <input type="date" value={form.valid_until} onChange={set('valid_until')} style={inp} />
            </div>
          </div>

          <div>
            <div style={{ fontSize:12, color:'#7A6E60', marginBottom:4 }}>Internal notes</div>
            <input value={form.notes} onChange={set('notes')} placeholder="e.g. For social media campaign July 2025" style={{ ...inp, marginBottom:16 }} />
          </div>

          <button onClick={save} disabled={saving}
            style={{ width:'100%', padding:'12px', background:'#0D3B4A', color:'white', border:'none', borderRadius:10, fontFamily:'DM Sans,sans-serif', fontSize:14, fontWeight:500, cursor:'pointer', opacity:saving?0.7:1 }}>
            {saving ? 'Saving...' : 'Create Code (pending approval)'}
          </button>
        </>
      )}
    </div>
  )
}

export default function DiscountManager() {
  const [codes, setCodes]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [filter, setFilter]       = useState('all') // all | pending | active | inactive

  const load = async () => {
    try {
      const { supabase } = await import('../../lib/supabase')
      const { data } = await supabase.from('discount_codes').select('*').order('created_at', { ascending: false })
      if (data) setCodes(data)
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const approve = async (code) => {
    try {
      const { supabase } = await import('../../lib/supabase')
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from('discount_codes').update({
        active: true,
        approved_by: user?.id,
        approved_at: new Date().toISOString(),
      }).eq('id', code.id)
      toast.success('Code approved and active!')
      load()
    } catch { toast.error('Approval failed') }
  }

  const deactivate = async (code) => {
    try {
      const { supabase } = await import('../../lib/supabase')
      await supabase.from('discount_codes').update({ active: false }).eq('id', code.id)
      toast.success('Code deactivated')
      load()
    } catch { toast.error('Failed') }
  }

  const deleteCode = async (code) => {
    if (!confirm('Delete code ' + code.code + '? This cannot be undone.')) return
    try {
      const { supabase } = await import('../../lib/supabase')
      await supabase.from('discount_codes').delete().eq('id', code.id)
      toast.success('Code deleted')
      load()
    } catch { toast.error('Delete failed') }
  }

  const pending  = codes.filter(c => !c.active && !c.approved_at)
  const active   = codes.filter(c => c.active)
  const inactive = codes.filter(c => !c.active && c.approved_at)

  const displayed = filter === 'pending' ? pending : filter === 'active' ? active : filter === 'inactive' ? inactive : codes

  if (loading) return <div style={{ textAlign:'center', padding:40, color:'#7A6E60' }}>Loading...</div>

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
        <div>
          <div style={{ fontFamily:'DM Serif Display,serif', fontSize:22, color:'#0D3B4A', marginBottom:4 }}>Discount Codes</div>
          <div style={{ fontSize:13, color:'#7A6E60' }}>Create, approve and manage promotions</div>
        </div>
        <button onClick={() => setShowCreate(!showCreate)}
          style={{ padding:'10px 16px', background:'#0D3B4A', color:'white', border:'none', borderRadius:10, fontFamily:'DM Sans,sans-serif', fontSize:13, cursor:'pointer', fontWeight:500, whiteSpace:'nowrap' }}>
          + New Code
        </button>
      </div>

      {showCreate && <CreateCodeForm onCreated={() => { load(); setShowCreate(false) }} onClose={() => setShowCreate(false)} />}

      {pending.length > 0 && (
        <div style={{ background:'rgba(245,201,122,0.12)', border:'0.5px solid rgba(245,201,122,0.35)', borderRadius:10, padding:'10px 14px', marginBottom:14, fontSize:13, color:'#8B7020', display:'flex', alignItems:'center', gap:8 }}>
          <span>⏳</span>
          <span>{pending.length} code{pending.length > 1 ? 's' : ''} awaiting your approval</span>
        </div>
      )}

      <div style={{ display:'flex', gap:8, marginBottom:14 }}>
        {[['all','All'],['pending','Pending'],['active','Active'],['inactive','Inactive']].map(([v,l]) => (
          <button key={v} onClick={() => setFilter(v)}
            style={{ padding:'7px 14px', borderRadius:20, fontSize:12, background: filter===v?'#0D3B4A':'rgba(0,0,0,0.05)', color: filter===v?'white':'#7A6E60', border:'none', cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
            {l} {v === 'all' ? codes.length : v === 'pending' ? pending.length : v === 'active' ? active.length : inactive.length}
          </button>
        ))}
      </div>

      {displayed.length === 0 && (
        <div style={{ textAlign:'center', padding:'40px 0' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🎟️</div>
          <div style={{ fontSize:15, fontWeight:500, color:'#0D3B4A', marginBottom:6 }}>No codes yet</div>
          <div style={{ fontSize:13, color:'#7A6E60' }}>Create your first discount code above</div>
        </div>
      )}

      {displayed.map(code => (
        <CodeRow key={code.id} code={code} onApprove={approve} onDeactivate={deactivate} onDelete={deleteCode} />
      ))}
    </div>
  )
}
