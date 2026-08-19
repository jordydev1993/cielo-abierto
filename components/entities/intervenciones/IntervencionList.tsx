'use client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pencil } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Intervencion } from '@/types/database.types'

const ESTADO_LABEL: Record<Intervencion['estado'], string> = {
  pendiente: 'Pendiente',
  en_curso: 'En curso',
  cerrada: 'Cerrada',
}

function EstadoBadge({ estado }: { estado: Intervencion['estado'] }) {
  const map = { pendiente: 'outline', en_curso: 'warning', cerrada: 'success' } as const
  return <Badge variant={map[estado]}>{ESTADO_LABEL[estado]}</Badge>
}

interface IntervencionListProps {
  intervenciones: Intervencion[]
  onEdit: (intervencion: Intervencion) => void
}

export function IntervencionList({ intervenciones, onEdit }: IntervencionListProps) {
  if (intervenciones.length === 0) {
    return (
      <p className="text-sm text-on-surface-variant py-4 text-center">No hay intervenciones registradas</p>
    )
  }

  return (
    <div className="divide-y divide-outline-variant">
      {intervenciones.map((int) => (
        <div key={int.id} className="py-3 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-on-surface">{int.tipo}</span>
              <EstadoBadge estado={int.estado} />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-outline">
                {format(new Date(int.fecha + 'T00:00:00'), 'dd/MM/yyyy', { locale: es })}
              </span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(int)} title="Editar">
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <p className="text-sm text-on-surface-variant">{int.descripcion}</p>
          {int.usuarios && (
            <p className="text-xs text-outline">Profesional: {int.usuarios.apellido}, {int.usuarios.nombre}</p>
          )}
          {int.resultado && (
            <p className="text-xs text-on-surface-variant italic">Resultado: {int.resultado}</p>
          )}
        </div>
      ))}
    </div>
  )
}
