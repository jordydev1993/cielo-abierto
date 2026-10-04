'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'

// La firma (aprobado_por / aprobado_at) la completa la base con el usuario de la sesión.
export function useAprobarReporteSenaf() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase.from('reportes_senaf').update({ estado: 'aprobado' }).eq('id', id)
      if (error) {
        if (error.code === '23505') {
          throw new Error('Ya hay un informe aprobado para ese período.')
        }
        throw error
      }
    },
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: queryKeys.reportesSenaf.detail(id) })
      qc.invalidateQueries({ queryKey: queryKeys.reportesSenaf.lists() })
    },
  })
}
