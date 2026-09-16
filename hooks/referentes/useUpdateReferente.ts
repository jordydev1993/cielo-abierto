'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { ReferenteFormValues } from '@/lib/validations/referentes.schema'

export function useUpdateReferente() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: ReferenteFormValues }) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('referentes')
        .update({
          ...values,
          fecha_nacimiento: values.fecha_nacimiento || null,
          vinculo_descripcion: values.vinculo_descripcion || null,
          telefono: values.telefono || null,
          email: values.email || null,
          domicilio: values.domicilio || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()
      // El trigger fn_proteger_dni_referente ya devuelve un mensaje en español
      // legible ("Solo Admin puede modificar el DNI...") — se propaga tal cual.
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.referentes.lists() }),
  })
}
