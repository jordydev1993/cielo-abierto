import Link from 'next/link'
import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Variacion {
  valor: number
  // Período de comparación, por ejemplo "septiembre".
  vs: string
  // Si subir es bueno, malo o ninguna de las dos cosas: decide el color.
  sentido: 'subir-bueno' | 'subir-malo' | 'neutral'
}

export interface Stat {
  id: string
  label: string
  valor: number | string
  unidad?: string
  // Dato breve junto a la cifra (por ejemplo "1 crítica"); solo cuando aporta.
  insignia?: string
  variacion?: Variacion
  href?: string
}

// Variación contra el período anterior (prompts/054): diferencia absoluta con signo,
// flecha y texto; el color sale de si el cambio es bueno o malo, nunca solo de la dirección.
function LineaVariacion({ v }: { v: Variacion }) {
  const bueno = v.sentido === 'subir-bueno' ? v.valor > 0 : v.sentido === 'subir-malo' ? v.valor < 0 : null
  const color = v.valor === 0 || bueno === null ? 'text-on-surface-variant' : bueno ? 'text-exito' : 'text-error'
  const Flecha = v.valor > 0 ? ArrowUpRight : v.valor < 0 ? ArrowDownRight : ArrowRight
  const signo = v.valor > 0 ? '+' : v.valor < 0 ? '−' : ''
  const leido = v.valor === 0 ? `Sin cambios respecto de ${v.vs}` : `${v.valor > 0 ? 'Subió' : 'Bajó'} ${Math.abs(v.valor)} respecto de ${v.vs}`
  return (
    <p className="mt-1.5 flex items-center gap-1 text-caption">
      <span className={cn('inline-flex items-center gap-0.5 font-semibold', color)} aria-hidden="true">
        <Flecha className="h-3.5 w-3.5" />
        {signo}{Math.abs(v.valor)}
      </span>
      <span className="text-outline" aria-hidden="true">vs. {v.vs}</span>
      <span className="sr-only">{leido}</span>
    </p>
  )
}

// Fila de cifras sin tarjetas (prompts/052): separadas por aire, con unidad, insignia y,
// si la hay, la variación. Cifras proporcionales, como pide dataviz para números grandes.
export function StatRow({ stats }: { stats: Stat[] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-3 xl:grid-cols-6">
      {stats.map((s) => {
        const contenido = (
          <>
            <dt className="text-small text-on-surface-variant">{s.label}</dt>
            <dd className="mt-1.5">
              <span className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
                <span className="text-display font-semibold text-on-surface">{s.valor}</span>
                {s.unidad && <span className="text-small text-on-surface-variant">{s.unidad}</span>}
                {s.insignia && (
                  <span className="self-center rounded-md bg-ink px-1.5 py-0.5 text-caption font-medium text-white">{s.insignia}</span>
                )}
              </span>
              {s.variacion && <LineaVariacion v={s.variacion} />}
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
