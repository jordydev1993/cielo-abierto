'use client'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { Medicamento } from '@/types/database.types'

export function useMedicamentosByLegajo(legajoId: string) {
  return useQuery({
    queryKey: queryKeys.medicamentos.byLegajo(legajoId),
    queryFn: async (): Promise<Medicamento[]> => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('medicamentos')
        .select('*')
        .eq('legajo_id', legajoId)
        .order('fecha_inicio', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!legajoId,
  })
}
