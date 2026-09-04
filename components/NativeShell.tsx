'use client'

// Wires the webview into the OS. Mounted once from the root layout; a no-op in
// a browser, so the website is unaffected.
//
// This is also the difference between an app and a bookmark, in review terms:
// hardware back navigation, status-bar theming, a real splash handoff, push
// registration and deep links are all things a website cannot do, and Apple's
// guideline 4.2 asks for exactly that.

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { isNative, hideSplash, setStatusBarLight } from '@/lib/native'
import { logger } from '@/lib/logger'

export function NativeShell() {
  const router = useRouter()

  useEffect(() => {
    if (!isNative()) return
    let cleanups: Array<() => void> = []
    let cancelled = false

    ;(async () => {
      try {
        await setStatusBarLight()
        // Held until the first paint so the user never sees a white flash
        // between the launch image and the rendered screen.
        await hideSplash()

        const { App } = await import('@capacitor/app')

        // Android hardware back button. Without this it exits the app from any
        // screen, which reads as a crash.
        const back = await App.addListener('backButton', ({ canGoBack }) => {
          if (canGoBack) router.back()
          else App.exitApp()
        })

        // Deep links: a push notification or a shared order link opens the app
        // straight onto the right screen instead of the home tab.
        const deepLink = await App.addListener('appUrlOpen', ({ url }) => {
          try {
            const parsed = new URL(url)
            const target = `${parsed.pathname}${parsed.search}`
            if (target.startsWith('/')) router.push(target)
          } catch {
            logger.warn('[native] unparseable deep link')
          }
        })

        if (cancelled) {
          back.remove()
          deepLink.remove()
          return
        }
        cleanups = [() => back.remove(), () => deepLink.remove()]
      } catch (err) {
        logger.error('[native] shell init failed', err)
        // Never leave the splash covering a working app because a plugin threw.
        hideSplash().catch(() => {})
      }
    })()

    return () => {
      cancelled = true
      cleanups.forEach(fn => fn())
    }
  }, [router])

  return null
}
