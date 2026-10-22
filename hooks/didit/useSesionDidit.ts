'use client'
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { RespuestaDidit } from '@/lib/didit/mensajes'
import { proximaConsulta } from '@/lib/didit/polling'
import type { EstadoRnf12 } from '@/types/database.types'

export type EstadoSesionDidit = {
  estado_rnf12: EstadoRnf12
  intentos_usados: number
  intentos_restantes: number
  fallback_habilitado: boolean
}

// GET /api/didit/sesiones/[id] con polling (N-6): cada 4 s mientras está pendiente,
// hasta 90 s desde `inicioEspera`. Para "Actualizar", el componente mueve
// `inicioEspera` a ahora y llama a refetch.
export function useSesionDidit(sesionId: string | null, inicioEspera: number) {
  return useQuery({
    queryKey: queryKeys.sesionesDidit.estado(sesionId ?? ''),
    queryFn: async () => {
      const res = await fetch(`/api/didit/sesiones/${sesionId}`)
      return (await res.json()) as RespuestaDidit<EstadoSesionDidit>
    },
    enabled: !!sesionId,
    refetchInterval: (q) => proximaConsulta(q.state.data?.code, Date.now() - inicioEspera),
  })
}
