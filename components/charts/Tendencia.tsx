'use client'

import { Line, LineChart, ResponsiveContainer, Tooltip, YAxis } from 'recharts'

interface TendenciaProps {
  datos: { mes: string; valor: number }[]
  // Color de la serie (token del área del dato).
  color: string
  // Qué se mide, para el texto accesible y el tooltip.
  medida: string
}

// Línea mínima de tendencia (prompts/051, skill dataviz): una cantidad en el tiempo, donde
// importa la dirección más que cada valor. Línea de 2 px, último punto marcado con anillo
// del color de la superficie; los valores quedan en texto para lectores de pantalla.
export function Tendencia({ datos, color, medida }: TendenciaProps) {
  const ultimo = datos.length - 1
  return (
    <figure className="m-0">
      <div className="h-10 w-full" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={datos} margin={{ top: 6, right: 6, bottom: 6, left: 6 }}>
            <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
            <Tooltip
              cursor={{ stroke: 'var(--color-outline-variant)', strokeWidth: 1 }}
              contentStyle={{
                border: '1px solid var(--color-outline-variant)',
                borderRadius: 2,
                fontSize: 13,
                padding: '4px 8px',
              }}
              labelFormatter={(_, payload) => payload?.[0]?.payload?.mes ?? ''}
              formatter={(v) => [v, medida]}
            />
            <Line
              type="linear"
              dataKey="valor"
              stroke={color}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              isAnimationActive={false}
              dot={(props) => {
                const { cx, cy, index } = props as { cx: number; cy: number; index: number }
                if (index !== ultimo) return <g key={index} />
                return <circle key={index} cx={cx} cy={cy} r={4} fill={color} stroke="var(--color-surface-container-lowest)" strokeWidth={2} />
              }}
              activeDot={{ r: 4, fill: color, stroke: 'var(--color-surface-container-lowest)', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="sr-only">
        {medida} por mes: {datos.map((d) => `${d.mes} ${d.valor}`).join(', ')}.
      </figcaption>
    </figure>
  )
}
