'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { NnyaFormValues } from '@/lib/validations/nnya.schema'

export function useUpdateNnya() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: NnyaFormValues }) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('nnya')
        .update({
          ...values,
          lugar_nacimiento: values.lugar_nacimiento || null,
          nacionalidad: values.nacionalidad || null,
          genero: values.genero || null,
          domicilio: values.domicilio || null,
          telefono: values.telefono || null,
          email: values.email || null,
          escolaridad: values.escolaridad || null,
          obra_social: values.obra_social || null,
          numero_expediente: values.numero_expediente || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.nnya.lists() })
      qc.invalidateQueries({ queryKey: queryKeys.nnya.detail(id) })
    },
  })
}
