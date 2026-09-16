'use client'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  evaluacionInstitucionalSchema,
  type EvaluacionInstitucionalFormValues,
} from '@/lib/validations/evaluacion-institucional.schema'
import { FormField, FormGrid } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { EvaluacionInstitucional } from '@/types/database.types'

interface EvaluacionInstitucionalFormProps {
  initialData?: EvaluacionInstitucional
  onSubmit: (values: EvaluacionInstitucionalFormValues) => void
  onCancel?: () => void
  loading?: boolean
}

export function EvaluacionInstitucionalForm({
  initialData,
  onSubmit,
  onCancel,
  loading,
}: EvaluacionInstitucionalFormProps) {
  const isEditing = !!initialData
  const now = new Date()
  const { register, handleSubmit, control, formState: { errors } } = useForm<EvaluacionInstitucionalFormValues>({
    resolver: zodResolver(evaluacionInstitucionalSchema),
    defaultValues: initialData ? {
      periodo_mes: String(initialData.periodo_mes),
      periodo_anio: String(initialData.periodo_anio),
      fecha_reunion: initialData.fecha_reunion.slice(0, 16),
      observaciones: initialData.observaciones ?? '',
      estado: initialData.estado,
    } : {
      periodo_mes: String(now.getMonth() + 1),
      periodo_anio: String(now.getFullYear()),
      fecha_reunion: '',
      observaciones: '',
      estado: 'convocada',
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <FormGrid cols={2}>
        <FormField label="Mes" error={errors.periodo_mes?.message} required>
          <Input {...register('periodo_mes')} type="number" min={1} max={12} />
        </FormField>
        <FormField label="Año" error={errors.periodo_anio?.message} required>
          <Input {...register('periodo_anio')} type="number" min={2020} max={2100} />
        </FormField>
        <FormField label="Fecha de reunión" error={errors.fecha_reunion?.message} required className="sm:col-span-2">
          <Input {...register('fecha_reunion')} type="datetime-local" />
        </FormField>
        <FormField label="Estado" error={errors.estado?.message} required className="sm:col-span-2">
          <Controller name="estado" control={control} render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="convocada">Convocada</SelectItem>
                <SelectItem value="realizada">Realizada</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          )} />
        </FormField>
        <FormField label="Observaciones" error={errors.observaciones?.message} className="sm:col-span-2">
          <Textarea {...register('observaciones')} rows={3} />
        </FormField>
      </FormGrid>
      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {isEditing
            ? (loading ? 'Guardando...' : 'Guardar cambios')
            : (loading ? 'Creando...' : 'Convocar evaluación')}
        </Button>
      </div>
    </form>
  )
}
