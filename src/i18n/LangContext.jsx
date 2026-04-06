import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { T, LANGUAGES } from './translations'
import { PRODUCTS, CATEGORIES } from '../lib/products'

export const LangContext = createContext({
  lang: 'en', t: T.en, setLang: () => {},
  getProductName: (id) => '', getCategoryLabel: (key) => '', translating: false,
})

// Per-session caches
const uiCache = { en: T.en }
const productNameCache = {}  // lang -> { id: translatedName }
const categoryCache = {}     // lang -> { key: translatedLabel }

// Detect device language and map to supported language
function detectDeviceLang() {
  const supported = LANGUAGES.map(l => l.code)
  const nav = navigator.language || navigator.userLanguage || 'en'
  // Try exact match first (e.g. 'es')
  const exact = nav.slice(0, 2).toLowerCase()
  if (supported.includes(exact)) return exact
  return 'en'
}

async function callClaude(prompt, maxTokens = 4000) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!apiKey) return null
  try {
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
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }]
      })
    })
    if (!resp.ok) return null
    const data = await resp.json()
    return data.content?.[0]?.text?.trim() || null
  } catch { return null }
}

const LANG_NAMES = {
  es:'Spanish', fr:'French', it:'Italian', de:'German', ru:'Russian',
  zh:'Chinese (Simplified)', ar:'Arabic', nl:'Dutch', pt:'Portuguese',
  sv:'Swedish', pl:'Polish', tr:'Turkish'
}

// Translate all UI strings at once
async function translateUI(lang) {
  if (uiCache[lang]) return uiCache[lang]
  if (T[lang]) uiCache[lang] = T[lang]  // static fallback immediately

  const langName = LANG_NAMES[lang] || lang
  const UI = {
    // Nav
    home:'Home', search:'Search', basket:'Basket', account:'Account', concierge:'Concierge', categories:'Categories',
    // Home
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
    // Basket & Checkout
    viewCart:'View basket', checkout:'Order now — deliver ASAP', yourBasketEmpty:'Your basket is empty',
    addSomethingDelicious:'Add something delicious', orderSummary:'Order summary',
    subtotal:'Subtotal', delivery:'Delivery', total:'Total', free:'Free',
    discountCode:'Discount code', freeDelivery:'Free delivery on orders over €200',
    scheduleOrder:'Schedule for later', groupOrder:'Group order',
    ageWarning:'18+ ID required at delivery for alcohol & tobacco', payment:'Payment',
    // Account
    signIn:'Sign in', signUp:'Create account', signOut:'Sign out', email:'Email', password:'Password', name:'Full name',
    myOrders:'My orders', myAccount:'My account', myDetails:'My details', myCredit:'My credit',
    noOrdersYet:'No orders yet', loading:'Loading...', loyalty:'Isla Rewards', howCreditWorks:'How credit works',
    // Search vibes
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
    // Categories
    spirits:'Spirits', champagne:'Champagne', wine:'Wine', beerCider:'Beer & Cider',
    softDrinks:'Soft drinks', water:'Water', ice:'Ice', snacks:'Snacks',
    tobacco:'Tobacco', wellness:'Wellness', essentials:'Essentials', beach:'Beach',
    party:'Party', cocktail:'Cocktails', fresh:'Fresh & Garnish',
    // Concierge
    all:'All', boats:'Boats & Yachts', villas:'Villas', clubs:'Club Tickets',
    vip:'VIP Packages', beachClubs:'Beach Clubs', restaurants:'Restaurants', experiences:'Experiences',
    numberOfGuests:'Number of guests', selectDate:'Select date', getDirections:'Get directions',
    designMyNight:'Design My Night', designMyDay:'Design My Day', requestSent:'Request sent!',
    dinnerClubsVip:'Dinner, clubs, VIP', bookNow:'Book now', from:'From',
    perPerson:'per person', highlights:'Highlights', islaInsider:'Isla insider',
    // Arrival
    welcomeWhiteIsle:'Welcome to the White Isle', ibizaArrivalPackage:'Ibiza Arrival Package',
    addAllToBasket:'Add all to basket', viewPackage:'View package',
    // Tracking
    liveTracking:'Live tracking', tapToTrack:'Tap to track', placeAnotherOrder:'Place another order',
    orderPlaced:'Order placed', driverAssigned:'Driver assigned', delivered:'Delivered',
    // Misc
    deliveryAddress:'Enter delivery address', setLocation:'Set your delivery location',
    continueShopping:'Continue shopping', items:'items', item:'item', retry:'Try again',
    noThanks:'No thanks', subTotal:'Subtotal', freeDeliveryOver:'Free delivery over',
  }

  const stringList = Object.entries(UI).map(([k, v]) => k + ': ' + v).join('\n')
  const result = await callClaude(
    'Translate these UI strings for an Ibiza 24/7 delivery app into ' + langName + '.\n' +
    'Rules: Keep brand names as-is (Isla Drop, Pacha, Ibiza, Aperol, Prosecco, etc). Keep emojis. Keep tone casual and friendly. Keep €200 as-is.\n' +
    'Return ONLY a valid JSON object with the same keys. No markdown, no explanation.\n\n' + stringList,
    4000
  )

  if (result) {
    try {
      const translated = JSON.parse(result.replace(/```json|```/g, '').trim())
      const merged = { ...(T[lang] || T.en), ...translated }
      uiCache[lang] = merged
      return merged
    } catch { return T[lang] || T.en }
  }
  return T[lang] || T.en
}

// Translate ALL product names in one batch call
async function translateProducts(lang) {
  if (productNameCache[lang]) return productNameCache[lang]

  const langName = LANG_NAMES[lang] || lang
  // Build compact id|name list
  const list = PRODUCTS.map(p => p.id + '|' + p.name).join('\n')

  const result = await callClaude(
    'Translate these product names for an Ibiza delivery service into ' + langName + '.\n' +
    'Rules: Keep brand names (Coca-Cola, Red Bull, Aperol, Moët, Dom Pérignon, Marlboro, etc). Keep sizes (330ml, 70cl, etc). Keep numbers.\n' +
    'Return ONLY a JSON object: { "product-id": "translated name" }. No markdown, no explanation.\n\n' + list,
    6000
  )

  if (result) {
    try {
      const translated = JSON.parse(result.replace(/```json|```/g, '').trim())
      productNameCache[lang] = translated
      return translated
    } catch {}
  }
  return {}
}

// Translate ALL category labels in one call
async function translateCategories(lang) {
  if (categoryCache[lang]) return categoryCache[lang]

  const langName = LANG_NAMES[lang] || lang
  const cats = CATEGORIES.map(c => c.key + '|' + c.label).join('\n')

  const result = await callClaude(
    'Translate these product category names for an Ibiza delivery app into ' + langName + '.\n' +
    'Return ONLY a JSON object: { "key": "translated label" }. No markdown.\n\n' + cats,
    500
  )

  if (result) {
    try {
      const translated = JSON.parse(result.replace(/```json|```/g, '').trim())
      categoryCache[lang] = translated
      return translated
    } catch {}
  }
  return {}
}

export function LangProvider({ children }) {
  // Detect device language on first load
  const detectedLang = detectDeviceLang()
  const [lang, setLangState] = useState(detectedLang)
  const [t, setT] = useState(T[detectedLang] || T.en)
  const [translating, setTranslating] = useState(false)
  const [productNames, setProductNames] = useState({})
  const [categoryLabels, setCategoryLabels] = useState({})

  // Load translations for detected language on mount
  useEffect(() => {
    if (detectedLang !== 'en') {
      loadLanguage(detectedLang)
    }
  }, [])

  const loadLanguage = useCallback(async (newLang) => {
    setTranslating(true)
    // Apply static translations immediately as placeholder
    if (T[newLang]) setT(T[newLang])

    try {
      // Run all three translation calls in parallel
      const [uiResult, productResult, categoryResult] = await Promise.all([
        translateUI(newLang),
        translateProducts(newLang),
        translateCategories(newLang),
      ])
      setT(uiResult)
      setProductNames(productResult)
      setCategoryLabels(categoryResult)
    } finally {
      setTranslating(false)
    }
  }, [])

  const setLang = useCallback(async (newLang) => {
    setLangState(newLang)
    if (newLang === 'en') {
      setT(T.en)
      setProductNames({})
      setCategoryLabels({})
      return
    }
    await loadLanguage(newLang)
  }, [loadLanguage])

  // Helper: get translated product name (falls back to original)
  const getProductName = useCallback((productId, originalName) => {
    return productNames[productId] || originalName
  }, [productNames])

  // Helper: get translated category label
  const getCategoryLabel = useCallback((categoryKey, originalLabel) => {
    return categoryLabels[categoryKey] || originalLabel
  }, [categoryLabels])

  return (
    <LangContext.Provider value={{ lang, setLang, t, translating, getProductName, getCategoryLabel }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}
