'use client'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { Incidente, Nnya } from '@/types/database.types'

export interface IncidenteConNnya extends Incidente {
  nnya?: Pick<Nnya, 'id' | 'nombre' | 'apellido'>
  legajo?: { numero_legajo: string }
}

export function useIncidentes() {
  return useQuery({
    queryKey: queryKeys.incidentes.lists(),
    queryFn: async (): Promise<IncidenteConNnya[]> => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('incidentes')
        .select('*, nnya:nnya_id(id, nombre, apellido), legajo:legajo_id(numero_legajo)')
        .order('fecha_hora', { ascending: false })
      if (error) throw error
      return (data ?? []) as IncidenteConNnya[]
    },
  })
}
