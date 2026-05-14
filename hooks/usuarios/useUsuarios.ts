'use client'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { Usuario } from '@/types/database.types'

export function useUsuarios() {
  return useQuery({
    queryKey: queryKeys.usuarios.lists(),
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('usuarios')
        .select('*, roles(nombre)')
        .order('apellido')
      if (error) throw error
      return data as Usuario[]
    },
    staleTime: 5 * 60 * 1000,
  })
}
