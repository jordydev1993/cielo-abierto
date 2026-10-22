import { contextoDidit, mensajeDeTrigger } from '@/lib/didit/contexto'
import { respuestaDidit } from '@/lib/didit/mensajes'
import { fallbackDiditSchema, sesionIdSchema } from '@/lib/validations/didit-sesion.schema'

// Fallback manual del Admin sobre el retiro de la sesión (Plan 035 §7.3, prompts/047).
// Los triggers son la garantía: solo Admin, autorizado_por = el usuario autenticado, y
// solo con error del proveedor, 3 intentos fallidos o consentimiento rechazado (D-2, D-20, D-26).
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await contextoDidit()
  if (ctx instanceof Response) return ctx
  const { supabase, rol, usuarioId } = ctx

  if (rol !== 'Admin') return respuestaDidit('FORBIDDEN', 403)

  const { id } = await params
  if (!sesionIdSchema.safeParse(id).success) return respuestaDidit('INVALID_REQUEST', 400)

  const body: unknown = await request.json().catch(() => null)
  const parsed = fallbackDiditSchema.safeParse(body)
  if (!parsed.success) return respuestaDidit('INVALID_REQUEST', 400)

  const { data: sesion } = await supabase
    .from('sesiones_didit')
    .select('proposito, retiro_id')
    .eq('id', id)
    .maybeSingle()
  if (!sesion) return respuestaDidit('NOT_FOUND', 404)
  if (sesion.proposito !== 'retiro' || !sesion.retiro_id) return respuestaDidit('CONFLICT', 409)

  const { data: retiro, error } = await supabase
    .from('retiros')
    .update({
      metodo_verificacion: 'manual',
      autorizado_por: usuarioId,
      autorizado_at: new Date().toISOString(),
      motivo_fallback: parsed.data.motivo,
      resultado_autorizacion: 'autorizada',
    })
    .eq('id', sesion.retiro_id)
    .select('id')
    .maybeSingle()

  if (error) {
    console.error(`[didit/fallback] El fallback fue rechazado (${error.code}).`)
    return respuestaDidit('CONFLICT', 409, undefined, mensajeDeTrigger(error) ?? undefined)
  }
  if (!retiro) return respuestaDidit('NOT_FOUND', 404)

  return respuestaDidit('FALLBACK_APPLIED', 200, { retiro_id: retiro.id })
}
