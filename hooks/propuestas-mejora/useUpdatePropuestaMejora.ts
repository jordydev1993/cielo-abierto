'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { PropuestaMejora } from '@/types/database.types'

type PropuestaUpdate = Partial<
  Pick<
    PropuestaMejora,
    'descripcion' | 'tipo' | 'area' | 'responsable_id' | 'fecha_vencimiento' | 'estado' | 'observaciones'
  >
>

export function useUpdatePropuestaMejora() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: PropuestaUpdate }) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('propuestas_mejora')
        .update({ ...values, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.propuestasMejora.lists() })
      qc.invalidateQueries({ queryKey: queryKeys.propuestasMejora.notificaciones() })
    },
  })
}
