import { useState } from 'react'
import { PRODUCTS } from '../../lib/products'
import { useCartStore } from '../../lib/store'

const SUGGESTIONS = [
  { label: '🎉 Party night',     keywords: ['champagne','moet','veuve','dom','armand'] },
  { label: '🌅 Sundowner',       keywords: ['rose','whispering','gin','tonic','fever'] },
  { label: '🍹 Cocktail night',  keywords: ['vodka','rum','cointreau','baileys','disaronno'] },
  { label: '🏖 Beach day',       keywords: ['beer','corona','peroni','ice','coke','water'] },
  { label: '🥃 Whiskey lover',   keywords: ['macallan','johnnie','glenfiddich','yamazaki','monkey'] },
  { label: '🎊 VIP vibes',       keywords: ['armand','clase azul','hennessy','belvedere 10','don julio 1942'] },
  { label: '🚬 Smokers pack',    keywords: ['marlboro','amber leaf','elf bar','iqos','zyn'] },
  { label: '🫧 Non-alcoholic',   keywords: ['red bull','fever-tree','san pellegrino','fiji','evian'] },
  { label: '🍾 Celebrate!',      keywords: ['dom','armand','pol roger','veuve','taittinger'] },
  { label: '🌴 Ibiza classic',   keywords: ['tanqueray','bombay','hendricks','patron','casamigos'] },
]

function getProductSuggestions(keywords) {
  return PRODUCTS.filter(p =>
    keywords.some(k => p.name.toLowerCase().includes(k.toLowerCase()))
  ).slice(0, 6)
}

export default function AssistBot({ onDark = true }) {
  const [open, setOpen]     = useState(false)
  const [active, setActive] = useState(null)
  const { addItem }         = useCartStore()

  const products = active ? getProductSuggestions(active.keywords) : []

  // Star icon button — terracotta on light, gold on dark
  const btnBg    = onDark ? 'rgba(255,255,255,0.12)'  : 'rgba(255,255,255,0.82)'
  const btnBorder= onDark ? '0.5px solid rgba(255,255,255,0.2)' : '0.5px solid rgba(196,104,58,0.25)'
  const starColor= onDark ? '#F5C97A'                 : '#C4683A'

  return (
    <>
      {/* Star trigger button */}
      <button
        onClick={() => setOpen(true)}
        title="Get suggestions"
        style={{ width:44, height:44, background:btnBg, border:btnBorder, borderRadius:12, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow: onDark?'none':'0 1px 6px rgba(196,104,58,0.1)' }}
      >
        {/* Star SVG */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill={starColor} stroke={starColor} strokeWidth="1.5">
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
        </svg>
      </button>

      {/* Modal */}
      {open && (
        <div style={{ position:'fixed',inset:0,zIndex:500,display:'flex',alignItems:'flex-end',justifyContent:'center' }} onClick={()=>{ setOpen(false); setActive(null) }}>
          <div style={{ background:'#FEFCF9',borderRadius:'22px 22px 0 0',padding:'20px 20px 40px',width:'100%',maxWidth:480,maxHeight:'82vh',overflowY:'auto' }} onClick={e=>e.stopPropagation()}>
            <div style={{ width:36,height:4,background:'rgba(42,35,24,0.12)',borderRadius:2,margin:'0 auto 16px' }}/>

            {/* Header */}
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
              <div style={{ width:40,height:40,borderRadius:'50%',background:'linear-gradient(135deg,#C4683A,#E8854A)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="none">
                  <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                </svg>
              </div>
              <div>
                <div style={{ fontFamily:'DM Serif Display,serif', fontSize:19, color:'#2A2318' }}>What's the vibe?</div>
                <div style={{ fontSize:12, color:'#7A6E60', marginTop:1 }}>I'll suggest the perfect picks</div>
              </div>
            </div>

            {/* Occasion grid */}
            {!active && (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {SUGGESTIONS.map((s,i) => (
                  <button key={i} onClick={()=>setActive(s)}
                    style={{ padding:'12px 14px', background:'#F5F0E8', border:'0.5px solid rgba(42,35,24,0.1)', borderRadius:12, fontFamily:'DM Sans,sans-serif', fontSize:13, cursor:'pointer', color:'#2A2318', textAlign:'left', transition:'background 0.15s' }}>
                    {s.label}
                  </button>
                ))}
              </div>
            )}

            {/* Suggested products */}
            {active && (
              <>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
                  <button onClick={()=>setActive(null)} style={{ background:'none',border:'none',cursor:'pointer',color:'#7A6E60',fontSize:13,fontFamily:'DM Sans,sans-serif',padding:0,display:'flex',alignItems:'center',gap:4 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7A6E60" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
                    Back
                  </button>
                  <span style={{ fontSize:13,color:'#7A6E60' }}>Perfect for {active.label}</span>
                </div>
                {products.length > 0 ? (
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                    {products.map(p => (
                      <div key={p.id} style={{ background:'white', border:'0.5px solid rgba(42,35,24,0.1)', borderRadius:12, overflow:'hidden' }}>
                        <div style={{ position:'relative' }}>
                          <div style={{ height:90, background:'#F5F0E8', display:'flex', alignItems:'center', justifyContent:'center', fontSize:32 }}>
                            {p.emoji}
                          </div>
                          <button onClick={()=>{ addItem(p); toast && setOpen(false); setActive(null) }}
                            style={{ position:'absolute',top:6,right:6,width:26,height:26,background:'#C4683A',border:'2px solid white',borderRadius:'50%',color:'white',fontSize:17,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',lineHeight:1 }}>+</button>
                        </div>
                        <div style={{ padding:'8px 10px 10px' }}>
                          <div style={{ fontSize:11,fontWeight:500,color:'#2A2318',lineHeight:1.3,marginBottom:3,height:28,overflow:'hidden' }}>{p.name}</div>
                          <div style={{ fontSize:13,fontWeight:500,color:'#C4683A' }}>€{p.price.toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign:'center',padding:'24px',color:'#7A6E60',fontSize:14 }}>No matches yet — more products coming!</div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
