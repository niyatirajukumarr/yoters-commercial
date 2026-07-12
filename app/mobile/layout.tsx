'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Home, Search, ShoppingBag, User } from 'lucide-react'
import './mobile.css'

const tabs = [
  { href: '/mobile', icon: Home, label: 'Home', id: 'home' },
  { href: '/mobile/search', icon: Search, label: 'Search', id: 'search' },
  { href: '/mobile/orders', icon: ShoppingBag, label: 'Orders', id: 'orders' },
  { href: '/mobile/profile', icon: User, label: 'Profile', id: 'profile' },
]

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Determine active tab
  const getActiveTab = () => {
    if (pathname === '/mobile' || pathname === '/mobile/home') return 'home'
    if (pathname.startsWith('/mobile/search')) return 'search'
    if (pathname.startsWith('/mobile/orders')) return 'orders'
    if (pathname.startsWith('/mobile/profile')) return 'profile'
    if (pathname.startsWith('/mobile/order')) return 'home' // Ordering is part of home flow
    return null
  }

  const activeTab = getActiveTab()
  const isOnCafeteriaPage = pathname.startsWith('/mobile/order')

  return (
    <>
      <style>{`
        html { background: white; }
        body { background: white; }
      `}</style>

      <div className="mobile-content">
        {children}
      </div>

      {/* Bottom Navigation - Hidden on cafeteria order pages */}
      {!isOnCafeteriaPage && (
        <nav className="mobile-bottom-nav">
          {tabs.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <Link key={tab.id} href={tab.href} className={`mobile-nav-item ${isActive ? 'active' : ''}`}>
                <div className="mobile-nav-icon">
                  <Icon size={24} strokeWidth={2} />
                </div>
                <div className="mobile-nav-label">{tab.label}</div>
              </Link>
            )
          })}
        </nav>
      )}
    </>
  )
}
