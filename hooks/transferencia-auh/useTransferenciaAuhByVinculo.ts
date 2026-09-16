'use client'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { TransferenciaAuh } from '@/types/database.types'

export function useTransferenciaAuhByVinculo(vinculoId: string) {
  return useQuery({
    queryKey: queryKeys.transferenciaAuh.byVinculo(vinculoId),
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('transferencia_auh')
        .select('*')
        .eq('vinculo_id', vinculoId)
        .maybeSingle()
      if (error) throw error
      return data as TransferenciaAuh | null
    },
    enabled: !!vinculoId,
  })
}
