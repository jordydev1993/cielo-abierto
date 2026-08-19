'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AccessGuard } from '@/components/shared/AccessGuard'
import { IncidenteList } from '@/components/entities/incidentes/IncidenteList'
import { IncidenteForm } from '@/components/entities/incidentes/IncidenteForm'
import { useIncidentesByLegajo } from '@/hooks/incidentes/useIncidentesByLegajo'
import { useCreateIncidente } from '@/hooks/incidentes/useCreateIncidente'
import { toast } from '@/components/ui/toaster'
import type { IncidenteFormValues } from '@/lib/validations/incidentes.schema'

interface IncidentesTabProps { legajoId: string; nnyaId: string; legajoActivo: boolean }

export function IncidentesTab({ legajoId, nnyaId, legajoActivo }: IncidentesTabProps) {
  const [open, setOpen] = useState(false)
  const { data: incidentes = [], isLoading } = useIncidentesByLegajo(legajoId)
  const create = useCreateIncidente()

  const onSubmit = async (values: IncidenteFormValues) => {
    try {
      await create.mutateAsync(values)
      const generaAlerta = values.gravedad === 'grave' || values.gravedad === 'critico'
      toast({ title: 'Incidente registrado', description: generaAlerta ? 'Se generó automáticamente una alerta.' : undefined, variant: 'success' })
      setOpen(false)
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
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
      {isLoading ? <p className="text-sm text-slate-400 py-4 text-center">Cargando...</p> : <IncidenteList incidentes={incidentes} />}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Registrar incidente</DialogTitle></DialogHeader>
          <IncidenteForm legajoId={legajoId} nnyaId={nnyaId} onSubmit={onSubmit} onCancel={() => setOpen(false)} loading={create.isPending} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
