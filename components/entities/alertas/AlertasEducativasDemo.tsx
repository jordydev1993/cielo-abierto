'use client'

import { useId, useState, type FormEvent } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ALERTAS_EDUCATIVAS_DEMO } from './alertas-educativas-demo-data'

interface AusenciaDemo {
  id: number
  fecha: string
  motivo: string
  descripcion: string
}

export function AlertasEducativasDemo() {
  const formId = useId()
  const [ausencias, setAusencias] = useState<AusenciaDemo[]>([])
  const [fecha, setFecha] = useState('')
  const [motivo, setMotivo] = useState('')
  const [descripcion, setDescripcion] = useState('')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!fecha || !motivo.trim()) return

    setAusencias((anteriores) => [
      ...anteriores,
      {
        id: anteriores.length,
        fecha,
        motivo: motivo.trim(),
        descripcion: descripcion.trim(),
      },
    ])
    setFecha('')
    setMotivo('')
    setDescripcion('')
  }

  return (
    <section aria-labelledby="alertas-educativas-demo-title" className="border-t border-outline-variant pt-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle id="alertas-educativas-demo-title" className="text-base">
              Demostración de alertas educativas
            </CardTitle>
            <Badge variant="info">Datos de demostración</Badge>
          </div>
          <p className="text-sm text-on-surface-variant">
            Los ejemplos y registros de esta sección son ficticios, temporales y no se mezclan con las alertas reales.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-sm font-semibold text-on-surface">Cargar una ausencia de ejemplo</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor={`${formId}-fecha`} className="text-sm font-medium text-on-surface">
                  Fecha
                </label>
                <Input
                  id={`${formId}-fecha`}
                  name="fecha"
                  type="date"
                  value={fecha}
                  onChange={(event) => setFecha(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor={`${formId}-motivo`} className="text-sm font-medium text-on-surface">
                  Motivo
                </label>
                <Input
                  id={`${formId}-motivo`}
                  name="motivo"
                  value={motivo}
                  onChange={(event) => setMotivo(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label htmlFor={`${formId}-descripcion`} className="text-sm font-medium text-on-surface">
                  Descripción <span className="font-normal text-on-surface-variant">(opcional)</span>
                </label>
                <Textarea
                  id={`${formId}-descripcion`}
                  name="descripcion"
                  value={descripcion}
                  onChange={(event) => setDescripcion(event.target.value)}
                  rows={2}
                />
              </div>
            </div>
            <Button type="submit" disabled={!fecha || !motivo.trim()}>
              Agregar a esta demostración
            </Button>
          </form>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-on-surface">Ausencias cargadas en esta sesión</h3>
            {ausencias.length === 0 ? (
              <p className="text-sm text-on-surface-variant">Todavía no se cargaron ausencias de ejemplo.</p>
            ) : (
              <ul className="space-y-3">
                {ausencias.map((ausencia) => (
                  <li key={ausencia.id} className="rounded-lg border border-outline-variant p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <time dateTime={ausencia.fecha} className="text-sm font-medium text-on-surface">
                        {ausencia.fecha.split('-').reverse().join('/')}
                      </time>
                      <Badge variant="secondary">Ausencia de ejemplo</Badge>
                    </div>
                    <p className="mt-1 text-sm text-on-surface">{ausencia.motivo}</p>
                    {ausencia.descripcion && (
                      <p className="mt-1 text-sm text-on-surface-variant">{ausencia.descripcion}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-3 border-t border-outline-variant pt-5">
            <h3 className="text-sm font-semibold text-on-surface">Ejemplos ficticios de alertas educativas</h3>
            <ul className="grid grid-cols-1 gap-3">
              {ALERTAS_EDUCATIVAS_DEMO.map((alerta) => (
                <li key={alerta.id} className="rounded-lg bg-surface-container-low p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-on-surface">{alerta.tipo}</span>
                    <Badge variant="outline">{alerta.estado}</Badge>
                    <time dateTime={alerta.fecha} className="text-xs text-on-surface-variant">
                      {alerta.fecha.split('-').reverse().join('/')}
                    </time>
                  </div>
                  <p className="mt-1 text-sm text-on-surface-variant">{alerta.descripcion}</p>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
