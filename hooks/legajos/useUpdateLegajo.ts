'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { LegajoCierreValues, LegajoFormValues } from '@/lib/validations/legajos.schema'

export function useUpdateLegajoDatos() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: LegajoFormValues }) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('legajos')
        .update({
          numero_legajo: values.numero_legajo,
          fecha_apertura: values.fecha_apertura,
          observaciones: values.observaciones || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.legajos.lists() })
      qc.invalidateQueries({ queryKey: queryKeys.legajos.detail(id) })
    },
  })
}

function mapCierreError(msg: string): string {
  if (msg.includes('legajos_estado_check')) {
    return 'El estado seleccionado no es válido para el cierre.'
  }
  return msg
}

export function useCerrarLegajo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, nnyaId, values }: { id: string; nnyaId: string; values: LegajoCierreValues }) => {
      const supabase = createClient()

      // L-EX-13: verificar que no haya incidentes abiertos o en seguimiento antes de cerrar
      const { count, error: incErr } = await supabase
        .from('incidentes')
        .select('*', { count: 'exact', head: true })
        .eq('legajo_id', id)
        .in('estado', ['abierto', 'en_seguimiento'])

      if (incErr) throw new Error('Error al verificar incidentes activos')
      if (count && count > 0) {
        throw new Error(
          `No se puede cerrar el legajo porque hay ${count} incidente${count > 1 ? 's' : ''} activo${count > 1 ? 's' : ''} sin resolver. Resuelva los incidentes pendientes primero. (L-EX-13)`
        )
      }

      // L-EX-10: verificar que exista un Informe de Egreso antes de cerrar
      const { count: informesEgreso, error: infErr } = await supabase
        .from('informes')
        .select('*', { count: 'exact', head: true })
        .eq('legajo_id', id)
        .eq('tipo', 'Egreso')

      if (infErr) throw new Error('Error al verificar el Informe de Egreso')
      if (!informesEgreso || informesEgreso === 0) {
        throw new Error(
          'No se puede cerrar el legajo. Debe generar y adjuntar el Informe de Egreso primero. (L-EX-10)'
        )
      }

      const { data, error } = await supabase
        .from('legajos')
        .update({
          estado: values.estado,
          motivo_cierre: values.motivo_cierre,
          fecha_cierre: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()
      if (error) throw new Error(mapCierreError(error.message))
      return data
    },
    onSuccess: (data, { nnyaId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.legajos.lists() })
      qc.invalidateQueries({ queryKey: queryKeys.legajos.byNnya(nnyaId) })
    },
  })
}
