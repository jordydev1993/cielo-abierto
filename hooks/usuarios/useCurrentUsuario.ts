'use client'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'

export function useCurrentUsuario() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['usuarios', 'me', user?.id],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nombre, apellido')
        .eq('auth_user_id', user!.id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!user?.id,
  })
}
