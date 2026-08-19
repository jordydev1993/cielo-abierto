'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'

interface DeleteDocumentoInput {
  id: string
  storagePath: string
}

export function useDeleteDocumento(legajoId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, storagePath }: DeleteDocumentoInput) => {
      const supabase = createClient()

      const { error: deleteError } = await supabase
        .from('documentos')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      await supabase.storage.from('documentos').remove([storagePath])
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.documentos.byLegajo(legajoId) })
    },
  })
}
