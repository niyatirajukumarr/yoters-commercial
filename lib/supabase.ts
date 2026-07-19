import { createBrowserClient } from '@supabase/ssr'

// Cookie-backed client (not plain @supabase/supabase-js's localStorage-only
// session). proxy.ts reads the session server-side via @supabase/ssr's
// createServerClient, which only sees cookies — a localStorage-only session
// is invisible to it, so every protected-route navigation would silently
// bounce back to /auth right after a successful login.
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
