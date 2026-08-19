'use client'

import { useState } from 'react'
import { AccessGuard } from '@/components/shared/AccessGuard'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ActividadForm } from '@/components/entities/actividades/ActividadForm'
import { ActividadList } from '@/components/entities/actividades/ActividadList'
import { useActividades } from '@/hooks/actividades/useActividades'
import { useCreateActividad } from '@/hooks/actividades/useCreateActividad'
import { useActualizarEstadoActividad } from '@/hooks/actividades/useActualizarEstadoActividad'
import { useNnyas } from '@/hooks/nnya/useNnyas'
import { toast } from '@/components/ui/toaster'
import type { ActividadFormValues } from '@/lib/validations/actividades.schema'
import type { Actividad } from '@/types/database.types'

export default function ActividadesPage() {
  const [open, setOpen] = useState(false)
  const { data: actividades = [], isLoading } = useActividades()
  const { data: nnyas = [] } = useNnyas()
  const create = useCreateActividad()
  const actualizarEstado = useActualizarEstadoActividad()

  const onCrear = async (values: ActividadFormValues) => {
    try {
      await create.mutateAsync(values)
      toast({ title: 'Actividad registrada', variant: 'success' })
      setOpen(false)
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    }
  }

  const onCambiarEstado = async (actividad: Actividad, estado: Actividad['estado']) => {
    try {
      await actualizarEstado.mutateAsync({ id: actividad.id, estado })
      toast({ title: 'Estado actualizado', variant: 'success' })
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    }
  }

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-on-surface">Actividades</h1>
          <p className="text-sm text-on-surface-variant">{actividades.length} actividades registradas</p>
        </div>
        <AccessGuard roles={['Admin', 'Equipo Tecnico']}>
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />Nueva actividad
          </Button>
        </AccessGuard>
      </div>

      {isLoading ? (
        <p className="text-sm text-on-surface-variant py-8 text-center">Cargando...</p>
      ) : (
        <ActividadList
          actividades={actividades}
          nnyas={nnyas}
          onCambiarEstado={onCambiarEstado}
          loadingId={actualizarEstado.isPending ? actualizarEstado.variables?.id : undefined}
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Nueva actividad</DialogTitle></DialogHeader>
          <ActividadForm onSubmit={onCrear} onCancel={() => setOpen(false)} loading={create.isPending} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
