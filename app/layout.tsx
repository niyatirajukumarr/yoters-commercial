import type { Metadata } from 'next'
import { CookieConsent } from '@/components/CookieConsent'
import { NativeShell } from '@/components/NativeShell'
import './globals.css'

// The web build gets its Content-Security-Policy from next.config.ts headers().
// A static export has no server to send a header, so the app build carries the
// same policy as a <meta> tag instead. Directives that a meta tag cannot
// express (frame-ancestors) are irrelevant on a device — nothing can frame the
// app's webview.
const APP_CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://cdn.razorpay.com https://maps.googleapis.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  [
    "connect-src 'self'",
    process.env.NEXT_PUBLIC_API_BASE_URL || '',
    'https://*.supabase.co wss://*.supabase.co https://*.supabase.in',
    'https://api.razorpay.com https://lumberjack.razorpay.com https://maps.googleapis.com',
  ].filter(Boolean).join(' '),
  "frame-src https://api.razorpay.com https://checkout.razorpay.com",
  "worker-src 'self' blob:",
].join('; ')

const IS_APP_BUILD = process.env.NEXT_PUBLIC_BUILD_TARGET === 'app'

export const metadata: Metadata = {
  title: 'Yoters',
  description: 'Skip the restaurant rush. Pre-book your meal, walk in, pick up, leave.',
  icons: {
    icon: '/favicon.ico',
  }
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        {IS_APP_BUILD && <meta httpEquiv="Content-Security-Policy" content={APP_CSP} />}
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} />
        <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_SUPABASE_URL} />
      </head>
      <body>
        {children}
        <CookieConsent />
        <NativeShell />
      </body>
    </html>
  )
}