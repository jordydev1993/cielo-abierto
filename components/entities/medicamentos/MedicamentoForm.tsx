'use client'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { medicamentoSchema, type MedicamentoFormValues } from '@/lib/validations/medicamentos.schema'
import { FormField, FormGrid } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertTriangle } from 'lucide-react'
import type { Diagnostico } from '@/types/database.types'

interface MedicamentoFormProps {
  legajoId: string
  nnyaId: string
  diagnosticos: Diagnostico[]
  onSubmit: (values: MedicamentoFormValues) => void
  onCancel: () => void
  loading?: boolean
}

export function MedicamentoForm({ legajoId, nnyaId, diagnosticos, onSubmit, onCancel, loading }: MedicamentoFormProps) {
  const today = new Date().toISOString().split('T')[0]
  const diagActivos = diagnosticos.filter((d) => d.estado !== 'resuelto')

  const { register, handleSubmit, control, formState: { errors } } = useForm<MedicamentoFormValues>({
    resolver: zodResolver(medicamentoSchema),
    defaultValues: {
      legajo_id: legajoId,
      nnya_id: nnyaId,
      diagnostico_id: '',
      nombre: '',
      dosis: '',
      frecuencia: '',
      via_administracion: '',
      prescriptor: '',
      fecha_inicio: today,
      fecha_fin: '',
      observaciones: '',
    },
  })

  if (diagActivos.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            No hay diagnósticos activos en este legajo. Registrá un diagnóstico primero antes de iniciar un tratamiento farmacológico. (M-EX-02)
          </span>
        </div>
        <div className="flex justify-end">
          <Button type="button" variant="ghost" onClick={onCancel}>Cerrar</Button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormGrid cols={2}>
        <FormField
          label="Diagnóstico asociado"
          error={errors.diagnostico_id?.message}
          required
          className="sm:col-span-2"
        >
          <Controller name="diagnostico_id" control={control} render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccioná el diagnóstico que justifica este tratamiento..." />
              </SelectTrigger>
              <SelectContent>
                {diagActivos.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    <span className="font-medium">{d.tipo}</span>
                    {d.descripcion && (
                      <span className="text-slate-500 ml-1.5">
                        — {d.descripcion.length > 50 ? d.descripcion.slice(0, 50) + '…' : d.descripcion}
                      </span>
                    )}
                    <span className="ml-1.5 text-xs text-slate-400 capitalize">({d.estado.replace('_', ' ')})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )} />
        </FormField>

        <FormField label="Medicamento" error={errors.nombre?.message} required className="sm:col-span-2">
          <Input {...register('nombre')} placeholder="Nombre del medicamento..." />
        </FormField>

        <FormField label="Dosis" error={errors.dosis?.message} required>
          <Input {...register('dosis')} placeholder="Ej: 500mg" />
        </FormField>

        <FormField label="Frecuencia" error={errors.frecuencia?.message} required>
          <Input {...register('frecuencia')} placeholder="Ej: cada 8 horas" />
        </FormField>

        <FormField label="Vía de administración" error={errors.via_administracion?.message}>
          <Input {...register('via_administracion')} placeholder="Oral, intramuscular..." />
        </FormField>

        <FormField label="Prescriptor" error={errors.prescriptor?.message}>
          <Input {...register('prescriptor')} placeholder="Nombre del médico prescriptor..." />
        </FormField>

        <FormField label="Fecha de inicio" error={errors.fecha_inicio?.message} required>
          <Input {...register('fecha_inicio')} type="date" />
        </FormField>

        <FormField label="Fecha de fin" error={errors.fecha_fin?.message}>
          <Input {...register('fecha_fin')} type="date" />
          {errors.fecha_fin && (
            <p className="text-xs text-amber-600 mt-1">La fecha de fin no puede ser anterior al inicio.</p>
          )}
        </FormField>

        <FormField label="Observaciones" error={errors.observaciones?.message} className="sm:col-span-2">
          <Textarea {...register('observaciones')} rows={2} placeholder="Indicaciones adicionales..." />
        </FormField>
      </FormGrid>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : 'Registrar tratamiento'}
        </Button>
      </div>
    </form>
  )
}
