'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { Actividad } from '@/types/database.types'

export function useActualizarEstadoActividad() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: Actividad['estado'] }) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('actividades')
        .update({ estado, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.actividades.lists() })
    },
  })
}
