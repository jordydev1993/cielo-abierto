import { z } from 'zod'

export const validacionRenaperSchema = z.object({
  momento: z.enum(['alta_referente', 'egreso', 'reintento'], { error: 'Seleccioná un momento' }),
  dni_consultado: z.string().min(6, { error: 'DNI inválido' }).max(20),
  estado_dni: z.enum(['vigente', 'vencido', 'inexistente', 'error_servicio'], {
    error: 'Seleccioná un estado',
  }),
  tiene_antecedentes: z.boolean().optional(),
  resultado: z.enum(['aprobado', 'rechazado', 'no_concluyente'], {
    error: 'Seleccioná un resultado',
  }),
})

export type ValidacionRenaperFormValues = z.infer<typeof validacionRenaperSchema>
