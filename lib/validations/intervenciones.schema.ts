import { z } from 'zod'

export const intervencionSchema = z.object({
  nnya_id: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, { error: 'Requerido' }),
  tipo: z.string().min(1, { error: 'El tipo de intervención es obligatorio' }).max(50),
  descripcion: z.string().min(1, { error: 'La descripción es obligatoria' }),
  fecha: z.string().min(1, { error: 'Requerido' }).refine(
    (val) => new Date(val) <= new Date(),
    { message: 'La fecha de la intervención no puede ser futura' }
  ),
  profesional_id: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, { error: 'Seleccioná el profesional responsable' }),
  estado: z.enum(['pendiente', 'en_curso', 'cerrada']),
  resultado: z.string().max(2000).optional().or(z.literal('')),
  observaciones: z.string().max(2000).optional().or(z.literal('')),
})

export type IntervencionFormValues = z.infer<typeof intervencionSchema>
