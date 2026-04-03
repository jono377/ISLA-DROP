import { useState, useEffect, useRef, useCallback } from 'react'
import {
  getOpsStats, subscribeToAllOrders, subscribeToDriverLocation
} from '../../lib/supabase'
import { supabase } from '../../lib/supabase'
import { useOpsStore } from '../../lib/store'
import { formatDistanceToNow } from 'date-fns'


const ORDER_STATUS_LABELS = {
  pending: 'Pending', age_check: 'ID Check', confirmed: 'Confirmed',
  preparing: 'Preparing', assigned: 'Assigned', picked_up: 'Picked up',
  en_route: 'En route', delivered: 'Delivered', cancelled: 'Cancelled',
}

const STATUS_COLORS = {
  pending: '#E0D8CC', age_check: '#FAC775', confirmed: '#B5D4F4',
  preparing: '#B5D4F4', assigned: '#C0DD97', picked_up: '#9FE1CB',
  en_route: '#5DCAA5', delivered: '#1D9E75', cancelled: '#F09595',
}

export default function OpsApp() {
  const [tab, setTab] = useState('overview')
  const { stats, liveOrders, drivers, alerts, setStats, setLiveOrders, setDrivers, addAlert } = useOpsStore()
  const [clock, setClock] = useState(new Date())

  const loadData = useCallback(async () => {
    const [statsData, ordersRes, driversRes] = await Promise.all([
      getOpsStats(),
      supabase.from('orders').select(`*, order_items(quantity, products(name,emoji)), drivers(*, profiles(full_name))`).not('status', 'eq', 'cancelled').order('created_at', { ascending: false }).limit(50),
      supabase.from('drivers').select('*, profiles(full_name, avatar_url)').order('is_online', { ascending: false }),
    ])
    setStats(statsData)
    if (ordersRes.data) setLiveOrders(ordersRes.data)
    if (driversRes.data) setDrivers(driversRes.data)
  }, [setStats, setLiveOrders, setDrivers])

  useEffect(() => {
    loadData()
    const sub = subscribeToAllOrders(() => { loadData(); addAlert({ text: 'Order updated', time: new Date(), type: 'info' }) })
    const tick = setInterval(() => setClock(new Date()), 1000)
    return () => { sub.unsubscribe(); clearInterval(tick) }
  }, [loadData])

  const activeOrders = liveOrders.filter(o => !['delivered', 'cancelled'].includes(o.status))
  const recentDelivered = liveOrders.filter(o => o.status === 'delivered').slice(0, 5)

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: '#1E1810', padding: '20px 20px 16px', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 22 }}>Ops Dashboard</div>
          <div style={{ fontSize: 11, opacity: 0.45, textAlign: 'right' }}>
            <div>{clock.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
            <div>Ibiza · Live</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
          <KPI val={stats.activeOrders} label="Active orders" delta="Live" />
          <KPI val={stats.onlineDrivers} label="Drivers online" delta={`${drivers.filter(d => d.is_online && !d.current_order_id).length} idle`} />
          <KPI val={stats.avgEta ? `${stats.avgEta}m` : '—'} label="Avg ETA" delta="Today" />
        </div>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', background: '#F5F0E8', borderBottom: '0.5px solid rgba(42,35,24,0.12)' }}>
        {['overview', 'orders', 'fleet', 'map', 'images'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1, padding: '12px 4px', border: 'none', background: 'none', cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: tab === t ? 500 : 400,
              color: tab === t ? '#C4683A' : '#7A6E60',
              borderBottom: tab === t ? '2px solid #C4683A' : '2px solid transparent',
              textTransform: 'capitalize',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        {tab === 'overview' && <OverviewTab activeOrders={activeOrders} drivers={drivers} alerts={alerts} />}
        {tab === 'orders' && <OrdersTab orders={liveOrders} />}
        {tab === 'fleet' && <FleetTab drivers={drivers} />}
        {tab === 'map' && <MapTab drivers={drivers} orders={activeOrders} />}
        {tab === 'images' && <div style={{ margin:'0 -16px' }}><ImageManager /></div>}
      </div>
    </div>
  )
}

function KPI({ val, label, delta }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 10, padding: '10px 12px' }}>
      <div style={{ fontSize: 22, fontWeight: 500 }}>{val}</div>
      <div style={{ fontSize: 10, opacity: 0.5, marginTop: 1 }}>{label}</div>
      {delta && <div style={{ fontSize: 10, color: '#7EE8A2', marginTop: 2 }}>{delta}</div>}
    </div>
  )
}

function OverviewTab({ activeOrders, drivers, alerts }) {
  const onlineDrivers = drivers.filter(d => d.is_online)

  return (
    <>
      <Section title="Live orders" count={activeOrders.length}>
        {activeOrders.slice(0, 6).map(order => (
          <LiveOrderRow key={order.id} order={order} />
        ))}
        {activeOrders.length === 0 && <EmptyState icon="📋" text="No active orders" />}
      </Section>

      <Section title="Online drivers" count={onlineDrivers.length}>
        {onlineDrivers.slice(0, 4).map(driver => (
          <DriverRow key={driver.id} driver={driver} />
        ))}
        {onlineDrivers.length === 0 && <EmptyState icon="🛵" text="No drivers online" />}
      </Section>

      <Section title="Alerts">
        {alerts.slice(0, 5).map((a, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, paddingBottom: 10, marginBottom: 10, borderBottom: '0.5px solid rgba(42,35,24,0.08)' }}>
            <span style={{ fontSize: 16 }}>{a.type === 'warn' ? '⚠️' : 'ℹ️'}</span>
            <div>
              <div style={{ fontSize: 13, color: '#2A2318' }}>{a.text}</div>
              <div style={{ fontSize: 11, color: '#7A6E60', marginTop: 2 }}>{a.time ? formatDistanceToNow(a.time, { addSuffix: true }) : 'Just now'}</div>
            </div>
          </div>
        ))}
        {alerts.length === 0 && <EmptyState icon="✅" text="No alerts" />}
      </Section>
    </>
  )
}

function OrdersTab({ orders }) {
  const [filter, setFilter] = useState('active')
  const filtered = filter === 'active'
    ? orders.filter(o => !['delivered', 'cancelled'].includes(o.status))
    : filter === 'delivered'
    ? orders.filter(o => o.status === 'delivered')
    : orders

  return (
    <>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['active', 'delivered', 'all'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: filter === f ? 500 : 400, background: filter === f ? '#2A2318' : '#F5F0E8', color: filter === f ? 'white' : '#7A6E60', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', textTransform: 'capitalize' }}>{f}</button>
        ))}
      </div>
      {filtered.map(order => <FullOrderCard key={order.id} order={order} />)}
      {filtered.length === 0 && <EmptyState icon="📋" text="No orders in this category" />}
    </>
  )
}

function FleetTab({ drivers }) {
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Total drivers', val: drivers.length },
          { label: 'Online now', val: drivers.filter(d => d.is_online).length },
          { label: 'Delivering', val: drivers.filter(d => d.is_online).length },
          { label: 'Avg rating', val: drivers.length ? (drivers.reduce((s, d) => s + (d.rating ?? 5), 0) / drivers.length).toFixed(2) : '—' },
        ].map(({ label, val }) => (
          <div key={label} style={{ background: '#F5F0E8', borderRadius: 12, padding: '12px 14px' }}>
            <div style={{ fontSize: 22, fontWeight: 500 }}>{val}</div>
            <div style={{ fontSize: 11, color: '#7A6E60', marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {drivers.map(driver => (
        <div key={driver.id} style={{ background: '#FEFCF9', border: '0.5px solid rgba(42,35,24,0.12)', borderRadius: 14, padding: 14, marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#EAF3DE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 500, color: '#3B6D11', flexShrink: 0 }}>
              {(driver.profiles?.full_name ?? 'D').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{driver.profiles?.full_name ?? 'Driver'}</div>
              <div style={{ fontSize: 12, color: '#7A6E60', marginTop: 1 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: driver.is_online ? '#5A6B3A' : '#CCC', display: 'inline-block', marginRight: 4 }} />
                {driver.is_online ? 'Online' : 'Offline'}
                {driver.vehicle_plate ? ` · ${driver.vehicle_plate}` : ''}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>⭐ {driver.rating?.toFixed(2) ?? '5.00'}</div>
              <div style={{ fontSize: 11, color: '#7A6E60' }}>{driver.total_deliveries ?? 0} runs</div>
            </div>
          </div>
        </div>
      ))}
    </>
  )
}



function LiveOrderRow({ order }) {
  const statusColor = STATUS_COLORS[order.status] ?? '#E0D8CC'
  const itemsText = order.order_items?.map(i => `${i.quantity}× ${i.products?.emoji ?? ''}`).join(' ') ?? ''

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 12, marginBottom: 12, borderBottom: '0.5px solid rgba(42,35,24,0.08)' }}>
      <div style={{ fontSize: 11, fontWeight: 500, color: '#7A6E60', width: 52, flexShrink: 0 }}>#{order.order_number?.slice(-4)}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.delivery_address ?? 'Unknown'}</div>
        <div style={{ fontSize: 11, color: '#7A6E60' }}>{itemsText} · €{order.total?.toFixed(2)}</div>
      </div>
      <div style={{ background: statusColor, color: '#2A2318', fontSize: 10, padding: '3px 8px', borderRadius: 10, fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0 }}>
        {ORDER_STATUS_LABELS[order.status]}
      </div>
    </div>
  )
}

function FullOrderCard({ order }) {
  const statusColor = STATUS_COLORS[order.status] ?? '#E0D8CC'
  const itemsText = order.order_items?.map(i => `${i.quantity}× ${i.products?.emoji ?? ''} ${i.products?.name ?? ''}`).join(', ') ?? ''
  const driverName = order.drivers?.profiles?.full_name

  return (
    <div style={{ background: '#FEFCF9', border: '0.5px solid rgba(42,35,24,0.12)', borderRadius: 14, padding: 14, marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: '#7A6E60' }}>#{order.order_number}</span>
        <span style={{ background: statusColor, color: '#2A2318', fontSize: 10, padding: '3px 8px', borderRadius: 10, fontWeight: 500 }}>
          {ORDER_STATUS_LABELS[order.status]}
        </span>
      </div>
      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 3 }}>{order.delivery_address}</div>
      <div style={{ fontSize: 12, color: '#7A6E60', marginBottom: 6 }}>{itemsText}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
        <span style={{ color: '#7A6E60' }}>{driverName ? `🛵 ${driverName}` : '🕐 Unassigned'}</span>
        <span style={{ fontWeight: 500 }}>€{order.total?.toFixed(2)}</span>
      </div>
      <div style={{ fontSize: 11, color: '#7A6E60', marginTop: 4 }}>
        {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
      </div>
    </div>
  )
}

function DriverRow({ driver }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 12, marginBottom: 12, borderBottom: '0.5px solid rgba(42,35,24,0.08)' }}>
      <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#EAF3DE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 500, color: '#3B6D11', flexShrink: 0 }}>
        {(driver.profiles?.full_name ?? 'D').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{driver.profiles?.full_name ?? 'Driver'}</div>
        <div style={{ fontSize: 11, color: '#7A6E60' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#5A6B3A', display: 'inline-block', marginRight: 4 }} />
          Online · {driver.total_deliveries ?? 0} total runs
        </div>
      </div>
      <div style={{ fontSize: 12, fontWeight: 500 }}>⭐ {driver.rating?.toFixed(1) ?? '5.0'}</div>
    </div>
  )
}

function Section({ title, count, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 11, fontWeight: 500, color: '#7A6E60', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
        <span>{title}</span>
        {count !== undefined && <span style={{ background: '#F5F0E8', padding: '1px 7px', borderRadius: 10, color: '#2A2318' }}>{count}</span>}
      </div>
      {children}
    </div>
  )
}

function EmptyState({ icon, text }) {
  return (
    <div style={{ textAlign: 'center', padding: '24px', color: '#7A6E60', fontSize: 13 }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
      {text}
    </div>
  )
}
