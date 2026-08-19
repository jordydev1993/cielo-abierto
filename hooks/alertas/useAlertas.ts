'use client'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { Alerta, Nnya } from '@/types/database.types'

export interface AlertaConNnya extends Alerta {
  nnya?: Pick<Nnya, 'id' | 'nombre' | 'apellido'>
}

export function useAlertas() {
  return useQuery({
    queryKey: queryKeys.alertas.lists(),
    queryFn: async (): Promise<AlertaConNnya[]> => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('alertas')
        .select('*, nnya:nnya_id(id, nombre, apellido)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as AlertaConNnya[]
    },
  })
}
