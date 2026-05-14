'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { TutorFormValues } from '@/lib/validations/tutores.schema'

export function useUpdateTutor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: TutorFormValues }) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('tutores')
        .update({
          ...values,
          telefono: values.telefono || null,
          email: values.email || null,
          domicilio: values.domicilio || null,
          ocupacion: values.ocupacion || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.tutores.lists() })
      qc.invalidateQueries({ queryKey: queryKeys.tutores.detail(id) })
    },
  })
}
