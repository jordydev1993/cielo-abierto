'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { getCurrentUsuarioId } from '@/lib/supabase/currentUsuario'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { ReferenteFormValues } from '@/lib/validations/referentes.schema'

export function useCreateReferente() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: ReferenteFormValues) => {
      const supabase = createClient()
      const created_by = await getCurrentUsuarioId(supabase)
      const { data, error } = await supabase
        .from('referentes')
        .insert({
          ...values,
          fecha_nacimiento: values.fecha_nacimiento || null,
          vinculo_descripcion: values.vinculo_descripcion || null,
          telefono: values.telefono || null,
          email: values.email || null,
          domicilio: values.domicilio || null,
          created_by,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.referentes.lists() }),
  })
}
