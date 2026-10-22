'use client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Incidente } from '@/types/database.types'

function GravedadBadge({ gravedad }: { gravedad: Incidente['gravedad'] }) {
  if (gravedad === 'critico') return <Badge variant="destructive">Crítico</Badge>
  if (gravedad === 'grave') return <Badge className="bg-tertiary-fixed text-on-tertiary-fixed border border-tertiary/30">Grave</Badge>
  if (gravedad === 'media') return <Badge variant="outline">Media</Badge>
  return <Badge variant="secondary">Leve</Badge>
}

const ESTADO_LABEL: Record<Incidente['estado'], string> = {
  abierto: 'Abierto',
  en_seguimiento: 'En seguimiento',
  cerrado: 'Cerrado',
}

function EstadoBadge({ estado }: { estado: Incidente['estado'] }) {
  if (estado === 'cerrado') return <Badge variant="secondary">{ESTADO_LABEL[estado]}</Badge>
  if (estado === 'en_seguimiento') return <Badge className="bg-tertiary-fixed text-on-tertiary-fixed border border-tertiary/30">{ESTADO_LABEL[estado]}</Badge>
  return <Badge variant="outline">{ESTADO_LABEL[estado]}</Badge>
}

interface IncidenteListProps {
  incidentes: Incidente[]
  // Si se pasa, cada incidente no cerrado muestra el botón para avanzar su estado.
  onAvanzarEstado?: (incidente: Incidente) => void
}

export function IncidenteList({ incidentes, onAvanzarEstado }: IncidenteListProps) {
  if (incidentes.length === 0) {
    return (
      <p className="text-sm text-outline py-4 text-center">No hay incidentes registrados</p>
    )
  }

  return (
    <div className="divide-y divide-outline-variant">
      {incidentes.map((inc) => (
        <div key={inc.id} className="py-3 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-on-surface">{inc.tipo}</span>
              <GravedadBadge gravedad={inc.gravedad} />
              <EstadoBadge estado={inc.estado} />
            </div>
            <span className="text-xs text-outline shrink-0">
              {format(new Date(inc.fecha_hora), "dd/MM/yyyy HH:mm", { locale: es })}
            </span>
          </div>
          <p className="text-sm text-on-surface-variant">{inc.descripcion}</p>
          {inc.acciones_tomadas && (
            <p className="text-xs text-on-surface-variant italic">Acciones: {inc.acciones_tomadas}</p>
          )}
          {onAvanzarEstado && inc.estado !== 'cerrado' && (
            <div className="pt-1">
              <Button variant="outline" size="sm" onClick={() => onAvanzarEstado(inc)}>
                {inc.estado === 'abierto' ? 'Pasar a seguimiento' : 'Cerrar incidente'}
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
