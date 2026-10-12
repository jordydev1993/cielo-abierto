'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { Incidente } from '@/types/database.types'

interface CambiarEstadoIncidenteInput {
  id: string
  legajoId: string
  estado: Incidente['estado']
  // Obligatorio para cerrar: la base lo exige (chk_incidente_cerrado_con_acciones, prompts/037).
  accionesTomadas?: string
}

export function useCambiarEstadoIncidente() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, estado, accionesTomadas }: CambiarEstadoIncidenteInput) => {
      const supabase = createClient()
      const cambios: { estado: Incidente['estado']; acciones_tomadas?: string } = { estado }
      if (accionesTomadas !== undefined) cambios.acciones_tomadas = accionesTomadas
      const { error } = await supabase.from('incidentes').update(cambios).eq('id', id)
      if (error) {
        if (error.message.includes('chk_incidente_cerrado_con_acciones')) {
          throw new Error('Para cerrar el incidente hay que registrar las acciones tomadas.')
        }
        throw error
      }
    },
    onSuccess: (_, { legajoId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.incidentes.byLegajo(legajoId) })
      qc.invalidateQueries({ queryKey: queryKeys.incidentes.lists() })
    },
  })
}
