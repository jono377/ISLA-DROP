// Runs synchronously before React mounts - resolves the correct language
const SUPPORTED = ['en','es','fr','it','de','ru','zh','ar','nl','pt','sv','pl','tr']
const STORAGE_KEY = 'isla_lang'
const SESSION_KEY = 'isla_session'

export function getInitialLang() {
  // 1. Check localStorage (user's explicit choice or previous session)
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved && SUPPORTED.includes(saved)) return saved

  // 2. Detect browser language
  try {
    const nav = (navigator.language || navigator.userLanguage || 'en').slice(0, 2).toLowerCase()
    if (SUPPORTED.includes(nav)) {
      localStorage.setItem(STORAGE_KEY, nav)
      return nav
    }
  } catch {}

  // 3. Default to English
  return 'en'
}

export function saveLang(lang) {
  localStorage.setItem(STORAGE_KEY, lang)
}

export function saveSession(state) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(state))
  } catch {}
}

export function restoreSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch { return null }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}
