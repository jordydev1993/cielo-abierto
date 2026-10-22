'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { useRetiros } from '@/hooks/retiros/useRetiros'
import type { Retiro } from '@/types/database.types'
import { EstadoRnf12Badge } from './EstadoRnf12Badge'
import { EstadoRetiroBadge, RetiroEnCurso } from './RetiroEnCurso'

const ultimaSesion = (r: Retiro) =>
  [...(r.sesiones_didit ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at))[0]

// Retiros en curso y recientes. Desde acá se retoma la verificación, se registra o se cierra.
export function RetiroList({ sandbox }: { sandbox: boolean }) {
  const { data: retiros, isLoading, error } = useRetiros()
  const [abierto, setAbierto] = useState<string | null>(null)
  const [soloEnCurso, setSoloEnCurso] = useState(true)

  if (isLoading) return <p className="text-sm text-on-surface-variant">Cargando retiros…</p>
  if (error) return <p className="text-sm text-error">No se pudieron cargar los retiros.</p>

  const lista = (retiros ?? []).filter((r) => !soloEnCurso || r.estado === 'en_curso' || r.estado === 'requiere_revision')
  const seleccionado = lista.find((r) => r.id === abierto)

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-2 text-sm text-on-surface">
        <input type="checkbox" checked={soloEnCurso} onChange={(e) => setSoloEnCurso(e.target.checked)} />
        Solo en curso y en revisión
      </label>

      {lista.length === 0 ? (
        <p className="text-sm text-on-surface-variant">No hay retiros para mostrar.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-outline-variant">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="bg-surface-container-low text-on-surface-variant">
              <tr>
                <th className="p-3 font-medium">Fecha</th>
                <th className="p-3 font-medium">NNyA</th>
                <th className="p-3 font-medium">Tutor</th>
                <th className="p-3 font-medium">Estado</th>
                <th className="p-3 font-medium">Identidad</th>
                <th className="p-3 font-medium"><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              {lista.map((r) => {
                const sesion = ultimaSesion(r)
                return (
                  <tr key={r.id} className="border-t border-outline-variant">
                    <td className="p-3">{format(new Date(r.created_at), 'dd/MM/yyyy HH:mm')}</td>
                    <td className="p-3">{r.nnya ? `${r.nnya.apellido}, ${r.nnya.nombre}` : '—'}</td>
                    <td className="p-3">{r.tutores ? `${r.tutores.apellido}, ${r.tutores.nombre}` : '—'}</td>
                    <td className="p-3"><EstadoRetiroBadge estado={r.estado} /></td>
                    <td className="p-3">
                      {r.metodo_verificacion === 'manual'
                        ? 'Manual'
                        : sesion
                          ? <EstadoRnf12Badge estado={sesion.estado_rnf12} />
                          : '—'}
                    </td>
                    <td className="p-3 text-right">
                      <Button type="button" variant="outline" size="sm" onClick={() => setAbierto(abierto === r.id ? null : r.id)}>
                        {abierto === r.id ? 'Cerrar' : 'Abrir'}
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {seleccionado && <RetiroEnCurso retiro={seleccionado} sandbox={sandbox} />}
    </div>
  )
}
