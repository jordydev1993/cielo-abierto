import Link from 'next/link'

export interface Stat {
  id: string
  label: string
  valor: number | string
  unidad?: string
  // Dato breve junto a la cifra (por ejemplo "1 crítica"); solo cuando aporta.
  insignia?: string
  href?: string
}

// Fila de cifras sin tarjetas (prompts/052): separadas por aire, con unidad e insignia.
// Cifras proporcionales, como pide dataviz para números grandes sueltos.
export function StatRow({ stats }: { stats: Stat[] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-3 xl:grid-cols-6">
      {stats.map((s) => {
        const contenido = (
          <>
            <dt className="text-small text-on-surface-variant">{s.label}</dt>
            <dd className="mt-1.5 flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
              <span className="text-display font-semibold text-on-surface">{s.valor}</span>
              {s.unidad && <span className="text-small text-on-surface-variant">{s.unidad}</span>}
              {s.insignia && (
                <span className="self-center rounded-md bg-ink px-1.5 py-0.5 text-caption font-medium text-white">{s.insignia}</span>
              )}
            </dd>
          </>
        )
        return s.href ? (
          <Link key={s.id} href={s.href} className="-m-2 rounded-lg p-2 transition-colors hover:bg-surface-container-low focus-visible:outline-2">
            {contenido}
          </Link>
        ) : (
          <div key={s.id}>{contenido}</div>
        )
      })}
    </dl>
  )
}
