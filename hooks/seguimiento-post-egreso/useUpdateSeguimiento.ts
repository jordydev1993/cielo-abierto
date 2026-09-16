'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { SeguimientoPostEgresoFormValues } from '@/lib/validations/seguimiento-post-egreso.schema'

export function useUpdateSeguimiento() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      contactadoPorActual,
      miUsuarioId,
      values,
    }: {
      id: string
      contactadoPorActual: string | null
      miUsuarioId: string
      values: SeguimientoPostEgresoFormValues
    }) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('seguimiento_post_egreso')
        .update({
          fecha_contacto: values.fecha_contacto || null,
          contacto_realizado: values.contacto_realizado,
          contacto_efectivo: values.contacto_efectivo ?? null,
          escolaridad: values.escolaridad || null,
          salud: values.salud || null,
          terapias: values.terapias || null,
          percibe_auh: values.percibe_auh ?? null,
          detalle_incumplimiento: values.detalle_incumplimiento || null,
          observaciones: values.observaciones || null,
          indicador_reinsercion: values.indicador_reinsercion ? Number(values.indicador_reinsercion) : null,
          requiere_intervencion: values.requiere_intervencion,
          contactado_por: contactadoPorActual ?? miUsuarioId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.seguimientoPostEgreso.lists() }),
  })
}
