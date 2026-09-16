'use client'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { referenteSchema, type ReferenteFormValues } from '@/lib/validations/referentes.schema'
import { FormField, FormGrid } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/context/AuthContext'
import type { Referente } from '@/types/database.types'

const TIPOS = [
  { value: 'familiar', label: 'Familiar' },
  { value: 'educador', label: 'Educador' },
  { value: 'vecino', label: 'Vecino' },
  { value: 'otro', label: 'Otro' },
]

interface ReferenteFormProps {
  initialData?: Referente
  onSubmit: (values: ReferenteFormValues) => void
  onCancel?: () => void
  loading?: boolean
}

export function ReferenteForm({ initialData, onSubmit, onCancel, loading }: ReferenteFormProps) {
  const isEditing = !!initialData
  const { role } = useAuth()
  const puedeEditarDni = role === 'Admin'
  const { register, handleSubmit, control, formState: { errors } } = useForm<ReferenteFormValues>({
    resolver: zodResolver(referenteSchema),
    defaultValues: initialData ? {
      nombre: initialData.nombre,
      apellido: initialData.apellido,
      dni: initialData.dni,
      fecha_nacimiento: initialData.fecha_nacimiento ?? '',
      tipo: initialData.tipo,
      vinculo_descripcion: initialData.vinculo_descripcion ?? '',
      telefono: initialData.telefono ?? '',
      email: initialData.email ?? '',
      domicilio: initialData.domicilio ?? '',
      activo: initialData.activo,
    } : {
      nombre: '', apellido: '', dni: '', fecha_nacimiento: '', tipo: 'familiar',
      vinculo_descripcion: '', telefono: '', email: '', domicilio: '', activo: true,
    },
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
        <FormField
          label="DNI"
          error={errors.dni?.message}
          required
          className={!puedeEditarDni && isEditing ? 'sm:col-span-1' : undefined}
        >
          <Input {...register('dni')} placeholder="Ej: 30123456" disabled={isEditing && !puedeEditarDni} />
          {isEditing && !puedeEditarDni && (
            <p className="text-xs text-slate-400">Solo Admin puede modificar el DNI.</p>
          )}
        </FormField>
        <FormField label="Fecha de nacimiento" error={errors.fecha_nacimiento?.message}>
          <Input {...register('fecha_nacimiento')} type="date" />
        </FormField>
        <FormField label="Tipo" error={errors.tipo?.message} required>
          <Controller name="tipo" control={control} render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
              <SelectContent>
                {TIPOS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          )} />
        </FormField>
        <FormField label="Teléfono" error={errors.telefono?.message}>
          <Input {...register('telefono')} />
        </FormField>
        <FormField label="Email" error={errors.email?.message}>
          <Input {...register('email')} type="email" />
        </FormField>
        <FormField label="Domicilio" error={errors.domicilio?.message} className="sm:col-span-2">
          <Input {...register('domicilio')} />
        </FormField>
        <FormField label="Descripción del vínculo" error={errors.vinculo_descripcion?.message} className="sm:col-span-2">
          <Textarea {...register('vinculo_descripcion')} rows={3} placeholder="Ej: tía materna, vive a 3 cuadras de la residencia..." />
        </FormField>
        {isEditing && (
          <FormField label="Estado" error={errors.activo?.message} className="sm:col-span-2">
            <Controller name="activo" control={control} render={({ field }) => (
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="h-4 w-4"
                />
                Referente activo
              </label>
            )} />
          </FormField>
        )}
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
            : (loading ? 'Creando...' : 'Registrar referente')}
        </Button>
      </div>
    </form>
  )
}
