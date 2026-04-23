// TranslationContext.jsx
// Provides useT_ctx() and useAppT() hooks for all components
// Both read from LangContext so everything stays in sync
import { useContext } from 'react'
import { LangContext } from './LangContext'

// Used by PartyBuilder, ArrivalPackage, Concierge etc
export function useT_ctx() {
  const { t } = useContext(LangContext)
  return t
}

// Alias — preferred name going forward
export function useAppT() {
  const { t } = useContext(LangContext)
  return t
}
