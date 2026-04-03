import { useState } from 'react'
import { PRODUCTS } from '../../lib/products'
import { useCartStore } from '../../lib/store'

const SUGGESTIONS = [
  { trigger: [], label: '🍾 Party night?',   keywords: ['champagne','moet','veuve','dom'] },
  { trigger: [], label: '🌅 Sundowner?',      keywords: ['rose','whispering','gin','tonic'] },
  { trigger: [], label: '🍹 Cocktail night?', keywords: ['vodka','rum','cointreau','baileys'] },
  { trigger: [], label: '🏖 Beach day?',      keywords: ['beer','corona','peroni','ice','coke'] },
  { trigger: [], label: '🥃 Whiskey lover?',  keywords: ['macallan','johnnie','glenfiddich','yamazaki'] },
  { trigger: [], label: '🎉 VIP vibes?',      keywords: ['armand','clase azul','hennessy','belvedere 10'] },
  { trigger: [], label: '🚬 Smoker?',         keywords: ['marlboro','amber leaf','elf bar','iqos'] },
  { trigger: [], label: '🤿 Non-alcoholic?',  keywords: ['red bull','fever-tree','san pellegrino','fiji'] },
]

function getProductSuggestions(keywords) {
  return PRODUCTS.filter(p =>
    keywords.some(k => p.name.toLowerCase().includes(k))
  ).slice(0, 4)
}

export default function AssistBot({ onProductSelect }) {
  const [open, setOpen]   = useState(false)
  const [active, setActive] = useState(null)
  const { addItem }       = useCartStore()

  const products = active ? getProductSuggestions(active.keywords) : []

  return (
    <>
      {/* Bot trigger pill next to search */}
      <button
        onClick={() => setOpen(true)}
        style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 14px', background:'linear-gradient(135deg,#C4683A,#E8854A)', border:'none', borderRadius:12, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0 }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/><circle cx="18" cy="5" r="2" fill="white" stroke="none"/></svg>
        <span style={{ fontSize:12, fontWeight:500, color:'white', fontFamily:'DM Sans,sans-serif' }}>Ask</span>
      </button>

      {/* Bot modal */}
      {open && (
        <div style={{ position:'fixed', inset:0, zIndex:500, display:'flex', alignItems:'flex-end', justifyContent:'center' }} onClick={()=>{ setOpen(false); setActive(null) }}>
          <div style={{ background:'#FEFCF9', borderRadius:'20px 20px 0 0', padding:'20px 20px 36px', width:'100%', maxWidth:480, maxHeight:'80vh', overflowY:'auto' }} onClick={e=>e.stopPropagation()}>
            <div style={{ width:36,height:4,background:'rgba(42,35,24,0.15)',borderRadius:2,margin:'0 auto 16px' }}/>

            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
              <div style={{ width:38,height:38,borderRadius:'50%',background:'linear-gradient(135deg,#C4683A,#E8854A)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
              </div>
              <div>
                <div style={{ fontFamily:'DM Serif Display,serif', fontSize:18 }}>What's the occasion?</div>
                <div style={{ fontSize:12, color:'#7A6E60', marginTop:1 }}>I'll suggest the perfect drinks</div>
              </div>
            </div>

            {/* Occasion chips */}
            {!active && (
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {SUGGESTIONS.map((s,i) => (
                  <button key={i} onClick={()=>setActive(s)}
                    style={{ padding:'10px 16px', background:'#F5F0E8', border:'0.5px solid rgba(42,35,24,0.12)', borderRadius:20, fontFamily:'DM Sans,sans-serif', fontSize:13, cursor:'pointer', color:'#2A2318' }}>
                    {s.label}
                  </button>
                ))}
              </div>
            )}

            {/* Product suggestions */}
            {active && products.length > 0 && (
              <>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
                  <button onClick={()=>setActive(null)} style={{ background:'none',border:'none',cursor:'pointer',color:'#7A6E60',fontSize:13,fontFamily:'DM Sans,sans-serif',padding:0 }}>← Back</button>
                  <span style={{ fontSize:13, color:'#7A6E60' }}>Perfect for {active.label.split(' ').slice(1).join(' ')}</span>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  {products.map(p => (
                    <div key={p.id} style={{ background:'white', border:'0.5px solid rgba(42,35,24,0.1)', borderRadius:12, padding:12 }}>
                      <span style={{ fontSize:24, display:'block', marginBottom:6 }}>{p.emoji}</span>
                      <div style={{ fontSize:12, fontWeight:500, color:'#2A2318', marginBottom:4, lineHeight:1.3 }}>{p.name}</div>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <span style={{ fontSize:13, fontWeight:500 }}>€{p.price.toFixed(2)}</span>
                        <button onClick={()=>{ addItem(p); setOpen(false); setActive(null) }}
                          style={{ width:26,height:26,background:'#2B7A8B',border:'none',borderRadius:'50%',color:'white',fontSize:17,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer' }}>+</button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {active && products.length === 0 && (
              <div style={{ textAlign:'center', padding:'20px', color:'#7A6E60', fontSize:14 }}>
                No products match yet — more coming soon!
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
