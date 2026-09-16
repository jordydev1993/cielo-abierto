'use client'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { EvaluacionInstitucional } from '@/types/database.types'

export function useEvaluacionesInstitucionales() {
  return useQuery({
    queryKey: queryKeys.evaluacionInstitucional.lists(),
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('evaluacion_institucional')
        .select('*')
        .order('periodo_anio', { ascending: false })
        .order('periodo_mes', { ascending: false })
      if (error) throw error
      return data as EvaluacionInstitucional[]
    },
    staleTime: 5 * 60 * 1000,
  })
}
