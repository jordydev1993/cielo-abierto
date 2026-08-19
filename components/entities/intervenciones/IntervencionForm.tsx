'use client'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { intervencionSchema, type IntervencionFormValues } from '@/lib/validations/intervenciones.schema'
import { FormField, FormGrid } from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useUsuarios } from '@/hooks/usuarios/useUsuarios'
import type { Intervencion } from '@/types/database.types'

const TIPOS_SUGERIDOS = ['Social', 'Psicológica', 'Médica', 'Legal', 'Educativa', 'Familiar']

interface IntervencionFormProps {
  nnyaId: string
  initialData?: Intervencion
  onSubmit: (values: IntervencionFormValues) => void
  onCancel: () => void
  loading?: boolean
}

export function IntervencionForm({ nnyaId, initialData, onSubmit, onCancel, loading }: IntervencionFormProps) {
  const isEditing = !!initialData
  const { data: usuarios = [] } = useUsuarios()

  const { register, handleSubmit, control, formState: { errors } } = useForm<IntervencionFormValues>({
    resolver: zodResolver(intervencionSchema),
    defaultValues: initialData ? {
      nnya_id: initialData.nnya_id,
      tipo: initialData.tipo,
      descripcion: initialData.descripcion,
      fecha: initialData.fecha,
      profesional_id: initialData.profesional_id ?? '',
      estado: initialData.estado,
      resultado: initialData.resultado ?? '',
      observaciones: initialData.observaciones ?? '',
    } : {
      nnya_id: nnyaId,
      tipo: '',
      descripcion: '',
      fecha: new Date().toISOString().split('T')[0],
      profesional_id: '',
      estado: 'pendiente',
      resultado: '',
      observaciones: '',
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormGrid cols={2}>
        <FormField label="Tipo de intervención" error={errors.tipo?.message} required>
          <Input {...register('tipo')} list="tipos-intervencion-sugeridos" placeholder="Ej: Social" />
          <datalist id="tipos-intervencion-sugeridos">
            {TIPOS_SUGERIDOS.map((t) => <option key={t} value={t} />)}
          </datalist>
        </FormField>

        <FormField label="Fecha" error={errors.fecha?.message} required>
          <Input {...register('fecha')} type="date" />
        </FormField>

        <FormField label="Profesional responsable" error={errors.profesional_id?.message} required className="sm:col-span-2">
          <Controller name="profesional_id" control={control} render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
              <SelectContent>
                {usuarios.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.apellido}, {u.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )} />
        </FormField>

        <FormField label="Descripción" error={errors.descripcion?.message} required className="sm:col-span-2">
          <Textarea {...register('descripcion')} rows={3} placeholder="Describí la intervención..." />
        </FormField>

        <FormField label="Estado" error={errors.estado?.message} required>
          <Controller name="estado" control={control} render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="en_curso">En curso</SelectItem>
                <SelectItem value="cerrada">Cerrada</SelectItem>
              </SelectContent>
            </Select>
          )} />
        </FormField>

        <FormField label="Resultado" error={errors.resultado?.message} className="sm:col-span-2">
          <Textarea {...register('resultado')} rows={2} placeholder="Resultado de la intervención (opcional)..." />
        </FormField>

        <FormField label="Observaciones" error={errors.observaciones?.message} className="sm:col-span-2">
          <Textarea {...register('observaciones')} rows={2} />
        </FormField>
      </FormGrid>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {isEditing
            ? (loading ? 'Guardando...' : 'Guardar cambios')
            : (loading ? 'Registrando...' : 'Registrar intervención')}
        </Button>
      </div>
    </form>
  )
}
