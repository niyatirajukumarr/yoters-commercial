'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export default function Refunds() {
  const router = useRouter()

  return (
    <div style={{ minHeight: '100vh', background: '#f5f0eb' }}>
      {/* Header */}
      <div style={{ background: '#f5f0eb', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #eee' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, marginLeft: -8 }}>
          <ArrowLeft size={22} color="#333" />
        </button>
        <span style={{ fontSize: 16, fontWeight: 700, color: '#333' }}>Refund Status</span>
        <div style={{ width: 40 }} />
      </div>

      {/* Empty State */}
      <div style={{ padding: '60px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>💰</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#333', marginBottom: 8 }}>No Refunds Right Now</div>
        <div style={{ fontSize: 14, color: '#999', lineHeight: 1.6 }}>
          Any refunds will be processed instantly and appear here. Your refunds are credited to your original payment source.
        </div>
      </div>
    </div>
  )
}
