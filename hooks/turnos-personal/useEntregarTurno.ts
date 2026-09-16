'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { EntregaTurnoFormValues } from '@/lib/validations/entrega-turno.schema'

/**
 * Solo setea la mitad del titular (entregado_por/entregado_at/novedades_traspaso).
 * Nunca recibe ni acepta un `usuarioId` distinto del que llama, ni toca recibido_*
 * — ver prompts/013 y prompts/023 sobre por qué esa separación es la que hace real
 * la firma doble (RLS por sí sola no puede validar que el receptor sea otra persona).
 */
export function useEntregarTurno() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      miUsuarioId,
      values,
    }: {
      id: string
      miUsuarioId: string
      values: EntregaTurnoFormValues
    }) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('turnos_personal')
        .update({
          entregado_por: miUsuarioId,
          entregado_at: new Date().toISOString(),
          novedades_traspaso: values.novedades_traspaso || null,
          estado: 'entregado',
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
