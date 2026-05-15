'use client'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { NnyaTutor } from '@/types/database.types'

export function useNnyaTutores(nnyaId: string) {
  return useQuery({
    queryKey: queryKeys.nnyaTutores.byNnya(nnyaId),
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('nnya_tutores')
        .select('*, tutores(*)')
        .eq('nnya_id', nnyaId)
        .order('es_principal', { ascending: false })
      if (error) throw error
      return data as NnyaTutor[]
    },
    enabled: !!nnyaId,
  })
}
