'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface UserInfo {
  name: string
  phone: string
  email: string
}

export function useUserInfo() {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Load from current Supabase session
    async function loadUser() {
      let { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        // getSession() can trigger an internal token-refresh check; on a flaky
        // mobile connection a single transient failure there resolves with
        // session: null even though the underlying session is still valid.
        // One short retry avoids treating that blip as a real logout — this
        // hook mounts fresh (no fallback to prior state) on every page.
        await new Promise(r => setTimeout(r, 700))
        session = (await supabase.auth.getSession()).data.session
      }
      if (session?.user) {
        const u = session.user
        // Try to get extra profile info (name, phone) from profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, phone')
          .eq('id', u.id)
          .single()

        setUser({
          name: profile?.name || u.user_metadata?.name || '',
          phone: profile?.phone || u.user_metadata?.phone || '',
          email: u.email || '',
        })
      } else {
        setUser(null)
      }
      setIsLoaded(true)
    }

    loadUser()

    // Keep in sync if auth state changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const u = session.user
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, phone')
          .eq('id', u.id)
          .single()

        setUser({
          name: profile?.name || u.user_metadata?.name || '',
          phone: profile?.phone || u.user_metadata?.phone || '',
          email: u.email || '',
        })
      } else {
        setUser(null)
      }
      setIsLoaded(true)
    })

    return () => subscription.unsubscribe()
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