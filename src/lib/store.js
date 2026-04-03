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
      items: [],       // [{ product, quantity }]
      deliveryLat: null,
      deliveryLng: null,
      deliveryAddress: '',
      deliveryNotes: '',
      what3words: '',

      addItem: (product) => {
        const items = get().items
        const existing = items.find(i => i.product.id === product.id)
        if (existing) {
          set({ items: items.map(i => i.product.id === product.id
            ? { ...i, quantity: i.quantity + 1 } : i) })
        } else {
          set({ items: [...items, { product, quantity: 1 }] })
        }
      },

      removeItem: (productId) => {
        set({ items: get().items.filter(i => i.product.id !== productId) })
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }
        set({ items: get().items.map(i =>
          i.product.id === productId ? { ...i, quantity } : i) })
      },

      clearCart: () => set(s => ({ previousItems: s.items.map(i => i.product), items: [] })),

      setDeliveryLocation: (lat, lng, address, w3w = '') => {
        set({ deliveryLat: lat, deliveryLng: lng, deliveryAddress: address, what3words: w3w })
      },

      setDeliveryNotes: (notes) => set({ deliveryNotes: notes }),

      get subtotal() {
        return get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0)
      },

      get itemCount() {
        return get().items.reduce((sum, i) => sum + i.quantity, 0)
      },

      get total() {
        const sub = get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0)
        return sub + 3.50
      },

      get hasAgeRestrictedItems() {
        return get().items.some(i => i.product.is_age_restricted)
      },
    }),
    { name: 'cart-store' }
  )
)

// ── Driver Store ──────────────────────────────────────────────
export const useDriverStore = create((set, get) => ({
  isOnline: false,
  currentOrder: null,
  availableOrders: [],
  locationWatchId: null,
  currentLat: null,
  currentLng: null,

  setOnline: (val) => set({ isOnline: val }),
  setCurrentOrder: (order) => set({ currentOrder: order }),
  setAvailableOrders: (orders) => set({ availableOrders: orders }),
  updateLocation: (lat, lng) => set({ currentLat: lat, currentLng: lng }),
  setLocationWatchId: (id) => set({ locationWatchId: id }),
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
