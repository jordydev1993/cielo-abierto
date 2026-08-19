'use client'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { toast } from '@/components/ui/toaster'
import { useFinalizarMedicamento } from '@/hooks/medicamentos/useFinalizarMedicamento'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Pill, StopCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Medicamento } from '@/types/database.types'

function EstadoBadge({ estado }: { estado: Medicamento['estado'] }) {
  if (estado === 'finalizado') return <Badge variant="secondary">Finalizado</Badge>
  return <Badge className="bg-green-100 text-green-700 border border-green-200">En curso</Badge>
}

interface FinalizarModalProps {
  medicamento: Medicamento | null
  legajoId: string
  onClose: () => void
}

function FinalizarModal({ medicamento, legajoId, onClose }: FinalizarModalProps) {
  const finalizar = useFinalizarMedicamento()

  const handleFinalizar = async () => {
    if (!medicamento) return
    try {
      await finalizar.mutateAsync({ id: medicamento.id, legajoId })
      toast({ title: 'Tratamiento finalizado', variant: 'success' })
      onClose()
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    }
  }

  return (
    <Dialog open={!!medicamento} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Finalizar tratamiento</DialogTitle></DialogHeader>
        {medicamento && (
          <div className="space-y-3 pt-1">
            <div className="bg-slate-50 rounded-lg p-3 text-sm space-y-1">
              <p className="font-medium text-slate-900">{medicamento.nombre}</p>
              <p className="text-slate-500 text-xs">{medicamento.dosis} · {medicamento.frecuencia}</p>
              {medicamento.prescriptor && (
                <p className="text-slate-400 text-xs">Prescriptor: {medicamento.prescriptor}</p>
              )}
            </div>
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Se registrará la fecha de hoy como fecha de fin. El tratamiento no se podrá reactivar — si se reinicia, debe registrarse como un nuevo tratamiento. (M-EX-06)
            </p>
          </div>
        )}
        <DialogFooter className="pt-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="destructive" onClick={handleFinalizar} disabled={finalizar.isPending}>
            <StopCircle className="h-4 w-4 mr-1.5" />
            {finalizar.isPending ? 'Finalizando...' : 'Confirmar finalización'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface MedicamentoListProps {
  medicamentos: Medicamento[]
  legajoId: string
  legajoActivo: boolean
}

export function MedicamentoList({ medicamentos, legajoId, legajoActivo }: MedicamentoListProps) {
  const [aFinalizar, setAFinalizar] = useState<Medicamento | null>(null)

  if (medicamentos.length === 0) {
    return (
      <div className="py-6 text-center">
        <Pill className="h-6 w-6 text-slate-300 mx-auto mb-1.5" />
        <p className="text-sm text-slate-400">No hay tratamientos registrados</p>
      </div>
    )
  }

  const enCurso = medicamentos.filter((m) => m.estado === 'en_curso')
  const finalizados = medicamentos.filter((m) => m.estado === 'finalizado')
  const grupos = [
    { label: 'En curso', items: enCurso },
    { label: 'Finalizados', items: finalizados },
  ].filter((g) => g.items.length > 0)

  return (
    <>
      <div className="space-y-4">
        {grupos.map(({ label, items }) => (
          <div key={label}>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">{label}</p>
            <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden">
              {items.map((med) => (
                <div key={med.id} className={cn('p-3 bg-white', med.estado === 'finalizado' && 'opacity-70')}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-slate-900">{med.nombre}</span>
                        <EstadoBadge estado={med.estado} />
                      </div>
                      <p className="text-xs text-slate-600">
                        {med.dosis} · {med.frecuencia}
                        {med.via_administracion && ` · ${med.via_administracion}`}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                        <span>Inicio: {format(new Date(med.fecha_inicio + 'T00:00:00'), 'dd/MM/yyyy', { locale: es })}</span>
                        {med.fecha_fin && (
                          <span>Fin: {format(new Date(med.fecha_fin + 'T00:00:00'), 'dd/MM/yyyy', { locale: es })}</span>
                        )}
                        {med.prescriptor && <span>· {med.prescriptor}</span>}
                      </div>
                      {med.observaciones && (
                        <p className="text-xs text-slate-500 italic">{med.observaciones}</p>
                      )}
                    </div>

                    {legajoActivo && med.estado === 'en_curso' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-red-200 text-red-600 hover:bg-red-50 shrink-0"
                        onClick={() => setAFinalizar(med)}
                      >
                        <StopCircle className="h-3 w-3 mr-1" />
                        Finalizar
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <FinalizarModal
        medicamento={aFinalizar}
        legajoId={legajoId}
        onClose={() => setAFinalizar(null)}
      />
    </>
  )
}
