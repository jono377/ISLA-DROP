import { useState, useRef, useCallback } from 'react'
import toast from 'react-hot-toast'
import { uploadProductImage, deleteProductImage, getProductImageUrl } from '../../lib/images'
import { PRODUCTS, CATEGORIES } from '../../lib/products'
import ProductImage from '../shared/ProductImage'

export default function ImageManager() {
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState(null)
  const [uploading, setUploading] = useState({}) // { productId: true }
  const [uploaded, setUploaded] = useState({})   // { productId: true } — optimistic
  const fileInputRef = useRef(null)
  const [activeProduct, setActiveProduct] = useState(null)

  const filtered = PRODUCTS.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = !filterCat || p.category === filterCat
    return matchSearch && matchCat
  })

  const handleFileSelect = useCallback(async (e) => {
    const file = e.target.files?.[0]
    if (!file || !activeProduct) return

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Please upload a JPG, PNG or WebP image')
      return
    }

    // Validate file size (max 3MB)
    if (file.size > 3 * 1024 * 1024) {
      toast.error('Image must be under 3MB')
      return
    }

    setUploading(u => ({ ...u, [activeProduct.id]: true }))
    try {
      await uploadProductImage(activeProduct.id, file)
      setUploaded(u => ({ ...u, [activeProduct.id]: true }))
      toast.success(`✓ ${activeProduct.name} image uploaded`)
    } catch (err) {
      toast.error('Upload failed: ' + err.message)
    }
    setUploading(u => ({ ...u, [activeProduct.id]: false }))
    e.target.value = ''
    setActiveProduct(null)
  }, [activeProduct])

  const handleUploadClick = (product) => {
    setActiveProduct(product)
    setTimeout(() => fileInputRef.current?.click(), 50)
  }

  const handleDelete = async (product) => {
    if (!confirm(`Remove image for ${product.name}?`)) return
    try {
      await deleteProductImage(product.id)
      setUploaded(u => ({ ...u, [product.id]: false }))
      toast.success('Image removed')
    } catch (err) {
      toast.error('Delete failed: ' + err.message)
    }
  }

  const promptText = (product) => {
    const catPrompts = {
      spirits: `${product.name} spirit bottle`,
      champagne: `${product.name} champagne bottle`,
      wine: `${product.name} wine bottle`,
      beer: `${product.name} beer`,
      soft_drinks: `${product.name} drink`,
      water: `${product.name} water bottle`,
      ice: 'bag of crushed ice',
      snacks: `${product.name} snack`,
      tobacco: `${product.name} pack`,
      wellness: `${product.name} product`,
    }
    return `Warm Mediterranean lifestyle product photo of ${catPrompts[product.category] || product.name}, golden hour Ibiza sunlight, soft sandy warm background, photorealistic, no text overlays, square format, warm golden tones, luxury feel`
  }

  const copyPrompt = (product) => {
    navigator.clipboard.writeText(promptText(product))
    toast.success('Prompt copied — paste into ChatGPT or Midjourney')
  }

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      {/* Header */}
      <div style={{ background: '#1E1810', padding: '20px 16px', color: 'white', marginBottom: 0 }}>
        <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 22, marginBottom: 4 }}>Product Images</div>
        <div style={{ fontSize: 12, opacity: 0.5 }}>{PRODUCTS.length} products · tap any to upload image</div>
      </div>

      {/* How to guide */}
      <div style={{ background: '#F0DDD3', border: '0.5px solid #C4683A', margin: '16px 16px 0', borderRadius: 12, padding: '12px 14px' }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: '#8B4220', marginBottom: 6 }}>How to add product images</div>
        <div style={{ fontSize: 12, color: '#8B4220', lineHeight: 1.7 }}>
          1. Tap <strong>Copy prompt</strong> on any product<br />
          2. Paste into <strong>ChatGPT</strong> or <strong>Midjourney</strong> to generate image<br />
          3. Save the image to your device<br />
          4. Tap <strong>Upload image</strong> and select the file<br />
          5. Image goes live in the app instantly ✓
        </div>
      </div>

      {/* Search + filter */}
      <div style={{ padding: '14px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', background: '#F5F0E8', borderRadius: 10, padding: '9px 12px', gap: 8, marginBottom: 12 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7A6E60" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products…"
            style={{ flex: 1, border: 'none', background: 'none', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#2A2318', outline: 'none' }}
          />
          {search && <button onClick={() => setSearch('')} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#7A6E60', fontSize: 14 }}>✕</button>}
        </div>

        {/* Category pills */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none', marginBottom: 4 }}>
          <button onClick={() => setFilterCat(null)} style={pillStyle(!filterCat)}>All</button>
          {CATEGORIES.map(c => (
            <button key={c.key} onClick={() => setFilterCat(c.key === filterCat ? null : c.key)} style={pillStyle(filterCat === c.key)}>
              {c.emoji} {c.label}
            </button>
          ))}
        </div>

        <div style={{ fontSize: 12, color: '#7A6E60', marginBottom: 12, marginTop: 8 }}>
          {filtered.length} products
        </div>
      </div>

      {/* Product list */}
      <div style={{ padding: '0 16px' }}>
        {filtered.map(product => (
          <div key={product.id} style={{ background: 'white', border: '0.5px solid rgba(42,35,24,0.1)', borderRadius: 14, padding: 14, marginBottom: 10, display: 'flex', gap: 12, alignItems: 'flex-start' }}>

            {/* Image preview */}
            <div style={{ width: 72, flexShrink: 0 }}>
              <ProductImage
                productId={product.id}
                emoji={product.emoji}
                category={product.category}
                alt={product.name}
                size="list"
                style={{ height: 72, width: 72, borderRadius: 10 }}
              />
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#2A2318', marginBottom: 2, lineHeight: 1.3 }}>{product.name}</div>
              <div style={{ fontSize: 11, color: '#7A6E60', marginBottom: 10 }}>
                {product.category} · €{product.price.toFixed(2)}
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button
                  onClick={() => copyPrompt(product)}
                  style={{ padding: '6px 10px', background: '#F5F0E8', border: '0.5px solid rgba(42,35,24,0.15)', borderRadius: 8, fontFamily: 'DM Sans, sans-serif', fontSize: 11, cursor: 'pointer', color: '#2A2318', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  📋 Copy prompt
                </button>

                <button
                  onClick={() => handleUploadClick(product)}
                  disabled={uploading[product.id]}
                  style={{ padding: '6px 10px', background: uploading[product.id] ? '#7A6E60' : '#2B7A8B', border: 'none', borderRadius: 8, fontFamily: 'DM Sans, sans-serif', fontSize: 11, cursor: uploading[product.id] ? 'not-allowed' : 'pointer', color: 'white', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  {uploading[product.id] ? (
                    <><span style={{ width: 10, height: 10, border: '1.5px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} /> Uploading…</>
                  ) : '⬆ Upload image'}
                </button>

                <button
                  onClick={() => handleDelete(product)}
                  style={{ padding: '6px 10px', background: '#FAECE7', border: 'none', borderRadius: 8, fontFamily: 'DM Sans, sans-serif', fontSize: 11, cursor: 'pointer', color: '#993C1D' }}
                >
                  🗑 Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

const pillStyle = (active) => ({
  padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: active ? 500 : 400,
  background: active ? '#1A5263' : '#F5F0E8', color: active ? 'white' : '#7A6E60',
  border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
  fontFamily: 'DM Sans, sans-serif',
})
