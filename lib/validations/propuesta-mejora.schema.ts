import { z } from 'zod'

const uuidLike = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const propuestaMejoraSchema = z.object({
  evaluacion_id: z.string().regex(uuidLike, { error: 'Seleccioná una evaluación' }),
  descripcion: z.string().min(1, { error: 'Requerido' }).max(1000),
  tipo: z.enum(['mejora', 'capacitacion'], { error: 'Seleccioná un tipo' }),
  area: z
    .enum(['educativa', 'sanitaria', 'social', 'institucional', 'protocolos'])
    .optional()
    .or(z.literal('')),
  responsable_id: z.string().regex(uuidLike).optional().or(z.literal('')),
  fecha_vencimiento: z.string().optional().or(z.literal('')),
  observaciones: z.string().max(1000).optional().or(z.literal('')),
})

export type PropuestaMejoraFormValues = z.infer<typeof propuestaMejoraSchema>
