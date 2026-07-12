'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus } from 'lucide-react'

const paymentMethods = [
  { id: 'gpay', name: 'Google Pay', type: 'wallet', status: 'linked' },
  { id: 'phonepe', name: 'PhonePe', type: 'wallet', status: 'linked' },
  { id: 'paytm', name: 'Paytm', type: 'wallet', status: 'linked' },
]

export default function PaymentModes() {
  const router = useRouter()

  return (
    <div style={{ minHeight: '100vh', background: '#f5f0eb', paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ background: '#f5f0eb', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #eee' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, marginLeft: -8 }}>
          <ArrowLeft size={22} color="#333" />
        </button>
        <span style={{ fontSize: 16, fontWeight: 700, color: '#333' }}>Payment Modes</span>
        <div style={{ width: 40 }} />
      </div>

      {/* Wallets Section */}
      <div style={{ padding: '20px 16px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#888', letterSpacing: 1, marginBottom: 14, textTransform: 'uppercase' }}>Digital Wallets</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {paymentMethods.map(method => (
            <div key={method.id} style={{ background: 'white', borderRadius: 14, padding: '16px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#333', marginBottom: 3 }}>{method.name}</div>
                <div style={{ fontSize: 12, color: '#999', textTransform: 'capitalize' }}>{method.status}</div>
              </div>
              <button style={{ background: '#E8334A', color: 'white', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                Manage
              </button>
            </div>
          ))}
        </div>

        {/* Add New */}
        <button style={{ marginTop: 20, width: '100%', padding: '14px', background: 'white', border: '2px dashed #ddd', borderRadius: 14, color: '#E8334A', fontWeight: 600, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Plus size={18} /> Add Payment Method
        </button>
      </div>
    </div>
  )
}
