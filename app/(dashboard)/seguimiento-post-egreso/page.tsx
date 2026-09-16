'use client'

import { useState } from 'react'
import { AccessGuard } from '@/components/shared/AccessGuard'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useSeguimientosPostEgreso } from '@/hooks/seguimiento-post-egreso/useSeguimientosPostEgreso'
import { useUpdateSeguimiento } from '@/hooks/seguimiento-post-egreso/useUpdateSeguimiento'
import { useCurrentUsuario } from '@/hooks/usuarios/useCurrentUsuario'
import { SeguimientoList } from '@/components/entities/seguimiento-post-egreso/SeguimientoList'
import { SeguimientoForm } from '@/components/entities/seguimiento-post-egreso/SeguimientoForm'
import { ReinsercionResumen } from '@/components/entities/seguimiento-post-egreso/ReinsercionResumen'
import { toast } from '@/components/ui/toaster'
import type { SeguimientoPostEgreso } from '@/types/database.types'
import type { SeguimientoPostEgresoFormValues } from '@/lib/validations/seguimiento-post-egreso.schema'

export default function SeguimientoPostEgresoPage() {
  const { data: seguimientos = [], isLoading } = useSeguimientosPostEgreso()
  const { data: miUsuario } = useCurrentUsuario()
  const actualizar = useUpdateSeguimiento()
  const [registrando, setRegistrando] = useState<SeguimientoPostEgreso | null>(null)

  const onSubmit = async (values: SeguimientoPostEgresoFormValues) => {
    if (!registrando || !miUsuario) return
    try {
      await actualizar.mutateAsync({
        id: registrando.id,
        contactadoPorActual: registrando.contactado_por,
        miUsuarioId: miUsuario.id,
        values,
      })
      toast({ title: 'Contacto registrado', variant: 'success' })
      setRegistrando(null)
    } catch (e: any) {
      toast({ title: 'Error al guardar', description: e.message, variant: 'destructive' })
    }
  }

  return (
    <AccessGuard
      roles={['Admin', 'Equipo Tecnico']}
      fallback={<div className="p-8 text-slate-500">Sin acceso</div>}
    >
      <div className="p-6 space-y-5">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Seguimiento Post-Egreso</h1>
          <p className="text-sm text-slate-500">{seguimientos.length} seguimientos (30/60 días)</p>
        </div>

        <ReinsercionResumen seguimientos={seguimientos} />

        {isLoading ? (
          <p className="text-sm text-slate-400 py-8 text-center">Cargando...</p>
        ) : (
          <SeguimientoList seguimientos={seguimientos} onRegistrar={(s) => setRegistrando(s)} />
        )}

        <Dialog open={!!registrando} onOpenChange={(o) => !o && setRegistrando(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>Registrar contacto</DialogTitle></DialogHeader>
            {registrando && (
              <SeguimientoForm
                initialData={registrando}
                onSubmit={onSubmit}
                onCancel={() => setRegistrando(null)}
                loading={actualizar.isPending}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AccessGuard>
  )
}
