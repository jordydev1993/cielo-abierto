import { z } from 'zod'

export const nnyaSchema = z.object({
  nombre: z.string().min(2, { error: 'Mínimo 2 caracteres' }).max(100),
  apellido: z.string().min(2, { error: 'Mínimo 2 caracteres' }).max(100),
  dni: z.string().min(6, { error: 'DNI inválido' }).max(20),
  fecha_nacimiento: z.string().min(1, { error: 'Requerido' }),
  lugar_nacimiento: z.string().max(100).optional().or(z.literal('')),
  nacionalidad: z.string().max(100).optional().or(z.literal('')),
  genero: z.string().optional().or(z.literal('')),
  domicilio: z.string().max(300).optional().or(z.literal('')),
  telefono: z.string().max(20).optional().or(z.literal('')),
  email: z.string().optional().or(z.literal('')),
  escolaridad: z.string().max(100).optional().or(z.literal('')),
  obra_social: z.string().max(100).optional().or(z.literal('')),
  numero_expediente: z.string().max(50).optional().or(z.literal('')),
  estado_actual: z.enum(['En residencia', 'En proceso de egreso', 'Egresado', 'Fallecido']),
})

export type NnyaFormValues = z.infer<typeof nnyaSchema>
