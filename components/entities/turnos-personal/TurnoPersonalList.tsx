'use client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pencil, LogOut, LogIn } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { AccessGuard } from '@/components/shared/AccessGuard'
import type { TurnoPersonal } from '@/types/database.types'

const TURNO_LABEL: Record<TurnoPersonal['turno'], string> = { mañana: 'Mañana', tarde: 'Tarde', noche: 'Noche' }

const ESTADO_VARIANT: Record<TurnoPersonal['estado'], 'success' | 'secondary' | 'outline' | 'destructive'> = {
  planificado: 'outline',
  en_curso: 'secondary',
  entregado: 'secondary',
  cerrado: 'success',
  no_cubierto: 'destructive',
}

function formatFecha(fecha: string) {
  try { return format(new Date(fecha + 'T00:00:00'), 'dd/MM/yyyy', { locale: es }) }
  catch { return fecha }
}

interface TurnoPersonalListProps {
  turnos: TurnoPersonal[]
  miUsuarioId?: string
  onEdit: (t: TurnoPersonal) => void
  onEntregar: (t: TurnoPersonal) => void
  onRecibir: (t: TurnoPersonal) => void
}

export function TurnoPersonalList({ turnos, miUsuarioId, onEdit, onEntregar, onRecibir }: TurnoPersonalListProps) {
  if (turnos.length === 0) {
    return <p className="text-sm text-slate-400 py-8 text-center">No hay turnos de personal registrados</p>
  }

  return (
    <div className="divide-y divide-slate-100">
      {turnos.map((t) => {
        const titular = (t as any).titular
        const entregadoPorUsuario = (t as any).entregado_por_usuario
        const recibidoPorUsuario = (t as any).recibido_por_usuario
        const esTitular = !!miUsuarioId && t.usuario_id === miUsuarioId
        const puedeEntregar = esTitular && (t.estado === 'planificado' || t.estado === 'en_curso')
        const puedeRecibir = !esTitular && t.estado === 'entregado' && !t.recibido_por

        return (
          <div key={t.id} className="py-3 space-y-1.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-slate-900">{formatFecha(t.fecha)}</span>
                <Badge variant="outline">{TURNO_LABEL[t.turno]}</Badge>
                <Badge variant={ESTADO_VARIANT[t.estado]}>{t.estado}</Badge>
              </div>
              <div className="flex items-center gap-1">
                {puedeEntregar && (
                  <Button size="sm" variant="outline" onClick={() => onEntregar(t)}>
                    <LogOut className="h-3.5 w-3.5 mr-1" />Entregar mi turno
                  </Button>
                )}
                {puedeRecibir && (
                  <Button size="sm" variant="outline" onClick={() => onRecibir(t)}>
                    <LogIn className="h-3.5 w-3.5 mr-1" />Recibir turno
                  </Button>
                )}
                <AccessGuard roles={['Admin']}>
                  <Button variant="ghost" size="icon" onClick={() => onEdit(t)} title="Editar turno">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </AccessGuard>
              </div>
            </div>
            <p className="text-sm text-slate-600">
              Titular: {titular ? `${titular.apellido}, ${titular.nombre}` : '—'}
            </p>
            {t.novedades_traspaso && (
              <p className="text-xs text-slate-500 italic">Novedades: {t.novedades_traspaso}</p>
            )}
            {(entregadoPorUsuario || recibidoPorUsuario) && (
              <p className="text-xs text-slate-400">
                {entregadoPorUsuario && `Entregado por ${entregadoPorUsuario.apellido}, ${entregadoPorUsuario.nombre}`}
                {entregadoPorUsuario && recibidoPorUsuario && ' — '}
                {recibidoPorUsuario && `Recibido por ${recibidoPorUsuario.apellido}, ${recibidoPorUsuario.nombre}`}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
