import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { getOrderNumberFromURL } from './components/customer/CustomerFeatures_launch'
import { LangProvider } from './i18n/LangContext'
import './index.css'
import App from './App'

// ── Public tracking route — /track/ORDER123 or #/track/ORDER123 ──
const trackingOrderNumber = getOrderNumberFromURL()

// Deep link: ?order=ID opens direct to tracking
const urlParams  = new URLSearchParams(window.location.search)
const deepLinkOrder = urlParams.get('order')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LangProvider>
      <App/>
    </LangProvider>
  </StrictMode>
)
