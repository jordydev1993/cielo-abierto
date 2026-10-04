'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { EdicionReporteSenafValues } from '@/lib/validations/reporte-senaf.schema'

export function useActualizarReporteSenaf() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: EdicionReporteSenafValues }) => {
      const supabase = createClient()
      const { error } = await supabase
        .from('reportes_senaf')
        .update({
          texto_final: values.secciones,
          observaciones_direccion: values.observaciones_direccion || null,
        })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.reportesSenaf.detail(id) })
      qc.invalidateQueries({ queryKey: queryKeys.reportesSenaf.lists() })
    },
  })
}
