import { useState } from 'react'
import { useLang } from '../../i18n/LangContext'
import { PRODUCTS } from '../../lib/products'
import { useCartStore } from '../../lib/store'
import toast from 'react-hot-toast'

const ARRIVAL_PACKAGES = [
  {
    id: 'solo_traveller',
    emoji: '🧳',
    label: 'Solo Traveller',
    desc: 'Everything you need for your first night',
    productIds: ['wt-001','wt-003','sn-029','sd-003','es-013','wl-014','sp-012'],
    highlight: 'Water, snacks, sunscreen, Red Bull, paracetamol and a bottle of something to celebrate',
  },
  {
    id: 'couple',
    emoji: '💕',
    label: 'Romantic Arrival',
    desc: 'A beautiful welcome for two',
    productIds: ['ch-001','wt-001','wt-003','ic-001','sd-027','sn-029','fr-001'],
    highlight: 'Champagne, ice, tonic, lemon and all the essentials for a perfect first evening',
  },
  {
    id: 'group',
    emoji: '🎉',
    label: 'Group Landing Kit',
    desc: 'The full first night setup for a group',
    productIds: ['sp-035','sp-012','sd-025','sd-003','ic-002','wt-002','sn-029','es-005','fr-003'],
    highlight: 'Spirits, mixers, ice, Red Bull, water, snacks and cups — ready to go',
  },
  {
    id: 'villa',
    emoji: '🏡',
    label: 'Villa Welcome Package',
    desc: 'Stock the villa for your whole stay',
    productIds: ['wn-021','ch-010','br-001','sp-035','sd-025','sd-027','ic-002','wt-002','wt-003','sn-029','sn-003','es-013','fr-003'],
    highlight: 'Rose, beers, spirits, mixers, champagne, water and all the villa essentials',
  },
  {
    id: 'wellness',
    emoji: '🧘',
    label: 'Wellness Arrival',
    desc: 'Healthy start for a mindful trip',
    productIds: ['wt-001','wt-003','wl-012','wl-013','wl-014','sn-029','sd-019'],
    highlight: 'Water, coconut water, vitamins, healthy snacks — feel amazing from day one',
  },
]

export default function ArrivalPackage({ onBack }) {
  const { addItem } = useCartStore()
  const { t } = useLang()
  const [selected, setSelected] = useState(null)
  const [adding, setAdding] = useState(false)

  const addPackage = async (pkg) => {
    setAdding(pkg.id)
    let count = 0
    pkg.productIds.forEach(id => {
      const p = PRODUCTS.find(pr => pr.id === id)
      if (p) { addItem(p); count++ }
    })
    await new Promise(r => setTimeout(r, 400))
    toast.success('Welcome to Ibiza! ' + count + ' items added 🌴', { duration: 3000 })
    setAdding(null)
    onBack()
  }

  const getProducts = (ids) => ids.map(id => PRODUCTS.find(p => p.id === id)).filter(Boolean)
  const getTotal = (ids) => getProducts(ids).reduce((s, p) => s + p.price, 0)

  return (
    <div style={{ padding:'0 16px 32px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
        <button onClick={onBack} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.6)', cursor:'pointer', fontSize:20, padding:0 }}>←</button>
        <div>
          <div style={{ fontFamily:'DM Serif Display,serif', fontSize:22, color:'white' }}>{t.ibizaArrivalPackage||'Ibiza Arrival Package'}</div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)' }}>Just landed? Get your essentials fast</div>
        </div>
      </div>

      <div style={{ background:'linear-gradient(135deg,rgba(196,104,58,0.3),rgba(43,122,139,0.3))', borderRadius:16, padding:'18px 16px', marginBottom:20, textAlign:'center' }}>
        <div style={{ fontSize:40, marginBottom:8 }}>✈️</div>
        <div style={{ fontFamily:'DM Serif Display,serif', fontSize:20, color:'white', marginBottom:6 }}>{t.welcomeWhiteIsle||'Welcome to the White Isle'}</div>
        <div style={{ fontSize:13, color:'rgba(255,255,255,0.6)', lineHeight:1.5 }}>
          Pick your arrival pack and Isla will deliver everything you need in under 30 minutes. Start the holiday right.
        </div>
      </div>

      {ARRIVAL_PACKAGES.map(pkg => {
        const prods = getProducts(pkg.productIds)
        const total = getTotal(pkg.productIds)
        const isSelected = selected === pkg.id
        return (
          <div key={pkg.id} onClick={() => setSelected(isSelected ? null : pkg.id)}
            style={{ background: isSelected?'rgba(196,104,58,0.15)':'rgba(255,255,255,0.07)', border:'0.5px solid ' + (isSelected?'rgba(196,104,58,0.4)':'rgba(255,255,255,0.1)'), borderRadius:16, padding:16, marginBottom:12, cursor:'pointer', transition:'all 0.2s' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
              <span style={{ fontSize:32 }}>{pkg.emoji}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:'DM Serif Display,serif', fontSize:18, color:'white' }}>{pkg.label}</div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', marginTop:2 }}>{pkg.desc}</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:16, fontWeight:500, color:'#E8A070' }}>€{total.toFixed(0)}</div>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)' }}>{prods.length} items</div>
              </div>
            </div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.55)', marginBottom: isSelected?12:0, lineHeight:1.4 }}>
              {pkg.highlight}
            </div>
            {isSelected && (
              <>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12 }}>
                  {prods.slice(0,8).map(p => (
                    <span key={p.id} style={{ fontSize:11, background:'rgba(255,255,255,0.08)', borderRadius:20, padding:'3px 8px', color:'rgba(255,255,255,0.7)' }}>
                      {p.emoji} {p.name.split(' ').slice(0,2).join(' ')}
                    </span>
                  ))}
                  {prods.length > 8 && <span style={{ fontSize:11, color:'rgba(255,255,255,0.35)', padding:'3px 0' }}>+{prods.length-8} more</span>}
                </div>
                <button onClick={(e) => { e.stopPropagation(); addPackage(pkg) }} disabled={adding === pkg.id}
                  style={{ width:'100%', padding:'13px', background: adding===pkg.id?'rgba(196,104,58,0.4)':'#C4683A', color:'white', border:'none', borderRadius:12, fontFamily:'DM Sans,sans-serif', fontSize:14, fontWeight:500, cursor:'pointer', boxShadow:'0 4px 16px rgba(196,104,58,0.35)' }}>
                  {adding === pkg.id ? 'Adding...' : 'Add to basket — €' + total.toFixed(2) + ' →'}
                </button>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
