'use client'

import { useState } from 'react'
import { AccessGuard } from '@/components/shared/AccessGuard'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus } from 'lucide-react'
import { usePropuestasMejora } from '@/hooks/propuestas-mejora/usePropuestasMejora'
import { useCreatePropuestaMejora } from '@/hooks/propuestas-mejora/useCreatePropuestaMejora'
import { PropuestaMejoraForm } from '@/components/entities/propuestas-mejora/PropuestaMejoraForm'
import { PropuestasKanban } from '@/components/entities/propuestas-mejora/PropuestasKanban'
import { toast } from '@/components/ui/toaster'
import type { PropuestaMejoraFormValues } from '@/lib/validations/propuesta-mejora.schema'

export default function PropuestasMejoraPage() {
  const { data: propuestas = [], isLoading } = usePropuestasMejora()
  const crear = useCreatePropuestaMejora()
  const [open, setOpen] = useState(false)

  const onSubmit = async (values: PropuestaMejoraFormValues) => {
    try {
      await crear.mutateAsync(values)
      toast({ title: 'Propuesta creada', variant: 'success' })
      setOpen(false)
    } catch (e: any) {
      toast({ title: 'Error al guardar', description: e.message, variant: 'destructive' })
    }
  }

  return (
    <AccessGuard
      roles={['Admin', 'Equipo Tecnico']}
      fallback={<div className="p-8 text-on-surface-variant">Sin acceso</div>}
    >
      <div className="px-8 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-title font-semibold text-on-surface">Propuestas de Mejora</h1>
            <p className="text-sm text-on-surface-variant">{propuestas.length} propuestas</p>
          </div>
          <AccessGuard roles={['Admin']}>
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva propuesta
            </Button>
          </AccessGuard>
        </div>

        {isLoading ? (
          <p className="text-sm text-outline py-4 text-center">Cargando...</p>
        ) : (
          <PropuestasKanban propuestas={propuestas} />
        )}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>Nueva propuesta de mejora</DialogTitle></DialogHeader>
            <PropuestaMejoraForm onSubmit={onSubmit} onCancel={() => setOpen(false)} loading={crear.isPending} />
          </DialogContent>
        </Dialog>
      </div>
    </AccessGuard>
  )
}
