'use client'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { ReporteSenaf } from '@/types/database.types'

export function useReportesSenaf() {
  return useQuery({
    queryKey: queryKeys.reportesSenaf.lists(),
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('reportes_senaf')
        .select(
          '*, generador:usuarios!reportes_senaf_generado_por_fkey(nombre, apellido), aprobador:usuarios!reportes_senaf_aprobado_por_fkey(nombre, apellido)',
        )
        .order('periodo_anio', { ascending: false })
        .order('periodo_mes', { ascending: false })
        .order('version', { ascending: false })
      if (error) throw error
      return data as unknown as ReporteSenaf[]
    },
    staleTime: 60 * 1000,
  })
}
