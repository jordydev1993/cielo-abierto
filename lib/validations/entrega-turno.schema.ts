import { z } from 'zod'

export const entregaTurnoSchema = z.object({
  novedades_traspaso: z.string().max(2000).optional().or(z.literal('')),
})

export type EntregaTurnoFormValues = z.infer<typeof entregaTurnoSchema>
