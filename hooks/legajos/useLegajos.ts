'use client'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { Legajo } from '@/types/database.types'

export function useLegajos() {
  return useQuery({
    queryKey: queryKeys.legajos.lists(),
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('legajos')
        .select('*, nnya(id, nombre, apellido, dni)')
        .order('fecha_apertura', { ascending: false })
      if (error) throw error
      return data as Legajo[]
    },
    staleTime: 5 * 60 * 1000,
  })
}
