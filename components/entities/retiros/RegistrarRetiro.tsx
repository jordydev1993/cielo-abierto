'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useNnyas } from '@/hooks/nnya/useNnyas'
import { esAutorizacionVigente, useAutorizacionesByNnya } from '@/hooks/autorizaciones-retiro/useAutorizacionesByNnya'
import { useCreateRetiro } from '@/hooks/retiros/useCreateRetiro'
import { useRetiros } from '@/hooks/retiros/useRetiros'
import { MENSAJES_DIDIT } from '@/lib/didit/mensajes'
import { iniciarRetiroSchema } from '@/lib/validations/retiros.schema'
import { RetiroEnCurso } from './RetiroEnCurso'
import { mensajeError } from './mensajeError'

const fecha = (iso: string | null) => (iso ? format(new Date(iso), 'dd/MM/yyyy') : 'sin fecha de fin')

// "Registrar retiro" (Plan 035 §8.1): NNyA → tutor con autorización vigente (RF02, RN-01)
// → el retiro sigue en RetiroEnCurso (consentimiento, verificación, registro y cierre).
export function RegistrarRetiro({ sandbox }: { sandbox: boolean }) {
  const { data: nnyas } = useNnyas(true)
  const [nnyaId, setNnyaId] = useState('')
  const [autorizacionId, setAutorizacionId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [retiroId, setRetiroId] = useState<string | null>(null)

  const { data: autorizaciones, isLoading } = useAutorizacionesByNnya(nnyaId)
  const vigentes = (autorizaciones ?? []).filter((a) => esAutorizacionVigente(a))
  const crear = useCreateRetiro()
  const { data: retiros } = useRetiros()
  const retiro = retiros?.find((r) => r.id === retiroId)

  const iniciar = async () => {
    setError(null)
    const parsed = iniciarRetiroSchema.safeParse({ nnya_id: nnyaId, autorizacion_retiro_id: autorizacionId })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? null)
      return
    }
    const autorizacion = vigentes.find((a) => a.id === autorizacionId)
    if (!autorizacion) return
    try {
      const nuevo = await crear.mutateAsync(autorizacion)
      setRetiroId(nuevo.id)
    } catch (e) {
      // La base rechaza una autorización que dejó de estar vigente (RN-01): mensaje B.
      setError(`${MENSAJES_DIDIT.IDENTITY_VERIFIED_NOT_AUTHORIZED} ${mensajeError(e, '')}`.trim())
    }
  }

  const reiniciar = () => {
    setRetiroId(null)
    setNnyaId('')
    setAutorizacionId('')
    setError(null)
  }

  if (retiroId) {
    return (
      <div className="space-y-4">
        {retiro ? <RetiroEnCurso retiro={retiro} sandbox={sandbox} /> : <p className="text-sm">Cargando el retiro…</p>}
        <Button type="button" variant="outline" onClick={reiniciar}>Registrar otro retiro</Button>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Registrar retiro</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <label className="block max-w-xl space-y-1.5">
          <span className="text-sm font-medium text-on-surface">1. NNyA <span className="text-error">*</span></span>
          <select
            value={nnyaId}
            onChange={(e) => {
              setNnyaId(e.target.value)
              setAutorizacionId('')
            }}
            className="h-10 w-full rounded-md border border-outline-variant bg-surface-container-low px-3 text-sm text-on-surface"
          >
            <option value="">Seleccionar…</option>
            {(nnyas ?? []).map((n) => (
              <option key={n.id} value={n.id}>{n.apellido}, {n.nombre}</option>
            ))}
          </select>
        </label>

        {nnyaId && (
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-on-surface">
              2. Tutor con autorización vigente <span className="text-error">*</span>
            </legend>
            {isLoading ? (
              <p className="text-sm text-on-surface-variant">Cargando autorizaciones…</p>
            ) : vigentes.length === 0 ? (
              <p className="text-sm text-on-surface-variant">
                Este NNyA no tiene tutores con autorización de retiro vigente. La carga Dirección, en la
                pestaña Autorizaciones.
              </p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {vigentes.map((a) => {
                  const tutor = a.nnya_tutores?.tutores
                  return (
                    <label key={a.id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-outline-variant p-4">
                      <input
                        type="radio"
                        name="autorizacion-retiro"
                        value={a.id}
                        checked={autorizacionId === a.id}
                        onChange={() => setAutorizacionId(a.id)}
                      />
                      <span className="min-w-0 space-y-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-on-surface">
                            {tutor ? `${tutor.apellido}, ${tutor.nombre}` : 'Tutor'}
                          </span>
                          <Badge variant="success">Vigente</Badge>
                        </span>
                        {tutor && (
                          <span className="block text-sm text-on-surface-variant">
                            {tutor.parentesco} · DNI {tutor.dni}
                          </span>
                        )}
                        <span className="block text-xs text-on-surface-variant">
                          Vigencia: {fecha(a.vigente_desde)} al {fecha(a.vigente_hasta)}
                        </span>
                        <span className="block text-xs text-on-surface-variant">
                          Restricciones: {a.restricciones || 'sin restricciones'}
                        </span>
                      </span>
                    </label>
                  )
                })}
              </div>
            )}
          </fieldset>
        )}

        {error && <p className="text-sm text-error" role="alert">{error}</p>}

        <Button type="button" onClick={iniciar} disabled={crear.isPending}>
          {crear.isPending ? 'Iniciando…' : 'Iniciar retiro'}
        </Button>
      </CardContent>
    </Card>
  )
}
