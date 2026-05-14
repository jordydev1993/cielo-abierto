'use client'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { Tutor } from '@/types/database.types'

export function useTutores() {
  return useQuery({
    queryKey: queryKeys.tutores.lists(),
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('tutores')
        .select('*')
        .order('apellido')
      if (error) throw error
      return data as Tutor[]
    },
    staleTime: 5 * 60 * 1000,
  })
}
