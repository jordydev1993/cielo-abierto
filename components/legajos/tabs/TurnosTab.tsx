'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AccessGuard } from '@/components/shared/AccessGuard'
import { TurnoList } from '@/components/entities/turnos/TurnoList'
import { TurnoForm } from '@/components/entities/turnos/TurnoForm'
import { useTurnosByLegajo } from '@/hooks/turnos/useTurnosByLegajo'
import { useCreateTurno } from '@/hooks/turnos/useCreateTurno'
import { toast } from '@/components/ui/toaster'
import type { TurnoFormValues } from '@/lib/validations/turnos.schema'

interface TurnosTabProps { legajoId: string; nnyaId: string; legajoActivo: boolean }

export function TurnosTab({ legajoId, nnyaId, legajoActivo }: TurnosTabProps) {
  const [open, setOpen] = useState(false)
  const { data: turnos = [], isLoading } = useTurnosByLegajo(legajoId)
  const create = useCreateTurno()

  const onSubmit = async (values: TurnoFormValues) => {
    try {
      await create.mutateAsync(values)
      toast({ title: 'Turno agendado', variant: 'success' })
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
              <Plus className="h-4 w-4 mr-1" />Agendar turno
            </Button>
          </AccessGuard>
        </div>
      )}
      {isLoading ? <p className="text-sm text-slate-400 py-4 text-center">Cargando...</p> : <TurnoList turnos={turnos} legajoId={legajoId} legajoActivo={legajoActivo} />}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Agendar turno</DialogTitle></DialogHeader>
          <TurnoForm legajoId={legajoId} nnyaId={nnyaId} onSubmit={onSubmit} onCancel={() => setOpen(false)} loading={create.isPending} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
