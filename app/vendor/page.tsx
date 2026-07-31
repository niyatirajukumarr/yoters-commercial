'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Cafeteria, MenuItem, Order } from '@/lib/types'
import { stagger, staggerItem, hoverLift, hoverScale, scaleIn } from '@/lib/motion'
import { withTimeout } from '@/lib/utils/withTimeout'

type Tab = 'orders' | 'queue' | 'menu' | 'today' | 'settings'

// Mirrors the payload from /api/vendor/summary.
type RangeSummary = {
  orders: number
  completed: number
  active: number
  cancelled: number
  revenue: number
  lost: number
  received: number
  awaiting: number
  refunded: number
}
type VendorSummary = { today: RangeSummary; allTime: RangeSummary; dayStart: string }

export default function VendorDashboard() {
  const router = useRouter()
  const [cafeteria, setCafeteria] = useState<Cafeteria | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [tab, setTab] = useState<Tab>('orders')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [msg, setMsg] = useState('')
  const [waitOverride, setWaitOverride] = useState('')
  const [menuForm, setMenuForm] = useState({ name: '', description: '', price: '', category: 'Main', stock_quantity: '', is_veg: true, image_file: null as File | null })
  const [isOpen, setIsOpen] = useState(true)
  const [editingItem, setEditingItem] = useState<any | null>(null)
  const [editForm, setEditForm] = useState({ name: '', description: '', price: '', category: 'Main', stock_quantity: '', is_veg: true })
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [approvalModal, setApprovalModal] = useState<Order | null>(null)
  const [denialReason, setDenialReason] = useState('')
  const [approveLoading, setApproveLoading] = useState(false)
  const [prepTime, setPrepTime] = useState('10')
  const [remindingOrderId, setRemindingOrderId] = useState<string | null>(null)
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null)

  const [newOrderAlert, setNewOrderAlert] = useState<string | null>(null)
  const prevOrderCount = useState({ count: 0 })
  const alertSoundIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Totals come from the server, not from the loaded order list — the list is
  // deliberately today-only (the queue would be unusable otherwise), so all-time
  // figures can't be derived from it.
  const [summary, setSummary] = useState<VendorSummary | null>(null)
  const [summaryRange, setSummaryRange] = useState<'today' | 'allTime'>('today')
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [ordersCache, setOrdersCache] = useState<Record<string, Order[]>>({})
  const [loadingDate, setLoadingDate] = useState(false)

  const fetchSummary = useCallback(async (cafId: string, date?: string) => {
    try {
      const { data: { session } } = await withTimeout(supabase.auth.getSession(), 8000, 'Session check timed out')
      if (!session?.access_token) return
      const url = date
        ? `/api/vendor/summary?cafeteriaId=${cafId}&date=${date}`
        : `/api/vendor/summary?cafeteriaId=${cafId}`
      const res = await withTimeout(
        fetch(url, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }),
        8000,
        'Summary fetch timed out'
      )
      if (!res.ok) return
      setSummary(await res.json())
    } catch (error) {
      console.error('Vendor summary fetch error:', error)
    }
  }, [])

  const fetchOrders = useCallback(async (cafId: string, notify = false, date?: string) => {
    try {
      const { data: { session } } = await withTimeout(supabase.auth.getSession(), 8000, 'Session check timed out')
      if (!session?.access_token) return
      const url = date
        ? `/api/vendor/orders?cafeteriaId=${cafId}&date=${date}`
        : `/api/vendor/orders?cafeteriaId=${cafId}`
      const res = await withTimeout(
        fetch(url, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }),
        8000,
        'Orders fetch timed out'
      )
      if (!res.ok) return
      const json = await res.json()
      const data = json.orders
      if (data) {
        if (notify && data.length > prevOrderCount[0].count) {
          const newest = data[data.length - 1]
          setNewOrderAlert(`🔔 New order! ${newest?.items?.[0]?.name ?? 'Item'} — ₹${newest?.total_amount}`)

          // Stop any existing alert sound
          if (alertSoundIntervalRef.current) {
            clearInterval(alertSoundIntervalRef.current)
          }

          // Play alert sound file
          const playAlertSound = () => {
            try {
              const audio = new Audio('/sound beat.mp3')
              audio.volume = 1.0
              audio.play().catch(err => console.log('Audio play error:', err))
            } catch {}
          }

          // Play sound immediately and repeat every 2s
          playAlertSound()
          alertSoundIntervalRef.current = setInterval(playAlertSound, 2000)
        }
        prevOrderCount[0].count = data.length
        setOrders(data as Order[])

        // Cache the orders by date if a date was specified
        if (date) {
          setOrdersCache(prev => ({ ...prev, [date]: data as Order[] }))
        }
      }
    } catch (error) {
      console.error('Vendor orders fetch error:', error)
    }
  }, [])

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null
    let poll: ReturnType<typeof setInterval> | null = null
    async function init() {
      try {
        const { data: { session } } = await withTimeout(supabase.auth.getSession(), 8000, 'Session check timed out')
        if (!session) { router.push('/vendor/login'); return }
        const user = session.user
        const { data: caf } = await withTimeout(
          supabase.from('cafeterias').select('*').eq('vendor_email', user.email).single(),
          8000,
          'Cafeteria fetch timed out'
        ) as any
        if (!caf) { router.push('/vendor/login'); return }
        setCafeteria(caf); setIsOpen(caf.is_open); fetchOrders(caf.id)
        const { data: menu } = await withTimeout(
          supabase.from('cafeteria_menu').select('*').eq('cafeteria_id', caf.id).order('category'),
          8000,
          'Menu fetch timed out'
        ) as any
        if (menu) setMenuItems(menu)

        const fetchMenuItems = async (cafId: string) => {
          const { data } = await supabase.from('cafeteria_menu').select('*').eq('cafeteria_id', cafId).order('category')
          if (data) setMenuItems(data)
        }
        channel = supabase.channel('vendor-realtime-' + caf.id)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `cafeteria_id=eq.${caf.id}` }, () => fetchOrders(caf.id, true))
          .on('postgres_changes', { event: '*', schema: 'public', table: 'cafeteria_menu', filter: `cafeteria_id=eq.${caf.id}` }, () => fetchMenuItems(caf.id))
          .subscribe()

        // Fallback poll every 5s, but only fetch today's orders to avoid overwriting filtered date views
        poll = setInterval(() => {
          const today = new Date().toISOString().split('T')[0]
          // Only poll today's orders in the orders tab
          if (tab === 'orders') {
            fetchOrders(caf.id)
          }
        }, 5_000)
      } catch (error) {
        console.error('Vendor dashboard init error:', error)
      } finally {
        setLoading(false)
      }
    }
    init()
    return () => {
      channel?.unsubscribe()
      if (poll) clearInterval(poll)
      if (alertSoundIntervalRef.current) clearInterval(alertSoundIntervalRef.current)
    }
  }, [router, fetchOrders, tab])

  // Fetch orders and summary for selected date when in "today" tab or date changes
  useEffect(() => {
    if (tab !== 'today' || !cafeteria) return
    const isToday = selectedDate === new Date().toISOString().split('T')[0]

    if (ordersCache[selectedDate]) {
      setOrders(ordersCache[selectedDate])
    } else {
      setLoadingDate(true)
      fetchOrders(cafeteria.id, false, selectedDate).finally(() => setLoadingDate(false))
    }

    // Fetch summary for selected date
    fetchSummary(cafeteria.id, selectedDate)
  }, [selectedDate, tab, cafeteria, ordersCache, fetchOrders, fetchSummary])

  // Refresh the totals when an order's money or fulfilment state actually
  // changes — keyed on a signature rather than the array, since the 5s poll
  // replaces `orders` with a new array every tick even when nothing moved.
  const orderStateSignature = orders
    .map(o => `${o.id}:${o.status}:${(o as { payment_status?: string }).payment_status ?? ''}:${o.total_amount}`)
    .join('|')
  useEffect(() => {
    if (cafeteria) fetchSummary(cafeteria.id)
  }, [cafeteria, orderStateSignature, fetchSummary])

  async function updateOrderStatus(orderId: string, status: Order['status']) {
    setActionLoading(orderId)
    const update: Partial<Order> = { status }
    if (status === 'ready') update.ready_at = new Date().toISOString()
    if (status === 'collected') update.collected_at = new Date().toISOString()
    if (status === 'preparing') update.preparing_started_at = new Date().toISOString()
    await supabase.from('orders').update(update).eq('id', orderId)
    if (status === 'preparing') {
      const order = orders.find(o => o.id === orderId)
      if (order?.prep_time_minutes) {
        setMsg(`⏱️ Timer started! You have ${order.prep_time_minutes} min to complete this order`)
        setTimeout(() => setMsg(''), 4000)
      }
    }
    if (cafeteria) fetchOrders(cafeteria.id)
    setActionLoading(null)
  }

  async function toggleOpen() {
    if (!cafeteria) return
    const newState = !isOpen
    await supabase.from('cafeterias').update({ is_open: newState }).eq('id', cafeteria.id)
    setIsOpen(newState)
  }

  async function updateWait() {
    if (!cafeteria || !waitOverride) return
    await supabase.from('cafeteria_queues').update({ avg_wait_mins: parseInt(waitOverride), updated_at: new Date().toISOString() }).eq('cafeteria_id', cafeteria.id)
    setWaitOverride(''); setMsg('✅ Wait time updated'); setTimeout(() => setMsg(''), 2000)
  }


  async function toggleMenuItem(id: string, current: boolean) {
    await supabase.from('cafeteria_menu').update({ is_available: !current }).eq('id', id)
    setMenuItems(prev => prev.map(i => i.id === id ? { ...i, is_available: !current } : i))
  }

  async function uploadMenuItemImage(file: File): Promise<string | null> {
    if (!cafeteria) return null
    try {
      setUploading(true)
      const fileExt = file.name.split('.').pop()
      const fileName = `${cafeteria.id}-${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('menu-item-images').upload(fileName, file, { cacheControl: '3600', upsert: false })
      if (uploadError) { setMsg('Upload failed: ' + uploadError.message); return null }
      const { data } = supabase.storage.from('menu-item-images').getPublicUrl(fileName)
      return data.publicUrl
    } catch (err: any) {
      setMsg('Image upload error: ' + err.message)
      return null
    } finally {
      setUploading(false)
    }
  }

  async function updateMenuItem() {
    if (!editingItem || !editForm.name || !editForm.price) { setMsg('Name and price required.'); return }
    let imageUrl = editingItem.image_url
    if (menuForm.image_file) {
      imageUrl = await uploadMenuItemImage(menuForm.image_file)
      if (!imageUrl) return
    }
    const { error } = await supabase.from('cafeteria_menu').update({
      name: editForm.name,
      description: editForm.description || null,
      price: parseFloat(editForm.price),
      category: editForm.category,
      stock_quantity: editForm.stock_quantity ? parseInt(editForm.stock_quantity) : null,
      is_veg: editForm.is_veg,
      image_url: imageUrl
    }).eq('id', editingItem.id)
    if (error) { setMsg('Error: ' + error.message); return }
    setMsg('✅ Item updated!')
    setEditingItem(null)
    setMenuForm({ name: '', description: '', price: '', category: 'Main', stock_quantity: '', is_veg: true, image_file: null })
    setImagePreview(null)
    if (cafeteria) {
      const { data } = await supabase.from('cafeteria_menu').select('*').eq('cafeteria_id', cafeteria.id).order('category')
      if (data) setMenuItems(data)
    }
    setTimeout(() => setMsg(''), 2000)
  }

  async function deleteMenuItem(id: string) {
    const { error } = await supabase.from('cafeteria_menu').delete().eq('id', id)
    if (error) { setMsg('Error: ' + error.message); return }
    setMsg('✅ Item deleted!')
    setDeletingId(null)
    const { data } = await supabase.from('cafeteria_menu').select('*').eq('cafeteria_id', cafeteria?.id).order('category')
    if (data) setMenuItems(data)
    setTimeout(() => setMsg(''), 2000)
  }

  async function addMenuItem() {
    if (!cafeteria || !menuForm.name || !menuForm.price) { setMsg('Name and price required.'); return }
    let imageUrl: string | null = null
    if (menuForm.image_file) {
      imageUrl = await uploadMenuItemImage(menuForm.image_file)
      if (!imageUrl) return
    }
    const { error } = await supabase.from('cafeteria_menu').insert({
      cafeteria_id: cafeteria.id,
      name: menuForm.name,
      description: menuForm.description || null,
      price: parseFloat(menuForm.price),
      category: menuForm.category,
      stock_quantity: menuForm.stock_quantity ? parseInt(menuForm.stock_quantity) : null,
      is_veg: menuForm.is_veg,
      image_url: imageUrl
    })
    if (error) { setMsg('Error: ' + error.message); return }
    setMsg('✅ Item added!')
    setMenuForm({ name: '', description: '', price: '', category: 'Main', stock_quantity: '', is_veg: true, image_file: null })
    setImagePreview(null)
    const { data } = await supabase.from('cafeteria_menu').select('*').eq('cafeteria_id', cafeteria.id).order('category')
    if (data) setMenuItems(data)
    setTimeout(() => setMsg(''), 2000)
  }

  async function logout() { await supabase.auth.signOut(); router.push('/vendor/login') }

  async function approveOrder(order: Order) {
    if (!cafeteria || !prepTime) {
      setMsg('Please enter preparation time')
      return
    }
    setApproveLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return

      const response = await fetch('/api/vendor/approve-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          orderId: order.id,
          prepTimeMinutes: parseInt(prepTime),
        }),
      })
      const result = await response.json()
      if (response.ok) {
        // Stop alert sound when order is approved
        if (alertSoundIntervalRef.current) {
          clearInterval(alertSoundIntervalRef.current)
          alertSoundIntervalRef.current = null
        }
        setMsg('✅ Order approved! Student notified of prep time.')
        setApprovalModal(null)
        setPrepTime('10')
        if (cafeteria) fetchOrders(cafeteria.id)
      } else {
        setMsg(`Error: ${result.error}`)
      }
    } catch (err: any) {
      setMsg(`Error: ${err.message}`)
    } finally {
      setApproveLoading(false)
    }
  }

  async function denyOrder(order: Order) {
    if (!cafeteria || !denialReason.trim()) {
      setMsg('Please provide a reason for denial')
      return
    }
    setApproveLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return

      const response = await fetch('/api/vendor/deny-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          orderId: order.id,
          denialReason: denialReason.trim(),
        }),
      })
      const result = await response.json()
      if (response.ok) {
        setMsg('❌ Order denied. Student has been notified and refund initiated.')
        setApprovalModal(null)
        setDenialReason('')
        if (cafeteria) fetchOrders(cafeteria.id)
      } else {
        setMsg(`Error: ${result.error}`)
      }
    } catch (err: any) {
      setMsg(`Error: ${err.message}`)
    } finally {
      setApproveLoading(false)
    }
  }

  async function remindPayment(order: Order) {
    setRemindingOrderId(order.id)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return
      const response = await fetch('/api/vendor/remind-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ orderId: order.id }),
      })
      const result = await response.json()
      setMsg(response.ok ? '🔔 Payment reminder sent.' : `Error: ${result.error}`)
    } catch (err: any) {
      setMsg(`Error: ${err.message}`)
    } finally {
      setRemindingOrderId(null)
      setTimeout(() => setMsg(''), 2000)
    }
  }

  // Deletion is only allowed once an order is 'collected' or 'cancelled'
  // (RLS-enforced — supabase/migrations/20260726_customer_collected_and_vendor_delete.sql,
  // extended by 20260727_unpaid_order_cancel_flow.sql). .select() so a
  // silently-blocked delete (0 rows) doesn't get mistaken for success and
  // desync local state from the DB.
  async function deleteOrder(order: Order) {
    if (!confirm('Delete this order permanently?')) return
    setDeletingOrderId(order.id)
    try {
      const { data, error } = await supabase.from('orders').delete().eq('id', order.id).select()
      if (!error && data && data.length > 0) {
        setOrders(prev => prev.filter(o => o.id !== order.id))
      } else {
        setMsg('Could not delete this order. Please try again.')
        setTimeout(() => setMsg(''), 2000)
      }
    } finally {
      setDeletingOrderId(null)
    }
  }

  const statusColors: Record<string, string> = {
    pending: '#d4821a', paid: 'var(--accent)', preparing: '#7c5cfc', ready: 'var(--green)', collected: 'var(--muted)'
  }

  const inp = { width: '100%', padding: '10px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 14, color: 'var(--text)' }
  const lbl = { fontSize: 11, color: 'var(--text2)', marginBottom: 5, display: 'block' as const, fontWeight: 600 as const, textTransform: 'uppercase' as const, letterSpacing: 1 }

  const pendingCount = orders.filter(o => o.status === 'pending_approval').length
  const preparingCount = orders.filter(o => o.status === 'preparing').length
  const readyCount = orders.filter(o => o.status === 'ready').length
  const todayRevenue = orders.filter(o => o.status === 'collected').reduce((s, o) => s + o.total_amount, 0)

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>
      Loading dashboard...
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* New Order Alert Banner */}
      <AnimatePresence>
        {newOrderAlert && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999, background: '#2e9e6b', color: 'white', padding: '14px 20px', textAlign: 'center', fontWeight: 700, fontSize: 15, boxShadow: '0 4px 16px rgba(46,158,107,0.4)' }}
          >
            {newOrderAlert}
          </motion.div>
        )}
      </AnimatePresence>
      <style>{`
        .v-nav { display:flex; align-items:center; justify-content:space-between; padding:12px 24px; border-bottom:1px solid var(--border); background:rgba(253,248,245,0.95); backdrop-filter:blur(12px); position:sticky; top:0; z-index:100; }
        .v-body { display:flex; flex:1; }
        .v-sidebar { width:220px; border-right:1px solid var(--border); padding:20px 14px; background:var(--bg2); flex-shrink:0; }
        .v-main { flex:1; padding:24px 28px; overflow:auto; }
        .v-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:24px; }
        .v-tab-btn { width:100%; padding:10px 12px; border-radius:10px; border:none; text-align:left; font-size:14px; cursor:pointer; margin-bottom:4px; transition:all 0.15s; }
        .v-bottom-nav { display:none; }
        .order-card { background:var(--surface); border:1px solid var(--border); border-radius:14px; padding:16px 18px; margin-bottom:10px; }
        .order-actions { display:flex; gap:8px; flex-wrap:wrap; margin-top:12px; }
        .menu-grid-v { display:grid; grid-template-columns:1fr 1fr; gap:24px; }

        @media (max-width: 768px) {
          .v-nav { padding:10px 16px; }
          .v-sidebar { display:none; }
          .v-main { padding:16px 16px 80px; }
          .v-stats { grid-template-columns:repeat(2,1fr); gap:10px; }
          .v-bottom-nav {
            display:flex; position:fixed; bottom:0; left:0; right:0;
            background:rgba(253,248,245,0.97); backdrop-filter:blur(12px);
            border-top:1px solid var(--border); z-index:200;
            padding:8px 0 env(safe-area-inset-bottom,8px);
          }
          .v-bottom-nav-item { flex:1; display:flex; flex-direction:column; align-items:center; gap:2px; font-size:10px; font-weight:600; color:var(--muted); cursor:pointer; padding:4px 0; background:none; border:none; font-family:var(--font-body); }
          .v-bottom-nav-item.active { color:var(--accent); }
          .v-bottom-nav-item span:first-child { font-size:18px; }
          .order-header { flex-direction:column !important; align-items:flex-start !important; }
          .order-meta { flex-wrap:wrap; }
          .order-actions { justify-content:flex-start; }
          .menu-grid-v { grid-template-columns:1fr; }
          .menu-item-buttons { gap:2px !important; }
          .menu-item-buttons button { padding:3px 6px !important; font-size:9px !important; }
          .v-nav-logo-sub { display:none; }
          .v-open-label { display:none; }
          .stat-card-v { padding:14px 12px !important; }
          .stat-val-v { font-size:22px !important; }
        }
      `}</style>

      {/* NAV */}
      <nav className="v-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/logo.png" alt="Yoters" style={{ width: 40, height: 40, objectFit: 'contain' }} onError={e => (e.currentTarget.style.display = 'none')} />
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
              <span style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>Yoters</span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase' }}>Vendor</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="v-open-label" style={{ fontSize: 13, color: 'var(--muted)' }}>Restaurant:</span>
          <motion.button {...hoverScale} onClick={toggleOpen} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: isOpen ? 'rgba(46,158,107,0.1)' : 'rgba(232,51,74,0.1)', color: isOpen ? 'var(--green)' : 'var(--red)', border: `1px solid ${isOpen ? 'rgba(46,158,107,0.25)' : 'rgba(232,51,74,0.25)'}` }}>
            {isOpen ? '🟢 Open' : '🔴 Closed'}
          </motion.button>
          <motion.button {...hoverScale} onClick={logout} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border2)', background: 'var(--surface)', color: 'var(--text2)', fontSize: 12, cursor: 'pointer' }}>Out</motion.button>
        </div>
      </nav>

      <div className="v-body">
        {/* DESKTOP SIDEBAR */}
        <div className="v-sidebar">
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 3, color: 'var(--text)' }}>{cafeteria?.image_emoji} {cafeteria?.name}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 20 }}>{cafeteria?.location}</div>
          {([['orders', '📋 Orders'], ['queue', '👥 Queue'], ['today', '📊 Today'], ['menu', '🍱 Menu'], ['settings', '⚙️ Settings']] as [Tab, string][]).map(([t, label]) => (
            <motion.button key={t} whileHover={{ x: 2 }} whileTap={{ scale: 0.97 }} onClick={() => setTab(t)} className="v-tab-btn" style={{ background: tab === t ? 'var(--accent-light)' : 'transparent', color: tab === t ? 'var(--text)' : 'var(--text2)', fontWeight: tab === t ? 600 : 400, borderLeft: `2px solid ${tab === t ? 'var(--accent)' : 'transparent'}` }}>{label}</motion.button>
          ))}
        </div>

        {/* MAIN */}
        <div className="v-main">
          {/* Stats */}
          <motion.div className="v-stats" initial="hidden" animate="visible" variants={stagger}>
            {[
              { label: 'New Orders', val: pendingCount, color: '#d4821a' },
              { label: 'Preparing', val: preparingCount, color: '#7c5cfc' },
              { label: 'Ready', val: readyCount, color: 'var(--green)' },
              { label: "Revenue", val: `₹${todayRevenue}`, color: 'var(--accent)' },
            ].map((s, i) => (
              <motion.div key={i} className="stat-card-v" variants={staggerItem} {...hoverLift} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 16px' }}>
                <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>{s.label}</div>
                <div className="stat-val-v" style={{ fontFamily: 'var(--font-head)', fontSize: 26, fontWeight: 800, color: s.color }}>{s.val}</div>
              </motion.div>
            ))}
          </motion.div>

          {msg && <div style={{ background: 'var(--green-bg)', border: '1px solid rgba(46,158,107,0.2)', borderRadius: 8, padding: '10px 16px', fontSize: 13, color: 'var(--green)', marginBottom: 16 }}>{msg}</div>}

          {/* ORDERS */}
          {tab === 'orders' && (() => {
            const activeOrders = orders.filter(o => !['collected', 'cancelled'].includes(o.status))

            const statusConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
              pending:   { label: '💳 Payment Pending',   color: 'var(--red)', bg: 'var(--red-bg)',      border: 'var(--red)' },
              paid:      { label: '⏳ Awaiting Approval', color: '#d4821a', bg: 'rgba(212,130,26,0.08)', border: '#d4821a' },
              approved:  { label: '✓ Accepted',           color: '#2563eb', bg: 'rgba(37,99,235,0.06)',  border: '#2563eb' },
              preparing: { label: '👨‍🍳 Preparing',         color: '#7c5cfc', bg: 'rgba(124,92,252,0.07)', border: '#7c5cfc' },
              ready:     { label: '🔔 Ready for Pickup',  color: 'var(--green)', bg: 'var(--green-bg)',   border: 'var(--green)' },
            }

            if (activeOrders.length === 0) return (
              <div style={{ textAlign: 'center', padding: 60, background: 'var(--surface)', borderRadius: 16, color: 'var(--muted)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>🎉</div>
                <div style={{ fontWeight: 600 }}>No active orders right now</div>
              </div>
            )

            return (
              <AnimatePresence initial={false}>
                <motion.div layout style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {activeOrders.map(order => {
                    const cfg = statusConfig[order.status]
                    return (
                      <motion.div
                        key={order.id}
                        layout
                        initial={{ opacity: 0, y: -16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.25 }}
                        className="order-card"
                        style={{ borderLeft: `4px solid ${cfg?.border ?? 'var(--border)'}` }}
                      >
                        {/* Top row: order token + customer name + amount */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                            <div style={{
                              fontFamily: 'var(--font-head)',
                              fontSize: 20,
                              fontWeight: 900,
                              color: cfg?.color,
                              background: cfg?.bg,
                              border: `1.5px solid ${cfg?.border}`,
                              borderRadius: 8,
                              padding: '3px 12px',
                              flexShrink: 0,
                              minWidth: 50,
                              textAlign: 'center'
                            }}>
                              #{order.queue_position}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{order.student_name}</div>
                              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>📱 {order.student_phone}</div>
                            </div>
                          </div>
                          <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 800, color: 'var(--accent)', flexShrink: 0 }}>₹{order.total_amount}</div>
                        </div>

                        {/* Status badge */}
                        <div style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: cfg?.color,
                          background: cfg?.bg,
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: 16,
                          marginBottom: 10
                        }}>
                          {cfg?.label}
                        </div>

                        {/* Items */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                          {(order.items as { name: string; quantity: number }[]).map((item, i) => (
                            <span key={i} style={{ background: 'var(--surface2)', borderRadius: 6, padding: '3px 10px', fontSize: 12, color: 'var(--text2)' }}>
                              {item.name} ×{item.quantity}
                            </span>
                          ))}
                        </div>

                        {/* Delivery address + contact */}
                        {order.order_type === 'delivery' && order.delivery_address && (
                          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#92400e', marginBottom: 6 }}>🛵 DELIVERY ORDER</div>
                            <div style={{ fontSize: 13, color: '#78350f', marginBottom: 8, lineHeight: 1.5 }}>📍 {order.delivery_address}</div>
                            <a
                              href={
                                order.delivery_latitude != null && order.delivery_longitude != null
                                  ? `https://www.google.com/maps/search/?api=1&query=${order.delivery_latitude},${order.delivery_longitude}`
                                  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.delivery_address)}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: '#1a73e8', background: '#e8f0fe', padding: '5px 10px', borderRadius: 6, textDecoration: 'none', marginBottom: 8 }}
                            >
                              🗺️ Open in Google Maps ↗
                            </a>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              <a href={`tel:${order.student_phone}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: '#059669', background: '#d1fae5', padding: '5px 10px', borderRadius: 6, textDecoration: 'none' }}>
                                📞 Call {order.student_name}
                              </a>
                              {order.student_email && (
                                <a href={`mailto:${order.student_email}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: '#6d28d9', background: '#ede9fe', padding: '5px 10px', borderRadius: 6, textDecoration: 'none' }}>
                                  ✉️ Email
                                </a>
                              )}
                            </div>
                          </div>
                        )}
                        {order.order_type === 'takeaway' && (
                          <div style={{ display: 'inline-block', fontSize: 12, fontWeight: 700, color: '#1e40af', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6, padding: '4px 10px', marginBottom: 10 }}>
                            🥡 TAKEAWAY ORDER
                          </div>
                        )}
                        {order.order_type === 'dine_in' && (
                          <div style={{ display: 'inline-block', fontSize: 12, fontWeight: 700, color: '#374151', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 6, padding: '4px 10px', marginBottom: 10 }}>
                            🍽️ DINE-IN ORDER
                          </div>
                        )}

                        {/* Prep time if set */}
                        {order.prep_time_minutes && order.status === 'pending_approval' && (
                          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>⏱️ Prep time: {order.prep_time_minutes} min</div>
                        )}

                        {/* Customer says they've already collected it — nudge to close it out */}
                        {order.customer_marked_collected_at && order.status !== 'collected' && (
                          <div style={{ background: 'var(--green-bg)', border: '1px solid var(--green)', borderRadius: 8, padding: '8px 12px', marginBottom: 10, fontSize: 12, fontWeight: 600, color: 'var(--green)' }}>
                            📩 {order.student_name} says they've collected this order.
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="order-actions">
                          {order.status === 'payment_pending' && (
                            <>
                              <motion.button {...(remindingOrderId !== order.id ? hoverScale : {})} onClick={() => remindPayment(order)} disabled={remindingOrderId === order.id} style={{ flex: 1, padding: '10px 16px', borderRadius: 8, border: 'none', background: 'var(--red)', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                                {remindingOrderId === order.id ? '...' : '🔔 Remind to Pay'}
                              </motion.button>
                              <motion.button {...(deletingOrderId !== order.id ? hoverScale : {})} onClick={() => deleteOrder(order)} disabled={deletingOrderId === order.id} style={{ flex: 1, padding: '10px 16px', borderRadius: 8, border: 'none', background: '#e8734a', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                                {deletingOrderId === order.id ? '...' : '🗑️ Delete'}
                              </motion.button>
                            </>
                          )}
                          {order.status === 'pending_approval' && (
                            <>
                              <motion.button {...hoverScale} onClick={() => setApprovalModal(order)} style={{ flex: 1, padding: '10px 16px', borderRadius: 8, border: 'none', background: 'var(--green)', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>✓ Accept</motion.button>
                              <motion.button {...hoverScale} onClick={() => { setApprovalModal(order); setDenialReason('temp') }} style={{ flex: 1, padding: '10px 16px', borderRadius: 8, border: 'none', background: 'var(--red)', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>✕ Deny</motion.button>
                            </>
                          )}
                          {order.status === 'approved' && (
                            <motion.button {...(actionLoading !== order.id ? hoverScale : {})} onClick={() => updateOrderStatus(order.id, 'preparing')} disabled={actionLoading === order.id} style={{ flex: 1, padding: '10px 16px', borderRadius: 8, border: 'none', background: '#7c5cfc', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                              {actionLoading === order.id ? '...' : '👨‍🍳 Start Preparing'}
                            </motion.button>
                          )}
                          {order.status === 'preparing' && (
                            <motion.button {...(actionLoading !== order.id ? hoverScale : {})} onClick={() => updateOrderStatus(order.id, 'ready')} disabled={actionLoading === order.id} style={{ flex: 1, padding: '10px 16px', borderRadius: 8, border: 'none', background: 'var(--green)', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                              {actionLoading === order.id ? '...' : '🔔 Order is Ready'}
                            </motion.button>
                          )}
                          {order.status === 'ready' && (
                            <motion.button {...(actionLoading !== order.id ? hoverScale : {})} onClick={() => updateOrderStatus(order.id, 'collected')} disabled={actionLoading === order.id} style={{ flex: 1, padding: '10px 16px', borderRadius: 8, border: '2px solid var(--green)', background: 'white', color: 'var(--green)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                              {actionLoading === order.id ? '...' : '✅ Mark as Collected'}
                            </motion.button>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </motion.div>
              </AnimatePresence>
            )
          })()}

          {/* QUEUE */}
          {tab === 'queue' && (
            <>
              <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 8, lineHeight: 1.5 }}>
                Adjust the estimated queue wait time based on current demand
              </div>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 18px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 14, color: 'var(--text2)' }}>Override wait:</span>
                <input type="number" placeholder="mins" value={waitOverride} onChange={e => setWaitOverride(e.target.value)} style={{ ...inp, width: 90, flex: 'none' }} />
                <motion.button {...hoverScale} onClick={updateWait} style={{ padding: '9px 18px', borderRadius: 9, border: 'none', background: 'var(--accent)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Update</motion.button>
              </div>
              <motion.div initial="hidden" animate="visible" variants={stagger}>
                {orders.filter(o => o.payment_status === 'paid').map(order => (
                  <motion.div key={order.id} variants={staggerItem} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 800, color: 'var(--accent)', width: 40, textAlign: 'center', flexShrink: 0 }}>#{order.queue_position}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{order.student_name}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>{(order.items as {name:string;quantity:number}[]).map(i => `${i.name}×${i.quantity}`).join(', ')}</div>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: statusColors[order.status], background: `${statusColors[order.status]}15`, padding: '4px 10px', borderRadius: 6, textTransform: 'uppercase', flexShrink: 0 }}>{order.status}</div>
                  </motion.div>
                ))}
              </motion.div>
            </>
          )}

          {/* SALES SUMMARY — today or all time */}
          {tab === 'today' && (() => {
            // Filter orders by selected date
            const isSelectedDateToday = selectedDate === new Date().toISOString().split('T')[0]
            const filterByDate = (order: Order) => {
              if (summaryRange === 'allTime') return true
              const orderDate = new Date(order.created_at).toISOString().split('T')[0]
              return orderDate === selectedDate
            }

            const collected = orders.filter(o => o.status === 'collected' && filterByDate(o))
            const cancelled = orders.filter(o => o.status === 'cancelled' && filterByDate(o))
            const active = orders.filter(o => !['collected', 'cancelled'].includes(o.status) && filterByDate(o))

            // Server figures once they land; until then fall back to today's
            // loaded orders so the tab is never blank. The fallback can only
            // ever describe today, so the range switch waits for the server.
            const isAll = summaryRange === 'allTime'
            const s: RangeSummary | null = summary ? summary[summaryRange] : null
            const completedCount = s ? s.completed : collected.length
            const activeCount = s ? s.active : active.length
            const cancelledCount = s ? s.cancelled : cancelled.length
            const revenue = s ? s.revenue : collected.reduce((sum, o) => sum + o.total_amount, 0)
            const lostRevenue = s ? s.lost : cancelled.reduce((sum, o) => sum + o.total_amount, 0)

            const moneyCard = (value: number, label: string, colour: string, bg: string) => (
              <div style={{ background: bg, border: `2px solid ${colour}`, borderRadius: 14, padding: '14px 10px', textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: colour }}>₹{value}</div>
                <div style={{ fontSize: 10, color: colour, fontWeight: 700, textTransform: 'uppercase', marginTop: 4, lineHeight: 1.3 }}>{label}</div>
              </div>
            )

            const OrderRow = ({ order, borderColor, onDelete }: { order: Order; borderColor: string; onDelete?: (order: Order) => void }) => (
              <div style={{ background: 'var(--surface2)', padding: '10px 14px', borderRadius: 10, borderLeft: `3px solid ${borderColor}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>#{order.token_number ?? order.queue_position} · {order.student_name}</div>
                  <div style={{ color: 'var(--muted)', fontSize: 12 }}>{(order.items as {name:string;quantity:number}[]).map(i => `${i.name}×${i.quantity}`).join(', ')}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</div>
                  {order.denial_reason && (
                    <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 4, fontWeight: 600 }}>
                      {order.denial_reason === 'Customer cancelled before payment' ? '📩 ' : 'Reason: '}{order.denial_reason}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: borderColor }}>₹{order.total_amount}</div>
                  {onDelete && (
                    <motion.button
                      {...(deletingOrderId !== order.id ? hoverScale : {})}
                      onClick={() => onDelete(order)}
                      disabled={deletingOrderId === order.id}
                      aria-label="Delete order"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 15, padding: 4 }}
                    >
                      {deletingOrderId === order.id ? '...' : '🗑️'}
                    </motion.button>
                  )}
                </div>
              </div>
            )

            // Generate date options (today + yesterday only)
            const dateOptions = []
            const today = new Date()
            for (let i = 0; i < 2; i++) {
              const d = new Date(today)
              d.setDate(d.getDate() - i)
              const dateStr = d.toISOString().split('T')[0]
              const dayLabel = i === 0 ? 'Today' : i === 1 ? 'Yesterday' : ''
              const dateLabel = d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
              dateOptions.push({
                value: dateStr,
                label: dayLabel ? `${dayLabel} ${dateLabel}` : dateLabel
              })
            }

            return (
              <div style={{ maxWidth: 600 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
                  <div style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700 }}>
                    {isAll ? 'All-Time Summary' : "Today's Summary"}
                  </div>
                  <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                    {!isAll && (
                      <>
                        <select
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          disabled={loadingDate}
                          style={{
                            padding: '6px 12px',
                            fontSize: 12,
                            fontWeight: 700,
                            border: '1px solid var(--border)',
                            borderRadius: 8,
                            background: 'var(--surface)',
                            color: 'var(--text)',
                            cursor: loadingDate ? 'not-allowed' : 'pointer',
                            minWidth: '160px',
                            opacity: loadingDate ? 0.6 : 1
                          }}
                        >
                          {dateOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        {loadingDate && (
                          <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>Loading...</div>
                        )}
                      </>
                    )}
                    <div style={{ display: 'inline-flex', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 999, padding: 3 }}>
                      {([['today', 'Today'], ['allTime', 'All time']] as const).map(([key, label]) => (
                        <button
                          key={key}
                          onClick={() => setSummaryRange(key)}
                          disabled={!summary}
                          style={{
                            border: 'none', borderRadius: 999, padding: '6px 14px', fontSize: 12, fontWeight: 700,
                            cursor: summary ? 'pointer' : 'default',
                            background: summaryRange === key ? 'var(--accent)' : 'transparent',
                            color: summaryRange === key ? '#fff' : 'var(--muted)',
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 18 }}>
                  {isAll
                    ? `Every order since launch — ${s?.orders ?? 0} in total.`
                    : `${new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
                </div>

                {/* Check if there are any orders for the selected date */}
                {!isAll && (collected.length + cancelled.length + active.length) === 0 ? (
                  <div style={{ background: 'var(--surface)', border: '2px solid var(--border)', borderRadius: 14, padding: '40px 20px', textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--muted)', marginBottom: 8 }}>📭 No data</div>
                    <div style={{ fontSize: 13, color: 'var(--muted)' }}>No orders for this date</div>
                  </div>
                ) : (
                  <>
                    {/* Stats row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                      <div style={{ background: 'var(--green-bg)', border: '2px solid var(--green)', borderRadius: 14, padding: '16px 12px', textAlign: 'center' }}>
                        <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--green)' }}>{completedCount}</div>
                        <div style={{ fontSize: 11, color: 'var(--green)', fontWeight: 700, textTransform: 'uppercase', marginTop: 4 }}>Completed</div>
                      </div>
                      <div style={{ background: 'rgba(212,130,26,0.08)', border: '2px solid #d4821a', borderRadius: 14, padding: '16px 12px', textAlign: 'center' }}>
                        <div style={{ fontSize: 28, fontWeight: 800, color: '#d4821a' }}>{activeCount}</div>
                        <div style={{ fontSize: 11, color: '#d4821a', fontWeight: 700, textTransform: 'uppercase', marginTop: 4 }}>Active</div>
                      </div>
                      <div style={{ background: 'var(--red-bg)', border: '2px solid var(--red)', borderRadius: 14, padding: '16px 12px', textAlign: 'center' }}>
                        <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--red)' }}>{cancelledCount}</div>
                        <div style={{ fontSize: 11, color: 'var(--red)', fontWeight: 700, textTransform: 'uppercase', marginTop: 4 }}>Cancelled</div>
                      </div>
                    </div>

                    {/* Revenue */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                      <div style={{ background: 'var(--accent-light)', border: '2px solid var(--accent)', borderRadius: 14, padding: '16px 12px', textAlign: 'center' }}>
                        <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent)' }}>₹{revenue}</div>
                        <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', marginTop: 4 }}>Revenue Earned</div>
                      </div>
                      <div style={{ background: 'var(--red-bg)', border: '2px solid var(--red)', borderRadius: 14, padding: '16px 12px', textAlign: 'center' }}>
                        <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--red)' }}>₹{lostRevenue}</div>
                        <div style={{ fontSize: 11, color: 'var(--red)', fontWeight: 700, textTransform: 'uppercase', marginTop: 4 }}>Lost (Cancelled)</div>
                      </div>
                    </div>

                    {/* Money actually moved. Kept apart from the fulfilment figures
                        above: "Revenue Earned" counts orders served, this counts
                        rupees Razorpay took. They are not the same number and the
                        payout is based on this one. */}
                    {s && (
                      <div style={{ marginBottom: 24 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                          {moneyCard(s.received, 'Received (paid)', 'var(--green)', 'var(--green-bg)')}
                          {moneyCard(s.awaiting, 'Awaiting payment', '#d4821a', 'rgba(212,130,26,0.08)')}
                          {moneyCard(s.refunded, 'Refunded', 'var(--red)', 'var(--red-bg)')}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8, lineHeight: 1.5 }}>
                          Payouts are settled against <strong>Received</strong> — money Razorpay actually collected.
                          Awaiting payment is not yours yet, and refunded amounts go back to the customer.
                        </div>
                      </div>
                    )}

                    {/* Completed orders */}
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)', marginBottom: 12 }}>✅ Completed Orders Today ({collected.length})</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflow: 'auto' }}>
                        {collected.length === 0
                          ? <div style={{ textAlign: 'center', padding: 16, color: 'var(--muted)', fontSize: 13 }}>No completed orders yet</div>
                          : collected.map(o => <OrderRow key={o.id} order={o} borderColor="var(--green)" onDelete={deleteOrder} />)
                        }
                      </div>
                    </div>

                    {/* Cancelled/denied orders */}
                    {cancelled.length > 0 && (
                      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--red)', marginBottom: 12 }}>❌ Cancelled / Denied Orders Today ({cancelled.length})</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflow: 'auto' }}>
                          {cancelled.map(o => <OrderRow key={o.id} order={o} borderColor="var(--red)" onDelete={deleteOrder} />)}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })()}

          {/* MENU */}
          {tab === 'menu' && (
            <div className="menu-grid-v">
              <div>
                <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
                  {editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { key: 'name', label: 'Item Name *', placeholder: 'Veg Thali' },
                    { key: 'description', label: 'Description', placeholder: 'Rice, dal, sabzi...' },
                    { key: 'price', label: 'Price (₹) *', placeholder: '80', type: 'number' },
                    { key: 'stock_quantity', label: 'Stock Quantity (leave empty for unlimited)', placeholder: '50', type: 'number' }
                  ].map(f => (
                    <div key={f.key}>
                      <label style={lbl}>{f.label}</label>
                      <input
                        type={f.type || 'text'}
                        placeholder={f.placeholder}
                        value={(editingItem ? editForm[f.key as keyof typeof editForm] : menuForm[f.key as keyof typeof menuForm]) as string || ''}
                        onChange={e => editingItem ? setEditForm(m => ({ ...m, [f.key]: e.target.value })) : setMenuForm(m => ({ ...m, [f.key]: e.target.value }))}
                        style={inp}
                      />
                    </div>
                  ))}
                  <div>
                    <label style={lbl}>Category</label>
                    <select
                      value={editingItem ? editForm.category : menuForm.category}
                      onChange={e => editingItem ? setEditForm(m => ({ ...m, category: e.target.value })) : setMenuForm(m => ({ ...m, category: e.target.value }))}
                      style={inp}
                    >
                      {['Fresh Juices', 'Mojitos', 'Hot Beverages', 'Fruit Milkshakes', 'Thick Shake', 'Sodas', 'Coffee Shake', 'Special Shakes', 'Ice Cream Shakes', 'Lassi', 'Delights', 'Club Sandwich', 'Strips', 'Sandwiches', 'Egg Bites', 'Loaded Fries', 'Rolls', 'Burgers', 'Buns', 'Wraps', 'Quick Bites', 'Maggies'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Food Type</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {([['veg', 'Veg', '#2e9e6b'], ['nonveg', 'Non-veg', '#e8734a']] as const).map(([val, label, color]) => {
                        const isVeg = val === 'veg'
                        const active = (editingItem ? editForm.is_veg : menuForm.is_veg) === isVeg
                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={() => editingItem ? setEditForm(m => ({ ...m, is_veg: isVeg })) : setMenuForm(m => ({ ...m, is_veg: isVeg }))}
                            style={{ flex: 1, padding: 11, borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 700, background: active ? color : 'var(--surface2)', color: active ? 'white' : 'var(--text2)', border: `1.5px solid ${active ? color : 'var(--border)'}` }}
                          >
                            {label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <div>
                    <label style={lbl}>Item Image (JPG, PNG, WebP - Max 2MB)</label>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          if (file.size > 2 * 1024 * 1024) {
                            setMsg('Image must be less than 2MB')
                            return
                          }
                          setMenuForm(m => ({ ...m, image_file: file }))
                          const reader = new FileReader()
                          reader.onload = (e) => setImagePreview(e.target?.result as string)
                          reader.readAsDataURL(file)
                        }
                      }}
                      style={inp}
                    />
                    {imagePreview && <div style={{ marginTop: 10, height: 100, borderRadius: 8, overflow: 'hidden' }}><img src={imagePreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>}
                  </div>
                  {msg && <div style={{ fontSize: 13, color: msg.startsWith('✅') ? 'var(--green)' : 'var(--red)' }}>{msg}</div>}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <motion.button
                      {...(!uploading ? hoverScale : {})}
                      onClick={editingItem ? updateMenuItem : addMenuItem}
                      disabled={uploading}
                      style={{ flex: 1, padding: 13, borderRadius: 10, border: 'none', background: 'var(--accent)', color: 'white', fontSize: 15, fontWeight: 700, cursor: uploading ? 'default' : 'pointer', opacity: uploading ? 0.6 : 1 }}
                    >
                      {uploading ? 'Uploading...' : editingItem ? 'Update Item' : 'Add Item'}
                    </motion.button>
                    {editingItem && (
                      <motion.button
                        {...hoverScale}
                        onClick={() => {
                          setEditingItem(null)
                          setMenuForm({ name: '', description: '', price: '', category: 'Main', stock_quantity: '', is_veg: true, image_file: null })
                          setImagePreview(null)
                        }}
                        style={{ padding: '13px 20px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text2)', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
                      >
                        Cancel
                      </motion.button>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Menu ({menuItems.length})</div>
                <motion.div initial="hidden" animate="visible" variants={stagger} style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 480, overflow: 'auto' }}>
                  {menuItems.map(item => (
                    <motion.div key={item.id} variants={staggerItem} {...hoverLift} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '11px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1, minWidth: 0 }}>
                        {item.image_url && <img src={item.image_url} alt={item.name} style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />}
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 500, color: item.is_available ? 'var(--text)' : 'var(--muted)' }}>{item.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                            {item.category} · ₹{item.price}
                            {item.stock_quantity && ` · ${item.stock_quantity} left`}
                          </div>
                        </div>
                      </div>
                      <div className="menu-item-buttons" style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                        <motion.button
                          {...hoverScale}
                          onClick={() => {
                            setEditingItem(item)
                            setEditForm({
                              name: item.name,
                              description: item.description || '',
                              price: item.price.toString(),
                              category: item.category,
                              stock_quantity: item.stock_quantity?.toString() || '',
                              is_veg: item.is_veg ?? true
                            })
                            setImagePreview(item.image_url || null)
                          }}
                          style={{ padding: '5px 10px', borderRadius: 7, border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer', background: '#7c5cfc15', color: '#7c5cfc' }}
                        >
                          Edit
                        </motion.button>
                        <motion.button
                          {...hoverScale}
                          onClick={() => setDeletingId(item.id)}
                          style={{ padding: '5px 10px', borderRadius: 7, border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer', background: 'var(--red-bg)', color: 'var(--red)' }}
                        >
                          Delete
                        </motion.button>
                        <motion.button
                          {...hoverScale}
                          onClick={() => toggleMenuItem(item.id, item.is_available)}
                          style={{ padding: '5px 10px', borderRadius: 7, border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer', background: item.is_available ? 'var(--green-bg)' : 'var(--red-bg)', color: item.is_available ? 'var(--green)' : 'var(--red)' }}
                        >
                          {item.is_available ? 'On' : 'Off'}
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>

              {/* DELETE CONFIRMATION MODAL */}
              <AnimatePresence>
                {deletingId && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
                  >
                    <motion.div initial="hidden" animate="visible" exit="hidden" variants={scaleIn} style={{ background: 'white', borderRadius: 16, padding: 24, maxWidth: 320, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
                      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: 'var(--navy)' }}>Delete Item?</div>
                      <div style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 20 }}>
                        Are you sure you want to delete <strong>{menuItems.find(i => i.id === deletingId)?.name}</strong>? This cannot be undone.
                      </div>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <motion.button
                          {...hoverScale}
                          onClick={() => setDeletingId(null)}
                          style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'white', color: 'var(--text2)', fontWeight: 600, cursor: 'pointer' }}
                        >
                          Cancel
                        </motion.button>
                        <motion.button
                          {...hoverScale}
                          onClick={() => deleteMenuItem(deletingId)}
                          style={{ flex: 1, padding: 10, borderRadius: 8, border: 'none', background: 'var(--red)', color: 'white', fontWeight: 600, cursor: 'pointer' }}
                        >
                          Delete
                        </motion.button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* SETTINGS */}
          {tab === 'settings' && (
            <div style={{ maxWidth: 480 }}>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700, marginBottom: 18 }}>Settings</div>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                  <div><div style={{ fontWeight: 600 }}>Restaurant Status</div><div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>Toggle open or close</div></div>
                  <motion.button {...hoverScale} onClick={toggleOpen} style={{ padding: '9px 20px', borderRadius: 9, border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer', background: isOpen ? 'var(--green)' : 'var(--red)', color: 'white' }}>{isOpen ? 'Open' : 'Closed'}</motion.button>
                </div>
                <div><div style={{ fontWeight: 600, marginBottom: 3 }}>Email</div><div style={{ fontSize: 14, color: 'var(--muted)' }}>{cafeteria?.vendor_email}</div></div>
                <div><div style={{ fontWeight: 600, marginBottom: 3 }}>Location</div><div style={{ fontSize: 14, color: 'var(--muted)' }}>{cafeteria?.location}</div></div>
                <motion.button {...hoverScale} onClick={logout} style={{ padding: '10px 20px', borderRadius: 9, border: '1px solid var(--red-bg)', background: 'var(--red-bg)', color: 'var(--red)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Sign Out</motion.button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* APPROVAL MODAL */}
      <AnimatePresence>
        {approvalModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 300,
          padding: 16,
        }}>
          <motion.div initial="hidden" animate="visible" exit="hidden" variants={scaleIn} style={{
            background: 'white',
            borderRadius: 20,
            padding: 28,
            maxWidth: 500,
            width: '100%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700, marginBottom: 4 }}>New Order</div>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>Order #{approvalModal.id.slice(0, 8)}</div>
            </div>

            {/* Order Details */}
            <div style={{
              background: 'var(--surface2)',
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
            }}>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4, fontWeight: 600 }}>CUSTOMER</div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{approvalModal.student_name}</div>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>📱 {approvalModal.student_phone}</div>
              </div>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8, fontWeight: 600 }}>ITEMS</div>
                {(approvalModal.items as { name: string; quantity: number }[]).map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span>{item.name} ×{item.quantity}</span>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>TOTAL</span>
                  <span style={{ fontSize: 20, fontFamily: 'var(--font-head)', fontWeight: 800, color: 'var(--accent)' }}>₹{approvalModal.total_amount}</span>
                </div>
              </div>
            </div>

            {/* Prep Time Section */}
            <div style={{ marginBottom: 18, padding: 14, background: '#7c5cfc15', borderRadius: 12 }}>
              <label style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8, display: 'block', fontWeight: 600, textTransform: 'uppercase' }}>⏱️ Preparation Time (minutes) *</label>
              <input
                type="number"
                min="1"
                max="120"
                value={prepTime}
                onChange={e => setPrepTime(e.target.value)}
                placeholder="e.g., 7 for coffee, 20 for burger"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: '1px solid #7c5cfc',
                  borderRadius: 8,
                  fontSize: 15,
                  fontWeight: 600,
                  color: 'var(--text)',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>Student will see: "Ready in ~{prepTime} minutes"</div>
            </div>

            {/* Decision Section */}
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--text2)' }}>Do you want to approve this order?</div>

              {/* Deny Section */}
              {denialReason && (
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6, display: 'block', fontWeight: 600 }}>REASON FOR DENIAL *</label>
                  <textarea
                    value={denialReason}
                    onChange={e => setDenialReason(e.target.value)}
                    placeholder="e.g., Out of stock, Unexpected issue..."
                    style={{
                      width: '100%',
                      minHeight: 80,
                      padding: 12,
                      border: '1px solid var(--border)',
                      borderRadius: 10,
                      fontFamily: 'var(--font-body)',
                      fontSize: 13,
                      resize: 'vertical',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              )}

              {/* Buttons */}
              <div style={{ display: 'flex', gap: 10 }}>
                <motion.button
                  {...(!approveLoading ? hoverScale : {})}
                  onClick={() => {
                    if (denialReason && denialReason !== 'temp') {
                      denyOrder(approvalModal)
                    } else {
                      setDenialReason('temp')
                    }
                  }}
                  disabled={approveLoading}
                  style={{
                    flex: 1,
                    padding: 14,
                    borderRadius: 10,
                    border: 'none',
                    background: denialReason ? 'var(--red)' : '#ffc0c7',
                    color: 'white',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: approveLoading ? 'default' : 'pointer',
                    opacity: approveLoading ? 0.6 : 1,
                  }}
                >
                  {denialReason && denialReason !== 'temp' ? '✕ DENY' : '✕ DENY'}
                </motion.button>
                <motion.button
                  {...(!approveLoading ? hoverScale : {})}
                  onClick={() => {
                    setDenialReason('')
                    approveOrder(approvalModal)
                  }}
                  disabled={approveLoading}
                  style={{
                    flex: 1,
                    padding: 14,
                    borderRadius: 10,
                    border: 'none',
                    background: 'var(--green)',
                    color: 'white',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: approveLoading ? 'default' : 'pointer',
                    opacity: approveLoading ? 0.6 : 1,
                  }}
                >
                  ✓ APPROVE
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>

      {/* MOBILE BOTTOM NAV */}
      <div className="v-bottom-nav">
        {([['orders', '📋', 'Orders'], ['queue', '👥', 'Queue'], ['today', '📊', 'Today'], ['menu', '🍱', 'Menu'], ['settings', '⚙️', 'Settings']] as [Tab, string, string][]).map(([t, icon, label]) => (
          <motion.button key={t} whileTap={{ scale: 0.9 }} onClick={() => setTab(t)} className={`v-bottom-nav-item ${tab === t ? 'active' : ''}`}>
            <span>{icon}</span>
            <span>{label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
