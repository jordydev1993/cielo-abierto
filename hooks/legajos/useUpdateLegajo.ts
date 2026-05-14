'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { LegajoCierreValues } from '@/lib/validations/legajos.schema'

export function useCerrarLegajo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, nnyaId, values }: { id: string; nnyaId: string; values: LegajoCierreValues }) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('legajos')
        .update({
          estado: values.estado,
          motivo_cierre: values.motivo_cierre,
          fecha_cierre: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data, { nnyaId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.legajos.lists() })
      qc.invalidateQueries({ queryKey: queryKeys.legajos.byNnya(nnyaId) })
    },
  })
}
