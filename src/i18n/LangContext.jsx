import { createContext, useContext, useState, useCallback } from 'react'
import { T, useT } from './translations'

export const LangContext = createContext({ lang: 'en', t: T.en, setLang: () => {} })

export function LangProvider({ children }) {
  const [lang, setLang] = useState('en')
  const t = useT(lang)
  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}
