import { z } from 'zod'

const uuidLike = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const vinculoTutelaSchema = z
  .object({
    tipo: z.enum(['tutela_residencia', 'revinculacion_familiar', 'referente_afectivo'], {
      error: 'Seleccioná un tipo de vínculo',
    }),
    usuario_id: z.string().regex(uuidLike).optional().or(z.literal('')),
    referente_id: z.string().regex(uuidLike).optional().or(z.literal('')),
    vigente_desde: z.string().min(1, { error: 'Requerido' }),
    vigente_hasta: z.string().optional().or(z.literal('')),
    estado: z.enum(['propuesto', 'vigente', 'finalizado', 'revocado'], {
      error: 'Seleccioná un estado',
    }),
    resolucion_respaldo: z.string().max(1000).optional().or(z.literal('')),
    motivo_finalizacion: z.string().max(1000).optional().or(z.literal('')),
    observaciones: z.string().max(1000).optional().or(z.literal('')),
  })
  .refine((v) => v.tipo !== 'tutela_residencia' || !!v.usuario_id, {
    message: 'Tutela de residencia requiere seleccionar un usuario responsable',
    path: ['usuario_id'],
  })
  .refine(
    (v) => !['revinculacion_familiar', 'referente_afectivo'].includes(v.tipo) || !!v.referente_id,
    { message: 'Este tipo de vínculo requiere seleccionar un referente', path: ['referente_id'] }
  )
  .refine((v) => !!v.usuario_id !== !!v.referente_id, {
    message: 'Seleccioná exactamente uno: usuario responsable o referente',
    path: ['referente_id'],
  })
  .refine((v) => !v.vigente_hasta || v.vigente_hasta >= v.vigente_desde, {
    message: 'La fecha de fin no puede ser anterior a la de inicio',
    path: ['vigente_hasta'],
  })

export type VinculoTutelaFormValues = z.infer<typeof vinculoTutelaSchema>
