import { createClient } from '@/lib/supabase/server'
import { respuestaDidit } from '@/lib/didit/mensajes'

const ROLES_DIDIT = ['Admin', 'Equipo Tecnico']

export type ContextoDidit = {
  supabase: Awaited<ReturnType<typeof createClient>>
  rol: string
  usuarioId: string
}

/**
 * Sesión, rol y usuario para los endpoints de /api/didit/sesiones (prompts/047).
 * Escriben con el cliente de la sesión: RLS y los triggers deciden, y el audit log
 * registra al autor (prompts/041). Devuelve una Response si no corresponde seguir.
 */
export async function contextoDidit(): Promise<ContextoDidit | Response> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return respuestaDidit('UNAUTHENTICATED', 401)

  const { data: rol } = await supabase.rpc('get_my_role')
  if (typeof rol !== 'string' || !ROLES_DIDIT.includes(rol)) {
    return respuestaDidit('FORBIDDEN', 403)
  }

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('id')
    .eq('auth_user_id', user.id)
    .maybeSingle()
  if (!usuario) return respuestaDidit('FORBIDDEN', 403)

  return { supabase, rol, usuarioId: usuario.id }
}

/** Columnas de sesiones_didit que necesitan las reglas de lib/didit/estado.ts. */
export const COLUMNAS_SESION =
  'id, session_id, estado_didit, estado_rnf12, error_proveedor, dni_coincide, created_at'

/** Un error de un trigger (RAISE EXCEPTION, P0001) trae un mensaje pensado para mostrarse. */
export function mensajeDeTrigger(error: { code?: string; message: string }): string | null {
  return error.code === 'P0001' ? error.message : null
}
