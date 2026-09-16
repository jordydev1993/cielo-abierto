'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { EvaluacionCasoFormValues } from '@/lib/validations/evaluacion-institucional-caso.schema'

export function useUpdateCaso() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      evaluacionId,
      values,
    }: {
      id: string
      evaluacionId: string
      values: EvaluacionCasoFormValues
    }) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('evaluacion_institucional_casos')
        .update({
          resumen_situacion: values.resumen_situacion,
          indicador_avance: values.indicador_avance ? Number(values.indicador_avance) : null,
          recomendaciones: values.recomendaciones || null,
          seguimiento_requerido: values.seguimiento_requerido,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_, { evaluacionId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.evaluacionCasos.byEvaluacion(evaluacionId) })
    },
  })
}
