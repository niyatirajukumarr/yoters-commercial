// Single entry point for calls to this project's own /api routes.
//
// On web the app and the API share an origin, so a relative path is correct and
// this is a pass-through. In the Capacitor build the UI is served from the
// device (https://localhost on Android, capacitor://localhost on iOS) while the
// API stays on Vercel, so a relative path would resolve against the device and
// fail. NEXT_PUBLIC_API_BASE_URL is baked in at app-build time to point at the
// deployed origin.
//
// Credentials: every protected API route in this repo authenticates from an
// `Authorization: Bearer <supabase access token>` header (see lib/auth-server.ts),
// never from a cookie. That is what makes the app build possible at all —
// cookies are not shared between the device origin and the API origin — so this
// wrapper attaches the caller's current Supabase token rather than relying on
// ambient credentials.

import { supabase } from './supabase'

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '')

export function apiUrl(path: string): string {
  if (!API_BASE) return path
  if (/^https?:\/\//i.test(path)) return path
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers)

  // Only attach the token to our own API. Sending it to an arbitrary absolute
  // URL passed in by a caller would leak the session to a third party.
  const isOwnApi = !/^https?:\/\//i.test(path)
  if (isOwnApi && !headers.has('Authorization')) {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }

  return fetch(apiUrl(path), { ...init, headers })
}
