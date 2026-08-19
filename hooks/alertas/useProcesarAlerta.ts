'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'

export function useProcesarAlerta() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('alertas')
        .update({
          estado: 'en_proceso',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: queryKeys.alertas.byNnya(data.nnya_id) })
      qc.invalidateQueries({ queryKey: queryKeys.alertas.lists() })
      qc.invalidateQueries({ queryKey: queryKeys.alertas.pendientes() })
    },
  })
}
