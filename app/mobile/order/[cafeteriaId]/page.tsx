'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useCart } from '@/lib/hooks/useCart'
import { useUserInfo } from '@/lib/hooks/useUserInfo'
import { TokenTicket } from '@/components/TokenTicket'
import { ChevronLeft, Plus, Minus, QrCode, Heart } from 'lucide-react'
import { useFavourites } from '@/lib/hooks/useFavourites'

interface MenuItem {
  id: string
  name: string
  description?: string
  price: number
  category: string
  is_available: boolean
  image_url?: string
  stock_quantity?: number | null
}

interface Cafeteria {
  id: string
  name: string
  image_emoji: string
  location: string
}

type Step = 'menu' | 'details' | 'payment' | 'confirmation'

export default function MobileOrderPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const cafeteriaId = params.cafeteriaId as string

  const [cafeteria, setCafeteria] = useState<Cafeteria | null>(null)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('Meals')
  const [step, setStep] = useState<Step>((searchParams.get('step') as Step) || 'menu')
  const [orderId, setOrderId] = useState<string>('')

  const { cart, addItem, updateQuantity, removeItem, clear: clearCart, total, itemCount } = useCart()
  const { isFavourite, toggleFavourite } = useFavourites()
  const { user, updateUser } = useUserInfo()
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', notes: '' })

  // FIX 3: Payment polling
  const [paymentState, setPaymentState] = useState<'idle' | 'waiting' | 'confirmed' | 'failed'>('idle')
  const pollRef = useRef<NodeJS.Timeout>(undefined)
  const [confirmedTotal, setConfirmedTotal] = useState(0)
  const [manualPayEnabled, setManualPayEnabled] = useState(false)

  // FIX 5: Token ticket
  const [showTicket, setShowTicket] = useState(false)
  const [tokenData, setTokenData] = useState<{ token: number; items: Array<{ name: string; quantity: number }>; total: number; id: string } | null>(null)

  // Fetch cafeteria & menu
  useEffect(() => {
    const fetch = async () => {
      const [cafRes, menuRes] = await Promise.all([
        supabase.from('cafeterias').select('*').eq('id', cafeteriaId).single(),
        supabase.from('cafeteria_menu').select('*').eq('cafeteria_id', cafeteriaId).eq('is_available', true),
      ])
      if (cafRes.data) setCafeteria(cafRes.data as Cafeteria)
      if (menuRes.data) setMenuItems(menuRes.data as MenuItem[])
      setLoading(false)
    }
    fetch()
  }, [cafeteriaId])

  // Populate form with saved user data
  useEffect(() => {
    if (user) {
      setFormData(f => ({ ...f, name: user.name || '', phone: user.phone || '', email: user.email || '' }))
    }
  }, [user])

  const categories = [...new Set(menuItems.map(m => m.category))]
  const filtered = menuItems.filter(m => m.category === selectedCategory)
  const cartItem = cart?.cafeteriaId === cafeteriaId ? cart.items : []
  const itemInCart = (menuId: string) => cartItem.find(i => i.menuId === menuId)

  const handleAddItem = (item: MenuItem) => {
    addItem(cafeteriaId, {
      menuId: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
    })
  }

  const decrementStock = async (menuItemId: string, quantity: number) => {
    try {
      const { data: currentItem } = await supabase.from('cafeteria_menu').select('stock_quantity').eq('id', menuItemId).single()
      if (currentItem && currentItem.stock_quantity !== null) {
        const newStock = Math.max(0, currentItem.stock_quantity - quantity)
        await supabase.from('cafeteria_menu').update({ stock_quantity: newStock }).eq('id', menuItemId)
      }
    } catch (err) {
      console.error('Error decrementing stock:', err)
    }
  }

  const handlePlaceOrder = async () => {
    if (!formData.name || !formData.phone || !cartItem.length) return

    try {
      const { data } = await supabase
        .from('orders')
        .insert([
          {
            cafeteria_id: cafeteriaId,
            student_name: formData.name,
            student_phone: formData.phone,
            student_email: formData.email,
            items: cartItem,
            total_amount: total,
            queue_position: 0,
            status: 'pending',
            payment_status: 'unpaid',
            notes: formData.notes,
          },
        ])
        .select()
        .single()

      if (data) {
        // Decrement stock for each item in the order
        for (const item of cartItem) {
          await decrementStock(item.menuId, item.quantity)
        }
        setOrderId(data.id)
        updateUser({ name: formData.name, phone: formData.phone, email: formData.email })
        setStep('payment')
      }
    } catch (error) {
      console.error('Order creation failed:', error)
    }
  }

  // FIX 3: Open payment page (safe payment gateway instead of UPI app redirect)
  function handleOpenUPI() {
    setPaymentState('waiting')
    const paymentUrl = `/payment?orderId=${orderId}&amount=${total}&name=${encodeURIComponent(formData.name)}`
    window.open(paymentUrl, 'payment_window', 'width=500,height=600')

    // Poll every 2s for faster confirmation
    pollRef.current = setInterval(async () => {
      const { data } = await supabase.from('orders').select('status, payment_status, token_number, items, total_amount').eq('id', orderId).single()
      if (data?.status === 'paid' || data?.payment_status === 'paid') {
        clearInterval(pollRef.current)
        setConfirmedTotal(data.total_amount)
        setPaymentState('confirmed')
        clearCart()
        if (data) {
          setTokenData({ token: data.token_number ?? 0, items: data.items as Array<{ name: string; quantity: number }>, total: data.total_amount, id: orderId })
          setShowTicket(true)
        }
        setTimeout(() => setStep('confirmation'), 4000)
      } else if (data?.status === 'failed' || data?.status === 'cancelled') {
        clearInterval(pollRef.current)
        setPaymentState('failed')
      }
    }, 3000)

    // 5 min timeout → show failed
    setTimeout(() => { clearInterval(pollRef.current); setPaymentState(prev => prev === 'waiting' ? 'failed' : prev) }, 300_000)
  }

  async function handleManualPaid() {
    await supabase.from('orders').update({ payment_status: 'paid', status: 'paid' }).eq('id', orderId)
    clearInterval(pollRef.current)
    setConfirmedTotal(total)
    setPaymentState('confirmed')
    clearCart()
    setStep('confirmation')
  }

  // Listen for payment result from popup window
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'PAYMENT_SUCCESS') {
        clearInterval(pollRef.current)
        setManualPayEnabled(true)  // only now show "I've Paid"
      } else if (e.data?.type === 'PAYMENT_FAILED') {
        clearInterval(pollRef.current)
        setManualPayEnabled(false)
        setPaymentState('failed')
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [orderId])

  // Cleanup polling on unmount
  useEffect(() => () => clearInterval(pollRef.current), [])

  if (loading) {
    return (
      <div style={{ padding: 'var(--mobile-spacing)', textAlign: 'center', paddingTop: '40px' }}>
        Loading...
      </div>
    )
  }

  if (!cafeteria) {
    return (
      <div style={{ padding: 'var(--mobile-spacing)', textAlign: 'center', paddingTop: '40px' }}>
        Cafeteria not found
      </div>
    )
  }

  // Menu Step
  if (step === 'menu') {
    return (
      <div className="mobile-page-enter">
        {/* Header */}
        <div style={{ backgroundColor: 'white', borderBottom: '1px solid rgba(26,31,46,0.08)', padding: '12px var(--mobile-spacing)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/mobile">
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <ChevronLeft size={24} color='var(--text)' />
            </button>
          </Link>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 700 }}>
              {cafeteria.name}
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
              {cafeteria.location}
            </div>
          </div>
          <div style={{ fontSize: 28 }}>{cafeteria.image_emoji}</div>
        </div>

        {/* Content */}
        <div style={{ padding: 'var(--mobile-spacing)', paddingBottom: 100 }}>
          {/* Category Tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', animation: 'slideUpMobile 0.5s 0.1s ease both' }}>
            {categories.map((cat, idx) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={selectedCategory === cat ? 'mobile-btn-primary' : 'mobile-btn-secondary'}
                style={{
                  padding: '8px 14px',
                  fontSize: 13,
                  fontWeight: 600,
                  borderRadius: 'var(--mobile-radius)',
                  border: 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                  animation: `slideUpMobile 0.5s ${0.15 + idx * 0.05}s ease both`,
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Menu Items */}
          {filtered.map(item => {
            const inCart = itemInCart(item.id)
            const isOutOfStock = item.stock_quantity !== null && item.stock_quantity !== undefined && item.stock_quantity <= 0
            return (
              <div key={item.id} className="mobile-card mobile-list-item" style={{ padding: 'var(--mobile-spacing)', marginBottom: 12, opacity: isOutOfStock ? 0.6 : 1 }}>
                <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} style={{ width: 70, height: 70, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 70, height: 70, borderRadius: 8, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, flexShrink: 0 }}>🍱</div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 4 }}>
                      <div style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 700, marginBottom: 3, color: isOutOfStock ? 'var(--muted)' : 'var(--text)' }}>
                        {item.name}
                      </div>
                      <button
                        onClick={() => toggleFavourite({
                          menuId: item.id,
                          name: item.name,
                          description: item.description,
                          price: item.price,
                          category: item.category,
                          cafeteriaId,
                          cafeteriaName: cafeteria?.name ?? '',
                        })}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', flexShrink: 0 }}
                        aria-label={isFavourite(item.id) ? 'Remove from favourites' : 'Add to favourites'}
                      >
                        <Heart
                          size={18}
                          fill={isFavourite(item.id) ? '#E8334A' : 'none'}
                          color={isFavourite(item.id) ? '#E8334A' : 'var(--muted)'}
                        />
                      </button>
                    </div>
                    {item.description && (
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>
                        {item.description}
                      </div>
                    )}
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent)', marginBottom: 4 }}>
                      ₹{item.price}
                    </div>
                    {item.stock_quantity !== null && item.stock_quantity !== undefined && (
                      <div style={{ fontSize: 11, color: isOutOfStock ? 'var(--red)' : 'var(--green)', fontWeight: 600 }}>
                        {isOutOfStock ? '❌ Out of Stock' : `✓ ${item.stock_quantity} left`}
                      </div>
                    )}
                  </div>
                </div>

                {/* Quantity Control */}
                {isOutOfStock ? (
                  <button disabled className="mobile-btn" style={{ opacity: 0.5, cursor: 'not-allowed', background: '#f5f5f5' }}>Out of Stock</button>
                ) : inCart ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, animation: 'scaleIn 0.2s ease' }}>
                    <button
                      onClick={() => updateQuantity(item.id, inCart.quantity - 1)}
                      className="mobile-btn-secondary"
                      style={{ flex: 1, padding: '8px 0', fontSize: 12, transition: 'all 0.2s ease' }}
                    >
                      <Minus size={14} style={{ margin: '0 auto' }} />
                    </button>
                    <div style={{ width: 40, textAlign: 'center', fontSize: 14, fontWeight: 700, transition: 'all 0.2s ease' }}>
                      {inCart.quantity}
                    </div>
                    <button
                      onClick={() => updateQuantity(item.id, inCart.quantity + 1)}
                      className="mobile-btn-primary"
                      style={{ flex: 1, padding: '8px 0', fontSize: 12, transition: 'all 0.2s ease' }}
                    >
                      <Plus size={14} style={{ margin: '0 auto' }} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleAddItem(item)}
                    className="mobile-btn mobile-btn-primary"
                    style={{ padding: '10px 14px', fontSize: 13, animation: 'scaleIn 0.2s ease', transition: 'all 0.2s ease' }}
                  >
                    + Add
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Sticky Cart */}
        {itemCount > 0 && (
          <div className="mobile-sticky-bottom" style={{ display: 'flex', gap: 10, alignItems: 'center', animation: 'slideUpMobile 0.3s ease', backdropFilter: 'blur(8px)', background: 'rgba(255,255,255,0.95)' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 2 }}>
                {itemCount} item{itemCount !== 1 ? 's' : ''}
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
                ₹{total}
              </div>
            </div>
            <button
              onClick={() => setStep('details')}
              className="mobile-btn mobile-btn-primary"
              style={{ padding: '12px 20px', animation: 'slideUpMobile 0.3s 0.1s ease both' }}
            >
              Continue →
            </button>
          </div>
        )}
      </div>
    )
  }

  // Details Step
  if (step === 'details') {
    return (
      <div style={{ padding: 'var(--mobile-spacing)', paddingBottom: 100 }} className="mobile-page-enter">
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <button
            onClick={() => setStep('menu')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 16, color: 'var(--accent)', fontSize: 14 }}
          >
            ← Back
          </button>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
            Order Details
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>
            {itemCount} item{itemCount !== 1 ? 's' : ''} • ₹{total}
          </div>
        </div>

        {/* Form */}
        <div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4, fontWeight: 600 }}>
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
              className="mobile-input"
              placeholder="Your name"
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4, fontWeight: 600 }}>
              Phone *
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={e => setFormData(f => ({ ...f, phone: e.target.value }))}
              className="mobile-input"
              placeholder="98765 43210"
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4, fontWeight: 600 }}>
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={e => setFormData(f => ({ ...f, email: e.target.value }))}
              className="mobile-input"
              placeholder="you@email.com"
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4, fontWeight: 600 }}>
              Special Notes (allergies, preferences)
            </label>
            <textarea
              value={formData.notes}
              onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))}
              className="mobile-input"
              placeholder="Any special requests..."
              style={{ minHeight: 80, resize: 'none' }}
            />
          </div>

          {/* Order Summary */}
          <div className="mobile-card" style={{ padding: 'var(--mobile-spacing)', marginBottom: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Order Summary</h3>
            {cartItem.map(item => (
              <div key={item.menuId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                <span>{item.quantity}x {item.name}</span>
                <span style={{ fontWeight: 600 }}>₹{item.price * item.quantity}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid rgba(26,31,46,0.08)', paddingTop: 12, marginTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700 }}>
              <span>Total</span>
              <span>₹{total}</span>
            </div>
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={!formData.name || !formData.phone}
            className="mobile-btn mobile-btn-primary"
            style={{ opacity: !formData.name || !formData.phone ? 0.5 : 1, cursor: !formData.name || !formData.phone ? 'not-allowed' : 'pointer' }}
          >
            Proceed to Payment
          </button>
        </div>
      </div>
    )
  }

  // Payment Step
  if (step === 'payment') {
    const upiLink = `upi://pay?pa=niyati.rajukumar@okaxis&pn=Yoters&am=${total}&cu=INR&tn=Yoters-${orderId.slice(0, 8)}`
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiLink)}`

    return (
      <div style={{ padding: 'var(--mobile-spacing)', paddingBottom: 100, textAlign: 'center' }} className="mobile-page-enter">
        <div style={{ marginBottom: 28, animation: 'slideUpMobile 0.5s ease' }}>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Payment</div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>Order #{orderId.slice(0, 8)}</div>
        </div>

        {paymentState === 'idle' && (
          <>
            <div className="mobile-card mobile-slide-up" style={{ padding: 24, marginBottom: 24, textAlign: 'center', animation: 'slideUpMobile 0.5s 0.1s ease both' }}>
              <div style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 12 }}>Amount to Pay</div>
              <div style={{ fontSize: 48, fontWeight: 700, color: 'var(--accent)', animation: 'pulse 2s infinite' }}>₹{total}</div>
            </div>
            <div className="mobile-card" style={{ padding: 24, marginBottom: 24, animation: 'slideUpMobile 0.5s 0.2s ease both' }}>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12, fontWeight: 600 }}>Scan to Pay via UPI</div>
              <img src={qrCodeUrl} alt="UPI QR Code" style={{ width: 200, height: 200, margin: '0 auto', borderRadius: 'var(--mobile-radius)', animation: 'scaleIn 0.4s 0.3s ease both' }} />
            </div>
            <button onClick={handleOpenUPI} className="mobile-btn mobile-btn-primary" style={{ marginBottom: 12, animation: 'slideUpMobile 0.5s 0.4s ease both' }}>
              Open UPI App
            </button>
          </>
        )}

        {paymentState === 'waiting' && (
          <div style={{ padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
            <p style={{ fontWeight: 700, color: 'var(--navy)', marginBottom: 8 }}>Waiting for payment...</p>
            {manualPayEnabled ? (
              <>
                <p style={{ fontSize: 14, color: 'var(--green)', fontWeight: 600, marginBottom: 16 }}>
                  ✅ Payment received! Tap below to confirm your order.
                </p>
                <button onClick={handleManualPaid} className="mobile-btn" style={{ background: 'var(--green)', color: 'white', marginBottom: 12, border: 'none' }}>
                  ✅ I&apos;ve Paid — Confirm Order
                </button>
              </>
            ) : (
              <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
                Complete the payment in your UPI app.<br />This page will update automatically.
              </p>
            )}
            <button onClick={() => { clearInterval(pollRef.current); setPaymentState('idle') }}
              style={{ fontSize: 13, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        )}

        {paymentState === 'failed' && (
          <div style={{ background: 'var(--red-bg)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
            <p style={{ color: 'var(--red)', fontWeight: 700, marginBottom: 12 }}>Payment not received</p>
            <button onClick={() => setPaymentState('idle')} className="mobile-btn mobile-btn-primary">Try Again</button>
          </div>
        )}
      </div>
    )
  }

  // Confirmation Step
  if (step === 'confirmation') {
    return (
      <div style={{ padding: 'var(--mobile-spacing)', textAlign: 'center', paddingTop: 60 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
          Order Confirmed!
        </div>
        <div style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 24 }}>
          Your order has been placed successfully.
        </div>

        <div className="mobile-card" style={{ padding: 'var(--mobile-spacing)', marginBottom: 24, textAlign: 'left' }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, marginBottom: 4 }}>
              Order ID
            </div>
            <div style={{ fontSize: 15, fontFamily: 'monospace', color: 'var(--text)' }}>
              {orderId}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, marginBottom: 4 }}>
              Total Amount
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent)' }}>
              ₹{confirmedTotal}
            </div>
          </div>
        </div>

        <Link href="/mobile/orders" style={{ width: '100%' }}>
          <button className="mobile-btn mobile-btn-primary" style={{ marginBottom: 8 }}>
            Track Order
          </button>
        </Link>

        <Link href="/mobile" style={{ width: '100%' }}>
          <button className="mobile-btn mobile-btn-secondary">
            Continue Shopping
          </button>
        </Link>

        {/* FIX 5: Token Ticket */}
        {showTicket && tokenData && (
          <TokenTicket
            token={tokenData.token}
            cafeteriaName={cafeteria?.name ?? 'Cafeteria'}
            items={tokenData.items}
            total={tokenData.total}
            orderId={tokenData.id}
            onClose={() => setShowTicket(false)}
          />
        )}
      </div>
    )
  }
}
