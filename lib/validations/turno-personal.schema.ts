import { z } from 'zod'

const uuidLike = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const turnoPersonalSchema = z.object({
  usuario_id: z.string().regex(uuidLike, { error: 'Seleccioná un usuario' }),
  fecha: z.string().min(1, { error: 'Requerido' }),
  turno: z.enum(['mañana', 'tarde', 'noche'], { error: 'Seleccioná una franja' }),
  // Incluye los 5 estados reales para que el form de edición pueda mostrar el valor
  // actual sin romper la validación cuando ya está en 'entregado'/'cerrado' (esos dos
  // solo se alcanzan desde el flujo de entrega/recepción, ver TurnoPersonalForm).
  estado: z.enum(['planificado', 'en_curso', 'entregado', 'cerrado', 'no_cubierto'], { error: 'Seleccioná un estado' }),
})

export type TurnoPersonalFormValues = z.infer<typeof turnoPersonalSchema>
