'use client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pencil } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { SeguimientoPostEgreso } from '@/types/database.types'

function formatFecha(fecha: string | null) {
  if (!fecha) return '—'
  try { return format(new Date(fecha + 'T00:00:00'), 'dd/MM/yyyy', { locale: es }) }
  catch { return fecha }
}

interface SeguimientoListProps {
  seguimientos: SeguimientoPostEgreso[]
  onRegistrar: (s: SeguimientoPostEgreso) => void
}

export function SeguimientoList({ seguimientos, onRegistrar }: SeguimientoListProps) {
  if (seguimientos.length === 0) {
    return <p className="text-sm text-slate-400 py-8 text-center">No hay seguimientos post-egreso registrados</p>
  }

  const hoy = new Date().toISOString().split('T')[0]

  return (
    <div className="divide-y divide-slate-100">
      {seguimientos.map((s) => {
        const nnya = (s as any).nnya
        const vencido = !s.contacto_realizado && s.fecha_programada <= hoy
        return (
          <div key={s.id} className="py-3 space-y-1.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-slate-900">
                  {nnya ? `${nnya.apellido}, ${nnya.nombre}` : '—'}
                </span>
                <Badge variant="outline">{s.dias_post_egreso} días</Badge>
                {s.contacto_realizado ? (
                  <Badge variant="success">Contactado</Badge>
                ) : vencido ? (
                  <Badge variant="destructive">Pendiente (vencido)</Badge>
                ) : (
                  <Badge variant="secondary">Pendiente</Badge>
                )}
                {s.requiere_intervencion && <Badge variant="destructive">Requiere intervención</Badge>}
              </div>
              <Button size="sm" variant="outline" onClick={() => onRegistrar(s)}>
                <Pencil className="h-3.5 w-3.5 mr-1" />Registrar contacto
              </Button>
            </div>
            <p className="text-xs text-slate-500">
              Programado: {formatFecha(s.fecha_programada)}
              {s.fecha_contacto && ` — Contactado: ${formatFecha(s.fecha_contacto)}`}
            </p>
            {s.observaciones && <p className="text-xs text-slate-500 italic">{s.observaciones}</p>}
          </div>
        )
      })}
    </div>
  )
}
