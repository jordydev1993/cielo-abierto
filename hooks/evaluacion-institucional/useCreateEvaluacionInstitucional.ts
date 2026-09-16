'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { getCurrentUsuarioId } from '@/lib/supabase/currentUsuario'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { EvaluacionInstitucionalFormValues } from '@/lib/validations/evaluacion-institucional.schema'

function mapEvaluacionError(msg: string): string {
  if (msg.includes('evaluacion_institucional_periodo_mes_periodo_anio_key')) {
    return 'Ya existe una evaluación institucional para ese mes/año.'
  }
  return msg
}

export function useCreateEvaluacionInstitucional() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: EvaluacionInstitucionalFormValues) => {
      const supabase = createClient()
      const created_by = await getCurrentUsuarioId(supabase)
      const { data, error } = await supabase
        .from('evaluacion_institucional')
        .insert({
          periodo_mes: Number(values.periodo_mes),
          periodo_anio: Number(values.periodo_anio),
          fecha_reunion: values.fecha_reunion,
          observaciones: values.observaciones || null,
          estado: values.estado,
          created_by,
        })
        .select()
        .single()
      if (error) throw new Error(mapEvaluacionError(error.message))
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.evaluacionInstitucional.lists() }),
  })
}
