'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AccessGuard } from '@/components/shared/AccessGuard'
import { IncidenteList } from '@/components/entities/incidentes/IncidenteList'
import { IncidenteForm } from '@/components/entities/incidentes/IncidenteForm'
import { useIncidentesByLegajo } from '@/hooks/incidentes/useIncidentesByLegajo'
import { useCreateIncidente } from '@/hooks/incidentes/useCreateIncidente'
import { useCambiarEstadoIncidente } from '@/hooks/incidentes/useCambiarEstadoIncidente'
import { toast } from '@/components/ui/toaster'
import type { IncidenteFormValues } from '@/lib/validations/incidentes.schema'
import type { Incidente } from '@/types/database.types'

interface IncidentesTabProps { legajoId: string; nnyaId: string; legajoActivo: boolean }

export function IncidentesTab({ legajoId, nnyaId, legajoActivo }: IncidentesTabProps) {
  const [open, setOpen] = useState(false)
  const [aCerrar, setACerrar] = useState<Incidente | null>(null)
  const [acciones, setAcciones] = useState('')
  const { data: incidentes = [], isLoading } = useIncidentesByLegajo(legajoId)
  const create = useCreateIncidente()
  const cambiarEstado = useCambiarEstadoIncidente()

  const onSubmit = async (values: IncidenteFormValues) => {
    try {
      await create.mutateAsync(values)
      const generaAlerta = values.gravedad === 'grave' || values.gravedad === 'critico'
      toast({ title: 'Incidente registrado', description: generaAlerta ? 'Se generó automáticamente una alerta.' : undefined, variant: 'success' })
      setOpen(false)
    } catch (e) {
      toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' })
    }
  }

  const onAvanzarEstado = async (incidente: Incidente) => {
    if (incidente.estado === 'en_seguimiento') {
      setAcciones(incidente.acciones_tomadas ?? '')
      setACerrar(incidente)
      return
    }
    try {
      await cambiarEstado.mutateAsync({ id: incidente.id, legajoId, estado: 'en_seguimiento' })
      toast({ title: 'Incidente en seguimiento', variant: 'success' })
    } catch (e) {
      toast({ title: 'No se pudo actualizar el incidente', description: (e as Error).message, variant: 'destructive' })
    }
  }

  const onCerrar = async () => {
    if (!aCerrar) return
    if (!acciones.trim()) {
      toast({ title: 'Faltan las acciones tomadas', description: 'Registrá qué se hizo antes de cerrar el incidente.', variant: 'destructive' })
      return
    }
    try {
      await cambiarEstado.mutateAsync({ id: aCerrar.id, legajoId, estado: 'cerrado', accionesTomadas: acciones.trim() })
      toast({ title: 'Incidente cerrado', variant: 'success' })
      setACerrar(null)
    } catch (e) {
      toast({ title: 'No se pudo cerrar el incidente', description: (e as Error).message, variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-4">
      {legajoActivo && (
        <div className="flex justify-end">
          <AccessGuard roles={['Admin', 'Equipo Tecnico']}>
            <Button size="sm" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />Registrar incidente
            </Button>
          </AccessGuard>
        </div>
      )}
      {isLoading
        ? <p className="text-sm text-slate-400 py-4 text-center">Cargando...</p>
        : <IncidenteList incidentes={incidentes} onAvanzarEstado={legajoActivo ? onAvanzarEstado : undefined} />}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Registrar incidente</DialogTitle></DialogHeader>
          <IncidenteForm legajoId={legajoId} nnyaId={nnyaId} onSubmit={onSubmit} onCancel={() => setOpen(false)} loading={create.isPending} />
        </DialogContent>
      </Dialog>
      <Dialog open={!!aCerrar} onOpenChange={(abierto) => { if (!abierto) setACerrar(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Cerrar incidente</DialogTitle></DialogHeader>
          <div className="space-y-2 pt-2">
            <label htmlFor="acciones-cierre" className="text-sm font-medium text-slate-700">Acciones tomadas</label>
            <Textarea
              id="acciones-cierre"
              value={acciones}
              onChange={(e) => setAcciones(e.target.value)}
              rows={4}
              placeholder="Qué se hizo para resolver el incidente..."
            />
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" onClick={() => setACerrar(null)}>Cancelar</Button>
            <Button type="button" onClick={onCerrar} disabled={cambiarEstado.isPending}>
              {cambiarEstado.isPending ? 'Cerrando...' : 'Cerrar incidente'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
