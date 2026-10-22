'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { CerrarRetiroValues } from '@/lib/validations/retiros.schema'

// Cierre con hora de finalización y estado "Realizada" (RF22). La base exige
// fecha_fin >= fecha_inicio y, por Seguridad 2, identidad verificada o manual.
export function useCerrarRetiro() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      values,
      observacionesPrevias,
    }: {
      id: string
      values: CerrarRetiroValues
      observacionesPrevias: string | null
    }) => {
      const supabase = createClient()
      const observaciones =
        [observacionesPrevias, values.observaciones].filter(Boolean).join('\n') || null
      const { error } = await supabase
        .from('retiros')
        .update({
          fecha_fin: new Date(values.fecha_fin).toISOString(),
          observaciones,
          estado: 'realizada',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.retiros.all }),
  })
}
