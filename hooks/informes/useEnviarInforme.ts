'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'

interface EnviarInformeInput {
  id: string
  legajoId: string
}

export function useEnviarInforme() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id }: EnviarInformeInput) => {
      const supabase = createClient()

      // INF-EX-05: verificar que el informe no esté ya finalizado
      const { data: informe } = await supabase
        .from('informes')
        .select('estado')
        .eq('id', id)
        .single()

      if (informe?.estado === 'finalizado') {
        throw new Error(
          'Este informe ya fue enviado y no puede modificarse. (INF-EX-05)'
        )
      }

      const { data, error } = await supabase
        .from('informes')
        .update({
          estado: 'finalizado',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data, { legajoId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.informes.byLegajo(legajoId) })
      qc.invalidateQueries({ queryKey: queryKeys.informes.lists() })
    },
  })
}
