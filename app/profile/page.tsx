'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useUserInfo } from '@/lib/hooks/useUserInfo'
import { Clock, CheckCircle, ChefHat, Loader, ChevronDown, ChevronUp, ArrowLeft, MoreVertical, CreditCard, RotateCcw, Ticket, Heart, X, Pencil } from 'lucide-react'
import { OrderTrackingRoadmap } from '@/components/OrderTrackingRoadmap'
import { Order } from '@/lib/types'
import { stagger, staggerItem, hoverLift, hoverScale } from '@/lib/motion'

interface CafeteriaInfo {
  id: string
  name: string
  image_emoji: string
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, isLoaded, updateUser, clear } = useUserInfo()

  const [orders, setOrders] = useState<Order[]>([])
  const [cafeterias, setCafeterias] = useState<Record<string, CafeteriaInfo>>({})
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const [menuOpen, setMenuOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [saving, setSaving] = useState(false)

  const menuRef = useRef<HTMLDivElement>(null)

  const statuses = {
    pending: { icon: Clock, color: '#d4821a', label: 'Pending' },
    paid: { icon: Loader, color: '#2563eb', label: 'Paid' },
    approved: { icon: CheckCircle, color: '#2e9e6b', label: 'Approved' },
    preparing: { icon: ChefHat, color: '#E8334A', label: 'Preparing' },
    ready: { icon: CheckCircle, color: '#2e9e6b', label: 'Ready!' },
    collected: { icon: CheckCircle, color: '#2e9e6b', label: 'Collected' },
    cancelled: { icon: Clock, color: '#8a90a8', label: 'Cancelled' },
  }

  useEffect(() => {
    const fetchCafeterias = async () => {
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Cafeterias fetch timeout')), 10000)
        )
        const result = await Promise.race([
          supabase.from('cafeterias').select('id, name, image_emoji'),
          timeoutPromise
        ]) as any
        if (result.error) {
          console.error('Cafeterias fetch error:', result.error)
        } else if (result.data) {
          setCafeterias(Object.fromEntries(result.data.map((c: any) => [c.id, c])))
        }
      } catch (error) {
        console.error('Cafeterias fetch error:', error)
      }
    }
    fetchCafeterias()
  }, [])

  useEffect(() => {
    if (!isLoaded) return
    if (!user?.phone) { setLoadingOrders(false); return }

    const fetch = async () => {
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Orders fetch timeout')), 10000)
        )
        const result = await Promise.race([
          supabase
            .from('orders')
            .select('*')
            .eq('student_phone', user.phone)
            .order('created_at', { ascending: false }),
          timeoutPromise
        ]) as any
        if (result.error) {
          console.error('Orders fetch error:', result.error)
        } else if (result.data) {
          setOrders(result.data as Order[])
        }
      } catch (error) {
        console.error('Orders fetch error:', error)
      } finally {
        setLoadingOrders(false)
      }
    }

    fetch()

    // Real-time subscription for orders
    const channel = supabase.channel(`profile-orders-${user.phone}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `student_phone=eq.${user.phone}` }, (payload) => {
        console.log('Order change detected:', payload)
        fetch() // Refetch orders on any change
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.phone, isLoaded])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const openEdit = () => {
    setEditName(user?.name || '')
    setEditEmail(user?.email || '')
    setEditPhone(user?.phone || '')
    setMenuOpen(false)
    setEditOpen(true)
  }

  const saveEdit = async () => {
    setSaving(true)
    await updateUser({ name: editName, email: editEmail, phone: editPhone })
    setSaving(false)
    setEditOpen(false)
  }

  const handleLogout = async () => {
    await clear()
    router.push('/auth')
  }

  const pastOrders = orders.filter(o => ['collected', 'cancelled'].includes(o.status))

  return (
    <div style={{ minHeight: '100vh', background: '#f5f0eb', fontFamily: 'var(--font-body, sans-serif)' }}>

      {/* Header */}
      <div style={{ background: '#f5f0eb', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <motion.button {...hoverScale} onClick={() => router.push('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, marginLeft: -8 }}>
          <ArrowLeft size={22} color="#333" />
        </motion.button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <motion.button {...hoverScale} style={{ background: 'none', border: '1.5px solid #E8334A', borderRadius: 20, padding: '4px 14px', color: '#E8334A', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
            Help
          </motion.button>
          <div style={{ position: 'relative' }} ref={menuRef}>
            <motion.button {...hoverScale} onClick={() => setMenuOpen(o => !o)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <MoreVertical size={22} color="#333" />
            </motion.button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -6 }}
                  transition={{ duration: 0.15 }}
                  style={{ position: 'absolute', right: 0, top: 36, background: '#1a1a2e', borderRadius: 10, overflow: 'hidden', minWidth: 160, zIndex: 100, boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}
                >
                  <button onClick={openEdit} style={{ width: '100%', padding: '14px 18px', background: 'none', border: 'none', color: 'white', fontSize: 15, cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    Edit Profile
                  </button>
                  <button onClick={() => { setMenuOpen(false); router.push('/profile/settings') }} style={{ width: '100%', padding: '14px 18px', background: 'none', border: 'none', color: 'white', fontSize: 15, cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    Settings
                  </button>
                  <button onClick={handleLogout} style={{ width: '100%', padding: '14px 18px', background: 'none', border: 'none', color: 'white', fontSize: 15, cursor: 'pointer', textAlign: 'left' }}>
                    Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div style={{ padding: '8px 24px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#1a1a1a', lineHeight: 1.1 }}>{user?.name || 'User'}</div>
            <div style={{ fontSize: 15, color: '#666', marginTop: 6 }}>{user?.phone ? `+91 - ${user.phone}` : user?.email || ''}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <motion.button
              {...hoverScale}
              onClick={openEdit}
              style={{
                padding: '8px 16px',
                background: '#E8334A',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <Pencil size={14} />
              Edit
            </motion.button>
            <motion.button
              {...hoverScale}
              onClick={handleLogout}
              style={{
                padding: '8px 16px',
                background: '#f0f0f0',
                color: '#333',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Logout
            </motion.button>
          </div>
        </div>

        {/* Profile Details Card */}
        <div style={{ background: 'white', borderRadius: 14, padding: 18, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#888', letterSpacing: 1, marginBottom: 14, textTransform: 'uppercase' }}>Your Profile</div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>Name</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a' }}>{user?.name || '—'}</div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>Phone</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a' }}>{user?.phone || '—'}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>Email</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a' }}>{user?.email || '—'}</div>
          </div>
        </div>
      </div>

      {/* Quick tiles */}
      <motion.div initial="hidden" animate="visible" variants={stagger} style={{ margin: '0 16px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {[
          { icon: CreditCard, label: 'Payment Modes', href: '/profile/payment-modes' },
          { icon: RotateCcw, label: 'My Refunds', href: '/profile/refunds' },
          { icon: Ticket, label: 'My Vouchers', href: '/profile/vouchers' },
          { icon: Heart, label: 'Favourites', href: '/profile/favourites' },
        ].map(({ icon: Icon, label, href }) => (
          <motion.button
            key={label}
            variants={staggerItem}
            {...hoverLift}
            onClick={() => router.push(href)}
            style={{ background: 'white', borderRadius: 14, padding: '18px 14px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10, cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: 'none' }}
          >
            <Icon size={24} color="#444" strokeWidth={1.5} />
            <span style={{ fontSize: 13, fontWeight: 500, color: '#222' }}>{label}</span>
          </motion.button>
        ))}
      </motion.div>

      {/* Past Orders */}
      <div style={{ margin: '8px 16px 40px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#888', letterSpacing: 1, marginBottom: 14, textTransform: 'uppercase' }}>Past Orders</div>

        {loadingOrders ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#aaa' }}>Loading...</div>
        ) : pastOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#aaa' }}>No past orders yet</div>
        ) : (
          <motion.div initial="hidden" animate="visible" variants={stagger}>
          {pastOrders.map(order => {
            const cafe = cafeterias[order.cafeteria_id]
            const statusInfo = statuses[order.status as keyof typeof statuses]
            const StatusIcon = statusInfo?.icon
            const isExpanded = expandedOrderId === order.id

            return (
              <motion.div key={order.id} variants={staggerItem} style={{ marginBottom: 12 }}>
                <motion.div
                  {...hoverLift}
                  onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                  style={{ background: 'white', borderRadius: 14, padding: 16, cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                    <div style={{ fontSize: 30 }}>{cafe?.image_emoji || '🍱'}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 3 }}>{cafe?.name || 'Restaurant'}</div>
                      <div style={{ fontSize: 12, color: '#aaa' }}>#{order.id.slice(0, 8)}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {StatusIcon && <StatusIcon size={16} color={statusInfo.color} />}
                      <span style={{ fontSize: 13, fontWeight: 600, color: statusInfo?.color }}>{statusInfo?.label}</span>
                      {isExpanded ? <ChevronUp size={16} color="#aaa" /> : <ChevronDown size={16} color="#aaa" />}
                    </div>
                  </div>

                  <div style={{ marginBottom: 10 }}>
                    {order.items.slice(0, 2).map((item, i) => (
                      <div key={i} style={{ fontSize: 13, color: '#555', marginBottom: 2 }}>{item.quantity}x {item.name}</div>
                    ))}
                    {order.items.length > 2 && <div style={{ fontSize: 12, color: '#aaa' }}>+{order.items.length - 2} more</div>}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f0f0f0', paddingTop: 10 }}>
                    <span style={{ fontSize: 13, color: '#aaa' }}>Total</span>
                    <span style={{ fontSize: 15, fontWeight: 700 }}>₹{order.total_amount}</span>
                  </div>
                </motion.div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      style={{ marginTop: 8, background: 'white', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
                    >
                      <div style={{ padding: 16 }}>
                        <OrderTrackingRoadmap order={order} cafeteriaName={cafe?.name} />
                        {(order.status === 'cancelled' || order.status === 'collected') && (
                          <motion.button
                            {...hoverScale}
                            disabled={deleting === order.id}
                            onClick={async (e) => {
                              e.stopPropagation()
                              if (!confirm('Delete this order?')) return
                              setDeleting(order.id)
                              const { error } = await supabase.from('orders').delete().eq('id', order.id)
                              if (!error) setOrders(orders.filter(o => o.id !== order.id))
                              setDeleting(null)
                            }}
                            style={{ marginTop: 12, width: '100%', padding: '12px', background: deleting === order.id ? '#999' : '#dc2626', color: 'white', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
                          >
                            {deleting === order.id ? '⏳ Deleting...' : '🗑️ Delete Order'}
                          </motion.button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
          </motion.div>
        )}
      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {editOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            style={{ background: 'white', borderRadius: '20px 20px 0 0', padding: 28, width: '100%', maxWidth: 480, margin: '0 auto' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <span style={{ fontSize: 18, fontWeight: 700 }}>Edit Profile</span>
              <motion.button {...hoverScale} onClick={() => setEditOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></motion.button>
            </div>
            {[
              { label: 'Name', value: editName, set: setEditName, type: 'text' },
              { label: 'Email', value: editEmail, set: setEditEmail, type: 'email' },
              { label: 'Phone', value: editPhone, set: setEditPhone, type: 'tel' },
            ].map(({ label, value, set, type }) => (
              <div key={label} style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#888', display: 'block', marginBottom: 6 }}>{label}</label>
                <input
                  type={type}
                  value={value}
                  onChange={e => set(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #e0e0e0', fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            ))}
            <motion.button
              {...(!saving ? hoverScale : {})}
              onClick={saveEdit}
              disabled={saving}
              style={{ width: '100%', padding: '14px', background: '#E8334A', color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 16, cursor: saving ? 'not-allowed' : 'pointer', marginTop: 8, opacity: saving ? 0.7 : 1 }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </motion.button>
          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
