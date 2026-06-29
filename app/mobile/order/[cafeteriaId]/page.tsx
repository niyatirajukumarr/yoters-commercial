'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useCart } from '@/lib/hooks/useCart'
import { useUserInfo } from '@/lib/hooks/useUserInfo'
import { TokenTicket } from '@/components/TokenTicket'
import { generateSlug } from '@/lib/utils/slug'
import { ChevronLeft, Plus, Minus, QrCode, Heart, Home, ShoppingBag, User } from 'lucide-react'
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

interface Order {
  id: string
  student_name: string
  student_phone: string
  items: Array<{ name: string; price: number; quantity: number }>
  total_amount: number
  status: string
  is_shared: boolean
  created_at: string
}

type Step = 'menu' | 'details' | 'payment' | 'confirmation'
type Tab = 'home' | 'orders' | 'profile'

const CATEGORY_IMAGES: { [key: string]: string } = {
  'Biryani': 'https://qbvwcpjjattwebdzexni.supabase.co/storage/v1/object/public/menu-images/lit%20bites%20cafe/biryani.jpg',
  'Mandhi': 'https://qbvwcpjjattwebdzexni.supabase.co/storage/v1/object/public/menu-images/lit%20bites%20cafe/mandhi.jpg',
  'Combo': 'https://qbvwcpjjattwebdzexni.supabase.co/storage/v1/object/public/menu-images/lit%20bites%20cafe/combo.jpg',
  'Burger': 'https://qbvwcpjjattwebdzexni.supabase.co/storage/v1/object/public/menu-images/lit%20bites%20cafe/burger.jpg',
  'Roll': 'https://qbvwcpjjattwebdzexni.supabase.co/storage/v1/object/public/menu-images/lit%20bites%20cafe/roll.jpg',
  'Alfaham': 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=600&h=400&fit=crop',
  'Fries': 'https://qbvwcpjjattwebdzexni.supabase.co/storage/v1/object/public/menu-images/lit%20bites%20cafe/fries.jpg',
  'Drinks': 'https://qbvwcpjjattwebdzexni.supabase.co/storage/v1/object/public/menu-images/lit%20bites%20cafe/drinks.jpg',
  'Momos': 'https://qbvwcpjjattwebdzexni.supabase.co/storage/v1/object/public/menu-images/lit%20bites%20cafe/momos.jpg',
  'Coffee': 'https://qbvwcpjjattwebdzexni.supabase.co/storage/v1/object/public/menu-images/lit%20bites%20cafe/coffee.cms',
  'Shakes @99': 'https://qbvwcpjjattwebdzexni.supabase.co/storage/v1/object/public/menu-images/lit%20bites%20cafe/shakes%20@99.jpg',
  'Shakes @79': 'https://qbvwcpjjattwebdzexni.supabase.co/storage/v1/object/public/menu-images/lit%20bites%20cafe/shakes%20@79.jpeg',
  'Juice @59': 'https://qbvwcpjjattwebdzexni.supabase.co/storage/v1/object/public/menu-images/lit%20bites%20cafe/juice%20@59.webp',

  // LETHAFI categories
  'Fresh Juices': 'https://images.unsplash.com/photo-1622597468739-9b66fac1c1a2?w=600&h=400&fit=crop',
  'Mojitos': 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=600&h=400&fit=crop',
  'Hot Beverages': 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&h=400&fit=crop',
  'Fruit Milkshakes': 'https://images.unsplash.com/photo-1577805947697-89e18249d767?w=600&h=400&fit=crop',
  'Thick Shake': 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&h=400&fit=crop',
  'Sodas': 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=600&h=400&fit=crop',
  'Coffee Shake': 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&h=400&fit=crop',
  'Special Shakes': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop',
  'Ice Cream Shakes': 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68a?w=600&h=400&fit=crop',
  'Lassi': 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=600&h=400&fit=crop',
  'Delights': 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=600&h=400&fit=crop',
  'Club Sandwich': 'https://images.unsplash.com/photo-1567234669003-dce7a7a88821?w=600&h=400&fit=crop',
  'Strips': 'https://images.unsplash.com/photo-1562967914-608f82629710?w=600&h=400&fit=crop',
  'Sandwiches': 'https://images.unsplash.com/photo-1567234669003-dce7a7a88821?w=600&h=400&fit=crop',
  'Egg Bites': 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&h=400&fit=crop',
  'Loaded Fries': 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&h=400&fit=crop',
  'Rolls': 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600&h=400&fit=crop',
  'Burgers': 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600&h=400&fit=crop',
  'Buns': 'https://images.unsplash.com/photo-1550317138-10000687a72b?w=600&h=400&fit=crop',
  'Wraps': 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600&h=400&fit=crop',
  'Quick Bites': 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&h=400&fit=crop',
  'Maggies': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&h=400&fit=crop',
}

export default function CafeteriaPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const slugOrId = params.cafeteriaId as string

  // State for slug-to-ID conversion
  const [cafeteriaId, setCafeteriaId] = useState<string>('')

  // Core state
  const [cafeteria, setCafeteria] = useState<Cafeteria | null>(null)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('Meals')
  const [step, setStep] = useState<Step>((searchParams.get('step') as Step) || 'menu')
  const [orderId, setOrderId] = useState<string>('')

  // Convert slug to ID if needed
  useEffect(() => {
    const convertSlugToId = async () => {
      // Check if it's already a UUID (contains dashes and is 36 chars)
      if (slugOrId.includes('-') && slugOrId.length === 36) {
        setCafeteriaId(slugOrId)
        return
      }

      // It's a slug, fetch all cafeterias and find matching ID
      try {
        const { data } = await supabase.from('cafeterias').select('id, name')
        if (data) {
          const matching = data.find(c => generateSlug(c.name) === slugOrId)
          if (matching) {
            setCafeteriaId(matching.id)
          } else {
            console.error('Cafeteria not found for slug:', slugOrId)
            router.push('/mobile')
          }
        }
      } catch (error) {
        console.error('Error converting slug to ID:', error)
        router.push('/mobile')
      }
    }

    convertSlugToId()
  }, [slugOrId, router])

  // Tab navigation
  const [activeTab, setActiveTab] = useState<Tab>('home')

  // Orders
  const [cafeOrders, setCafeOrders] = useState<Order[]>([])

  // Payment & UI
  const { cart, addItem, updateQuantity, removeItem, clear: clearCart, total, itemCount } = useCart()
  const { isFavourite, toggleFavourite } = useFavourites()
  const { user, updateUser } = useUserInfo()
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', notes: '' })

  const [paymentState, setPaymentState] = useState<'idle' | 'waiting' | 'confirmed' | 'failed'>('idle')
  const pollRef = useRef<NodeJS.Timeout>(undefined)
  const [confirmedTotal, setConfirmedTotal] = useState(0)
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [showCartSheet, setShowCartSheet] = useState(false)

  const [showTicket, setShowTicket] = useState(false)
  const [tokenData, setTokenData] = useState<{ token: number; items: Array<{ name: string; quantity: number }>; total: number; id: string } | null>(null)

  // Fetch cafeteria & menu
  useEffect(() => {
    const fetch = async () => {
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Fetch timeout')), 60000)
        )
        const [cafRes, menuRes] = await Promise.race([
          Promise.all([
            supabase.from('cafeterias').select('*').eq('id', cafeteriaId).single(),
            supabase.from('cafeteria_menu').select('*').eq('cafeteria_id', cafeteriaId).eq('is_available', true),
          ]),
          timeoutPromise
        ]) as any
        if (cafRes.data) setCafeteria(cafRes.data as Cafeteria)
        if (menuRes.data) {
          setMenuItems(menuRes.data as MenuItem[])
          const categories = [...new Set((menuRes.data as MenuItem[]).map(m => m.category))]
          if (categories.length > 0) setSelectedCategory(categories[0])
        }
      } catch (error) {
        console.error('Cafeteria/menu fetch error:', error)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [cafeteriaId])

  // Fetch user's orders from this cafe with real-time subscription
  useEffect(() => {
    const fetch = async () => {
      if (!user?.phone) return
      try {
        const { data } = await supabase
          .from('orders')
          .select('*')
          .eq('cafeteria_id', cafeteriaId)
          .eq('student_phone', user.phone)
          .order('created_at', { ascending: false })
        if (data) setCafeOrders(data as Order[])
      } catch (error) {
        console.error('Cafe orders fetch error:', error)
      }
    }
    fetch()

    // Real-time subscription for cafe orders
    const channel = supabase.channel(`cafe-orders-${cafeteriaId}-${user?.phone}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `cafeteria_id=eq.${cafeteriaId}` }, (payload) => {
        console.log('Cafe order change detected:', payload)
        fetch() // Refetch orders on any change
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [cafeteriaId, user?.phone])

  // Populate form with user data
  useEffect(() => {
    if (user) {
      setFormData(f => ({ ...f, name: user.name || '', phone: user.phone || '', email: user.email || '' }))
    }
  }, [user])

  // Clear cart if it belongs to a different cafeteria (user switched cafeteria)
  useEffect(() => {
    if (cafeteriaId && cart && cart.cafeteriaId !== cafeteriaId) {
      clearCart()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cafeteriaId])

  // Auto-add reorder item from favourites
  useEffect(() => {
    if (!cafeteriaId || menuItems.length === 0) return
    const raw = sessionStorage.getItem('yoters_reorder')
    if (!raw) return
    try {
      const reorder = JSON.parse(raw)
      sessionStorage.removeItem('yoters_reorder')
      addItem(cafeteriaId, { menuId: reorder.menuId, name: reorder.name, price: reorder.price, quantity: reorder.quantity ?? 1 })
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cafeteriaId, menuItems.length])

  const categories = [...new Set(menuItems.map(m => m.category))]
  const cartItem = cart?.cafeteriaId === cafeteriaId ? cart.items : []
  const itemInCart = (menuId: string) => cartItem.find(i => i.menuId === menuId)

  const categoryDisplayMap: { [key: string]: string } = { 'Juice': 'Juice @59' }
  const displayCategory = (cat: string) => categoryDisplayMap[cat] || cat

  const handleAddItem = (item: MenuItem) => {
    addItem(cafeteriaId, { menuId: item.id, name: item.name, price: item.price, quantity: 1 })
  }

  const handlePlaceOrder = async () => {
    if (!formData.name || !formData.phone || !cartItem.length) {
      alert('Please fill in name and phone, and add items to cart')
      return
    }
    setIsPlacingOrder(true)
    try {
      // Add 10-second timeout to prevent infinite loading
      const orderPromise = supabase
        .from('orders')
        .insert([{ cafeteria_id: cafeteriaId, student_name: formData.name, student_phone: formData.phone, student_email: formData.email, items: cartItem, total_amount: total, queue_position: 0, status: 'pending', payment_status: 'unpaid', notes: formData.notes }])
        .select()
        .single()

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Order creation timeout')), 10000)
      )

      const { data, error } = await Promise.race([orderPromise, timeoutPromise]) as any

      if (error) {
        console.error('Order creation error:', error)
        alert('Failed to create order: ' + (error.message || 'Unknown error'))
        setIsPlacingOrder(false)
        return
      }

      if (data) {
        console.log('Order created successfully:', data.id)
        setOrderId(data.id)
        updateUser({ name: formData.name, phone: formData.phone, email: formData.email })
        setIsPlacingOrder(false)
        setStep('payment')
      } else {
        alert('Failed to create order')
        setIsPlacingOrder(false)
      }
    } catch (error) {
      console.error('Order creation failed:', error)
      alert('Error: ' + (error instanceof Error ? error.message : 'Failed to create order'))
      setIsPlacingOrder(false)
    }
  }

  const handleDeleteOrder = async (orderId: string) => {
    // Find the order to check its status
    const order = cafeOrders.find(o => o.id === orderId)

    // Only allow deletion for pending and cancelled orders
    if (order && order.status !== 'pending' && order.status !== 'cancelled') {
      alert(`Cannot delete ${order.status} orders. Vendor has already ${order.status === 'approved' ? 'accepted' : 'started preparing'} your order.`)
      return
    }

    if (!confirm('Delete this order?')) return
    try {
      const { error } = await supabase.from('orders').delete().eq('id', orderId)
      if (error) {
        console.error('Delete error:', error)
        alert('Failed to delete order: ' + error.message)
      } else {
        // Immediately update UI
        setCafeOrders(prev => prev.filter(o => o.id !== orderId))
        alert('Order deleted successfully')
      }
    } catch (error) {
      console.error('Delete failed:', error)
      alert('Failed to delete order: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  // Payment modal handler
  function handleOpenUPI() {
    const paymentUrl = `/payment?orderId=${orderId}&amount=${total}&name=${encodeURIComponent(formData.name)}`
    const isMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
      return mobileRegex.test(userAgent) || window.innerWidth < 768
    }
    if (isMobile()) {
      clearCart()
      router.push(paymentUrl)
      return
    }
    window.open(paymentUrl, 'payment_window', 'width=500,height=600')
    setConfirmedTotal(total)
    pollRef.current = setInterval(async () => {
      const { data } = await supabase.from('orders').select('status, payment_status, token_number, items, total_amount').eq('id', orderId).single()
      if (data?.status === 'paid' || data?.payment_status === 'paid') {
        clearInterval(pollRef.current)
        setConfirmedTotal(data.total_amount)
        setPaymentState('confirmed')
        clearCart()
        setTimeout(() => {
          fetchTokenData()
        }, 2000)
      }
    }, 2000)
  }

  const fetchTokenData = async () => {
    const { data } = await supabase.from('orders').select('token_number, items, total_amount').eq('id', orderId).single()
    if (data) {
      setTokenData({ token: data.token_number ?? 0, items: data.items as Array<{ name: string; quantity: number }>, total: data.total_amount, id: orderId })
      setShowTicket(true)
    }
  }

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'PAYMENT_SUCCESS') {
        clearInterval(pollRef.current)
        setPaymentState('confirmed')
        clearCart()
        setTimeout(() => fetchTokenData(), 2000)
      } else if (e.data?.type === 'PAYMENT_FAILED') {
        clearInterval(pollRef.current)
        setPaymentState('failed')
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [orderId])

  useEffect(() => () => clearInterval(pollRef.current), [])

  // Clear cart when user leaves this page
  useEffect(() => {
    return () => { clearCart() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', paddingBottom: 80, background: 'var(--bg)' }}>
        <style>{`
          @keyframes skeleton { 0% { background-color: #f0f0f0; } 50% { background-color: #e0e0e0; } 100% { background-color: #f0f0f0; } }
          .skeleton-box { animation: skeleton 1.5s infinite; border-radius: 8px; }
        `}</style>

        {/* Header Skeleton */}
        <div style={{ backgroundColor: 'white', borderBottom: '1px solid rgba(26,31,46,0.08)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="skeleton-box" style={{ width: 24, height: 24 }}></div>
          <div style={{ flex: 1 }}>
            <div className="skeleton-box" style={{ height: 20, marginBottom: 8, width: '60%' }}></div>
            <div className="skeleton-box" style={{ height: 14, width: '40%' }}></div>
          </div>
          <div className="skeleton-box" style={{ width: 28, height: 28 }}></div>
        </div>

        {/* Category Image Skeleton */}
        <div style={{ padding: '16px', marginBottom: 16 }}>
          <div className="skeleton-box" style={{ width: '100%', height: 180, marginBottom: 16 }}></div>

          {/* Menu Items Skeleton */}
          {[1, 2, 3].map(i => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div className="skeleton-box" style={{ height: 16, width: '50%' }}></div>
                <div className="skeleton-box" style={{ height: 16, width: '20%' }}></div>
              </div>
              <div className="skeleton-box" style={{ height: 12, width: '80%' }}></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!cafeteria) {
    return <div style={{ padding: 'var(--mobile-spacing)', textAlign: 'center', paddingTop: '40px' }}>Restaurant not found</div>
  }

  // RENDER BY TAB
  return (
    <div style={{ minHeight: '100vh', paddingBottom: 80 }}>
      {/* HOME TAB - MENU */}
      {activeTab === 'home' && step === 'menu' && (
        <div>
          <div style={{ backgroundColor: 'white', borderBottom: '1px solid rgba(26,31,46,0.08)', padding: '12px var(--mobile-spacing)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => { window.location.href = '/browse' }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <ChevronLeft size={24} color='var(--text)' />
            </button>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 700 }}>{cafeteria.name}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{cafeteria.location}</div>
            </div>
            <div style={{ fontSize: 28 }}>{cafeteria.image_emoji}</div>
          </div>

          <div style={{ padding: 'var(--mobile-spacing)', paddingBottom: 200 }}>
            <style>{`
              .category-card { border: 2px solid rgba(26,31,46,0.1); border-radius: 14px; background: white; margin-bottom: 16px; animation: slideUpMobile 0.5s ease both; overflow: hidden; }
              .category-header { position: relative; width: 100%; height: 180px; margin-bottom: 0; padding: 0; border-bottom: 3px solid #FFA500; display: flex; align-items: flex-start; justify-content: flex-start; }
              .category-title { font-family: 'Impact', 'Arial Black', sans-serif; font-size: 24px; font-weight: 900; color: #1a1f2e; text-transform: uppercase; letter-spacing: 1px; background: black; color: #FFA500; padding: 10px 16px; border-radius: 6px; white-space: nowrap; position: absolute; bottom: 12px; left: 12px; z-index: 10; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
              .category-image { width: 100%; height: 100%; object-fit: cover; }
              .menu-item-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px dotted rgba(26,31,46,0.1); }
              .menu-item-name { flex: 1; font-size: 14px; color: var(--text); font-weight: 500; }
              .menu-item-price { font-size: 14px; fontWeight: 700; color: var(--accent); margin-right: 12px; }
              .add-btn-small { width: 28px; height: 28px; border-radius: 6px; border: none; background: var(--accent); color: white; cursor: pointer; font-weight: 700; transition: all 0.2s; }
              @keyframes slideUpMobile { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
            `}</style>

            {categories.map((category, catIdx) => {
              if (category === 'Shakes') {
                const shakes99 = menuItems.filter(m => m.category === 'Shakes' && m.price === 99)
                const shakes79 = menuItems.filter(m => m.category === 'Shakes' && m.price === 79)
                return (
                  <div key={`shakes-${catIdx}`} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                    {shakes99.length > 0 && (
                      <div className="category-card">
                        <div className="category-header">
                          <img src={CATEGORY_IMAGES['Shakes @99']} alt="Shakes @99" className="category-image" />
                          <div className="category-title">Shakes @99</div>
                        </div>
                        <div style={{ padding: '16px' }}>
                          {shakes99.map(item => {
                            const inCart = itemInCart(item.id)
                            const fav = isFavourite(item.id)
                            return (
                              <div key={item.id} className="menu-item-row">
                                <span className="menu-item-name">{item.name}</span>
                                <span className="menu-item-price">₹{item.price}</span>
                                {inCart ? (
                                  <div style={{ display: 'flex', gap: 4 }}>
                                    <button onClick={() => updateQuantity(item.id, inCart.quantity - 1)} className="add-btn-small" style={{ background: '#ccc', color: '#333' }}>−</button>
                                    <span style={{ width: 20, textAlign: 'center', fontWeight: 700, fontSize: 12 }}>{inCart.quantity}</span>
                                    <button onClick={() => updateQuantity(item.id, inCart.quantity + 1)} className="add-btn-small">+</button>
                                  </div>
                                ) : (
                                  <button onClick={() => handleAddItem(item)} className="add-btn-small">+</button>
                                )}
                                <button onClick={() => toggleFavourite({ menuId: item.id, name: item.name, description: item.description, price: item.price, category: item.category, cafeteriaId, cafeteriaName: cafeteria?.name ?? '' })} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 0 6px', lineHeight: 1, display: 'flex', alignItems: 'center' }}>
                                  <Heart size={16} fill={fav ? '#E8334A' : 'transparent'} color={fav ? '#E8334A' : '#bbb'} />
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                    {shakes79.length > 0 && (
                      <div className="category-card">
                        <div className="category-header">
                          <img src={CATEGORY_IMAGES['Shakes @79']} alt="Shakes @79" className="category-image" />
                          <div className="category-title">Shakes @79</div>
                        </div>
                        <div style={{ padding: '16px' }}>
                          {shakes79.map(item => {
                            const inCart = itemInCart(item.id)
                            const fav = isFavourite(item.id)
                            return (
                              <div key={item.id} className="menu-item-row">
                                <span className="menu-item-name">{item.name}</span>
                                <span className="menu-item-price">₹{item.price}</span>
                                {inCart ? (
                                  <div style={{ display: 'flex', gap: 4 }}>
                                    <button onClick={() => updateQuantity(item.id, inCart.quantity - 1)} className="add-btn-small" style={{ background: '#ccc', color: '#333' }}>−</button>
                                    <span style={{ width: 20, textAlign: 'center', fontWeight: 700, fontSize: 12 }}>{inCart.quantity}</span>
                                    <button onClick={() => updateQuantity(item.id, inCart.quantity + 1)} className="add-btn-small">+</button>
                                  </div>
                                ) : (
                                  <button onClick={() => handleAddItem(item)} className="add-btn-small">+</button>
                                )}
                                <button onClick={() => toggleFavourite({ menuId: item.id, name: item.name, description: item.description, price: item.price, category: item.category, cafeteriaId, cafeteriaName: cafeteria?.name ?? '' })} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 0 6px', lineHeight: 1, display: 'flex', alignItems: 'center' }}>
                                  <Heart size={16} fill={fav ? '#E8334A' : 'transparent'} color={fav ? '#E8334A' : '#bbb'} />
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              }

              const categoryItems = menuItems.filter(m => m.category === category)
              const displayName = displayCategory(category)
              const categoryImage = CATEGORY_IMAGES[displayName] || CATEGORY_IMAGES[category] || '🍽️'

              return (
                <div key={category} className="category-card">
                  <div className="category-header">
                    {typeof categoryImage === 'string' && categoryImage.includes('http') ? (
                      <>
                        <img src={categoryImage} alt={displayName} className="category-image" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; const fb = (e.currentTarget as HTMLImageElement).nextElementSibling as HTMLElement; if (fb) fb.style.display = 'flex' }} />
                        <div style={{ width: '100%', height: '100%', background: 'var(--surface2)', display: 'none', alignItems: 'center', justifyContent: 'center', fontSize: 80 }}>
                          🍽️
                        </div>
                      </>
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80 }}>
                        {categoryImage}
                      </div>
                    )}
                    <div className="category-title">{displayName}</div>
                  </div>
                  <div style={{ padding: '16px' }}>
                    {categoryItems.map(item => {
                      const inCart = itemInCart(item.id)
                      const fav = isFavourite(item.id)
                      return (
                        <div key={item.id} className="menu-item-row">
                          <span className="menu-item-name">{item.name}</span>
                          <span className="menu-item-price">₹{item.price}</span>
                          {inCart ? (
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button onClick={() => updateQuantity(item.id, inCart.quantity - 1)} className="add-btn-small" style={{ background: '#ccc', color: '#333' }}>−</button>
                              <span style={{ width: 20, textAlign: 'center', fontWeight: 700, fontSize: 12 }}>{inCart.quantity}</span>
                              <button onClick={() => updateQuantity(item.id, inCart.quantity + 1)} className="add-btn-small">+</button>
                            </div>
                          ) : (
                            <button onClick={() => handleAddItem(item)} className="add-btn-small">+</button>
                          )}
                          <button onClick={() => toggleFavourite({ menuId: item.id, name: item.name, description: item.description, price: item.price, category: item.category, cafeteriaId, cafeteriaName: cafeteria?.name ?? '' })} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 0 6px', lineHeight: 1, display: 'flex', alignItems: 'center' }}>
                            <Heart size={16} fill={fav ? '#E8334A' : 'transparent'} color={fav ? '#E8334A' : '#bbb'} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Cart Sheet */}
          {showCartSheet && (
            <>
              <div onClick={() => setShowCartSheet(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 299 }} />
              <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 300, background: 'white', borderRadius: '20px 20px 0 0', padding: '20px 16px 36px', maxHeight: '72vh', overflowY: 'auto', boxShadow: '0 -8px 40px rgba(0,0,0,0.18)', animation: 'slideUpMobile 0.3s ease' }}>
                <div style={{ width: 40, height: 4, background: '#ddd', borderRadius: 2, margin: '0 auto 18px' }} />
                <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Your Cart 🛒</div>
                {cartItem.map(item => (
                  <div key={item.menuId} style={{ display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(26,31,46,0.06)' }}>
                    <div style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{item.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', minWidth: 42, textAlign: 'right' }}>₹{item.price * item.quantity}</span>
                      <button onClick={() => updateQuantity(item.menuId, item.quantity - 1)} style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid #ddd', background: '#f5f5f5', fontSize: 16, cursor: 'pointer' }}>−</button>
                      <span style={{ fontSize: 14, fontWeight: 700, minWidth: 16, textAlign: 'center' }}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.menuId, item.quantity + 1)} style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: 'var(--accent)', color: 'white', fontSize: 16, cursor: 'pointer' }}>+</button>
                      <button onClick={() => removeItem(item.menuId)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', fontSize: 18, padding: '0 2px' }}>✕</button>
                    </div>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0 16px', fontWeight: 700, fontSize: 17 }}>
                  <span>Total</span><span style={{ color: 'var(--accent)' }}>₹{total}</span>
                </div>
                <button onClick={() => { setShowCartSheet(false); setStep('details') }} style={{ width: '100%', padding: 16, background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                  Proceed to Checkout →
                </button>
              </div>
            </>
          )}

          {/* Floating Cart FAB */}
          {itemCount > 0 && (
            <button onClick={() => setShowCartSheet(true)} style={{ position: 'fixed', bottom: 90, right: 20, zIndex: 200, background: 'linear-gradient(135deg,#E8334A,#c0202e)', color: 'white', border: 'none', borderRadius: 50, padding: '13px 20px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', boxShadow: '0 6px 24px rgba(232,51,74,0.5)', fontFamily: 'var(--font-body)' }}>
              <div style={{ position: 'relative' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                <span style={{ position: 'absolute', top: -8, right: -8, background: 'white', color: '#E8334A', borderRadius: '50%', width: 18, height: 18, fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{itemCount}</span>
              </div>
              <div>
                <div style={{ fontSize: 11, opacity: 0.85 }}>{itemCount} item{itemCount !== 1 ? 's' : ''}</div>
                <div style={{ fontSize: 15, fontWeight: 800 }}>₹{total}</div>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, opacity: 0.9 }}>View Cart →</span>
            </button>
          )}
        </div>
      )}

      {/* ORDERS TAB */}
      {activeTab === 'orders' && (
        <div>
          <div style={{ backgroundColor: 'white', borderBottom: '1px solid rgba(26,31,46,0.08)', padding: '12px 16px' }}>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700 }}>Your Orders from {cafeteria.name}</div>
          </div>
          <div style={{ padding: '16px' }}>
            {cafeOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>No orders yet. Start flexing! 💅</div>
            ) : (
              cafeOrders.map(order => (
                <div key={order.id} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>₹{order.total_amount}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                        {new Date(order.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <div style={{ fontSize: 11, background: order.status === 'collected' ? '#edfaf3' : '#fff8ec', color: order.status === 'collected' ? '#2e9e6b' : '#d4821a', padding: '4px 8px', borderRadius: 4 }}>
                        {order.status}
                      </div>
                      {(order.status === 'pending' || order.status === 'cancelled') && (
                        <button
                          onClick={() => handleDeleteOrder(order.id)}
                          style={{ padding: '6px 10px', background: '#dc2626', color: 'white', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                          🗑️ Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* PROFILE TAB */}
      {activeTab === 'profile' && (
        <div>
          <div style={{ backgroundColor: 'white', borderBottom: '1px solid rgba(26,31,46,0.08)', padding: '12px 16px' }}>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700 }}>Your Profile</div>
          </div>
          <div style={{ padding: '16px' }}>
            <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Name</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>{user?.name || 'Not set'}</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Phone</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>{user?.phone || 'Not set'}</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Email</div>
              <div style={{ fontSize: 13, color: 'var(--text2)' }}>{user?.email || 'Not set'}</div>
            </div>
          </div>
        </div>
      )}

      {/* OTHER STEPS - DETAILS, PAYMENT, CONFIRMATION */}
      {step === 'details' && (
        <div style={{ padding: 'var(--mobile-spacing)', paddingBottom: 100 }}>
          {/* Order Details Form */}
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Order Details</h3>
          <input
            type="text"
            placeholder="Full Name"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            style={{ width: '100%', padding: '12px', marginBottom: 12, border: '1px solid var(--border)', borderRadius: 8, fontSize: 14 }}
          />
          <input
            type="tel"
            placeholder="Phone Number"
            value={formData.phone}
            onChange={e => setFormData({ ...formData, phone: e.target.value })}
            style={{ width: '100%', padding: '12px', marginBottom: 12, border: '1px solid var(--border)', borderRadius: 8, fontSize: 14 }}
          />
          <input
            type="email"
            placeholder="Email (Optional)"
            value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
            style={{ width: '100%', padding: '12px', marginBottom: 12, border: '1px solid var(--border)', borderRadius: 8, fontSize: 14 }}
          />
          <textarea
            placeholder="Special requests..."
            value={formData.notes}
            onChange={e => setFormData({ ...formData, notes: e.target.value })}
            style={{ width: '100%', padding: '12px', marginBottom: 24, border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, minHeight: 80 }}
          />

          {/* Cart Preview with Images and Controls */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Your Order Preview</h3>
            {cartItem.map(item => {
              const menuItem = menuItems.find(m => m.id === item.menuId)
              return (
                <div key={item.menuId} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: 12, marginBottom: 10, display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ width: 60, height: 60, borderRadius: 8, background: 'var(--surface2)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
                    🍱
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{item.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>₹{item.price}</div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <button
                        onClick={() => updateQuantity(item.menuId, item.quantity - 1)}
                        style={{ width: 24, height: 24, borderRadius: 4, background: '#ccc', color: '#333', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12 }}
                      >
                        −
                      </button>
                      <span style={{ width: 24, textAlign: 'center', fontWeight: 700, fontSize: 12 }}>{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.menuId, item.quantity + 1)}
                        style={{ width: 24, height: 24, borderRadius: 4, background: 'var(--accent)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12 }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>₹{item.price * item.quantity}</div>
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
              <span>Total</span>
              <span style={{ color: 'var(--accent)' }}>₹{total}</span>
            </div>
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={!formData.name || !formData.phone || isPlacingOrder}
            style={{ width: '100%', padding: '14px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: !formData.name || !formData.phone || isPlacingOrder ? 'not-allowed' : 'pointer', opacity: !formData.name || !formData.phone || isPlacingOrder ? 0.6 : 1 }}
          >
            {isPlacingOrder ? '⏳ Processing...' : 'Proceed to Payment'}
          </button>
        </div>
      )}

      {step === 'payment' && paymentState === 'idle' && (
        <div style={{ padding: 'var(--mobile-spacing)', textAlign: 'center', paddingTop: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>💳</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Complete Payment</div>
          <div style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 32 }}>Amount: ₹{total}</div>
          <button
            onClick={handleOpenUPI}
            style={{ width: '100%', padding: '14px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
          >
            Pay Now
          </button>
        </div>
      )}

      {step === 'confirmation' && showTicket && tokenData && (
        <div style={{ padding: 'var(--mobile-spacing)', textAlign: 'center', paddingTop: 20 }}>
          <TokenTicket token={tokenData.token} items={tokenData.items} total={tokenData.total} orderId={tokenData.id} cafeteriaName={cafeteria.name} onClose={() => setShowTicket(false)} />
        </div>
      )}

      {/* TAB NAVIGATION */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: 70, background: 'white', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-around', alignItems: 'center', zIndex: 100 }}>
        <button
          onClick={() => { window.location.href = '/browse' }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 11, fontWeight: 600 }}
        >
          <Home size={22} /> Home
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: activeTab === 'orders' ? 'var(--accent)' : 'var(--muted)', fontSize: 11, fontWeight: 600 }}
        >
          <ShoppingBag size={22} /> Orders
        </button>
      </div>
    </div>
  )
}
