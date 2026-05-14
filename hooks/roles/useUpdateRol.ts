'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { RolFormValues } from '@/lib/validations/roles.schema'

export function useUpdateRol() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: RolFormValues }) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('roles')
        .update({ nombre: values.nombre, descripcion: values.descripcion || null, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.roles.lists() })
      qc.invalidateQueries({ queryKey: queryKeys.roles.detail(id) })
    },
  })
}
