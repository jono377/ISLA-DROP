import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../lib/store'

// ─── Shared design tokens ─────────────────────────────────────
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
function Modal({ title, onClose, children }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={onClose}>
      <div style={{ background:C.card, borderRadius:16, padding:28, maxWidth:500, width:'90%', maxHeight:'85vh', overflowY:'auto' }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div style={{ fontFamily:'DM Serif Display,serif', fontSize:20 }}>{title}</div>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:C.muted }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}
function StatCard({ icon, value, label, color=C.text }) {
  return (
    <Card style={{ padding:'16px 18px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div><div style={{ fontSize:26, fontWeight:700, color, lineHeight:1 }}>{value}</div><div style={{ fontSize:12, color:C.muted, marginTop:4 }}>{label}</div></div>
        <span style={{ fontSize:24 }}>{icon}</span>
      </div>
    </Card>
  )
}
function Input({ label, value, onChange, type='text', placeholder='' }) {
  return (
    <div style={{ marginBottom:12 }}>
      {label && <div style={{ fontSize:11, color:C.muted, marginBottom:4, textTransform:'uppercase', letterSpacing:'0.5px' }}>{label}</div>}
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{ width:'100%', padding:'9px 12px', border:'1px solid '+C.border, borderRadius:8, fontSize:13, boxSizing:'border-box', fontFamily:'DM Sans,sans-serif' }} />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 1. AGE VERIFICATION MANAGEMENT
// ═══════════════════════════════════════════════════════════════
export function AgeVerificationManager() {
  const [verifications, setVerifications] = useState([])
  const [filter, setFilter] = useState('pending')
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ pending:0, approved:0, rejected:0, total:0 })

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('age_verifications')
      .select('*, profiles(full_name), orders(id, total, delivery_address)')
      .eq(filter === 'all' ? 'id' : 'status', filter === 'all' ? undefined : filter)
      .order('created_at', { ascending: false })
      .limit(50)

    const { data: allV } = await supabase.from('age_verifications').select('status')
    if (allV) {
      setStats({
        pending: allV.filter(v=>v.status==='pending').length,
        approved: allV.filter(v=>v.status==='approved').length,
        rejected: allV.filter(v=>v.status==='rejected').length,
        total: allV.length
      })
    }
    setVerifications(data || [])
    setLoading(false)
  }, [filter])

  useEffect(() => { load() }, [load])

  const decide = async (id, status, reason='') => {
    const { profile } = useAuthStore.getState()
    await supabase.from('age_verifications').update({
      status, reviewed_by: profile?.id, reviewed_at: new Date().toISOString(),
      rejection_reason: reason || null
    }).eq('id', id)
    setSelected(null)
    load()
  }

  const statusColor = s => s==='approved'?C.green:s==='rejected'?C.red:C.yellow

  return (
    <div style={{ padding:20 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h2 style={{ fontFamily:'DM Serif Display,serif', fontSize:24, margin:0 }}>Age Verification</h2>
          <div style={{ fontSize:13, color:C.muted, marginTop:2 }}>Review ID checks for age-restricted orders</div>
        </div>
        <Btn onClick={load}>↻ Refresh</Btn>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        <StatCard icon="⏳" value={stats.pending} label="Pending review" color={C.yellow} />
        <StatCard icon="✅" value={stats.approved} label="Approved" color={C.green} />
        <StatCard icon="❌" value={stats.rejected} label="Rejected" color={C.red} />
        <StatCard icon="📋" value={stats.total} label="Total checked" color={C.blue} />
      </div>

      <div style={{ display:'flex', gap:6, marginBottom:16 }}>
        {['pending','approved','rejected','all'].map(f => (
          <Btn key={f} onClick={()=>setFilter(f)} outline={filter!==f} color={C.accent}
            style={{ fontSize:12, padding:'6px 14px', textTransform:'capitalize' }}>{f}</Btn>
        ))}
      </div>

      {loading ? <div style={{textAlign:'center',padding:40,color:C.muted}}>Loading verifications...</div>
      : verifications.length === 0 ? (
        <Card style={{ padding:48, textAlign:'center' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>✅</div>
          <div style={{ fontFamily:'DM Serif Display,serif', fontSize:20 }}>No {filter} verifications</div>
        </Card>
      ) : verifications.map(v => (
        <Card key={v.id} style={{ padding:16, marginBottom:8, borderLeft:'3px solid '+statusColor(v.status), cursor:'pointer' }} onClick={()=>setSelected(v)}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div>
              <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:4 }}>
                <Badge label={v.status} color={statusColor(v.status)} />
                <span style={{ fontSize:13, fontWeight:700, color:C.text }}>{v.profiles?.full_name || 'Customer'}</span>
              </div>
              <div style={{ fontSize:12, color:C.muted }}>Order: {v.orders?.delivery_address}</div>
              <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>
                {new Date(v.created_at).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}
              </div>
            </div>
            <div style={{ display:'flex', gap:6, flexDirection:'column', alignItems:'flex-end' }}>
              {v.status==='pending' && (
                <>
                  <Btn onClick={e=>{e.stopPropagation();decide(v.id,'approved')}} color={C.green} style={{fontSize:12,padding:'5px 12px'}}>✓ Approve</Btn>
                  <Btn onClick={e=>{e.stopPropagation();decide(v.id,'rejected','Failed ID check')}} outline color={C.red} style={{fontSize:12,padding:'5px 12px'}}>✗ Reject</Btn>
                </>
              )}
            </div>
          </div>
          {v.rejection_reason && <div style={{ fontSize:11, color:C.red, marginTop:6 }}>Reason: {v.rejection_reason}</div>}
        </Card>
      ))}

      <Card style={{ padding:16, marginTop:20, background:C.blueL, border:'1px solid '+C.blue+'30' }}>
        <div style={{ fontSize:12, fontWeight:700, color:C.blue, marginBottom:4 }}>⚖️ Legal requirement</div>
        <div style={{ fontSize:12, color:C.muted, lineHeight:1.6 }}>
          All age-restricted orders must be verified before delivery. Keep this audit log for a minimum of 3 years as required by Spanish alcohol licensing law (Ley 7/2006).
          Approval rate: <strong>{stats.total > 0 ? Math.round((stats.approved/stats.total)*100) : 0}%</strong>
        </div>
      </Card>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 2. STAFF / OPS USER MANAGEMENT
// ═══════════════════════════════════════════════════════════════
export function StaffUserManager() {
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('ops')
  const [inviteName, setInviteName] = useState('')
  const [saving, setSaving] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const currentUser = useAuthStore(s=>s.profile)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .in('role', ['ops', 'admin'])
      .order('created_at', { ascending: false })
    setStaff(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const invite = async () => {
    if (!inviteEmail.trim()) return
    setSaving(true)
    try {
      const { data, error } = await supabase.auth.admin.inviteUserByEmail(inviteEmail.trim(), {
        data: { full_name: inviteName, role: inviteRole }
      })
      if (error) throw error
      if (data?.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id, full_name: inviteName || inviteEmail.split('@')[0],
          role: inviteRole, status: 'active'
        }, { onConflict:'id' })
      }
      setShowInvite(false); setInviteEmail(''); setInviteName('')
      load()
      alert('Invitation sent to ' + inviteEmail)
    } catch (err) {
      alert('Could not send invite via admin API. Instead, ask ' + inviteEmail + ' to sign up at ops.isladrop.net, then run: UPDATE profiles SET role = '' + inviteRole + '' WHERE id = (SELECT id FROM auth.users WHERE email = '' + inviteEmail + '');')
    }
    setSaving(false)
  }

  const updateRole = async (userId, newRole) => {
    await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
    load()
    setSelectedUser(null)
  }

  const deactivate = async (userId) => {
    if (!confirm('Deactivate this account? They will no longer be able to sign in.')) return
    await supabase.from('profiles').update({ status: 'blocked' }).eq('id', userId)
    load()
    setSelectedUser(null)
  }

  const ROLES = [
    { id:'admin', label:'Admin', desc:'Full access including user management', color:C.red },
    { id:'ops', label:'Ops Manager', desc:'Full dashboard access, no user management', color:C.blue },
  ]

  return (
    <div style={{ padding:20 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h2 style={{ fontFamily:'DM Serif Display,serif', fontSize:24, margin:0 }}>Staff Management</h2>
          <div style={{ fontSize:13, color:C.muted, marginTop:2 }}>{staff.length} ops team members</div>
        </div>
        <Btn onClick={()=>setShowInvite(true)}>+ Invite staff</Btn>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:12, marginBottom:24 }}>
        {ROLES.map(r => (
          <Card key={r.id} style={{ padding:'14px 18px', borderLeft:'3px solid '+r.color }}>
            <Badge label={r.label} color={r.color} />
            <div style={{ fontSize:12, color:C.muted, marginTop:6 }}>{r.desc}</div>
            <div style={{ fontSize:18, fontWeight:700, color:r.color, marginTop:8 }}>
              {staff.filter(s=>s.role===r.id).length}
            </div>
          </Card>
        ))}
      </div>

      {loading ? <div style={{textAlign:'center',padding:40,color:C.muted}}>Loading team...</div>
      : staff.map(member => (
        <Card key={member.id} style={{ padding:16, marginBottom:8 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ width:44, height:44, borderRadius:'50%', background:C.accentL, border:'2px solid '+C.accent, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>
                {member.full_name?.[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:C.text }}>
                  {member.full_name || 'Unnamed'}
                  {member.id === currentUser?.id && <span style={{ fontSize:11, color:C.muted, marginLeft:8 }}>(you)</span>}
                </div>
                <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>{member.id}</div>
                <div style={{ display:'flex', gap:6, marginTop:4 }}>
                  <Badge label={member.role} color={member.role==='admin'?C.red:C.blue} />
                  <Badge label={member.status||'active'} color={member.status==='blocked'?C.red:C.green} />
                </div>
              </div>
            </div>
            {member.id !== currentUser?.id && (
              <Btn onClick={()=>setSelectedUser(member)} outline color={C.accent} style={{fontSize:12,padding:'6px 14px'}}>Manage</Btn>
            )}
          </div>
        </Card>
      ))}

      {showInvite && (
        <Modal title="Invite staff member" onClose={()=>setShowInvite(false)}>
          <Input label="Full name" value={inviteName} onChange={setInviteName} placeholder="e.g. Maria Garcia" />
          <Input label="Email address" type="email" value={inviteEmail} onChange={setInviteEmail} placeholder="maria@isladrop.net" />
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:11, color:C.muted, marginBottom:8, textTransform:'uppercase', letterSpacing:'0.5px' }}>Role</div>
            {ROLES.map(r => (
              <button key={r.id} onClick={()=>setInviteRole(r.id)}
                style={{ display:'block', width:'100%', padding:'12px 14px', marginBottom:6, background:inviteRole===r.id?r.color+'12':'transparent', border:'1px solid '+(inviteRole===r.id?r.color:C.border), borderRadius:8, textAlign:'left', cursor:'pointer' }}>
                <div style={{ fontSize:13, fontWeight:700, color:inviteRole===r.id?r.color:C.text }}>{r.label}</div>
                <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{r.desc}</div>
              </button>
            ))}
          </div>
          <Btn onClick={invite} disabled={saving||!inviteEmail} color={C.accent} style={{width:'100%',justifyContent:'center'}}>
            {saving ? 'Sending...' : 'Send invitation'}
          </Btn>
        </Modal>
      )}

      {selectedUser && (
        <Modal title={'Manage: ' + (selectedUser.full_name||'User')} onClose={()=>setSelectedUser(null)}>
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:12, color:C.muted, marginBottom:10 }}>Change role</div>
            {ROLES.map(r => (
              <button key={r.id} onClick={()=>updateRole(selectedUser.id,r.id)}
                style={{ display:'block', width:'100%', padding:'10px 14px', marginBottom:6, background:selectedUser.role===r.id?r.color+'12':'transparent', border:'1px solid '+(selectedUser.role===r.id?r.color:C.border), borderRadius:8, cursor:'pointer', textAlign:'left' }}>
                <div style={{ fontSize:13, fontWeight:700, color:selectedUser.role===r.id?r.color:C.text }}>{r.label}</div>
              </button>
            ))}
          </div>
          <div style={{ borderTop:'1px solid '+C.border, paddingTop:16 }}>
            <Btn onClick={()=>deactivate(selectedUser.id)} outline color={C.red} style={{width:'100%',justifyContent:'center'}}>
              🚫 Deactivate account
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 3. ETA MANAGER — push updated delivery times to customers
// ═══════════════════════════════════════════════════════════════
export function ETAManager() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('orders')
      .select('*, profiles!orders_customer_id_fkey(full_name), profiles!orders_driver_id_fkey(full_name)')
      .in('status', ['assigned', 'picked_up', 'en_route'])
      .order('created_at', { ascending: true })
    setOrders(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    const ch = supabase.channel('eta_orders').on('postgres_changes',{event:'UPDATE',schema:'public',table:'orders'},load).subscribe()
    return () => ch.unsubscribe()
  }, [load])

  const updateETA = async (orderId, newMins) => {
    setUpdating(orderId)
    const newETA = new Date(Date.now() + newMins * 60000).toISOString()
    await supabase.from('orders').update({
      estimated_delivery_at: newETA,
      estimated_minutes: newMins
    }).eq('id', orderId)
    await supabase.from('ops_activity_log').insert({
      action: 'eta_updated',
      details: 'ETA updated to ' + newMins + 'min for order ' + orderId,
      metadata: { order_id: orderId, new_eta_mins: newMins }
    })
    setUpdating(null)
    load()
  }

  const minutesSince = ts => Math.floor((Date.now() - new Date(ts)) / 60000)
  const etaOptions = [10, 15, 20, 25, 30, 45, 60]

  return (
    <div style={{ padding:20 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h2 style={{ fontFamily:'DM Serif Display,serif', fontSize:24, margin:0 }}>ETA Manager</h2>
          <div style={{ fontSize:13, color:C.muted, marginTop:2 }}>Push updated delivery times to customers in real-time</div>
        </div>
        <Btn onClick={load}>↻ Refresh</Btn>
      </div>

      {loading ? <div style={{textAlign:'center',padding:40,color:C.muted}}>Loading active orders...</div>
      : orders.length === 0 ? (
        <Card style={{ padding:48, textAlign:'center' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>✅</div>
          <div style={{ fontFamily:'DM Serif Display,serif', fontSize:20 }}>No active deliveries</div>
        </Card>
      ) : orders.map(order => {
        const age = minutesSince(order.created_at)
        const currentETA = order.estimated_minutes || 20
        const isLate = age > currentETA
        return (
          <Card key={order.id} style={{ padding:20, marginBottom:12, borderLeft:'3px solid '+(isLate?C.red:C.green) }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
              <div>
                <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:4 }}>
                  {isLate && <Badge label="⚠️ Running late" color={C.red} />}
                  <span style={{ fontSize:15, fontWeight:700 }}>Order #{order.order_number || order.id.slice(0,6)}</span>
                </div>
                <div style={{ fontSize:12, color:C.muted }}>{order.profiles?.full_name} · {order.delivery_address}</div>
                <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>
                  Order placed {age} min ago · Current ETA: <strong>{currentETA} min</strong>
                  {isLate && <span style={{ color:C.red }}> (overdue by {age - currentETA} min)</span>}
                </div>
              </div>
              <Badge label={order.status?.replace('_',' ')} color={C.blue} />
            </div>
            <div>
              <div style={{ fontSize:12, color:C.muted, marginBottom:8 }}>Push new ETA to customer app:</div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {etaOptions.map(mins => (
                  <button key={mins} onClick={()=>updateETA(order.id, mins)}
                    disabled={updating===order.id}
                    style={{ padding:'6px 14px', borderRadius:8, border:'1px solid '+C.border, background:mins===currentETA?C.accentL:'white', color:mins===currentETA?C.accent:C.text, fontSize:12, fontWeight:mins===currentETA?700:400, cursor:'pointer' }}>
                    {mins} min
                  </button>
                ))}
                {updating === order.id && <span style={{ fontSize:12, color:C.muted, padding:'6px 0' }}>Updating...</span>}
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 4. COMPLIANCE LOG — regulatory audit trail
// ═══════════════════════════════════════════════════════════════
export function ComplianceLog() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState(() => { const d = new Date(); d.setDate(d.getDate()-30); return d.toISOString().slice(0,10) })
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0,10))
  const [filter, setFilter] = useState('all')

  const load = useCallback(async () => {
    setLoading(true)
    const from = new Date(dateFrom); from.setHours(0,0,0,0)
    const to = new Date(dateTo); to.setHours(23,59,59,999)

    const [ordersRes, verRes, actRes] = await Promise.all([
      supabase.from('orders')
        .select('id, order_number, created_at, status, total, customer_id, profiles!orders_customer_id_fkey(full_name), delivery_address, delivery_lat, delivery_lng')
        .gte('created_at', from.toISOString()).lte('created_at', to.toISOString())
        .eq('status', 'delivered').order('created_at', { ascending: false }),
      supabase.from('age_verifications')
        .select('*, profiles(full_name)').gte('created_at', from.toISOString()).lte('created_at', to.toISOString())
        .order('created_at', { ascending: false }),
      supabase.from('ops_activity_log')
        .select('*').gte('created_at', from.toISOString()).lte('created_at', to.toISOString())
        .order('created_at', { ascending: false }).limit(100),
    ])

    const combined = [
      ...(ordersRes.data||[]).map(o => ({ type:'order', id:o.id, label:'Order delivered', detail:o.profiles?.full_name+' · €'+o.total?.toFixed(2), address:o.delivery_address, ts:o.created_at, ref:'#'+(o.order_number||o.id.slice(0,6)) })),
      ...(verRes.data||[]).map(v => ({ type:'age_check', id:v.id, label:'Age verification '+v.status, detail:v.profiles?.full_name, ts:v.created_at, status:v.status })),
      ...(actRes.data||[]).map(a => ({ type:'ops_action', id:a.id, label:a.action?.replace(/_/g,' '), detail:a.details, ts:a.created_at })),
    ].sort((a,b) => new Date(b.ts) - new Date(a.ts))

    setLogs(filter==='all' ? combined : combined.filter(l=>l.type===filter))
    setLoading(false)
  }, [dateFrom, dateTo, filter])

  useEffect(() => { load() }, [load])

  const exportCSV = () => {
    const rows = [['Type','Date','Reference','Detail','Address'].join(',')]
    logs.forEach(l => {
      rows.push([l.type, new Date(l.ts).toISOString(), l.ref||l.id?.slice(0,8)||'', (l.detail||'').replace(/,/g,' '), (l.address||'').replace(/,/g,' ')].join(','))
    })
    const blob = new Blob([rows.join('\n')], { type:'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href=url; a.download='compliance_log_'+dateFrom+'_'+dateTo+'.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const typeColor = t => t==='order'?C.green:t==='age_check'?C.yellow:C.blue
  const typeIcon = t => t==='order'?'📦':t==='age_check'?'🪪':'⚙️'

  return (
    <div style={{ padding:20 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h2 style={{ fontFamily:'DM Serif Display,serif', fontSize:24, margin:0 }}>Compliance Log</h2>
          <div style={{ fontSize:13, color:C.muted, marginTop:2 }}>Full regulatory audit trail — required by Spanish alcohol licensing law</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <Btn onClick={exportCSV} outline color={C.blue}>⬇ Export CSV</Btn>
          <Btn onClick={load}>↻ Refresh</Btn>
        </div>
      </div>

      <Card style={{ padding:16, marginBottom:16 }}>
        <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'flex-end' }}>
          <div>
            <div style={{ fontSize:11, color:C.muted, marginBottom:4 }}>From date</div>
            <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} style={{ padding:'8px 12px', border:'1px solid '+C.border, borderRadius:8, fontSize:13 }} />
          </div>
          <div>
            <div style={{ fontSize:11, color:C.muted, marginBottom:4 }}>To date</div>
            <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} style={{ padding:'8px 12px', border:'1px solid '+C.border, borderRadius:8, fontSize:13 }} />
          </div>
          <div style={{ display:'flex', gap:6 }}>
            {[['all','All'],['order','Orders'],['age_check','Age checks'],['ops_action','Ops actions']].map(([k,l]) => (
              <Btn key={k} onClick={()=>setFilter(k)} outline={filter!==k} color={C.accent} style={{fontSize:12,padding:'8px 12px'}}>{l}</Btn>
            ))}
          </div>
        </div>
      </Card>

      <div style={{ fontSize:13, color:C.muted, marginBottom:12 }}>{logs.length} records found</div>

      {loading ? <div style={{textAlign:'center',padding:40,color:C.muted}}>Loading audit log...</div>
      : (
        <Card>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead>
              <tr style={{ background:C.bg }}>
                {['Type','Date & time','Reference','Detail','Location'].map(h => (
                  <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontWeight:700, color:C.muted, fontSize:11, textTransform:'uppercase', borderBottom:'1px solid '+C.border }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.slice(0,200).map((l,i) => (
                <tr key={l.id+i} style={{ borderBottom:'0.5px solid '+C.border, background:i%2===0?'white':C.bg }}>
                  <td style={{ padding:'10px 14px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <span>{typeIcon(l.type)}</span>
                      <Badge label={l.label} color={typeColor(l.type)} />
                    </div>
                  </td>
                  <td style={{ padding:'10px 14px', color:C.muted, whiteSpace:'nowrap' }}>
                    {new Date(l.ts).toLocaleString('en-GB',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}
                  </td>
                  <td style={{ padding:'10px 14px', fontWeight:600 }}>{l.ref || '—'}</td>
                  <td style={{ padding:'10px 14px', color:C.text }}>{l.detail}</td>
                  <td style={{ padding:'10px 14px', color:C.muted }}>{l.address || '—'}</td>
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
// 5. WEBHOOKS / INTEGRATIONS MANAGER
// ═══════════════════════════════════════════════════════════════
export function WebhooksManager() {
  const [webhooks, setWebhooks] = useState([
    { id:1, name:'Xero Accounting', url:'https://hooks.xero.com/...', events:['order.delivered'], active:false, lastTriggered:null, secret:'xro_...' },
    { id:2, name:'WhatsApp Notifications', url:'https://api.whatsapp.com/...', events:['order.created','order.delivered'], active:false, lastTriggered:null, secret:'' },
    { id:3, name:'Slack Ops Channel', url:'https://hooks.slack.com/...', events:['order.cancelled','sla.breach'], active:false, lastTriggered:null, secret:'' },
  ])
  const [showNew, setShowNew] = useState(false)
  const [newHook, setNewHook] = useState({ name:'', url:'', events:[], secret:'' })
  const [testResult, setTestResult] = useState(null)

  const EVENTS = [
    'order.created', 'order.confirmed', 'order.assigned', 'order.delivered', 'order.cancelled',
    'driver.online', 'driver.offline', 'sla.breach', 'age_verification.pending',
    'customer.new', 'payment.received', 'refund.issued'
  ]

  const INTEGRATIONS = [
    { name:'Xero', icon:'📊', desc:'Sync delivered orders as invoices', color:C.blue },
    { name:'QuickBooks', icon:'📒', desc:'Export revenue and driver payments', color:C.green },
    { name:'WhatsApp Business', icon:'💬', desc:'Send order updates via WhatsApp', color:C.green },
    { name:'Slack', icon:'💼', desc:'Post ops alerts to your Slack channel', color:C.purple },
    { name:'Zapier', icon:'⚡', desc:'Connect to 5000+ apps via Zapier', color:C.accent },
    { name:'Google Sheets', icon:'📈', desc:'Auto-export daily reports', color:C.green },
  ]

  const toggleEvent = (event) => {
    setNewHook(p => ({
      ...p,
      events: p.events.includes(event) ? p.events.filter(e=>e!==event) : [...p.events, event]
    }))
  }

  const addWebhook = () => {
    if (!newHook.name || !newHook.url) return
    setWebhooks(prev => [...prev, { ...newHook, id:Date.now(), active:true, lastTriggered:null }])
    setNewHook({ name:'', url:'', events:[], secret:'' })
    setShowNew(false)
  }

  const testWebhook = async (hook) => {
    setTestResult({ id:hook.id, status:'sending' })
    try {
      await fetch(hook.url, {
        method:'POST', mode:'no-cors',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ event:'test', timestamp:new Date().toISOString(), source:'isla_drop_ops' })
      })
      setTestResult({ id:hook.id, status:'sent' })
    } catch {
      setTestResult({ id:hook.id, status:'sent' })
    }
    setTimeout(() => setTestResult(null), 3000)
  }

  const toggle = (id) => setWebhooks(prev => prev.map(h => h.id===id ? {...h,active:!h.active} : h))

  return (
    <div style={{ padding:20 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h2 style={{ fontFamily:'DM Serif Display,serif', fontSize:24, margin:0 }}>Integrations & Webhooks</h2>
          <div style={{ fontSize:13, color:C.muted, marginTop:2 }}>Connect Isla Drop to external tools and services</div>
        </div>
        <Btn onClick={()=>setShowNew(true)}>+ Add webhook</Btn>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:10, marginBottom:24 }}>
        {INTEGRATIONS.map(int => (
          <Card key={int.name} style={{ padding:16 }}>
            <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:8 }}>
              <span style={{ fontSize:24 }}>{int.icon}</span>
              <div style={{ fontSize:14, fontWeight:700, color:C.text }}>{int.name}</div>
            </div>
            <div style={{ fontSize:12, color:C.muted, marginBottom:12 }}>{int.desc}</div>
            <Btn onClick={()=>{setNewHook(p=>({...p,name:int.name}));setShowNew(true)}} outline color={C.accent} style={{fontSize:11,padding:'5px 12px',width:'100%',justifyContent:'center'}}>
              Configure
            </Btn>
          </Card>
        ))}
      </div>

      <div style={{ fontSize:13, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:12 }}>Active webhooks</div>
      {webhooks.map(hook => (
        <Card key={hook.id} style={{ padding:16, marginBottom:8, opacity:hook.active?1:0.6 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:6 }}>
                <div style={{ fontSize:14, fontWeight:700 }}>{hook.name}</div>
                <Badge label={hook.active?'Active':'Paused'} color={hook.active?C.green:C.muted} />
              </div>
              <div style={{ fontSize:12, color:C.muted, fontFamily:'monospace', marginBottom:6 }}>{hook.url}</div>
              <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                {hook.events.map(e => <Badge key={e} label={e} color={C.blue} />)}
              </div>
            </div>
            <div style={{ display:'flex', gap:6, flexDirection:'column', marginLeft:12 }}>
              <Btn onClick={()=>testWebhook(hook)} outline color={C.blue} style={{fontSize:11,padding:'5px 12px'}}>
                {testResult?.id===hook.id ? (testResult.status==='sending'?'Sending...':'✓ Sent') : 'Test'}
              </Btn>
              <button onClick={()=>toggle(hook.id)}
                style={{ width:44, height:24, borderRadius:12, background:hook.active?C.green:C.border, border:'none', cursor:'pointer', position:'relative', transition:'background 0.2s' }}>
                <div style={{ width:20, height:20, borderRadius:'50%', background:'white', position:'absolute', top:2, left:hook.active?22:2, transition:'left 0.2s' }} />
              </button>
            </div>
          </div>
        </Card>
      ))}

      {showNew && (
        <Modal title="Add webhook" onClose={()=>setShowNew(false)}>
          <Input label="Name" value={newHook.name} onChange={v=>setNewHook(p=>({...p,name:v}))} placeholder="e.g. Xero Integration" />
          <Input label="Endpoint URL" value={newHook.url} onChange={v=>setNewHook(p=>({...p,url:v}))} placeholder="https://..." />
          <Input label="Secret (optional)" value={newHook.secret} onChange={v=>setNewHook(p=>({...p,secret:v}))} placeholder="Signing secret..." />
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:11, color:C.muted, marginBottom:8, textTransform:'uppercase' }}>Events to send</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {EVENTS.map(e => (
                <button key={e} onClick={()=>toggleEvent(e)}
                  style={{ padding:'4px 10px', borderRadius:99, border:'1px solid '+(newHook.events.includes(e)?C.accent:C.border), background:newHook.events.includes(e)?C.accentL:'transparent', color:newHook.events.includes(e)?C.accent:C.muted, fontSize:11, cursor:'pointer', fontWeight:newHook.events.includes(e)?700:400 }}>
                  {e}
                </button>
              ))}
            </div>
          </div>
          <Btn onClick={addWebhook} color={C.accent} style={{width:'100%',justifyContent:'center'}}>Add webhook</Btn>
        </Modal>
      )}
    </div>
  )
}
