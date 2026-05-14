import { z } from 'zod'

export const tutorSchema = z.object({
  nombre: z.string().min(2, { error: 'Mínimo 2 caracteres' }).max(100),
  apellido: z.string().min(2, { error: 'Mínimo 2 caracteres' }).max(100),
  dni: z.string().min(6, { error: 'DNI inválido' }).max(20),
  parentesco: z.string().min(2, { error: 'Requerido' }).max(50),
  telefono: z.string().max(20).optional().or(z.literal('')),
  email: z.string().optional().or(z.literal('')),
  domicilio: z.string().max(300).optional().or(z.literal('')),
  ocupacion: z.string().max(100).optional().or(z.literal('')),
})

export type TutorFormValues = z.infer<typeof tutorSchema>
