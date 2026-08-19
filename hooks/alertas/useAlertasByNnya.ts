'use client'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { Alerta } from '@/types/database.types'

export function useAlertasByNnya(nnyaId: string) {
  return useQuery({
    queryKey: queryKeys.alertas.byNnya(nnyaId),
    queryFn: async (): Promise<Alerta[]> => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('alertas')
        .select('*')
        .eq('nnya_id', nnyaId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!nnyaId,
  })
}
