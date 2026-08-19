'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { resolverAudienciaSchema, type ResolverAudienciaValues } from '@/lib/validations/audiencias.schema'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FormField } from '@/components/ui/form'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { toast } from '@/components/ui/toaster'
import { useActualizarAudiencia } from '@/hooks/audiencias/useActualizarAudiencia'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Gavel, CheckCircle2, PauseCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AudienciaJudicial } from '@/types/database.types'

function esFuturo(fechaHora: string) {
  return new Date(fechaHora) > new Date()
}

function EstadoBadge({ estado }: { estado: AudienciaJudicial['estado'] }) {
  if (estado === 'realizada') return <Badge variant="success">Realizada</Badge>
  if (estado === 'suspendida') return <Badge className="bg-amber-100 text-amber-700 border border-amber-200">Suspendida</Badge>
  if (estado === 'cancelada') return <Badge variant="secondary">Cancelada</Badge>
  return <Badge variant="outline">Programada</Badge>
}

interface ResolverModalProps {
  audiencia: AudienciaJudicial | null
  legajoId: string
  onClose: () => void
}

function ResolverModal({ audiencia, legajoId, onClose }: ResolverModalProps) {
  const actualizar = useActualizarAudiencia()
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ResolverAudienciaValues>({
    resolver: zodResolver(resolverAudienciaSchema),
  })

  const handleClose = () => { onClose(); reset() }

  const onSubmit = async (values: ResolverAudienciaValues) => {
    if (!audiencia) return
    try {
      await actualizar.mutateAsync({
        id: audiencia.id,
        legajoId,
        estado: 'realizada',
        fechaHora: audiencia.fecha_hora,
        resultado: values.resultado,
        observaciones: values.observaciones,
      })
      toast({ title: 'Audiencia marcada como realizada', variant: 'success' })
      handleClose()
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    }
  }

  return (
    <Dialog open={!!audiencia} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Registrar resultado de audiencia</DialogTitle></DialogHeader>
        {audiencia && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
            <div className="bg-slate-50 rounded-lg p-3 text-sm space-y-1">
              <p className="font-medium text-slate-900">{audiencia.tipo}</p>
              <p className="text-slate-500 text-xs">{audiencia.tribunal}</p>
              <p className="text-slate-400 text-xs">
                {format(new Date(audiencia.fecha_hora), "dd/MM/yyyy HH:mm", { locale: es })}
              </p>
            </div>
            <FormField label="Resolución judicial" error={errors.resultado?.message} required>
              <Input {...register('resultado')} placeholder="Ej: Se mantiene la medida de abrigo..." />
            </FormField>
            <FormField label="Observaciones" error={errors.observaciones?.message}>
              <Textarea {...register('observaciones')} rows={3} placeholder="Detalles adicionales..." />
            </FormField>
            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={handleClose}>Cancelar</Button>
              <Button type="submit" disabled={actualizar.isPending}>
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                {actualizar.isPending ? 'Guardando...' : 'Registrar resolución'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

interface SuspenderModalProps {
  audiencia: AudienciaJudicial | null
  legajoId: string
  onClose: () => void
}

function SuspenderModal({ audiencia, legajoId, onClose }: SuspenderModalProps) {
  const [observaciones, setObservaciones] = useState('')
  const actualizar = useActualizarAudiencia()

  const handleClose = () => { onClose(); setObservaciones('') }

  const handleSuspender = async () => {
    if (!audiencia) return
    try {
      await actualizar.mutateAsync({
        id: audiencia.id,
        legajoId,
        estado: 'suspendida',
        fechaHora: audiencia.fecha_hora,
        observaciones: observaciones.trim() || undefined,
      })
      toast({ title: 'Audiencia suspendida', variant: 'success' })
      handleClose()
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    }
  }

  return (
    <Dialog open={!!audiencia} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Suspender audiencia</DialogTitle></DialogHeader>
        {audiencia && (
          <div className="space-y-3 pt-1">
            <div className="bg-slate-50 rounded-lg p-3 text-sm">
              <p className="font-medium text-slate-900">{audiencia.tipo}</p>
              <p className="text-slate-400 text-xs mt-0.5">
                {format(new Date(audiencia.fecha_hora), "dd/MM/yyyy HH:mm", { locale: es })}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                Motivo <span className="text-slate-400">(opcional)</span>
              </label>
              <Textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                rows={2}
                placeholder="Comunicación oficial de suspensión por el juzgado..."
              />
            </div>
          </div>
        )}
        <DialogFooter className="pt-2">
          <Button variant="ghost" onClick={handleClose}>Cancelar</Button>
          <Button variant="destructive" onClick={handleSuspender} disabled={actualizar.isPending}>
            {actualizar.isPending ? 'Suspendiendo...' : 'Confirmar suspensión'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface AudienciaListProps {
  audiencias: AudienciaJudicial[]
  legajoId: string
  legajoActivo: boolean
}

export function AudienciaList({ audiencias, legajoId, legajoActivo }: AudienciaListProps) {
  const [aResolver, setAResolver] = useState<AudienciaJudicial | null>(null)
  const [aSuspender, setASuspender] = useState<AudienciaJudicial | null>(null)
  const [expandida, setExpandida] = useState<string | null>(null)

  if (audiencias.length === 0) {
    return (
      <div className="py-6 text-center">
        <Gavel className="h-6 w-6 text-slate-300 mx-auto mb-1.5" />
        <p className="text-sm text-slate-400">No hay audiencias registradas</p>
      </div>
    )
  }

  return (
    <>
      <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden">
        {audiencias.map((audiencia) => {
          const futuro = esFuturo(audiencia.fecha_hora)
          const puedeAccionar = legajoActivo && audiencia.estado === 'programada'
          const exp = expandida === audiencia.id

          return (
            <div key={audiencia.id} className={cn('bg-white', audiencia.estado === 'suspendida' && 'bg-amber-50/40')}>
              <div className="p-3 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-slate-900">{audiencia.tipo}</span>
                    <EstadoBadge estado={audiencia.estado} />
                  </div>
                  <p className="text-xs text-slate-500">{audiencia.tribunal}{audiencia.juzgado ? ` · ${audiencia.juzgado}` : ''}</p>
                  <p className="text-xs text-slate-400">
                    {format(new Date(audiencia.fecha_hora), "dd/MM/yyyy HH:mm", { locale: es })}
                    {futuro && audiencia.estado === 'programada' && <span className="ml-1 text-blue-500 font-medium">(próxima)</span>}
                  </p>
                  {audiencia.caratula && <p className="text-xs text-slate-500 italic">{audiencia.caratula}</p>}
                  {audiencia.resultado && (
                    <p className="text-xs text-slate-600">
                      <span className="font-medium">Resolución:</span> {audiencia.resultado}
                    </p>
                  )}
                  {(audiencia.observaciones || audiencia.numero_expediente) && (
                    <button
                      onClick={() => setExpandida(exp ? null : audiencia.id)}
                      className="text-xs text-primary hover:underline"
                    >
                      {exp ? 'Ocultar detalle' : 'Ver detalle'}
                    </button>
                  )}
                </div>

                {puedeAccionar && (
                  <div className="flex flex-col gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className={cn(
                        'h-7 text-xs',
                        futuro
                          ? 'opacity-40 cursor-not-allowed'
                          : 'border-green-300 text-green-700 hover:bg-green-50'
                      )}
                      onClick={() => setAResolver(audiencia)}
                      title={futuro ? 'No se puede registrar resolución de una audiencia con fecha futura (AJ-EX-04)' : 'Registrar resolución'}
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Realizada
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs border-amber-300 text-amber-700 hover:bg-amber-50"
                      onClick={() => setASuspender(audiencia)}
                    >
                      <PauseCircle className="h-3 w-3 mr-1" />
                      Suspender
                    </Button>
                  </div>
                )}
              </div>

              {exp && (
                <div className="px-3 pb-3 space-y-1 text-xs text-slate-500">
                  {audiencia.numero_expediente && <p>Expediente: <span className="font-medium">{audiencia.numero_expediente}</span></p>}
                  {audiencia.observaciones && <p className="italic">{audiencia.observaciones}</p>}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <ResolverModal audiencia={aResolver} legajoId={legajoId} onClose={() => setAResolver(null)} />
      <SuspenderModal audiencia={aSuspender} legajoId={legajoId} onClose={() => setASuspender(null)} />
    </>
  )
}
