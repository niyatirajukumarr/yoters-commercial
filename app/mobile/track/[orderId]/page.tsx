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
      const { data: orderData, error } = await supabase.from('orders').select('*').eq('id', orderId).single()
      if (error || !orderData) { setLoading(false); return }
      setOrder(orderData as Order)
      const { data: cafData } = await supabase.from('cafeterias').select('*').eq('id', orderData.cafeteria_id).single()
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

  useEffect(() => {
    if (!order?.prep_time_minutes || !order?.approved_at) { setTimeRemaining(null); return }
    const end = new Date(order.approved_at).getTime() + order.prep_time_minutes * 60 * 1000
    const tick = () => setTimeRemaining(Math.max(0, end - Date.now()))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [order?.prep_time_minutes, order?.approved_at])

  const steps = [
    { id: 'paid',      emoji: '💳', label: 'Payment Done',     sub: '₹' + (order?.total_amount ?? '') + ' received',                                              done: (o: Order) => o.payment_status === 'paid' },
    { id: 'approved',  emoji: '✅', label: 'Order Accepted',   sub: order?.prep_time_minutes ? `Ready in ~${order.prep_time_minutes} min` : 'Vendor confirmed',   done: (o: Order) => !!o.approved_at },
    { id: 'preparing', emoji: '🍳', label: 'Being Cooked',     sub: 'Kitchen is on it!',                                                                          done: (o: Order) => ['preparing','ready','collected'].includes(o.status) },
    { id: 'ready',     emoji: '🔔', label: 'Ready!',           sub: 'Pick up at the counter',                                                                     done: (o: Order) => !!o.ready_at || ['ready','collected'].includes(o.status) },
    { id: 'collected', emoji: '🎉', label: 'Collected',        sub: 'Enjoy your meal!',                                                                           done: (o: Order) => !!o.collected_at || o.status === 'collected' },
  ]

  const mins = timeRemaining !== null ? Math.floor(timeRemaining / 60000) : null
  const secs = timeRemaining !== null ? Math.floor((timeRemaining % 60000) / 1000) : null
  const completedCount = order ? steps.filter(s => s.done(order)).length : 0
  const activeIdx = order ? steps.findIndex(s => !s.done(order)) : 0
  const isCancelled = order?.status === 'cancelled'
  const isReady = order?.status === 'ready'

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0f0f13', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
      <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid #E8334A', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
      <div style={{ color: '#666', fontSize: 14 }}>Loading your order...</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (!order) return (
    <div style={{ minHeight: '100vh', background: '#0f0f13', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 24 }}>
      <div style={{ fontSize: 48 }}>❌</div>
      <p style={{ color: '#666', textAlign: 'center' }}>Order not found</p>
      <button onClick={() => window.location.href = '/mobile/tabs/orders'} style={{ padding: '12px 24px', borderRadius: 10, border: 'none', background: '#E8334A', color: 'white', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Back to Orders</button>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f13', color: 'white', paddingBottom: 48 }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes ping { 0%{transform:scale(1);opacity:1} 100%{transform:scale(2.2);opacity:0} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        .token-float { animation: float 3s ease-in-out infinite; }
        .ping-ring { animation: ping 1.5s ease-out infinite; }
        .fade-up { animation: fadeUp 0.5s ease forwards; }
      `}</style>

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 0' }}>
        <button onClick={() => window.location.href = '/mobile/tabs/orders'}
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'white', padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          ← Back
        </button>
        <div style={{ fontSize: 12, color: '#666', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>{cafeteria?.name}</div>
        <div style={{ width: 60 }} />
      </div>

      {/* TOKEN HERO */}
      <div style={{ textAlign: 'center', padding: '32px 24px 24px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3, color: '#666', textTransform: 'uppercase', marginBottom: 16 }}>Your Token</div>

        {/* Glowing token circle */}
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: 20 }}>
          {isReady && (
            <div className="ping-ring" style={{ position: 'absolute', inset: -8, borderRadius: '50%', border: '3px solid #2e9e6b', opacity: 0.6 }} />
          )}
          <div className="token-float" style={{
            width: 140, height: 140, borderRadius: '50%',
            background: isCancelled ? 'rgba(232,51,74,0.1)' : isReady ? 'rgba(46,158,107,0.15)' : 'rgba(232,51,74,0.12)',
            border: `3px solid ${isCancelled ? '#E8334A' : isReady ? '#2e9e6b' : 'rgba(232,51,74,0.4)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: isReady ? '0 0 40px rgba(46,158,107,0.3)' : '0 0 40px rgba(232,51,74,0.15)',
          }}>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 64, fontWeight: 900, lineHeight: 1,
              color: isCancelled ? '#E8334A' : isReady ? '#2e9e6b' : 'white',
            }}>
              {order.queue_position ?? '—'}
            </div>
          </div>
        </div>

        {/* Status pill */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 20px', borderRadius: 99,
          background: isCancelled ? 'rgba(232,51,74,0.15)' : isReady ? 'rgba(46,158,107,0.15)' : 'rgba(255,255,255,0.07)',
          border: `1px solid ${isCancelled ? 'rgba(232,51,74,0.3)' : isReady ? 'rgba(46,158,107,0.3)' : 'rgba(255,255,255,0.1)'}`,
          marginBottom: 8,
        }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%',
            background: isCancelled ? '#E8334A' : isReady ? '#2e9e6b' : '#E8334A',
            boxShadow: `0 0 6px ${isCancelled ? '#E8334A' : isReady ? '#2e9e6b' : '#E8334A'}`,
          }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: isCancelled ? '#E8334A' : isReady ? '#2e9e6b' : 'white' }}>
            {isCancelled ? 'Order Cancelled' : isReady ? 'Ready for Pickup!' : order.status === 'collected' ? 'Order Collected ✓' : 'Order in Progress'}
          </span>
        </div>

        <div style={{ fontSize: 12, color: '#555' }}>
          {new Date(order.created_at).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
        </div>
      </div>

      {/* COUNTDOWN — only when vendor set prep time */}
      {timeRemaining !== null && !['collected', 'cancelled'].includes(order.status) && (
        <div style={{ margin: '0 20px 24px', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ background: timeRemaining === 0 ? 'rgba(46,158,107,0.15)' : 'rgba(212,130,26,0.12)', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: timeRemaining === 0 ? '#2e9e6b' : '#d4821a', textTransform: 'uppercase', marginBottom: 4 }}>
                {timeRemaining === 0 ? 'Almost Ready!' : 'Time Remaining'}
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: 36, fontWeight: 900, color: timeRemaining === 0 ? '#2e9e6b' : 'white', lineHeight: 1 }}>
                {timeRemaining === 0 ? 'Any moment...' : `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`}
              </div>
            </div>
            <div style={{ fontSize: 44 }}>{timeRemaining === 0 ? '🔔' : '⏱️'}</div>
          </div>
          {order.prep_time_minutes && (
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: 12, color: '#555' }}>
              Vendor estimated {order.prep_time_minutes} min total prep time
            </div>
          )}
        </div>
      )}

      {/* STEPS — horizontal scroll on mobile */}
      {!isCancelled && (
        <div style={{ margin: '0 20px 28px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: '#444', textTransform: 'uppercase', marginBottom: 16 }}>Order Progress</div>

          {/* Horizontal step track */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: 0 }}>
            {steps.map((step, i) => {
              const done = step.done(order)
              const isActive = !done && i === activeIdx
              const pct = done ? 100 : isActive ? 50 : 0
              return (
                <div key={step.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                  {/* Connector line before */}
                  {i > 0 && (
                    <div style={{ position: 'absolute', top: 20, right: '50%', width: '100%', height: 2, background: 'rgba(255,255,255,0.07)', zIndex: 0 }}>
                      <div style={{ height: '100%', width: steps[i-1].done(order) ? '100%' : '0%', background: '#E8334A', transition: 'width 0.6s ease' }} />
                    </div>
                  )}

                  {/* Circle */}
                  <div style={{
                    width: 42, height: 42, borderRadius: '50%', zIndex: 1, position: 'relative',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                    background: done ? '#E8334A' : isActive ? 'rgba(232,51,74,0.15)' : 'rgba(255,255,255,0.05)',
                    border: done ? '2px solid #E8334A' : isActive ? '2px solid rgba(232,51,74,0.6)' : '2px solid rgba(255,255,255,0.08)',
                    boxShadow: done ? '0 0 16px rgba(232,51,74,0.4)' : isActive ? '0 0 12px rgba(232,51,74,0.2)' : 'none',
                    transition: 'all 0.4s ease',
                  }}>
                    {done
                      ? <span style={{ fontSize: 16, color: 'white', fontWeight: 800 }}>✓</span>
                      : <span style={{ filter: isActive ? 'none' : 'grayscale(1) opacity(0.25)' }}>{step.emoji}</span>
                    }
                  </div>

                  {/* Label */}
                  <div style={{ marginTop: 8, textAlign: 'center', padding: '0 2px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: done ? 'white' : isActive ? '#E8334A' : '#444', lineHeight: 1.3, transition: 'color 0.3s' }}>
                      {step.label}
                    </div>
                    {isActive && (
                      <div style={{ fontSize: 9, color: '#E8334A', marginTop: 2, fontWeight: 600 }}>Now</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* DETAIL CARDS */}
      <div style={{ margin: '0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Active step detail */}
        {!isCancelled && activeIdx >= 0 && activeIdx < steps.length && (
          <div style={{ background: 'rgba(232,51,74,0.08)', border: '1px solid rgba(232,51,74,0.2)', borderRadius: 16, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 36 }}>{steps[activeIdx]?.emoji}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#E8334A', marginBottom: 2 }}>Currently: {steps[activeIdx]?.label}</div>
              <div style={{ fontSize: 12, color: '#666' }}>{steps[activeIdx]?.sub}</div>
            </div>
          </div>
        )}

        {/* Cancelled card */}
        {isCancelled && (
          <div style={{ background: 'rgba(232,51,74,0.08)', border: '1px solid rgba(232,51,74,0.2)', borderRadius: 16, padding: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>❌</div>
            <div style={{ fontWeight: 700, color: '#E8334A', fontSize: 16, marginBottom: 4 }}>Order Cancelled</div>
            <div style={{ color: '#555', fontSize: 13 }}>Contact the restaurant for a refund.</div>
          </div>
        )}

        {/* Order summary — receipt style */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, color: '#444', textTransform: 'uppercase' }}>Order Summary</span>
            <span style={{ fontSize: 11, color: '#444' }}>#{order.queue_position} · {cafeteria?.name}</span>
          </div>
          <div style={{ padding: '12px 20px' }}>
            {(order.items as Array<{ name: string; quantity: number; price: number }>).map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#aaa', marginBottom: 10 }}>
                <span>{item.quantity}× {item.name}</span>
                <span style={{ color: 'white', fontWeight: 600 }}>₹{item.price * item.quantity}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 800, color: 'white', paddingTop: 12, marginTop: 4, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <span>Total Paid</span>
              <span style={{ color: '#2e9e6b' }}>₹{order.total_amount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
