'use client'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Incidente } from '@/types/database.types'

const GRAVEDAD_LABEL: Record<Incidente['gravedad'], string> = {
  leve: 'Leve',
  media: 'Media',
  grave: 'Grave',
  critico: 'Crítico',
}

function GravedadBadge({ gravedad }: { gravedad: Incidente['gravedad'] }) {
  if (gravedad === 'critico') return <Badge variant="destructive">Crítico</Badge>
  if (gravedad === 'grave') return <Badge className="bg-orange-100 text-orange-700 border border-orange-200">Grave</Badge>
  if (gravedad === 'media') return <Badge variant="outline">Media</Badge>
  return <Badge variant="secondary">Leve</Badge>
}

interface IncidenteListProps {
  incidentes: Incidente[]
}

export function IncidenteList({ incidentes }: IncidenteListProps) {
  if (incidentes.length === 0) {
    return (
      <p className="text-sm text-slate-400 py-4 text-center">No hay incidentes registrados</p>
    )
  }

  return (
    <div className="divide-y divide-slate-100">
      {incidentes.map((inc) => (
        <div key={inc.id} className="py-3 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-slate-900">{inc.tipo}</span>
              <GravedadBadge gravedad={inc.gravedad} />
            </div>
            <span className="text-xs text-slate-400 shrink-0">
              {format(new Date(inc.fecha_hora), "dd/MM/yyyy HH:mm", { locale: es })}
            </span>
          </div>
          <p className="text-sm text-slate-600">{inc.descripcion}</p>
          {inc.acciones_tomadas && (
            <p className="text-xs text-slate-500 italic">Acciones: {inc.acciones_tomadas}</p>
          )}
        </div>
      ))}
    </div>
  )
}
