'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { withTimeout } from '@/lib/utils/withTimeout'

export interface UserInfo {
  name: string
  phone: string
  email: string
}

async function loadProfile(u: { id: string; user_metadata?: { name?: string; phone?: string }; email?: string | null }): Promise<UserInfo> {
  // Timeout-guarded: a stalled fetch here must not leave the page's isLoaded
  // stuck at false forever. Fall back to session-only info on failure.
  try {
    const { data: profile } = await withTimeout(
      supabase.from('profiles').select('name, phone').eq('id', u.id).single(),
      8000,
      'Profile fetch timed out'
    ) as any
    return {
      name: profile?.name || u.user_metadata?.name || '',
      phone: profile?.phone || u.user_metadata?.phone || '',
      email: u.email || '',
    }
  } catch {
    return {
      name: u.user_metadata?.name || '',
      phone: u.user_metadata?.phone || '',
      email: u.email || '',
    }
  }
}

export function useUserInfo() {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false

    // Load from current Supabase session
    async function loadUser() {
      let session = null
      try {
        session = (await withTimeout(supabase.auth.getSession(), 8000, 'Session check timed out')).data.session
      } catch {
        // Timed out — fall through to the retry below rather than declaring
        // the user logged out on a single stalled request.
      }
      if (!session) {
        // getSession() can trigger an internal token-refresh check; on a flaky
        // mobile connection a single transient failure there resolves with
        // session: null even though the underlying session is still valid.
        // One short retry avoids treating that blip as a real logout — this
        // hook mounts fresh (no fallback to prior state) on every page.
        await new Promise(r => setTimeout(r, 700))
        try {
          session = (await withTimeout(supabase.auth.getSession(), 8000, 'Session check timed out')).data.session
        } catch {
          session = null
        }
      }
      if (cancelled) return
      if (session?.user) {
        const info = await loadProfile(session.user)
        if (!cancelled) setUser(info)
      } else {
        setUser(null)
      }
      setIsLoaded(true)
    }

    loadUser()

    // Keep in sync if auth state changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (cancelled) return
      if (session?.user) {
        const info = await loadProfile(session.user)
        if (!cancelled) setUser(info)
      } else {
        setUser(null)
      }
      setIsLoaded(true)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  const updateUser = async (info: Partial<UserInfo>) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return

    // Save to profiles table
    await supabase.from('profiles').upsert({
      id: session.user.id,
      email: session.user.email,
      ...info,
    })

    setUser(prev => ({ ...prev, ...info } as UserInfo))
  }

  const clear = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  return { user, isLoaded, updateUser, clear }
}