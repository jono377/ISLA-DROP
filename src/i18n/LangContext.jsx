import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { T, LANGUAGES } from './translations'

export const LangContext = createContext({
  lang: 'en', t: T.en, setLang: () => {},
  getProductName: (_id, name) => name || '',
  getCategoryLabel: (_key, label) => label || '',
  translating: false,
})

const uiCache = { en: T.en }
const productCache = {}
const categoryCache = {}

const LANG_NAMES = {
  es:'Spanish', fr:'French', it:'Italian', de:'German', ru:'Russian',
  zh:'Chinese (Simplified)', ar:'Arabic', nl:'Dutch', pt:'Portuguese',
  sv:'Swedish', pl:'Polish', tr:'Turkish'
}

function detectDeviceLang() {
  try {
    const supported = LANGUAGES.map(l => l.code)
    const nav = (navigator.language || navigator.userLanguage || 'en').slice(0,2).toLowerCase()
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
        model: 'claude-sonnet-4-20250514',
        max_tokens: maxTokens || 4000,
        messages: [{ role: 'user', content: prompt }]
      })
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

const UI_STRINGS = {
  home:'Home', search:'Search', basket:'Basket', account:'Account', concierge:'Concierge', categories:'Categories',
  tagline:'24/7 Delivery · Ibiza', orderNow:'Order Now', back:'Back', cancel:'Cancel', save:'Save', apply:'Apply',
  searchPlaceholder:'Ask Isla anything — beach day, cocktail night, hangover cure...',
  bestSellers:'Best sellers', newIn:'New in', orderAgain:'Order again', popularNow:'Popular right now',
  designExperience:'Design Your Experience', designNight:'Design Your Night', designDay:'Design Your Day',
  designNightSub:'Club nights, villa parties, pre-drinks & more',
  designDaySub:'Pool parties, beach days, boat trips & more',
  justLanded:'Just landed in Ibiza?',
  justLandedDesc:'Get everything you need delivered in under 30 minutes — drinks, food, sun cream, the works.',
  arrivalPackages:'See arrival packages', onSale:'On Sale', recentlyViewed:'Recently viewed',
  seeAll:'See all', addToCart:'Add', anytime:'Anytime. Anywhere. Ibiza.',
  viewCart:'View basket', checkout:'Order now — deliver ASAP', yourBasketEmpty:'Your basket is empty',
  addSomethingDelicious:'Add something delicious', orderSummary:'Order summary',
  subtotal:'Subtotal', delivery:'Delivery', total:'Total', free:'Free',
  discountCode:'Discount code', freeDelivery:'Free delivery on orders over €200',
  scheduleOrder:'Schedule for later', groupOrder:'Group order',
  ageWarning:'18+ ID required at delivery for alcohol & tobacco', payment:'Payment',
  signIn:'Sign in', signUp:'Create account', signOut:'Sign out', email:'Email', password:'Password', name:'Full name',
  myOrders:'My orders', myAccount:'My account', myDetails:'My details', myCredit:'My credit',
  noOrdersYet:'No orders yet', loading:'Loading...', loyalty:'Isla Rewards', howCreditWorks:'How credit works',
  whatPlanning:'What are you planning tonight?', islaSearching:'Isla is searching for you...',
  noResults:'No results — try different words',
  vibePreDrinks:'Pre-drinks', vibePreDrinksSub:'Spirits, mixers, shots & ice for the night ahead',
  vibeCocktail:'Cocktail night', vibeCocktailSub:'Everything to mix perfect cocktails — kits, spirits, garnishes and ice',
  vibeSundowner:'Sundowner', vibeSundDownerSub:'Rosé, Aperol Spritz and cold drinks for the golden hour',
  vibeLadies:'Ladies night', vibeLadiesSub:'Champagne, Prosecco, rosé and everything for a glamorous evening',
  vibeBoys:'Boys night', vibeBoysSub:'Cold beers, shots and party supplies — no fuss, maximum fun',
  vibeHangover:'Hangover cure', vibeHangoverSub:'Electrolytes, vitamins, coconut water and everything your body needs',
  vibeDateNight:'Date night', vibeDateSub:'Premium champagne, rosé, a cocktail kit and romantic touches for two',
  vibePool:'Pool party', vibePoolSub:'Cold drinks, beers, ice and everything for a perfect pool day',
  vibeGentleman:'Gentleman evening', vibeGentlemanSub:'Premium whisky, cognac and quality wine',
  vibeBirthday:'Birthday', vibeBirthdaySub:'Champagne, sparklers and party supplies to make it unforgettable',
  vibeBeach:'Beach day', vibeBeachSub:'Water, suncream, snacks and essentials for a perfect beach day',
  vibeSnacks:'Snacks board', vibeSnacksSub:'Crisps, antipasto, olives and sharing boards for any occasion',
  spirits:'Spirits', champagne:'Champagne', wine:'Wine', beerCider:'Beer & Cider',
  softDrinks:'Soft drinks', water:'Water', ice:'Ice', snacks:'Snacks',
  tobacco:'Tobacco', wellness:'Wellness', essentials:'Essentials', beach:'Beach',
  party:'Party', cocktail:'Cocktails', fresh:'Fresh & Garnish',
  all:'All', boats:'Boats & Yachts', villas:'Villas', clubs:'Club Tickets',
  vip:'VIP Packages', beachClubs:'Beach Clubs', restaurants:'Restaurants', experiences:'Experiences',
  numberOfGuests:'Number of guests', selectDate:'Select date', getDirections:'Get directions',
  designMyNight:'Design My Night', designMyDay:'Design My Day', requestSent:'Request sent!',
  dinnerClubsVip:'Dinner, clubs, VIP', bookNow:'Book now', from:'From',
  perPerson:'per person', highlights:'Highlights', islaInsider:'Isla insider',
  welcomeWhiteIsle:'Welcome to the White Isle', ibizaArrivalPackage:'Ibiza Arrival Package',
  addAllToBasket:'Add all to basket', viewPackage:'View package',
  liveTracking:'Live tracking', tapToTrack:'Tap to track', placeAnotherOrder:'Place another order',
  orderPlaced:'Order placed', driverAssigned:'Driver assigned', delivered:'Delivered',
  deliveryAddress:'Enter delivery address', setLocation:'Set your delivery location',
  continueShopping:'Continue shopping', items:'items', item:'item', retry:'Try again',
  noThanks:'No thanks',
}

async function translateUI(lang) {
  if (uiCache[lang]) return uiCache[lang]
  const langName = LANG_NAMES[lang]
  if (!langName) return T[lang] || T.en
  const list = Object.entries(UI_STRINGS).map(([k, v]) => k + ': ' + v).join('\n')
  const raw = await callClaude(
    'Translate these UI strings for an Ibiza 24/7 delivery app into ' + langName + '.\nKeep brand names as-is (Isla Drop, Ibiza, Pacha, Aperol, Prosecco, etc). Keep emojis. Keep €200.\nReturn ONLY a valid JSON object with same keys. No markdown, no explanation.\n\n' + list,
    4000
  )
  const parsed = parseJSON(raw)
  const merged = { ...(T[lang] || T.en), ...(parsed || {}) }
  uiCache[lang] = merged
  return merged
}

async function translateProductNames(lang) {
  if (productCache[lang]) return productCache[lang]
  try {
    const { PRODUCTS } = await import('../lib/products')
    const langName = LANG_NAMES[lang]
    if (!langName) return {}
    const list = PRODUCTS.map(p => p.id + '|' + p.name).join('\n')
    const raw = await callClaude(
      'Translate these drink/product names into ' + langName + ' for an Ibiza delivery app.\nKeep brand names (Coca-Cola, Red Bull, Aperol, Moet, Marlboro, etc). Keep sizes (330ml, 70cl).\nReturn ONLY JSON: { "product-id": "translated name" }. No markdown.\n\n' + list,
      6000
    )
    const parsed = parseJSON(raw) || {}
    productCache[lang] = parsed
    return parsed
  } catch { return {} }
}

async function translateCategoryLabels(lang) {
  if (categoryCache[lang]) return categoryCache[lang]
  try {
    const { CATEGORIES } = await import('../lib/products')
    const langName = LANG_NAMES[lang]
    if (!langName) return {}
    const list = CATEGORIES.map(c => c.key + '|' + c.label).join('\n')
    const raw = await callClaude(
      'Translate these product category names into ' + langName + '.\nReturn ONLY JSON: { "key": "translated label" }. No markdown.\n\n' + list,
      500
    )
    const parsed = parseJSON(raw) || {}
    categoryCache[lang] = parsed
    return parsed
  } catch { return {} }
}

export function LangProvider({ children }) {
  const [lang, setLangState] = useState('en')
  const [t, setT] = useState(T.en)
  const [translating, setTranslating] = useState(false)
  const [productNames, setProductNames] = useState({})
  const [catLabels, setCatLabels] = useState({})

  // Auto-detect device language on first mount
  useEffect(() => {
    try {
      const detected = detectDeviceLang()
      if (detected !== 'en') {
        handleSetLang(detected)
      }
    } catch (e) {
      console.error('Language detection failed:', e)
    }
  }, [])

  const handleSetLang = useCallback(async (newLang) => {
    setLangState(newLang)
    if (newLang === 'en') {
      setT(T.en); setProductNames({}); setCatLabels({})
      return
    }
    // Apply static fallback immediately
    setT(T[newLang] || T.en)
    setTranslating(true)
    try {
      const [uiResult, prodResult, catResult] = await Promise.all([
        translateUI(newLang).catch(() => T[newLang] || T.en),
        translateProductNames(newLang).catch(() => ({})),
        translateCategoryLabels(newLang).catch(() => ({})),
      ])
      setT(uiResult)
      setProductNames(prodResult)
      setCatLabels(catResult)
    } catch (e) {
      console.error('Translation failed:', e)
    } finally {
      setTranslating(false)
    }
  }, [])

  const setLang = handleSetLang

  const getProductName = useCallback((id, fallback) => {
    return productNames[id] || fallback || ''
  }, [productNames])

  const getCategoryLabel = useCallback((key, fallback) => {
    return catLabels[key] || fallback || ''
  }, [catLabels])

  return (
    <LangContext.Provider value={{ lang, setLang, t, translating, getProductName, getCategoryLabel }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}
