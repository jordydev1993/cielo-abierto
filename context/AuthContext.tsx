'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export type AppRole = 'Admin' | 'Equipo Tecnico' | 'Educador'

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

    const fetchRole = async (userId: string) => {
      const { data } = await supabase
        .from('usuarios')
        .select('roles(nombre)')
        .eq('auth_user_id', userId)
        .eq('activo', true)
        .single()

      if (data?.roles) {
        const roles = data.roles as unknown as { nombre: string }
        // 'Direccion' es un rol real de la institución — se trata como Admin
        const nombre = roles.nombre === 'Direccion' ? 'Admin' : roles.nombre
        setRole(nombre as AppRole)
      }
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) {
        fetchRole(user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchRole(session.user.id)
      } else {
        setRole(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, role, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
