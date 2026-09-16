'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { TransferenciaAuhFormValues } from '@/lib/validations/transferencia-auh.schema'

export function useUpdateTransferenciaAuh() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      vinculoId,
      values,
    }: {
      id: string
      vinculoId: string
      values: TransferenciaAuhFormValues
    }) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('transferencia_auh')
        .update({
          fecha_gestion: values.fecha_gestion || null,
          fecha_efectiva: values.fecha_efectiva || null,
          estado: values.estado,
          organismo: values.organismo || null,
          observaciones: values.observaciones || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_, { vinculoId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.transferenciaAuh.byVinculo(vinculoId) })
    },
  })
}
