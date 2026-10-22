import { z } from 'zod'
import { SANDBOX_SCENARIOS } from '../didit/client.ts'

// Mismo patrón de UUID que el resto de los schemas (prompts/006: z.uuid() rechaza los IDs semilla).
const uuid = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)

// POST /api/didit/sesiones (Plan 035 §7.1). El DNI no viaja: sale de la base (D-14).
export const crearSesionDiditSchema = z.discriminatedUnion('proposito', [
  z.strictObject({
    proposito: z.literal('retiro'),
    retiro_id: uuid,
    sandbox_scenario: z.enum(SANDBOX_SCENARIOS).optional(),
  }),
  z.strictObject({
    proposito: z.literal('validacion_referente'),
    referente_id: uuid,
    // D-26: el referente no tiene columna de consentimiento; la pantalla lo confirma acá.
    consentimiento: z.literal(true),
    sandbox_scenario: z.enum(SANDBOX_SCENARIOS).optional(),
  }),
])

export type CrearSesionDiditInput = z.infer<typeof crearSesionDiditSchema>

// POST /api/didit/sesiones/[id]/fallback (Plan 035 §7.3).
export const fallbackDiditSchema = z.strictObject({
  motivo: z.string().trim().min(1, 'El motivo es obligatorio.').max(500),
})

export const sesionIdSchema = uuid
