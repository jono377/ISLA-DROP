import { useState } from 'react'
import toast from 'react-hot-toast'
import { PRODUCTS, CATEGORIES } from '../../lib/products'
import { useCartStore } from '../../lib/store'
import ProductImage from '../shared/ProductImage'
import { SortFilterBar, sortProducts, WishlistButton, trackView } from './CustomerFeatures_15'
import { haptic } from './CustomerFeatures_polish'
import { Analytics } from './CustomerFeatures_final'
import { CategoryHeroImage, useInfiniteScroll, LazyImg } from './CustomerFeatures_v2'

const C = {
  bg:'linear-gradient(170deg,#0A2A38 0%,#0D3545 35%,#1A5060 70%,#2B7A8B 100%)',
  header:'linear-gradient(135deg,#0D3B4A 0%,#1A5263 100%)',
  card:'rgba(255,255,255,0.07)', border:'rgba(255,255,255,0.1)',
  text:'white', muted:'rgba(255,255,255,0.45)',
  accent:'#C4683A', accentAlt:'#E8A070',
}

function ProductCard({ product, onDetail }) {
  const qty = useCartStore(s => s.items.find(i => i.product.id === product.id)?.quantity ?? 0)
  const { addItem, updateQuantity } = useCartStore()

  return (
    <div style={{ background:C.card, border:'0.5px solid '+C.border, borderRadius:14, overflow:'hidden', position:'relative', cursor:'pointer', transition:'transform 0.1s cubic-bezier(0.34,1.56,0.64,1)' }}
      onClick={()=>{ trackView(product); Analytics.productView(product); onDetail&&onDetail(product) }}
      onTouchStart={e=>{ haptic('light'); e.currentTarget.style.transform='scale(0.97)' }}
      onTouchEnd={e=>{ e.currentTarget.style.transform='scale(1)' }}>
      <div style={{ position:'relative' }}>
        <ProductImage productId={product.id} emoji={product.emoji} category={product.category} alt={product.name} size="card" style={{ height:120 }} />
        {/* Wishlist heart */}
        <div style={{ position:'absolute', top:8, left:8 }} onClick={e=>e.stopPropagation()}>
          <WishlistButton productId={product.id} />
        </div>
        {product.age_restricted && (
          <div style={{ position:'absolute',top:8,right:8,background:'rgba(0,0,0,0.55)',borderRadius:8,padding:'2px 7px',fontSize:10,color:'white',fontFamily:'DM Sans,sans-serif' }}>18+</div>
        )}
        {product.popular && (
          <div style={{ position:'absolute',bottom:6,left:8,background:'rgba(0,0,0,0.55)',borderRadius:8,padding:'2px 7px',fontSize:9,color:'rgba(255,255,255,0.9)',fontWeight:600 }}>🔥 Popular</div>
        )}
        {qty === 0
          ? <button onClick={e=>{ e.stopPropagation(); addItem(product); navigator.vibrate&&navigator.vibrate(25); toast.success(product.emoji+' Added!',{duration:900}) }}
              style={{ position:'absolute',top:8,right:8,width:30,height:30,background:C.accent,border:'2px solid rgba(255,255,255,0.7)',borderRadius:'50%',color:'white',fontSize:19,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',boxShadow:'0 2px 8px rgba(0,0,0,0.2)',lineHeight:1 }}>+</button>
          : <div onClick={e=>e.stopPropagation()} style={{ position:'absolute',top:8,right:8,display:'flex',alignItems:'center',gap:4,background:'rgba(0,0,0,0.65)',borderRadius:20,padding:'3px 8px',boxShadow:'0 2px 8px rgba(0,0,0,0.15)' }}>
              <button onClick={()=>updateQuantity(product.id,qty-1)} style={{ width:20,height:20,background:'rgba(255,255,255,0.15)',border:'none',borderRadius:'50%',cursor:'pointer',fontSize:13,display:'flex',alignItems:'center',justifyContent:'center',color:'white' }}>−</button>
              <span style={{ fontSize:12,fontWeight:500,color:'white',minWidth:12,textAlign:'center' }}>{qty}</span>
              <button onClick={()=>updateQuantity(product.id,qty+1)} style={{ width:20,height:20,background:C.accent,border:'none',borderRadius:'50%',cursor:'pointer',fontSize:13,color:'white',display:'flex',alignItems:'center',justifyContent:'center' }}>+</button>
            </div>
        }
      </div>
      <div style={{ padding:'10px 12px 12px' }}>
        <div style={{ fontSize:12,fontWeight:500,color:C.text,lineHeight:1.3,marginBottom:4,minHeight:30 }}>{product.name}</div>
        <div style={{ fontSize:14,fontWeight:500,color:C.accentAlt }}>€{product.price.toFixed(2)}</div>
      </div>
    </div>
  )
}

export function AllProductsPage({ title, products, onBack, onDetail }) {
  const [sort, setSort] = useState('popular')
  const [maxPrice, setMaxPrice] = useState(999)
  const allPrices = products.map(p=>p.price)
  const sorted = sortProducts(products.filter(p=>p.price<=maxPrice), sort)

  return (
    <div style={{ minHeight:'100vh', background:C.bg, paddingBottom:100 }}>
      <div style={{ background:C.header, padding:'16px 16px 14px', position:'sticky', top:0, zIndex:50 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
          <button onClick={onBack} style={{ width:36,height:36,background:'rgba(255,255,255,0.1)',border:'0.5px solid rgba(255,255,255,0.18)',borderRadius:'50%',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          </button>
          <div>
            <div style={{ fontFamily:'DM Serif Display,serif',fontSize:22,color:'white',lineHeight:1 }}>{title}</div>
            <div style={{ fontSize:12,color:C.muted,marginTop:2 }}>{sorted.length} products</div>
          </div>
        </div>
        <SortFilterBar sort={sort} setSort={setSort} maxPrice={maxPrice} setMaxPrice={setMaxPrice} allPrices={allPrices} />
      </div>
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,padding:'14px 14px 0' }}>
        {sorted.map(p=><ProductCard key={p.id} product={p} onDetail={onDetail}/>)}
        {sorted.length===0&&<div style={{ gridColumn:'span 2',textAlign:'center',padding:40,color:C.muted }}>No products in this range</div>}
      </div>
    </div>
  )
}

export default function CategoryPage({ categoryKey, onBack, onDetail }) {
  const [activeSub, setActiveSub] = useState(null)
  const [sort, setSort] = useState('popular')
  const [maxPrice, setMaxPrice] = useState(999)

  const catConfig = CATEGORIES.find(c => c.key === categoryKey)
  if (!catConfig) return null

  const baseProducts = PRODUCTS.filter(p =>
    p.category === categoryKey && (!activeSub || p.sub === activeSub)
  )
  const allPrices = baseProducts.map(p=>p.price)
  const products = sortProducts(baseProducts.filter(p=>p.price<=maxPrice), sort)

  return (
    <div style={{ minHeight:'100vh', background:C.bg, paddingBottom:100 }}>
      <div style={{ background:C.header, padding:'16px 16px 14px', position:'sticky', top:0, zIndex:50 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
          <button onClick={onBack} style={{ width:36,height:36,background:'rgba(255,255,255,0.1)',border:'0.5px solid rgba(255,255,255,0.18)',borderRadius:'50%',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          </button>
          <div>
            <div style={{ fontFamily:'DM Serif Display,serif',fontSize:22,color:'white',lineHeight:1 }}>
              {catConfig.emoji} {catConfig.label}
            </div>
            <div style={{ fontSize:12,color:C.muted,marginTop:2 }}>{products.length} products</div>
          </div>
        </div>

        {/* Sub-category pills */}
        {catConfig.subs && catConfig.subs.length > 1 && (
          <div style={{ display:'flex',gap:7,overflowX:'auto',scrollbarWidth:'none',paddingBottom:8,marginBottom:6 }}>
            <button onClick={()=>setActiveSub(null)} style={subBtn(!activeSub)}>All</button>
            {catConfig.subs.map(s=>(
              <button key={s.key} onClick={()=>setActiveSub(s.key===activeSub?null:s.key)} style={subBtn(activeSub===s.key)}>{s.label}</button>
            ))}
          </div>
        )}

        {/* POINT 1: Sort + Filter */}
        <SortFilterBar sort={sort} setSort={setSort} maxPrice={maxPrice} setMaxPrice={setMaxPrice} allPrices={allPrices} />
      </div>

      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,padding:'14px 14px 0' }}>
        {products.map(p=><ProductCard key={p.id} product={p} onDetail={onDetail}/>)}
      </div>
      {products.length===0 && (
        <div style={{ textAlign:'center',padding:'60px 20px',color:C.muted,fontSize:14 }}>No products in this selection.</div>
      )}
    </div>
  )
}

const subBtn = active => ({
  padding:'7px 16px', borderRadius:20, fontSize:12, fontWeight:active?500:400,
  background:active?'rgba(255,255,255,0.9)':'rgba(255,255,255,0.1)',
  color:active?'#0D3B4A':'white',
  border:active?'none':'0.5px solid rgba(255,255,255,0.18)',
  cursor:'pointer', whiteSpace:'nowrap', fontFamily:'DM Sans,sans-serif', flexShrink:0,
})
