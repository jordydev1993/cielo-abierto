'use client'

import { useState } from 'react'
import { AccessGuard } from '@/components/shared/AccessGuard'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus } from 'lucide-react'
import { useTurnosPersonal } from '@/hooks/turnos-personal/useTurnosPersonal'
import { useCreateTurnoPersonal } from '@/hooks/turnos-personal/useCreateTurnoPersonal'
import { useUpdateTurnoPersonal } from '@/hooks/turnos-personal/useUpdateTurnoPersonal'
import { useEntregarTurno } from '@/hooks/turnos-personal/useEntregarTurno'
import { useRecibirTurno } from '@/hooks/turnos-personal/useRecibirTurno'
import { useCurrentUsuario } from '@/hooks/usuarios/useCurrentUsuario'
import { TurnoPersonalForm } from '@/components/entities/turnos-personal/TurnoPersonalForm'
import { EntregaTurnoForm } from '@/components/entities/turnos-personal/EntregaTurnoForm'
import { TurnoPersonalList } from '@/components/entities/turnos-personal/TurnoPersonalList'
import { CoberturaResumen } from '@/components/entities/turnos-personal/CoberturaResumen'
import { toast } from '@/components/ui/toaster'
import type { TurnoPersonal } from '@/types/database.types'
import type { TurnoPersonalFormValues } from '@/lib/validations/turno-personal.schema'
import type { EntregaTurnoFormValues } from '@/lib/validations/entrega-turno.schema'

export default function TurnosPersonalPage() {
  const { data: turnos = [], isLoading } = useTurnosPersonal()
  const { data: miUsuario } = useCurrentUsuario()
  const crear = useCreateTurnoPersonal()
  const actualizar = useUpdateTurnoPersonal()
  const entregar = useEntregarTurno()
  const recibir = useRecibirTurno()

  const [openForm, setOpenForm] = useState(false)
  const [editando, setEditando] = useState<TurnoPersonal | null>(null)
  const [entregando, setEntregando] = useState<TurnoPersonal | null>(null)
  const [recibiendo, setRecibiendo] = useState<TurnoPersonal | null>(null)

  const onSubmitForm = async (values: TurnoPersonalFormValues) => {
    try {
      if (editando) {
        await actualizar.mutateAsync({ id: editando.id, values })
        toast({ title: 'Turno actualizado', variant: 'success' })
      } else {
        await crear.mutateAsync(values)
        toast({ title: 'Turno asignado', variant: 'success' })
      }
      setOpenForm(false)
      setEditando(null)
    } catch (e: any) {
      toast({ title: 'Error al guardar', description: e.message, variant: 'destructive' })
    }
  }

  const onEntregar = async (values: EntregaTurnoFormValues) => {
    if (!entregando || !miUsuario) return
    try {
      await entregar.mutateAsync({ id: entregando.id, miUsuarioId: miUsuario.id, values })
      toast({ title: 'Turno entregado', variant: 'success' })
      setEntregando(null)
    } catch (e: any) {
      toast({ title: 'Error al entregar el turno', description: e.message, variant: 'destructive' })
    }
  }

  const onRecibir = async () => {
    if (!recibiendo || !miUsuario) return
    try {
      await recibir.mutateAsync({ id: recibiendo.id, miUsuarioId: miUsuario.id })
      toast({ title: 'Turno recibido', variant: 'success' })
      setRecibiendo(null)
    } catch (e: any) {
      toast({ title: 'Error al recibir el turno', description: e.message, variant: 'destructive' })
    }
  }

  return (
    <AccessGuard
      roles={['Admin', 'Equipo Tecnico']}
      fallback={<div className="p-8 text-slate-500">Sin acceso</div>}
    >
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Turnos de Personal</h1>
            <p className="text-sm text-slate-500">{turnos.length} turnos registrados</p>
          </div>
          <AccessGuard roles={['Admin']}>
            <Button onClick={() => { setEditando(null); setOpenForm(true) }}>
              <Plus className="h-4 w-4 mr-2" />
              Asignar turno
            </Button>
          </AccessGuard>
        </div>

        <CoberturaResumen turnos={turnos} />

        {isLoading ? (
          <p className="text-sm text-slate-400 py-8 text-center">Cargando...</p>
        ) : (
          <TurnoPersonalList
            turnos={turnos}
            miUsuarioId={miUsuario?.id}
            onEdit={(t) => { setEditando(t); setOpenForm(true) }}
            onEntregar={(t) => setEntregando(t)}
            onRecibir={(t) => setRecibiendo(t)}
          />
        )}

        <Dialog open={openForm} onOpenChange={(o) => { setOpenForm(o); if (!o) setEditando(null) }}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editando ? 'Editar turno' : 'Asignar turno'}</DialogTitle>
            </DialogHeader>
            <TurnoPersonalForm
              initialData={editando ?? undefined}
              onSubmit={onSubmitForm}
              onCancel={() => { setOpenForm(false); setEditando(null) }}
              loading={crear.isPending || actualizar.isPending}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={!!entregando} onOpenChange={(o) => !o && setEntregando(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>Entregar mi turno</DialogTitle></DialogHeader>
            <EntregaTurnoForm
              onSubmit={onEntregar}
              onCancel={() => setEntregando(null)}
              loading={entregar.isPending}
            />
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          open={!!recibiendo}
          onOpenChange={(o) => !o && setRecibiendo(null)}
          title="¿Recibir este turno?"
          description="Vas a quedar registrado como quien recibió el traspaso de este turno."
          confirmLabel="Recibir turno"
          variant="default"
          loading={recibir.isPending}
          onConfirm={onRecibir}
        />
      </div>
    </AccessGuard>
  )
}
