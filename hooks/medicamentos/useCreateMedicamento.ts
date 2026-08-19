'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { MedicamentoFormValues } from '@/lib/validations/medicamentos.schema'

export function useCreateMedicamento() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: MedicamentoFormValues) => {
      const supabase = createClient()

      // M-EX-02: verificar que el diagnóstico asociado no esté resuelto
      if (values.diagnostico_id) {
        const { data: diag } = await supabase
          .from('diagnosticos')
          .select('estado')
          .eq('id', values.diagnostico_id)
          .single()

        if (diag?.estado === 'resuelto') {
          throw new Error(
            'No se puede iniciar un tratamiento vinculado a un diagnóstico ya resuelto. Seleccioná un diagnóstico activo. (M-EX-02)'
          )
        }
      }

      const { data, error } = await supabase
        .from('medicamentos')
        .insert({
          nnya_id: values.nnya_id,
          legajo_id: values.legajo_id,
          diagnostico_id: values.diagnostico_id || null,
          nombre: values.nombre,
          dosis: values.dosis,
          frecuencia: values.frecuencia,
          via_administracion: values.via_administracion || null,
          prescriptor: values.prescriptor || null,
          fecha_inicio: values.fecha_inicio,
          fecha_fin: values.fecha_fin || null,
          estado: 'en_curso',
          observaciones: values.observaciones || null,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: queryKeys.medicamentos.byLegajo(data.legajo_id) })
    },
  })
}
