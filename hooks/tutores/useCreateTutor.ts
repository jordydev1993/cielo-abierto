'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { TutorFormValues } from '@/lib/validations/tutores.schema'

export function useCreateTutor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: TutorFormValues) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('tutores')
        .insert({
          ...values,
          telefono: values.telefono || null,
          email: values.email || null,
          domicilio: values.domicilio || null,
          ocupacion: values.ocupacion || null,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.tutores.lists() }),
  })
}
