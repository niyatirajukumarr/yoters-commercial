'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useUserInfo } from '@/lib/hooks/useUserInfo'
import { Clock, CheckCircle, ChefHat, Loader, ChevronDown, ChevronUp, ArrowLeft, MoreVertical, CreditCard, RotateCcw, Ticket, Heart, X, Pencil } from 'lucide-react'
import { OrderTrackingRoadmap } from '@/components/OrderTrackingRoadmap'
import { Order } from '@/lib/types'

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
    supabase.from('cafeterias').select('id, name, image_emoji').then(({ data }) => {
      if (data) setCafeterias(Object.fromEntries(data.map(c => [c.id, c])))
    })
  }, [])

  useEffect(() => {
    if (!isLoaded) return
    if (!user?.phone) { setLoadingOrders(false); return }

    const fetch = async () => {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('student_phone', user.phone)
        .order('created_at', { ascending: false })
      if (data) setOrders(data as Order[])
      setLoadingOrders(false)
    }
    fetch()
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
        <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, marginLeft: -8 }}>
          <ArrowLeft size={22} color="#333" />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button style={{ background: 'none', border: '1.5px solid #E8334A', borderRadius: 20, padding: '4px 14px', color: '#E8334A', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
            Help
          </button>
          <div style={{ position: 'relative' }} ref={menuRef}>
            <button onClick={() => setMenuOpen(o => !o)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <MoreVertical size={22} color="#333" />
            </button>
            {menuOpen && (
              <div style={{ position: 'absolute', right: 0, top: 36, background: '#1a1a2e', borderRadius: 10, overflow: 'hidden', minWidth: 160, zIndex: 100, boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}>
                <button onClick={openEdit} style={{ width: '100%', padding: '14px 18px', background: 'none', border: 'none', color: 'white', fontSize: 15, cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  Edit Profile
                </button>
                <button style={{ width: '100%', padding: '14px 18px', background: 'none', border: 'none', color: 'white', fontSize: 15, cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  Settings
                </button>
                <button onClick={handleLogout} style={{ width: '100%', padding: '14px 18px', background: 'none', border: 'none', color: 'white', fontSize: 15, cursor: 'pointer', textAlign: 'left' }}>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hero */}
      <div style={{ padding: '8px 24px 28px' }}>
        <div style={{ fontSize: 32, fontWeight: 800, color: '#1a1a1a', lineHeight: 1.1 }}>{user?.name || 'User'}</div>
        <div style={{ fontSize: 15, color: '#666', marginTop: 6 }}>{user?.phone ? `+91 - ${user.phone}` : user?.email || ''}</div>
      </div>

      {/* Quick tiles */}
      <div style={{ margin: '0 16px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {[
          { icon: CreditCard, label: 'Payment Modes' },
          { icon: RotateCcw, label: 'My Refunds' },
          { icon: Ticket, label: 'My Vouchers' },
          { icon: Heart, label: 'Favourites' },
        ].map(({ icon: Icon, label }) => (
          <div key={label} style={{ background: 'white', borderRadius: 14, padding: '18px 14px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10, cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <Icon size={24} color="#444" strokeWidth={1.5} />
            <span style={{ fontSize: 13, fontWeight: 500, color: '#222' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Past Orders */}
      <div style={{ margin: '8px 16px 40px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#888', letterSpacing: 1, marginBottom: 14, textTransform: 'uppercase' }}>Past Orders</div>

        {loadingOrders ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#aaa' }}>Loading...</div>
        ) : pastOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#aaa' }}>No past orders yet</div>
        ) : (
          pastOrders.map(order => {
            const cafe = cafeterias[order.cafeteria_id]
            const statusInfo = statuses[order.status as keyof typeof statuses]
            const StatusIcon = statusInfo?.icon
            const isExpanded = expandedOrderId === order.id

            return (
              <div key={order.id} style={{ marginBottom: 12 }}>
                <div
                  onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                  style={{ background: 'white', borderRadius: 14, padding: 16, cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                    <div style={{ fontSize: 30 }}>{cafe?.image_emoji || '🍱'}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 3 }}>{cafe?.name || 'Cafeteria'}</div>
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
                </div>

                {isExpanded && (
                  <div style={{ marginTop: 8, background: 'white', borderRadius: 14, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                    <OrderTrackingRoadmap order={order} cafeteriaName={cafe?.name} />
                    {(order.status === 'cancelled' || order.status === 'collected') && (
                      <button
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
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Edit Profile Modal */}
      {editOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ background: 'white', borderRadius: '20px 20px 0 0', padding: 28, width: '100%', maxWidth: 480, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <span style={{ fontSize: 18, fontWeight: 700 }}>Edit Profile</span>
              <button onClick={() => setEditOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
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
            <button
              onClick={saveEdit}
              disabled={saving}
              style={{ width: '100%', padding: '14px', background: '#E8334A', color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 16, cursor: saving ? 'not-allowed' : 'pointer', marginTop: 8, opacity: saving ? 0.7 : 1 }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
