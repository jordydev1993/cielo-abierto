import { z } from 'zod'

export const transferenciaAuhSchema = z.object({
  fecha_gestion: z.string().optional().or(z.literal('')),
  fecha_efectiva: z.string().optional().or(z.literal('')),
  estado: z.enum(['pendiente', 'en_gestion', 'transferida', 'rechazada', 'no_corresponde'], {
    error: 'Seleccioná un estado',
  }),
  organismo: z.string().max(100).optional().or(z.literal('')),
  observaciones: z.string().max(1000).optional().or(z.literal('')),
})

export type TransferenciaAuhFormValues = z.infer<typeof transferenciaAuhSchema>
