'use client'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { turnoPersonalSchema, type TurnoPersonalFormValues } from '@/lib/validations/turno-personal.schema'
import { FormField, FormGrid } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useUsuarios } from '@/hooks/usuarios/useUsuarios'
import type { TurnoPersonal } from '@/types/database.types'

interface TurnoPersonalFormProps {
  initialData?: TurnoPersonal
  onSubmit: (values: TurnoPersonalFormValues) => void
  onCancel: () => void
  loading?: boolean
}

export function TurnoPersonalForm({ initialData, onSubmit, onCancel, loading }: TurnoPersonalFormProps) {
  const isEditing = !!initialData
  // "Entregado"/"Cerrado" solo se alcanzan desde el flujo de entrega/recepción — acá
  // el estado queda fijo (deshabilitado) para no ofrecer una edición manual sin sentido.
  const estadoFijo = isEditing && (initialData.estado === 'entregado' || initialData.estado === 'cerrado')
  const { data: usuarios = [] } = useUsuarios()
  const { register, handleSubmit, control, formState: { errors } } = useForm<TurnoPersonalFormValues>({
    resolver: zodResolver(turnoPersonalSchema),
    defaultValues: initialData ? {
      usuario_id: initialData.usuario_id,
      fecha: initialData.fecha,
      turno: initialData.turno,
      estado: initialData.estado,
    } : {
      usuario_id: '', fecha: '', turno: 'mañana', estado: 'planificado',
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <FormGrid cols={2}>
        <FormField label="Usuario" error={errors.usuario_id?.message} required className="sm:col-span-2">
          <Controller name="usuario_id" control={control} render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger><SelectValue placeholder="Seleccionar usuario..." /></SelectTrigger>
              <SelectContent>
                {usuarios.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.apellido}, {u.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )} />
        </FormField>
        <FormField label="Fecha" error={errors.fecha?.message} required>
          <Input {...register('fecha')} type="date" />
        </FormField>
        <FormField label="Franja" error={errors.turno?.message} required>
          <Controller name="turno" control={control} render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mañana">Mañana</SelectItem>
                <SelectItem value="tarde">Tarde</SelectItem>
                <SelectItem value="noche">Noche</SelectItem>
              </SelectContent>
            </Select>
          )} />
        </FormField>
        {isEditing && (
          <FormField label="Estado" error={errors.estado?.message} required className="sm:col-span-2">
            <Controller name="estado" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value} disabled={estadoFijo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="planificado">Planificado</SelectItem>
                  <SelectItem value="en_curso">En curso</SelectItem>
                  <SelectItem value="no_cubierto">No cubierto</SelectItem>
                  {estadoFijo && (
                    <SelectItem value={initialData.estado}>
                      {initialData.estado === 'entregado' ? 'Entregado' : 'Cerrado'}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            )} />
            <p className="text-xs text-slate-400">
              &quot;Entregado&quot;/&quot;Cerrado&quot; solo se alcanzan desde el flujo de entrega/recepción.
            </p>
          </FormField>
        )}
      </FormGrid>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>Cancelar</Button>
        <Button type="submit" disabled={loading}>
          {isEditing
            ? (loading ? 'Guardando...' : 'Guardar cambios')
            : (loading ? 'Asignando...' : 'Asignar turno')}
        </Button>
      </div>
    </form>
  )
}
