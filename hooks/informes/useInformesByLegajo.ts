'use client'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { Informe } from '@/types/database.types'

export function useInformesByLegajo(legajoId: string) {
  return useQuery({
    queryKey: queryKeys.informes.byLegajo(legajoId),
    queryFn: async (): Promise<Informe[]> => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('informes')
        .select('*')
        .eq('legajo_id', legajoId)
        .order('fecha_informe', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!legajoId,
  })
}
