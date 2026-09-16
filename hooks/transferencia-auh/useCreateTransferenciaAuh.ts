'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { getCurrentUsuarioId } from '@/lib/supabase/currentUsuario'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { TransferenciaAuhFormValues } from '@/lib/validations/transferencia-auh.schema'

export function useCreateTransferenciaAuh() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      nnyaId,
      vinculoId,
      values,
    }: {
      nnyaId: string
      vinculoId: string
      values: TransferenciaAuhFormValues
    }) => {
      const supabase = createClient()
      const created_by = await getCurrentUsuarioId(supabase)
      const { data, error } = await supabase
        .from('transferencia_auh')
        .insert({
          nnya_id: nnyaId,
          vinculo_id: vinculoId,
          fecha_gestion: values.fecha_gestion || null,
          fecha_efectiva: values.fecha_efectiva || null,
          estado: values.estado,
          organismo: values.organismo || null,
          observaciones: values.observaciones || null,
          created_by,
        })
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
