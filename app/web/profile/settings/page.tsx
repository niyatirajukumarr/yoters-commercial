'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Bell, Leaf, HelpCircle, Info, Shield, Download, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { stagger, staggerItem, hoverScale } from '@/lib/motion'

export default function Settings() {
  const router = useRouter()
  const [notifications, setNotifications] = useState({ orders: true, promotions: false, offers: true })
  const [busy, setBusy] = useState<'export' | 'delete' | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  // DPDP right of access: download a JSON copy of the user's data.
  async function handleExport() {
    setMsg(null); setBusy('export')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setMsg('Please sign in again to download your data.'); setBusy(null); return }
      const res = await fetch('/api/account/export', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (!res.ok) { setMsg('Could not export your data. Please try again.'); setBusy(null); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = 'yoters-my-data.json'; a.click()
      URL.revokeObjectURL(url)
      setMsg('Your data download has started.')
    } catch { setMsg('Could not export your data. Please try again.') }
    setBusy(null)
  }

  // DPDP right to erasure: delete account + personal data.
  async function handleDelete() {
    if (!confirm('Delete your account and personal data permanently? This cannot be undone.')) return
    setMsg(null); setBusy('delete')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setMsg('Please sign in again to delete your account.'); setBusy(null); return }
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setMsg(d?.error || 'Could not delete your account. Please try again.'); setBusy(null); return
      }
      await supabase.auth.signOut()
      router.push('/')
    } catch { setMsg('Could not delete your account. Please try again.'); setBusy(null) }
  }

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

      {/* Your data & privacy (DPDP data-principal rights) */}
      <div style={{ padding: '20px 16px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#888', letterSpacing: 1, marginBottom: 14, textTransform: 'uppercase' }}>Your Data &amp; Privacy</div>

        <Link href="/privacy" style={{ display: 'block', width: '100%', padding: '14px 16px', background: 'white', border: 'none', borderRadius: 12, textAlign: 'left', fontSize: 15, fontWeight: 600, color: '#333', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', marginBottom: 10, textDecoration: 'none' }}>
          <Shield size={18} style={{ marginRight: 12, display: 'inline' }} color="#2563eb" />
          Privacy Policy
        </Link>

        <motion.button {...(busy === null ? hoverScale : {})} onClick={handleExport} disabled={busy !== null} style={{ width: '100%', padding: '14px 16px', background: 'white', border: 'none', borderRadius: 12, textAlign: 'left', fontSize: 15, fontWeight: 600, color: '#333', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', marginBottom: 10, opacity: busy ? 0.6 : 1 }}>
          <Download size={18} style={{ marginRight: 12, display: 'inline' }} color="#2e9e6b" />
          {busy === 'export' ? 'Preparing your data…' : 'Download my data'}
        </motion.button>

        <motion.button {...(busy === null ? hoverScale : {})} onClick={handleDelete} disabled={busy !== null} style={{ width: '100%', padding: '14px 16px', background: 'white', border: '1px solid #ffccd1', borderRadius: 12, textAlign: 'left', fontSize: 15, fontWeight: 600, color: '#E8334A', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', opacity: busy ? 0.6 : 1 }}>
          <Trash2 size={18} style={{ marginRight: 12, display: 'inline' }} color="#E8334A" />
          {busy === 'delete' ? 'Deleting…' : 'Delete my account'}
        </motion.button>

        {msg && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: 12, fontSize: 13, color: '#6b7180' }}>
            {msg}
          </motion.div>
        )}
      </div>
    </div>
  )
}
