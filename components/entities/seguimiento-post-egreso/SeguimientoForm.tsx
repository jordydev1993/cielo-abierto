'use client'
import { useForm, Controller, type Control } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  seguimientoPostEgresoSchema,
  type SeguimientoPostEgresoFormValues,
} from '@/lib/validations/seguimiento-post-egreso.schema'
import { FormField, FormGrid } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { SeguimientoPostEgreso } from '@/types/database.types'

const CUMPLIMIENTO_OPCIONES = [
  { value: 'cumple', label: 'Cumple' },
  { value: 'parcial', label: 'Parcial' },
  { value: 'no_cumple', label: 'No cumple' },
  { value: 'no_corresponde', label: 'No corresponde' },
]

function CumplimientoField({
  name, label, control,
}: {
  name: 'escolaridad' | 'salud' | 'terapias'
  label: string
  control: Control<SeguimientoPostEgresoFormValues>
}) {
  return (
    <FormField label={label} error={undefined}>
      <Controller name={name} control={control} render={({ field }) => (
        <Select onValueChange={field.onChange} value={field.value}>
          <SelectTrigger><SelectValue placeholder="Sin evaluar" /></SelectTrigger>
          <SelectContent>
            {CUMPLIMIENTO_OPCIONES.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      )} />
    </FormField>
  )
}

interface SeguimientoFormProps {
  initialData: SeguimientoPostEgreso
  onSubmit: (values: SeguimientoPostEgresoFormValues) => void
  onCancel: () => void
  loading?: boolean
}

export function SeguimientoForm({ initialData, onSubmit, onCancel, loading }: SeguimientoFormProps) {
  const { register, handleSubmit, control, formState: { errors } } = useForm<SeguimientoPostEgresoFormValues>({
    resolver: zodResolver(seguimientoPostEgresoSchema),
    defaultValues: {
      fecha_contacto: initialData.fecha_contacto?.slice(0, 10) ?? '',
      contacto_realizado: initialData.contacto_realizado,
      contacto_efectivo: initialData.contacto_efectivo ?? undefined,
      escolaridad: initialData.escolaridad ?? '',
      salud: initialData.salud ?? '',
      terapias: initialData.terapias ?? '',
      percibe_auh: initialData.percibe_auh ?? undefined,
      detalle_incumplimiento: initialData.detalle_incumplimiento ?? '',
      observaciones: initialData.observaciones ?? '',
      indicador_reinsercion: initialData.indicador_reinsercion != null ? String(initialData.indicador_reinsercion) : '',
      requiere_intervencion: initialData.requiere_intervencion,
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <FormGrid cols={2}>
        <FormField label="Fecha de contacto" error={errors.fecha_contacto?.message}>
          <Input {...register('fecha_contacto')} type="date" />
        </FormField>
        <FormField label="Indicador de reinserción (1-5)" error={errors.indicador_reinsercion?.message}>
          <Input {...register('indicador_reinsercion')} type="number" min={1} max={5} />
        </FormField>

        <FormField label="Contacto realizado" error={errors.contacto_realizado?.message} className="sm:col-span-2">
          <Controller name="contacto_realizado" control={control} render={({ field }) => (
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={field.value} onChange={(e) => field.onChange(e.target.checked)} className="h-4 w-4" />
              Se realizó el contacto
            </label>
          )} />
        </FormField>
        <FormField label="Contacto efectivo" error={undefined}>
          <Controller name="contacto_efectivo" control={control} render={({ field }) => (
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={field.value ?? false} onChange={(e) => field.onChange(e.target.checked)} className="h-4 w-4" />
              Se pudo contactar efectivamente
            </label>
          )} />
        </FormField>
        <FormField label="Percibe AUH" error={undefined}>
          <Controller name="percibe_auh" control={control} render={({ field }) => (
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={field.value ?? false} onChange={(e) => field.onChange(e.target.checked)} className="h-4 w-4" />
              Percibe AUH
            </label>
          )} />
        </FormField>
        <FormField label="Requiere intervención" error={undefined}>
          <Controller name="requiere_intervencion" control={control} render={({ field }) => (
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={field.value} onChange={(e) => field.onChange(e.target.checked)} className="h-4 w-4" />
              Requiere intervención
            </label>
          )} />
        </FormField>

        <CumplimientoField name="escolaridad" label="Escolaridad" control={control} />
        <CumplimientoField name="salud" label="Salud" control={control} />
        <CumplimientoField name="terapias" label="Terapias" control={control} />

        <FormField label="Detalle de incumplimiento" error={errors.detalle_incumplimiento?.message} className="sm:col-span-2">
          <Textarea {...register('detalle_incumplimiento')} rows={2} placeholder="Solo si corresponde..." />
        </FormField>
        <FormField label="Observaciones" error={errors.observaciones?.message} className="sm:col-span-2">
          <Textarea {...register('observaciones')} rows={2} />
        </FormField>
      </FormGrid>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>Cancelar</Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : 'Registrar contacto'}
        </Button>
      </div>
    </form>
  )
}
