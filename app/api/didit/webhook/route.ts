import { after } from 'next/server'
import { verifyDiditSignature } from '@/lib/didit/verify-signature'
import { diditWebhookSchema } from '@/lib/validations/didit-webhook.schema'
import { borrarSesionDidit } from '@/lib/didit/client'
import { extraerResultadoDidit, mapearValidacionRenaper, resolverActualizacion } from '@/lib/didit/webhook'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const secret = process.env.DIDIT_WEBHOOK_SECRET
  if (!secret) {
    console.error('[didit/webhook] DIDIT_WEBHOOK_SECRET no está configurada en el entorno.')
    return Response.json({ error: 'Webhook no configurado.' }, { status: 500 })
  }

  const rawBody = await request.text()
  const timestampHeader = request.headers.get('x-timestamp')
  const signatureHeader = request.headers.get('x-signature-v2')

  const isValid = verifyDiditSignature(rawBody, timestampHeader, signatureHeader, secret)
  if (!isValid) {
    return Response.json({ error: 'Firma inválida.' }, { status: 401 })
  }

  let payload: unknown
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return Response.json({ error: 'Body inválido.' }, { status: 400 })
  }

  const parsed = diditWebhookSchema.safeParse(payload)
  if (!parsed.success) {
    console.error('[didit/webhook] Payload con firma válida pero fuera de esquema:', parsed.error.flatten())
    return Response.json({ error: 'Payload inesperado.' }, { status: 400 })
  }

  const { webhook_type, session_id, status, event_id, vendor_data } = parsed.data

  if (webhook_type !== 'status.updated') {
    return Response.json({ received: true }, { status: 200 })
  }

  // Solo session_id y status: nunca decision, personal_number, nombres ni URLs (D-28).
  console.log(`[didit/webhook] session_id=${session_id} status=${status}`)

  // El webhook no tiene sesión de usuario: escribe con la service role (prompts/047, decisión 1).
  const supabase = createAdminClient()
  if (!supabase) {
    console.error('[didit/webhook] Falta la configuración de Supabase en el entorno.')
    return Response.json({ error: 'Webhook no configurado.' }, { status: 500 })
  }

  if (!session_id) {
    return Response.json({ received: true }, { status: 200 })
  }

  const { data: sesion, error: errorSesion } = await supabase
    .from('sesiones_didit')
    .select('id, session_id, proposito, retiro_id, referente_id, creada_por, estado_didit')
    .eq('session_id', session_id)
    .maybeSingle()
  if (errorSesion) {
    console.error(`[didit/webhook] No se pudo leer la sesión (${errorSesion.code}).`)
    return Response.json({ error: 'Error al procesar.' }, { status: 500 })
  }

  // D-4: sesión desconocida → 200 sin escribir, para que Didit no reintente.
  if (!sesion) {
    console.warn(`[didit/webhook] Sesión desconocida session_id=${session_id}`)
    return Response.json({ received: true }, { status: 200 })
  }
  // La sesión tiene que ser una que creamos nosotros (vendor_data = nuestro id).
  if (vendor_data !== sesion.id) {
    console.warn(`[didit/webhook] vendor_data no coincide session_id=${session_id} event_id=${event_id}`)
    return Response.json({ received: true }, { status: 200 })
  }

  const resultado = extraerResultadoDidit(parsed.data)
  if (!resultado) {
    console.warn(`[didit/webhook] Estado no reconocido session_id=${session_id} event_id=${event_id}`)
    return Response.json({ received: true }, { status: 200 })
  }

  // DNI esperado: el del tutor del retiro o el del referente (D-14).
  let dniEsperado: string | null = null
  if (sesion.retiro_id) {
    const { data: retiro } = await supabase.from('retiros').select('tutor_id').eq('id', sesion.retiro_id).maybeSingle()
    if (retiro) {
      const { data: tutor } = await supabase.from('tutores').select('dni').eq('id', retiro.tutor_id).maybeSingle()
      dniEsperado = tutor?.dni ?? null
    }
  } else if (sesion.referente_id) {
    const { data: referente } = await supabase.from('referentes').select('dni').eq('id', sesion.referente_id).maybeSingle()
    dniEsperado = referente?.dni ?? null
  }
  if (dniEsperado === null) {
    console.error(`[didit/webhook] No se encontró el DNI esperado session_id=${session_id}`)
    return Response.json({ error: 'Error al procesar.' }, { status: 500 })
  }

  const accion = resolverActualizacion(sesion, resultado, dniEsperado)
  if (accion.tipo === 'ignorar') {
    return Response.json({ received: true }, { status: 200 })
  }

  // Referente: la validación RENAPER va antes que la sesión. Si algo falla y Didit
  // reintenta, la sesión todavía no está terminada y el índice único evita duplicarla.
  if (sesion.proposito === 'validacion_referente' && accion.terminada && sesion.referente_id) {
    const validacion = mapearValidacionRenaper(resultado, accion.cambios.dni_coincide)
    if (validacion) {
      const { count } = await supabase
        .from('validaciones_renaper')
        .select('id', { count: 'exact', head: true })
        .eq('referente_id', sesion.referente_id)
      const { error } = await supabase.from('validaciones_renaper').insert({
        referente_id: sesion.referente_id,
        sesion_didit_id: sesion.id,
        consultado_por: sesion.creada_por,
        dni_consultado: dniEsperado,
        momento: (count ?? 0) === 0 ? 'alta_referente' : 'reintento',
        resultado: validacion.resultado,
        estado_dni: validacion.estado_dni,
        tiene_antecedentes: null,
      })
      if (error && error.code !== '23505') {
        console.error(`[didit/webhook] No se pudo crear la validación RENAPER (${error.code}).`)
        return Response.json({ error: 'Error al procesar.' }, { status: 500 })
      }
    } else if (resultado.status === 'Declined' && resultado.motivo === null) {
      console.warn(`[didit/webhook] Declined sin motivo session_id=${session_id}`)
    }
  }

  const { error: errorUpdate } = await supabase
    .from('sesiones_didit')
    .update(accion.cambios)
    .eq('id', sesion.id)
  if (errorUpdate) {
    console.error(`[didit/webhook] No se pudo guardar el resultado (${errorUpdate.code}).`)
    return Response.json({ error: 'Error al procesar.' }, { status: 500 })
  }

  // RF-10: con el resultado guardado, se borra la sesión en Didit. Va después de
  // responder para no pasar de los 5 s que espera Didit (decisión 4).
  if (accion.terminada) {
    const apiKey = process.env.DIDIT_API_KEY
    after(async () => {
      if (!apiKey) {
        console.warn(`[didit/webhook] Sin DIDIT_API_KEY: no se borró la sesión session_id=${session_id}`)
        return
      }
      const borrado = await borrarSesionDidit({ apiKey, sessionId: session_id })
      if (!borrado.ok) {
        console.error(`[didit/webhook] No se pudo borrar la sesión en Didit session_id=${session_id}: ${borrado.falla}`)
      }
    })
  }

  return Response.json({ received: true }, { status: 200 })
}
