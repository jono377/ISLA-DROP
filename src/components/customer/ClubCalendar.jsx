import { useT_ctx } from '../../i18n/TranslationContext'
import { useState } from 'react'
import { useCartStore } from '../../lib/store'
import toast from 'react-hot-toast'
import { PRODUCTS } from '../../lib/products'

const NIGHTS = [
  { day:'Monday',    venue:'DC-10',       night:'Circoloco',           genre:'Deep Techno',      vibe:'Underground legend. The most famous Monday in dance music history.',     peak:'6am-2pm', entry:60, emoji:'✈️' },
  { day:'Monday',    venue:'Playa Soleil', night:'All Day I Dream',     genre:'Melodic House',    vibe:'Lee Burridge\'s beautiful melodic journey. Hippy & spiritual crowd.',   peak:'5pm-midnight', entry:35, emoji:'🌅' },
  { day:'Tuesday',   venue:'Amnesia',     night:'Foam Party',           genre:'House & Techno',   vibe:'The original foam party. Completely wild and uniquely Ibiza.',          peak:'2am-6am', entry:88, emoji:'🫧' },
  { day:'Wednesday', venue:'Hi Ibiza',    night:'Resistance',           genre:'Techno',           vibe:'Carl Cox & friends. The techno cathedral. Simply unmissable.',          peak:'1am-5am', entry:99, emoji:'⚡' },
  { day:'Thursday',  venue:'Destino Five', night:'Music On',            genre:'Techno',           vibe:'Marco Carola at the luxury pool venue. Sophisticated techno crowd.',     peak:'11pm-4am', entry:120, emoji:'🏊' },
  { day:'Thursday',  venue:'Pacha',       night:'Flower Power',         genre:'60s-70s Classics', vibe:'Kitsch and brilliant. Ibiza old-school. Everyone goes at least once.',   peak:'midnight-4am', entry:70, emoji:'🌸' },
  { day:'Friday',    venue:'Ushuaia',     night:'David Guetta F*** Me', genre:'EDM / Commercial', vibe:'David Guetta\'s legendary night. Massive production. Party starters.',  peak:'9pm-midnight', entry:143, emoji:'🌴' },
  { day:'Friday',    venue:'Amnesia',     night:'Pyramid',              genre:'House',            vibe:'Manumission revival. Theatrical and wild. A proper Ibiza experience.',  peak:'1am-6am', entry:88, emoji:'🔺' },
  { day:'Saturday',  venue:'Pacha',       night:'F*** Me I\'m Famous',  genre:'House',            vibe:'David Guetta iconic night. The most famous club night in Ibiza.',       peak:'2am-6am', entry:110, emoji:'🍒' },
  { day:'Saturday',  venue:'Hi Ibiza',    night:'Defected',             genre:'Deep House',       vibe:'The house music institution. Sam Divine, Crystal Waters. Emotional.',   peak:'midnight-6am', entry:99, emoji:'❤️' },
  { day:'Saturday',  venue:'Pikes',       night:'Saturday House Party', genre:'House',            vibe:'All rooms open. Most intimate big party on the island. 27+ crowd.',    peak:'11pm-4am', entry:55, emoji:'🏠' },
  { day:'Sunday',    venue:'DC-10',       night:'Circoloco Sunday',     genre:'Techno / House',   vibe:'The Sunday session. Starts at lunch, goes forever. Sacred ground.',     peak:'4pm-midnight', entry:60, emoji:'☀️' },
  { day:'Sunday',    venue:'Amnesia',     night:'Elrow',                genre:'Confetti House',   vibe:'The maddest party in Ibiza. Crazy confetti, characters everywhere.',    peak:'midnight-6am', entry:75, emoji:'🎉' },
  { day:'Sunday',    venue:'Pikes',       night:'Sunday Brunch Party',  genre:'House',            vibe:'Legendary brunch-into-party. The best Sunday on the island.',           peak:'2pm-9pm', entry:45, emoji:'🥂' },
]

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']

const PRE_DRINK_KITS = {
  'Deep Techno':     ['sp-004','sp-035','sd-025','ic-002'],
  'Melodic House':   ['wn-021','sp-012','sd-027','ic-001'],
  'House & Techno':  ['sp-001','sp-035','sd-025','ic-002','sd-003'],
  'Techno':          ['sp-004','wn-001','sd-025','ic-002'],
  'EDM / Commercial':['sp-035','sd-003','sd-028','ic-002','ch-010'],
  'House':           ['ch-010','sp-012','sd-027','ic-001','sd-025'],
  'Deep House':      ['wn-021','sp-012','sd-027','ic-001'],
  'Confetti House':  ['ch-001','sp-035','sd-028','ic-002','sd-025'],
  '60s-70s Classics':['wn-021','wn-001','sd-027','ic-001'],
  'default':         ['sp-035','sd-025','ic-002','sd-003'],
}

export default function ClubCalendar({ onBack }) {
  const t = useT_ctx()
  const [selectedDay, setSelectedDay] = useState(DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1])
  const [expanded, setExpanded] = useState(null)
  const { addItem } = useCartStore()

  const nights = NIGHTS.filter(n => n.day === selectedDay)

  const addPreDrinks = (night) => {
    const ids = PRE_DRINK_KITS[night.genre] || PRE_DRINK_KITS.default
    let added = 0
    ids.forEach(id => {
      const p = PRODUCTS.find(p => p.id === id)
      if (p) { addItem(p); added++ }
    })
    toast.success('Pre-drinks kit added for ' + night.night + '!')
  }

  return (
    <div style={{ padding:'0 16px 32px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
        <button onClick={onBack} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.6)', cursor:'pointer', fontSize:20, padding:0 }}>←</button>
        <div>
          <div style={{ fontFamily:'DM Serif Display,serif', fontSize:22, color:'white' }}>{t.clubNightCalendar||'Club Night Calendar'}</div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)' }}>Ibiza 2025 season · Every night of the week</div>
        </div>
      </div>

      <div style={{ display:'flex', gap:6, overflowX:'auto', scrollbarWidth:'none', marginBottom:20, paddingBottom:4 }}>
        {DAYS.map(day => (
          <button key={day} onClick={() => setSelectedDay(day)}
            style={{ flexShrink:0, padding:'8px 14px', borderRadius:20, fontSize:12, fontWeight:500, background: selectedDay===day?'#C4683A':'rgba(255,255,255,0.08)', color: selectedDay===day?'white':'rgba(255,255,255,0.6)', border:'none', cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
            {day.slice(0,3)}
          </button>
        ))}
      </div>

      {nights.length === 0 ? (
        <div style={{ textAlign:'center', padding:'40px 0', color:'rgba(255,255,255,0.4)' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>😴</div>
          <div>No major club nights on {selectedDay}</div>
          <div style={{ fontSize:12, marginTop:4 }}>Check other nights or browse the concierge for venues open tonight</div>
        </div>
      ) : nights.map((night, i) => (
        <div key={i} style={{ background:'rgba(255,255,255,0.07)', border:'0.5px solid rgba(255,255,255,0.12)', borderRadius:16, padding:16, marginBottom:12, cursor:'pointer' }}
          onClick={() => setExpanded(expanded===i ? null : i)}>
          <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
            <div style={{ fontSize:32, flexShrink:0 }}>{night.emoji}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <div style={{ fontFamily:'DM Serif Display,serif', fontSize:18, color:'white', marginBottom:2 }}>{night.night}</div>
                  <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)' }}>{night.venue} · {night.day}</div>
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <div style={{ fontSize:14, fontWeight:500, color:'#E8A070' }}>€{night.entry}</div>
                  <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)' }}>entry</div>
                </div>
              </div>
              <div style={{ marginTop:6, display:'flex', gap:6, flexWrap:'wrap' }}>
                <span style={{ fontSize:10, padding:'2px 8px', background:'rgba(196,104,58,0.2)', borderRadius:20, color:'#E8A070' }}>{night.genre}</span>
                <span style={{ fontSize:10, padding:'2px 8px', background:'rgba(255,255,255,0.08)', borderRadius:20, color:'rgba(255,255,255,0.5)' }}>Peak: {night.peak}</span>
              </div>
            </div>
          </div>

          {expanded === i && (
            <div style={{ marginTop:14, paddingTop:14, borderTop:'0.5px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.75)', lineHeight:1.6, marginBottom:14 }}>{night.vibe}</div>
              <div style={{ background:'rgba(43,122,139,0.15)', borderRadius:10, padding:'10px 12px', marginBottom:12, fontSize:12, color:'#7ECFE0' }}>
                🌴 Isla insider: Arrive at {night.peak.split('-')[0]} for peak atmosphere
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={(e) => { e.stopPropagation(); addPreDrinks(night) }}
                  style={{ flex:1, padding:'10px', background:'#C4683A', border:'none', borderRadius:10, color:'white', fontSize:12, cursor:'pointer', fontFamily:'DM Sans,sans-serif', fontWeight:500 }}>
                  🍹 Add pre-drinks kit
                </button>
                <button onClick={(e) => { e.stopPropagation() }}
                  style={{ flex:1, padding:'10px', background:'rgba(255,255,255,0.1)', border:'0.5px solid rgba(255,255,255,0.2)', borderRadius:10, color:'white', fontSize:12, cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
                  🎟️ Book tickets
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
