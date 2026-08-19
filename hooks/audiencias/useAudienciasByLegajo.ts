'use client'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { AudienciaJudicial } from '@/types/database.types'

export function useAudienciasByLegajo(legajoId: string) {
  return useQuery({
    queryKey: queryKeys.audiencias.byLegajo(legajoId),
    queryFn: async (): Promise<AudienciaJudicial[]> => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('audiencias_judiciales')
        .select('*')
        .eq('legajo_id', legajoId)
        .order('fecha_hora', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!legajoId,
  })
}
