'use client'

import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

interface GraficoBarrasProps {
  datos: { etiqueta: string; valor: number }[]
  color: string
  unidad: string
  descripcion: string
}

// Barras horizontales de una sola serie (prompts/052, skill dataviz): magnitudes por
// categoría con nombres largos, ordenadas de mayor a menor, con el valor en la punta.
// Barras de hasta 24 px, punta redondeada de 4 px y base recta.
export function GraficoBarras({ datos, color, unidad, descripcion }: GraficoBarrasProps) {
  const ordenados = [...datos].sort((a, b) => b.valor - a.valor)
  return (
    <figure className="m-0">
      <div style={{ height: ordenados.length * 32 + 8 }} aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={ordenados} layout="vertical" margin={{ top: 0, right: 28, bottom: 0, left: 0 }} barCategoryGap={8}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="etiqueta"
              tickLine={false}
              axisLine={false}
              width={112}
              tick={{ fontSize: 13, fill: 'var(--color-on-surface-variant)' }}
            />
            <Tooltip
              cursor={{ fill: 'var(--color-surface-container-low)' }}
              formatter={(v) => [`${v} ${unidad}`, '']}
              separator=""
              contentStyle={{ borderRadius: 8, border: '1px solid var(--color-outline-variant)', fontSize: 13 }}
            />
            <Bar dataKey="valor" fill={color} maxBarSize={16} radius={[0, 4, 4, 0]} isAnimationActive={false}>
              <LabelList dataKey="valor" position="right" style={{ fontSize: 12, fill: 'var(--color-on-surface)' }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="sr-only">
        {descripcion}: {ordenados.map((d) => `${d.etiqueta} ${d.valor}`).join(', ')}.
      </figcaption>
    </figure>
  )
}
