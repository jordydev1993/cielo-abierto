'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { EvaluacionInstitucionalFormValues } from '@/lib/validations/evaluacion-institucional.schema'

function mapEvaluacionError(msg: string): string {
  if (msg.includes('evaluacion_institucional_periodo_mes_periodo_anio_key')) {
    return 'Ya existe una evaluación institucional para ese mes/año.'
  }
  return msg
}

export function useUpdateEvaluacionInstitucional() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: EvaluacionInstitucionalFormValues }) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('evaluacion_institucional')
        .update({
          periodo_mes: Number(values.periodo_mes),
          periodo_anio: Number(values.periodo_anio),
          fecha_reunion: values.fecha_reunion,
          observaciones: values.observaciones || null,
          estado: values.estado,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()
      if (error) throw new Error(mapEvaluacionError(error.message))
      return data
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.evaluacionInstitucional.lists() })
      qc.invalidateQueries({ queryKey: queryKeys.evaluacionInstitucional.detail(id) })
    },
  })
}
