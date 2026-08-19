'use client'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { Intervencion } from '@/types/database.types'

export function useIntervencionesByNnya(nnyaId: string) {
  return useQuery({
    queryKey: queryKeys.intervenciones.byNnya(nnyaId),
    queryFn: async (): Promise<Intervencion[]> => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('intervenciones')
        .select('*, usuarios:profesional_id(id, nombre, apellido)')
        .eq('nnya_id', nnyaId)
        .order('fecha', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!nnyaId,
  })
}
