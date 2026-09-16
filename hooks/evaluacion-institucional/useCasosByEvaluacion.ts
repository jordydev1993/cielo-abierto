'use client'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { EvaluacionInstitucionalCaso } from '@/types/database.types'

export function useCasosByEvaluacion(evaluacionId: string) {
  return useQuery({
    queryKey: queryKeys.evaluacionCasos.byEvaluacion(evaluacionId),
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('evaluacion_institucional_casos')
        .select('*, nnya:nnya_id(id, nombre, apellido, dni)')
        .eq('evaluacion_id', evaluacionId)
        .order('created_at')
      if (error) throw error
      return data as EvaluacionInstitucionalCaso[]
    },
    enabled: !!evaluacionId,
  })
}
