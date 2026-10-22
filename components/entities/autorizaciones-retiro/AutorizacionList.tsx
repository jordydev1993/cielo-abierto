'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/toaster'
import { useNnyas } from '@/hooks/nnya/useNnyas'
import { useNnyaTutores } from '@/hooks/nnya_tutores/useNnyaTutores'
import { esAutorizacionVigente, useAutorizacionesByNnya } from '@/hooks/autorizaciones-retiro/useAutorizacionesByNnya'
import { useCreateAutorizacion } from '@/hooks/autorizaciones-retiro/useCreateAutorizacion'
import { useRevocarAutorizacion } from '@/hooks/autorizaciones-retiro/useRevocarAutorizacion'
import type { AutorizacionRetiroValues } from '@/lib/validations/autorizaciones-retiro.schema'
import { mensajeError } from '@/components/entities/retiros/mensajeError'
import { AutorizacionForm } from './AutorizacionForm'

const fecha = (iso: string | null) => (iso ? format(new Date(iso), 'dd/MM/yyyy') : '—')

// Quién puede retirar a cada NNyA (RF02, RN-01). Solo Admin: la base (RLS) solo deja
// cargar y revocar a Admin. Revocar no borra: queda el historial de autorizaciones.
export function AutorizacionList() {
  const { data: nnyas } = useNnyas(true)
  const [nnyaId, setNnyaId] = useState('')
  const { data: vinculos } = useNnyaTutores(nnyaId)
  const { data: autorizaciones } = useAutorizacionesByNnya(nnyaId)
  const crear = useCreateAutorizacion()
  const revocar = useRevocarAutorizacion()

  const agregar = async (values: AutorizacionRetiroValues) => {
    try {
      await crear.mutateAsync(values)
      toast({ title: 'Autorización agregada', variant: 'success' })
      return true
    } catch (e) {
      toast({ title: 'No se pudo agregar la autorización', description: mensajeError(e), variant: 'destructive' })
      return false
    }
  }

  const onRevocar = async (id: string) => {
    try {
      await revocar.mutateAsync(id)
      toast({ title: 'Autorización revocada', variant: 'success' })
    } catch (e) {
      toast({ title: 'No se pudo revocar', description: mensajeError(e), variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-4">
      <label className="block max-w-xl space-y-1.5">
        <span className="text-sm font-medium text-on-surface">NNyA</span>
        <select
          value={nnyaId}
          onChange={(e) => setNnyaId(e.target.value)}
          className="h-10 w-full rounded-md border border-outline-variant bg-surface-container-low px-3 text-sm text-on-surface"
        >
          <option value="">Seleccionar…</option>
          {(nnyas ?? []).map((n) => (
            <option key={n.id} value={n.id}>{n.apellido}, {n.nombre}</option>
          ))}
        </select>
      </label>

      {nnyaId && (
        <>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Autorizaciones</CardTitle>
            </CardHeader>
            <CardContent>
              {(autorizaciones ?? []).length === 0 ? (
                <p className="text-sm text-on-surface-variant">Este NNyA no tiene autorizaciones de retiro.</p>
              ) : (
                <ul className="divide-y divide-outline-variant">
                  {(autorizaciones ?? []).map((a) => {
                    const tutor = a.nnya_tutores?.tutores
                    const vigente = esAutorizacionVigente(a)
                    return (
                      <li key={a.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-on-surface">
                            {tutor ? `${tutor.apellido}, ${tutor.nombre}` : 'Tutor'}
                            <Badge variant={vigente ? 'success' : 'outline'}>
                              {a.estado === 'revocada' ? 'Revocada' : vigente ? 'Vigente' : 'Fuera de vigencia'}
                            </Badge>
                          </div>
                          <p className="text-xs text-on-surface-variant">
                            {fecha(a.vigente_desde)} al {a.vigente_hasta ? fecha(a.vigente_hasta) : 'sin fecha de fin'} ·
                            Restricciones: {a.restricciones || 'sin restricciones'}
                          </p>
                        </div>
                        {a.estado === 'vigente' && (
                          <Button type="button" variant="outline" size="sm" onClick={() => onRevocar(a.id)} disabled={revocar.isPending}>
                            Revocar
                          </Button>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Nueva autorización</CardTitle>
            </CardHeader>
            <CardContent>
              {(vinculos ?? []).length === 0 ? (
                <p className="text-sm text-on-surface-variant">
                  Este NNyA no tiene tutores vinculados. Vincule al tutor desde la edición del NNyA antes de
                  autorizarlo.
                </p>
              ) : (
                <AutorizacionForm vinculos={vinculos ?? []} onSubmit={agregar} loading={crear.isPending} />
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
