'use client'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { legajoSchema, type LegajoFormValues } from '@/lib/validations/legajos.schema'
import { FormField, FormGrid } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useNnyas } from '@/hooks/nnya/useNnyas'

interface LegajoFormProps {
  nnyaId?: string  // preselected when creating from NNyA profile
  onSubmit: (values: LegajoFormValues) => void
  loading?: boolean
}

export function LegajoForm({ nnyaId, onSubmit, loading }: LegajoFormProps) {
  const { data: nnyas = [] } = useNnyas(true) // solo activos
  const { register, handleSubmit, control, formState: { errors } } = useForm<LegajoFormValues>({
    resolver: zodResolver(legajoSchema),
    defaultValues: {
      nnya_id: nnyaId ?? '',
      numero_legajo: '',
      fecha_apertura: new Date().toISOString().split('T')[0],
      observaciones: '',
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <FormGrid cols={2}>
        {!nnyaId && (
          <FormField label="NNyA" error={errors.nnya_id?.message} required className="sm:col-span-2">
            <Controller name="nnya_id" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger><SelectValue placeholder="Seleccionar NNyA..." /></SelectTrigger>
                <SelectContent>
                  {nnyas.map((n) => (
                    <SelectItem key={n.id} value={n.id}>
                      {n.apellido}, {n.nombre} — DNI {n.dni}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )} />
          </FormField>
        )}
        <FormField label="N° de legajo" error={errors.numero_legajo?.message} required>
          <Input {...register('numero_legajo')} placeholder="Ej: LEG-2026-001" />
        </FormField>
        <FormField label="Fecha de apertura" error={errors.fecha_apertura?.message} required>
          <Input {...register('fecha_apertura')} type="date" />
        </FormField>
        <FormField label="Observaciones iniciales" error={errors.observaciones?.message} className="sm:col-span-2">
          <Textarea {...register('observaciones')} rows={3} />
        </FormField>
      </FormGrid>
      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? 'Creando...' : 'Abrir legajo'}
        </Button>
      </div>
    </form>
  )
}
