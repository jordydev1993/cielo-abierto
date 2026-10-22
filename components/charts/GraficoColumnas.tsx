'use client'

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Serie } from './GraficoLineas'

interface GraficoColumnasProps<T extends object> {
  datos: T[]
  ejeX: keyof T & string
  series: Serie[]
  unidad: string
  alto?: number
  descripcion: string
}

// Columnas agrupadas en el tiempo (prompts/052, skill dataviz): conteos chicos por mes que,
// en el mismo eje que una cantidad grande, quedarían aplastados contra el piso. Columnas de
// hasta 24 px con 2 px de aire entre vecinas; leyenda siempre presente.
export function GraficoColumnas<T extends object>({
  datos, ejeX, series, unidad, alto = 140, descripcion,
}: GraficoColumnasProps<T>) {
  return (
    <figure className="m-0">
      <figcaption className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-small text-on-surface-variant">
        {series.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: s.color }} aria-hidden="true" />
            {s.label}
          </span>
        ))}
        <span className="ml-auto text-caption text-outline">{unidad}</span>
      </figcaption>
      <div style={{ height: alto }} aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={datos} margin={{ top: 4, right: 12, bottom: 0, left: -12 }} barGap={2}>
            <CartesianGrid vertical={false} stroke="var(--color-filete)" />
            <XAxis
              dataKey={ejeX as string}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              minTickGap={24}
              tick={{ fontSize: 12, fill: 'var(--color-outline)' }}
            />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={44} tick={{ fontSize: 12, fill: 'var(--color-outline)' }} />
            <Tooltip
              cursor={{ fill: 'var(--color-surface-container-low)' }}
              contentStyle={{ borderRadius: 8, border: '1px solid var(--color-outline-variant)', fontSize: 13 }}
            />
            {series.map((s) => (
              <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} maxBarSize={12} radius={[3, 3, 0, 0]} isAnimationActive={false} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="sr-only">{descripcion}.</p>
    </figure>
  )
}
