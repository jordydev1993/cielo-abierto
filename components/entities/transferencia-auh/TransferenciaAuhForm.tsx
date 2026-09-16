'use client'
import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { transferenciaAuhSchema, type TransferenciaAuhFormValues } from '@/lib/validations/transferencia-auh.schema'
import { FormField, FormGrid } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AccessGuard } from '@/components/shared/AccessGuard'
import { useTransferenciaAuhByVinculo } from '@/hooks/transferencia-auh/useTransferenciaAuhByVinculo'
import { useCreateTransferenciaAuh } from '@/hooks/transferencia-auh/useCreateTransferenciaAuh'
import { useUpdateTransferenciaAuh } from '@/hooks/transferencia-auh/useUpdateTransferenciaAuh'
import { toast } from '@/components/ui/toaster'

const ESTADOS = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_gestion', label: 'En gestión' },
  { value: 'transferida', label: 'Transferida' },
  { value: 'rechazada', label: 'Rechazada' },
  { value: 'no_corresponde', label: 'No corresponde' },
]

interface TransferenciaAuhFormProps {
  nnyaId: string
  vinculoId: string
}

export function TransferenciaAuhForm({ nnyaId, vinculoId }: TransferenciaAuhFormProps) {
  const { data: transferencia, isLoading } = useTransferenciaAuhByVinculo(vinculoId)
  const crear = useCreateTransferenciaAuh()
  const actualizar = useUpdateTransferenciaAuh()
  const [editando, setEditando] = useState(false)

  const { register, handleSubmit, control, formState: { errors } } = useForm<TransferenciaAuhFormValues>({
    resolver: zodResolver(transferenciaAuhSchema),
    values: transferencia ? {
      fecha_gestion: transferencia.fecha_gestion ?? '',
      fecha_efectiva: transferencia.fecha_efectiva ?? '',
      estado: transferencia.estado,
      organismo: transferencia.organismo ?? '',
      observaciones: transferencia.observaciones ?? '',
    } : {
      fecha_gestion: '', fecha_efectiva: '', estado: 'pendiente', organismo: '', observaciones: '',
    },
  })

  if (isLoading) return null

  const onSubmit = async (values: TransferenciaAuhFormValues) => {
    try {
      if (transferencia) {
        await actualizar.mutateAsync({ id: transferencia.id, vinculoId, values })
        toast({ title: 'Transferencia AUH actualizada', variant: 'success' })
      } else {
        await crear.mutateAsync({ nnyaId, vinculoId, values })
        toast({ title: 'Transferencia AUH iniciada', variant: 'success' })
      }
      setEditando(false)
    } catch (e: any) {
      toast({ title: 'Error al guardar', description: e.message, variant: 'destructive' })
    }
  }

  if (!transferencia && !editando) {
    return (
      <AccessGuard roles={['Admin']}>
        <Button variant="outline" size="sm" onClick={() => setEditando(true)}>
          Iniciar transferencia AUH
        </Button>
      </AccessGuard>
    )
  }

  return (
    <AccessGuard
      roles={['Admin']}
      fallback={transferencia ? (
        <p className="text-sm text-slate-600">
          Transferencia AUH: <span className="font-medium">{transferencia.estado}</span>
        </p>
      ) : null}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-lg border border-slate-200 p-4">
        <h4 className="text-sm font-semibold text-slate-900">Transferencia AUH</h4>
        <FormGrid cols={2}>
          <FormField label="Estado" error={errors.estado?.message} required>
            <Controller name="estado" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ESTADOS.map((e) => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                </SelectContent>
              </Select>
            )} />
          </FormField>
          <FormField label="Organismo" error={errors.organismo?.message}>
            <Input {...register('organismo')} placeholder="ANSES..." />
          </FormField>
          <FormField label="Fecha de gestión" error={errors.fecha_gestion?.message}>
            <Input {...register('fecha_gestion')} type="date" />
          </FormField>
          <FormField label="Fecha efectiva" error={errors.fecha_efectiva?.message}>
            <Input {...register('fecha_efectiva')} type="date" />
          </FormField>
          <FormField label="Observaciones" error={errors.observaciones?.message} className="sm:col-span-2">
            <Textarea {...register('observaciones')} rows={2} />
          </FormField>
        </FormGrid>
        <div className="flex justify-end gap-2">
          {!transferencia && (
            <Button type="button" variant="ghost" onClick={() => setEditando(false)}>Cancelar</Button>
          )}
          <Button type="submit" size="sm" disabled={crear.isPending || actualizar.isPending}>
            {crear.isPending || actualizar.isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </form>
    </AccessGuard>
  )
}
