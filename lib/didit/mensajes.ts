// Códigos estables y mensajes de la verificación de identidad con Didit (prompts/047).
// Los textos de la pantalla son los de D-33 (Plan 035 §7.4): no se cambian acá sin
// cambiar la decisión. Los códigos sin texto en D-33 llevan un mensaje técnico o null.

export const CODIGOS_DIDIT = [
  'IDENTITY_VERIFIED_AUTHORIZED',
  'IDENTITY_NOT_VERIFIED',
  'IDENTITY_VERIFIED_NOT_AUTHORIZED',
  'IDENTITY_PENDING',
  'PROVIDER_ERROR',
  'DNI_MISMATCH',
  'REQUIRES_REVIEW',
  'MAX_ATTEMPTS_REACHED',
  'FALLBACK_AVAILABLE',
  'CONSENT_REJECTED',
  'CONSENT_REQUIRED',
  'SESSION_CREATED',
  'FALLBACK_APPLIED',
  'INVALID_REQUEST',
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'NOT_CONFIGURED',
] as const

export type CodigoDidit = (typeof CODIGOS_DIDIT)[number]

const MENSAJE_REVISION =
  'Se alcanzó el máximo de 3 intentos. El retiro queda en revisión hasta que Dirección lo resuelva.'

export const MENSAJES_DIDIT: Record<CodigoDidit, string | null> = {
  // D-33
  IDENTITY_VERIFIED_AUTHORIZED: 'Identidad verificada. Puede registrar el retiro.',
  IDENTITY_NOT_VERIFIED: 'No fue posible validar la identidad del tutor.',
  IDENTITY_VERIFIED_NOT_AUTHORIZED:
    'La persona identificada no se encuentra autorizada para retirar al NNyA.',
  PROVIDER_ERROR: 'No fue posible completar la validación de identidad. Intente nuevamente.',
  DNI_MISMATCH: 'El DNI verificado no coincide con el del tutor seleccionado.',
  REQUIRES_REVIEW: MENSAJE_REVISION,
  MAX_ATTEMPTS_REACHED: MENSAJE_REVISION,
  FALLBACK_AVAILABLE: 'Puede verificar la identidad de forma manual. Ingrese el motivo.',
  CONSENT_REJECTED: 'Sin consentimiento, la identidad debe verificarla Dirección de forma manual.',
  // Sin texto de pantalla en D-33: la pantalla decide qué mostrar.
  IDENTITY_PENDING: null,
  SESSION_CREATED: null,
  FALLBACK_APPLIED: null,
  // Errores técnicos de la API.
  CONSENT_REQUIRED: 'Falta registrar el consentimiento del adulto para la verificación con Didit.',
  INVALID_REQUEST: 'Datos inválidos.',
  UNAUTHENTICATED: 'No autenticado.',
  FORBIDDEN: 'Acceso denegado.',
  NOT_FOUND: 'No se encontró el registro indicado.',
  CONFLICT: 'La operación no se puede realizar en el estado actual.',
  NOT_CONFIGURED: 'La verificación con Didit no está configurada.',
}

/** Forma de la respuesta que recibe la pantalla (Plan 035 §7.5). */
export interface RespuestaDidit<T = Record<string, unknown>> {
  ok: boolean
  code: CodigoDidit
  message: string | null
  data?: T
}

/** Envelope común de las respuestas de /api/didit/sesiones (Plan 035 §7.5). */
export function respuestaDidit(
  code: CodigoDidit,
  status: number,
  data?: Record<string, unknown>,
  message: string | null = MENSAJES_DIDIT[code]
): Response {
  return Response.json({ ok: status < 400, code, message, ...(data ? { data } : {}) }, { status })
}
