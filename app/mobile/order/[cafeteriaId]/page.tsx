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

// Category images mapping
const CATEGORY_IMAGES: { [key: string]: string } = {
  'Biryani': 'https://qbvwcpjjattwebdzexni.supabase.co/storage/v1/object/public/menu-images/biryani.jpg',
  'Mandhi': 'https://qbvwcpjjattwebdzexni.supabase.co/storage/v1/object/public/menu-images/mandhi.jpg',
  'Combo': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=400&fit=crop',
  'Burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=400&fit=crop',
  'Roll': 'https://images.unsplash.com/photo-1599599810694-b5ac4dd64761?w=600&h=400&fit=crop',
  'Alfaham': 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=600&h=400&fit=crop',
  'Fries': 'https://images.unsplash.com/photo-1585238341710-4b51926b4b13?w=600&h=400&fit=crop',
  'Drinks': 'https://images.unsplash.com/photo-1551182364-8a84ac993676?w=600&h=400&fit=crop',
  'Momos': 'https://images.unsplash.com/photo-1609501676725-7186f017a4b6?w=600&h=400&fit=crop',
  'Coffee': 'https://images.unsplash.com/photo-1559056199-641a0ac8b3f7?w=600&h=400&fit=crop',
  'Shakes': 'https://images.unsplash.com/photo-1550434494-dba8d36ae60e?w=600&h=400&fit=crop',
  'Juice': 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=600&h=400&fit=crop',
}

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
      if (menuRes.data) {
        setMenuItems(menuRes.data as MenuItem[])
        // Auto-select first category
        const categories = [...new Set((menuRes.data as MenuItem[]).map(m => m.category))]
        if (categories.length > 0) {
          setSelectedCategory(categories[0])
        }
      }
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
    const paymentUrl = `/payment?orderId=${orderId}&amount=${total}&name=${encodeURIComponent(formData.name)}`

    // Detect if mobile: if so, navigate directly; otherwise open popup
    const isMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
      return mobileRegex.test(userAgent) || window.innerWidth < 768
    }

    if (isMobile()) {
      // On mobile, navigate directly to payment page
      router.push(paymentUrl)
      return
    }

    // On desktop, open in popup
    window.open(paymentUrl, 'payment_window', 'width=500,height=600')
    // Go straight to confirmation polling — no waiting screen
    setConfirmedTotal(total)

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
    setTimeout(() => { clearInterval(pollRef.current) }, 300_000)
  }

  // Listen for payment result from popup window
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'PAYMENT_SUCCESS') {
        clearInterval(pollRef.current)
        supabase.from('orders').select('token_number, items, total_amount').eq('id', orderId).single()
          .then(({ data }) => {
            if (data) {
              setConfirmedTotal(data.total_amount)
              setTokenData({ token: data.token_number ?? 0, items: data.items as Array<{ name: string; quantity: number }>, total: data.total_amount, id: orderId })
              setShowTicket(true)
            }
          })
        clearCart()
        setPaymentState('confirmed')
        setTimeout(() => setStep('confirmation'), 4000)
      } else if (e.data?.type === 'PAYMENT_FAILED') {
        clearInterval(pollRef.current)
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

        {/* Content - Category Cards Grid */}
        <div style={{ padding: 'var(--mobile-spacing)', paddingBottom: 100 }}>
          <style>{`
            .category-card {
              border: 2px solid rgba(26,31,46,0.1);
              border-radius: 14px;
              background: white;
              margin-bottom: 16px;
              animation: slideUpMobile 0.5s ease both;
              overflow: hidden;
            }
            .category-header {
              position: relative;
              width: 100%;
              height: 180px;
              margin-bottom: 0;
              padding: 0;
              border-bottom: 3px solid #FFA500;
              display: flex;
              align-items: flex-start;
              justify-content: flex-start;
            }
            .category-title {
              font-family: 'Impact', 'Arial Black', sans-serif;
              font-size: 24px;
              font-weight: 900;
              color: #1a1f2e;
              text-transform: uppercase;
              letter-spacing: 1px;
              background: black;
              color: #FFA500;
              padding: 10px 16px;
              border-radius: 6px;
              white-space: nowrap;
              position: absolute;
              bottom: 12px;
              left: 12px;
              z-index: 10;
              box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            }
            .category-image {
              width: 100%;
              height: 100%;
              object-fit: cover;
              box-shadow: inset 0 0 0 2px #FFA500;
            }
            .menu-item-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 10px 0;
              border-bottom: 1px dotted rgba(26,31,46,0.15);
            }
            .menu-item-row:last-child {
              border-bottom: none;
            }
            .menu-item-name {
              font-size: 13px;
              font-weight: 600;
              color: #1a1f2e;
              flex: 1;
            }
            .menu-item-price {
              font-size: 13px;
              font-weight: 700;
              color: #E8334A;
              margin-right: 8px;
              white-space: nowrap;
            }
            .add-btn-small {
              width: 28px;
              height: 28px;
              border-radius: 6px;
              border: none;
              background: #E8334A;
              color: white;
              font-weight: 700;
              cursor: pointer;
              transition: all 0.2s;
            }
            .add-btn-small:active {
              transform: scale(0.95);
            }
            .item-added-toast {
              position: fixed;
              bottom: 80px;
              left: 50%;
              transform: translateX(-50%);
              background: #2e9e6b;
              color: white;
              padding: 12px 20px;
              border-radius: 8px;
              font-size: 13px;
              font-weight: 600;
              z-index: 999;
              animation: slideUp 0.3s ease;
            }
          `}</style>

          {/* Category Cards */}
          {categories.map((category, catIdx) => {
            const categoryItems = menuItems.filter(m => m.category === category)
            const categoryImage = CATEGORY_IMAGES[category] || categoryItems[0]?.image_url || '🍽️'

            return (
              <div key={category} className="category-card" style={{ animationDelay: `${catIdx * 0.1}s` }}>
                {/* Category Header with Full-Width Image and Overlay Title */}
                <div className="category-header">
                  {typeof categoryImage === 'string' && categoryImage.includes('http') ? (
                    <img src={categoryImage} alt={category} className="category-image" />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80 }}>
                      {categoryImage}
                    </div>
                  )}
                  <div className="category-title">{category}</div>
                </div>

                {/* Menu Items in Category */}
                <div style={{ padding: '16px' }}>
                {categoryItems.map(item => {
                  const inCart = itemInCart(item.id)
                  const isOutOfStock = item.stock_quantity !== null && item.stock_quantity !== undefined && item.stock_quantity <= 0

                  return (
                    <div key={item.id} className="menu-item-row" style={{ opacity: isOutOfStock ? 0.6 : 1 }}>
                      <span className="menu-item-name">{item.name}</span>
                      <span className="menu-item-price">₹{item.price}</span>
                      {isOutOfStock ? (
                        <button disabled className="add-btn-small" style={{ opacity: 0.5, cursor: 'not-allowed' }}>—</button>
                      ) : inCart ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <button
                            onClick={() => updateQuantity(item.id, Math.max(0, inCart.quantity - 1))}
                            className="add-btn-small"
                            style={{ background: '#ccc', color: '#333' }}
                          >
                            −
                          </button>
                          <span style={{ width: 20, textAlign: 'center', fontWeight: 700, fontSize: 12 }}>
                            {inCart.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, inCart.quantity + 1)}
                            className="add-btn-small"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAddItem(item)}
                          className="add-btn-small"
                        >
                          +
                        </button>
                      )}
                    </div>
                  )
                })}
                </div>
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
            <div style={{ fontSize: 36, marginBottom: 12 }}>📱</div>
            <p style={{ fontWeight: 700, color: 'var(--navy)', marginBottom: 8 }}>Complete payment in the popup</p>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
              Once paid, you will be redirected automatically.
            </p>
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
