'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'

// Admin: cierra un retiro en revisión sin autorizarlo (prompts/049, decisión 3).
export function useRechazarRetiro() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, motivo }: { id: string; motivo: string }) => {
      const supabase = createClient()
      const { error } = await supabase
        .from('retiros')
        .update({
          estado: 'rechazada',
          resultado_autorizacion: 'rechazada',
          motivo_rechazo: motivo,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.retiros.all }),
  })
}
