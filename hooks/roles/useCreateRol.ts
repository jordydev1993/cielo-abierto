'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { RolFormValues } from '@/lib/validations/roles.schema'

export function useCreateRol() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: RolFormValues) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('roles')
        .insert({ nombre: values.nombre, descripcion: values.descripcion || null, activo: true })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.roles.lists() }),
  })
}
