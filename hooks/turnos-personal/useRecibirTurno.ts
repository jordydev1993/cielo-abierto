'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'

/**
 * Solo setea la mitad del receptor (recibido_por/recibido_at). Nunca acepta un
 * `usuarioId` distinto del que llama — ver prompts/013 y prompts/023.
 */
export function useRecibirTurno() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, miUsuarioId }: { id: string; miUsuarioId: string }) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('turnos_personal')
        .update({
          recibido_por: miUsuarioId,
          recibido_at: new Date().toISOString(),
          estado: 'cerrado',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.turnosPersonal.lists() }),
  })
}
