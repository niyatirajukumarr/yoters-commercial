'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Cafeteria {
  id: string
  name: string
  upi_id: string | null
  total_received: number
  total_paid: number
  pending_payout: number
  order_count: number
}

export default function AdminDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [cafeterias, setCafeterias] = useState<Cafeteria[]>([])
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [processingPayout, setProcessingPayout] = useState<string | null>(null)
  const [payoutMessage, setPayoutMessage] = useState<{ [key: string]: string }>({})
  const [editingUPI, setEditingUPI] = useState<{ [key: string]: string }>({})
  const [savingUPI, setSavingUPI] = useState<string | null>(null)
  const [totalReceived, setTotalReceived] = useState(0)

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
        await fetchAllPayoutData()
      } catch (error) {
        console.error('Auth check error:', error)
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const fetchAllPayoutData = async () => {
    try {
      // Fetch all cafeterias
      const { data: cafsData, error: cafsError } = await supabase
        .from('cafeterias')
        .select('id, name, upi_id')
        .order('name', { ascending: true })

      if (cafsError) throw cafsError

      // Fetch all paid orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('cafeteria_id, total_amount, payment_status')
        .eq('payment_status', 'paid')

      if (ordersError) throw ordersError

      // Calculate totals per cafeteria
      const cafePayouts: { [key: string]: Cafeteria } = {}
      let grandTotal = 0

      cafsData?.forEach(cafe => {
        cafePayouts[cafe.id] = {
          id: cafe.id,
          name: cafe.name,
          upi_id: cafe.upi_id,
          total_received: 0,
          total_paid: 0,
          pending_payout: 0,
          order_count: 0
        }
      })

      ordersData?.forEach(order => {
        if (cafePayouts[order.cafeteria_id]) {
          cafePayouts[order.cafeteria_id].total_received += order.total_amount || 0
          cafePayouts[order.cafeteria_id].order_count += 1
          grandTotal += order.total_amount || 0
        }
      })

      // Calculate pending payouts
      Object.keys(cafePayouts).forEach(cafeId => {
        cafePayouts[cafeId].pending_payout = cafePayouts[cafeId].total_received - cafePayouts[cafeId].total_paid
      })

      setCafeterias(Object.values(cafePayouts))
      setTotalReceived(grandTotal)
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

  const handleEditUPI = (cafeId: string, currentUPI: string | null) => {
    setEditingUPI({ ...editingUPI, [cafeId]: currentUPI || '' })
  }

  const handleSaveUPI = async (cafeId: string, cafeName: string) => {
    const newUPI = editingUPI[cafeId]

    if (!newUPI) {
      alert('UPI ID cannot be empty')
      return
    }

    setSavingUPI(cafeId)

    try {
      const { error } = await supabase
        .from('cafeterias')
        .update({ upi_id: newUPI })
        .eq('id', cafeId)

      if (error) throw error

      // Update local state
      setCafeterias(cafeterias.map(cafe =>
        cafe.id === cafeId ? { ...cafe, upi_id: newUPI } : cafe
      ))

      const updatedEditingUPI = { ...editingUPI }
      delete updatedEditingUPI[cafeId]
      setEditingUPI(updatedEditingUPI)
      setPayoutMessage({ ...payoutMessage, [cafeId]: '✅ UPI ID updated!' })

      setTimeout(() => {
        setPayoutMessage({ ...payoutMessage, [cafeId]: '' })
      }, 2000)
    } catch (error) {
      setPayoutMessage({ ...payoutMessage, [cafeId]: `❌ Error: ${error instanceof Error ? error.message : 'Failed to update'}` })
    } finally {
      setSavingUPI(null)
    }
  }

  const handleSendPayout = async (cafe: Cafeteria) => {
    if (!cafe.upi_id) {
      alert('Please add UPI ID for this cafeteria first')
      setEditingUPI({ ...editingUPI, [cafe.id]: '' })
      return
    }

    if (cafe.pending_payout <= 0) {
      alert('No pending payouts for this cafe')
      return
    }

    if (!confirm(`Send ₹${cafe.pending_payout.toLocaleString()} to ${cafe.name} (${cafe.upi_id})?`)) {
      return
    }

    setProcessingPayout(cafe.id)
    setPayoutMessage({ ...payoutMessage, [cafe.id]: '' })

    try {
      const response = await fetch('/api/admin/initiate-payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorName: cafe.name,
          upiId: cafe.upi_id,
          amount: cafe.pending_payout
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Payout failed')
      }

      setPayoutMessage({ ...payoutMessage, [cafe.id]: `✅ Sent! ID: ${data.payout_id}` })

      // Refresh data after 2 seconds
      setTimeout(() => {
        fetchAllPayoutData()
        setPayoutMessage({ ...payoutMessage, [cafe.id]: '' })
      }, 2000)
    } catch (error) {
      setPayoutMessage({ ...payoutMessage, [cafe.id]: `❌ Error: ${error instanceof Error ? error.message : 'Payout failed'}` })
    } finally {
      setProcessingPayout(null)
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
        .admin-stat { display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #f8f8f8; border-radius: 8px; margin-bottom: 10px; }
        .admin-stat-label { font-size: 13px; color: #666; font-weight: 500; }
        .admin-stat-value { font-size: 20px; font-weight: 700; color: #E8334A; }
        .admin-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
        .admin-title { font-size: 32px; font-weight: 700; color: #1a1f2e; }
        .cafe-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 20px; }
        .upi-input { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px; font-size: 13px; font-family: monospace; }
      `}</style>

      <div className="admin-header">
        <div className="admin-title">💰 Vendor Payouts</div>
        <button
          onClick={handleLogout}
          style={{ padding: '8px 16px', background: 'white', border: '1px solid #E8334A', color: '#E8334A', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
        >
          Logout
        </button>
      </div>

      {/* Grand Total */}
      <div className="admin-card" style={{ background: '#fff0f2', border: '2px solid #ffd6dc', marginBottom: 30 }}>
        <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>Total Received (All Restaurants)</div>
        <div style={{ fontSize: 48, fontWeight: 700, color: '#E8334A' }}>₹{totalReceived.toLocaleString()}</div>
        <div style={{ fontSize: 13, color: '#999', marginTop: 8 }}>Across {cafeterias.length} restaurants</div>
      </div>

      {/* Cafeteria Cards */}
      {cafeterias.length > 0 ? (
        <div className="cafe-grid">
          {cafeterias.map((cafe) => (
            <div key={cafe.id} className="admin-card">
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: '#1a1f2e' }}>{cafe.name}</h3>

              <div className="admin-stat">
                <span className="admin-stat-label">Orders</span>
                <span className="admin-stat-value" style={{ fontSize: 18 }}>{cafe.order_count}</span>
              </div>

              <div className="admin-stat">
                <span className="admin-stat-label">Received</span>
                <span className="admin-stat-value">₹{cafe.total_received.toLocaleString()}</span>
              </div>

              <div className="admin-stat">
                <span className="admin-stat-label">⏳ Pending</span>
                <span className="admin-stat-value">₹{cafe.pending_payout.toLocaleString()}</span>
              </div>

              {/* UPI ID Section */}
              <div style={{ background: '#f9f9f9', padding: 12, borderRadius: 8, marginTop: 16, marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: '#666', marginBottom: 8, fontWeight: 600 }}>UPI ID</div>
                {editingUPI[cafe.id] !== undefined ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      className="upi-input"
                      value={editingUPI[cafe.id]}
                      onChange={(e) => setEditingUPI({ ...editingUPI, [cafe.id]: e.target.value })}
                      placeholder="username@bank"
                    />
                    <button
                      onClick={() => handleSaveUPI(cafe.id, cafe.name)}
                      disabled={savingUPI === cafe.id}
                      style={{
                        padding: '8px 12px',
                        background: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: 6,
                        cursor: savingUPI === cafe.id ? 'not-allowed' : 'pointer',
                        fontWeight: 600,
                        fontSize: 12,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {savingUPI === cafe.id ? '...' : 'Save'}
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <code style={{ fontSize: 13, color: cafe.upi_id ? '#1a1f2e' : '#999', fontWeight: 600 }}>
                      {cafe.upi_id || 'Not set'}
                    </code>
                    <button
                      onClick={() => handleEditUPI(cafe.id, cafe.upi_id)}
                      style={{
                        padding: '4px 8px',
                        background: 'transparent',
                        color: '#E8334A',
                        border: '1px solid #E8334A',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: 11,
                        fontWeight: 600
                      }}
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>

              {/* Payout Message */}
              {payoutMessage[cafe.id] && (
                <div style={{
                  marginBottom: 12,
                  padding: 10,
                  background: payoutMessage[cafe.id].includes('✅') ? '#e8f5e9' : '#ffebee',
                  borderRadius: 6,
                  color: payoutMessage[cafe.id].includes('✅') ? '#2e7d32' : '#c62828',
                  fontSize: 12,
                  fontWeight: 600
                }}>
                  {payoutMessage[cafe.id]}
                </div>
              )}

              {/* Payout Button */}
              <button
                onClick={() => handleSendPayout(cafe)}
                disabled={processingPayout === cafe.id || cafe.pending_payout <= 0 || !cafe.upi_id}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: cafe.pending_payout > 0 && cafe.upi_id ? '#E8334A' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: cafe.pending_payout > 0 && cafe.upi_id && processingPayout !== cafe.id ? 'pointer' : 'not-allowed',
                  fontWeight: 600,
                  fontSize: 13
                }}
              >
                {processingPayout === cafe.id ? '⏳ Sending...' : `💰 Send ₹${cafe.pending_payout.toLocaleString()}`}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="admin-card" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ color: '#999', fontSize: 14 }}>No restaurants found</p>
        </div>
      )}

      {/* Info Box */}
      <div className="admin-card" style={{ background: '#fff0f2', border: '1px solid #ffd6dc', marginTop: 30 }}>
        <div style={{ fontSize: 13, color: '#C8233C', lineHeight: 1.7 }}>
          <strong>ℹ️ How to use:</strong><br/>
          1. Add or edit UPI ID for each cafeteria<br/>
          2. Click "Send" button to initiate payout<br/>
          3. Money transfers via Razorpay UPI<br/>
          4. Each cafeteria gets 100% of their revenue<br/>
          5. Track all payouts in payout history
        </div>
      </div>
    </div>
  )
}
