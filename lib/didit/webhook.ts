// Lógica pura del webhook de Didit (prompts/048): qué se lee del payload, cómo se
// actualiza la sesión y qué validación RENAPER corresponde. Sin Next ni Supabase,
// para poder probarla en tests unitarios.
import { z } from 'zod'

// Los 10 valores de status de Didit, case-sensitive (D-1).
export const ESTADOS_DIDIT = [
  'Not Started',
  'In Progress',
  'Awaiting User',
  'Resubmitted',
  'In Review',
  'Approved',
  'Declined',
  'Abandoned',
  'Expired',
  'Kyc Expired',
] as const
export type EstadoDidit = (typeof ESTADOS_DIDIT)[number]

export const ESTADOS_TERMINADOS_DIDIT: ReadonlySet<string> = new Set([
  'Approved',
  'Declined',
  'Abandoned',
  'Expired',
  'Kyc Expired',
])

/**
 * Lo único que el sistema usa del webhook (D-28). Todo lo demás que manda Didit
 * (nombre, fecha de nacimiento, foto de RENAPER, link a la selfie) no se lee.
 */
export interface ResultadoWebhookDidit {
  status: EstadoDidit
  motivo: string | null
  personalNumber: string | null
}

const numeroSchema = z.union([z.string(), z.number()]).nullable().optional()

const verificacionSchema = z.object({
  verification_method: z.string().nullable().optional(),
  personal_number: numeroSchema,
  fallback_from: z.object({ reason: z.string().nullable().optional() }).nullable().optional(),
  id_lookup: z.object({ personal_number: numeroSchema }).nullable().optional(),
})

const decisionSchema = z.object({
  id_verifications: z.array(z.unknown()).nullable().optional(),
})

export function extraerResultadoDidit(payload: {
  status: string
  decision?: Record<string, unknown>
}): ResultadoWebhookDidit | null {
  if (!(ESTADOS_DIDIT as readonly string[]).includes(payload.status)) return null
  const status = payload.status as EstadoDidit

  const decision = decisionSchema.safeParse(payload.decision ?? {})
  const verificaciones = (decision.success ? (decision.data.id_verifications ?? []) : [])
    .map((v) => verificacionSchema.safeParse(v))
    .flatMap((r) => (r.success ? [r.data] : []))
  const verificacion =
    verificaciones.find((v) => v.verification_method === 'id_lookup') ?? verificaciones[0]

  const numero = verificacion?.personal_number ?? verificacion?.id_lookup?.personal_number
  return {
    status,
    motivo: verificacion?.fallback_from?.reason ?? null,
    personalNumber: numero === null || numero === undefined ? null : String(numero),
  }
}

const soloDigitos = (valor: string) => valor.replace(/\D/g, '')

export interface CambiosSesionDidit {
  estado_didit: EstadoDidit
  error_proveedor?: 'provider_error'
  dni_coincide?: boolean
  finalizada_at?: string
}

export type AccionWebhook =
  | { tipo: 'ignorar'; motivo: 'terminada' | 'sin_cambios' }
  | { tipo: 'actualizar'; cambios: CambiosSesionDidit; terminada: boolean }

/**
 * Qué hacer con la sesión ante un evento. Idempotente por estado (decisión 5):
 * una sesión terminada no cambia más, y un estado repetido es un no-op.
 */
export function resolverActualizacion(
  sesion: { estado_didit: string | null },
  resultado: ResultadoWebhookDidit,
  dniEsperado: string,
  ahora: Date = new Date()
): AccionWebhook {
  if (sesion.estado_didit !== null && ESTADOS_TERMINADOS_DIDIT.has(sesion.estado_didit)) {
    return { tipo: 'ignorar', motivo: 'terminada' }
  }
  if (sesion.estado_didit === resultado.status) return { tipo: 'ignorar', motivo: 'sin_cambios' }

  const terminada = ESTADOS_TERMINADOS_DIDIT.has(resultado.status)
  const cambios: CambiosSesionDidit = { estado_didit: resultado.status }

  if (resultado.status === 'Approved') {
    // D-14: Didit no rechaza otro DNI; se compara acá. Sin personal_number, no coincide.
    cambios.dni_coincide =
      resultado.personalNumber !== null &&
      soloDigitos(resultado.personalNumber) !== '' &&
      soloDigitos(resultado.personalNumber) === soloDigitos(dniEsperado)
  }
  if (resultado.status === 'Declined' && resultado.motivo === 'provider_error') {
    cambios.error_proveedor = 'provider_error'
  }
  if (terminada) cambios.finalizada_at = ahora.toISOString()

  return { tipo: 'actualizar', cambios, terminada }
}

export interface ValidacionRenaperDidit {
  resultado: 'aprobado' | 'rechazado' | 'no_concluyente'
  estado_dni: 'vigente' | 'inexistente' | 'error_servicio'
}

/**
 * Mapeo de D-11 hacia validaciones_renaper. Devuelve null cuando no corresponde
 * crear la validación: sesión vencida o abandonada, DNI distinto (decisión 2) o
 * Declined sin motivo (decisión 3). `vencido` no se usa hasta ver RENAPER real.
 */
export function mapearValidacionRenaper(
  resultado: ResultadoWebhookDidit,
  dniCoincide: boolean | undefined
): ValidacionRenaperDidit | null {
  if (resultado.status === 'Approved') {
    return dniCoincide ? { resultado: 'aprobado', estado_dni: 'vigente' } : null
  }
  if (resultado.status !== 'Declined') return null

  switch (resultado.motivo) {
    case 'no_match':
      return { resultado: 'rechazado', estado_dni: 'inexistente' }
    case 'partial_match':
      return { resultado: 'rechazado', estado_dni: 'vigente' }
    case 'provider_error':
      return { resultado: 'no_concluyente', estado_dni: 'error_servicio' }
    default:
      return null
  }
}
