import { z } from 'zod'

export const legajoSchema = z.object({
  nnya_id: z.string().uuid({ error: 'Seleccioná un NNyA' }),
  numero_legajo: z.string().min(1, { error: 'Requerido' }).max(50),
  fecha_apertura: z.string().min(1, { error: 'Requerido' }),
  observaciones: z.string().max(2000).optional().or(z.literal('')),
})

export const legajoCierreSchema = z.object({
  motivo_cierre: z.string().min(5, { error: 'Ingresá el motivo de cierre' }),
  estado: z.enum(['cerrado', 'archivado']),
})

export type LegajoFormValues = z.infer<typeof legajoSchema>
export type LegajoCierreValues = z.infer<typeof legajoCierreSchema>
