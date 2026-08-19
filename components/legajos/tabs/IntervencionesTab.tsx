'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AccessGuard } from '@/components/shared/AccessGuard'
import { IntervencionList } from '@/components/entities/intervenciones/IntervencionList'
import { IntervencionForm } from '@/components/entities/intervenciones/IntervencionForm'
import { useIntervencionesByNnya } from '@/hooks/intervenciones/useIntervencionesByNnya'
import { useCreateIntervencion } from '@/hooks/intervenciones/useCreateIntervencion'
import { useUpdateIntervencion } from '@/hooks/intervenciones/useUpdateIntervencion'
import { toast } from '@/components/ui/toaster'
import type { IntervencionFormValues } from '@/lib/validations/intervenciones.schema'
import type { Intervencion } from '@/types/database.types'

interface IntervencionesTabProps { nnyaId: string; legajoActivo: boolean }

export function IntervencionesTab({ nnyaId, legajoActivo }: IntervencionesTabProps) {
  const [open, setOpen] = useState(false)
  const [editando, setEditando] = useState<Intervencion | null>(null)
  const { data: intervenciones = [], isLoading } = useIntervencionesByNnya(nnyaId)
  const create = useCreateIntervencion()
  const update = useUpdateIntervencion()

  const onCrear = async (values: IntervencionFormValues) => {
    try {
      await create.mutateAsync(values)
      toast({ title: 'Intervención registrada', variant: 'success' })
      setOpen(false)
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    }
  }

  const onEditar = async (values: IntervencionFormValues) => {
    if (!editando) return
    try {
      await update.mutateAsync({ id: editando.id, values })
      toast({ title: 'Intervención actualizada', variant: 'success' })
      setEditando(null)
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
              <Plus className="h-4 w-4 mr-1" />Registrar intervención
            </Button>
          </AccessGuard>
        </div>
      )}
      {isLoading ? (
        <p className="text-sm text-on-surface-variant py-4 text-center">Cargando...</p>
      ) : (
        <IntervencionList intervenciones={intervenciones} onEdit={setEditando} />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Registrar intervención</DialogTitle></DialogHeader>
          <IntervencionForm nnyaId={nnyaId} onSubmit={onCrear} onCancel={() => setOpen(false)} loading={create.isPending} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editando} onOpenChange={(o) => !o && setEditando(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Editar intervención</DialogTitle></DialogHeader>
          {editando && (
            <IntervencionForm
              nnyaId={nnyaId}
              initialData={editando}
              onSubmit={onEditar}
              onCancel={() => setEditando(null)}
              loading={update.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
