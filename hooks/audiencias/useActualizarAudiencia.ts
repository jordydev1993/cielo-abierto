'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'

interface ActualizarAudienciaInput {
  id: string
  legajoId: string
  estado: 'realizada' | 'suspendida' | 'cancelada'
  fechaHora: string
  resultado?: string
  observaciones?: string
}

export function useActualizarAudiencia() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, estado, fechaHora, resultado, observaciones }: ActualizarAudienciaInput) => {
      // AJ-EX-04: la resolución se registra solo sobre una audiencia programada que ya ocurrió
      if (estado === 'realizada' && new Date(fechaHora) > new Date()) {
        throw new Error(
          'No se puede registrar una resolución para una audiencia con fecha futura. (AJ-EX-04)'
        )
      }

      const supabase = createClient()
      const { data: actual, error: actualError } = await supabase
        .from('audiencias_judiciales')
        .select('estado')
        .eq('id', id)
        .single()
      if (actualError) throw actualError
      if (actual.estado !== 'programada') {
        throw new Error(
          'Solo se puede actualizar una audiencia programada: esta ya fue realizada, suspendida o cancelada. (AJ-EX-04)'
        )
      }

      const { data, error } = await supabase
        .from('audiencias_judiciales')
        .update({
          estado,
          resultado: resultado ?? null,
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
      qc.invalidateQueries({ queryKey: queryKeys.audiencias.byLegajo(legajoId) })
    },
  })
}
