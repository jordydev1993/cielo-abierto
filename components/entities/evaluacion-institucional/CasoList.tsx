'use client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pencil } from 'lucide-react'
import type { EvaluacionInstitucionalCaso } from '@/types/database.types'

interface CasoListProps {
  casos: EvaluacionInstitucionalCaso[]
  onEdit?: (row: EvaluacionInstitucionalCaso) => void
}

export function CasoList({ casos, onEdit }: CasoListProps) {
  if (casos.length === 0) {
    return <p className="text-sm text-outline py-4 text-center">No hay casos tratados registrados</p>
  }

  return (
    <div className="divide-y divide-outline-variant">
      {casos.map((c) => {
        const nnya = (c as any).nnya
        return (
          <div key={c.id} className="py-3 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-on-surface">
                  {nnya ? `${nnya.apellido}, ${nnya.nombre}` : '—'}
                </span>
                {c.indicador_avance != null && (
                  <Badge variant="secondary">Avance {c.indicador_avance}/5</Badge>
                )}
                {c.seguimiento_requerido && <Badge variant="outline">Requiere seguimiento</Badge>}
              </div>
              {onEdit && (
                <Button variant="ghost" size="icon" onClick={() => onEdit(c)} title="Editar caso">
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-sm text-on-surface-variant">{c.resumen_situacion}</p>
            {c.recomendaciones && (
              <p className="text-xs text-on-surface-variant italic">Recomendaciones: {c.recomendaciones}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
