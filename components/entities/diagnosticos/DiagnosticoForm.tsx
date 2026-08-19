'use client'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { diagnosticoSchema, type DiagnosticoFormValues } from '@/lib/validations/diagnosticos.schema'
import { FormField, FormGrid } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const TIPOS_DIAGNOSTICO = [
  'Médico',
  'Psicológico',
  'Psiquiátrico',
  'Nutricional',
  'Odontológico',
  'Neurológico',
  'Otro',
]

interface DiagnosticoFormProps {
  legajoId: string
  nnyaId: string
  onSubmit: (values: DiagnosticoFormValues) => void
  onCancel: () => void
  loading?: boolean
}

export function DiagnosticoForm({ legajoId, nnyaId, onSubmit, onCancel, loading }: DiagnosticoFormProps) {
  const today = new Date().toISOString().split('T')[0]

  const { register, handleSubmit, control, formState: { errors } } = useForm<DiagnosticoFormValues>({
    resolver: zodResolver(diagnosticoSchema),
    defaultValues: {
      legajo_id: legajoId,
      nnya_id: nnyaId,
      tipo: '',
      descripcion: '',
      fecha_diagnostico: today,
      profesional: '',
      institucion: '',
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormGrid cols={2}>
        <FormField label="Tipo de diagnóstico" error={errors.tipo?.message} required>
          <Controller name="tipo" control={control} render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
              <SelectContent>
                {TIPOS_DIAGNOSTICO.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )} />
        </FormField>

        <FormField label="Fecha del diagnóstico" error={errors.fecha_diagnostico?.message} required>
          <Input {...register('fecha_diagnostico')} type="date" max={today} />
          {errors.fecha_diagnostico && (
            <p className="text-xs text-amber-600 mt-1">La fecha no puede ser futura.</p>
          )}
        </FormField>

        <FormField label="Descripción / Condición detectada" error={errors.descripcion?.message} required className="sm:col-span-2">
          <Textarea {...register('descripcion')} rows={3} placeholder="Describí la condición de salud o evaluación detectada..." />
        </FormField>

        <FormField label="Profesional responsable" error={errors.profesional?.message}>
          <Input {...register('profesional')} placeholder="Nombre del profesional..." />
        </FormField>

        <FormField label="Institución" error={errors.institucion?.message}>
          <Input {...register('institucion')} placeholder="Hospital, centro de salud..." />
        </FormField>
      </FormGrid>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : 'Registrar diagnóstico'}
        </Button>
      </div>
    </form>
  )
}
