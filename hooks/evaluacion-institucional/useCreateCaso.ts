'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { EvaluacionCasoFormValues } from '@/lib/validations/evaluacion-institucional-caso.schema'

function mapCasoError(msg: string): string {
  if (msg.includes('evaluacion_institucional_casos_evaluacion_id_nnya_id_key')) {
    return 'Ese NNyA ya tiene un caso registrado en esta evaluación.'
  }
  return msg
}

export function useCreateCaso() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      evaluacionId,
      values,
    }: {
      evaluacionId: string
      values: EvaluacionCasoFormValues
    }) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('evaluacion_institucional_casos')
        .insert({
          evaluacion_id: evaluacionId,
          nnya_id: values.nnya_id,
          resumen_situacion: values.resumen_situacion,
          indicador_avance: values.indicador_avance ? Number(values.indicador_avance) : null,
          recomendaciones: values.recomendaciones || null,
          seguimiento_requerido: values.seguimiento_requerido,
        })
        .select()
        .single()
      if (error) throw new Error(mapCasoError(error.message))
      return data
    },
    onSuccess: (_, { evaluacionId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.evaluacionCasos.byEvaluacion(evaluacionId) })
    },
  })
}
