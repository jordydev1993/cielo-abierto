'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { AudienciaFormValues } from '@/lib/validations/audiencias.schema'

export function useCreateAudiencia() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: AudienciaFormValues) => {
      const supabase = createClient()

      // AJ-EX-03: verificar que el legajo esté activo
      const { data: legajo } = await supabase
        .from('legajos')
        .select('estado')
        .eq('id', values.legajo_id)
        .single()

      if (legajo && legajo.estado !== 'activo') {
        throw new Error(
          'No se pueden registrar audiencias en legajos cerrados o archivados. (AJ-EX-03)'
        )
      }

      const { data, error } = await supabase
        .from('audiencias_judiciales')
        .insert({
          nnya_id: values.nnya_id,
          legajo_id: values.legajo_id,
          tipo: values.tipo,
          fecha_hora: new Date(values.fecha_hora).toISOString(),
          tribunal: values.tribunal,
          juzgado: values.juzgado || null,
          numero_expediente: values.numero_expediente || null,
          caratula: values.caratula || null,
          observaciones: values.observaciones || null,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: queryKeys.audiencias.byLegajo(data.legajo_id) })
    },
  })
}
