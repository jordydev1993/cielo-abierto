'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'

export function useToggleAsistio() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      evaluacionId,
      asistio,
    }: {
      id: string
      evaluacionId: string
      asistio: boolean
    }) => {
      const supabase = createClient()
      const { error } = await supabase
        .from('evaluacion_institucional_asistentes')
        .update({ asistio })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: (_, { evaluacionId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.evaluacionAsistentes.byEvaluacion(evaluacionId) })
    },
  })
}
