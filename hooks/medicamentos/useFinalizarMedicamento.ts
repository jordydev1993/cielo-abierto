'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'

interface FinalizarMedicamentoInput {
  id: string
  legajoId: string
}

export function useFinalizarMedicamento() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id }: FinalizarMedicamentoInput) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('medicamentos')
        .update({
          estado: 'finalizado',
          fecha_fin: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()
      if (error) {
        // chk_medicamentos_fechas (prompts/042): un tratamiento que todavía no empezó no se finaliza con fecha de hoy
        if (error.message.includes('chk_medicamentos_fechas')) {
          throw new Error('El tratamiento todavía no empezó: no se puede finalizar antes de su fecha de inicio. (M-EX-04)')
        }
        throw error
      }
      return data
    },
    onSuccess: (data, { legajoId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.medicamentos.byLegajo(legajoId) })
    },
  })
}
