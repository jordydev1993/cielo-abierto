'use client'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'

export function useAlertasPendientesCount() {
  return useQuery({
    queryKey: queryKeys.alertas.pendientes(),
    queryFn: async (): Promise<number> => {
      const supabase = createClient()
      const { count, error } = await supabase
        .from('alertas')
        .select('*', { count: 'exact', head: true })
        .in('estado', ['pendiente', 'en_proceso'])
      if (error) throw error
      return count ?? 0
    },
  })
}
