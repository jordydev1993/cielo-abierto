import { randomUUID } from 'node:crypto'
import { contextoDidit, COLUMNAS_SESION, mensajeDeTrigger } from '@/lib/didit/contexto'
import { crearSesionDidit, obtenerSesionDidit } from '@/lib/didit/client'
import { ESTADOS_ABIERTOS, intentosRestantes, intentosUsados, sesionAbierta, type SesionDiditResumen } from '@/lib/didit/estado'
import { respuestaDidit } from '@/lib/didit/mensajes'
import { crearSesionDiditSchema } from '@/lib/validations/didit-sesion.schema'

// Crear una sesión de verificación de identidad en Didit (Plan 035 §7.1, prompts/047).
export async function POST(request: Request) {
  const ctx = await contextoDidit()
  if (ctx instanceof Response) return ctx
  const { supabase, usuarioId } = ctx

  const apiKey = process.env.DIDIT_API_KEY
  const workflowId = process.env.DIDIT_WORKFLOW_ID
  if (!apiKey || !workflowId) {
    console.error('[didit/sesiones] Falta DIDIT_API_KEY o DIDIT_WORKFLOW_ID en el entorno.')
    return respuestaDidit('NOT_CONFIGURED', 500)
  }

  const body: unknown = await request.json().catch(() => null)
  const parsed = crearSesionDiditSchema.safeParse(body)
  if (!parsed.success) return respuestaDidit('INVALID_REQUEST', 400)
  const input = parsed.data

  // El DNI esperado sale de la base, nunca del cliente (D-14).
  let dniEsperado: string
  if (input.proposito === 'retiro') {
    const { data: retiro } = await supabase
      .from('retiros')
      .select('id, estado, consentimiento_didit, tutor_id')
      .eq('id', input.retiro_id)
      .maybeSingle()
    if (!retiro) return respuestaDidit('NOT_FOUND', 404)
    // D-19: con 3 intentos fallidos el trigger ya dejó el retiro en revisión.
    if (retiro.estado === 'requiere_revision') return respuestaDidit('REQUIRES_REVIEW', 409)
    if (retiro.estado !== 'en_curso') return respuestaDidit('CONFLICT', 409)
    // D-26: sin consentimiento, la verificación es manual y la hace un Admin.
    if (retiro.consentimiento_didit === 'rechazado') return respuestaDidit('CONSENT_REJECTED', 409)
    if (retiro.consentimiento_didit !== 'aceptado') return respuestaDidit('CONSENT_REQUIRED', 409)

    const { data: tutor } = await supabase
      .from('tutores')
      .select('dni')
      .eq('id', retiro.tutor_id)
      .maybeSingle()
    if (!tutor) return respuestaDidit('NOT_FOUND', 404)
    dniEsperado = tutor.dni
  } else {
    const { data: referente } = await supabase
      .from('referentes')
      .select('id, dni')
      .eq('id', input.referente_id)
      .maybeSingle()
    if (!referente) return respuestaDidit('NOT_FOUND', 404)
    dniEsperado = referente.dni
  }

  const vinculo =
    input.proposito === 'retiro'
      ? { columna: 'retiro_id' as const, valor: input.retiro_id }
      : { columna: 'referente_id' as const, valor: input.referente_id }

  const { data: filas, error: errorSesiones } = await supabase
    .from('sesiones_didit')
    .select(COLUMNAS_SESION)
    .eq(vinculo.columna, vinculo.valor)
  if (errorSesiones) {
    console.error(`[didit/sesiones] No se pudieron leer las sesiones (${errorSesiones.code}).`)
    return respuestaDidit('CONFLICT', 409)
  }
  const sesiones: SesionDiditResumen[] = filas ?? []
  const intentos = { intentos_usados: intentosUsados(sesiones), intentos_restantes: intentosRestantes(sesiones) }

  // Decisión 3: si hay una sesión abierta, se retoma en lugar de crear otra.
  const abierta = sesionAbierta(sesiones)
  if (abierta?.session_id) {
    const actual = await obtenerSesionDidit({ apiKey, sessionId: abierta.session_id })
    if (actual.ok && actual.url && ESTADOS_ABIERTOS.has(actual.status)) {
      return respuestaDidit('SESSION_CREATED', 200, { sesion_id: abierta.id, url_didit: actual.url, ...intentos })
    }
  }

  // F-01: el 4.º intento se rechaza antes de llamar a Didit.
  if (intentos.intentos_restantes === 0) return respuestaDidit('MAX_ATTEMPTS_REACHED', 409, intentos)

  const id = randomUUID()
  const sandboxScenario =
    process.env.DIDIT_SANDBOX_SCENARIOS === 'true' ? (input.sandbox_scenario ?? null) : null

  const didit = await crearSesionDidit({ apiKey, workflowId, vendorData: id, dniEsperado, sandboxScenario })

  const fila = { id, proposito: input.proposito, [vinculo.columna]: vinculo.valor, creada_por: usuarioId }

  if (!didit.ok) {
    // Sin datos personales en el log: solo el tipo de falla (RNF-04, RNF-13).
    console.error(`[didit/sesiones] Didit no disponible: ${didit.falla}${didit.status ? ` (${didit.status})` : ''}`)
    const { error } = await supabase
      .from('sesiones_didit')
      .insert({ ...fila, session_id: null, error_proveedor: 'didit_no_disponible' })
    if (error) console.error(`[didit/sesiones] No se pudo registrar el error del proveedor (${error.code}).`)
    return respuestaDidit('PROVIDER_ERROR', 502, intentos)
  }

  const { error } = await supabase.from('sesiones_didit').insert({ ...fila, session_id: didit.sessionId })
  if (error) {
    console.error(`[didit/sesiones] No se pudo guardar la sesión (${error.code}).`)
    const mensaje = mensajeDeTrigger(error)
    if (mensaje?.startsWith('Se alcanzó el máximo de 3 intentos')) {
      return respuestaDidit('MAX_ATTEMPTS_REACHED', 409, intentos)
    }
    return respuestaDidit('CONFLICT', 409, undefined, mensaje ?? undefined)
  }

  return respuestaDidit('SESSION_CREATED', 201, { sesion_id: id, url_didit: didit.url, ...intentos })
}
