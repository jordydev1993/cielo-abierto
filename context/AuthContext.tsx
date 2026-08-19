'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { signOutAction } from '@/app/actions/auth'
import type { User } from '@supabase/supabase-js'

export type AppRole = 'Admin' | 'Equipo Tecnico'

interface AuthContextType {
  user: User | null
  role: AppRole | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<AppRole | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    let mounted = true
    let resolved = false

    // supabase.rpc() internally calls _getAccessToken() → getSession() → awaits
    // initializePromise. When called from inside onAuthStateChange while
    // initializePromise is still pending (full-page refresh), this deadlocks.
    // Bypass by calling the REST API directly with the token we already have.
    const fetchRoleWithToken = async (token: string): Promise<AppRole | null> => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/get_my_role`,
          {
            method: 'POST',
            headers: {
              apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: '{}',
          }
        )
        if (!res.ok) return null
        return await res.json()
      } catch {
        return null
      }
    }

    const resolveRole = async (currentUser: User | null, accessToken?: string) => {
      if (!mounted) return
      resolved = true
      setUser(currentUser)
      if (currentUser && accessToken) {
        const fetchedRole = await fetchRoleWithToken(accessToken)
        if (mounted) setRole(fetchedRole)
      } else {
        if (mounted) setRole(null)
      }
      if (mounted) setLoading(false)
    }

    // getSession() waits for initializePromise to resolve, then returns the
    // session from cookie storage. This handles the "no session" case where
    // neither SIGNED_IN nor TOKEN_REFRESHED fire.
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (!resolved) resolveRole(session?.user ?? null, session?.access_token ?? undefined)
      })
      .catch(() => {
        if (!resolved && mounted) { setRole(null); setLoading(false) }
      })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        resolved = false
        if (mounted) { setUser(null); setRole(null); setLoading(false) }
        return
      }
      // SIGNED_IN fires from _recoverAndRefresh() during initialization AND from
      // explicit logins. TOKEN_REFRESHED fires when the stored token is expired.
      // Both may fire while initializePromise is still pending (holding the lock),
      // so we pass access_token directly instead of calling getSession() again.
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        await resolveRole(session?.user ?? null, session?.access_token ?? undefined)
      }
      // INITIAL_SESSION: fires after initializePromise resolves. getSession() above
      // handles it; handling it here too would only duplicate the rpc call.
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    await signOutAction()
  }

  return (
    <AuthContext.Provider value={{ user, role, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
