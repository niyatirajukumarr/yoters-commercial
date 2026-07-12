'use client'

import { useEffect } from 'react'

/**
 * Auto-reloads the page if data fetching fails.
 * Pass `failed` = true when your fetch errors out.
 */
export function useAutoReload(failed: boolean, delayMs = 500) {
  useEffect(() => {
    if (failed) {
      const t = setTimeout(() => window.location.reload(), delayMs)
      return () => clearTimeout(t)
    }
  }, [failed, delayMs])
}
