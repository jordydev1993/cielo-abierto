'use client'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { ValidacionRenaper } from '@/types/database.types'

export function useUltimaValidacionRenaper(referenteId: string) {
  return useQuery({
    queryKey: queryKeys.validacionesRenaper.ultimaByReferente(referenteId),
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('validaciones_renaper')
        .select('*')
        .eq('referente_id', referenteId)
        .order('consultado_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data as ValidacionRenaper | null
    },
    enabled: !!referenteId,
  })
}
