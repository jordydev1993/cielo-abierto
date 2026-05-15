'use client'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { Legajo } from '@/types/database.types'

export function useLegajo(id: string) {
  return useQuery({
    queryKey: queryKeys.legajos.detail(id),
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('legajos')
        .select('*, nnya:nnya_id(id, nombre, apellido, dni)')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as Legajo
    },
    enabled: !!id,
  })
}
