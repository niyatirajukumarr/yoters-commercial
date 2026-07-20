'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Order, Cafeteria } from '@/lib/types'
import { OrderTrackingRoadmap } from '@/components/OrderTrackingRoadmap'
import { PrepTimeCountdown } from '@/components/PrepTimeCountdown'

export default function OrderTrackingPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.orderId as string
  const [order, setOrder] = useState<Order | null>(null)
  const [cafeteria, setCafeteria] = useState<Cafeteria | null>(null)
  const [loading, setLoading] = useState(true)
  const [markingCollected, setMarkingCollected] = useState(false)

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null

    const fetchOrder = async () => {
      // Show cache instantly
      try {
        const cached = sessionStorage.getItem(`track-${orderId}`)
        if (cached) {
          const { order: o, cafeteria: c } = JSON.parse(cached)
          setOrder(o); setCafeteria(c); setLoading(false)
        }
      } catch {}

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()

      if (orderError || !orderData) {
        setLoading(false)
        return
      }

      setOrder(orderData as Order)

      const { data: cafData } = await supabase
        .from('cafeterias')
        .select('*')
        .eq('id', orderData.cafeteria_id)
        .single()

      if (cafData) {
        setCafeteria(cafData)
        sessionStorage.setItem(`track-${orderId}`, JSON.stringify({ order: orderData, cafeteria: cafData }))
      }

      setLoading(false)

      // Set up real-time subscription
      channel = supabase.channel('order-detail-' + orderId)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`
        }, (payload) => {
          setOrder(payload.new as Order)
        })
        .subscribe()
    }

    fetchOrder()
    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [orderId])

  const markAsCollected = async () => {
    if (!order) return
    setMarkingCollected(true)
    await supabase
      .from('orders')
      .update({ status: 'collected', collected_at: new Date().toISOString() })
      .eq('id', order.id)
    setMarkingCollected(false)
  }

  const statusConfig: Record<string, { label: string; icon: string; color: string }> = {
    pending: { label: 'Order Received', icon: '⏳', color: 'var(--yellow)' },
    paid: { label: 'Payment Confirmed', icon: '✅', color: 'var(--accent)' },
    approved: { label: 'Approved by Vendor', icon: '✓', color: 'var(--green)' },
    preparing: { label: 'Being Prepared', icon: '👨‍🍳', color: '#7c5cfc' },
    ready: { label: 'Ready for Pickup!', icon: '🔔', color: 'var(--green)' },
    collected: { label: 'Collected', icon: '🎉', color: 'var(--muted)' },
    cancelled: { label: 'Order Cancelled', icon: '❌', color: 'var(--red)' },
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
        Loading order details...
      </div>
    )
  }

  if (!order) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 24 }}>
        <div style={{ fontSize: 48 }}>❌</div>
        <p style={{ color: 'var(--muted)', textAlign: 'center' }}>Order not found</p>
        <Link href="/mobile/tabs/orders">
          <button style={{ padding: '12px 24px', borderRadius: 10, border: 'none', background: 'var(--accent)', color: 'white', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
            Back to Orders
          </button>
        </Link>
      </div>
    )
  }

  const config = statusConfig[order.status] || statusConfig.pending

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 80 }}>
      <style>{`
        .order-header {
          position: sticky;
          top: 0;
          background: rgba(253, 248, 245, 0.95);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border);
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          z-index: 100;
        }
        .order-content {
          max-width: 600px;
          margin: 0 auto;
          padding: 24px 20px;
        }
        .status-banner {
          background: linear-gradient(135deg, var(--surface) 0%, var(--surface2) 100%);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 24px;
          text-align: center;
          margin-bottom: 24px;
        }
        .status-icon {
          font-size: 56px;
          margin-bottom: 12px;
        }
        .status-label {
          font-family: var(--font-head);
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 6px;
        }
        .order-meta {
          font-size: 14px;
          color: var(--text2);
          margin-bottom: 16px;
        }
        .order-details {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 16px;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid var(--border);
          font-size: 14px;
        }
        .detail-row:last-child {
          border-bottom: none;
        }
        .detail-label {
          color: var(--text2);
          font-weight: 500;
        }
        .detail-value {
          color: var(--text);
          font-weight: 600;
        }
        .items-list {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 16px;
        }
        .items-title {
          font-weight: 600;
          margin-bottom: 12px;
          font-size: 14px;
        }
        .item-entry {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          font-size: 13px;
          border-bottom: 1px solid var(--border2);
        }
        .item-entry:last-child {
          border-bottom: none;
        }
        .pickup-button {
          width: 100%;
          padding: 16px;
          background: var(--green);
          color: white;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 16px;
        }
        .pickup-button:hover:not(:disabled) {
          background: #0d9488;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(13, 148, 136, 0.3);
        }
        .pickup-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--accent);
          text-decoration: none;
          font-weight: 600;
          cursor: pointer;
          background: none;
          border: none;
          font-size: 14px;
        }
        .back-link:hover {
          opacity: 0.8;
        }
      `}</style>

      {/* Header */}
      <div className="order-header">
        <Link href="/mobile/tabs/orders" className="back-link" style={{ textDecoration: 'none', color: 'var(--accent)' }}>
          ← Back
        </Link>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>Order #{order.queue_position}</div>
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>{cafeteria?.name}</div>
        </div>
      </div>

      {/* Content */}
      <div className="order-content">
        {/* Status Banner */}
        <div className="status-banner">
          <div className="status-icon">{config.icon}</div>
          <div className="status-label" style={{ color: config.color }}>{config.label}</div>
          <div className="order-meta">
            {order.student_name} • {order.student_phone}
          </div>
        </div>

        {/* Prep Time Countdown */}
        {order.prep_time_minutes && ['approved', 'preparing'].includes(order.status) && (
          <div style={{ marginBottom: 24 }}>
            <PrepTimeCountdown order={order} />
          </div>
        )}

        {/* Tracking Roadmap */}
        <OrderTrackingRoadmap order={order} cafeteriaName={cafeteria?.name} />

        {/* Order Details */}
        <div className="order-details">
          <div className="detail-row">
            <span className="detail-label">Total Amount</span>
            <span className="detail-value">₹{order.total_amount}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Payment Status</span>
            <span className="detail-value">{order.payment_status === 'paid' ? '✅ Paid' : '⏳ Pending'}</span>
          </div>
          {order.approved_at && (
            <div className="detail-row">
              <span className="detail-label">Approved At</span>
              <span className="detail-value">{new Date(order.approved_at).toLocaleTimeString()}</span>
            </div>
          )}
          {order.prep_time_minutes && (
            <div className="detail-row">
              <span className="detail-label">Prep Time</span>
              <span className="detail-value">⏱️ {order.prep_time_minutes} minutes</span>
            </div>
          )}
          {order.ready_at && (
            <div className="detail-row">
              <span className="detail-label">Ready At</span>
              <span className="detail-value">{new Date(order.ready_at).toLocaleTimeString()}</span>
            </div>
          )}
        </div>

        {/* Items List */}
        {order.items && order.items.length > 0 && (
          <div className="items-list">
            <div className="items-title">Order Items</div>
            {(order.items as Array<{ name: string; quantity: number; price?: number }>).map((item, idx) => (
              <div key={idx} className="item-entry">
                <span>{item.name}</span>
                <span style={{ color: 'var(--text2)' }}>x{item.quantity}</span>
              </div>
            ))}
          </div>
        )}

        {/* Ready Pickup Button */}
        {order.status === 'ready' && order.collected_at === null && (
          <button
            onClick={markAsCollected}
            disabled={markingCollected}
            className="pickup-button"
          >
            {markingCollected ? 'Marking as collected...' : '✓ I\'ve Picked Up My Order'}
          </button>
        )}
      </div>
    </div>
  )
}
