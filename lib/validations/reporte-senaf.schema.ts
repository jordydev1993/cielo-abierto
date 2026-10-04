import { z } from 'zod'

export const periodoSenafSchema = z.object({
  mes: z.coerce.number().int().min(1, 'Mes inválido').max(12, 'Mes inválido'),
  anio: z.coerce.number().int().min(2020, 'Año inválido').max(2100, 'Año inválido'),
})

export type PeriodoSenafValues = z.infer<typeof periodoSenafSchema>

export const edicionReporteSenafSchema = z.object({
  secciones: z.array(
    z.object({
      clave: z.string(),
      titulo: z.string(),
      texto: z.string().trim().min(1, 'La sección no puede quedar vacía'),
    }),
  ),
  observaciones_direccion: z.string().trim().max(4000, 'Máximo 4000 caracteres').optional(),
})

export type EdicionReporteSenafValues = z.infer<typeof edicionReporteSenafSchema>
