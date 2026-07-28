'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Home, Search, ShoppingBag, User } from 'lucide-react'
import { InteractiveMenu, type InteractiveMenuItem } from '@/components/ui/modern-mobile-menu'
import { focusPageSearch } from '@/lib/utils/focusPageSearch'

// App-wide bottom nav. Inside a restaurant the same four tabs act on that
// restaurant instead (its menu / its food search / its orders), which the
// restaurant page wires up itself — see app/mobile/order/[cafeteriaId].
export function AppTabBar() {
  const router = useRouter()
  const pathname = usePathname()

  // Search isn't a route of its own, so track it here — and drop the
  // highlight as soon as the user navigates elsewhere.
  const [searchActive, setSearchActive] = useState(false)
  useEffect(() => { setSearchActive(false) }, [pathname])

  const routeIndex = (() => {
    if (pathname.startsWith('/mobile/orders')) return 2
    if (pathname.startsWith('/profile')) return 3
    return 0
  })()

  const items: InteractiveMenuItem[] = [
    {
      label: 'home',
      icon: Home,
      onSelect: () => { setSearchActive(false); router.push('/browse') },
    },
    {
      label: 'search',
      icon: Search,
      onSelect: () => {
        setSearchActive(true)
        // Pages that own a search box get scrolled to it; anywhere else,
        // search means "find a restaurant", so head to browse and focus
        // its box once it's mounted.
        if (!focusPageSearch()) router.push('/browse?focus=search')
      },
    },
    {
      label: 'orders',
      icon: ShoppingBag,
      onSelect: () => { setSearchActive(false); router.push('/mobile/orders') },
    },
    {
      label: 'profile',
      icon: User,
      onSelect: () => { setSearchActive(false); router.push('/profile') },
    },
  ]

  return <InteractiveMenu items={items} activeIndex={searchActive ? 1 : routeIndex} />
}
