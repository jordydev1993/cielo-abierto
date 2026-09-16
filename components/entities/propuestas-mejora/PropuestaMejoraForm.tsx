'use client'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { propuestaMejoraSchema, type PropuestaMejoraFormValues } from '@/lib/validations/propuesta-mejora.schema'
import { FormField, FormGrid } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useUsuarios } from '@/hooks/usuarios/useUsuarios'
import { useEvaluacionesInstitucionales } from '@/hooks/evaluacion-institucional/useEvaluacionesInstitucionales'

const AREAS = [
  { value: 'educativa', label: 'Educativa' },
  { value: 'sanitaria', label: 'Sanitaria' },
  { value: 'social', label: 'Social' },
  { value: 'institucional', label: 'Institucional' },
  { value: 'protocolos', label: 'Protocolos' },
]

interface PropuestaMejoraFormProps {
  evaluacionId?: string // preseleccionada cuando se crea desde el detalle de una evaluación
  onSubmit: (values: PropuestaMejoraFormValues) => void
  onCancel: () => void
  loading?: boolean
}

export function PropuestaMejoraForm({ evaluacionId, onSubmit, onCancel, loading }: PropuestaMejoraFormProps) {
  const { data: usuarios = [] } = useUsuarios()
  const { data: evaluaciones = [] } = useEvaluacionesInstitucionales()
  const { register, handleSubmit, control, formState: { errors } } = useForm<PropuestaMejoraFormValues>({
    resolver: zodResolver(propuestaMejoraSchema),
    defaultValues: {
      evaluacion_id: evaluacionId ?? '',
      descripcion: '', tipo: 'mejora', area: '', responsable_id: '', fecha_vencimiento: '', observaciones: '',
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <FormGrid cols={2}>
        {!evaluacionId && (
          <FormField label="Evaluación institucional" error={errors.evaluacion_id?.message} required className="sm:col-span-2">
            <Controller name="evaluacion_id" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger><SelectValue placeholder="Seleccionar evaluación..." /></SelectTrigger>
                <SelectContent>
                  {evaluaciones.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.periodo_mes}/{e.periodo_anio}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )} />
          </FormField>
        )}
        <FormField label="Descripción" error={errors.descripcion?.message} required className="sm:col-span-2">
          <Textarea {...register('descripcion')} rows={3} />
        </FormField>
        <FormField label="Tipo" error={errors.tipo?.message} required>
          <Controller name="tipo" control={control} render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mejora">Mejora</SelectItem>
                <SelectItem value="capacitacion">Capacitación</SelectItem>
              </SelectContent>
            </Select>
          )} />
        </FormField>
        <FormField label="Área" error={errors.area?.message}>
          <Controller name="area" control={control} render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger><SelectValue placeholder="Sin especificar" /></SelectTrigger>
              <SelectContent>
                {AREAS.map((a) => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
              </SelectContent>
            </Select>
          )} />
        </FormField>
        <FormField label="Responsable" error={errors.responsable_id?.message}>
          <Controller name="responsable_id" control={control} render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger><SelectValue placeholder="Sin asignar" /></SelectTrigger>
              <SelectContent>
                {usuarios.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.apellido}, {u.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )} />
        </FormField>
        <FormField label="Fecha de vencimiento" error={errors.fecha_vencimiento?.message}>
          <Input {...register('fecha_vencimiento')} type="date" />
        </FormField>
        <FormField label="Observaciones" error={errors.observaciones?.message} className="sm:col-span-2">
          <Textarea {...register('observaciones')} rows={2} />
        </FormField>
      </FormGrid>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>Cancelar</Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Creando...' : 'Crear propuesta'}
        </Button>
      </div>
    </form>
  )
}
