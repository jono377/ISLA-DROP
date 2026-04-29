import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { LangProvider } from './i18n/LangContext'
import './index.css'
import App from './App'


// Deep link: ?order=ID opens direct to tracking
//const urlParams  = new URLSearchParams(window.location.search)
//const deepLinkOrder = urlParams.get('order')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LangProvider>
      <App/>
    </LangProvider>
  </StrictMode>
)
