import { createContext, useContext } from 'react'
import { T } from './translations'

export const TranslationContext = createContext(T.en)

export function useT_ctx() {
  return useContext(TranslationContext)
}
