'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Bell, Leaf, HelpCircle, Info } from 'lucide-react'
import { useState } from 'react'
import { stagger, staggerItem, hoverScale } from '@/lib/motion'

export default function Settings() {
  const router = useRouter()
  const [notifications, setNotifications] = useState({ orders: true, promotions: false, offers: true })

  return (
    <div style={{ minHeight: '100vh', background: '#f5f0eb', paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ background: '#f5f0eb', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #eee' }}>
        <motion.button {...hoverScale} onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, marginLeft: -8 }}>
          <ArrowLeft size={22} color="#333" />
        </motion.button>
        <span style={{ fontSize: 16, fontWeight: 700, color: '#333' }}>Settings</span>
        <div style={{ width: 40 }} />
      </div>

      {/* Notifications */}
      <div style={{ padding: '20px 16px', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#888', letterSpacing: 1, marginBottom: 14, textTransform: 'uppercase' }}>Notifications</div>
        <motion.div initial="hidden" animate="visible" variants={stagger}>
          {[
            { key: 'orders', label: 'Order Updates', desc: 'Status changes & readiness alerts' },
            { key: 'promotions', label: 'Promotions', desc: 'New deals & special offers' },
            { key: 'offers', label: 'Offers', desc: 'Personalized recommendations' },
          ].map(({ key, label, desc }) => (
            <motion.div key={key} variants={staggerItem} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, padding: '12px', background: 'white', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#333', marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 12, color: '#999' }}>{desc}</div>
              </div>
              <input
                type="checkbox"
                checked={notifications[key as keyof typeof notifications]}
                onChange={(e) => setNotifications({ ...notifications, [key]: e.target.checked })}
                style={{ width: 20, height: 20, cursor: 'pointer' }}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Preferences */}
      <div style={{ padding: '20px 16px', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#888', letterSpacing: 1, marginBottom: 14, textTransform: 'uppercase' }}>Preferences</div>
        <motion.button {...hoverScale} style={{ width: '100%', padding: '14px 16px', background: 'white', border: 'none', borderRadius: 12, textAlign: 'left', fontSize: 15, fontWeight: 600, color: '#333', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', marginBottom: 10 }}>
          <Leaf size={18} style={{ marginRight: 12, display: 'inline' }} color="#2e9e6b" />
          Dietary Preferences
        </motion.button>
      </div>

      {/* Support */}
      <div style={{ padding: '20px 16px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#888', letterSpacing: 1, marginBottom: 14, textTransform: 'uppercase' }}>Support</div>
        <motion.button {...hoverScale} style={{ width: '100%', padding: '14px 16px', background: 'white', border: 'none', borderRadius: 12, textAlign: 'left', fontSize: 15, fontWeight: 600, color: '#333', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', marginBottom: 10 }}>
          <HelpCircle size={18} style={{ marginRight: 12, display: 'inline' }} color="#2563eb" />
          Help & FAQ
        </motion.button>
        <motion.button {...hoverScale} style={{ width: '100%', padding: '14px 16px', background: 'white', border: 'none', borderRadius: 12, textAlign: 'left', fontSize: 15, fontWeight: 600, color: '#333', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <Info size={18} style={{ marginRight: 12, display: 'inline' }} color="#666" />
          About & Version
        </motion.button>
      </div>
    </div>
  )
}
