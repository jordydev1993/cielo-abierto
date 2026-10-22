'use client'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { AutorizacionRetiro } from '@/types/database.types'

// Autorizaciones de retiro de un NNyA, con el tutor del vínculo (RF02, RN-01).
export function useAutorizacionesByNnya(nnyaId: string) {
  return useQuery({
    queryKey: queryKeys.autorizacionesRetiro.byNnya(nnyaId),
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('autorizaciones_retiro')
        .select('*, nnya_tutores!inner(*, tutores(*))')
        .eq('nnya_tutores.nnya_id', nnyaId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as unknown as AutorizacionRetiro[]
    },
    enabled: !!nnyaId,
  })
}

/** Vigente hoy: estado vigente y dentro del rango de fechas (mismo criterio que el trigger). */
export function esAutorizacionVigente(a: AutorizacionRetiro, ahora: Date = new Date()): boolean {
  if (a.estado !== 'vigente') return false
  if (new Date(a.vigente_desde) > ahora) return false
  return a.vigente_hasta === null || new Date(a.vigente_hasta) >= ahora
}
