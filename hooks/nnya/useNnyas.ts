'use client'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { Nnya } from '@/types/database.types'

export function useNnyas(soloActivos = false) {
  return useQuery({
    queryKey: [...queryKeys.nnya.lists(), { soloActivos }],
    queryFn: async () => {
      const supabase = createClient()
      let q = supabase.from('nnya').select('*').order('apellido')
      if (soloActivos) q = q.eq('activo', true)
      const { data, error } = await q
      if (error) throw error
      return data as Nnya[]
    },
    staleTime: 5 * 60 * 1000,
  })
}
