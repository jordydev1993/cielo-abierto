import { z } from 'zod'

export const evaluacionInstitucionalSchema = z.object({
  periodo_mes: z.string().refine((v) => {
    const n = Number(v)
    return Number.isInteger(n) && n >= 1 && n <= 12
  }, { error: 'Mes inválido (1-12)' }),
  periodo_anio: z.string().refine((v) => {
    const n = Number(v)
    return Number.isInteger(n) && n >= 2020 && n <= 2100
  }, { error: 'Año inválido' }),
  fecha_reunion: z.string().min(1, { error: 'Requerido' }),
  observaciones: z.string().max(1000).optional().or(z.literal('')),
  estado: z.enum(['convocada', 'realizada', 'cancelada'], { error: 'Seleccioná un estado' }),
})

export type EvaluacionInstitucionalFormValues = z.infer<typeof evaluacionInstitucionalSchema>
