import { z } from 'zod'

// Mensajes D y E de la Práctica 3 §6, tal cual están escritos (D-33).
export const MENSAJE_CAMPOS_OBLIGATORIOS = 'Complete los campos obligatorios para registrar el retiro.'
export const MENSAJE_HORA_FIN = 'Debe ingresar la hora de finalización para completar el retiro.'

// Paso 1 (prompts/049, decisión 2): el NNyA y el tutor con autorización vigente.
export const iniciarRetiroSchema = z.object({
  nnya_id: z.string().min(1, MENSAJE_CAMPOS_OBLIGATORIOS),
  autorizacion_retiro_id: z.string().min(1, MENSAJE_CAMPOS_OBLIGATORIOS),
})
export type IniciarRetiroValues = z.infer<typeof iniciarRetiroSchema>

// Registro, con la identidad verificada: hora de inicio y descripción obligatorias.
export const registrarRetiroSchema = z.object({
  fecha_inicio: z.string().min(1, MENSAJE_CAMPOS_OBLIGATORIOS),
  descripcion: z.string().trim().min(1, MENSAJE_CAMPOS_OBLIGATORIOS),
  observaciones: z.string().trim().optional(),
})
export type RegistrarRetiroValues = z.infer<typeof registrarRetiroSchema>

// Cierre: la hora de finalización es obligatoria (mensaje E).
export const cerrarRetiroSchema = z.object({
  fecha_fin: z.string().min(1, MENSAJE_HORA_FIN),
  observaciones: z.string().trim().optional(),
})
export type CerrarRetiroValues = z.infer<typeof cerrarRetiroSchema>

// Admin: rechazar un retiro en revisión (prompts/049, decisión 3) o aplicar el fallback.
export const motivoAdminSchema = z.object({
  motivo: z.string().trim().min(1, 'El motivo es obligatorio.').max(500),
})
export type MotivoAdminValues = z.infer<typeof motivoAdminSchema>
