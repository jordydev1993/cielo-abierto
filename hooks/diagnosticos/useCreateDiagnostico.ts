'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { DiagnosticoFormValues } from '@/lib/validations/diagnosticos.schema'

export function useCreateDiagnostico() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: DiagnosticoFormValues) => {
      const supabase = createClient()

      // DGN-EX-04: verificar que el legajo esté activo
      const { data: legajo } = await supabase
        .from('legajos')
        .select('estado')
        .eq('id', values.legajo_id)
        .single()

      if (legajo && legajo.estado !== 'activo') {
        throw new Error(
          'No se pueden registrar diagnósticos en legajos cerrados o archivados. (DGN-EX-04)'
        )
      }

      const { data, error } = await supabase
        .from('diagnosticos')
        .insert({
          nnya_id: values.nnya_id,
          legajo_id: values.legajo_id,
          tipo: values.tipo,
          descripcion: values.descripcion,
          fecha_diagnostico: values.fecha_diagnostico,
          profesional: values.profesional || null,
          institucion: values.institucion || null,
          estado: 'activo',
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: queryKeys.diagnosticos.byLegajo(data.legajo_id) })
    },
  })
}
