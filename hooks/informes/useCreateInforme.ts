'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { InformeFormValues } from '@/lib/validations/informes.schema'

export function useCreateInforme() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: InformeFormValues) => {
      const supabase = createClient()

      // INF-EX-04: verificar que el legajo esté activo
      const { data: legajo } = await supabase
        .from('legajos')
        .select('estado')
        .eq('id', values.legajo_id)
        .single()

      if (legajo && legajo.estado !== 'activo') {
        throw new Error(
          'No se pueden crear informes en legajos cerrados o archivados. (INF-EX-04)'
        )
      }

      const { data, error } = await supabase
        .from('informes')
        .insert({
          nnya_id: values.nnya_id,
          legajo_id: values.legajo_id,
          tipo: values.tipo,
          titulo: values.titulo,
          contenido: values.contenido,
          fecha_informe: values.fecha_informe,
          estado: 'borrador',
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: queryKeys.informes.byLegajo(data.legajo_id) })
      qc.invalidateQueries({ queryKey: queryKeys.informes.lists() })
    },
  })
}
