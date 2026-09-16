'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'

export function useRemoveAsistente() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id }: { id: string; evaluacionId: string }) => {
      const supabase = createClient()
      const { error } = await supabase
        .from('evaluacion_institucional_asistentes')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: (_, { evaluacionId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.evaluacionAsistentes.byEvaluacion(evaluacionId) })
    },
  })
}
