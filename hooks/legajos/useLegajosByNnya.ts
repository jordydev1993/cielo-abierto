'use client'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { Legajo } from '@/types/database.types'

export function useLegajosByNnya(nnyaId: string | null) {
  return useQuery({
    queryKey: queryKeys.legajos.byNnya(nnyaId ?? ''),
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('legajos')
        .select('*')
        .eq('nnya_id', nnyaId!)
        .order('fecha_apertura', { ascending: false })
      if (error) throw error
      return data as Legajo[]
    },
    enabled: !!nnyaId,
  })
}
