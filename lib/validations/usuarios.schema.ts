import { z } from 'zod'

export const usuarioCreateSchema = z.object({
  nombre: z.string().min(2, { error: 'Mínimo 2 caracteres' }).max(100),
  apellido: z.string().min(2, { error: 'Mínimo 2 caracteres' }).max(100),
  email: z.email({ error: 'Email inválido' }),
  password: z.string().min(8, { error: 'Mínimo 8 caracteres' }),
  rol_id: z.string().uuid({ error: 'Seleccioná un rol' }),
  telefono: z.string().max(20).optional().or(z.literal('')),
})

export const usuarioUpdateSchema = z.object({
  nombre: z.string().min(2, { error: 'Mínimo 2 caracteres' }).max(100),
  apellido: z.string().min(2, { error: 'Mínimo 2 caracteres' }).max(100),
  rol_id: z.string().uuid({ error: 'Seleccioná un rol' }),
  telefono: z.string().max(20).optional().or(z.literal('')),
})

export type UsuarioCreateValues = z.infer<typeof usuarioCreateSchema>
export type UsuarioUpdateValues = z.infer<typeof usuarioUpdateSchema>
