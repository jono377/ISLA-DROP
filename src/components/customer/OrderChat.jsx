import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '../../lib/store'
import toast from 'react-hot-toast'

const QUICK_MESSAGES = [
  "I am at the front gate",
  "Please call when you arrive",
  "Ring the doorbell on arrival",
  "I am by the pool",
  "Meet me at the beach entrance",
  "Leave at the door please",
]

export default function OrderChat({ orderId, driverName, onClose }) {
  const { user, profile } = useAuthStore()
  const [messages, setMessages] = useState([])
  const [input, setInput]       = useState('')
  const [sending, setSending]   = useState(false)
  const bottomRef = useRef(null)
  const channelRef = useRef(null)

  useEffect(() => {
    if (!orderId) return
    const load = async () => {
      try {
        const { supabase } = await import('../../lib/supabase')
        const { data } = await supabase
          .from('order_messages')
          .select('*')
          .eq('order_id', orderId)
          .order('created_at', { ascending: true })
        if (data) setMessages(data)

        // Subscribe to new messages
        channelRef.current = supabase
          .channel('order-chat-' + orderId)
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'order_messages',
            filter: 'order_id=eq.' + orderId,
          }, payload => {
            setMessages(prev => {
              if (prev.find(m => m.id === payload.new.id)) return prev
              return [...prev, payload.new]
            })
          })
          .subscribe()
      } catch (err) { console.error(err) }
    }
    load()
    return () => {
      if (channelRef.current) {
        import('../../lib/supabase').then(({ supabase }) => supabase.removeChannel(channelRef.current))
      }
    }
  }, [orderId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async (text) => {
    const msg = (text || input).trim()
    if (!msg || sending) return
    setInput('')
    setSending(true)
    try {
      const { supabase } = await import('../../lib/supabase')
      await supabase.from('order_messages').insert({
        order_id: orderId,
        sender_id: user?.id,
        sender_role: 'customer',
        message: msg,
      })
    } catch { toast.error('Message failed — try again') }
    setSending(false)
  }

  const isMyMessage = (msg) => msg.sender_role === 'customer'

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:200, display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
      <div style={{ background:'linear-gradient(170deg,#0D3545,#1A5060)', borderRadius:'20px 20px 0 0', width:'100%', maxWidth:480, maxHeight:'70vh', display:'flex', flexDirection:'column' }}>
        {/* Header */}
        <div style={{ padding:'16px 16px 12px', borderBottom:'0.5px solid rgba(255,255,255,0.1)', flexShrink:0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontFamily:'DM Serif Display,serif', fontSize:18, color:'white' }}>Message Driver</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', marginTop:2 }}>{driverName || 'Your driver'} · Active order</div>
            </div>
            <button onClick={onClose} style={{ width:32, height:32, background:'rgba(255,255,255,0.1)', border:'none', borderRadius:'50%', color:'rgba(255,255,255,0.7)', cursor:'pointer', fontSize:16 }}>✕</button>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex:1, overflowY:'auto', padding:'12px 14px', display:'flex', flexDirection:'column', gap:8 }}>
          {messages.length === 0 && (
            <div style={{ textAlign:'center', padding:'20px 0', color:'rgba(255,255,255,0.35)', fontSize:13 }}>
              Send a message to your driver
            </div>
          )}
          {messages.map((m, i) => (
            <div key={m.id || i} style={{ display:'flex', justifyContent: isMyMessage(m) ? 'flex-end' : 'flex-start' }}>
              <div>
                {!isMyMessage(m) && (
                  <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', marginBottom:3, paddingLeft:4 }}>
                    {m.sender_role === 'driver' ? (driverName || 'Driver') : 'Support'}
                  </div>
                )}
                <div style={{ background: isMyMessage(m) ? '#C4683A' : 'rgba(255,255,255,0.12)', borderRadius: isMyMessage(m) ? '14px 14px 4px 14px' : '14px 14px 14px 4px', padding:'9px 13px', maxWidth:260, fontSize:13, color:'white', lineHeight:1.4 }}>
                  {m.message}
                </div>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.25)', marginTop:3, textAlign: isMyMessage(m) ? 'right' : 'left', paddingLeft:4, paddingRight:4 }}>
                  {new Date(m.created_at).toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' })}
                </div>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Quick messages */}
        <div style={{ padding:'8px 14px 0', flexShrink:0 }}>
          <div style={{ display:'flex', gap:6, overflowX:'auto', scrollbarWidth:'none', paddingBottom:8 }}>
            {QUICK_MESSAGES.map(q => (
              <button key={q} onClick={() => send(q)}
                style={{ flexShrink:0, padding:'6px 12px', background:'rgba(255,255,255,0.08)', border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:20, fontSize:11, color:'rgba(255,255,255,0.7)', cursor:'pointer', fontFamily:'DM Sans,sans-serif', whiteSpace:'nowrap' }}>
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div style={{ padding:'8px 14px 20px', display:'flex', gap:8, flexShrink:0 }}>
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Message your driver..."
            style={{ flex:1, padding:'11px 14px', background:'rgba(255,255,255,0.1)', border:'0.5px solid rgba(255,255,255,0.2)', borderRadius:24, fontFamily:'DM Sans,sans-serif', fontSize:13, color:'white', outline:'none' }} />
          <button onClick={() => send()} disabled={!input.trim() || sending}
            style={{ width:42, height:42, background: input.trim() && !sending ? '#C4683A' : 'rgba(255,255,255,0.1)', border:'none', borderRadius:'50%', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M22 2L11 13"/><path d="M22 2L15 22l-4-9-9-4 20-7z"/></svg>
          </button>
        </div>
      </div>
    </div>
  )
}
