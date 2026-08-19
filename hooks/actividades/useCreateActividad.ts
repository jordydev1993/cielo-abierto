'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { ActividadFormValues } from '@/lib/validations/actividades.schema'

export function useCreateActividad() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: ActividadFormValues) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('actividades')
        .insert({
          titulo: values.titulo,
          descripcion: values.descripcion || null,
          tipo: values.tipo,
          fecha: values.fecha,
          hora_inicio: values.hora_inicio || null,
          hora_fin: values.hora_fin || null,
          lugar: values.lugar || null,
          responsable_id: values.responsable_id,
          nnya_ids: values.nnya_ids,
          observaciones: values.observaciones || null,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.actividades.lists() })
    },
  })
}
