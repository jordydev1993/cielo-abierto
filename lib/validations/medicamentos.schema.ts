import { z } from 'zod'

export const medicamentoSchema = z.object({
  legajo_id: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, { error: 'Requerido' }),
  nnya_id: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, { error: 'Requerido' }),
  diagnostico_id: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, { error: 'Seleccioná un diagnóstico activo (M-EX-02)' }),
  nombre: z.string().min(1, { error: 'El nombre del medicamento es obligatorio' }).max(200),
  dosis: z.string().min(1, { error: 'La dosis es obligatoria' }).max(100),
  frecuencia: z.string().min(1, { error: 'La frecuencia es obligatoria' }).max(200),
  via_administracion: z.string().max(100).optional().or(z.literal('')),
  prescriptor: z.string().max(200).optional().or(z.literal('')),
  fecha_inicio: z.string().min(1, { error: 'Requerido' }),
  fecha_fin: z.string().optional().or(z.literal('')),
  observaciones: z.string().max(2000).optional().or(z.literal('')),
})

export type MedicamentoFormValues = z.infer<typeof medicamentoSchema>
