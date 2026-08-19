'use client'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { actividadSchema, type ActividadFormValues } from '@/lib/validations/actividades.schema'
import { FormField, FormGrid } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useUsuarios } from '@/hooks/usuarios/useUsuarios'
import { useNnyas } from '@/hooks/nnya/useNnyas'

const TIPOS_SUGERIDOS = ['Recreativa', 'Educativa', 'Terapéutica', 'Social', 'Otra']

interface ActividadFormProps {
  onSubmit: (values: ActividadFormValues) => void
  onCancel: () => void
  loading?: boolean
}

export function ActividadForm({ onSubmit, onCancel, loading }: ActividadFormProps) {
  const { data: usuarios = [] } = useUsuarios()
  const { data: nnyas = [] } = useNnyas(true)

  const { register, handleSubmit, control, formState: { errors } } = useForm<ActividadFormValues>({
    resolver: zodResolver(actividadSchema),
    defaultValues: {
      titulo: '',
      descripcion: '',
      tipo: '',
      fecha: new Date().toISOString().split('T')[0],
      hora_inicio: '',
      hora_fin: '',
      lugar: '',
      responsable_id: '',
      nnya_ids: [],
      observaciones: '',
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormGrid cols={2}>
        <FormField label="Título" error={errors.titulo?.message} required className="sm:col-span-2">
          <Input {...register('titulo')} placeholder="Ej: Taller de arte" />
        </FormField>

        <FormField label="Tipo" error={errors.tipo?.message} required>
          <Input {...register('tipo')} list="tipos-actividad-sugeridos" placeholder="Ej: Recreativa" />
          <datalist id="tipos-actividad-sugeridos">
            {TIPOS_SUGERIDOS.map((t) => <option key={t} value={t} />)}
          </datalist>
        </FormField>

        <FormField label="Fecha" error={errors.fecha?.message} required>
          <Input {...register('fecha')} type="date" />
        </FormField>

        <FormField label="Hora de inicio" error={errors.hora_inicio?.message}>
          <Input {...register('hora_inicio')} type="time" />
        </FormField>

        <FormField label="Hora de fin" error={errors.hora_fin?.message}>
          <Input {...register('hora_fin')} type="time" />
        </FormField>

        <FormField label="Lugar" error={errors.lugar?.message} className="sm:col-span-2">
          <Input {...register('lugar')} placeholder="Ej: Salón de actividades" />
        </FormField>

        <FormField label="Responsable" error={errors.responsable_id?.message} required className="sm:col-span-2">
          <Controller name="responsable_id" control={control} render={({ field }) => (
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

        <FormField label="NNyA participantes" error={errors.nnya_ids?.message} required className="sm:col-span-2">
          <Controller name="nnya_ids" control={control} render={({ field }) => (
            <div className="border border-outline-variant rounded-md p-2 max-h-40 overflow-y-auto space-y-1">
              {nnyas.map((n) => {
                const checked = field.value.includes(n.id)
                return (
                  <label key={n.id} className="flex items-center gap-2 text-sm px-1 py-1 rounded hover:bg-surface-container cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        field.onChange(
                          e.target.checked
                            ? [...field.value, n.id]
                            : field.value.filter((id) => id !== n.id)
                        )
                      }}
                    />
                    {n.apellido}, {n.nombre}
                  </label>
                )
              })}
            </div>
          )} />
        </FormField>

        <FormField label="Descripción" error={errors.descripcion?.message} className="sm:col-span-2">
          <Textarea {...register('descripcion')} rows={2} placeholder="Descripción de la actividad (opcional)..." />
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
          {loading ? 'Registrando...' : 'Registrar actividad'}
        </Button>
      </div>
    </form>
  )
}
