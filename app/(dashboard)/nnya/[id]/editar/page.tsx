'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AccessGuard } from '@/components/shared/AccessGuard'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { ChevronLeft, UserPlus, Trash2 } from 'lucide-react'
import { useNnya } from '@/hooks/nnya/useNnya'
import { useUpdateNnya } from '@/hooks/nnya/useUpdateNnya'
import { NnyaForm } from '@/components/entities/nnya/NnyaForm'
import { useNnyaTutores } from '@/hooks/nnya_tutores/useNnyaTutores'
import { useAsignarTutor } from '@/hooks/nnya_tutores/useAsignarTutor'
import { useDesasignarTutor } from '@/hooks/nnya_tutores/useDesasignarTutor'
import { useTutores } from '@/hooks/tutores/useTutores'
import { toast } from '@/components/ui/toaster'
import type { NnyaFormValues } from '@/lib/validations/nnya.schema'
import type { NnyaTutor } from '@/types/database.types'

export default function EditarNnyaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { data: nnya, isLoading } = useNnya(id)
  const mutation = useUpdateNnya()

  const { data: nnyaTutores = [] } = useNnyaTutores(id)
  const { data: todosTutores = [] } = useTutores()
  const asignar = useAsignarTutor()
  const desasignar = useDesasignarTutor()

  const [tutorSeleccionado, setTutorSeleccionado] = useState('')
  const [esPrincipal, setEsPrincipal] = useState(false)
  const [toQuitar, setToQuitar] = useState<NnyaTutor | null>(null)

  const handleSubmit = async (values: NnyaFormValues) => {
    try {
      await mutation.mutateAsync({ id, values })
      toast({ title: 'NNyA actualizado', variant: 'success' })
      router.push('/nnya')
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    }
  }

  const handleAsignar = async () => {
    if (!tutorSeleccionado) return
    try {
      await asignar.mutateAsync({ nnya_id: id, tutor_id: tutorSeleccionado, es_principal: esPrincipal })
      toast({ title: 'Tutor asignado', variant: 'success' })
      setTutorSeleccionado('')
      setEsPrincipal(false)
    } catch (e: any) {
      const msg = e.message?.includes('duplicate') ? 'Este tutor ya está asignado' : e.message
      toast({ title: 'Error', description: msg, variant: 'destructive' })
    }
  }

  const handleDesasignar = async () => {
    if (!toQuitar) return
    try {
      await desasignar.mutateAsync({ pivotId: toQuitar.id, nnyaId: id })
      toast({ title: 'Tutor desvinculado', variant: 'success' })
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    } finally {
      setToQuitar(null)
    }
  }

  const asignadosIds = new Set(nnyaTutores.map((nt) => nt.tutor_id))
  const disponibles = todosTutores.filter((t) => !asignadosIds.has(t.id))

  if (isLoading) return <div className="p-8 text-slate-500">Cargando...</div>
  if (!nnya) return <div className="p-8 text-slate-500">NNyA no encontrado</div>

  return (
    <AccessGuard roles={['Admin', 'Equipo Tecnico']} fallback={<div className="p-8 text-slate-500">Sin acceso</div>}>
      <div className="p-6 max-w-3xl space-y-8">
        <div>
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="-ml-2 mb-4">
            <ChevronLeft className="h-4 w-4 mr-1" />Volver
          </Button>
          <h1 className="text-xl font-semibold text-slate-900 mb-6">
            Editar — {nnya.apellido}, {nnya.nombre}
          </h1>
          <NnyaForm initialData={nnya} onSubmit={handleSubmit} loading={mutation.isPending} />
        </div>

        {/* Sección tutores */}
        <div className="border-t border-slate-200 pt-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Tutores asociados</h2>

          {nnyaTutores.length === 0 ? (
            <p className="text-sm text-slate-400 mb-4">Sin tutores asignados</p>
          ) : (
            <ul className="space-y-2 mb-4">
              {nnyaTutores.map((nt) => {
                const tutor = nt.tutores as any
                return (
                  <li key={nt.id} className="flex items-center justify-between bg-slate-50 rounded-md px-3 py-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-slate-800">
                        {tutor?.apellido}, {tutor?.nombre}
                      </span>
                      <span className="text-slate-500">— {tutor?.parentesco}</span>
                      {nt.es_principal && <Badge variant="success" className="text-xs">Principal</Badge>}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 w-7 p-0"
                      onClick={() => setToQuitar(nt)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                )
              })}
            </ul>
          )}

          {disponibles.length > 0 && (
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-600 mb-1">Agregar tutor</label>
                <Select value={tutorSeleccionado} onValueChange={setTutorSeleccionado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tutor..." />
                  </SelectTrigger>
                  <SelectContent>
                    {disponibles.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.apellido}, {t.nombre} — {t.parentesco}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <label className="flex items-center gap-1.5 text-sm text-slate-600 pb-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={esPrincipal}
                  onChange={(e) => setEsPrincipal(e.target.checked)}
                  className="rounded"
                />
                Principal
              </label>
              <Button
                onClick={handleAsignar}
                disabled={!tutorSeleccionado || asignar.isPending}
                className="pb-2"
              >
                <UserPlus className="h-4 w-4 mr-1.5" />
                Asignar
              </Button>
            </div>
          )}
        </div>

        <ConfirmDialog
          open={!!toQuitar}
          onOpenChange={(o) => !o && setToQuitar(null)}
          title="¿Desvincular tutor?"
          description={`Se quitará a ${(toQuitar?.tutores as any)?.nombre} ${(toQuitar?.tutores as any)?.apellido} de este NNyA.`}
          confirmLabel="Desvincular"
          loading={desasignar.isPending}
          onConfirm={handleDesasignar}
        />
      </div>
    </AccessGuard>
  )
}
