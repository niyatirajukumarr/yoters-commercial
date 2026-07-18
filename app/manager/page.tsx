'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Order, Cafeteria, Notification } from '@/lib/types'
import { isManager } from '@/lib/config'
import { LogOut, TrendingUp, Clock, AlertCircle, CheckCircle } from 'lucide-react'

export default function ManagerDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<Order[]>([])
  const [cafeterias, setCafeterias] = useState<Cafeteria[]>([])
  const [activities, setActivities] = useState<Notification[]>([])
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'error' | 'warning' }>>([])

  const [stats, setStats] = useState({
    totalRevenue: 0,
    todayRevenue: 0,
    pendingApprovals: 0,
    successRate: 0,
  })

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session || !isManager(session.user.email)) {
        router.push('/')
        return
      }

      // Fetch all orders
      const { data: ordersData } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
      if (ordersData) setOrders(ordersData as Order[])

      // Fetch all cafeterias
      const { data: cafsData } = await supabase.from('cafeterias').select('*').order('name')
      if (cafsData) setCafeterias(cafsData as Cafeteria[])

      // Fetch manager notifications
      const { data: notifData } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_type', 'manager')
        .order('created_at', { ascending: false })
        .limit(20)
      if (notifData) setActivities(notifData as Notification[])

      setLoading(false)
    }

    fetchData()
  }, [router])

  // Real-time subscriptions
  useEffect(() => {
    const ordersChannel = supabase.channel('manager-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        setOrders(prev => {
          if (payload.eventType === 'INSERT') return [payload.new as Order, ...prev]
          if (payload.eventType === 'UPDATE') return prev.map(o => o.id === (payload.new as Order).id ? (payload.new as Order) : o)
          if (payload.eventType === 'DELETE') return prev.filter(o => o.id !== (payload.old as Order).id)
          return prev
        })
      })
      .subscribe()

    const notifChannel = supabase.channel('manager-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `recipient_type=eq.manager` }, (payload) => {
        const newNotif = payload.new as Notification
        setActivities(prev => [newNotif, ...prev.slice(0, 19)])
        showToast(newNotif.message, mapNotificationType(newNotif.notification_type))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(ordersChannel)
      supabase.removeChannel(notifChannel)
    }
  }, [])

  // Update stats whenever orders change
  useEffect(() => {
    const paidOrders = orders.filter(o => o.payment_status === 'paid')
    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total_amount, 0)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayRevenue = paidOrders
      .filter(o => new Date(o.created_at) >= today)
      .reduce((sum, o) => sum + o.total_amount, 0)

    const pendingApprovals = orders.filter(o => o.status === 'paid').length
    const successRate = orders.length > 0 ? Math.round((paidOrders.length / orders.length) * 100) : 0

    setStats({ totalRevenue, todayRevenue, pendingApprovals, successRate })
  }, [orders])

  const showToast = (message: string, type: 'success' | 'error' | 'warning') => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 5000)
  }

  const mapNotificationType = (type: string): 'success' | 'error' | 'warning' => {
    if (type === 'approved') return 'success'
    if (type === 'denied') return 'error'
    return 'warning'
  }

  const getVendorStats = (vendorEmail: string) => {
    const vendorOrders = orders.filter(o => {
      const caf = cafeterias.find(c => c.id === o.cafeteria_id)
      return caf?.vendor_email === vendorEmail
    })
    return {
      pending: vendorOrders.filter(o => o.status === 'paid').length,
      paid: vendorOrders.filter(o => o.payment_status === 'paid').length,
      revenue: vendorOrders.filter(o => o.payment_status === 'paid').reduce((sum, o) => sum + o.total_amount, 0),
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--muted)' }}>Loading manager dashboard...</div>
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <style>{`
        .manager-nav {
          background: white;
          border-bottom: 1px solid var(--border);
          padding: 16px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .manager-title {
          font-family: var(--font-head);
          font-size: 24px;
          font-weight: 700;
          color: var(--text);
        }
        .manager-logout {
          display: flex;
          align-items: center;
          gap: 8px;
          background: none;
          border: none;
          color: var(--accent);
          font-weight: 600;
          cursor: pointer;
          font-size: 14px;
          padding: 0;
        }
        .manager-content {
          max-width: 1400px;
          margin: 0 auto;
          padding: 24px;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        .stat-card {
          background: white;
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .stat-label {
          font-size: 12px;
          color: var(--muted);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .stat-value {
          font-family: var(--font-head);
          font-size: 32px;
          font-weight: 700;
          color: var(--text);
        }
        .stat-icon {
          position: absolute;
          top: 16px;
          right: 16px;
          opacity: 0.1;
          font-size: 40px;
        }
        .stat-card {
          position: relative;
          overflow: hidden;
        }
        .sections-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
        }
        .section {
          background: white;
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 20px;
        }
        .section-title {
          font-weight: 600;
          margin-bottom: 16px;
          font-size: 16px;
          color: var(--text);
        }
        .vendor-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid var(--border2);
          align-items: center;
          font-size: 13px;
        }
        .vendor-row:last-child {
          border-bottom: none;
        }
        .vendor-name {
          font-weight: 600;
          color: var(--text);
        }
        .vendor-stat {
          color: var(--text2);
        }
        .vendor-stat strong {
          color: var(--text);
          font-weight: 700;
        }
        .activity-item {
          padding: 12px 0;
          border-bottom: 1px solid var(--border2);
          font-size: 13px;
          line-height: 1.4;
        }
        .activity-item:last-child {
          border-bottom: none;
        }
        .activity-time {
          color: var(--muted);
          font-size: 11px;
          margin-top: 4px;
        }
        .toast-container {
          position: fixed;
          top: 80px;
          right: 20px;
          z-index: 1000;
          max-width: 400px;
        }
        .toast {
          background: white;
          border-left: 4px solid;
          border-radius: 6px;
          padding: 12px 16px;
          margin-bottom: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          animation: slideIn 0.3s ease-out;
          font-size: 13px;
        }
        .toast.success {
          border-color: var(--green);
          background: #f0fdf4;
          color: #166534;
        }
        .toast.error {
          border-color: var(--red);
          background: #fef2f2;
          color: #991b1b;
        }
        .toast.warning {
          border-color: #f59e0b;
          background: #fffbeb;
          color: #92400e;
        }
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @media (max-width: 1024px) {
          .sections-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 768px) {
          .manager-content {
            padding: 16px;
          }
          .stats-grid {
            grid-template-columns: 1fr;
          }
          .vendor-row {
            grid-template-columns: 1fr;
            gap: 6px;
          }
        }
      `}</style>

      {/* Navigation */}
      <div className="manager-nav">
        <div className="manager-title">📊 Manager Dashboard</div>
        <button onClick={handleLogout} className="manager-logout">
          <LogOut size={16} />
          Logout
        </button>
      </div>

      {/* Content */}
      <div className="manager-content">
        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div style={{ opacity: 0.08, position: 'absolute', top: 16, right: 16, fontSize: 32 }}>💰</div>
            <div className="stat-label">Total Revenue</div>
            <div className="stat-value">₹{stats.totalRevenue.toLocaleString()}</div>
          </div>
          <div className="stat-card">
            <div style={{ opacity: 0.08, position: 'absolute', top: 16, right: 16, fontSize: 32 }}>📈</div>
            <div className="stat-label">Today's Revenue</div>
            <div className="stat-value">₹{stats.todayRevenue.toLocaleString()}</div>
          </div>
          <div className="stat-card">
            <div style={{ opacity: 0.08, position: 'absolute', top: 16, right: 16, fontSize: 32 }}>⏳</div>
            <div className="stat-label">Pending Approvals</div>
            <div className="stat-value">{stats.pendingApprovals}</div>
          </div>
          <div className="stat-card">
            <div style={{ opacity: 0.08, position: 'absolute', top: 16, right: 16, fontSize: 32 }}>✅</div>
            <div className="stat-label">Success Rate</div>
            <div className="stat-value">{stats.successRate}%</div>
          </div>
        </div>

        {/* Vendor Ledger + Activity Feed */}
        <div className="sections-grid">
          {/* Vendor Payment Ledger */}
          <div className="section">
            <div className="section-title">Vendor Payment Ledger</div>
            {cafeterias.length === 0 ? (
              <div style={{ color: 'var(--muted)', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>
                No cafeterias yet
              </div>
            ) : (
              <div>
                <div className="vendor-row" style={{ fontWeight: 600, marginBottom: 8 }}>
                  <div>Vendor Name</div>
                  <div>Pending</div>
                  <div>Paid</div>
                  <div>Revenue</div>
                </div>
                {cafeterias.map(caf => {
                  const vendorStats = getVendorStats(caf.vendor_email)
                  return (
                    <div key={caf.id} className="vendor-row">
                      <div className="vendor-name">{caf.name}</div>
                      <div className="vendor-stat">{vendorStats.pending}</div>
                      <div className="vendor-stat"><strong>{vendorStats.paid}</strong></div>
                      <div className="vendor-stat"><strong>₹{vendorStats.revenue.toLocaleString()}</strong></div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Real-Time Activity Feed */}
          <div className="section">
            <div className="section-title">Activity Feed</div>
            {activities.length === 0 ? (
              <div style={{ color: 'var(--muted)', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>
                No activities yet
              </div>
            ) : (
              <div>
                {activities.map((activity, idx) => (
                  <div key={activity.id || idx} className="activity-item">
                    <div>
                      {activity.notification_type === 'approved' && '🟢'}
                      {activity.notification_type === 'denied' && '🔴'}
                      {activity.notification_type === 'ready' && '📦'}
                      {activity.notification_type === 'collected' && '✅'}
                      {' '}
                      {activity.message}
                    </div>
                    <div className="activity-time">
                      {new Date(activity.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Transaction Log */}
        <div className="section" style={{ marginTop: 24 }}>
          <div className="section-title">Transaction Log (Recent 20)</div>
          {orders.length === 0 ? (
            <div style={{ color: 'var(--muted)', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>
              No transactions yet
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--muted)', fontWeight: 600, textAlign: 'left' }}>
                    <th style={{ padding: '8px 0' }}>Order ID</th>
                    <th style={{ padding: '8px 0' }}>Vendor</th>
                    <th style={{ padding: '8px 0' }}>Amount</th>
                    <th style={{ padding: '8px 0' }}>Status</th>
                    <th style={{ padding: '8px 0' }}>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 20).map(order => {
                    const caf = cafeterias.find(c => c.id === order.cafeteria_id)
                    const statusColor = order.payment_status === 'paid' ? 'var(--green)' : 'var(--yellow)'
                    return (
                      <tr key={order.id} style={{ borderBottom: '1px solid var(--border2)', color: 'var(--text2)' }}>
                        <td style={{ padding: '10px 0' }}>#{order.id.slice(0, 8)}</td>
                        <td style={{ padding: '10px 0' }}>{caf?.name || '-'}</td>
                        <td style={{ padding: '10px 0' }}>₹{order.total_amount}</td>
                        <td style={{ padding: '10px 0', color: statusColor, fontWeight: 600 }}>
                          {order.payment_status === 'paid' ? '✅ Paid' : '⏳ Pending'}
                        </td>
                        <td style={{ padding: '10px 0', color: 'var(--muted)' }}>
                          {new Date(order.created_at).toLocaleTimeString()}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Toast Notifications */}
      {toasts.length > 0 && (
        <div className="toast-container">
          {toasts.map(toast => (
            <div key={toast.id} className={`toast ${toast.type}`}>
              {toast.message}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
