'use client'
import type { AgregadosSenaf } from '@/lib/reportes/senaf'

// Los números calculados por la base, al lado del texto, para controlar cada cifra.
function Fila({ label, valor }: { label: string; valor: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3 py-1 text-sm">
      <span className="text-on-surface-variant">{label}</span>
      <span className="font-medium tabular-nums text-on-surface">{valor}</span>
    </div>
  )
}

function Desglose({ conteos }: { conteos: Partial<Record<string, number>> }) {
  const entradas = Object.entries(conteos).filter(([, n]) => (n ?? 0) > 0)
  if (entradas.length === 0) return null
  return (
    <div className="pl-3 border-l border-outline-variant">
      {entradas.map(([k, n]) => (
        <Fila key={k} label={k.replace('_', ' ')} valor={n} />
      ))}
    </div>
  )
}

function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="space-y-0.5 pb-2">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant pt-3">{titulo}</h4>
      {children}
    </div>
  )
}

export function DatosReferencia({ datos }: { datos: AgregadosSenaf }) {
  const {
    poblacion,
    movimientos,
    audiencias,
    incidentes,
    intervenciones,
    evaluacion_institucional: ev,
    seguimiento_post_egreso: seg,
  } = datos

  return (
    <div className="divide-y divide-outline-variant/50">
      <Grupo titulo="Población">
        <Fila label="Alojados al cierre" valor={poblacion.alojados_al_cierre} />
        <Desglose conteos={poblacion.por_genero} />
        <Desglose conteos={poblacion.por_franja_edad} />
      </Grupo>
      <Grupo titulo="Movimientos">
        <Fila label="Ingresos" valor={movimientos.ingresos} />
        <Fila label="Egresos" valor={movimientos.egresos} />
      </Grupo>
      <Grupo titulo="Audiencias">
        <Fila label="Total" valor={audiencias.total} />
        <Desglose conteos={audiencias.por_estado} />
      </Grupo>
      <Grupo titulo="Incidentes">
        <Fila label="Total" valor={incidentes.total} />
        <Desglose conteos={incidentes.por_gravedad} />
      </Grupo>
      <Grupo titulo="Intervenciones">
        <Fila label="Total" valor={intervenciones.total} />
        <Desglose conteos={intervenciones.por_estado} />
      </Grupo>
      <Grupo titulo="Evaluación institucional">
        <Fila label="Estado" valor={ev.estado ?? 'Sin registrar'} />
        <Desglose conteos={ev.propuestas_del_mes_por_estado} />
        <Fila label="Propuestas pendientes" valor={ev.propuestas_pendientes_totales} />
      </Grupo>
      <Grupo titulo="Seguimiento post-egreso">
        <Fila label="Programados" valor={seg.programados} />
        <Fila label="Realizados" valor={seg.realizados} />
        <Fila label="Efectivos" valor={seg.efectivos} />
        <Fila label="Requieren intervención" valor={seg.requieren_intervencion} />
        <Fila label="Indicador promedio" valor={seg.indicador_reinsercion_promedio ?? '—'} />
      </Grupo>
    </div>
  )
}
