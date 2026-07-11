'use client'

import { useEffect } from 'react'

export default function GlobalReloadHandler() {
  useEffect(() => {
    // When user comes back to the tab, reload to get fresh data
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        window.location.reload()
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  return null
}
