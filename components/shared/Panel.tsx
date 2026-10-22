import * as React from 'react'
import { Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PanelProps {
  title: string
  // Ayuda corta sobre qué muestra el panel (se ve al pasar el mouse por el ícono).
  hint?: string
  // Control a la derecha del título (por ejemplo, un selector de período).
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}

// Bloque de contenido con título (prompts/052): sin tarjeta ni sombra; lo separan los
// filetes de la grilla en la que se ubica.
export function Panel({ title, hint, action, children, className }: PanelProps) {
  return (
    <section className={cn('min-w-0', className)} aria-label={title}>
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-heading font-semibold text-on-surface">{title}</h2>
        {hint && (
          <span title={hint} className="text-outline">
            <Info className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="sr-only">{hint}</span>
          </span>
        )}
        {action && <div className="ml-auto">{action}</div>}
      </div>
      {children}
    </section>
  )
}

// Control segmentado (por ejemplo "6 meses / 1 año / 2 años").
export function Segmentado<T extends string>({
  opciones, valor, onChange, etiqueta,
}: {
  opciones: { id: T; label: string }[]
  valor: T
  onChange: (v: T) => void
  etiqueta: string
}) {
  return (
    <div role="radiogroup" aria-label={etiqueta} className="inline-flex rounded-md border border-outline-variant p-0.5">
      {opciones.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={valor === o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            'rounded px-2.5 py-1 text-caption font-medium transition-colors focus-visible:outline-2',
            valor === o.id ? 'bg-surface-container text-on-surface' : 'text-outline hover:text-on-surface'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
