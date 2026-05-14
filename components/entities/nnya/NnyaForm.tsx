'use client'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { nnyaSchema, type NnyaFormValues } from '@/lib/validations/nnya.schema'
import { FormField, FormGrid, FormSection } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Nnya } from '@/types/database.types'

interface NnyaFormProps {
  initialData?: Nnya
  onSubmit: (values: NnyaFormValues) => void
  loading?: boolean
}

const ESTADOS = ['En residencia', 'En proceso de egreso', 'Egresado', 'Fallecido'] as const
const GENEROS = ['Masculino', 'Femenino', 'No binario', 'Otro']

export function NnyaForm({ initialData, onSubmit, loading }: NnyaFormProps) {
  const isEditing = !!initialData
  const { register, handleSubmit, control, formState: { errors } } = useForm<NnyaFormValues>({
    resolver: zodResolver(nnyaSchema),
    defaultValues: initialData ? {
      nombre: initialData.nombre,
      apellido: initialData.apellido,
      dni: initialData.dni,
      fecha_nacimiento: initialData.fecha_nacimiento,
      lugar_nacimiento: initialData.lugar_nacimiento ?? '',
      nacionalidad: initialData.nacionalidad ?? '',
      genero: initialData.genero ?? '',
      domicilio: initialData.domicilio ?? '',
      telefono: initialData.telefono ?? '',
      email: initialData.email ?? '',
      escolaridad: initialData.escolaridad ?? '',
      obra_social: initialData.obra_social ?? '',
      numero_expediente: initialData.numero_expediente ?? '',
      estado_actual: initialData.estado_actual,
    } : {
      nombre: '', apellido: '', dni: '', fecha_nacimiento: '',
      lugar_nacimiento: '', nacionalidad: 'Argentina', genero: '',
      domicilio: '', telefono: '', email: '', escolaridad: '',
      obra_social: '', numero_expediente: '', estado_actual: 'En residencia',
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <FormSection title="Datos personales">
        <FormGrid cols={2}>
          <FormField label="Nombre" error={errors.nombre?.message} required>
            <Input {...register('nombre')} placeholder="Juan" />
          </FormField>
          <FormField label="Apellido" error={errors.apellido?.message} required>
            <Input {...register('apellido')} placeholder="García" />
          </FormField>
          <FormField label="DNI" error={errors.dni?.message} required>
            <Input {...register('dni')} placeholder="12345678" />
          </FormField>
          <FormField label="Fecha de nacimiento" error={errors.fecha_nacimiento?.message} required>
            <Input {...register('fecha_nacimiento')} type="date" />
          </FormField>
          <FormField label="Género" error={errors.genero?.message}>
            <Controller name="genero" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value ?? ''}>
                <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  {GENEROS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            )} />
          </FormField>
          <FormField label="Nacionalidad" error={errors.nacionalidad?.message}>
            <Input {...register('nacionalidad')} placeholder="Argentina" />
          </FormField>
          <FormField label="Lugar de nacimiento" error={errors.lugar_nacimiento?.message}>
            <Input {...register('lugar_nacimiento')} />
          </FormField>
          <FormField label="N° Expediente" error={errors.numero_expediente?.message}>
            <Input {...register('numero_expediente')} />
          </FormField>
        </FormGrid>
      </FormSection>

      <FormSection title="Contacto y situación">
        <FormGrid cols={2}>
          <FormField label="Estado actual" error={errors.estado_actual?.message} required>
            <Controller name="estado_actual" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  {ESTADOS.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                </SelectContent>
              </Select>
            )} />
          </FormField>
          <FormField label="Escolaridad" error={errors.escolaridad?.message}>
            <Input {...register('escolaridad')} placeholder="Ej: Secundario incompleto" />
          </FormField>
          <FormField label="Teléfono" error={errors.telefono?.message}>
            <Input {...register('telefono')} />
          </FormField>
          <FormField label="Email" error={errors.email?.message}>
            <Input {...register('email')} type="email" />
          </FormField>
          <FormField label="Obra social" error={errors.obra_social?.message}>
            <Input {...register('obra_social')} />
          </FormField>
          <FormField label="Domicilio" error={errors.domicilio?.message} className="sm:col-span-2">
            <Textarea {...register('domicilio')} rows={2} />
          </FormField>
        </FormGrid>
      </FormSection>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Registrar NNyA'}
        </Button>
      </div>
    </form>
  )
}
