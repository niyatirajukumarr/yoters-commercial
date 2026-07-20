'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useUserInfo } from '@/lib/hooks/useUserInfo'
import { Order } from '@/lib/types'

interface CafeteriaInfo {
  id: string
  name: string
  image_emoji: string
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
      const { data } = await supabase.from('cafeterias').select('id, name, image_emoji')
      if (data) {
        const map = Object.fromEntries(data.map(c => [c.id, c]))
        setCafeterias(map)
        sessionStorage.setItem('cafeterias-map', JSON.stringify(map))
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

      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('student_phone', user.phone)
        .order('created_at', { ascending: false })

      if (data) {
        setOrders(data as Order[])
        sessionStorage.setItem(`orders-${user.phone}`, JSON.stringify(data))
      }
      setLoading(false)
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

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    pending:   { label: '⏳ Awaiting Payment',   color: '#d4821a', bg: '#fff8ec' },
    paid:      { label: '⏳ Awaiting Acceptance', color: '#2563eb', bg: '#eff6ff' },
    approved:  { label: '✓ Order Accepted',       color: '#2563eb', bg: '#eff6ff' },
    preparing: { label: '👨‍🍳 Being Prepared',     color: '#7c5cfc', bg: '#f3f0ff' },
    ready:     { label: '🔔 Ready for Pickup!',   color: '#2e9e6b', bg: '#edfaf3' },
    collected: { label: '✅ Collected',            color: '#8a90a8', bg: '#f5f5f5' },
    cancelled: { label: '❌ Cancelled',            color: '#E8334A', bg: '#fff0f2' },
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
          <button
            key={t}
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
          </button>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {displayOrders.map((order) => {
            const cafe = cafeterias[order.cafeteria_id]
            const cfg = statusConfig[order.status] ?? statusConfig.pending
            const isPast = ['collected', 'cancelled'].includes(order.status)

            return (
              <div
                key={order.id}
                onClick={() => router.push(`/mobile/track/${order.id}`)}
                style={{ background: 'white', border: '1px solid rgba(26,31,46,0.08)', borderRadius: 16, padding: 16, cursor: 'pointer', borderLeft: `4px solid ${cfg.color}`, transition: 'transform 0.15s' }}
              >
                {/* Top row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ fontSize: 28 }}>{cafe?.image_emoji || '🍱'}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{cafe?.name || 'Restaurant'}</div>
                      <div style={{ fontSize: 11, color: '#8a90a8' }}>
                        🕐 {new Date(order.created_at).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                      </div>
                    </div>
                  </div>
                  {order.queue_position && (
                    <div style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 900, color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}`, borderRadius: 8, padding: '2px 10px' }}>
                      #{order.queue_position}
                    </div>
                  )}
                </div>

                {/* Status */}
                <div style={{ fontSize: 12, fontWeight: 700, color: cfg.color, background: cfg.bg, display: 'inline-block', padding: '3px 10px', borderRadius: 20, marginBottom: 10 }}>
                  {cfg.label}
                </div>

                {/* Items + total */}
                <div style={{ fontSize: 13, color: '#444', marginBottom: 8 }}>
                  {(order.items as { name: string; quantity: number }[]).map(i => `${i.quantity}× ${i.name}`).join(', ')}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#1a1f2e' }}>₹{order.total_amount}</span>
                  {!isPast && <span style={{ fontSize: 12, color: '#E8334A', fontWeight: 600 }}>Track order →</span>}
                  {isPast && (
                    <button
                      disabled={deleting === order.id}
                      onClick={async (e) => {
                        e.stopPropagation()
                        if (!confirm('Delete this order?')) return
                        setDeleting(order.id)
                        const res = await fetch('/api/delete-order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId: order.id, studentPhone: user?.phone }) })
                        if (res.ok) setOrders(prev => prev.filter(o => o.id !== order.id))
                        setDeleting(null)
                      }}
                      style={{ fontSize: 12, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                    >
                      {deleting === order.id ? 'Deleting...' : '🗑️ Delete'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
