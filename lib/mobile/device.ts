export function isMobileUserAgent(userAgent?: string): boolean {
  if (!userAgent) return false
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
  return mobileRegex.test(userAgent)
}

export function isMobileViewport(width: number): boolean {
  return width < 768
}

export function detectMobile(userAgent?: string, width?: number): boolean {
  if (userAgent && isMobileUserAgent(userAgent)) return true
  if (width !== undefined && isMobileViewport(width)) return true
  return false
}
