import { useState, useMemo } from 'react'
import toast from 'react-hot-toast'
import { PRODUCTS, CATEGORIES } from '../../lib/products'
import { useCartStore, useWishlistStore } from '../../lib/store'
import ProductImage from '../shared/ProductImage'
import { WishlistHeart, SortFilterSheet } from './CustomerFeatures2'

const C = {
  bg:'linear-gradient(170deg,#0A2A38 0%,#0D3545 35%,#1A5060 70%,#2B7A8B 100%)',
  header:'linear-gradient(135deg,#0D3B4A 0%,#1A5263 100%)',
  card:'rgba(255,255,255,0.07)', border:'rgba(255,255,255,0.1)',
  text:'white', muted:'rgba(255,255,255,0.45)', accent:'#C4683A', accentAlt:'#E8A070',
}
const F = { serif:'DM Serif Display,serif', sans:'DM Sans,sans-serif' }

function ProductCard({ product, onDetail }) {
  const qty = useCartStore(s => s.items.find(i => i.product.id === product.id)?.quantity ?? 0)
  const { addItem, updateQuantity } = useCartStore()
  const outOfStock = product.stock_quantity === 0

  return (
    <div style={{ background:C.card, border:'0.5px solid '+C.border, borderRadius:14, overflow:'hidden', position:'relative', opacity:outOfStock?0.55:1, cursor:'pointer' }} onClick={()=>onDetail?.(product)}>
      <div style={{ position:'relative' }}>
        <ProductImage productId={product.id} emoji={product.emoji} category={product.category} alt={product.name} size="card" style={{ height:120 }} />

        {/* Low stock badge */}
        {!outOfStock && product.low_stock && product.stock_quantity <= 5 && (
          <div style={{ position:'absolute', top:8, left:8, background:'#C4683A', borderRadius:8, padding:'2px 7px', fontSize:9, color:'white', fontWeight:700 }}>Only {product.stock_quantity} left!</div>
        )}

        {/* Out of stock overlay */}
        {outOfStock && (
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.55)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ background:'rgba(0,0,0,0.7)', borderRadius:8, padding:'4px 10px', fontSize:10, color:'white', fontWeight:700 }}>Out of stock</div>
          </div>
        )}

        {/* Age badge */}
        {product.age_restricted && !outOfStock && (
          <div style={{ position:'absolute', top:8, left:8, background:'rgba(0,0,0,0.55)', borderRadius:8, padding:'2px 7px', fontSize:10, color:'white' }}>18+</div>
        )}

        {/* Wishlist heart */}
        <WishlistHeart product={product} style={{ position:'absolute', top:6, right:6 }} />

        {/* Add to cart */}
        {!outOfStock && (
          qty === 0 ?
            <button onClick={e=>{e.stopPropagation();addItem(product);toast.success(product.emoji+' Added!',{duration:900})}}
              style={{ position:'absolute', bottom:8, right:8, width:30, height:30, background:C.accent, border:'2px solid rgba(255,255,255,0.7)', borderRadius:'50%', color:'white', fontSize:19, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', boxShadow:'0 2px 8px rgba(0,0,0,0.2)', lineHeight:1 }}>+</button>
            : <div onClick={e=>e.stopPropagation()} style={{ position:'absolute', bottom:8, right:8, display:'flex', alignItems:'center', gap:4, background:'rgba(0,0,0,0.65)', borderRadius:20, padding:'3px 8px' }}>
                <button onClick={()=>updateQuantity(product.id,qty-1)} style={{ width:20, height:20, background:'rgba(255,255,255,0.15)', border:'none', borderRadius:'50%', cursor:'pointer', fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', color:'white' }}>−</button>
                <span style={{ fontSize:12, fontWeight:500, color:'white', minWidth:12, textAlign:'center' }}>{qty}</span>
                <button onClick={()=>updateQuantity(product.id,qty+1)} style={{ width:20, height:20, background:C.accent, border:'none', borderRadius:'50%', cursor:'pointer', fontSize:13, color:'white', display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
              </div>
        )}
      </div>
      <div style={{ padding:'10px 12px 12px' }}>
        <div style={{ fontSize:12, fontWeight:500, color:C.text, lineHeight:1.3, marginBottom:4, minHeight:30 }}>{product.name}</div>
        <div style={{ fontSize:14, fontWeight:500, color:C.accentAlt }}>€{product.price.toFixed(2)}</div>
      </div>
    </div>
  )
}

export function AllProductsPage({ title, products, onBack, onDetail }) {
  const [showFilter, setShowFilter] = useState(false)
  const [sortFilter, setSortFilter] = useState({ sort:'default', maxPrice:200, flags:[] })

  const sorted = useMemo(() => {
    let list = products.filter(p => p.price <= sortFilter.maxPrice)
    if (sortFilter.flags.includes('popular')) list = list.filter(p=>p.popular)
    if (sortFilter.flags.includes('age_ok')) list = list.filter(p=>!p.age_restricted)
    if (sortFilter.flags.includes('age_restricted')) list = list.filter(p=>p.age_restricted)
    if (sortFilter.sort === 'price_asc') list = [...list].sort((a,b)=>a.price-b.price)
    else if (sortFilter.sort === 'price_desc') list = [...list].sort((a,b)=>b.price-a.price)
    else if (sortFilter.sort === 'popular') list = [...list].sort((a,b)=>(b.popular?1:0)-(a.popular?1:0))
    else if (sortFilter.sort === 'name') list = [...list].sort((a,b)=>a.name.localeCompare(b.name))
    return list
  }, [products, sortFilter])

  const hasFilters = sortFilter.sort !== 'default' || sortFilter.maxPrice < 200 || sortFilter.flags.length > 0

  return (
    <div style={{ minHeight:'100vh', background:C.bg, paddingBottom:100 }}>
      <div style={{ background:C.header, padding:'16px 16px 20px', position:'sticky', top:0, zIndex:50 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:0 }}>
          <button onClick={onBack} style={{ width:36, height:36, background:'rgba(255,255,255,0.1)', border:'0.5px solid rgba(255,255,255,0.18)', borderRadius:'50%', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          </button>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:F.serif, fontSize:24, color:'white', lineHeight:1 }}>{title}</div>
            <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>{sorted.length} products</div>
          </div>
          <button onClick={()=>setShowFilter(true)}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 12px', background:hasFilters?'rgba(196,104,58,0.3)':'rgba(255,255,255,0.1)', border:'0.5px solid '+(hasFilters?C.accent:'rgba(255,255,255,0.18)'), borderRadius:20, cursor:'pointer', color:hasFilters?C.accent:'white', fontSize:12, fontWeight:hasFilters?700:400 }}>
            ⚙️ {hasFilters ? 'Filtered' : 'Sort & filter'}
          </button>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, padding:'14px 14px 0' }}>
        {sorted.map(p => <ProductCard key={p.id} product={p} onDetail={onDetail} />)}
      </div>
      {sorted.length === 0 && <div style={{ textAlign:'center', padding:'60px 20px', color:C.muted, fontSize:14 }}>No products match your filters</div>}
      {showFilter && <SortFilterSheet onClose={()=>setShowFilter(false)} onApply={setSortFilter} currentSort={sortFilter.sort} currentFilters={sortFilter} />}
    </div>
  )
}

export default function CategoryPage({ categoryKey, onBack, onDetail }) {
  const [activeSub, setActiveSub] = useState(null)
  const [showFilter, setShowFilter] = useState(false)
  const [sortFilter, setSortFilter] = useState({ sort:'default', maxPrice:200, flags:[] })

  const catConfig = CATEGORIES.find(c => c.key === categoryKey)
  if (!catConfig) return null

  const baseProducts = PRODUCTS.filter(p =>
    p.category === categoryKey && (!activeSub || p.sub === activeSub)
  )

  const sorted = useMemo(() => {
    let list = baseProducts.filter(p => p.price <= sortFilter.maxPrice)
    if (sortFilter.flags.includes('popular')) list = list.filter(p=>p.popular)
    if (sortFilter.flags.includes('age_ok')) list = list.filter(p=>!p.age_restricted)
    if (sortFilter.flags.includes('age_restricted')) list = list.filter(p=>p.age_restricted)
    if (sortFilter.sort === 'price_asc') list = [...list].sort((a,b)=>a.price-b.price)
    else if (sortFilter.sort === 'price_desc') list = [...list].sort((a,b)=>b.price-a.price)
    else if (sortFilter.sort === 'popular') list = [...list].sort((a,b)=>(b.popular?1:0)-(a.popular?1:0))
    else if (sortFilter.sort === 'name') list = [...list].sort((a,b)=>a.name.localeCompare(b.name))
    return list
  }, [baseProducts, sortFilter])

  const hasFilters = sortFilter.sort !== 'default' || sortFilter.maxPrice < 200 || sortFilter.flags.length > 0
  const cartCount = useCartStore(s=>s.items.reduce((n,i)=>n+i.quantity,0))

  return (
    <div style={{ minHeight:'100vh', background:C.bg, paddingBottom:100 }}>
      <div style={{ background:C.header, padding:'16px 16px 16px', position:'sticky', top:0, zIndex:50 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:catConfig.subs?.length > 1 ? 14 : 0 }}>
          <button onClick={onBack} style={{ width:36, height:36, background:'rgba(255,255,255,0.1)', border:'0.5px solid rgba(255,255,255,0.18)', borderRadius:'50%', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          </button>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:F.serif, fontSize:24, color:'white', lineHeight:1 }}>{catConfig.emoji} {catConfig.label}</div>
            <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>{sorted.length} products</div>
          </div>
          <button onClick={()=>setShowFilter(true)}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 12px', background:hasFilters?'rgba(196,104,58,0.3)':'rgba(255,255,255,0.1)', border:'0.5px solid '+(hasFilters?C.accent:'rgba(255,255,255,0.18)'), borderRadius:20, cursor:'pointer', color:hasFilters?C.accent:'white', fontSize:12 }}>
            ⚙️ {hasFilters ? 'Filtered' : 'Filter'}
          </button>
        </div>

        {catConfig.subs?.length > 1 && (
          <div style={{ display:'flex', gap:7, overflowX:'auto', scrollbarWidth:'none', paddingBottom:2 }}>
            <button onClick={()=>setActiveSub(null)} style={subBtn(!activeSub)}>All</button>
            {catConfig.subs.map(s => (
              <button key={s.key} onClick={()=>setActiveSub(s.key===activeSub?null:s.key)} style={subBtn(activeSub===s.key)}>{s.label}</button>
            ))}
          </div>
        )}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, padding:'14px 14px 0' }}>
        {sorted.map(p => <ProductCard key={p.id} product={p} onDetail={onDetail} />)}
      </div>
      {sorted.length === 0 && <div style={{ textAlign:'center', padding:'60px 20px', color:C.muted, fontSize:14 }}>No products match your filters</div>}
      {showFilter && <SortFilterSheet onClose={()=>setShowFilter(false)} onApply={setSortFilter} currentSort={sortFilter.sort} currentFilters={sortFilter} />}
    </div>
  )
}

const subBtn = active => ({
  padding:'7px 16px', borderRadius:20, fontSize:12, fontWeight:active?500:400,
  background:active?'rgba(255,255,255,0.9)':'rgba(255,255,255,0.1)',
  color:active?'#0D3B4A':'white',
  border:active?'none':'0.5px solid rgba(255,255,255,0.18)',
  cursor:'pointer', whiteSpace:'nowrap', fontFamily:F.sans, flexShrink:0,
})
