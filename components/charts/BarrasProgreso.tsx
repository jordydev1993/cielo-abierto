interface BarrasProgresoProps {
  datos: { etiqueta: string; valor: number }[]
  // Clase de fondo del relleno (token de serie).
  relleno: string
  descripcion: string
}

// Barras de progreso horizontales (prompts/052): la parte de cada categoría sobre el total,
// con el porcentaje escrito; el riel es un paso más claro del mismo gris.
export function BarrasProgreso({ datos, relleno, descripcion }: BarrasProgresoProps) {
  const total = datos.reduce((s, d) => s + d.valor, 0)
  if (total === 0) return null
  return (
    <ul className="space-y-3.5" aria-label={descripcion}>
      {datos.map((d) => {
        const pct = Math.round((d.valor / total) * 100)
        return (
          <li key={d.etiqueta}>
            <div className="mb-1.5 flex items-baseline justify-between text-small">
              <span className="text-on-surface-variant">{d.etiqueta}</span>
              <span className="font-medium tabular-nums text-on-surface">{pct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-surface-container" aria-hidden="true">
              <div className={`h-full rounded-full ${relleno}`} style={{ width: `${pct}%` }} />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
