'use client'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { audienciaSchema, type AudienciaFormValues } from '@/lib/validations/audiencias.schema'
import { FormField, FormGrid } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const TIPOS_AUDIENCIA = [
  'Revisión de medida',
  'Control de legalidad',
  'Situación procesal',
  'Restitución familiar',
  'Egreso',
  'Otro',
]

interface AudienciaFormProps {
  legajoId: string
  nnyaId: string
  onSubmit: (values: AudienciaFormValues) => void
  onCancel: () => void
  loading?: boolean
}

export function AudienciaForm({ legajoId, nnyaId, onSubmit, onCancel, loading }: AudienciaFormProps) {
  const minDatetime = new Date(Date.now() + 60_000).toISOString().slice(0, 16)

  const { register, handleSubmit, control, formState: { errors } } = useForm<AudienciaFormValues>({
    resolver: zodResolver(audienciaSchema),
    defaultValues: {
      legajo_id: legajoId,
      nnya_id: nnyaId,
      tipo: '',
      fecha_hora: '',
      tribunal: '',
      juzgado: '',
      caratula: '',
      numero_expediente: '',
      observaciones: '',
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormGrid cols={2}>
        <FormField label="Tipo de audiencia" error={errors.tipo?.message} required>
          <Controller name="tipo" control={control} render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
              <SelectContent>
                {TIPOS_AUDIENCIA.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )} />
        </FormField>

        <FormField label="Fecha y hora" error={errors.fecha_hora?.message} required>
          <Input {...register('fecha_hora')} type="datetime-local" min={minDatetime} />
          {errors.fecha_hora && (
            <p className="text-xs text-amber-600 mt-1">Las audiencias deben programarse con fecha futura.</p>
          )}
        </FormField>

        <FormField label="Tribunal" error={errors.tribunal?.message} required className="sm:col-span-2">
          <Input {...register('tribunal')} placeholder="Nombre del tribunal..." />
        </FormField>

        <FormField label="Juzgado" error={errors.juzgado?.message}>
          <Input {...register('juzgado')} placeholder="Juzgado interviniente..." />
        </FormField>

        <FormField label="N° Expediente" error={errors.numero_expediente?.message}>
          <Input {...register('numero_expediente')} placeholder="Número de expediente..." />
        </FormField>

        <FormField label="Carátula" error={errors.caratula?.message} className="sm:col-span-2">
          <Input {...register('caratula')} placeholder="Carátula del expediente..." />
        </FormField>

        <FormField label="Observaciones" error={errors.observaciones?.message} className="sm:col-span-2">
          <Textarea {...register('observaciones')} rows={2} placeholder="Observaciones previas (opcional)..." />
        </FormField>
      </FormGrid>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : 'Registrar audiencia'}
        </Button>
      </div>
    </form>
  )
}
