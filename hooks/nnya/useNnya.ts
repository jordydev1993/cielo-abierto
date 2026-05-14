'use client'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { Nnya } from '@/types/database.types'

export function useNnya(id: string | null) {
  return useQuery({
    queryKey: queryKeys.nnya.detail(id ?? ''),
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('nnya')
        .select('*')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as Nnya
    },
    enabled: !!id,
  })
}
