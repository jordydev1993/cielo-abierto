'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { IntervencionFormValues } from '@/lib/validations/intervenciones.schema'

export function useUpdateIntervencion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: IntervencionFormValues }) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('intervenciones')
        .update({
          tipo: values.tipo,
          descripcion: values.descripcion,
          fecha: values.fecha,
          profesional_id: values.profesional_id,
          estado: values.estado,
          resultado: values.resultado || null,
          observaciones: values.observaciones || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: queryKeys.intervenciones.byNnya(data.nnya_id) })
      qc.invalidateQueries({ queryKey: queryKeys.intervenciones.lists() })
    },
  })
}
