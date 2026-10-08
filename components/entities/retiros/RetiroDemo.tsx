import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RETIRO_DEMO } from './demo-data'

export function RetiroDemo() {
  return (
    <section aria-labelledby="retiro-demo-title">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle id="retiro-demo-title" className="text-base">
              Registro de retiro
            </CardTitle>
            <Badge variant="info">Datos de demostración</Badge>
          </div>
          <p className="text-sm text-on-surface-variant">
            Registro ficticio de solo lectura; no crea ni cierra un retiro real.
          </p>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-on-surface-variant">Fecha</dt>
              <dd className="mt-1 text-sm font-medium text-on-surface">{RETIRO_DEMO.fecha}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-on-surface-variant">Estado</dt>
              <dd className="mt-1"><Badge variant="success">{RETIRO_DEMO.estado}</Badge></dd>
            </div>
            <div className="rounded-lg bg-surface-container-low p-3">
              <dt className="text-xs font-medium text-on-surface-variant">Hora de inicio</dt>
              <dd className="mt-1 text-base font-semibold text-on-surface">{RETIRO_DEMO.horaInicio}</dd>
            </div>
            <div className="rounded-lg bg-surface-container-low p-3">
              <dt className="text-xs font-medium text-on-surface-variant">Hora de finalización</dt>
              <dd className="mt-1 text-base font-semibold text-on-surface">{RETIRO_DEMO.horaFinalizacion}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </section>
  )
}
