'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { getCurrentUsuarioId } from '@/lib/supabase/currentUsuario'
import { queryKeys } from '@/lib/constants/queryKeys'

// Admin, desde "Casos en revisión": verificación manual del retiro, también cuando no
// hay sesión de Didit (consentimiento rechazado, D-26). fn_validar_fallback_retiro
// exige Admin, autorizado_por = el usuario autenticado y una causa habilitante:
// error del proveedor, 3 intentos fallidos o consentimiento rechazado (D-2, D-20).
export function useVerificacionManualRetiro() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, motivo }: { id: string; motivo: string }) => {
      const supabase = createClient()
      const autorizado_por = await getCurrentUsuarioId(supabase)
      const { error } = await supabase
        .from('retiros')
        .update({
          metodo_verificacion: 'manual',
          autorizado_por,
          autorizado_at: new Date().toISOString(),
          motivo_fallback: motivo,
          resultado_autorizacion: 'autorizada',
          // Sale de "requiere revisión" para poder registrar y cerrar el retiro.
          estado: 'en_curso',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.retiros.all }),
  })
}
