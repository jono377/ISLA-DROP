import { useState } from 'react'
import { PRODUCTS } from '../../lib/products'
import { useCartStore } from '../../lib/store'
import toast from 'react-hot-toast'

function getProductSuggestions(input) {
  if (!input || input.trim().length < 2) return []
  const words = input.toLowerCase().split(/\s+/).filter(w => w.length > 2)
  const VIBE_MAP = {
    party:    ['champagne','moet','veuve','dom','armand'],
    celebrate:['champagne','moet','veuve','dom','prosecco'],
    sunset:   ['rose','whispering','gin','tonic','aperol'],
    sundowner:['rose','whispering','aperol','prosecco','gin'],
    beach:    ['beer','corona','peroni','ice','coke','water'],
    pool:     ['beer','corona','heineken','ice','water','sprite'],
    cocktail: ['vodka','rum','cointreau','baileys','gin','triple'],
    vip:      ['armand','clase azul','hennessy','belvedere 10','don julio 1942'],
    smoke:    ['marlboro','amber leaf','elf bar','iqos','zyn','vogue'],
    chill:    ['beer','corona','lager','coke','pringles','doritos'],
    whiskey:  ['macallan','johnnie','glenfiddich','yamazaki','monkey'],
    rum:      ['captain','bacardi','kraken','diplomatico'],
    tequila:  ['patron','don julio','casamigos','clase azul'],
    gin:      ['hendricks','bombay','tanqueray','roku'],
    vodka:    ['grey goose','belvedere','absolut','beluga'],
    wine:     ['rioja','chablis','meursault','bordeaux','chianti'],
    rosé:     ['whispering','garrus','laurent','taittinger'],
    rose:     ['whispering','garrus','laurent','taittinger'],
    snack:    ['pringles','doritos','kettle','lays','kinder'],
    mixer:    ['tonic','soda','ginger','fever-tree','schweppes'],
    energy:   ['red bull','monster','relentless'],
    water:    ['evian','fiji','pellegrino'],
    smoke:    ['marlboro','camel','vogue','amber leaf'],
    cigar:    ['cohiba','montecristo','romeo','partagas','davidoff'],
    vape:     ['elf bar','lost mary','geek bar','randm','vozol'],
  }
  const matched = new Set()
  for (const word of words) {
    for (const [key, kws] of Object.entries(VIBE_MAP)) {
      if (key.includes(word) || word.includes(key)) {
        kws.forEach(k => matched.add(k))
      }
    }
    // Also direct product name search
    matched.add(word)
  }
  return PRODUCTS.filter(p => {
    const name = p.name.toLowerCase()
    return [...matched].some(k => name.includes(k))
  }).slice(0, 6)
}

export default function AssistBot() {
  const [open, setOpen]   = useState(false)
  const [input, setInput] = useState('')
  const { addItem }       = useCartStore()

  const suggestions = getProductSuggestions(input)

  return (
    <>
      {/* Star trigger */}
      <button
        onClick={() => setOpen(true)}
        title="Get suggestions"
        style={{ width:44, height:44, background:'rgba(255,255,255,0.82)', border:'0.5px solid rgba(196,104,58,0.25)', borderRadius:12, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:'0 1px 6px rgba(196,104,58,0.1)' }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#C4683A" stroke="#C4683A" strokeWidth="1">
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
        </svg>
      </button>

      {/* Modal */}
      {open && (
        <div style={{ position:'fixed',inset:0,zIndex:500,display:'flex',alignItems:'flex-end',justifyContent:'center' }} onClick={()=>{ setOpen(false); setInput('') }}>
          <div style={{ background:'#FEFCF9', borderRadius:'22px 22px 0 0', padding:'20px 20px 40px', width:'100%', maxWidth:480, maxHeight:'82vh', overflowY:'auto' }} onClick={e=>e.stopPropagation()}>

            <div style={{ width:36,height:4,background:'rgba(42,35,24,0.12)',borderRadius:2,margin:'0 auto 16px' }}/>

            {/* Header */}
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
              <div style={{ width:40,height:40,borderRadius:'50%',background:'linear-gradient(135deg,#C4683A,#E8854A)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                </svg>
              </div>
              <div>
                <div style={{ fontFamily:'DM Serif Display,serif', fontSize:19, color:'#2A2318' }}>What's the vibe tonight?</div>
                <div style={{ fontSize:12, color:'#7A6E60', marginTop:1 }}>Describe what you're after and I'll suggest the perfect picks</div>
              </div>
            </div>

            {/* Free-text input */}
            <div style={{ display:'flex', alignItems:'center', background:'#F5F0E8', borderRadius:12, padding:'11px 14px', gap:8, marginBottom:16, border:'0.5px solid rgba(196,104,58,0.2)' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#C4683A" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input
                autoFocus
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder='e.g. "sunset cocktails", "beach beers", "VIP champagne"…'
                style={{ flex:1, border:'none', background:'none', fontFamily:'DM Sans,sans-serif', fontSize:14, color:'#2A2318', outline:'none' }}
              />
              {input && <button onClick={()=>setInput('')} style={{ border:'none',background:'none',cursor:'pointer',color:'#7A6E60',fontSize:15,padding:0 }}>✕</button>}
            </div>

            {/* Quick vibe chips */}
            {!input && (
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:11,color:'#7A6E60',marginBottom:8,textTransform:'uppercase',letterSpacing:'0.5px',fontWeight:500 }}>Quick vibes</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
                  {['🎉 Party night','🌅 Sundowner','🏖 Beach day','🥃 Whiskey','🍾 Celebrate','🌴 Ibiza classic','🚬 Smokers pack','🫧 Non-alcoholic','🍹 Cocktail night','🎊 VIP vibes'].map(v => (
                    <button key={v} onClick={()=>setInput(v.split(' ').slice(1).join(' '))}
                      style={{ padding:'8px 13px', background:'white', border:'0.5px solid rgba(42,35,24,0.1)', borderRadius:20, fontFamily:'DM Sans,sans-serif', fontSize:12, cursor:'pointer', color:'#2A2318' }}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {input.length >= 2 && (
              <>
                <div style={{ fontSize:11,color:'#7A6E60',marginBottom:10,textTransform:'uppercase',letterSpacing:'0.5px',fontWeight:500 }}>
                  {suggestions.length > 0 ? `${suggestions.length} suggestions for "${input}"` : `No matches for "${input}" — try different words`}
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  {suggestions.map(p => (
                    <div key={p.id} style={{ background:'white', border:'0.5px solid rgba(42,35,24,0.1)', borderRadius:12, overflow:'hidden' }}>
                      <div style={{ height:88, background:'linear-gradient(135deg,#F5ECD0,#E8D5A8)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:34, position:'relative' }}>
                        {p.emoji}
                        <button
                          onClick={()=>{ addItem(p); toast.success(p.emoji+' Added!',{duration:900}); setOpen(false); setInput('') }}
                          style={{ position:'absolute',top:7,right:7,width:26,height:26,background:'#C4683A',border:'2px solid white',borderRadius:'50%',color:'white',fontSize:17,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',lineHeight:1 }}>+</button>
                      </div>
                      <div style={{ padding:'8px 10px 10px' }}>
                        <div style={{ fontSize:11,fontWeight:500,color:'#2A2318',lineHeight:1.3,marginBottom:3,height:28,overflow:'hidden' }}>{p.name}</div>
                        <div style={{ fontSize:13,fontWeight:500,color:'#C4683A' }}>€{p.price.toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </>
  )
}
