import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TUTORES_AUTORIZADOS_DEMO } from './demo-data'

export function TutoresAutorizadosDemo() {
  return (
    <section aria-labelledby="tutores-autorizados-demo-title">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle id="tutores-autorizados-demo-title" className="text-base">
              Tutores con autorización vigente
            </CardTitle>
            <Badge variant="info">Datos de demostración</Badge>
          </div>
          <p className="text-sm text-on-surface-variant">
            Nombres, vínculos, estados, rangos de vigencia y restricciones ficticios; no representan autorizaciones reales ni reglas de negocio.
          </p>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {TUTORES_AUTORIZADOS_DEMO.map((tutor) => (
              <li key={tutor.id} className="rounded-lg border border-outline-variant p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-medium text-on-surface">{tutor.nombre}</h3>
                    <p className="mt-1 text-sm text-on-surface-variant">{tutor.vinculo}</p>
                  </div>
                  <Badge variant="success">{tutor.estadoAutorizacion}</Badge>
                </div>
                <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="font-medium text-on-surface-variant">Vigencia (ejemplo)</dt>
                    <dd className="mt-1 text-on-surface">{tutor.vigencia}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-on-surface-variant">Restricciones (ejemplo)</dt>
                    <dd className="mt-1 text-on-surface">
                      {tutor.restricciones || 'Sin restricción incluida en este ejemplo ficticio.'}
                    </dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </section>
  )
}
