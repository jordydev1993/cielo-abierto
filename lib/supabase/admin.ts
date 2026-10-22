import { createClient } from '@supabase/supabase-js'

/**
 * Cliente con la service role, solo del lado del servidor (prompts/048).
 * Lo usa el webhook de Didit, que no tiene sesión de usuario y se autentica con la
 * firma HMAC. Nunca importarlo desde un componente de cliente.
 * Devuelve null si falta la configuración, para responder un error controlado.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
