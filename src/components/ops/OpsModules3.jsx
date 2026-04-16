import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

const C = {
  bg:'#F5F0E8', card:'#FFFFFF', accent:'#C4683A', accentL:'rgba(196,104,58,0.1)',
  green:'#1D9E75', greenL:'rgba(29,158,117,0.1)', blue:'#2B7A8B', blueL:'rgba(43,122,139,0.1)',
  red:'#C43A3A', redL:'rgba(196,58,58,0.1)', yellow:'#B8860B', yellowL:'rgba(184,134,11,0.1)',
  purple:'#6B3A8B', purpleL:'rgba(107,58,139,0.1)',
  text:'#2A2318', muted:'#7A6E60', border:'rgba(42,35,24,0.12)',
}
function Card({ children, style={} }) {
  return <div style={{ background:C.card, borderRadius:12, border:'0.5px solid '+C.border, ...style }}>{children}</div>
}
function Badge({ label, color=C.accent, bg }) {
  return <span style={{ padding:'3px 10px', borderRadius:99, background:bg||color+'18', color, fontSize:11, fontWeight:700, whiteSpace:'nowrap' }}>{label}</span>
}
function Btn({ children, onClick, color=C.accent, outline, disabled, style={} }) {
  return <button onClick={onClick} disabled={disabled} style={{ padding:'9px 18px', background:outline?'transparent':disabled?C.border:color, border:outline?'1px solid '+color:'none', borderRadius:8, color:outline?color:'white', fontSize:13, fontWeight:600, cursor:disabled?'default':'pointer', opacity:disabled?0.5:1, fontFamily:'DM Sans,sans-serif', ...style }}>{children}</button>
}

// ═══════════════════════════════════════════════════════════════
// 6. CUSTOMER LTV DASHBOARD
// ═══════════════════════════════════════════════════════════════
export function CustomerLTV() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState('ltv')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data: orders } = await supabase
        .from('orders')
        .select('customer_id, total, status, created_at, order_items(products(category,name,emoji))')
        .eq('status','delivered')
        .order('created_at', { ascending:false })

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, created_at')
        .eq('role','customer')

      if (!orders || !profiles) { setLoading(false); return }

      const byCustomer = {}
      orders.forEach(o => {
        if (!o.customer_id) return
        if (!byCustomer[o.customer_id]) byCustomer[o.customer_id] = { orders:[], total:0, lastOrder:null, categories:{} }
        byCustomer[o.customer_id].orders.push(o)
        byCustomer[o.customer_id].total += (o.total||0)
        const d = new Date(o.created_at)
        if (!byCustomer[o.customer_id].lastOrder || d > new Date(byCustomer[o.customer_id].lastOrder)) {
          byCustomer[o.customer_id].lastOrder = o.created_at
        }
        o.order_items?.forEach(item => {
          const cat = item.products?.category || 'other'
          byCustomer[o.customer_id].categories[cat] = (byCustomer[o.customer_id].categories[cat]||0)+1
        })
      })

      const now = Date.now()
      const enriched = profiles.map(p => {
        const d = byCustomer[p.id] || { orders:[], total:0, lastOrder:null, categories:{} }
        const daysSinceLast = d.lastOrder ? Math.floor((now - new Date(d.lastOrder))/86400000) : 999
        const orderCount = d.orders.length
        const ltv = d.total
        const aov = orderCount > 0 ? ltv/orderCount : 0
        const topCat = Object.entries(d.categories).sort((a,b)=>b[1]-a[1])[0]?.[0] || '—'
        const churnRisk = daysSinceLast > 30 ? 'high' : daysSinceLast > 14 ? 'medium' : 'low'
        const segment = ltv > 500 ? 'VIP' : ltv > 100 ? 'Regular' : orderCount > 0 ? 'New' : 'Inactive'
        return { ...p, ltv, orderCount, aov, daysSinceLast, topCat, churnRisk, segment }
      }).filter(c => c.orderCount > 0 || c.segment !== 'Inactive')

      const sorted = enriched.sort((a,b) => {
        if (sort==='ltv') return b.ltv-a.ltv
        if (sort==='orders') return b.orderCount-a.orderCount
        if (sort==='recent') return a.daysSinceLast-b.daysSinceLast
        if (sort==='risk') return (b.churnRisk==='high'?2:b.churnRisk==='medium'?1:0)-(a.churnRisk==='high'?2:a.churnRisk==='medium'?1:0)
        return 0
      })
      setCustomers(sorted)
      setLoading(false)
    }
    load()
  }, [sort])

  const segColor = s => s==='VIP'?C.yellow:s==='Regular'?C.blue:s==='New'?C.green:C.muted
  const riskColor = r => r==='high'?C.red:r==='medium'?C.yellow:C.green
  const totalLTV = customers.reduce((s,c)=>s+c.ltv,0)
  const vips = customers.filter(c=>c.segment==='VIP').length
  const atRisk = customers.filter(c=>c.churnRisk==='high').length

  return (
    <div style={{ padding:20 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h2 style={{ fontFamily:'DM Serif Display,serif', fontSize:24, margin:0 }}>Customer Lifetime Value</h2>
          <div style={{ fontSize:13, color:C.muted, marginTop:2 }}>Segment, rank and predict customer behaviour</div>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {[['ltv','By LTV'],['orders','By orders'],['recent','Most recent'],['risk','Churn risk']].map(([k,l]) => (
            <Btn key={k} onClick={()=>setSort(k)} outline={sort!==k} color={C.accent} style={{fontSize:12,padding:'6px 12px'}}>{l}</Btn>
          ))}
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }}>
        {[
          { icon:'💰', val:'€'+totalLTV.toFixed(0), label:'Total customer LTV', color:C.green },
          { icon:'👑', val:vips, label:'VIP customers', color:C.yellow },
          { icon:'⚠️', val:atRisk, label:'At churn risk', color:C.red },
          { icon:'📊', val:customers.length, label:'Total customers', color:C.blue },
        ].map(s => (
          <Card key={s.label} style={{ padding:'14px 18px' }}>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <div><div style={{ fontSize:24, fontWeight:700, color:s.color }}>{s.val}</div><div style={{ fontSize:12, color:C.muted, marginTop:4 }}>{s.label}</div></div>
              <span style={{ fontSize:22 }}>{s.icon}</span>
            </div>
          </Card>
        ))}
      </div>

      {loading ? <div style={{textAlign:'center',padding:40,color:C.muted}}>Loading customer data...</div>
      : (
        <Card>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead>
              <tr style={{ background:C.bg }}>
                {['Customer','Segment','LTV','Orders','AOV','Last order','Fav category','Churn risk'].map(h => (
                  <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontWeight:700, color:C.muted, fontSize:11, textTransform:'uppercase', borderBottom:'1px solid '+C.border }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {customers.slice(0,50).map((c,i) => (
                <tr key={c.id} style={{ borderBottom:'0.5px solid '+C.border, background:i%2===0?'white':C.bg, cursor:'pointer' }} onClick={()=>setSelected(c)}>
                  <td style={{ padding:'10px 14px', fontWeight:600, color:C.text }}>{c.full_name||'—'}</td>
                  <td style={{ padding:'10px 14px' }}><Badge label={c.segment} color={segColor(c.segment)} /></td>
                  <td style={{ padding:'10px 14px', fontWeight:700, color:C.green }}>€{c.ltv.toFixed(2)}</td>
                  <td style={{ padding:'10px 14px', textAlign:'center' }}>{c.orderCount}</td>
                  <td style={{ padding:'10px 14px' }}>€{c.aov.toFixed(2)}</td>
                  <td style={{ padding:'10px 14px', color:c.daysSinceLast>14?C.red:C.muted }}>{c.daysSinceLast<999?c.daysSinceLast+'d ago':'Never'}</td>
                  <td style={{ padding:'10px 14px', color:C.muted, textTransform:'capitalize' }}>{c.topCat}</td>
                  <td style={{ padding:'10px 14px' }}><Badge label={c.churnRisk} color={riskColor(c.churnRisk)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 7. REFERRAL MANAGER
// ═══════════════════════════════════════════════════════════════
export function ReferralManager() {
  const [codes, setCodes] = useState([])
  const [stats, setStats] = useState({ totalReferrals:0, totalRevenue:0, totalSpend:0, roi:0 })
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [newCode, setNewCode] = useState({ code:'', reward:10, minOrder:20, maxUses:100, expiresAt:'' })

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('referral_codes')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending:false })

    if (data) {
      setCodes(data)
      const totalUses = data.reduce((s,c)=>s+(c.uses||0),0)
      const totalSpend = data.reduce((s,c)=>s+(c.uses||0)*(c.reward||0),0)
      const totalRevenue = data.reduce((s,c)=>s+(c.revenue_generated||0),0)
      setStats({ totalReferrals:totalUses, totalRevenue, totalSpend, roi:totalSpend>0?((totalRevenue-totalSpend)/totalSpend*100).toFixed(0):0 })
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const createCode = async () => {
    if (!newCode.code) return
    await supabase.from('referral_codes').insert({
      code: newCode.code.toUpperCase(),
      reward_eur: newCode.reward,
      min_order: newCode.minOrder,
      max_uses: newCode.maxUses,
      expires_at: newCode.expiresAt || null,
      uses: 0, status: 'active'
    })
    setShowNew(false)
    setNewCode({ code:'', reward:10, minOrder:20, maxUses:100, expiresAt:'' })
    load()
  }

  const toggleCode = async (id, status) => {
    await supabase.from('referral_codes').update({ status: status==='active'?'paused':'active' }).eq('id',id)
    load()
  }

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = 'ISLA'
    for (let i=0;i<4;i++) code += chars[Math.floor(Math.random()*chars.length)]
    setNewCode(p=>({...p,code}))
  }

  return (
    <div style={{ padding:20 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h2 style={{ fontFamily:'DM Serif Display,serif', fontSize:24, margin:0 }}>Referral Manager</h2>
          <div style={{ fontSize:13, color:C.muted, marginTop:2 }}>Track referral codes, usage and ROI</div>
        </div>
        <Btn onClick={()=>setShowNew(true)}>+ Create code</Btn>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }}>
        {[
          { icon:'🔗', val:stats.totalReferrals, label:'Total referrals', color:C.blue },
          { icon:'💰', val:'€'+stats.totalRevenue.toFixed(0), label:'Revenue generated', color:C.green },
          { icon:'🎁', val:'€'+stats.totalSpend.toFixed(0), label:'Rewards paid out', color:C.accent },
          { icon:'📈', val:stats.roi+'%', label:'ROI on referrals', color:parseInt(stats.roi)>100?C.green:C.red },
        ].map(s => (
          <Card key={s.label} style={{ padding:'14px 18px' }}>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <div><div style={{ fontSize:24, fontWeight:700, color:s.color }}>{s.val}</div><div style={{ fontSize:12, color:C.muted, marginTop:4 }}>{s.label}</div></div>
              <span style={{ fontSize:22 }}>{s.icon}</span>
            </div>
          </Card>
        ))}
      </div>

      {loading ? <div style={{textAlign:'center',padding:40,color:C.muted}}>Loading...</div>
      : codes.length===0 ? (
        <Card style={{ padding:48, textAlign:'center' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🔗</div>
          <div style={{ fontFamily:'DM Serif Display,serif', fontSize:20, marginBottom:8 }}>No referral codes yet</div>
          <div style={{ fontSize:13, color:C.muted, marginBottom:16 }}>Create your first referral code to start tracking</div>
          <Btn onClick={()=>setShowNew(true)}>Create first code</Btn>
        </Card>
      ) : (
        <Card>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead>
              <tr style={{ background:C.bg }}>
                {['Code','Reward','Min order','Uses','Max uses','Revenue','Expires','Status',''].map(h => (
                  <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontWeight:700, color:C.muted, fontSize:11, textTransform:'uppercase', borderBottom:'1px solid '+C.border }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {codes.map((c,i) => (
                <tr key={c.id} style={{ borderBottom:'0.5px solid '+C.border, background:i%2===0?'white':C.bg }}>
                  <td style={{ padding:'10px 14px', fontFamily:'monospace', fontWeight:700, fontSize:14, color:C.accent }}>{c.code}</td>
                  <td style={{ padding:'10px 14px', fontWeight:700, color:C.green }}>€{c.reward_eur}</td>
                  <td style={{ padding:'10px 14px' }}>€{c.min_order}</td>
                  <td style={{ padding:'10px 14px', textAlign:'center', fontWeight:700 }}>{c.uses||0}</td>
                  <td style={{ padding:'10px 14px', textAlign:'center', color:C.muted }}>{c.max_uses||'∞'}</td>
                  <td style={{ padding:'10px 14px', fontWeight:700, color:C.green }}>€{(c.revenue_generated||0).toFixed(0)}</td>
                  <td style={{ padding:'10px 14px', color:C.muted }}>{c.expires_at?new Date(c.expires_at).toLocaleDateString('en-GB'):'Never'}</td>
                  <td style={{ padding:'10px 14px' }}><Badge label={c.status||'active'} color={c.status==='active'?C.green:C.muted} /></td>
                  <td style={{ padding:'10px 14px' }}>
                    <Btn onClick={()=>toggleCode(c.id,c.status)} outline color={c.status==='active'?C.muted:C.green} style={{fontSize:11,padding:'4px 10px'}}>
                      {c.status==='active'?'Pause':'Resume'}
                    </Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {showNew && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={()=>setShowNew(false)}>
          <div style={{ background:C.card, borderRadius:16, padding:28, maxWidth:440, width:'90%' }} onClick={e=>e.stopPropagation()}>
            <div style={{ fontFamily:'DM Serif Display,serif', fontSize:20, marginBottom:20 }}>Create referral code</div>
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:11, color:C.muted, marginBottom:4, textTransform:'uppercase' }}>Code</div>
              <div style={{ display:'flex', gap:8 }}>
                <input value={newCode.code} onChange={e=>setNewCode(p=>({...p,code:e.target.value.toUpperCase()}))}
                  placeholder="e.g. ISLAFRND" style={{ flex:1, padding:'9px 12px', border:'1px solid '+C.border, borderRadius:8, fontSize:14, fontFamily:'monospace', fontWeight:700 }} />
                <Btn onClick={generateCode} outline color={C.blue} style={{fontSize:12,padding:'9px 14px'}}>Generate</Btn>
              </div>
            </div>
            {[['reward','Referral reward (€)','number'],['minOrder','Minimum order value (€)','number'],['maxUses','Maximum uses','number']].map(([k,label,type]) => (
              <div key={k} style={{ marginBottom:12 }}>
                <div style={{ fontSize:11, color:C.muted, marginBottom:4, textTransform:'uppercase' }}>{label}</div>
                <input type={type} value={newCode[k]} onChange={e=>setNewCode(p=>({...p,[k]:parseFloat(e.target.value)||0}))}
                  style={{ width:'100%', padding:'9px 12px', border:'1px solid '+C.border, borderRadius:8, fontSize:13, boxSizing:'border-box' }} />
              </div>
            ))}
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:11, color:C.muted, marginBottom:4, textTransform:'uppercase' }}>Expires (optional)</div>
              <input type="date" value={newCode.expiresAt} onChange={e=>setNewCode(p=>({...p,expiresAt:e.target.value}))}
                style={{ width:'100%', padding:'9px 12px', border:'1px solid '+C.border, borderRadius:8, fontSize:13, boxSizing:'border-box' }} />
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <Btn onClick={createCode} color={C.accent} style={{flex:1,justifyContent:'center'}}>Create code</Btn>
              <Btn onClick={()=>setShowNew(false)} outline color={C.muted}>Cancel</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 8. DRIVER DOCUMENT MANAGEMENT
// ═══════════════════════════════════════════════════════════════
export function DriverDocuments() {
  const [drivers, setDrivers] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('profiles')
        .select('*, driver_documents(*)')
        .eq('role','driver')
        .order('created_at', { ascending:false })
      setDrivers(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const DOC_TYPES = [
    { id:'id_front', label:'ID / Passport (front)', required:true },
    { id:'id_back', label:'ID / Passport (back)', required:true },
    { id:'driving_license', label:'Driving licence', required:true },
    { id:'vehicle_insurance', label:'Vehicle insurance', required:true },
    { id:'vehicle_registration', label:'Vehicle registration', required:true },
    { id:'profile_photo', label:'Profile photo', required:false },
  ]

  const getDocStatus = (driver, docType) => {
    const docs = driver.driver_documents || []
    const doc = docs.find(d=>d.doc_type===docType)
    if (!doc) return 'missing'
    if (doc.status==='approved') return 'approved'
    if (doc.status==='rejected') return 'rejected'
    return 'pending'
  }

  const approveDoc = async (docId) => {
    await supabase.from('driver_documents').update({ status:'approved', reviewed_at:new Date().toISOString() }).eq('id',docId)
    const { data } = await supabase.from('profiles').select('*, driver_documents(*)').eq('id',selected.id).single()
    if (data) setSelected(data)
  }

  const statusColor = s => s==='approved'?C.green:s==='rejected'?C.red:s==='pending'?C.yellow:C.muted
  const statusIcon = s => s==='approved'?'✅':s==='rejected'?'❌':s==='pending'?'⏳':'📋'

  const complianceScore = (driver) => {
    const req = DOC_TYPES.filter(d=>d.required)
    const approved = req.filter(d=>getDocStatus(driver,d.id)==='approved').length
    return Math.round((approved/req.length)*100)
  }

  return (
    <div style={{ padding:20 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h2 style={{ fontFamily:'DM Serif Display,serif', fontSize:24, margin:0 }}>Driver Documents</h2>
          <div style={{ fontSize:13, color:C.muted, marginTop:2 }}>Review and approve driver documentation</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <span style={{ fontSize:13, color:C.red, fontWeight:600 }}>
            {drivers.filter(d=>complianceScore(d)<100).length} incomplete
          </span>
          <span style={{ fontSize:13, color:C.green, fontWeight:600 }}>
            {drivers.filter(d=>complianceScore(d)===100).length} fully verified
          </span>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:selected?'1fr 1fr':'repeat(auto-fit,minmax(280px,1fr))', gap:16 }}>
        <div>
          {loading ? <div style={{textAlign:'center',padding:40,color:C.muted}}>Loading drivers...</div>
          : drivers.map(driver => {
            const score = complianceScore(driver)
            return (
              <Card key={driver.id} style={{ padding:16, marginBottom:10, cursor:'pointer', borderLeft:'3px solid '+(score===100?C.green:score>50?C.yellow:C.red) }} onClick={()=>setSelected(driver)}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                  <div style={{ fontSize:14, fontWeight:700 }}>{driver.full_name}</div>
                  <div style={{ fontSize:20, fontWeight:800, color:score===100?C.green:score>50?C.yellow:C.red }}>{score}%</div>
                </div>
                <div style={{ height:6, background:C.border, borderRadius:99, overflow:'hidden', marginBottom:8 }}>
                  <div style={{ height:'100%', background:score===100?C.green:score>50?C.yellow:C.red, borderRadius:99, width:score+'%' }} />
                </div>
                <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                  {DOC_TYPES.filter(d=>d.required).map(d => (
                    <span key={d.id} title={d.label}>{statusIcon(getDocStatus(driver,d.id))}</span>
                  ))}
                </div>
              </Card>
            )
          })}
        </div>

        {selected && (
          <Card style={{ padding:20, height:'fit-content' }}>
            <div style={{ fontFamily:'DM Serif Display,serif', fontSize:18, marginBottom:4 }}>{selected.full_name}</div>
            <div style={{ fontSize:12, color:C.muted, marginBottom:20 }}>Document review</div>
            {DOC_TYPES.map(docType => {
              const status = getDocStatus(selected, docType.id)
              const doc = (selected.driver_documents||[]).find(d=>d.doc_type===docType.id)
              return (
                <div key={docType.id} style={{ padding:'12px 0', borderBottom:'0.5px solid '+C.border }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600, color:C.text }}>
                        {docType.label}
                        {docType.required && <span style={{ color:C.red, marginLeft:4 }}>*</span>}
                      </div>
                      {doc?.expires_at && <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>Expires: {new Date(doc.expires_at).toLocaleDateString('en-GB')}</div>}
                    </div>
                    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                      <Badge label={status} color={statusColor(status)} />
                      {status==='pending' && doc && (
                        <button onClick={()=>approveDoc(doc.id)} style={{ padding:'4px 10px', background:C.greenL, border:'1px solid '+C.green+'40', borderRadius:6, color:C.green, fontSize:11, fontWeight:700, cursor:'pointer' }}>
                          Approve
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
            <button onClick={()=>setSelected(null)} style={{ marginTop:16, background:'none', border:'1px solid '+C.border, borderRadius:8, padding:'8px 16px', cursor:'pointer', fontSize:13, color:C.muted }}>
              Close
            </button>
          </Card>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 9. INVENTORY FORECASTING
// ═══════════════════════════════════════════════════════════════
export function InventoryForecasting() {
  const [forecasts, setForecasts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate()-7)
      const [productsRes, salesRes] = await Promise.all([
        supabase.from('products').select('id, name, emoji, category, stock_quantity, is_active').eq('is_active',true),
        supabase.from('order_items').select('product_id, quantity').gte('created_at', sevenDaysAgo.toISOString()),
      ])
      const products = productsRes.data || []
      const sales = salesRes.data || []

      const salesByProduct = {}
      sales.forEach(s => {
        salesByProduct[s.product_id] = (salesByProduct[s.product_id]||0) + s.quantity
      })

      const enriched = products.map(p => {
        const weekSales = salesByProduct[p.id] || 0
        const dailyVelocity = weekSales / 7
        const stock = p.stock_quantity || 0
        const daysLeft = dailyVelocity > 0 ? stock / dailyVelocity : 999
        const reorderQty = Math.max(0, Math.ceil(dailyVelocity * 14) - stock)
        const urgency = daysLeft < 2 ? 'critical' : daysLeft < 5 ? 'warning' : 'ok'
        return { ...p, weekSales, dailyVelocity, daysLeft, reorderQty, urgency }
      }).sort((a,b) => {
        const uOrder = {critical:0,warning:1,ok:2}
        return uOrder[a.urgency]-uOrder[b.urgency] || a.daysLeft-b.daysLeft
      })
      setForecasts(enriched)
      setLoading(false)
    }
    load()
  }, [])

  const urgencyColor = u => u==='critical'?C.red:u==='warning'?C.yellow:C.green
  const urgencyLabel = u => u==='critical'?'🚨 Reorder now':u==='warning'?'⚠️ Reorder soon':'✅ Sufficient'

  const critical = forecasts.filter(f=>f.urgency==='critical').length
  const warning = forecasts.filter(f=>f.urgency==='warning').length

  return (
    <div style={{ padding:20 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h2 style={{ fontFamily:'DM Serif Display,serif', fontSize:24, margin:0 }}>Inventory Forecasting</h2>
          <div style={{ fontSize:13, color:C.muted, marginTop:2 }}>Based on last 7 days sales velocity</div>
        </div>
        <div style={{ display:'flex', gap:12 }}>
          {critical>0 && <span style={{ fontSize:13, color:C.red, fontWeight:700 }}>🚨 {critical} critical</span>}
          {warning>0 && <span style={{ fontSize:13, color:C.yellow, fontWeight:700 }}>⚠️ {warning} low</span>}
        </div>
      </div>

      {loading ? <div style={{textAlign:'center',padding:40,color:C.muted}}>Analysing sales velocity...</div>
      : (
        <Card>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead>
              <tr style={{ background:C.bg }}>
                {['Product','Current stock','Daily sales','Days remaining','Reorder qty','Status'].map(h => (
                  <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontWeight:700, color:C.muted, fontSize:11, textTransform:'uppercase', borderBottom:'1px solid '+C.border }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {forecasts.map((f,i) => (
                <tr key={f.id} style={{ borderBottom:'0.5px solid '+C.border, background:f.urgency==='critical'?C.redL:f.urgency==='warning'?C.yellowL:i%2===0?'white':C.bg }}>
                  <td style={{ padding:'10px 14px' }}>
                    <span style={{ fontSize:16, marginRight:8 }}>{f.emoji}</span>
                    <span style={{ fontWeight:600, color:C.text }}>{f.name}</span>
                  </td>
                  <td style={{ padding:'10px 14px', fontWeight:700, color:f.stock_quantity<5?C.red:C.text }}>
                    {f.stock_quantity ?? '—'}
                  </td>
                  <td style={{ padding:'10px 14px', color:C.muted }}>
                    {f.dailyVelocity.toFixed(1)}/day
                  </td>
                  <td style={{ padding:'10px 14px', fontWeight:700, color:urgencyColor(f.urgency) }}>
                    {f.daysLeft > 100 ? '100+ days' : f.daysLeft.toFixed(1)+' days'}
                  </td>
                  <td style={{ padding:'10px 14px', fontWeight:700, color:f.reorderQty>0?C.accent:C.muted }}>
                    {f.reorderQty > 0 ? '+'+f.reorderQty+' units' : '—'}
                  </td>
                  <td style={{ padding:'10px 14px' }}>
                    <Badge label={urgencyLabel(f.urgency)} color={urgencyColor(f.urgency)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Card style={{ padding:16, marginTop:16, background:C.blueL, border:'1px solid '+C.blue+'30' }}>
        <div style={{ fontSize:12, fontWeight:700, color:C.blue, marginBottom:4 }}>💡 How forecasting works</div>
        <div style={{ fontSize:12, color:C.muted, lineHeight:1.6 }}>
          Sales velocity is calculated from the last 7 days. Products with less than 5 days of stock remaining are flagged as critical.
          Reorder quantity covers 14 days of projected demand minus current stock.
          Connect your supplier contacts in the Suppliers tab to send reorder emails directly.
        </div>
      </Card>
    </div>
  )
}
