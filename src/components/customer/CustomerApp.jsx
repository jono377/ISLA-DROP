import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { getProducts, createOrder, subscribeToOrder } from '../../lib/supabase'
import { useCartStore, useAuthStore } from '../../lib/store'
import DeliveryMap from './DeliveryMap'
import AgeVerification from './AgeVerification'
import StripeCheckout from './StripeCheckout'

const CATEGORIES = [
  { key: null, label: 'All' },
  { key: 'champagne', label: '🍾 Champagne' },
  { key: 'wine', label: '🍷 Wine' },
  { key: 'spirits', label: '🥃 Spirits' },
  { key: 'beer', label: '🍺 Beer' },
  { key: 'soft_drinks', label: '🥤 Soft Drinks' },
  { key: 'ice_mixers', label: '🧊 Ice & Mixers' },
]

const SCREENS = { SHOP: 'shop', AGE_VERIFY: 'age_verify', CHECKOUT: 'checkout', TRACKING: 'tracking' }

export default function CustomerApp() {
  const [products, setProducts] = useState([])
  const [category, setCategory] = useState(null)
  const [screen, setScreen] = useState(SCREENS.SHOP)
  const [activeOrder, setActiveOrder] = useState(null)
  const [locationSet, setLocationSet] = useState(false)

  const { user, profile } = useAuthStore()
  const cart = useCartStore()

  useEffect(() => {
    getProducts().then(setProducts).catch(console.error)
  }, [])

  const filteredProducts = category
    ? products.filter(p => p.category === category)
    : products

  const handleCheckoutClick = () => {
    if (!locationSet) { toast.error('Please set your delivery location first'); return }
    if (cart.itemCount === 0) return
    if (cart.hasAgeRestrictedItems) {
      setScreen(SCREENS.AGE_VERIFY)
    } else {
      setScreen(SCREENS.CHECKOUT)
    }
  }

  const handleAgeVerified = () => setScreen(SCREENS.CHECKOUT)

  const handlePaymentSuccess = async (paymentIntentId) => {
    try {
      const items = cart.items.map(i => ({
        productId: i.product.id,
        quantity: i.quantity,
        price: i.product.price,
      }))

      const order = await createOrder({
        customerId: user.id,
        items,
        deliveryLat: cart.deliveryLat,
        deliveryLng: cart.deliveryLng,
        deliveryAddress: cart.deliveryAddress,
        deliveryNotes: cart.deliveryNotes,
        what3words: cart.what3words,
        subtotal: cart.subtotal,
        total: cart.total,
        paymentIntentId,
      })

      cart.clearCart()
      setActiveOrder(order)
      setScreen(SCREENS.TRACKING)

      // Subscribe to order updates
      const sub = subscribeToOrder(order.id, (updated) => {
        setActiveOrder(updated)
        if (updated.status === 'delivered') {
          toast.success('🎉 Your order has been delivered!')
          sub.unsubscribe()
        }
      })
    } catch (err) {
      toast.error('Failed to place order: ' + err.message)
    }
  }

  if (screen === SCREENS.AGE_VERIFY) {
    return <Modal onClose={() => setScreen(SCREENS.SHOP)}><AgeVerification onVerified={handleAgeVerified} onClose={() => setScreen(SCREENS.SHOP)} /></Modal>
  }

  if (screen === SCREENS.CHECKOUT) {
    return (
      <div style={{ padding: '20px 20px 100px' }}>
        <button onClick={() => setScreen(SCREENS.SHOP)} style={backBtn}>← Back to shop</button>
        <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 24, margin: '16px 0 20px' }}>Checkout</div>

        <OrderSummary items={cart.items} subtotal={cart.subtotal} total={cart.total} address={cart.deliveryAddress} />

        <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 18, margin: '24px 0 16px' }}>Payment</div>
        <StripeCheckout onSuccess={handlePaymentSuccess} onCancel={() => setScreen(SCREENS.SHOP)} />
      </div>
    )
  }

  if (screen === SCREENS.TRACKING && activeOrder) {
    return <OrderTracking order={activeOrder} onNewOrder={() => setScreen(SCREENS.SHOP)} />
  }

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #2B7A8B 0%, #1A5263 100%)', padding: '20px 20px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 24, color: 'white', letterSpacing: '-0.3px' }}>Isla Drop</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 1 }}>Ibiza · 24/7 Delivery</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.18)', border: '0.5px solid rgba(255,255,255,0.25)', borderRadius: 20, fontSize: 11, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 5, color: 'white' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#7EE8A2', animation: 'pulse 1.5s infinite', display: 'inline-block' }} />
            Open now
          </div>
        </div>
      </div>

      {/* Map */}
      <DeliveryMap onLocationSet={() => setLocationSet(true)} />

      {/* Age Banner */}
      <div style={{ margin: '14px 16px 0', background: '#F0DDD3', border: '0.5px solid #C4683A', borderRadius: 10, padding: '10px 14px', display: 'flex', gap: 10, alignItems: 'center', fontSize: 12, color: '#8B4220' }}>
        <span style={{ flexShrink: 0 }}>🆔</span>
        <span><strong>18+</strong> — ID required at delivery for all alcohol orders. Powered by Onfido.</span>
      </div>

      {/* Category chips */}
      <div style={{ padding: '18px 16px 0' }}>
        <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 20, marginBottom: 12 }}>What are you after?</div>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
          {CATEGORIES.map(c => (
            <button
              key={c.key ?? 'all'}
              onClick={() => setCategory(c.key)}
              style={{
                padding: '7px 16px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                whiteSpace: 'nowrap', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                border: '0.5px solid',
                background: category === c.key ? '#2B7A8B' : '#FEFCF9',
                color: category === c.key ? 'white' : '#7A6E60',
                borderColor: category === c.key ? '#2B7A8B' : 'rgba(42,35,24,0.15)',
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Products grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '16px 16px 0' }}>
        {filteredProducts.map(product => (
          <ProductCard key={product.id} product={product} onAdd={() => { cart.addItem(product); toast.success(`${product.emoji} Added!`, { duration: 1200 }) }} />
        ))}
      </div>

      {/* Cart bar */}
      {cart.itemCount > 0 && (
        <div
          onClick={handleCheckoutClick}
          style={{ position: 'sticky', bottom: 68, margin: '16px 16px 0', background: '#C4683A', borderRadius: 14, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
        >
          <div style={{ color: 'white' }}>
            <div style={{ fontSize: 11, opacity: 0.8 }}>{cart.itemCount} item{cart.itemCount !== 1 ? 's' : ''}</div>
            <div style={{ fontSize: 16, fontWeight: 500 }}>€{cart.subtotal.toFixed(2)} + €3.50 delivery</div>
          </div>
          <div style={{ color: 'white', fontSize: 13, fontWeight: 500 }}>Checkout →</div>
        </div>
      )}

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  )
}

function ProductCard({ product, onAdd }) {
  const qty = useCartStore(s => s.items.find(i => i.product.id === product.id)?.quantity ?? 0)
  const { updateQuantity } = useCartStore()

  return (
    <div style={{ background: '#FEFCF9', border: '0.5px solid rgba(42,35,24,0.12)', borderRadius: 14, padding: '14px 12px' }}>
      <span style={{ fontSize: 30, display: 'block', marginBottom: 8 }}>{product.emoji}</span>
      <div style={{ fontSize: 13, fontWeight: 500, color: '#2A2318', marginBottom: 2, lineHeight: 1.3 }}>{product.name}</div>
      <div style={{ fontSize: 11, color: '#7A6E60', marginBottom: 10 }}>{product.description}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 14, fontWeight: 500 }}>€{product.price.toFixed(2)}</span>
        {qty > 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => updateQuantity(product.id, qty - 1)} style={qtyBtn}>−</button>
            <span style={{ fontSize: 13, fontWeight: 500, minWidth: 16, textAlign: 'center' }}>{qty}</span>
            <button onClick={() => updateQuantity(product.id, qty + 1)} style={{ ...qtyBtn, background: '#2B7A8B' }}>+</button>
          </div>
        ) : (
          <button onClick={onAdd} style={{ width: 28, height: 28, background: '#2B7A8B', border: 'none', borderRadius: '50%', color: 'white', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', lineHeight: 1 }}>+</button>
        )}
      </div>
    </div>
  )
}

function OrderSummary({ items, subtotal, total, address }) {
  return (
    <div style={{ background: '#F5F0E8', borderRadius: 14, padding: 16, marginBottom: 4 }}>
      <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 16, marginBottom: 12 }}>Order summary</div>
      {items.map(({ product, quantity }) => (
        <div key={product.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
          <span>{product.emoji} {product.name} × {quantity}</span>
          <span style={{ fontWeight: 500 }}>€{(product.price * quantity).toFixed(2)}</span>
        </div>
      ))}
      <div style={{ borderTop: '0.5px solid rgba(42,35,24,0.15)', paddingTop: 10, marginTop: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#7A6E60', marginBottom: 4 }}>
          <span>Subtotal</span><span>€{subtotal.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#7A6E60', marginBottom: 8 }}>
          <span>Delivery</span><span>€3.50</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 500 }}>
          <span>Total</span><span>€{total.toFixed(2)}</span>
        </div>
      </div>
      {address && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '0.5px solid rgba(42,35,24,0.12)', fontSize: 12, color: '#7A6E60' }}>
          📍 {address}
        </div>
      )}
    </div>
  )
}

function OrderTracking({ order, onNewOrder }) {
  const STATUS_STEPS = ['confirmed', 'preparing', 'assigned', 'picked_up', 'en_route', 'delivered']
  const STATUS_LABELS = { confirmed: 'Confirmed', preparing: 'Preparing', assigned: 'Driver assigned', picked_up: 'Picked up', en_route: 'On the way', delivered: 'Delivered!' }
  const currentIdx = STATUS_STEPS.indexOf(order.status)

  return (
    <div style={{ padding: '20px 20px 100px' }}>
      <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 24, marginBottom: 4 }}>
        {order.status === 'delivered' ? 'Delivered! 🎉' : 'Order on its way'}
      </div>
      <div style={{ fontSize: 13, color: '#7A6E60', marginBottom: 24 }}>Order #{order.order_number}</div>

      <div style={{ background: '#F5F0E8', borderRadius: 14, padding: 16, marginBottom: 20 }}>
        {STATUS_STEPS.map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: i < STATUS_STEPS.length - 1 ? 12 : 0 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              background: i <= currentIdx ? (i === currentIdx ? '#C4683A' : '#5A6B3A') : 'rgba(42,35,24,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {i < currentIdx && <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>}
              {i === currentIdx && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />}
            </div>
            <span style={{ fontSize: 14, fontWeight: i === currentIdx ? 500 : 400, color: i > currentIdx ? '#7A6E60' : '#2A2318' }}>
              {STATUS_LABELS[s]}
            </span>
          </div>
        ))}
      </div>

      {order.estimated_minutes && order.status !== 'delivered' && (
        <div style={{ background: '#D4EEF2', borderRadius: 14, padding: '14px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24 }}>🛵</span>
          <div>
            <div style={{ fontSize: 13, color: '#1A5263' }}>Estimated arrival</div>
            <div style={{ fontSize: 20, fontWeight: 500, color: '#0C4450' }}>{order.estimated_minutes} minutes</div>
          </div>
        </div>
      )}

      <button onClick={onNewOrder} style={{ width: '100%', padding: 15, background: '#2B7A8B', color: 'white', border: 'none', borderRadius: 12, fontFamily: 'DM Sans, sans-serif', fontSize: 15, cursor: 'pointer' }}>
        Place another order
      </button>
    </div>
  )
}

function Modal({ children, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(30,20,10,0.55)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: '#FEFCF9', borderRadius: '24px 24px 0 0', padding: '28px 24px 36px', width: '100%', maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div style={{ width: 36, height: 4, background: 'rgba(42,35,24,0.15)', borderRadius: 2, margin: '0 auto 20px' }} />
        {children}
      </div>
    </div>
  )
}

const backBtn = { background: 'none', border: 'none', color: '#7A6E60', fontSize: 14, cursor: 'pointer', padding: 0, fontFamily: 'DM Sans, sans-serif' }
const qtyBtn = { width: 26, height: 26, background: 'rgba(42,35,24,0.1)', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }
