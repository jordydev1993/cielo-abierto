'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'
import type { LegajoFormValues } from '@/lib/validations/legajos.schema'

const ESTADOS_ACTIVOS: string[] = ['activo']

function mapCreateLegajoError(error: { code?: string; message?: string }): Error {
  const msg = error.message ?? ''
  if (msg.includes('uq_legajo_activo_por_nnya') || msg.includes('unique') || error.code === '23505') {
    return new Error(
      'El NNyA ya tiene un legajo activo. No se pueden crear múltiples legajos activos para la misma persona. (L-EX-02)'
    )
  }
  if (msg.includes('numero_legajo') || msg.includes('uq_legajo_numero')) {
    return new Error(
      'Ya existe un legajo con ese número. Ingresá un número diferente. (L-EX-03)'
    )
  }
  return new Error(msg || 'Error al crear el legajo.')
}

export function useCreateLegajo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: LegajoFormValues) => {
      const supabase = createClient()

      // L-EX-02: un NNyA solo puede tener un legajo activo a la vez
      const { count, error: countError } = await supabase
        .from('legajos')
        .select('*', { count: 'exact', head: true })
        .eq('nnya_id', values.nnya_id)
        .in('estado', ESTADOS_ACTIVOS)
      if (countError) throw countError
      if (count && count > 0) {
        throw new Error(
          'El NNyA ya tiene un legajo activo. No se pueden crear múltiples legajos activos para la misma persona. (L-EX-02)'
        )
      }

      const { data, error } = await supabase
        .from('legajos')
        .insert({
          nnya_id: values.nnya_id,
          numero_legajo: values.numero_legajo,
          fecha_apertura: values.fecha_apertura,
          observaciones: values.observaciones || null,
        })
        .select()
        .single()
      if (error) throw mapCreateLegajoError(error)
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: queryKeys.legajos.lists() })
      qc.invalidateQueries({ queryKey: queryKeys.legajos.byNnya(data.nnya_id) })
    },
  })
}
