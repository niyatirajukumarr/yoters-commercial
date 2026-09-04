'use client'

import { Suspense } from 'react'
import OrderTrackingScreen from '@/components/screens/OrderTrackingScreen'

// Web target: the id arrives as a dynamic route segment. The app target uses
// the query-string twin one directory up (see lib/routes.ts); both render this
// same screen, and scripts/build-app.mjs drops this file from the app bundle
// because output:'export' cannot resolve a segment with no build-time id list.
export default function Page() {
  return (
    <Suspense fallback={null}>
      <OrderTrackingScreen />
    </Suspense>
  )
}
