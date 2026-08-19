import { z } from 'zod'

export const audienciaSchema = z.object({
  legajo_id: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, { error: 'Requerido' }),
  nnya_id: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, { error: 'Requerido' }),
  tipo: z.string().min(1, { error: 'Seleccioná un tipo de audiencia' }),
  fecha_hora: z.string().min(1, { error: 'Requerido' }).refine(
    (val) => new Date(val) > new Date(),
    { message: 'La audiencia debe programarse con fecha futura (AJ-EX-06)' }
  ),
  tribunal: z.string().min(1, { error: 'El tribunal es obligatorio' }),
  juzgado: z.string().max(200).optional().or(z.literal('')),
  numero_expediente: z.string().max(100).optional().or(z.literal('')),
  caratula: z.string().max(500).optional().or(z.literal('')),
  observaciones: z.string().max(2000).optional().or(z.literal('')),
})

export const resolverAudienciaSchema = z.object({
  resultado: z.string().min(1, { error: 'La resolución judicial es obligatoria' }),
  observaciones: z.string().max(2000).optional().or(z.literal('')),
})

export type AudienciaFormValues = z.infer<typeof audienciaSchema>
export type ResolverAudienciaValues = z.infer<typeof resolverAudienciaSchema>
