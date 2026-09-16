'use client'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { PropuestaMejora } from '@/types/database.types'

export function usePropuestasMejora() {
  return useQuery({
    queryKey: queryKeys.propuestasMejora.lists(),
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('propuestas_mejora')
        .select('*, responsable:usuarios(id, nombre, apellido)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as PropuestaMejora[]
    },
    staleTime: 60 * 1000,
  })
}
