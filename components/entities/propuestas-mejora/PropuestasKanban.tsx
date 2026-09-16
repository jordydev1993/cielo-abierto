'use client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowRight, X } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useAuth } from '@/context/AuthContext'
import { useCurrentUsuario } from '@/hooks/usuarios/useCurrentUsuario'
import { useUpdatePropuestaMejora } from '@/hooks/propuestas-mejora/useUpdatePropuestaMejora'
import { toast } from '@/components/ui/toaster'
import type { PropuestaMejora } from '@/types/database.types'

const COLUMNAS: { estado: PropuestaMejora['estado']; label: string }[] = [
  { estado: 'abierto', label: 'Abierto' },
  { estado: 'en_progreso', label: 'En progreso' },
  { estado: 'completado', label: 'Completado' },
  { estado: 'cancelado', label: 'Cancelado' },
]

const SIGUIENTE: Partial<Record<PropuestaMejora['estado'], PropuestaMejora['estado']>> = {
  abierto: 'en_progreso',
  en_progreso: 'completado',
}

const AREA_LABEL: Record<string, string> = {
  educativa: 'Educativa', sanitaria: 'Sanitaria', social: 'Social',
  institucional: 'Institucional', protocolos: 'Protocolos',
}

function formatFecha(fecha: string | null) {
  if (!fecha) return null
  try { return format(new Date(fecha + 'T00:00:00'), 'dd/MM/yyyy', { locale: es }) }
  catch { return fecha }
}

interface PropuestasKanbanProps {
  propuestas: PropuestaMejora[]
}

export function PropuestasKanban({ propuestas }: PropuestasKanbanProps) {
  const { role } = useAuth()
  const { data: yo } = useCurrentUsuario()
  const actualizar = useUpdatePropuestaMejora()

  const puedeMover = (p: PropuestaMejora) => role === 'Admin' || (!!yo && p.responsable_id === yo.id)

  const mover = async (p: PropuestaMejora, estado: PropuestaMejora['estado']) => {
    try {
      await actualizar.mutateAsync({ id: p.id, values: { estado } })
      toast({ title: 'Propuesta actualizada', variant: 'success' })
    } catch (e: any) {
      toast({ title: 'Error al mover la propuesta', description: e.message, variant: 'destructive' })
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {COLUMNAS.map((col) => {
        const items = propuestas.filter((p) => p.estado === col.estado)
        return (
          <div key={col.estado} className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
              {col.label}
              <span className="text-xs font-normal text-slate-400">({items.length})</span>
            </h3>
            <div className="space-y-2 min-h-[4rem]">
              {items.map((p) => {
                const habilitado = puedeMover(p)
                const siguiente = SIGUIENTE[p.estado]
                const responsable = (p as any).responsable
                const vencida = !!p.fecha_vencimiento && p.fecha_vencimiento < new Date().toISOString().split('T')[0]
                return (
                  <div key={p.id} className="rounded-lg border border-slate-200 bg-white p-3 space-y-2 text-sm">
                    <p className="text-slate-800">{p.descripcion}</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant="outline">{p.tipo === 'mejora' ? 'Mejora' : 'Capacitación'}</Badge>
                      {p.area && <Badge variant="secondary">{AREA_LABEL[p.area]}</Badge>}
                      {p.fecha_vencimiento && (
                        <Badge variant={vencida ? 'destructive' : 'outline'}>
                          Vence {formatFecha(p.fecha_vencimiento)}
                        </Badge>
                      )}
                    </div>
                    {responsable && (
                      <p className="text-xs text-slate-500">Responsable: {responsable.apellido}, {responsable.nombre}</p>
                    )}
                    <div className="flex items-center gap-1 pt-1">
                      {siguiente && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!habilitado || actualizar.isPending}
                          onClick={() => mover(p, siguiente)}
                          title={habilitado ? undefined : 'Solo Admin o el responsable pueden mover esta propuesta'}
                        >
                          <ArrowRight className="h-3.5 w-3.5 mr-1" />
                          Mover a {COLUMNAS.find((c) => c.estado === siguiente)?.label}
                        </Button>
                      )}
                      {p.estado !== 'cancelado' && p.estado !== 'completado' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={!habilitado || actualizar.isPending}
                          onClick={() => mover(p, 'cancelado')}
                          title={habilitado ? 'Cancelar' : 'Solo Admin o el responsable pueden cancelar esta propuesta'}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
              {items.length === 0 && (
                <p className="text-xs text-slate-400 py-2">Sin propuestas</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
