import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

const C = {
  bg:'#F5F0E8', card:'#FFFFFF', accent:'#C4683A', accentL:'rgba(196,104,58,0.1)',
  green:'#1D9E75', greenL:'rgba(29,158,117,0.1)', blue:'#2B7A8B', blueL:'rgba(43,122,139,0.1)',
  red:'#C43A3A', redL:'rgba(196,58,58,0.1)', yellow:'#B8860B', yellowL:'rgba(184,134,11,0.1)',
  text:'#2A2318', muted:'#7A6E60', border:'rgba(42,35,24,0.12)',
}
const F = { serif:'DM Serif Display,serif', sans:'DM Sans,sans-serif' }

function Card({ children, style={} }) {
  return <div style={{ background:C.card, borderRadius:12, border:'0.5px solid '+C.border, ...style }}>{children}</div>
}
function Btn({ children, onClick, color=C.accent, outline, disabled, style={} }) {
  return <button onClick={onClick} disabled={disabled}
    style={{ padding:'9px 18px', background:outline?'transparent':disabled?C.border:color, border:outline?'1px solid '+color:'none', borderRadius:8, color:outline?color:'white', fontSize:13, fontWeight:600, cursor:disabled?'default':'pointer', opacity:disabled?0.5:1, fontFamily:F.sans, ...style }}>
    {children}
  </button>
}

// ═══════════════════════════════════════════════════════════════
// 20. GDPR DATA DELETION
// ═══════════════════════════════════════════════════════════════
export function GDPRManager() {
  const [email, setEmail] = useState('')
  const [results, setResults] = useState(null)
  const [searching, setSearching] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [log, setLog] = useState([])

  const search = async () => {
    if (!email.trim()) return
    setSearching(true)
    const { data: users } = await supabase.from('profiles')
      .select('id, full_name, created_at, role')
      .ilike('id', '%')
    const { data: authData } = await supabase.auth.admin.listUsers()
    const user = authData?.users?.find(u=>u.email===email.trim())
    if (user) {
      const [orders, savedAddrs, loyalty] = await Promise.all([
        supabase.from('orders').select('id', {count:'exact',head:true}).eq('customer_id',user.id),
        supabase.from('saved_addresses').select('id', {count:'exact',head:true}).eq('user_id',user.id),
        supabase.from('loyalty_cards').select('id', {count:'exact',head:true}).eq('user_id',user.id),
      ])
      setResults({ user, orderCount:orders.count||0, addressCount:savedAddrs.count||0, hasLoyalty:!!loyalty.count })
    } else {
      setResults(null)
      toast.error('User not found with that email')
    }
    setSearching(false)
  }

  const anonymise = async () => {
    if (!results?.user) return
    if (!confirm('This will permanently anonymise all personal data for '+email+'. This cannot be undone. Continue?')) return
    setDeleting(true)
    const uid = results.user.id
    const anon = 'deleted_user_'+Math.random().toString(36).slice(2,8)
    try {
      await Promise.all([
        supabase.from('profiles').update({ full_name:anon, phone:null, avatar_url:null }).eq('id',uid),
        supabase.from('saved_addresses').delete().eq('user_id',uid),
        supabase.from('loyalty_cards').update({ user_id:uid }).eq('user_id',uid),
        supabase.from('orders').update({ delivery_address:'[deleted]', delivery_lat:null, delivery_lng:null, delivery_notes:null }).eq('customer_id',uid),
        supabase.from('support_tickets').update({ message:'[deleted]' }).eq('user_id',uid),
        supabase.from('concierge_messages').update({ message:'[deleted]' }).eq('sender_id',uid),
      ])
      await supabase.from('ops_activity_log').insert({
        action:'gdpr_deletion', details:'Personal data anonymised for: '+email,
        metadata:{ user_id:uid, requested_at:new Date().toISOString() }
      })
      setLog(prev=>[{ email, ts:new Date().toISOString() },...prev])
      setResults(null); setEmail('')
      toast.success('Data anonymised successfully. Right to erasure fulfilled.')
    } catch(e) { toast.error('Deletion failed: '+e.message) }
    setDeleting(false)
  }

  return (
    <div style={{ padding:20 }}>
      <h2 style={{ fontFamily:F.serif, fontSize:26, margin:'0 0 8px' }}>GDPR Data Deletion</h2>
      <div style={{ fontSize:13, color:C.muted, marginBottom:24 }}>Process right-to-erasure requests under GDPR / Spanish data protection law</div>

      <Card style={{ padding:20, marginBottom:20 }}>
        <div style={{ fontSize:14, fontWeight:700, marginBottom:12 }}>Find customer by email</div>
        <div style={{ display:'flex', gap:8 }}>
          <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="customer@email.com"
            style={{ flex:1, padding:'10px 14px', border:'1px solid '+C.border, borderRadius:8, fontSize:13, fontFamily:F.sans }} />
          <Btn onClick={search} disabled={searching||!email}>{searching?'Searching...':'Find'}</Btn>
        </div>
      </Card>

      {results && (
        <Card style={{ padding:20, marginBottom:20, borderLeft:'4px solid '+C.red }}>
          <div style={{ fontFamily:F.serif, fontSize:18, marginBottom:12 }}>Customer found</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
            {[['Name',results.user.email],['Role',results.user.role||'customer'],['Orders',results.orderCount],['Saved addresses',results.addressCount],['Loyalty card',results.hasLoyalty?'Yes':'No'],['Joined',new Date(results.user.created_at).toLocaleDateString('en-GB')]].map(([k,v])=>(
              <div key={k} style={{ padding:'10px 12px', background:C.bg, borderRadius:8 }}>
                <div style={{ fontSize:11, color:C.muted, textTransform:'uppercase' }}>{k}</div>
                <div style={{ fontSize:14, fontWeight:600, color:C.text, marginTop:2 }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ padding:'12px 14px', background:C.redL, border:'1px solid '+C.red+'30', borderRadius:8, fontSize:12, color:C.red, marginBottom:16 }}>
            ⚠️ This will permanently anonymise: name, phone, avatar, saved addresses, delivery addresses on orders, and support messages. Order history is kept for accounting but personal details are removed.
          </div>
          <Btn onClick={anonymise} disabled={deleting} color={C.red} style={{ width:'100%', justifyContent:'center' }}>
            {deleting?'Processing...':'🗑️ Anonymise all personal data'}
          </Btn>
        </Card>
      )}

      {log.length > 0 && (
        <Card style={{ padding:0 }}>
          <div style={{ padding:'14px 16px', borderBottom:'0.5px solid '+C.border, fontWeight:700 }}>Deletion log</div>
          {log.map((l,i)=>(
            <div key={i} style={{ padding:'12px 16px', borderBottom:'0.5px solid '+C.border, fontSize:13 }}>
              <span style={{ color:C.red }}>🗑️ {l.email}</span>
              <span style={{ color:C.muted, marginLeft:12 }}>{new Date(l.ts).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 21. COHORT ANALYSIS / RETENTION
// ═══════════════════════════════════════════════════════════════
export function CohortAnalysis() {
  const [cohorts, setCohorts] = useState([])
  const [loading, setLoading] = useState(true)
  const [months, setMonths] = useState(3)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const start = new Date(); start.setMonth(start.getMonth()-months); start.setDate(1); start.setHours(0,0,0,0)
      const { data: orders } = await supabase.from('orders')
        .select('customer_id, created_at, total')
        .eq('status','delivered')
        .gte('created_at', start.toISOString())
        .order('created_at')
      if (!orders) { setLoading(false); return }

      // Build cohorts by signup month
      const firstOrders = {}
      orders.forEach(o => {
        if (!firstOrders[o.customer_id]) firstOrders[o.customer_id] = o.created_at
      })

      const cohortMap = {}
      Object.entries(firstOrders).forEach(([cid, firstDate]) => {
        const m = new Date(firstDate).toLocaleDateString('en-GB',{month:'short',year:'2-digit'})
        if (!cohortMap[m]) cohortMap[m] = { month:m, customers:new Set(), returning:new Set(), revenue:0, repeat_revenue:0 }
        cohortMap[m].customers.add(cid)
      })

      orders.forEach(o => {
        const firstDate = firstOrders[o.customer_id]
        if (!firstDate) return
        const cohortKey = new Date(firstDate).toLocaleDateString('en-GB',{month:'short',year:'2-digit'})
        const isRepeat = new Date(o.created_at).getTime() > new Date(firstDate).getTime() + 86400000
        if (cohortMap[cohortKey]) {
          cohortMap[cohortKey].revenue += o.total||0
          if (isRepeat) { cohortMap[cohortKey].returning.add(o.customer_id); cohortMap[cohortKey].repeat_revenue += o.total||0 }
        }
      })

      setCohorts(Object.values(cohortMap).map(c=>({
        month: c.month,
        customers: c.customers.size,
        returning: c.returning.size,
        retentionRate: c.customers.size>0 ? Math.round((c.returning.size/c.customers.size)*100) : 0,
        revenue: c.revenue,
        avgOrderValue: c.customers.size>0 ? c.revenue/c.customers.size : 0,
      })).reverse())
      setLoading(false)
    }
    load()
  }, [months])

  const maxRetention = Math.max(...cohorts.map(c=>c.retentionRate), 1)

  return (
    <div style={{ padding:20 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h2 style={{ fontFamily:F.serif, fontSize:26, margin:0 }}>Cohort Analysis</h2>
          <div style={{ fontSize:13, color:C.muted }}>Customer retention by acquisition month</div>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {[3,6,12].map(m=>(
            <Btn key={m} onClick={()=>setMonths(m)} outline={months!==m} color={C.accent} style={{fontSize:12,padding:'6px 12px'}}>{m}mo</Btn>
          ))}
        </div>
      </div>

      {loading ? <div style={{textAlign:'center',padding:40,color:C.muted}}>Analysing cohorts...</div>
      : cohorts.length===0 ? (
        <Card style={{ padding:48, textAlign:'center' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>📊</div>
          <div style={{ fontFamily:F.serif, fontSize:20 }}>Not enough data yet</div>
          <div style={{ fontSize:13, color:C.muted, marginTop:8 }}>Cohort analysis requires at least 2 months of order data</div>
        </Card>
      ) : (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:24 }}>
            {[
              ['📊', Math.round(cohorts.reduce((s,c)=>s+c.retentionRate,0)/cohorts.length)+'%', 'Avg retention'],
              ['👥', cohorts.reduce((s,c)=>s+c.customers,0), 'Total customers'],
              ['💰', '€'+Math.round(cohorts.reduce((s,c)=>s+c.avgOrderValue,0)/cohorts.length), 'Avg lifetime value'],
            ].map(([icon,val,label])=>(
              <Card key={label} style={{ padding:'14px 18px' }}>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <div><div style={{ fontSize:22, fontWeight:700 }}>{val}</div><div style={{ fontSize:12, color:C.muted, marginTop:4 }}>{label}</div></div>
                  <span style={{ fontSize:22 }}>{icon}</span>
                </div>
              </Card>
            ))}
          </div>

          <Card>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ background:C.bg }}>
                  {['Cohort','Customers','Returned','Retention','Retention bar','Revenue'].map(h=>(
                    <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontWeight:700, color:C.muted, fontSize:11, textTransform:'uppercase', borderBottom:'1px solid '+C.border }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cohorts.map((co,i)=>(
                  <tr key={co.month} style={{ borderBottom:'0.5px solid '+C.border, background:i%2===0?'white':C.bg }}>
                    <td style={{ padding:'12px 14px', fontWeight:700, color:C.text }}>{co.month}</td>
                    <td style={{ padding:'12px 14px', textAlign:'center' }}>{co.customers}</td>
                    <td style={{ padding:'12px 14px', textAlign:'center' }}>{co.returning}</td>
                    <td style={{ padding:'12px 14px', fontWeight:700, color:co.retentionRate>50?C.green:co.retentionRate>25?C.yellow:C.red }}>{co.retentionRate}%</td>
                    <td style={{ padding:'12px 14px', width:140 }}>
                      <div style={{ height:8, background:C.border, borderRadius:99, overflow:'hidden' }}>
                        <div style={{ height:'100%', background:co.retentionRate>50?C.green:co.retentionRate>25?C.yellow:C.red, borderRadius:99, width:(co.retentionRate/maxRetention*100)+'%', transition:'width 0.5s' }}/>
                      </div>
                    </td>
                    <td style={{ padding:'12px 14px', fontWeight:700, color:C.green }}>€{co.revenue.toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 22. SUPPLIER REORDER AUTOMATION
// ═══════════════════════════════════════════════════════════════
export function SupplierReorderManager() {
  const [lowStock, setLowStock] = useState([])
  const [suppliers, setSuppliers] = useState({})
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(null)

  useEffect(() => {
    const load = async () => {
      const { data: products } = await supabase.from('products').select('*').eq('is_active',true).lt('stock_quantity',15).order('stock_quantity')
      const { data: sups } = await supabase.from('suppliers').select('*')
      const supMap = {}
      if (sups) sups.forEach(s=>{ if(s.categories) s.categories.forEach(cat=>{ supMap[cat]=s }) })
      setLowStock(products||[])
      setSuppliers(supMap)
      setLoading(false)
    }
    load()
  }, [])

  const groupBySupplier = () => {
    const groups = {}
    lowStock.forEach(p => {
      const sup = suppliers[p.category] || { name:'Unassigned supplier', email:'', id:'unassigned' }
      const key = sup.name
      if (!groups[key]) groups[key] = { supplier:sup, products:[] }
      groups[key].products.push(p)
    })
    return groups
  }

  const sendReorder = async (supplierName, products, supplier) => {
    setSending(supplierName)
    const lines = products.map(p=>'- '+p.name+': reorder '+Math.max(20,Math.ceil(50-p.stock_quantity))+' units (current stock: '+p.stock_quantity+')').join('\n')
    const body = 'Hi '+supplierName+',\n\nPlease process the following urgent reorder for Isla Drop (Ibiza):\n\n'+lines+'\n\nKindly confirm receipt and expected delivery date.\n\nBest regards,\nIsla Drop Operations\nops@isladrop.net\n+34 971 000 000'

    await supabase.from('ops_activity_log').insert({
      action:'supplier_reorder_sent', details:'Reorder sent to '+supplierName+' for '+products.length+' products',
      metadata:{ supplier:supplierName, products:products.map(p=>p.name), body }
    })

    if (supplier?.email) {
      window.location.href = 'mailto:'+supplier.email+'?subject=Urgent+Reorder+—+Isla+Drop&body='+encodeURIComponent(body)
    } else {
      navigator.clipboard.writeText(body)
      toast.success('Reorder email copied to clipboard — no email configured for this supplier')
    }
    setSending(null)
  }

  const groups = groupBySupplier()

  return (
    <div style={{ padding:20 }}>
      <h2 style={{ fontFamily:F.serif, fontSize:26, margin:'0 0 8px' }}>Supplier Reorder</h2>
      <div style={{ fontSize:13, color:C.muted, marginBottom:24 }}>Low-stock products grouped by supplier. Send pre-filled reorder emails in one click.</div>

      {loading ? <div style={{textAlign:'center',padding:40,color:C.muted}}>Checking stock levels...</div>
      : lowStock.length===0 ? (
        <Card style={{ padding:48, textAlign:'center' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>✅</div>
          <div style={{ fontFamily:F.serif, fontSize:20 }}>All stock levels healthy</div>
          <div style={{ fontSize:13, color:C.muted, marginTop:8 }}>No products below 15 units</div>
        </Card>
      ) : Object.entries(groups).map(([supName, group])=>(
        <Card key={supName} style={{ padding:0, marginBottom:16 }}>
          <div style={{ padding:'16px 20px', borderBottom:'0.5px solid '+C.border, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontSize:16, fontWeight:700, color:C.text }}>{supName}</div>
              <div style={{ fontSize:12, color:C.muted }}>{group.supplier.email||'No email configured'} · {group.products.length} products to reorder</div>
            </div>
            <Btn onClick={()=>sendReorder(supName,group.products,group.supplier)} disabled={sending===supName} color={C.accent} style={{ fontSize:12 }}>
              {sending===supName?'Sending...':'📧 Send reorder'}
            </Btn>
          </div>
          {group.products.map(p=>(
            <div key={p.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 20px', borderBottom:'0.5px solid '+C.border }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:20 }}>{p.emoji}</span>
                <div>
                  <div style={{ fontSize:13, fontWeight:600 }}>{p.name}</div>
                  <div style={{ fontSize:11, color:C.muted }}>Current: <strong style={{ color:p.stock_quantity<5?C.red:C.yellow }}>{p.stock_quantity} units</strong></div>
                </div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:12, color:C.muted }}>Suggest reorder</div>
                <div style={{ fontSize:14, fontWeight:700, color:C.accent }}>{Math.max(20,Math.ceil(50-p.stock_quantity))} units</div>
              </div>
            </div>
          ))}
        </Card>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 23. A/B TESTING FRAMEWORK
// ═══════════════════════════════════════════════════════════════
export function ABTestManager() {
  const [tests, setTests] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name:'', description:'', variant_a:'', variant_b:'', split:50, metric:'orders' })

  useEffect(() => {
    supabase.from('ab_tests').select('*').order('created_at',{ascending:false})
      .then(({ data }) => { setTests(data||[]); setLoading(false) })
      .catch(()=>setLoading(false))
  }, [])

  const create = async () => {
    if (!form.name||!form.variant_a||!form.variant_b) return
    const { data } = await supabase.from('ab_tests').insert({ ...form, status:'running', started_at:new Date().toISOString(), impressions_a:0, impressions_b:0, conversions_a:0, conversions_b:0 }).select().single()
    if (data) { setTests(prev=>[data,...prev]); setCreating(false); setForm({ name:'', description:'', variant_a:'', variant_b:'', split:50, metric:'orders' }) }
  }

  const stopTest = async (id) => {
    await supabase.from('ab_tests').update({ status:'complete', ended_at:new Date().toISOString() }).eq('id',id)
    setTests(prev=>prev.map(t=>t.id===id?{...t,status:'complete'}:t))
  }

  const getWinner = (test) => {
    const convA = test.impressions_a > 0 ? test.conversions_a/test.impressions_a : 0
    const convB = test.impressions_b > 0 ? test.conversions_b/test.impressions_b : 0
    if (Math.abs(convA-convB) < 0.01) return 'No clear winner yet'
    return convA > convB ? '🏆 Variant A winning (+'+Math.round((convA-convB)*100)+'% conversion)' : '🏆 Variant B winning (+'+Math.round((convB-convA)*100)+'% conversion)'
  }

  return (
    <div style={{ padding:20 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h2 style={{ fontFamily:F.serif, fontSize:26, margin:0 }}>A/B Test Manager</h2>
          <div style={{ fontSize:13, color:C.muted }}>Run controlled experiments on the customer app</div>
        </div>
        <Btn onClick={()=>setCreating(true)}>+ New test</Btn>
      </div>

      {creating && (
        <Card style={{ padding:20, marginBottom:20 }}>
          <div style={{ fontFamily:F.serif, fontSize:18, marginBottom:16 }}>New A/B test</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {[['name','Test name'],['description','Description'],['variant_a','Variant A (control)'],['variant_b','Variant B (test)']].map(([k,l])=>(
              <div key={k}>
                <div style={{ fontSize:11, color:C.muted, marginBottom:5, textTransform:'uppercase' }}>{l}</div>
                <input value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))}
                  style={{ width:'100%', padding:'9px 12px', border:'1px solid '+C.border, borderRadius:8, fontSize:13, fontFamily:F.sans, boxSizing:'border-box' }} />
              </div>
            ))}
            <div>
              <div style={{ fontSize:11, color:C.muted, marginBottom:5, textTransform:'uppercase' }}>Traffic split: A {form.split}% / B {100-form.split}%</div>
              <input type="range" min={10} max={90} value={form.split} onChange={e=>setForm(p=>({...p,split:parseInt(e.target.value)}))} style={{ width:'100%', accentColor:C.accent }} />
            </div>
            <div>
              <div style={{ fontSize:11, color:C.muted, marginBottom:5, textTransform:'uppercase' }}>Primary metric</div>
              <select value={form.metric} onChange={e=>setForm(p=>({...p,metric:e.target.value}))}
                style={{ width:'100%', padding:'9px 12px', border:'1px solid '+C.border, borderRadius:8, fontSize:13, fontFamily:F.sans }}>
                {['orders','aov','basket_size','checkout_rate','session_duration'].map(m=><option key={m} value={m}>{m.replace('_',' ')}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display:'flex', gap:8, marginTop:16 }}>
            <Btn onClick={create} color={C.green} style={{ flex:1, justifyContent:'center' }}>🚀 Launch test</Btn>
            <Btn onClick={()=>setCreating(false)} outline color={C.muted}>Cancel</Btn>
          </div>
        </Card>
      )}

      {loading ? <div style={{textAlign:'center',padding:40,color:C.muted}}>Loading tests...</div>
      : tests.map(test=>(
        <Card key={test.id} style={{ padding:20, marginBottom:12 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
            <div>
              <div style={{ fontSize:16, fontWeight:700, color:C.text }}>{test.name}</div>
              <div style={{ fontSize:12, color:C.muted }}>{test.description}</div>
            </div>
            <span style={{ padding:'4px 10px', borderRadius:99, background:test.status==='running'?C.greenL:C.border, color:test.status==='running'?C.green:C.muted, fontSize:11, fontWeight:700 }}>
              {test.status==='running'?'● Running':'■ Complete'}
            </span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
            {[['A (Control)', test.variant_a, test.impressions_a||0, test.conversions_a||0],['B (Test)',test.variant_b,test.impressions_b||0,test.conversions_b||0]].map(([label,name,impr,conv])=>(
              <div key={label} style={{ background:C.bg, borderRadius:10, padding:12 }}>
                <div style={{ fontSize:11, color:C.muted, marginBottom:4, textTransform:'uppercase' }}>{label}</div>
                <div style={{ fontSize:13, fontWeight:600 }}>{name}</div>
                <div style={{ fontSize:11, color:C.muted, marginTop:4 }}>{impr} views · {conv} conversions · {impr>0?((conv/impr)*100).toFixed(1):0}% CVR</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize:13, fontWeight:600, color:C.blue, marginBottom:12 }}>{getWinner(test)}</div>
          {test.status==='running' && <Btn onClick={()=>stopTest(test.id)} outline color={C.red} style={{ fontSize:12 }}>Stop test</Btn>}
        </Card>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 24. AUTOMATED SLA BREACH ESCALATION
// ═══════════════════════════════════════════════════════════════
export function SLAEscalationManager() {
  const [rules, setRules] = useState([
    { id:1, name:'15 min late → Alert ops', trigger_mins:15, action:'alert_ops', active:true },
    { id:2, name:'25 min late → Auto-reassign', trigger_mins:25, action:'auto_reassign', active:true },
    { id:3, name:'40 min late → Customer credit', trigger_mins:40, action:'issue_credit', active:false },
    { id:4, name:'60 min late → Escalate to manager', trigger_mins:60, action:'escalate', active:true },
  ])
  const [breaches, setBreaches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('sla_breaches').select('*, orders(order_number,delivery_address,customer_id)').order('created_at',{ascending:false}).limit(20)
      .then(({ data }) => { setBreaches(data||[]); setLoading(false) })
      .catch(()=>setLoading(false))
  }, [])

  const toggleRule = (id) => setRules(prev=>prev.map(r=>r.id===id?{...r,active:!r.active}:r))

  const ACTION_LABELS = {
    alert_ops:'📢 Alert ops team',
    auto_reassign:'🔄 Auto-reassign driver',
    issue_credit:'💰 Issue customer credit',
    escalate:'🚨 Escalate to manager',
  }

  return (
    <div style={{ padding:20 }}>
      <h2 style={{ fontFamily:F.serif, fontSize:26, margin:'0 0 8px' }}>SLA Escalation Rules</h2>
      <div style={{ fontSize:13, color:C.muted, marginBottom:24 }}>Automated actions when orders breach time thresholds</div>

      <Card style={{ padding:20, marginBottom:24 }}>
        <div style={{ fontSize:14, fontWeight:700, marginBottom:14 }}>Escalation rules</div>
        {rules.map(rule=>(
          <div key={rule.id} style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 0', borderBottom:'0.5px solid '+C.border }}>
            <button onClick={()=>toggleRule(rule.id)} style={{ width:44, height:24, borderRadius:12, background:rule.active?C.green:C.border, border:'none', cursor:'pointer', position:'relative', flexShrink:0, transition:'background 0.2s' }}>
              <div style={{ width:20, height:20, borderRadius:'50%', background:'white', position:'absolute', top:2, left:rule.active?22:2, transition:'left 0.2s' }}/>
            </button>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:600, color:rule.active?C.text:C.muted }}>{rule.name}</div>
              <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>After {rule.trigger_mins} minutes → {ACTION_LABELS[rule.action]}</div>
            </div>
          </div>
        ))}
      </Card>

      <div style={{ fontFamily:F.serif, fontSize:20, marginBottom:12 }}>Recent breaches</div>
      {loading ? <div style={{textAlign:'center',padding:32,color:C.muted}}>Loading...</div>
      : breaches.length===0 ? (
        <Card style={{ padding:48, textAlign:'center' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>✅</div>
          <div style={{ fontFamily:F.serif, fontSize:20 }}>No recent SLA breaches</div>
        </Card>
      ) : breaches.map(b=>(
        <Card key={b.id} style={{ padding:16, marginBottom:8, borderLeft:'3px solid '+C.red }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
            <span style={{ fontSize:14, fontWeight:700 }}>Order #{b.orders?.order_number||b.order_id?.slice(0,8)}</span>
            <span style={{ fontSize:12, color:C.red, fontWeight:700 }}>+{b.breach_mins||'?'} min late</span>
          </div>
          <div style={{ fontSize:12, color:C.muted }}>{b.orders?.delivery_address}</div>
          <div style={{ fontSize:11, color:C.muted, marginTop:4 }}>{new Date(b.created_at).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})} · Action: {ACTION_LABELS[b.action_taken]||b.action_taken}</div>
        </Card>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 25. MULTI-LOCATION MANAGER
// ═══════════════════════════════════════════════════════════════
export function MultiLocationManager() {
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)

  useEffect(() => {
    supabase.from('app_locations').select('*').order('created_at')
      .then(({ data }) => { setLocations(data||[]); setLoading(false) })
      .catch(()=>{
        setLocations([{ id:'ibiza', name:'Ibiza', country:'Spain', active:true, primary:true, geocoding_bias:'1.4326,38.9067', geocoding_bounds:'1.15,38.82,1.75,39.15', currency:'EUR', timezone:'Europe/Madrid' }])
        setLoading(false)
      })
  }, [])

  const save = async (loc) => {
    if (loc.id) {
      await supabase.from('app_locations').upsert(loc, { onConflict:'id' })
    } else {
      await supabase.from('app_locations').insert(loc)
    }
    toast.success('Location saved!')
    setEditing(null)
    const { data } = await supabase.from('app_locations').select('*').order('created_at')
    if (data) setLocations(data)
  }

  return (
    <div style={{ padding:20 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h2 style={{ fontFamily:F.serif, fontSize:26, margin:0 }}>Multi-Location Manager</h2>
          <div style={{ fontSize:13, color:C.muted }}>Add new delivery cities without code changes</div>
        </div>
        <Btn onClick={()=>setEditing({ name:'', country:'Spain', active:false, primary:false, geocoding_bias:'', geocoding_bounds:'', currency:'EUR', timezone:'Europe/Madrid' })}>+ Add location</Btn>
      </div>

      <div style={{ padding:'12px 16px', background:C.blueL, border:'1px solid '+C.blue+'40', borderRadius:10, fontSize:13, color:C.blue, marginBottom:20 }}>
        🌍 Each location gets its own geocoding bias, delivery zones, and operating hours. The customer app reads the active location from ops settings.
      </div>

      {loading ? <div style={{textAlign:'center',padding:32,color:C.muted}}>Loading...</div>
      : locations.map(loc=>(
        <Card key={loc.id||loc.name} style={{ padding:18, marginBottom:12 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
            <div>
              <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:4 }}>
                <div style={{ fontSize:17, fontWeight:700, color:C.text }}>{loc.name}</div>
                {loc.primary && <span style={{ fontSize:10, background:C.accentL, color:C.accent, padding:'2px 8px', borderRadius:99, fontWeight:700 }}>PRIMARY</span>}
                <span style={{ fontSize:10, background:loc.active?C.greenL:C.border, color:loc.active?C.green:C.muted, padding:'2px 8px', borderRadius:99, fontWeight:700 }}>{loc.active?'Active':'Inactive'}</span>
              </div>
              <div style={{ fontSize:12, color:C.muted }}>{loc.country} · {loc.currency} · {loc.timezone}</div>
              <div style={{ fontSize:11, color:C.muted, marginTop:4, fontFamily:'monospace' }}>Bias: {loc.geocoding_bias} · Bounds: {loc.geocoding_bounds}</div>
            </div>
            <Btn onClick={()=>setEditing({...loc})} outline color={C.accent} style={{ fontSize:12, padding:'6px 14px' }}>Edit</Btn>
          </div>
        </Card>
      ))}

      {editing && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ background:C.card, borderRadius:16, padding:28, maxWidth:500, width:'100%', maxHeight:'85vh', overflowY:'auto' }}>
            <div style={{ fontFamily:F.serif, fontSize:22, marginBottom:20 }}>{editing.id?'Edit':'Add'} location</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {[['name','City name'],['country','Country'],['geocoding_bias','Geocoding bias (lng,lat)'],['geocoding_bounds','Bounding box (W,S,E,N)'],['currency','Currency'],['timezone','Timezone']].map(([k,l])=>(
                <div key={k}>
                  <div style={{ fontSize:11, color:C.muted, marginBottom:5, textTransform:'uppercase' }}>{l}</div>
                  <input value={editing[k]||''} onChange={e=>setEditing(p=>({...p,[k]:e.target.value}))}
                    style={{ width:'100%', padding:'9px 12px', border:'1px solid '+C.border, borderRadius:8, fontSize:13, fontFamily:F.sans, boxSizing:'border-box' }} />
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:8, marginTop:16 }}>
              <Btn onClick={()=>save(editing)} color={C.green} style={{ flex:1, justifyContent:'center' }}>Save location</Btn>
              <Btn onClick={()=>setEditing(null)} outline color={C.muted}>Cancel</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
