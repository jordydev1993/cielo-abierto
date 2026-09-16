'use client'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { VinculoTutela } from '@/types/database.types'

export function useVinculosTutelaByNnya(nnyaId: string) {
  return useQuery({
    queryKey: queryKeys.vinculosTutela.byNnya(nnyaId),
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('vinculos_tutela')
        .select('*, referente:referentes(*), usuario:usuarios!vinculos_tutela_usuario_id_fkey(id, nombre, apellido)')
        .eq('nnya_id', nnyaId)
        .order('vigente_desde', { ascending: false })
      if (error) throw error
      return data as VinculoTutela[]
    },
    enabled: !!nnyaId,
  })
}
