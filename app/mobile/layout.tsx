'use client'

import { usePathname } from 'next/navigation'
import { AppTabBar } from '@/components/AppTabBar'
import './mobile.css'

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // The restaurant page renders its own copy of the same nav, scoped to that
  // restaurant (its menu / its food search / its orders). Match the trailing
  // slash — '/mobile/orders' also starts with '/mobile/order', which was
  // silently hiding the nav on the Orders tab.
  const isOnCafeteriaPage = pathname.startsWith('/mobile/order/')

  return (
    <>
      <style>{`
        html { background: white; }
        body { background: white; }
      `}</style>

      <div className="mobile-content">
        {children}
      </div>

      {/* Bottom Navigation - the cafeteria page renders its own scoped copy */}
      {!isOnCafeteriaPage && <AppTabBar />}
    </>
  )
}
