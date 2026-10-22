import { z } from 'zod'

// Autorización para retirar a un NNyA (RN-01). La carga y la revoca un Admin.
export const autorizacionRetiroSchema = z
  .object({
    nnya_tutor_id: z.string().min(1, 'Seleccione el tutor.'),
    vigente_desde: z.string().min(1, 'Indique desde cuándo rige la autorización.'),
    vigente_hasta: z.string().optional(),
    restricciones: z.string().trim().max(500).optional(),
  })
  .refine((v) => !v.vigente_hasta || v.vigente_hasta >= v.vigente_desde, {
    message: 'La fecha de fin no puede ser anterior a la de inicio.',
    path: ['vigente_hasta'],
  })

export type AutorizacionRetiroValues = z.infer<typeof autorizacionRetiroSchema>
