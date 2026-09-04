import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isManager } from '@/lib/config'
import { corsHeaders } from '@/lib/cors'

// Page-level auth gate. Standardised on @supabase/ssr (the rest of the app uses
// it) — no more deprecated @supabase/auth-helpers-nextjs and no @ts-ignore.
//
// Moved from app/middleware.ts to proxy.ts at the project root: this Next.js
// version (16.2.2) renamed the `middleware` file convention to `proxy` — a
// file named/located/exported as `middleware` never runs. See
// node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md.
//
// Note on /api: proxy does not guard API routes. Redirecting an API request to
// an HTML /auth page is wrong (and would break the Razorpay webhook and guest
// order/payment endpoints, which are intentionally session-less). Instead,
// every sensitive API route self-protects (authenticated admin token for
// payouts, vendor-ownership checks for deny-order, ownership checks for
// delete-order, signature verification for payment/webhook routes).
//
// API routes are matched here only to attach CORS headers and answer preflight
// requests for the mobile app — see the early return at the top of proxy().
// Nothing below that return runs for them.

export async function proxy(req: NextRequest) {
  // /api is handled first and returned early. Proxy still performs no auth on
  // API routes — they self-protect, and redirecting an API request to an HTML
  // /auth page would break the Razorpay webhook and the guest order endpoints.
  // The only thing added here is CORS, which the mobile app needs: its requests
  // come from the device origin (https://localhost, capacitor://localhost) and
  // carry an Authorization header, so every one is preflighted. The allowed
  // origin differs per caller, which a static headers() entry in next.config.ts
  // cannot express — hence doing it here.
  if (req.nextUrl.pathname.startsWith('/api')) {
    const cors = corsHeaders(req.headers.get('origin'))

    // Answer the preflight directly. Route handlers define no OPTIONS method,
    // and a preflight that does not come back 2xx fails the real request.
    if (req.method === 'OPTIONS') {
      return new NextResponse(null, { status: 204, headers: cors })
    }

    const apiRes = NextResponse.next({ request: req })
    for (const [k, v] of Object.entries(cors)) apiRes.headers.set(k, v)
    return apiRes
  }

  let res = NextResponse.next({ request: req })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
          res = NextResponse.next({ request: req })
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Public pages that never require a session. Privacy/terms must be reachable
  // without login (DPDP notice must be accessible to prospective users).
  //
  // Browsing is deliberately open. The funnel is landing → browse → pick a
  // restaurant → read the menu, and the first add-to-cart is where we ask who
  // you are. Anything tied to a particular person — their orders, their
  // profile, order tracking, checkout — stays behind the gate.
  //
  // Exact and prefix lists are kept apart because the two behave differently
  // inside /mobile: '/mobile' itself is public (it only redirects to
  // /mobile/home) while '/mobile/profile' must not be. '/mobile/order' as a
  // prefix matches '/mobile/order/lethafi' but NOT '/mobile/orders', because
  // the check appends a slash — the same trap the mobile layout hit.
  const path = req.nextUrl.pathname
  const PUBLIC_EXACT = [
    '/', '/splash', '/privacy', '/terms',
    '/browse', '/mobile', '/mobile/home',
  ]
  // '/delivery/[orderId]' is the no-login delivery bill-sheet a vendor
  // shares with whoever's carrying the order — the unguessable order id is
  // its access control (see app/api/delivery/[orderId]/route.ts), not a
  // session, so it must stay reachable without one.
  const PUBLIC_PREFIX = ['/auth', '/vendor', '/mobile/order', '/delivery']
  const isPublic =
    PUBLIC_EXACT.includes(path) ||
    PUBLIC_PREFIX.some(p => path === p || path.startsWith(p + '/'))

  // Manager route protection — role-based, not a hardcoded email literal.
  if (req.nextUrl.pathname.startsWith('/manager')) {
    if (!user || !isManager(user.email)) {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  // Not logged in + trying to access a protected page → redirect to /auth,
  // carrying where they were headed so they resume there afterwards rather
  // than being dumped on /browse.
  if (!user && !isPublic) {
    const authUrl = new URL('/auth', req.url)
    authUrl.searchParams.set('next', path + req.nextUrl.search)
    return NextResponse.redirect(authUrl)
  }

  // Already logged in + hitting /auth → onwards. `next` is only honoured when
  // it is a path on this site: a value like '//evil.com' is a protocol-relative
  // URL, not a local path, and would be an open redirect.
  if (user && path === '/auth') {
    const next = req.nextUrl.searchParams.get('next')
    const dest = next && next.startsWith('/') && !next.startsWith('//') ? next : '/browse'
    return NextResponse.redirect(new URL(dest, req.url))
  }

  return res
}

export const config = {
  // API routes are matched now (for CORS only — see the early return above),
  // but Next internals and static assets are not.
  // Naming individual files (favicon.ico, logo.png, ...) missed everything else
  // in /public — hero-video.mp4, the 3D penguin's .obj/.mtl/texture, etc. — so
  // an unauthenticated request for any of them got redirected to /auth and
  // served that page's HTML instead of the actual file. Exclude by extension
  // instead: any path segment containing a dot is a static asset, not a page.
  matcher: ['/((?!_next/static|_next/image|.*\\..*).*)'],
}
