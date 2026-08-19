'use client'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { informeSchema, type InformeFormValues } from '@/lib/validations/informes.schema'
import { FormField, FormGrid } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const TIPOS_INFORME = [
  'Psicosocial',
  'Médico',
  'Educativo',
  'Judicial',
  'Egreso',
  'Seguimiento',
  'Otro',
]

interface InformeFormProps {
  legajoId: string
  nnyaId: string
  onSubmit: (values: InformeFormValues) => void
  onCancel: () => void
  loading?: boolean
}

export function InformeForm({ legajoId, nnyaId, onSubmit, onCancel, loading }: InformeFormProps) {
  const today = new Date().toISOString().split('T')[0]

  const { register, handleSubmit, control, formState: { errors } } = useForm<InformeFormValues>({
    resolver: zodResolver(informeSchema),
    defaultValues: {
      legajo_id: legajoId,
      nnya_id: nnyaId,
      tipo: '',
      titulo: '',
      contenido: '',
      fecha_informe: today,
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormGrid cols={2}>
        <FormField label="Tipo de informe" error={errors.tipo?.message} required>
          <Controller name="tipo" control={control} render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
              <SelectContent>
                {TIPOS_INFORME.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )} />
        </FormField>

        <FormField label="Fecha del informe" error={errors.fecha_informe?.message} required>
          <Input {...register('fecha_informe')} type="date" />
        </FormField>

        <FormField label="Título" error={errors.titulo?.message} required className="sm:col-span-2">
          <Input {...register('titulo')} placeholder="Título del informe..." />
        </FormField>

        <FormField label="Contenido" error={errors.contenido?.message} required className="sm:col-span-2">
          <Textarea
            {...register('contenido')}
            rows={8}
            placeholder="Redactá el contenido del informe..."
          />
        </FormField>
      </FormGrid>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar borrador'}
        </Button>
      </div>
    </form>
  )
}
