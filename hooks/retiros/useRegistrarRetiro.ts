'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { RegistrarRetiroValues } from '@/lib/validations/retiros.schema'

// Registro del retiro con la identidad verificada en Didit (RF20/21). Seguridad 2
// (fn_validar_identidad_para_retiro) rechaza 'autorizada' sin una sesión verificada.
export function useRegistrarRetiro() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: RegistrarRetiroValues }) => {
      const supabase = createClient()
      const { error } = await supabase
        .from('retiros')
        .update({
          fecha_inicio: new Date(values.fecha_inicio).toISOString(),
          descripcion: values.descripcion,
          observaciones: values.observaciones || null,
          metodo_verificacion: 'didit',
          resultado_autorizacion: 'autorizada',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.retiros.all }),
  })
}
