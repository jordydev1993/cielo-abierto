'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { getCurrentUsuarioId } from '@/lib/supabase/currentUsuario'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { VinculoTutelaFormValues } from '@/lib/validations/vinculos-tutela.schema'

function mapVinculoError(msg: string): string {
  if (msg.includes('uq_vinculo_vigente_por_nnya')) {
    return 'Ya hay un vínculo vigente para este NNyA — finalizá o revocá el actual antes de crear uno nuevo.'
  }
  return msg
}

export function useCreateVinculoTutela() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      nnyaId,
      values,
    }: {
      nnyaId: string
      values: VinculoTutelaFormValues
    }) => {
      const supabase = createClient()
      const created_by = await getCurrentUsuarioId(supabase)
      const { data, error } = await supabase
        .from('vinculos_tutela')
        .insert({
          nnya_id: nnyaId,
          tipo: values.tipo,
          usuario_id: values.usuario_id || null,
          referente_id: values.referente_id || null,
          vigente_desde: values.vigente_desde,
          vigente_hasta: values.vigente_hasta || null,
          estado: values.estado,
          resolucion_respaldo: values.resolucion_respaldo || null,
          motivo_finalizacion: values.motivo_finalizacion || null,
          observaciones: values.observaciones || null,
          created_by,
        })
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
