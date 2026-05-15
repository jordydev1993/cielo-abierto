'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'

interface AsignarTutorInput {
  nnya_id: string
  tutor_id: string
  es_principal: boolean
}

export function useAsignarTutor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: AsignarTutorInput) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('nnya_tutores')
        .insert(input)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_, { nnya_id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.nnyaTutores.byNnya(nnya_id) })
    },
  })
}
