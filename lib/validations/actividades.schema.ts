import { z } from 'zod'

const uuidLike = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const actividadSchema = z.object({
  titulo: z.string().min(1, { error: 'El título es obligatorio' }).max(200),
  descripcion: z.string().max(2000).optional().or(z.literal('')),
  tipo: z.string().min(1, { error: 'El tipo de actividad es obligatorio' }).max(50),
  fecha: z.string().min(1, { error: 'Requerido' }),
  hora_inicio: z.string().optional().or(z.literal('')),
  hora_fin: z.string().optional().or(z.literal('')),
  lugar: z.string().max(200).optional().or(z.literal('')),
  responsable_id: z.string().regex(uuidLike, { error: 'Seleccioná el responsable' }),
  nnya_ids: z.array(z.string().regex(uuidLike)).min(1, { error: 'Seleccioná al menos un NNyA' }),
  observaciones: z.string().max(2000).optional().or(z.literal('')),
})

export type ActividadFormValues = z.infer<typeof actividadSchema>
