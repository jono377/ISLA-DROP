import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder', {
  realtime: { params: { eventsPerSecond: 10 } },
})

// ── Auth helpers ──────────────────────────────────────────────

export async function signUp(email, password, fullName, role = 'customer') {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, role } },
  })
  if (error) throw error

  // Insert profile row
  await supabase.from('profiles').insert({
    id: data.user.id,
    role,
    full_name: fullName,
  })

  // Insert role-specific row
  if (role === 'customer') {
    await supabase.from('customers').insert({ id: data.user.id })
  } else if (role === 'driver') {
    await supabase.from('drivers').insert({ id: data.user.id })
  }

  return data
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  await supabase.auth.signOut()
}

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data
}

// ── Products ──────────────────────────────────────────────────

export async function getProducts(category = null) {
  let query = supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('category')
    .order('name')

  if (category) query = query.eq('category', category)

  const { data, error } = await query
  if (error) throw error
  return data
}

// ── Orders ────────────────────────────────────────────────────

export async function createOrder({ customerId, items, deliveryLat, deliveryLng, deliveryAddress, deliveryNotes, what3words, subtotal, total, paymentIntentId }) {
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      customer_id: customerId,
      delivery_lat: deliveryLat,
      delivery_lng: deliveryLng,
      delivery_address: deliveryAddress,
      delivery_notes: deliveryNotes,
      what3words,
      subtotal,
      total,
      stripe_payment_intent_id: paymentIntentId,
      status: 'pending',
    })
    .select()
    .single()

  if (orderError) throw orderError

  const orderItems = items.map(item => ({
    order_id: order.id,
    product_id: item.productId,
    quantity: item.quantity,
    unit_price: item.price,
  }))

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems)
  if (itemsError) throw itemsError

  return order
}

export async function getOrderWithItems(orderId) {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        products (name, emoji, image_url)
      ),
      drivers (
        *,
        profiles (full_name, avatar_url)
      )
    `)
    .eq('id', orderId)
    .single()

  if (error) throw error
  return data
}

export async function getCustomerOrders(customerId) {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (quantity, unit_price, products (name, emoji))
    `)
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function updateOrderStatus(orderId, status, extra = {}) {
  const { data, error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString(), ...extra })
    .eq('id', orderId)
    .select()
    .single()

  if (error) throw error
  return data
}

// ── Drivers ───────────────────────────────────────────────────

export async function updateDriverLocation(driverId, lat, lng) {
  const point = `POINT(${lng} ${lat})`

  await supabase.from('drivers').update({
    current_location: point,
    last_seen: new Date().toISOString(),
  }).eq('id', driverId)

  await supabase.from('driver_locations').insert({
    driver_id: driverId,
    location: point,
  })
}

export async function setDriverOnlineStatus(driverId, isOnline) {
  const { error } = await supabase
    .from('drivers')
    .update({ is_online: isOnline })
    .eq('id', driverId)
  if (error) throw error
}

export async function getAvailableOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (quantity, products (name, emoji))
    `)
    .in('status', ['confirmed', 'preparing'])
    .is('driver_id', null)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}

export async function acceptOrder(orderId, driverId) {
  const { data, error } = await supabase
    .from('orders')
    .update({
      driver_id: driverId,
      status: 'assigned',
      accepted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .is('driver_id', null) // optimistic lock
    .select()
    .single()

  if (error) throw error
  return data
}

// ── Ops ───────────────────────────────────────────────────────

export async function getOpsStats() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [ordersRes, driversRes, avgRes] = await Promise.all([
    supabase.from('orders')
      .select('status', { count: 'exact' })
      .gte('created_at', today.toISOString())
      .not('status', 'eq', 'cancelled'),

    supabase.from('drivers')
      .select('id, is_online', { count: 'exact' })
      .eq('is_online', true),

    supabase.from('orders')
      .select('estimated_minutes')
      .gte('created_at', today.toISOString())
      .not('estimated_minutes', 'is', null),
  ])

  const activeOrders = ordersRes.data?.filter(o =>
    !['delivered', 'cancelled'].includes(o.status)
  ).length ?? 0

  const onlineDrivers = driversRes.count ?? 0

  const avgEta = avgRes.data?.length
    ? Math.round(avgRes.data.reduce((s, o) => s + o.estimated_minutes, 0) / avgRes.data.length)
    : 0

  return { activeOrders, onlineDrivers, avgEta }
}

// ── Realtime subscriptions ────────────────────────────────────

export function subscribeToOrder(orderId, callback) {
  return supabase
    .channel(`order:${orderId}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'orders',
      filter: `id=eq.${orderId}`,
    }, payload => callback(payload.new))
    .subscribe()
}

export function subscribeToAvailableOrders(callback) {
  return supabase
    .channel('available_orders')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'orders',
    }, () => callback())
    .subscribe()
}

export function subscribeToDriverLocation(driverId, callback) {
  return supabase
    .channel(`driver_loc:${driverId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'driver_locations',
      filter: `driver_id=eq.${driverId}`,
    }, payload => callback(payload.new))
    .subscribe()
}

export function subscribeToAllOrders(callback) {
  return supabase
    .channel('ops_orders')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'orders',
    }, () => callback())
    .subscribe()
}
