'use client'

import {
  CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
  type TooltipContentProps,
} from 'recharts'

export interface Serie {
  key: string
  label: string
  // Token de color de la serie (por ejemplo `var(--color-serie-1)`), en orden fijo.
  color: string
}

interface GraficoLineasProps<T extends object> {
  datos: T[]
  ejeX: keyof T & string
  series: Serie[]
  unidad: string
  alto?: number
  // Descripción accesible: qué muestra el gráfico.
  descripcion: string
}

function Contenido({ active, payload, label }: TooltipContentProps<number, string>) {
  if (!active || !payload?.length) return null
  return (
    <div className="min-w-40 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 shadow-lg shadow-ink/10">
      <p className="mb-1.5 text-small font-semibold text-on-surface">{label}</p>
      {payload.map((p) => (
        <p key={String(p.dataKey)} className="flex items-center gap-2 text-small text-on-surface-variant">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} aria-hidden="true" />
          {p.name}
          <span className="ml-auto pl-4 font-medium tabular-nums text-on-surface">{p.value}</span>
        </p>
      ))}
    </div>
  )
}

// Líneas en un solo eje (prompts/052, skill dataviz): una sola medida, nunca dos escalas.
// Leyenda arriba, guía vertical con tooltip, último punto marcado y tabla oculta para
// lectores de pantalla.
export function GraficoLineas<T extends object>({
  datos, ejeX, series, unidad, alto = 260, descripcion,
}: GraficoLineasProps<T>) {
  const ultimo = datos.length - 1
  return (
    <figure className="m-0">
      <figcaption className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-small text-on-surface-variant">
        {series.length > 1 && series.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} aria-hidden="true" />
            {s.label}
          </span>
        ))}
        <span className="ml-auto text-caption text-outline">{unidad}</span>
      </figcaption>
      <div style={{ height: alto }} aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={datos} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
            <CartesianGrid vertical={false} stroke="var(--color-filete)" />
            <XAxis
              dataKey={ejeX as string}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              minTickGap={24}
              tick={{ fontSize: 12, fill: 'var(--color-outline)' }}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              width={44}
              tick={{ fontSize: 12, fill: 'var(--color-outline)' }}
            />
            <Tooltip
              cursor={{ stroke: 'var(--color-outline)', strokeWidth: 1 }}
              content={(props) => <Contenido {...(props as TooltipContentProps<number, string>)} />}
            />
            {series.map((s) => (
              <Line
                key={s.key}
                type="linear"
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                isAnimationActive={false}
                dot={(props) => {
                  const { cx, cy, index } = props as { cx: number; cy: number; index: number }
                  if (index !== ultimo) return <g key={index} />
                  return <circle key={index} cx={cx} cy={cy} r={4} fill={s.color} stroke="var(--color-surface-container-lowest)" strokeWidth={2} />
                }}
                activeDot={{ r: 5, fill: s.color, stroke: 'var(--color-surface-container-lowest)', strokeWidth: 2 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <table className="sr-only">
        <caption>{descripcion}</caption>
        <thead>
          <tr><th>{String(ejeX)}</th>{series.map((s) => <th key={s.key}>{s.label}</th>)}</tr>
        </thead>
        <tbody>
          {datos.map((d, i) => (
            <tr key={i}><td>{String(d[ejeX])}</td>{series.map((s) => <td key={s.key}>{String((d as Record<string, unknown>)[s.key])}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
