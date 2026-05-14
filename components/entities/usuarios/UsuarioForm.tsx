'use client'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { usuarioCreateSchema, usuarioUpdateSchema, type UsuarioCreateValues, type UsuarioUpdateValues } from '@/lib/validations/usuarios.schema'
import { FormField, FormGrid } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useRoles } from '@/hooks/roles/useRoles'
import type { Usuario } from '@/types/database.types'

interface UsuarioCreateFormProps {
  onSubmit: (values: UsuarioCreateValues) => void
  loading?: boolean
}

interface UsuarioEditFormProps {
  initialData: Usuario
  onSubmit: (values: UsuarioUpdateValues) => void
  loading?: boolean
}

type Props = UsuarioCreateFormProps | UsuarioEditFormProps

export function UsuarioForm(props: Props) {
  const isEditing = 'initialData' in props
  const { data: roles = [] } = useRoles()

  if (isEditing) {
    return <UsuarioEditForm {...props as UsuarioEditFormProps} roles={roles} />
  }
  return <UsuarioCreateForm {...props as UsuarioCreateFormProps} roles={roles} />
}

function UsuarioCreateForm({ onSubmit, loading, roles }: UsuarioCreateFormProps & { roles: any[] }) {
  const { register, handleSubmit, control, formState: { errors } } = useForm<UsuarioCreateValues>({
    resolver: zodResolver(usuarioCreateSchema),
    defaultValues: { nombre: '', apellido: '', email: '', password: '', rol_id: '', telefono: '' },
  })
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <FormGrid cols={2}>
        <FormField label="Nombre" error={errors.nombre?.message} required>
          <Input {...register('nombre')} placeholder="Juan" />
        </FormField>
        <FormField label="Apellido" error={errors.apellido?.message} required>
          <Input {...register('apellido')} placeholder="Pérez" />
        </FormField>
        <FormField label="Email" error={errors.email?.message} required>
          <Input {...register('email')} type="email" placeholder="juan@ejemplo.com" />
        </FormField>
        <FormField label="Contraseña inicial" error={errors.password?.message} required>
          <Input {...register('password')} type="password" placeholder="Mínimo 8 caracteres" />
        </FormField>
        <FormField label="Rol" error={errors.rol_id?.message} required>
          <Controller name="rol_id" control={control} render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger><SelectValue placeholder="Seleccionar rol..." /></SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )} />
        </FormField>
        <FormField label="Teléfono" error={errors.telefono?.message}>
          <Input {...register('telefono')} placeholder="Opcional" />
        </FormField>
      </FormGrid>
      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? 'Creando...' : 'Crear usuario'}
        </Button>
      </div>
    </form>
  )
}

function UsuarioEditForm({ initialData, onSubmit, loading, roles }: UsuarioEditFormProps & { roles: any[] }) {
  const { register, handleSubmit, control, formState: { errors } } = useForm<UsuarioUpdateValues>({
    resolver: zodResolver(usuarioUpdateSchema),
    defaultValues: {
      nombre: initialData.nombre,
      apellido: initialData.apellido,
      rol_id: initialData.rol_id,
      telefono: initialData.telefono ?? '',
    },
  })
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <FormGrid cols={2}>
        <FormField label="Nombre" error={errors.nombre?.message} required>
          <Input {...register('nombre')} />
        </FormField>
        <FormField label="Apellido" error={errors.apellido?.message} required>
          <Input {...register('apellido')} />
        </FormField>
        <FormField label="Rol" error={errors.rol_id?.message} required>
          <Controller name="rol_id" control={control} render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger><SelectValue placeholder="Seleccionar rol..." /></SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )} />
        </FormField>
        <FormField label="Teléfono" error={errors.telefono?.message}>
          <Input {...register('telefono')} />
        </FormField>
      </FormGrid>
      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </div>
    </form>
  )
}
