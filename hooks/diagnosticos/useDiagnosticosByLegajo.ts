'use client'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { Diagnostico } from '@/types/database.types'

export function useDiagnosticosByLegajo(legajoId: string) {
  return useQuery({
    queryKey: queryKeys.diagnosticos.byLegajo(legajoId),
    queryFn: async (): Promise<Diagnostico[]> => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('diagnosticos')
        .select('*')
        .eq('legajo_id', legajoId)
        .order('fecha_diagnostico', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!legajoId,
  })
}
