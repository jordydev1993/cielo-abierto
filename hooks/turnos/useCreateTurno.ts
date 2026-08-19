'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { TurnoFormValues } from '@/lib/validations/turnos.schema'

export function useCreateTurno() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: TurnoFormValues) => {
      const supabase = createClient()

      // T-EX-04: verificar que el legajo esté activo
      const { data: legajo } = await supabase
        .from('legajos')
        .select('estado')
        .eq('id', values.legajo_id)
        .single()

      if (legajo && legajo.estado !== 'activo') {
        throw new Error(
          'Acción rechazada: no se pueden programar turnos para legajos inactivos o cerrados (T-EX-04)'
        )
      }

      // T-EX-02: verificar superposición de turnos para el mismo NNyA en la misma fecha y hora
      const fechaISO = new Date(values.fecha_hora).toISOString()
      const { count: turnosSolapados } = await supabase
        .from('turnos')
        .select('id', { count: 'exact', head: true })
        .eq('nnya_id', values.nnya_id)
        .eq('fecha_hora', fechaISO)
        .eq('estado', 'programado')

      if (turnosSolapados && turnosSolapados > 0) {
        throw new Error(
          'Ya existe un turno programado para este NNyA en esa fecha y hora. Seleccioná un horario diferente. (T-EX-02)'
        )
      }

      const { data, error } = await supabase
        .from('turnos')
        .insert({
          nnya_id: values.nnya_id,
          legajo_id: values.legajo_id,
          tipo: values.tipo,
          fecha_hora: fechaISO,
          lugar: values.lugar || null,
          profesional: values.profesional,
          motivo: values.motivo || null,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: queryKeys.turnos.byLegajo(data.legajo_id) })
      qc.invalidateQueries({ queryKey: queryKeys.turnos.lists() })
    },
  })
}
