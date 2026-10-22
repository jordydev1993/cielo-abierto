import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { KPICard } from '@/components/shared/KPICard'
import { AvisoDatosEjemplo } from '@/components/shared/AvisoDatosEjemplo'
import { Tendencia } from '@/components/charts/Tendencia'
import { BarraPorPartes } from '@/components/charts/BarraPorPartes'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AREAS, type AreaId } from '@/lib/navegacion'
import { cn } from '@/lib/utils'
import {
  agendaDeHoy, alertasPorPrioridad, alertasRecientes, nnyaActivosPorMes,
  retirosEnCurso, seguimientosPorVencer, type Prioridad,
} from '@/lib/mocks/inicio'

// Inicio (prompts/051): solo diseño, con los datos de ejemplo de lib/mocks/inicio.ts.
// No consulta la base; conectar datos reales es un plan aparte.

const area = (id: AreaId) => AREAS.find((a) => a.id === id)!

const PRIORIDADES: { id: Prioridad; etiqueta: string; fondo: string; tinta: string }[] = [
  { id: 'critica', etiqueta: 'Crítica', fondo: 'bg-prioridad-critica', tinta: 'text-white' },
  { id: 'alta', etiqueta: 'Alta', fondo: 'bg-prioridad-alta', tinta: 'text-white' },
  { id: 'media', etiqueta: 'Media', fondo: 'bg-prioridad-media', tinta: 'text-white' },
  { id: 'baja', etiqueta: 'Baja', fondo: 'bg-prioridad-baja', tinta: 'text-ink' },
]
const prioridad = (id: Prioridad) => PRIORIDADES.find((p) => p.id === id)!

function TituloSeccion({ id, children, href }: { id: AreaId; children: React.ReactNode; href: string }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="flex items-center gap-2 font-heading text-heading font-bold uppercase tracking-[0.12em] text-on-surface">
        <span className={cn('h-3 w-3', area(id).fondo)} aria-hidden="true" />
        {children}
      </h2>
      <Link href={href} className="inline-flex items-center gap-1 text-small font-semibold text-primary hover:underline">
        Ver todo <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </Link>
    </div>
  )
}

export default function DashboardPage() {
  const nnyaHoy = nnyaActivosPorMes[nnyaActivosPorMes.length - 1].valor
  const nnyaAntes = nnyaActivosPorMes[0].valor
  const alertasPendientes = Object.values(alertasPorPrioridad).reduce((s, n) => s + n, 0)

  return (
    <>
      <AvisoDatosEjemplo />
      <h1 className="sr-only">Inicio</h1>

      <div className="space-y-8 px-8 py-6">
        <section aria-label="Resumen" className="grid grid-cols-1 divide-y divide-outline-variant border-y border-outline-variant bg-surface-container-lowest md:grid-cols-2 md:divide-y-0 xl:grid-cols-4 xl:divide-x">
          <KPICard
            label="NNyA activos"
            value={nnyaHoy}
            area="bg-area-nucleo"
            href="/nnya"
            description={`${nnyaHoy - nnyaAntes > 0 ? '+' : ''}${nnyaHoy - nnyaAntes} desde mayo`}
          >
            <Tendencia datos={nnyaActivosPorMes} color="var(--color-area-nucleo)" medida="NNyA activos" />
          </KPICard>
          <KPICard label="Alertas pendientes" value={alertasPendientes} area="bg-area-seguimiento" href="/alertas">
            <BarraPorPartes
              medida="Alertas pendientes por prioridad"
              partes={PRIORIDADES.map((p) => ({ ...p, valor: alertasPorPrioridad[p.id] }))}
            />
          </KPICard>
          <KPICard label="Retiros en curso" value={retirosEnCurso} area="bg-area-tutela" href="/retiros" description="1 en revisión de Dirección" />
          <KPICard
            label="Post-egreso"
            value={seguimientosPorVencer}
            area="bg-area-institucional"
            href="/seguimiento-post-egreso"
            description="Contactos que vencen esta semana"
          />
        </section>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-12 xl:gap-6">
          <section className="xl:col-span-7" aria-labelledby="agenda">
            <TituloSeccion id="nucleo" href="/turnos"><span id="agenda">Agenda de hoy</span></TituloSeccion>
            <div className="bg-surface-container-lowest">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-20">Hora</TableHead>
                    <TableHead>Qué</TableHead>
                    <TableHead>NNyA</TableHead>
                    <TableHead className="w-40">Área</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agendaDeHoy.map((e) => (
                    <TableRow key={`${e.hora}-${e.que}`} className={cn(e.cumplido && 'text-on-surface-variant')}>
                      <TableCell className="font-heading text-body font-bold">{e.hora}</TableCell>
                      <TableCell>
                        <Link href={e.href} className="hover:underline">{e.que}</Link>
                        {e.cumplido && <span className="ml-2 text-small">· Cumplido</span>}
                      </TableCell>
                      <TableCell>{e.nnya}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-2 text-small">
                          <span className={cn('h-2.5 w-2.5 shrink-0', area(e.area).fondo, e.cumplido && 'opacity-40')} aria-hidden="true" />
                          {area(e.area).nombre}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>

          <section className="xl:col-span-5" aria-labelledby="alertas">
            <TituloSeccion id="seguimiento" href="/alertas"><span id="alertas">Alertas</span></TituloSeccion>
            <ul className="divide-y divide-outline-variant border-t border-ink bg-surface-container-lowest">
              {alertasRecientes.map((a) => {
                const p = prioridad(a.prioridad)
                return (
                  <li key={a.titulo} className={cn('flex items-start gap-3 px-4 py-3', a.nueva && 'bg-tertiary-fixed/60')}>
                    <span className={cn('mt-1.5 h-2.5 w-2.5 shrink-0', p.fondo)} aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 font-semibold">
                        {a.titulo}
                        {a.nueva && <Badge variant="warning">Nueva</Badge>}
                      </div>
                      <p className="text-small text-on-surface-variant">{a.detalle}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-heading text-[11px] font-bold uppercase tracking-[0.08em] text-on-surface">{p.etiqueta}</p>
                      <p className="text-small text-on-surface-variant">{a.cuando}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>
        </div>
      </div>
    </>
  )
}
