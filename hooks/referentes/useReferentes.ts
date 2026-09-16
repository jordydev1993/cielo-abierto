'use client'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { Referente } from '@/types/database.types'

export function useReferentes(soloActivos = false) {
  return useQuery({
    queryKey: [...queryKeys.referentes.lists(), { soloActivos }],
    queryFn: async () => {
      const supabase = createClient()
      let query = supabase.from('referentes').select('*').order('apellido')
      if (soloActivos) query = query.eq('activo', true)
      const { data, error } = await query
      if (error) throw error
      return data as Referente[]
    },
    staleTime: 5 * 60 * 1000,
  })
}
