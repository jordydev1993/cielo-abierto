'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { tutorSchema, type TutorFormValues } from '@/lib/validations/tutores.schema'
import { FormField, FormGrid } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import type { Tutor } from '@/types/database.types'

interface TutorFormProps {
  initialData?: Tutor
  onSubmit: (values: TutorFormValues) => void
  loading?: boolean
}

export function TutorForm({ initialData, onSubmit, loading }: TutorFormProps) {
  const isEditing = !!initialData
  const { register, handleSubmit, formState: { errors } } = useForm<TutorFormValues>({
    resolver: zodResolver(tutorSchema),
    defaultValues: initialData ? {
      nombre: initialData.nombre,
      apellido: initialData.apellido,
      dni: initialData.dni,
      parentesco: initialData.parentesco,
      telefono: initialData.telefono ?? '',
      email: initialData.email ?? '',
      domicilio: initialData.domicilio ?? '',
      ocupacion: initialData.ocupacion ?? '',
    } : { nombre: '', apellido: '', dni: '', parentesco: '', telefono: '', email: '', domicilio: '', ocupacion: '' },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <FormGrid cols={2}>
        <FormField label="Nombre" error={errors.nombre?.message} required>
          <Input {...register('nombre')} placeholder="María" />
        </FormField>
        <FormField label="Apellido" error={errors.apellido?.message} required>
          <Input {...register('apellido')} placeholder="García" />
        </FormField>
        <FormField label="DNI" error={errors.dni?.message} required>
          <Input {...register('dni')} placeholder="12345678" />
        </FormField>
        <FormField label="Parentesco" error={errors.parentesco?.message} required>
          <Input {...register('parentesco')} placeholder="Ej: Madre, Padre, Tía..." />
        </FormField>
        <FormField label="Teléfono" error={errors.telefono?.message}>
          <Input {...register('telefono')} placeholder="Opcional" />
        </FormField>
        <FormField label="Email" error={errors.email?.message}>
          <Input {...register('email')} type="email" placeholder="Opcional" />
        </FormField>
        <FormField label="Ocupación" error={errors.ocupacion?.message}>
          <Input {...register('ocupacion')} />
        </FormField>
        <FormField label="Domicilio" error={errors.domicilio?.message} className="sm:col-span-2">
          <Textarea {...register('domicilio')} rows={2} />
        </FormField>
      </FormGrid>
      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Registrar tutor'}
        </Button>
      </div>
    </form>
  )
}
