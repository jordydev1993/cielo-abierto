'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'

interface ActualizarTurnoInput {
  id: string
  legajoId: string
  estado: 'realizado' | 'cancelado' | 'ausente' | 'confirmado'
  fechaHora: string
  observaciones?: string
}

export function useActualizarTurno() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, estado, fechaHora, observaciones }: ActualizarTurnoInput) => {
      // T-EX-06: no se puede marcar como realizado un turno con fecha futura
      if (estado === 'realizado' && new Date(fechaHora) > new Date()) {
        throw new Error(
          'No se puede marcar como realizado un turno con fecha futura. (T-EX-06)'
        )
      }

      const supabase = createClient()
      const { data, error } = await supabase
        .from('turnos')
        .update({
          estado,
          observaciones: observaciones ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data, { legajoId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.turnos.byLegajo(legajoId) })
      qc.invalidateQueries({ queryKey: queryKeys.turnos.lists() })
    },
  })
}
