'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { legajoCierreSchema, type LegajoCierreValues } from '@/lib/validations/legajos.schema'
import { AccessGuard } from '@/components/shared/AccessGuard'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { FormField } from '@/components/ui/form'
import { ChevronLeft, Lock } from 'lucide-react'
import { useLegajo } from '@/hooks/legajos/useLegajo'
import { useCerrarLegajo } from '@/hooks/legajos/useUpdateLegajo'
import { toast } from '@/components/ui/toaster'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

function estadoBadge(estado: 'activo' | 'cerrado' | 'archivado') {
  const map = { activo: 'success', cerrado: 'secondary', archivado: 'outline' } as const
  return <Badge variant={map[estado]}>{estado.charAt(0).toUpperCase() + estado.slice(1)}</Badge>
}

function formatFecha(fecha: string | null) {
  if (!fecha) return '—'
  try {
    return format(new Date(fecha + 'T00:00:00'), 'dd/MM/yyyy', { locale: es })
  } catch {
    return fecha
  }
}

export default function LegajoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { data: legajo, isLoading } = useLegajo(id)
  const cerrar = useCerrarLegajo()
  const [open, setOpen] = useState(false)

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<LegajoCierreValues>({
    resolver: zodResolver(legajoCierreSchema),
    defaultValues: { estado: 'cerrado', motivo_cierre: '' },
  })

  const onCerrar = async (values: LegajoCierreValues) => {
    if (!legajo) return
    try {
      await cerrar.mutateAsync({ id, nnyaId: legajo.nnya_id, values })
      toast({ title: 'Legajo cerrado', variant: 'success' })
      setOpen(false)
      reset()
    } catch (e: any) {
      toast({ title: 'Error al cerrar legajo', description: e.message, variant: 'destructive' })
    }
  }

  if (isLoading) return <div className="p-8 text-slate-500">Cargando...</div>
  if (!legajo) return <div className="p-8 text-slate-500">Legajo no encontrado</div>

  const nnya = legajo.nnya as any

  return (
    <div className="p-6 max-w-2xl">
      <Button variant="ghost" size="sm" onClick={() => router.push('/legajos')} className="-ml-2 mb-4">
        <ChevronLeft className="h-4 w-4 mr-1" />Volver
      </Button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Legajo {legajo.numero_legajo}</h1>
          {nnya && (
            <p className="text-sm text-slate-500 mt-0.5">
              {nnya.apellido}, {nnya.nombre} — DNI {nnya.dni}
            </p>
          )}
        </div>
        {estadoBadge(legajo.estado)}
      </div>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm mb-8">
        <div>
          <dt className="text-slate-500 font-medium">Apertura</dt>
          <dd className="text-slate-900 mt-0.5">{formatFecha(legajo.fecha_apertura)}</dd>
        </div>
        <div>
          <dt className="text-slate-500 font-medium">Cierre</dt>
          <dd className="text-slate-900 mt-0.5">{formatFecha(legajo.fecha_cierre)}</dd>
        </div>
        {legajo.observaciones && (
          <div className="col-span-2">
            <dt className="text-slate-500 font-medium">Observaciones iniciales</dt>
            <dd className="text-slate-900 mt-0.5 whitespace-pre-wrap">{legajo.observaciones}</dd>
          </div>
        )}
        {legajo.motivo_cierre && (
          <div className="col-span-2">
            <dt className="text-slate-500 font-medium">Motivo de cierre</dt>
            <dd className="text-slate-900 mt-0.5 whitespace-pre-wrap">{legajo.motivo_cierre}</dd>
          </div>
        )}
      </dl>

      {legajo.estado === 'activo' && (
        <AccessGuard roles={['Admin', 'Equipo Tecnico']}>
          <Button variant="destructive" onClick={() => setOpen(true)}>
            <Lock className="h-4 w-4 mr-2" />
            Cerrar legajo
          </Button>
        </AccessGuard>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cerrar legajo {legajo.numero_legajo}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onCerrar)} className="space-y-4 pt-2">
            <FormField label="Estado final" error={errors.estado?.message} required>
              <Controller name="estado" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cerrado">Cerrado</SelectItem>
                    <SelectItem value="archivado">Archivado</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            </FormField>
            <FormField label="Motivo de cierre" error={errors.motivo_cierre?.message} required>
              <Textarea {...register('motivo_cierre')} rows={4} placeholder="Describí el motivo del cierre..." />
            </FormField>
            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="destructive" disabled={cerrar.isPending}>
                {cerrar.isPending ? 'Cerrando...' : 'Confirmar cierre'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
