'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { rolSchema, type RolFormValues } from '@/lib/validations/roles.schema'
import { FormField, FormGrid } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import type { Rol } from '@/types/database.types'

interface RolFormProps {
  initialData?: Rol
  onSubmit: (values: RolFormValues) => void
  loading?: boolean
}

export function RolForm({ initialData, onSubmit, loading }: RolFormProps) {
  const isEditing = !!initialData
  const { register, handleSubmit, formState: { errors } } = useForm<RolFormValues>({
    resolver: zodResolver(rolSchema),
    defaultValues: initialData
      ? { nombre: initialData.nombre, descripcion: initialData.descripcion ?? '' }
      : { nombre: '', descripcion: '' },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <FormGrid cols={1}>
        <FormField label="Nombre" error={errors.nombre?.message} required>
          <Input {...register('nombre')} placeholder="Ej: Coordinador" />
        </FormField>
        <FormField label="Descripción" error={errors.descripcion?.message}>
          <Textarea {...register('descripcion')} placeholder="Descripción del rol..." rows={3} />
        </FormField>
      </FormGrid>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear rol'}
        </Button>
      </div>
    </form>
  )
}
