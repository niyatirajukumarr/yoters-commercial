// Server-side authentication/authorization helpers for API routes.
//
// Enforces the ruleset's R6/R7: identity is derived from a verified Supabase
// session token (Authorization: Bearer <access_token>), never from a
// request-body field like `vendorEmail`. The service-role client is used only
// to verify the token and check ownership — after the caller is authenticated.

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { isAdmin, isManager } from './config'

let _admin: SupabaseClient | null = null

// Lazily-created service-role client (bypasses RLS). Server-only.
export function getAdminClient(): SupabaseClient {
  if (!_admin) {
    _admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
  }
  return _admin
}

function bearerToken(req: Request): string | null {
  const header = req.headers.get('authorization') || ''
  return header.startsWith('Bearer ') ? header.slice(7).trim() || null : null
}

export interface AuthedUser {
  id: string
  email: string | null
}

// Verify the bearer token and return the authenticated user, or null.
export async function getAuthedUser(req: Request): Promise<AuthedUser | null> {
  const token = bearerToken(req)
  if (!token) return null
  const { data, error } = await getAdminClient().auth.getUser(token)
  if (error || !data.user) return null
  return { id: data.user.id, email: data.user.email ?? null }
}

export async function requireAdmin(req: Request): Promise<AuthedUser | null> {
  const user = await getAuthedUser(req)
  if (!user || !isAdmin(user.email)) return null
  return user
}

export async function requireManager(req: Request): Promise<AuthedUser | null> {
  const user = await getAuthedUser(req)
  if (!user || (!isManager(user.email) && !isAdmin(user.email))) return null
  return user
}

export interface VendorContext {
  user: AuthedUser
  cafeteria: { id: string; name: string; vendor_email: string }
}

// Verify the caller is an authenticated vendor who owns the cafeteria that owns
// `orderId`. Managers/admins are also allowed. Returns the resolved context, or
// a reason string for the 401/403 response.
export async function requireVendorForOrder(
  req: Request,
  orderId: string
): Promise<{ ctx: VendorContext; order: any } | { error: 'unauthenticated' | 'forbidden' | 'not_found' }> {
  const user = await getAuthedUser(req)
  if (!user || !user.email) return { error: 'unauthenticated' }

  const admin = getAdminClient()
  const { data: order, error: orderError } = await admin
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single()
  if (orderError || !order) return { error: 'not_found' }

  const { data: cafeteria } = await admin
    .from('cafeterias')
    .select('id, name, vendor_email')
    .eq('id', order.cafeteria_id)
    .single()

  const owns = cafeteria && cafeteria.vendor_email === user.email
  if (!owns && !isManager(user.email) && !isAdmin(user.email)) {
    return { error: 'forbidden' }
  }

  return {
    ctx: { user, cafeteria: cafeteria as VendorContext['cafeteria'] },
    order,
  }
}

// Verify the caller owns (or manages) the given cafeteria id.
export async function requireVendorForCafeteria(
  req: Request,
  cafeteriaId: string
): Promise<{ ctx: VendorContext } | { error: 'unauthenticated' | 'forbidden' | 'not_found' }> {
  const user = await getAuthedUser(req)
  if (!user || !user.email) return { error: 'unauthenticated' }

  const { data: cafeteria } = await getAdminClient()
    .from('cafeterias')
    .select('id, name, vendor_email')
    .eq('id', cafeteriaId)
    .single()
  if (!cafeteria) return { error: 'not_found' }

  const owns = cafeteria.vendor_email === user.email
  if (!owns && !isManager(user.email) && !isAdmin(user.email)) {
    return { error: 'forbidden' }
  }

  return { ctx: { user, cafeteria: cafeteria as VendorContext['cafeteria'] } }
}

// Map a helper error to an HTTP status.
export function authErrorStatus(error: 'unauthenticated' | 'forbidden' | 'not_found'): number {
  if (error === 'unauthenticated') return 401
  if (error === 'forbidden') return 403
  return 404
}
