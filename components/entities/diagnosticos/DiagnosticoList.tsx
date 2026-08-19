'use client'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { toast } from '@/components/ui/toaster'
import { useActualizarDiagnostico } from '@/hooks/diagnosticos/useActualizarDiagnostico'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Stethoscope, Activity, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Diagnostico } from '@/types/database.types'

function EstadoBadge({ estado }: { estado: Diagnostico['estado'] }) {
  if (estado === 'resuelto') return <Badge variant="success">Resuelto</Badge>
  if (estado === 'en_seguimiento') return <Badge className="bg-blue-100 text-blue-700 border border-blue-200">En seguimiento</Badge>
  return <Badge variant="outline">Activo</Badge>
}

interface ConfirmarModalProps {
  diagnostico: Diagnostico | null
  nuevoEstado: 'en_seguimiento' | 'resuelto'
  legajoId: string
  onClose: () => void
}

function ConfirmarModal({ diagnostico, nuevoEstado, legajoId, onClose }: ConfirmarModalProps) {
  const actualizar = useActualizarDiagnostico()

  const handleConfirmar = async () => {
    if (!diagnostico) return
    try {
      await actualizar.mutateAsync({ id: diagnostico.id, legajoId, estado: nuevoEstado })
      toast({
        title: nuevoEstado === 'resuelto' ? 'Diagnóstico marcado como resuelto' : 'Diagnóstico en seguimiento',
        variant: 'success',
      })
      onClose()
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    }
  }

  const esResolucion = nuevoEstado === 'resuelto'

  return (
    <Dialog open={!!diagnostico} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {esResolucion ? 'Marcar diagnóstico como resuelto' : 'Poner en seguimiento'}
          </DialogTitle>
        </DialogHeader>
        {diagnostico && (
          <div className="space-y-3 pt-1">
            <div className="bg-slate-50 rounded-lg p-3 text-sm space-y-1">
              <p className="font-medium text-slate-900">{diagnostico.tipo}</p>
              <p className="text-slate-500 text-xs line-clamp-2">{diagnostico.descripcion}</p>
              <p className="text-slate-400 text-xs">
                {format(new Date(diagnostico.fecha_diagnostico + 'T00:00:00'), 'dd/MM/yyyy', { locale: es })}
              </p>
            </div>
            {esResolucion && (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                El profesional determina el cese de la condición. Este cambio no puede revertirse — si hay una recaída, se debe crear un nuevo diagnóstico. (DGN-EX-05)
              </p>
            )}
          </div>
        )}
        <DialogFooter className="pt-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={handleConfirmar}
            disabled={actualizar.isPending}
            variant={esResolucion ? 'default' : 'outline'}
          >
            {esResolucion
              ? <><CheckCircle2 className="h-4 w-4 mr-1.5" />{actualizar.isPending ? 'Guardando...' : 'Confirmar resolución'}</>
              : <><Activity className="h-4 w-4 mr-1.5" />{actualizar.isPending ? 'Guardando...' : 'Confirmar'}</>
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface DiagnosticoListProps {
  diagnosticos: Diagnostico[]
  legajoId: string
  legajoActivo: boolean
}

export function DiagnosticoList({ diagnosticos, legajoId, legajoActivo }: DiagnosticoListProps) {
  const [accion, setAccion] = useState<{ diagnostico: Diagnostico; estado: 'en_seguimiento' | 'resuelto' } | null>(null)
  const [expandido, setExpandido] = useState<string | null>(null)

  if (diagnosticos.length === 0) {
    return (
      <div className="py-6 text-center">
        <Stethoscope className="h-6 w-6 text-slate-300 mx-auto mb-1.5" />
        <p className="text-sm text-slate-400">No hay diagnósticos registrados</p>
      </div>
    )
  }

  const activos = diagnosticos.filter((d) => d.estado === 'activo')
  const enSeguimiento = diagnosticos.filter((d) => d.estado === 'en_seguimiento')
  const resueltos = diagnosticos.filter((d) => d.estado === 'resuelto')

  const grupos = [
    { label: 'Activos', items: activos },
    { label: 'En seguimiento', items: enSeguimiento },
    { label: 'Resueltos', items: resueltos },
  ].filter((g) => g.items.length > 0)

  return (
    <>
      <div className="space-y-4">
        {grupos.map(({ label, items }) => (
          <div key={label}>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">{label}</p>
            <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden">
              {items.map((diag) => {
                const exp = expandido === diag.id
                const terminal = diag.estado === 'resuelto'
                const puedeAccionar = legajoActivo && !terminal

                return (
                  <div key={diag.id} className={cn('bg-white', terminal && 'opacity-70')}>
                    <div className="p-3 flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-slate-900">{diag.tipo}</span>
                          <EstadoBadge estado={diag.estado} />
                        </div>
                        <p className="text-xs text-slate-400">
                          {format(new Date(diag.fecha_diagnostico + 'T00:00:00'), 'dd/MM/yyyy', { locale: es })}
                          {diag.profesional && ` · ${diag.profesional}`}
                          {diag.institucion && ` · ${diag.institucion}`}
                        </p>
                        <button
                          onClick={() => setExpandido(exp ? null : diag.id)}
                          className="text-xs text-primary hover:underline"
                        >
                          {exp ? 'Ocultar descripción' : 'Ver descripción'}
                        </button>
                      </div>

                      {puedeAccionar && (
                        <div className="flex flex-col gap-1 shrink-0">
                          {diag.estado === 'activo' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs border-blue-300 text-blue-700 hover:bg-blue-50"
                              onClick={() => setAccion({ diagnostico: diag, estado: 'en_seguimiento' })}
                            >
                              <Activity className="h-3 w-3 mr-1" />
                              Seguimiento
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-green-300 text-green-700 hover:bg-green-50"
                            onClick={() => setAccion({ diagnostico: diag, estado: 'resuelto' })}
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Resuelto
                          </Button>
                        </div>
                      )}
                    </div>

                    {exp && (
                      <div className="px-3 pb-3">
                        <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3 leading-relaxed">
                          {diag.descripcion}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <ConfirmarModal
        diagnostico={accion?.diagnostico ?? null}
        nuevoEstado={accion?.estado ?? 'en_seguimiento'}
        legajoId={legajoId}
        onClose={() => setAccion(null)}
      />
    </>
  )
}
