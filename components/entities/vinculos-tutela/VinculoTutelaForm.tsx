'use client'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { vinculoTutelaSchema, type VinculoTutelaFormValues } from '@/lib/validations/vinculos-tutela.schema'
import { FormField, FormGrid } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useUsuarios } from '@/hooks/usuarios/useUsuarios'
import { useReferentes } from '@/hooks/referentes/useReferentes'
import type { VinculoTutela } from '@/types/database.types'

interface VinculoTutelaFormProps {
  initialData?: VinculoTutela
  onSubmit: (values: VinculoTutelaFormValues) => void
  onCancel: () => void
  loading?: boolean
}

export function VinculoTutelaForm({ initialData, onSubmit, onCancel, loading }: VinculoTutelaFormProps) {
  const isEditing = !!initialData
  const { data: usuarios = [] } = useUsuarios()
  const { data: referentes = [] } = useReferentes(true)
  const { register, handleSubmit, control, formState: { errors } } = useForm<VinculoTutelaFormValues>({
    resolver: zodResolver(vinculoTutelaSchema),
    defaultValues: initialData ? {
      tipo: initialData.tipo,
      usuario_id: initialData.usuario_id ?? '',
      referente_id: initialData.referente_id ?? '',
      vigente_desde: initialData.vigente_desde,
      vigente_hasta: initialData.vigente_hasta ?? '',
      estado: initialData.estado,
      resolucion_respaldo: initialData.resolucion_respaldo ?? '',
      motivo_finalizacion: initialData.motivo_finalizacion ?? '',
      observaciones: initialData.observaciones ?? '',
    } : {
      tipo: 'referente_afectivo',
      usuario_id: '', referente_id: '',
      vigente_desde: new Date().toISOString().split('T')[0],
      vigente_hasta: '',
      estado: 'propuesto',
      resolucion_respaldo: '', motivo_finalizacion: '', observaciones: '',
    },
  })

  const tipo = useWatch({ control, name: 'tipo' })
  const requiereUsuario = tipo === 'tutela_residencia'

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <FormGrid cols={2}>
        <FormField label="Tipo de vínculo" error={errors.tipo?.message} required className="sm:col-span-2">
          <Controller name="tipo" control={control} render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="tutela_residencia">Tutela de residencia</SelectItem>
                <SelectItem value="revinculacion_familiar">Revinculación familiar</SelectItem>
                <SelectItem value="referente_afectivo">Referente afectivo</SelectItem>
              </SelectContent>
            </Select>
          )} />
        </FormField>

        {requiereUsuario ? (
          <FormField label="Usuario responsable" error={errors.usuario_id?.message} required className="sm:col-span-2">
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
        ) : (
          <FormField label="Referente" error={errors.referente_id?.message} required className="sm:col-span-2">
            <Controller name="referente_id" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger><SelectValue placeholder="Seleccionar referente..." /></SelectTrigger>
                <SelectContent>
                  {referentes.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.apellido}, {r.nombre} — DNI {r.dni}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )} />
          </FormField>
        )}

        <FormField label="Vigente desde" error={errors.vigente_desde?.message} required>
          <Input {...register('vigente_desde')} type="date" />
        </FormField>
        <FormField label="Vigente hasta" error={errors.vigente_hasta?.message}>
          <Input {...register('vigente_hasta')} type="date" />
        </FormField>

        <FormField label="Estado" error={errors.estado?.message} required className="sm:col-span-2">
          <Controller name="estado" control={control} render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="propuesto">Propuesto</SelectItem>
                <SelectItem value="vigente">Vigente</SelectItem>
                <SelectItem value="finalizado">Finalizado</SelectItem>
                <SelectItem value="revocado">Revocado</SelectItem>
              </SelectContent>
            </Select>
          )} />
        </FormField>

        <FormField label="Resolución de respaldo" error={errors.resolucion_respaldo?.message} className="sm:col-span-2">
          <Textarea {...register('resolucion_respaldo')} rows={2} placeholder="Referencia al expediente/resolución judicial..." />
        </FormField>
        <FormField label="Motivo de finalización" error={errors.motivo_finalizacion?.message} className="sm:col-span-2">
          <Textarea {...register('motivo_finalizacion')} rows={2} placeholder="Solo si el vínculo se finalizó o revocó..." />
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
            : (loading ? 'Creando...' : 'Crear vínculo')}
        </Button>
      </div>
    </form>
  )
}
