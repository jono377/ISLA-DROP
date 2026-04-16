import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ── Auth Store ────────────────────────────────────────────────
export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      profile: null,
      setUser: (user) => set({ user }),
      setProfile: (profile) => set({ profile }),
      clear: () => set({ user: null, profile: null }),
    }),
    { name: 'auth-store' }
  )
)

// ── Cart Store ────────────────────────────────────────────────
export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      previousItems: [],
      deliveryLat: null,
      deliveryLng: null,
      deliveryAddress: '',
      deliveryNotes: '',
      what3words: '',
      promoCode: null,
      scheduledAt: null,

      addItem: (product) => {
        const items = get().items
        const existing = items.find(i => i.product.id === product.id)
        if (existing) {
          set({ items: items.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i) })
        } else {
          set({ items: [...items, { product, quantity: 1 }] })
        }
      },

      removeItem: (productId) => {
        set({ items: get().items.filter(i => i.product.id !== productId) })
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) { get().removeItem(productId); return }
        set({ items: get().items.map(i => i.product.id === productId ? { ...i, quantity } : i) })
      },

      clearCart: () => set(s => ({
        previousItems: s.items.map(i => i.product),
        items: [], promoCode: null, scheduledAt: null,
        deliveryNotes: ''
      })),

      setDeliveryLocation: (lat, lng, address, w3w = '') => {
        set({ deliveryLat: lat, deliveryLng: lng, deliveryAddress: address, what3words: w3w })
      },

      setDeliveryNotes: (notes) => set({ deliveryNotes: notes }),
      setPromoCode: (code) => set({ promoCode: code }),
      setScheduledAt: (dt) => set({ scheduledAt: dt }),

      getSubtotal: () => get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
      getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      getDiscount: () => get().promoCode?.reward_eur || 0,
      getTotal: () => Math.max(0, get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0) + 3.50 - (get().promoCode?.reward_eur || 0)),
      getHasAgeRestricted: () => get().items.some(i => i.product.age_restricted || i.product.is_age_restricted),
    }),
    {
      name: 'cart-store',
      // Persist delivery address across sessions
      partialize: (state) => ({
        items: state.items,
        previousItems: state.previousItems,
        deliveryLat: state.deliveryLat,
        deliveryLng: state.deliveryLng,
        deliveryAddress: state.deliveryAddress,
        what3words: state.what3words,
      })
    }
  )
)

// ── Wishlist Store ────────────────────────────────────────────
export const useWishlistStore = create(
  persist(
    (set, get) => ({
      items: [], // array of product objects

      toggle: (product) => {
        const items = get().items
        const exists = items.find(i => i.id === product.id)
        if (exists) {
          set({ items: items.filter(i => i.id !== product.id) })
          return false // removed
        } else {
          set({ items: [...items, product] })
          return true // added
        }
      },

      has: (productId) => !!get().items.find(i => i.id === productId),
      clear: () => set({ items: [] }),
    }),
    { name: 'wishlist-store' }
  )
)

// ── Driver Store ──────────────────────────────────────────────
export const useDriverStore = create((set) => ({
  isOnline: false,
  currentOrder: null,
  availableOrders: [],
  currentLat: null,
  currentLng: null,
  stats: null,
  setOnline: (val) => set({ isOnline: val }),
  setCurrentOrder: (order) => set({ currentOrder: order }),
  setAvailableOrders: (orders) => set({ availableOrders: orders }),
  updateLocation: (lat, lng) => set({ currentLat: lat, currentLng: lng }),
  setStats: (stats) => set({ stats }),
}))

// ── Ops Store ─────────────────────────────────────────────────
export const useOpsStore = create((set) => ({
  stats: { activeOrders: 0, onlineDrivers: 0, avgEta: 0 },
  liveOrders: [],
  drivers: [],
  alerts: [],
  setStats: (stats) => set({ stats }),
  setLiveOrders: (orders) => set({ liveOrders: orders }),
  setDrivers: (drivers) => set({ drivers }),
  addAlert: (alert) => set(s => ({ alerts: [alert, ...s.alerts].slice(0, 20) })),
}))
