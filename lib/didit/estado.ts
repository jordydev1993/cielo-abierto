// Reglas de intentos, sesión abierta, fallback y código de resultado a partir de las
// filas de sesiones_didit (prompts/047). Lógica pura: la usan los endpoints y los
// tests unitarios. La garantía real está en los triggers de la base; esto replica
// las mismas reglas para responder antes y con el mensaje correcto.
import type { CodigoDidit } from './mensajes.ts'

export const MAX_INTENTOS_DIDIT = 3

/** Validez de la sesión configurada en el workflow de Didit (D-27). */
export const VALIDEZ_SESION_MS = 60 * 60 * 1000

export interface SesionDiditResumen {
  id: string
  session_id: string | null
  estado_didit: string | null
  estado_rnf12: string
  error_proveedor: string | null
  dni_coincide: boolean | null
  created_at: string
}

// Los mismos estados que cuenta fn_validar_max_intentos_didit (D-3).
const ESTADOS_TERMINADOS = new Set(['Approved', 'Declined', 'Abandoned', 'Expired', 'Kyc Expired'])
/** Estados de Didit en los que la persona todavía puede completar la sesión. */
export const ESTADOS_ABIERTOS = new Set(['Not Started', 'In Progress', 'Awaiting User', 'Resubmitted'])

/** Intentos consumidos: sesiones terminadas sin error del proveedor (D-3, D-12). */
export function intentosUsados(sesiones: SesionDiditResumen[]): number {
  return sesiones.filter(
    (s) => s.estado_didit !== null && ESTADOS_TERMINADOS.has(s.estado_didit) && s.error_proveedor === null
  ).length
}

export function intentosRestantes(sesiones: SesionDiditResumen[]): number {
  return Math.max(0, MAX_INTENTOS_DIDIT - intentosUsados(sesiones))
}

/** Intentos fallidos: "Identidad no verificada", incluye Approved con otro DNI (D-14). */
export function intentosFallidos(sesiones: SesionDiditResumen[]): number {
  return sesiones.filter((s) => s.estado_rnf12 === 'Identidad no verificada').length
}

export function tieneIdentidadVerificada(sesiones: SesionDiditResumen[]): boolean {
  return sesiones.some((s) => s.estado_rnf12 === 'Identidad verificada')
}

/** La sesión creada en Didit que todavía no tiene resultado y no venció (decisión 3). */
export function sesionAbierta(
  sesiones: SesionDiditResumen[],
  ahora: number = Date.now()
): SesionDiditResumen | null {
  const abiertas = sesiones.filter(
    (s) =>
      s.session_id !== null &&
      s.error_proveedor === null &&
      (s.estado_didit === null || ESTADOS_ABIERTOS.has(s.estado_didit)) &&
      ahora - new Date(s.created_at).getTime() < VALIDEZ_SESION_MS
  )
  abiertas.sort((a, b) => b.created_at.localeCompare(a.created_at))
  return abiertas[0] ?? null
}

/** Fallback manual: solo Admin, y con error del proveedor, 3 fallidos o sin consentimiento (D-2, D-20, D-26). */
export function fallbackHabilitado(params: {
  rol: string | null
  sesiones: SesionDiditResumen[]
  consentimiento?: string | null
}): boolean {
  const { rol, sesiones, consentimiento } = params
  if (rol !== 'Admin' || tieneIdentidadVerificada(sesiones)) return false
  return (
    sesiones.some((s) => s.error_proveedor !== null) ||
    intentosFallidos(sesiones) >= MAX_INTENTOS_DIDIT ||
    consentimiento === 'rechazado'
  )
}

/** Código de §7.4 para una sesión, teniendo en cuenta las demás del mismo trámite. */
export function codigoSesion(
  sesion: SesionDiditResumen,
  sesiones: SesionDiditResumen[],
  retiroEstado?: string | null
): CodigoDidit {
  if (sesion.estado_rnf12 === 'Identidad verificada') return 'IDENTITY_VERIFIED_AUTHORIZED'
  if (sesion.estado_rnf12 === 'Error del proveedor') return 'PROVIDER_ERROR'
  if (retiroEstado === 'requiere_revision' || intentosFallidos(sesiones) >= MAX_INTENTOS_DIDIT) {
    if (sesion.estado_rnf12 === 'Identidad no verificada') return 'REQUIRES_REVIEW'
  }
  if (sesion.estado_rnf12 === 'Identidad no verificada') {
    return sesion.estado_didit === 'Approved' && sesion.dni_coincide === false
      ? 'DNI_MISMATCH'
      : 'IDENTITY_NOT_VERIFIED'
  }
  return 'IDENTITY_PENDING'
}
