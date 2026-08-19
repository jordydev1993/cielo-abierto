'use client'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { turnoSchema, type TurnoFormValues } from '@/lib/validations/turnos.schema'
import { FormField, FormGrid } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const TIPOS_TURNO = [
  'Médico',
  'Psicológico',
  'Odontológico',
  'Judicial',
  'Educativo',
  'Trabajo Social',
  'Otro',
]

interface TurnoFormProps {
  legajoId: string
  nnyaId: string
  onSubmit: (values: TurnoFormValues) => void
  onCancel: () => void
  loading?: boolean
}

export function TurnoForm({ legajoId, nnyaId, onSubmit, onCancel, loading }: TurnoFormProps) {
  const now = new Date()
  const minDatetime = new Date(now.getTime() + 60_000)
    .toISOString()
    .slice(0, 16)

  const { register, handleSubmit, control, formState: { errors } } = useForm<TurnoFormValues>({
    resolver: zodResolver(turnoSchema),
    defaultValues: {
      legajo_id: legajoId,
      nnya_id: nnyaId,
      tipo: '',
      fecha_hora: '',
      lugar: '',
      profesional: '',
      motivo: '',
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormGrid cols={2}>
        <FormField label="Tipo de turno" error={errors.tipo?.message} required>
          <Controller name="tipo" control={control} render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
              <SelectContent>
                {TIPOS_TURNO.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )} />
        </FormField>

        <FormField label="Fecha y hora" error={errors.fecha_hora?.message} required>
          <Input
            {...register('fecha_hora')}
            type="datetime-local"
            min={minDatetime}
          />
          {errors.fecha_hora && (
            <p className="text-xs text-amber-600 mt-1">
              Los turnos deben agendarse con fecha futura.
            </p>
          )}
        </FormField>

        <FormField label="Profesional / Institución" error={errors.profesional?.message} required className="sm:col-span-2">
          <Input {...register('profesional')} placeholder="Nombre del profesional o institución..." />
        </FormField>

        <FormField label="Lugar" error={errors.lugar?.message} className="sm:col-span-2">
          <Input {...register('lugar')} placeholder="Consultorio, hospital, juzgado..." />
        </FormField>

        <FormField label="Motivo" error={errors.motivo?.message} className="sm:col-span-2">
          <Textarea {...register('motivo')} rows={2} placeholder="Motivo del turno (opcional)..." />
        </FormField>
      </FormGrid>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Agendando...' : 'Agendar turno'}
        </Button>
      </div>
    </form>
  )
}
