'use client'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'

export function useNotificacionesPropuestasCount() {
  return useQuery({
    queryKey: queryKeys.propuestasMejora.notificaciones(),
    queryFn: async (): Promise<number> => {
      const supabase = createClient()
      const limite = new Date()
      limite.setDate(limite.getDate() + 7)
      const { count, error } = await supabase
        .from('propuestas_mejora')
        .select('*', { count: 'exact', head: true })
        .not('estado', 'in', '(completado,cancelado)')
        .not('fecha_vencimiento', 'is', null)
        .lte('fecha_vencimiento', limite.toISOString().split('T')[0])
      if (error) throw error
      return count ?? 0
    },
  })
}
