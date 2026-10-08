import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EstadoVerificacionBadge } from '@/components/entities/retiros/EstadoVerificacionBadge'
import { RetiroDemo } from '@/components/entities/retiros/RetiroDemo'
import { TutoresAutorizadosDemo } from '@/components/entities/retiros/TutoresAutorizadosDemo'
import {
  ESTADOS_VERIFICACION_DEMO,
  ESTADO_VERIFICACION_PRESENTACION,
} from '@/components/entities/retiros/demo-data'

export default function RetirosDemoPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-xl font-semibold text-on-surface">
            Demostración visual de retiro
          </h1>
          <Badge variant="info">Datos de demostración</Badge>
        </div>
        <p className="max-w-2xl text-sm text-on-surface-variant">
          Prototipo con información completamente ficticia. No realiza verificaciones de identidad,
          no consulta datos reales y no registra retiros.
        </p>
      </header>

      <TutoresAutorizadosDemo />
      <RetiroDemo />

      <section aria-labelledby="estados-verificacion-demo-title">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle id="estados-verificacion-demo-title" className="text-base">
                Estados de verificación (presentación demo)
              </CardTitle>
              <Badge variant="info">Datos de demostración</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {ESTADOS_VERIFICACION_DEMO.map((estado) => (
                <li key={estado} className="rounded-lg border border-outline-variant p-4">
                  <EstadoVerificacionBadge estado={estado} />
                  <p className="mt-2 text-sm text-on-surface-variant">
                    {ESTADO_VERIFICACION_PRESENTACION[estado].descripcion}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
