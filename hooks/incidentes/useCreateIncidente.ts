'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { IncidenteFormValues } from '@/lib/validations/incidentes.schema'

export function useCreateIncidente() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: IncidenteFormValues) => {
      const supabase = createClient()

      // I-EX-02: verificar que el legajo esté activo
      const { data: legajo } = await supabase
        .from('legajos')
        .select('estado')
        .eq('id', values.legajo_id)
        .single()

      if (legajo && legajo.estado !== 'activo') {
        throw new Error(
          'No se puede registrar un incidente en un legajo inactivo o cerrado. (I-EX-02)'
        )
      }

      const { data, error } = await supabase
        .from('incidentes')
        .insert({
          nnya_id: values.nnya_id,
          legajo_id: values.legajo_id,
          tipo: values.tipo,
          descripcion: values.descripcion,
          fecha_hora: new Date(values.fecha_hora).toISOString(),
          gravedad: values.gravedad,
          acciones_tomadas: values.acciones_tomadas || null,
          gravedad_sugerida: values.gravedad_sugerida ?? null,
          sugerencia_aceptada: values.sugerencia_aceptada ?? false,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: queryKeys.incidentes.byLegajo(data.legajo_id) })
      qc.invalidateQueries({ queryKey: queryKeys.incidentes.lists() })
      qc.invalidateQueries({ queryKey: queryKeys.alertas.byNnya(data.nnya_id) })
    },
  })
}
