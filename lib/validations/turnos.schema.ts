import { z } from 'zod'

export const turnoSchema = z.object({
  legajo_id: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, { error: 'Requerido' }),
  nnya_id: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, { error: 'Requerido' }),
  tipo: z.string().min(1, { error: 'Seleccioná un tipo de turno' }),
  fecha_hora: z.string().min(1, { error: 'Requerido' }).refine(
    (val) => new Date(val) > new Date(),
    { message: 'El turno debe agendarse con fecha futura (T-EX-01)' }
  ),
  profesional: z.string().min(1, { error: 'El profesional o institución es obligatorio (T-EX-03)' }),
  lugar: z.string().max(200).optional().or(z.literal('')),
  motivo: z.string().max(1000).optional().or(z.literal('')),
})

export type TurnoFormValues = z.infer<typeof turnoSchema>
