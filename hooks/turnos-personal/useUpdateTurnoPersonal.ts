'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { TurnoPersonalFormValues } from '@/lib/validations/turno-personal.schema'

function mapTurnoError(msg: string): string {
  if (msg.includes('turnos_personal_usuario_id_fecha_turno_key')) {
    return 'Ese usuario ya tiene un turno asignado para esa fecha y franja.'
  }
  return msg
}

export function useUpdateTurnoPersonal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: TurnoPersonalFormValues }) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('turnos_personal')
        .update({
          usuario_id: values.usuario_id,
          fecha: values.fecha,
          turno: values.turno,
          estado: values.estado,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()
      if (error) throw new Error(mapTurnoError(error.message))
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.turnosPersonal.lists() }),
  })
}
