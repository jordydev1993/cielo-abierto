'use client'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Alerta } from '@/types/database.types'

function PrioridadBadge({ prioridad }: { prioridad: Alerta['prioridad'] }) {
  if (prioridad === 'critica') return <Badge variant="destructive">Crítica</Badge>
  if (prioridad === 'alta') return <Badge className="bg-orange-100 text-orange-700 border border-orange-200">Alta</Badge>
  if (prioridad === 'media') return <Badge variant="outline">Media</Badge>
  return <Badge variant="secondary">Baja</Badge>
}

function isVencimientoProximo(fecha: string | null): boolean {
  if (!fecha) return false
  const diff = new Date(fecha + 'T23:59:59').getTime() - Date.now()
  return diff > 0 && diff < 24 * 60 * 60 * 1000
}

function isVencida(fecha: string | null): boolean {
  if (!fecha) return false
  return new Date(fecha + 'T23:59:59') < new Date()
}

interface AlertaListProps {
  alertas: Alerta[]
}

export function AlertaList({ alertas }: AlertaListProps) {
  if (alertas.length === 0) {
    return (
      <p className="text-sm text-slate-400 py-4 text-center">No hay alertas registradas</p>
    )
  }

  return (
    <div className="divide-y divide-slate-100">
      {alertas.map((alerta) => {
        const proximo = isVencimientoProximo(alerta.fecha_vencimiento)
        const vencida = alerta.estado !== 'completada' && isVencida(alerta.fecha_vencimiento)

        return (
          <div
            key={alerta.id}
            className={cn(
              'py-3 space-y-1 rounded px-2 -mx-2',
              proximo && 'bg-amber-50',
              vencida && 'bg-red-50',
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                {(proximo || vencida) && (
                  <AlertTriangle className={cn('h-3.5 w-3.5 shrink-0', vencida ? 'text-red-500' : 'text-amber-500')} />
                )}
                <span className="text-sm font-medium text-slate-900 truncate">{alerta.titulo}</span>
                <PrioridadBadge prioridad={alerta.prioridad} />
              </div>
              <Badge
                variant={alerta.estado === 'completada' ? 'success' : 'secondary'}
                className="shrink-0 text-xs"
              >
                {alerta.estado.replace('_', ' ')}
              </Badge>
            </div>
            {alerta.fecha_vencimiento && (
              <p className={cn('text-xs', vencida ? 'text-red-600 font-medium' : 'text-slate-400')}>
                Vence: {format(new Date(alerta.fecha_vencimiento + 'T00:00:00'), 'dd/MM/yyyy', { locale: es })}
                {proximo && ' — vence hoy'}
                {vencida && ' — VENCIDA'}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
