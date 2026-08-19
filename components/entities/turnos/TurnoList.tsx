'use client'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { toast } from '@/components/ui/toaster'
import { useActualizarTurno } from '@/hooks/turnos/useActualizarTurno'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarClock, CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Turno } from '@/types/database.types'

function EstadoBadge({ estado }: { estado: Turno['estado'] }) {
  if (estado === 'realizado') return <Badge variant="success">Realizado</Badge>
  if (estado === 'cancelado') return <Badge variant="secondary">Cancelado</Badge>
  if (estado === 'ausente') return <Badge variant="destructive">Ausente</Badge>
  if (estado === 'confirmado') return <Badge className="bg-blue-100 text-blue-700 border border-blue-200">Confirmado</Badge>
  return <Badge variant="outline">Programado</Badge>
}

function esFuturo(fechaHora: string): boolean {
  return new Date(fechaHora) > new Date()
}

interface TurnoListProps {
  turnos: Turno[]
  legajoId: string
  legajoActivo: boolean
}

interface CancelarModalProps {
  turno: Turno | null
  legajoId: string
  onClose: () => void
}

function CancelarModal({ turno, legajoId, onClose }: CancelarModalProps) {
  const [observaciones, setObservaciones] = useState('')
  const actualizar = useActualizarTurno()

  const handleClose = () => {
    onClose()
    setObservaciones('')
  }

  const handleCancelar = async () => {
    if (!turno) return
    try {
      await actualizar.mutateAsync({
        id: turno.id,
        legajoId,
        estado: 'cancelado',
        fechaHora: turno.fecha_hora,
        observaciones: observaciones.trim() || undefined,
      })
      toast({ title: 'Turno cancelado', variant: 'success' })
      handleClose()
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    }
  }

  return (
    <Dialog open={!!turno} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Cancelar turno</DialogTitle>
        </DialogHeader>
        {turno && (
          <div className="space-y-3 pt-1">
            <div className="bg-slate-50 rounded-lg p-3 text-sm">
              <p className="font-medium text-slate-900">{turno.tipo}</p>
              <p className="text-slate-500 text-xs mt-0.5">
                {format(new Date(turno.fecha_hora), "dd/MM/yyyy HH:mm", { locale: es })}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                Motivo de cancelación <span className="text-slate-400">(opcional)</span>
              </label>
              <Textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                rows={2}
                placeholder="Motivo de la cancelación..."
              />
            </div>
          </div>
        )}
        <DialogFooter className="pt-2">
          <Button variant="ghost" onClick={handleClose}>Volver</Button>
          <Button variant="destructive" onClick={handleCancelar} disabled={actualizar.isPending}>
            {actualizar.isPending ? 'Cancelando...' : 'Confirmar cancelación'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function TurnoList({ turnos, legajoId, legajoActivo }: TurnoListProps) {
  const [turnoACancelar, setTurnoACancelar] = useState<Turno | null>(null)
  const actualizar = useActualizarTurno()

  const handleRealizado = async (turno: Turno) => {
    // T-EX-06: bloqueo visual + hook también valida
    if (esFuturo(turno.fecha_hora)) {
      toast({
        title: 'Validación fallida',
        description: 'No se puede marcar como realizado un turno con fecha futura. (T-EX-06)',
        variant: 'destructive',
      })
      return
    }
    try {
      await actualizar.mutateAsync({
        id: turno.id,
        legajoId,
        estado: 'realizado',
        fechaHora: turno.fecha_hora,
      })
      toast({ title: 'Turno marcado como realizado', variant: 'success' })
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    }
  }

  if (turnos.length === 0) {
    return (
      <div className="py-6 text-center">
        <CalendarClock className="h-6 w-6 text-slate-300 mx-auto mb-1.5" />
        <p className="text-sm text-slate-400">No hay turnos agendados</p>
      </div>
    )
  }

  const proximos = turnos.filter((t) => t.estado === 'programado' && esFuturo(t.fecha_hora))
  const pasados = turnos.filter((t) => !proximos.includes(t))

  return (
    <>
      <div className="space-y-4">
        {proximos.length > 0 && (
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Próximos</p>
            <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden">
              {proximos.map((turno) => (
                <TurnoRow
                  key={turno.id}
                  turno={turno}
                  legajoActivo={legajoActivo}
                  onRealizado={handleRealizado}
                  onCancelar={setTurnoACancelar}
                  isPending={actualizar.isPending}
                />
              ))}
            </div>
          </div>
        )}
        {pasados.length > 0 && (
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Historial</p>
            <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden">
              {pasados.map((turno) => (
                <TurnoRow
                  key={turno.id}
                  turno={turno}
                  legajoActivo={legajoActivo}
                  onRealizado={handleRealizado}
                  onCancelar={setTurnoACancelar}
                  isPending={actualizar.isPending}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <CancelarModal
        turno={turnoACancelar}
        legajoId={legajoId}
        onClose={() => setTurnoACancelar(null)}
      />
    </>
  )
}

interface TurnoRowProps {
  turno: Turno
  legajoActivo: boolean
  onRealizado: (turno: Turno) => void
  onCancelar: (turno: Turno) => void
  isPending: boolean
}

function TurnoRow({ turno, legajoActivo, onRealizado, onCancelar, isPending }: TurnoRowProps) {
  const futuro = esFuturo(turno.fecha_hora)
  const puedeAccionar = legajoActivo && (turno.estado === 'programado' || turno.estado === 'confirmado')

  return (
    <div className={cn('p-3 bg-white space-y-1.5', !legajoActivo && 'opacity-70')}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-slate-900">{turno.tipo}</span>
            <EstadoBadge estado={turno.estado} />
          </div>
          <p className="text-xs text-slate-400">
            {format(new Date(turno.fecha_hora), "dd/MM/yyyy HH:mm", { locale: es })}
            {futuro && turno.estado === 'programado' && (
              <span className="ml-1 text-blue-500 font-medium">(próximo)</span>
            )}
          </p>
          {turno.profesional && (
            <p className="text-xs text-slate-500">Profesional: <span className="font-medium">{turno.profesional}</span></p>
          )}
          {turno.lugar && (
            <p className="text-xs text-slate-500">Lugar: {turno.lugar}</p>
          )}
          {turno.motivo && (
            <p className="text-xs text-slate-500 italic">{turno.motivo}</p>
          )}
          {turno.observaciones && (
            <p className="text-xs text-slate-500 italic">Obs: {turno.observaciones}</p>
          )}
        </div>

        {/* Botones de transición — solo si el legajo está activo y el turno es modificable */}
        {puedeAccionar && (
          <div className="flex flex-col gap-1 shrink-0">
            {/* T-EX-06: botón deshabilitado visualmente si fecha es futura */}
            <Button
              size="sm"
              variant="outline"
              className={cn(
                'h-7 text-xs',
                futuro
                  ? 'opacity-40 cursor-not-allowed'
                  : 'border-green-300 text-green-700 hover:bg-green-50'
              )}
              onClick={() => onRealizado(turno)}
              disabled={isPending}
              title={futuro ? 'No se puede marcar como realizado un turno con fecha futura (T-EX-06)' : 'Marcar como realizado'}
            >
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Realizado
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs border-red-200 text-red-600 hover:bg-red-50"
              onClick={() => onCancelar(turno)}
              disabled={isPending}
            >
              <XCircle className="h-3 w-3 mr-1" />
              Cancelar
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
