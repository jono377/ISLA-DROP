// ================================================================
// LangContext.jsx — Single source of truth for all app translations
//
// HOW IT WORKS:
// 1. UI_STRINGS contains EVERY string used anywhere in the customer app
// 2. On language change, Claude translates the whole dict in one call
// 3. Every component calls useLang() to get { t, lang, setLang }
// 4. t.xxx replaces every hardcoded string in every component
// 5. Caches translations so each language is only translated once per session
// ================================================================
import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { PRODUCTS, CATEGORIES } from '../lib/products'

export const LangContext = createContext({
  lang: 'en', t: {}, setLang: () => {},
  getProductName: (_id, name) => name || '',
  getCategoryLabel: (_key, label) => label || '',
  translating: false,
})

const uiCache     = {}
const productCache = {}
const categoryCache = {}

// ── Supported languages ───────────────────────────────────────
export const LANGUAGES = [
  { code: 'en', label: 'English',    flag: '🇬🇧' },
  { code: 'es', label: 'Español',    flag: '🇪🇸' },
  { code: 'fr', label: 'Français',   flag: '🇫🇷' },
  { code: 'it', label: 'Italiano',   flag: '🇮🇹' },
  { code: 'de', label: 'Deutsch',    flag: '🇩🇪' },
  { code: 'ru', label: 'Русский',    flag: '🇷🇺' },
  { code: 'zh', label: '中文',        flag: '🇨🇳' },
  { code: 'ar', label: 'العربية',    flag: '🇦🇪' },
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
  { code: 'pt', label: 'Português',  flag: '🇵🇹' },
  { code: 'sv', label: 'Svenska',    flag: '🇸🇪' },
  { code: 'pl', label: 'Polski',     flag: '🇵🇱' },
  { code: 'tr', label: 'Türkçe',     flag: '🇹🇷' },
]

const LANG_NAMES = {
  es:'Spanish', fr:'French', it:'Italian', de:'German', ru:'Russian',
  zh:'Chinese (Simplified)', ar:'Arabic', nl:'Dutch', pt:'Portuguese',
  sv:'Swedish', pl:'Polish', tr:'Turkish',
}

// ── Every string used in the customer app ─────────────────────
export const UI_STRINGS = {
  // Navigation & tab bar
  home: 'Home', search: 'Search', basket: 'Basket', account: 'Account',
  categories: 'Categories', concierge: 'Concierge',
  // General actions
  back: 'Back', cancel: 'Cancel', save: 'Save', apply: 'Apply', confirm: 'Confirm',
  close: 'Close', done: 'Done', next: 'Next', skip: 'Skip', retry: 'Try again',
  add: 'Add', remove: 'Remove', edit: 'Edit', delete: 'Delete', share: 'Share',
  loading: 'Loading...', error: 'Something went wrong', noThanks: 'No thanks',
  seeAll: 'See all', viewAll: 'View all', showMore: 'Show more',
  // App identity
  tagline: '24/7 Delivery · Ibiza', orderNow: 'Order Now',
  anytime: 'Anytime. Anywhere. Ibiza.',
  welcomeWhiteIsle: 'Welcome to the White Isle',
  // Search
  searchPlaceholder: 'Ask Isla anything — beach day, cocktail night, hangover cure...',
  searchResults: 'Results', noResults: 'No results — try different words',
  islaSearching: 'Isla is searching for you...', askIsla: 'Ask Isla AI',
  // Home sections
  bestSellers: 'Best sellers', newIn: 'New in', orderAgain: 'Order again',
  popularNow: 'Popular right now', recentlyViewed: 'Recently viewed',
  onSale: 'On Sale', shopByOccasion: 'Shop by occasion',
  // Address & delivery
  deliveryAddress: 'Enter delivery address', setLocation: 'Set your delivery location',
  deliveredIn: 'Delivered in', minutes: 'mins', open247: 'Open 24/7',
  freeDelivery: 'Free delivery on orders over €200',
  deliveryFee: 'Delivery fee', estimatedTime: 'Estimated time',
  beachDelivery: 'Beach delivery', carDelivery: 'Car delivery',
  deliverToMyCar: 'Deliver to my car', whereParked: 'We will bring your order right to your parking spot',
  useMyLocation: 'Use my current location', describeLocation: 'Describe where I am parked',
  // Basket
  yourBasketEmpty: 'Your basket is empty', addSomethingDelicious: 'Add something delicious',
  orderSummary: 'Order summary', subtotal: 'Subtotal', delivery: 'Delivery',
  total: 'Total', free: 'Free', discountCode: 'Discount code',
  ageWarning: '18+ ID required at delivery for alcohol & tobacco',
  minimumOrder: 'Minimum order', addMore: 'Add more',
  scheduleOrder: 'Schedule for later', groupOrder: 'Group order',
  continueToCheckout: 'Continue to checkout', viewBasket: 'View basket',
  addToCart: 'Add', addedToBasket: 'Added!', removeItem: 'Remove',
  checkout: 'Order now — deliver ASAP',
  // Checkout & payment
  payment: 'Payment', orderPlaced: 'Order placed',
  signInToCheckout: 'Sign in to checkout',
  // Tracking
  liveTracking: 'Live tracking', tapToTrack: 'Tap to track',
  driverAssigned: 'Driver assigned', delivered: 'Delivered',
  driverOnWay: 'Driver on the way', placeAnotherOrder: 'Place another order',
  // Account
  signIn: 'Sign in', signUp: 'Create account', signOut: 'Sign out',
  email: 'Email', password: 'Password', name: 'Full name',
  myOrders: 'My orders', myAccount: 'My account', myDetails: 'My details',
  myCredit: 'My credit', savedAddresses: 'Saved addresses',
  noOrdersYet: 'No orders yet', editProfile: 'Edit profile',
  notifications: 'Notifications', wishlist: 'Wishlist', referral: 'Refer a friend',
  // Loyalty
  loyalty: 'Isla Rewards', earnStamps: 'Earn stamps', howCreditWorks: 'How credit works',
  // Concierge & experiences
  designExperience: 'Design Your Experience',
  designNight: 'Design Your Night', designNightSub: 'Club nights, villa parties, pre-drinks & more',
  designDay: 'Design Your Day', designDaySub: 'Pool parties, beach days, boat trips & more',
  bookNow: 'Book now', from: 'From', perPerson: 'per person',
  highlights: 'Highlights', getDirections: 'Get directions',
  islaInsider: 'Isla insider tip', requestSent: 'Request sent!',
  // Arrival
  justLanded: 'Just landed in Ibiza?',
  justLandedDesc: 'Get everything you need delivered in under 30 minutes — drinks, food, sun cream, the works.',
  arrivalPackages: 'See arrival packages', addAllToBasket: 'Add all to basket',
  ibizaArrivalPackage: 'Ibiza Arrival Package', viewPackage: 'View package',
  // Party / occasion
  numberOfGuests: 'Number of guests', selectDate: 'Select date',
  whatPlanning: 'What are you planning?', buildWithAI: 'Build with Isla AI',
  yourSelection: 'Your selection', addItems: 'Add items to basket',
  // Categories
  spirits: 'Spirits', champagne: 'Champagne', wine: 'Wine', beerCider: 'Beer & Cider',
  softDrinks: 'Soft drinks', water: 'Water & Juice', ice: 'Ice', snacks: 'Snacks',
  tobacco: 'Tobacco', wellness: 'Wellness', essentials: 'Essentials', beach: 'Beach',
  party: 'Party', cocktail: 'Cocktails', fresh: 'Fresh & Garnish', all: 'All',
  // Vibe names (used in party builder etc)
  vibePreDrinks: 'Pre-drinks', vibeCocktail: 'Cocktail night', vibeSundowner: 'Sundowner',
  vibeLadies: 'Ladies night', vibeBoys: 'Boys night', vibeHangover: 'Hangover cure',
  vibeDateNight: 'Date night', vibePool: 'Pool party', vibeGentleman: 'Gentleman evening',
  vibeBirthday: 'Birthday', vibeBeach: 'Beach day', vibeSnacks: 'Snacks board',
  // Misc UI
  continueShopping: 'Continue shopping', items: 'items', item: 'item',
  shareBasket: 'Share basket', scanBarcode: 'Scan barcode',
  // Support
  contactSupport: 'Contact support', chatWithUs: 'Chat with us', faq: 'FAQs',
  // AI
  askingIsla: 'Asking Isla...', islaThinking: 'Isla is thinking...',
  couldNotGenerate: 'Could not generate right now — please try again',
  // Pool party
  poolPartyMode: 'Pool party mode', bulkOrdering: 'Bulk ordering for groups',
  // Villa
  villaPresets: 'Villa presets', loadPreset: 'Load preset', savePreset: 'Save preset',
  // Morning kit
  morningAfterKit: 'Morning after kit', orderRecovery: 'Order recovery essentials',
  // Misc confirmations
  confirmDelete: 'Are you sure?', itemRemoved: 'Item removed',
  addressSaved: 'Address saved', changesSaved: 'Changes saved',
}

// Seed the English cache immediately — no API call needed
uiCache['en'] = UI_STRINGS

// ── Helpers ───────────────────────────────────────────────────
function detectDeviceLang() {
  try {
    const supported = LANGUAGES.map(l => l.code)
    const nav = (navigator.language || 'en').slice(0, 2).toLowerCase()
    return supported.includes(nav) ? nav : 'en'
  } catch { return 'en' }
}

async function callClaude(prompt, maxTokens) {
  try {
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
    if (!apiKey) return null
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: maxTokens || 4000,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    if (!resp.ok) return null
    const data = await resp.json()
    return data.content?.[0]?.text?.trim() || null
  } catch { return null }
}

function parseJSON(raw) {
  try { return JSON.parse((raw || '{}').replace(/```json|```/g, '').trim()) }
  catch { return null }
}

async function translateUI(lang) {
  if (uiCache[lang]) return uiCache[lang]
  const langName = LANG_NAMES[lang]
  if (!langName) return UI_STRINGS
  const list = Object.entries(UI_STRINGS).map(([k, v]) => k + ': ' + v).join('\n')
  const raw = await callClaude(
    'Translate these UI strings for an Ibiza 24/7 delivery app into ' + langName + '.\n' +
    'Rules: Keep brand names as-is (Isla Drop, Ibiza, Pacha, Aperol, Prosecco, Red Bull, Coca-Cola, etc). Keep emojis. Keep €200. Keep placeholders like "30 minutes".\n' +
    'Return ONLY a valid JSON object with the same keys. No markdown, no explanation.\n\n' + list,
    5000
  )
  const parsed = parseJSON(raw)
  const merged = { ...UI_STRINGS, ...(parsed || {}) }
  uiCache[lang] = merged
  return merged
}

async function translateProductNames(lang) {
  if (productCache[lang]) return productCache[lang]
  const langName = LANG_NAMES[lang]
  if (!langName) return {}
  const list = PRODUCTS.map(p => p.id + '|' + p.name).join('\n')
  const raw = await callClaude(
    'Translate these drink/product names into ' + langName + ' for an Ibiza delivery app.\n' +
    'Keep brand names (Coca-Cola, Red Bull, Aperol, Moet, Marlboro, etc). Keep sizes (330ml, 70cl).\n' +
    'Return ONLY JSON: { "product-id": "translated name" }. No markdown.\n\n' + list,
    6000
  )
  const parsed = parseJSON(raw) || {}
  productCache[lang] = parsed
  return parsed
}

async function translateCategoryLabels(lang) {
  if (categoryCache[lang]) return categoryCache[lang]
  const langName = LANG_NAMES[lang]
  if (!langName) return {}
  const list = CATEGORIES.map(c => c.key + '|' + c.label).join('\n')
  const raw = await callClaude(
    'Translate these product category names into ' + langName + '.\n' +
    'Return ONLY JSON: { "key": "translated label" }. No markdown.\n\n' + list,
    500
  )
  const parsed = parseJSON(raw) || {}
  categoryCache[lang] = parsed
  return parsed
}

// ── Provider ──────────────────────────────────────────────────
export function LangProvider({ children }) {
  const [lang, setLangState]         = useState('en')
  const [t, setT]                    = useState(UI_STRINGS)
  const [translating, setTranslating] = useState(false)
  const [productNames, setProductNames] = useState({})
  const [catLabels, setCatLabels]    = useState({})

  // Auto-detect on first load
  useEffect(() => {
    // Priority: saved preference > device language > English default
    try {
      const saved = localStorage.getItem('isla_lang')
      if (saved && saved !== 'en') { handleSetLang(saved); return }
    } catch {}
    const detected = detectDeviceLang()
    if (detected !== 'en') handleSetLang(detected)
  }, [])

  const handleSetLang = useCallback(async (newLang) => {
    setLangState(newLang)
    // English — use strings directly, no API call
    if (newLang === 'en') {
      setT(UI_STRINGS)
      setProductNames({})
      setCatLabels({})
      try { localStorage.setItem('isla_lang', 'en') } catch {}
      return
    }
    // Apply cached instantly if available
    if (uiCache[newLang]) setT(uiCache[newLang])
    setTranslating(true)
    try {
      const [uiResult, prodResult, catResult] = await Promise.all([
        translateUI(newLang).catch(() => UI_STRINGS),
        translateProductNames(newLang).catch(() => ({})),
        translateCategoryLabels(newLang).catch(() => ({})),
      ])
      setT(uiResult)
      setProductNames(prodResult)
      setCatLabels(catResult)
      try { localStorage.setItem('isla_lang', newLang) } catch {}
    } catch {}
    finally { setTranslating(false) }
  }, [])


  const getProductName = useCallback((id, fallback) => {
    return productNames[id] || fallback || ''
  }, [productNames])

  const getCategoryLabel = useCallback((key, fallback) => {
    return catLabels[key] || fallback || ''
  }, [catLabels])

  return (
    <LangContext.Provider value={{ lang, setLang: handleSetLang, t, translating, getProductName, getCategoryLabel }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}

// Convenience hook — use anywhere in customer app
export function useAppT() {
  const { t } = useContext(LangContext)
  return t
}
