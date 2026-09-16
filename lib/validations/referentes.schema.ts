import { z } from 'zod'

export const referenteSchema = z.object({
  nombre: z.string().min(2, { error: 'Mínimo 2 caracteres' }).max(100),
  apellido: z.string().min(2, { error: 'Mínimo 2 caracteres' }).max(100),
  dni: z.string().min(6, { error: 'DNI inválido' }).max(20),
  fecha_nacimiento: z.string().optional().or(z.literal('')),
  tipo: z.enum(['familiar', 'educador', 'vecino', 'otro'], { error: 'Seleccioná un tipo' }),
  vinculo_descripcion: z.string().max(500).optional().or(z.literal('')),
  telefono: z.string().max(20).optional().or(z.literal('')),
  email: z.string().optional().or(z.literal('')),
  domicilio: z.string().max(300).optional().or(z.literal('')),
  activo: z.boolean(),
})

export type ReferenteFormValues = z.infer<typeof referenteSchema>
