import { verifyDiditSignature } from '@/lib/didit/verify-signature'
import { diditWebhookSchema } from '@/lib/validations/didit-webhook.schema'

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

  const { webhook_type, session_id, status } = parsed.data

  if (webhook_type !== 'status.updated') {
    return Response.json({ received: true }, { status: 200 })
  }

  console.log(`[didit/webhook] session_id=${session_id} status=${status}`)

  // TODO(Meli): una vez que exista el modelo de datos de Sofi (tabla de
  // sesiones de verificación Didit + tabla `retiros`), acá va la lógica de:
  //  1. buscar la sesión de verificación por session_id
  //  2. actualizar su estado según `status` (Approved/Declined/In Review/...)
  //  3. si status === 'Approved', validar autorización de retiro vigente
  //     antes de habilitar el retiro (RF-05/RF-06 — son dos validaciones
  //     independientes, un resultado de identidad válido no autoriza nada
  //     por sí solo)

  return Response.json({ received: true }, { status: 200 })
}
