import type { Metadata } from 'next'
import './globals.css'

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
        <link rel="preconnect" href="https://qbvwcpjjattwebdzexni.supabase.co" />
        <link rel="dns-prefetch" href="https://qbvwcpjjattwebdzexni.supabase.co" />
      </head>
      <body>{children}</body>
    </html>
  )
}