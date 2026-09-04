'use client'

// Native-only behaviour, kept behind one import so every call site stays
// runnable on the web build too.
//
// `Capacitor.isNativePlatform()` is false in a browser, and every function here
// returns early in that case, so nothing below changes how the website behaves.

import { Capacitor } from '@capacitor/core'

export const isNative = () => Capacitor.isNativePlatform()
export const platform = () => Capacitor.getPlatform() as 'web' | 'ios' | 'android'

export async function haptic(style: 'light' | 'medium' | 'heavy' = 'light') {
  if (!isNative()) return
  const { Haptics, ImpactStyle } = await import('@capacitor/haptics')
  const map = { light: ImpactStyle.Light, medium: ImpactStyle.Medium, heavy: ImpactStyle.Heavy }
  await Haptics.impact({ style: map[style] })
}

export async function hideSplash() {
  if (!isNative()) return
  const { SplashScreen } = await import('@capacitor/splash-screen')
  await SplashScreen.hide()
}

export async function setStatusBarLight() {
  if (platform() !== 'android' && platform() !== 'ios') return
  const { StatusBar, Style } = await import('@capacitor/status-bar')
  // Dark glyphs on the app's light background. Style.Light means "light
  // background", which is the opposite of what the name suggests.
  await StatusBar.setStyle({ style: Style.Light })
  if (platform() === 'android') {
    await StatusBar.setBackgroundColor({ color: '#FFF5F7' })
  }
}

export async function isOnline(): Promise<boolean> {
  if (!isNative()) return typeof navigator === 'undefined' ? true : navigator.onLine
  const { Network } = await import('@capacitor/network')
  return (await Network.getStatus()).connected
}

// Opens a URL outside the app: UPI deep links, a support phone number, the
// store listing. Keeping it out of the webview is what stops an external page
// from rendering inside the app's own chrome.
export async function openExternal(url: string) {
  if (!isNative()) {
    window.open(url, '_blank', 'noopener,noreferrer')
    return
  }
  const { Browser } = await import('@capacitor/browser')
  await Browser.open({ url })
}
