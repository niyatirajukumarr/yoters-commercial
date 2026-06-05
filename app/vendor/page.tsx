'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Cafeteria, MenuItem, Order } from '@/lib/types'

type Tab = 'orders' | 'queue' | 'menu' | 'today' | 'settings'

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
  const [menuForm, setMenuForm] = useState({ name: '', description: '', price: '', category: 'Main', stock_quantity: '', image_file: null as File | null })
  const [isOpen, setIsOpen] = useState(true)
  const [editingItem, setEditingItem] = useState<any | null>(null)
  const [editForm, setEditForm] = useState({ name: '', description: '', price: '', category: 'Main', stock_quantity: '' })
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [approvalModal, setApprovalModal] = useState<Order | null>(null)
  const [denialReason, setDenialReason] = useState('')
  const [approveLoading, setApproveLoading] = useState(false)
  const [prepTime, setPrepTime] = useState('10')

  const [newOrderAlert, setNewOrderAlert] = useState<string | null>(null)
  const prevOrderCount = useState({ count: 0 })

  const fetchOrders = useCallback(async (cafId: string, notify = false) => {
    const res = await fetch(`/api/vendor/orders?cafeteriaId=${cafId}`)
    const json = await res.json()
    const data = json.orders
    if (data) {
      if (notify && data.length > prevOrderCount[0].count) {
        const newest = data[data.length - 1]
        setNewOrderAlert(`🔔 New order! ${newest?.items?.[0]?.name ?? 'Item'} — ₹${newest?.total_amount}`)
        // Play a beep sound
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
          const osc = ctx.createOscillator()
          osc.connect(ctx.destination)
          osc.frequency.value = 880
          osc.start()
          osc.stop(ctx.currentTime + 0.3)
        } catch {}
        setTimeout(() => setNewOrderAlert(null), 5000)
      }
      prevOrderCount[0].count = data.length
      setOrders(data as Order[])
    }
  }, [])

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/vendor/login'); return }
      const user = session.user
      const { data: caf } = await supabase.from('cafeterias').select('*').eq('vendor_email', user.email).single()
      if (!caf) { router.push('/vendor/login'); return }
      setCafeteria(caf); setIsOpen(caf.is_open); fetchOrders(caf.id)
      const { data: menu } = await supabase.from('cafeteria_menu').select('*').eq('cafeteria_id', caf.id).order('category')
      if (menu) setMenuItems(menu)
      setLoading(false)
      const fetchMenuItems = async (cafId: string) => {
        const { data } = await supabase.from('cafeteria_menu').select('*').eq('cafeteria_id', cafId).order('category')
        if (data) setMenuItems(data)
      }
      channel = supabase.channel('vendor-realtime-' + caf.id)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `cafeteria_id=eq.${caf.id}` }, () => fetchOrders(caf.id, true))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'cafeteria_menu', filter: `cafeteria_id=eq.${caf.id}` }, () => fetchMenuItems(caf.id))
        .subscribe()

      // Fallback poll every 5s
      const poll = setInterval(() => fetchOrders(caf.id), 5_000)
      return () => { channel?.unsubscribe(); clearInterval(poll) }
    }
    init()
    return () => { channel?.unsubscribe() }
  }, [router, fetchOrders])

  async function updateOrderStatus(orderId: string, status: Order['status']) {
    setActionLoading(orderId)
    const update: Partial<Order> = { status }
    if (status === 'ready') update.ready_at = new Date().toISOString()
    if (status === 'collected') update.collected_at = new Date().toISOString()
    await supabase.from('orders').update(update).eq('id', orderId)
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
      image_url: imageUrl
    }).eq('id', editingItem.id)
    if (error) { setMsg('Error: ' + error.message); return }
    setMsg('✅ Item updated!')
    setEditingItem(null)
    setMenuForm({ name: '', description: '', price: '', category: 'Main', stock_quantity: '', image_file: null })
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
      image_url: imageUrl
    })
    if (error) { setMsg('Error: ' + error.message); return }
    setMsg('✅ Item added!')
    setMenuForm({ name: '', description: '', price: '', category: 'Main', stock_quantity: '', image_file: null })
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
      if (!session?.user.email) return

      const response = await fetch('/api/vendor/approve-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          vendorEmail: session.user.email,
          prepTimeMinutes: parseInt(prepTime),
        }),
      })
      const result = await response.json()
      if (response.ok) {
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
      if (!session?.user.email) return

      const response = await fetch('/api/vendor/deny-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          vendorEmail: session.user.email,
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

  const statusColors: Record<string, string> = {
    pending: '#d4821a', paid: 'var(--accent)', preparing: '#7c5cfc', ready: 'var(--green)', collected: 'var(--muted)'
  }

  const inp = { width: '100%', padding: '10px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 14, color: 'var(--text)' }
  const lbl = { fontSize: 11, color: 'var(--text2)', marginBottom: 5, display: 'block' as const, fontWeight: 600 as const, textTransform: 'uppercase' as const, letterSpacing: 1 }

  const pendingCount = orders.filter(o => o.status === 'pending').length
  const preparingCount = orders.filter(o => o.status === 'preparing').length
  const readyCount = orders.filter(o => o.status === 'ready').length
  const todayRevenue = orders.filter(o => o.payment_status === 'paid').reduce((s, o) => s + o.total_amount, 0)

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>
      Loading dashboard...
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* New Order Alert Banner */}
      {newOrderAlert && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999, background: '#2e9e6b', color: 'white', padding: '14px 20px', textAlign: 'center', fontWeight: 700, fontSize: 15, animation: 'slideDown 0.3s ease', boxShadow: '0 4px 16px rgba(46,158,107,0.4)' }}>
          {newOrderAlert}
        </div>
      )}
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
          <span className="v-open-label" style={{ fontSize: 13, color: 'var(--muted)' }}>Cafeteria:</span>
          <button onClick={toggleOpen} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: isOpen ? 'rgba(46,158,107,0.1)' : 'rgba(232,51,74,0.1)', color: isOpen ? 'var(--green)' : 'var(--red)', border: `1px solid ${isOpen ? 'rgba(46,158,107,0.25)' : 'rgba(232,51,74,0.25)'}` }}>
            {isOpen ? '🟢 Open' : '🔴 Closed'}
          </button>
          <button onClick={logout} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border2)', background: 'var(--surface)', color: 'var(--text2)', fontSize: 12, cursor: 'pointer' }}>Out</button>
        </div>
      </nav>

      <div className="v-body">
        {/* DESKTOP SIDEBAR */}
        <div className="v-sidebar">
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 3, color: 'var(--text)' }}>{cafeteria?.image_emoji} {cafeteria?.name}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 20 }}>{cafeteria?.location}</div>
          {([['orders', '📋 Orders'], ['queue', '👥 Queue'], ['today', '📊 Today'], ['menu', '🍱 Menu'], ['settings', '⚙️ Settings']] as [Tab, string][]).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)} className="v-tab-btn" style={{ background: tab === t ? 'var(--accent-light)' : 'transparent', color: tab === t ? 'var(--text)' : 'var(--text2)', fontWeight: tab === t ? 600 : 400, borderLeft: `2px solid ${tab === t ? 'var(--accent)' : 'transparent'}` }}>{label}</button>
          ))}
        </div>

        {/* MAIN */}
        <div className="v-main">
          {/* Stats */}
          <div className="v-stats">
            {[
              { label: 'New Orders', val: pendingCount, color: '#d4821a' },
              { label: 'Preparing', val: preparingCount, color: '#7c5cfc' },
              { label: 'Ready', val: readyCount, color: 'var(--green)' },
              { label: "Revenue", val: `₹${todayRevenue}`, color: 'var(--accent)' },
            ].map((s, i) => (
              <div key={i} className="stat-card-v" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 16px' }}>
                <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>{s.label}</div>
                <div className="stat-val-v" style={{ fontFamily: 'var(--font-head)', fontSize: 26, fontWeight: 800, color: s.color }}>{s.val}</div>
              </div>
            ))}
          </div>

          {msg && <div style={{ background: 'var(--green-bg)', border: '1px solid rgba(46,158,107,0.2)', borderRadius: 8, padding: '10px 16px', fontSize: 13, color: 'var(--green)', marginBottom: 16 }}>{msg}</div>}

          {/* ORDERS */}
          {tab === 'orders' && (
            <>
              {/* PENDING APPROVAL SECTION */}
              {orders.filter(o => o.status === 'paid').length > 0 && (
                <div style={{ marginBottom: 28, padding: 18, background: 'rgba(212,130,26,0.08)', border: '2px solid #d4821a', borderRadius: 14 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#d4821a', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>⚠️</span>
                    Pending Approval ({orders.filter(o => o.status === 'paid').length})
                  </div>
                  {orders.filter(o => o.status === 'paid').map(order => (
                    <div key={order.id} className="order-card" style={{ marginBottom: 8, borderLeft: '4px solid #d4821a' }}>
                      <div className="order-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <div className="order-meta" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                            <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 800, color: '#d4821a', background: 'rgba(212,130,26,0.15)', border: '1px solid #d4821a', borderRadius: 8, padding: '2px 10px' }}>#{order.queue_position}</div>
                            <div style={{ fontWeight: 600, fontSize: 15 }}>{order.student_name}</div>
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>📱 {order.student_phone}</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
                            {(order.items as { name: string; quantity: number }[]).map((item, i) => (
                              <span key={i} style={{ background: 'var(--surface2)', borderRadius: 6, padding: '3px 10px', fontSize: 12, color: 'var(--text2)' }}>{item.name} ×{item.quantity}</span>
                            ))}
                          </div>
                        </div>
                        <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 800, color: 'var(--accent)', flexShrink: 0 }}>₹{order.total_amount}</div>
                      </div>
                      <div className="order-actions">
                        <button onClick={() => setApprovalModal(order)} style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: 'var(--green)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', flex: 1 }}>✓ APPROVE</button>
                        <button onClick={() => setApprovalModal(order)} style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: 'var(--red)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', flex: 1 }}>✕ DENY</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* APPROVED ORDERS */}
              {orders.filter(o => o.status === 'approved').length > 0 && (
                <div style={{ marginBottom: 28 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--green)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>✓</span> Approved
                  </div>
                  {orders.filter(o => o.status === 'approved').map(order => (
                    <div className="order-card">
                      <div className="order-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <div className="order-meta" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                            <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 800, color: 'var(--green)', background: 'var(--green-bg)', border: '1px solid var(--green)', borderRadius: 8, padding: '2px 10px' }}>#{order.queue_position}</div>
                            <div style={{ fontWeight: 600, fontSize: 15 }}>{order.student_name}</div>
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>📱 {order.student_phone}</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
                            {(order.items as { name: string; quantity: number }[]).map((item, i) => (
                              <span key={i} style={{ background: 'var(--surface2)', borderRadius: 6, padding: '3px 10px', fontSize: 12, color: 'var(--text2)' }}>{item.name} ×{item.quantity}</span>
                            ))}
                          </div>
                        </div>
                        <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 800, color: 'var(--accent)', flexShrink: 0 }}>₹{order.total_amount}</div>
                      </div>
                      <div className="order-actions">
                        {order.status === 'approved' && <button onClick={() => updateOrderStatus(order.id, 'preparing')} disabled={actionLoading === order.id} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#7c5cfc', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Start Preparing</button>}
                        {order.status === 'preparing' && <button onClick={() => updateOrderStatus(order.id, 'ready')} disabled={actionLoading === order.id} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--green)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Mark Ready 🔔</button>}
                        {order.status === 'ready' && <button onClick={() => updateOrderStatus(order.id, 'collected')} disabled={actionLoading === order.id} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Collected ✓</button>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {orders.filter(o => ['preparing', 'ready'].includes(o.status)).length === 0 && orders.filter(o => o.status === 'paid').length === 0 ? (
                <div style={{ textAlign: 'center', padding: 60, background: 'var(--surface)', borderRadius: 16, color: 'var(--muted)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>🎉</div>
                  <div style={{ fontWeight: 600 }}>No active orders right now</div>
                </div>
              ) : (
                <>
                  {orders.filter(o => o.status === 'preparing').length > 0 && (
                    <div style={{ marginBottom: 28 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#7c5cfc', marginBottom: 12 }}>📦 Preparing</div>
                      {orders.filter(o => o.status === 'preparing').map(order => (
                        <div key={order.id} className="order-card">
                          <div className="order-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{order.student_name}</div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
                                {(order.items as { name: string; quantity: number }[]).map((item, i) => (
                                  <span key={i} style={{ background: 'var(--surface2)', borderRadius: 6, padding: '3px 10px', fontSize: 12, color: 'var(--text2)' }}>{item.name} ×{item.quantity}</span>
                                ))}
                              </div>
                            </div>
                            <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 800, color: 'var(--accent)' }}>₹{order.total_amount}</div>
                          </div>
                          <div className="order-actions">
                            <button onClick={() => updateOrderStatus(order.id, 'ready')} disabled={actionLoading === order.id} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--green)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Mark Ready 🔔</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {orders.filter(o => o.status === 'ready').length > 0 && (
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--green)', marginBottom: 12 }}>✅ Ready for Pickup</div>
                      {orders.filter(o => o.status === 'ready').map(order => (
                        <div key={order.id} className="order-card">
                          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{order.student_name}</div>
                          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>📱 {order.student_phone}</div>
                          <div className="order-actions">
                            <button onClick={() => updateOrderStatus(order.id, 'collected')} disabled={actionLoading === order.id} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--surface2)', color: 'var(--text)', fontSize: 13, fontWeight: 600, cursor: 'pointer', flex: 1 }}>Collected ✓</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* QUEUE */}
          {tab === 'queue' && (
            <>
              <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 8, lineHeight: 1.5 }}>
                Adjust the estimated queue wait time based on current demand
              </div>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 18px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 14, color: 'var(--text2)' }}>Override wait:</span>
                <input type="number" placeholder="mins" value={waitOverride} onChange={e => setWaitOverride(e.target.value)} style={{ ...inp, width: 90, flex: 'none' }} />
                <button onClick={updateWait} style={{ padding: '9px 18px', borderRadius: 9, border: 'none', background: 'var(--accent)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Update</button>
              </div>
              {orders.filter(o => o.payment_status === 'paid').map(order => (
                <div key={order.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 800, color: 'var(--accent)', width: 40, textAlign: 'center', flexShrink: 0 }}>#{order.queue_position}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{order.student_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{(order.items as {name:string;quantity:number}[]).map(i => `${i.name}×${i.quantity}`).join(', ')}</div>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: statusColors[order.status], background: `${statusColors[order.status]}15`, padding: '4px 10px', borderRadius: 6, textTransform: 'uppercase', flexShrink: 0 }}>{order.status}</div>
                </div>
              ))}
            </>
          )}

          {/* TODAY'S SALES */}
          {tab === 'today' && (
            <div style={{ maxWidth: 600 }}>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Today's Sales</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                <div style={{ background: 'var(--green-bg)', border: '2px solid var(--green)', borderRadius: 16, padding: 20, textAlign: 'center' }}>
                  <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--green)', marginBottom: 4 }}>{orders.filter(o => o.status === 'collected').length}</div>
                  <div style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600, textTransform: 'uppercase' }}>Orders Completed</div>
                </div>
                <div style={{ background: 'var(--accent-light)', border: '2px solid var(--accent)', borderRadius: 16, padding: 20, textAlign: 'center' }}>
                  <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--accent)', marginBottom: 4 }}>₹{orders.filter(o => o.payment_status === 'paid').reduce((s, o) => s + o.total_amount, 0)}</div>
                  <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, textTransform: 'uppercase' }}>Revenue (Paid)</div>
                </div>
              </div>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>Today's Completed Orders:</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 400, overflow: 'auto' }}>
                  {orders.filter(o => o.status === 'collected').length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 20, color: 'var(--muted)' }}>No completed orders yet</div>
                  ) : (
                    orders.filter(o => o.status === 'collected').map(order => (
                      <div key={order.id} style={{ background: 'var(--surface2)', padding: 10, borderRadius: 8, fontSize: 12 }}>
                        <div style={{ fontWeight: 600, marginBottom: 2 }}>{order.student_name}</div>
                        <div style={{ color: 'var(--muted)', marginBottom: 2 }}>{(order.items as {name:string;quantity:number}[]).map(i => `${i.name}×${i.quantity}`).join(', ')}</div>
                        <div style={{ fontWeight: 700, color: 'var(--green)' }}>₹{order.total_amount}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

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
                      {['Breakfast', 'Meals', 'Snacks', 'Beverages', 'Desserts'].map(c => <option key={c}>{c}</option>)}
                    </select>
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
                    <button
                      onClick={editingItem ? updateMenuItem : addMenuItem}
                      disabled={uploading}
                      style={{ flex: 1, padding: 13, borderRadius: 10, border: 'none', background: 'var(--accent)', color: 'white', fontSize: 15, fontWeight: 700, cursor: uploading ? 'default' : 'pointer', opacity: uploading ? 0.6 : 1 }}
                    >
                      {uploading ? 'Uploading...' : editingItem ? 'Update Item' : 'Add Item'}
                    </button>
                    {editingItem && (
                      <button
                        onClick={() => {
                          setEditingItem(null)
                          setMenuForm({ name: '', description: '', price: '', category: 'Main', stock_quantity: '', image_file: null })
                          setImagePreview(null)
                        }}
                        style={{ padding: '13px 20px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text2)', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Menu ({menuItems.length})</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 480, overflow: 'auto' }}>
                  {menuItems.map(item => (
                    <div key={item.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '11px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                        <button
                          onClick={() => {
                            setEditingItem(item)
                            setEditForm({
                              name: item.name,
                              description: item.description || '',
                              price: item.price.toString(),
                              category: item.category,
                              stock_quantity: item.stock_quantity?.toString() || ''
                            })
                            setImagePreview(item.image_url || null)
                          }}
                          style={{ padding: '5px 10px', borderRadius: 7, border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer', background: '#7c5cfc15', color: '#7c5cfc' }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeletingId(item.id)}
                          style={{ padding: '5px 10px', borderRadius: 7, border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer', background: 'var(--red-bg)', color: 'var(--red)' }}
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => toggleMenuItem(item.id, item.is_available)}
                          style={{ padding: '5px 10px', borderRadius: 7, border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer', background: item.is_available ? 'var(--green-bg)' : 'var(--red-bg)', color: item.is_available ? 'var(--green)' : 'var(--red)' }}
                        >
                          {item.is_available ? 'On' : 'Off'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* DELETE CONFIRMATION MODAL */}
              {deletingId && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                  <div style={{ background: 'white', borderRadius: 16, padding: 24, maxWidth: 320, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: 'var(--navy)' }}>Delete Item?</div>
                    <div style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 20 }}>
                      Are you sure you want to delete <strong>{menuItems.find(i => i.id === deletingId)?.name}</strong>? This cannot be undone.
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        onClick={() => setDeletingId(null)}
                        style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'white', color: 'var(--text2)', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => deleteMenuItem(deletingId)}
                        style={{ flex: 1, padding: 10, borderRadius: 8, border: 'none', background: 'var(--red)', color: 'white', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SETTINGS */}
          {tab === 'settings' && (
            <div style={{ maxWidth: 480 }}>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700, marginBottom: 18 }}>Settings</div>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                  <div><div style={{ fontWeight: 600 }}>Cafeteria Status</div><div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>Toggle open or close</div></div>
                  <button onClick={toggleOpen} style={{ padding: '9px 20px', borderRadius: 9, border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer', background: isOpen ? 'var(--green)' : 'var(--red)', color: 'white' }}>{isOpen ? 'Open' : 'Closed'}</button>
                </div>
                <div><div style={{ fontWeight: 600, marginBottom: 3 }}>Email</div><div style={{ fontSize: 14, color: 'var(--muted)' }}>{cafeteria?.vendor_email}</div></div>
                <div><div style={{ fontWeight: 600, marginBottom: 3 }}>Location</div><div style={{ fontSize: 14, color: 'var(--muted)' }}>{cafeteria?.location}</div></div>
                <button onClick={logout} style={{ padding: '10px 20px', borderRadius: 9, border: '1px solid var(--red-bg)', background: 'var(--red-bg)', color: 'var(--red)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Sign Out</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* APPROVAL MODAL */}
      {approvalModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 300,
          padding: 16,
        }}>
          <div style={{
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
                <button
                  onClick={() => {
                    setDenialReason('')
                    if (denialReason) {
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
                    transition: 'all 0.2s',
                  }}
                >
                  {denialReason && denialReason !== 'temp' ? '✕ DENY' : '✕ DENY'}
                </button>
                <button
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
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM NAV */}
      <div className="v-bottom-nav">
        {([['orders', '📋', 'Orders'], ['queue', '👥', 'Queue'], ['today', '📊', 'Today'], ['menu', '🍱', 'Menu'], ['settings', '⚙️', 'Settings']] as [Tab, string, string][]).map(([t, icon, label]) => (
          <button key={t} onClick={() => setTab(t)} className={`v-bottom-nav-item ${tab === t ? 'active' : ''}`}>
            <span>{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
