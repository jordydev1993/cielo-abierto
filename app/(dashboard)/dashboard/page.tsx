'use client'

import { useState } from 'react'
import { AvisoDatosEjemplo } from '@/components/shared/AvisoDatosEjemplo'
import { StatRow } from '@/components/shared/KPICard'
import { Page, PageHeader } from '@/components/shared/PageHeader'
import { Panel, Segmentado } from '@/components/shared/Panel'
import { GraficoLineas } from '@/components/charts/GraficoLineas'
import { GraficoBarras } from '@/components/charts/GraficoBarras'
import { GraficoColumnas } from '@/components/charts/GraficoColumnas'
import { BarrasProgreso } from '@/components/charts/BarrasProgreso'
import { AgendaTarjetas } from '@/components/shared/AgendaTarjetas'
import {
  alertasPorTipo, eventosProximos, cifras, intervencionesPorArea, poblacionPorMes, postEgresoPorMes,
} from '@/lib/mocks/inicio'

// Inicio (prompts/052): solo diseño, con los datos de ejemplo de lib/mocks/inicio.ts.
// No consulta la base; conectar datos reales es un plan aparte.

type Periodo = '6m' | '1a' | '2a'
const PERIODOS: { id: Periodo; label: string; meses: number }[] = [
  { id: '6m', label: '6 meses', meses: 6 },
  { id: '1a', label: '1 año', meses: 12 },
  { id: '2a', label: '2 años', meses: 24 },
]

export default function DashboardPage() {
  const [periodo, setPeriodo] = useState<Periodo>('1a')
  const meses = PERIODOS.find((p) => p.id === periodo)!.meses
  const poblacion = poblacionPorMes.slice(-meses)

  return (
    <Page>
      <PageHeader title="Inicio" description="Resumen de la residencia." />
      <AvisoDatosEjemplo />

      <div className="border-b border-filete pb-6">
        <StatRow stats={cifras} />
      </div>

      <div className="border-b border-filete pb-6">
        <Panel
          title="Población de la residencia"
          hint="NNyA activos a fin de cada mes y, debajo, los ingresos y egresos del mes."
          action={<Segmentado etiqueta="Período" opciones={PERIODOS} valor={periodo} onChange={setPeriodo} />}
        >
          <GraficoLineas
            datos={poblacion}
            ejeX="mes"
            unidad="NNyA"
            alto={220}
            descripcion="NNyA activos a fin de cada mes"
            series={[{ key: 'activos', label: 'NNyA activos', color: 'var(--color-serie-1)' }]}
          />
          {/* Ingresos y egresos van aparte: en el eje de los activos quedarían aplastados. */}
          <div className="mt-5">
            <GraficoColumnas
              datos={poblacion}
              ejeX="mes"
              unidad="personas por mes"
              descripcion="Ingresos y egresos por mes"
              series={[
                { key: 'ingresos', label: 'Ingresos', color: 'var(--color-serie-2)' },
                { key: 'egresos', label: 'Egresos', color: 'var(--color-serie-3)' },
              ]}
            />
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 divide-y divide-filete border-b border-filete lg:grid-cols-3 lg:divide-x lg:divide-y-0">
        <Panel title="Alertas por tipo" hint="Alertas de los últimos 6 meses, de mayor a menor." className="pb-6 lg:pr-6">
          <GraficoBarras
            datos={alertasPorTipo.map((a) => ({ etiqueta: a.tipo, valor: a.cantidad }))}
            color="var(--color-serie-1)"
            unidad="alertas"
            descripcion="Alertas por tipo en los últimos 6 meses"
          />
        </Panel>
        <Panel title="Contactos post-egreso" hint="Contactos programados y realizados por mes." className="py-6 lg:px-6 lg:py-0 lg:pb-6">
          <GraficoLineas
            datos={postEgresoPorMes}
            ejeX="mes"
            unidad="contactos"
            alto={176}
            descripcion="Contactos post-egreso programados y realizados por mes"
            series={[
              { key: 'programados', label: 'Programados', color: 'var(--color-serie-contexto)' },
              { key: 'realizados', label: 'Realizados', color: 'var(--color-serie-3)' },
            ]}
          />
        </Panel>
        <Panel title="Intervenciones por área" hint="Parte de cada área sobre el total de intervenciones del año." className="pt-6 lg:pl-6 lg:pt-0 lg:pb-6">
          <BarrasProgreso
            datos={intervencionesPorArea.map((i) => ({ etiqueta: i.area, valor: i.cantidad }))}
            relleno="bg-serie-1"
            descripcion="Intervenciones por área"
          />
        </Panel>
      </div>

      <Panel title="Próximos eventos" hint="Turnos, audiencias, retiros y contactos de los próximos días.">
        <AgendaTarjetas eventos={eventosProximos} />
      </Panel>
    </Page>
  )
}
