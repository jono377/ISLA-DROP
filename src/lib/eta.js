// ── Live ETA Calculator ───────────────────────────────────────
// Calculates realistic delivery time using:
// 1. Driver location → warehouse pickup time
// 2. Warehouse → customer delivery time
// 3. Updates live as driver moves

// Ibiza warehouse/base location (central — kept private from customers)
export const WAREHOUSE = {
  lat: 38.9090,
  lng: 1.4340,
  // Privacy radius in metres — driver shown on customer map only OUTSIDE this radius
  privacyRadiusMetres: 800,
}

// Haversine distance between two lat/lng points (returns km)
export function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 +
            Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
            Math.sin(dLng/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

// Average scooter speed in Ibiza (km/h) accounting for traffic, roads, stops
const AVG_SPEED_KMH = 28

// Convert distance to minutes at average Ibiza speed
function distanceToMins(km) {
  return Math.ceil((km / AVG_SPEED_KMH) * 60)
}

// ── Calculate full ETA for an order ──────────────────────────
// driverLat/Lng: current driver GPS position
// orderStatus: assigned | warehouse_confirmed | en_route | delivered
// deliveryLat/Lng: customer delivery location
export function calculateETA({
  driverLat, driverLng,
  orderStatus,
  deliveryLat, deliveryLng,
}) {
  if (!driverLat || !driverLng || !deliveryLat || !deliveryLng) return null

  const now = new Date()

  if (orderStatus === 'assigned') {
    // Driver needs to go to warehouse first, then to customer
    const driverToWarehouse = distanceKm(driverLat, driverLng, WAREHOUSE.lat, WAREHOUSE.lng)
    const warehouseToCustomer = distanceKm(WAREHOUSE.lat, WAREHOUSE.lng, deliveryLat, deliveryLng)

    const pickupMins = distanceToMins(driverToWarehouse) + 3 // +3 min for pickup
    const deliveryMins = distanceToMins(warehouseToCustomer)
    const totalMins = pickupMins + deliveryMins

    const eta = new Date(now.getTime() + totalMins * 60000)
    return {
      totalMins,
      pickupMins,
      deliveryMins,
      eta,
      phase: 'collecting',
      label: `${totalMins} min`,
      detail: `Collecting order (${pickupMins}m) then ${deliveryMins}m to you`,
    }
  }

  if (orderStatus === 'warehouse_confirmed') {
    // Driver has items, heading to customer
    const driverToCustomer = distanceKm(driverLat, driverLng, deliveryLat, deliveryLng)
    const totalMins = distanceToMins(driverToCustomer)
    const eta = new Date(now.getTime() + totalMins * 60000)
    return {
      totalMins,
      eta,
      phase: 'heading_to_you',
      label: `${totalMins} min`,
      detail: `Driver is on the way`,
    }
  }

  if (orderStatus === 'en_route') {
    // Driver confirmed en route — calculate live from current position
    const driverToCustomer = distanceKm(driverLat, driverLng, deliveryLat, deliveryLng)
    const totalMins = Math.max(1, distanceToMins(driverToCustomer))
    const eta = new Date(now.getTime() + totalMins * 60000)
    return {
      totalMins,
      eta,
      phase: 'arriving',
      label: totalMins <= 2 ? 'Arriving now' : `${totalMins} min`,
      detail: `${(driverToCustomer * 1000).toFixed(0)}m away`,
    }
  }

  return null
}

// ── Should we show driver on map? ─────────────────────────────
// Customer only sees driver AFTER they have picked up the order
// AND only when driver is outside the warehouse privacy radius
export function shouldShowDriverOnMap(orderStatus, driverLat, driverLng) {
  // Only show after warehouse pickup confirmed
  if (!['warehouse_confirmed', 'en_route', 'delivered'].includes(orderStatus)) {
    return false
  }

  // Check driver is outside warehouse privacy radius
  if (driverLat && driverLng) {
    const distFromWarehouse = distanceKm(driverLat, driverLng, WAREHOUSE.lat, WAREHOUSE.lng)
    const privacyKm = WAREHOUSE.privacyRadiusMetres / 1000
    if (distFromWarehouse < privacyKm) {
      return false // Too close to warehouse — hide driver position
    }
  }

  return true
}

// ── Format ETA time string ────────────────────────────────────
export function formatETA(eta) {
  if (!eta) return null
  return eta.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

// ── Check if order is late (30+ mins past original ETA) ──────
export function isLate(originalEtaTime, currentMins) {
  if (!originalEtaTime) return false
  const now = new Date()
  const minsLate = (now - originalEtaTime) / 60000
  return minsLate > 30
}
