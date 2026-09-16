import { z } from 'zod'

const cumplimiento = z.enum(['cumple', 'parcial', 'no_cumple', 'no_corresponde']).optional().or(z.literal(''))

export const seguimientoPostEgresoSchema = z.object({
  fecha_contacto: z.string().optional().or(z.literal('')),
  contacto_realizado: z.boolean(),
  contacto_efectivo: z.boolean().optional(),
  escolaridad: cumplimiento,
  salud: cumplimiento,
  terapias: cumplimiento,
  percibe_auh: z.boolean().optional(),
  detalle_incumplimiento: z.string().max(1000).optional().or(z.literal('')),
  observaciones: z.string().max(1000).optional().or(z.literal('')),
  indicador_reinsercion: z.string().refine((v) => {
    if (!v) return true
    const n = Number(v)
    return Number.isInteger(n) && n >= 1 && n <= 5
  }, { error: 'Indicador inválido (1-5)' }),
  requiere_intervencion: z.boolean(),
})

export type SeguimientoPostEgresoFormValues = z.infer<typeof seguimientoPostEgresoSchema>
