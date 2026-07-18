import type { NextConfig } from 'next'

// Derive the Supabase storage host from env so the image optimizer is scoped to
// it instead of proxying arbitrary HTTPS URLs ('**'), which is an SSRF / bandwidth
// abuse surface.
function supabaseHost(): string | null {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!url) return null
    return new URL(url).hostname
  } catch {
    return null
  }
}

const host = supabaseHost()

const remotePatterns: NonNullable<NextConfig['images']>['remotePatterns'] = [
  // Supabase storage (project host + any regional subdomain of supabase.co).
  { protocol: 'https', hostname: '*.supabase.co' },
  { protocol: 'https', hostname: '*.supabase.in' },
]
if (host) {
  remotePatterns.push({ protocol: 'https', hostname: host })
}

// Same-origin for API responses; overridable via env for a known frontend origin.
const APP_ORIGIN = process.env.NEXT_PUBLIC_APP_URL || ''

// Content-Security-Policy scoped to the integrations this app actually uses
// (Razorpay checkout, Supabase REST/Realtime, Google Maps/Leaflet tiles).
// 'unsafe-inline' is required because the app renders inline <style> blocks and
// Next injects inline bootstrap scripts; tighten to nonces/hashes once validated
// on a preview deploy. Review against real traffic before further locking down.
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://maps.googleapis.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.supabase.in https://api.razorpay.com https://lumberjack.razorpay.com https://maps.googleapis.com",
  "frame-src https://api.razorpay.com https://checkout.razorpay.com",
  "worker-src 'self' blob:",
  'upgrade-insecure-requests',
].join('; ')

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self), payment=(self)' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Content-Security-Policy', value: CSP },
]

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      // Scope CORS on API responses to the app origin instead of '*'.
      ...(APP_ORIGIN
        ? [
            {
              source: '/api/(.*)',
              headers: [
                { key: 'Access-Control-Allow-Origin', value: APP_ORIGIN },
                { key: 'Vary', value: 'Origin' },
                { key: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
                { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
              ],
            },
          ]
        : []),
    ]
  },
}

export default nextConfig
