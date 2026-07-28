'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Home, Search, ShoppingBag, User } from 'lucide-react'
import { InteractiveMenu, type InteractiveMenuItem } from '@/components/ui/modern-mobile-menu'

// App-wide bottom nav. Inside a restaurant the same four tabs act on that
// restaurant instead (its menu / its food search / its orders), which the
// restaurant page wires up itself — see app/mobile/order/[cafeteriaId].
const TAB_ROUTES = ['/browse', '/mobile/search', '/mobile/orders', '/profile']

export function AppTabBar() {
  const router = useRouter()
  const pathname = usePathname()

  const activeIndex = (() => {
    if (pathname.startsWith('/mobile/search')) return 1
    if (pathname.startsWith('/mobile/orders')) return 2
    if (pathname.startsWith('/profile')) return 3
    if (pathname.startsWith('/browse') || pathname.startsWith('/mobile')) return 0
    return 0
  })()

  const items: InteractiveMenuItem[] = [
    { label: 'home', icon: Home, onSelect: () => router.push(TAB_ROUTES[0]) },
    { label: 'search', icon: Search, onSelect: () => router.push(TAB_ROUTES[1]) },
    { label: 'orders', icon: ShoppingBag, onSelect: () => router.push(TAB_ROUTES[2]) },
    { label: 'profile', icon: User, onSelect: () => router.push(TAB_ROUTES[3]) },
  ]

  return <InteractiveMenu items={items} activeIndex={activeIndex} />
}
