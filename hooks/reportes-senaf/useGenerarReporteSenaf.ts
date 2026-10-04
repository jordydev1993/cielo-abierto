'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { PeriodoSenafValues } from '@/lib/validations/reporte-senaf.schema'

// La generación pasa por el servidor: calcula los agregados y, si hay clave, llama a la IA.
export function useGenerarReporteSenaf() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (periodo: PeriodoSenafValues) => {
      const res = await fetch('/api/reportes/senaf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(periodo),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error ?? 'No se pudo generar el informe.')
      return body as { id: string; origen: 'ia' | 'plantilla' }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.reportesSenaf.lists() })
    },
  })
}
