'use client'

import { useState } from 'react'
import { AccessGuard } from '@/components/shared/AccessGuard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'

export function DiditReviewQueue() {
  const [motivo, setMotivo] = useState('')
  const [resultadoDemo, setResultadoDemo] = useState('')

  return (
    <AccessGuard
      roles={['Admin']}
      fallback={
        <p className="rounded-md border border-outline-variant p-4 text-sm text-on-surface-variant">
          La lista de revisión y las acciones manuales están disponibles exclusivamente para Admin.
        </p>
      }
    >
      <section aria-labelledby="didit-review-title">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle id="didit-review-title" className="text-base">
                Sesiones que requieren revisión
              </CardTitle>
              <Badge variant="warning">Solo Admin · endpoint pendiente</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-on-surface-variant">
              «Requiere revisión» se genera al agotar los tres intentos. Aquí se mostrarán tutor/referente,
              DNI, fecha y motivo. La fila siguiente es ficticia y permite recorrer visualmente las acciones;
              el endpoint de consulta todavía no existe.
            </p>
            <div className="overflow-x-auto rounded-lg border border-outline-variant">
              <table className="w-full min-w-[36rem] text-left text-sm">
                <thead className="bg-surface-container-low text-on-surface-variant">
                  <tr>
                    <th className="p-3 font-medium">Tutor / referente</th>
                    <th className="p-3 font-medium">DNI</th>
                    <th className="p-3 font-medium">Fecha</th>
                    <th className="p-3 font-medium">Motivo</th>
                    <th className="p-3 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-3">
                      <span className="block font-medium text-on-surface">Referente ficticio</span>
                      <Badge variant="info">Ejemplo de revisión</Badge>
                    </td>
                    <td className="p-3 text-on-surface-variant">••••••••</td>
                    <td className="p-3 text-on-surface-variant">Fecha de ejemplo</td>
                    <td className="p-3 text-on-surface-variant">
                      Tres intentos agotados (motivo ficticio)
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col items-start gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setResultadoDemo('Aprobación de ejemplo; no se modificó ningún vínculo.')}
                        >
                          Aprobar
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setResultadoDemo('Rechazo de ejemplo; no se modificó ningún registro.')}
                        >
                          Rechazar
                        </Button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="space-y-3 rounded-lg border border-outline-variant p-4">
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-on-surface">Motivo obligatorio para fallback manual</span>
                <Textarea
                  value={motivo}
                  onChange={(event) => setMotivo(event.target.value)}
                  placeholder="Escribí el motivo del fallback de ejemplo"
                  required
                  rows={2}
                />
              </label>
              <Button
                type="button"
                disabled={!motivo.trim()}
                onClick={() => setResultadoDemo('Fallback manual de ejemplo; no se realizó una verificación real.')}
              >
                Aplicar fallback manual — ejemplo
              </Button>
            </div>
            {resultadoDemo && (
              <p className="rounded-md bg-surface-container-low p-3 text-sm text-on-surface" role="status">
                {resultadoDemo}
              </p>
            )}
            <p className="text-xs text-on-surface-variant">
              Acciones simuladas solo para revisar el diseño. No se cambia un vínculo ni un estado y no se escribe
              en backend/audit log. En producción, el endpoint también debe verificar el rol Admin y exigir el motivo.
            </p>
          </CardContent>
        </Card>
      </section>
    </AccessGuard>
  )
}
