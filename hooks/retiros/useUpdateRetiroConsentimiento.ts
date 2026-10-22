'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'

// D-26: guarda si el adulto aceptó la verificación con Didit.
export function useUpdateRetiroConsentimiento() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, consentimiento }: { id: string; consentimiento: 'aceptado' | 'rechazado' }) => {
      const supabase = createClient()
      const { error } = await supabase
        .from('retiros')
        .update({ consentimiento_didit: consentimiento, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.retiros.all }),
  })
}
