import { z } from 'zod'

export const rolSchema = z.object({
  nombre: z.string().min(2, { error: 'Mínimo 2 caracteres' }).max(50, { error: 'Máximo 50 caracteres' }),
  descripcion: z.string().max(500, { error: 'Máximo 500 caracteres' }).optional().or(z.literal('')),
})

export type RolFormValues = z.infer<typeof rolSchema>
