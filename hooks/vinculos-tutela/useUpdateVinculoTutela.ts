'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { VinculoTutelaFormValues } from '@/lib/validations/vinculos-tutela.schema'

function mapVinculoError(msg: string): string {
  if (msg.includes('uq_vinculo_vigente_por_nnya')) {
    return 'Ya hay un vínculo vigente para este NNyA — finalizá o revocá el actual antes de marcar este como vigente.'
  }
  return msg
}

export function useUpdateVinculoTutela() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      nnyaId,
      values,
    }: {
      id: string
      nnyaId: string
      values: VinculoTutelaFormValues
    }) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('vinculos_tutela')
        .update({
          tipo: values.tipo,
          usuario_id: values.usuario_id || null,
          referente_id: values.referente_id || null,
          vigente_desde: values.vigente_desde,
          vigente_hasta: values.vigente_hasta || null,
          estado: values.estado,
          resolucion_respaldo: values.resolucion_respaldo || null,
          motivo_finalizacion: values.motivo_finalizacion || null,
          observaciones: values.observaciones || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()
      if (error) throw new Error(mapVinculoError(error.message))
      return data
    },
    onSuccess: (_, { nnyaId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.vinculosTutela.byNnya(nnyaId) })
    },
  })
}
