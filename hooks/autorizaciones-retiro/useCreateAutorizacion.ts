'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { getCurrentUsuarioId } from '@/lib/supabase/currentUsuario'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { AutorizacionRetiroValues } from '@/lib/validations/autorizaciones-retiro.schema'

// Solo Admin (RLS autorizaciones_retiro_insert_admin).
export function useCreateAutorizacion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: AutorizacionRetiroValues) => {
      const supabase = createClient()
      const created_by = await getCurrentUsuarioId(supabase)
      const { error } = await supabase.from('autorizaciones_retiro').insert({
        nnya_tutor_id: values.nnya_tutor_id,
        vigente_desde: new Date(`${values.vigente_desde}T00:00:00`).toISOString(),
        vigente_hasta: values.vigente_hasta ? new Date(`${values.vigente_hasta}T23:59:59`).toISOString() : null,
        restricciones: values.restricciones || null,
        created_by,
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.autorizacionesRetiro.all }),
  })
}
