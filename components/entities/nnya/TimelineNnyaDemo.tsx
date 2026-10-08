import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EVENTOS_TIMELINE_DEMO } from './timeline-demo-data'

export function TimelineNnyaDemo() {
  return (
    <section aria-labelledby="timeline-demo-title">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle id="timeline-demo-title" className="text-base">
              Timeline de NNyA
            </CardTitle>
            <Badge variant="info">Datos de demostración</Badge>
          </div>
          <p className="text-sm text-on-surface-variant">
            Demostración — datos ficticios; no representa el historial real de este NNyA.
          </p>
        </CardHeader>
        <CardContent>
          <ol className="space-y-4">
            {EVENTOS_TIMELINE_DEMO.map((evento) => (
              <li key={evento.id} className="grid grid-cols-[1rem_minmax(0,1fr)] gap-3">
                <span
                  aria-hidden="true"
                  className="mt-1.5 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-primary-container"
                />
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <time
                      dateTime={evento.fecha}
                      className="text-xs font-medium text-on-surface-variant"
                    >
                      {evento.fecha.split('-').reverse().join('/')}
                    </time>
                    <Badge variant="secondary">{evento.categoria}</Badge>
                  </div>
                  <p className="text-sm text-on-surface">{evento.descripcion}</p>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </section>
  )
}
