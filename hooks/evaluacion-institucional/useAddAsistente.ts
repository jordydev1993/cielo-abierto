'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'

function mapAsistenteError(msg: string): string {
  if (msg.includes('evaluacion_institucional_asistente_evaluacion_id_usuario_id_key')) {
    return 'Ese usuario ya está agregado como asistente.'
  }
  return msg
}

export function useAddAsistente() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ evaluacionId, usuarioId }: { evaluacionId: string; usuarioId: string }) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('evaluacion_institucional_asistentes')
        .insert({ evaluacion_id: evaluacionId, usuario_id: usuarioId })
        .select()
        .single()
      if (error) throw new Error(mapAsistenteError(error.message))
      return data
    },
    onSuccess: (_, { evaluacionId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.evaluacionAsistentes.byEvaluacion(evaluacionId) })
    },
  })
}
