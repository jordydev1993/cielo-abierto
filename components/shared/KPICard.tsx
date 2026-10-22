import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface KPICardProps {
  label: string
  value: number | string
  // Clase de fondo del área del dato (por ejemplo `bg-area-nucleo`).
  area: string
  href: string
  description?: string
  // Gráfico opcional, solo cuando responde una pregunta (ver prompts/051, Gráficos).
  children?: React.ReactNode
}

// Panel de área (prompts/051): se usa en fila, separado de sus vecinos por filetes de 1 px.
// La cifra va en Overpass con cifras proporcionales; el cuadrado de color dice de qué área es.
export function KPICard({ label, value, area, href, description, children }: KPICardProps) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-surface-container-low focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
    >
      <p className="flex items-center gap-2 font-heading text-heading font-bold uppercase tracking-[0.1em] text-on-surface-variant">
        <span className={cn('h-3 w-3 shrink-0', area)} aria-hidden="true" />
        {label}
      </p>
      <p className="font-heading text-display font-extrabold text-on-surface">{value}</p>
      {children}
      {description && <p className="text-small text-on-surface-variant">{description}</p>}
    </Link>
  )
}
