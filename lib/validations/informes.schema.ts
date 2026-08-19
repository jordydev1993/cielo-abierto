import { z } from 'zod'

export const informeSchema = z.object({
  legajo_id: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, { error: 'Requerido' }),
  nnya_id: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, { error: 'Requerido' }),
  tipo: z.string().min(1, { error: 'Seleccioná un tipo de informe' }),
  titulo: z.string().min(1, { error: 'El título es obligatorio' }).max(300),
  contenido: z.string().min(1, { error: 'El contenido es obligatorio' }),
  fecha_informe: z.string().min(1, { error: 'Requerido' }),
})

export type InformeFormValues = z.infer<typeof informeSchema>
