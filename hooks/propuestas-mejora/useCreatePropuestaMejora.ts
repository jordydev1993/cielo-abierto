'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { PropuestaMejoraFormValues } from '@/lib/validations/propuesta-mejora.schema'

export function useCreatePropuestaMejora() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: PropuestaMejoraFormValues) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('propuestas_mejora')
        .insert({
          evaluacion_id: values.evaluacion_id,
          descripcion: values.descripcion,
          tipo: values.tipo,
          area: values.area || null,
          responsable_id: values.responsable_id || null,
          fecha_vencimiento: values.fecha_vencimiento || null,
          observaciones: values.observaciones || null,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.propuestasMejora.lists() })
      qc.invalidateQueries({ queryKey: queryKeys.propuestasMejora.notificaciones() })
    },
  })
}
