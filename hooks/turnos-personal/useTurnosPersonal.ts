'use client'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { TurnoPersonal } from '@/types/database.types'

export function useTurnosPersonal() {
  return useQuery({
    queryKey: queryKeys.turnosPersonal.lists(),
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('turnos_personal')
        .select(`
          *,
          titular:usuarios!turnos_personal_usuario_id_fkey(id, nombre, apellido),
          entregado_por_usuario:usuarios!turnos_personal_entregado_por_fkey(id, nombre, apellido),
          recibido_por_usuario:usuarios!turnos_personal_recibido_por_fkey(id, nombre, apellido)
        `)
        .order('fecha', { ascending: false })
        .order('turno')
      if (error) throw error
      return data as TurnoPersonal[]
    },
    staleTime: 60 * 1000,
  })
}
