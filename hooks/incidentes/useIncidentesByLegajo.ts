'use client'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { Incidente } from '@/types/database.types'

export function useIncidentesByLegajo(legajoId: string) {
  return useQuery({
    queryKey: queryKeys.incidentes.byLegajo(legajoId),
    queryFn: async (): Promise<Incidente[]> => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('incidentes')
        .select('*')
        .eq('legajo_id', legajoId)
        .order('fecha_hora', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!legajoId,
  })
}
