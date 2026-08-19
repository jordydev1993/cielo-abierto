'use client'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { Informe, Nnya } from '@/types/database.types'

export interface InformeConNnya extends Informe {
  nnya?: Pick<Nnya, 'id' | 'nombre' | 'apellido'>
  legajo?: { id: string; numero_legajo: string }
}

export function useInformes() {
  return useQuery({
    queryKey: queryKeys.informes.lists(),
    queryFn: async (): Promise<InformeConNnya[]> => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('informes')
        .select('*, nnya:nnya_id(id, nombre, apellido), legajo:legajo_id(id, numero_legajo)')
        .order('fecha_informe', { ascending: false })
      if (error) throw error
      return (data ?? []) as InformeConNnya[]
    },
  })
}
