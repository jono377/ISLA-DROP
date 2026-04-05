import { useState, useEffect } from 'react'

const ACTION_ICONS = {
  order_status_updated: '📦', discount_approved: '🎟️', discount_created: '🎟️',
  stock_updated: '📊', driver_approved: '🛵', driver_rejected: '🛵',
  banner_created: '📣', banner_toggled: '📣', concierge_stage_moved: '🌟',
  partner_added: '🤝', sale_created: '🏷️', sale_removed: '🏷️',
  user_login: '👤', earnings_paid: '💰',
}

export default function ActivityLog() {
  const [logs, setLogs]       = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('all')

  useEffect(() => {
    const load = async () => {
      try {
        const { supabase } = await import('../../lib/supabase')
        const { data } = await supabase
          .from('ops_activity_log')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100)
        if (data) setLogs(data)
      } catch {}
      setLoading(false)
    }
    load()
    // Realtime updates
    const setup = async () => {
      const { supabase } = await import('../../lib/supabase')
      const sub = supabase.channel('activity-log')
        .on('postgres_changes', { event:'INSERT', schema:'public', table:'ops_activity_log' }, payload => {
          setLogs(prev => [payload.new, ...prev].slice(0, 100))
        })
        .subscribe()
      return () => supabase.removeChannel(sub)
    }
    setup()
  }, [])

  const categories = ['all', ...new Set(logs.map(l => l.entity_type).filter(Boolean))]
  const filtered = filter === 'all' ? logs : logs.filter(l => l.entity_type === filter)

  const timeAgo = (ts) => {
    const secs = (Date.now() - new Date(ts)) / 1000
    if (secs < 60) return 'just now'
    if (secs < 3600) return Math.floor(secs/60) + 'm ago'
    if (secs < 86400) return Math.floor(secs/3600) + 'h ago'
    return new Date(ts).toLocaleDateString('en-GB', { day:'numeric', month:'short' })
  }

  return (
    <div>
      <div style={{ fontFamily:'DM Serif Display,serif', fontSize:22, color:'#0D3B4A', marginBottom:4 }}>Activity Log</div>
      <div style={{ fontSize:13, color:'#7A6E60', marginBottom:14 }}>Real-time feed of all platform activity</div>

      <div style={{ display:'flex', gap:6, marginBottom:14, flexWrap:'wrap' }}>
        {categories.slice(0, 8).map(cat => (
          <button key={cat} onClick={() => setFilter(cat)}
            style={{ padding:'5px 12px', borderRadius:20, fontSize:11, background: filter===cat?'#0D3B4A':'rgba(0,0,0,0.05)', color: filter===cat?'white':'#7A6E60', border:'none', cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
            {cat === 'all' ? 'All activity' : cat}
          </button>
        ))}
      </div>

      {loading ? <div style={{ textAlign:'center', padding:30, color:'#7A6E60' }}>Loading...</div> :
        filtered.length === 0
          ? <div style={{ textAlign:'center', padding:'40px 0' }}>
              <div style={{ fontSize:40, marginBottom:10 }}>📋</div>
              <div style={{ fontSize:14, color:'#7A6E60' }}>No activity yet — actions taken in the dashboard will appear here</div>
            </div>
          : filtered.map(log => (
            <div key={log.id} style={{ display:'flex', gap:12, padding:'10px 0', borderBottom:'0.5px solid rgba(42,35,24,0.07)' }}>
              <div style={{ width:32, height:32, borderRadius:'50%', background:'#F5F0E8', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>
                {ACTION_ICONS[log.action] || '⚡'}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, color:'#2A2318' }}>
                  <strong>{log.actor_name || 'System'}</strong> {log.action?.replace(/_/g,' ')}
                  {log.details?.name && <span style={{ color:'#7A6E60' }}> — {log.details.name}</span>}
                </div>
                {log.details?.note && <div style={{ fontSize:11, color:'#7A6E60', marginTop:2 }}>{log.details.note}</div>}
              </div>
              <div style={{ fontSize:11, color:'#7A6E60', flexShrink:0, marginTop:2 }}>{timeAgo(log.created_at)}</div>
            </div>
          ))
      }
    </div>
  )
}
