import { contextoDidit, COLUMNAS_SESION } from '@/lib/didit/contexto'
import { codigoSesion, fallbackHabilitado, intentosRestantes, intentosUsados, type SesionDiditResumen } from '@/lib/didit/estado'
import { respuestaDidit } from '@/lib/didit/mensajes'
import { sesionIdSchema } from '@/lib/validations/didit-sesion.schema'

// Estado de una sesión de verificación (Plan 035 §7.2, prompts/047). No llama a Didit:
// el estado lo actualiza el webhook; la pantalla consulta cada 3 a 5 s (N-6).
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await contextoDidit()
  if (ctx instanceof Response) return ctx
  const { supabase, rol } = ctx

  const { id } = await params
  if (!sesionIdSchema.safeParse(id).success) return respuestaDidit('INVALID_REQUEST', 400)

  const { data: sesion } = await supabase
    .from('sesiones_didit')
    .select(`${COLUMNAS_SESION}, proposito, retiro_id, referente_id`)
    .eq('id', id)
    .maybeSingle()
  if (!sesion) return respuestaDidit('NOT_FOUND', 404)

  const vinculo = sesion.retiro_id
    ? { columna: 'retiro_id' as const, valor: sesion.retiro_id }
    : { columna: 'referente_id' as const, valor: sesion.referente_id as string }

  const { data: filas } = await supabase
    .from('sesiones_didit')
    .select(COLUMNAS_SESION)
    .eq(vinculo.columna, vinculo.valor)
  const sesiones: SesionDiditResumen[] = filas ?? []

  let retiro: { estado: string; consentimiento_didit: string | null } | null = null
  if (sesion.retiro_id) {
    const { data } = await supabase
      .from('retiros')
      .select('estado, consentimiento_didit')
      .eq('id', sesion.retiro_id)
      .maybeSingle()
    retiro = data
  }

  const code = codigoSesion(sesion, sesiones, retiro?.estado)
  return respuestaDidit(code, 200, {
    estado_rnf12: sesion.estado_rnf12,
    intentos_usados: intentosUsados(sesiones),
    intentos_restantes: intentosRestantes(sesiones),
    // El fallback de referentes es la validación manual de /referentes, no esta API.
    fallback_habilitado:
      sesion.proposito === 'retiro' &&
      fallbackHabilitado({ rol, sesiones, consentimiento: retiro?.consentimiento_didit }),
  })
}
