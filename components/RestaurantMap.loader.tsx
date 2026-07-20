'use client'

import dynamic from 'next/dynamic'
import type { RestaurantMapProps } from '../lib/types/geo'

// Lazily-imported Map_Component. `next/dynamic` with `ssr: false` keeps Leaflet
// and every map asset out of any host page's initial/SSR bundle — they are
// requested only after this shell mounts on the client (Req 12.1). `ssr: false`
// is only valid inside a Client Component, hence the 'use client' above
// (Next 16 `next/dynamic` guide, node_modules/next/dist/docs).
const RestaurantMap = dynamic(() => import('./RestaurantMap'), {
  ssr: false,
  // Minimal chunk-fetch placeholder. The component renders its own richer
  // loading state once its code arrives, so this only covers the JS download.
  loading: () => <div style={{ width: '100%', height: '100%', minHeight: 280 }}>Loading map…</div>,
})

/**
 * Light shell that host pages import instead of `RestaurantMap` directly, so
 * Leaflet never enters their initial bundle (Req 12.1). Lazy-loads the real
 * {@link RestaurantMap} on the client and forwards every prop through unchanged.
 *
 * @param props see {@link RestaurantMapProps} — `restaurant`, `showRoute`, and
 *   `className` are passed straight to the underlying component.
 * @returns the client-only, dynamically-imported map element.
 */
export default function RestaurantMapLoader(props: RestaurantMapProps) {
  return <RestaurantMap {...props} />
}
