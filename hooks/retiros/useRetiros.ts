'use client'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { Retiro } from '@/types/database.types'

// Retiros más recientes, con el NNyA, el tutor y sus sesiones de Didit (prompts/049).
export function useRetiros() {
  return useQuery({
    queryKey: queryKeys.retiros.lists(),
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('retiros')
        .select(
          '*, nnya(id, nombre, apellido), tutores(id, nombre, apellido, dni, parentesco), ' +
            'sesiones_didit(id, session_id, estado_didit, estado_rnf12, error_proveedor, dni_coincide, created_at)'
        )
        .order('created_at', { ascending: false })
        .limit(100)
      if (error) throw error
      return data as unknown as Retiro[]
    },
  })
}
