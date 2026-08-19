'use client'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { Turno, Nnya } from '@/types/database.types'

export interface TurnoConNnya extends Turno {
  nnya?: Pick<Nnya, 'id' | 'nombre' | 'apellido'>
}

export function useTurnos() {
  return useQuery({
    queryKey: queryKeys.turnos.lists(),
    queryFn: async (): Promise<TurnoConNnya[]> => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('turnos')
        .select('*, nnya:nnya_id(id, nombre, apellido)')
        .order('fecha_hora', { ascending: false })
      if (error) throw error
      return (data ?? []) as TurnoConNnya[]
    },
  })
}
