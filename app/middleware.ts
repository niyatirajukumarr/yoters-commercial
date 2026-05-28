// @ts-ignore
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()

  const PUBLIC = ['/', '/auth', '/vendor', '/api']
  const isPublic = PUBLIC.some(p => req.nextUrl.pathname.startsWith(p))

  // Manager route protection - only niyati.rajukumar@gmail.com can access /manager
  if (req.nextUrl.pathname.startsWith('/manager')) {
    if (!session || session.user.email !== 'niyati.rajukumar@gmail.com') {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  // Not logged in + trying to access protected route → redirect to /auth
  if (!session && !isPublic) {
    return NextResponse.redirect(new URL('/auth', req.url))
  }

  // Already logged in + hitting /auth → redirect to /browse
  if (session && req.nextUrl.pathname === '/auth') {
    return NextResponse.redirect(new URL('/browse', req.url))
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.png).*)'],
}