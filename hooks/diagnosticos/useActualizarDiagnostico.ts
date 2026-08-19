'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'

interface ActualizarDiagnosticoInput {
  id: string
  legajoId: string
  estado: 'en_seguimiento' | 'resuelto'
}

export function useActualizarDiagnostico() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, estado }: ActualizarDiagnosticoInput) => {
      const supabase = createClient()

      // DGN-EX-05: el estado resuelto es terminal
      const { data: diag } = await supabase
        .from('diagnosticos')
        .select('estado')
        .eq('id', id)
        .single()

      if (diag?.estado === 'resuelto') {
        throw new Error(
          'El diagnóstico ya está resuelto. Si hay una recaída, registrá un nuevo diagnóstico. (DGN-EX-05)'
        )
      }

      const { data, error } = await supabase
        .from('diagnosticos')
        .update({
          estado,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data, { legajoId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.diagnosticos.byLegajo(legajoId) })
      qc.invalidateQueries({ queryKey: queryKeys.medicamentos.byLegajo(legajoId) })
    },
  })
}
