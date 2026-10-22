'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { autorizacionRetiroSchema, type AutorizacionRetiroValues } from '@/lib/validations/autorizaciones-retiro.schema'
import type { NnyaTutor } from '@/types/database.types'

interface AutorizacionFormProps {
  vinculos: NnyaTutor[]
  /** Devuelve true si se guardó; solo entonces se limpia el formulario. */
  onSubmit: (values: AutorizacionRetiroValues) => Promise<boolean>
  loading?: boolean
}

// Alta de una autorización de retiro para un tutor ya vinculado al NNyA (RN-01). Solo Admin.
export function AutorizacionForm({ vinculos, onSubmit, loading }: AutorizacionFormProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<AutorizacionRetiroValues>({
    resolver: zodResolver(autorizacionRetiroSchema),
    defaultValues: { nnya_tutor_id: '', vigente_desde: format(new Date(), 'yyyy-MM-dd'), vigente_hasta: '', restricciones: '' },
  })

  const enviar = async (values: AutorizacionRetiroValues) => {
    if (await onSubmit(values)) reset()
  }

  return (
    <form onSubmit={handleSubmit(enviar)} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Tutor vinculado" error={errors.nnya_tutor_id?.message} required className="sm:col-span-2">
          <select
            {...register('nnya_tutor_id')}
            className="h-10 w-full rounded-md border border-outline-variant bg-surface-container-low px-3 text-sm text-on-surface"
          >
            <option value="">Seleccionar…</option>
            {vinculos.map((v) => (
              <option key={v.id} value={v.id}>
                {v.tutores ? `${v.tutores.apellido}, ${v.tutores.nombre} — ${v.tutores.parentesco}` : v.id}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Vigente desde" error={errors.vigente_desde?.message} required>
          <Input type="date" {...register('vigente_desde')} />
        </FormField>
        <FormField label="Vigente hasta" error={errors.vigente_hasta?.message}>
          <Input type="date" {...register('vigente_hasta')} />
        </FormField>
        <FormField label="Restricciones" error={errors.restricciones?.message} className="sm:col-span-2">
          <Textarea rows={2} placeholder="Por ejemplo: solo fines de semana" {...register('restricciones')} />
        </FormField>
      </div>
      <Button type="submit" disabled={loading}>Agregar autorización</Button>
    </form>
  )
}
