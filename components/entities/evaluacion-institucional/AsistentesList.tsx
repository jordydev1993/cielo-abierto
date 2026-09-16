'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AccessGuard } from '@/components/shared/AccessGuard'
import { Trash2, Plus } from 'lucide-react'
import { useUsuarios } from '@/hooks/usuarios/useUsuarios'
import { useAsistentesByEvaluacion } from '@/hooks/evaluacion-institucional/useAsistentesByEvaluacion'
import { useAddAsistente } from '@/hooks/evaluacion-institucional/useAddAsistente'
import { useToggleAsistio } from '@/hooks/evaluacion-institucional/useToggleAsistio'
import { useRemoveAsistente } from '@/hooks/evaluacion-institucional/useRemoveAsistente'
import { toast } from '@/components/ui/toaster'

interface AsistentesListProps {
  evaluacionId: string
}

export function AsistentesList({ evaluacionId }: AsistentesListProps) {
  const { data: asistentes = [], isLoading } = useAsistentesByEvaluacion(evaluacionId)
  const { data: usuarios = [] } = useUsuarios()
  const addAsistente = useAddAsistente()
  const toggleAsistio = useToggleAsistio()
  const removeAsistente = useRemoveAsistente()
  const [nuevoUsuarioId, setNuevoUsuarioId] = useState('')

  const disponibles = usuarios.filter((u) => !asistentes.some((a) => a.usuario_id === u.id))

  const handleAdd = async () => {
    if (!nuevoUsuarioId) return
    try {
      await addAsistente.mutateAsync({ evaluacionId, usuarioId: nuevoUsuarioId })
      setNuevoUsuarioId('')
    } catch (e: any) {
      toast({ title: 'Error al agregar asistente', description: e.message, variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-3">
      <AccessGuard roles={['Admin']}>
        <div className="flex gap-2">
          <Select onValueChange={setNuevoUsuarioId} value={nuevoUsuarioId}>
            <SelectTrigger className="max-w-xs"><SelectValue placeholder="Agregar usuario..." /></SelectTrigger>
            <SelectContent>
              {disponibles.map((u) => (
                <SelectItem key={u.id} value={u.id}>{u.apellido}, {u.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={handleAdd} disabled={!nuevoUsuarioId || addAsistente.isPending}>
            <Plus className="h-4 w-4 mr-1" />Agregar
          </Button>
        </div>
      </AccessGuard>

      {isLoading ? (
        <p className="text-sm text-slate-400">Cargando...</p>
      ) : asistentes.length === 0 ? (
        <p className="text-sm text-slate-400 py-2">Sin asistentes convocados</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {asistentes.map((a) => {
            const u = (a as any).usuario
            return (
              <div key={a.id} className="flex items-center justify-between py-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={a.asistio}
                    onChange={(e) =>
                      toggleAsistio.mutate({ id: a.id, evaluacionId, asistio: e.target.checked })
                    }
                    className="h-4 w-4"
                  />
                  {u ? `${u.apellido}, ${u.nombre}` : '—'}
                </label>
                <AccessGuard roles={['Admin']}>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeAsistente.mutate({ id: a.id, evaluacionId })}
                    title="Quitar"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </AccessGuard>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
