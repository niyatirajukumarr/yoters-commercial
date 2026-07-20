'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { fadeUp, hoverScale } from '@/lib/motion'

export default function Vouchers() {
  const router = useRouter()

  return (
    <div style={{ minHeight: '100vh', background: '#f5f0eb' }}>
      {/* Header */}
      <div style={{ background: '#f5f0eb', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #eee' }}>
        <motion.button {...hoverScale} onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, marginLeft: -8 }}>
          <ArrowLeft size={22} color="#333" />
        </motion.button>
        <span style={{ fontSize: 16, fontWeight: 700, color: '#333' }}>My Vouchers</span>
        <div style={{ width: 40 }} />
      </div>

      {/* Empty State */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp} style={{ padding: '60px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎟️</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#333', marginBottom: 8 }}>No Vouchers Yet</div>
        <div style={{ fontSize: 14, color: '#999', lineHeight: 1.6 }}>
          Keep an eye out for exclusive vouchers and offers! They'll appear here once you unlock them.
        </div>
      </motion.div>
    </div>
  )
}
