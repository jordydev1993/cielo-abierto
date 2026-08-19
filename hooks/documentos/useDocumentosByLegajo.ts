'use client'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { Documento } from '@/types/database.types'

export function useDocumentosByLegajo(legajoId: string) {
  return useQuery({
    queryKey: queryKeys.documentos.byLegajo(legajoId),
    queryFn: async (): Promise<Documento[]> => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('documentos')
        .select('*')
        .eq('legajo_id', legajoId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!legajoId,
  })
}
