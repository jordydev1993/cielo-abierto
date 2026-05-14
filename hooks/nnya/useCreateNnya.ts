'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { NnyaFormValues } from '@/lib/validations/nnya.schema'

export function useCreateNnya() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: NnyaFormValues) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('nnya')
        .insert({
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
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.nnya.lists() }),
  })
}
