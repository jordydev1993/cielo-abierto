'use client'

import { useState, useMemo } from 'react'
import { useAlertas } from '@/hooks/alertas/useAlertas'
import { useResolverAlerta } from '@/hooks/alertas/useResolverAlerta'
import { useProcesarAlerta } from '@/hooks/alertas/useProcesarAlerta'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { toast } from '@/components/ui/toaster'
import { AlertTriangle, CheckCircle2, Clock, Search } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import type { AlertaConNnya } from '@/hooks/alertas/useAlertas'
import type { Alerta } from '@/types/database.types'

type FiltroEstado = 'todas' | 'pendiente' | 'en_proceso' | 'completada' | 'vencida'
type FiltroPrioridad = 'todas' | Alerta['prioridad']

function isVencida(alerta: Alerta): boolean {
  if (alerta.estado === 'completada') return false
  if (!alerta.fecha_vencimiento) return false
  return new Date(alerta.fecha_vencimiento + 'T23:59:59') < new Date()
}

function isProxima(alerta: Alerta): boolean {
  if (alerta.estado === 'completada') return false
  if (!alerta.fecha_vencimiento) return false
  const diff = new Date(alerta.fecha_vencimiento + 'T23:59:59').getTime() - Date.now()
  return diff > 0 && diff < 24 * 60 * 60 * 1000
}

function PrioridadBadge({ prioridad }: { prioridad: Alerta['prioridad'] }) {
  if (prioridad === 'critica') return <Badge variant="destructive">Crítica</Badge>
  if (prioridad === 'alta') return <Badge className="bg-orange-100 text-orange-700 border border-orange-200">Alta</Badge>
  if (prioridad === 'media') return <Badge variant="outline">Media</Badge>
  return <Badge variant="secondary">Baja</Badge>
}

function EstadoBadge({ alerta }: { alerta: Alerta }) {
  const vencida = isVencida(alerta)
  if (alerta.estado === 'completada') return <Badge variant="success">Completada</Badge>
  if (vencida || alerta.estado === 'vencida') return <Badge variant="destructive">Vencida</Badge>
  if (alerta.estado === 'en_proceso') return <Badge className="bg-blue-100 text-blue-700 border border-blue-200">En proceso</Badge>
  return <Badge variant="secondary">Pendiente</Badge>
}

interface ResolverModalProps {
  alerta: AlertaConNnya | null
  onClose: () => void
}

function ResolverModal({ alerta, onClose }: ResolverModalProps) {
  const [observacion, setObservacion] = useState('')
  const resolver = useResolverAlerta()
  const requiereObservacion = alerta?.prioridad === 'alta' || alerta?.prioridad === 'critica'

  const handleClose = () => {
    onClose()
    setObservacion('')
  }

  const handleSubmit = async () => {
    if (!alerta) return
    if (requiereObservacion && !observacion.trim()) {
      toast({
        title: 'Observación requerida',
        description: 'Las alertas de prioridad alta o crítica requieren una descripción del cierre para ser resueltas. (A-EX-04)',
        variant: 'destructive',
      })
      return
    }
    try {
      await resolver.mutateAsync({ id: alerta.id, observacion: observacion.trim() })
      toast({ title: 'Alerta resuelta', variant: 'success' })
      handleClose()
    } catch (e: any) {
      toast({ title: 'Error al resolver', description: e.message, variant: 'destructive' })
    }
  }

  return (
    <Dialog open={!!alerta} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Resolver alerta</DialogTitle>
        </DialogHeader>
        {alerta && (
          <div className="space-y-4 pt-1">
            <div className="bg-slate-50 rounded-lg p-3 space-y-1 text-sm">
              <p className="font-medium text-slate-900">{alerta.titulo}</p>
              {alerta.nnya && (
                <p className="text-slate-500">NNyA: {alerta.nnya.apellido}, {alerta.nnya.nombre}</p>
              )}
              <div className="flex items-center gap-2 pt-1">
                <PrioridadBadge prioridad={alerta.prioridad} />
                <EstadoBadge alerta={alerta} />
                {alerta.fecha_vencimiento && (
                  <span className="text-xs text-slate-400">
                    Vence: {format(new Date(alerta.fecha_vencimiento + 'T00:00:00'), 'dd/MM/yyyy', { locale: es })}
                  </span>
                )}
              </div>
              {alerta.descripcion && (
                <p className="text-slate-600 mt-2 text-xs leading-relaxed">{alerta.descripcion}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                Observación de cierre{' '}
                {requiereObservacion
                  ? <span className="text-red-500">*</span>
                  : <span className="text-slate-400">(opcional)</span>}
              </label>
              <Textarea
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
                rows={3}
                placeholder={
                  requiereObservacion
                    ? 'Descripción obligatoria para alertas de alta prioridad...'
                    : 'Descripción de las acciones tomadas...'
                }
              />
              {requiereObservacion && (
                <p className="text-xs text-amber-600 mt-1">
                  Las alertas de prioridad alta o crítica requieren documentar las acciones tomadas.
                </p>
              )}
            </div>
          </div>
        )}
        <DialogFooter className="pt-2">
          <Button variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={resolver.isPending}>
            <CheckCircle2 className="h-4 w-4 mr-1.5" />
            {resolver.isPending ? 'Resolviendo...' : 'Marcar como resuelta'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const ESTADO_TABS: { value: FiltroEstado; label: string }[] = [
  { value: 'todas', label: 'Todas' },
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'en_proceso', label: 'En proceso' },
  { value: 'vencida', label: 'Vencidas' },
  { value: 'completada', label: 'Completadas' },
]

export default function AlertasPage() {
  const { data: alertas = [], isLoading } = useAlertas()
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todas')
  const [filtroPrioridad, setFiltroPrioridad] = useState<FiltroPrioridad>('todas')
  const [busqueda, setBusqueda] = useState('')
  const [alertaAResolver, setAlertaAResolver] = useState<AlertaConNnya | null>(null)
  const procesar = useProcesarAlerta()

  const handleProcesar = async (alerta: AlertaConNnya) => {
    try {
      await procesar.mutateAsync(alerta.id)
      toast({ title: 'Alerta puesta en proceso', variant: 'success' })
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    }
  }

  const alertasFiltradas = useMemo(() => {
    return alertas.filter((alerta) => {
      const vencida = isVencida(alerta)

      if (filtroEstado === 'pendiente' && (alerta.estado !== 'pendiente' || vencida)) return false
      if (filtroEstado === 'en_proceso' && alerta.estado !== 'en_proceso') return false
      if (filtroEstado === 'completada' && alerta.estado !== 'completada') return false
      if (filtroEstado === 'vencida' && !vencida && alerta.estado !== 'vencida') return false

      if (filtroPrioridad !== 'todas' && alerta.prioridad !== filtroPrioridad) return false

      if (busqueda.trim()) {
        const q = busqueda.toLowerCase()
        const enTitulo = alerta.titulo.toLowerCase().includes(q)
        const enDesc = alerta.descripcion?.toLowerCase().includes(q) ?? false
        const enNnya = alerta.nnya
          ? `${alerta.nnya.nombre} ${alerta.nnya.apellido}`.toLowerCase().includes(q)
          : false
        if (!enTitulo && !enDesc && !enNnya) return false
      }

      return true
    })
  }, [alertas, filtroEstado, filtroPrioridad, busqueda])

  const pendientesCount = alertas.filter((a) => a.estado === 'pendiente' && !isVencida(a)).length
  const enProcesoCount = alertas.filter((a) => a.estado === 'en_proceso').length
  const vencidasCount = alertas.filter((a) => isVencida(a) || a.estado === 'vencida').length

  return (
    <div className="p-6 max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1 flex-wrap">
          <h1 className="text-xl font-semibold text-slate-900">Alertas</h1>
          {pendientesCount > 0 && (
            <span className="bg-red-100 text-red-700 text-xs font-semibold px-2 py-0.5 rounded-full">
              {pendientesCount} pendiente{pendientesCount !== 1 ? 's' : ''}
            </span>
          )}
          {enProcesoCount > 0 && (
            <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">
              {enProcesoCount} en proceso
            </span>
          )}
          {vencidasCount > 0 && (
            <span className="bg-red-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
              {vencidasCount} vencida{vencidasCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <p className="text-sm text-slate-500">
          Seguimiento de alertas generadas automáticamente por incidentes graves o críticos.
        </p>
      </div>

      {/* Filtros */}
      <div className="space-y-3">
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit flex-wrap">
          {ESTADO_TABS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFiltroEstado(value)}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                filtroEstado === value
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <Select value={filtroPrioridad} onValueChange={(v) => setFiltroPrioridad(v as FiltroPrioridad)}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Prioridad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las prioridades</SelectItem>
              <SelectItem value="critica">Crítica</SelectItem>
              <SelectItem value="alta">Alta</SelectItem>
              <SelectItem value="media">Media</SelectItem>
              <SelectItem value="baja">Baja</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por título, descripción o NNyA..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* Lista */}
      {isLoading ? (
        <p className="text-sm text-slate-400 py-8 text-center">Cargando alertas...</p>
      ) : alertasFiltradas.length === 0 ? (
        <div className="py-12 text-center">
          <AlertTriangle className="h-8 w-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-400">No hay alertas que coincidan con los filtros</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden">
          {alertasFiltradas.map((alerta) => {
            const proxima = isProxima(alerta)
            const vencida = isVencida(alerta)
            const resuelta = alerta.estado === 'completada'
            const enProceso = alerta.estado === 'en_proceso'

            return (
              <div
                key={alerta.id}
                className={cn(
                  'p-4 bg-white',
                  proxima && 'bg-amber-50',
                  vencida && 'bg-red-50',
                  enProceso && 'bg-blue-50',
                  resuelta && 'opacity-60',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      {(proxima || vencida) && (
                        <AlertTriangle className={cn('h-3.5 w-3.5 shrink-0', vencida ? 'text-red-500' : 'text-amber-500')} />
                      )}
                      <span className="text-sm font-medium text-slate-900">{alerta.titulo}</span>
                    </div>

                    {alerta.nnya && (
                      <p className="text-xs text-slate-500">
                        NNyA: <span className="font-medium">{alerta.nnya.apellido}, {alerta.nnya.nombre}</span>
                      </p>
                    )}

                    <div className="flex items-center gap-2 flex-wrap">
                      <PrioridadBadge prioridad={alerta.prioridad} />
                      <EstadoBadge alerta={alerta} />
                      {alerta.fecha_vencimiento && (
                        <span className={cn('text-xs', vencida ? 'text-red-600 font-medium' : 'text-slate-400')}>
                          Vence: {format(new Date(alerta.fecha_vencimiento + 'T00:00:00'), 'dd/MM/yyyy', { locale: es })}
                          {proxima && ' — vence hoy'}
                          {vencida && ' — VENCIDA'}
                        </span>
                      )}
                    </div>

                    {alerta.descripcion && (
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{alerta.descripcion}</p>
                    )}

                    {alerta.observacion_cierre && (
                      <p className="text-xs text-slate-500 italic">Cierre: {alerta.observacion_cierre}</p>
                    )}
                  </div>

                  {/* Botones según estado — máquina de estados visible */}
                  {!resuelta && (
                    <div className="flex flex-col gap-1.5 shrink-0">
                      {alerta.estado === 'pendiente' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-blue-300 text-blue-700 hover:bg-blue-50 h-7 text-xs"
                          onClick={() => handleProcesar(alerta)}
                          disabled={procesar.isPending}
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          En proceso
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant={enProceso ? 'default' : 'outline'}
                        className={cn('h-7 text-xs', enProceso && 'bg-green-600 hover:bg-green-700')}
                        onClick={() => setAlertaAResolver(alerta)}
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Resolver
                      </Button>
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-300 mt-2">
                  Creada: {format(new Date(alerta.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                </p>
              </div>
            )
          })}
        </div>
      )}

      <ResolverModal
        alerta={alertaAResolver}
        onClose={() => setAlertaAResolver(null)}
      />
    </div>
  )
}
