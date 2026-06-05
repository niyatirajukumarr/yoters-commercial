'use client'

import { useEffect, useState, useCallback, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Cafeteria, CafeteriaQueue, MenuItem, Order, OrderItem, formatWait } from '@/lib/types'
import { useUserInfo } from '@/lib/hooks/useUserInfo'
import { TokenTicket } from '@/components/TokenTicket'
import { useFavourites } from '@/lib/hooks/useFavourites'

interface CafeteriaWithQueue extends Cafeteria { queue: CafeteriaQueue }
type Step = 'menu' | 'details' | 'payment' | 'tracking'

function StudentPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const cafeteriaId = searchParams.get('cafeteria')
  const [cafeteria, setCafeteria] = useState<CafeteriaWithQueue | null>(null)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [cart, setCart] = useState<OrderItem[]>([])
  const [step, setStep] = useState<Step>('menu')
  const [myOrder, setMyOrder] = useState<Order | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', altPhone: '', email: '', notes: '' })
  const [showCart, setShowCart] = useState(false)

  // FIX 3: Payment polling state
  const [paymentState, setPaymentState] = useState<'idle' | 'waiting' | 'confirmed' | 'failed'>('idle')
  const pollRef = useRef<NodeJS.Timeout>(undefined)
  const [confirmedOrderId, setConfirmedOrderId] = useState<string>('')

  // FIX 4: Prefill from user profile
  const { user: profile } = useUserInfo()
  const { isFavourite, toggleFavourite } = useFavourites()

  // FIX 5: Token ticket state
  const [showTicket, setShowTicket] = useState(false)
  const [tokenData, setTokenData] = useState<{ token: number; items: Array<{ name: string; quantity: number }>; total: number; id: string } | null>(null)

  // Check if user is vendor and redirect
  useEffect(() => {
    const checkVendor = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data: cafeteria } = await supabase
          .from('cafeterias')
          .select('id')
          .eq('vendor_email', session.user.email)
          .single()
        if (cafeteria) {
          router.replace('/vendor')
        }
      }
    }
    checkVendor()
  }, [router])

  const fetchCafeteria = useCallback(async () => {
    if (!cafeteriaId) return
    const { data } = await supabase.from('cafeterias').select('*, queue:cafeteria_queues(*)').eq('id', cafeteriaId).single()
    if (data) setCafeteria(data as CafeteriaWithQueue)
  }, [cafeteriaId])

  useEffect(() => {
    if (!cafeteriaId) return
    fetchCafeteria()
    supabase.from('cafeteria_menu').select('*').eq('cafeteria_id', cafeteriaId).eq('is_available', true).order('category')
      .then(({ data }) => { if (data) setMenuItems(data) })
    const ch = supabase.channel('student-cafeteria')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cafeteria_queues' }, fetchCafeteria)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, payload => {
        if (myOrder && payload.new.id === myOrder.id) setMyOrder(payload.new as Order)
      }).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [cafeteriaId, fetchCafeteria, myOrder])

  // Handle reorder from favourites: pre-fill cart and jump to details
  useEffect(() => {
    if (!cafeteriaId) return
    const raw = sessionStorage.getItem('yoters_reorder')
    if (!raw) return
    try {
      const { cafeteriaId: cid, item } = JSON.parse(raw)
      if (cid === cafeteriaId) {
        sessionStorage.removeItem('yoters_reorder')
        setCart([item])
        setStep('details')
      }
    } catch {}
  }, [cafeteriaId])

  // FIX 4: Prefill form from saved profile
  useEffect(() => {
    if (profile) {
      setForm(f => ({
        ...f,
        name: f.name || profile.name || '',
        phone: f.phone || profile.phone || '',
        email: f.email || profile.email || '',
      }))
    }
  }, [profile])

  // Listen for payment result from popup window
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'PAYMENT_SUCCESS') {
        clearInterval(pollRef.current)
        if (myOrder) {
          setConfirmedOrderId(myOrder.id)
          setMyOrder(prev => prev ? { ...prev, payment_status: 'paid', status: 'paid' } : null)
        }
        setPaymentState('confirmed')
        setStep('tracking')
      } else if (e.data?.type === 'PAYMENT_FAILED') {
        clearInterval(pollRef.current)
        setPaymentState('failed')
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [myOrder])

  // FIX 3: Cleanup polling on unmount
  useEffect(() => () => clearInterval(pollRef.current), [])

  // FIX 5: Fetch token after payment confirmed
  useEffect(() => {
    if (paymentState === 'confirmed' && confirmedOrderId) {
      supabase.from('orders').select('token_number, items, total_amount')
        .eq('id', confirmedOrderId).single()
        .then(({ data }) => {
          if (data) {
            setTokenData({
              token: data.token_number ?? 0,
              items: (data.items as Array<{ name: string; quantity: number }>),
              total: data.total_amount,
              id: confirmedOrderId,
            })
            setShowTicket(true)
          }
        })
    }
  }, [paymentState, confirmedOrderId])

  function addToCart(item: MenuItem) {
    setCart(prev => {
      const exists = prev.find(i => i.menu_item_id === item.id)
      if (exists) return prev.map(i => i.menu_item_id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { menu_item_id: item.id, name: item.name, price: item.price, quantity: 1 }]
    })
  }

  function removeFromCart(id: string) {
    setCart(prev => {
      const exists = prev.find(i => i.menu_item_id === id)
      if (exists && exists.quantity > 1) return prev.map(i => i.menu_item_id === id ? { ...i, quantity: i.quantity - 1 } : i)
      return prev.filter(i => i.menu_item_id !== id)
    })
  }

  async function decrementMenuItemStock(menuItemId: string, quantity: number) {
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

  async function placeOrder() {
    if (!cafeteria || !form.name || !form.phone || cart.length === 0) return
    setSubmitting(true)
    const { data: existing } = await supabase.from('orders').select('queue_position').eq('cafeteria_id', cafeteria.id).in('status', ['pending', 'paid', 'preparing']).order('queue_position', { ascending: false }).limit(1)
    const nextPos = existing && existing.length > 0 ? existing[0].queue_position + 1 : 1
    const total = cart.reduce((s, i) => s + i.price * i.quantity, 0)
    const { data, error } = await supabase.from('orders').insert({
      cafeteria_id: cafeteria.id, student_name: form.name, student_phone: form.phone,
      student_email: form.email || null, items: cart, total_amount: total,
      queue_position: nextPos, notes: form.notes || null, status: 'pending', payment_status: 'unpaid'
    }).select().single()
    if (error) { alert('Failed to place order. Try again.'); setSubmitting(false); return }

    // Decrement stock for each item in the order
    for (const item of cart) {
      await decrementMenuItemStock(item.menu_item_id, item.quantity)
    }

    setMyOrder(data); setStep('payment'); setSubmitting(false)
  }

  // FIX 3: Payment handler with polling
  async function handlePay() {
    if (!myOrder) return
    // Open secure payment page
    const paymentUrl = `/payment?orderId=${myOrder.id}&amount=${myOrder.total_amount}&name=${encodeURIComponent(form.name)}`
    window.open(paymentUrl, 'payment_window', 'width=500,height=600')
    // Go straight to tracking — no waiting screen
    setConfirmedOrderId(myOrder.id)
    setMyOrder(prev => prev ? { ...prev, payment_status: 'unpaid', status: 'pending' } : null)
    setStep('tracking')

    // Poll every 2s for payment confirmation
    pollRef.current = setInterval(async () => {
      const { data } = await supabase
        .from('orders')
        .select('status, payment_status, token_number, items, total_amount')
        .eq('id', myOrder.id)
        .single()

      if (data?.status === 'paid' || data?.payment_status === 'paid') {
        clearInterval(pollRef.current)
        setPaymentState('confirmed')
        setConfirmedOrderId(myOrder.id)
        setMyOrder(prev => prev ? { ...prev, payment_status: 'paid', status: 'paid' } : null)
        // Show token ticket immediately
        if (data) {
          setTokenData({
            token: data.token_number ?? 0,
            items: data.items as Array<{ name: string; quantity: number }>,
            total: data.total_amount,
            id: myOrder.id,
          })
          setShowTicket(true)
        }
        setStep('tracking')
      } else if (data?.status === 'failed' || data?.status === 'cancelled') {
        clearInterval(pollRef.current)
        setPaymentState('failed')
      }
    }, 2000)

    // Timeout after 5 min
    setTimeout(() => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        setPaymentState(prev => prev === 'waiting' ? 'failed' : prev)
      }
    }, 300_000)
  }


  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0)
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0)
  const categories = [...new Set(menuItems.map(i => i.category))]

  const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
    pending: { label: 'Order Received', color: 'var(--yellow)', icon: '⏳' },
    paid: { label: 'Payment Confirmed', color: 'var(--accent)', icon: '✅' },
    preparing: { label: 'Being Prepared', color: '#7c5cfc', icon: '👨‍🍳' },
    ready: { label: 'Ready for Pickup!', color: 'var(--green)', icon: '🔔' },
    collected: { label: 'Collected', color: 'var(--muted)', icon: '🎉' },
  }

  const inp = { width: '100%', padding: '12px 16px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 15, color: 'var(--text)' }
  const lbl = { fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' as const, fontWeight: 500 as const }

  if (!cafeteriaId) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 24 }}>
      <div style={{ fontSize: 48 }}>🍱</div>
      <p style={{ color: 'var(--muted)', textAlign: 'center' }}>No cafeteria selected.</p>
      <Link href="/browse"><button style={{ padding: '12px 24px', borderRadius: 10, border: 'none', background: 'var(--accent)', color: 'white', fontSize: 15, fontWeight: 600 }}>Browse Cafeterias</button></Link>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 80 }}>
      <style>{`
        .s-nav { display:flex; align-items:center; justify-content:space-between; padding:12px 20px; border-bottom:1px solid var(--border); position:sticky; top:0; background:rgba(253,248,245,0.95); backdrop-filter:blur(12px); z-index:100; }
        .s-steps { display:flex; gap:4px; align-items:center; }
        .s-step { font-size:11px; font-weight:500; }
        .s-content { max-width:860px; margin:0 auto; padding:24px 20px 80px; }
        .menu-grid { display:grid; grid-template-columns:1fr 300px; gap:24px; align-items:start; }
        .cart-sticky { background:var(--surface); border:1px solid var(--border); border-radius:16px; padding:20px; position:sticky; top:80px; }
        .cart-mobile-bar { display:none; }
        .cart-sheet { display:none; }
        @media (max-width: 768px) {
          .s-nav { padding:10px 16px; }
          .s-content { padding:16px 16px 100px; }
          .menu-grid { grid-template-columns:1fr; }
          .cart-sticky { display:none; }
          .cart-mobile-bar {
            display:flex; position:fixed; bottom:0; left:0; right:0; z-index:200;
            background:var(--accent); color:white; padding:16px 20px;
            align-items:center; justify-content:space-between;
            border-radius:16px 16px 0 0; box-shadow:0 -4px 24px rgba(232,51,74,0.2);
          }
          .cart-sheet {
            display:block; position:fixed; bottom:0; left:0; right:0; z-index:300;
            background:var(--bg); border-radius:20px 20px 0 0;
            padding:24px 20px 40px; box-shadow:0 -8px 40px rgba(26,31,46,0.15);
            max-height:80vh; overflow-y:auto;
            transform:translateY(100%); transition:transform 0.3s cubic-bezier(0.32,0.72,0,1);
          }
          .cart-sheet.open { transform:translateY(0); }
          .sheet-handle { width:40px; height:4px; background:var(--border2); border-radius:2px; margin:0 auto 20px; }
          .tracking-grid { grid-template-columns:1fr 1fr !important; }
        }
      `}</style>

      {/* NAV */}
      <nav className="s-nav">
        <Link href="/browse" style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 700, textDecoration: 'none', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 6 }}>
          ← <span style={{ fontSize: 13, color: 'var(--text2)', fontFamily: 'var(--font-body)', fontWeight: 400 }}>{cafeteria?.name ?? ''}</span>
        </Link>
        <div className="s-steps">
          {(['menu', 'details', 'payment', 'tracking'] as Step[]).map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {i > 0 && <span style={{ color: 'var(--border2)', fontSize: 10 }}>›</span>}
              <span className="s-step" style={{ color: step === s ? 'var(--accent)' : 'var(--muted)' }}>
                {{ menu: 'Menu', details: 'Details', payment: 'Pay', tracking: 'Track' }[s]}
              </span>
            </div>
          ))}
        </div>
      </nav>

      <div className="s-content">

        {/* MENU STEP */}
        {step === 'menu' && (
          <>
            <div style={{ marginBottom: 20 }}>
              <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(22px,5vw,28px)', fontWeight: 700, marginBottom: 6 }}>
                {cafeteria?.name ?? 'Loading...'}
              </h1>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 13, color: 'var(--muted)' }}>
                <span>📍 {cafeteria?.location}</span>
              </div>
            </div>

            <div className="menu-grid">
              <div>
                {categories.map(cat => (
                  <div key={cat} style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10 }}>{cat}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {menuItems.filter(i => i.category === cat).map(item => {
                        const inCart = cart.find(i => i.menu_item_id === item.id)
                        const isOutOfStock = item.stock_quantity != null && item.stock_quantity <= 0
                        return (
                          <div key={item.id} style={{ background: isOutOfStock ? 'var(--surface2)' : 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: isOutOfStock ? 0.6 : 1 }}>
                            <div style={{ display: 'flex', gap: 12, flex: 1, minWidth: 0 }}>
                              {item.image_url ? (
                                <img src={item.image_url} alt={item.name} style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                              ) : (
                                <div style={{ width: 60, height: 60, borderRadius: 8, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>🍱</div>
                              )}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 500, fontSize: 15, color: isOutOfStock ? 'var(--muted)' : 'var(--text)' }}>{item.name}</div>
                                {item.description && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{item.description}</div>}
                                <div style={{ fontSize: 14, color: 'var(--accent)', fontWeight: 700, marginTop: 4 }}>₹{item.price}</div>
                                {item.stock_quantity != null && (
                                  <div style={{ fontSize: 12, marginTop: 4, color: isOutOfStock ? 'var(--red)' : 'var(--green)', fontWeight: 600 }}>
                                    {isOutOfStock ? '❌ Out of Stock' : `✓ ${item.stock_quantity} left`}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 12 }}>
                              {/* Heart / Favourite button */}
                              <button
                                onClick={() => toggleFavourite({
                                  menuId: item.id,
                                  name: item.name,
                                  description: item.description,
                                  price: item.price,
                                  category: item.category,
                                  cafeteriaId: cafeteriaId!,
                                  cafeteriaName: cafeteria?.name ?? '',
                                })}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}
                                aria-label={isFavourite(item.id) ? 'Remove from favourites' : 'Add to favourites'}
                              >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill={isFavourite(item.id) ? '#E8334A' : 'none'} stroke={isFavourite(item.id) ? '#E8334A' : '#aaa'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                </svg>
                              </button>
                              {isOutOfStock ? (
                                <button disabled style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: 'var(--muted)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'not-allowed', opacity: 0.5 }}>Out of Stock</button>
                              ) : inCart ? (
                                <>
                                  <button onClick={() => removeFromCart(item.id)} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                                  <span style={{ fontWeight: 700, minWidth: 18, textAlign: 'center' }}>{inCart.quantity}</span>
                                  <button onClick={() => addToCart(item)} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'var(--accent)', color: 'white', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                                </>
                              ) : (
                                <button onClick={() => addToCart(item)} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: 'white', fontSize: 13, fontWeight: 600 }}>Add</button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop cart */}
              {cart.length > 0 && (
                <div className="cart-sticky">
                  <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Your Order</div>
                  {cart.map(item => (
                    <div key={item.menu_item_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                      <div><div style={{ fontSize: 14 }}>{item.name}</div><div style={{ fontSize: 12, color: 'var(--muted)' }}>×{item.quantity}</div></div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>₹{item.price * item.quantity}</div>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0 16px', fontWeight: 700, fontSize: 16 }}>
                    <span>Total</span><span style={{ color: 'var(--accent)' }}>₹{cartTotal}</span>
                  </div>
                  <button onClick={() => setStep('details')} style={{ width: '100%', padding: 14, borderRadius: 10, border: 'none', background: 'var(--accent)', color: 'white', fontSize: 15, fontWeight: 700 }}>
                    Continue ({cartCount} items) →
                  </button>
                </div>
              )}
            </div>

            {/* Mobile cart bar */}
            {cart.length > 0 && (
              <>
                <div className="cart-mobile-bar" onClick={() => setShowCart(true)}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{cartCount} item{cartCount > 1 ? 's' : ''} added</div>
                    <div style={{ fontSize: 13, opacity: 0.8 }}>Tap to review order</div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 800 }}>₹{cartTotal} →</div>
                </div>
                <div className={`cart-sheet ${showCart ? 'open' : ''}`}>
                  <div className="sheet-handle" onClick={() => setShowCart(false)} />
                  <div style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Your Order</div>
                  {cart.map(item => (
                    <div key={item.menu_item_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <button onClick={() => removeFromCart(item.menu_item_id)} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 16 }}>−</button>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 500 }}>{item.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--muted)' }}>×{item.quantity}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>₹{item.price * item.quantity}</div>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', fontWeight: 700, fontSize: 18 }}>
                    <span>Total</span><span style={{ color: 'var(--accent)' }}>₹{cartTotal}</span>
                  </div>
                  <button onClick={() => { setShowCart(false); setStep('details') }} style={{ width: '100%', padding: 16, borderRadius: 12, border: 'none', background: 'var(--accent)', color: 'white', fontSize: 16, fontWeight: 700 }}>
                    Continue to Details →
                  </button>
                </div>
                {showCart && <div onClick={() => setShowCart(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(26,31,46,0.4)', zIndex: 299 }} />}
              </>
            )}
          </>
        )}

        {/* DETAILS STEP */}
        {step === 'details' && (
          <>
            <button onClick={() => setStep('menu')} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 14, marginBottom: 20, padding: 0, cursor: 'pointer' }}>← Back to menu</button>
            <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 24, fontWeight: 700, marginBottom: 20 }}>Your Details</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div><label style={lbl}>Full Name *</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your name" style={inp} /></div>
              <div><label style={lbl}>Phone Number *</label><input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" style={inp} /></div>
              <div><label style={lbl}>Alternative Phone (optional)</label><input value={form.altPhone} onChange={e => setForm(f => ({ ...f, altPhone: e.target.value }))} placeholder="+91 98765 43210" style={inp} /></div>
              <div><label style={lbl}>Email (optional)</label><input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@college.edu" style={inp} /></div>
              <div><label style={lbl}>Notes</label><input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="No onions, extra spicy..." style={inp} /></div>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 18 }}>
                <div style={{ fontWeight: 600, marginBottom: 12 }}>Order Summary</div>
                {cart.map(i => (
                  <div key={i.menu_item_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '4px 0', color: 'var(--text2)' }}>
                    <span>{i.name} ×{i.quantity}</span><span>₹{i.price * i.quantity}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 16, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  <span>Total</span><span style={{ color: 'var(--accent)' }}>₹{cartTotal}</span>
                </div>
              </div>
              <button onClick={placeOrder} disabled={submitting || !form.name || !form.phone}
                style={{ padding: 16, borderRadius: 12, border: 'none', background: 'var(--accent)', color: 'white', fontSize: 16, fontWeight: 700, opacity: submitting || !form.name || !form.phone ? 0.5 : 1 }}>
                {submitting ? 'Placing Order...' : 'Place Order & Pay →'}
              </button>
            </div>
          </>
        )}

        {/* PAYMENT STEP */}
        {step === 'payment' && myOrder && (
          <>
            {paymentState === 'idle' && (
              <>
                <div style={{ background: 'rgba(232,51,74,0.06)', border: '1px solid rgba(232,51,74,0.15)', borderRadius: 16, padding: 20, textAlign: 'center', marginBottom: 16 }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
                  <div style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Order #{myOrder.queue_position} placed!</div>
                  <div style={{ fontSize: 14, color: 'var(--text2)' }}>Complete payment to confirm</div>
                </div>
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, textAlign: 'center', marginBottom: 14 }}>
                  <div style={{ fontFamily: 'var(--font-head)', fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Pay via UPI</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>Scan QR or tap Pay Now</div>
                  <div style={{ background: 'var(--surface2)', borderRadius: 12, padding: '12px 20px', marginBottom: 20, display: 'inline-block' }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 2 }}>Total Amount</div>
                    <div style={{ fontFamily: 'var(--font-head)', fontSize: 32, fontWeight: 800, color: 'var(--accent)' }}>₹{myOrder.total_amount}</div>
                  </div>
                  <button onClick={handlePay} style={{ width: '100%', padding: 15, borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#00b09b,#96c93d)', color: 'white', fontSize: 16, fontWeight: 700, marginBottom: 10 }}>
                    📱 Choose Payment Method
                  </button>
                  <div style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>Tap to open your preferred UPI app</div>
                </div>
              </>
            )}

            {paymentState === 'waiting' && (
              <div style={{ textAlign: 'center', padding: 24 }}>
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
                <button onClick={() => setPaymentState('idle')} className="btn-primary" style={{ padding: '12px 24px', borderRadius: 10, border: 'none', background: 'var(--accent)', color: 'white', fontSize: 15, fontWeight: 700 }}>
                  Try Again
                </button>
              </div>
            )}
          </>
        )}

        {/* TRACKING STEP */}
        {step === 'tracking' && myOrder && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 48, marginBottom: 10 }}>{statusConfig[myOrder.status]?.icon ?? '⏳'}</div>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(22px,5vw,28px)', fontWeight: 700, marginBottom: 6 }}>{statusConfig[myOrder.status]?.label ?? myOrder.status}</div>
              <div style={{ fontSize: 14, color: 'var(--text2)' }}>Order #{myOrder.queue_position} · {cafeteria?.name}</div>
            </div>
            <div className="tracking-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              {[
                { label: 'Position', val: `#${myOrder.queue_position}`, color: 'var(--accent)' },
                { label: 'Payment', val: myOrder.payment_status === 'paid' ? 'Paid ✅' : 'Pending', color: myOrder.payment_status === 'paid' ? 'var(--green)' : 'var(--yellow)' },
                { label: 'Items', val: `${cart.reduce((s, i) => s + i.quantity, 0)} items`, color: 'var(--text)' },
                { label: 'Total', val: `₹${myOrder.total_amount}`, color: 'var(--accent)' },
              ].map((s, i) => (
                <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</div>
                  <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 800, color: s.color }}>{s.val}</div>
                </div>
              ))}
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
              <div style={{ fontWeight: 600, marginBottom: 14, fontSize: 15 }}>Order Progress</div>
              {(['pending', 'paid', 'preparing', 'ready', 'collected'] as Order['status'][]).map((s, i) => {
                const statuses = ['pending', 'paid', 'preparing', 'ready', 'collected']
                const isDone = i <= statuses.indexOf(myOrder.status)
                return (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: i < 4 ? 14 : 0 }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, background: isDone ? 'var(--accent)' : 'var(--surface2)', border: `2px solid ${isDone ? 'var(--accent)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: isDone ? 'white' : 'var(--muted)' }}>
                      {isDone ? '✓' : i + 1}
                    </div>
                    <div style={{ fontSize: 14, color: isDone ? 'var(--text)' : 'var(--muted)', fontWeight: isDone ? 600 : 400 }}>{statusConfig[s]?.label}</div>
                  </div>
                )
              })}
            </div>
            {myOrder.status === 'ready' && (
              <div style={{ marginTop: 14, background: 'var(--green-bg)', border: '1px solid rgba(46,158,107,0.2)', borderRadius: 14, padding: 18, textAlign: 'center', color: 'var(--green)', fontWeight: 700, fontSize: 16 }}>
                🔔 Your food is ready! Head to the counter now.
              </div>
            )}
          </>
        )}
      </div>

      {/* FIX 5: Token Ticket Popup */}
      {showTicket && tokenData && (
        <TokenTicket
          token={tokenData.token}
          cafeteriaName={cafeteria?.name ?? 'Cafeteria'}
          items={tokenData.items}
          total={tokenData.total}
          orderId={tokenData.id}
          onClose={() => { setShowTicket(false) }}
        />
      )}
    </div>
  )
}

export default function StudentPage() {
  return (
    <Suspense fallback={<div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>Loading...</div>}>
      <StudentPageInner />
    </Suspense>
  )
}
