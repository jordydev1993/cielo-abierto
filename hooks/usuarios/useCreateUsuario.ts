'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { UsuarioCreateValues } from '@/lib/validations/usuarios.schema'

export function useCreateUsuario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: UsuarioCreateValues) => {
      const res = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al crear usuario')
      }
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.usuarios.lists() }),
  })
}
