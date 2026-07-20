'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Order, Cafeteria } from '@/lib/types'

export default function OrderTrackingPage() {
  const params = useParams()
  const orderId = params.orderId as string
  const [order, setOrder] = useState<Order | null>(null)
  const [cafeteria, setCafeteria] = useState<Cafeteria | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null

    const fetchOrder = async () => {
      try {
        const cached = sessionStorage.getItem(`track-${orderId}`)
        if (cached) {
          const { order: o, cafeteria: c } = JSON.parse(cached)
          setOrder(o); setCafeteria(c); setLoading(false)
        }
      } catch {}

      const { data: orderData, error } = await supabase
        .from('orders').select('*').eq('id', orderId).single()
      if (error || !orderData) { setLoading(false); return }
      setOrder(orderData as Order)

      const { data: cafData } = await supabase
        .from('cafeterias').select('*').eq('id', orderData.cafeteria_id).single()
      if (cafData) {
        setCafeteria(cafData)
        sessionStorage.setItem(`track-${orderId}`, JSON.stringify({ order: orderData, cafeteria: cafData }))
      }
      setLoading(false)

      channel = supabase.channel('order-track-' + orderId)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
          (payload) => {
            setOrder(payload.new as Order)
            sessionStorage.setItem(`track-${orderId}`, JSON.stringify({ order: payload.new, cafeteria: cafData }))
          })
        .subscribe()
    }

    fetchOrder()
    return () => { if (channel) supabase.removeChannel(channel) }
  }, [orderId])

  // Countdown timer
  useEffect(() => {
    if (!order?.prep_time_minutes || !order?.approved_at) { setTimeRemaining(null); return }
    const end = new Date(order.approved_at).getTime() + order.prep_time_minutes * 60 * 1000
    const tick = () => setTimeRemaining(Math.max(0, end - Date.now()))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [order?.prep_time_minutes, order?.approved_at])

  const steps = [
    { id: 'paid',      icon: '💳', label: 'Payment Done',      sub: 'Your payment was received',        done: (o: Order) => o.payment_status === 'paid' },
    { id: 'approved',  icon: '✅', label: 'Vendor Accepted',    sub: order?.prep_time_minutes ? `Your order will be ready in ~${order.prep_time_minutes} min` : 'Restaurant confirmed your order',  done: (o: Order) => !!o.approved_at },
    { id: 'preparing', icon: '👨‍🍳', label: 'Being Prepared',    sub: 'Your food is being cooked',        done: (o: Order) => ['preparing','ready','collected'].includes(o.status) },
    { id: 'ready',     icon: '🔔', label: 'Order Ready',        sub: 'Pick up at the counter',           done: (o: Order) => !!o.ready_at || ['ready','collected'].includes(o.status) },
    { id: 'collected', icon: '🎉', label: 'Order Collected',    sub: 'Enjoy your meal!',                 done: (o: Order) => !!o.collected_at || o.status === 'collected' },
  ]

  const mins = timeRemaining !== null ? Math.floor(timeRemaining / 60000) : null
  const secs = timeRemaining !== null ? Math.floor((timeRemaining % 60000) / 1000) : null

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#fff8f5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #E8334A', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
      <div style={{ color: '#8a90a8', fontSize: 14 }}>Loading your order...</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (!order) return (
    <div style={{ minHeight: '100vh', background: '#fff8f5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 24 }}>
      <div style={{ fontSize: 48 }}>❌</div>
      <p style={{ color: '#8a90a8', textAlign: 'center' }}>Order not found</p>
      <button onClick={() => window.location.href = '/mobile/tabs/orders'} style={{ padding: '12px 24px', borderRadius: 10, border: 'none', background: '#E8334A', color: 'white', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
        Back to Orders
      </button>
    </div>
  )

  const completedCount = steps.filter(s => s.done(order)).length
  const progressPct = (completedCount / steps.length) * 100
  const isCancelled = order.status === 'cancelled'

  return (
    <div style={{ minHeight: '100vh', background: '#fff8f5', paddingBottom: 40 }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes glow { 0%,100%{box-shadow:0 0 0 0 rgba(232,51,74,0.4)} 50%{box-shadow:0 0 0 12px rgba(232,51,74,0)} }
        .step-done { animation: slideUp 0.4s ease forwards; }
        .ready-btn { animation: pulse 2s ease-in-out infinite; }
      `}</style>

      {/* Header */}
      <div style={{ background: '#E8334A', padding: '20px 20px 0', color: 'white' }}>
        <button onClick={() => window.location.href = '/mobile/tabs/orders'} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, color: 'white', padding: '6px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 16 }}>
          ← Orders
        </button>
        <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 4 }}>{cafeteria?.name}</div>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Order Tracking</div>

        {/* Token card */}
        <div style={{ background: 'white', borderRadius: '16px 16px 0 0', padding: '20px 20px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, color: '#8a90a8', textTransform: 'uppercase', marginBottom: 6 }}>Your Token Number</div>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 72, fontWeight: 900, color: '#E8334A', lineHeight: 1, marginBottom: 4 }}>
            {order.queue_position ?? '—'}
          </div>
          <div style={{ fontSize: 13, color: '#8a90a8' }}>Show this at the counter</div>
        </div>
      </div>

      {/* Body */}
      <div style={{ background: 'white', padding: '0 20px 24px' }}>

        {/* Progress bar */}
        {!isCancelled && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#8a90a8', marginBottom: 6 }}>
              <span>{completedCount} of {steps.length} steps done</span>
              <span>{Math.round(progressPct)}%</span>
            </div>
            <div style={{ height: 6, background: '#f0f0f0', borderRadius: 99 }}>
              <div style={{ height: '100%', width: `${progressPct}%`, background: 'linear-gradient(90deg, #E8334A, #ff6b6b)', borderRadius: 99, transition: 'width 0.6s ease' }} />
            </div>
          </div>
        )}

        {/* Countdown timer */}
        {timeRemaining !== null && order.status !== 'collected' && (
          <div style={{ background: timeRemaining === 0 ? '#edfaf3' : '#fff8ec', border: `1px solid ${timeRemaining === 0 ? '#2e9e6b' : '#d4821a'}`, borderRadius: 12, padding: '14px 16px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 28 }}>{timeRemaining === 0 ? '🔔' : '⏱️'}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: timeRemaining === 0 ? '#2e9e6b' : '#d4821a' }}>
                {timeRemaining === 0 ? 'Almost ready!' : 'Estimated time remaining'}
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: timeRemaining === 0 ? '#2e9e6b' : '#d4821a', fontFamily: 'monospace' }}>
                {timeRemaining === 0 ? 'Any moment now...' : `${mins}:${String(secs).padStart(2, '0')}`}
              </div>
            </div>
          </div>
        )}

        {/* Cancelled */}
        {isCancelled && (
          <div style={{ background: '#fff0f2', border: '1px solid #ffccd1', borderRadius: 12, padding: 16, marginBottom: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 6 }}>❌</div>
            <div style={{ fontWeight: 700, color: '#E8334A', fontSize: 16 }}>Order Cancelled</div>
            <div style={{ color: '#8a90a8', fontSize: 13, marginTop: 4 }}>This order was cancelled. Contact the restaurant for a refund.</div>
          </div>
        )}

        {/* Steps */}
        <div style={{ position: 'relative' }}>
          {steps.map((step, i) => {
            const done = step.done(order)
            const isActive = !done && (i === 0 || steps[i - 1].done(order))
            return (
              <div key={step.id} style={{ display: 'flex', gap: 16, marginBottom: i < steps.length - 1 ? 0 : 0 }}>
                {/* Line + circle */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 44, flexShrink: 0 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                    background: done ? '#E8334A' : isActive ? '#fff0f2' : '#f5f5f5',
                    border: done ? '2px solid #E8334A' : isActive ? '2px solid #E8334A' : '2px solid #e0e0e0',
                    transition: 'all 0.4s ease',
                    boxShadow: isActive ? '0 0 0 4px rgba(232,51,74,0.15)' : 'none',
                    flexShrink: 0,
                  }}>
                    {done ? <span style={{ fontSize: 18 }}>✓</span> : <span style={{ fontSize: 20, filter: isActive ? 'none' : 'grayscale(1) opacity(0.4)' }}>{step.icon}</span>}
                  </div>
                  {i < steps.length - 1 && (
                    <div style={{ width: 2, flex: 1, minHeight: 28, background: done ? '#E8334A' : '#e0e0e0', margin: '4px 0', transition: 'background 0.4s ease' }} />
                  )}
                </div>

                {/* Text */}
                <div style={{ paddingBottom: i < steps.length - 1 ? 24 : 0, paddingTop: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: done ? '#1a1f2e' : isActive ? '#E8334A' : '#b0b0b0', transition: 'color 0.4s ease' }}>
                    {step.label}
                    {isActive && <span style={{ fontSize: 11, fontWeight: 600, color: '#E8334A', background: '#fff0f2', padding: '2px 8px', borderRadius: 20, marginLeft: 8 }}>Now</span>}
                  </div>
                  <div style={{ fontSize: 13, color: done ? '#8a90a8' : '#c0c0c0', marginTop: 2 }}>{step.sub}</div>
                  {step.id === 'paid' && done && (
                    <div style={{ fontSize: 12, color: '#2e9e6b', marginTop: 4, fontWeight: 600 }}>₹{order.total_amount} paid</div>
                  )}
                  {step.id === 'approved' && order.approved_at && (
                    <div style={{ fontSize: 12, color: '#8a90a8', marginTop: 4 }}>{new Date(order.approved_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</div>
                  )}
                  {step.id === 'preparing' && order.prep_time_minutes && (
                    <div style={{ fontSize: 12, color: '#d4821a', marginTop: 4, fontWeight: 600 }}>~{order.prep_time_minutes} min prep time</div>
                  )}
                  {step.id === 'ready' && order.ready_at && (
                    <div style={{ fontSize: 12, color: '#8a90a8', marginTop: 4 }}>{new Date(order.ready_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>


        {/* Order summary */}
        <div style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid #f0f0f0' }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: '#1a1f2e' }}>Order Summary</div>
          {(order.items as Array<{ name: string; quantity: number; price: number }>).map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#444', marginBottom: 8 }}>
              <span>{item.quantity}× {item.name}</span>
              <span style={{ fontWeight: 600 }}>₹{item.price * item.quantity}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 800, color: '#1a1f2e', marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
            <span>Total</span>
            <span>₹{order.total_amount}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
