import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { getOrderNumberFromURL } from './components/customer/CustomerFeatures_launch'
import { PublicTrackingPage } from './components/customer/CustomerFeatures_v2'
import CustomerApp from './components/customer/CustomerApp'
import './index.css'

// ── Public tracking route — /track/ORDER123 or #/track/ORDER123 ──
// No auth required — shows live order status to anyone with the link
const trackingOrderNumber = getOrderNumberFromURL()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {trackingOrderNumber
      ? <PublicTrackingPage orderNumber={trackingOrderNumber} />
      : <CustomerApp />
    }
  </StrictMode>
)
