'use client'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { Turno } from '@/types/database.types'

export function useTurnosByLegajo(legajoId: string) {
  return useQuery({
    queryKey: queryKeys.turnos.byLegajo(legajoId),
    queryFn: async (): Promise<Turno[]> => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('turnos')
        .select('*')
        .eq('legajo_id', legajoId)
        .order('fecha_hora', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!legajoId,
  })
}
