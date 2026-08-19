import { z } from 'zod'

export const diagnosticoSchema = z.object({
  legajo_id: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, { error: 'Requerido' }),
  nnya_id: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, { error: 'Requerido' }),
  tipo: z.string().min(1, { error: 'Seleccioná un tipo de diagnóstico (DGN-EX-06)' }),
  descripcion: z.string().min(1, { error: 'La descripción es obligatoria' }),
  fecha_diagnostico: z.string().min(1, { error: 'Requerido' }).refine(
    (val) => new Date(val) <= new Date(),
    { message: 'La fecha del diagnóstico no puede ser futura (DGN-EX-03)' }
  ),
  profesional: z.string().max(200).optional().or(z.literal('')),
  institucion: z.string().max(200).optional().or(z.literal('')),
})

export type DiagnosticoFormValues = z.infer<typeof diagnosticoSchema>
