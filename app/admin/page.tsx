'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface PayoutData {
  vendor_name: string
  total_received: number
  total_paid: number
  pending_payout: number
  upi_id: string
  last_payout_date: string | null
}

export default function AdminDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [payoutData, setPayoutData] = useState<PayoutData | null>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [processingPayout, setProcessingPayout] = useState(false)
  const [payoutMessage, setPayoutMessage] = useState('')

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
          router.push('/auth')
          return
        }

        // Check if user is admin (only allow specific email)
        if (session.user.email !== 'niyati.rajukumar@gmail.com') {
          setLoading(false)
          return
        }

        setUser(session.user)
        setIsAuthorized(true)
        await fetchPayoutData()
      } catch (error) {
        console.error('Auth check error:', error)
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const fetchPayoutData = async () => {
    try {
      // Fetch all orders for Lit Bites Cafe
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('cafeteria_id', 'lit-bites-cafe')
        .eq('payment_status', 'paid')

      if (ordersError) throw ordersError

      // Calculate totals
      const totalReceived = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0

      // TODO: Fetch actual paid payouts from payouts table
      const totalPaid = 0
      const pendingPayout = totalReceived - totalPaid

      setOrders(orders || [])
      setPayoutData({
        vendor_name: 'Lit Bites Cafe',
        total_received: totalReceived,
        total_paid: totalPaid,
        pending_payout: pendingPayout,
        upi_id: '9110289805-2@ibl',
        last_payout_date: null
      })
      setLoading(false)
    } catch (error) {
      console.error('Fetch payout data error:', error)
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  const handleSendPayout = async () => {
    if (!payoutData || payoutData.pending_payout <= 0) {
      alert('No pending payouts')
      return
    }

    if (!confirm(`Send ₹${payoutData.pending_payout.toLocaleString()} to ${payoutData.upi_id}?`)) {
      return
    }

    setProcessingPayout(true)
    setPayoutMessage('')

    try {
      const response = await fetch('/api/admin/initiate-payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorName: payoutData.vendor_name,
          upiId: payoutData.upi_id,
          amount: payoutData.pending_payout
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Payout failed')
      }

      setPayoutMessage(`✅ Payout sent! ID: ${data.payout_id}`)
      setProcessingPayout(false)

      // Refresh data after 2 seconds
      setTimeout(() => {
        fetchPayoutData()
        setPayoutMessage('')
      }, 2000)
    } catch (error) {
      setPayoutMessage(`❌ Error: ${error instanceof Error ? error.message : 'Payout failed'}`)
      setProcessingPayout(false)
    }
  }

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>
  }

  if (!isAuthorized) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fdf8f5' }}>
        <div style={{ background: 'white', padding: 40, borderRadius: 12, textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>🔒</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Access Denied</h1>
          <p style={{ color: '#666', marginBottom: 24 }}>This dashboard is for authorized admins only.</p>
          <button
            onClick={handleLogout}
            style={{ padding: '10px 20px', background: '#E8334A', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
          >
            Logout
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fdf8f5', padding: 20 }}>
      <style>{`
        * { box-sizing: border-box; }
        .admin-card { background: white; border-radius: 12px; padding: 20px; border: 1px solid #eee; margin-bottom: 20px; }
        .admin-stat { display: flex; justify-content: space-between; align-items: center; padding: 16px; background: #f8f8f8; border-radius: 8px; margin-bottom: 12px; }
        .admin-stat-label { font-size: 14px; color: #666; font-weight: 500; }
        .admin-stat-value { font-size: 24px; font-weight: 700; color: #E8334A; }
        .admin-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
        .admin-title { font-size: 32px; font-weight: 700; color: #1a1f2e; }
        .orders-table { width: 100%; border-collapse: collapse; }
        .orders-table th { background: #f0f0f0; padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #ddd; }
        .orders-table td { padding: 12px; border-bottom: 1px solid #eee; }
      `}</style>

      <div className="admin-header">
        <div className="admin-title">💰 Payout Dashboard</div>
        <button
          onClick={handleLogout}
          style={{ padding: '8px 16px', background: 'white', border: '1px solid #E8334A', color: '#E8334A', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
        >
          Logout
        </button>
      </div>

      {/* Vendor Overview */}
      {payoutData && (
        <div className="admin-card">
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Lit Bites Cafe</h2>

          <div className="admin-stat">
            <span className="admin-stat-label">Total Received (Paid Orders)</span>
            <span className="admin-stat-value">₹{payoutData.total_received.toLocaleString()}</span>
          </div>

          <div className="admin-stat">
            <span className="admin-stat-label">Total Paid to Vendor</span>
            <span className="admin-stat-value" style={{ color: '#4CAF50' }}>₹{payoutData.total_paid.toLocaleString()}</span>
          </div>

          <div className="admin-stat">
            <span className="admin-stat-label">⏳ Pending Payout</span>
            <span className="admin-stat-value">₹{payoutData.pending_payout.toLocaleString()}</span>
          </div>

          <div style={{ background: '#f9f9f9', padding: 12, borderRadius: 8, marginTop: 20 }}>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>UPI ID</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1f2e' }}>{payoutData.upi_id}</div>
          </div>

          {payoutData.last_payout_date && (
            <div style={{ fontSize: 12, color: '#999', marginTop: 12 }}>
              Last payout: {new Date(payoutData.last_payout_date).toLocaleDateString()}
            </div>
          )}

          <button
            onClick={handleSendPayout}
            disabled={processingPayout || !payoutData || payoutData.pending_payout <= 0}
            style={{
              width: '100%',
              padding: '12px',
              background: payoutData?.pending_payout ? '#E8334A' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: payoutData?.pending_payout && !processingPayout ? 'pointer' : 'not-allowed',
              fontWeight: 600,
              marginTop: 20,
              fontSize: 14
            }}
          >
            {processingPayout ? '⏳ Processing...' : `💰 Send ₹${payoutData?.pending_payout.toLocaleString() || 0}`}
          </button>

          {payoutMessage && (
            <div style={{ marginTop: 12, padding: 12, background: payoutMessage.includes('✅') ? '#e8f5e9' : '#ffebee', borderRadius: 8, color: payoutMessage.includes('✅') ? '#2e7d32' : '#c62828', fontSize: 12, fontWeight: 600 }}>
              {payoutMessage}
            </div>
          )}
        </div>
      )}

      {/* Orders Table */}
      <div className="admin-card">
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Paid Orders ({orders.length})</h2>

        {orders.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Student</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td><code style={{ fontSize: 12 }}>{order.id.slice(0, 8)}...</code></td>
                    <td>{order.student_name}</td>
                    <td>₹{order.total_amount}</td>
                    <td>{new Date(order.created_at).toLocaleDateString()}</td>
                    <td><span style={{ background: '#e8f5e9', padding: '4px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600, color: '#2e7d32' }}>Paid</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: '#999', textAlign: 'center', padding: 40 }}>No paid orders yet</p>
        )}
      </div>

      {/* Info Box */}
      <div className="admin-card" style={{ background: '#fff0f2', border: '1px solid #ffd6dc' }}>
        <div style={{ fontSize: 14, color: '#C8233C', lineHeight: 1.6 }}>
          <strong>ℹ️ How it works:</strong><br/>
          1. Money arrives in your Razorpay account in real-time<br/>
          2. After 2 business days, it settles to your bank account<br/>
          3. Automatic UPI transfer to Lit Bites: <strong>{payoutData?.upi_id}</strong><br/>
          4. Check back here to see payout history
        </div>
      </div>
    </div>
  )
}
