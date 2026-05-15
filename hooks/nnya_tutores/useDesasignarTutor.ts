'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'

export function useDesasignarTutor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ pivotId }: { pivotId: string; nnyaId: string }) => {
      const supabase = createClient()
      const { error } = await supabase
        .from('nnya_tutores')
        .delete()
        .eq('id', pivotId)
      if (error) throw error
    },
    onSuccess: (_, { nnyaId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.nnyaTutores.byNnya(nnyaId) })
    },
  })
}
