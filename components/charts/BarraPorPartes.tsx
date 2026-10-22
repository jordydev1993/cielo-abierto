interface Parte {
  id: string
  etiqueta: string
  valor: number
  // Clase de fondo del tramo (token de la rampa).
  fondo: string
  // Texto del número dentro del tramo: blanco o tinta según el fondo.
  tinta: string
}

interface BarraPorPartesProps {
  partes: Parte[]
  medida: string
}

// Barra única apilada (prompts/051, skill dataviz): partes de un total con un orden propio,
// por ejemplo alertas por prioridad. Tramos de 2 px de separación, el número dentro del
// tramo cuando entra, y la leyenda siempre presente: el color nunca es el único canal.
export function BarraPorPartes({ partes, medida }: BarraPorPartesProps) {
  const total = partes.reduce((s, p) => s + p.valor, 0)
  if (total === 0) return null

  return (
    <figure className="m-0 space-y-2">
      <div className="flex h-5 w-full gap-[2px]" role="img" aria-label={`${medida}: ${partes.map((p) => `${p.etiqueta} ${p.valor}`).join(', ')}`}>
        {partes.filter((p) => p.valor > 0).map((p) => (
          <div
            key={p.id}
            title={`${p.etiqueta}: ${p.valor}`}
            className={`${p.fondo} ${p.tinta} flex items-center justify-center font-heading text-[11px] font-bold first:rounded-l-[2px] last:rounded-r-[2px]`}
            style={{ flexGrow: p.valor, flexBasis: 0 }}
          >
            {p.valor}
          </div>
        ))}
      </div>
      <figcaption className="flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-on-surface-variant">
        {partes.map((p) => (
          <span key={p.id} className="inline-flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 ${p.fondo}`} aria-hidden="true" />
            {p.etiqueta} {p.valor}
          </span>
        ))}
      </figcaption>
    </figure>
  )
}
