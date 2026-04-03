import { useState } from 'react'
import toast from 'react-hot-toast'
import { PRODUCTS, CATEGORIES } from '../../lib/products'
import { useCartStore } from '../../lib/store'
import ProductImage from '../shared/ProductImage'

function ProductCard({ product }) {
  const qty = useCartStore(s => s.items.find(i=>i.product.id===product.id)?.quantity ?? 0)
  const { addItem, updateQuantity } = useCartStore()

  return (
    <div style={{ background:'rgba(255,255,255,0.92)', border:'0.5px solid rgba(42,35,24,0.08)', borderRadius:16, overflow:'hidden', position:'relative' }}>
      {/* Image with + button overlay */}
      <div style={{ position:'relative' }}>
        <ProductImage
          productId={product.id}
          emoji={product.emoji}
          category={product.category}
          alt={product.name}
          size="card"
          style={{ height:130 }}
        />
        {/* + button top right of image */}
        {qty === 0 ? (
          <button
            onClick={()=>{ addItem(product); toast.success(product.emoji+' Added!',{duration:900}) }}
            style={{ position:'absolute', top:8, right:8, width:30, height:30, background:'#C4683A', border:'2px solid white', borderRadius:'50%', color:'white', fontSize:19, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', boxShadow:'0 2px 8px rgba(0,0,0,0.2)', lineHeight:1 }}
          >+</button>
        ) : (
          <div style={{ position:'absolute', top:8, right:8, display:'flex', alignItems:'center', gap:4, background:'rgba(255,255,255,0.95)', borderRadius:20, padding:'3px 8px', boxShadow:'0 2px 8px rgba(0,0,0,0.15)' }}>
            <button onClick={()=>updateQuantity(product.id,qty-1)} style={{ width:20,height:20,background:'#E8E0D0',border:'none',borderRadius:'50%',cursor:'pointer',fontSize:13,display:'flex',alignItems:'center',justifyContent:'center' }}>−</button>
            <span style={{ fontSize:12,fontWeight:500,minWidth:12,textAlign:'center' }}>{qty}</span>
            <button onClick={()=>updateQuantity(product.id,qty+1)} style={{ width:20,height:20,background:'#2B7A8B',border:'none',borderRadius:'50%',cursor:'pointer',fontSize:13,color:'white',display:'flex',alignItems:'center',justifyContent:'center' }}>+</button>
          </div>
        )}
        {/* Age restricted badge */}
        {product.age_restricted && (
          <div style={{ position:'absolute', top:8, left:8, background:'rgba(0,0,0,0.55)', borderRadius:10, padding:'2px 7px', fontSize:10, color:'white', fontFamily:'DM Sans,sans-serif' }}>18+</div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding:'10px 12px 12px' }}>
        <div style={{ fontSize:12, fontWeight:500, color:'#2A2318', lineHeight:1.3, marginBottom:4, minHeight:30 }}>{product.name}</div>
        <div style={{ fontSize:14, fontWeight:500, color:'#C4683A' }}>€{product.price.toFixed(2)}</div>
      </div>
    </div>
  )
}

export default function CategoryPage({ categoryKey, onBack }) {
  const [activeSub, setActiveSub] = useState(null)
  const catConfig = CATEGORIES.find(c => c.key === categoryKey)

  if (!catConfig) return null

  const products = PRODUCTS.filter(p =>
    p.category === categoryKey && (!activeSub || p.sub === activeSub)
  )

  // Background gradient per category
  const bgMap = {
    spirits:    'linear-gradient(160deg,#2A1A0A 0%,#5A3010 40%,#8B4820 100%)',
    champagne:  'linear-gradient(160deg,#0A2018 0%,#0F4028 40%,#1A6040 100%)',
    wine:       'linear-gradient(160deg,#2A0A15 0%,#5A1530 40%,#8B2045 100%)',
    beer:       'linear-gradient(160deg,#2A1A00 0%,#5A3800 40%,#8B5800 100%)',
    soft_drinks:'linear-gradient(160deg,#001828 0%,#003050 40%,#005078 100%)',
    water:      'linear-gradient(160deg,#001A28 0%,#003848 40%,#005868 100%)',
    ice:        'linear-gradient(160deg,#001020 0%,#002040 40%,#003870 100%)',
    snacks:     'linear-gradient(160deg,#201000 0%,#483000 40%,#705000 100%)',
    tobacco:    'linear-gradient(160deg,#180A00 0%,#382010 40%,#503020 100%)',
    wellness:   'linear-gradient(160deg,#200A18 0%,#401530 40%,#602048 100%)',
  }

  return (
    <div style={{ minHeight:'100vh', background: bgMap[categoryKey] || bgMap.spirits, paddingBottom:100 }}>
      {/* Header */}
      <div style={{ padding:'16px 16px 20px', position:'sticky', top:0, zIndex:50, background: bgMap[categoryKey] || bgMap.spirits }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
          <button onClick={onBack} style={{ width:36, height:36, background:'rgba(255,255,255,0.12)', border:'0.5px solid rgba(255,255,255,0.2)', borderRadius:'50%', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          </button>
          <div>
            <div style={{ fontFamily:'DM Serif Display,serif', fontSize:26, color:'white', lineHeight:1 }}>
              {catConfig.emoji} {catConfig.label}
            </div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', marginTop:2 }}>{products.length} products</div>
          </div>
        </div>

        {/* Sub-category chips */}
        {catConfig.subs.length > 1 && (
          <div style={{ display:'flex', gap:7, overflowX:'auto', scrollbarWidth:'none', paddingBottom:2 }}>
            <button onClick={()=>setActiveSub(null)} style={subBtn(!activeSub)}>All</button>
            {catConfig.subs.map(s => (
              <button key={s.key} onClick={()=>setActiveSub(s.key===activeSub?null:s.key)} style={subBtn(activeSub===s.key)}>{s.label}</button>
            ))}
          </div>
        )}
      </div>

      {/* Product grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, padding:'0 14px' }}>
        {products.map(p => <ProductCard key={p.id} product={p} />)}
      </div>

      {products.length === 0 && (
        <div style={{ textAlign:'center', padding:'60px 20px', color:'rgba(255,255,255,0.5)', fontSize:14 }}>No products in this selection.</div>
      )}
    </div>
  )
}

const subBtn = active => ({
  padding:'7px 16px', borderRadius:20, fontSize:12, fontWeight: active?500:400,
  background: active?'rgba(255,255,255,0.95)':'rgba(255,255,255,0.12)',
  color: active?'#2A2318':'white',
  border: active?'none':'0.5px solid rgba(255,255,255,0.2)',
  cursor:'pointer', whiteSpace:'nowrap', fontFamily:'DM Sans,sans-serif', flexShrink:0,
})
