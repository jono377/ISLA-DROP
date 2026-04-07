import { useT_ctx } from '../../i18n/TranslationContext'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { PRODUCTS, CATEGORIES } from '../../lib/products'
import { useCartStore } from '../../lib/store'
import ProductImage from '../shared/ProductImage'

// Uses the same ocean colour scheme throughout — no per-category theming
const C = {
  bg:     'linear-gradient(170deg,#0A2A38 0%,#0D3545 35%,#1A5060 70%,#2B7A8B 100%)',
  header: 'linear-gradient(135deg,#0D3B4A 0%,#1A5263 100%)',
  card:   'rgba(255,255,255,0.07)',
  border: 'rgba(255,255,255,0.1)',
  text:   'white',
  muted:  'rgba(255,255,255,0.45)',
  accent: '#C4683A',
  accentAlt: '#E8A070',
}

function ProductCard({ product }) {
  const qty = useCartStore(s => s.items.find(i => i.product.id === product.id)?.quantity ?? 0)
  const { addItem, updateQuantity } = useCartStore()

  return (
    <div style={{ background:C.card, border:'0.5px solid ' + C.border, borderRadius:14, overflow:'hidden', position:'relative' }}>
      <div style={{ position:'relative' }}>
        <ProductImage productId={product.id} emoji={product.emoji} category={product.category} alt={product.name} size="card" style={{ height:120 }} />
        {qty === 0
          ? <button onClick={()=>{ addItem(product); toast.success(product.emoji+' Added!',{duration:900}) }}
              style={{ position:'absolute',top:8,right:8,width:30,height:30,background:C.accent,border:'2px solid rgba(255,255,255,0.7)',borderRadius:'50%',color:'white',fontSize:19,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',boxShadow:'0 2px 8px rgba(0,0,0,0.2)',lineHeight:1 }}>+</button>
          : <div style={{ position:'absolute',top:8,right:8,display:'flex',alignItems:'center',gap:4,background:'rgba(0,0,0,0.65)',borderRadius:20,padding:'3px 8px',boxShadow:'0 2px 8px rgba(0,0,0,0.15)' }}>
              <button onClick={()=>updateQuantity(product.id,qty-1)} style={{ width:20,height:20,background:'rgba(255,255,255,0.15)',border:'none',borderRadius:'50%',cursor:'pointer',fontSize:13,display:'flex',alignItems:'center',justifyContent:'center',color:'white' }}>−</button>
              <span style={{ fontSize:12,fontWeight:500,color:'white',minWidth:12,textAlign:'center' }}>{qty}</span>
              <button onClick={()=>updateQuantity(product.id,qty+1)} style={{ width:20,height:20,background:C.accent,border:'none',borderRadius:'50%',cursor:'pointer',fontSize:13,color:'white',display:'flex',alignItems:'center',justifyContent:'center' }}>+</button>
            </div>
        }
        {product.age_restricted && (
          <div style={{ position:'absolute',top:8,left:8,background:'rgba(0,0,0,0.55)',borderRadius:8,padding:'2px 7px',fontSize:10,color:'white',fontFamily:'DM Sans,sans-serif' }}>18+</div>
        )}
      </div>
      <div style={{ padding:'10px 12px 12px' }}>
        <div style={{ fontSize:12,fontWeight:500,color:C.text,lineHeight:1.3,marginBottom:4,minHeight:30 }}>{getProductName(product.id, product.name)}</div>
        <div style={{ fontSize:14,fontWeight:500,color:C.accentAlt }}>€{product.price.toFixed(2)}</div>
      </div>
    </div>
  )
}

// ── Full-catalogue "All" page ─────────────────────────────────
export function AllProductsPage({ title, products, onBack }) {
  return (
    <div style={{ minHeight:'100vh', background:C.bg, paddingBottom:100 }}>
      <div style={{ background:C.header, padding:'16px 16px 20px', position:'sticky', top:0, zIndex:50 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={onBack} style={{ width:36,height:36,background:'rgba(255,255,255,0.1)',border:'0.5px solid rgba(255,255,255,0.18)',borderRadius:'50%',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          </button>
          <div>
            <div style={{ fontFamily:'DM Serif Display,serif',fontSize:24,color:'white',lineHeight:1 }}>{title}</div>
            <div style={{ fontSize:12,color:C.muted,marginTop:2 }}>{products.length} products</div>
          </div>
        </div>
      </div>
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,padding:'14px 14px 0' }}>
        {products.map(p=><ProductCard key={p.id} product={p}/>)}
      </div>
    </div>
  )
}

// ── Category page ─────────────────────────────────────────────
export default function CategoryPage({ categoryKey, onBack }) {
  const t = useT_ctx()
  const getProductName = (_id, name) => name || ""
  const getCategoryLabel = (_key, label) => label || ""
  const [activeSub, setActiveSub] = useState(null)
  const catConfig = CATEGORIES.find(c => c.key === categoryKey)
  if (!catConfig) return null

  const products = PRODUCTS.filter(p =>
    p.category === categoryKey && (!activeSub || p.sub === activeSub)
  )

  return (
    <div style={{ minHeight:'100vh', background:C.bg, paddingBottom:100 }}>
      {/* Header — same ocean scheme, no per-category theming */}
      <div style={{ background:C.header, padding:'16px 16px 20px', position:'sticky', top:0, zIndex:50 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
          <button onClick={onBack} style={{ width:36,height:36,background:'rgba(255,255,255,0.1)',border:'0.5px solid rgba(255,255,255,0.18)',borderRadius:'50%',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          </button>
          <div>
            <div style={{ fontFamily:'DM Serif Display,serif',fontSize:24,color:'white',lineHeight:1 }}>
              {catConfig.emoji} {catConfig.label}
            </div>
            <div style={{ fontSize:12,color:C.muted,marginTop:2 }}>{products.length} products</div>
          </div>
        </div>
        {catConfig.subs.length > 1 && (
          <div style={{ display:'flex',gap:7,overflowX:'auto',scrollbarWidth:'none',paddingBottom:2 }}>
            <button onClick={()=>setActiveSub(null)} style={subBtn(!activeSub)}>All</button>
            {catConfig.subs.map(s=>(
              <button key={s.key} onClick={()=>setActiveSub(s.key===activeSub?null:s.key)} style={subBtn(activeSub===s.key)}>{s.label}</button>
            ))}
          </div>
        )}
      </div>

      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,padding:'14px 14px 0' }}>
        {products.map(p=><ProductCard key={p.id} product={p}/>)}
      </div>
      {products.length===0 && (
        <div style={{ textAlign:'center',padding:'60px 20px',color:C.muted,fontSize:14 }}>{t.noProducts||'No products in this selection.'}</div>
      )}
    </div>
  )
}

const subBtn = active => ({
  padding:'7px 16px', borderRadius:20, fontSize:12, fontWeight:active?500:400,
  background: active?'rgba(255,255,255,0.9)':'rgba(255,255,255,0.1)',
  color: active?'#0D3B4A':'white',
  border: active?'none':'0.5px solid rgba(255,255,255,0.18)',
  cursor:'pointer', whiteSpace:'nowrap', fontFamily:'DM Sans,sans-serif', flexShrink:0,
})
