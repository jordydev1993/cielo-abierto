'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { getCurrentUsuarioId } from '@/lib/supabase/currentUsuario'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { ValidacionRenaperFormValues } from '@/lib/validations/validaciones-renaper.schema'

export function useCreateValidacionRenaper() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      referenteId,
      values,
    }: {
      referenteId: string
      values: ValidacionRenaperFormValues
    }) => {
      const supabase = createClient()
      const consultado_por = await getCurrentUsuarioId(supabase)
      const { data, error } = await supabase
        .from('validaciones_renaper')
        .insert({
          ...values,
          referente_id: referenteId,
          tiene_antecedentes: values.tiene_antecedentes ?? null,
          consultado_por,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_, { referenteId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.validacionesRenaper.ultimaByReferente(referenteId) })
    },
  })
}
