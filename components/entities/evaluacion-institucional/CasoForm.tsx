'use client'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { evaluacionCasoSchema, type EvaluacionCasoFormValues } from '@/lib/validations/evaluacion-institucional-caso.schema'
import { FormField, FormGrid } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useNnyas } from '@/hooks/nnya/useNnyas'
import type { EvaluacionInstitucionalCaso } from '@/types/database.types'

interface CasoFormProps {
  initialData?: EvaluacionInstitucionalCaso
  onSubmit: (values: EvaluacionCasoFormValues) => void
  onCancel: () => void
  loading?: boolean
}

export function CasoForm({ initialData, onSubmit, onCancel, loading }: CasoFormProps) {
  const isEditing = !!initialData
  const { data: nnyas = [] } = useNnyas(true)
  const { register, handleSubmit, control, formState: { errors } } = useForm<EvaluacionCasoFormValues>({
    resolver: zodResolver(evaluacionCasoSchema),
    defaultValues: initialData ? {
      nnya_id: initialData.nnya_id,
      resumen_situacion: initialData.resumen_situacion,
      indicador_avance: initialData.indicador_avance != null ? String(initialData.indicador_avance) : '',
      recomendaciones: initialData.recomendaciones ?? '',
      seguimiento_requerido: initialData.seguimiento_requerido,
    } : {
      nnya_id: '', resumen_situacion: '', indicador_avance: '', recomendaciones: '', seguimiento_requerido: false,
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <FormGrid cols={2}>
        <FormField label="NNyA" error={errors.nnya_id?.message} required className="sm:col-span-2">
          <Controller name="nnya_id" control={control} render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value} disabled={isEditing}>
              <SelectTrigger><SelectValue placeholder="Seleccionar NNyA..." /></SelectTrigger>
              <SelectContent>
                {nnyas.map((n) => (
                  <SelectItem key={n.id} value={n.id}>{n.apellido}, {n.nombre} — DNI {n.dni}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )} />
          {isEditing && <p className="text-xs text-slate-400">El NNyA del caso no se puede cambiar.</p>}
        </FormField>
        <FormField label="Resumen de la situación" error={errors.resumen_situacion?.message} required className="sm:col-span-2">
          <Textarea {...register('resumen_situacion')} rows={4} />
        </FormField>
        <FormField label="Indicador de avance (1-5)" error={errors.indicador_avance?.message}>
          <Input {...register('indicador_avance')} type="number" min={1} max={5} />
        </FormField>
        <FormField label="Recomendaciones" error={errors.recomendaciones?.message} className="sm:col-span-2">
          <Textarea {...register('recomendaciones')} rows={3} />
        </FormField>
        <FormField label="Seguimiento requerido" error={errors.seguimiento_requerido?.message} className="sm:col-span-2">
          <Controller name="seguimiento_requerido" control={control} render={({ field }) => (
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
                className="h-4 w-4"
              />
              Requiere seguimiento
            </label>
          )} />
        </FormField>
      </FormGrid>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>Cancelar</Button>
        <Button type="submit" disabled={loading}>
          {isEditing
            ? (loading ? 'Guardando...' : 'Guardar cambios')
            : (loading ? 'Creando...' : 'Registrar caso')}
        </Button>
      </div>
    </form>
  )
}
