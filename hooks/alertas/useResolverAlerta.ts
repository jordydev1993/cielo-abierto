'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'

interface ResolverAlertaInput {
  id: string
  observacion?: string
}

export function useResolverAlerta() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, observacion }: ResolverAlertaInput) => {
      const supabase = createClient()

      // A-EX-04: resolver alerta crítica/alta sin observación (segunda capa de defensa)
      const { data: alerta } = await supabase
        .from('alertas')
        .select('prioridad, nnya_id')
        .eq('id', id)
        .single()

      if (
        alerta &&
        (alerta.prioridad === 'critica' || alerta.prioridad === 'alta') &&
        !observacion?.trim()
      ) {
        throw new Error(
          'Las alertas de prioridad alta o crítica requieren una observación de cierre. (A-EX-04)'
        )
      }

      const { data, error } = await supabase
        .from('alertas')
        .update({
          estado: 'completada',
          observacion_cierre: observacion || null,
          fecha_completada: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: queryKeys.alertas.byNnya(data.nnya_id) })
      qc.invalidateQueries({ queryKey: queryKeys.alertas.lists() })
      qc.invalidateQueries({ queryKey: queryKeys.alertas.pendientes() })
    },
  })
}
