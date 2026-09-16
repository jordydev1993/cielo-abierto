import { z } from 'zod'

const uuidLike = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const evaluacionCasoSchema = z.object({
  nnya_id: z.string().regex(uuidLike, { error: 'Seleccioná un NNyA' }),
  resumen_situacion: z.string().min(1, { error: 'Requerido' }).max(2000),
  indicador_avance: z.string().refine((v) => {
    if (!v) return true
    const n = Number(v)
    return Number.isInteger(n) && n >= 1 && n <= 5
  }, { error: 'Indicador inválido (1-5)' }),
  recomendaciones: z.string().max(1000).optional().or(z.literal('')),
  seguimiento_requerido: z.boolean(),
})

export type EvaluacionCasoFormValues = z.infer<typeof evaluacionCasoSchema>
