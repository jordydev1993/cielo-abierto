'use client'

import { useState, useMemo } from 'react'
import { useTurnos } from '@/hooks/turnos/useTurnos'
import { useActualizarTurno } from '@/hooks/turnos/useActualizarTurno'
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
import { CalendarClock, CheckCircle2, XCircle, Search } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import type { TurnoConNnya } from '@/hooks/turnos/useTurnos'
import type { Turno } from '@/types/database.types'

type FiltroEstado = 'todos' | 'proximos' | 'pasados' | 'cancelados'
type FiltroTipo = 'todos' | string

const TIPOS_TURNO = ['Médico', 'Psicológico', 'Odontológico', 'Judicial', 'Educativo', 'Trabajo Social', 'Otro']

function esFuturo(fechaHora: string) {
  return new Date(fechaHora) > new Date()
}

function EstadoBadge({ turno }: { turno: Turno }) {
  if (turno.estado === 'realizado') return <Badge variant="success">Realizado</Badge>
  if (turno.estado === 'cancelado') return <Badge variant="secondary">Cancelado</Badge>
  if (turno.estado === 'ausente') return <Badge variant="destructive">Ausente</Badge>
  if (turno.estado === 'confirmado') return <Badge className="bg-blue-100 text-blue-700 border border-blue-200">Confirmado</Badge>
  if (esFuturo(turno.fecha_hora)) return <Badge variant="outline">Programado</Badge>
  return <Badge className="bg-amber-100 text-amber-700 border border-amber-200">Sin confirmar</Badge>
}

const ESTADO_TABS: { value: FiltroEstado; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'proximos', label: 'Próximos' },
  { value: 'pasados', label: 'Pasados' },
  { value: 'cancelados', label: 'Cancelados' },
]

interface CancelarModalProps {
  turno: TurnoConNnya | null
  onClose: () => void
}

function CancelarModal({ turno, onClose }: CancelarModalProps) {
  const [observaciones, setObservaciones] = useState('')
  const actualizar = useActualizarTurno()

  const handleClose = () => { onClose(); setObservaciones('') }

  const handleCancelar = async () => {
    if (!turno) return
    try {
      await actualizar.mutateAsync({
        id: turno.id,
        legajoId: turno.legajo_id ?? '',
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
        <DialogHeader><DialogTitle>Cancelar turno</DialogTitle></DialogHeader>
        {turno && (
          <div className="space-y-3 pt-1">
            <div className="bg-slate-50 rounded-lg p-3 text-sm">
              <p className="font-medium text-slate-900">{turno.tipo}</p>
              {turno.nnya && (
                <p className="text-slate-500 text-xs mt-0.5">NNyA: {turno.nnya.apellido}, {turno.nnya.nombre}</p>
              )}
              <p className="text-slate-400 text-xs mt-0.5">
                {format(new Date(turno.fecha_hora), "dd/MM/yyyy HH:mm", { locale: es })}
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

export default function TurnosPage() {
  const { data: turnos = [], isLoading } = useTurnos()
  const actualizar = useActualizarTurno()
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('proximos')
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>('todos')
  const [busqueda, setBusqueda] = useState('')
  const [turnoACancelar, setTurnoACancelar] = useState<TurnoConNnya | null>(null)

  const handleRealizado = async (turno: TurnoConNnya) => {
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
        legajoId: turno.legajo_id ?? '',
        estado: 'realizado',
        fechaHora: turno.fecha_hora,
      })
      toast({ title: 'Turno marcado como realizado', variant: 'success' })
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    }
  }

  const turnosFiltrados = useMemo(() => {
    return turnos.filter((t) => {
      const futuro = esFuturo(t.fecha_hora)
      const activo = t.estado === 'programado' || t.estado === 'confirmado'

      if (filtroEstado === 'proximos' && !(activo && futuro)) return false
      if (filtroEstado === 'pasados' && !(activo && !futuro)) return false
      if (filtroEstado === 'cancelados' && t.estado !== 'cancelado') return false

      if (filtroTipo !== 'todos' && t.tipo !== filtroTipo) return false

      if (busqueda.trim()) {
        const q = busqueda.toLowerCase()
        const enNnya = t.nnya
          ? `${t.nnya.nombre} ${t.nnya.apellido}`.toLowerCase().includes(q)
          : false
        const enProfesional = t.profesional?.toLowerCase().includes(q) ?? false
        const enTipo = t.tipo.toLowerCase().includes(q)
        if (!enNnya && !enProfesional && !enTipo) return false
      }

      return true
    })
  }, [turnos, filtroEstado, filtroTipo, busqueda])

  const proximosCount = turnos.filter((t) => (t.estado === 'programado' || t.estado === 'confirmado') && esFuturo(t.fecha_hora)).length
  const pasadosCount = turnos.filter((t) => (t.estado === 'programado' || t.estado === 'confirmado') && !esFuturo(t.fecha_hora)).length

  return (
    <div className="p-6 max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1 flex-wrap">
          <h1 className="text-xl font-semibold text-slate-900">Turnos</h1>
          {proximosCount > 0 && (
            <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">
              {proximosCount} próximo{proximosCount !== 1 ? 's' : ''}
            </span>
          )}
          {pasadosCount > 0 && (
            <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full">
              {pasadosCount} sin confirmar
            </span>
          )}
        </div>
        <p className="text-sm text-slate-500">Vista global de todos los turnos agendados en el sistema.</p>
      </div>

      {/* Filtros */}
      <div className="space-y-3">
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
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
          <Select value={filtroTipo} onValueChange={setFiltroTipo}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los tipos</SelectItem>
              {TIPOS_TURNO.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por NNyA, profesional o tipo..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* Lista */}
      {isLoading ? (
        <p className="text-sm text-slate-400 py-8 text-center">Cargando turnos...</p>
      ) : turnosFiltrados.length === 0 ? (
        <div className="py-12 text-center">
          <CalendarClock className="h-8 w-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-400">No hay turnos que coincidan con los filtros</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden">
          {turnosFiltrados.map((turno) => {
            const futuro = esFuturo(turno.fecha_hora)
            const puedeAccionar = turno.estado === 'programado' || turno.estado === 'confirmado'

            return (
              <div key={turno.id} className="p-4 bg-white">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-slate-900">{turno.tipo}</span>
                      <EstadoBadge turno={turno} />
                    </div>

                    {turno.nnya && (
                      <p className="text-xs text-slate-500">
                        NNyA: <span className="font-medium">{turno.nnya.apellido}, {turno.nnya.nombre}</span>
                      </p>
                    )}

                    <div className="flex items-center gap-3 flex-wrap text-xs text-slate-400">
                      <span>{format(new Date(turno.fecha_hora), "dd/MM/yyyy HH:mm", { locale: es })}</span>
                      {turno.profesional && <span>· {turno.profesional}</span>}
                      {turno.lugar && <span>· {turno.lugar}</span>}
                    </div>

                    {turno.motivo && (
                      <p className="text-xs text-slate-500 italic">{turno.motivo}</p>
                    )}
                    {turno.observaciones && (
                      <p className="text-xs text-slate-500 italic">Obs: {turno.observaciones}</p>
                    )}
                  </div>

                  {puedeAccionar && (
                    <div className="flex gap-1.5 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className={cn(
                          'h-7 text-xs',
                          futuro
                            ? 'opacity-40 cursor-not-allowed'
                            : 'border-green-300 text-green-700 hover:bg-green-50'
                        )}
                        onClick={() => handleRealizado(turno)}
                        disabled={actualizar.isPending}
                        title={futuro ? 'No se puede marcar como realizado un turno con fecha futura (T-EX-06)' : 'Marcar como realizado'}
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Realizado
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-red-200 text-red-600 hover:bg-red-50"
                        onClick={() => setTurnoACancelar(turno)}
                        disabled={actualizar.isPending}
                      >
                        <XCircle className="h-3 w-3 mr-1" />
                        Cancelar
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <CancelarModal turno={turnoACancelar} onClose={() => setTurnoACancelar(null)} />
    </div>
  )
}
