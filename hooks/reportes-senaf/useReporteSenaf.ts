'use client'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { ReporteSenaf } from '@/types/database.types'

export function useReporteSenaf(id: string) {
  return useQuery({
    queryKey: queryKeys.reportesSenaf.detail(id),
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('reportes_senaf')
        .select(
          '*, generador:usuarios!reportes_senaf_generado_por_fkey(nombre, apellido), aprobador:usuarios!reportes_senaf_aprobado_por_fkey(nombre, apellido)',
        )
        .eq('id', id)
        .single()
      if (error) throw error
      return data as unknown as ReporteSenaf
    },
    enabled: !!id,
  })
}
