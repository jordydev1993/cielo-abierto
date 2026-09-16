'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AccessGuard } from '@/components/shared/AccessGuard'
import { VinculoTutelaList } from '@/components/entities/vinculos-tutela/VinculoTutelaList'
import { VinculoTutelaForm } from '@/components/entities/vinculos-tutela/VinculoTutelaForm'
import { TransferenciaAuhForm } from '@/components/entities/transferencia-auh/TransferenciaAuhForm'
import { useVinculosTutelaByNnya } from '@/hooks/vinculos-tutela/useVinculosTutelaByNnya'
import { useCreateVinculoTutela } from '@/hooks/vinculos-tutela/useCreateVinculoTutela'
import { useUpdateVinculoTutela } from '@/hooks/vinculos-tutela/useUpdateVinculoTutela'
import { toast } from '@/components/ui/toaster'
import type { VinculoTutela } from '@/types/database.types'
import type { VinculoTutelaFormValues } from '@/lib/validations/vinculos-tutela.schema'

interface TutelaTabProps {
  nnyaId: string
  legajoActivo: boolean
}

export function TutelaTab({ nnyaId, legajoActivo }: TutelaTabProps) {
  const { data: vinculos = [], isLoading } = useVinculosTutelaByNnya(nnyaId)
  const crear = useCreateVinculoTutela()
  const actualizar = useUpdateVinculoTutela()
  const [open, setOpen] = useState(false)
  const [editando, setEditando] = useState<VinculoTutela | null>(null)

  const vigente = vinculos.find((v) => v.estado === 'vigente')

  const onSubmit = async (values: VinculoTutelaFormValues) => {
    try {
      if (editando) {
        await actualizar.mutateAsync({ id: editando.id, nnyaId, values })
        toast({ title: 'Vínculo actualizado', variant: 'success' })
      } else {
        await crear.mutateAsync({ nnyaId, values })
        toast({ title: 'Vínculo creado', variant: 'success' })
      }
      setOpen(false)
      setEditando(null)
    } catch (e: any) {
      toast({ title: 'Error al guardar', description: e.message, variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-4">
      {legajoActivo && (
        <div className="flex justify-end">
          <AccessGuard roles={['Admin']}>
            <Button size="sm" onClick={() => { setEditando(null); setOpen(true) }}>
              <Plus className="h-4 w-4 mr-1" />Nuevo vínculo
            </Button>
          </AccessGuard>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-slate-400 py-4 text-center">Cargando...</p>
      ) : (
        <VinculoTutelaList
          vinculos={vinculos}
          onEdit={legajoActivo ? (v) => { setEditando(v); setOpen(true) } : undefined}
        />
      )}

      {vigente && (
        <TransferenciaAuhForm nnyaId={nnyaId} vinculoId={vigente.id} />
      )}

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditando(null) }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar vínculo de tutela' : 'Nuevo vínculo de tutela'}</DialogTitle>
          </DialogHeader>
          <VinculoTutelaForm
            initialData={editando ?? undefined}
            onSubmit={onSubmit}
            onCancel={() => { setOpen(false); setEditando(null) }}
            loading={crear.isPending || actualizar.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
