'use client'

import { useParams, useSearchParams } from 'next/navigation'

// Route shapes differ between the two build targets.
//
// The web build is served by Next on Vercel, so a dynamic segment
// (/mobile/track/<id>) is resolved per request and reads nicely in a URL bar.
//
// The app build is a static export bundled inside Capacitor: there is no server
// to resolve a segment, and `output: 'export'` refuses any dynamic segment
// without generateStaticParams. Order ids and cafeteria slugs are created at
// runtime, so that list cannot exist at build time. The app therefore addresses
// the same screens by query string (/mobile/track?order=<id>), which exports to
// a single HTML file and is resolved in the browser.
//
// Both shapes render the identical screen component; only the address differs.
// Always link through these helpers so a link is correct on both targets.

export const IS_APP_BUILD = process.env.NEXT_PUBLIC_BUILD_TARGET === 'app'

export function orderHref(cafeteriaSlug: string): string {
  return IS_APP_BUILD
    ? `/mobile/order?cafe=${encodeURIComponent(cafeteriaSlug)}`
    : `/mobile/order/${cafeteriaSlug}`
}

export function trackHref(orderId: string): string {
  return IS_APP_BUILD
    ? `/mobile/track?order=${encodeURIComponent(orderId)}`
    : `/mobile/track/${orderId}`
}

export function deliveryHref(orderId: string): string {
  return IS_APP_BUILD
    ? `/delivery?order=${encodeURIComponent(orderId)}`
    : `/delivery/${orderId}`
}

// Reads an id from whichever place the current target put it: the dynamic
// segment on web, the query string in the app. Returns '' until the router has
// hydrated, so callers should treat empty as "not ready yet" rather than
// "missing" and avoid firing a fetch for it.
export function useRouteId(paramKey: string, queryKey: string): string {
  const params = useParams()
  const search = useSearchParams()
  const fromSegment = params?.[paramKey]
  if (typeof fromSegment === 'string' && fromSegment) return fromSegment
  if (Array.isArray(fromSegment) && fromSegment[0]) return fromSegment[0]
  return search?.get(queryKey) ?? ''
}
