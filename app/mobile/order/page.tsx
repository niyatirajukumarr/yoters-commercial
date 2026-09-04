'use client'

import { Suspense } from 'react'
import CafeteriaOrderScreen from '@/components/screens/CafeteriaOrderScreen'

// App target: the id arrives as a query parameter, so this exports to a single
// static HTML file that Capacitor can serve from the device. Also reachable on
// web, which keeps a link built by lib/routes.ts valid on both targets.
export default function Page() {
  return (
    <Suspense fallback={null}>
      <CafeteriaOrderScreen />
    </Suspense>
  )
}
