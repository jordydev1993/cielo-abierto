import { z } from 'zod'

export const legajoSchema = z.object({
  nnya_id: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, { error: 'Seleccioná un NNyA' }),
  numero_legajo: z.string().min(1, { error: 'Requerido' }).max(50),
  fecha_apertura: z.string().min(1, { error: 'Requerido' }),
  // L-EX-15: obligatorio al abrir; la base lo exige en el INSERT (prompts/042).
  motivo_ingreso: z.string().trim().min(5, { error: 'Indicá el motivo de ingreso (L-EX-15)' }).max(2000),
  observaciones: z.string().max(2000).optional().or(z.literal('')),
})

export const legajoCierreSchema = z.object({
  motivo_cierre: z.string().min(5, { error: 'Ingresá el motivo de cierre' }),
  // Solo se cierra: archivar es una acción aparte, 12 meses después (prompts/037).
  estado: z.literal('cerrado'),
})

export type LegajoFormValues = z.infer<typeof legajoSchema>
export type LegajoCierreValues = z.infer<typeof legajoCierreSchema>
