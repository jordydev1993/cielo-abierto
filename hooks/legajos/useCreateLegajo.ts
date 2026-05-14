'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { LegajoFormValues } from '@/lib/validations/legajos.schema'

export function useCreateLegajo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: LegajoFormValues) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('legajos')
        .insert({
          nnya_id: values.nnya_id,
          numero_legajo: values.numero_legajo,
          fecha_apertura: values.fecha_apertura,
          observaciones: values.observaciones || null,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: queryKeys.legajos.lists() })
      qc.invalidateQueries({ queryKey: queryKeys.legajos.byNnya(data.nnya_id) })
    },
  })
}
