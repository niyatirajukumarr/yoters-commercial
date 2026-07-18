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
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
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
