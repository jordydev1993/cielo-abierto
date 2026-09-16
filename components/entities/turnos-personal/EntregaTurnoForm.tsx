'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { entregaTurnoSchema, type EntregaTurnoFormValues } from '@/lib/validations/entrega-turno.schema'
import { FormField } from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

interface EntregaTurnoFormProps {
  onSubmit: (values: EntregaTurnoFormValues) => void
  onCancel: () => void
  loading?: boolean
}

export function EntregaTurnoForm({ onSubmit, onCancel, loading }: EntregaTurnoFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<EntregaTurnoFormValues>({
    resolver: zodResolver(entregaTurnoSchema),
    defaultValues: { novedades_traspaso: '' },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <FormField label="Novedades para quien reciba el turno" error={errors.novedades_traspaso?.message}>
        <Textarea {...register('novedades_traspaso')} rows={4} placeholder="Opcional..." />
      </FormField>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>Cancelar</Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Entregando...' : 'Entregar mi turno'}
        </Button>
      </div>
    </form>
  )
}
