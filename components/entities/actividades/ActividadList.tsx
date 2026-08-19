'use client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PlayCircle, CheckCircle2, XCircle } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Actividad, Nnya } from '@/types/database.types'

const ESTADO_LABEL: Record<Actividad['estado'], string> = {
  programada: 'Programada',
  en_curso: 'En curso',
  realizada: 'Realizada',
  cancelada: 'Cancelada',
}

function EstadoBadge({ estado }: { estado: Actividad['estado'] }) {
  const map = { programada: 'outline', en_curso: 'warning', realizada: 'success', cancelada: 'secondary' } as const
  return <Badge variant={map[estado]}>{ESTADO_LABEL[estado]}</Badge>
}

interface ActividadListProps {
  actividades: Actividad[]
  nnyas: Nnya[]
  onCambiarEstado: (actividad: Actividad, estado: Actividad['estado']) => void
  loadingId?: string
}

export function ActividadList({ actividades, nnyas, onCambiarEstado, loadingId }: ActividadListProps) {
  if (actividades.length === 0) {
    return (
      <p className="text-sm text-on-surface-variant py-8 text-center">No hay actividades registradas</p>
    )
  }

  const nombresNnya = (ids: string[]) =>
    ids
      .map((id) => nnyas.find((n) => n.id === id))
      .filter((n): n is Nnya => !!n)
      .map((n) => `${n.apellido}, ${n.nombre}`)
      .join(' · ')

  return (
    <div className="divide-y divide-outline-variant border border-outline-variant rounded-lg overflow-hidden">
      {actividades.map((act) => {
        const activa = act.estado === 'programada' || act.estado === 'en_curso'
        const pending = loadingId === act.id
        return (
          <div key={act.id} className="p-4 bg-surface-container-lowest">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-on-surface">{act.titulo}</span>
                  <span className="text-xs text-outline">({act.tipo})</span>
                  <EstadoBadge estado={act.estado} />
                </div>
                <div className="flex items-center gap-3 flex-wrap text-xs text-outline">
                  <span>{format(new Date(act.fecha + 'T00:00:00'), 'dd/MM/yyyy', { locale: es })}</span>
                  {act.hora_inicio && <span>· {act.hora_inicio.slice(0, 5)}{act.hora_fin ? `–${act.hora_fin.slice(0, 5)}` : ''}</span>}
                  {act.lugar && <span>· {act.lugar}</span>}
                  {act.usuarios && <span>· Responsable: {act.usuarios.apellido}, {act.usuarios.nombre}</span>}
                </div>
                {act.nnya_ids.length > 0 && (
                  <p className="text-xs text-on-surface-variant">NNyA: {nombresNnya(act.nnya_ids) || `${act.nnya_ids.length} participante(s)`}</p>
                )}
                {act.descripcion && <p className="text-sm text-on-surface-variant">{act.descripcion}</p>}
              </div>

              {activa && (
                <div className="flex gap-1.5 shrink-0">
                  {act.estado === 'programada' && (
                    <Button size="sm" variant="outline" className="h-7 text-xs" disabled={pending} onClick={() => onCambiarEstado(act, 'en_curso')}>
                      <PlayCircle className="h-3 w-3 mr-1" />En curso
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="h-7 text-xs border-green-300 text-green-700 hover:bg-green-50" disabled={pending} onClick={() => onCambiarEstado(act, 'realizada')}>
                    <CheckCircle2 className="h-3 w-3 mr-1" />Realizada
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs border-red-200 text-red-600 hover:bg-red-50" disabled={pending} onClick={() => onCambiarEstado(act, 'cancelada')}>
                    <XCircle className="h-3 w-3 mr-1" />Cancelar
                  </Button>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
