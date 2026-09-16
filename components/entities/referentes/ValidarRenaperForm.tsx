'use client'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { validacionRenaperSchema, type ValidacionRenaperFormValues } from '@/lib/validations/validaciones-renaper.schema'
import { FormField, FormGrid } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Referente } from '@/types/database.types'

interface ValidarRenaperFormProps {
  referente: Referente
  onSubmit: (values: ValidacionRenaperFormValues) => void
  onCancel: () => void
  loading?: boolean
}

export function ValidarRenaperForm({ referente, onSubmit, onCancel, loading }: ValidarRenaperFormProps) {
  const { register, handleSubmit, control, formState: { errors } } = useForm<ValidacionRenaperFormValues>({
    resolver: zodResolver(validacionRenaperSchema),
    defaultValues: {
      momento: 'alta_referente',
      dni_consultado: referente.dni,
      estado_dni: 'vigente',
      tiene_antecedentes: false,
      resultado: 'aprobado',
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <FormGrid cols={2}>
        <FormField label="Momento" error={errors.momento?.message} required>
          <Controller name="momento" control={control} render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="alta_referente">Alta del referente</SelectItem>
                <SelectItem value="egreso">Egreso del NNyA</SelectItem>
                <SelectItem value="reintento">Reintento</SelectItem>
              </SelectContent>
            </Select>
          )} />
        </FormField>
        <FormField label="DNI consultado" error={errors.dni_consultado?.message} required>
          <Input {...register('dni_consultado')} />
        </FormField>
        <FormField label="Estado del DNI" error={errors.estado_dni?.message} required>
          <Controller name="estado_dni" control={control} render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="vigente">Vigente</SelectItem>
                <SelectItem value="vencido">Vencido</SelectItem>
                <SelectItem value="inexistente">Inexistente</SelectItem>
                <SelectItem value="error_servicio">Error del servicio</SelectItem>
              </SelectContent>
            </Select>
          )} />
        </FormField>
        <FormField label="Resultado" error={errors.resultado?.message} required>
          <Controller name="resultado" control={control} render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="aprobado">Aprobado</SelectItem>
                <SelectItem value="rechazado">Rechazado</SelectItem>
                <SelectItem value="no_concluyente">No concluyente</SelectItem>
              </SelectContent>
            </Select>
          )} />
        </FormField>
        <FormField label="¿Tiene antecedentes?" error={errors.tiene_antecedentes?.message} className="sm:col-span-2">
          <Controller name="tiene_antecedentes" control={control} render={({ field }) => (
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={field.value ?? false}
                onChange={(e) => field.onChange(e.target.checked)}
                className="h-4 w-4"
              />
              Sí, tiene antecedentes registrados
            </label>
          )} />
        </FormField>
      </FormGrid>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : 'Registrar validación'}
        </Button>
      </div>
    </form>
  )
}
