'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'

// Solo Admin (RLS autorizaciones_retiro_update_admin). No se borra: queda el historial.
export function useRevocarAutorizacion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase
        .from('autorizaciones_retiro')
        .update({ estado: 'revocada', updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.autorizacionesRetiro.all }),
  })
}
