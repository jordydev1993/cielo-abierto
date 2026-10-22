'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { RespuestaDidit } from '@/lib/didit/mensajes'

// POST /api/didit/sesiones/[id]/fallback: solo Admin, con motivo (prompts/047).
export function useFallbackDidit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ sesionId, motivo }: { sesionId: string; motivo: string }) => {
      const res = await fetch(`/api/didit/sesiones/${sesionId}/fallback`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ motivo }),
      })
      return (await res.json()) as RespuestaDidit
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.retiros.all })
      qc.invalidateQueries({ queryKey: queryKeys.sesionesDidit.all })
    },
  })
}
