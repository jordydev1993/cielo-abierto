import { z } from 'zod'

export const incidenteSchema = z.object({
  legajo_id: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, { error: 'Requerido' }),
  nnya_id: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, { error: 'Requerido' }),
  tipo: z.string().min(1, { error: 'Seleccioná un tipo de incidente' }),
  descripcion: z.string().min(1, { error: 'La descripción es obligatoria' }),
  fecha_hora: z.string().min(1, { error: 'Requerido' }),
  gravedad: z.enum(['leve', 'media', 'grave', 'critico']),
  acciones_tomadas: z.string().max(2000).optional().or(z.literal('')),
  gravedad_sugerida: z.enum(['leve', 'media', 'grave', 'critico']).optional(),
  sugerencia_aceptada: z.boolean().optional(),
})

export type IncidenteFormValues = z.infer<typeof incidenteSchema>
