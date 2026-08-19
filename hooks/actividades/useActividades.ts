'use client'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { Actividad } from '@/types/database.types'

export function useActividades() {
  return useQuery({
    queryKey: queryKeys.actividades.lists(),
    queryFn: async (): Promise<Actividad[]> => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('actividades')
        .select('*, usuarios:responsable_id(id, nombre, apellido)')
        .order('fecha', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })
}
