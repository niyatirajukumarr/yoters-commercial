'use client'
import { useRouter, usePathname } from 'next/navigation'
import { motion } from 'framer-motion'

export function MobileTabBar() {
  const router = useRouter()
  const path = usePathname()
  const tabs = [
    { icon: '🏠', label: 'Home',   href: '/browse' },
    { icon: '🛒', label: 'Orders', href: '/student' },
    { icon: '👤', label: 'Profile',href: '/profile' },
  ]
  return (
    <nav className="mobile-tab-bar">
      {tabs.map(t => (
        <motion.div key={t.href} className={`tab-item ${path === t.href ? 'active' : ''}`}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => router.push(t.href)}>
          <span className="tab-icon">{t.icon}</span>
          <span>{t.label}</span>
        </motion.div>
      ))}
    </nav>
  )
}