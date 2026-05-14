'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { UsuarioUpdateValues } from '@/lib/validations/usuarios.schema'

export function useUpdateUsuario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: UsuarioUpdateValues }) => {
      const supabase = createClient()
      const payload = {
        nombre: values.nombre,
        apellido: values.apellido,
        rol_id: values.rol_id,
        telefono: values.telefono || null,
        updated_at: new Date().toISOString(),
      }
      const { data, error } = await supabase
        .from('usuarios')
        .update(payload)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.usuarios.lists() })
      qc.invalidateQueries({ queryKey: queryKeys.usuarios.detail(id) })
    },
  })
}
