import type { createClient } from '@/lib/supabase/client'

/**
 * Resuelve el id de `usuarios` (no el de `auth.users`) de la sesión activa.
 * Necesario para columnas NOT NULL como `created_by`/`consultado_por`, que
 * referencian `usuarios(id)`, no `auth.uid()` directamente.
 */
export async function getCurrentUsuarioId(
  supabase: ReturnType<typeof createClient>
): Promise<string> {
  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError || !authData.user) throw new Error('No hay sesión activa')

  const { data, error } = await supabase
    .from('usuarios')
    .select('id')
    .eq('auth_user_id', authData.user.id)
    .single()
  if (error || !data) throw new Error('No se pudo resolver el usuario actual')
  return data.id
}
