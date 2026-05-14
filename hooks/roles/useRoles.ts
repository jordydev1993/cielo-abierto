'use client'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { Rol } from '@/types/database.types'

export function useRoles() {
  return useQuery({
    queryKey: queryKeys.roles.lists(),
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('nombre')
      if (error) throw error
      return data as Rol[]
    },
    staleTime: 5 * 60 * 1000,
  })
}
