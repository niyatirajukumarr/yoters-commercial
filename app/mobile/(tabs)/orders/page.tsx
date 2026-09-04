'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useUserInfo } from '@/lib/hooks/useUserInfo'
import { Order } from '@/lib/types'
import { stagger, staggerItem, hoverLift, hoverScale } from '@/lib/motion'
import { withTimeout } from '@/lib/utils/withTimeout'

interface CafeteriaInfo {
  id: string
  name: string
  image_emoji: string
}

interface CafeteriaOrders {
  cafeteria: CafeteriaInfo
  orders: Order[]
}

export default function MobileOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [cafeterias, setCafeterias] = useState<Record<string, CafeteriaInfo>>({})
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'active' | 'past'>('active')
  const [deleting, setDeleting] = useState<string | null>(null)
  const { user } = useUserInfo()
  const router = useRouter()

  // Fetch cafeterias for mapping
  useEffect(() => {
    const fetch = async () => {
      try {
        const cached = sessionStorage.getItem('cafeterias-map')
        if (cached) setCafeterias(JSON.parse(cached))
      } catch {}
      try {
        const { data } = await withTimeout(
          supabase.from('cafeterias').select('id, name, image_emoji'),
          8000,
          'Cafeterias fetch timed out'
        ) as any
        if (data) {
          const map = Object.fromEntries(data.map((c: any) => [c.id, c]))
          setCafeterias(map)
          sessionStorage.setItem('cafeterias-map', JSON.stringify(map))
        }
      } catch {
      }
    }
    fetch()
  }, [])

  // Fetch user orders
  useEffect(() => {
    const fetch = async () => {
      if (!user?.phone) {
        setLoading(false)
        return
      }

      // Show cached orders instantly
      try {
        const cached = sessionStorage.getItem(`orders-${user.phone}`)
        if (cached) { setOrders(JSON.parse(cached)); setLoading(false) }
      } catch {}

      try {
        const { data } = await withTimeout(
          supabase
            .from('orders')
            .select('*')
            .eq('student_phone', user.phone)
            .order('created_at', { ascending: false }),
          8000,
          'Orders fetch timed out'
        ) as any
        if (data) {
          setOrders(data as Order[])
          sessionStorage.setItem(`orders-${user.phone}`, JSON.stringify(data))
        }
      } catch {
      } finally {
        setLoading(false)
      }
    }

    fetch()

    // Real-time subscription
    const ch = supabase.channel('mobile-orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => fetch()
      )
      .subscribe()

    return () => { supabase.removeChannel(ch) }
  }, [user?.phone])

  const activeOrders = orders.filter(o => !['collected', 'cancelled'].includes(o.status))
  const pastOrders = orders.filter(o => ['collected', 'cancelled'].includes(o.status))

  const displayOrders = tab === 'active' ? activeOrders : pastOrders

  // Group orders by cafeteria
  const groupedOrders: CafeteriaOrders[] = displayOrders.reduce((acc, order) => {
    const cafe = cafeterias[order.cafeteria_id]
    if (!cafe) return acc

    const existing = acc.find(g => g.cafeteria.id === order.cafeteria_id)
    if (existing) {
      existing.orders.push(order)
    } else {
      acc.push({ cafeteria: cafe, orders: [order] })
    }
    return acc
  }, [] as CafeteriaOrders[])

  const statusConfig: Record<string, { label: string; color: string; bg: string; borderColor: string }> = {
    pending:   { label: '⏳ Awaiting Payment',   color: '#d4821a', bg: '#fff8ec', borderColor: '#d4821a' },
    paid:      { label: '⏳ Awaiting Acceptance', color: '#2563eb', bg: '#eff6ff', borderColor: '#2563eb' },
    approved:  { label: '✓ Order Accepted',       color: '#2563eb', bg: '#eff6ff', borderColor: '#2563eb' },
    preparing: { label: '👨‍🍳 Being Prepared',     color: '#7c5cfc', bg: '#f3f0ff', borderColor: '#7c5cfc' },
    ready:     { label: '🔔 Ready for Pickup!',   color: '#2e9e6b', bg: '#edfaf3', borderColor: '#2e9e6b' },
    collected: { label: '✅ Collected',            color: '#8a90a8', bg: '#f5f5f5', borderColor: '#8a90a8' },
    cancelled: { label: '❌ Cancelled',            color: '#E8334A', bg: '#fff0f2', borderColor: '#E8334A' },
  }

  if (!user?.phone) {
    return (
      <div style={{ padding: 'var(--mobile-spacing)' }}>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 24, fontWeight: 700, marginBottom: 20 }}>
          Orders
        </div>
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>
          <div style={{ marginBottom: 12 }}>Please enter your phone number in Profile first</div>
          <a href="/mobile/profile" style={{ color: 'var(--accent)', textDecoration: 'underline', fontSize: 14 }}>
            Go to Profile
          </a>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: 'var(--mobile-spacing)' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 24, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>
          My Orders
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['active', 'past'] as const).map(t => (
          <motion.button
            key={t}
            {...hoverScale}
            onClick={() => setTab(t)}
            className={t === tab ? 'mobile-btn-primary' : 'mobile-btn-secondary'}
            style={{
              flex: 1,
              padding: '10px 0',
              fontSize: 14,
              fontWeight: 600,
              borderRadius: 'var(--mobile-radius)',
              border: 'none',
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {t === 'active' ? `Active (${activeOrders.length})` : `Past (${pastOrders.length})`}
          </motion.button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>
          Loading orders...
        </div>
      ) : displayOrders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>
          No {tab} orders yet
        </div>
      ) : (
        <motion.div initial="hidden" animate="visible" variants={stagger} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {groupedOrders.map((group) => (
            <div key={group.cafeteria.id}>
              {/* Cafeteria heading */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 24 }}>{group.cafeteria.image_emoji}</span>
                <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                  Your Orders from {group.cafeteria.name}
                </h2>
              </div>

              {/* Orders in this cafeteria */}
              <motion.div variants={stagger} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {group.orders.map((order) => {
                  const cfg = statusConfig[order.status] ?? statusConfig.pending
                  const isPast = ['collected', 'cancelled'].includes(order.status)

                  return (
                    <motion.div
                      key={order.id}
                      variants={staggerItem}
                      {...hoverLift}
                      onClick={() => router.push(`/mobile/track/${order.id}`)}
                      style={{
                        background: 'white',
                        border: '1px solid rgba(26,31,46,0.08)',
                        borderLeft: `4px solid ${cfg.borderColor}`,
                        borderRadius: 12,
                        padding: 14,
                        cursor: 'pointer',
                      }}
                    >
                      {/* Top row: timestamp + order number */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <div style={{ fontSize: 12, color: '#8a90a8', fontWeight: 500 }}>
                          🕐 {new Date(order.created_at).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                        </div>
                        {order.queue_position && (
                          <div style={{
                            fontFamily: 'var(--font-head)',
                            fontSize: 18,
                            fontWeight: 900,
                            color: cfg.color,
                            background: cfg.bg,
                            border: `1.5px solid ${cfg.borderColor}`,
                            borderRadius: 6,
                            padding: '2px 10px',
                            minWidth: 45,
                            textAlign: 'center'
                          }}>
                            #{order.queue_position}
                          </div>
                        )}
                      </div>

                      {/* Status badge */}
                      <div style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: cfg.color,
                        background: cfg.bg,
                        display: 'inline-block',
                        padding: '4px 10px',
                        borderRadius: 16,
                        marginBottom: 10
                      }}>
                        {cfg.label}
                      </div>

                      {/* Items list */}
                      <div style={{ marginBottom: 10 }}>
                        {(order.items as { name: string; quantity: number }[]).map((item, idx) => (
                          <div key={idx} style={{ fontSize: 13, color: '#444', marginBottom: 4 }}>
                            {item.quantity}× {item.name}
                          </div>
                        ))}
                      </div>

                      {/* Price row */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingTop: 10,
                        borderTop: '1px solid rgba(26,31,46,0.08)'
                      }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1f2e' }}>₹{order.total_amount}</span>
                        {!isPast && order.payment_status === 'unpaid' ? (
                          <motion.button
                            {...hoverScale}
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/payment?orderId=${order.id}&amount=${order.total_amount}&name=${encodeURIComponent(order.student_name || 'Customer')}`)
                            }}
                            style={{
                              fontSize: 12,
                              color: 'white',
                              background: '#E8334A',
                              border: 'none',
                              borderRadius: 6,
                              cursor: 'pointer',
                              fontWeight: 600,
                              padding: '6px 12px'
                            }}
                          >
                            💳 Retry Payment
                          </motion.button>
                        ) : !isPast ? (
                          <motion.button
                            whileHover={{ x: 2 }}
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/mobile/track/${order.id}`)
                            }}
                            style={{
                              fontSize: 12,
                              color: '#E8334A',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              fontWeight: 600,
                              padding: 0
                            }}
                          >
                            Track Order →
                          </motion.button>
                        ) : null}
                        {isPast && (
                          <motion.button
                            {...(deleting !== order.id ? hoverScale : {})}
                            disabled={deleting === order.id}
                            onClick={async (e) => {
                              e.stopPropagation()
                              if (!confirm('Delete this order?')) return
                              setDeleting(order.id)
                              const res = await fetch('/api/delete-order', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ orderId: order.id, studentPhone: user?.phone })
                              })
                              if (res.ok) setOrders(prev => prev.filter(o => o.id !== order.id))
                              setDeleting(null)
                            }}
                            style={{
                              fontSize: 12,
                              color: '#E8334A',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              fontWeight: 600,
                              padding: 0
                            }}
                          >
                            {deleting === order.id ? 'Deleting...' : '🗑️ Delete'}
                          </motion.button>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </motion.div>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
