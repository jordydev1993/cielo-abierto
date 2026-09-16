'use client'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { SeguimientoPostEgreso } from '@/types/database.types'

export function useSeguimientosPostEgreso() {
  return useQuery({
    queryKey: queryKeys.seguimientoPostEgreso.lists(),
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('seguimiento_post_egreso')
        .select('*, nnya:nnya_id(id, nombre, apellido, dni)')
        .order('fecha_programada')
      if (error) throw error
      return data as SeguimientoPostEgreso[]
    },
    staleTime: 60 * 1000,
  })
}
