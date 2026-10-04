'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle } from 'lucide-react'
import { FormField } from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  edicionReporteSenafSchema,
  type EdicionReporteSenafValues,
} from '@/lib/validations/reporte-senaf.schema'
import type { AdvertenciaInforme, ReporteSenaf } from '@/types/database.types'

function Aviso({ mensaje }: { mensaje: string }) {
  return (
    <p className="flex gap-2 rounded-md bg-tertiary-fixed/60 px-3 py-2 text-xs text-tertiary">
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span>{mensaje}</span>
    </p>
  )
}

interface ReporteSenafFormProps {
  reporte: ReporteSenaf
  onSubmit: (values: EdicionReporteSenafValues) => void
  loading?: boolean
  readOnly?: boolean
}

export function ReporteSenafForm({ reporte, onSubmit, loading, readOnly }: ReporteSenafFormProps) {
  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<EdicionReporteSenafValues>({
    resolver: zodResolver(edicionReporteSenafSchema),
    defaultValues: {
      secciones: reporte.texto_final,
      observaciones_direccion: reporte.observaciones_direccion ?? '',
    },
  })

  const generales = reporte.advertencias.filter((a) => a.clave === null)
  const porSeccion = (clave: string): AdvertenciaInforme[] =>
    reporte.advertencias.filter((a) => a.clave === clave)

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {!readOnly && generales.length > 0 && (
        <div className="space-y-2">
          {generales.map((a, i) => <Aviso key={i} mensaje={a.mensaje} />)}
        </div>
      )}

      {reporte.texto_final.map((s, i) => (
        <div key={s.clave} className="space-y-2">
          <FormField label={s.titulo} error={errors.secciones?.[i]?.texto?.message}>
            <Textarea rows={4} disabled={readOnly} {...register(`secciones.${i}.texto`)} />
          </FormField>
          <input type="hidden" {...register(`secciones.${i}.clave`)} />
          <input type="hidden" {...register(`secciones.${i}.titulo`)} />
          {!readOnly && porSeccion(s.clave).map((a, j) => <Aviso key={j} mensaje={a.mensaje} />)}
        </div>
      ))}

      <FormField
        label="Observaciones de Dirección (no pasan por la IA)"
        error={errors.observaciones_direccion?.message}
      >
        <Textarea
          rows={4}
          disabled={readOnly}
          placeholder="Contexto, hechos relevantes del mes o aclaraciones para SENAF."
          {...register('observaciones_direccion')}
        />
      </FormField>

      {!readOnly && (
        <div className="flex justify-end">
          <Button type="submit" variant="outline" disabled={loading || !isDirty}>
            {loading ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </div>
      )}
    </form>
  )
}
