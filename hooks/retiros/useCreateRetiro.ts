'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { getCurrentUsuarioId } from '@/lib/supabase/currentUsuario'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { AutorizacionRetiro, Retiro } from '@/types/database.types'

// Crea el retiro en curso. El trigger fn_validar_autorizacion_retiro rechaza una
// autorización revocada, vencida o de otro tutor o NNyA (RN-01).
export function useCreateRetiro() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (autorizacion: AutorizacionRetiro) => {
      if (!autorizacion.nnya_tutores) throw new Error('La autorización no tiene el vínculo cargado.')
      const supabase = createClient()
      const created_by = await getCurrentUsuarioId(supabase)
      const { data, error } = await supabase
        .from('retiros')
        .insert({
          nnya_id: autorizacion.nnya_tutores.nnya_id,
          tutor_id: autorizacion.nnya_tutores.tutor_id,
          autorizacion_retiro_id: autorizacion.id,
          created_by,
        })
        .select()
        .single()
      if (error) throw error
      return data as Retiro
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.retiros.all }),
  })
}
