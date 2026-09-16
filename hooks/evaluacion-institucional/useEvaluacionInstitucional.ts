'use client'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { EvaluacionInstitucional } from '@/types/database.types'

export function useEvaluacionInstitucional(id: string) {
  return useQuery({
    queryKey: queryKeys.evaluacionInstitucional.detail(id),
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('evaluacion_institucional')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as EvaluacionInstitucional
    },
    enabled: !!id,
  })
}
