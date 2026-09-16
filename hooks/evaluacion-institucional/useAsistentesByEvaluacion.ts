'use client'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { EvaluacionInstitucionalAsistente } from '@/types/database.types'

export function useAsistentesByEvaluacion(evaluacionId: string) {
  return useQuery({
    queryKey: queryKeys.evaluacionAsistentes.byEvaluacion(evaluacionId),
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('evaluacion_institucional_asistentes')
        .select('*, usuario:usuarios(id, nombre, apellido)')
        .eq('evaluacion_id', evaluacionId)
      if (error) throw error
      return data as EvaluacionInstitucionalAsistente[]
    },
    enabled: !!evaluacionId,
  })
}
