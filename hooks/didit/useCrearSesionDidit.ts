'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { RespuestaDidit } from '@/lib/didit/mensajes'
import type { SandboxScenario } from '@/lib/didit/client'

export type DatosSesionCreada = {
  sesion_id: string
  url_didit: string
  intentos_usados: number
  intentos_restantes: number
}

export type CrearSesionInput =
  | { proposito: 'retiro'; retiro_id: string; sandbox_scenario?: SandboxScenario }
  | { proposito: 'validacion_referente'; referente_id: string; consentimiento: true; sandbox_scenario?: SandboxScenario }

// POST /api/didit/sesiones (prompts/047). Devuelve siempre la respuesta con su code y
// message (D-33): un 409 o un 502 no son excepciones, la pantalla los muestra.
export function useCrearSesionDidit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CrearSesionInput) => {
      const res = await fetch('/api/didit/sesiones', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input),
      })
      return (await res.json()) as RespuestaDidit<Partial<DatosSesionCreada>>
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.retiros.all })
      qc.invalidateQueries({ queryKey: queryKeys.validacionesRenaper.all })
    },
  })
}
