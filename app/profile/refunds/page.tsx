'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { stagger, staggerItem, hoverLift, hoverScale } from '@/lib/motion'

interface RefundOrder {
  id: string
  total_amount: number
  items: Array<{ name: string; quantity: number }>
  denial_reason?: string
  denied_at?: string
  cafeteria_id: string
  cafeteria_name?: string
  created_at: string
  payment_status: string
}

export default function Refunds() {
  const router = useRouter()
  const [refunds, setRefunds] = useState<RefundOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRefunds = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const email = session?.user?.email

      // Fetch cancelled paid orders by this user's email
      const { data } = await supabase
        .from('orders')
        .select('*, cafeterias(name)')
        .eq('status', 'cancelled')
        .in('payment_status', ['paid', 'refund_initiated', 'refund_successful'])
        .eq('student_email', email ?? '')
        .order('denied_at', { ascending: false })

      if (data) {
        setRefunds(data.map((o: any) => ({
          ...o,
          cafeteria_name: o.cafeterias?.name ?? 'Restaurant',
        })))
      }
      setLoading(false)
    }
    fetchRefunds()
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#f5f0eb' }}>
      {/* Header */}
      <div style={{ background: '#f5f0eb', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #eee' }}>
        <motion.button {...hoverScale} onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, marginLeft: -8 }}>
          <ArrowLeft size={22} color="#333" />
        </motion.button>
        <span style={{ fontSize: 16, fontWeight: 700, color: '#333' }}>Refund Status</span>
        <div style={{ width: 40 }} />
      </div>

      <div style={{ padding: '20px 16px', maxWidth: 600, margin: '0 auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#aaa' }}>Loading...</div>
        ) : refunds.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>💰</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#333', marginBottom: 8 }}>No Refunds Right Now</div>
            <div style={{ fontSize: 14, color: '#999', lineHeight: 1.6 }}>
              Any refunds will be processed instantly and appear here.
            </div>
          </div>
        ) : (
          <motion.div initial="hidden" animate="visible" variants={stagger}>
          {refunds.map(refund => (
            <motion.div key={refund.id} variants={staggerItem} {...hoverLift} style={{ background: 'white', borderRadius: 14, padding: 16, marginBottom: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 2 }}>
                    {refund.cafeteria_name}
                  </div>
                  <div style={{ fontSize: 12, color: '#888' }}>
                    {refund.items?.map(i => `${i.name} x${i.quantity}`).join(', ')}
                  </div>
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#E8334A' }}>₹{refund.total_amount}</div>
              </div>

              {refund.denial_reason && (
                <div style={{ fontSize: 12, color: '#666', background: '#fff3f0', borderRadius: 8, padding: '6px 10px', marginBottom: 8 }}>
                  Reason: {refund.denial_reason}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 11, color: '#aaa' }}>
                  {refund.denied_at ? new Date(refund.denied_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                </div>
                {refund.payment_status === 'refund_successful' ? (
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#2e9e6b', background: '#e8f7f0', borderRadius: 20, padding: '3px 10px' }}>
                    ✅ Refund Successful
                  </div>
                ) : refund.payment_status === 'refund_initiated' ? (
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#d4821a', background: '#fff8ec', borderRadius: 20, padding: '3px 10px' }}>
                    🔄 Refund Initiated
                  </div>
                ) : (
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#888', background: '#f5f5f5', borderRadius: 20, padding: '3px 10px' }}>
                    ⏳ Processing
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}
