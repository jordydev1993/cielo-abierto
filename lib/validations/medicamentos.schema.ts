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
}).refine(
  // M-EX-04: también lo exige la base (chk_medicamentos_fechas, prompts/042). Fechas ISO: se comparan como texto.
  (v) => !v.fecha_fin || v.fecha_fin >= v.fecha_inicio,
  { message: 'La fecha de fin no puede ser anterior a la de inicio (M-EX-04)', path: ['fecha_fin'] }
)

export type MedicamentoFormValues = z.infer<typeof medicamentoSchema>
